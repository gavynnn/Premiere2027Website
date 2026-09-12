// Models choose intents, never destinations. Keep all actionable links on a
// small reviewed allowlist and display them separately from answer prose.
export const actionNames = ['register', 'sponsorship', 'closing', 'contact'];
export function qualifyDocumentClaims(text, language) {
  // Historical chart values are not a promise of future commercial results.
  // A sampled model answer made this leap despite the prompt; enforce it here.
  const segments = [...new Intl.Segmenter(language, { granularity: 'sentence' }).segment(text)];
  text = segments.map(({ segment }) => {
    if (/\b(guarantee\w*|jaminan|dijamin)\b/i.test(segment) && /\b(exposure|reach|roi|returns?|jangkauan|hasil)\b/i.test(segment) && !/\b(not|no|never|bukan|tidak|tanpa)\b/i.test(segment)) {
      return language === 'id' ? 'Angka tersebut adalah perkiraan hadirin sebelumnya, bukan jaminan hasil untuk 2027.\n\n' : 'Those are historical audience estimates, not guaranteed results for 2027.\n\n';
    }
    if (!/\b(not|bukan)\b[^.!?]*\b(confirm\w*|verif\w*|pendaftaran|terkonfirmasi)\b/i.test(segment)) {
      return segment.replace(/\b200\s+(schools|sekolah)\b/gi, match => match + (language === 'id'
        ? ' (angka dalam proposal, bukan pendaftaran 2027 terkonfirmasi)'
        : ' (described in the proposal, not verified 2027 registrations)'));
    }
    return segment;
  }).join('');
  return text;
}
export function cleanAnswer(text) {
  return text
    .replace(/\uE200[^\uE201]*(?:\uE201|$)/g, '')
    .replace(/【[^】]*(?:†|filecite)[^】]*】/g, '')
    .replace(/\[(?:\d+:\d+†[^\]]*|\^\d+)\]/g, '')
    .replace(/^\s*\[[^\]]+\]:\s*\S+.*$/gm, '')
    .replace(/!?\[([^\]]*)\]\([^\n]*?\)/g, '$1')
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
    .replace(/(?:https?:\/\/|sandbox:\/|www\.)[^\s<>]+/gi, '')
    .replace(/(?:\/?assets\/documents\/|file-)[\w.\/-]+/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\uE200-\uE20F\uFFFD]/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/[ \t]+([,.;!?])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n').trim();
}
export function answerLinks(parsed, content, knowledge, message, visualFile) {
  if (!parsed.in_scope) return { sources: [], actions: [] };
  const actions = new Set((Array.isArray(parsed.actions) ? parsed.actions : []).filter(action => actionNames.includes(action)));
  const socialClosure = /^(?:no thanks|thank you|thanks|makasih|terima kasih|not interested|tidak tertarik|en|id)[.!\s]*$/i.test(message);
  if (socialClosure) return { sources: [], actions: [] };
  const context = message + ' ' + parsed.answer;
  if (/\b(register|registration|sign up|daftar|pendaftaran|join.*competitions?)\b/i.test(context)) actions.add('register');
  if (/\b(sponsor\w*|proposal|brosur|brochure)\b/i.test(context)) actions.add('sponsorship');
  // Social reactions are in-scope and can get a light, useful invitation.
  if (/\b(cool|fun|awesome|keren|seru)\b/i.test(message) && !actions.size) { actions.add('register'); actions.add('sponsorship'); }
  const cited = new Set(content.flatMap(item => item.annotations || []).filter(item => item.type === 'file_citation').map(item => item.file_id));
  const sources = knowledge.files.filter(file => cited.has(file.fileId));
  const editions = /\b(both|keduanya|dua bahasa)\b/i.test(message) ? ['en', 'id']
    : [/\b(english|inggris)\b/i.test(message) ? 'en' : /\b(indonesian|indonesia)\b/i.test(message) ? 'id' : parsed.language];
  const kinds = [];
  if (actions.has('sponsorship') || visualFile) kinds.push('sponsorship');
  if (/\b(e-invite|invitation|undangan)\b/i.test(context)) kinds.push('invitation');
  for (const kind of kinds) for (const edition of editions) {
    const file = knowledge.files.find(file => file.kind === kind && file.language === edition)
      || knowledge.files.find(file => file.kind === kind && file.language === 'shared');
    if (file) sources.push(file);
  }
  const unique = [...new Map(sources.map(file => [file.url, file])).values()]
    .filter(file => /^\/assets\/documents\/[a-zA-Z0-9._ -]+\.pdf$/.test(file.url))
    .map(({ kind, language, url }) => ({ kind, language, url }));
  return { sources: unique, actions: [...actions].slice(0, 3) };
}
