// Référentiel d'ingrédients utilisé par le formulaire « Nouvelle recette » :
// régimes proposés et unité de mesure adaptée à chaque ingrédient.

/** Régimes proposés. "Autre" ouvre un champ libre. */
export const DIET_OPTIONS = [
  "Végétarien",
  "Vegan",
  "Halal",
  "Casher",
  "Sans gluten",
  "Sans lactose",
  "Autre",
] as const;

// ─── Unités ────────────────────────────────────────────────────────────────

export type UnitKind = "weight" | "volume" | "count" | "spoon";

export const UNITS_BY_KIND: Record<UnitKind, string[]> = {
  weight: ["g", "kg"],
  volume: ["ml", "cl", "L"],
  count: ["pièce(s)"],
  spoon: ["c. à café", "c. à soupe", "pincée(s)"],
};

/** Toutes les unités (ingrédient inconnu = l'utilisateur choisit librement). */
export const ALL_UNITS: string[] = [
  ...UNITS_BY_KIND.weight,
  ...UNITS_BY_KIND.volume,
  ...UNITS_BY_KIND.spoon,
  ...UNITS_BY_KIND.count,
];

type CatalogItem = { name: string; kind: UnitKind; unit: string };

/**
 * Petit catalogue pour associer automatiquement l'unité de mesure
 * correspondante à l'ingrédient choisi.
 */
export const INGREDIENT_CATALOG: CatalogItem[] = [
  // Solides (poids)
  { name: "Farine", kind: "weight", unit: "g" },
  { name: "Sucre", kind: "weight", unit: "g" },
  { name: "Sucre glace", kind: "weight", unit: "g" },
  { name: "Beurre", kind: "weight", unit: "g" },
  { name: "Riz", kind: "weight", unit: "g" },
  { name: "Pâtes", kind: "weight", unit: "g" },
  { name: "Semoule", kind: "weight", unit: "g" },
  { name: "Lentilles", kind: "weight", unit: "g" },
  { name: "Pois chiches", kind: "weight", unit: "g" },
  { name: "Pomme de terre", kind: "weight", unit: "g" },
  { name: "Carotte", kind: "weight", unit: "g" },
  { name: "Courgette", kind: "weight", unit: "g" },
  { name: "Tomate", kind: "weight", unit: "g" },
  { name: "Champignons", kind: "weight", unit: "g" },
  { name: "Épinards", kind: "weight", unit: "g" },
  { name: "Poulet", kind: "weight", unit: "g" },
  { name: "Boeuf haché", kind: "weight", unit: "g" },
  { name: "Saumon", kind: "weight", unit: "g" },
  { name: "Thon", kind: "weight", unit: "g" },
  { name: "Jambon", kind: "weight", unit: "g" },
  { name: "Lardons", kind: "weight", unit: "g" },
  { name: "Fromage râpé", kind: "weight", unit: "g" },
  { name: "Mozzarella", kind: "weight", unit: "g" },
  { name: "Parmesan", kind: "weight", unit: "g" },
  { name: "Chocolat", kind: "weight", unit: "g" },
  { name: "Pomme", kind: "weight", unit: "g" },
  { name: "Banane", kind: "weight", unit: "g" },
  { name: "Fraises", kind: "weight", unit: "g" },
  { name: "Levure chimique", kind: "weight", unit: "g" },
  // Liquides (volume)
  { name: "Lait", kind: "volume", unit: "ml" },
  { name: "Eau", kind: "volume", unit: "ml" },
  { name: "Crème fraîche", kind: "volume", unit: "cl" },
  { name: "Crème liquide", kind: "volume", unit: "cl" },
  { name: "Huile d'olive", kind: "volume", unit: "ml" },
  { name: "Huile de tournesol", kind: "volume", unit: "ml" },
  { name: "Vinaigre", kind: "volume", unit: "ml" },
  { name: "Sauce soja", kind: "volume", unit: "ml" },
  { name: "Bouillon", kind: "volume", unit: "ml" },
  { name: "Jus de citron", kind: "volume", unit: "ml" },
  { name: "Coulis de tomate", kind: "volume", unit: "ml" },
  // Comptables (pièces)
  { name: "Œufs", kind: "count", unit: "pièce(s)" },
  { name: "Oignon", kind: "count", unit: "pièce(s)" },
  { name: "Gousse d'ail", kind: "count", unit: "pièce(s)" },
  { name: "Citron", kind: "count", unit: "pièce(s)" },
  { name: "Avocat", kind: "count", unit: "pièce(s)" },
  { name: "Poivron", kind: "count", unit: "pièce(s)" },
  { name: "Tortilla", kind: "count", unit: "pièce(s)" },
  { name: "Tranche de pain", kind: "count", unit: "pièce(s)" },
  { name: "Yaourt", kind: "count", unit: "pièce(s)" },
  // Épices / assaisonnements (cuillères)
  { name: "Sel", kind: "spoon", unit: "pincée(s)" },
  { name: "Poivre", kind: "spoon", unit: "pincée(s)" },
  { name: "Paprika", kind: "spoon", unit: "c. à café" },
  { name: "Cumin", kind: "spoon", unit: "c. à café" },
  { name: "Curry", kind: "spoon", unit: "c. à café" },
  { name: "Cannelle", kind: "spoon", unit: "c. à café" },
  { name: "Herbes de Provence", kind: "spoon", unit: "c. à café" },
  { name: "Moutarde", kind: "spoon", unit: "c. à soupe" },
  { name: "Miel", kind: "spoon", unit: "c. à soupe" },
  { name: "Concentré de tomate", kind: "spoon", unit: "c. à soupe" },
  { name: "Sucre vanillé", kind: "spoon", unit: "c. à café" },
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .toLowerCase()
    .trim();
}

export function findCatalogItem(name: string): CatalogItem | undefined {
  const n = normalize(name);
  if (!n) return undefined;
  return INGREDIENT_CATALOG.find((i) => normalize(i.name) === n);
}

export function suggestIngredients(query: string, limit = 5): CatalogItem[] {
  const n = normalize(query);
  if (n.length < 1) return [];
  return INGREDIENT_CATALOG.filter((i) => normalize(i.name).includes(n))
    .filter((i) => normalize(i.name) !== n)
    .slice(0, limit);
}

/** Unités proposées pour un ingrédient donné (toutes si inconnu). */
export function unitsForIngredient(name: string): string[] {
  const item = findCatalogItem(name);
  return item ? UNITS_BY_KIND[item.kind] : ALL_UNITS;
}

export function defaultUnitForIngredient(name: string): string {
  return findCatalogItem(name)?.unit ?? "g";
}
