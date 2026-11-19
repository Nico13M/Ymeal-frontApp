export type CuisineReference = { id: number; name: string };
export type CuisineOptionId = number;
export type CuisineOption = CuisineReference;

export const ALL_CUISINES_LABEL = "Ouvert à toutes les cuisines";

export function foldCuisineText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}

export function parseCuisineReferences(payload: unknown): CuisineReference[] {
  if (!Array.isArray(payload) || payload.some((item) =>
    !item || typeof item !== "object" || !Number.isInteger(item.id) || item.id <= 0 ||
    typeof item.name !== "string" || !item.name.trim()
  )) {
    throw new Error("Impossible de lire les préférences de cuisine. Réessaie dans quelques instants.");
  }
  // Preserve the API's IDs, names and order; the frontend owns no cuisine catalog.
  return payload.map(({ id, name }) => ({ id, name }));
}

export function filterCuisines<T extends { name: string }>(reference: readonly T[], query: string): T[] {
  const needle = foldCuisineText(query);
  return reference.filter((item) => foldCuisineText(item.name).includes(needle));
}

export function getCuisinePreference(names: readonly string[]) {
  const cuisines = [...new Set(names.filter((name) => name.trim().length > 0))];
  return { mode: cuisines.length === 0 ? "all" as const : "preferred" as const, cuisines };
}

export function toggleCuisinePreference(names: readonly string[], name: string, limit: number): string[] {
  const current = getCuisinePreference(names).cuisines;
  if (current.includes(name)) return current.filter((item) => item !== name);
  if (current.length >= limit) return current;
  return [...current, name];
}

export function resolveCuisineOptionIds(names: readonly string[], options: readonly CuisineOption[]): CuisineOptionId[] {
  return getCuisinePreference(names).cuisines.map((name) => {
    const option = options.find((candidate) => candidate.name === name);
    if (!option) throw new Error(`La cuisine « ${name} » n’est pas disponible. Recharge les préférences puis réessaie.`);
    return option.id;
  });
}

export function buildCuisinePayload(ids: readonly number[]) {
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) throw new Error("Identifiant de cuisine invalide.");
  // [] explicitly clears previous preferences and means unrestricted cuisines.
  return { cuisine_ids: [...new Set(ids)] };
}

export function withCuisinePreferences<T extends { contexte_personnel?: string }>(payload: T, names: readonly string[]): T {
  const preference = getCuisinePreference(names);
  const instruction = preference.mode === "all"
    ? "Aucune restriction sur le style de cuisine : toutes les cuisines sont autorisées. Conserve les autres critères et restrictions alimentaires."
    : `Cuisines préférées : ${preference.cuisines.join(", ")}. Propose une recette de l’une de ces cuisines, en respectant les autres contraintes alimentaires.`;
  return {
    ...payload,
    contexte_personnel: [payload.contexte_personnel?.trim(), instruction]
      .filter(Boolean).join("\n"),
  };
}
