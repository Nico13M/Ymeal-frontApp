/**
 * Estimation du prix moyen d'une recette.
 *
 * L'API ne fournit pas de prix : on l'estime à partir des ingrédients
 * (quantité + unité) et d'un barème de prix moyens en supermarché (France,
 * marques distributeur). C'est un ordre de grandeur, affiché comme « estimé ».
 * Si le backend expose un jour un vrai prix, `getRecipePrice` le privilégie.
 */

type PriceRef = {
  /** mots-clés (sans accents, minuscules) */
  keys: string[];
  /** prix en € par kg (solides) ou par litre (liquides) */
  perKg?: number;
  /** prix en € par pièce (œuf, citron…) */
  perPiece?: number;
  /** poids moyen d'une pièce en grammes (pour convertir g → pièce et inversement) */
  pieceWeight?: number;
};

const PRICES: PriceRef[] = [
  // Féculents
  { keys: ["pates", "spaghetti", "penne", "tagliatelle", "macaroni", "coquillette", "fusilli", "lasagne"], perKg: 1.6 },
  { keys: ["riz"], perKg: 2 },
  { keys: ["semoule", "boulgour", "couscous"], perKg: 2 },
  { keys: ["quinoa"], perKg: 7 },
  { keys: ["farine"], perKg: 1 },
  { keys: ["pomme de terre", "pommes de terre", "patate"], perKg: 1.3, pieceWeight: 150 },
  { keys: ["pain de mie", "pain", "baguette", "tranche"], perKg: 3.5, perPiece: 0.15, pieceWeight: 35 },
  { keys: ["tortilla", "wrap"], perPiece: 0.3, pieceWeight: 40 },
  { keys: ["pate feuilletee", "pate brisee", "pate a pizza"], perPiece: 1.2, pieceWeight: 230 },
  // Légumineuses
  { keys: ["lentille"], perKg: 3 },
  { keys: ["pois chiche"], perKg: 3 },
  { keys: ["haricot rouge", "haricots rouges", "haricot blanc", "haricots blancs"], perKg: 3 },
  // Légumes
  { keys: ["tomate cerise"], perKg: 6 },
  { keys: ["tomate"], perKg: 2.8, pieceWeight: 120 },
  { keys: ["oignon", "echalote"], perKg: 2, pieceWeight: 100 },
  { keys: ["ail"], perKg: 8, perPiece: 0.08, pieceWeight: 5 },
  { keys: ["carotte"], perKg: 1.5, pieceWeight: 100 },
  { keys: ["courgette"], perKg: 2.5, pieceWeight: 250 },
  { keys: ["aubergine"], perKg: 3, pieceWeight: 300 },
  { keys: ["poivron"], perKg: 4, pieceWeight: 170 },
  { keys: ["champignon"], perKg: 5 },
  { keys: ["epinard"], perKg: 4 },
  { keys: ["brocoli", "chou-fleur", "chou fleur"], perKg: 3, pieceWeight: 500 },
  { keys: ["concombre"], perKg: 2.5, pieceWeight: 350 },
  { keys: ["salade", "laitue", "mache", "roquette"], perKg: 6, perPiece: 1, pieceWeight: 300 },
  { keys: ["avocat"], perPiece: 1, pieceWeight: 180 },
  { keys: ["poireau"], perKg: 2.5, pieceWeight: 200 },
  { keys: ["mais"], perKg: 3.5 },
  { keys: ["petits pois", "petit pois", "haricots verts", "haricot vert"], perKg: 3.5 },
  { keys: ["potiron", "courge", "butternut"], perKg: 2.5 },
  // Fruits
  { keys: ["citron"], perPiece: 0.4, pieceWeight: 100 },
  { keys: ["pomme"], perKg: 2.5, pieceWeight: 150 },
  { keys: ["banane"], perKg: 2, pieceWeight: 120 },
  { keys: ["fraise", "framboise", "myrtille"], perKg: 9 },
  { keys: ["orange"], perKg: 2.5, pieceWeight: 200 },
  // Viandes / poissons
  { keys: ["poulet", "dinde", "volaille"], perKg: 11 },
  { keys: ["boeuf hache", "steak hache", "viande hachee"], perKg: 12 },
  { keys: ["boeuf", "veau"], perKg: 18 },
  { keys: ["porc", "saucisse", "chipolata"], perKg: 9 },
  { keys: ["agneau"], perKg: 20 },
  { keys: ["jambon"], perKg: 14, perPiece: 0.6, pieceWeight: 45 },
  { keys: ["lardon", "bacon"], perKg: 12 },
  { keys: ["chorizo"], perKg: 16 },
  { keys: ["saumon"], perKg: 22 },
  { keys: ["thon"], perKg: 14 },
  { keys: ["cabillaud", "colin", "poisson"], perKg: 16 },
  { keys: ["crevette"], perKg: 18 },
  { keys: ["tofu"], perKg: 8 },
  // Produits laitiers / œufs
  { keys: ["oeuf"], perPiece: 0.3, pieceWeight: 55 },
  { keys: ["lait de coco"], perKg: 4 },
  { keys: ["lait"], perKg: 1.1 },
  { keys: ["creme"], perKg: 4.5 },
  { keys: ["beurre"], perKg: 10 },
  { keys: ["yaourt", "yogourt"], perPiece: 0.3, pieceWeight: 125 },
  { keys: ["parmesan"], perKg: 20 },
  { keys: ["mozzarella"], perKg: 9, perPiece: 1, pieceWeight: 125 },
  { keys: ["feta"], perKg: 12 },
  { keys: ["chevre"], perKg: 14 },
  { keys: ["emmental", "gruyere", "fromage rape", "comte", "cheddar", "fromage"], perKg: 11 },
  // Épicerie
  { keys: ["sucre vanille", "sucre vanillé"], perKg: 8 },
  { keys: ["sucre"], perKg: 1.2 },
  { keys: ["chocolat", "cacao"], perKg: 9 },
  { keys: ["miel"], perKg: 10 },
  { keys: ["levure"], perKg: 15 },
  { keys: ["huile d'olive", "huile d olive", "huile olive"], perKg: 9 },
  { keys: ["huile"], perKg: 3 },
  { keys: ["vinaigre"], perKg: 2.5 },
  { keys: ["sauce soja"], perKg: 6 },
  { keys: ["moutarde"], perKg: 5 },
  { keys: ["concentre de tomate", "coulis", "sauce tomate", "passata"], perKg: 3 },
  { keys: ["bouillon"], perKg: 1, perPiece: 0.2, pieceWeight: 10 },
  { keys: ["sel", "poivre", "epice", "paprika", "cumin", "curry", "cannelle", "herbe", "persil", "basilic", "coriandre", "thym", "origan", "muscade"], perKg: 20 },
  { keys: ["eau"], perKg: 0 },
];

