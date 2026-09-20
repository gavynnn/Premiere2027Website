import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script = fs.readFileSync(new URL('../cosmic.js', import.meta.url), 'utf8');
function harness({ mobile = false, reduced = false } = {}) {
  const timers = new Map(), listeners = {}, records = [], values = [];
  let id = 0;
  class Element {
    constructor() { this.children = []; this.style = {}; this.attributes = {}; this.classes = new Set(); this.classList = { toggle: (key, on) => on ? this.classes.add(key) : this.classes.delete(key) }; }
    append(child) { this.children.push(child); child.parent = this; }
    replaceChildren() { this.children = []; }
    setAttribute(key, value) { this.attributes[key] = value; }
    querySelector() { return this.children.find(child => child.className === 'space-events'); }
    getBoundingClientRect() { return { width: mobile ? 390 : 1440, height: 900 }; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
    animate(frames, options) {
      const record = { node: this, frames, options };
      records.push(record);
      let resolve;
      const finished = new Promise(done => { resolve = done; });
      record.finish = resolve;
      return { finished, cancel: resolve };
    }
  }
  const sky = new Element();
  const motion = { matches: reduced, addEventListener: (_, callback) => { listeners.motion = callback; } };
  const document = { hidden: false, querySelector: () => sky, createElement: () => new Element(), addEventListener: (name, callback) => { listeners[name] = callback; } };
  const context = {
    document, navigator: { deviceMemory: 8, hardwareConcurrency: 8 },
    matchMedia: query => query.includes('reduced-motion') ? motion : { matches: mobile },
    Math: Object.assign(Object.create(Math), { random: () => values.length ? values.shift() : .5 }),
    setTimeout: (callback, delay) => { timers.set(++id, { callback, delay }); return id; },
    clearTimeout: key => timers.delete(key),
    window: { addEventListener: (name, callback) => { listeners[name] = callback; } }
  };
  vm.runInNewContext(script, context);
  return { timers, listeners, records, sky, motion, document, run(...random) { values.push(...random); const [key, timer] = timers.entries().next().value; timers.delete(key); timer.callback(); } };
}
test('one sky timer runs every 5–10s, and all event types use transform/opacity only', () => {
  for (const [choice, kind, count] of [[.1,'shooting',3],[.6,'comet',1],[.75,'meteor',1],[.95,'ship',3]]) {
    const h = harness();
    assert.equal(h.timers.size, 1);
    assert.ok([...h.timers.values()][0].delay >= 5000 && [...h.timers.values()][0].delay <= 10000);
    h.run(choice, .9);
    assert.equal(h.timers.size, 1);
    assert.equal(h.records.length, count);
    assert.ok(h.records.some(record => record.node.className.includes('space-' + kind)));
    for (const record of h.records) {
      for (const frame of record.frames) assert.deepEqual(Object.keys(frame).filter(key => !['transform','opacity','offset'].includes(key)), []);
      assert.ok(record.options.duration + (record.options.delay || 0) < 5000);
    }
  }
  assert.doesNotMatch(script, /requestAnimationFrame|setInterval|addEventListener\(['"]scroll/);
});
test('mobile showers have at most two stars; full streaks travel beyond the edge', () => {
  const h = harness({mobile:true}); h.run(.1,.9);
  assert.equal(h.records.length,2);
  for (const {frames} of h.records) {
    const coordinates = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(frames.at(-1).transform);
    const x=Number(coordinates[1]), y=Number(coordinates[2]);
    assert.ok(x < 0 || x > 390 || y < 0 || y > 900);
  }
});
test('shooting stars can be singles or groups, and delayed effects cannot pile up', () => {
  const single = harness(); single.run(.1, .34);
  assert.equal(single.records.length, 1);
  const group = harness(); group.run(.1, .35);
  assert.equal(group.records.length, 3);
  group.run(.95);
  assert.equal(group.records.length, 3, 'No new scene until the previous animations finish');
  assert.equal(group.timers.size, 1, 'Only one retry timer');
});
test('finished decorations are removed, and hidden/reduced-motion pages have no pending work', async () => {
  const h = harness(); h.run(.95);
  assert.equal(h.sky.children[0].children.length,3);
  h.records.forEach(record => record.finish());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.sky.children[0].children.length,0);
  h.run(.6);
  h.document.hidden=true; h.listeners.visibilitychange();
  assert.equal(h.timers.size,0);
  assert.equal(h.sky.children[0].children.length,0);
  h.document.hidden=false; h.listeners.visibilitychange();
  assert.equal(h.timers.size,1);
  h.motion.matches=true; h.listeners.motion();
  assert.equal(h.timers.size,0);
  assert.equal(harness({reduced:true}).timers.size,0);
});
test('all entry pages share the sky, with no duplicated scene on same-document navigation', () => {
  for (const name of ['index','register','merch','closing-night']) {
    const html=fs.readFileSync(new URL('../'+name+'.html',import.meta.url),'utf8');
    assert.equal((html.match(/src="cosmic.js"/g)||[]).length,1);
    assert.equal((html.match(/href="cosmic.css"/g)||[]).length,1);
    assert.match(html,/class="cosmic-background"/);
  }
});
