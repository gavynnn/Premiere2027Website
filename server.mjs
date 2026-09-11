import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import { pathToFileURL } from 'node:url';
import { ROOT, PRIVATE, manifest, setting } from './server/config.mjs';
import { Guard, filterQuestion } from './server/guard.mjs';
import { openAI, answerRequest, parseAnswer } from './server/openai.mjs';
import { finishExchange } from './server/conversation.mjs';

const publicFiles = new Set(['index.html', 'register.html', 'merch.html', 'closing-night.html', 'styles.css', 'polish.css', 'chat.css', 'script.js', 'content.js', 'locale.js', 'chat.js']);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
export function publicPath(raw) {
  let decoded;
  try { decoded = decodeURIComponent(raw.split('?')[0]); } catch { return null; }
  if (/[\\\0]/.test(decoded) || decoded.split('/').some(part => part.startsWith('.'))) return null;
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\//, '');
  const asset = relative.startsWith('assets/') && Object.keys(mime).filter(ext => !['.html', '.js', '.css'].includes(ext)).includes(path.extname(relative).toLowerCase());
  if (!publicFiles.has(relative) && !asset) return null;
  const filename = path.resolve(ROOT, relative);
  if (!filename.startsWith(ROOT + path.sep) || !fs.existsSync(filename)) return null;
  if (!fs.realpathSync(filename).startsWith(ROOT + path.sep) || !fs.statSync(filename).isFile()) return null;
  return filename;
}
export function clientIP(request) {
  let ip = request.socket.remoteAddress || 'unknown';
  const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip);
  if (process.env.TRUST_LOOPBACK_PROXY === 'true' && local) {
    const candidate = String(request.headers['x-forwarded-for'] || '').split(',').at(-1).trim();
    if (net.isIP(candidate)) ip = candidate;
  }
  return ip.replace(/^::ffff:/, '');
}
export function createApp({ stateDir = PRIVATE, knowledge = manifest(), provider = body => openAI('responses', { body }), clock = Date.now, limits } = {}) {
  fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  const secretPath = path.join(stateDir, 'session-secret');
  if (!fs.existsSync(secretPath)) fs.writeFileSync(secretPath, crypto.randomBytes(32).toString('hex'), { mode: 0o600, flag: 'wx' });
  const secret = fs.readFileSync(secretPath, 'utf8');
  const guard = new Guard({ filename: path.join(stateDir, 'usage.json'), secret, clock, limits: limits || {
    daily: setting('CHAT_DAILY_LIMIT', 3000), ipDaily: setting('CHAT_IP_DAILY_LIMIT', 25),
    ipMinute: setting('CHAT_IP_PER_MINUTE', 5), globalMinute: setting('CHAT_GLOBAL_PER_MINUTE', 12), cooldown: setting('CHAT_COOLDOWN_SECONDS', 8)
  } });
  setting('CHAT_MAX_OUTPUT_TOKENS', 400, 150, 800);
  const origin = process.env.APP_ORIGIN || 'http://127.0.0.1:8000';
  const allowedOrigins = new Set([origin]);
  if (/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) {
    allowedOrigins.add(origin.replace('127.0.0.1', 'localhost'));
    allowedOrigins.add(origin.replace('localhost', '127.0.0.1'));
  }
  const secureCookie = origin.startsWith('https:') ? '; Secure' : '';
  const sessions = new Map();
  const facts = JSON.parse(fs.readFileSync(path.join(ROOT, 'server', 'event-facts.json'), 'utf8'));
  const ready = () => Boolean(process.env.OPENAI_API_KEY?.trim() && knowledge);
  function send(res, status, value, retry) {
    if (retry) res.setHeader('Retry-After', String(retry));
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(value));
  }
  function session(req, res, ip) {
    const now = clock(), ipKey = guard.key(ip);
    for (const [id, value] of sessions) if (now - value.last > 1800000) sessions.delete(id);
    const cookie = /(?:^|;\s*)premiere_chat=([a-f0-9]{32})\.([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '');
    if (cookie) {
      const expected = crypto.createHmac('sha256', secret).update(cookie[1]).digest('hex');
      const saved = sessions.get(cookie[1]);
      if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(cookie[2])) && saved?.ip === ipKey) {
        saved.last = now;
        // Keep an active conversation alive; expiry measures inactivity, not
        // time since the first question in a long conversation.
        res.setHeader('Set-Cookie', 'premiere_chat=' + cookie[1] + '.' + cookie[2] + '; HttpOnly; SameSite=Strict; Path=/api/chat; Max-Age=1800' + secureCookie);
        return saved;
      }
    }
    if (sessions.size >= 1000) return null;
    const id = crypto.randomBytes(16).toString('hex');
    const signature = crypto.createHmac('sha256', secret).update(id).digest('hex');
    const value = { last: now, ip: ipKey, history: [], answeredMessages: 0, contactSuggested: false, language: null };
    sessions.set(id, value);
    res.setHeader('Set-Cookie', 'premiere_chat=' + id + '.' + signature + '; HttpOnly; SameSite=Strict; Path=/api/chat; Max-Age=1800' + secureCookie);
    return value;
  }
  return http.createServer({ maxHeaderSize: 8192, requestTimeout: 15000, headersTimeout: 10000 }, async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'");
    const route = (req.url || '/').split('?')[0];
    try {
      if (route === '/api/chat/status' && req.method === 'GET') {
        return send(res, 200, { ready: ready(), documents: knowledge?.files.map(({ kind, language }) => ({ kind, language })) || [] });
      }
      if (route === '/api/chat' && req.method === 'POST') {
        if (!allowedOrigins.has(req.headers.origin) || req.headers['sec-fetch-site'] === 'cross-site') return send(res, 403, { code: 'origin' });
        const ip = clientIP(req);
        const attempt = guard.attempt(ip);
        if (!attempt.ok) return send(res, 429, { code: attempt.code }, attempt.retry);
        if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) return send(res, 415, { code: 'invalid' });
        if (Number(req.headers['content-length'] || 0) > 2048) { req.resume(); return send(res, 413, { code: 'invalid' }); }
        let bytes = 0, chunks = [];
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 2048) { send(res, 413, { code: 'invalid' }); req.resume(); return; }
          chunks.push(chunk);
        }
        let body;
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return send(res, 400, { code: 'invalid' }); }
        if (!body || Array.isArray(body) || Object.keys(body).some(key => !['message', 'language'].includes(key)) || !['en', 'id'].includes(body.language)) return send(res, 400, { code: 'invalid' });
        const current = session(req, res, ip);
        if (!current) return send(res, 429, { code: 'busy' }, 60);
        const filtered = filterQuestion(body.message, current.history.length > 0);
        if (!filtered.ok) return send(res, 400, { code: filtered.code });
        if (!ready()) return send(res, 503, { code: 'unavailable' });
        const permit = guard.reserve(ip, filtered.message);
        if (!permit.ok) return send(res, 429, { code: permit.code }, permit.retry);
        try {
          const response = await provider(answerRequest({ message: filtered.message, language: current.language || body.language, history: current.history, facts, knowledge }));
          const answer = parseAnswer(response, knowledge, filtered.message);
          if (!answer.inScope) return send(res, 200, { code: 'scope', sources: [] });
          const finished = finishExchange(current, filtered.message, answer, facts);
          Object.assign(current, finished.patch);
          return send(res, 200, finished.response);
        } catch {
          // No upstream response body, key, conversation or raw IP is logged.
          console.warn('Chat provider request failed; quota reservation retained.');
          return send(res, 502, { code: 'upstream' });
        } finally { permit.release(); }
      }
      if (route.startsWith('/api/')) return send(res, 404, { code: 'not_found' });
      if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, { code: 'method' });
      const filename = publicPath(req.url || '/');
      if (!filename) return send(res, 404, { code: 'not_found' });
      const stat = fs.statSync(filename);
      const headers = { 'Content-Type': mime[path.extname(filename).toLowerCase()], 'Accept-Ranges': 'bytes', 'Cache-Control': /\.(html|css|js)$/.test(filename) ? 'no-cache' : 'public, max-age=3600' };
      let start = 0, end = stat.size - 1, status = 200;
      if (req.headers.range) {
        const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (!range || (!range[1] && !range[2])) return send(res, 416, { code: 'range' });
        start = range[1] ? Number(range[1]) : Math.max(0, stat.size - Number(range[2]));
        end = range[1] && range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
        if (!Number.isSafeInteger(start) || start > end || start >= stat.size) return send(res, 416, { code: 'range' });
        status = 206; headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + stat.size;
      }
      headers['Content-Length'] = end - start + 1;
      res.writeHead(status, headers);
      if (req.method === 'HEAD') return res.end();
      const stream = fs.createReadStream(filename, { start, end });
      stream.on('error', () => res.destroy());
      res.on('close', () => stream.destroy());
      stream.pipe(res);
    } catch {
      if (!res.headersSent) send(res, 500, { code: 'unavailable' }); else res.destroy();
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  fs.mkdirSync(PRIVATE, { recursive: true, mode: 0o700 });
  const lock = path.join(PRIVATE, 'server.lock');
  // One process owns the file-based quota ledger. Refuse another active owner.
  if (fs.existsSync(lock)) {
    const pid = Number(fs.readFileSync(lock, 'utf8'));
    let active = true;
    try { process.kill(pid, 0); } catch (error) { if (error.code === 'ESRCH') active = false; }
    if (active) throw new Error('Another Premiere server owns the quota ledger. Stop it before starting another.');
    fs.unlinkSync(lock);
  }
  fs.writeFileSync(lock, String(process.pid), { flag: 'wx' });
  process.on('exit', () => { if (fs.existsSync(lock) && fs.readFileSync(lock, 'utf8') === String(process.pid)) fs.unlinkSync(lock); });
  const server = createApp();
  server.listen(setting('PORT', 8000, 1, 65535), process.env.HOST || '127.0.0.1', () => {
    console.log('The Premiere: http://' + (process.env.HOST || '127.0.0.1') + ':' + (process.env.PORT || 8000));
    console.log(process.env.OPENAI_API_KEY?.trim() && manifest() ? 'AI event help is ready.' : 'AI setup pending: add the key to .env, run npm run sync-docs, then restart.');
  });
  server.on('error', error => { console.error('Server could not start: ' + error.code); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 2000).unref(); });
}
