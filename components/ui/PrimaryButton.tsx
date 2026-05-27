// components/ui/PrimaryButton.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;

  disabled?: boolean;
  loading?: boolean;

  icon?: keyof typeof Ionicons.glyphMap;

  variant?: Variant;

  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function PrimaryButton({
  children,
  onPress,

  disabled = false,
  loading = false,

  icon,

  variant = 'primary',

  style,
  textStyle,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        variantStyles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
    >
{loading ? (
  <ActivityIndicator
    color={variant === 'outline' ? '#FF7A00' : '#FFFFFF'}
  />
) : (
  <View style={styles.content}>
    <Text
      style={[
        styles.text,
        textVariantStyles[variant],
        textStyle,
      ]}
    >
      {children}
    </Text>

    {icon ? (
      <Ionicons
        name="arrow-forward-outline"
        size={18}
        color={getTextColor(variant)}
        style={styles.icon}
      />
    ) : null}
  </View>
)}
    </Pressable>
  );
}

function getTextColor(variant: Variant) {
  switch (variant) {
    case 'outline':
      return '#FF7A00';

    default:
      return '#FFFFFF';
  }
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',

    paddingHorizontal: 20,

    width: '100%', // ← IMPORTANT
  },

content: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},

icon: {
  marginLeft: 6,
},

text: {
  fontSize: 16,
  fontWeight: '700',
  textAlign: 'center',
},

  disabled: {
    opacity: 0.6,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: '#FF7A00',
  },

  secondary: {
    backgroundColor: '#2D2D2D',
  },

  outline: {
    backgroundColor: 'transparent',

    borderWidth: 1.5,
    borderColor: '#FF7A00',
  },

  danger: {
    backgroundColor: '#D92D20',
  },
});

const textVariantStyles = StyleSheet.create({
  primary: {
    color: '#FFFFFF',
  },

  secondary: {
    color: '#FFFFFF',
  },

  outline: {
    color: '#FF7A00',
  },

  danger: {
    color: '#FFFFFF',
  },
});