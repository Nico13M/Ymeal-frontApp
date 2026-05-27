import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "@/constants/profileConfig";

type Props = {
  step: number;
  totalSteps: number;
  onBack: () => void;
  isWebDesktop?: boolean;
};

export default function StepHeader({
  step,
  totalSteps,
  onBack,
  isWebDesktop,
}: Props) {
  return (
    <>
      <View style={[styles.header, isWebDesktop && styles.headerDesktop]}>
        <Text style={[styles.headerTitle, isWebDesktop && styles.headerTitleDesktop]}>
          Personnalise ton profil
        </Text>

        <Text style={styles.headerStep}>
          {step === 0
            ? `0/${totalSteps}`
            : step >= 8
            ? `${totalSteps}/${totalSteps}`
            : `${step}/${totalSteps}`}
        </Text>
      </View>

      {step > 0 && (
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backButton, isWebDesktop && styles.backButtonDesktop]}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={COLORS.text}
          />

          <Text style={styles.backText}>
            Retour
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },

  headerDesktop: {
    paddingHorizontal: 0,
    marginBottom: 8,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 0.2,
  },

  headerTitleDesktop: {
    fontSize: 24,
    lineHeight: 32,
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

  backButtonDesktop: {
    marginBottom: 16,
  },

  backText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
});