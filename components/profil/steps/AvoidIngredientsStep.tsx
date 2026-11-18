import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/constants/profileConfig";

/** Même limite que dans la page Profil. */
export const MAX_AVOID_INGREDIENTS = 10;

/** Idées rapides : un tap lance la recherche dans la base. */
const QUICK_IDEAS = ["Champignon", "Poivron", "Oignon", "Brocoli", "Coriandre", "Olive", "Aubergine", "Chou-fleur"];

type Props = {
  step: number;
  vegQuery: string;
  setVegQuery: (value: string) => void;
  vegSuggestions: string[];
  avoidVeg: string[];
  addVeg: (value: string) => void;
  removeAt: (list: string[], idx: number) => string[];
  setAvoidVeg: React.Dispatch<React.SetStateAction<string[]>>;
  styles: any;
  isWebDesktop?: boolean;
};

export default function AvoidIngredientsStep({
  step,
  vegQuery,
  setVegQuery,
  vegSuggestions,
  avoidVeg,
  addVeg,
  removeAt,
  setAvoidVeg,
  styles,
  isWebDesktop,
}: Props) {
  const full = avoidVeg.length >= MAX_AVOID_INGREDIENTS;
  const typing = vegQuery.trim().length > 0;
  const tooShort = typing && vegQuery.trim().length < 3;
  const noResult = vegQuery.trim().length >= 3 && vegSuggestions.length === 0;
  const ideas = QUICK_IDEAS.filter(
    (idea) => !avoidVeg.some((v) => v.toLowerCase().startsWith(idea.toLowerCase().slice(0, 5))),
  ).slice(0, 6);

  return (
    <View style={[s.wrap, isWebDesktop && s.wrapDesktop]}>
      <View style={[styles.questionRow, isWebDesktop && styles.questionRowDesktop]}>
        <Ionicons name="remove-circle-outline" size={18} color={COLORS.orange} />
        <Text style={[styles.question, isWebDesktop && styles.questionDesktop]}>
          Y a-t-il des ingrédients que tu veux éviter ?
        </Text>
      </View>

      <Text style={[styles.helper, isWebDesktop && styles.helperDesktop]}>
        On ne te proposera pas de recettes qui en contiennent. Étape facultative.
      </Text>

      {/* Recherche */}
      <View style={[s.search, full && s.searchDisabled]}>
        <Ionicons name="search" size={18} color={full ? COLORS.muted : COLORS.orange} />
        <TextInput
          key={`veg-step-${step}`}
          value={vegQuery}
          onChangeText={setVegQuery}
          placeholder={full ? "Limite atteinte" : "Rechercher un ingrédient (ex : brocoli)"}
          placeholderTextColor={COLORS.muted}
          style={s.input}
          editable={!full}
          returnKeyType="search"
          blurOnSubmit={false}
          autoCorrect={false}
        />
        {typing && (
          <Pressable onPress={() => setVegQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={COLORS.muted} />
          </Pressable>
        )}
      </View>

      {tooShort && <Text style={s.hint}>Tape au moins 3 lettres…</Text>}
      {noResult && <Text style={s.hint}>Aucun ingrédient trouvé pour « {vegQuery.trim()} ».</Text>}

      {/* Résultats */}
      {vegSuggestions.length > 0 && !full && (
        <View style={s.results}>
          {vegSuggestions.map((v, i) => (
            <Pressable
              key={v}
              onPress={() => addVeg(v)}
              style={({ pressed }) => [s.result, i > 0 && s.resultBorder, pressed && { backgroundColor: COLORS.orangeSoft }]}
            >
              <Text style={s.resultText}>{v}</Text>
              <View style={s.addPill}>
                <Ionicons name="add" size={14} color="#FFF" />
                <Text style={s.addPillText}>Éviter</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Idées rapides */}
      {!typing && !full && ideas.length > 0 && (
        <>
          <Text style={s.sectionLabel}>Idées fréquentes</Text>
          <View style={s.ideas}>
            {ideas.map((idea) => (
              <Pressable key={idea} onPress={() => setVegQuery(idea)} style={s.idea}>
                <Text style={s.ideaText}>{idea}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* Sélection */}
      <View style={s.selectedCard}>
        <View style={s.selectedHead}>
          <Text style={s.selectedTitle}>Ma liste</Text>
          <Text style={[s.counter, full && { color: COLORS.orange }]}>
            {avoidVeg.length}/{MAX_AVOID_INGREDIENTS}
          </Text>
        </View>
        {avoidVeg.length === 0 ? (
          <Text style={s.emptyText}>Aucun ingrédient à éviter pour l'instant.</Text>
        ) : (
          <View style={s.chips}>
            {avoidVeg.map((v, idx) => (
              <Pressable
                key={`${v}-${idx}`}
                onPress={() => setAvoidVeg((prev) => removeAt(prev, idx))}
                style={s.chip}
                accessibilityLabel={`Retirer ${v}`}
              >
                <Ionicons name="ban-outline" size={14} color="#B91C1C" />
                <Text style={s.chipText}>{v}</Text>
                <Ionicons name="close" size={14} color="#B91C1C" />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { width: "100%" },
  wrapDesktop: { maxWidth: 520, alignSelf: "center" },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#F1E5D5",
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 52,
    marginTop: 6,
  },
  searchDisabled: { opacity: 0.6 },
  input: { flex: 1, minWidth: 0, fontSize: 15, color: COLORS.text, height: "100%" },
  hint: { marginTop: 8, marginLeft: 6, fontSize: 13, color: COLORS.sub },
  results: {
    marginTop: 10,
    backgroundColor: "#FFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F1E5D5",
    overflow: "hidden",
  },
  result: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultBorder: { borderTopWidth: 1, borderTopColor: "#F6ECDC" },
  resultText: { fontSize: 15, fontWeight: "600", color: COLORS.text, flex: 1 },
  addPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: COLORS.orange,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  addPillText: { color: "#FFF", fontWeight: "800", fontSize: 12 },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.sub,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  ideas: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  idea: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F1E5D5",
  },
  ideaText: { fontSize: 13.5, fontWeight: "700", color: COLORS.text },
  selectedCard: {
    marginTop: 18,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1E5D5",
  },
  selectedHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  selectedTitle: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  counter: { fontSize: 13, fontWeight: "800", color: COLORS.sub },
  emptyText: { fontSize: 13.5, color: COLORS.muted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipText: { fontSize: 13.5, fontWeight: "700", color: "#991B1B" },
});
