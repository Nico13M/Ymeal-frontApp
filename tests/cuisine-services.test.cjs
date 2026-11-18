const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/load-typescript.cjs");

function profileService({ saved = [], failPost = false, failReference = false, reference } = {}) {
  const calls = [];
  const catalog = reference ?? [{ id: 3, name: "Française" }, { id: 5, name: "Indienne" }, { id: 1, name: "Italienne" }, { id: 2, name: "Japonaise" }, { id: 4, name: "Mexicaine" }];
  let serverSaved = saved;
  const storage = new Map([["profileConfig", JSON.stringify({ location: "Lyon", cuisines: ["Italienne"], avoidVeg: ["ail"] })]]);
  const service = load("src/services/profile.ts", {
    "@/src/lib/api": { apiRequest: async (path, options) => {
      calls.push({ path, options });
      if (options.method === "POST") {
        if (failPost) throw new Error("Save failed");
        if (path.endsWith("favorite-cuisines")) serverSaved = catalog.filter((item) => options.body.cuisine_ids.includes(item.id));
        return { success: true };
      }
      if (path === "/admin/reference/favorite-cuisines") {
        if (failReference) throw new Error("Catalog unavailable");
        return catalog;
      }
      if (path.endsWith("favorite-cuisines")) return serverSaved;
      if (path.endsWith("person-count")) return { count: null };
      if (path.endsWith("budget")) return null;
      return [];
    } },
    "./auth": {
      getSession: async () => ({ token: "test-token", user: { id: 12345 } }),
      getCsrfToken: async () => "test-csrf",
    },
    "@react-native-async-storage/async-storage": {
      getItem: async (key) => storage.get(key) ?? null,
      setItem: async (key, value) => { storage.set(key, value); },
    },
  });
  return { service, calls, storage };
}

test("clearing cuisines sends an explicit authenticated empty array and clears the stale local preference", async () => {
  const { service, calls, storage } = profileService();
  storage.set("profileConfig", JSON.stringify({ location: "Lyon", cuisines: ["Méditerranéenne"], localCuisines: ["Méditerranéenne"], avoidVeg: ["ail"] }));
  await service.saveUserCuisines([], []);
  assert.deepEqual(calls[0].options.body, { cuisine_ids: [] });
  assert.equal(calls[0].options.headers["X-CSRF-TOKEN"], "test-csrf");
  assert.equal(calls[0].options.token, "test-token");
  assert.deepEqual(JSON.parse(storage.get("profileConfig")), { location: "Lyon", cuisines: [], avoidVeg: ["ail"] });
});

test("saving selected cuisines keeps real IDs and their original API names", async () => {
  const { service, calls, storage } = profileService();
  await service.saveUserCuisines([3, 1], [{ id: 3, name: "French" }, { id: 1, name: "Italienne" }]);
  assert.deepEqual(calls[0].options.body, { cuisine_ids: [3, 1] });
  assert.deepEqual(JSON.parse(storage.get("profileConfig")).cuisines, ["French", "Italienne"]);
});

test("a failed save preserves the last known local cuisines", async () => {
  const { service, storage } = profileService({ failPost: true });
  await assert.rejects(service.saveUserCuisines([], []), /Save failed/);
  assert.deepEqual(JSON.parse(storage.get("profileConfig")).cuisines, ["Italienne"]);
});

test("startup reads a server's explicit empty selection rather than reviving stale cached cuisines", async () => {
  const { service } = profileService({ saved: [] });
  assert.deepEqual(await service.getUserCuisines(), []);
  assert.deepEqual((await service.getProfileRequest()).cuisines, []);
});

test("invalid preference responses are errors and not an unrestricted default", async () => {
  const { service } = profileService({ saved: { error: "Unavailable" } });
  await assert.rejects(service.getUserCuisines(), /Impossible de lire/);
});

test("the frontend only offers cuisines actually supplied by the API", async () => {
  const { service } = profileService();
  const options = await service.fetchAllCuisines();
  assert.deepEqual(options, [{ id: 3, name: "Française" }, { id: 5, name: "Indienne" }, { id: 1, name: "Italienne" }, { id: 2, name: "Japonaise" }, { id: 4, name: "Mexicaine" }]);
  const raw = [{ id: 42, name: "Mediterranean" }];
  const future = profileService({ reference: raw });
  assert.deepEqual(await future.service.fetchAllCuisines(), raw);
});

