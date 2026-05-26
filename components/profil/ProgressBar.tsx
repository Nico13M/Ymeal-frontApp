import React from "react";
import { StyleSheet, View } from "react-native";
import { COLORS } from "@/constants/profileConfig";

interface ProgressBarProps {
  progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(15,23,42,0.08)",
    borderRadius: 999,
    overflow: "hidden",
    marginHorizontal: 6,
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.orange,
    borderRadius: 999,
  },
});
