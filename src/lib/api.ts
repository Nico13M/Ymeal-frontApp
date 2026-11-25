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

export class ApiNetworkError extends Error {
  readonly originalError: unknown;

  constructor(originalError: unknown) {
    super("Impossible de contacter le serveur. Vérifie ta connexion et réessaie dans un instant.");
    this.name = "ApiNetworkError";
    this.originalError = originalError;
  }
}


// Messages d'erreur partagés
export const FORBIDDEN_MESSAGE =
  "Accès refusé. Tu n'as pas les autorisations nécessaires.";

export const RECIPE_NOT_FOUND_MESSAGE =
  "Cette recette est introuvable.";

// Détecter une erreur HTTP 403
export function isForbidden(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 403;
}

// Détecter une erreur HTTP 429
export function isTooManyAttempts(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 429;
}

// Lire le délai Retry-After envoyé par le serveur
export function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds);
  }

  const date = Date.parse(value);

  if (!Number.isNaN(date)) {
    return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  }

  return null;
}
// [https://ymeal-back.osc-fr1.scalingo.io](https://ymeal-back.osc-fr1.scalingo.io)

// Construire un message pour les erreurs 429
export function tooManyAttemptsMessage(
  retryAfter: number | null
): string {
  if (retryAfter === null) {
    return "Trop de tentatives. Réessaie dans quelques minutes.";
  }

  const minutes = Math.max(1, Math.ceil(retryAfter / 60));

  return `Trop de tentatives. Réessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.`;
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
    credentials = "include",
  } = options;

  const requestHeaders = new Headers({ Accept: "application/json", ...headers });
  // User IDs and a header named "Bearer" are not authentication credentials.
  requestHeaders.delete("X-User-Id");
  requestHeaders.delete("Bearer");

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const serializedBody = body !== undefined ? JSON.stringify(body) : undefined;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      credentials,
      body: serializedBody,
    });
  } catch (error) {
    // Browsers do not expose whether a failed fetch was blocked by CORS.
    // Do not retry writes: the server may already have processed the request.
    throw new ApiNetworkError(error);
  }

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
