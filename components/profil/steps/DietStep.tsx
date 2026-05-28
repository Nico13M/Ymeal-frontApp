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

const styles = StyleSheet.create({
  container: {
    width: "100%",
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
  helper: {
    marginTop: 6,
    color: COLORS.sub,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  tile: {
    width: "48%",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tileSelected: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeSoft,
  },
  tileEmoji: {
    fontSize: 26,
    marginBottom: 8,
  },
  tileText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  tileTextSelected: {
    color: COLORS.orange,
  },
});