const DEFAULT_PER_KG = 5;
const DEFAULT_PER_PIECE = 0.5;
const DEFAULT_PIECE_WEIGHT = 100;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function findPrice(name: string): PriceRef | null {
  const n = normalize(name);
  for (const ref of PRICES) {
    if (ref.keys.some((k) => n.includes(normalize(k)))) return ref;
  }
  return null;
}

type UnitInfo =
  | { kind: "mass"; grams: number } // grammes ou millilitres (densité ≈ 1)
  | { kind: "piece" };

function readUnit(rawUnit: string): UnitInfo {
  const u = normalize(rawUnit).replace(/\.$/, "");
  if (!u) return { kind: "piece" };
  if (["kg", "kilo", "kilogramme", "kilogrammes"].includes(u)) return { kind: "mass", grams: 1000 };
  if (["g", "gr", "gramme", "grammes"].includes(u)) return { kind: "mass", grams: 1 };
  if (["mg"].includes(u)) return { kind: "mass", grams: 0.001 };
  if (["l", "litre", "litres"].includes(u)) return { kind: "mass", grams: 1000 };
  if (["dl"].includes(u)) return { kind: "mass", grams: 100 };
  if (["cl"].includes(u)) return { kind: "mass", grams: 10 };
  if (["ml"].includes(u)) return { kind: "mass", grams: 1 };
  if (u.includes("soupe") || u === "cas" || u === "c.a.s" || u === "tbsp") return { kind: "mass", grams: 15 };
  if (u.includes("cafe") || u === "cac" || u === "c.a.c" || u === "tsp") return { kind: "mass", grams: 5 };
  if (u.includes("pincee")) return { kind: "mass", grams: 0.5 };
  if (u.includes("verre")) return { kind: "mass", grams: 200 };
  if (u.includes("tasse") || u === "cup") return { kind: "mass", grams: 240 };
  // pièce(s), unité(s), tranche(s), gousse(s), boîte…
  return { kind: "piece" };
}

