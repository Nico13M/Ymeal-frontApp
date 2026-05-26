import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/profileConfig";
import { PeopleChoice } from "@/types/profil";
import ChoiceCard from "@/components/ui/ChoiceCard";

interface PeopleStepProps {
  people: PeopleChoice | null;
  setPeople: (value: PeopleChoice) => void;
  styles?: any;
}

export default function PeopleStep({ people, setPeople, styles: passedStyles }: PeopleStepProps) {
  const choices = [
    { key: "1", label: "1 personne", icon: "🧑" },
    { key: "2", label: "2 personnes", icon: "🧑‍🤝‍🧑" },
    { key: "3-4", label: "3-4 personnes", icon: "👨‍👩‍👧" },
    { key: "5+", label: "5+ personnes", icon: "👨‍👩‍👧‍👦" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.questionRow}>
        <Ionicons name="people-outline" size={18} color={COLORS.orange} />
        <Text style={styles.question}>Pour combien de personnes cuisines-tu ?</Text>
      </View>
      <Text style={styles.helper}>Nous ajusterons automatiquement les portions des recettes.</Text>
      <View style={styles.choicesContainer}>
        {choices.map((p) => (
          <ChoiceCard
            key={p.key}
            onPress={() => setPeople(p.key as PeopleChoice)}
            selected={people === (p.key as PeopleChoice)}
            icon={p.icon}
            title={p.label}
          />
        ))}
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
    marginTop: 10,
  },
});
