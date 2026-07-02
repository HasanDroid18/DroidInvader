import React, { useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { PixelMap } from '../sprites';

interface Run {
  x: number;
  y: number;
  len: number;
  color: string;
}

// Merge horizontal runs of same-colored pixels into single Views so a sprite
// costs a handful of Views instead of one per pixel.
function buildRuns(map: PixelMap): Run[] {
  const runs: Run[] = [];
  map.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.') {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      runs.push({ x, y, len: end - x, color: map.palette[ch] });
      x = end;
    }
  });
  return runs;
}

interface Props {
  map: PixelMap;
  pixel: number;
  style?: StyleProp<ViewStyle>;
}

function PixelSpriteInner({ map, pixel, style }: Props) {
  const runs = useMemo(() => buildRuns(map), [map]);
  const width = map.rows[0].length * pixel;
  const height = map.rows.length * pixel;
  return (
    <View style={[{ width, height }, style]} pointerEvents="none">
      {runs.map((r, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: r.x * pixel,
            top: r.y * pixel,
            width: r.len * pixel,
            height: pixel,
            backgroundColor: r.color,
          }}
        />
      ))}
    </View>
  );
}

export const PixelSprite = React.memo(PixelSpriteInner);