export type PriceInput = {
  name: string;
  quantity: number | null | undefined;
  unit?: string | { symbol?: string; name?: string } | null;
};

function unitToString(unit: PriceInput["unit"]): string {
  if (!unit) return "";
  if (typeof unit === "string") return unit;
  return unit.symbol || unit.name || "";
}

/** Coût estimé d'un ingrédient (en €). */
export function estimateIngredientCost(ing: PriceInput): number {
  const qty = Number(ing.quantity);
  if (!Number.isFinite(qty) || qty <= 0) return 0;
  const ref = findPrice(ing.name);
  const unit = readUnit(unitToString(ing.unit));

  if (unit.kind === "mass") {
    const kg = (qty * unit.grams) / 1000;
    if (ref?.perKg !== undefined) return kg * ref.perKg;
    if (ref?.perPiece !== undefined) {
      return ((qty * unit.grams) / (ref.pieceWeight ?? DEFAULT_PIECE_WEIGHT)) * ref.perPiece;
    }
    return kg * DEFAULT_PER_KG;
  }

  // Pièces
  if (ref?.perPiece !== undefined) return qty * ref.perPiece;
  if (ref?.perKg !== undefined) {
    return ((qty * (ref.pieceWeight ?? DEFAULT_PIECE_WEIGHT)) / 1000) * ref.perKg;
  }
  return qty * DEFAULT_PER_PIECE;
}

export type RecipePrice = {
  total: number;
  perServing: number;
  servings: number;
  estimated: boolean;
};

type RecipeLike = {
  servings?: number | null;
  price?: unknown;
  average_price?: unknown;
  estimated_price?: unknown;
  nutrition?: { ingredients?: PriceInput[] | null } | null;
  ingredients?: PriceInput[] | null;
};

/** Prix moyen d'une recette (null si aucun ingrédient exploitable). */
export function getRecipePrice(recipe: RecipeLike | null | undefined): RecipePrice | null {
  if (!recipe) return null;
  const servings = Math.max(1, Number(recipe.servings) || 1);

  // Prix fourni par l'API (si un jour disponible)
  for (const candidate of [recipe.price, recipe.average_price, recipe.estimated_price]) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) {
      return { total: value, perServing: value / servings, servings, estimated: false };
    }
  }

  const ingredients = recipe.nutrition?.ingredients ?? recipe.ingredients ?? [];
  if (!ingredients || ingredients.length === 0) return null;

  const total = ingredients.reduce((sum, ing) => sum + estimateIngredientCost(ing), 0);
  if (total <= 0) return null;
  return { total, perServing: total / servings, servings, estimated: true };
}

export function formatEuro(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

/** Tranche de budget par portion. */
export type PriceBand = "eco" | "moyen" | "plus";

export const PRICE_BANDS: { key: PriceBand; label: string; test: (perServing: number) => boolean }[] = [
  { key: "eco", label: "< 2 € / pers.", test: (p) => p < 2 },
  { key: "moyen", label: "2 – 4 € / pers.", test: (p) => p >= 2 && p <= 4 },
  { key: "plus", label: "> 4 € / pers.", test: (p) => p > 4 },
];
