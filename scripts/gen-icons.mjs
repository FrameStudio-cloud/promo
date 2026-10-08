/**
 * Generates the PWA icon set into public/.
 * Hand-rolled PNG encoder (zlib is built into node) so the repo needs no
 * image tooling to regenerate icons.
 *
 *   npm run icons
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

/** rgba: Buffer of size*size*4 */
function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
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

/* ---------- the mark ---------- */

const SS = 3; // supersample factor

/** distance from p to a rounded rectangle centred on (cx, cy); <= 0 is inside */
function roundRectDist(px, py, cx, cy, halfW, halfH, r) {
  const dx = Math.abs(px - cx) - (halfW - r);
  const dy = Math.abs(py - cy) - (halfH - r);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  return outside + Math.min(Math.max(dx, dy), 0) - r;
}

/**
 * Three split-flap panels on a black tile — the same three-part readout the
 * app shows, which stays legible all the way down to favicon size.
 *
 * @param size      output px
 * @param artScale  scales the panels inside the tile (maskable safe zone)
 * @param rounded   rounded tile; false = full bleed, the OS masks it
 */
function drawIcon(size, { artScale = 1, rounded = true } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const c = size / 2;

  const tileR = rounded ? size * 0.22 : 0;

  // panel geometry — three cards and the gaps between them span 0.745 of the
  // canvas at artScale 1, leaving comfortable margins
  const cardW = size * 0.215 * artScale;
  const cardH = size * 0.46 * artScale;
  const gap = size * 0.05 * artScale;
  const cardR = size * 0.032 * artScale;
  const seam = size * 0.016 * artScale; // the fold line
  const firstX = c - (cardW * 1.5 + gap);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0;
      let panel = 0;
      let seamHit = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;

          // black tile (rounded rect, or full bleed)
          const inTile =
            tileR === 0 ||
            roundRectDist(px, py, c, c, size / 2, size / 2, tileR) <= 0;
          if (inTile) bg++;

          // three panels, each split across the middle by a dark seam
          for (let i = 0; i < 3; i++) {
            const cx = firstX + i * (cardW + gap);
            if (roundRectDist(px, py, cx, c, cardW / 2, cardH / 2, cardR) <= 0) {
              panel++;
              if (Math.abs(py - c) <= seam / 2) seamHit++;
              break;
            }
          }
        }
      }

      const n = SS * SS;
      const a = bg / n;
      const isPanel = panel / n;
      const isSeam = seamHit / n;
      const i = (y * size + x) * 4;

      // near-white panels, with the seam punched back to the tile colour
      const luma = 233 * (1 - isSeam) + 16 * isSeam;
      buf[i] = Math.round(luma * isPanel);
      buf[i + 1] = Math.round(luma * isPanel);
      buf[i + 2] = Math.round(luma * isPanel);
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
  // maskable: full-bleed background, art inside the ~80% safe zone
  ['icon-maskable-512.png', 512, { artScale: 0.68, rounded: false }],
  // iOS applies its own mask, so hand it a square full-bleed icon
  ['apple-touch-icon.png', 180, { artScale: 0.84, rounded: false }],
];

for (const [name, size, opts] of targets) {
  const png = drawIcon(size, opts);
  writeFileSync(resolve(OUT, name), png);
  console.log(`${name}  ${size}x${size}  ${(png.length / 1024).toFixed(1)} kB`);
}