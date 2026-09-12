/**
 * Procedural pixel-art pet sheets.
 *
 * Every species is rasterised onto a 32x32 canvas with the same pipeline:
 *   silhouette (species-specific)  →  3-tone shading pass  →  1px outline
 *   →  face layer (expression)  →  optional pose extras (wings up, zzz, stars)
 *
 * Because all five pets share the pipeline, palette discipline and proportions,
 * they read as characters from the same game while keeping distinct silhouettes.
 */
import { PixelCanvas } from './canvas';
import type { Sprite } from './sprite';
import type { PetSpecies } from '@/types';

export type Pose = 'idle' | 'happy' | 'excited' | 'sleepy' | 'tired' | 'tap' | 'levelup' | 'curious' | 'proud' | 'calm';

export interface Anchors {
  /** centre of head top for hats */
  hat: { x: number; y: number };
  /** eye centre line */
  eyes: { x: number; y: number };
  /** neck / collar line */
  neck: { x: number; y: number };
  /** back (for backpacks) */
  back: { x: number; y: number };
  /** ground line */
  ground: number;
  /** head half-width at eye line (for glasses) */
  headHalf: number;
}

export interface PetSheet {
  species: PetSpecies;
  frames: Record<Pose, Sprite[]>;
  anchors: Anchors;
  palette: SpeciesPalette;
}

export interface SpeciesPalette {
  outline: string;
  body: string;
  light: string;
  dark: string;
  belly: string;
  bellyDark: string;
  accent: string;
  accentDark: string;
  eye: string;
  blush: string;
}

const OUTLINE = '#3B2A26';
const EYE = '#2B1D1A';
const WHITE = '#FFFFFF';

export const PALETTES: Record<PetSpecies, SpeciesPalette> = {
  bird: { outline: OUTLINE, body: '#F4A261', light: '#FFC58C', dark: '#D67A3E', belly: '#FFE9D0', bellyDark: '#F0CBA4', accent: '#E76F51', accentDark: '#BE4E36', eye: EYE, blush: '#F28A8A' },
  cat: { outline: OUTLINE, body: '#B8A9E8', light: '#D6CCF7', dark: '#8F7DCB', belly: '#F3EFFD', bellyDark: '#D9D0F0', accent: '#8E7CD1', accentDark: '#6B5AAE', eye: EYE, blush: '#F3A1B8' },
  fox: { outline: OUTLINE, body: '#EC8B5E', light: '#FFB387', dark: '#C9633A', belly: '#FFF2E6', bellyDark: '#F1D6C1', accent: '#4A2C22', accentDark: '#2E1B15', eye: EYE, blush: '#F28A8A' },
  bunny: { outline: OUTLINE, body: '#F5A9B9', light: '#FFD0DA', dark: '#D97E93', belly: '#FFF1F4', bellyDark: '#F5D4DC', accent: '#E58AA2', accentDark: '#C46B84', eye: EYE, blush: '#F07A8E' },
  penguin: { outline: OUTLINE, body: '#5E6C8A', light: '#8290AE', dark: '#43506B', belly: '#F6F8FF', bellyDark: '#D9DEEE', accent: '#F4C24B', accentDark: '#D69C2A', eye: EYE, blush: '#F3A1B8' },
};

// ---------- face layer ----------
type Expr = 'open' | 'happy' | 'closed' | 'wide' | 'droop' | 'blink' | 'sparkle';

