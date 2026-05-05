import { ApiError, apiRequest } from "@/src/lib/api";
import { getSession } from "./auth";

const COOKIE_SESSION_TOKEN = "__cookie_session__";

export type BackendIngredient = {
  id: number;
  name: string;
  slug: string;
};

/* ===================== HELPER ===================== */

async function getToken(): Promise<{ token: string | undefined; userId: number | undefined }> {
  const session = await getSession();
  console.log("[FRIGO][AUTH] Session récupérée:", JSON.stringify(session));

  if (!session?.token) {
    console.error("[FRIGO][AUTH] ❌ Aucun token trouvé dans la session");
    throw new Error("Session utilisateur introuvable.");
  }

  const isCookie = session.token === COOKIE_SESSION_TOKEN;
  console.log("[FRIGO][AUTH] Mode auth:", isCookie ? "cookie" : "bearer token");

  return {
    token: isCookie ? undefined : session.token,
    userId: session.user?.id as number | undefined,
  };
}

/* ===================== API CALLS ===================== */

export async function getFrigoIngredients(): Promise<BackendIngredient[]> {
  console.log("[FRIGO] ▶️ getFrigoIngredients() appelé");
  try {
    const { token, userId } = await getToken();
    console.log("[FRIGO] GET /admin/frigo/ — token présent:", !!token, "userId:", userId);

    const ingredients = await apiRequest<BackendIngredient[]>("/admin/frigo/", {
      method: "GET",
      token,
      credentials: "include",
      headers: {
        ...(userId ? { "X-User-Id": String(userId) } : {}),
      },
    });

    console.log("[FRIGO] ✅ Réponse reçue:", JSON.stringify(ingredients));
    return ingredients ?? [];
  } catch (error) {
    const errorMsg = error instanceof ApiError ? error.message : String(error);
    console.error("[FRIGO] ❌ Erreur getFrigoIngredients:", errorMsg);
    throw error;
  }
}

export async function addIngredientToFrigo(ingredientId: string | number): Promise<void> {
  console.log("[FRIGO] ▶️ addIngredientToFrigo() appelé avec id:", ingredientId);
  try {
    const { token, userId } = await getToken();
    console.log("[FRIGO] POST /admin/frigo/" + ingredientId + " — token présent:", !!token, "userId:", userId);

    await apiRequest(`/admin/frigo/${ingredientId}`, {
      method: "POST",
      token,
      credentials: "include",
      headers: {
        ...(userId ? { "X-User-Id": String(userId) } : {}),
      },
    });

    console.log("[FRIGO] ✅ Ingrédient", ingredientId, "ajouté avec succès");
  } catch (error) {
    const errorMsg = error instanceof ApiError ? error.message : String(error);
    console.error("[FRIGO] ❌ Erreur addIngredientToFrigo:", errorMsg);
    throw error;
  }
}

export async function removeIngredientFromFrigo(ingredientId: string | number): Promise<void> {
  console.log("[FRIGO] ▶️ removeIngredientFromFrigo() appelé avec id:", ingredientId);
  try {
    const { token, userId } = await getToken();
    console.log("[FRIGO] DELETE /admin/frigo/" + ingredientId + " — token présent:", !!token, "userId:", userId);

    await apiRequest(`/admin/frigo/${ingredientId}`, {
      method: "DELETE",
      token,
      credentials: "include",
      headers: {
        ...(userId ? { "X-User-Id": String(userId) } : {}),
      },
    });

    console.log("[FRIGO] ✅ Ingrédient", ingredientId, "supprimé avec succès");
  } catch (error) {
    const errorMsg = error instanceof ApiError ? error.message : String(error);
    console.error("[FRIGO] ❌ Erreur removeIngredientFromFrigo:", errorMsg);
    throw error;
  }
}