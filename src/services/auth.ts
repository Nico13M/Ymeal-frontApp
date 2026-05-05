import AsyncStorage from "@react-native-async-storage/async-storage";

import { ApiError, apiRequest } from "@/src/lib/api";

const SESSION_KEY = "@ymeal/session";
const COOKIE_SESSION_TOKEN = "__cookie_session__";

export type AuthCredentials = {
  email: string;
  password: string;
};

export type RegisterPayload = AuthCredentials & {
  firstname: string;
  lastname: string;
  nickname?: string;
};

export type UserProfile = {
  id?: number | string;
  email?: string;
  [key: string]: unknown;
};

export type AuthSession = {
  token: string;
  user?: UserProfile | null;
  csrfToken?: string;
};

export type UpdateUserPayload = {
  firstname: string;
  lastname: string;
  email: string;
};

function getTokenFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const data = payload as Record<string, unknown>;
  const nestedData =
    data.data && typeof data.data === "object" ? (data.data as Record<string, unknown>) : null;

  const candidates = [
    data.token,
    data.access_token,
    data.accessToken,
    data.jwt,
    nestedData?.token,
    nestedData?.access_token,
    nestedData?.accessToken,
    nestedData?.jwt,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

function getUserFromPayload(payload: unknown): UserProfile | null {
  if (!payload || typeof payload !== "object") return null;

  const data = payload as Record<string, unknown>;
  const nestedData =
    data.data && typeof data.data === "object" ? (data.data as Record<string, unknown>) : null;

  const candidates = [data.user, nestedData?.user, nestedData, data];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object") {
      const maybeUser = candidate as Record<string, unknown>;
      if ("email" in maybeUser || "id" in maybeUser) {
        return maybeUser as UserProfile;
      }
    }
  }

  return null;
}

export function resolveUserId(user: UserProfile | null | undefined): string | number | null {
  if (!user || typeof user !== "object") return null;

  const candidates = [
    user.id,
    user.userId,
    user.user_id,
    user.idUser,
    user.id_user,
    user.userid,
    user.uid,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" || typeof candidate === "number") {
      const normalized = String(candidate).trim();
      if (normalized.length > 0) return candidate;
    }
  }

  return null;
}

function extractSession(payload: unknown): AuthSession | null {
  const token = getTokenFromPayload(payload);
  if (!token) return null;

  return {
    token,
    user: getUserFromPayload(payload),
  };
}

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
  console.log("[CSRF] Fetching fresh CSRF token from /admin/security/csrf-token");
  const payload = await apiRequest<unknown>("/admin/security/csrf-token", {
    method: "GET",
    credentials: "include",
  });

  console.log("[CSRF] Response payload:", payload);
  const token = extractCsrfToken(payload);
  if (!token) {
    console.error("[CSRF] Token extraction failed from payload:", payload);
    throw new Error("Jeton CSRF introuvable. Reessaye dans quelques instants.");
  }

  console.log("[CSRF] Token extracted successfully:", token.slice(0, 50) + "...");
  return token;
}

export async function loginRequest(credentials: AuthCredentials): Promise<AuthSession> {
  const payload = await apiRequest<unknown>("/admin/auth/login", {
    method: "POST",
    credentials: "include",
    body: credentials,
  });

  const session = extractSession(payload);
  if (session) return session;

  return {
    token: COOKIE_SESSION_TOKEN,
    user: getUserFromPayload(payload),
  };
}

export async function registerRequest(credentials: RegisterPayload): Promise<AuthSession | null> {
  const registerBody = {
    firstname: credentials.firstname,
    lastname: credentials.lastname,
    firstName: credentials.firstname,
    lastName: credentials.lastname,
    email: credentials.email,
    password: credentials.password,
  };

  const payload = await apiRequest<unknown>("/admin/auth/register", {
    method: "POST",
    credentials: "include",
    body: registerBody,
  });

  const session = extractSession(payload);
  if (!session) return null;

  return session;
}

export async function saveSession(session: AuthSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function getSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed || typeof parsed.token !== "string" || parsed.token.trim().length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function updateUserRequest(
  userId: string | number,
  payload: UpdateUserPayload,
  options?: {
    onDebug?: (message: string) => void;
  }
): Promise<void> {
  console.log("[UPDATE_USER] Starting user update for ID:", userId);
  
  const session = await getSession();
  if (!session?.token) {
    console.error("[UPDATE_USER] No session token found");
    throw new Error("Session utilisateur introuvable. Reconnecte-toi puis reessaie.");
  }

  console.log("[UPDATE_USER] Session token found:", session.token.slice(0, 20) + "...");

  const normalizedUserId = String(userId).trim();
  if (!normalizedUserId) {
    console.error("[UPDATE_USER] Invalid user ID");
    throw new Error("Identifiant utilisateur manquant.");
  }

  console.log("[UPDATE_USER] Step 1: Fetching fresh CSRF token");

  let csrfToken: string;
  try {
    csrfToken = await getCsrfToken();
    console.log("[UPDATE_USER] Step 2: CSRF token received");
  } catch (csrfError) {
    const csrfErrorMsg = csrfError instanceof Error ? csrfError.message : String(csrfError);
    console.error("[UPDATE_USER] CSRF fetch error:", csrfErrorMsg);
    throw csrfError;
  }

  console.log(`[UPDATE_USER] Step 3: Sending PATCH request to /admin/user/${normalizedUserId}/edit`);
  console.log("[UPDATE_USER] Request headers:", {
    "X-CSRF-TOKEN": csrfToken.slice(0, 50) + "...",
    "Content-Type": "application/json",
  });
  console.log("[UPDATE_USER] Request body:", {
    firstname: payload.firstname,
    lastname: payload.lastname,
    email: payload.email,
  });

  try {
    const response = await apiRequest(`/admin/user/${normalizedUserId}/edit`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "X-CSRF-TOKEN": csrfToken,
      },
      body: {
        firstname: payload.firstname,
        lastname: payload.lastname,
        firstName: payload.firstname,
        lastName: payload.lastname,
        email: payload.email,
      },
    });

    console.log("[UPDATE_USER] Step 4: PATCH successful, response:", response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[UPDATE_USER] PATCH error:", errorMessage);
    if (error instanceof ApiError) {
      console.error("[UPDATE_USER] ApiError details:", {
        status: error.status,
        details: error.details,
      });
      throw error;
    }

    throw new Error(errorMessage);
  }
}


