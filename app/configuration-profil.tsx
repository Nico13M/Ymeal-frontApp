import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const COLORS = {
  bg: "#FFF7EC",
  card: "#FFFFFF",
  text: "#0F172A",
  sub: "#475569",
  border: "#E2E8F0",
  orange: "#FF7A00",
  orangeSoft: "rgba(255, 122, 0, 0.12)",
  muted: "#94A3B8",
};

type BudgetChoice = "PETIT" | "MOYEN" | "LARGE";
type PeopleChoice = "1" | "2" | "3-4" | "5+";

const DIETS = [
  { key: "omnivore", label: "Omnivore", icon: "🍗" },
  { key: "flexitarien", label: "Flexitarien", icon: "🥗" },
  { key: "vegetarien", label: "Végétarien", icon: "🥬" },
  { key: "vegan", label: "Végan", icon: "🌱" },
  { key: "pesco", label: "Pesco-végétarien", icon: "🐟" },
  { key: "halal", label: "Halal", icon: "☪️" },
  { key: "casher", label: "Casher", icon: "✡️" },
  { key: "lactose", label: "Sans lactose", icon: "🥛" },
  { key: "gluten", label: "Sans gluten", icon: "🌾" },
  { key: "hypo", label: "Hypocalorique", icon: "⚖️" },
] as const;

const CUISINES = ["Cuisine française","Italienne","Espagnole","Grecque","Indienne","Japonaise","Chinoise","Américaine","Street food","Marocaine"];
const VEGETABLES = ["Aubergine","Avocat","Betterave","Brocoli","Carotte","Chou-fleur","Choux de Bruxelles","Concombre","Courgette","Épinards","Haricots verts","Maïs","Oignon","Poireau","Poivron","Pomme de terre","Potiron","Salade","Tomate","Radis","Navet","Céleri","Asperge","Artichaut","Fenouil","Chou","Groseille","Laitue","Roquette"];
const ALLERGIES = ["Arachides","Fruits à coque","Lait","Œufs","Poisson","Crustacés","Soja","Gluten","Sésame","Moutarde","Sulfites","Céleri","Lupin","Mollusques","Graines de pavot", "Fruits de mer", "Blé", "Orge", "Riz", "Maïs", "Sulfites", "Tomate", "Kiwi", "Banane", "Ananas", "Fraise", "Chocolat", "Café", "Levure", "Algues", "Noix de coco"];

function uniqAdd(list: string[], value: string) {
  const v = value.trim();
  if (!v) return list;
  if (list.some((x) => x.toLowerCase() === v.toLowerCase())) return list;
  return [...list, v];
}

function removeAt(list: string[], idx: number) {
  return list.filter((_, i) => i !== idx);
}

