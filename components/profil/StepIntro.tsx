import { COLORS } from "@/constants/profileConfig";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  isWebDesktop?: boolean;
};

export default function StepIntro({ icon, title, subtitle, isWebDesktop }: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.icon, isWebDesktop && styles.iconDesktop]}>
        <Ionicons name={icon} size={30} color={COLORS.orange} />
      </View>
      <Text accessibilityRole="header" style={[styles.title, isWebDesktop && styles.titleDesktop]}>
        {title}
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", width: "100%" },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#FFF1DE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconDesktop: { width: 72, height: 72, borderRadius: 24 },
  title: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "900",
    letterSpacing: -0.4,
    color: COLORS.text,
    textAlign: "center",
  },
  titleDesktop: { fontSize: 28, lineHeight: 36 },
  subtitle: {
    maxWidth: 460,
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.sub,
    textAlign: "center",
  },
});
