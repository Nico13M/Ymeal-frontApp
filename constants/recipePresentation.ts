/** Helpers d'affichage communs aux cartes et détails de recettes. */
export const RECIPE_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80";

export function translateDifficulty(value?: string | null): string {
  const difficulty = (value ?? "").trim().toLowerCase();
  if (!difficulty) return "Moyen";
  if (["beginner", "easy", "facile", "débutant", "debutant"].some((x) => difficulty.includes(x))) {
    return "Débutant";
  }
  if (["medium", "intermediate", "moyen", "moyenne"].some((x) => difficulty.includes(x))) {
    return "Moyen";
  }
  if (["hard", "difficult", "difficile", "advanced"].some((x) => difficulty.includes(x))) {
    return "Difficile";
  }
  return value!.charAt(0).toLocaleUpperCase("fr-FR") + value!.slice(1);
}
