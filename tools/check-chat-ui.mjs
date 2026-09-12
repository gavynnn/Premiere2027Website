// Local browser regression test. Set PLAYWRIGHT_PACKAGE to an installed package
// path if it isn't available in node_modules. All chat responses are mocked.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import { createApp } from '../server.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const origin = 'http://127.0.0.1:8016';
process.env.APP_ORIGIN = origin;
process.env.OPENAI_API_KEY = 'ui-test-no-paid-calls';
const knowledge = JSON.parse(fs.readFileSync(new URL('../server/knowledge.json', import.meta.url)));
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'premiere-ui-'));
let now = Date.now();
const sample = '## ✨ Why sponsor\n\n- Support student creativity.\n- The proposal describes approximately 200 schools, not a confirmed 2027 count.\n\n## 🎁 Package benefits\n\n- Logo placement depends on the package.\n- Closing-night tickets vary by tier.\n\n## 📩 Next step\n\nExplore the proposal or message our committee. fileciteturn0file0 [Sponsor proposal](https://fake.example/proposal)';
const server = createApp({ stateDir: directory, knowledge, clock: () => now += 61000,
  limits: { daily: 1000, ipDaily: 1000, ipMinute: 100, globalMinute: 100, cooldown: 0 }, provider: async request => ({
    status: 'completed', output: [{ content: [{ type: 'output_text', annotations: [], text: JSON.stringify({ in_scope: true, event_question: true, language: 'en',
      answer: /sponsor/.test(request.input.at(-1).content) ? sample : 'Glad you are here! Find your competition or explore sponsorship.', actions: ['register', 'sponsorship'] }) }] }]
  }) });
let browser;
const errors = [];
try {
  server.listen(8016, '127.0.0.1'); await once(server, 'listening');
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1093, height: 958 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin + '/index.html?lang=en');
  await page.locator('.chat-launcher').click();
  await page.waitForFunction(() => !document.querySelector('.chat-form button').disabled);
  await page.waitForFunction(() => document.querySelector('#astra-chat').getBoundingClientRect().width === 492);
  const launcher = await page.locator('.chat-launcher').boundingBox();
  assert.ok(launcher.height >= 64);
  for (const [i, message] of ['sponsor', 'whats this', 'this is cool', 'futsal', 'when is opening'].entries()) {
    await page.locator('#astra-question').fill(message);
    await page.locator('.chat-form button').click();
    await page.waitForFunction(count => document.querySelectorAll('.chat-assistant').length === count, i + 2);
  }
  assert.equal(await page.locator('.chat-chips').isVisible(), false);
  assert.equal(await page.locator('.chat-contacts a').count(), 2);
  assert.equal(await page.locator('.chat-row-user .chat-avatar-user').count(), 5);
  assert.equal(await page.locator('.chat-row-assistant .chat-avatar-assistant').count(), 6);
  assert.ok(await page.locator('.chat-text h3').count() >= 3);
  assert.ok(await page.locator('.chat-text li').count() >= 4);
  assert.doesNotMatch(await page.locator('.chat-messages').innerText(), /filecite|turn0file|fake\.example||/);
  assert.equal(await page.locator('#astra-chat a[href^="tel:"]').count(), 0);
  const download = page.waitForEvent('download');
  await page.locator('.chat-source-actions a[download]').first().click();
  const pdf = await download;
  assert.match(pdf.suggestedFilename(), /\.pdf$/);
  assert.equal(fs.readFileSync(await pdf.path()).subarray(0, 5).toString(), '%PDF-');
  const response = await page.request.get(origin + '/assets/documents/sponsor-proposal-id.pdf');
  assert.equal(response.headers()['content-type'], 'application/pdf');
  await page.locator('.chat-actions a[href*="register"]').last().click();
  await page.waitForURL('**/register.html*');
  await page.waitForFunction(() => !document.body.classList.contains('is-leaving'));
  assert.equal(await page.locator('#astra-chat').getAttribute('open'), '');
  assert.equal(await page.locator('.chat-user').count(), 5);
  await page.locator('.chat-source-actions a:not([download])').first().click();
  await page.waitForURL('**/index.html*#sponsorship');
  await page.waitForFunction(() => !document.body.classList.contains('is-leaving'));
  assert.equal(await page.locator('#astra-chat').getAttribute('open'), '');
  // Prove clicks outside remain usable and the page transition covers the chat.
  await page.locator('#astra-question').fill('Draft stays here');
  await page.route('**/merch.html*', async route => { await new Promise(resolve => setTimeout(resolve, 400)); await route.continue(); });
  await page.getByRole('link', { name: 'Merch', exact: true }).click();
  await page.waitForFunction(() => document.body.classList.contains('is-leaving'));
  const cover = await page.locator('.page-wash').evaluate(element => { const rect = element.getBoundingClientRect(); return { width: rect.width, height: rect.height, z: +getComputedStyle(element).zIndex, chatZ: +getComputedStyle(document.querySelector('#astra-chat')).zIndex }; });
  assert.ok(cover.width >= 1093 && cover.height >= 958 && cover.z > cover.chatZ);
  await page.waitForURL('**/merch.html*');
  await page.waitForFunction(() => !document.body.classList.contains('is-leaving'));
  assert.equal(await page.locator('#astra-question').inputValue(), 'Draft stays here');
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.page-wash')).opacity === '0');
  // Show the detailed answer in the screenshot rather than the newest short one.
  await page.locator('.chat-messages').evaluate(element => { const row = element.querySelectorAll('.chat-row-assistant')[1]; element.scrollTop += row.getBoundingClientRect().top - element.getBoundingClientRect().top - 20; });
  fs.mkdirSync('tmp', { recursive: true });
  await page.screenshot({ path: 'tmp/chat-experience-desktop.png' });
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    const bounds = await page.locator('#astra-chat').boundingBox();
    assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width && bounds.y + bounds.height <= viewport.height);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.locator('#astra-chat').evaluate(element => element.scrollWidth > element.clientWidth), false);
    await page.screenshot({ path: `tmp/chat-experience-${viewport.width}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.chat-close').click();
  await page.waitForFunction(() => !document.querySelector('#astra-chat').open);
  await page.locator('.chat-launcher').click();
  assert.equal(await page.locator('.chat-user').count(), 5);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.chat-close').click();
  assert.equal(await page.locator('#astra-chat').getAttribute('open'), null);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ success: true, desktopWidth: 492, launcherHeight: launcher.height, mobileSizes: 3, pdfDownload: true, safeLinks: true, avatars: true, preservedChat: true, fullScreenTransition: true, errors }));
} finally {
  await browser?.close();
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(directory).startsWith('premiere-ui-'));
  fs.rmSync(directory, { recursive: true, force: true });
}
