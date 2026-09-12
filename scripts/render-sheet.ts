// Renders every pet/pose to a PNG contact sheet for visual QA: npm run sheet
// @ts-ignore no types shipped
import { PNG } from 'pngjs';
import fs from 'node:fs';
import { getPetSheet } from '@/engine/pets';
import type { Pose } from '@/engine/pets';
import { spriteSpans } from '@/engine/sprite';
import type { PetSpecies } from '@/types';

const species: PetSpecies[] = ['bird', 'cat', 'fox', 'bunny', 'penguin'];
const poses: Pose[] = ['idle', 'happy', 'excited', 'proud', 'curious', 'sleepy', 'tired', 'tap', 'levelup'];
const S = 6, CELL = 32 * S, PAD = 8;
const png = new PNG({ width: poses.length * (CELL + PAD) + PAD, height: species.length * (CELL + PAD) + PAD });
png.data.fill(0);
for (let i = 0; i < png.data.length; i += 4) { png.data[i] = 0xF7; png.data[i + 1] = 0xEF; png.data[i + 2] = 0xE4; png.data[i + 3] = 255; }
const parse = (c: string) => {
  if (c.startsWith('rgba')) { const [r, g, b, a] = c.slice(5, -1).split(',').map(Number); return [r, g, b, Math.round(a * 255)]; }
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 255];
};
species.forEach((sp, r) => poses.forEach((pose, col) => {
  const frame = getPetSheet(sp).frames[pose][0];
  for (const s of spriteSpans(frame)) {
    const [R, G, B, A] = parse(s.color);
    for (let px = 0; px < s.w * S; px++) for (let py = 0; py < S; py++) {
      const x = PAD + col * (CELL + PAD) + s.x * S + px, y = PAD + r * (CELL + PAD) + s.y * S + py;
      const i = (y * png.width + x) * 4; const a = A / 255;
      png.data[i] = Math.round(png.data[i] * (1 - a) + R * a); png.data[i + 1] = Math.round(png.data[i + 1] * (1 - a) + G * a); png.data[i + 2] = Math.round(png.data[i + 2] * (1 - a) + B * a);
    }
  }
}));
fs.writeFileSync('/tmp/sheet.png', PNG.sync.write(png));
console.log('wrote /tmp/sheet.png');
