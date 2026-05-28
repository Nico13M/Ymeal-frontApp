import React from "react";

import {
  Image,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";


type Props = {
  styles: any;
  isWebDesktop?: boolean;
};

export default function WelcomeStep({
  styles,
  isWebDesktop,
}: Props) {
  return (
    <View style={[styles.welcomeContainer, isWebDesktop && styles.welcomeContainerDesktop]}>
      <View style={[styles.welcomeHero, isWebDesktop && styles.welcomeHeroDesktop]}>
        <Image
          source={require("@/assets/images/logo_ymeal.png")}
          style={[styles.welcomeLogo, isWebDesktop && styles.welcomeLogoDesktop]}
          resizeMode="contain"
        />

        <View style={[styles.welcomeIcon, isWebDesktop && styles.welcomeIconDesktop]}>
          <Ionicons
            name="sparkles"
            size={28}
            color="#fff"
          />
        </View>

        <Text style={[styles.welcomeTitle, isWebDesktop && styles.welcomeTitleDesktop]}>
          Bienvenue sur Ymeal
        </Text>

        <Text style={[styles.welcomeSubtitle, isWebDesktop && styles.welcomeSubtitleDesktop]}>
          On va te poser quelques
          questions rapides...
        </Text>
      </View>
    </View>
  );
}