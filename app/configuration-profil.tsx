import { ALLERGIES, COLORS, CUISINES, DIETS, VEGETABLES } from "@/constants/profileConfig";
import { STORAGE_KEYS } from "@/constants/storage";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
 
import { getHumanErrorMessage } from "@/src/lib/api";
import { sendProfileConfiguration } from "@/src/services/profile-config";
 
type BudgetChoice = "PETIT" | "MOYEN" | "LARGE";
type PeopleChoice = "1" | "2" | "3-4" | "5+";
type StoredProfileConfig = {
  diets?: string[];
  location?: string;
  budget?: BudgetChoice | null;
  cuisines?: string[];
  avoidVeg?: string[];
  avoid_ingredients?: string[];
  allergies?: string[];
  people?: PeopleChoice | null;
  people_count?: PeopleChoice | null;
};
type CitySuggestion = {
  id: string;
  label: string;
  value: string;
};
 
const CITY_LOOKUP_LIMIT = 6;
const CITY_LOOKUP_MIN_CHARS = 2;
const CITY_LOOKUP_DEBOUNCE_MS = 280;
 
function uniqAdd(list: string[], value: string) {
  const v = value.trim();
  if (!v) return list;
  if (list.some((x) => x.toLowerCase() === v.toLowerCase())) return list;
  return [...list, v];
}
 
function removeAt(list: string[], idx: number) {
  return list.filter((_, i) => i !== idx);
}
 
function sanitizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
 
