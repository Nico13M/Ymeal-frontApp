import { useEffect, useState } from "react";

import { CitySuggestion } from "@/types/profil";

const CITY_LOOKUP_LIMIT = 6;

const CITY_LOOKUP_MIN_CHARS = 2;

const CITY_LOOKUP_DEBOUNCE_MS = 280;

function buildCitySuggestions(
  payload: unknown
): CitySuggestion[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  const seen = new Set<string>();

  const suggestions: CitySuggestion[] = [];

  for (const item of payload) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<
      string,
      unknown
    >;

    const name =
      typeof record.nom === "string"
        ? record.nom.trim()
        : "";

    if (!name) {
      continue;
    }

    const codes = Array.isArray(
      record.codesPostaux
    )
      ? record.codesPostaux.filter(
          (
            value
          ): value is string =>
            typeof value === "string" &&
            value.trim().length > 0
        )
      : [];

    const postalCode =
      codes.length > 0
        ? codes[0].trim()
        : "";

    const label = postalCode
      ? `${name} (${postalCode})`
      : name;

    const value = postalCode
      ? `${name} ${postalCode}`
      : name;

    const code =
      typeof record.code === "string" &&
      record.code.trim().length > 0
        ? record.code.trim()
        : label.toLowerCase();

    const key = `${code}-${label.toLowerCase()}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    suggestions.push({
      id: key,
      label,
      value,
    });

    if (
      suggestions.length >=
      CITY_LOOKUP_LIMIT
    ) {
      break;
    }
  }

  return suggestions;
}

export default function useCityLookup(
  location: string,
  setLocation: (value: string) => void,
  step: number
) {
  const [
    citySuggestions,
    setCitySuggestions,
  ] = useState<CitySuggestion[]>([]);

  const [
    isCityLookupLoading,
    setIsCityLookupLoading,
  ] = useState(false);

  const [
    cityLookupError,
    setCityLookupError,
  ] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 2) {
      setCitySuggestions([]);

      setIsCityLookupLoading(false);

      setCityLookupError(null);

      return;
    }

    const query = location.trim();

    if (
      query.length <
      CITY_LOOKUP_MIN_CHARS
    ) {
      setCitySuggestions([]);

      setIsCityLookupLoading(false);

      setCityLookupError(null);

      return;
    }

    let cancelled = false;

    const timeoutId = setTimeout(
      async () => {
        try {
          setIsCityLookupLoading(true);

          setCityLookupError(null);

          const searchByPostal =
            /^\d{2,5}$/.test(query);

          const url = searchByPostal
            ? `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(
                query
              )}&fields=nom,code,codesPostaux&limit=${CITY_LOOKUP_LIMIT}`
            : `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(
                query
              )}&fields=nom,code,codesPostaux&boost=population&limit=${CITY_LOOKUP_LIMIT}`;

          const response = await fetch(
            url,
            {
              method: "GET",

              headers: {
                Accept:
                  "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              `City lookup failed (${response.status})`
            );
          }

          const payload =
            (await response.json()) as unknown;

          if (cancelled) {
            return;
          }

          setCitySuggestions(
            buildCitySuggestions(payload)
          );
        } catch {
          if (cancelled) {
            return;
          }

          setCitySuggestions([]);

          setCityLookupError(
            "Impossible de proposer des villes pour le moment."
          );
        } finally {
          if (!cancelled) {
            setIsCityLookupLoading(
              false
            );
          }
        }
      },
      CITY_LOOKUP_DEBOUNCE_MS
    );

    return () => {
      cancelled = true;

      clearTimeout(timeoutId);
    };
  }, [location, step]);

  const onSelectCity = (
    city: CitySuggestion
  ) => {
    setLocation(city.value);

    setCitySuggestions([]);

    setCityLookupError(null);
  };

  return {
    citySuggestions,
    setCitySuggestions,

    cityLookupError,
    setCityLookupError,

    isCityLookupLoading,

    onSelectCity,
  };
}
