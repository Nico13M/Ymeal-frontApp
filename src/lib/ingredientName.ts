/**
 * Normalisation des noms d'ingrédients pour les comparer sans tenir compte
 * de la casse, des accents, de la ligature « œ » ni du singulier / pluriel.
 *
 *   "Tomates" === "tomate" === "TOMATE"
 *   "Œufs"    === "oeuf"
 *   "Pommes de terre" === "pomme de terre"
 *   "Choux"   === "chou"
 */

const INVARIABLE = new Set([
  "riz",
  "mais",
  "ananas",
  "radis",
  "pois",
  "anchois",
  "jus",
  "noix",
  "brebis",
  "cassis",
  "petits pois",
  "gras",
  "frais",
]);

function singularizeWord(word: string): string {
  if (word.length <= 3 || INVARIABLE.has(word)) return word;
  // choux, poireaux, gâteaux → chou, poireau, gâteau
  if (word.endsWith("x") && /(au|eu|ou)x$/.test(word)) return word.slice(0, -1);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/** Forme canonique : minuscules, sans accents, au singulier. */
export function normalizeIngredientName(value: string): string {
  const base = (value ?? "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9 -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!base) return "";
  if (INVARIABLE.has(base)) return base;
  return base
    .split(" ")
    .map((w) => (["de", "du", "des", "a", "au", "aux", "la", "le", "les", "d", "l", "en"].includes(w) ? w : singularizeWord(w)))
    .join(" ");
}

/** Deux noms désignent-ils le même ingrédient ? */
export function sameIngredient(a: string, b: string): boolean {
  const na = normalizeIngredientName(a);
  return na.length > 0 && na === normalizeIngredientName(b);
}

/** Le nom contient-il la recherche (tolérant casse / accents / pluriel) ? */
export function ingredientMatches(name: string, query: string): boolean {
  const q = normalizeIngredientName(query);
  if (!q) return true;
  const n = normalizeIngredientName(name);
  // On compare aussi la forme brute sans accents pour les saisies partielles ("tomat")
  const raw = (s: string) =>
    s.toLowerCase().replace(/œ/g, "oe").normalize("NFD").replace(/[̀-ͯ]/g, "");
  return n.includes(q) || raw(name).includes(raw(query).trim());
}
