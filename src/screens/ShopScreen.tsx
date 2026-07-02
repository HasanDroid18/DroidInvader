import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PixelSprite } from '../components/PixelSprite';
import { RetroButton } from '../components/RetroButton';
import {
  BOOSTER_IDS,
  BOOSTERS,
  boosterDuration,
  MAX_BOOSTER_LEVEL,
  shieldDuration,
  UpgradableId,
  upgradeCost,
} from '../progression/boosters';
import { COIN } from '../sprites';
import { FONT, useTheme } from '../theme/ThemeContext';

interface Props {
  coins: number;
  boosterLevels: Record<UpgradableId, number>;
  onUpgrade: (id: UpgradableId) => void;
  onBack: () => void;
}

interface CardModel {
  id: UpgradableId;
  name: string;
  lines: string[];
  level: number;
  buyLabel: (cost: number) => string;
}

export function ShopScreen({ coins, boosterLevels, onUpgrade, onBack }: Props) {
  const { palette } = useTheme();

  const cards: CardModel[] = [
    ...BOOSTER_IDS.map((id): CardModel => {
      const def = BOOSTERS[id];
      const level = boosterLevels[id];
      const maxed = level >= MAX_BOOSTER_LEVEL;
      return {
        id,
        name: def.name,
        level,
        lines: [
          def.description,
          level === 0
            ? `UNLOCK: ${boosterDuration(1)}s AT START`
            : maxed
              ? `${boosterDuration(level)}s AT START · MAXED`
              : `${boosterDuration(level)}s → ${boosterDuration(level + 1)}s AT START`,
          `ARM COST PER RUN: ${def.armCost} COINS`,
        ],
        buyLabel: (cost) => (level === 0 ? `UNLOCK · ${cost}` : `UPGRADE · ${cost}`),
      };
    }),
    (() => {
      const level = boosterLevels.shield;
      const maxed = level >= MAX_BOOSTER_LEVEL;
      return {
        id: 'shield' as UpgradableId,
        name: 'SHIELD',
        level,
        lines: [
          'In-game drop: a bubble of full immunity.',
          maxed
            ? `${shieldDuration(level)}s PER PICKUP · MAXED`
            : `${shieldDuration(level)}s → ${shieldDuration(level + 1)}s PER PICKUP`,
          'NO UNLOCK NEEDED · ALWAYS DROPS',
        ],
        buyLabel: (cost: number) => `UPGRADE · ${cost}`,
      };
    })(),
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: palette.accent }]}>SHOP</Text>
      <View style={styles.walletRow}>
        <PixelSprite map={COIN} pixel={3} />
        <Text style={[styles.walletText, { color: palette.text }]}>{coins}</Text>
      </View>
      <Text style={[styles.blurb, { color: palette.textDim }]}>
        UPGRADES RAISE DURATION · REVIVES COST GEMS, NOT COINS
      </Text>

      {cards.map((card) => {
        const cost = upgradeCost(card.level);
        const maxed = cost == null;
        return (
          <View
            key={card.id}
            style={[styles.card, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardName, { color: palette.text }]}>{card.name}</Text>
              <Text style={[styles.cardLevel, { color: palette.accent }]}>
                LV {card.level}/{MAX_BOOSTER_LEVEL}
              </Text>
            </View>
            {card.lines.map((line, i) => (
              <Text key={i} style={[styles.cardDesc, { color: palette.textDim }]}>
                {line}
              </Text>
            ))}
            <RetroButton
              label={maxed ? 'MAX LEVEL' : card.buyLabel(cost)}
              onPress={() => onUpgrade(card.id)}
              size="small"
              disabled={maxed || (cost != null && coins < cost)}
              style={styles.cardButton}
            />
          </View>
        );
      })}

      <RetroButton label="BACK" onPress={onBack} variant="ghost" size="small" style={styles.back} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
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
