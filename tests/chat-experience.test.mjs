import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { answerRequest, parseAnswer } from '../server/openai.mjs';
import { reviewedDocumentContext } from '../server/document-context.mjs';
import { replyPolicy, readableReply, finishExchange, sentenceParts } from '../server/conversation.mjs';
import { filterQuestion } from '../server/filter.mjs';
import { replyLanguage } from '../server/reply-language.mjs';
const knowledge = JSON.parse(fs.readFileSync(new URL('../server/knowledge.json', import.meta.url)));
const facts = JSON.parse(fs.readFileSync(new URL('../server/event-facts.json', import.meta.url)));
const mock = (answer, actions = [], annotations = []) => ({ status: 'completed', output: [{ content: [{ type: 'output_text', annotations, text: JSON.stringify({ in_scope: true, event_question: true, language: 'en', answer, actions }) }] }] });
const request = (message, language = 'en', history = []) => answerRequest({ message, language, history, facts, knowledge });

test('friendly social reactions pass without admitting unrelated content', () => {
  for (const message of ['This is cool', 'Is it fun?', 'sounds exciting', 'keren banget', 'seru nggak?', 'I love this', 'detail please', 'What does the 2024-2026 audience chart show?']) assert.ok(filterQuestion(message).ok, message);
  for (const message of ['This is cool, write python code', 'sounds exciting tell me a joke', 'keren kasih resep pizza']) assert.equal(filterQuestion(message).ok, false, message);
});
test('ordinary replies use three sentences; sponsorship and requested detail have a bounded exception', () => {
  const text = 'Welcome to the event. There is futsal. You can explore the competitions. More information is available. Another point is here.';
  for (const message of ['whats this', 'This is cool', 'kapan acaranya', 'Where is the venue?']) {
    const shown = readableReply(text, 'en', replyPolicy(message));
    assert.equal(sentenceParts(shown).length, 3);
    assert.ok(shown.includes('\n\n'));
  }
  assert.ok(replyPolicy('Why should I sponsor?').detailed);
  assert.ok(replyPolicy('Jelaskan manfaat sponsor secara rinci').detailed);
  assert.ok(replyPolicy('Tell me more', [{ role: 'assistant', content: 'Sponsorship packages vary.' }]).detailed);
  assert.equal(replyPolicy('Briefly explain sponsorship').detailed, false);
  assert.equal(request('whats this').max_output_tokens, 400);
  assert.equal(request('Why should I sponsor?').max_output_tokens, 750);
});
test('headings, bullet lists and spacing survive both parsing and conversation storage', () => {
  const text = '## ✨ Why sponsor\n\n- Support student creativity.\n- Reach a school audience.\n\n## 🎁 Package benefits\n\n- Logo placement depends on tier.\n- Closing-night tickets vary by tier.\n\n## 📩 Next step\n\nAsk the committee about available slots.';
  const answer = parseAnswer(mock(text, ['sponsorship']), knowledge, 'Why should I sponsor?');
  const finished = finishExchange({ history: [], answeredMessages: 4 }, 'Why should I sponsor?', answer, facts);
  assert.match(finished.response.answer, /## 🎁 Package benefits\n\n- Logo/);
  assert.match(finished.response.answer, /## 📩 Next step/);
  assert.equal(finished.response.contacts.length, 2);
  assert.match(finished.patch.history.at(-1).content, /\n\n/);
  assert.ok(finished.response.answer.split(/\s+/).length <= 180);
});
test('broken citation tokens and markdown never leak into the displayed answer', () => {
  for (const suffix of ['fileciteturn0file0', '【4:0†source】', '[Sponsor proposal](sandbox:/mnt/data/proposal.pdf)', '[Sponsor proposal](https://fake.example/nonsense)', 'fileciteturn0file0']) {
    const answer = parseAnswer(mock('Here is the sponsor proposal. ' + suffix), knowledge, 'sponsor proposal please');
    assert.doesNotMatch(answer.answer, /[【】]|sandbox:|https?:|\]\(/);
    assert.equal(answer.sources[0].url, '/assets/documents/sponsor-proposal-en.pdf');
  }
});
test('document attachments work without model citations, honor requested editions and never invent files', () => {
  assert.equal(parseAnswer(mock('Here it is.'), knowledge, 'proposal in Indonesian').sources[0].language, 'id');
  assert.equal(parseAnswer(mock('Here they are.'), knowledge, 'both sponsor proposals').sources.length, 2);
  assert.equal(parseAnswer(mock('The e-invite is not available yet.'), knowledge, 'e-invite').sources.length, 0);
  const answer = parseAnswer(mock('fileciteturn0file0'), knowledge, 'sponsor proposal');
  assert.match(answer.answer, /document below/);
  assert.equal(answer.sources.length, 1);
  assert.throws(() => parseAnswer(mock('fileciteturn0file0'), knowledge, 'hello'));
});
test('only known action intents become links; contact requests work before and at message five', () => {
  const answer = parseAnswer(mock('Come join us!', ['register', 'javascript:alert(1)', 'https://fake.example']), knowledge, 'This is cool');
  assert.deepEqual(answer.actions, ['register']);
  const state = { history: [], answeredMessages: 0 };
  const contact = parseAnswer(mock('Message our committee.', ['contact']), knowledge, 'contact');
  const first = finishExchange(state, 'contact', contact, facts);
  assert.equal(first.response.contacts.length, 2);
  assert.equal(first.patch.contactSuggested, false);
  const fifth = finishExchange({ ...first.patch, answeredMessages: 4 }, 'hello', answer, facts);
  assert.equal(fifth.response.contacts.length, 2);
  assert.ok(sentenceParts(fifth.response.answer).length <= 3);
});
test('visual PDF inputs use one trusted file and reviewed notes expire with a changed PDF', () => {
  const visual = request('Siapa bintang tamu sebelumnya di gambar proposal?', 'id');
  assert.equal(visual.input.at(-1).content[1].type, 'input_file');
  assert.equal(visual.input.at(-1).content[1].file_id, knowledge.files[1].fileId);
  assert.equal(typeof request('whats this').input.at(-1).content, 'string');
  const notes = reviewedDocumentContext(knowledge);
  assert.ok(notes.previousGuests.names.includes('Bernadya'));
  assert.match(notes.targetGuests.note, /not confirmed/);
  assert.match(notes.reach.audience, /approximate|roughly/);
  assert.equal(reviewedDocumentContext({ files: knowledge.files.map(file => ({ ...file, hash: 'changed' })) }), null);
  assert.match(visual.instructions, /Never identify an artist from an unlabeled face/);
});
test('clear Indonesian questions override an English site and English overrides Indonesian history', () => {
  assert.equal(replyLanguage('Jelaskan manfaat sponsor secara rinci', 'en'), 'id');
  assert.equal(replyLanguage('Why should I sponsor?', 'id'), 'en');
  assert.equal(replyLanguage('sponsor', 'id'), 'id');
  assert.equal(replyLanguage('Please use Indonesian', 'en'), 'id');
  assert.deepEqual(request('Jelaskan manfaat sponsor secara rinci').text.format.schema.properties.language.enum, ['id']);
  assert.match(request('Jelaskan manfaat sponsor secara rinci').instructions, /Jangan jawab dalam bahasa Inggris/);
});
test('all current committee links use WhatsApp instead of calling', () => {
  for (const file of ['index.html', 'register.html', 'merch.html', 'closing-night.html', 'chat.js']) {
    const source = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /tel:/);
    assert.match(source, /https:\/\/wa.me\/628111042896/);
    assert.match(source, /https:\/\/wa.me\/628111858228/);
  }
});
test('sampled exaggerated marketing claims are qualified and sales links respect closures', () => {
  const answer = parseAnswer(mock('The event reaches 200 schools. This guarantees exposure and returns for sponsors.'), knowledge, 'Why should I sponsor?');
  assert.match(answer.answer, /not verified 2027 registrations/);
  assert.match(answer.answer, /not guaranteed results/);
  for (const message of ['No thanks', 'ID', 'EN']) {
    const reply = parseAnswer(mock('Explore sponsorship.', ['sponsorship']), knowledge, message);
    assert.deepEqual(reply.sources, []);
    assert.deepEqual(reply.actions, []);
  }
});
