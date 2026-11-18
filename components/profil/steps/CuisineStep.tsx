import StepIntro from "@/components/profil/StepIntro";
import { COLORS, MAX_CUISINE_SELECTIONS } from "@/constants/profileConfig";
import { ReferenceItem } from "@/src/services/profile";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type Props = {
  cuisines: string[];           // noms sélectionnés
  toggleCuisine: (name: string) => void;
  availableCuisines: ReferenceItem[];
  isLoading?: boolean;
  styles: any;
  isWebDesktop?: boolean;
};

export default function CuisineStep({
  cuisines,
  toggleCuisine,
  availableCuisines,
  isLoading = false,
  styles,
  isWebDesktop,
}: Props) {
  const selectionLimit = Math.min(MAX_CUISINE_SELECTIONS, availableCuisines.length);

  return (
    <>
      <StepIntro
        icon="restaurant-outline"
        title="Quelles cuisines te font envie ?"
        subtitle={isLoading
          ? "Chargement des styles de cuisine…"
          : selectionLimit === 0
            ? "Aucun style de cuisine disponible pour le moment."
            : `Choisis jusqu’à ${selectionLimit} style${selectionLimit > 1 ? "s" : ""} de cuisine pour inspirer tes prochains repas.`}
        isWebDesktop={isWebDesktop}
      />

      {isLoading ? (
        <ActivityIndicator color={COLORS.orange} style={{ marginTop: 24 }} />
      ) : (
        <View style={[styles.grid, isWebDesktop && styles.gridDesktop]}>
          {availableCuisines.map((c) => {
            const selected = cuisines.includes(c.name);
            const atLimit = !selected && cuisines.length >= selectionLimit;
            return (
              <Pressable
                key={c.id}
                onPress={() => toggleCuisine(c.name)}
                disabled={atLimit}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled: atLimit }}
                style={[
                  styles.tile,
                  isWebDesktop && styles.tileDesktop,
                  selected && styles.tileSelected,
                  atLimit && styles.chipDisabled,
                ]}
              >
                {selected && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.orange} style={styles.tileCheck} />
                )}
                <Ionicons name="restaurant-outline" size={26} color={atLimit ? COLORS.muted : COLORS.orange} />
                <Text
                  style={[
                    styles.tileText,
                    selected && styles.tileTextSelected,
                    atLimit && styles.chipTextDisabled,
                  ]}
                >
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {!isLoading && selectionLimit > 0 && (
        <Text style={styles.selectionSummary} accessibilityLiveRegion="polite">
          Sélection : {cuisines.length}/{selectionLimit}
        </Text>
      )}
    </>
  );
}
