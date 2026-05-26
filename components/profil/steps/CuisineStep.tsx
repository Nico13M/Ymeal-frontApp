import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, CUISINES } from "@/constants/profileConfig";
import Chip from "@/components/ui/Chip";

interface CuisineStepProps {
  cuisines: string[];
  toggleCuisine: (c: string) => void;
  styles?: any;
}

export default function CuisineStep({ cuisines, toggleCuisine, styles: passedStyles }: CuisineStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.questionRow}>
        <Ionicons name="restaurant-outline" size={18} color={COLORS.orange} />
        <Text style={styles.question}>As-tu une alimentation favorite ?</Text>
      </View>
      <Text style={styles.helper}>Choisis jusqu'à 6 styles de cuisine.</Text>
      
      <View style={styles.chipsWrap}>
        {CUISINES.map((c) => {
          const selected = cuisines.includes(c);
          const atLimit = !selected && cuisines.length >= 6;
          return (
            <Chip
              key={c}
              label={c}
              selected={selected}
              disabled={atLimit}
              onPress={() => toggleCuisine(c)}
            />
          );
        })}
      </View>
      
      <Text style={styles.footerHelper}>Sélectionné : {cuisines.length} / 6</Text>
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
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 10,
  },
  footerHelper: {
    marginTop: 14,
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: "700",
  },
});
