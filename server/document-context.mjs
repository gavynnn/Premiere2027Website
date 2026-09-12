// Visually reviewed against the September 2026 sponsor PDFs. Page numbers are
// physical PDF pages (the printed page number is one lower). Never apply these
// notes to a replaced PDF: the file hash must still match.
const reviewedHashes = new Set([
  '7939939d87aacd9a18a8a63f35971db7303a679eb50db98d6f8641d026ad2cec',
  '441f4975f33df4c637d7bed02515fbe2f7d66e3219645dca1823d8615f5f4831'
]);
export function reviewedDocumentContext(knowledge) {
  if (!knowledge.files.some(file => reviewedHashes.has(file.hash))) return null;
  return {
    source: 'Sponsor proposal, visually reviewed 2026-09-12; not new organizer confirmations.',
    previousGuests: { page: 22, names: ['Tulus', 'Isyana Sarasvati', 'HIVI!', 'RAN', 'Jebung', 'WAH!', 'Andra and the Backbone', 'Jaz', 'Bernadya', 'Yura', "Maliq & D’Essentials", 'Rizky Febian'], note: 'Names transcribed from logos under Previous Guest Stars. No performance years are given; these are NOT the confirmed 2027 lineup.' },
    targetGuests: { page: 14, names: ['RAN', 'King Nassar'], note: 'TARGET guests only, not confirmed bookings.' },
    reach: { page: 3, schools: 'The proposal describes approximately 200 participating schools. Attribute this to the proposal, not to verified 2027 registrations.', chartPage: 11, audience: 'The 2024-2026 chart shows roughly 2,100 / 3,000 / 2,600 Premiere Week audience, respectively, and roughly 800 / 1,000 / 550 Closing Night audience. These are approximate readings of unlabeled bars. Say historical audience, not competitors, unique people, guaranteed reach or 2027 attendance. Do not add the two series because visitors may overlap.' },
    sponsorship: { pages: [15, 16], tiersIDR: { Universe: 75000000, Galaxy: 55000000, Star: 40000000, Comet: 25000000, Moon: 10000000, Meteor: 5000000, Eclipse: 2500000 }, benefits: 'Depending on tier: logos on committee shirts, participant ID cards, opening/closing media, posters, social media and banners; website placement; ad-libs; video; booths; complimentary closing-night tickets. Not every tier includes every benefit.', freeTicketsByTier: { Universe: 5, Galaxy: 4, Star: 3, Comet: 2, Moon: 1, Meteor: 1, Eclipse: 1 }, adlibs: 'Competition ad-libs: Universe, Galaxy, Star. Opening/closing ad-libs: Universe through Moon.', quotas: 'Printed quotas are not live remaining availability. Ask the current committee to confirm slots and final agreements.' },
    visualPlacements: { pages: [20, 21], note: 'Mockups show logo areas on a committee shirt, booklet/handbook, website, badminton sponsor board, ID card, ticket and main banner. Photo examples show stage screens, shirts, ID cards and standing/hanging banners. Sizes are relative examples, not exact measurements or promises for every tier.' },
    previousPartners: { page: 23, examples: ['BMW', 'BCA', 'Astra', 'Hydro Coco', 'Teh Pucuk Harum', 'Le Minerale', 'Nipis Madu', 'First Media', 'Cort', 'Kalbe', 'iForte', 'Panfic', 'VND', 'Eka Hospital'], note: 'Examples from historical sponsor/media logos, not a confirmed 2027 sponsor list.' },
    previousBazaar: { page: 24, examples: ['Dcrepes', 'Shihlin', 'Hop Hop', 'Yoshinoya', "McDonald’s", 'Jolly Time'], note: 'Examples from previous bazaar logos, not confirmed 2027 tenants.' }
  };
}

export function visualDocument(message, language, knowledge) {
  // One PDF, on visual questions only. Ordinary replies use text retrieval and
  // the reviewed notes, avoiding the cost of resending 26 pages on every turn.
  if (!/\b(images?|pictures?|photos?|charts?|graphs?|infographic\w*|visual\w*|logos?|layout|placements?|guest stars?|artists?|artis\w*|bintang tamu|gambar|foto|grafik|diagram|penempatan)\b/i.test(message)) return null;
  const edition = /\b(indonesian|indonesia)\b/i.test(message) ? 'id' : /\b(english|inggris)\b/i.test(message) ? 'en' : language;
  return knowledge.files.find(file => file.kind === 'sponsorship' && file.language === edition)
    || knowledge.files.find(file => file.kind === 'sponsorship');
}