function face(c: PixelCanvas, p: SpeciesPalette, ex: number, ey: number, gap: number, expr: Expr, mouth: 'smile' | 'open' | 'flat' | 'o' | 'small' | 'grin', blush = true) {
  const lx = ex - gap;
  const rx = ex + gap;
  const eye = (x: number) => {
    switch (expr) {
      case 'open':
        c.rect(x, ey - 1, 2, 3, p.eye);
        c.set(x, ey - 1, WHITE);
        break;
      case 'wide':
        c.rect(x - 1, ey - 2, 3, 4, p.eye);
        c.set(x - 1, ey - 2, WHITE);
        c.set(x, ey - 1, WHITE);
        break;
      case 'sparkle':
        c.rect(x - 1, ey - 2, 3, 4, p.eye);
        c.set(x - 1, ey - 2, WHITE);
        c.set(x + 1, ey, WHITE);
        break;
      case 'happy':
        // upturned arc
        c.set(x - 1, ey, p.eye);
        c.set(x, ey - 1, p.eye);
        c.set(x + 1, ey - 1, p.eye);
        c.set(x + 2, ey, p.eye);
        break;
      case 'closed':
      case 'blink':
        c.rect(x - 1, ey, 4, 1, p.eye);
        break;
      case 'droop':
        c.rect(x, ey, 2, 2, p.eye);
        c.rect(x - 1, ey - 1, 4, 1, p.eye); // heavy lid
        break;
    }
  };
  eye(lx - 1);
  eye(rx);
  const my = ey + 3;
  switch (mouth) {
    case 'smile':
      c.set(ex - 2, my, p.eye);
      c.set(ex - 1, my + 1, p.eye);
      c.set(ex, my + 1, p.eye);
      c.set(ex + 1, my + 1, p.eye);
      c.set(ex + 2, my, p.eye);
      break;
    case 'grin':
      c.rect(ex - 2, my, 5, 1, p.eye);
      c.rect(ex - 1, my + 1, 3, 1, p.eye);
      c.rect(ex - 1, my + 1, 3, 1, '#F07A8E');
      break;
    case 'open':
      c.rect(ex - 1, my, 3, 2, p.eye);
      c.set(ex, my + 1, '#F07A8E');
      break;
    case 'o':
      c.rect(ex, my, 1, 2, p.eye);
      c.set(ex - 1, my, p.eye);
      c.set(ex + 1, my, p.eye);
      c.set(ex, my + 2, p.eye);
      c.set(ex, my, p.eye);
      break;
    case 'flat':
      c.rect(ex - 1, my + 1, 3, 1, p.eye);
      break;
    case 'small':
      c.rect(ex, my + 1, 1, 1, p.eye);
      break;
  }
  if (blush) {
    c.ditherEllipse(lx - 3, ey + 2.5, 1.6, 1.1, p.blush);
    c.ditherEllipse(rx + 4, ey + 2.5, 1.6, 1.1, p.blush);
  }
}

// ---------- decor layers ----------
function zzz(c: PixelCanvas, x: number, y: number) {
  const col = '#8EC5E8';
  // small z
  c.rect(x, y, 3, 1, col); c.set(x + 1, y + 1, col); c.rect(x, y + 2, 3, 1, col);
  // bigger z
  c.rect(x + 4, y - 5, 4, 1, col); c.set(x + 6, y - 4, col); c.set(x + 5, y - 3, col); c.rect(x + 4, y - 2, 4, 1, col);
}
function stars(c: PixelCanvas) {
  const col = '#F9DC7A';
  const s = (x: number, y: number) => { c.set(x, y, col); c.set(x - 1, y, col); c.set(x + 1, y, col); c.set(x, y - 1, col); c.set(x, y + 1, col); };
  s(4, 6); s(27, 4); s(29, 13); s(2, 15); c.set(24, 2, '#FFFFFF'); c.set(7, 2, '#FFFFFF');
}
function sweat(c: PixelCanvas, x: number, y: number) {
  c.set(x, y, '#8EC5E8'); c.rect(x - 1, y + 1, 3, 2, '#8EC5E8'); c.set(x, y + 1, '#CFE9F9');
}
function heart(c: PixelCanvas, x: number, y: number) {
  const col = '#F07A8E';
  c.set(x - 1, y, col); c.set(x + 1, y, col); c.rect(x - 2, y + 1, 5, 1, col); c.rect(x - 1, y + 2, 3, 1, col); c.set(x, y + 3, col);
}
function question(c: PixelCanvas, x: number, y: number) {
  const col = '#B8A9E8';
  c.rect(x - 1, y, 3, 1, col); c.set(x + 2, y + 1, col); c.set(x + 1, y + 2, col); c.set(x, y + 3, col); c.set(x, y + 5, col);
}

