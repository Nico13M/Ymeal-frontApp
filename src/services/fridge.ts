import { ApiError, apiRequest } from "@/src/lib/api";
import { getSession } from "./auth";

const COOKIE_SESSION_TOKEN = "__cookie_session__";
export type BackendUnit = {
  id: number;
  name: string;
  symbol: string;
};


export type BackendIngredient = {
  id: number;
  name: string;
  slug: string;
};

export type BackendFrigoIngredient = {
  id: number;
  name: string;
  slug: string;
  quantity: number;
  unit: BackendUnit | null;
};


/* ===================== HELPER ===================== */

export async function getUnits(): Promise<BackendUnit[]> {
  try {
    const { token, userId } = await getToken();
    const data = await apiRequest<BackendUnit[]>("/admin/units/index", {
      method: "GET",
      token,
      credentials: "include",
      headers: buildHeaders(userId),
    });
    
    return data ?? [];
  } catch (error) {
    console.error("[UNITS] ❌ getUnits:", error instanceof ApiError ? error.message : error);
    throw error;
  }
}

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

export async function getAvailableIngredients(): Promise<BackendIngredient[]> {
  try {
    const { token, userId } = await getToken();
    const data = await apiRequest<BackendIngredient[]>("/admin/frigo/ingredients", {
      method: "GET",
      token,
      credentials: "include",
      headers: buildHeaders(userId),
    });
    return data ?? [];
  } catch (error) {
    console.error("[FRIGO] ❌ getAvailableIngredients:", error instanceof ApiError ? error.message : error);
    throw error;
  }
}

export async function getFrigoIngredients(): Promise<BackendFrigoIngredient[]> {
  try {
    const { token, userId } = await getToken();
    const data = await apiRequest<BackendFrigoIngredient[]>("/admin/frigo/", {
      method: "GET",
      token,
      credentials: "include",
      headers: buildHeaders(userId),
    });
    return data ?? [];
  } catch (error) {
    console.error("[FRIGO] ❌ getFrigoIngredients:", error instanceof ApiError ? error.message : error);
    throw error;
  }
}

export async function addIngredientToFrigo(
  ingredientId: number,
  quantity: number = 1,
  unitId?: number
): Promise<BackendFrigoIngredient> {
  try {
    const { token, userId } = await getToken();
    const data = await apiRequest<BackendFrigoIngredient>(`/admin/frigo/${ingredientId}`, {
      method: "POST",
      token,
      credentials: "include",
      headers: buildHeaders(userId),
      body: { quantity, unit_id: unitId ?? null },
    });
    return data!;
  } catch (error) {
    console.error("[FRIGO] ❌ addIngredientToFrigo:", error instanceof ApiError ? error.message : error);
    throw error;
  }
}

export async function removeIngredientFromFrigo(ingredientId: number): Promise<void> {
  try {
    const { token, userId } = await getToken();
    await apiRequest(`/admin/frigo/${ingredientId}`, {
      method: "DELETE",
      token,
      credentials: "include",
      headers: buildHeaders(userId),
    });
  } catch (error) {
    console.error("[FRIGO] ❌ removeIngredientFromFrigo:", error instanceof ApiError ? error.message : error);
    throw error;
  }
}