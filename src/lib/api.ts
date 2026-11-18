const RAW_API_URL = process.env.EXPO_PUBLIC_API_URL;

export const API_BASE_URL =
  typeof RAW_API_URL === "string" && RAW_API_URL.trim().length > 0
    ? RAW_API_URL.trim().replace(/\/+$/, "")
    : "https://ymeal-back.osc-fr1.scalingo.io";

export class ApiError extends Error {
  status: number;
  details: unknown;
  /** Délai (secondes) avant de pouvoir réessayer, lu dans l'en-tête Retry-After (429). */
  retryAfter: number | null;

  constructor(message: string, status: number, details?: unknown, retryAfter: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

/** Messages par défaut des codes d'erreur que le front doit gérer. */
export const FORBIDDEN_MESSAGE = "Tu n'as pas les droits pour effectuer cette action.";
export const RECIPE_NOT_FOUND_MESSAGE = "Recette introuvable.";

/** 403 = connecté, mais pas le droit (ressource d'un autre, action réservée aux admins, CSRF invalide). */
export function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

/** 429 = trop de tentatives (connexion / inscription). */
export function isTooManyAttempts(error: unknown): boolean {
  return error instanceof ApiError && error.status === 429;
}

/** « Trop de tentatives, réessayez dans N minutes » à partir de Retry-After (secondes). */
export function tooManyAttemptsMessage(retryAfterSeconds: number | null | undefined): string {
  if (!retryAfterSeconds || retryAfterSeconds <= 0) {
    return "Trop de tentatives, réessayez dans quelques minutes.";
  }
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Trop de tentatives, réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}

/** Retry-After peut être un nombre de secondes ou une date HTTP. */
function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const date = Date.parse(value);
  if (!Number.isNaN(date)) return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  return null;
}

type ApiMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type ApiRequestOptions = {
  method?: ApiMethod;
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
};

function getErrorMessageFromPayload(payload: unknown): string | null {
  if (typeof payload === "string") {
    const sanitized = payload
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return sanitized.length > 0 ? sanitized.slice(0, 240) : null;
  }

  if (!payload || typeof payload !== "object") return null;

  const maybePayload = payload as Record<string, unknown>;
  const directKeys = [
    "message",
    "error",
    "detail",
    "description",
    "hydra:description",
    "title",
  ];

  for (const key of directKeys) {
    const value = maybePayload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  if (Array.isArray(maybePayload.errors) && maybePayload.errors.length > 0) {
    const firstError = maybePayload.errors[0];
    if (typeof firstError === "string") return firstError;

    if (firstError && typeof firstError === "object") {
      const message = (firstError as Record<string, unknown>).message;
      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }
    }
  }

  if (
    Array.isArray(maybePayload.violations) &&
    maybePayload.violations.length > 0
  ) {
    const firstViolation = maybePayload.violations[0];
    if (firstViolation && typeof firstViolation === "object") {
      const message = (firstViolation as Record<string, unknown>).message;
      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }
    }
  }

  return null;
}

async function parseResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const {
    method = "GET",
    body,
    token,
    headers = {},
    credentials = "omit",
  } = options;

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    credentials,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    const raw = getErrorMessageFromPayload(payload);
    let message = raw ?? `Erreur API (${response.status})`;
    let retryAfter: number | null = null;

    if (response.status === 403 && (!raw || /^forbidden$/i.test(raw.trim()))) {
      message = FORBIDDEN_MESSAGE;
    }
    if (response.status === 429) {
      retryAfter = parseRetryAfter(response.headers.get("Retry-After"));
      message = tooManyAttemptsMessage(retryAfter);
    }
    throw new ApiError(message, response.status, payload, retryAfter);
  }

  return payload as T;
}

export function getHumanErrorMessage(
  error: unknown,
  fallback = "Une erreur est survenue.",
): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message.trim().length > 0)
    return error.message;
  return fallback;
}
