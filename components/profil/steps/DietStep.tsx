import StepIntro from "@/components/profil/StepIntro";
import { COLORS } from "@/constants/profileConfig";
import { ReferenceItem } from "@/src/services/profile";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

type Props = {
  diets: string[];           // noms sélectionnés (identifiants métier = name)
  toggleDiet: (name: string) => void;
  availableDiets: ReferenceItem[];
  isLoading?: boolean;
  styles: any;
  isWebDesktop?: boolean;
};

const DIET_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  flexitarien: "leaf-outline",
  halal: "checkmark-circle-outline",
  omnivore: "restaurant-outline",
  "sans gluten": "nutrition-outline",
  vegan: "flower-outline",
  vegetarien: "leaf-outline",
};

export default function DietStep({
  diets,
  toggleDiet,
  availableDiets,
  isLoading = false,
  styles,
  isWebDesktop,
}: Props) {
  return (
    <>
      <StepIntro
        icon="leaf-outline"
        title="Quel est ton régime alimentaire ?"
        subtitle="Sélectionne les habitudes alimentaires qui te correspondent. Plusieurs choix possibles."
        isWebDesktop={isWebDesktop}
      />

      {isLoading ? (
        <ActivityIndicator color={COLORS.orange} style={{ marginTop: 24 }} />
      ) : (
        <View style={[styles.grid, isWebDesktop && styles.gridDesktop]}>
          {availableDiets.map((d) => {
            const selected = diets.includes(d.name);
            const normalizedName = d.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return (
              <TouchableOpacity
                key={d.id}
                onPress={() => toggleDiet(d.name)}
                activeOpacity={0.85}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                style={[styles.tile, isWebDesktop && styles.tileDesktop, selected && styles.tileSelected]}
              >
                {selected && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.orange} style={styles.tileCheck} />
                )}
                <Ionicons name={DIET_ICONS[normalizedName] ?? "leaf-outline"} size={26} color={COLORS.orange} />
                <Text
                  style={[
                    styles.tileText,
                    selected && styles.tileTextSelected,
                  ]}
                >
                  {d.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {!isLoading && (
        <Text style={styles.selectionSummary} accessibilityLiveRegion="polite">
          {diets.length === 0
            ? "Choisis au moins un régime alimentaire."
            : `${diets.length} régime${diets.length > 1 ? "s" : ""} sélectionné${diets.length > 1 ? "s" : ""}`}
        </Text>
      )}
    </>
  );
}
