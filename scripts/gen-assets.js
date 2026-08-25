#!/usr/bin/env node
// Regenerates the app icons/splash from the droid robot pixel map.
// Zero-dependency PNG writer (node zlib + hand-rolled chunks).
// Usage: node scripts/gen-assets.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BG = '#0F1210';
const DROID_GREEN = '#3DDC84';
const EYE = '#FFFFFF';

// Keep in sync with src/sprites/index.ts (ROBOT).
const ROBOT = [
  '..R.........R..',
  '...R.......R...',
  '..RRRRRRRRRRR..',
  '.RRRRRRRRRRRRR.',
  '.RRWWRRRRRWWRR.',
  '.RRRRRRRRRRRRR.',
  '...............',
  'RR.RRRRRRRRR.RR',
  'RR.RRRRRRRRR.RR',
  'RR.RRRRRRRRR.RR',
  '...RRRRRRRRR...',
  '....RR...RR....',
  '....RR...RR....',
];

// --- minimal PNG encoder -----------------------------------------------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- tiny raster canvas --------------------------------------------------

function hexToRgba(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
    255,
  ];
}

function makeCanvas(w, h, bgHex) {
  const data = Buffer.alloc(w * h * 4, 0);
  if (bgHex) {
    const [r, g, b, a] = hexToRgba(bgHex);
    for (let i = 0; i < w * h; i++) {
      data[i * 4] = r;
      data[i * 4 + 1] = g;
      data[i * 4 + 2] = b;
      data[i * 4 + 3] = a;
    }
  }
  return { w, h, data };
}

function fillRect(cv, x, y, w, h, rgba) {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(cv.w, x + w);
  const y1 = Math.min(cv.h, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * cv.w + xx) * 4;
      cv.data[i] = rgba[0];
      cv.data[i + 1] = rgba[1];
      cv.data[i + 2] = rgba[2];
      cv.data[i + 3] = rgba[3];
    }
  }
}

function drawRobot(cv, scale, palette) {
  const cols = ROBOT[0].length;
  const rows = ROBOT.length;
  const ox = Math.round((cv.w - cols * scale) / 2);
  const oy = Math.round((cv.h - rows * scale) / 2);
  ROBOT.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      fillRect(cv, ox + x * scale, oy + y * scale, scale, scale, palette[ch]);
    }
  });
}

// --- outputs --------------------------------------------------------------

const assetsDir = path.join(__dirname, '..', 'assets');
const robotPalette = { R: hexToRgba(DROID_GREEN), W: hexToRgba(EYE) };
const whitePalette = { R: [255, 255, 255, 255], W: [255, 255, 255, 255] };

function write(name, cv) {
  fs.writeFileSync(path.join(assetsDir, name), encodePNG(cv.w, cv.h, cv.data));
  console.log('wrote assets/' + name);
}

let cv = makeCanvas(1024, 1024, BG);
drawRobot(cv, 48, robotPalette);
write('icon.png', cv);

cv = makeCanvas(1024, 1024, null);
drawRobot(cv, 38, robotPalette); // stays inside the adaptive-icon safe zone
write('android-icon-foreground.png', cv);

cv = makeCanvas(1024, 1024, BG);
write('android-icon-background.png', cv);

cv = makeCanvas(1024, 1024, null);
drawRobot(cv, 38, whitePalette);
write('android-icon-monochrome.png', cv);

cv = makeCanvas(512, 512, null);
drawRobot(cv, 22, robotPalette);
write('splash-icon.png', cv);

cv = makeCanvas(48, 48, BG);
drawRobot(cv, 3, robotPalette);
write('favicon.png', cv);