export default function ConfigurationProfilScreen() {
  const TOTAL_STEPS = 7;
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);
  const [diets, setDiets] = useState<string[]>([]);
  const [location, setLocation] = useState(""); // ville ou code postal
  const [budget, setBudget] = useState<BudgetChoice | null>(null);
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [avoidVeg, setAvoidVeg] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [people, setPeople] = useState<PeopleChoice | null>(null);
  const [vegQuery, setVegQuery] = useState("");
  const [allergyQuery, setAllergyQuery] = useState("");

  const progress = useMemo(() => {
    if (step === 8) return 1;
    return step / TOTAL_STEPS;
  }, [step]);

  const toggleDiet = (key: string) => {
    setDiets((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return diets.length > 0;
      case 2:
        return location.trim().length >= 3;
      case 3:
        return !!budget;
      case 4:
        return !!cuisine;
      case 5:
        return true;
      case 6:
        return true;
      case 7:
        return !!people;
      default:
        return false;
    }
  }, [step, diets, location, budget, cuisine, people]);

  const next = async () => {
    if (!canContinue) return;

    if (step < 7) {
      setStep((s) => (s + 1) as any);
      return;
    }

    setStep(8);

    const payload = {
      diets,
      location: location.trim(),
      budget,
      cuisine,
      avoidVeg,
      allergies,
      people,
    };

    try {
      await AsyncStorage.setItem("profileConfig", JSON.stringify(payload));
      await new Promise((r) => setTimeout(r, 1200));
      router.replace("/(tabs)");
    } catch (e) {
      await new Promise((r) => setTimeout(r, 800));
      router.replace("/(tabs)");
    }
  };

  const back = () => {
    if (step <= 1) {
      router.back();
      return;
    }
    if (step === 8) return;
    setStep((s) => (s - 1) as any);
  };

  const vegSuggestions = useMemo(() => {
    const q = vegQuery.trim().toLowerCase();
    if (!q) return [];
    return VEGETABLES.filter(
      (v) =>
        v.toLowerCase().includes(q) &&
        !avoidVeg.some((x) => x.toLowerCase() === v.toLowerCase())
    ).slice(0, 6);
  }, [vegQuery, avoidVeg]);

  const allergySuggestions = useMemo(() => {
    const q = allergyQuery.trim().toLowerCase();
    if (!q) return [];
    return ALLERGIES.filter(
      (a) =>
        a.toLowerCase().includes(q) &&
        !allergies.some((x) => x.toLowerCase() === a.toLowerCase())
    ).slice(0, 6);
  }, [allergyQuery, allergies]);

  const addVeg = (v: string) => {
    setAvoidVeg((prev) => uniqAdd(prev, v));
    setVegQuery("");
  };

  const addAllergy = (a: string) => {
    setAllergies((prev) => uniqAdd(prev, a));
    setAllergyQuery("");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Personnalise ton profil</Text>
          <Text style={styles.headerStep}>
            {step === 8 ? `${TOTAL_STEPS}/${TOTAL_STEPS}` : `${step}/${TOTAL_STEPS}`}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <View style={styles.card}>
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
                    <Pressable
                      key={d.key}
                      onPress={() => toggleDiet(d.key)}
                      style={[
                        styles.tile,
                        selected && styles.tileSelected,
                      ]}
                    >
                      <Text style={styles.tileEmoji}>{d.icon}</Text>
                      <Text style={[styles.tileText, selected && styles.tileTextSelected]}>
                        {d.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <View style={styles.questionRow}>
                <Ionicons name="location-outline" size={18} color={COLORS.orange} />
                <Text style={styles.question}>Où habites-tu ?</Text>
              </View>

              <Text style={styles.label}>Ville ou code postal</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="ex: 84300"
                  keyboardType="default"
                  style={styles.input}
                />
              </View>

              <Text style={styles.note}>
                Nous utiliserons cette information pour te proposer des bons plans près de chez toi.
              </Text>
            </>
          )}

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

          {step === 4 && (
            <>
              <View style={styles.questionRow}>
                <Ionicons name="restaurant-outline" size={18} color={COLORS.orange} />
                <Text style={styles.question}>As-tu une alimentation favorite ?</Text>
              </View>
              <Text style={styles.helper}>Choisis 1 style de cuisine.</Text>

              <View style={styles.chipsWrap}>
                {CUISINES.map((c) => {
                  const selected = cuisine === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setCuisine(c)}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {c}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {step === 5 && (
            <>
              <View style={styles.questionRow}>
                <Ionicons name="alert-circle-outline" size={18} color={COLORS.orange} />
                <Text style={styles.question}>Y a-t-il des légumes que tu veux éviter ?</Text>
              </View>

              <Text style={styles.helper}>Tape quelques lettres et sélectionne. Plusieurs possibles.</Text>

              <View style={styles.inputWrap}>
                <TextInput
                  value={vegQuery}
                  onChangeText={setVegQuery}
                  placeholder="ex: bro..."
                  style={styles.input}
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

          {step === 6 && (
            <>
              <View style={styles.questionRow}>
                <Ionicons name="medkit-outline" size={18} color={COLORS.orange} />
                <Text style={styles.question}>As-tu des allergies ?</Text>
              </View>

              <Text style={styles.helper}>Même système: recherche + multi-sélection.</Text>

              <View style={styles.inputWrap}>
                <TextInput
                  value={allergyQuery}
                  onChangeText={setAllergyQuery}
                  placeholder="ex: gluten..."
                  style={styles.input}
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

          {step === 8 && (
            <View style={{ alignItems: "center", paddingVertical: 28 }}>
              <View style={styles.thanksIcon}>
                <Ionicons name="checkmark" size={26} color="#fff" />
              </View>
              <Text style={styles.thanksTitle}>Merci !</Text>
              <Text style={styles.thanksSub}>On te prépare une expérience aux petits oignons.</Text>
              <View style={{ marginTop: 18 }}>
                <ActivityIndicator size="large" color={COLORS.orange} />
              </View>
            </View>
          )}

          {step !== 8 && (
            <View style={styles.actions}>
              <TouchableOpacity onPress={back} style={[styles.btn, styles.btnGhost]} activeOpacity={0.85}>
                <Text style={styles.btnGhostText}>Retour</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={next}
                style={[styles.btn, styles.btnPrimary, !canContinue && styles.btnDisabled]}
                activeOpacity={0.85}
                disabled={!canContinue}
              >
                <Text style={styles.btnPrimaryText}>
                  {step === 7 ? "Terminer" : "Continuer"}{" "}
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {step === 4 && <View style={{ height: 30 }} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 18,
    paddingTop: 10,
    justifyContent: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  headerStep: { fontSize: 13, fontWeight: "700", color: COLORS.muted },

  progressTrack: {
    height: 6,
    backgroundColor: "rgba(15,23,42,0.10)",
    borderRadius: 999,
    overflow: "hidden",
    marginHorizontal: 6,
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.orange,
    borderRadius: 999,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 6 },
    }),
  },

  questionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  question: { fontSize: 16, fontWeight: "800", color: COLORS.text, flex: 1 },

  helper: { marginTop: 8, color: COLORS.sub, fontSize: 12, lineHeight: 16 },

  label: { marginTop: 14, marginBottom: 8, fontSize: 12, fontWeight: "700", color: COLORS.sub },

  inputWrap: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "center",
    backgroundColor: "#fff",
    marginTop: 10,
  },
  input: { fontSize: 14, color: COLORS.text },

  note: { marginTop: 10, fontSize: 12, color: COLORS.sub, lineHeight: 16 },

  // Step 1 grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 14,
    rowGap: 12,
  },
  tile: {
    width: "48%",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  tileSelected: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeSoft,
  },
  tileEmoji: { fontSize: 22, marginBottom: 8 },
  tileText: { fontSize: 13, fontWeight: "700", color: COLORS.text, textAlign: "center" },
  tileTextSelected: { color: COLORS.text },

  // Choices rows (budget / people)
  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  choiceRowSelected: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeSoft,
  },
  choiceIcon: { fontSize: 22 },
  choiceTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  choiceSub: { fontSize: 12, color: COLORS.sub, marginTop: 2 },

  // Chips (cuisine)
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  chipSelected: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeSoft,
  },
  chipText: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  chipTextSelected: { color: COLORS.text },

  // Suggestions + selected chips
  suggestions: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
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
  suggestionText: { fontSize: 13, fontWeight: "600", color: COLORS.text },

  selectedWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeSoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  selectedChipText: { fontSize: 12, fontWeight: "700", color: COLORS.text },

  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, gap: 12 },
  btn: { flex: 1, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnGhost: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: "#fff" },
  btnGhostText: { color: COLORS.sub, fontWeight: "800" },
  btnPrimary: { backgroundColor: COLORS.orange },
  btnPrimaryText: { color: "#fff", fontWeight: "900", fontSize: 13 },
  btnDisabled: { opacity: 0.5 },

  thanksIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  thanksTitle: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  thanksSub: { marginTop: 6, fontSize: 12, color: COLORS.sub, textAlign: "center", lineHeight: 16 },
});