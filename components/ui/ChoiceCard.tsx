import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/profileConfig';

interface ChoiceCardProps {
  onPress: () => void;
  selected: boolean;
  icon: string;
  title: string;
  subtitle?: string;
}

export default function ChoiceCard({
  onPress,
  selected,
  icon,
  title,
  subtitle,
}: ChoiceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choiceRow, selected && styles.choiceRowSelected]}
    >
      <Text style={styles.choiceIcon}>{icon}</Text>
      <View style={styles.textContainer}>
        <Text style={styles.choiceTitle}>{title}</Text>
        {subtitle && <Text style={styles.choiceSub}>{subtitle}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  choiceRowSelected: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeSoft,
  },
  choiceIcon: {
    fontSize: 26,
    marginRight: 4,
  },
  textContainer: {
    flex: 1,
  },
  choiceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  choiceSub: {
    fontSize: 12,
    color: COLORS.sub,
    marginTop: 3,
    fontWeight: '500',
  },
});
