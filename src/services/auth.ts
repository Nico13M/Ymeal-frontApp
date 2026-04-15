import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiRequest } from '@/src/lib/api';

const SESSION_KEY = '@ymeal/session';

export type AuthCredentials = {
  email: string;
  password: string;
};

export type RegisterPayload = AuthCredentials & {
  firstname: string;
  lastname: string;
};

export type UserProfile = {
  id?: number | string;
  email?: string;
  [key: string]: unknown;
};

export type AuthSession = {
  token: string;
  user?: UserProfile | null;
};

const COOKIE_SESSION_TOKEN = '__cookie_session__';

function getTokenFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;

  const data = payload as Record<string, unknown>;
  const nestedData =
    data.data && typeof data.data === 'object'
      ? (data.data as Record<string, unknown>)
      : null;

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
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

function getUserFromPayload(payload: unknown): UserProfile | null {
  if (!payload || typeof payload !== 'object') return null;

  const data = payload as Record<string, unknown>;
  const nestedData =
    data.data && typeof data.data === 'object'
      ? (data.data as Record<string, unknown>)
      : null;

  const candidates = [data.user, nestedData?.user, nestedData, data];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object') {
      const maybeUser = candidate as Record<string, unknown>;
      if ('email' in maybeUser || 'id' in maybeUser) {
        return maybeUser as UserProfile;
      }
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

export async function loginRequest(credentials: AuthCredentials): Promise<AuthSession> {
  const payload = await apiRequest<unknown>('/admin/auth/login', {
    method: 'POST',
    body: credentials,
  });

  const session = extractSession(payload);
  if (session) {
    return session;
  }

  // Some backends authenticate with session cookies and do not return a JWT token.
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

  const payload = await apiRequest<unknown>('/admin/auth/register', {
    method: 'POST',
    body: registerBody,
  });

  return extractSession(payload);
}

export async function saveSession(session: AuthSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function getSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed || typeof parsed.token !== 'string' || parsed.token.trim().length === 0) {
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
