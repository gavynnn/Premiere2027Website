// One shared conversation policy for the local server and Cloudflare Worker.
export const MEMORY_EXCHANGES = 5;
export function recentHistory(history = []) { return history.slice(-MEMORY_EXCHANGES * 2); }

export function sentenceParts(text, language = 'en') {
  return [...new Intl.Segmenter(language, { granularity: 'sentence' }).segment(text.trim())].map(item => item.segment.trim()).filter(Boolean);
}
export function conciseReply(text, language = 'en', maxSentences = 5) {
  let remaining = maxSentences;
  const lines = [];
  for (const line of text.replace(/\u2014/g, ',').split(/\n/)) {
    if (!line.trim()) { if (lines.at(-1)) lines.push(''); continue; }
    if (!remaining) break;
    if (/^#{1,3}\s/.test(line)) { lines.push(line.trim()); continue; }
    const parts = sentenceParts(line, language).slice(0, remaining);
    remaining -= parts.length;
    // Even a model-produced paragraph is broken up into short chat-sized blocks.
    for (let i = 0; i < parts.length; i += 2) lines.push(parts.slice(i, i + 2).join(' '), '');
  }
  while (lines.length && (!lines.at(-1) || /^#{1,3}\s/.test(lines.at(-1)))) lines.pop();
  return lines.join('\n').trim();
}
export function replyPolicy(message, history = []) {
  if (/\b(short|shorter|brief|briefly|summary|summarize|singkat|ringkas|pendek)\b/i.test(message)) return { sentences: 3, words: 75, detailed: false };
  const followup = /^(and |what about |how about |why |which |how much|berapa|apa |kenapa|yang |lebih |tell me more|more|detail|explain)/i.test(message);
  const context = message + (followup ? ' ' + history.slice(-2).map(item => item.content).join(' ') : '');
  const detailed = /\b(sponsor\w*|partnership|benefits?|packages?|paket|manfaat|keuntungan|kerja sama|details?|detailed|explain|elaborate|compare|comparison|lengkap|rinci|jelaskan|jelasin|perbandingan|lebih lanjut)\b/i.test(context);
  return detailed ? { sentences: 8, words: 180, detailed: true } : { sentences: 3, words: 75, detailed: false };
}
export function readableReply(text, language, policy, reserved = 0) {
  let result = conciseReply(text, language, policy.sentences - reserved);
  // Drop complete trailing sentences/sections until the word budget fits.
  let cap = policy.sentences - reserved;
  while (result.split(/\s+/).length > policy.words && cap > 1) result = conciseReply(text, language, --cap);
  if (result.split(/\s+/).length > policy.words) result = result.split(/\s+/).slice(0, policy.words).join(' ') + '…';
  if (policy.detailed && !/^#{1,3}\s/m.test(result) && sentenceParts(result, language).length > 3) {
    const parts = sentenceParts(result, language);
    result = (language === 'id' ? '## ✨ Informasi lebih lanjut' : '## ✨ A closer look') + '\n\n'
      + parts.slice(0, -1).map(part => '- ' + part).join('\n\n')
      + '\n\n' + (language === 'id' ? '## Selanjutnya' : '## Next up') + '\n\n' + parts.at(-1);
  }
  return result;
}
export function finishExchange(current, message, answer, facts) {
  const answeredMessages = (current.answeredMessages ?? current.history.filter(item => item.role === 'user').length) + 1;
  const suggest = answeredMessages >= 5 && !current.contactSuggested;
  const contactRequested = answer.actions?.includes('contact') || /\b(contact|contacts|whatsapp|kontak|hubungi|gavynn|grace)\b/i.test(message);
  const contacts = suggest || contactRequested ? facts.contacts.map(({ name, phone }) => ({
    name, url: 'https://wa.me/' + phone.replace(/\D/g, '')
  })).filter(contact => /^https:\/\/wa\.me\/\d{10,15}$/.test(contact.url)) : [];
  let text = readableReply(answer.answer, answer.language, replyPolicy(message, current.history), suggest && contacts.length ? 1 : 0);
  if (suggest && contacts.length) text += '\n\n' + (answer.language === 'id'
    ? 'Untuk informasi lebih lanjut, hubungi panitia lewat WhatsApp di bawah.'
    : 'For more details, message our committee on WhatsApp below.');
  return {
    patch: {
      language: answer.language, answeredMessages,
      contactSuggested: current.contactSuggested || (suggest && contacts.length > 0),
      history: recentHistory([...current.history, { role: 'user', content: message }, { role: 'assistant', content: text }])
    },
    response: { answer: text, sources: answer.sources, language: answer.language, contacts, actions: (answer.actions || []).filter(action => action !== 'contact') }
  };
}
