// Local mobile/preview regressions. No OpenAI requests or paid services.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { createApp } from '../server.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
process.env.APP_ORIGIN = 'http://127.0.0.1:8017';
process.env.OPENAI_API_KEY = 'no-paid-calls-mobile-test';
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'premiere-mobile-'));
const server = createApp({ stateDir:directory, provider:async () => { throw new Error('Unexpected AI request'); } });
const errors=[];
let browser;
try {
  server.listen(8017, '127.0.0.1'); await once(server, 'listening');
  const origin=process.env.APP_ORIGIN;
  browser=await chromium.launch({ channel:'chrome', headless:true });
  const context=await browser.newContext({ viewport:{ width:390, height:844 }, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  const page=await context.newPage();
  page.on('pageerror', e=>errors.push(e.message));
  const pdfRequests=[];
  page.on('request', request=>{ if (/sponsor-proposal-\w+\.pdf/.test(request.url())) pdfRequests.push(request.url()); });
  // Keep the first viewer pending long enough to exercise a repeated-language
  // update, a case which previously could leave its loading UI stuck forever.
  await page.route('**/assets/documents/*.pdf*', async route=>{
    await new Promise(resolve=>setTimeout(resolve,900));
    await route.continue();
  });
  await page.goto(origin+'/index.html?lang=en');
  assert.equal(await page.locator('.language-hint').isVisible(),true);
  const hint=await page.locator('.language-hint').boundingBox();
  const languages=await page.locator('.language-switch').boundingBox();
  assert.ok(hint.y >= languages.y+languages.height);
  assert.equal(await page.locator('.document-load-preview').count(),0);
  // No scrolling or click has happened; the full PDF starts automatically.
  await page.waitForFunction(()=>document.querySelector('.pdf-frame')?.src.includes('sponsor-proposal-en.pdf'),null,{ timeout:15000 });
  assert.ok(pdfRequests.some(url=>url.includes('-en.pdf')));
  await page.evaluate(()=>window.PREMIERE_I18N.setLanguage('en'));
  await page.waitForFunction(()=>document.querySelector('.pdf-frame')?.hidden===false,null,{ timeout:15000 });
  assert.equal(await page.locator('.document-preview > iframe').count(),1);
  assert.equal(await page.locator('.document-loading').isVisible(),false);
  await page.locator('[data-language="id"]').click();
  await page.waitForFunction(()=>document.querySelector('.pdf-frame')?.src.includes('-id.pdf') && !document.querySelector('.pdf-frame').hidden);
  assert.match(await page.locator('.document-download').getAttribute('href'), /-id\.pdf$/);
  assert.equal(await page.locator('.language-hint').count(),0);
  await page.reload();
  assert.equal(await page.locator('.language-hint').count(),0);
  const newTab=await context.newPage();
  await newTab.goto(origin+'/register.html?lang=en');
  assert.equal(await newTab.locator('.language-hint').count(),0);
  await newTab.close();

  // White-dot layers move without JS updating individual particles each frame.
  await page.locator('[data-language="en"]').click();
  const starPosition=()=>page.locator('.cosmic-background').evaluate(el=>getComputedStyle(el,'::before').transform);
  const first=await starPosition();
  await page.waitForTimeout(1000);
  assert.notEqual(await starPosition(),first);
  const planet=page.locator('.hero-planet');
  await page.locator('.timeline').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('.hero-planet').classList.contains('motion-paused'));
  const paused=await planet.evaluate(el=>getComputedStyle(el).animationPlayState);
  assert.equal(paused,'paused');
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>!document.querySelector('.hero-planet').classList.contains('motion-paused'));
  assert.equal(await planet.evaluate(el=>getComputedStyle(el).animationPlayState),'running');

  fs.mkdirSync('tmp',{recursive:true});
  for (const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390}]) {
    await page.setViewportSize(size);
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false,JSON.stringify(size));
    await page.screenshot({ path:`tmp/mobile-optimized-${size.width}.png` });
  }
  await page.setViewportSize({width:1093,height:958});
  await page.locator('.document-preview').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>!document.querySelector('.pdf-frame').hidden);
  await page.screenshot({path:'tmp/automatic-pdf-preview.png'});
  assert.equal(await page.locator('.memory-gallery img').count(),12);
  assert.equal(await page.locator('.sponsor-board img').count(),2);
  assert.match(await page.locator('.footer-email').getAttribute('href'), /^mailto:event\.akgi@bpkpenabur\.sch\.id$/);
  const font=await page.request.get(origin+'/assets/fonts/manrope-latin.woff2');
  assert.equal(font.headers()['content-type'],'font/woff2');
  assert.equal((await font.body()).subarray(0,4).toString(),'wOF2');
  const pdf=await page.request.get(origin+'/assets/documents/sponsor-proposal-en.pdf',{headers:{Range:'bytes=0-1023'}});
  assert.equal(pdf.status(),206);
  assert.equal((await pdf.body()).length,1024);
  assert.equal((await pdf.body()).subarray(0,5).toString(),'%PDF-');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.cosmic-background').evaluate(el=>getComputedStyle(el,'::before').animationName),'none');
  await context.close();
  const noJS=await browser.newContext({javaScriptEnabled:false});
  const fallback=await noJS.newPage();
  await fallback.goto(origin+'/index.html');
  assert.equal(await fallback.locator('.document-preview iframe').count(),1);
  assert.equal(await fallback.locator('.document-open').isVisible(),true);
  await noJS.close();
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({success:true,automaticPDF:true,pdfLanguageSwitch:true,pdfByteRanges:true,oneTimeLanguageTip:true,movingStars:true,offscreenPause:true,allPhotosAndSponsors:true,responsiveSizes:3,noJSFallback:true,errors},null,2));
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
  if(path.dirname(directory)===os.tmpdir() && path.basename(directory).startsWith('premiere-mobile-')) fs.rmSync(directory,{recursive:true,force:true});
}