// ---------- species silhouettes ----------
interface BodyOpts {
  bob: number; // 0 or 1 pixel vertical breathing offset
  squash: number; // 0 normal, 1 squashed (tap), -1 stretched (jump)
  limbs: 'rest' | 'up' | 'down';
}

type Builder = (c: PixelCanvas, p: SpeciesPalette, o: BodyOpts) => { ex: number; ey: number; gap: number };

const bird: Builder = (c, p, o) => {
  const dy = o.bob;
  const sq = o.squash;
  // tail
  c.poly([[7, 24 + dy], [2, 21 + dy], [3, 27 + dy]], p.accent);
  // body
  c.ellipse(16, 18 + dy + sq, 9.5 + sq * 0.8, 9.5 - sq * 0.8, p.body);
  c.ellipse(16, 12 + dy + sq * 1.5, 8, 7.5 - sq * 0.5, p.body);
  // belly
  c.ellipse(16, 20 + dy + sq, 6, 6.5 - sq * 0.6, p.belly);
  c.recolor(p.belly, p.bellyDark, (x, y) => y > 23 + dy);
  // wings
  if (o.limbs === 'up') {
    c.poly([[8, 17 + dy], [4, 8 + dy], [9, 12 + dy]], p.accent);
    c.poly([[24, 17 + dy], [28, 8 + dy], [23, 12 + dy]], p.accent);
  } else {
    c.ellipse(7.5, 19 + dy, 2.2, 4.5, p.accent);
    c.ellipse(24.5, 19 + dy, 2.2, 4.5, p.accent);
  }
  // tuft
  c.set(15, 4 + dy, p.accent); c.set(16, 3 + dy, p.accent); c.set(17, 4 + dy, p.accent); c.set(16, 4 + dy, p.accent);
  c.set(18, 3 + dy, p.accent);
  // feet
  const fy = 28;
  c.rect(12, fy, 3, 1, p.accentDark); c.rect(17, fy, 3, 1, p.accentDark);
  c.set(11, fy + 1, p.accentDark); c.set(13, fy + 1, p.accentDark); c.set(15, fy + 1, p.accentDark);
  c.set(16, fy + 1, p.accentDark); c.set(18, fy + 1, p.accentDark); c.set(20, fy + 1, p.accentDark);
  return { ex: 16, ey: 12 + dy + sq, gap: 3 };
};

const cat: Builder = (c, p, o) => {
  const dy = o.bob;
  const sq = o.squash;
  // tail
  c.line(24, 24 + dy, 28, 20 + dy, p.body); c.line(25, 24 + dy, 29, 20 + dy, p.body);
  c.line(28, 20 + dy, 28, 15 + dy, p.body); c.line(29, 20 + dy, 29, 15 + dy, p.body);
  c.rect(28, 14 + dy, 2, 2, p.accent);
  // ears
  c.poly([[8, 10 + dy], [9, 2 + dy], [15, 7 + dy]], p.body);
  c.poly([[24, 10 + dy], [23, 2 + dy], [17, 7 + dy]], p.body);
  c.poly([[10, 9 + dy], [10.5, 4.5 + dy], [13.5, 7 + dy]], p.blush);
  c.poly([[22, 9 + dy], [21.5, 4.5 + dy], [18.5, 7 + dy]], p.blush);
  // body
  c.ellipse(16, 20 + dy + sq, 9 + sq * 0.8, 8.5 - sq * 0.8, p.body);
  // head (wide)
  c.ellipse(16, 11.5 + dy + sq * 1.5, 9, 7 - sq * 0.4, p.body);
  // belly
  c.ellipse(16, 22 + dy + sq, 5.5, 5.5 - sq * 0.5, p.belly);
  c.recolor(p.belly, p.bellyDark, (x, y) => y > 25 + dy);
  // paws
  if (o.limbs === 'up') {
    c.poly([[9, 19 + dy], [5, 11 + dy], [10, 13 + dy]], p.body); c.poly([[23, 19 + dy], [27, 11 + dy], [22, 13 + dy]], p.body);
    c.ellipse(5.5, 11 + dy, 1.6, 1.6, p.body); c.ellipse(26.5, 11 + dy, 1.6, 1.6, p.body);
  } else {
    c.ellipse(11, 27, 3, 1.6, p.body); c.ellipse(21, 27, 3, 1.6, p.body);
    c.set(10, 28, p.dark); c.set(12, 28, p.dark); c.set(20, 28, p.dark); c.set(22, 28, p.dark);
  }
  // stripes on head
  c.rect(15, 5 + dy, 2, 1, p.accent); c.rect(13, 6 + dy, 1, 1, p.accent); c.rect(18, 6 + dy, 1, 1, p.accent);
  // nose
  c.rect(15, 14 + dy + sq, 2, 1, p.blush);
  return { ex: 16, ey: 11 + dy + sq, gap: 3 };
};

