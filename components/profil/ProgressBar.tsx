import { COLORS } from "@/constants/profileConfig";
import { getProfileProgress } from "@/src/lib/profile-progress";
import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from "react-native";

interface ProgressBarProps {
  step: number;
  totalSteps: number;
  isWebDesktop?: boolean;
}

// Keep the mobile markup and styles separate from the desktop animation.
export default function ProgressBar({ step, totalSteps, isWebDesktop }: ProgressBarProps) {
  const state = getProfileProgress(step, totalSteps);
  if (isWebDesktop) return <DesktopProgressBar {...state} />;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${state.progress * 100}%` }]} />
    </View>
  );
}

function DesktopProgressBar({ progress, percentage, currentStep, totalSteps }: ReturnType<typeof getProfileProgress>) {
  const animatedProgress = useRef(new Animated.Value(progress)).current;
  const [displayedProgress, setDisplayedProgress] = useState(progress);
  const [trackWidth, setTrackWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { mounted = false; subscription?.remove(); };
  }, []);

  useEffect(() => {
    const listener = animatedProgress.addListener(({ value }) => setDisplayedProgress(value));
    return () => animatedProgress.removeListener(listener);
  }, [animatedProgress]);

  useEffect(() => {
    if (reduceMotion) {
      animatedProgress.setValue(progress);
      return;
    }
    const animation = Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 400,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animatedProgress, progress, reduceMotion]);

  const width = animatedProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const labelFits = trackWidth * displayedProgress >= 56;
  const label = `${Math.round(displayedProgress * 100)} %`;

  return (
    <View
      style={styles.desktopProgress}
      accessibilityRole="progressbar"
      accessibilityLabel="Progression de la personnalisation du profil"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
      aria-valuetext={`Étape ${currentStep} sur ${totalSteps}`}
    >
      <View style={styles.desktopTrack} onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}>
        <Animated.View testID="profile-progress-fill" style={[styles.progressFill, styles.desktopFill, { width }]}>
          {labelFits && <Text style={styles.percentage}>{label}</Text>}
        </Animated.View>
        {!labelFits && (
          <Animated.View style={[styles.smallFillLabel, { left: width }]}>
            <Text style={styles.percentage}>{label}</Text>
          </Animated.View>
        )}
      </View>
      <Text style={styles.desktopCounter}>{currentStep}/{totalSteps}</Text>
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
  desktopProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
    marginBottom: 24,
  },
  desktopTrack: {
    flex: 1,
    minWidth: 0,
    height: 32,
    backgroundColor: "rgba(15,23,42,0.08)",
    borderRadius: 999,
    overflow: "hidden",
  },
  desktopFill: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  percentage: { color: COLORS.text, fontSize: 13, lineHeight: 18, fontWeight: "800" },
  smallFillLabel: { position: "absolute", top: 0, bottom: 0, marginLeft: 12, justifyContent: "center" },
  desktopCounter: { minWidth: 24, color: COLORS.orange, fontSize: 14, lineHeight: 22, fontWeight: "800", textAlign: "right" },
});
