import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, DIETS } from "@/constants/profileConfig";

interface DietStepProps {
  diets: string[];
  toggleDiet: (key: string) => void;
  styles?: any;
}

export default function DietStep({ diets, toggleDiet, styles: passedStyles }: DietStepProps) {
  return (
    <View style={styles.container}>
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
              style={[styles.tile, selected && styles.tileSelected]}
            >
              <Text style={styles.tileEmoji}>{d.icon}</Text>
              <Text style={[styles.tileText, selected && styles.tileTextSelected]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
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
