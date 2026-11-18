import { ApiError, apiRequest } from "@/src/lib/api";
import { getCsrfToken, getSession } from "./auth";
import { applyFavoriteOverrides, setFavoriteState } from "@/src/lib/favoritesStore";

const COOKIE_SESSION_TOKEN = "__cookie_session__";

export type IngredientMacros = {
  energy_kcal: number | null;
  proteins_g: number | null;
  carbohydrates_g: number | null;
  fat_g: number | null;
};

export type NutritionTotals = {
  energy_kcal: number;
  proteins_g: number;
  carbohydrates_g: number;
  fat_g: number;
};

export type RecipeIngredient = {
  id: number;
  name: string;
  quantity: number;
  unit:
    | string
    | {
        id: number;
        name: string;
        symbol: string;
      }
    | null;
  macros?: IngredientMacros;
};

export type RecipeDiet = {
  id: number;
  name: string;
};

export type RecipeTiming = {
  duration: number | null;
  prep_time: number | null;
  total_time: number;
};

/** L'e-mail de l'auteur n'est plus renvoyé par l'API : seuls id et name sont fiables. */
export type RecipeAuthor = {
  id: number;
  name: string;
};

export type RecipeNutrition = {
  diets: RecipeDiet[];
  ingredients: RecipeIngredient[];
  totals?: NutritionTotals;
};

export type RecipeEngagement = {
  favorites_count: number;
};

export type RecipeTimestamps = {
  created_at: string | null;
  updated_at: string | null;
};

export type RecipeFull = {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  servings: number;
  timing: RecipeTiming;
  difficulty: string | null;
  dish_type: string | null;
  is_public: boolean;
  is_favorited: boolean;
  timestamps: RecipeTimestamps;
  author: RecipeAuthor | null;
  nutrition: RecipeNutrition;
  engagement: RecipeEngagement;
  steps?: string[];
  created_at: string | null;

  // Statistiques d'avis et d'engagement ajoutées
  favorites_count?: number;
  ratings?: any;
  ratings_count?: number;
  reviews_count?: number;
  comments_count?: number;
  average_rating?: number;
  avg_rating?: number;
  rating_average?: number;
};

export type RecipeMinimal = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  description: string;
  servings: number;
  difficulty: string | null;
  created_at: string | null;
  timing: {
    duration: number | null;
    prep_time: number | null;
  };
  author: string;
  ratings?: {
    stats?: {
      average?: number | null;
      count?: number | null;
    } | null;
  } | null;
  favorites_count: number;
};

export type SearchResult = {
  success: boolean;
  data: {
    recipes: RecipeMinimal[];
    total_results: number;
    applied_filters: any;
  };
};

/* ===================== TYPES IA ===================== */

export type RecipePredictionRequest = {
  ingredient_search?: string;
  ingredients_selected?: string[];
  frigo?: boolean;
  nombre_personne?: number;
  difficulte?: string;
  type_plat?: string;
  temps_minutes?: number;
  contexte_personnel?: string;
  regime?: string;
  ingredients_interdits?: string[];
};

export type RecipePredictionResponse = {
  recipe: string;
  model: string;
};

export type TrendingRecipesResult = {
  window: {
    days: number;
    since: string;
  };
  recipes: RecipeMinimal[];
  total_results: number;
};

/* ===================== HELPER ===================== */

async function getToken(): Promise<{
  token: string | undefined;
  userId: number | undefined;
}> {
  const session = await getSession();
  if (!session?.token) throw new Error("Session utilisateur introuvable.");
  const isCookie = session.token === COOKIE_SESSION_TOKEN;
  return {
    token: isCookie ? undefined : session.token,
    userId: session.user?.id as number | undefined,
  };
}

function buildHeaders(userId?: number): Record<string, string> {
  return userId ? { "X-User-Id": String(userId) } : {};
}

/* ===================== API CALLS ===================== */

export async function getRecipes(): Promise<RecipeFull[]> {
  try {
    const { token, userId } = await getToken();
    const data = await apiRequest<RecipeFull[]>(`/admin/recipes/index?_=${Date.now()}`, {
      method: "GET",
      token,
      credentials: "include",
      headers: buildHeaders(userId),
    });
    console.log(data);
    return data ?? [];
  } catch (error) {
    console.error(
      "[RECIPES] getRecipes:",
      error instanceof ApiError ? error.message : error,
    );
    throw error;
  }
}

