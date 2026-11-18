import { palette, radius, shadow } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type DailyTipCardProps = {
  tip: string;
};

export default function DailyTipCard({ tip }: DailyTipCardProps) {
  return (
    <View style={styles.tipContainer}>
      <View style={styles.tipIconWrap}>
        <Ionicons name="bulb" size={22} color={palette.primaryDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.tipTitle}>Astuce du jour</Text>
        <Text style={styles.tipText}>{tip}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tipContainer: {
    flexDirection: 'row',
    gap: 14,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: radius.lg,
    padding: 18,
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: palette.primaryTint,
    ...shadow.soft,
  },
  tipIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    color: palette.primaryDark,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  tipText: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 22,
  },
});
