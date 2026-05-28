// src/services/profile.ts

import { apiRequest } from "@/src/lib/api";
import { getCsrfToken, getSession } from "./auth";

const COOKIE_SESSION_TOKEN = "__cookie_session__";

async function getToken() {
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

async function buildPostHeaders(userId?: number): Promise<Record<string, string>> {
  const csrf = await getCsrfToken();
  return { ...buildHeaders(userId), "X-CSRF-TOKEN": csrf };
}

export type ReferenceItem = { id: number; name: string };

export type UserProfile = {
  diets: ReferenceItem[];
  allergies: ReferenceItem[];
  cuisines: ReferenceItem[];
  blacklist: ReferenceItem[];
  budget: { id: number | null; key: string | null; label: string | null; amount: number | null } | null;
  personCount: number | null;
};

export type BudgetOption = {
  id: number;
  key: string;
  label: string;
  amount: number;
};
// ============= FETCH TOUTES LES PREFS EN UNE FOIS =============

export async function getProfileRequest(): Promise<UserProfile> {
  const { token, userId } = await getToken();
  const headers = buildHeaders(userId);
  const opts = { method: "GET" as const, token, credentials: "include" as const, headers };

  const [diets, allergies, cuisines, blacklist, budget, personCount] = await Promise.all([
    apiRequest<ReferenceItem[]>("/admin/user/preferences/diets", opts).then(r => Array.isArray(r) ? r : []),
    apiRequest<ReferenceItem[]>("/admin/user/preferences/allergies", opts).then(r => Array.isArray(r) ? r : []),
    apiRequest<ReferenceItem[]>("/admin/user/preferences/favorite-cuisines", opts).then(r => Array.isArray(r) ? r : []),
    apiRequest<ReferenceItem[]>("/admin/user/preferences/blacklist", opts).then(r => Array.isArray(r) ? r : []),
    apiRequest<{ id: number | null; key: string | null; label: string | null; amount: number | null }>(
    "/admin/user/preferences/budget", opts
    ).then(r => r ?? null),    
    apiRequest<{ count: number | null }>("/admin/user/preferences/person-count", opts).then(r => r?.count ?? null),
  ]);

  return { diets, allergies, cuisines, blacklist, budget, personCount };
}

// ============= RÉFÉRENTIELS =============

export async function fetchAllDiets(): Promise<ReferenceItem[]> {
  try {
    const { token, userId } = await getToken();
    const result = await apiRequest<ReferenceItem[]>("/admin/reference/diets", {
      method: "GET", token, credentials: "include", headers: buildHeaders(userId),
    });
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error fetching diets:", error);
    return [];
  }
}

export async function fetchAllAllergies(): Promise<ReferenceItem[]> {
  try {
    const { token, userId } = await getToken();
    const result = await apiRequest<ReferenceItem[]>("/admin/reference/allergies", {
      method: "GET", token, credentials: "include", headers: buildHeaders(userId),
    });
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error fetching allergies:", error);
    return [];
  }
}

export async function fetchAllCuisines(): Promise<ReferenceItem[]> {
  try {
    const { token, userId } = await getToken();
    const result = await apiRequest<ReferenceItem[]>("/admin/reference/favorite-cuisines", {
      method: "GET", token, credentials: "include", headers: buildHeaders(userId),
    });
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error fetching cuisines:", error);
    return [];
  }
}

export async function searchIngredients(query: string): Promise<ReferenceItem[]> {
  if (query.trim().length < 3) return [];
  try {
    const { token, userId } = await getToken();
    const result = await apiRequest<ReferenceItem[]>(
      `/admin/reference/ingredients/search?q=${encodeURIComponent(query)}`,
      { method: "GET", token, credentials: "include", headers: buildHeaders(userId) }
    );
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error searching ingredients:", error);
    return [];
  }
}

export async function fetchAllBudgets(): Promise<BudgetOption[]> {
  try {
    const { token, userId } = await getToken();
    const result = await apiRequest<BudgetOption[]>("/admin/reference/budgets", {
      method: "GET", token, credentials: "include", headers: buildHeaders(userId),
    });
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return [];
  }
}
// ============= SAVE =============

export async function saveUserDiets(dietIds: number[]) {
  const { token, userId } = await getToken();
  return apiRequest("/admin/user/preferences/diets", {
    method: "POST", token, credentials: "include",
    headers: await buildPostHeaders(userId), body: { diet_ids: dietIds },
  });
}

export async function saveUserAllergies(allergyIds: number[]) {
  const { token, userId } = await getToken();
  return apiRequest("/admin/user/preferences/allergies", {
    method: "POST", token, credentials: "include",
    headers: await buildPostHeaders(userId), body: { allergy_ids: allergyIds },
  });
}

export async function saveUserCuisines(cuisineIds: number[]) {
  const { token, userId } = await getToken();
  return apiRequest("/admin/user/preferences/favorite-cuisines", {
    method: "POST", token, credentials: "include",
    headers: await buildPostHeaders(userId), body: { cuisine_ids: cuisineIds },
  });
}

export async function saveUserBlacklist(ingredientIds: number[]) {
  const { token, userId } = await getToken();
  return apiRequest("/admin/user/preferences/blacklist", {
    method: "POST", token, credentials: "include",
    headers: await buildPostHeaders(userId), body: { ingredient_ids: ingredientIds },
  });
}

export async function saveUserBudget(budgetId: number) {
  const { token, userId } = await getToken();
  return apiRequest("/admin/user/preferences/budget", {
    method: "POST", token, credentials: "include",
    headers: await buildPostHeaders(userId), body: { budget_id: budgetId },
  });
}
export async function saveUserPersonCount(count: number) {
  const { token, userId } = await getToken();
  return apiRequest("/admin/user/preferences/person-count", {
    method: "POST", token, credentials: "include",
    headers: await buildPostHeaders(userId), body: { count },
  });
}