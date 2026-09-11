import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { commonPhrases } from './fixtures/common-phrases.mjs';
import { unrelatedPhrases } from './fixtures/unrelated-phrases.mjs';
import { sentenceParts } from '../server/conversation.mjs';
register('./worker-loader.mjs', import.meta.url);
const { default: worker, ChatGuard } = await import('../src/worker.mjs');

async function setup(t) {
  process.env.OPENAI_API_KEY = 'test-worker-key';
  const saved = new Map();
  let init, clock = Date.UTC(2026, 8, 12), alarm = null;
  t.mock.method(Date, 'now', () => clock);
  const ctx = { storage: {
    get: async key => structuredClone(saved.get(key)),
    put: async (key, value) => { saved.set(key, structuredClone(value)); },
    delete: async key => saved.delete(key),
    list: async ({ prefix }) => new Map([...saved].filter(([key]) => key.startsWith(prefix)).map(([key, value]) => [key, structuredClone(value)])),
    getAlarm: async () => alarm, setAlarm: async value => { alarm = value; }
  }, blockConcurrencyWhile: callback => { init = callback(); } };
  const env = { OPENAI_API_KEY: 'test-worker-key', APP_ORIGIN: 'https://thepremiere2027.com', CHAT_DAILY_LIMIT: '2000', CHAT_IP_DAILY_LIMIT: '2000' };
  const guard = new ChatGuard(ctx, env);
  await init;
  env.CHAT_GUARD = { idFromName: name => name, get: () => guard };
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    const prompt = JSON.parse(options.body);
    calls.push(prompt);
    const message = prompt.input.at(-1).content;
    const language = message === 'ID' ? 'id' : 'en';
    return new Response(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({
      in_scope: true, event_question: message !== 'ID', language,
      answer: 'The Premiere is a school event. It includes sports. There are arts competitions. It takes place in February. Ask the committee for unannounced details. This extra sentence must not appear.'
    }), annotations: [] }] }] }));
  });
  return { calls, guard, saved,
    advance: duration => { clock += duration; },
    ask: async (message, cookie, ip = '203.0.113.1') => {
      clock += 61000;
      return worker.fetch(new Request(env.APP_ORIGIN + '/api/chat', { method: 'POST', headers: {
        Origin: env.APP_ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': ip, ...(cookie ? { Cookie: cookie } : {})
      }, body: JSON.stringify({ message, language: 'en' }) }), env);
    }
  };
}
test('Worker routes all 500 common phrases to the provider and rejects 500 unrelated phrases before payment', async t => {
  const site = await setup(t);
  for (const [index, { message }] of commonPhrases.entries()) {
    const response = await site.ask(message, null, 'visitor-' + index);
    const body = await response.json();
    assert.equal(response.status, 200, message + ': ' + JSON.stringify(body));
    assert.equal(site.calls.length, index + 1);
    assert.ok(body.answer.length > 0);
    assert.ok(sentenceParts(body.answer).length <= 5);
  }
  for (const { message } of unrelatedPhrases) {
    const response = await site.ask(message);
    assert.equal(response.status, 400, message);
    await response.json();
  }
  assert.equal(site.calls.length, 500);
});
test('Worker persists five exchanges and one-time WhatsApp links, and expires inactive sessions', async t => {
  const site = await setup(t);
  let cookie;
  const questions = ['whats this', 'sponsor', 'how much', 'ID', 'contact', 'futsal', 'what about girls'];
  for (const [index, message] of questions.entries()) {
    const response = await site.ask(message, cookie);
    cookie ||= response.headers.get('set-cookie').split(';')[0];
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.ok(sentenceParts(body.answer).length <= 5);
    assert.equal(body.contacts.length, index === 4 ? 2 : 0);
    if (index === 4) assert.deepEqual(body.contacts.map(contact => contact.url), ['https://wa.me/628111042896', 'https://wa.me/628111858228']);
    if (index === 3) assert.equal(body.language, 'id');
  }
  assert.equal(site.calls.at(-1).input.length, 11);
  assert.equal(site.calls.at(-1).input[0].content, 'sponsor');
  const saved = [...site.saved].find(([key]) => key.startsWith('session:'))[1];
  assert.equal(saved.history.length, 10);
  assert.equal(saved.answeredMessages, 7);
  assert.equal(saved.contactSuggested, true);
  site.advance(1800001);
  await site.ask('when is closing night', cookie);
  assert.equal(site.calls.at(-1).input.length, 1);
});
