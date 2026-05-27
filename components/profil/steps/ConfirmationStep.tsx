import React from "react";

import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";


type Props = {
  isSavingConfig: boolean;

  next: () => void;

  styles: any;
  isWebDesktop?: boolean;
};

export default function ConfirmationStep({
  isSavingConfig,
  next,
  styles,
  isWebDesktop,
}: Props) {
  return (
    <View style={[styles.welcomeContainer, isWebDesktop && styles.welcomeContainerDesktop]}>
      <View style={[styles.welcomeHero, isWebDesktop && styles.welcomeHeroDesktop]}>
        <Image
          source={require("@/assets/images/logo_ymeal.png")}
          style={[styles.finalLogo, isWebDesktop && { width: 100, height: 100, marginBottom: 24 }]}
          resizeMode="contain"
        />

        <View style={[styles.bigIcon, isWebDesktop && { width: 64, height: 64, borderRadius: 32, marginBottom: 24 }]}>
          <Ionicons
            name="checkmark"
            size={28}
            color="#fff"
          />
        </View>

        <Text style={[styles.welcomeTitle, isWebDesktop && styles.welcomeTitleDesktop]}>
          Parfait !
        </Text>

        <Text style={[styles.welcomeText, isWebDesktop && styles.welcomeSubtitleDesktop]}>
          Ton profil est prêt.
          Clique sur le bouton pour entrer
          dans l&apos;app.
        </Text>
      </View>

      <TouchableOpacity
        onPress={next}
        style={[
          styles.btn,
          styles.btnPrimary,
          styles.btnBig,

          isSavingConfig &&
            styles.btnDisabled,
          isWebDesktop && { maxWidth: 420, alignSelf: "center", width: "100%", marginTop: 24 },
        ]}
        activeOpacity={0.85}
        disabled={isSavingConfig}
      >
        <Text style={styles.btnPrimaryText}>
          {isSavingConfig
            ? "Enregistrement..."
            : "C'est parti !"}{" "}
          <Ionicons
            name="arrow-forward"
            size={16}
            color="#fff"
          />
        </Text>
      </TouchableOpacity>
    </View>
  );
}