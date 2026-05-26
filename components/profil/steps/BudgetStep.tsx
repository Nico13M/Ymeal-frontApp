import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/profileConfig";
import { BudgetChoice } from "@/types/profil";
import ChoiceCard from "@/components/ui/ChoiceCard";

interface BudgetStepProps {
  budget: BudgetChoice | null;
  setBudget: (value: BudgetChoice) => void;
  styles?: any;
}

export default function BudgetStep({ budget, setBudget, styles: passedStyles }: BudgetStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.questionRow}>
        <Ionicons name="wallet-outline" size={18} color={COLORS.orange} />
        <Text style={styles.question}>Quel est ton budget mensuel ?</Text>
      </View>
      <Text style={styles.helper}>Cela nous permet de te proposer des recettes adaptées.</Text>
      <View style={styles.choicesContainer}>
        <ChoiceCard
          onPress={() => setBudget("PETIT")}
          selected={budget === "PETIT"}
          icon="💰"
          title="Petit budget"
          subtitle="Moins de 100€ / mois"
        />
        <ChoiceCard
          onPress={() => setBudget("MOYEN")}
          selected={budget === "MOYEN"}
          icon="💵"
          title="Budget moyen"
          subtitle="Entre 100€ et 200€ / mois"
        />
        <ChoiceCard
          onPress={() => setBudget("LARGE")}
          selected={budget === "LARGE"}
          icon="💸"
          title="Budget large"
          subtitle="Plus de 200€ / mois"
        />
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
  choicesContainer: {
    marginTop: 8,
  },
});
