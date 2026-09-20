// Isolated CSS regression: no external requests, API calls, or form submissions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const root = path.resolve(import.meta.dirname, '..');
const mime = { '.html':'text/html', '.css':'text/css', '.png':'image/png', '.webp':'image/webp', '.woff2':'font/woff2' };
const browser = await chromium.launch({ channel:'chrome', headless:true });
try {
  const context = await browser.newContext({ javaScriptEnabled:false, reducedMotion:'reduce' });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    const file = path.resolve(root, '.' + url.pathname);
    const type = mime[path.extname(file)];
    if (url.origin !== 'http://premiere.test' || !file.startsWith(root + path.sep) || !type || !fs.existsSync(file)) return route.abort();
    await route.fulfill({ contentType:type, body:fs.readFileSync(file) });
  });
  const page = await context.newPage();
  for (const width of [320,390,768,1093,1440]) {
    await page.setViewportSize({width,height:958});
    await page.goto('http://premiere.test/index.html');
    await page.locator('.sponsor-board').evaluate(board => board.scrollIntoView({behavior:'instant'}));
    const boxes = await page.locator('.sponsor-board').evaluate(board => {
      const box = element => { const r=element.getBoundingClientRect(); return {left:r.left,right:r.right,width:r.width,center:r.left+r.width/2}; };
      return {board:box(board), images:[...board.querySelectorAll('img')].map(box),pictures:[...board.querySelectorAll('picture')].map(box)};
    });
    assert.equal(boxes.images.length,2);
    for (const box of [...boxes.images,...boxes.pictures]) {
      assert.ok(Math.abs(box.center-boxes.board.center)<1,`${width}px: sponsor content must be centered`);
      assert.ok(box.left>=boxes.board.left && box.right<=boxes.board.right,`${width}px: content must fit the board`);
      assert.ok(box.width<=820,`${width}px: preserve maximum logo width`);
    }
    if (width===1093) {
      await page.locator('.sponsor-board img').evaluateAll(images => Promise.all(images.map(img=>img.decode())));
      fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
      await page.locator('.sponsor-board').screenshot({path:path.join(root,'tmp/sponsors-centered.png')});
    }
  }
  console.log('PASS: both sponsor images centered and contained at 320, 390, 768, 1093 and 1440px.');
} finally { await browser.close(); }
