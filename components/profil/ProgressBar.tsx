import { COLORS } from "@/constants/profileConfig";
import React from "react";
import { StyleSheet, View } from "react-native";

interface ProgressBarProps {
  progress: number;
  isWebDesktop?: boolean;
}

export default function ProgressBar({ progress, isWebDesktop }: ProgressBarProps) {
  return (
    <View style={[styles.progressTrack, isWebDesktop && styles.progressTrackDesktop]}>
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
  progressTrackDesktop: {
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.orange,
    borderRadius: 999,
  },
});