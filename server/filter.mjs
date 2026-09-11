// Pure text filtering, deliberately dependency-free: no node:fs, no
// import.meta.url. guard.mjs re-exports this for server.mjs/tests, and
// src/worker.mjs imports it directly so the Worker bundle never pulls in
// config.mjs's module-load-time fs/URL code (which fails under workerd).
const topic = /\b(premiere|astra|aeterna|penabur|pskg|events?|acara|competition|competitions|registration|register|sponsor\w*|proposal|invite|invitation|e-invite|ticket\w*|closing|opening|preopening|pre-opening|merch\w*|venue|schedule|dates?|deadline|committee|contact|futsal|basketball|volleyball|badminton|mural|vocal|band|dance|speedcubing|swimming|debate|speech|lomba|kompetisi|pendaftaran|daftar|undangan|tiket|penutupan|pembukaan|jadwal|tanggal|panitia|alamat|kontak|renang|pidato|debat|voli|basket|tangkis|vokal|tari)\b/i;
const injection = /ignore.{0,35}(instruction|previous|system)|system\s*prompt|api\s*key|jailbreak|developer\s*message|abaikan.{0,30}(instruksi|perintah)|\x60{3}|<script|\b(write|generate|debug)\b.{0,20}\b(code|python|javascript|essay)\b/i;
const CONTROL_CHARS = new RegExp('[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f]');
const naturalOpening = /\b(?:hi|hello|hey|halo|hai|permisi|what(?:'s| is) (?:this|it)|what event is this|tell me (?:more )?about (?:this|it)|can you explain (?:this|the event)|what can you do|who are you|help me|ini (?:acara )?apa|acara apa ini|tentang apa ini|jelaskan acara ini|kamu siapa|bisa bantu apa)\b/i;
export function filterQuestion(input, hasContext = false) {
  if (typeof input !== 'string') return { ok: false, code: 'invalid' };
  const message = input.normalize('NFKC').trim().replace(/\s+/g, ' ');
  if (message.length < 2 || message.length > 400 || CONTROL_CHARS.test(message)) return { ok: false, code: 'invalid' };
  if (/(.)\1{7,}/iu.test(message) || /https?:\/\/|www\./i.test(message) || injection.test(message)) return { ok: false, code: 'scope' };
  const words = message.toLowerCase().match(/[\p{L}]+/gu) || [];
  if (!words.length || words.some(word => word.length > 35) || (words.length > 10 && new Set(words).size / words.length < .3)) return { ok: false, code: 'scope' };
  const followUp = hasContext && /\b(it|they|that|these|those|cost|price|fee|age|eligible|eligibility|rules?|requirements?|benefits?|where|when|how much|berapa|biaya|harga|umur|usia|syarat|ketentuan|manfaat|itu|tersebut|kapan|dimana|lokasi|english|indonesian|bahasa|inggris|indonesia|translate|terjemahkan)\b/i.test(message);
  if (!topic.test(message) && !followUp && !naturalOpening.test(message)) return { ok: false, code: 'scope' };
  return { ok: true, message };
}
