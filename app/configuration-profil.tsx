import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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
  const TOTAL_STEPS = 7; // nombre de questions
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(0);
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
    if (step <= 0) return 0;
    if (step >= 8) return 1;
    return step / TOTAL_STEPS;
  }, [step]);

  const toggleDiet = (key: string) => {
    setDiets((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return true;
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
      case 8:
        return true; 
      default:
        return false;
    }
  }, [step, diets, location, budget, cuisine, people]);

  const next = async () => {
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
    } catch (e) {
    }
    router.replace("/(tabs)");
    };
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
            {step === 0 ? `0/${TOTAL_STEPS}` : step >= 8 ? `${TOTAL_STEPS}/${TOTAL_STEPS}` : `${step}/${TOTAL_STEPS}`}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.cardContainer}>
        <View style={styles.card}>
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
                      style={[
                        styles.tile,
                        selected && styles.tileSelected,
                      ]}
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
                value={location}
                onChangeText={setLocation}
                placeholder="ex: 84300"
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
              <Ionicons name="search" size={18} color={COLORS.muted} />
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
            <View style={{ alignItems: "center", paddingVertical: 18 }}>
              <View style={styles.bigIcon}>
                <Ionicons name="checkmark" size={26} color="#fff" />
              </View>
              <Text style={styles.welcomeTitle}>Parfait !</Text>
              <Text style={styles.welcomeText}>
                Ton profil est prêt. On va maintenant te proposer des recettes adaptées à
                tes préférences et à ton budget.
              </Text>
              <TouchableOpacity
                onPress={next}
                style={[styles.btn, styles.btnPrimary, { marginTop: 18, width: "100%", height: 80 }]}
                activeOpacity={0.85}
              >
                <Text style={styles.btnPrimaryText}>
                  C'est parti ! <Ionicons name="arrow-forward" size={16} color="#fff" />
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {step !== 8 && (
            <View style={styles.actions}>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tile: {
  width: "48%",
  borderWidth: 1,
  borderColor: "rgba(15,23,42,0.08)",
  borderRadius: 18,
  paddingVertical: 16,
  alignItems: "center",
  backgroundColor: "#fff",
},
tileSelected: {
  borderColor: COLORS.orange,
  backgroundColor: "rgba(255, 122, 0, 0.10)",
  transform: [{ scale: 0.98 }],
},
tileEmoji: { fontSize: 24, marginBottom: 8 },
tileText: {
  fontSize: 13,
  fontWeight: "800",
  color: COLORS.text,
  textAlign: "center",
},
  screen: {
  flex: 1,
  backgroundColor: COLORS.bg,
  paddingHorizontal: 18,
  paddingTop: 10,
},
cardContainer: {
  flex: 1,
  paddingBottom: 18,
},
card: {
  flex: 1,
  backgroundColor: COLORS.card,
  borderRadius: 22,
  padding: 18,
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "rgba(15,23,42,0.06)",
  ...Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 3 }, // ⬅️ baisse énorme
  }),
},
header: {
  height: 56,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 6,
},
headerTitle: {
  fontSize: 22,
  fontWeight: "900",
  color: COLORS.text,
  letterSpacing: 0.2,
},
headerStep: {
  fontSize: 12,
  fontWeight: "800",
  color: COLORS.orange,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 999,
  backgroundColor: COLORS.orangeSoft,
},
progressTrack: {
  height: 8,
  backgroundColor: "rgba(15,23,42,0.08)",
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
safe: { flex: 1, backgroundColor: COLORS.bg },
questionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
question: {
  fontSize: 17,
  fontWeight: "900",
  color: COLORS.text,
  flex: 1,
},
helper: {
  marginTop: 6,
  color: COLORS.sub,
  fontSize: 13,
  lineHeight: 18,
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
input: { flex: 1, fontSize: 14, color: COLORS.text, marginLeft: 8 },
label: { marginTop: 14, marginBottom: 8, fontSize: 12, fontWeight: "700", color: COLORS.sub },
note: { marginTop: 10, fontSize: 12, color: COLORS.sub, lineHeight: 16 },
grid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  marginTop: 14,
  rowGap: 12,
},
actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 18, gap: 12 },
btn: {
  flex: 1,
  height: 48,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
},
btnGhost: {
  borderWidth: 1,
  borderColor: "rgba(15,23,42,0.10)",
  backgroundColor: "#fff",
},
btnGhostText: { color: COLORS.sub, fontWeight: "900" },
btnPrimary: {
  backgroundColor: COLORS.orange,
},
btnPrimaryText: {
  color: "#fff",
  fontWeight: "900",
  fontSize: 14,
  height: 48,
  lineHeight: 48,
},
tileTextSelected: { color: COLORS.text },
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
bigIcon: {
  width: 54,
  height: 54,
  borderRadius: 27,
  backgroundColor: COLORS.orange,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 12,
},
welcomeTitle: {
  fontSize: 22,
  fontWeight: "900",
  color: COLORS.text,
  marginBottom: 8,
},
welcomeText: {
  fontSize: 13,
  color: COLORS.sub,
  textAlign: "center",
  lineHeight: 18,
},
welcomeContainer: {
  paddingVertical: 24,
  minHeight: 250,
  justifyContent: "space-between",
},
welcomeHero: {
  alignItems: "center",
  paddingTop: 10,
},
welcomeIcon: {
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: COLORS.orange,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 18,
},
welcomeSubtitle: {
  fontSize: 14,
  color: COLORS.sub,
  textAlign: "center",
  lineHeight: 20,
  paddingHorizontal: 10,
},
welcomeContent: {
  paddingHorizontal: 8,
  marginTop: 10,
},
welcomeHighlight: {
  fontWeight: "800",
  color: COLORS.text,
},
welcomeActions: {
  paddingTop: 10,
},
});