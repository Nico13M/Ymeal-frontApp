import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/profileConfig";

interface ConfirmationStepProps {
  isSavingConfig: boolean;
  next: () => void;
  styles?: any;
}

export default function ConfirmationStep({
  isSavingConfig,
  next,
  styles: passedStyles,
}: ConfirmationStepProps) {
  return (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeHero}>
        <Image
          source={require("@/assets/images/logo_ymeal.png")}
          style={styles.finalLogo}
          resizeMode="contain"
        />
        <View style={styles.bigIcon}>
          <Ionicons name="checkmark" size={28} color="#fff" />
        </View>
        <Text style={styles.welcomeTitle}>Parfait !</Text>
        <Text style={styles.welcomeText}>
          Ton profil est prêt. Clique sur le bouton ci-dessous pour entrer dans l'application.
        </Text>
      </View>
      
      <TouchableOpacity
        onPress={next}
        style={[
          styles.btn,
          styles.btnPrimary,
          styles.btnBig,
          isSavingConfig && styles.btnDisabled,
        ]}
        activeOpacity={0.85}
        disabled={isSavingConfig}
      >
        <Text style={styles.btnPrimaryText}>
          {isSavingConfig ? "Enregistrement..." : "C'est parti !"}{" "}
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeContainer: {
    paddingVertical: 24,
    minHeight: 320,
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeHero: {
    alignItems: "center",
    width: "100%",
  },
  finalLogo: {
    width: 140,
    height: 70,
    marginBottom: 20,
  },
  bigIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: COLORS.orange,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 10,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.sub,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  btn: {
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  btnPrimary: {
    backgroundColor: COLORS.orange,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnBig: {
    width: "100%",
    marginTop: 24,
    height: 56,
  },
});
