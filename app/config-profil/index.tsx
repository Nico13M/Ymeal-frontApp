import { ALLERGIES, COLORS, VEGETABLES } from "@/constants/profileConfig";
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
import { sendProfileConfiguration } from "@/src/services/profile-config";
import { BudgetChoice, PeopleChoice, StoredProfileConfig } from "@/types/profil";

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

// ─── Constante module-level (pas un hook, c'est OK) ──────────────────────────
const TOTAL_STEPS = 7;

type StepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// ─── Utilitaires purs (module-level, pas de hooks) ────────────────────────────
function uniqAdd(list: string[], value: string): string[] {
  const v = value.trim();
  if (!v) return list;
  if (list.some((x) => x.toLowerCase() === v.toLowerCase())) return list;
  return [...list, v];
}

function removeAt(list: string[], idx: number): string[] {
  return list.filter((_, i) => i !== idx);
}

function sanitizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

// ─── Composant ────────────────────────────────────────────────────────────────
export default function ConfigProfilScreen() {
  // ── Desktop detection ────────────────────────────────────
  const { width } = Dimensions.get("window");
  const isWebDesktop = Platform.OS === "web" && width > 900;

  // ── Lecture du paramètre step transmis depuis le profil ──
  const params = useLocalSearchParams<{ step?: string; editMode?: string }>();
  const initialStep = Math.min(Math.max(Number(params.step ?? 0) || 0, 0), 8) as StepIndex;
  const editMode = params.editMode === "true";  // ← true = vient du profil

  // ── State ────────────────────────────────────────────────
  const [step, setStep] = useState<StepIndex>(initialStep);

  const [diets, setDiets] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState<BudgetChoice | null>(null);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [avoidVeg, setAvoidVeg] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [people, setPeople] = useState<PeopleChoice | null>(null);
  const [vegQuery, setVegQuery] = useState("");
  const [allergyQuery, setAllergyQuery] = useState("");
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

  // ── Chargement de la config existante ────────────────────
  // Toujours charger pour préserver les données en mode édition
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
        // Ignore cache errors
      }
    };

    loadExistingConfig();
    return () => { cancelled = true; };
  }, []);

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
    setVegQuery("");
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

      // Vérifier que budget et people sont définis (requis par l'API)
      if (!budget || !people) {
        setSaveError("Veuillez compléter votre profil avant de continuer.");
        return;
      }

      // Construire le payload complet (toujours envoyer tous les champs)
      const fullPayload = {
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

        // Sauvegarder localement
        await AsyncStorage.setItem(
          STORAGE_KEYS.profileConfig,
          JSON.stringify(fullPayload)
        );

        // Envoyer à l'API (non-bloquant en cas d'erreur)
        try {
          await sendProfileConfiguration(fullPayload);
        } catch (error) {
          console.warn(
            "Profile sync warning:",
            getHumanErrorMessage(error, "")
          );
        }

        // Retourner au profil
        router.back();
      } catch (error) {
        setSaveError(
          getHumanErrorMessage(
            error,
            "Impossible d'enregistrer ta modification."
          )
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

        await AsyncStorage.setItem(
          STORAGE_KEYS.profileConfig,
          JSON.stringify(payload)
        );

        try {
          await sendProfileConfiguration(payload);
        } catch (error) {
          console.warn(
            "Profile sync warning:",
            getHumanErrorMessage(error, "")
          );
        }

        router.replace("/(tabs)");
      } catch (error) {
        setSaveError(
          getHumanErrorMessage(
            error,
            "Impossible d'enregistrer ton profil pour le moment."
          )
        );
      } finally {
        setIsSavingConfig(false);
      }
    }
  };

  const goBack = () => {
    if (editMode) {
      // En mode édition, retourner au profil directement
      router.back();
    } else {
      // En mode normal, reculer d'une étape
      if (step > 0) setStep((s) => (s - 1) as StepIndex);
    }
  };

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
              {step === 0 && <WelcomeStep styles={styles} isWebDesktop={isWebDesktop} />}

              {step === 1 && (
                <DietStep
                  diets={diets}
                  toggleDiet={toggleDiet}
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
                <BudgetStep budget={budget} setBudget={setBudget} styles={styles} isWebDesktop={isWebDesktop} />
              )}

              {step === 4 && (
                <CuisineStep
                  cuisines={cuisines}
                  toggleCuisine={toggleCuisine}
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
                  step={step}
                  allergyQuery={allergyQuery}
                  setAllergyQuery={setAllergyQuery}
                  allergySuggestions={allergySuggestions}
                  allergies={allergies}
                  addAllergy={addAllergy}
                  removeAt={removeAt}
                  setAllergies={setAllergies}
                  styles={styles}
                  isWebDesktop={isWebDesktop}
                />
              )}

              {step === 7 && (
                <PeopleStep people={people} setPeople={setPeople} styles={styles} isWebDesktop={isWebDesktop} />
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
                    disabled={!canContinue}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  shadowOffset: {
    width: 0,
    height: 4,
  },
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
  welcomeContainer: {
    paddingVertical: 20,
  },
  welcomeContainerDesktop: {
    paddingVertical: 32,
  },
  welcomeHero: {
    alignItems: "center",
  },
  welcomeHeroDesktop: {
    paddingVertical: 16,
  },
  welcomeLogo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  welcomeLogoDesktop: {
    width: 100,
    height: 100,
    marginBottom: 24,
  },
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
  finalLogo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
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
  btnPrimary: {
    backgroundColor: COLORS.orange,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  btnBig: {
    paddingVertical: 16,
  },
  btnDisabled: {
    opacity: 0.6,
  },

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
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.05,
  shadowRadius: 8,

  elevation: 2,
},

tileSelected: {
  backgroundColor: "#FFF7ED",
  borderColor: COLORS.orange,
  transform: [{ scale: 1.03 }],
},

tileEmoji: {
  fontSize: 34,
  marginBottom: 10,
},

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
  choiceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
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
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  chipTextSelected: {
    color: "#fff",
  },
  chipTextDisabled: {
    color: COLORS.muted,
  },
});