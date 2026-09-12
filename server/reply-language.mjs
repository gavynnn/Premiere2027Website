// The site setting is a fallback, not an instruction to ignore the visitor's
// language. Give the model an explicit target for clear EN/ID messages.
export function replyLanguage(message, fallback = 'en') {
  const text = message.toLowerCase().trim();
  if (/^(id|bahasa|indonesia|indonesian|bahasa indonesia)(?: please)?[.!?]*$/.test(text) || /\b(use|speak|reply in|answer in|pakai|pake|gunakan|jawab|bahasa)\s+(?:bahasa\s+)?(?:indonesia|indonesian|id)\b/.test(text)) return 'id';
  if (/^(en|english|inggris)(?: please)?[.!?]*$/.test(text) || /\b(use|speak|reply in|answer in|pakai|pake|gunakan|jawab|bahasa)\s+(?:bahasa\s+)?(?:english|inggris|en)\b/.test(text)) return 'en';
  const id = text.match(/\b(aku|saya|kamu|kalian|kami|kita|ini|itu|apa|apaan|siapa|berapa|kapan|kenapa|gimana|bagaimana|dimana|mana|ada|bisa|mau|ingin|minta|tolong|jelaskan|jelasin|manfaat|keuntungan|secara|rinci|lengkap|sekolahku|tadi|biayanya|pendaftaran|acara|panitia|grafik|gambar|bintang|seru|keren|terima|makasih|pakai|pake|yang|dari|untuk|dan|di|nggak|gak)\b/g)?.length || 0;
  const en = text.match(/\b(i|my|you|your|we|our|this|that|what|whats|who|how|when|where|why|does|is|are|can|could|would|please|explain|benefits|details|about|show|shown|previous|the|and|for|with|at|from)\b/g)?.length || 0;
  return id > en ? 'id' : en > id ? 'en' : fallback === 'id' ? 'id' : 'en';
}
