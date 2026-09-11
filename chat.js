(() => {
  'use strict';
  const copy = {
    en: {
      launch: 'Ask Astra', title: 'Astra', subtitle: 'AI event help', close: 'Close chat',
      greeting: 'Hi! Ask me about The Premiere competitions, sponsorship, the venue, or closing night.',
      disclaimer: 'AI can make mistakes. Confirm important details with the committee.',
      placeholder: 'Ask about The Premiere…', label: 'Your question', send: 'Send', thinking: 'Checking the event documents…',
      unavailable: 'AI help is being prepared. You can still read the proposals on the Home page or contact Gavynn or Grace below.',
      scope: 'I can help with The Premiere event, competitions and sponsorship only. Please ask a short event-related question.',
      invalid: 'Please enter a clear message between 2 and 400 characters. Links and pasted code are not supported.',
      rate: 'Please wait a moment before sending another question.', daily: 'The chat limit has been reached for today. Please contact the committee for more help.',
      duplicate: 'You recently asked this question. Please check the earlier answer or ask something different.',
      busy: 'Astra is helping someone right now. Please try again shortly.', upstream: 'I could not complete that answer. Please try again later or contact the committee.',
      conversation_limit: 'This conversation has reached its size limit. Nothing has been removed. Please contact Gavynn or Grace for further help.',
      origin: 'Please open chat from the event website.', source: 'Sources', sponsor: 'Sponsor proposal', invitation: 'E-invite', you: 'You', assistant: 'Astra',
      chips: ['Which competitions are available?', 'What sponsorship options are there?', 'When is closing night?']
    },
    id: {
      launch: 'Tanya Astra', title: 'Astra', subtitle: 'Bantuan acara AI', close: 'Tutup percakapan',
      greeting: 'Hai! Tanyakan tentang kompetisi The Premiere, sponsorship, lokasi, atau malam penutupan.',
      disclaimer: 'AI bisa keliru. Konfirmasikan informasi penting kepada panitia.',
      placeholder: 'Tanyakan tentang The Premiere…', label: 'Pertanyaanmu', send: 'Kirim', thinking: 'Memeriksa dokumen acara…',
      unavailable: 'Bantuan AI sedang disiapkan. Kamu tetap dapat membaca proposal di Beranda atau menghubungi Gavynn atau Grace di bawah.',
      scope: 'Saya hanya dapat membantu pertanyaan seputar acara, kompetisi, dan sponsorship The Premiere. Silakan ajukan pertanyaan singkat terkait acara.',
      invalid: 'Tulis pesan yang jelas sepanjang 2–400 karakter. Tautan dan potongan kode tidak didukung.',
      rate: 'Tunggu sebentar sebelum mengirim pertanyaan berikutnya.', daily: 'Batas percakapan hari ini telah tercapai. Silakan hubungi panitia untuk bantuan lebih lanjut.',
      duplicate: 'Pertanyaan ini baru saja diajukan. Periksa jawaban sebelumnya atau ajukan pertanyaan berbeda.',
      busy: 'Astra sedang membantu pengunjung lain. Silakan coba sebentar lagi.', upstream: 'Jawaban belum dapat diselesaikan. Coba lagi nanti atau hubungi panitia.',
      conversation_limit: 'Percakapan ini sudah mencapai batas panjangnya. Tidak ada pesan yang dihapus. Hubungi Gavynn atau Grace untuk bantuan selanjutnya.',
      origin: 'Buka percakapan melalui situs acara.', source: 'Sumber', sponsor: 'Proposal sponsor', invitation: 'Undangan digital', you: 'Kamu', assistant: 'Astra',
      chips: ['Kompetisi apa saja yang tersedia?', 'Apa saja pilihan sponsorship?', 'Kapan malam penutupan?']
    }
  };
  copy.en.downloadDocument = 'Download PDF';
  copy.en.viewDocumentOnSite = 'View on website';
  copy.id.downloadDocument = 'Unduh PDF';
  copy.id.viewDocumentOnSite = 'Lihat di situs';
  const language = () => window.PREMIERE_I18N?.language === 'id' ? 'id' : 'en';
  const t = key => copy[language()][key] || copy[language()].upstream;
  const launcher = document.createElement('button');
  launcher.className = 'chat-launcher';
  launcher.type = 'button';
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-controls', 'astra-chat');
  launcher.setAttribute('aria-expanded', 'false');
  launcher.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z"/><path d="m12 6 1.2 3.3L16.5 10l-3.3 1L12 14l-1.2-3L7.5 10l3.3-.7Z"/></svg><span></span>';
  const dialog = document.createElement('dialog');
  dialog.id = 'astra-chat';
  dialog.className = 'chat-panel';
  dialog.setAttribute('aria-labelledby', 'astra-title');
  dialog.setAttribute('aria-modal', 'false');
  dialog.innerHTML = '<header class="chat-heading"><div><strong id="astra-title">Astra</strong><p data-chat-copy="subtitle"></p></div><button type="button" class="chat-close">×</button></header><div class="chat-messages" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation"></div><div class="chat-chips"></div><p class="chat-status" role="status"></p><form class="chat-form"><label for="astra-question" data-chat-copy="label"></label><textarea id="astra-question" rows="2" maxlength="400" required></textarea><div class="chat-form-bottom"><span class="chat-count">0 / 400</span><button type="submit" data-chat-copy="send"></button></div></form><footer class="chat-footer"><p data-chat-copy="disclaimer"></p><a href="tel:+628111042896">Gavynn ↗</a><a href="tel:+628111858228">Grace ↗</a></footer>';
  document.body.append(launcher, dialog);
  const log = dialog.querySelector('.chat-messages');
  const status = dialog.querySelector('.chat-status');
  const input = dialog.querySelector('textarea');
  const form = dialog.querySelector('form');
  const send = form.querySelector('button');
  const chips = dialog.querySelector('.chat-chips');
  const close = dialog.querySelector('.chat-close');
  let available = false, busy = false, hasSentMessage = false, waitingUntil = 0, wakeup, greeting;
  function addMessage(role, text, sources = [], contacts = []) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-message chat-' + role;
    const label = document.createElement('strong');
    label.textContent = t(role === 'user' ? 'you' : 'assistant');
    const content = document.createElement('p');
    content.textContent = text; // Never render model/user text as HTML.
    bubble.append(label, content);
    if (sources.length) {
      const links = document.createElement('div');
      links.className = 'chat-sources';
      for (const source of sources.slice(0, 4)) {
        if (!/^\/assets\/documents\/[a-zA-Z0-9._ -]+\.pdf$/.test(source.url)) continue;
        const card = document.createElement('div');
        card.className = 'chat-source-card';
        const docLanguage = ['en', 'id'].includes(source.language) ? source.language : language();
        const config = window.PREMIERE_DOCUMENTS?.[source.kind];
        const settings = config?.[docLanguage] || config;
        const pdfURL = new URL(source.url, location.origin);
        const link = document.createElement('a');
        link.href = pdfURL.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.textContent = t(source.kind === 'sponsorship' ? 'sponsor' : 'invitation') + (source.language === 'shared' ? '' : ' · ' + source.language.toUpperCase()) + ' ↗';
        const actions = document.createElement('div');
        actions.className = 'chat-source-actions';
        const download = document.createElement('a');
        download.href = pdfURL.href;
        download.download = settings?.filename || source.url.split('/').at(-1);
        download.textContent = t('downloadDocument');
        actions.append(download);
        // Some embedded/mobile browsers cannot open a PDF in a new tab. The
        // website alternative is ordinary same-tab navigation and keeps Astra.
        if (source.kind === 'sponsorship' || source.kind === 'invitation') {
          const website = document.createElement('a');
          website.href = '/index.html?lang=' + docLanguage + '#' + (source.kind === 'sponsorship' ? 'sponsorship' : 'invitation');
          website.textContent = t('viewDocumentOnSite');
          actions.append(website);
        }
        card.append(link, actions);
        links.append(card);
      }
      bubble.append(links);
    }
    if (contacts.length) {
      const links = document.createElement('div');
      links.className = 'chat-contacts';
      for (const contact of contacts.slice(0, 2)) {
        if (!['https://wa.me/628111042896', 'https://wa.me/628111858228'].includes(contact.url)) continue;
        const link = document.createElement('a');
        link.href = contact.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.textContent = 'WhatsApp ' + contact.name + ' ↗';
        links.append(link);
      }
      bubble.append(links);
    }
    log.append(bubble);
    // Keep all visible messages for this conversation, including earlier answers.
    log.scrollTop = log.scrollHeight;
    return content;
  }
  function controls() {
    const disabled = busy || !available || Date.now() < waitingUntil;
    send.disabled = disabled;
    chips.hidden = hasSentMessage;
    chips.querySelectorAll('button').forEach(button => { button.disabled = disabled; });
  }
  function translate() {
    launcher.querySelector('span').textContent = t('launch');
    launcher.setAttribute('aria-label', t('launch'));
    dialog.querySelectorAll('[data-chat-copy]').forEach(element => { element.textContent = t(element.dataset.chatCopy); });
    close.setAttribute('aria-label', t('close'));
    input.placeholder = t('placeholder');
    log.setAttribute('aria-label', language() === 'id' ? 'Percakapan' : 'Conversation');
    chips.replaceChildren();
    copy[language()].chips.forEach(question => {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = question;
      button.addEventListener('click', () => { input.value = question; form.requestSubmit(); });
      chips.append(button);
    });
    if (greeting?.isConnected) greeting.textContent = t('greeting');
    status.textContent = busy ? t('thinking') : available ? '' : t('unavailable');
    controls();
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let closingTimer;
  function closeChat() {
    if (!dialog.open || dialog.classList.contains('chat-closing')) return;
    if (reducedMotion.matches) { dialog.close(); return; }
    dialog.classList.add('chat-closing');
    closingTimer = setTimeout(() => {
      dialog.close();
      dialog.classList.remove('chat-closing');
    }, 180);
  }
  launcher.addEventListener('click', async () => {
    if (dialog.classList.contains('chat-closing')) {
      clearTimeout(closingTimer); dialog.classList.remove('chat-closing'); return;
    }
    if (dialog.open) { closeChat(); return; }
    // A non-modal dialog leaves links, language controls and the page interactive.
    dialog.show(); launcher.setAttribute('aria-expanded', 'true');
    if (window.matchMedia('(pointer: fine)').matches) input.focus(); else close.focus();
    if (!log.children.length) greeting = addMessage('assistant', t('greeting'));
    try {
      const response = await fetch('/api/chat/status', { credentials: 'same-origin', signal: AbortSignal.timeout(5000) });
      available = response.ok && (await response.json()).ready === true;
    } catch { available = false; }
    status.textContent = busy ? t('thinking') : available ? '' : t('unavailable');
    controls();
  });
  close.addEventListener('click', closeChat);
  dialog.addEventListener('close', () => {
    if (!dialog.open) { launcher.setAttribute('aria-expanded', 'false'); launcher.focus(); }
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !event.isComposing) {
      event.preventDefault(); event.stopPropagation(); closeChat();
    }
  });
  input.addEventListener('input', () => { dialog.querySelector('.chat-count').textContent = input.value.length + ' / 400'; });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const message = input.value.trim();
    if (busy || !available || Date.now() < waitingUntil || message.length < 2) return;
    hasSentMessage = true;
    addMessage('user', message);
    input.value = ''; dialog.querySelector('.chat-count').textContent = '0 / 400';
    if (window.matchMedia('(pointer: fine)').matches) input.focus();
    busy = true; controls(); status.textContent = t('thinking');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language: language() }), signal: AbortSignal.timeout(55000)
      });
      const result = await response.json();
      addMessage('assistant', typeof result.answer === 'string' ? result.answer : t(result.code), Array.isArray(result.sources) ? result.sources : [], Array.isArray(result.contacts) ? result.contacts : []);
      if (response.status === 429 && !['duplicate', 'daily', 'conversation_limit'].includes(result.code)) {
        waitingUntil = Date.now() + Math.min(60, Number(response.headers.get('Retry-After')) || 8) * 1000;
        clearTimeout(wakeup); wakeup = setTimeout(controls, waitingUntil - Date.now() + 50);
      }
    } catch { addMessage('assistant', t('upstream')); }
    finally {
      busy = false; status.textContent = ''; controls();
      // An arriving answer must not steal focus from someone using the page.
      if (dialog.open && dialog.contains(document.activeElement) && window.matchMedia('(pointer: fine)').matches) input.focus();
    }
  });
  window.addEventListener('premiere:languagechange', translate);
  translate();
})();
