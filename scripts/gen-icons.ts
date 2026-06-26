/**
 * Generates the PWA icons in public/icons from brand colors — no external image
 * tooling required. A navy field with a concentric emerald/paper "target",
 * evoking the daily quiz. Maskable variant keeps content in the safe zone.
 *
 *   pnpm tsx scripts/gen-icons.ts
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
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function png(size: number, maskable: boolean): Buffer {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const cx = size / 2;
  const cy = size / 2;
  // Smaller radii for maskable so the target stays inside the safe zone.
  const rOuter = size * (maskable ? 0.3 : 0.36);
  const rInner = size * (maskable ? 0.13 : 0.16);
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy);
      let col = NAVY;
      if (d < rInner) col = PAPER;
      else if (d < rOuter) col = EMERALD;
      raw[p++] = col[0];
      raw[p++] = col[1];
      raw[p++] = col[2];
      raw[p++] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const dir = join(process.cwd(), 'public', 'icons');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'icon-192.png'), png(192, false));
writeFileSync(join(dir, 'icon-512.png'), png(512, false));
writeFileSync(join(dir, 'icon-maskable.png'), png(512, true));
console.log('Wrote icon-192.png, icon-512.png, icon-maskable.png');
