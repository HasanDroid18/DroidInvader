import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { sfx } from '../audio/sfx';
import { FONT, useTheme } from '../theme/ThemeContext';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  size?: 'large' | 'small';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

// The one arcade button used across all screens (plays the click sfx).
export function RetroButton({
  label,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  style,
}: Props) {
  const { palette } = useTheme();
  const primary = variant === 'primary';

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        sfx.play('click');
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        size === 'small' && styles.small,
        primary
          ? { backgroundColor: pressed ? palette.accentPressed : palette.accent }
          : {
              borderWidth: 1,
              borderColor: pressed ? palette.text : palette.textDim,
            },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          size === 'small' && styles.labelSmall,
          { color: primary ? palette.onAccent : palette.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 44,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
  },
  small: {
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  disabled: {
    opacity: 0.35,
  },
  label: {
    fontFamily: FONT,
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  labelSmall: {
    fontSize: 12,
    letterSpacing: 2,
  },
});