const fox: Builder = (c, p, o) => {
  const dy = o.bob;
  const sq = o.squash;
  // tail (big, curled)
  c.ellipse(26, 22 + dy, 4.5, 6, p.body);
  c.ellipse(27, 17 + dy, 3, 3, p.belly);
  // body
  c.ellipse(16, 21 + dy + sq, 8.5 + sq * 0.8, 8 - sq * 0.8, p.body);
  // ears (tall, dark tips) then head over their base
  c.poly([[8, 12 + dy], [7, 2 + dy], [14, 8 + dy]], p.body);
  c.poly([[24, 12 + dy], [25, 2 + dy], [18, 8 + dy]], p.body);
  c.poly([[8.5, 7 + dy], [7.6, 3 + dy], [11.5, 6 + dy]], p.accent);
  c.poly([[23.5, 7 + dy], [24.4, 3 + dy], [20.5, 6 + dy]], p.accent);
  // head with pointed cheeks
  c.ellipse(16, 12 + dy + sq * 1.5, 9.5, 6.5 - sq * 0.4, p.body);
  c.poly([[6, 12 + dy], [10, 17 + dy], [13, 14 + dy]], p.body);
  c.poly([[26, 12 + dy], [22, 17 + dy], [19, 14 + dy]], p.body);
  // muzzle + belly
  c.ellipse(16, 15 + dy + sq, 4.5, 3, p.belly);
  c.ellipse(16, 23 + dy + sq, 5, 5 - sq * 0.5, p.belly);
  c.recolor(p.belly, p.bellyDark, (x, y) => y > 25 + dy);
  // paws
  if (o.limbs === 'up') {
    c.poly([[9, 20 + dy], [5, 12 + dy], [10, 14 + dy]], p.body); c.poly([[23, 20 + dy], [27, 12 + dy], [22, 14 + dy]], p.body);
    c.ellipse(5.5, 12 + dy, 1.6, 1.6, p.accent); c.ellipse(26.5, 12 + dy, 1.6, 1.6, p.accent);
  } else {
    c.ellipse(11, 27, 3, 1.6, p.accent); c.ellipse(21, 27, 3, 1.6, p.accent);
  }
  // nose
  c.rect(15, 14 + dy + sq, 2, 1, p.accent); c.set(16, 15 + dy + sq, p.accent);
  return { ex: 16, ey: 11 + dy + sq, gap: 3 };
};

const bunny: Builder = (c, p, o) => {
  const dy = o.bob;
  const sq = o.squash;
  const earDrop = o.limbs === 'down' ? 2 : 0;
  // ears (tall)
  c.ellipse(12, 5 + dy + earDrop, 2.2, 6, p.body);
  c.ellipse(20, 5 + dy + earDrop, 2.2, 6, p.body);
  c.ellipse(12, 5.5 + dy + earDrop, 1, 4, p.blush);
  c.ellipse(20, 5.5 + dy + earDrop, 1, 4, p.blush);
  // tail
  c.ellipse(25, 24 + dy, 2.2, 2.2, p.belly);
  // body
  c.ellipse(16, 21 + dy + sq, 8.5 + sq * 0.8, 8 - sq * 0.8, p.body);
  // head (round, slightly wider than tall)
  c.ellipse(16, 13 + dy + sq * 1.5, 8, 6.5 - sq * 0.4, p.body);
  // belly
  c.ellipse(16, 23 + dy + sq, 5, 5 - sq * 0.5, p.belly);
  c.recolor(p.belly, p.bellyDark, (x, y) => y > 25 + dy);
  // paws
  if (o.limbs === 'up') {
    c.poly([[9, 21 + dy], [5, 13 + dy], [10, 15 + dy]], p.body); c.poly([[23, 21 + dy], [27, 13 + dy], [22, 15 + dy]], p.body);
    c.ellipse(5.5, 13 + dy, 1.6, 1.6, p.body); c.ellipse(26.5, 13 + dy, 1.6, 1.6, p.body);
  } else {
    c.ellipse(11, 27, 3.2, 1.6, p.body); c.ellipse(21, 27, 3.2, 1.6, p.body);
  }
  // nose + muzzle line
  c.rect(15, 15 + dy + sq, 2, 1, p.accent); c.set(16, 16 + dy + sq, p.dark);
  return { ex: 16, ey: 12 + dy + sq, gap: 3 };
};

