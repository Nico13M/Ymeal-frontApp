import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { COLORS } from "@/constants/profileConfig";

type Props = {
  children: React.ReactNode;
};

export default function ProfilCard({ children }: Props) {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
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
});