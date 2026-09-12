/**
 * Tiny pixel-art sprite format.
 *
 * A sprite is an array of equal-length strings. Each character maps to a palette
 * colour; '.' is transparent. Sprites are authored by hand as 32x32 grids so
 * they stay crisp, deliberate and consistent across the whole game.
 */
export type Palette = Record<string, string>;

export interface Sprite {
  rows: string[];
  palette: Palette;
  /** Optional per-sprite pixel offset (in grid cells). */
  offset?: { x: number; y: number };
}

export interface Pixel {
  x: number;
  y: number;
  color: string;
}

/** Run-length encode each row into horizontal spans for cheap rendering. */
export interface Span {
  x: number;
  y: number;
  w: number;
  color: string;
}

const cache = new WeakMap<Sprite, Span[]>();

export function spriteSpans(sprite: Sprite): Span[] {
  const hit = cache.get(sprite);
  if (hit) return hit;
  const spans: Span[] = [];
  const ox = sprite.offset?.x ?? 0;
  const oy = sprite.offset?.y ?? 0;
  sprite.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < row.length && row[x + w] === ch) w++;
      const color = sprite.palette[ch];
      if (color) spans.push({ x: x + ox, y: y + oy, w, color });
      x += w;
    }
  });
  cache.set(sprite, spans);
  return spans;
}

/** Overlay `top` onto `base` (both same grid). Non-transparent top pixels win. */
export function composite(base: Sprite, ...layers: (Sprite | null | undefined)[]): Sprite {
  const h = base.rows.length;
  const w = base.rows[0].length;
  const grid = base.rows.map((r) => r.split(''));
  const palette: Palette = { ...base.palette };
  let next = 0xe000; // private-use chars to avoid palette key clashes
  for (const layer of layers) {
    if (!layer) continue;
    const remap: Record<string, string> = {};
    const ox = layer.offset?.x ?? 0;
    const oy = layer.offset?.y ?? 0;
    layer.rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const gx = x + ox;
        const gy = y + oy;
        if (gx < 0 || gy < 0 || gx >= w || gy >= h) continue;
        if (ch === '#') {
          // eraser: punch a hole in the base
          grid[gy][gx] = '.';
          continue;
        }
        if (!remap[ch]) {
          const key = String.fromCharCode(next++);
          remap[ch] = key;
          palette[key] = layer.palette[ch];
        }
        grid[gy][gx] = remap[ch];
      }
    });
  }
  return { rows: grid.map((r) => r.join('')), palette };
}

/** Mirror a sprite horizontally (useful for facing direction). */
export function flipX(s: Sprite): Sprite {
  return { ...s, rows: s.rows.map((r) => r.split('').reverse().join('')) };
}

/** Shift a sprite by dx/dy cells (positive = right/down). */
export function shift(s: Sprite, dx: number, dy: number): Sprite {
  return { ...s, offset: { x: (s.offset?.x ?? 0) + dx, y: (s.offset?.y ?? 0) + dy } };
}

export const GRID = 32;
