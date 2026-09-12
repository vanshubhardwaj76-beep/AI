/**
 * Pixel canvas: a 32x32 grid rasterizer for building deliberate pixel-art
 * sprites from primitives. Produces `Sprite`s consumable by PixelSprite.
 */
import { GRID } from './sprite';
import type { Sprite } from './sprite';

export type Grid = (string | null)[][];

export function makeGrid(size = GRID): Grid {
  return Array.from({ length: size }, () => Array<string | null>(size).fill(null));
}

export class PixelCanvas {
  grid: Grid;
  constructor(public size = GRID) {
    this.grid = makeGrid(size);
  }
  set(x: number, y: number, c: string | null) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return;
    this.grid[y][x] = c;
  }
  get(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return null;
    return this.grid[y][x];
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: string) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
  }
  rect(x0: number, y0: number, w: number, h: number, c: string) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.set(x, y, c);
  }
  /** Filled convex/concave polygon via scanline. */
  poly(pts: [number, number][], c: string) {
    const ys = pts.map((p) => p[1]);
    const minY = Math.floor(Math.min(...ys));
    const maxY = Math.ceil(Math.max(...ys));
    for (let y = minY; y <= maxY; y++) {
      const sy = y + 0.5;
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % pts.length];
        if ((sy >= y1 && sy < y2) || (sy >= y2 && sy < y1)) xs.push(x1 + ((sy - y1) * (x2 - x1)) / (y2 - y1));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2)
        for (let x = Math.floor(xs[i]); x < Math.ceil(xs[i + 1]); x++) this.set(x, y, c);
    }
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0, y = y0;
    for (let i = 0; i < 200; i++) {
      this.set(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
  }
  /** Stamp another canvas/grid onto this one. */
  stamp(other: Grid, dx = 0, dy = 0) {
    other.forEach((row, y) => row.forEach((c, x) => c && this.set(x + dx, y + dy, c)));
  }
  /** Replace colour a with b within a region predicate. */
  recolor(from: string, to: string, where?: (x: number, y: number) => boolean) {
    this.grid.forEach((row, y) => row.forEach((c, x) => { if (c === from && (!where || where(x, y))) row[x] = to; }));
  }
  /**
   * Shading pass: for every pixel of `body`, if the pixel offset by (-1,-1)
   * is outside the body → highlight; if offset (+1,+1) outside → shade.
   * Produces the classic pixel-art rim light/shadow.
   */
  shade(body: string, light: string, dark: string, depth = 1) {
    const src = this.grid.map((r) => [...r]);
    const is = (x: number, y: number) => (src[y]?.[x] ?? null) === body;
    for (let y = 0; y < this.size; y++)
      for (let x = 0; x < this.size; x++) {
        if (!is(x, y)) continue;
        let hl = false, sh = false;
        for (let d = 1; d <= depth; d++) {
          if (!is(x - d, y - d) || !is(x, y - d) ) hl = true;
          if (!is(x + d, y + d) || !is(x, y + d)) sh = true;
        }
        if (sh && !hl) this.grid[y][x] = dark;
        else if (hl && !sh) this.grid[y][x] = light;
      }
  }
  /** Draw a 1px outline around all non-null pixels. */
  outline(c: string) {
    const src = this.grid.map((r) => [...r]);
    for (let y = 0; y < this.size; y++)
      for (let x = 0; x < this.size; x++) {
        if (src[y][x]) continue;
        if (src[y - 1]?.[x] || src[y + 1]?.[x] || src[y]?.[x - 1] || src[y]?.[x + 1]) this.grid[y][x] = c;
      }
  }
  /** Checkerboard dither of colour c in an ellipse (soft blush). */
  ditherEllipse(cx: number, cy: number, rx: number, ry: number, c: string) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1 && (x + y) % 2 === 0 && this.get(x, y)) this.set(x, y, c);
      }
  }
  clone() {
    const c = new PixelCanvas(this.size);
    c.grid = this.grid.map((r) => [...r]);
    return c;
  }
  toSprite(): Sprite {
    const palette: Record<string, string> = {};
    const keyFor = new Map<string, string>();
    let next = 0x41; // 'A'..
    const rows = this.grid.map((row) =>
      row
        .map((c) => {
          if (!c) return '.';
          let k = keyFor.get(c);
          if (!k) {
            k = String.fromCharCode(next++);
            if (k === '.' || k === '#') k = String.fromCharCode(next++);
            keyFor.set(c, k);
            palette[k] = c;
          }
          return k;
        })
        .join(''),
    );
    return { rows, palette };
  }
}
