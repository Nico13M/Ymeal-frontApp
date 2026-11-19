import { ApiError, apiRequest } from "@/src/lib/api";
import { getCsrfToken, getSession } from "./auth";

const COOKIE_SESSION_TOKEN = "__cookie_session__";
export type BackendUnit = {
  id: number;
  name: string;
  symbol: string;
};


export type BackendIngredient = {
  id: number;
  name: string;
  image: string;
  category: string;
  slug: string;
};

export type BackendFrigoIngredient = {
  id: number;
  name: string;
  image: string;
  category: string;
  slug: string;
  quantity: number;
  unit: BackendUnit | null;
};

// Pour une v2 
// export type BackendIngredientCreate = {
//   name: string;
//   category?: string;
//   image?: string;
// };

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

/** Accepte un tableau ou une réponse paginée ({ data | items | ingredients: [...] }). */
function extractIngredientList(payload: unknown): BackendIngredient[] {
  if (Array.isArray(payload)) return payload as BackendIngredient[];
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    for (const key of ["data", "items", "ingredients", "results", "hydra:member"]) {
      const v = p[key];
      if (Array.isArray(v)) return v as BackendIngredient[];
      if (v && typeof v === "object") {
        const nested = extractIngredientList(v);
        if (nested.length) return nested;
      }
    }
  }
  return [];
}

/**
 * Tous les ingrédients de la BDD.
 * Le serveur n'en renvoie que 10 par défaut : on demande une grande page,
 * puis on parcourt les pages suivantes tant qu'il en arrive de nouveaux.
 */
export async function getAvailableIngredients(): Promise<BackendIngredient[]> {
  const PAGE_SIZE = 500;
  const MAX_PAGES = 100;
  try {
    const { token, userId } = await getToken();
    const byId = new Map<number, BackendIngredient>();

    for (let page = 1; page <= MAX_PAGES; page++) {
      const query = `?page=${page}&limit=${PAGE_SIZE}&per_page=${PAGE_SIZE}&itemsPerPage=${PAGE_SIZE}`;
      const payload = await apiRequest<unknown>(`/admin/frigo/ingredients${query}`, {
        method: "GET",
        token,
        credentials: "include",
        headers: buildHeaders(userId),
      });
      const list = extractIngredientList(payload);
      const before = byId.size;
      list.forEach((ing) => {
        if (ing && typeof ing.id === "number") byId.set(ing.id, ing);
      });
      // Arrêt : page vide, aucun nouvel ingrédient (le serveur ignore la pagination)
      if (list.length === 0 || byId.size === before) break;
    }

    return Array.from(byId.values());
  } catch (error) {
    console.error("[FRIGO] ❌ getAvailableIngredients:", error instanceof ApiError ? error.message : error);
    throw error;
  }
}

export async function searchAvailableIngredients(
  query: string,
): Promise<BackendIngredient[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length === 0) {
    return [];
  }

  try {
    const { token, userId } = await getToken();
    const data = await apiRequest<BackendIngredient[]>(
      `/admin/frigo/ingredients/search?query=${encodeURIComponent(trimmedQuery)}`,
      {
        method: "GET",
        token,
        credentials: "include",
        headers: buildHeaders(userId),
      },
    );
    return data ?? [];
  } catch (error) {
    console.error(
      "[FRIGO] ❌ searchAvailableIngredients:",
      error instanceof ApiError ? error.message : error,
    );
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

export async function updateIngredientQuantity(
    ingredientId: number,
    quantity: number,
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
    console.error("[FRIGO] ❌ updateIngredientQuantity:", error instanceof ApiError ? error.message : error);
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

/**
 * Création d'un ingrédient « perso » dans la BDD (s'il n'existe pas dans la liste).
 * L'écriture d'ingrédients est réservée aux administrateurs : un utilisateur
 * normal reçoit un 403, que l'écran Frigo transforme en message clair.
 */
export type BackendIngredientCreate = {
  name: string;
  category?: string;
  image?: string;
};

export async function createIngredient(data: BackendIngredientCreate): Promise<BackendIngredient> {
  try {
    const { token, userId } = await getToken();
    let csrfToken: string | undefined;
    try {
      csrfToken = await getCsrfToken();
    } catch {
      csrfToken = undefined;
    }
    const result = await apiRequest<unknown>("/admin/ingredients/create", {
      method: "POST",
      token,
      credentials: "include",
      headers: {
        ...buildHeaders(userId),
        ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {}),
      },
      body: data,
    });
    const r = result as Record<string, any> | null;
    const created = (r?.ingredient ?? r?.data ?? r) as BackendIngredient | null;
    if (!created || typeof created.id !== "number") {
      throw new Error("Réponse inattendue du serveur lors de la création de l'ingrédient.");
    }
    return created;
  } catch (error) {
    console.error("[FRIGO] ❌ createIngredient:", error instanceof ApiError ? error.message : error);
    throw error;
  }
}