export async function getRecipe(recipeId: number): Promise<RecipeFull> {
  try {
    const { token, userId } = await getToken();
    // _ : évite une réponse mise en cache par le navigateur (état favori périmé)
    const data = await apiRequest<RecipeFull>(`/admin/recipes/${recipeId}?_=${Date.now()}`, {
      method: "GET",
      token,
      credentials: "include",
      headers: buildHeaders(userId),
    });
    return data!;
  } catch (error) {
    console.error(
      "[RECIPES] ❌ getRecipe:",
      error instanceof ApiError ? error.message : error,
    );
    throw error;
  }
}

export async function searchRecipes(params: {
  query?: string;
  difficulty?: string;
  servings?: number;
  frigo?: boolean;
}): Promise<SearchResult> {
  try {
    const { token, userId } = await getToken();

    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append("query", params.query);
    if (params.difficulty) queryParams.append("difficulty", params.difficulty);
    if (params.servings)
      queryParams.append("servings", params.servings.toString());
    if (params.frigo) queryParams.append("frigo", "true");

    const url = `/admin/recipes/search?${queryParams.toString()}`;
    const data = await apiRequest<SearchResult>(url, {
      method: "GET",
      token,
      credentials: "include",
      headers: buildHeaders(userId),
    });
    return data!;
  } catch (error) {
    console.error(
      "[RECIPES] ❌ searchRecipes:",
      error instanceof ApiError ? error.message : error,
    );
    throw error;
  }
}

export async function getTrendingRecipes(): Promise<TrendingRecipesResult> {
  try {
    const { token, userId } = await getToken();
    const data = await apiRequest<TrendingRecipesResult>(
      "/admin/recipes/trending",
      {
        method: "GET",
        token,
        credentials: "include",
        headers: buildHeaders(userId),
      },
    );
    return data;
  } catch (error) {
    console.error(
      "[RECIPES] ❌ getTrendingRecipes:",
      error instanceof ApiError ? error.message : error,
    );
    throw error;
  }
}

export async function getRecipeRatingsCount(recipeId: number): Promise<number> {
  try {
    const { token, userId } = await getToken();
    const response = await apiRequest<unknown>(
      `/admin/ratings/recipes/${recipeId}`,
      {
        method: "GET",
        token,
        credentials: "include",
        headers: buildHeaders(userId),
      },
    );

    if (Array.isArray(response)) {
      return response.length;
    }

    if (response && typeof response === "object") {
      const payload = response as {
        data?: { ratings?: unknown[] } | unknown[];
        ratings?: unknown[];
        stats?: { count?: number };
      };

      if (typeof payload.stats?.count === "number") {
        return payload.stats.count;
      }

      if (Array.isArray(payload.data)) {
        return payload.data.length;
      }

      if (
        payload.data &&
        typeof payload.data === "object" &&
        Array.isArray((payload.data as { ratings?: unknown[] }).ratings)
      ) {
        return (payload.data as { ratings: unknown[] }).ratings.length;
      }

      if (Array.isArray(payload.ratings)) {
        return payload.ratings.length;
      }
    }

    return 0;
  } catch (error) {
    console.error(
      "[RECIPES] ❌ getRecipeRatingsCount:",
      error instanceof ApiError ? error.message : error,
    );
    return 0;
  }
}

export async function getRecipeRatingsStats(
  recipeId: number,
): Promise<{ count: number; average: number }> {
  try {
    const { token, userId } = await getToken();
    const response = await apiRequest<unknown>(
      `/admin/ratings/recipes/${recipeId}`,
      {
        method: "GET",
        token,
        credentials: "include",
        headers: buildHeaders(userId),
      },
    );

    const extractRatings = (payload: unknown): Array<{ rating?: number }> => {
      if (Array.isArray(payload)) return payload as Array<{ rating?: number }>;

      if (!payload || typeof payload !== "object") return [];

      const record = payload as {
        data?:
          | { ratings?: Array<{ rating?: number }> }
          | Array<{ rating?: number }>;
        ratings?: Array<{ rating?: number }>;
        stats?: {
          average?: number | null;
          count?: number | null;
        };
      };

      if (
        typeof record.stats?.average === "number" ||
        typeof record.stats?.count === "number"
      ) {
        return [];
      }

      if (Array.isArray(record.data)) return record.data;
      if (
        record.data &&
        typeof record.data === "object" &&
        Array.isArray(
          (record.data as { ratings?: Array<{ rating?: number }> }).ratings,
        )
      ) {
        return (record.data as { ratings: Array<{ rating?: number }> }).ratings;
      }
      if (Array.isArray(record.ratings)) return record.ratings;

      return [];
    };

    if (response && typeof response === "object") {
      const payload = response as {
        stats?: {
          average?: number | null;
          count?: number | null;
        };
      };

      if (typeof payload.stats?.count === "number") {
        return {
          count: payload.stats.count,
          average:
            typeof payload.stats.average === "number"
              ? payload.stats.average
              : 0,
        };
      }
    }

    const ratings = extractRatings(response).filter(
      (item) => typeof item.rating === "number",
    );
    const count = ratings.length;
    const average =
      count > 0
        ? ratings.reduce((sum, item) => sum + (item.rating as number), 0) /
          count
        : 0;

    return { count, average };
  } catch (error) {
    console.error(
      "[RECIPES] ❌ getRecipeRatingsStats:",
      error instanceof ApiError ? error.message : error,
    );
    return { count: 0, average: 0 };
  }
}

