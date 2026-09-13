// Isolated browser verification; no API keys, external requests, or paid services.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const playwrightPath = process.env.PLAYWRIGHT_PACKAGE ||
  'C:/Users/gavyn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath.endsWith('.mjs') ? playwrightPath : path.join(playwrightPath, 'index.mjs')));
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/fonts.css"><p>Font verification</p>');
      return;
    }
    if (pathname !== '/fonts.css' && !/^\/assets\/fonts\/[a-z0-9-]+\.woff2$/.test(pathname)) {
      res.writeHead(404).end();
      return;
    }
    const content = await readFile(path.join(root, pathname.slice(1)));
    res.writeHead(200, { 'Content-Type': pathname.endsWith('.css') ? 'text/css' : 'font/woff2' });
    res.end(content);
  } catch {
    res.writeHead(500).end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (/OTS parsing|Failed to decode downloaded font/.test(message.text())) errors.push(message.text());
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const result = await page.evaluate(async () => {
    const faces = [
      ['DM Mono', 'normal', 400], ['DM Mono', 'normal', 500],
      ...[400, 500, 600, 700, 800].map(weight => ['Manrope', 'normal', weight]),
      ...[500, 600, 700].map(weight => ['Playfair Display', 'normal', weight]),
      ['Playfair Display', 'italic', 600],
    ];
    for (const [family, style, weight] of faces) {
      const requested = `${style} ${weight} 32px "${family}"`;
      // English, Indonesian, punctuation, accented Latin, and extended Latin.
      const sample = 'The Premiere Kompetisi 2027 École Ē À • ↓';
      const loaded = await document.fonts.load(requested, sample);
      if (!loaded.length || !document.fonts.check(requested, sample)) throw new Error(`Font did not load: ${requested}`);
    }
    return {
      weightStyleCombinations: faces.length,
      fontFaces: [...document.fonts].map(font => ({ family: font.family, weight: font.weight, style: font.style, status: font.status })),
      resources: performance.getEntriesByType('resource').filter(entry => entry.name.endsWith('.woff2')).length,
    };
  });
  assert.equal(result.fontFaces.length, 10);
  assert.equal(result.resources, 10);
  assert.ok(result.fontFaces.every(face => face.status === 'loaded'));
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ success: true, ...result }, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
