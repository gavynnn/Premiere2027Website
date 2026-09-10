/* Site copy only: the supplied PDFs remain unchanged. */
(() => {
  'use strict';
  const messages = {
  "en": {
    "nav.home": "Home",
    "nav.register": "Register",
    "nav.merch": "Merch",
    "nav.tickets": "Closing Night Tickets",
    "nav.menu": "Menu",
    "nav.skip": "Skip to content",
    "nav.label": "Main navigation",
    "nav.brand": "The Premiere home",
    "language.label": "Language",
    "language.announcement": "Language changed to English.",
    "footer.inquiries": "General Inquiries",
    "footer.instagram": "Follow @thepremierebypskg on Instagram (opens in a new tab)",
    "home.description": "The Premiere 2027: Astra Aeterna — a school cup by PENABUR Intercultural School Kelapa Gading.",
    "home.subtitle": "A constellation of sport, art, and sound — brought to life by the brightest students in the city.",
    "home.explore": "Explore the universe <span>↓</span>",
    "home.register": "Register for a competition <span>↗</span>",
    "home.scroll": "<span></span> Scroll down",
    "journey.eyebrow": "01 / Orbit through the years",
    "journey.title": "Every edition leaves<br />a trail of <em>light.</em>",
    "journey.intro": "Follow the falling star. Each turn opens a memory from The Premiere's orbit.",
    "photo.preopening": "DROP IN YOUR<br />PRE-OPENING PHOTO",
    "photo.competition": "DROP IN YOUR<br />COMPETITION PHOTO",
    "photo.opening": "DROP IN YOUR<br />OPENING CEREMONY PHOTO",
    "photo.closing": "DROP IN YOUR<br />CLOSING NIGHT PHOTO",
    "event.preopening": "Pre-opening matches",
    "preopening.title": "The first<br />sparks fly.",
    "preopening.copy": "Before the grand opening, the courts already come alive. Every opening match becomes a signal that the week has begun.",
    "competition.label": "Twelve constellations",
    "competition.title": "Play beyond<br />the ordinary.",
    "competition.copy": "From courts to stages and pools to podiums, discover the disciplines that make up The Premiere universe.",
    "competition.all": "See all competitions <span>↗</span>",
    "event.opening": "Opening ceremony",
    "opening.title": "One sky.<br />One beginning.",
    "opening.copy": "On 12 February, every team gathers under a single sky for an opening ceremony made for the moment.",
    "event.closing": "Closing night",
    "closing.title": "One last<br /><em>supernova.</em>",
    "closing.copy": "When the games are done, the night takes over. A huge artist, thousands of voices, and a finale worth remembering.",
    "timeline.eyebrow": "02 / Mark your orbit",
    "timeline.title": "Ten days. One<br /><em>eternal story.</em>",
    "timeline.copy": "Save the dates. The full schedule will land here closer to the event.",
    "timeline.preopening": "The galaxy wakes up",
    "timeline.opening": "Light the first star",
    "event.week": "Premiere week",
    "timeline.week": "Sport · art · performance",
    "timeline.closing": "End on a high note",
    "cta.eyebrow": "03 / Your turn to shine",
    "cta.title": "Ready to join<br />the <em>constellation?</em>",
    "cta.copy": "Pick your arena, rally your crew, and write your own chapter in The Premiere 2027.",
    "cta.register": "Register now <span>↗</span>",
    "sponsorship.eyebrow": "Be part of the constellation",
    "sponsorship.title": "Looking to <em>sponsor?</em>",
    "sponsorship.name": "Sponsor proposal",
    "sponsorship.pending": "The sponsor proposal will be available here soon.",
    "sponsors.eyebrow": "In good company",
    "sponsors.title": "Previous sponsors",
    "sponsors.placeholder": "YOUR SPONSOR<br />LOGOS HERE",
    "sponsors.note": "Replace this block with sponsor logo images when ready.",
    "sponsors.label": "Placeholder for previous sponsor logos",
    "register.pageTitle": "Register — The Premiere 2027",
    "register.description": "Register for The Premiere 2027: Astra Aeterna competitions.",
    "register.eyebrow": "The Premiere 2027 / Registration",
    "register.title": "Choose your<br /><em>orbit.</em>",
    "register.copy": "Tap an arena to begin. Registration links will open in a new tab.",
    "register.gridLabel": "Competition registration",
    "invitation.name": "E-invite",
    "invitation.pending": "The e-invite will be available here soon.",
    "document.coming": "Coming soon",
    "document.open": "Open PDF ↗",
    "document.download": "Download PDF <span aria-hidden=\"true\">↓</span>",
    "document.downloadPending": "Download PDF · Coming soon",
    "document.ready": "Preview the document, open in a new tab, or download a copy.",
    "document.previewTitle": "{name} — English PDF preview",
    "form.soon": "{name} registration is coming soon.",
    "arena.enter": "Enter arena <b>↗</b>",
    "arena.futsal": "Futsal",
    "arena.basketball": "Basketball",
    "arena.volleyball": "Volleyball",
    "arena.badminton": "Badminton",
    "arena.mural": "Mural",
    "arena.vocal": "Vocal",
    "arena.band": "Band",
    "arena.dance": "Modern<br />Dance",
    "arena.cubing": "Speedcubing",
    "arena.swimming": "Swimming",
    "arena.debate": "English<br />Debate",
    "arena.speech": "English<br />Speech",
    "merch.pageTitle": "Merch — The Premiere 2027",
    "merch.description": "The Premiere 2027: Astra Aeterna merchandise.",
    "merch.eyebrow": "The Premiere 2027 / Objects in orbit",
    "merch.title": "The collection<br />is <em>approaching.</em>",
    "merch.copy": "Official Astra Aeterna merchandise will arrive here soon. Keep your eyes on the sky.",
    "merch.placeholder": "MERCH DROPS<br />COMING SOON",
    "merch.back": "Back to home <span>←</span>",
    "tickets.pageTitle": "Closing Night Tickets — The Premiere 2027",
    "tickets.description": "Closing Night tickets for The Premiere 2027: Astra Aeterna. Coming soon.",
    "tickets.eyebrow": "The Premiere 2027 / The final constellation",
    "tickets.title": "Closing Night<br /><em>Tickets.</em>",
    "tickets.lede": "One last supernova.",
    "tickets.copy": "Ticket details will be announced here.",
    "tickets.back": "Back to the event <span aria-hidden=\"true\">↗</span>",
    "tickets.label": "Closing Night ticket availability",
    "tickets.date": "20 February 2027",
    "tickets.coming": "Coming<br /><em>soon.</em>"
  },
  "id": {
    "nav.home": "Beranda",
    "nav.register": "Daftar",
    "nav.merch": "Merch",
    "nav.tickets": "Tiket Malam Penutupan",
    "nav.menu": "Menu",
    "nav.skip": "Langsung ke konten",
    "nav.label": "Navigasi utama",
    "nav.brand": "Beranda The Premiere",
    "language.label": "Bahasa",
    "language.announcement": "Bahasa diubah ke Bahasa Indonesia.",
    "footer.inquiries": "Informasi Umum",
    "footer.instagram": "Ikuti @thepremierebypskg di Instagram (dibuka di tab baru)",
    "home.description": "The Premiere 2027: Astra Aeterna — ajang kompetisi antarsekolah oleh PENABUR Intercultural School Kelapa Gading.",
    "home.subtitle": "Rasi olahraga, seni, dan musik — dihidupkan oleh pelajar-pelajar berbakat di kota ini.",
    "home.explore": "Jelajahi semesta <span>↓</span>",
    "home.register": "Daftar kompetisi <span>↗</span>",
    "home.scroll": "<span></span> Gulir ke bawah",
    "journey.eyebrow": "01 / Orbit lintas tahun",
    "journey.title": "Setiap edisi meninggalkan<br />jejak <em>cahaya.</em>",
    "journey.intro": "Ikuti bintang jatuh. Setiap belokan membuka kenangan dari perjalanan The Premiere.",
    "photo.preopening": "FOTO PERTANDINGAN<br />PRA-PEMBUKAAN DI SINI",
    "photo.competition": "FOTO KOMPETISI<br />DI SINI",
    "photo.opening": "FOTO UPACARA<br />PEMBUKAAN DI SINI",
    "photo.closing": "FOTO MALAM<br />PENUTUPAN DI SINI",
    "event.preopening": "Pertandingan pra-pembukaan",
    "preopening.title": "Percikan pertama<br />mulai menyala.",
    "preopening.copy": "Sebelum pembukaan resmi, lapangan sudah dipenuhi semangat. Setiap pertandingan awal menandai dimulainya pekan yang dinanti.",
    "competition.label": "Dua belas rasi",
    "competition.title": "Bermain melampaui<br />batas biasa.",
    "competition.copy": "Dari lapangan hingga panggung, dari kolam hingga podium, temukan berbagai cabang kompetisi yang membentuk semesta The Premiere.",
    "competition.all": "Lihat semua kompetisi <span>↗</span>",
    "event.opening": "Upacara pembukaan",
    "opening.title": "Satu langit.<br />Satu awal.",
    "opening.copy": "Pada 12 Februari, setiap tim berkumpul di bawah satu langit untuk upacara pembukaan yang istimewa.",
    "event.closing": "Malam penutupan",
    "closing.title": "Satu <em>supernova</em><br />terakhir.",
    "closing.copy": "Saat pertandingan usai, malam mengambil alih. Artis ternama, ribuan suara, dan sebuah penutup yang tak terlupakan.",
    "timeline.eyebrow": "02 / Tandai orbitmu",
    "timeline.title": "Sepuluh hari. Satu<br /><em>kisah abadi.</em>",
    "timeline.copy": "Catat tanggalnya. Jadwal lengkap akan hadir di sini menjelang acara.",
    "timeline.preopening": "Galaksi mulai terbangun",
    "timeline.opening": "Nyalakan bintang pertama",
    "event.week": "Pekan Premiere",
    "timeline.week": "Olahraga · seni · pertunjukan",
    "timeline.closing": "Akhiri dengan gemilang",
    "cta.eyebrow": "03 / Saatnya kamu bersinar",
    "cta.title": "Siap bergabung<br />dalam <em>rasi ini?</em>",
    "cta.copy": "Pilih arenamu, kumpulkan timmu, dan tulis kisahmu sendiri di The Premiere 2027.",
    "cta.register": "Daftar sekarang <span>↗</span>",
    "sponsorship.eyebrow": "Jadilah bagian dari rasi ini",
    "sponsorship.title": "Ingin menjadi <em>sponsor?</em>",
    "sponsorship.name": "Proposal sponsor",
    "sponsorship.pending": "Proposal sponsor akan segera tersedia di sini.",
    "sponsors.eyebrow": "Bersama para pendukung",
    "sponsors.title": "Sponsor sebelumnya",
    "sponsors.placeholder": "LOGO SPONSOR<br />DI SINI",
    "sponsors.note": "Ganti bagian ini dengan logo sponsor saat sudah siap.",
    "sponsors.label": "Tempat untuk logo sponsor sebelumnya",
    "register.pageTitle": "Pendaftaran — The Premiere 2027",
    "register.description": "Daftarkan dirimu untuk mengikuti kompetisi The Premiere 2027: Astra Aeterna.",
    "register.eyebrow": "The Premiere 2027 / Pendaftaran",
    "register.title": "Pilih<br /><em>orbitmu.</em>",
    "register.copy": "Pilih arena untuk memulai. Tautan pendaftaran akan dibuka di tab baru.",
    "register.gridLabel": "Pendaftaran kompetisi",
    "invitation.name": "Undangan digital",
    "invitation.pending": "Undangan digital akan segera tersedia di sini.",
    "document.coming": "Segera hadir",
    "document.open": "Buka PDF ↗",
    "document.download": "Unduh PDF <span aria-hidden=\"true\">↓</span>",
    "document.downloadPending": "Unduh PDF · Segera hadir",
    "document.ready": "Lihat dokumen, buka di tab baru, atau unduh salinannya.",
    "document.previewTitle": "{name} — Pratinjau PDF Bahasa Indonesia",
    "form.soon": "Pendaftaran {name} akan segera dibuka.",
    "arena.enter": "Masuk arena <b>↗</b>",
    "arena.futsal": "Futsal",
    "arena.basketball": "Bola Basket",
    "arena.volleyball": "Bola Voli",
    "arena.badminton": "Bulu Tangkis",
    "arena.mural": "Mural",
    "arena.vocal": "Vokal",
    "arena.band": "Band",
    "arena.dance": "Tari<br />Modern",
    "arena.cubing": "Speedcubing",
    "arena.swimming": "Renang",
    "arena.debate": "Debat<br />Bahasa Inggris",
    "arena.speech": "Pidato<br />Bahasa Inggris",
    "merch.pageTitle": "Merch — The Premiere 2027",
    "merch.description": "Merchandise resmi The Premiere 2027: Astra Aeterna.",
    "merch.eyebrow": "The Premiere 2027 / Koleksi dalam orbit",
    "merch.title": "Koleksi ini<br />segera <em>hadir.</em>",
    "merch.copy": "Merchandise resmi Astra Aeterna akan segera hadir di sini. Terus nantikan kabarnya.",
    "merch.placeholder": "KOLEKSI MERCH<br />SEGERA HADIR",
    "merch.back": "Kembali ke beranda <span>←</span>",
    "tickets.pageTitle": "Tiket Malam Penutupan — The Premiere 2027",
    "tickets.description": "Tiket malam penutupan The Premiere 2027: Astra Aeterna. Segera hadir.",
    "tickets.eyebrow": "The Premiere 2027 / Rasi terakhir",
    "tickets.title": "Tiket Malam<br /><em>Penutupan.</em>",
    "tickets.lede": "Satu supernova terakhir.",
    "tickets.copy": "Informasi tiket akan diumumkan di sini.",
    "tickets.back": "Kembali ke acara <span aria-hidden=\"true\">↗</span>",
    "tickets.label": "Ketersediaan tiket malam penutupan",
    "tickets.date": "20 Februari 2027",
    "tickets.coming": "Segera<br /><em>hadir.</em>"
  }
};
  const storageKey = 'premiere-language';
  const supported = value => value === 'en' || value === 'id';
  let language = 'en';
  function translate(key, replacements = {}) {
    const template = messages[language][key] ?? messages.en[key] ?? key;
    return template.replace(/\{(\w+)\}/g, (match, name) => replacements[name] ?? match);
  }
  const status = document.createElement('div');
  status.className = 'language-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  document.body.append(status);

  function setLanguage(next, { announce = true } = {}) {
    if (!supported(next)) return;
    language = next;
    document.documentElement.lang = language;
    // Only these locally authored dictionary strings are inserted as HTML.
    document.querySelectorAll('[data-i18n]').forEach(element => {
      element.innerHTML = translate(element.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
      element.setAttribute('aria-label', translate(element.dataset.i18nAria));
    });
    document.querySelectorAll('[data-i18n-content]').forEach(element => {
      element.setAttribute('content', translate(element.dataset.i18nContent));
    });
    document.querySelectorAll('[data-language]').forEach(button => {
      button.disabled = false;
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    try { localStorage.setItem(storageKey, language); } catch { /* Links also carry the choice. */ }
    // Preserve the preference across pages even when browser storage is blocked.
    document.querySelectorAll('a[href]').forEach(link => {
      const raw = link.getAttribute('href');
      if (!raw || raw.startsWith('#') || link.hasAttribute('download')) return;
      const url = new URL(raw, location.href);
      if (url.origin !== location.origin || !url.pathname.endsWith('.html')) return;
      url.searchParams.set('lang', language);
      link.href = url.href;
    });
    if (announce) {
      const url = new URL(location.href);
      url.searchParams.set('lang', language);
      try { history.replaceState(history.state, '', url.href); } catch { /* file:// fallback */ }
      status.textContent = translate('language.announcement');
    }
    window.dispatchEvent(new CustomEvent('premiere:languagechange', { detail: { language } }));
  }

  window.PREMIERE_I18N = {
    get language() { return language; },
    t: translate,
    setLanguage
  };
  document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.dataset.language !== language) setLanguage(button.dataset.language);
    });
  });
  let saved = 'en';
  try { saved = localStorage.getItem(storageKey); } catch { /* English is the default. */ }
  const requested = new URLSearchParams(location.search).get('lang');
  setLanguage(supported(requested) ? requested : supported(saved) ? saved : 'en', { announce: false });
})();
