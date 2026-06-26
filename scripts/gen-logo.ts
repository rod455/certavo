/**
 * Renders the square app logo PNG (rounded corners, transparent outside) from
 * the brand mark. No external image tooling required.
 *
 *   pnpm tsx scripts/gen-logo.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const NAVY = [0x1c, 0x2b, 0x3a];
const EMERALD = [0x18, 0xa0, 0x6b];
const PAPER = [0xf6, 0xf2, 0xea];

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

/** Signed distance to a rounded-rect border (negative = inside). */
function roundedRectInside(x: number, y: number, s: number, r: number): boolean {
  const dx = Math.max(r - x, x - (s - r), 0);
  const dy = Math.max(r - y, y - (s - r), 0);
  return Math.hypot(dx, dy) <= r;
}

function logo(size: number): Buffer {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const c = size / 2;
  const corner = size * 0.219;
  const ringR = size * 0.293;
  const ringW = size * 0.086;
  const midR = size * 0.129;
  const dotR = size * 0.0586;
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0;
    for (let x = 0; x < size; x++) {
      const inside = roundedRectInside(x + 0.5, y + 0.5, size, corner);
      if (!inside) {
        raw[p++] = 0;
        raw[p++] = 0;
        raw[p++] = 0;
        raw[p++] = 0;
        continue;
      }
      const d = Math.hypot(x - c, y - c);
      let col = NAVY;
      if (d < dotR) col = PAPER;
      else if (d < midR) col = EMERALD;
      else if (Math.abs(d - ringR) < ringW / 2) col = EMERALD;
      raw[p++] = col[0];
      raw[p++] = col[1];
      raw[p++] = col[2];
      raw[p++] = 255;
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

const dir = join(process.cwd(), 'public', 'brand');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'logo-mark-1024.png'), logo(1024));
writeFileSync(join(dir, 'logo-mark-512.png'), logo(512));
console.log('Wrote public/brand/logo-mark-1024.png and logo-mark-512.png');
