// Browser regression with local resources and intercepted API requests only.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const root=path.resolve(import.meta.dirname,'..');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];
try {
  const context=await browser.newContext({viewport:{width:1093,height:958}});
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.pathname.startsWith('/api/')) return route.fulfill({json:{available:false}});
    const file=path.resolve(root,'.'+url.pathname);
    if(url.origin!=='http://premiere.test' || !file.startsWith(root+path.sep) || !mime[path.extname(file)] || !fs.existsSync(file)) return route.abort();
    await route.fulfill({contentType:mime[path.extname(file)],body:fs.readFileSync(file)});
  });
  await context.addInitScript(()=>{
    // Trigger only the sky scheduler manually. Real Web Animations are neither
    // sped up nor mocked, and no production debug hooks are needed.
    const original=setTimeout;
    window.setTimeout=(callback,delay,...args)=>{
      if(delay>=5000 && delay<=10000 && new Error().stack.includes('/cosmic.js')) {
        window.__skyDue=callback;
        return original(()=>{},600000);
      }
      return original(callback,delay,...args);
    };
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://premiere.test/merch.html?lang=en');
  await page.waitForFunction(()=>Boolean(window.__skyDue));
  const position=()=>page.locator('.cosmic-background').evaluate(el=>getComputedStyle(el,'::before').transform);
  const before=await position();
  await page.waitForTimeout(600);
  assert.notEqual(await position(),before);
  assert.equal(await page.locator('.space-events').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
  fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
  for(const [choice,kind] of [[.1,'shooting'],[.6,'comet'],[.75,'meteor'],[.95,'ship']]) {
    await page.evaluate(choice=>{
      const original=Math.random; let first=true;
      Math.random=()=>{if(first){first=false;return choice;}return .55;};
      window.__skyDue(); Math.random=original;
    },choice);
    assert.ok(await page.locator('.space-'+kind).count()>0,kind);
    await page.waitForTimeout(kind==='ship'?550:350);
    await page.screenshot({path:path.join(root,`tmp/sky-${kind}.png`)});
    await page.waitForFunction(()=>document.querySelector('.space-events').childElementCount===0,null,{timeout:8000});
  }
  // One shared scene survives every SPA route; decorative pixels never intercept navigation.
  await page.evaluate(()=>{document.querySelector('.space-events').dataset.testIdentity='shared';});
  for(const filename of ['register.html','closing-night.html','index.html','merch.html']) {
    await page.locator(`#main-nav a[href*="${filename}"]`).click();
    await page.waitForURL('**/'+filename+'*');
    await page.waitForFunction(()=>!document.body.classList.contains('is-leaving'));
    assert.equal(await page.locator('.space-events').count(),1);
    assert.equal(await page.locator('.space-events').getAttribute('data-test-identity'),'shared');
  }
  await page.setViewportSize({width:390,height:844});
  const cdp=await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:6});
  await cdp.send('Performance.enable');
  await page.evaluate(()=>{const r=Math.random;Math.random=()=>.1;window.__skyDue();Math.random=r;});
  assert.ok(await page.locator('.space-flight').count()<=2);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
  const startMetrics=await metrics();
  const frames=await page.evaluate(()=>new Promise(resolve=>{
    const gaps=[]; let last=performance.now(); const start=last;
    function sample(now){gaps.push(now-last);last=now;if(now-start<2000)requestAnimationFrame(sample);else{gaps.sort((a,b)=>a-b);resolve({p95Ms:gaps[Math.floor(gaps.length*.95)],over50ms:gaps.filter(n=>n>50).length});}}
    requestAnimationFrame(sample);
  }));
  const endMetrics=await metrics();
  const performanceSample={cpuSlowdown:6,windowMs:2000,...frames,layoutMs:(endMetrics.LayoutDuration-startMetrics.LayoutDuration)*1000,taskMs:(endMetrics.TaskDuration-startMetrics.TaskDuration)*1000};
  await page.evaluate(()=>{const r=Math.random;Math.random=()=>.95;window.__skyDue();Math.random=r;});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('.space-events').childElementCount===0);
  assert.equal(await page.locator('.space-flight').count(),0);
  assert.equal(await page.locator('.cosmic-background').evaluate(el=>getComputedStyle(el,'::before').animationName),'none');
  assert.deepEqual(errors,[]);
  const report={success:true,events:['shooting groups','comets','meteors','portal ships'],sharedAcrossFourPages:true,mobile:true,reducedMotion:true,performanceSample,errors};
  fs.mkdirSync(path.join(root,'tests/reports'),{recursive:true});
  fs.writeFileSync(path.join(root,'tests/reports/cosmic-ui.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
} finally {await browser.close();}