const penguin: Builder = (c, p, o) => {
  const dy = o.bob;
  const sq = o.squash;
  // body (tall egg)
  c.ellipse(16, 17 + dy + sq, 8.5 + sq * 0.8, 11 - sq * 0.8, p.body);
  // belly patch
  c.ellipse(16, 19 + dy + sq, 5.5, 8 - sq * 0.6, p.belly);
  c.recolor(p.belly, p.bellyDark, (x, y) => y > 25 + dy);
  // face patches
  c.ellipse(13, 11 + dy + sq, 3, 3.2, p.belly);
  c.ellipse(19, 11 + dy + sq, 3, 3.2, p.belly);
  // flippers
  if (o.limbs === 'up') {
    c.poly([[8, 16 + dy], [4, 8 + dy], [9, 11 + dy]], p.body);
    c.poly([[24, 16 + dy], [28, 8 + dy], [23, 11 + dy]], p.body);
  } else {
    c.poly([[8, 13 + dy], [5, 23 + dy], [9, 22 + dy]], p.body);
    c.poly([[24, 13 + dy], [27, 23 + dy], [23, 22 + dy]], p.body);
  }
  // beak
  c.rect(15, 13 + dy + sq, 2, 1, p.accent); c.rect(14, 12 + dy + sq, 4, 1, p.accent);
  // feet
  c.rect(11, 28, 4, 1, p.accent); c.rect(17, 28, 4, 1, p.accent);
  c.set(10, 29, p.accentDark); c.set(12, 29, p.accentDark); c.set(14, 29, p.accentDark);
  c.set(17, 29, p.accentDark); c.set(19, 29, p.accentDark); c.set(21, 29, p.accentDark);
  return { ex: 16, ey: 10 + dy + sq, gap: 3 };
};

const BUILDERS: Record<PetSpecies, Builder> = { bird, cat, fox, bunny, penguin };

const ANCHORS: Record<PetSpecies, Anchors> = {
  bird: { hat: { x: 16, y: 3 }, eyes: { x: 16, y: 12 }, neck: { x: 16, y: 17 }, back: { x: 7, y: 18 }, ground: 29, headHalf: 8 },
  cat: { hat: { x: 16, y: 4 }, eyes: { x: 16, y: 11 }, neck: { x: 16, y: 18 }, back: { x: 7, y: 19 }, ground: 29, headHalf: 9 },
  fox: { hat: { x: 16, y: 4 }, eyes: { x: 16, y: 11 }, neck: { x: 16, y: 18 }, back: { x: 7, y: 20 }, ground: 29, headHalf: 9 },
  bunny: { hat: { x: 16, y: 6 }, eyes: { x: 16, y: 12 }, neck: { x: 16, y: 19 }, back: { x: 7, y: 20 }, ground: 29, headHalf: 8 },
  penguin: { hat: { x: 16, y: 6 }, eyes: { x: 16, y: 10 }, neck: { x: 16, y: 15 }, back: { x: 7, y: 17 }, ground: 30, headHalf: 8 },
};

interface FrameSpec {
  body: BodyOpts;
  expr: Expr;
  mouth: 'smile' | 'open' | 'flat' | 'o' | 'small' | 'grin';
  decor?: (c: PixelCanvas) => void;
  shadow?: boolean;
}

