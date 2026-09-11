// One shared conversation policy for the local server and Cloudflare Worker.
export const MEMORY_EXCHANGES = 5;
export function recentHistory(history = []) { return history.slice(-MEMORY_EXCHANGES * 2); }

export function sentenceParts(text, language = 'en') {
  return [...new Intl.Segmenter(language, { granularity: 'sentence' }).segment(text.trim())].map(item => item.segment.trim()).filter(Boolean);
}
export function conciseReply(text, language = 'en', maxSentences = 5) {
  return sentenceParts(text.replace(/\u2014/g, ','), language).slice(0, maxSentences).join(' ');
}
export function finishExchange(current, message, answer, facts) {
  const answeredMessages = (current.answeredMessages ?? current.history.filter(item => item.role === 'user').length) + 1;
  const suggest = answeredMessages >= 5 && !current.contactSuggested;
  const contacts = suggest ? facts.contacts.map(({ name, phone }) => ({
    name, url: 'https://wa.me/' + phone.replace(/\D/g, '')
  })).filter(contact => /^https:\/\/wa\.me\/\d{10,15}$/.test(contact.url)) : [];
  let text = conciseReply(answer.answer, answer.language, contacts.length ? 4 : 5);
  if (contacts.length) text += '\n\n' + (answer.language === 'id'
    ? 'Untuk informasi lebih lanjut, hubungi panitia lewat WhatsApp di bawah.'
    : 'For more details, message our committee on WhatsApp below.');
  return {
    patch: {
      language: answer.language, answeredMessages,
      contactSuggested: current.contactSuggested || contacts.length > 0,
      history: recentHistory([...current.history, { role: 'user', content: message }, { role: 'assistant', content: text }])
    },
    response: { answer: text, sources: answer.sources, language: answer.language, contacts }
  };
}
