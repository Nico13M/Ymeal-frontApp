import { ApiError, apiRequest } from "@/src/lib/api";
import { getSession } from "./auth";

const COOKIE_SESSION_TOKEN = "__cookie_session__";

export type RecipeIngredient = {
  id: number;
  name: string;
  quantity: number;
  unit: string | {
    id: number;
    name: string;
    symbol: string;
  } | null;
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

export type RecipeAuthor = {
  id: number;
  name: string;
  email: string;
};

export type RecipeNutrition = {
  diets: RecipeDiet[];
  ingredients: RecipeIngredient[];
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
  steps?: string[]; // Pour les étapes de préparation (si disponibles)
};

export type RecipeMinimal = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  description: string;
  servings: number;
  difficulty: string | null;
  timing: {
    duration: number | null;
    prep_time: number | null;
  };
  author: string;
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

/* ===================== HELPER ===================== */

async function getToken(): Promise<{ token: string | undefined; userId: number | undefined }> {
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
    const data = await apiRequest<RecipeFull[]>("/admin/recipes/index", {
      method: "GET",
      token,
      credentials: "include",
      headers: buildHeaders(userId),
    });
    console.log(data)
    return data ?? [];
  } catch (error) {
    console.error("[RECIPES] getRecipes:", error instanceof ApiError ? error.message : error);
    throw error;
  }
}

export async function getRecipe(recipeId: number): Promise<RecipeFull> {
  try {
    const { token, userId } = await getToken();
    const data = await apiRequest<RecipeFull>(`/admin/recipes/${recipeId}`, {
      method: "GET",
      token,
      credentials: "include",
      headers: buildHeaders(userId),
    });
    return data!;
  } catch (error) {
    console.error("[RECIPES] ❌ getRecipe:", error instanceof ApiError ? error.message : error);
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
    if (params.servings) queryParams.append("servings", params.servings.toString());
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
    console.error("[RECIPES] ❌ searchRecipes:", error instanceof ApiError ? error.message : error);
    throw error;
  }
}

export async function getFavorites(): Promise<RecipeMinimal[]> {
  try {
    const { token, userId } = await getToken();
    const data = await apiRequest<RecipeMinimal[]>("/admin/recipes/favorites", {
      method: "GET",
      token,
      credentials: "include",
      headers: buildHeaders(userId),
    });
    return data ?? [];
  } catch (error) {
    console.error("[RECIPES] ❌ getFavorites:", error instanceof ApiError ? error.message : error);
    throw error;
  }
}

export async function addToFavorites(recipeId: number): Promise<void> {
  try {
    const { token, userId } = await getToken();
    await apiRequest(`/admin/recipes/${recipeId}/favorite`, {
      method: "POST",
      token,
      credentials: "include",
      headers: buildHeaders(userId),
    });
  } catch (error) {
    console.error("[RECIPES] ❌ addToFavorites:", error instanceof ApiError ? error.message : error);
    throw error;
  }
}

export async function removeFromFavorites(recipeId: number): Promise<void> {
  try {
    const { token, userId } = await getToken();
    await apiRequest(`/admin/recipes/${recipeId}/favorite`, {
      method: "DELETE",
      token,
      credentials: "include",
      headers: buildHeaders(userId),
    });
  } catch (error) {
    console.error("[RECIPES] ❌ removeFromFavorites:", error instanceof ApiError ? error.message : error);
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
  ingredients?: Array<{ ingredient_id: number; quantity: number; unit?: string }>;
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
    console.error("[RECIPES] ❌ createRecipe:", error instanceof ApiError ? error.message : error);
    throw error;
  }
}
