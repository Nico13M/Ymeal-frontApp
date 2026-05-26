import { ApiError, apiRequest } from "@/src/lib/api";
import { getSession } from "@/src/services/auth";

const COOKIE_SESSION_TOKEN = "__cookie_session__";

export type ProfileConfigurationPayload = {
  diets: string[];
  location: string;
  budget: "PETIT" | "MOYEN" | "LARGE";
  cuisines: string[];
  avoidVeg: string[];
  allergies: string[];
  people: "1" | "2" | "3-4" | "5+";
};

function extractCsrfToken(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const data = payload as Record<string, unknown>;
  const nestedData =
    data.data && typeof data.data === "object" ? (data.data as Record<string, unknown>) : null;

  const candidates = [
    data.csrfToken,
    data.csrf_token,
    data.token,
    nestedData?.csrfToken,
    nestedData?.csrf_token,
    nestedData?.token,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

async function getCsrfToken(): Promise<string> {
  const payload = await apiRequest<unknown>("/admin/security/csrf-token", {
    method: "GET",
    credentials: "include",
  });

  const token = extractCsrfToken(payload);
  if (!token) {
    throw new Error("Jeton CSRF introuvable. Reessaye dans quelques instants.");
  }

  return token;
}

function buildPrimaryBody(payload: ProfileConfigurationPayload) {
  return {
    diets: payload.diets,
    location: payload.location,
    budget: payload.budget,
    cuisines: payload.cuisines,
    avoidVeg: payload.avoidVeg,
    allergies: payload.allergies,
    people: payload.people,
  };
}

function buildFallbackBody(payload: ProfileConfigurationPayload) {
  return {
    diets: payload.diets,
    location: payload.location,
    budget: payload.budget,
    cuisines: payload.cuisines,
    avoid_ingredients: payload.avoidVeg,
    allergies: payload.allergies,
    people_count: payload.people,
  };
}

export async function sendProfileConfiguration(payload: ProfileConfigurationPayload): Promise<void> {
  const session = await getSession();
  const token =
    session?.token && session.token !== COOKIE_SESSION_TOKEN ? session.token : undefined;

  if (!token) {
    throw new Error("Session utilisateur introuvable. Reconnecte-toi puis reessaie.");
  }

  const csrfToken = await getCsrfToken();

  try {
    await apiRequest("/admin/recipes/user/data/send", {
      method: "POST",
      token,
      headers: {
        "X-CSRF-TOKEN": csrfToken,
      },
      body: buildPrimaryBody(payload),
    });
  } catch (error) {
    if (!(error instanceof ApiError) || (error.status !== 400 && error.status !== 422)) {
      throw error;
    }

    await apiRequest("/admin/recipes/user/data/send", {
      method: "POST",
      token,
      headers: {
        "X-CSRF-TOKEN": csrfToken,
      },
      body: buildFallbackBody(payload),
    });
  }
}

