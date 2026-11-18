import { COLORS } from "@/constants/profileConfig";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = { onPress: () => void; isWebDesktop?: boolean };

export default function StepBackButton({ onPress, isWebDesktop }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.backButton, isWebDesktop && styles.backButtonDesktop]}
    >
      <Ionicons name="arrow-back" size={20} color={COLORS.text} />
      <Text style={styles.backText}>Retour</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  backButtonDesktop: { minHeight: 44, marginBottom: 0, paddingRight: 12, borderRadius: 12 },
  backText: { marginLeft: 6, fontSize: 13, fontWeight: "700", color: COLORS.text },
});
