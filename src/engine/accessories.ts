/**
 * Pixel-art accessory layers. Each item is rasterised relative to a species'
 * anchors so a single definition fits all five pets. Draw order is handled by
 * PetAvatar (backpack → jacket → scarf → glasses → hat → toy → companion).
 */
import { PixelCanvas } from './canvas';
import type { Sprite } from './sprite';
import type { Anchors } from './pets';

const O = '#3B2A26';

type Draw = (c: PixelCanvas, a: Anchors) => void;

const drawers: Record<string, Draw> = {
  // ---------- hats ----------
  hat_beanie: (c, a) => {
    const { x, y } = a.hat;
    c.ellipse(x, y + 1, a.headHalf - 1, 4, '#E76F51');
    c.rect(x - a.headHalf + 1, y + 2, a.headHalf * 2 - 1, 2, '#C4523B');
    for (let i = x - a.headHalf + 2; i < x + a.headHalf - 1; i += 2) c.set(i, y + 3, '#F2A48E');
    c.ellipse(x, y - 3, 1.8, 1.8, '#FFF6EC');
    c.shade('#E76F51', '#F49478', '#C4523B');
    c.outline(O);
  },
  hat_flower: (c, a) => {
    const { x, y } = a.hat;
    c.rect(x - a.headHalf + 2, y + 2, a.headHalf * 2 - 3, 1, '#6DBF9C');
    const fl = (fx: number, fy: number, col: string) => { c.set(fx, fy - 1, col); c.set(fx - 1, fy, col); c.set(fx + 1, fy, col); c.set(fx, fy + 1, col); c.set(fx, fy, '#FFF6EC'); };
    fl(x - 5, y + 1, '#F5A3B5'); fl(x - 1, y, '#F9DC7A'); fl(x + 3, y + 1, '#F5A3B5'); fl(x + 6, y + 2, '#B8A9E8');
  },
  hat_wizard: (c, a) => {
    const { x, y } = a.hat;
    c.poly([[x - a.headHalf, y + 3], [x - 1, y - 9], [x + 1, y - 9], [x + a.headHalf, y + 3]], '#8E7CD1');
    c.rect(x - a.headHalf - 1, y + 2, a.headHalf * 2 + 3, 2, '#6B5AAE');
    c.set(x, y - 3, '#F9DC7A'); c.set(x - 1, y - 2, '#F9DC7A'); c.set(x + 1, y - 2, '#F9DC7A'); c.set(x, y - 1, '#F9DC7A'); c.set(x, y - 2, '#FFF3B0');
    c.shade('#8E7CD1', '#B8A9E8', '#6B5AAE');
    c.outline(O);
  },
  hat_crown: (c, a) => {
    const { x, y } = a.hat;
    c.rect(x - 4, y, 9, 3, '#F4C24B');
    c.set(x - 4, y - 2, '#F4C24B'); c.set(x - 4, y - 1, '#F4C24B');
    c.set(x, y - 2, '#F4C24B'); c.set(x, y - 1, '#F4C24B');
    c.set(x + 4, y - 2, '#F4C24B'); c.set(x + 4, y - 1, '#F4C24B');
    c.set(x - 2, y - 1, '#F4C24B'); c.set(x + 2, y - 1, '#F4C24B');
    c.set(x, y + 1, '#E76F51'); c.set(x - 3, y + 1, '#8EC5E8'); c.set(x + 3, y + 1, '#8EC5E8');
    c.outline(O);
  },
  // ---------- glasses ----------
  glasses_round: (c, a) => {
    const { x, y } = a.eyes;
    const ring = (cx: number) => { for (let i = -2; i <= 2; i++) { c.set(cx + i, y - 2, O); c.set(cx + i, y + 2, O); c.set(cx - 2, y + i, O); c.set(cx + 2, y + i, O); } c.set(cx - 2, y - 2, null); c.set(cx + 2, y - 2, null); c.set(cx - 2, y + 2, null); c.set(cx + 2, y + 2, null); c.set(cx - 1, y - 1, 'rgba(255,255,255,0.35)'); };
    ring(x - 3); ring(x + 4);
    c.set(x, y, O); c.set(x + 1, y, O);
    c.set(x - 6, y - 1, O); c.set(x + 7, y - 1, O);
  },
  glasses_sun: (c, a) => {
    const { x, y } = a.eyes;
    c.rect(x - 6, y - 2, 6, 4, '#2A2640'); c.rect(x + 1, y - 2, 6, 4, '#2A2640');
    c.rect(x - 5, y - 1, 2, 1, '#6C6A85'); c.rect(x + 2, y - 1, 2, 1, '#6C6A85');
    c.rect(x, y - 1, 1, 1, '#2A2640');
    c.set(x - 7, y - 1, '#2A2640'); c.set(x + 7, y - 1, '#2A2640');
  },
  glasses_heart: (c, a) => {
    const { x, y } = a.eyes;
    const h = (cx: number) => { c.set(cx - 1, y - 2, '#F07A8E'); c.set(cx + 1, y - 2, '#F07A8E'); c.rect(cx - 2, y - 1, 5, 2, '#F07A8E'); c.rect(cx - 1, y + 1, 3, 1, '#F07A8E'); c.set(cx, y + 2, '#F07A8E'); c.rect(cx - 1, y - 1, 3, 2, 'rgba(255,200,215,0.55)'); };
    h(x - 3); h(x + 4); c.set(x, y - 1, '#F07A8E'); c.set(x + 1, y - 1, '#F07A8E');
  },
  // ---------- scarves ----------
  scarf_red: (c, a) => scarf(c, a, '#E76F51', '#C4523B', '#F49478'),
  scarf_mint: (c, a) => scarf(c, a, '#8FD3B6', '#4FA98B', '#BFE9D6'),
  scarf_bow: (c, a) => {
    const { x, y } = a.neck;
    c.poly([[x - 1, y], [x - 6, y - 3], [x - 6, y + 3]], '#F5A3B5');
    c.poly([[x + 1, y], [x + 6, y - 3], [x + 6, y + 3]], '#F5A3B5');
    c.rect(x - 1, y - 1, 3, 3, '#D97A91');
    c.set(x - 5, y - 1, '#FFD0DA'); c.set(x + 4, y - 1, '#FFD0DA');
    c.outline(O);
  },
  // ---------- jackets ----------
  jacket_rain: (c, a) => jacket(c, a, '#F4C24B', '#D69C2A', '#FFE08A', true),
  jacket_space: (c, a) => {
    jacket(c, a, '#E8EEF7', '#B8C2D6', '#FFFFFF', false);
    const { x, y } = a.neck;
    c.ellipse(x, y + 5, 2, 2, '#8EC5E8'); c.set(x - 1, y + 4, '#CFE9F9');
    c.rect(x - 2, y + 9, 5, 1, '#E76F51');
  },
  // ---------- backpacks ----------
  bag_explorer: (c, a) => {
    const { x, y } = a.back;
    c.rect(x - 5, y - 2, 6, 9, '#6DBF9C');
    c.rect(x - 4, y, 4, 3, '#4FA98B');
    c.rect(x - 5, y - 3, 6, 1, '#4FA98B');
    c.set(x - 2, y + 1, '#F4C24B');
    c.shade('#6DBF9C', '#8FD3B6', '#4FA98B');
    c.outline(O);
  },
  bag_shell: (c, a) => {
    const { x, y } = a.back;
    c.ellipse(x - 2, y + 2, 4, 4.5, '#F5A3B5');
    c.ellipse(x - 2, y + 2, 2.5, 3, '#FFD0DA');
    c.ellipse(x - 2, y + 2, 1, 1.5, '#F5A3B5');
    c.outline(O);
  },
  // ---------- toys ----------
  toy_ball: (c, a) => {
    c.ellipse(27, a.ground - 2, 2.6, 2.6, '#E76F51');
    c.rect(25, a.ground - 3, 5, 1, '#FFF6EC');
    c.set(26, a.ground - 4, '#F49478');
    c.outline(O);
  },
  toy_kite: (c) => {
    c.poly([[27, 2], [30, 6], [27, 10], [24, 6]], '#8EC5E8');
    c.line(27, 2, 27, 10, '#CFE9F9'); c.line(24, 6, 30, 6, '#CFE9F9');
    c.line(27, 10, 24, 18, O);
    c.set(26, 13, '#F5A3B5'); c.set(25, 15, '#F9DC7A'); c.set(25, 17, '#F5A3B5');
  },
  // ---------- companions ----------
  comp_snail: (c, a) => {
    const g = a.ground;
    c.ellipse(5, g - 1, 3.5, 1.4, '#8FD3B6');
    c.ellipse(6, g - 4, 2.6, 2.6, '#F4C24B');
    c.ellipse(6, g - 4, 1.2, 1.2, '#D69C2A');
    c.set(2, g - 3, '#8FD3B6'); c.set(2, g - 4, '#8FD3B6'); c.set(2, g - 5, '#2B1D1A');
    c.outline(O);
  },
  comp_duck: (c, a) => {
    const g = a.ground;
    c.ellipse(27, g - 2, 3.5, 2.2, '#F9DC7A');
    c.ellipse(29, g - 5, 2, 2, '#F9DC7A');
    c.rect(31, g - 5, 1, 1, '#F4A261');
    c.set(29, g - 6, '#2B1D1A');
    c.outline(O);
  },
  comp_sprite: (c) => {
    c.ellipse(27, 6, 2.2, 2.2, '#B8A9E8');
    c.set(26, 5, '#FFFFFF'); c.set(28, 5, '#FFFFFF');
    c.set(24, 3, '#F9DC7A'); c.set(30, 9, '#F9DC7A'); c.set(23, 9, '#D6CCF7'); c.set(30, 2, '#D6CCF7');
    c.set(27, 10, 'rgba(184,169,232,0.5)'); c.set(27, 11, 'rgba(184,169,232,0.3)');
  },
};

