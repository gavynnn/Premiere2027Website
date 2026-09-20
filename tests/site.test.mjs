import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../server/config.mjs';


test('registration cards follow the requested order and link to the matching forms', () => {
  const expected = [
  [
    "badminton",
    "48qE98P23uEGWTF28"
  ],
  [
    "basketball",
    "tb1ixL7ZoN8MPSuYA"
  ],
  [
    "futsal",
    "vCRoHzTrUBqcWUpRA"
  ],
  [
    "cubing",
    "CqqX7eEnmSAQDAoEA"
  ],
  [
    "swimming",
    "7F6DpDhBW1KTxTX77"
  ],
  [
    "volleyball",
    "w9XZ85qubNFfDC4SA"
  ],
  [
    "debate",
    "gKvHMkQ1FiBedAy17"
  ],
  [
    "speech",
    "FeK56549iohJRfWc9"
  ],
  [
    "band",
    "WrA3z62DZaUiGCz58"
  ],
  [
    "dance",
    "tr29QXgdgXTvYVQi8"
  ],
  [
    "mural",
    "WY4r2pK9dpiHxxAV8"
  ],
  [
    "vocal",
    "nYrGZgBZpbNSNuMK9"
  ]
];
  const html = fs.readFileSync(path.join(ROOT, 'register.html'), 'utf8');
  const cards = [...html.matchAll(/<a class="competition-card\b[^>]*>[\s\S]*?<\/a>/g)].map(match => match[0]);
  assert.equal(cards.length, expected.length);
  expected.forEach(([key, formId], index) => {
    const card = cards[index];
    assert.ok(card.includes('data-i18n="arena.' + key + '"'), key + ': order and translation key');
    assert.ok(card.includes('href="https://forms.gle/' + formId + '"'), key + ': form URL');
    assert.ok(card.includes('<span class="card-number">' + String(index + 1).padStart(2, '0') + '</span>'), key + ': number');
    assert.ok(card.includes('target="_blank"'), key + ': new tab without JavaScript');
    assert.ok(card.includes('rel="noopener noreferrer"'), key + ': safe external link');
  });
});

test('chat omits the removed OpenAI privacy notice', () => {
  const chat = fs.readFileSync(path.join(ROOT, 'chat.js'), 'utf8');
  assert.doesNotMatch(chat, /chat-privacy|sent to OpenAI|dikirim ke OpenAI/);
});

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
