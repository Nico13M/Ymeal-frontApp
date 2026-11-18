import { COLORS } from "@/constants/profileConfig";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type Props = {
  isWebDesktop?: boolean;
};

export default function ConfirmationStep({ isWebDesktop }: Props) {
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
        <View style={styles.successBadge}>
          <Ionicons name="checkmark" size={32} color="#fff" />
        </View>
      </View>

      <View style={styles.copy}>
        <Text accessibilityRole="header" style={[styles.title, isWebDesktop && styles.titleDesktop]}>
          Parfait !
        </Text>
        <Text style={styles.subtitle}>
          Ton profil est prêt. Découvre maintenant des recettes qui te ressemblent.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    width: "100%",
  },
  illustration: {
    width: 204,
    height: 204,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
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
  successBadge: {
    position: "absolute",
    right: -2,
    bottom: 8,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: COLORS.card,
    backgroundColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { alignItems: "center", width: "100%", maxWidth: 460 },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: COLORS.text,
    textAlign: "center",
  },
  titleDesktop: { fontSize: 36, lineHeight: 44 },
  subtitle: {
    marginTop: 12,
    maxWidth: 310,
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.sub,
    textAlign: "center",
  },
});
