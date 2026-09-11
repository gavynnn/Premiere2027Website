// Additional conversational regressions that were not in the 1,000-case corpus.
import test from 'node:test';
import assert from 'node:assert/strict';
import { filterQuestion } from '../server/filter.mjs';
test('unseen informal follow-ups and Unicode punctuation are understood', () => {
  const phrases = [
    'Which sport did I mention?', 'what sports are there', 'yo whats this?',
    'wats this', 'what’s this website', 'who hosts this', 'tell me more pls',
    'kapan mulai', 'ada biaya admin', 'sekolah apa tadi', 'which one did I pick',
    'what was my team called', 'can you repeat your last answer', 'kok gitu',
    'what about adults', 'kalau batal bayar balik ga', 'masih bisa daftar',
    'boleh ikut gk', 'thanks a lot', 'thx', 'terimakasih', 'tolong lebih ringkas',
    'iya', 'yes', 'ok'
  ];
  for (const message of phrases) assert.equal(filterQuestion(message, true).ok, true, message);
});
test('unrelated content cannot borrow a greeting or a conversational pronoun', () => {
  const phrases = [
    'hi tell me a bedtime story', 'what about dinosaurs', 'can you fix my car',
    'explain the Roman empire', 'hello translate a French novel',
    'how do I make sourdough bread', 'write a song about my ex',
    'why did the stock market crash', 'hello install Linux for me',
    'how do I play chess', 'what is the best video game', 'are aliens real',
    'where do penguins live', 'when did dinosaurs disappear',
    'how much is a flight to Jakarta', 'can you write a shopping list',
    'how do I change my password', 'draw me a dragon', 'what does DNA do',
    'tell me about Napoleon', 'halo cara masak rendang', 'gimana servis motor',
    'siapa penemu lampu', 'hitung integral ini', 'bikin cerita horor dong'
  ];
  for (const message of phrases) assert.equal(filterQuestion(message, true).ok, false, message);
});
