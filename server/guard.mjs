import fs from 'node:fs';
import crypto from 'node:crypto';
import { saveJSON } from './config.mjs';
// filterQuestion lives in ./filter.mjs (kept dependency-free so
// src/worker.mjs can import it without pulling in config.mjs's
// module-load-time fs/URL code, which fails under Workers).
export { filterQuestion } from './filter.mjs';
export class Guard {
  constructor({ filename, secret, limits, clock = Date.now }) {
    this.filename = filename; this.secret = secret; this.limits = limits; this.clock = clock;
    this.visitors = new Map(); this.active = new Set(); this.globalWindow = [];
    this.ledger = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf8')) : { day: '', calls: 0, ips: {} };
    if (!Number.isInteger(this.ledger.calls) || !this.ledger.ips) throw new Error('Invalid usage ledger; refusing to reset quota silently.');
  }
  key(ip) { return crypto.createHmac('sha256', this.secret).update(ip).digest('hex'); }
  attempt(ip) {
    const now = this.clock(), key = this.key(ip);
    for (const [old, value] of this.visitors) if (now - value.seen > 3600000 && !this.active.has(old)) this.visitors.delete(old);
    if (!this.visitors.has(key) && this.visitors.size >= 5000) return { ok: false, code: 'busy', retry: 60 };
    const visitor = this.visitors.get(key) || { attempts: [], calls: [], seen: now, last: 0, repeats: new Map() };
    visitor.seen = now; visitor.attempts = visitor.attempts.filter(t => now - t < 60000);
    this.visitors.set(key, visitor);
    if (visitor.attempts.length >= 20) return { ok: false, code: 'rate', retry: 60 };
    visitor.attempts.push(now);
    return { ok: true, key, visitor };
  }
  reserve(ip, question) {
    const now = this.clock(), key = this.key(ip), visitor = this.visitors.get(key);
    if (!visitor) throw new Error('Attempt must be checked before reserving.');
    const day = new Date(now).toISOString().slice(0, 10);
    if (day !== this.ledger.day) this.ledger = { day, calls: 0, ips: {} };
    visitor.calls = visitor.calls.filter(t => now - t < 60000);
    this.globalWindow = this.globalWindow.filter(t => now - t < 60000);
    if (this.active.has(key) || this.active.size >= 2) return { ok: false, code: 'busy', retry: 10 };
    if (this.ledger.calls >= this.limits.daily || (this.ledger.ips[key] || 0) >= this.limits.ipDaily) return { ok: false, code: 'daily', retry: 3600 };
    if (visitor.last && now - visitor.last < this.limits.cooldown * 1000) return { ok: false, code: 'rate', retry: this.limits.cooldown };
    if (visitor.calls.length >= this.limits.ipMinute || this.globalWindow.length >= this.limits.globalMinute) return { ok: false, code: 'rate', retry: 60 };
    const hash = crypto.createHash('sha256').update(question.toLowerCase()).digest('hex');
    for (const [old, time] of visitor.repeats) if (now - time > 600000) visitor.repeats.delete(old);
    if (visitor.repeats.has(hash)) return { ok: false, code: 'duplicate', retry: 600 };
    // Persist BEFORE OpenAI. Failed calls and timeouts count too, conservatively.
    this.ledger.calls++; this.ledger.ips[key] = (this.ledger.ips[key] || 0) + 1;
    saveJSON(this.filename, this.ledger);
    visitor.calls.push(now); visitor.last = now; visitor.repeats.set(hash, now);
    this.globalWindow.push(now); this.active.add(key);
    return { ok: true, release: () => this.active.delete(key) };
  }
}
