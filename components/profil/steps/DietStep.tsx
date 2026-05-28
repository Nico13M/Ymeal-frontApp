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
      <View style={[styles.questionRow, isWebDesktop && styles.questionRowDesktop]}>
        <Ionicons name="leaf-outline" size={18} color={COLORS.orange} />
        <Text style={[styles.question, isWebDesktop && styles.questionDesktop]}>
          Quel est ton régime alimentaire ?
        </Text>
      </View>

      <Text style={[styles.helper, isWebDesktop && styles.helperDesktop]}>
        Tu peux en sélectionner plusieurs.
      </Text>

      {isLoading ? (
        <ActivityIndicator color={COLORS.orange} style={{ marginTop: 24 }} />
      ) : (
        <View style={[styles.grid, isWebDesktop && styles.gridDesktop]}>
          {availableDiets.map((d) => {
            const selected = diets.includes(d.name);
            return (
              <TouchableOpacity
                key={d.id}
                onPress={() => toggleDiet(d.name)}
                activeOpacity={0.85}
                style={[styles.tile, selected && styles.tileSelected]}
              >
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
    </>
  );
}