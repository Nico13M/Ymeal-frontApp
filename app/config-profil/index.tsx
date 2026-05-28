import { COLORS } from "@/constants/profileConfig";
import { STORAGE_KEYS } from "@/constants/storage";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { router, useLocalSearchParams } from "expo-router";

import React, { useEffect, useMemo, useState } from "react";

import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { getHumanErrorMessage } from "@/src/lib/api";
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
function itemsToNames(items: ReferenceItem[]): string[] {
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
  const { width } = Dimensions.get("window");
  const isWebDesktop = Platform.OS === "web" && width > 900;

  // ── Paramètres de navigation ─────────────────────────────
  const params = useLocalSearchParams<{ step?: string; editMode?: string }>();
  const initialStep = Math.min(Math.max(Number(params.step ?? 0) || 0, 0), 8) as StepIndex;
  const editMode = params.editMode === "true";

  // ── State – navigation ───────────────────────────────────
  const [step, setStep] = useState<StepIndex>(initialStep);

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
  const [refCuisines, setRefCuisines] = useState<ReferenceItem[]>([]);
  const [refBudgets, setRefBudgets] = useState<BudgetOption[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);

  // ── State – recherche ingrédients à éviter ───────────────
  const [vegQuery, setVegQuery] = useState("");
  const [vegSuggestionsFromApi, setVegSuggestionsFromApi] = useState<ReferenceItem[]>([]);
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
      try {
        // 1. Référentiels et préférences en parallèle
        const [dietsRef, allergiesRef, cuisinesRef, budgetsRef, userProfile] =
          await Promise.all([
            fetchAllDiets(),
            fetchAllAllergies(),
            fetchAllCuisines(),
            fetchAllBudgets(),
            getProfileRequest(),
          ]);

        if (cancelled) return;

        // 2. Stocker les référentiels
        setRefDiets(dietsRef);
        setRefAllergies(allergiesRef);
        setRefCuisines(cuisinesRef);
        setRefBudgets(budgetsRef);

        // 3. Hydrater les préférences depuis le profil API
        if (userProfile.diets.length > 0) {
          setDiets(itemsToNames(userProfile.diets));
        }
        if (userProfile.allergies.length > 0) {
          setAllergies(itemsToNames(userProfile.allergies));
        }
        if (userProfile.cuisines.length > 0) {
          setCuisines(itemsToNames(userProfile.cuisines));
        }
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
          if (parsed?.cuisines?.length) setCuisines(parsed.cuisines);
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
    if (step !== 5) return;
    const q = vegQuery.trim();
    if (q.length < 3) {
      setVegSuggestionsFromApi([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchIngredients(q);
      setVegSuggestionsFromApi(
        results.filter(
          (r) => !avoidVeg.some((x) => x.toLowerCase() === r.name.toLowerCase())
        )
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [vegQuery, step, avoidVeg]);

  // ── Dérivés ──────────────────────────────────────────────
  const progress = useMemo(() => {
    if (step <= 0) return 0;
    if (step >= 8) return 1;
    return step / TOTAL_STEPS;
  }, [step]);

  const canContinue = useMemo(() => {
    if (step === 1) return diets.length > 0;
    if (step === 2) return location.trim().length >= 3;
    if (step === 3) return !!budget;
    if (step === 4) return cuisines.length > 0;
    if (step === 7) return !!people;
    return true;
  }, [step, diets, location, budget, cuisines, people]);

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
    const cuisineIds = namesToIds(cuisines, refCuisines);
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
      cuisineIds.length > 0 ? saveUserCuisines(cuisineIds) : Promise.resolve(),
      blacklistIds.length > 0 ? saveUserBlacklist(blacklistIds) : Promise.resolve(),
      budgetObj ? saveUserBudget(budgetObj.id) : Promise.resolve(),
      peopleCount != null ? saveUserPersonCount(peopleCount) : Promise.resolve(),
    ]);

    // Conserver la localisation localement (non gérée par l'API profil)
    await AsyncStorage.setItem(
      STORAGE_KEYS.profileConfig,
      JSON.stringify({ location: location.trim() })
    );
  };

  // ── Handlers ─────────────────────────────────────────────
  const toggleCuisine = (c: string) => {
    setCuisines((prev) => {
      if (prev.includes(c)) return prev.filter((x) => x !== c);
      if (prev.length >= 6) return prev;
      return [...prev, c];
    });
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
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        enabled={Platform.OS === "ios"}
      >
        <ScrollView
          contentContainerStyle={[
            { paddingBottom: 100 },
            isWebDesktop && styles.desktopScrollContent,
          ]}
          keyboardShouldPersistTaps="always"
          scrollEventThrottle={16}
        >
          <View style={[styles.screen, isWebDesktop && styles.screenDesktop]}>
            <StepHeader
              step={step}
              totalSteps={TOTAL_STEPS}
              onBack={goBack}
            />

            <ProgressBar progress={progress} isWebDesktop={isWebDesktop} />

            <ProfilCard isWebDesktop={isWebDesktop}>
              {step === 0 && (
                <WelcomeStep styles={styles} isWebDesktop={isWebDesktop} />
              )}

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
                  step={step}
                  vegQuery={vegQuery}
                  setVegQuery={setVegQuery}
                  vegSuggestions={vegSuggestions}
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

              {step === 8 && (
                <ConfirmationStep
                  isSavingConfig={isSavingConfig}
                  next={next}
                  styles={styles}
                  isWebDesktop={isWebDesktop}
                />
              )}

              {step <= 7 && (
                <View style={[styles.actions, isWebDesktop && styles.actionsDesktop]}>
                  <PrimaryButton
                    onPress={next}
                    loading={isSavingConfig}
                    disabled={!canContinue || isLoadingRefs}
                    icon="arrow-forward"
                  >
                    {editMode ? "Enregistrer" : step === 7 ? "Terminer" : "Continuer"}
                  </PrimaryButton>
                </View>
              )}

              {saveError ? (
                <Text style={styles.saveErrorText}>{saveError}</Text>
              ) : null}

              {step === 4 && <View style={{ height: 30 }} />}
            </ProfilCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles (inchangés) ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 18,
    paddingTop: 10,
  },

  locationContainerDesktop: {
    width: 420,
    alignSelf: "center",
    position: "relative",
    zIndex: 9999,
  },

  inputWrapDesktopFixed: {
    width: 420,
    alignSelf: "center",
  },

  suggestionsDesktop: {
    width: 420,
    left: "50%",
    transform: [{ translateX: -210 }],
    top: 58,
    maxHeight: 260,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
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

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 12,
  },

  actionsDesktop: {
    justifyContent: "center",
    maxWidth: 280,
    alignSelf: "center",
    marginTop: 60,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 14,
    rowGap: 12,
  },

  gridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
    width: "100%",
    marginTop: 24,
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 10,
  },

  chipsWrapDesktop: {
    justifyContent: "center",
    maxWidth: 800,
    alignSelf: "center",
    gap: 12,
  },

  inputWrap: {
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    marginTop: 10,
  },

  inputWrapDesktop: {
    maxWidth: 420,
    alignSelf: "center",
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },

  label: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.sub,
  },

  labelDesktop: {
    fontSize: 13,
  },

  helper: {
    marginTop: 6,
    color: COLORS.sub,
    fontSize: 13,
    lineHeight: 18,
  },

  helperDesktop: {
    fontSize: 13,
  },

  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },

  question: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.text,
    flex: 1,
  },

  questionDesktop: {
    fontSize: 18,
    lineHeight: 24,
  },

  note: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.sub,
    lineHeight: 16,
  },

  suggestions: {
    position: "absolute",
    top: 58,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: "#fff",
    zIndex: 999,
    elevation: 5,
    overflow: "hidden",
  },

  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  suggestionText: {
    fontSize: 13,
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

  welcomeContainer: { paddingVertical: 20 },
  welcomeContainerDesktop: { paddingVertical: 32 },
  welcomeHero: { alignItems: "center" },
  welcomeHeroDesktop: { paddingVertical: 16 },
  welcomeLogo: { width: 80, height: 80, marginBottom: 16 },
  welcomeLogoDesktop: { width: 100, height: 100, marginBottom: 24 },

  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.orange,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  welcomeIconDesktop: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 24,
  },

  welcomeTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 10,
  },

  welcomeTitleDesktop: {
    fontSize: 28,
    lineHeight: 36,
    marginBottom: 14,
  },

  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.sub,
    textAlign: "center",
    lineHeight: 20,
  },

  welcomeSubtitleDesktop: {
    fontSize: 15,
    lineHeight: 24,
  },

  finalLogo: { width: 80, height: 80, marginBottom: 16 },

  bigIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.orange,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  welcomeText: {
    fontSize: 14,
    color: COLORS.sub,
    textAlign: "center",
    lineHeight: 20,
  },

  btn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },

  btnPrimary: { backgroundColor: COLORS.orange },
  btnPrimaryText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  btnBig: { paddingVertical: 16 },
  btnDisabled: { opacity: 0.6 },

  tile: {
    width: Platform.OS === "web" ? 120 : "45%",
    minHeight: Platform.OS === "web" ? 120 : 100,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(15,23,42,0.08)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  tileSelected: {
    backgroundColor: "#FFF7ED",
    borderColor: COLORS.orange,
    transform: [{ scale: 1.03 }],
  },

  tileEmoji: { fontSize: 34, marginBottom: 10 },

  tileText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 20,
  },

  tileTextSelected: {
    color: COLORS.orange,
    fontWeight: "700",
  },

  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "rgba(15,23,42,0.08)",
    borderRadius: 12,
    marginBottom: 10,
  },

  choiceRowSelected: {
    backgroundColor: COLORS.orangeSoft,
    borderColor: COLORS.orange,
  },

  choiceIcon: { fontSize: 24, marginRight: 12 },

  choiceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  choiceSub: {
    fontSize: 12,
    color: COLORS.sub,
    marginTop: 2,
  },

  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.1)",
    backgroundColor: "#FAFAFA",
  },

  chipSelected: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },

  chipDisabled: { opacity: 0.5 },

  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },

  chipTextSelected: { color: "#fff" },
  chipTextDisabled: { color: COLORS.muted },
});