import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PixelSprite } from '../components/PixelSprite';
import { RetroButton } from '../components/RetroButton';
import {
  BOOSTER_IDS,
  BOOSTERS,
  BoosterId,
  boosterDuration,
  MAX_BOOSTER_LEVEL,
  upgradeCost,
} from '../progression/boosters';
import { COIN } from '../sprites';
import { FONT, useTheme } from '../theme/ThemeContext';

interface Props {
  coins: number;
  boosterLevels: Record<BoosterId, number>;
  onUpgrade: (id: BoosterId) => void;
  onBack: () => void;
}

export function ShopScreen({ coins, boosterLevels, onUpgrade, onBack }: Props) {
  const { palette } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: palette.accent }]}>SHOP</Text>
      <View style={styles.walletRow}>
        <PixelSprite map={COIN} pixel={3} />
        <Text style={[styles.walletText, { color: palette.text }]}>{coins}</Text>
      </View>
      <Text style={[styles.blurb, { color: palette.textDim }]}>
        UPGRADES RAISE DURATION · ARMING A RUN COSTS COINS
      </Text>

      {BOOSTER_IDS.map((id) => {
        const def = BOOSTERS[id];
        const level = boosterLevels[id];
        const cost = upgradeCost(level);
        const maxed = cost == null;
        const now = boosterDuration(level);
        const next = boosterDuration(level + 1);
        return (
          <View
            key={id}
            style={[styles.card, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardName, { color: palette.text }]}>{def.name}</Text>
              <Text style={[styles.cardLevel, { color: palette.accent }]}>
                LV {level}/{MAX_BOOSTER_LEVEL}
              </Text>
            </View>
            <Text style={[styles.cardDesc, { color: palette.textDim }]}>{def.description}</Text>
            <Text style={[styles.cardDesc, { color: palette.textDim }]}>
              {level === 0
                ? `UNLOCK: ${next}s AT START`
                : maxed
                  ? `${now}s AT START · MAXED`
                  : `${now}s → ${next}s AT START`}
            </Text>
            <Text style={[styles.cardDesc, { color: palette.textDim }]}>
              ARM COST PER RUN: {def.armCost} COINS
            </Text>
            <RetroButton
              label={maxed ? 'MAX LEVEL' : level === 0 ? `UNLOCK · ${cost}` : `UPGRADE · ${cost}`}
              onPress={() => onUpgrade(id)}
              size="small"
              disabled={maxed || (cost != null && coins < cost)}
              style={styles.cardButton}
            />
          </View>
        );
      })}

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
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  walletText: {
    fontFamily: FONT,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 7,
  },
  blurb: {
    fontFamily: FONT,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    maxWidth: 380,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardName: {
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  cardLevel: {
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardDesc: {
    fontFamily: FONT,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  back: {
    marginTop: 8,
    minWidth: 120,
  },
});
