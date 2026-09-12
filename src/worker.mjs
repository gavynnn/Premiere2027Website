// Cloudflare Worker entry point for the /api/* routes. Static pages/assets
// never reach this file - see wrangler.jsonc's assets.run_worker_first.
//
// This intentionally reuses server/openai.mjs and server/guard.mjs's
// filterQuestion() unchanged (see README). What could NOT be reused from
// server.mjs is the fs-backed quota ledger, session Map, and single-process
// lock file: Workers has no persistent local disk and runs many concurrent,
// ephemeral isolates instead of one long-lived process. ChatGuard (a Durable
// Object, singleton-named "singleton") replaces that fs ledger/lock with the
// same semantics: one single-threaded owner, persisted state, same limits.
import { DurableObject } from 'cloudflare:workers';
import crypto from 'node:crypto';
import { openAI, answerRequest, parseAnswer } from '../server/openai.mjs';
import { finishExchange } from '../server/conversation.mjs';
// Imported from filter.mjs directly, NOT guard.mjs: guard.mjs pulls in
// config.mjs, which runs node:fs/import.meta.url code at module load time
// that crashes under workerd (see the comment in server/filter.mjs).
import { filterQuestion } from '../server/filter.mjs';
import facts from '../server/event-facts.json';
import knowledge from '../server/knowledge.json';

const MINUTE_MS = 60000;
const HOUR_MS = 3600000;
const SESSION_TTL_MS = 1800000;

const SECURITY_HEADERS = {
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'X-Frame-Options': 'SAMEORIGIN',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
	'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'"
};

function json(status, value, extraHeaders = {}) {
	return new Response(JSON.stringify(value), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...SECURITY_HEADERS, ...extraHeaders }
	});
}

function retryHeader(retry) {
	return retry ? { 'Retry-After': String(retry) } : {};
}

function cookieHeader(cookie, secureCookie) {
	if (!cookie) return {};
	return { 'Set-Cookie': 'premiere_chat=' + cookie.id + '.' + cookie.signature + '; HttpOnly; SameSite=Strict; Path=/api/chat; Max-Age=1800' + secureCookie };
}

function clientIP(request) {
	// Cloudflare sets this at the edge; unlike Node's req.socket it can't be
	// spoofed by the client, so there is no equivalent of the original
	// TRUST_LOOPBACK_PROXY/X-Forwarded-For dance to do here.
	return request.headers.get('CF-Connecting-IP') || 'unknown';
}

function limitsFrom(env) {
	const num = (name, fallback) => {
		const value = Number(env[name] ?? fallback);
		return Number.isInteger(value) ? value : fallback;
	};
	return {
		daily: num('CHAT_DAILY_LIMIT', 3000),
		ipDaily: num('CHAT_IP_DAILY_LIMIT', 25),
		ipMinute: num('CHAT_IP_PER_MINUTE', 5),
		globalMinute: num('CHAT_GLOBAL_PER_MINUTE', 12),
		cooldown: num('CHAT_COOLDOWN_SECONDS', 8)
	};
}

function ready(env) {
	return Boolean(env.OPENAI_API_KEY?.trim() && knowledge?.vectorStoreId);
}

export default {
	async fetch(request, env) {
		const route = new URL(request.url).pathname;
		if (!route.startsWith('/api/')) return json(404, { code: 'not_found' });
		try {
			if (route === '/api/chat/status' && request.method === 'GET') {
				return json(200, { ready: ready(env), documents: knowledge?.files?.map(({ kind, language }) => ({ kind, language })) || [] });
			}
			if (route === '/api/chat' && request.method === 'POST') return await handleChat(request, env);
			if (!['GET', 'HEAD', 'POST'].includes(request.method)) return json(405, { code: 'method' });
			return json(404, { code: 'not_found' });
		} catch (error) {
			console.error(error);
			return json(500, { code: 'unavailable' });
		}
	}
};

