// Regenerate delivery-sized copies without altering any original artwork/photo.
// Requires Sharp: install it locally, or set PREMIERE_SHARP_MODULE to an existing
// Sharp module directory. Run from any directory: node tools/optimize-assets.mjs.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require(process.env.PREMIERE_SHARP_MODULE || 'sharp');
} catch {
  throw new Error('Sharp is required. Install sharp locally or set PREMIERE_SHARP_MODULE to its module directory.');
}
const root = fileURLToPath(new URL('../', import.meta.url));
const photographs = [
  'preopening-badminton', 'preopening-futsal', 'preopening-volleyball',
  'preopening-basketball', 'preopening-basketball-shot', 'opening-hosts',
  'opening-audience', 'week-badminton', 'week-speech', 'week-futsal',
  'week-volleyball', 'closing-night'
];
const jobs = [
  { source: 'assets/premiere-logo.png', target: 'assets/premiere-logo-128.webp', edge: 128, format: 'webp', lossless: true },
  { source: 'assets/premiere-logo.png', target: 'assets/premiere-favicon-48.png', edge: 48, format: 'png', lossless: true },
  ...photographs.map(name => ({
    source: `assets/photos/${name}.webp`, target: `assets/photos/${name}-700.webp`,
    edge: 700, format: 'webp', lossless: false
  })),
  ...['main', 'supporting'].map(name => ({
    source: `assets/sponsors/previous-sponsors-${name}.png`,
    target: `assets/sponsors/previous-sponsors-${name}.webp`,
    format: 'webp', lossless: true
  }))
];

let sourceBytes = 0;
let outputBytes = 0;
for (const job of jobs) {
  const source = path.join(root, job.source);
  const target = path.join(root, job.target);
  assert.notEqual(source, target, 'Delivery copies must never overwrite originals');
  const input = await sharp(source).metadata();
  const originalBytes = (await stat(source)).size;
  let pipeline = sharp(source);
  if (job.edge) {
    pipeline = pipeline.resize({ width: job.edge, height: job.edge, fit: 'inside', withoutEnlargement: true });
  }
  pipeline = job.format === 'png'
    ? pipeline.png({ compressionLevel: 9 })
    : pipeline.webp(job.lossless ? { lossless: true, effort: 6 } : { quality: 88, effort: 6 });
  const output = await pipeline.toFile(target);
  assert.ok(output.width <= input.width && output.height <= input.height, 'Never upscale assets');
  assert.equal(output.format, job.format);
  if (job.edge) assert.ok(Math.max(output.width, output.height) <= job.edge);
  else {
    assert.equal(output.width, input.width, 'Sponsor artwork retains its full width');
    assert.equal(output.height, input.height, 'Sponsor artwork retains its full height');
    const originalPixels = await sharp(source).ensureAlpha().raw().toBuffer();
    const deliveryPixels = await sharp(target).ensureAlpha().raw().toBuffer();
    // WebP can discard invisible RGB values where alpha is zero. Every alpha
    // value and every visible RGB value must still match the original exactly.
    for (let pixel = 0; pixel < originalPixels.length; pixel += 4) {
      assert.equal(deliveryPixels[pixel + 3], originalPixels[pixel + 3], 'Preserve sponsor transparency');
      if (originalPixels[pixel + 3] === 0) continue;
      for (let channel = 0; channel < 3; channel++) {
        assert.equal(deliveryPixels[pixel + channel], originalPixels[pixel + channel], 'Preserve visible sponsor pixels');
      }
    }
  }
  sourceBytes += originalBytes;
  outputBytes += output.size;
  console.log(`${job.target}: ${output.width}x${output.height}, ${originalBytes} -> ${output.size} bytes`);
}
console.log(`Delivery copies: ${outputBytes} bytes; corresponding source references: ${sourceBytes} bytes (logo counted twice for header/favicon).`);