function scarf(c: PixelCanvas, a: Anchors, main: string, dark: string, light: string) {
  const { x, y } = a.neck;
  const hw = a.headHalf - 1;
  c.ellipse(x, y + 1, hw, 2.2, main);
  c.rect(x + 2, y + 2, 3, 6, main);
  c.rect(x + 2, y + 8, 3, 1, dark);
  c.set(x + 2, y + 9, main); c.set(x + 4, y + 9, main);
  for (let i = x - hw + 1; i < x + hw; i += 3) c.set(i, y + 1, light);
  c.set(x + 3, y + 5, light);
  c.outline(O);
}

function jacket(c: PixelCanvas, a: Anchors, main: string, dark: string, light: string, buttons: boolean) {
  const { x, y } = a.neck;
  const hw = a.headHalf - 1;
  c.ellipse(x, y + 6, hw - 1, 6, main);
  // neckline cut (keep face/belly visible)
  c.ellipse(x, y, hw - 3, 2.5, null as any);
  c.rect(x, y + 2, 1, 9, dark);
  if (buttons) { c.set(x, y + 4, light); c.set(x, y + 7, light); c.set(x, y + 10, light); }
  c.rect(x - hw + 1, y + 2, 2, 3, light); c.rect(x + hw - 2, y + 2, 2, 3, light);
  c.shade(main, light, dark);
  c.outline(O);
}

const cache = new Map<string, Sprite>();

export function accessorySprite(itemId: string, anchors: Anchors): Sprite | null {
  const key = itemId + ':' + JSON.stringify(anchors);
  const hit = cache.get(key);
  if (hit) return hit;
  const d = drawers[itemId];
  if (!d) return null;
  const c = new PixelCanvas();
  d(c, anchors);
  const s = c.toSprite();
  cache.set(key, s);
  return s;
}

/** Small standalone preview (no pet) for shop tiles. */
export function accessoryPreview(itemId: string): Sprite | null {
  const previewAnchors: Anchors = { hat: { x: 16, y: 14 }, eyes: { x: 16, y: 16 }, neck: { x: 16, y: 12 }, back: { x: 20, y: 12 }, ground: 22, headHalf: 8 };
  return accessorySprite(itemId, previewAnchors);
}
