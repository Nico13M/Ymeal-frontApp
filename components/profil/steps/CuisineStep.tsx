import { COLORS } from "@/constants/profileConfig";
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
  return (
    <>
      <View style={[styles.questionRow, isWebDesktop && styles.questionRowDesktop]}>
        <Ionicons name="restaurant-outline" size={18} color={COLORS.orange} />
        <Text style={[styles.question, isWebDesktop && styles.questionDesktop]}>
          As-tu une alimentation favorite ?
        </Text>
      </View>

      <Text style={[styles.helper, isWebDesktop && styles.helperDesktop]}>
        Choisis jusqu&apos;à 6 styles de cuisine.
      </Text>

      {isLoading ? (
        <ActivityIndicator color={COLORS.orange} style={{ marginTop: 24 }} />
      ) : (
        <View style={[styles.chipsWrap, isWebDesktop && styles.chipsWrapDesktop]}>
          {availableCuisines.map((c) => {
            const selected = cuisines.includes(c.name);
            const atLimit = !selected && cuisines.length >= 6;
            return (
              <Pressable
                key={c.id}
                onPress={() => toggleCuisine(c.name)}
                style={[
                  styles.chip,
                  selected && styles.chipSelected,
                  atLimit && styles.chipDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selected && styles.chipTextSelected,
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

      <Text style={[styles.helper, isWebDesktop && styles.helperDesktop]}>
        Sélectionné : {cuisines.length}/6
      </Text>
    </>
  );
}