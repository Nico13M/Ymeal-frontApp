import { COLORS } from "@/constants/profileConfig";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleProp, StyleSheet, TextInput, TextInputProps, ViewStyle } from "react-native";

type Props = TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  trailing?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  focusedContainerStyle?: StyleProp<ViewStyle>;
};

export default function InputField({
  icon, iconSize = 18, trailing, containerStyle, focusedContainerStyle, style, onFocus, onBlur, ...props
}: Props) {
  const [focused, setFocused] = useState(false);
  const focusProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(focusProgress, {
      toValue: focused ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [focusProgress, focused]);

  return (
    <Animated.View style={[
      styles.container,
      containerStyle,
      focused && focusedContainerStyle,
      { borderColor: focusProgress.interpolate({ inputRange: [0, 1], outputRange: [COLORS.orange, COLORS.orangeDark] }) },
      focused && styles.focused,
    ]}>
      <Ionicons name={icon} size={iconSize} color={focused ? COLORS.orangeDark : COLORS.muted} accessible={false} />
      <TextInput
        selectionColor={COLORS.orangeDark}
        cursorColor={COLORS.orangeDark}
        selectionHandleColor={COLORS.orangeDark}
        underlineColorAndroid="transparent"
        {...props}
        multiline={false}
        placeholderTextColor={COLORS.muted}
        style={[styles.input, style]}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
      />
      {trailing}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minWidth: 0,
    flexShrink: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 8,
    backgroundColor: COLORS.card,
    overflow: "hidden",
    ...Platform.select({ web: { boxSizing: "border-box" } }),
  },
  focused: {
    ...Platform.select({ web: { boxShadow: "0 0 0 3px rgba(199,94,0,0.16)" } }),
  },
  input: {
    flex: 1,
    width: 0,
    minWidth: 0,
    height: "100%",
    paddingVertical: 0,
    fontSize: 16,
    color: COLORS.text,
    ...Platform.select({
      web: {
        outlineStyle: "solid" as const,
        outlineWidth: 0,
        outlineColor: "transparent",
        borderWidth: 0,
        boxShadow: "none",
        caretColor: COLORS.orangeDark,
        boxSizing: "border-box" as const,
      },
    }),
  },
});
