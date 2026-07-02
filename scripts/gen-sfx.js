#!/usr/bin/env node
// Regenerates the chiptune sound effects as tiny PCM WAV files.
// Zero dependencies — square/triangle/noise synthesis straight to 16-bit mono.
// Usage: node scripts/gen-sfx.js

const fs = require('fs');
const path = require('path');

const SR = 22050; // sample rate

// --- synthesis helpers (all return Float32Array in [-1, 1]) ---------------

function silence(dur) {
  return new Float32Array(Math.round(SR * dur));
}

// Square wave sweeping from f0 to f1 with an exponential decay envelope.
function square(f0, f1, dur, vol = 0.6, decay = 4) {
  const n = Math.round(SR * dur);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const f = f0 + (f1 - f0) * t;
    phase += f / SR;
    const env = Math.exp(-decay * t);
    out[i] = (phase % 1 < 0.5 ? 1 : -1) * vol * env;
  }
  return out;
}

function triangle(f0, f1, dur, vol = 0.6, decay = 4) {
  const n = Math.round(SR * dur);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const f = f0 + (f1 - f0) * t;
    phase += f / SR;
    const p = phase % 1;
    const env = Math.exp(-decay * t);
    out[i] = (p < 0.5 ? 4 * p - 1 : 3 - 4 * p) * vol * env;
  }
  return out;
}

function noise(dur, vol = 0.5, decay = 6) {
  const n = Math.round(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    out[i] = (Math.random() * 2 - 1) * vol * Math.exp(-decay * t);
  }
  return out;
}

function concat(...parts) {
  const n = parts.reduce((a, p) => a + p.length, 0);
  const out = new Float32Array(n);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

function mix(...parts) {
  const n = Math.max(...parts.map((p) => p.length));
  const out = new Float32Array(n);
  for (const p of parts) for (let i = 0; i < p.length; i++) out[i] += p[i];
  return out;
}

// --- WAV writer -----------------------------------------------------------

function writeWav(name, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // fmt chunk size
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  const dir = path.join(__dirname, '..', 'assets', 'sfx');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name + '.wav'), buf);
  console.log(`wrote assets/sfx/${name}.wav (${(buf.length / 1024).toFixed(1)} KB)`);
}

// --- the sounds -----------------------------------------------------------

writeWav('shoot', square(880, 240, 0.09, 0.35, 6));
writeWav('hit', mix(noise(0.06, 0.4, 8), square(300, 180, 0.06, 0.3, 8)));
writeWav('explosion', mix(noise(0.4, 0.55, 5), square(140, 40, 0.35, 0.35, 5)));
writeWav('coin', concat(square(988, 988, 0.06, 0.4, 2), square(1319, 1319, 0.16, 0.4, 5)));
writeWav(
  'powerup',
  concat(
    square(523, 523, 0.07, 0.4, 2),
    square(659, 659, 0.07, 0.4, 2),
    square(784, 784, 0.07, 0.4, 2),
    square(1047, 1047, 0.14, 0.4, 4)
  )
);
writeWav('playerHit', mix(square(220, 55, 0.35, 0.5, 4), noise(0.25, 0.4, 6)));
writeWav('wave', concat(triangle(659, 659, 0.09, 0.5, 2), triangle(880, 880, 0.2, 0.5, 4)));
writeWav('boss', mix(square(82, 60, 0.7, 0.5, 2.5), noise(0.5, 0.15, 3)));
writeWav(
  'gameOver',
  concat(
    triangle(440, 440, 0.16, 0.5, 2),
    triangle(349, 349, 0.16, 0.5, 2),
    triangle(294, 294, 0.16, 0.5, 2),
    triangle(220, 220, 0.4, 0.5, 3)
  )
);
writeWav('click', square(1200, 1000, 0.04, 0.3, 8));
writeWav(
  'gem',
  concat(
    triangle(1319, 1319, 0.05, 0.45, 2),
    triangle(1760, 1760, 0.05, 0.45, 2),
    triangle(2093, 2093, 0.16, 0.45, 5)
  )
);
writeWav(
  'revive',
  mix(
    concat(square(262, 262, 0.12, 0.35, 1.5), square(330, 330, 0.12, 0.35, 1.5), square(392, 392, 0.12, 0.35, 1.5), square(523, 523, 0.3, 0.35, 3)),
    concat(silence(0.06), triangle(523, 1047, 0.55, 0.3, 2))
  )
);
