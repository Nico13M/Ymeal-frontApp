import StepIntro from "@/components/profil/StepIntro";
import InputField from "@/components/ui/InputField";
import { COLORS } from "@/constants/profileConfig";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

/** Même limite que dans la page Profil. */
export const MAX_AVOID_INGREDIENTS = 10;

/** Idées rapides : un tap lance la recherche dans la base. */
const QUICK_IDEAS = ["Champignon", "Poivron", "Oignon", "Brocoli", "Coriandre", "Olive", "Aubergine", "Chou-fleur"];

type Props = {
  vegQuery: string;
  setVegQuery: (value: string) => void;
  vegSuggestions: string[];
  avoidVeg: string[];
  addVeg: (value: string) => void;
  removeAt: (list: string[], idx: number) => string[];
  setAvoidVeg: React.Dispatch<React.SetStateAction<string[]>>;
  isLoading?: boolean;
  styles: any;
  isWebDesktop?: boolean;
};

export default function AvoidIngredientsStep({
  vegQuery,
  setVegQuery,
  vegSuggestions,
  avoidVeg,
  addVeg,
  removeAt,
  setAvoidVeg,
  isLoading = false,
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
    <>
      <StepIntro
        icon="nutrition-outline"
        title="Quels ingrédients veux-tu éviter ?"
        subtitle="Recherche un ingrédient et ajoute-le à ta liste. Tu peux aussi passer cette étape."
        isWebDesktop={isWebDesktop}
      />

      <View style={[ingredientStyles.content, isWebDesktop && ingredientStyles.contentDesktop]}>
          <InputField
            icon="search-outline"
            iconSize={20}
            containerStyle={[styles.inputWrap, ingredientStyles.searchField]}
            focusedContainerStyle={styles.inputWrapFocused}
            value={vegQuery}
            onChangeText={setVegQuery}
            accessibilityLabel="Rechercher un ingrédient à éviter"
            placeholder="Ex. : brocoli, oignon, champignon…"
            placeholderTextColor={COLORS.muted}
            style={[styles.input, ingredientStyles.searchInput]}
            autoCorrect={false}
            returnKeyType="search"
            submitBehavior="submit"
            trailing={vegQuery.length > 0 ? (
              <Pressable
                onPress={() => setVegQuery("")}
                accessibilityRole="button"
                accessibilityLabel="Effacer la recherche"
                style={ingredientStyles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.muted} />
              </Pressable>
            ) : undefined}
          />

        {isLoading ? (
          <View style={ingredientStyles.searchState} accessibilityLiveRegion="polite">
            <ActivityIndicator size="small" color={COLORS.orange} />
            <Text style={ingredientStyles.hint}>Recherche en cours…</Text>
          </View>
        ) : vegSuggestions.length > 0 ? (
          <View style={ingredientStyles.results}>
            <Text style={ingredientStyles.resultsTitle}>Suggestions</Text>
            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {vegSuggestions.map((ingredient) => (
                <Pressable
                  key={ingredient}
                  onPress={() => addVeg(ingredient)}
                  accessibilityRole="button"
                  accessibilityLabel={`Éviter ${ingredient}`}
                  style={({ pressed }) => [ingredientStyles.resultRow, pressed && ingredientStyles.pressed]}
                >
                  <Text style={ingredientStyles.resultText}>{ingredient}</Text>
                  <Ionicons name="add-circle-outline" size={22} color={COLORS.orange} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : (
          <Text style={ingredientStyles.searchHint} accessibilityLiveRegion="polite">
            {vegQuery.trim().length >= 3
              ? "Aucun nouvel ingrédient trouvé. Essaie un autre nom."
              : "Saisis au moins 3 lettres pour afficher les suggestions."}
          </Text>
        )}

        <View style={ingredientStyles.selection}>
          <Text style={ingredientStyles.selectionTitle}>
            Ingrédients à éviter ({avoidVeg.length})
          </Text>
          {avoidVeg.length > 0 ? (
            <View style={ingredientStyles.selectedWrap}>
              {avoidVeg.map((ingredient, idx) => (
                <Pressable
                  key={ingredient}
                  onPress={() => setAvoidVeg((prev) => removeAt(prev, idx))}
                  accessibilityRole="button"
                  accessibilityLabel={`Retirer ${ingredient} des ingrédients à éviter`}
                  style={({ pressed }) => [ingredientStyles.selectedChip, pressed && ingredientStyles.pressed]}
                >
                  <Text style={ingredientStyles.selectedChipText}>{ingredient}</Text>
                  <Ionicons name="close-circle" size={20} color={COLORS.orange} />
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={ingredientStyles.hint}>
              Aucun ingrédient ajouté. Tu peux passer cette étape.
            </Text>
          )}
        </View>
      </View>
    </>
  );
}

const ingredientStyles = StyleSheet.create({
  content: { width: "100%", marginTop: 28 },
  contentDesktop: { maxWidth: 600, alignSelf: "center" },
  searchField: { paddingLeft: 14, paddingRight: 4, minHeight: 52 },
  searchInput: { minWidth: 0, height: "100%" },
  clearButton: { padding: 10 },
  hint: { color: COLORS.sub, fontSize: 13, lineHeight: 20 },
  searchHint: { color: COLORS.sub, fontSize: 13, lineHeight: 20, marginTop: 10 },
  searchState: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  results: {
    marginTop: 12,
    maxHeight: 280,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: "hidden",
  },
  resultsTitle: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.sub,
    backgroundColor: "#F8FAFC",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 52,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  resultText: { flex: 1, fontSize: 14, lineHeight: 20, color: COLORS.text },
  pressed: { backgroundColor: COLORS.orangeSoft },
  selection: { marginTop: 24, gap: 12 },
  selectionTitle: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  selectedWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "100%",
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FED7AA",
    backgroundColor: "#FFF7ED",
  },
  selectedChipText: { flexShrink: 1, color: "#9A3412", fontSize: 14, fontWeight: "600", lineHeight: 20 },
});
