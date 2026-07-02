import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { sfx } from '../audio/sfx';
import { PixelSprite } from '../components/PixelSprite';
import { RetroButton } from '../components/RetroButton';
import { Settings } from '../storage/profile';
import { SPIDER_COLORS } from '../theme/palettes';
import { FONT, useTheme } from '../theme/ThemeContext';

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onBack: () => void;
}

export function SettingsScreen({ settings, onChange, onBack }: Props) {
  const { palette, spiderMap } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: palette.accent }]}>SETTINGS</Text>

      <View style={[styles.row, { borderColor: palette.cardBorder }]}>
        <Text style={[styles.label, { color: palette.text }]}>SOUND</Text>
        <Switch
          value={settings.soundOn}
          onValueChange={(v) => {
            onChange({ soundOn: v });
            if (v) sfx.play('coin'); // audible confirmation
          }}
          trackColor={{ true: palette.accent, false: palette.cardBorder }}
          thumbColor={palette.text}
        />
      </View>

      <View style={[styles.row, { borderColor: palette.cardBorder }]}>
        <Text style={[styles.label, { color: palette.text }]}>THEME</Text>
        <View style={styles.segment}>
          {(['dark', 'light'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                sfx.play('click');
                onChange({ theme: t });
              }}
              style={[
                styles.segmentItem,
                {
                  backgroundColor: settings.theme === t ? palette.accent : palette.cardBg,
                  borderColor: palette.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: settings.theme === t ? palette.onAccent : palette.textDim },
                ]}
              >
                {t.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.colorSection, { borderColor: palette.cardBorder }]}>
        <Text style={[styles.label, { color: palette.text }]}>SPIDER COLOR</Text>
        <View style={styles.swatchRow}>
          {SPIDER_COLORS.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                sfx.play('click');
                onChange({ spiderColor: c.id });
              }}
              style={[
                styles.swatch,
                { backgroundColor: c.hex },
                settings.spiderColor === c.id && [styles.swatchSelected, { borderColor: palette.text }],
              ]}
            />
          ))}
        </View>
        <View style={styles.preview}>
          <PixelSprite map={spiderMap} pixel={6} />
        </View>
      </View>

      <RetroButton label="BACK" onPress={onBack} variant="ghost" size="small" style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: FONT,
    fontSize: 30,
    letterSpacing: 8,
    fontWeight: 'bold',
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    borderBottomWidth: 1,
    paddingVertical: 16,
  },
  label: {
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  segment: {
    flexDirection: 'row',
  },
  segmentItem: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 4,
    marginLeft: 8,
  },
  segmentText: {
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  colorSection: {
    width: '100%',
    maxWidth: 380,
    borderBottomWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  swatchRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  swatchSelected: {
    borderWidth: 3,
  },
  preview: {
    marginTop: 18,
  },
  back: {
    marginTop: 26,
    minWidth: 120,
  },
});
