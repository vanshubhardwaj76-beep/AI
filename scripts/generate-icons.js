/* Generates original app icon / splash assets with pure JS (pngjs). Run: node scripts/generate-icons.js */
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const C = { bg: hex('#FFF6EC'), body: hex('#F4A261'), belly: hex('#FFE8CF'), dark: hex('#4A3B32'), beak: hex('#F4B860'), accent: hex('#E76F51'), cheek: hex('#F5A3B5') };

function render(size, { transparentBg = false, scale = 1, monochrome = false } = {}) {
  const png = new PNG({ width: size, height: size });
  const s = size / 100; // 100-unit design space
  const cx = 50, cy = 52;
  const inEllipse = (x, y, ex, ey, rx, ry) => ((x - ex) ** 2) / (rx * rx) + ((y - ey) ** 2) / (ry * ry) <= 1;
  const nearArc = (x, y, ax, ay, r, a0, a1, w) => {
    const d = Math.hypot(x - ax, y - ay);
    if (Math.abs(d - r) > w) return false;
    const ang = Math.atan2(y - ay, x - ax);
    return ang >= a0 && ang <= a1;
  };
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      // supersample 2x2
      let acc = [0, 0, 0, 0];
      for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
        const x = ((px + (sx + 0.5) / 2) / s - 50) / scale + 50;
        const y = ((py + (sy + 0.5) / 2) / s - 50) / scale + 50;
        let col = transparentBg ? null : C.bg;
        if (inEllipse(x, y, 20, 56, 7, 12) || inEllipse(x, y, 80, 56, 7, 12)) col = C.accent; // wings
        if (inEllipse(x, y, cx, cy, 36, 36)) col = C.body;
        if (inEllipse(x, y, cx, 58, 22, 22)) col = C.belly;
        if (inEllipse(x, y, 34, 60, 3.5, 3.5) || inEllipse(x, y, 66, 60, 3.5, 3.5)) col = C.cheek;
        // beak (triangle)
        if (y >= 55 && y <= 60 && Math.abs(x - 50) <= 4 * (1 - (y - 55) / 5)) col = C.beak;
        // eyes: happy arcs
        if (nearArc(x, y, 43, 53, 3, -Math.PI, 0, 1.2) || nearArc(x, y, 57, 53, 3, -Math.PI, 0, 1.2)) col = C.dark;
        // smile
        if (nearArc(x, y, 50, 59, 5, 0.3, Math.PI - 0.3, 1.2)) col = C.dark;
        // tuft
        if (nearArc(x, y, 50, 24, 8, -Math.PI + 0.4, -0.4, 1.8)) col = C.accent;
        if (col) { acc[0] += col[0]; acc[1] += col[1]; acc[2] += col[2]; acc[3] += 255; }
      }
      const i = (py * size + px) * 4;
      const a = acc[3] / 4;
      if (monochrome) {
        png.data[i] = 255; png.data[i + 1] = 255; png.data[i + 2] = 255; png.data[i + 3] = Math.round(a);
      } else {
        const n = acc[3] / 255 || 1;
        png.data[i] = Math.round(acc[0] / n); png.data[i + 1] = Math.round(acc[1] / n); png.data[i + 2] = Math.round(acc[2] / n); png.data[i + 3] = Math.round(a);
      }
    }
  }
  return PNG.sync.write(png);
}

const out = path.join(__dirname, '..', 'assets', 'icons');
fs.writeFileSync(path.join(out, 'icon.png'), render(1024));
fs.writeFileSync(path.join(out, 'splash-icon.png'), render(1024, { transparentBg: true, scale: 0.8 }));
fs.writeFileSync(path.join(out, 'favicon.png'), render(64));
fs.writeFileSync(path.join(out, 'android-icon-foreground.png'), render(1024, { transparentBg: true, scale: 0.66 }));
fs.writeFileSync(path.join(out, 'android-icon-monochrome.png'), render(1024, { transparentBg: true, scale: 0.66, monochrome: true }));
const bg = new PNG({ width: 1024, height: 1024 });
for (let i = 0; i < bg.data.length; i += 4) { bg.data[i] = C.bg[0]; bg.data[i + 1] = C.bg[1]; bg.data[i + 2] = C.bg[2]; bg.data[i + 3] = 255; }
fs.writeFileSync(path.join(out, 'android-icon-background.png'), PNG.sync.write(bg));
console.log('icons written');
