import { StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/constants/profileConfig";
import { getProfileProgress } from "@/src/lib/profile-progress";
import StepBackButton from "./StepBackButton";

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
  const { currentStep } = getProfileProgress(step, totalSteps);
  return (
    <>
      <View style={[styles.header, isWebDesktop && styles.headerDesktop]}>
        <Text style={[styles.headerTitle, isWebDesktop && styles.headerTitleDesktop]}>
          Personnalise ton profil
        </Text>

        {!isWebDesktop && <Text style={styles.headerStep}>{currentStep}/{totalSteps}</Text>}
      </View>

      {!isWebDesktop && step > 0 && <StepBackButton onPress={onBack} />}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },

  headerDesktop: {
    paddingHorizontal: 0,
    minHeight: 64,
    justifyContent: "center",
    marginBottom: 16,
  },

  headerTitle: {
    flexShrink: 1,
    marginRight: 12,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 0.2,
  },

  headerTitleDesktop: {
    fontSize: 28,
    lineHeight: 36,
    marginRight: 0,
    textAlign: "center",
  },

  headerStep: {
    flexShrink: 0,
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.orange,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.orangeSoft,
  },

});
