/**
 * Mémoire partagée de l'état « favori » des recettes pendant la session.
 *
 * Quand on ajoute / retire un favori depuis une carte (liste Recettes, Favoris)
 * puis qu'on ouvre la recette, le détail doit afficher le même état, même si le
 * serveur ou le cache du navigateur renvoie encore l'ancienne valeur.
 */
type Listener = (recipeId: number, isFavorite: boolean) => void;

const overrides = new Map<number, boolean>();
const listeners = new Set<Listener>();

export function setFavoriteState(recipeId: number, isFavorite: boolean) {
  overrides.set(recipeId, isFavorite);
  listeners.forEach((l) => l(recipeId, isFavorite));
}

/** État connu localement (undefined = rien de modifié pendant la session). */
export function getFavoriteOverride(recipeId: number): boolean | undefined {
  return overrides.get(recipeId);
}

/** Applique les changements locaux à une liste d'ids favoris venant du serveur. */
export function applyFavoriteOverrides(ids: Set<number>): Set<number> {
  const next = new Set(ids);
  overrides.forEach((fav, id) => {
    if (fav) next.add(id);
    else next.delete(id);
  });
  return next;
}

export function subscribeFavorites(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
