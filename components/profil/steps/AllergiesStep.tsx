import StepIntro from "@/components/profil/StepIntro";
import { COLORS } from "@/constants/profileConfig";
import { ReferenceItem } from "@/src/services/profile";
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  allergies: string[];
  toggleAllergy: (name: string) => void;
  noAllergiesSelected: boolean;
  onToggleNoAllergies: () => void;
  availableAllergies: ReferenceItem[];
  isLoading?: boolean;
  styles: any;
  isWebDesktop?: boolean;
};

const ALLERGY_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  arachides: "peanut-outline",
  gluten: "barley",
  lactose: "bottle-tonic-outline",
};

function AllergyIcon({ name }: { name: string }) {
  const normalizedName = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalizedName === "fruits de mer") {
    return (
      <FontAwesome6
        name="shrimp"
        solid
        size={26}
        color={COLORS.orange}
        accessible={false}
      />
    );
  }

  return (
    <MaterialCommunityIcons
      name={ALLERGY_ICONS[normalizedName] ?? "food-apple-outline"}
      size={28}
      color={COLORS.orange}
      accessible={false}
    />
  );
}

export default function AllergiesStep({
  allergies,
  toggleAllergy,
  noAllergiesSelected,
  onToggleNoAllergies,
  availableAllergies,
  isLoading = false,
  styles,
  isWebDesktop,
}: Props) {
  return (
    <>
      <StepIntro
        icon="medkit-outline"
        title="As-tu des allergies ?"
        subtitle="Sélectionne toutes celles qui te concernent pour personnaliser tes préférences."
        isWebDesktop={isWebDesktop}
      />

      {isLoading ? (
        <ActivityIndicator color={COLORS.orange} style={{ marginTop: 24 }} />
      ) : (
        <View
          style={[
            styles.grid,
            isWebDesktop && styles.gridDesktop,
            isWebDesktop && allergyStyles.gridDesktop,
          ]}
        >
          {availableAllergies.map((a) => {
            const selected = allergies.includes(a.name);

            return (
              <Pressable
                key={a.id}
                onPress={() => toggleAllergy(a.name)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                style={[
                  styles.tile,
                  isWebDesktop && styles.tileDesktop,
                  selected && styles.tileSelected,
                ]}
              >
                {selected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={COLORS.orange}
                    style={styles.tileCheck}
                  />
                )}

                <AllergyIcon name={a.name} />

                <Text
                  style={[
                    styles.tileText,
                    selected && styles.tileTextSelected,
                  ]}
                >
                  {a.name}
                </Text>
              </Pressable>
            );
          })}

          {/* Nouvelle case : aucune allergie */}
          <Pressable
            onPress={onToggleNoAllergies}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: noAllergiesSelected }}
            style={[
              styles.tile,
              isWebDesktop && styles.tileDesktop,
              noAllergiesSelected && styles.tileSelected,
            ]}
          >
            {noAllergiesSelected && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={COLORS.orange}
                style={styles.tileCheck}
              />
            )}

            <Ionicons
              name="shield-checkmark-outline"
              size={28}
              color={COLORS.orange}
            />

            <Text
              style={[
                styles.tileText,
                noAllergiesSelected && styles.tileTextSelected,
              ]}
            >
              Je n'ai aucune allergie
            </Text>
          </Pressable>
        </View>
      )}

      {!isLoading && (
        <Text
          style={styles.selectionSummary}
          accessibilityLiveRegion="polite"
        >
          {noAllergiesSelected
            ? "Aucune allergie déclarée"
            : allergies.length > 0
              ? `${allergies.length} allergie${allergies.length > 1 ? "s" : ""} sélectionnée${allergies.length > 1 ? "s" : ""}`
              : "Sélectionne tes allergies ou indique que tu n'en as aucune."}
        </Text>
      )}
    </>
  );
}

const allergyStyles = StyleSheet.create({
  gridDesktop: { justifyContent: "flex-start" },
});
