import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function InscriptionScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const canSubmit = useMemo(() => {
    return (
      email.trim().length > 3 &&
      password.length >= 6 &&
      confirm.length >= 6 &&
      password === confirm
    );
  }, [email, password, confirm]);

  const onContinue = () => {
    if (!email.trim()) return Alert.alert("Erreur", "Renseigne ton email.");
    if (password.length < 6)
      return Alert.alert("Erreur", "Mot de passe trop court (min 6).");
    if (password !== confirm)
      return Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
    Alert.alert("OK", "Compte en cours de création (bientôt).");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Ionicons name="restaurant" size={22} color="#fff" />
        </View>
        <Text style={styles.brand}>Ymeal</Text>
        <Text style={styles.tagline}>Des recettes adaptées à ton budget étudiant</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Créer un compte</Text>
        <Text style={styles.label}>Adresse email</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={18} color="#9AA3AF" />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="ton.email@etudiant.fr"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>
        <Text style={styles.label}>Mot de passe</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color="#9AA3AF" />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />
        </View>
        <Text style={styles.label}>Confirmation du mot de passe</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color="#9AA3AF" />
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={onContinue}
          activeOpacity={0.85}
          disabled={!canSubmit}
        >
          <Text style={styles.buttonText}>Continuer</Text>
        </TouchableOpacity>
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Déjà un compte ? </Text>
          <Link href="/connexion" style={styles.loginLink}>
            Se connecter
          </Link>
        </View>
        


        <Text style={styles.legal}>
          En continuant, tu acceptes nos conditions d&apos;utilisation
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7EC",
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 22,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF7A00",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brand: {
    fontSize: 34,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  tagline: {
    marginTop: 6,
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginTop: 6,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#0F172A",
  },

  button: {
    backgroundColor: "#FF7A00",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  legal: {
    marginTop: 12,
    fontSize: 11,
    textAlign: "center",
    color: "#64748B",
    lineHeight: 16,
  },
  loginRow: {
  flexDirection: "row",
  justifyContent: "center",
  marginTop: 14,
},

loginText: {
  fontSize: 13,
  color: "#475569",
},

loginLink: {
  fontSize: 13,
  fontWeight: "700",
  color: "#FF7A00",
},

});
