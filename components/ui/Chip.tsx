import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS } from '@/constants/profileConfig';

interface ChipProps {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export default function Chip({ label, selected, disabled = false, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        disabled && styles.chipDisabled,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          selected && styles.chipTextSelected,
          disabled && styles.chipTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  chipSelected: {
    borderColor: COLORS.orange,
    backgroundColor: COLORS.orangeSoft,
  },
  chipDisabled: {
    opacity: 0.45,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.orange,
  },
  chipTextDisabled: {
    color: COLORS.muted,
  },
});
