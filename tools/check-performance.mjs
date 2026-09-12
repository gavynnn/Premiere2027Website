// Reproducible local measurements; never sends a chat request or uses OpenAI.
// Usage: PLAYWRIGHT_PACKAGE=<installed playwright> node tools/check-performance.mjs baseline|optimized
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { once } from 'node:events';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const root = path.resolve(import.meta.dirname, '..');
const label = process.argv[2] || 'optimized';
if (!/^[a-z-]+$/.test(label)) throw new Error('Invalid report name');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml', '.pdf':'application/pdf', '.woff2':'font/woff2' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    res.writeHead(200, { 'content-type':'application/json' });
    return res.end(JSON.stringify({ available:false }));
  }
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(root + path.sep) || !types[path.extname(file)] || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type':types[path.extname(file)], 'cache-control':'no-store' });
  fs.createReadStream(file).pipe(res);
});
let browser;
const errors = [];
const samples = [];
try {
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ channel:'chrome', headless:true });
  for (let run=0; run<3; run++) {
    const context = await browser.newContext({ viewport:{ width:390, height:844 }, deviceScaleFactor:1, isMobile:true });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled:true });
    await cdp.send('Network.emulateNetworkConditions', { offline:false, latency:150, downloadThroughput:200000, uploadThroughput:93750, connectionType:'cellular4g' });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate:6 });
    await cdp.send('Performance.enable');
    let bytes=0;
    cdp.on('Network.loadingFinished', event => { bytes += event.encodedDataLength; });
    await page.addInitScript(() => {
      window.perfSample = { lcp:0, longTasks:[] };
      new PerformanceObserver(list => { for (const e of list.getEntries()) window.perfSample.lcp=e.startTime; }).observe({ type:'largest-contentful-paint', buffered:true });
      new PerformanceObserver(list => { for (const e of list.getEntries()) window.perfSample.longTasks.push(e.duration); }).observe({ type:'longtask', buffered:true });
    });
    await page.goto(origin + '/index.html?lang=en', { waitUntil:'load', timeout:90000 });
    await page.waitForTimeout(1500);
    const sample = await page.evaluate(() => ({
      ...window.perfSample,
      fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      load:performance.getEntriesByType('navigation')[0].loadEventEnd,
      resources:performance.getEntriesByType('resource').map(r => ({ name:r.name.split('/').at(-1), bytes:r.encodedBodySize })),
      horizontalOverflow:document.documentElement.scrollWidth > innerWidth,
    }));
    sample.initialBytes=bytes;
    // Disconnect network constraints during the fixed rendering workload so that
    // asset arrivals cannot masquerade as scroll/rendering improvements.
    await cdp.send('Network.emulateNetworkConditions', { offline:false, latency:0, downloadThroughput:-1, uploadThroughput:-1 });
    const getMetrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name,m.value]));
    const before = await getMetrics();
    const trace = [];
    cdp.on('Tracing.dataCollected', e => trace.push(...e.value));
    await cdp.send('Tracing.start', { categories:'devtools.timeline', transferMode:'ReportEvents' });
    await page.waitForTimeout(2500);
    await cdp.send('Tracing.end');
    await new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
    const after = await getMetrics();
    sample.idle = {
      taskMs:(after.TaskDuration-before.TaskDuration)*1000,
      layoutMs:(after.LayoutDuration-before.LayoutDuration)*1000,
      styleMs:(after.RecalcStyleDuration-before.RecalcStyleDuration)*1000,
      paints:trace.filter(e=>e.name==='Paint' && e.ph==='X').length,
      paintMs:trace.filter(e=>e.name==='Paint' && e.ph==='X').reduce((n,e)=>n+(e.dur||0),0)/1000,
    };
    sample.scroll = await page.evaluate(async () => {
      const gaps=[];
      let last=performance.now(); const start=last;
      const end=document.querySelector('.timeline').offsetTop;
      await new Promise(resolve => {
        function frame(now) {
          gaps.push(now-last); last=now;
          scrollTo({ top:Math.min(1,(now-start)/4500)*end, behavior:'instant' });
          if (now-start<4500) requestAnimationFrame(frame); else resolve();
        }
        requestAnimationFrame(frame);
      });
      gaps.sort((a,b)=>a-b);
      return { frames:gaps.length, p95FrameMs:gaps[Math.floor(gaps.length*.95)], framesOver50ms:gaps.filter(n=>n>50).length };
    });
    if (run===0) {
      fs.mkdirSync(path.join(root,'tmp'), { recursive:true });
      await page.screenshot({ path:path.join(root,`tmp/performance-${label}-mobile.png`) });
    }
    samples.push(sample);
    console.log(JSON.stringify({ run:run+1, initialBytes:sample.initialBytes, lcp:sample.lcp, idle:sample.idle, scroll:sample.scroll }));
    await context.close();
  }
  const median = getter => samples.map(getter).sort((a,b)=>a-b)[1];
  const report = { label, environment:{ chrome:browser.version(), viewport:'390x844 DPR 1', cpuSlowdown:6, loadNetwork:'1.6 Mbps down, 150 ms latency, cold cache; local uncompressed server', renderingWindowMs:2500, caveat:'Synthetic headless measurements, not a guarantee for every physical device.' }, median:{ initialBytes:median(s=>s.initialBytes), lcpMs:median(s=>s.lcp), fcpMs:median(s=>s.fcp), loadMs:median(s=>s.load), idleTaskMs:median(s=>s.idle.taskMs), idlePaints:median(s=>s.idle.paints), idlePaintMs:median(s=>s.idle.paintMs), scrollP95FrameMs:median(s=>s.scroll.p95FrameMs), scrollFramesOver50ms:median(s=>s.scroll.framesOver50ms) }, samples, errors };
  fs.mkdirSync(path.join(root,'tests/reports'), { recursive:true });
  fs.writeFileSync(path.join(root,`tests/reports/performance-${label}.json`), JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report.median,null,2));
  if (errors.length || samples.some(s=>s.horizontalOverflow)) throw new Error('Browser errors or horizontal overflow');
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
}
