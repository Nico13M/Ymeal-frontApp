import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import { tooManyAttemptsMessage } from "@/src/lib/api";

/**
 * Blocage temporaire après un 429 (trop de tentatives) sur la connexion
 * ou l'inscription. Le délai vient de l'en-tête Retry-After ; il est gardé en
 * mémoire locale pour qu'une actualisation de la page ne le contourne pas.
 * Aucune requête n'est relancée automatiquement.
 */
export default function useRateLimit(key: "login" | "register") {
  const storageKey = `@ymeal/rate_limit_${key}`;
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Restaure un blocage en cours (ex. après actualisation)
  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        const until = raw ? Number(raw) : NaN;
        if (Number.isFinite(until) && until > Date.now()) setBlockedUntil(until);
      })
      .catch(() => undefined);
  }, [storageKey]);

  // Compte à rebours (1 tic par seconde) tant que le blocage est actif
  useEffect(() => {
    if (!blockedUntil) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= blockedUntil) {
        setBlockedUntil(null);
        AsyncStorage.removeItem(storageKey).catch(() => undefined);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [blockedUntil, storageKey]);

  const block = useCallback(
    (retryAfterSeconds: number | null | undefined) => {
      // Sans Retry-After, on bloque 60 s par prudence
      const seconds = retryAfterSeconds && retryAfterSeconds > 0 ? retryAfterSeconds : 60;
      const until = Date.now() + seconds * 1000;
      setNow(Date.now());
      setBlockedUntil(until);
      AsyncStorage.setItem(storageKey, String(until)).catch(() => undefined);
    },
    [storageKey],
  );

  const remainingSeconds = blockedUntil ? Math.max(0, Math.ceil((blockedUntil - now) / 1000)) : 0;
  const isBlocked = remainingSeconds > 0;
  const countdown = `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  return {
    isBlocked,
    remainingSeconds,
    /** mm:ss restant, pour le bouton */
    countdown,
    /** « Trop de tentatives, réessayez dans N minutes » */
    message: isBlocked ? tooManyAttemptsMessage(remainingSeconds) : null,
    block,
  };
}
