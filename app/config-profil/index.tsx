import { COLORS, MAX_CUISINE_SELECTIONS } from "@/constants/profileConfig";
import { STORAGE_KEYS } from "@/constants/storage";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { router, useLocalSearchParams } from "expo-router";

import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { getHumanErrorMessage } from "@/src/lib/api";
import { CuisineOption, resolveCuisineOptionIds, toggleCuisinePreference } from "@/src/lib/cuisine-preferences";
import {
  BudgetOption,
  ReferenceItem,
  fetchAllAllergies,
  fetchAllBudgets,
  fetchAllCuisines,
  fetchAllDiets,
  getProfileRequest,
  saveUserAllergies,
  saveUserBlacklist,
  saveUserBudget,
  saveUserCuisines,
  saveUserDiets,
  saveUserPersonCount,
  searchIngredients,
} from "@/src/services/profile";

import { BudgetChoice, PeopleChoice } from "@/types/profil";

import ProfilCard from "@/components/profil/ProfilCard";
import ProgressBar from "@/components/profil/ProgressBar";
import StepHeader from "@/components/profil/StepHeader";
import StepBackButton from "@/components/profil/StepBackButton";

import AllergiesStep from "@/components/profil/steps/AllergiesStep";
import AvoidIngredientsStep from "@/components/profil/steps/AvoidIngredientsStep";
import BudgetStep from "@/components/profil/steps/BudgetStep";
import ConfirmationStep from "@/components/profil/steps/ConfirmationStep";
import CuisineStep from "@/components/profil/steps/CuisineStep";
import DietStep from "@/components/profil/steps/DietStep";
import LocalisationStep from "@/components/profil/steps/LocalisationStep";
import PeopleStep from "@/components/profil/steps/PeopleStep";
import WelcomeStep from "@/components/profil/steps/WelcomeStep";

import PrimaryButton from "@/components/ui/PrimaryButton";
import useCityLookup from "@/hooks/use-city-lookup";

// ─── Constantes ───────────────────────────────────────────────────────────────
const TOTAL_STEPS = 7;

type StepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// ─── Utilitaires purs ─────────────────────────────────────────────────────────
function uniqAdd(list: string[], value: string): string[] {
  const v = value.trim();
  if (!v) return list;
  if (list.some((x) => x.toLowerCase() === v.toLowerCase())) return list;
  return [...list, v];
}

function removeAt(list: string[], idx: number): string[] {
  return list.filter((_, i) => i !== idx);
}

// Convertit un tableau de ReferenceItem en tableau de noms (strings)
function itemsToNames(items: readonly { name: string }[]): string[] {
  return items.map((i) => i.name);
}

// Résout les IDs depuis les noms sélectionnés, en ignorant les inconnus
function namesToIds(names: string[], reference: ReferenceItem[]): number[] {
  return names
    .map((name) => reference.find((r) => r.name.toLowerCase() === name.toLowerCase())?.id)
    .filter((id): id is number => id !== undefined);
}

