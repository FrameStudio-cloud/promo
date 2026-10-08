/**
 * Generates the PWA icon set into public/.
 * Hand-rolled PNG encoder (zlib is built into node) so the repo needs no
 * image tooling to regenerate icons.
 *
 *   node scripts/gen-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public');

/* ---------- minimal PNG writer ---------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

/** rgba: Uint8Array of size*size*4 */
function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filter: adaptive
  ihdr[12] = 0; // no interlace

  // one filter byte (0 = none) per scanline
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- the clock face, drawn with 3x supersampling ---------- */

const SS = 3; // supersample factor

/** signed distance from p to the segment a-b */
function segDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)));
  const dx = wx - t * vx;
  const dy = wy - t * vy;
  return Math.hypot(dx, dy);
}

/**
 * @param size      output px
 * @param artScale  scales the clock art inside the tile (maskable safe zone)
 * @param rounded   rounded tile; false = full bleed, the OS masks it
 */
function drawIcon(size, { artScale = 1, rounded = true } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const c = size / 2;

  const r = size * 0.3 * artScale; // clock face radius
  const ring = r * 0.13; // ring thickness
  const handW = r * 0.1;
  const tileRadius = rounded ? size * 0.22 : 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0;
      let fg = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;

          // black tile (rounded rect, or full bleed)
          const dx = Math.max(tileRadius - px, px - (size - tileRadius), 0);
          const dy = Math.max(tileRadius - py, py - (size - tileRadius), 0);
          const inTile = tileRadius === 0 || Math.hypot(dx, dy) <= tileRadius;
          if (inTile) bg++;

          // clock ring, then the hands, in white
          const d = Math.hypot(px - c, py - c);
          let mark = Math.abs(d - r) <= ring / 2;

          // minute hand: straight up
          if (!mark) mark = segDist(px, py, c, c, c, c - r * 0.58) <= handW;
          // hour hand: up and to the right
          if (!mark) mark = segDist(px, py, c, c, c + r * 0.34, c - r * 0.34) <= handW;

          if (mark) fg++;
        }
      }

      const n = SS * SS;
      const a = bg / n;
      const f = fg / n;
      const i = (y * size + x) * 4;
      // white mark composited over the black tile
      buf[i] = Math.round(255 * f);
      buf[i + 1] = Math.round(255 * f);
      buf[i + 2] = Math.round(255 * f);
      buf[i + 3] = Math.round(255 * a);
    }
  }

  return encodePng(size, buf);
}

/* ---------- emit ---------- */

mkdirSync(OUT, { recursive: true });

const targets = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  // maskable: full bleed background, art inside the ~80% safe zone
  ['icon-maskable-512.png', 512, { artScale: 0.66, rounded: false }],
  // iOS applies its own mask, so hand it a square full-bleed icon
  ['apple-touch-icon.png', 180, { artScale: 0.82, rounded: false }],
];

for (const [name, size, opts] of targets) {
  const png = drawIcon(size, opts);
  writeFileSync(resolve(OUT, name), png);
  console.log(`${name}  ${size}x${size}  ${(png.length / 1024).toFixed(1)} kB`);
}