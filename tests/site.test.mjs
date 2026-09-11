import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../server/config.mjs';

test('all four pages reference available local assets and have unique IDs', () => {
  for (const page of ['index.html', 'register.html', 'merch.html', 'closing-night.html']) {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, page + ': duplicate ID');
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const url = match[1];
      if (/^(?:https?:|tel:|mailto:|#)/.test(url)) continue;
      const filename = url.split(/[?#]/)[0];
      assert.ok(fs.existsSync(path.join(ROOT, filename)), page + ': missing ' + filename);
    }
    assert.match(html, /src="chat.js"/);
    assert.match(html, /href="chat.css"/);
    assert.ok(html.indexOf('src="locale.js"') < html.indexOf('src="chat.js"'));
  }
});

test('photo galleries use every supplied event photo and both sponsor boards', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const groups = { preopening: 5, week: 4, opening: 2, closing: 1 };
  for (const [group, count] of Object.entries(groups)) {
    const markup = new RegExp('class="memory-photo memory-gallery gallery-' + group + '">([\\s\\S]*?)</div>').exec(html)?.[1];
    assert.ok(markup, group);
    assert.equal([...markup.matchAll(/<img /g)].length, count, group);
    assert.equal([...markup.matchAll(/data-i18n-alt=/g)].length, count, group + ': bilingual alt text');
  }
  assert.equal([...html.matchAll(/src="assets\/sponsors\//g)].length, 2);
  assert.equal(html.includes('DROP IN YOUR'), false);
});

test('sponsor shortcut, four prominent journey dates and no em dashes in site copy', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /href="#sponsorship"/);
  assert.match(html, /id="sponsorship"/);
  assert.equal([...html.matchAll(/class="panel-year"/g)].length, 4);
  for (const file of ['index.html', 'register.html', 'merch.html', 'closing-night.html', 'locale.js']) {
    assert.equal(fs.readFileSync(path.join(ROOT, file), 'utf8').includes('\u2014'), false, file);
  }
  const example = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8');
  assert.match(example, /^OPENAI_API_KEY=\s*$/m);
  assert.match(example, /^CHAT_DAILY_LIMIT=3000$/m);
});
