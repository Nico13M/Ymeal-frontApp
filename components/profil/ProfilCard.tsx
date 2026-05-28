import { COLORS } from "@/constants/profileConfig";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

type Props = {
  children: React.ReactNode;
  isWebDesktop?: boolean;
};

export default function ProfilCard({ children, isWebDesktop }: Props) {
  return (
    <View style={[styles.cardContainer, isWebDesktop && styles.cardContainerDesktop]}>
      <View style={[styles.card, isWebDesktop && styles.cardDesktop]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    paddingBottom: 20,
    width: "100%",
    alignSelf: "center",
  },
  cardContainerDesktop: {
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.05)",
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOpacity: 0.05,
        shadowRadius: 16,
        shadowOffset: {
          width: 0,
          height: 6,
        },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardDesktop: {
    maxWidth: 800,
    alignSelf: "center",
    borderRadius: 16,
    padding: 32,
    ...Platform.select({
      web: {
        boxShadow: "0px 8px 24px rgba(0,0,0,0.08)",
      },
    }),
  },
});