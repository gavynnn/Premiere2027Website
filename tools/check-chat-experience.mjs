// Explicit paid evaluation, never imported by npm test. No automatic retries.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { answerRequest, openAI, parseAnswer } from '../server/openai.mjs';
import { finishExchange, replyPolicy, sentenceParts } from '../server/conversation.mjs';
import { filterQuestion } from '../server/filter.mjs';
if (!process.argv.includes('--paid')) throw new Error('Requires explicit approval and --paid. Sends 12 calls, including 2 PDFs.');
const root = new URL('../', import.meta.url);
process.loadEnvFile(fileURLToPath(new URL('.env', root)));
const knowledge = JSON.parse(fs.readFileSync(new URL('server/knowledge.json', root), 'utf8'));
const facts = JSON.parse(fs.readFileSync(new URL('server/event-facts.json', root), 'utf8'));
const output = new URL('tests/reports/chat-experience-live.json', root);
const previous = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')) : null;
if (previous && (!process.argv.includes('--resume') || previous.complete || previous.attempted !== previous.rows.length)) throw new Error('Report exists or last call is uncertain. Do not silently repeat paid calls.');
const samples = [
  ['whats this', 'en'], ['This is cool', 'en'], ['Is this a fun event?', 'en'],
  ['My school is Merpati and I like futsal', 'en'], ['What school did I mention?', 'en'],
  ['ID', 'id'], ['sekolahku tadi apa', 'id'], ['EN', 'en'],
  ['Why should I sponsor?', 'en'], ['Jelaskan manfaat sponsor secara rinci', 'id'],
  ['Who are the previous guest stars shown in the proposal images?', 'en'],
  ['Jelaskan manfaat sponsor dan grafik penonton 2024-2026 secara rinci', 'id']
];
let current = { history: [], answeredMessages: 0, contactSuggested: false, language: null };
const rows = previous?.rows || [];
const count = (text, language) => text.split('\n').filter(line => !/^#{1,3}\s/.test(line)).reduce((sum, line) => sum + sentenceParts(line, language).length, 0);
for (const [index, [message, expectedLanguage]] of samples.entries()) {
  if (index < rows.length) continue;
  // Independent detailed/vision questions should not inherit unrelated history.
  if (index >= 8) current = { history: [], answeredMessages: 0, contactSuggested: false, language: null };
  if (!filterQuestion(message, current.history.length > 0).ok) throw new Error('Local filter rejected sample: ' + message);
  const request = answerRequest({ message, language: current.language || 'en', history: current.history, facts, knowledge });
  const report = { complete: false, attempted: index + 1, rows };
  fs.writeFileSync(output, JSON.stringify(report, null, 2));
  const raw = await openAI('responses', { body: request, timeout: 55000 });
  const parsed = JSON.parse(raw.output.flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join(''));
  const answer = parseAnswer(raw, knowledge, message, current.history);
  const finished = finishExchange(current, message, answer, facts);
  const row = { message, expectedLanguage, language: answer.language, inScope: answer.inScope, revision: 'explicit-language-and-sections',
    detailed: replyPolicy(message, current.history).detailed, rawSentences: count(parsed.answer, answer.language), shownSentences: count(finished.response.answer, answer.language),
    words: finished.response.answer.split(/\s+/).length, vision: Array.isArray(request.input.at(-1).content),
    previousMessages: request.input.length - 1, answer: finished.response.answer, sources: answer.sources, actions: answer.actions, contacts: finished.response.contacts, usage: raw.usage };
  rows.push(row);
  if (answer.inScope) Object.assign(current, finished.patch);
  console.log(JSON.stringify(row));
  fs.writeFileSync(output, JSON.stringify({ complete: false, attempted: index + 1, rows }, null, 2));
}
const ordinary = rows.filter(row => !row.detailed);
const summary = { samples: rows.length, accepted: rows.filter(row => row.inScope).length, languageMatches: rows.filter(row => row.language === row.expectedLanguage).length,
  ordinaryAverageRawSentences: ordinary.reduce((sum, row) => sum + row.rawSentences, 0) / ordinary.length,
  ordinaryAverageShownSentences: ordinary.reduce((sum, row) => sum + row.shownSentences, 0) / ordinary.length,
  visionCalls: rows.filter(row => row.vision).length,
  fifthReplyContacts: rows[4].contacts.length, rememberedSchool: /Merpati/i.test(rows[4].answer) && /Merpati/i.test(rows[6].answer) };
fs.writeFileSync(output, JSON.stringify({ complete: true, summary, rows }, null, 2) + '\n');
console.log(JSON.stringify({ summary }));
if (summary.accepted !== 12 || summary.languageMatches !== 12 || summary.ordinaryAverageShownSentences > 3 || !summary.rememberedSchool) process.exitCode = 1;
