// Explicit, small paid smoke test. Does not run with npm test and never prints
// secrets, raw provider responses, or visitor conversations.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openAI, answerRequest, parseAnswer } from '../server/openai.mjs';
import { filterQuestion } from '../server/filter.mjs';
import { finishExchange, sentenceParts } from '../server/conversation.mjs';
const root = new URL('../', import.meta.url);
process.loadEnvFile(fileURLToPath(new URL('.env', root)));
const knowledge = JSON.parse(fs.readFileSync(new URL('server/knowledge.json', root), 'utf8'));
const facts = JSON.parse(fs.readFileSync(new URL('server/event-facts.json', root), 'utf8'));
const samples = [
  ['whats this', 'en'], ['hi whats this', 'en'], ['what’s this', 'en'],
  ['sponsor', 'en'], ['can u explain this', 'en'], ['how much', 'en'],
  ['futsal', 'en'], ['what is the event about', 'en'],
  ['ini apaan', 'id'], ['gimana cara daftar', 'id'], ['halo kak', 'id'],
  ['tiket', 'id'], ['siapa yang tampil', 'id'], ['linknya error', 'id']
];
const rows = [];
const destination = process.argv[2];
async function ask(message, expectedLanguage, current = { history: [], answeredMessages: 0, contactSuggested: false, language: null }) {
  const filtered = filterQuestion(message, current.history.length > 0);
  if (!filtered.ok) throw new Error('Smoke sample was rejected locally: ' + message);
  const request = answerRequest({ message: filtered.message, language: current.language || 'en', history: current.history, facts, knowledge });
  const raw = await openAI('responses', { body: request });
  const text = (raw.output || []).flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('');
  const rawAnswer = JSON.parse(text).answer;
  const answer = parseAnswer(raw, knowledge);
  const finished = finishExchange(current, filtered.message, answer, facts);
  if (answer.inScope) Object.assign(current, finished.patch);
  const row = {
    question: message, inScope: answer.inScope, language: answer.language, expectedLanguage,
    rawSentences: sentenceParts(rawAnswer, answer.language).length,
    rawWords: rawAnswer.trim().split(/\s+/).length,
    shownSentences: sentenceParts(finished.response.answer, answer.language).length,
    previousMessages: request.input.length - 1, whatsappLinks: finished.response.contacts.length,
    // The test output contains only authored samples and their model answers.
    answer: finished.response.answer
  };
  rows.push(row);
  console.log(JSON.stringify(row));
  if (destination) fs.writeFileSync(destination, JSON.stringify({ complete: false, rows }, null, 2) + '\n');
  return row;
}
for (const [question, language] of samples) await ask(question, language);
const conversation = { history: [], answeredMessages: 0, contactSuggested: false, language: null };
for (const [question, language] of [
  ['Our school is Merpati and our team wants to join futsal.', 'en'],
  ['What school did I mention?', 'en'], ['ID', 'id'],
  ['sekolahku tadi apa', 'id'], ['siapa yang bisa dihubungi', 'id'],
  ['EN', 'en'], ['Which sport did I mention?', 'en']
]) await ask(question, language, conversation);
const summary = {
  samples: rows.length, inScope: rows.filter(row => row.inScope).length,
  languageMatches: rows.filter(row => row.language === row.expectedLanguage).length,
  averageRawSentences: rows.reduce((total, row) => total + row.rawSentences, 0) / rows.length,
  maxShownSentences: Math.max(...rows.map(row => row.shownSentences))
};
console.log(JSON.stringify({ summary }));
if (destination) fs.writeFileSync(destination, JSON.stringify({ complete: true, summary, rows }, null, 2) + '\n');
if (summary.inScope !== rows.length || summary.languageMatches !== rows.length || summary.averageRawSentences > 5 || summary.maxShownSentences > 5) process.exitCode = 1;
