/**
 * Exports the procedural pixel art to PNG files under assets/ so the artwork
 * exists as real, reusable image assets (for stores, docs, marketing, or a
 * future switch to image-based rendering).
 *
 *   npm run assets
 *
 * Output:
 *   assets/pets/<species>/<pose>_<frame>.png   (32x32 @ 8x = 256px)
 *   assets/pets/<species>/sheet.png            (contact sheet of all poses)
 *   assets/accessories/<itemId>.png
 */
// @ts-ignore no types shipped
import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import { getPetSheet } from '@/engine/pets';
import type { Pose } from '@/engine/pets';
import { spriteSpans } from '@/engine/sprite';
import type { Sprite } from '@/engine/sprite';
import { accessoryPreview } from '@/engine/accessories';
import { ITEMS } from '@/data/items';
import type { PetSpecies } from '@/types';

const SCALE = 8;
const DIRS: Record<PetSpecies, string> = { bird: 'puffling', cat: 'mochi-cat', fox: 'ember-fox', bunny: 'clover-bun', penguin: 'pebble-penguin' };
const POSES: Pose[] = ['idle', 'calm', 'happy', 'excited', 'proud', 'curious', 'sleepy', 'tired', 'tap', 'levelup'];

const parse = (c: string): [number, number, number, number] => {
  if (c.startsWith('rgba')) { const [r, g, b, a] = c.slice(5, -1).split(',').map(Number); return [r, g, b, Math.round(a * 255)]; }
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 255];
};

function blit(png: any, sprite: Sprite, ox: number, oy: number) {
  for (const s of spriteSpans(sprite)) {
    const [R, G, B, A] = parse(s.color);
    for (let px = 0; px < s.w * SCALE; px++) for (let py = 0; py < SCALE; py++) {
      const x = ox + s.x * SCALE + px, y = oy + s.y * SCALE + py;
      const i = (y * png.width + x) * 4;
      const a = A / 255, ia = png.data[i + 3] / 255;
      const oa = a + ia * (1 - a);
      png.data[i] = Math.round((R * a + png.data[i] * ia * (1 - a)) / (oa || 1));
      png.data[i + 1] = Math.round((G * a + png.data[i + 1] * ia * (1 - a)) / (oa || 1));
      png.data[i + 2] = Math.round((B * a + png.data[i + 2] * ia * (1 - a)) / (oa || 1));
      png.data[i + 3] = Math.round(oa * 255);
    }
  }
}

function write(file: string, png: any) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(png));
}

const CELL = 32 * SCALE;
for (const sp of Object.keys(DIRS) as PetSpecies[]) {
  const sheet = getPetSheet(sp);
  const dir = path.join('assets/pets', DIRS[sp]);
  const maxFrames = Math.max(...POSES.map((p) => sheet.frames[p].length));
  const contact = new PNG({ width: maxFrames * CELL, height: POSES.length * CELL });
  POSES.forEach((pose, row) => {
    sheet.frames[pose].forEach((frame, col) => {
      const png = new PNG({ width: CELL, height: CELL });
      blit(png, frame, 0, 0);
      write(path.join(dir, `${pose}_${col}.png`), png);
      blit(contact, frame, col * CELL, row * CELL);
    });
  });
  write(path.join(dir, 'sheet.png'), contact);
  fs.writeFileSync(path.join(dir, 'sheet.json'), JSON.stringify({ species: sp, cell: CELL, scale: SCALE, rows: POSES.map((p) => ({ pose: p, frames: sheet.frames[p].length })), anchors: sheet.anchors, palette: sheet.palette }, null, 2));
  console.log('pets/', DIRS[sp]);
}

for (const item of ITEMS.filter((i) => i.kind === 'accessory')) {
  const s = accessoryPreview(item.id);
  if (!s) continue;
  const png = new PNG({ width: CELL, height: CELL });
  blit(png, s, 0, 0);
  write(path.join('assets/accessories', `${item.id}.png`), png);
}
console.log('accessories done');