/** Le backend peut renvoyer un tableau, ou un objet { data | recipes | favorites: [...] }. */
function normalizeFavoritesPayload(payload: unknown): RecipeMinimal[] {
  if (Array.isArray(payload)) {
    // Certaines API renvoient [{ recipe: {...} }] plutôt que [{...}]
    return payload
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const it = item as any;
        // [{ recipe: {...} }] : la recette est imbriquée
        if (it.recipe && typeof it.recipe === "object") return it.recipe;
        // [{ id: <id du favori>, recipe_id: 12, ... }] : l'id utile est recipe_id
        const recipeId = it.recipe_id ?? it.recipeId ?? (typeof it.recipe === "number" ? it.recipe : undefined);
        if (typeof recipeId === "number") return { ...it, id: recipeId };
        if (typeof recipeId === "string" && /^\d+$/.test(recipeId)) return { ...it, id: Number(recipeId) };
        return it;
      })
      .filter((item): item is RecipeMinimal => Boolean(item) && typeof (item as any).id === "number");
  }
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    for (const key of ["data", "recipes", "favorites", "items"]) {
      if (data[key] !== undefined) return normalizeFavoritesPayload(data[key]);
    }
  }
  return [];
}

export async function getFavorites(): Promise<RecipeMinimal[]> {
  try {
    const { token, userId } = await getToken();
    const data = await apiRequest<unknown>(`/admin/recipes/favorites?_=${Date.now()}`, {
      method: "GET",
      token,
      credentials: "include",
      headers: buildHeaders(userId),
    });
    return normalizeFavoritesPayload(data);
  } catch (error) {
    console.error(
      "[RECIPES] ❌ getFavorites:",
      error instanceof ApiError ? error.message : error,
    );
    throw error;
  }
}

/** Identifiants des recettes en favori (Set vide si l'appel échoue). */
export async function getFavoriteIds(): Promise<Set<number>> {
  try {
    const favs = await getFavorites();
    return applyFavoriteOverrides(new Set(favs.map((f) => f.id)));
  } catch {
    return applyFavoriteOverrides(new Set());
  }
}

/**
 * Ajoute aux favoris. Un 400 / 409 signifie « déjà en favori » côté backend :
 * on le considère comme un succès pour garder l'interface synchronisée.
 */
export async function addToFavorites(recipeId: number): Promise<void> {
  await addToFavoritesRequest(recipeId);
  setFavoriteState(recipeId, true);
}

export async function removeFromFavorites(recipeId: number): Promise<void> {
  await removeFromFavoritesRequest(recipeId);
  setFavoriteState(recipeId, false);
}

async function addToFavoritesRequest(recipeId: number): Promise<void> {
  try {
    const { token, userId } = await getToken();
    await apiRequest(`/admin/recipes/${recipeId}/favorite`, {
      method: "POST",
      body: {},
      token,
      credentials: "include",
      headers: buildHeaders(userId),
    });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 400 || error.status === 409)) return;
    console.error(
      "[RECIPES] ❌ addToFavorites:",
      error instanceof ApiError ? error.message : error,
    );
    throw error;
  }
}

