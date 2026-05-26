import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/profileConfig";

interface StepHeaderProps {
  step: number;
  totalSteps: number;
  onBack: () => void;
}

export default function StepHeader({ step, totalSteps, onBack }: StepHeaderProps) {
  return (
    <View style={styles.container}>
      {step > 0 && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      )}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Personnalise ton profil</Text>
        <Text style={styles.headerStep}>
          {step === 0
            ? `0/${totalSteps}`
            : step >= 8
            ? `${totalSteps}/${totalSteps}`
            : `${step}/${totalSteps}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 6,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  headerStep: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.orange,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.orangeSoft,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  backText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
});