async function loadOrCreateSession(request, guard, ipKey) {
	const match = /(?:^|;\s*)premiere_chat=([a-f0-9]{32})\.([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('cookie') || '');
	if (match) {
		const found = await guard.getSession(match[1], match[2], ipKey);
		if (found) return { session: found, cookie: { id: match[1], signature: match[2] } };
	}
	const created = await guard.createSession(ipKey);
	if (!created) return { session: null, cookie: null };
	return { session: created, cookie: { id: created.id, signature: created.signature } };
}

async function handleChat(request, env) {
	const origin = env.APP_ORIGIN || 'http://127.0.0.1:8000';
	const allowedOrigins = new Set([origin]);
	if (/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) {
		allowedOrigins.add(origin.replace('127.0.0.1', 'localhost'));
		allowedOrigins.add(origin.replace('localhost', '127.0.0.1'));
	}
	const secureCookie = origin.startsWith('https:') ? '; Secure' : '';
	if (!allowedOrigins.has(request.headers.get('origin')) || request.headers.get('sec-fetch-site') === 'cross-site') {
		return json(403, { code: 'origin' });
	}

	const guard = env.CHAT_GUARD.get(env.CHAT_GUARD.idFromName('singleton'));
	const ip = clientIP(request);
	const attempt = await guard.attempt(ip);
	if (!attempt.ok) return json(429, { code: attempt.code }, retryHeader(attempt.retry));

	if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return json(415, { code: 'invalid' });
	if (Number(request.headers.get('content-length') || 0) > 2048) return json(413, { code: 'invalid' });
	const raw = await request.text();
	if (new TextEncoder().encode(raw).length > 2048) return json(413, { code: 'invalid' });
	let body;
	try { body = JSON.parse(raw); } catch { return json(400, { code: 'invalid' }); }
	if (!body || Array.isArray(body) || Object.keys(body).some(key => !['message', 'language'].includes(key)) || !['en', 'id'].includes(body.language)) {
		return json(400, { code: 'invalid' });
	}

	const { session: current, cookie } = await loadOrCreateSession(request, guard, attempt.key);
	if (!current) return json(429, { code: 'busy' }, retryHeader(60));
	const headers = cookieHeader(cookie, secureCookie);

	const filtered = filterQuestion(body.message, current.history.length > 0);
	if (!filtered.ok) return json(400, { code: filtered.code }, headers);
	if (!ready(env)) return json(503, { code: 'unavailable' }, headers);

	const permit = await guard.reserve(ip, filtered.message, limitsFrom(env));
	if (!permit.ok) return json(429, { code: permit.code }, { ...headers, ...retryHeader(permit.retry) });

	try {
		const response = await openAI('responses', { body: answerRequest({
			message: filtered.message, language: current.language || body.language, history: current.history, facts, knowledge
		}) });
		const answer = parseAnswer(response, knowledge, filtered.message, current.history);
		if (!answer.inScope) return json(200, { code: 'scope', sources: [] }, headers);

		const finished = finishExchange(current, filtered.message, answer, facts);
		await guard.saveSession(cookie.id, finished.patch);
		return json(200, finished.response, headers);
	} catch (error) {
		// No upstream response body, key, conversation or raw IP is logged.
		console.warn('Chat provider request failed; quota reservation retained.');
		return json(502, { code: 'upstream' }, headers);
	} finally {
		await guard.release(permit.releaseToken);
	}
}

// Single global instance (name "singleton") standing in for the one process
// that used to own server.mjs's file-based ledger/lock/session Map. Durable
// Objects are single-threaded per instance, so this gets the same
// no-race-conditions guarantee the original file lock was protecting.
export class ChatGuard extends DurableObject {
	constructor(ctx, env) {
		super(ctx, env);
		this.visitors = new Map();
		this.active = new Set();
		this.globalWindow = [];
		this.secret = null;
		this.ledger = { day: '', calls: 0, ips: {} };
		ctx.blockConcurrencyWhile(async () => {
			this.secret = await ctx.storage.get('secret');
			if (!this.secret) {
				this.secret = crypto.randomBytes(32).toString('hex');
				await ctx.storage.put('secret', this.secret);
			}
			this.ledger = (await ctx.storage.get('ledger')) || { day: '', calls: 0, ips: {} };
		});
	}

	#key(ip) {
		return crypto.createHmac('sha256', this.secret).update(ip).digest('hex');
	}

	attempt(ip) {
		const now = Date.now(), key = this.#key(ip);
		for (const [old, value] of this.visitors) if (now - value.seen > HOUR_MS && !this.active.has(old)) this.visitors.delete(old);
		if (!this.visitors.has(key) && this.visitors.size >= 5000) return { ok: false, code: 'busy', retry: 60 };
		const visitor = this.visitors.get(key) || { attempts: [], calls: [], seen: now, last: 0, repeats: new Map() };
		visitor.seen = now; visitor.attempts = visitor.attempts.filter(t => now - t < MINUTE_MS);
		this.visitors.set(key, visitor);
		if (visitor.attempts.length >= 20) return { ok: false, code: 'rate', retry: 60 };
		visitor.attempts.push(now);
		return { ok: true, key };
	}

	async reserve(ip, question, limits) {
		const now = Date.now(), key = this.#key(ip), visitor = this.visitors.get(key);
		if (!visitor) return { ok: false, code: 'busy', retry: 10 };
		const day = new Date(now).toISOString().slice(0, 10);
		if (day !== this.ledger.day) this.ledger = { day, calls: 0, ips: {} };
		visitor.calls = visitor.calls.filter(t => now - t < MINUTE_MS);
		this.globalWindow = this.globalWindow.filter(t => now - t < MINUTE_MS);
		if (this.active.has(key) || this.active.size >= 2) return { ok: false, code: 'busy', retry: 10 };
		if (this.ledger.calls >= limits.daily || (this.ledger.ips[key] || 0) >= limits.ipDaily) return { ok: false, code: 'daily', retry: 3600 };
		if (visitor.last && now - visitor.last < limits.cooldown * 1000) return { ok: false, code: 'rate', retry: limits.cooldown };
		if (visitor.calls.length >= limits.ipMinute || this.globalWindow.length >= limits.globalMinute) return { ok: false, code: 'rate', retry: 60 };
		const hash = crypto.createHash('sha256').update(question.toLowerCase()).digest('hex');
		for (const [old, time] of visitor.repeats) if (now - time > 600000) visitor.repeats.delete(old);
		if (visitor.repeats.has(hash)) return { ok: false, code: 'duplicate', retry: 600 };
		// Persist BEFORE OpenAI. Failed calls and timeouts count too, conservatively.
		this.ledger.calls++; this.ledger.ips[key] = (this.ledger.ips[key] || 0) + 1;
		await this.ctx.storage.put('ledger', this.ledger);
		visitor.calls.push(now); visitor.last = now; visitor.repeats.set(hash, now);
		this.globalWindow.push(now); this.active.add(key);
		return { ok: true, releaseToken: key };
	}

	release(key) {
		this.active.delete(key);
	}

	async getSession(id, signature, ipKey) {
		const expected = crypto.createHmac('sha256', this.secret).update(id).digest('hex');
		if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
		const saved = await this.ctx.storage.get('session:' + id);
		if (!saved || saved.ip !== ipKey || Date.now() - saved.last > SESSION_TTL_MS) return null;
		saved.last = Date.now();
		await this.ctx.storage.put('session:' + id, saved);
		return saved;
	}

	async createSession(ipKey) {
		const sessions = await this.ctx.storage.list({ prefix: 'session:' });
		if (sessions.size >= 1000) return null;
		const id = crypto.randomBytes(16).toString('hex');
		const signature = crypto.createHmac('sha256', this.secret).update(id).digest('hex');
		const value = { last: Date.now(), ip: ipKey, history: [], answeredMessages: 0, contactSuggested: false, language: null };
		await this.ctx.storage.put('session:' + id, value);
		if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(Date.now() + SESSION_TTL_MS);
		return { id, signature, ...value };
	}

	async saveSession(id, patch) {
		const saved = await this.ctx.storage.get('session:' + id);
		if (!saved) return;
		Object.assign(saved, patch);
		await this.ctx.storage.put('session:' + id, saved);
	}

	// Expired sessions are only ever pruned here, not on the hot request path.
	async alarm() {
		const now = Date.now();
		const entries = await this.ctx.storage.list({ prefix: 'session:' });
		let remaining = 0;
		for (const [key, value] of entries) {
			if (now - value.last > SESSION_TTL_MS) await this.ctx.storage.delete(key);
			else remaining++;
		}
		if (remaining > 0) await this.ctx.storage.setAlarm(Date.now() + SESSION_TTL_MS);
	}
}