/** Retire des favoris. Un 404 signifie « n'était pas en favori » : succès. */
async function removeFromFavoritesRequest(recipeId: number): Promise<void> {
  try {
    const { token, userId } = await getToken();
    await apiRequest(`/admin/recipes/${recipeId}/favorite`, {
      method: "DELETE",
      token,
      credentials: "include",
      headers: buildHeaders(userId),
    });
  } catch (error) {
    // 404 / 400 : « n'était pas en favori » → déjà dans l'état voulu
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return;
    console.error(
      "[RECIPES] ❌ removeFromFavorites:",
      error instanceof ApiError ? error.message : error,
    );
    throw error;
  }
}

export async function createRecipe(payload: {
  name: string;
  description: string;
  servings: number;
  is_public: boolean;
  duration?: number;
  time?: number;
  difficulty?: string;
  dish_type?: string;
  image?: string;
  diet_ids?: number[];
  ingredients?: Array<{
    ingredient_id: number;
    quantity: number;
    unit?: string;
  }>;
}): Promise<RecipeFull> {
  try {
    const { token, userId } = await getToken();
    const data = await apiRequest<RecipeFull>("/admin/recipes/create", {
      method: "POST",
      token,
      credentials: "include",
      headers: buildHeaders(userId),
      body: payload,
    });
    return data!;
  } catch (error) {
    console.error(
      "[RECIPES] ❌ createRecipe:",
      error instanceof ApiError ? error.message : error,
    );
    throw error;
  }
}

/* ===================== API CALLS IA ===================== */

const DIFFICULTY_MAP: Record<string, string> = {
  facile: "easy",
  débutant: "easy",
  debutant: "easy",
  moyen: "medium",
  intermédiaire: "medium",
  intermediaire: "medium",
  difficile: "hard",
  avancé: "hard",
  avance: "hard",
};

function generateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug + "-" + Math.random().toString(36).slice(2, 8);
}

function parseAiRecipeText(text: string, dishType?: string) {
  const nameMatch = text.match(/[-*]\s*Nom\s*:\s*(.+)/i);
  const name = nameMatch ? nameMatch[1].trim() : "Recette IA";

  const durationMatch = text.match(/Temps\s+total\s*:\s*(\d+)\s*min/i);
  const duration = durationMatch ? parseInt(durationMatch[1], 10) : undefined;

  const difficultyMatch = text.match(/Niveau\s*:\s*(\S+)/i);
  const difficulty = difficultyMatch
    ? (DIFFICULTY_MAP[difficultyMatch[1].toLowerCase().trim()] ?? "easy")
    : "easy";

  const servingsMatch =
    text.match(/Portions?\s*:\s*(\d+)/i) ??
    text.match(/pour\s+(\d+)\s+personne/i);
  const servings = servingsMatch
    ? Math.max(1, parseInt(servingsMatch[1], 10))
    : 2;

  const ingredientsMatch = text.match(
    /###\s+Ingr[eé]dients.*?\n([\s\S]*?)(?=###|$)/i,
  );
  const description = ingredientsMatch
    ? ingredientsMatch[1].trim()
    : text.trim();

  const stepsMatch = text.match(/###\s+[Ée]tapes.*?\n([\s\S]*?)(?=###|$)/i);
  const steps: string[] = stepsMatch
    ? stepsMatch[1]
        .split("\n")
        .map((l) => l.replace(/^\s*(\d+[.)]\s*|[-*]\s*)/, "").trim())
        .filter((l) => l !== "")
    : [];

  const prixMatch = text.match(/[-*]\s*Total\s+recette\s*[:\-–]\s*(.+)/i);
  const prixEstime = prixMatch ? prixMatch[1].trim() : null;
  const descriptionFinal = prixEstime
    ? `${description}\n\n💰 Prix estimé : ${prixEstime}`
    : description;

  return {
    name,
    slug: generateSlug(name),
    description: descriptionFinal,
    duration,
    difficulty,
    servings,
    steps,
    dishType,
    is_public: false,
  };
}

export async function saveAiRecipe(
  recipeText: string,
  options?: { isPublic?: boolean; dishType?: string },
): Promise<RecipeFull> {
  const parsed = parseAiRecipeText(recipeText, options?.dishType);
  const payload = { ...parsed, is_public: options?.isPublic ?? false };
  const data = await apiRequest<{ success: boolean; recipe: RecipeFull }>(
    "/admin/recipes/create",
    {
      method: "POST",
      ...(await getToken().then(({ token, userId }) => ({
        token,
        credentials: "include" as const,
        headers: buildHeaders(userId),
      }))),
      body: payload,
    },
  );

  try {
    await addToFavorites(data.recipe.id);
  } catch (err) {
    console.error("Erreur lors de l'ajout automatique aux favoris :", err);
  }

  return data.recipe;
}

