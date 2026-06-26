/**
 * Renders the Certavo "C + check" monogram (from the brand identity SVG paths)
 * into PNGs — solid app icons + a duotone transparent mark — with supersampled
 * anti-aliasing. No external image tooling required.
 *
 *   pnpm tsx scripts/gen-logo.ts
 *
 * Brand: paper #F6F2EA, navy #1C2B3A, teal ~#1E94AB (oklch(0.60 0.10 200)).
 * Monogram in a 160×160 viewBox:
 *   C arc (solid):   M120 42 A58 58 0 1 0 120 118     (paper, w16)
 *   check (solid):   M56 82 L76 104 L114 56           (paper, w14)
 *   C arc (duotone): M118 38 A60 60 0 1 0 118 122     (navy,  w17)
 *   check (duotone): M54 82 L74 104 L112 56           (teal,  w14)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const NAVY: RGB = [0x1c, 0x2b, 0x3a];
const PAPER: RGB = [0xf6, 0xf2, 0xea];
const TEAL: RGB = [0x1e, 0x94, 0xab];
type RGB = [number, number, number];
type RGBA = [number, number, number, number];

function crc32(buf: Buffer): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function encodePng(size: number, rgba: Uint8Array): Buffer {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0;
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      raw[p++] = rgba[i];
      raw[p++] = rgba[i + 1];
      raw[p++] = rgba[i + 2];
      raw[p++] = rgba[i + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

type Pred = (vx: number, vy: number) => boolean;

/** "C" arc band in 160-space, open on the right, with round end caps. */
function arcPredicate(arcEnd: number, y1: number, y2: number, R: number, wArc: number): Pred {
  const cy = (y1 + y2) / 2;
  const half = (y2 - y1) / 2;
  const cx = arcEnd - Math.sqrt(R * R - half * half);
  const gapAbs = Math.abs(Math.atan2(y1 - cy, arcEnd - cx)); // opening = |theta| < gapAbs
  const hwArc = wArc / 2;
  return (vx, vy) => {
    const dx = vx - cx;
    const dy = vy - cy;
    if (Math.abs(Math.hypot(dx, dy) - R) <= hwArc && Math.abs(Math.atan2(dy, dx)) >= gapAbs)
      return true;
    return (
      Math.hypot(vx - arcEnd, vy - y1) <= hwArc ||
      Math.hypot(vx - arcEnd, vy - y2) <= hwArc
    );
  };
}

/** Check mark (two round-joined segments) in 160-space. */
function checkPredicate(chk: number[], wChk: number): Pred {
  const hw = wChk / 2;
  return (vx, vy) =>
    segDist(vx, vy, chk[0], chk[1], chk[2], chk[3]) <= hw ||
    segDist(vx, vy, chk[2], chk[3], chk[4], chk[5]) <= hw;
}

const solidArc = arcPredicate(120, 42, 118, 58, 16);
const solidChk = checkPredicate([56, 82, 76, 104, 114, 56], 14);
const solidMono: Pred = (vx, vy) => solidArc(vx, vy) || solidChk(vx, vy);
const duoArc = arcPredicate(118, 38, 122, 60, 17);
const duoChk = checkPredicate([54, 82, 74, 104, 112, 56], 14);

function roundedInside(x: number, y: number, s: number, r: number): boolean {
  const dx = Math.max(r - x, x - (s - r), 0);
  const dy = Math.max(r - y, y - (s - r), 0);
  return dx * dx + dy * dy <= r * r;
}

const SS = 3; // supersampling factor

/** Solid app icon: teal rounded square, paper monogram. */
function renderSolid(size: number, pad: number, corner: number): Uint8Array {
  const out = new Uint8Array(size * size * 4);
  const scale = (size * (1 - 2 * pad)) / 160;
  const off = size * pad;
  const cr = size * corner;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          let c: RGBA = [0, 0, 0, 0];
          if (roundedInside(px, py, size, cr)) {
            const vx = (px - off) / scale;
            const vy = (py - off) / scale;
            c = solidMono(vx, vy) ? [...PAPER, 255] : [...TEAL, 255];
          }
          r += c[0];
          g += c[1];
          b += c[2];
          a += c[3];
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      out[i] = Math.round(r / n);
      out[i + 1] = Math.round(g / n);
      out[i + 2] = Math.round(b / n);
      out[i + 3] = Math.round(a / n);
    }
  }
  return out;
}

/** Duotone mark on transparent bg: navy C, teal check. */
function renderDuotone(size: number, pad: number): Uint8Array {
  const out = new Uint8Array(size * size * 4);
  const scale = (size * (1 - 2 * pad)) / 160;
  const off = size * pad;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const vx = (x + (sx + 0.5) / SS - off) / scale;
          const vy = (y + (sy + 0.5) / SS - off) / scale;
          let c: RGBA = [0, 0, 0, 0];
          if (duoChk(vx, vy)) c = [...TEAL, 255];
          else if (duoArc(vx, vy)) c = [...NAVY, 255];
          r += c[0];
          g += c[1];
          b += c[2];
          a += c[3];
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      out[i] = Math.round(r / n);
      out[i + 1] = Math.round(g / n);
      out[i + 2] = Math.round(b / n);
      out[i + 3] = Math.round(a / n);
    }
  }
  return out;
}

const brand = join(process.cwd(), 'public', 'brand');
const icons = join(process.cwd(), 'public', 'icons');
mkdirSync(brand, { recursive: true });
mkdirSync(icons, { recursive: true });

// App logo (Supabase) + brand mark
writeFileSync(join(brand, 'logo-mark-1024.png'), encodePng(1024, renderSolid(1024, 0.2, 0.22)));
writeFileSync(join(brand, 'logo-mark-512.png'), encodePng(512, renderSolid(512, 0.2, 0.22)));
writeFileSync(join(brand, 'logo-monogram-512.png'), encodePng(512, renderDuotone(512, 0.08)));
// PWA icons
writeFileSync(join(icons, 'icon-192.png'), encodePng(192, renderSolid(192, 0.2, 0.22)));
writeFileSync(join(icons, 'icon-512.png'), encodePng(512, renderSolid(512, 0.2, 0.22)));
writeFileSync(join(icons, 'icon-maskable.png'), encodePng(512, renderSolid(512, 0.3, 0)));
console.log('Wrote brand logos + PWA icons (C+check monogram, teal).');
