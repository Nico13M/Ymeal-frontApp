import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const onSend = async () => {
    try {
      // appel API ici plus tard

      setSuccess(true);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          Mot de passe oublié
        </Text>

        <Text style={styles.description}>
          Entre ton adresse email pour recevoir
          un lien de réinitialisation.
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="tonemail@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={onSend}
        >
          <Text style={styles.buttonText}>
            Envoyer le lien
          </Text>
        </TouchableOpacity>

        {success && (
          <Text style={styles.success}>
            Si un compte existe avec cet email,
            un lien a été envoyé.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7EC",
    justifyContent: "center",
    padding: 24,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    color: "#0F172A",
  },

  description: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
  },

  button: {
    backgroundColor: "#FF7A00",
    height: 46,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },

  success: {
    marginTop: 16,
    color: "green",
    textAlign: "center",
  },
});