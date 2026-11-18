import { COLORS } from "@/constants/profileConfig";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type Props = {
  isWebDesktop?: boolean;
};

const PROFILE_HIGHLIGHTS = [
  { icon: "restaurant-outline", label: "Tes goûts" },
  { icon: "wallet-outline", label: "Ton budget" },
  { icon: "heart-outline", label: "Tes besoins" },
] as const;

export default function WelcomeStep({ isWebDesktop }: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.illustration, isWebDesktop && styles.illustrationDesktop]}>
        <View style={styles.halo} />
        <Image
          source={require("@/assets/images/logo_ymeal.png")}
          style={[styles.logo, isWebDesktop && styles.logoDesktop]}
          resizeMode="contain"
          accessibilityLabel="La mascotte Ymeal"
        />
        <View style={styles.sparkles}>
          <Ionicons name="sparkles" size={26} color="#fff" />
        </View>
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, isWebDesktop && styles.titleDesktop]}>
          Bienvenue sur Ymeal
        </Text>

        <Text style={styles.subtitle}>
          Quelques questions pour trouver des recettes qui te ressemblent.
        </Text>
      </View>

      <View style={styles.highlights}>
        {PROFILE_HIGHLIGHTS.map(({ icon, label }) => (
          <View key={label} style={styles.highlight}>
            <Ionicons name={icon} size={22} color={COLORS.orange} />
            <Text style={styles.highlightLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    width: "100%",
  },
  illustration: {
    width: 204,
    height: 204,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  illustrationDesktop: { width: 228, height: 228 },
  halo: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 120,
    backgroundColor: "#FFF1DE",
  },
  logo: { width: 166, height: 180 },
  logoDesktop: { width: 188, height: 204 },
  sparkles: {
    position: "absolute",
    right: -2,
    bottom: 8,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.orange,
    borderWidth: 4,
    borderColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "8deg" }],
  },
  copy: { alignItems: "center", width: "100%", maxWidth: 460 },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  titleDesktop: { fontSize: 34, lineHeight: 42 },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.sub,
    textAlign: "center",
    maxWidth: 310,
    marginTop: 12,
  },
  highlights: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    maxWidth: 400,
    marginTop: 28,
  },
  highlight: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: "#FFF8F0",
  },
  highlightLabel: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    color: COLORS.sub,
    textAlign: "center",
  },
});
