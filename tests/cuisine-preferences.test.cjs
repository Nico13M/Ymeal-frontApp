const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/load-typescript.cjs");
const prefs = load("src/lib/cuisine-preferences.ts");
const options = [{ id: 3, name: "Française" }, { id: 1, name: "Italienne" }, { id: 17, name: "Thaïlandaise" }];

test("empty cuisine choices mean unrestricted cuisines", () => {
  assert.deepEqual(prefs.getCuisinePreference([]), { mode: "all", cuisines: [] });
  assert.deepEqual(prefs.buildCuisinePayload([]), { cuisine_ids: [] });
  assert.deepEqual(prefs.resolveCuisineOptionIds([], options), []);
});

test("API names, IDs and order remain raw, without aliases or frontend categories", () => {
  const raw = [{ id: 3, name: "Cuisine française" }, { id: 9, name: "French" }, { id: 17, name: "Thai" }, { id: 18, name: "  Libanaise  " }];
  assert.deepEqual(prefs.parseCuisineReferences(raw), raw);
  assert.deepEqual(prefs.resolveCuisineOptionIds(["French", "Thai"], raw), [9, 17]);
  assert.throws(() => prefs.resolveCuisineOptionIds(["Française"], raw));
});

test("future backend cuisines, including unknown categories, remain selectable", () => {
  const result = prefs.parseCuisineReferences([...options, { id: 500, name: "Créole" }]);
  assert.equal(result.length, options.length + 1);
  assert.deepEqual(result.at(-1), { id: 500, name: "Créole" });
  assert.equal(prefs.resolveCuisineOptionIds(["Créole"], result)[0], 500);
});

test("a catalog of five server cuisines stays at five, and an empty catalog stays empty", () => {
  const api = [{ id: 3, name: "Française" }, { id: 5, name: "Indienne" }, { id: 1, name: "Italienne" }, { id: 2, name: "Japonaise" }, { id: 4, name: "Mexicaine" }];
  assert.deepEqual(prefs.parseCuisineReferences(api), api);
  assert.deepEqual(prefs.parseCuisineReferences([]), []);
  assert.throws(() => prefs.resolveCuisineOptionIds(["Méditerranéenne"], api));
});

test("distinct server records are not merged based on their names", () => {
  const raw = [{ id: 42, name: "Mediterranean" }, { id: 43, name: "Méditerranéenne" }, { id: 44, name: "Mediterranean" }];
  assert.deepEqual(prefs.parseCuisineReferences(raw), raw);
});

test("search ignores case and accents and restores the full list when cleared", () => {
  assert.deepEqual(prefs.filterCuisines(options, "FRANCAISE"), [options[0]]);
  assert.deepEqual(prefs.filterCuisines(options, "thai"), [options[2]]);
  assert.deepEqual(prefs.filterCuisines(options, "inconnue"), []);
  assert.deepEqual(prefs.filterCuisines(options, ""), options);
});

test("filtering never changes selections, and deselecting the last choice restores unrestricted mode", () => {
  const selected = prefs.toggleCuisinePreference([], "Thaïlandaise", 6);
  prefs.filterCuisines(options, "Française");
  assert.deepEqual(selected, ["Thaïlandaise"]);
  assert.deepEqual(prefs.resolveCuisineOptionIds(selected, options), [17]);
  assert.equal(prefs.getCuisinePreference(prefs.toggleCuisinePreference(selected, "Thaïlandaise", 6)).mode, "all");
});

test("the existing selection limit still permits deselecting an option at the limit", () => {
  assert.deepEqual(prefs.toggleCuisinePreference(["Française"], "Italienne", 1), ["Française"]);
  assert.deepEqual(prefs.toggleCuisinePreference(["Cuisine française"], "Cuisine française", 1), []);
});

test("invalid IDs, missing categories and failed retrieval cannot silently become unrestricted", () => {
  assert.throws(() => prefs.buildCuisinePayload([0]));
  assert.throws(() => prefs.resolveCuisineOptionIds(["Chinoise"], options));
  assert.throws(() => prefs.buildCuisinePayload(["local:mediterraneenne"]));
  assert.throws(() => prefs.parseCuisineReferences({ error: "Unavailable" }));
  assert.throws(() => prefs.parseCuisineReferences([{ id: -1, name: "French" }]));
});

test("recommendation prompts explicitly allow all cuisines or the selected cuisines and preserve the request", () => {
  const request = { contexte_personnel: "Budget : 20 €", nombre_personne: 2, ingredients_interdits: ["ail"] };
  const all = prefs.withCuisinePreferences(request, []);
  assert.match(all.contexte_personnel, /toutes les cuisines sont autorisées/);
  const selected = prefs.withCuisinePreferences(request, ["French", "Thaïlandaise"]);
  assert.match(selected.contexte_personnel, /French, Thaïlandaise/);
  assert.match(selected.contexte_personnel, /l’une de ces cuisines/);
  assert.equal(selected.nombre_personne, 2);
  assert.deepEqual(selected.ingredients_interdits, ["ail"]);
  assert.equal(request.contexte_personnel, "Budget : 20 €");
});