// ─── Composant ────────────────────────────────────────────────────────────────
export default function ConfigProfilScreen() {
  // ── Desktop detection ────────────────────────────────────
  const { width } = useWindowDimensions();
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const isWebDesktop = Platform.OS === "web" && width > 900 && isLayoutReady;

  // ── Paramètres de navigation ─────────────────────────────
  const params = useLocalSearchParams<{ step?: string; editMode?: string }>();
  const initialStep = Math.min(Math.max(Number(params.step ?? 0) || 0, 0), 8) as StepIndex;
  const editMode = params.editMode === "true";

  // ── State – navigation ───────────────────────────────────
  // The static web export starts at step 0 with no viewport or query string.
  // Match that first render, then apply the actual route and desktop layout.
  const initialRouteStep = useRef(initialStep);
  const [step, setStep] = useState<StepIndex>(Platform.OS === "web" ? 0 : initialStep);
  useEffect(() => {
    if (Platform.OS === "web") setStep(initialRouteStep.current);
    setIsLayoutReady(true);
  }, []);

  // ── State – préférences utilisateur (noms/strings) ───────
  const [diets, setDiets] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState<BudgetChoice | null>(null);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [avoidVeg, setAvoidVeg] = useState<string[]>([]);
  // Cache { name → id } pour résoudre les IDs au moment de la sauvegarde
  const [blacklistCache, setBlacklistCache] = useState<Record<string, number>>({});
  const [allergies, setAllergies] = useState<string[]>([]);
  const [people, setPeople] = useState<PeopleChoice | null>(null);

  // ── State – référentiels chargés depuis l'API ────────────
  const [refDiets, setRefDiets] = useState<ReferenceItem[]>([]);
  const [refAllergies, setRefAllergies] = useState<ReferenceItem[]>([]);
  const [refCuisines, setRefCuisines] = useState<CuisineOption[]>([]);
  const [refBudgets, setRefBudgets] = useState<BudgetOption[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);

  // ── State – recherche ingrédients à éviter ───────────────
  const [vegQuery, setVegQuery] = useState("");
  const [vegSuggestionsFromApi, setVegSuggestionsFromApi] = useState<ReferenceItem[]>([]);
  const [isVegLookupLoading, setIsVegLookupLoading] = useState(false);
  const [allergyQuery, setAllergyQuery] = useState(""); // conservé pour compatibilité éventuelle

  // ── State – UI ───────────────────────────────────────────
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── City lookup ──────────────────────────────────────────
  const {
    citySuggestions,
    setCitySuggestions,
    cityLookupError,
    setCityLookupError,
    isCityLookupLoading,
    onSelectCity,
  } = useCityLookup(location, setLocation, step);

  // ── Chargement des référentiels + préférences existantes ─
  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      setIsLoadingRefs(true);
      let availableCuisines: CuisineOption[] = [];
      try {
        // 1. Référentiels et préférences en parallèle
        const [dietsRef, allergiesRef, cuisinesRef, budgetsRef, userProfile] =
          await Promise.all([
            fetchAllDiets(),
            fetchAllAllergies(),
            fetchAllCuisines(),
            fetchAllBudgets(),
            getProfileRequest().catch(() => null),
          ]);

        if (cancelled) return;

        // 2. Stocker les référentiels
        setRefDiets(dietsRef);
        setRefAllergies(allergiesRef);
        setRefCuisines(cuisinesRef);
        availableCuisines = cuisinesRef;
        setRefBudgets(budgetsRef);

        // Keep the loaded reference data even if the user's preferences could not be fetched.
        if (!userProfile) throw new Error("Impossible de charger le profil API. Utilisation des préférences locales.");

        // 3. Hydrater les préférences depuis le profil API
        if (userProfile.diets.length > 0) {
          setDiets(itemsToNames(userProfile.diets));
        }
        if (userProfile.allergies.length > 0) {
          setAllergies(itemsToNames(userProfile.allergies));
        }
        setCuisines(itemsToNames(userProfile.cuisines));
        if (userProfile.blacklist.length > 0) {
          setAvoidVeg(itemsToNames(userProfile.blacklist));
          // Alimenter le cache avec les ingrédients déjà enregistrés
          const cache: Record<string, number> = {};
          userProfile.blacklist.forEach((item) => { cache[item.name] = item.id; });
          setBlacklistCache(cache);
        }
        if (userProfile.budget?.key) {
          // La clé budget de l'API ("PETIT" / "MOYEN" / "LARGE") correspond à BudgetChoice
          const key = userProfile.budget.key as BudgetChoice;
          if (key === "PETIT" || key === "MOYEN" || key === "LARGE") {
            setBudget(key);
          }
        }
        if (userProfile.personCount != null) {
          // Convertir le nombre en PeopleChoice
          const count = userProfile.personCount;
          if (count === 1) setPeople("1");
          else if (count === 2) setPeople("2");
          else if (count <= 4) setPeople("3-4");
          else setPeople("5+");
        }

        // 4. Fallback AsyncStorage pour la localisation (non gérée par l'API profil)
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEYS.profileConfig);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (typeof parsed?.location === "string" && parsed.location.trim()) {
              setLocation(parsed.location.trim());
            }
          }
        } catch {
          // Ignore
        }
      } catch (err) {
        console.warn("Erreur chargement profil:", err);
        // Fallback complet sur AsyncStorage si l'API échoue
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEYS.profileConfig);
          if (!raw || cancelled) return;
          const parsed = JSON.parse(raw);
          if (parsed?.diets?.length) setDiets(parsed.diets);
          if (parsed?.location) setLocation(parsed.location);
          if (parsed?.budget) setBudget(parsed.budget);
          if (Array.isArray(parsed?.cuisines)) {
            setCuisines(parsed.cuisines.filter((name: unknown): name is string =>
              typeof name === "string" && availableCuisines.some((item) => item.name === name)
            ));
          }
          if (parsed?.avoidVeg?.length) setAvoidVeg(parsed.avoidVeg);
          if (parsed?.allergies?.length) setAllergies(parsed.allergies);
          if (parsed?.people) setPeople(parsed.people);
        } catch {
          // Ignore
        }
      } finally {
        if (!cancelled) setIsLoadingRefs(false);
      }
    };

    loadAll();
    return () => { cancelled = true; };
  }, []);

  // ── Recherche d'ingrédients à éviter (debounced via API) ─
  useEffect(() => {
    const q = vegQuery.trim();
    setVegSuggestionsFromApi([]);
    if (step !== 5 || q.length < 3) {
      setIsVegLookupLoading(false);
      return;
    }
    let cancelled = false;
    setIsVegLookupLoading(true);
    const timer = setTimeout(async () => {
      const results = await searchIngredients(q);
      if (cancelled) return;
      setVegSuggestionsFromApi(
        results.filter(
          (r) => !avoidVeg.some((x) => x.toLowerCase() === r.name.toLowerCase())
        )
      );
      setIsVegLookupLoading(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [vegQuery, step, avoidVeg]);

  // ── Dérivés ──────────────────────────────────────────────
  const canContinue = useMemo(() => {
    if (step === 1) return diets.length > 0;
    if (step === 2) return location.trim().length >= 3;
    if (step === 3) return !!budget;
    if (step === 7) return !!people;
    return true;
  }, [step, diets, location, budget, people]);

  // Toggle allergy par nom
  const toggleAllergy = (name: string) => {
    setAllergies((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  // Suggestions légumes/ingrédients depuis l'API
  const vegSuggestions = useMemo(
    () => vegSuggestionsFromApi.map((r) => r.name).slice(0, 6),
    [vegSuggestionsFromApi]
  );

  // ── Helpers de sauvegarde via les endpoints dédiés ───────
  const saveAllPreferences = async () => {
    const dietIds = namesToIds(diets, refDiets);
    const allergyIds = namesToIds(allergies, refAllergies);
    const shouldSaveCuisines = !editMode || initialStep === 4;
    const cuisineIds = shouldSaveCuisines ? resolveCuisineOptionIds(cuisines, refCuisines) : [];
    const blacklistIds = avoidVeg
      .map((name) => blacklistCache[name])
      .filter((id): id is number => id !== undefined);

    console.log("[blacklist] avoidVeg:", avoidVeg);
    console.log("[blacklist] cache:", blacklistCache);
    console.log("[blacklist] ids résolus:", blacklistIds);

    // Budget : résoudre l'ID depuis la clé
    const budgetObj = refBudgets.find((b) => b.key === budget);

    // People : convertir PeopleChoice en nombre
    const peopleCount =
      people === "1" ? 1 :
      people === "2" ? 2 :
      people === "3-4" ? 4 :
      people === "5+" ? 5 :
      null;

    await Promise.all([
      dietIds.length > 0 ? saveUserDiets(dietIds) : Promise.resolve(),
      allergyIds.length > 0 ? saveUserAllergies(allergyIds) : Promise.resolve(),
      shouldSaveCuisines ? saveUserCuisines(cuisineIds, refCuisines) : Promise.resolve(),
      blacklistIds.length > 0 ? saveUserBlacklist(blacklistIds) : Promise.resolve(),
      budgetObj ? saveUserBudget(budgetObj.id) : Promise.resolve(),
      peopleCount != null ? saveUserPersonCount(peopleCount) : Promise.resolve(),
    ]);

    // Conserver la localisation localement (non gérée par l'API profil)
    const storedRaw = await AsyncStorage.getItem(STORAGE_KEYS.profileConfig);
    let stored: Record<string, unknown> = {};
    try {
      const parsed = storedRaw ? JSON.parse(storedRaw) : null;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) stored = parsed;
    } catch { /* Preserve the newly saved cuisine preference if the old cache is unreadable. */ }
    await AsyncStorage.setItem(
      STORAGE_KEYS.profileConfig,
      JSON.stringify({ ...stored, location: location.trim() })
    );
  };

  // ── Handlers ─────────────────────────────────────────────
  const toggleCuisine = (c: string) => {
    setCuisines((prev) => toggleCuisinePreference(prev, c, Math.min(MAX_CUISINE_SELECTIONS, refCuisines.length)));
  };

  const toggleDiet = (key: string) => {
    setDiets((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const addVeg = (v: string) => {
    setAvoidVeg((prev) => uniqAdd(prev, v));
    // Stocker l'ID dans le cache à partir des suggestions courantes
    const match = vegSuggestionsFromApi.find(
      (r) => r.name.toLowerCase() === v.toLowerCase()
    );
    if (match) {
      setBlacklistCache((prev) => ({ ...prev, [match.name]: match.id }));
    }
    setVegQuery("");
    setVegSuggestionsFromApi([]);
  };

  const addAllergy = (a: string) => {
    setAllergies((prev) => uniqAdd(prev, a));
    setAllergyQuery("");
  };

  const next = async () => {
    setSaveError(null);
    if (!canContinue) return;

    // ── MODE ÉDITION: sauvegarder la section et retourner ──
    if (editMode && step === initialStep) {
      if (isSavingConfig) return;

      try {
        setIsSavingConfig(true);
        await saveAllPreferences();
        router.back();
      } catch (error) {
        setSaveError(
          getHumanErrorMessage(error, "Impossible d'enregistrer ta modification.")
        );
      } finally {
        setIsSavingConfig(false);
      }
      return;
    }

    // ── MODE NORMAL: flow du wizard ──
    if (step === 0) { setStep(1); return; }
    if (step >= 1 && step <= 6) { setStep((s) => (s + 1) as StepIndex); return; }
    if (step === 7) { setStep(8); return; }

    if (step === 8) {
      if (isSavingConfig) return;
      if (!budget || !people) return;

      try {
        setIsSavingConfig(true);
        await saveAllPreferences();
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
    if (editMode) {
      router.back();
    } else {
      if (step > 0) setStep((s) => (s - 1) as StepIndex);
    }
  };

  // refDiets et refCuisines sont passés directement aux steps (ReferenceItem[])

  // ── Rendu ────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "left", "right", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        enabled={Platform.OS === "ios"}
      >
        <ScrollView
          contentContainerStyle={[
            isWebDesktop && styles.desktopScrollContent,
            styles.fullHeightScrollContent,
          ]}
          keyboardShouldPersistTaps="always"
          scrollEventThrottle={16}
        >
          <View style={[
            styles.screen,
            isWebDesktop && styles.screenDesktop,
            styles.fullHeightScreen,
          ]}>
            <StepHeader
              step={step}
              totalSteps={TOTAL_STEPS}
              onBack={goBack}
              isWebDesktop={isWebDesktop}
            />

            <ProgressBar step={step} totalSteps={TOTAL_STEPS} isWebDesktop={isWebDesktop} />

            <ProfilCard
              isWebDesktop={isWebDesktop}
              containerStyle={styles.fullHeightCardContainer}
              style={[styles.fullHeightCard, isWebDesktop && styles.fullHeightCardDesktop]}
            >
              {isWebDesktop && step > 0 && (
                <View style={styles.desktopCardNavigation}>
                  <StepBackButton onPress={goBack} isWebDesktop />
                </View>
              )}
              {step === 0 && (
                <WelcomeStep isWebDesktop={isWebDesktop} />
              )}

              {step >= 1 && step <= 7 && (
                <View style={styles.stepContent}>
                  {step === 1 && (
                    <DietStep
                      diets={diets}
                      toggleDiet={toggleDiet}
                      // Passer les options dynamiques si DietStep les accepte
                      availableDiets={refDiets}
                      isLoading={isLoadingRefs}
                      styles={styles}
                      isWebDesktop={isWebDesktop}
                    />
                  )}

                  {step === 2 && (
                    <LocalisationStep
                      location={location}
                      setLocation={setLocation}
                      citySuggestions={citySuggestions}
                      cityLookupError={cityLookupError}
                      isCityLookupLoading={isCityLookupLoading}
                      onSelectCity={onSelectCity}
                      setCitySuggestions={setCitySuggestions}
                      setCityLookupError={setCityLookupError}
                      styles={styles}
                      isWebDesktop={isWebDesktop}
                    />
                  )}

                  {step === 3 && (
                    <BudgetStep
                      budget={budget}
                      setBudget={setBudget}
                      // Passer les options de budget dynamiques si BudgetStep les accepte
                      availableBudgets={refBudgets}
                      isLoading={isLoadingRefs}
                      styles={styles}
                      isWebDesktop={isWebDesktop}
                    />
                  )}

                  {step === 4 && (
                    <CuisineStep
                      cuisines={cuisines}
                      toggleCuisine={toggleCuisine}
                      // Passer les options dynamiques si CuisineStep les accepte
                      availableCuisines={refCuisines}
                      isLoading={isLoadingRefs}
                      styles={styles}
                      isWebDesktop={isWebDesktop}
                    />
                  )}

                  {step === 5 && (
                    <AvoidIngredientsStep
                      vegQuery={vegQuery}
                      setVegQuery={setVegQuery}
                      vegSuggestions={vegSuggestions}
                      isLoading={isVegLookupLoading}
                      avoidVeg={avoidVeg}
                      addVeg={addVeg}
                      removeAt={removeAt}
                      setAvoidVeg={setAvoidVeg}
                      styles={styles}
                      isWebDesktop={isWebDesktop}
                    />
                  )}

                  {step === 6 && (
                    <AllergiesStep
                      allergies={allergies}
                      toggleAllergy={toggleAllergy}
                      availableAllergies={refAllergies}
                      isLoading={isLoadingRefs}
                      styles={styles}
                      isWebDesktop={isWebDesktop}
                    />
                  )}

                  {step === 7 && (
                    <PeopleStep
                      people={people}
                      setPeople={setPeople}
                      styles={styles}
                      isWebDesktop={isWebDesktop}
                    />
                  )}
                </View>
              )}

              {step === 8 && (
                <ConfirmationStep isWebDesktop={isWebDesktop} />
              )}

              <View style={styles.actions}>
                <PrimaryButton
                  onPress={next}
                  loading={isSavingConfig}
                  disabled={!canContinue || (step <= 7 && isLoadingRefs)}
                  icon="arrow-forward"
                  style={styles.continueButton}
                  textStyle={styles.continueButtonText}
                >
                  {step === 8 ? "C'est parti !" : editMode ? "Enregistrer" : step === 7 ? "Terminer" : "Continuer"}
                </PrimaryButton>
                {(step === 0 || step === 8) && (
                  <Text style={styles.welcomeFootnote}>
                    Tu pourras modifier tes préférences à tout moment.
                  </Text>
                )}
              </View>

              {saveError ? (
                <Text style={styles.saveErrorText}>{saveError}</Text>
              ) : null}

            </ProfilCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 18,
    paddingTop: 10,
  },

  screenDesktop: {
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 40,
    paddingBottom: 80,
    paddingTop: 20,
  },

  desktopScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },

  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  fullHeightScrollContent: {
    flexGrow: 1,
    paddingTop: 0,
    paddingBottom: 16,
  },
  fullHeightScreen: { paddingBottom: 0 },
  fullHeightCardContainer: { flexGrow: 1, paddingBottom: 0 },
  fullHeightCard: { flexGrow: 1, padding: 20, borderRadius: 28 },
  fullHeightCardDesktop: { minHeight: 760, padding: 32 },
  desktopCardNavigation: { width: "100%", minHeight: 44 },
  stepContent: {
    flexGrow: 1,
    justifyContent: "center",
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingVertical: 12,
  },
  stepControls: { width: "100%", marginTop: 28, gap: 12 },
  selectionSummary: {
    marginTop: 16,
    color: COLORS.sub,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  actions: {
    flexDirection: "column",
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    marginTop: 24,
    gap: 12,
  },
  continueButton: { height: 60, borderRadius: 20 },
  continueButtonText: { fontSize: 17 },
  welcomeFootnote: {
    color: COLORS.sub,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 8,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 28,
    gap: 12,
  },

  gridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    width: "100%",
    marginTop: 28,
  },

  inputWrap: {
    borderWidth: 1,
    borderColor: COLORS.orange,
    borderRadius: 18,
    paddingLeft: 14,
    paddingRight: 14,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },

  inputWrapFocused: { borderColor: COLORS.orange, borderWidth: 2, backgroundColor: COLORS.card },

  input: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    fontSize: 16,
    color: COLORS.text,
  },

  label: {
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.sub,
  },

  note: {
    flex: 1,
    fontSize: 13,
    color: COLORS.sub,
    lineHeight: 20,
  },

  infoPanel: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFF8F0",
  },
  skipLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    minHeight: 64,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 18,
  },
  skipLocationText: { flex: 1, color: COLORS.sub, fontSize: 13, lineHeight: 20 },

  suggestions: {
    marginTop: 8,
    maxHeight: 240,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },

  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  suggestionText: {
    flex: 1,
    marginRight: 12,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  lookupStateText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.sub,
    fontWeight: "600",
  },

  lookupErrorText: {
    marginTop: 8,
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "700",
  },

  saveErrorText: {
    marginTop: 12,
    fontSize: 12,
    color: "#DC2626",
    textAlign: "center",
    fontWeight: "700",
  },

  tile: {
    width: "47.5%",
    minHeight: 104,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(15,23,42,0.08)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  tileDesktop: { width: "31%", minHeight: 124 },
  tileCheck: { position: "absolute", top: 8, right: 8 },

  tileSelected: {
    backgroundColor: "#FFF7ED",
    borderColor: COLORS.orange,
  },

  tileText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 20,
  },

  tileTextSelected: {
    color: "#9A3412",
    fontWeight: "700",
  },

  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 84,
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 12,
    borderWidth: 2,
    borderColor: "rgba(15,23,42,0.08)",
    borderRadius: 20,
  },

  choiceRowSelected: {
    backgroundColor: COLORS.orangeSoft,
    borderColor: COLORS.orange,
  },

  choiceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#FFF1DE",
    alignItems: "center",
    justifyContent: "center",
  },
  choiceIcon: { fontSize: 26 },
  choiceLabel: { flex: 1, minWidth: 0 },

  choiceTitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: COLORS.text,
  },

  choiceSub: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.sub,
    marginTop: 4,
  },

  chipDisabled: { opacity: 0.5 },

  chipTextDisabled: { color: COLORS.muted },
});
