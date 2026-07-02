import { intersects } from '../src/game/collision';

describe('intersects', () => {
  const base = { x: 10, y: 10, w: 20, h: 20 };

  it('detects overlapping rects', () => {
    expect(intersects(base, { x: 25, y: 25, w: 10, h: 10 })).toBe(true);
    expect(intersects(base, { x: 0, y: 0, w: 15, h: 15 })).toBe(true);
  });

  it('detects containment', () => {
    expect(intersects(base, { x: 15, y: 15, w: 4, h: 4 })).toBe(true);
  });

  it('rejects separated rects', () => {
    expect(intersects(base, { x: 100, y: 10, w: 5, h: 5 })).toBe(false);
    expect(intersects(base, { x: 10, y: 100, w: 5, h: 5 })).toBe(false);
  });

  it('rejects rects that merely touch edges', () => {
    expect(intersects(base, { x: 30, y: 10, w: 10, h: 10 })).toBe(false);
    expect(intersects(base, { x: 10, y: 30, w: 10, h: 10 })).toBe(false);
  });
});
