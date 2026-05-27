const RAW_API_URL = process.env.EXPO_PUBLIC_API_URL;

export const API_BASE_URL =
  typeof RAW_API_URL === "string" && RAW_API_URL.trim().length > 0
    ? RAW_API_URL.trim().replace(/\/+$/, "")
    : "https://ymeal-back.osc-fr1.scalingo.io";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
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
    const message =
      getErrorMessageFromPayload(payload) ?? `Erreur API (${response.status})`;
    throw new ApiError(message, response.status, payload);
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