function buildCitySuggestions(payload: unknown): CitySuggestion[] {
  if (!Array.isArray(payload)) return [];
 
  const seen = new Set<string>();
  const suggestions: CitySuggestion[] = [];
 
  for (const item of payload) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
 
    const name = typeof record.nom === "string" ? record.nom.trim() : "";
    if (!name) continue;
 
    const codes = Array.isArray(record.codesPostaux)
      ? record.codesPostaux.filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0
        )
      : [];
 
    const postalCode = codes.length > 0 ? codes[0].trim() : "";
    const label = postalCode ? `${name} (${postalCode})` : name;
    const value = postalCode ? `${name} ${postalCode}` : name;
 
    const code =
      typeof record.code === "string" && record.code.trim().length > 0
        ? record.code.trim()
        : label.toLowerCase();
 
    const key = `${code}-${label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
 
    suggestions.push({ id: key, label, value });
    if (suggestions.length >= CITY_LOOKUP_LIMIT) break;
  }
 
  return suggestions;
}
 
export default function ConfigurationProfilScreen() {
  const TOTAL_STEPS = 7;
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(0);
  const [diets, setDiets] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState<BudgetChoice | null>(null);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [avoidVeg, setAvoidVeg] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [people, setPeople] = useState<PeopleChoice | null>(null);
  const [vegQuery, setVegQuery] = useState("");
  const [allergyQuery, setAllergyQuery] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [isCityLookupLoading, setIsCityLookupLoading] = useState(false);
  const [cityLookupError, setCityLookupError] = useState<string | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
 
  useEffect(() => {
    let cancelled = false;
 
    const loadExistingConfig = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.profileConfig);
        if (!raw || cancelled) return;
 
        const parsed = JSON.parse(raw) as StoredProfileConfig;
        if (!parsed || typeof parsed !== "object") return;
 
        const parsedDiets = sanitizeStringList(parsed.diets);
        const parsedLocation =
          typeof parsed.location === "string" ? parsed.location.trim() : "";
        const parsedBudget =
          parsed.budget === "PETIT" ||
          parsed.budget === "MOYEN" ||
          parsed.budget === "LARGE"
            ? parsed.budget
            : null;
        const parsedCuisines = sanitizeStringList(parsed.cuisines);
        const parsedAvoidVeg = sanitizeStringList(parsed.avoidVeg);
        const parsedAvoid =
          parsedAvoidVeg.length > 0
            ? parsedAvoidVeg
            : sanitizeStringList(parsed.avoid_ingredients);
        const parsedAllergies = sanitizeStringList(parsed.allergies);
        const parsedPeople =
          parsed.people === "1" ||
          parsed.people === "2" ||
          parsed.people === "3-4" ||
          parsed.people === "5+"
            ? parsed.people
            : parsed.people_count === "1" ||
                parsed.people_count === "2" ||
                parsed.people_count === "3-4" ||
                parsed.people_count === "5+"
              ? parsed.people_count
              : null;
 
        if (parsedDiets.length > 0) setDiets(parsedDiets);
        if (parsedLocation) setLocation(parsedLocation);
        if (parsedBudget) setBudget(parsedBudget);
        if (parsedCuisines.length > 0) setCuisines(parsedCuisines);
        if (parsedAvoid.length > 0) setAvoidVeg(parsedAvoid);
        if (parsedAllergies.length > 0) setAllergies(parsedAllergies);
        if (parsedPeople) setPeople(parsedPeople);
      } catch {
        // Ignore broken local cache and let user continue manually.
      }
    };
 
    loadExistingConfig();
 
    return () => {
      cancelled = true;
    };
  }, []);
 
  const progress = useMemo(() => (step <= 0 ? 0 : step >= 8 ? 1 : step / TOTAL_STEPS), [step]);
 
  const canContinue = useMemo(() => {
    if (step === 1) return diets.length > 0;
    if (step === 2) return location.trim().length >= 3;
    if (step === 3) return !!budget;
    if (step === 4) return cuisines.length > 0;
    if (step === 7) return !!people;
    return true;
  }, [step, diets, location, budget, cuisines, people]);
 
  const toggleCuisine = (c: string) => {
    setCuisines((prev) => {
      const exists = prev.includes(c);
      if (exists) return prev.filter((x) => x !== c);
      if (prev.length >= 3) return prev;
      return [...prev, c];
    });
  };
 
  const toggleDiet = (key: string) => {
    setDiets((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };
 
  const next = async () => {
    setSaveError(null);
    if (!canContinue) return;
 
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step >= 1 && step <= 6) {
      setStep((s) => (s + 1) as any);
      return;
    }
    if (step === 7) {
      setStep(8);
      return;
    }
    if (step === 8) {
      if (isSavingConfig) return;
      if (!budget || !people) return;
 
      const payload = {
        diets,
        location: location.trim(),
        budget,
        cuisines,
        avoidVeg,
        allergies,
        people,
      };
 
      try {
        setIsSavingConfig(true);
        await AsyncStorage.setItem(STORAGE_KEYS.profileConfig, JSON.stringify(payload));
        try {
          await sendProfileConfiguration(payload);
        } catch (error) {
          const message = getHumanErrorMessage(error, "");
          console.warn("Profile sync warning:", message);
        }
        router.replace("/(tabs)");
      } catch (error) {
        setSaveError(
          getHumanErrorMessage(error, "Impossible d'enregistrer ton profil pour le moment.")
        );
      } finally {
        setIsSavingConfig(false);
      }
    }
  };
 
  const goBack = () => {
    if (step > 0) {
      setStep((s) => (s - 1) as any);
    }
  };
 
  const vegSuggestions = useMemo(() => {
    if (step !== 5) return [];
    const q = vegQuery.trim().toLowerCase();
    if (!q) return [];
    return VEGETABLES.filter(
      (v) =>
        v.toLowerCase().includes(q) &&
        !avoidVeg.some((x) => x.toLowerCase() === v.toLowerCase())
    ).slice(0, 6);
  }, [step, vegQuery, avoidVeg]);
 
  const allergySuggestions = useMemo(() => {
    if (step !== 6) return [];
    const q = allergyQuery.trim().toLowerCase();
    if (!q) return [];
    return ALLERGIES.filter(
      (a) =>
        a.toLowerCase().includes(q) &&
        !allergies.some((x) => x.toLowerCase() === a.toLowerCase())
    ).slice(0, 6);
  }, [step, allergyQuery, allergies]);
 
  useEffect(() => {
    if (step !== 2) {
      setCitySuggestions([]);
      setIsCityLookupLoading(false);
      setCityLookupError(null);
      return;
    }
 
    const query = location.trim();
    if (query.length < CITY_LOOKUP_MIN_CHARS) {
      setCitySuggestions([]);
      setIsCityLookupLoading(false);
      setCityLookupError(null);
      return;
    }
 
    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        setIsCityLookupLoading(true);
        setCityLookupError(null);
 
        const searchByPostal = /^\d{2,5}$/.test(query);
        const url = searchByPostal
          ? `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(
              query
            )}&fields=nom,code,codesPostaux&limit=${CITY_LOOKUP_LIMIT}`
          : `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(
              query
            )}&fields=nom,code,codesPostaux&boost=population&limit=${CITY_LOOKUP_LIMIT}`;
 
        const response = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
 
        if (!response.ok) {
          throw new Error(`City lookup failed (${response.status})`);
        }
 
        const payload = (await response.json()) as unknown;
        if (cancelled) return;
        setCitySuggestions(buildCitySuggestions(payload));
      } catch {
        if (cancelled) return;
        setCitySuggestions([]);
        setCityLookupError("Impossible de proposer des villes pour le moment.");
      } finally {
        if (!cancelled) {
          setIsCityLookupLoading(false);
        }
      }
    }, CITY_LOOKUP_DEBOUNCE_MS);
 
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [location, step]);
 
  const onSelectCity = (city: CitySuggestion) => {
    setLocation(city.value);
    setCitySuggestions([]);
    setCityLookupError(null);
  };
 
  const addVeg = (v: string) => {
    setAvoidVeg((prev) => uniqAdd(prev, v));
    setVegQuery("");
  };
  const addAllergy = (a: string) => {
    setAllergies((prev) => uniqAdd(prev, a));
    setAllergyQuery("");
  };
 
  return (
<SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
<KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        enabled={Platform.OS === "ios"}
>
<ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="always"
          scrollEventThrottle={16}
>
<View style={styles.screen}>
<View style={styles.header}>
<Text style={styles.headerTitle}>Personnalise ton profil</Text>
<Text style={styles.headerStep}>
                {step === 0 ? `0/${TOTAL_STEPS}` : step >= 8 ? `${TOTAL_STEPS}/${TOTAL_STEPS}` : `${step}/${TOTAL_STEPS}`}
</Text>
</View>
<View style={styles.progressTrack}>
<View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
</View>
<View style={styles.cardContainer}>
<View style={styles.card}>
                {step > 0 && (
<TouchableOpacity onPress={goBack} style={styles.backButton}>
<Ionicons name="arrow-back" size={20} color={COLORS.text} />
<Text style={styles.backText}>Retour</Text>
</TouchableOpacity>
                )}
 
                {/* ── Étape 0 : Bienvenue ── */}
                {step === 0 && (
<View style={styles.welcomeContainer}>
<View style={styles.welcomeHero}>
<View style={styles.welcomeIcon}>
<Ionicons name="sparkles" size={28} color="#fff" />
</View>
<Text style={styles.welcomeTitle}>Bienvenue sur Ymeal</Text>
<Text style={styles.welcomeSubtitle}>
                        On va te poser quelques questions rapides pour adapter les recettes à ton
                        budget, ton régime et tes goûts.
</Text>
</View>
</View>
                )}
 
                {/* ── Étape 1 : Régime ── */}
                {step === 1 && (
<>
<View style={styles.questionRow}>
<Ionicons name="leaf-outline" size={18} color={COLORS.orange} />
<Text style={styles.question}>Quel est ton régime alimentaire ?</Text>
</View>
<Text style={styles.helper}>Tu peux en sélectionner plusieurs.</Text>
<View style={styles.grid}>
                      {DIETS.map((d) => {
                        const selected = diets.includes(d.key);
                        return (
<TouchableOpacity
                            key={d.key}
                            onPress={() => toggleDiet(d.key)}
                            activeOpacity={0.85}
                            style={[styles.tile, selected && styles.tileSelected]}
>
<Text style={styles.tileEmoji}>{d.icon}</Text>
<Text style={[styles.tileText, selected && styles.tileTextSelected]}>
                              {d.label}
</Text>
</TouchableOpacity>
                        );
                      })}
</View>
</>
                )}
 
                {/* ── Étape 2 : Localisation ── */}
                {step === 2 && (
<>
<View style={styles.questionRow}>
<Ionicons name="location-outline" size={18} color={COLORS.orange} />
<Text style={styles.question}>Où habites-tu ?</Text>
</View>
<Text style={styles.label}>Ville ou code postal</Text>
<View style={styles.inputWrap}>
<Ionicons name="location-outline" size={18} color={COLORS.muted} />
<TextInput
                        key={`location-step-${step}`}
                        value={location}
                        onChangeText={(value) => {
                          setLocation(value);
                          if (cityLookupError) setCityLookupError(null);
                        }}
                        placeholder="ex: Paris ou 84300"
                        style={styles.input}
                        returnKeyType="next"
                        blurOnSubmit={false}
                      />
</View>
                    {isCityLookupLoading ? (
<Text style={styles.lookupStateText}>Recherche de villes...</Text>
                    ) : null}
                    {citySuggestions.length > 0 && (
<View style={styles.suggestions}>
                        {citySuggestions.map((city) => (
<Pressable
                            key={city.id}
                            onPress={() => onSelectCity(city)}
                            style={styles.suggestionItem}
>
<Text style={styles.suggestionText}>{city.label}</Text>
<Ionicons name="arrow-up-circle-outline" size={18} color={COLORS.orange} />
</Pressable>
                        ))}
</View>
                    )}
                    {cityLookupError ? (
<Text style={styles.lookupErrorText}>{cityLookupError}</Text>
                    ) : null}
<Text style={styles.note}>
                      Nous utiliserons cette information pour te proposer des bons plans près de chez toi.
</Text>
</>
                )}
 
                {/* ── Étape 3 : Budget ── */}
                {step === 3 && (
<>
<View style={styles.questionRow}>
<Ionicons name="wallet-outline" size={18} color={COLORS.orange} />
<Text style={styles.question}>Quel est ton budget mensuel ?</Text>
</View>
<View style={{ marginTop: 8 }}>
<Pressable
                        onPress={() => setBudget("PETIT")}
                        style={[styles.choiceRow, budget === "PETIT" && styles.choiceRowSelected]}
>
<Text style={styles.choiceIcon}>💰</Text>
<View style={{ flex: 1 }}>
<Text style={styles.choiceTitle}>Petit budget</Text>
<Text style={styles.choiceSub}>&lt; 100€/mois</Text>
</View>
</Pressable>
<Pressable
                        onPress={() => setBudget("MOYEN")}
                        style={[styles.choiceRow, budget === "MOYEN" && styles.choiceRowSelected]}
>
<Text style={styles.choiceIcon}>💵</Text>
<View style={{ flex: 1 }}>
<Text style={styles.choiceTitle}>Budget moyen</Text>
<Text style={styles.choiceSub}>100-200€/mois</Text>
</View>
</Pressable>
<Pressable
                        onPress={() => setBudget("LARGE")}
                        style={[styles.choiceRow, budget === "LARGE" && styles.choiceRowSelected]}
>
<Text style={styles.choiceIcon}>💸</Text>
<View style={{ flex: 1 }}>
<Text style={styles.choiceTitle}>Budget large</Text>
<Text style={styles.choiceSub}>&gt; 200€/mois</Text>
</View>
</Pressable>
</View>
</>
                )}
 
                {/* ── Étape 4 : Cuisines ── */}
                {step === 4 && (
<>
<View style={styles.questionRow}>
<Ionicons name="restaurant-outline" size={18} color={COLORS.orange} />
<Text style={styles.question}>As-tu une alimentation favorite ?</Text>
</View>
<Text style={styles.helper}>Choisis jusqu'à 3 styles de cuisine.</Text>
<View style={styles.chipsWrap}>
                      {CUISINES.map((c) => {
                        const selected = cuisines.includes(c);
                        const atLimit = !selected && cuisines.length >= 3;
                        return (
<Pressable
                            key={c}
                            onPress={() => toggleCuisine(c)}
                            style={[
                              styles.chip,
                              selected && styles.chipSelected,
                              atLimit && styles.chipDisabled,
                            ]}
>
<Text
                              style={[
                                styles.chipText,
                                selected && styles.chipTextSelected,
                                atLimit && styles.chipTextDisabled,
                              ]}
>
                              {c}
</Text>
</Pressable>
                        );
                      })}
</View>
<Text style={styles.helper}>Sélectionné: {cuisines.length}/3</Text>
</>
                )}
 
                {/* ── Étape 5 : Ingrédients à éviter ── */}
                {step === 5 && (
<>
<View style={styles.questionRow}>
<Ionicons name="alert-circle-outline" size={18} color={COLORS.orange} />
<Text style={styles.question}>Y a-t-il des ingrédients que tu veux éviter ?</Text>
</View>
<Text style={styles.helper}>Tape quelques lettres et sélectionne. Plusieurs possibles.</Text>
<View style={styles.inputWrap}>
<TextInput
                        key={`veg-step-${step}`}
                        value={vegQuery}
                        onChangeText={setVegQuery}
                        placeholder="ex: bro..."
                        style={styles.input}
                        returnKeyType="next"
                        blurOnSubmit={false}
                      />
</View>
                    {vegSuggestions.length > 0 && (
<View style={styles.suggestions}>
                        {vegSuggestions.map((v) => (
<Pressable key={v} onPress={() => addVeg(v)} style={styles.suggestionItem}>
<Text style={styles.suggestionText}>{v}</Text>
<Ionicons name="add" size={18} color={COLORS.orange} />
</Pressable>
                        ))}
</View>
                    )}
                    {avoidVeg.length > 0 && (
<View style={styles.selectedWrap}>
                        {avoidVeg.map((v, idx) => (
<Pressable
                            key={`${v}-${idx}`}
                            onPress={() => setAvoidVeg((prev) => removeAt(prev, idx))}
                            style={styles.selectedChip}
>
<Text style={styles.selectedChipText}>{v}</Text>
<Ionicons name="close" size={14} color={COLORS.orange} />
</Pressable>
                        ))}
</View>
                    )}
</>
                )}
 
                {/* ── Étape 6 : Allergies ── */}
                {step === 6 && (
<>
<View style={styles.questionRow}>
<Ionicons name="medkit-outline" size={18} color={COLORS.orange} />
<Text style={styles.question}>As-tu des allergies ?</Text>
</View>
<Text style={styles.helper}>Même système: recherche + multi-sélection.</Text>
<View style={styles.inputWrap}>
<Ionicons name="search" size={18} color={COLORS.muted} />
<TextInput
                        key={`allergy-step-${step}`}
                        value={allergyQuery}
                        onChangeText={setAllergyQuery}
                        placeholder="ex: gluten..."
                        style={styles.input}
                        returnKeyType="next"
                        blurOnSubmit={false}
                      />
</View>
                    {allergySuggestions.length > 0 && (
<View style={styles.suggestions}>
                        {allergySuggestions.map((a) => (
<Pressable key={a} onPress={() => addAllergy(a)} style={styles.suggestionItem}>
<Text style={styles.suggestionText}>{a}</Text>
<Ionicons name="add" size={18} color={COLORS.orange} />
</Pressable>
                        ))}
</View>
                    )}
                    {allergies.length > 0 && (
<View style={styles.selectedWrap}>
                        {allergies.map((a, idx) => (
<Pressable
                            key={`${a}-${idx}`}
                            onPress={() => setAllergies((prev) => removeAt(prev, idx))}
                            style={styles.selectedChip}
>
<Text style={styles.selectedChipText}>{a}</Text>
<Ionicons name="close" size={14} color={COLORS.orange} />
</Pressable>
                        ))}
</View>
                    )}
</>
                )}
 
                {/* ── Étape 7 : Nombre de personnes ── */}
                {step === 7 && (
<>
<View style={styles.questionRow}>
<Ionicons name="people-outline" size={18} color={COLORS.orange} />
<Text style={styles.question}>Pour combien de personnes cuisines-tu ?</Text>
</View>
<View style={{ marginTop: 10 }}>
                      {[
                        { key: "1", label: "1 personne", icon: "🧍" },
                        { key: "2", label: "2 personnes", icon: "🧑‍🤝‍🧑" },
                        { key: "3-4", label: "3-4 personnes", icon: "👨‍👩‍👧" },
                        { key: "5+", label: "5+ personnes", icon: "👨‍👩‍👧‍👦" },
                      ].map((p) => {
                        const selected = people === (p.key as PeopleChoice);
                        return (
<Pressable
                            key={p.key}
                            onPress={() => setPeople(p.key as PeopleChoice)}
                            style={[styles.choiceRow, selected && styles.choiceRowSelected]}
>
<Text style={styles.choiceIcon}>{p.icon}</Text>
<Text style={styles.choiceTitle}>{p.label}</Text>
</Pressable>
                        );
                      })}
</View>
</>
                )}
 
                {/* ── Étape 8 : Confirmation ── */}
                {step === 8 && (
<View style={styles.welcomeContainer}>
<View style={styles.welcomeHero}>
<View style={styles.bigIcon}>
<Ionicons name="checkmark" size={28} color="#fff" />
</View>
<Text style={styles.welcomeTitle}>Parfait !</Text>
<Text style={styles.welcomeText}>
                        Ton profil est pret. Clique sur le bouton pour entrer dans l&apos;app.
</Text>
</View>
<TouchableOpacity
                      onPress={next}
                      style={[styles.btn, styles.btnPrimary, styles.btnBig, isSavingConfig && styles.btnDisabled]}
                      activeOpacity={0.85}
                      disabled={isSavingConfig}
>
<Text style={styles.btnPrimaryText}>
                        {isSavingConfig ? "Enregistrement..." : "C'est parti !"}{" "}
<Ionicons name="arrow-forward" size={16} color="#fff" />
</Text>
</TouchableOpacity>
</View>
                )}
 
                {step <= 7 && (
<View style={styles.actions}>
<TouchableOpacity
                      onPress={next}
                      style={[
                        styles.btn,
                        styles.btnPrimary,
                        (!canContinue || isSavingConfig) && styles.btnDisabled,
                      ]}
                      activeOpacity={0.85}
                      disabled={!canContinue || isSavingConfig}
>
<Text style={styles.btnPrimaryText}>
                        {step === 7 ? (isSavingConfig ? "Enregistrement..." : "Terminer") : "Continuer"}{" "}
<Ionicons name="arrow-forward" size={16} color="#fff" />
</Text>
</TouchableOpacity>
</View>
                )}
 
                {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}
</View>
              {step === 4 && <View style={{ height: 30 }} />}
</View>
</View>
</ScrollView>
</KeyboardAvoidingView>
</SafeAreaView>
  );
}
 
const styles = StyleSheet.create({
  tile: { width: "48%", borderWidth: 1, borderColor: "rgba(79, 98, 145, 0.08)", borderRadius: 18, paddingVertical: 16, alignItems: "center", backgroundColor: "#fff" },
  tileSelected: { borderColor: COLORS.orange, backgroundColor: "rgba(255, 122, 0, 0.10)", transform: [{ scale: 0.98 }] },
  tileEmoji: { fontSize: 24, marginBottom: 8 },
  tileText: { fontSize: 13, fontWeight: "800", color: COLORS.text, textAlign: "center" },
 
  screen: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 18, paddingTop: 10 },
  cardContainer: { flex: 1, paddingBottom: 18 },
 
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
 
  header: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 6 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: COLORS.text, letterSpacing: 0.2 },
  headerStep: { fontSize: 12, fontWeight: "800", color: COLORS.orange, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: COLORS.orangeSoft },
 
  progressTrack: { height: 8, backgroundColor: "rgba(15,23,42,0.08)", borderRadius: 999, overflow: "hidden", marginHorizontal: 6, marginBottom: 14 },
  progressFill: { height: "100%", backgroundColor: COLORS.orange, borderRadius: 999 },
 
  safe: { flex: 1, backgroundColor: COLORS.bg },
 
  questionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  question: { fontSize: 17, fontWeight: "900", color: COLORS.text, flex: 1 },
  helper: { marginTop: 6, color: COLORS.sub, fontSize: 13, lineHeight: 18 },
 
  inputWrap: { borderWidth: 1, borderColor: "rgba(15,23,42,0.08)", borderRadius: 14, paddingHorizontal: 12, height: 48, flexDirection: "row", alignItems: "center", backgroundColor: "#FAFAFA", marginTop: 10 },
  input: { flex: 1, fontSize: 14, color: COLORS.text, marginLeft: 8 },
  label: { marginTop: 14, marginBottom: 8, fontSize: 12, fontWeight: "700", color: COLORS.sub },
  note: { marginTop: 10, fontSize: 12, color: COLORS.sub, lineHeight: 16 },
 
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 14, rowGap: 12 },
 
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 18, gap: 12 },
  btn: { flex: 1, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  btnPrimary: { backgroundColor: COLORS.orange },
  btnPrimaryText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
  btnBig: { height: 64, width: "100%", marginTop: 18 },
 
  choiceRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, backgroundColor: "#fff", marginBottom: 12 },
  choiceRowSelected: { borderColor: COLORS.orange, backgroundColor: COLORS.orangeSoft },
  choiceIcon: { fontSize: 22 },
  choiceTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  choiceSub: { fontSize: 12, color: COLORS.sub, marginTop: 2 },
 
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, gap: 10 },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff" },
  chipSelected: { borderColor: COLORS.orange, backgroundColor: COLORS.orangeSoft },
  chipText: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  chipTextSelected: { color: COLORS.text },
  chipDisabled: { opacity: 0.45 },
  chipTextDisabled: { color: COLORS.muted },
 
  suggestions: { marginTop: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, overflow: "hidden", backgroundColor: "#fff" },
  suggestionItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  suggestionText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  lookupStateText: { marginTop: 8, fontSize: 12, color: COLORS.sub, fontWeight: "600" },
  lookupErrorText: { marginTop: 8, fontSize: 12, color: "#DC2626", fontWeight: "700" },
 
  selectedWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  selectedChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: COLORS.orange, backgroundColor: COLORS.orangeSoft, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
  selectedChipText: { fontSize: 12, fontWeight: "700", color: COLORS.text },
 
  bigIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.orange, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  welcomeTitle: { fontSize: 22, fontWeight: "900", color: COLORS.text, marginBottom: 8 },
  welcomeText: { fontSize: 13, color: COLORS.sub, textAlign: "center", lineHeight: 18 },
  saveErrorText: { marginTop: 12, fontSize: 12, color: "#DC2626", textAlign: "center", fontWeight: "700" },
  welcomeContainer: { paddingVertical: 24, minHeight: 250, justifyContent: "space-between" },
  welcomeHero: { alignItems: "center", paddingTop: 10 },
  welcomeIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.orange, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  welcomeSubtitle: { fontSize: 14, color: COLORS.sub, textAlign: "center", lineHeight: 20, paddingHorizontal: 10 },
  tileTextSelected: { color: COLORS.text },
  backButton: { flexDirection: "row", alignItems: "center", marginBottom: 12, alignSelf: "flex-start" },
  backText: { marginLeft: 6, fontSize: 13, fontWeight: "700", color: COLORS.text },
});