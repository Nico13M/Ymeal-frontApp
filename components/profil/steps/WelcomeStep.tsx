import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/profileConfig";

interface WelcomeStepProps {
  styles?: any;
}

export default function WelcomeStep({ styles: passedStyles }: WelcomeStepProps) {
  return (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeHero}>
        <Image
          source={require("@/assets/images/logo_ymeal.png")}
          style={styles.welcomeLogo}
          resizeMode="contain"
        />

        <View style={styles.welcomeIcon}>
          <Ionicons name="sparkles" size={28} color="#fff" />
        </View>

        <Text style={styles.welcomeTitle}>Bienvenue sur Ymeal</Text>

        <Text style={styles.welcomeSubtitle}>
          On va te poser quelques questions rapides pour adapter les recettes à ton
          budget, ton régime et tes goûts.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeContainer: {
    paddingVertical: 24,
    minHeight: 280,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeHero: {
    alignItems: "center",
    width: "100%",
  },
  welcomeLogo: {
    width: 150,
    height: 75,
    marginBottom: 20,
  },
  welcomeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
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
  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.sub,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
});