test("empty or failed catalog requests never create fallback cuisines", async (t) => {
  t.mock.method(console, "error", () => {});
  assert.deepEqual(await profileService({ reference: [] }).service.fetchAllCuisines(), []);
  assert.deepEqual(await profileService({ failReference: true }).service.fetchAllCuisines(), []);
});

test("legacy frontend-only choices are ignored and removed from the cache without losing other settings", async () => {
  const saved = [{ id: 1, name: "Italienne" }];
  const { service, storage } = profileService({ saved });
  storage.set("profileConfig", JSON.stringify({ location: "Lyon", cuisines: ["Méditerranéenne"], localCuisines: ["Méditerranéenne"], avoidVeg: ["ail"] }));
  assert.deepEqual(await service.getUserCuisines(), saved);
  assert.deepEqual((await service.getProfileRequest()).cuisines, saved);
  assert.deepEqual(JSON.parse(storage.get("profileConfig")), { location: "Lyon", cuisines: ["Italienne"], avoidVeg: ["ail"] });
});

test("legacy keys and choices missing from the API reference are rejected before any request", async () => {
  const { service, calls } = profileService();
  await assert.rejects(service.saveUserCuisines(["local:mediterraneenne"]), /Identifiant/);
  await assert.rejects(service.saveUserCuisines([1, "local:mediterraneenne"], [{ id: 1, name: "Italienne" }]), /Identifiant/);
  await assert.rejects(service.saveUserCuisines([999], [{ id: 1, name: "Italienne" }]), /plus disponible/);
  assert.equal(calls.length, 0);
});

function recipeService(getUserCuisines) {
  const calls = [];
  class ApiError extends Error {}
  const service = load("src/services/recipes.ts", {
    "@/src/lib/api": { ApiError, apiRequest: async (path, options) => {
      calls.push({ path, options });
      return { recipe: "Test recipe", model: "mock" };
    } },
    "./auth": {
      getSession: async () => ({ token: "test-token", user: { id: 12345 } }),
      getCsrfToken: async () => "test-csrf",
    },
    "./profile": { getUserCuisines },
  });
  return { service, calls };
}

test("generation with no selected cuisine explicitly allows all cuisines without dropping other criteria", async () => {
  const { service, calls } = recipeService(async () => []);
  await service.generateAiRecipe({ nombre_personne: 2, ingredients_selected: ["riz"], contexte_personnel: "Budget : petit" });
  assert.equal(calls[0].path, "/admin/recipes/generate");
  assert.match(calls[0].options.body.contexte_personnel, /toutes les cuisines sont autorisées/);
  assert.match(calls[0].options.body.contexte_personnel, /Budget : petit/);
  assert.equal(calls[0].options.body.nombre_personne, 2);
  assert.deepEqual(calls[0].options.body.ingredients_selected, ["riz"]);
  assert.equal(calls[0].options.headers["X-CSRF-TOKEN"], "test-csrf");
});

test("generation uses freshly retrieved selected cuisines, including future categories", async () => {
  const { service, calls } = recipeService(async () => [{ id: 17, name: "Thaïlandaise" }]);
  await service.generateAiRecipe({ contexte_personnel: "Repas rapide" });
  assert.match(calls[0].options.body.contexte_personnel, /Thaïlandaise/);
  assert.doesNotMatch(calls[0].options.body.contexte_personnel, /toutes les cuisines sont autorisées/);
});

test("generation uses real server preferences and ignores legacy frontend-only choices", async () => {
  const profile = profileService({ saved: [{ id: 1, name: "Italienne" }] });
  profile.storage.set("profileConfig", JSON.stringify({ cuisines: ["Méditerranéenne"], localCuisines: ["Méditerranéenne"] }));
  const { service, calls } = recipeService(() => profile.service.getUserCuisines());
  await service.generateAiRecipe({ contexte_personnel: "Repas rapide" });
  assert.match(calls[0].options.body.contexte_personnel, /Italienne/);
  assert.doesNotMatch(calls[0].options.body.contexte_personnel, /Méditerranéenne/);
  assert.doesNotMatch(calls[0].options.body.contexte_personnel, /toutes les cuisines sont autorisées/);
});

test("generation does not pretend a failed preference read means all cuisines", async (t) => {
  t.mock.method(console, "error", () => {});
  const { service, calls } = recipeService(async () => { throw new Error("Preferences unavailable"); });
  await assert.rejects(service.generateAiRecipe({}), /Preferences unavailable/);
  assert.equal(calls.length, 0);
});