function build(species: PetSpecies, spec: FrameSpec): Sprite {
  const p = PALETTES[species];
  const c = new PixelCanvas();
  const f = BUILDERS[species](c, p, spec.body);
  // Shading: body colour + belly get rim light / shadow
  c.shade(p.body, p.light, p.dark);
  c.shade(p.accent, p.accent, p.accentDark);
  c.outline(p.outline);
  face(c, p, f.ex, f.ey, f.gap, spec.expr, spec.mouth);
  spec.decor?.(c);
  // ground shadow
  if (spec.shadow !== false) {
    const g = ANCHORS[species].ground;
    for (let x = 9; x <= 23; x++) if (!c.get(x, g + 1)) c.set(x, g + 1, 'rgba(59,42,38,0.18)');
  }
  return c.toSprite();
}

const rest: BodyOpts = { bob: 0, squash: 0, limbs: 'rest' };
const bob: BodyOpts = { bob: 1, squash: 0, limbs: 'rest' };

const sheets = new Map<PetSpecies, PetSheet>();

export function getPetSheet(species: PetSpecies): PetSheet {
  const hit = sheets.get(species);
  if (hit) return hit;
  const B = (spec: FrameSpec) => build(species, spec);
  const frames: Record<Pose, Sprite[]> = {
    idle: [B({ body: rest, expr: 'open', mouth: 'smile' }), B({ body: bob, expr: 'open', mouth: 'smile' }), B({ body: rest, expr: 'blink', mouth: 'smile' })],
    calm: [B({ body: rest, expr: 'happy', mouth: 'small' }), B({ body: bob, expr: 'happy', mouth: 'small' })],
    happy: [B({ body: rest, expr: 'happy', mouth: 'smile' }), B({ body: { ...bob, squash: -0.5 }, expr: 'happy', mouth: 'grin' })],
    excited: [
      B({ body: { bob: 0, squash: -0.5, limbs: 'up' }, expr: 'sparkle', mouth: 'open', decor: (c) => heart(c, 27, 4) }),
      B({ body: { bob: 1, squash: 0.5, limbs: 'up' }, expr: 'sparkle', mouth: 'open', decor: (c) => heart(c, 26, 6) }),
    ],
    proud: [B({ body: { ...rest, squash: -0.5 }, expr: 'happy', mouth: 'grin', decor: stars }), B({ body: bob, expr: 'happy', mouth: 'grin', decor: stars })],
    curious: [B({ body: rest, expr: 'wide', mouth: 'o', decor: (c) => question(c, 26, 3) }), B({ body: bob, expr: 'wide', mouth: 'o', decor: (c) => question(c, 26, 4) })],
    sleepy: [
      B({ body: { bob: 1, squash: 0.5, limbs: 'down' }, expr: 'closed', mouth: 'small', decor: (c) => zzz(c, 24, 8) }),
      B({ body: { bob: 1, squash: 0.5, limbs: 'down' }, expr: 'closed', mouth: 'small', decor: (c) => zzz(c, 25, 6) }),
    ],
    tired: [
      B({ body: { bob: 1, squash: 0.5, limbs: 'down' }, expr: 'droop', mouth: 'flat', decor: (c) => sweat(c, 25, 9) }),
      B({ body: { bob: 1, squash: 0.5, limbs: 'down' }, expr: 'droop', mouth: 'flat', decor: (c) => sweat(c, 25, 10) }),
    ],
    tap: [B({ body: { bob: 1, squash: 1.2, limbs: 'rest' }, expr: 'closed', mouth: 'grin' }), B({ body: { bob: -1, squash: -1, limbs: 'up' }, expr: 'happy', mouth: 'grin' })],
    levelup: [
      B({ body: { bob: -1, squash: -1, limbs: 'up' }, expr: 'sparkle', mouth: 'grin', decor: stars, shadow: false }),
      B({ body: { bob: 0, squash: -0.5, limbs: 'up' }, expr: 'happy', mouth: 'grin', decor: stars, shadow: false }),
    ],
  };
  const sheet: PetSheet = { species, frames, anchors: ANCHORS[species], palette: PALETTES[species] };
  sheets.set(species, sheet);
  return sheet;
}
