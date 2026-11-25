import { COLORS } from "@/constants/profileConfig";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <Ionicons name="lock-closed-outline" size={28} color={COLORS.orange} />
        </View>
        <Text style={styles.title}>
          Mot de passe oublié
        </Text>

        <Text style={styles.description}>
          La réinitialisation du mot de passe n’est pas encore disponible.
          Réessaie plus tard.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/connexion")}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>
            Retour à la connexion
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1,
     backgroundColor: "#F8FAFC",
  justifyContent: "center",
  padding: 24, },

  // content: { flexGrow: 1, justifyContent: "center", padding: 24 },

  // back: {
  //   position: "absolute",
  //   top: Platform.OS === "web" ? 24 : 56,
  //   left: 20,
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: 2,
  //   backgroundColor: "#FFF",
  //   paddingHorizontal: 12,
  //   paddingVertical: 8,
  //   borderRadius: 999,
  //   ...shadow.soft,
  // },
  // backText: { fontWeight: "700", color: palette.ink },

  
  card: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
  },

  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.orangeSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    color: "#0F172A",
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#475569",
    marginBottom: 20,
  },

  button: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FF7A00",
    height: 50,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },

});