export async function generateAiRecipe(
  payload: RecipePredictionRequest,
): Promise<RecipePredictionResponse> {
  try {
    const { token, userId } = await getToken();

    // Récupération du jeton CSRF
    const csrfToken = await getCsrfToken();

    const data = await apiRequest<RecipePredictionResponse>(
      "/admin/recipes/generate",
      {
        method: "POST",
        token,
        credentials: "include",
        headers: {
          ...buildHeaders(userId),
          "X-CSRF-TOKEN": csrfToken,
        },
        body: payload,
      },
    );

    return data!;
  } catch (error) {
    console.error("[RECIPES] ❌ generateAiRecipe:", error);
    throw error;
  }
}

/* ===================== MES RECETTES (création / modification / suppression) ===================== */

export type RecipeFormPayload = {
  name: string;
  description: string;
  servings: number;
  is_public: boolean;
  /** temps de cuisson (min) */
  duration?: number;
  /** temps de préparation (min) */
  time?: number;
  prep_time?: number;
  difficulty?: "easy" | "medium" | "hard";
  dish_type?: string;
  image?: string;
  diet_ids?: number[];
  ingredients?: Array<{ ingredient_id: number; quantity: number; unit?: string }>;
  steps?: string[];
};

/**
 * Le code du backend n'est pas fourni : pour la modification et la suppression
 * on essaie les routes les plus probables (convention déjà utilisée pour
 * l'utilisateur : /admin/user/{id}/edit). Dès qu'une route répond autre chose
 * que 404 / 405, c'est elle qui est utilisée.
 */
const UPDATE_ROUTES: Array<{ method: "PATCH" | "PUT"; path: (id: number) => string }> = [
  { method: "PATCH", path: (id) => `/admin/recipes/${id}/edit` },
  { method: "PUT", path: (id) => `/admin/recipes/${id}` },
  { method: "PATCH", path: (id) => `/admin/recipes/${id}` },
];
const DELETE_ROUTES: Array<(id: number) => string> = [
  (id) => `/admin/recipes/${id}/delete`,
  (id) => `/admin/recipes/${id}`,
];

function isMissingRoute(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 405);
}

async function authOptions() {
  const { token, userId } = await getToken();
  let csrf: string | undefined;
  try {
    csrf = await getCsrfToken();
  } catch {
    csrf = undefined;
  }
  return {
    token,
    credentials: "include" as const,
    headers: { ...buildHeaders(userId), ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}) },
  };
}

function extractRecipe(payload: unknown): RecipeFull | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const candidate = (data.recipe ?? data.data ?? data) as Record<string, unknown>;
  return candidate && typeof candidate.id === "number" ? (candidate as unknown as RecipeFull) : null;
}

export async function createMyRecipe(payload: RecipeFormPayload): Promise<RecipeFull | null> {
  const opts = await authOptions();
  const data = await apiRequest<unknown>("/admin/recipes/create", {
    method: "POST",
    ...opts,
    body: { ...payload, slug: generateSlug(payload.name) },
  });
  return extractRecipe(data);
}

export async function updateMyRecipe(
  recipeId: number,
  payload: RecipeFormPayload,
): Promise<RecipeFull | null> {
  const opts = await authOptions();
  let lastError: unknown = null;
  for (const route of UPDATE_ROUTES) {
    try {
      const data = await apiRequest<unknown>(route.path(recipeId), {
        method: route.method,
        ...opts,
        body: payload,
      });
      return extractRecipe(data);
    } catch (error) {
      if (!isMissingRoute(error)) throw error;
      lastError = error;
    }
  }
  throw new ApiError(
    "La modification de recette n'est pas encore disponible sur le serveur.",
    lastError instanceof ApiError ? lastError.status : 404,
    lastError,
  );
}

export async function deleteMyRecipe(recipeId: number): Promise<void> {
  const opts = await authOptions();
  let lastError: unknown = null;
  for (const path of DELETE_ROUTES) {
    try {
      await apiRequest(path(recipeId), { method: "DELETE", ...opts });
      return;
    } catch (error) {
      if (!isMissingRoute(error)) throw error;
      lastError = error;
    }
  }
  throw new ApiError(
    "La suppression de recette n'est pas encore disponible sur le serveur.",
    lastError instanceof ApiError ? lastError.status : 404,
    lastError,
  );
}
