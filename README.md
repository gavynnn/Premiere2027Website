# The Premiere 2027: Astra Aeterna

A bilingual, mobile-friendly event website with a private, server-side AI assistant. The runtime has no npm dependencies. Use Node.js 22.14 or newer.

## Run locally

In PowerShell from this folder, run:

```powershell
npm start
```

Then visit [the local website](http://127.0.0.1:8000/index.html?lang=en). Keep that terminal running. Stop it with Ctrl+C before starting another copy.

Do **not** use `python -m http.server`, a generic static server, or static hosting for this folder: those can expose private configuration and cannot run the chatbot. The Node server serves only the public pages and assets; `.env`, server code, and `.runtime` are inaccessible over HTTP.

## Enable the chatbot

1. Open `.env` and set `OPENAI_API_KEY` to your own OpenAI project API key. A blank `.env` is included locally and ignored by Git; on a fresh checkout, copy `.env.example` to `.env` first. Never put the key in browser JavaScript or share it in chat.
2. Stop the website server, then run:

   ```powershell
   npm run sync-docs
   npm start
   ```

The first command uploads and indexes the configured English and Indonesian sponsor proposals using [OpenAI File Search](https://developers.openai.com/api/docs/guides/tools-file-search). This requires an API account with available billing and incurs document-storage/indexing and subsequent chat usage charges as applicable. No upload or real AI call is made until you add a key and run the command. Re-running it with unchanged documents skips uploading. The chatbot remains in a friendly unavailable state until both the key and index are ready.

The default model is `gpt-4.1-mini`; change `OPENAI_MODEL` only to a model compatible with Responses, File Search, and structured outputs. The chatbot follows the visitor's EN/ID language, independently of the website preference, and links its cited event documents. File search is optional for ordinary conversation and required by the prompt for document-specific claims. The latest confirmed event facts and current committee contacts are in `server/event-facts.json`. Rules, fees, registration links, or other details that are not supplied must be confirmed with the committee; the bot is instructed not to invent them.

### Add the e-invite later

1. Place the final PDF at `assets/documents/e-invite.pdf`.
2. In `content.js`, set `invitation.url` to `"assets/documents/e-invite.pdf"`. Keep the URL local and use a simple filename.
3. Stop the server, run `npm run sync-docs`, then restart with `npm start`.

The same setting powers the visible preview/download and the chatbot's document knowledge. The current blank URL intentionally shows the coming-soon state. If you add separate translations, the invitation can use the same `en` / `id` object structure as sponsorship. Repeat the sync and restart whenever a PDF changes. New indexing must finish successfully before it replaces the previous index. Old resources recorded as belonging to this application are then retired to avoid unnecessary storage charges.

If an interrupted sync leaves `.runtime/sync.lock`, first confirm no sync command is still running before removing that one lock file. Check the OpenAI dashboard for incomplete uploads after an interrupted network operation; never delete resources belonging to other applications.

## Usage limits and privacy

All enforcement is server-side, not just in the browser. Defaults can be adjusted in `.env`:

| Safeguard | Default |
| --- | --- |
| Total incoming chat attempts per IP | 20 per minute, including rejected messages |
| AI calls per IP | 5 per minute, 25 per UTC day |
| AI calls across all visitors | 12 per minute, 3,000 per UTC day |
| Cooldown / duplicate protection | 8 seconds / identical question blocked for 10 minutes |
| Simultaneous AI calls | 1 per IP, 2 globally |
| Question / output limit | 400 characters / 400 output tokens |
| Retrieval / context limit | 3 chunks per search, 1 tool call, last 5 exchanges (10 prior messages) |
| Reply length | Prompt requests 2–5 short sentences, at most 80 words; display caps at 5 complete sentences |

The shared `server/filter.mjs` accepts informal English/Indonesian messages, missing apostrophes (such as "whats this"), short topics, greetings, language switches, and event follow-ups. Explicit unrelated requests, repetitive text, links, code, and common prompt-injection patterns are rejected before an AI call. The model checks actual intent again, including when an event keyword is added. A text filter is **not abuse-proof**; sophisticated requests can pass it. The global daily call cap limits the resulting exposure but is not an exact currency or total-token budget. Failed or timed-out AI calls count toward the cap and are not automatically retried. Per-minute and duplicate windows are in memory; daily reservations are written before the call and survive restarts.

The key never reaches the browser. The current question and last five accepted exchanges are sent to OpenAI with `store: false`; this is not a guarantee of zero provider retention. `server/conversation.mjs` applies the same rolling memory and reply policy in Node and Cloudflare. Older messages remain visible in the browser but leave the model's short-term memory. Node keeps this recent context in memory; Cloudflare persists it in the Durable Object. Both expire sessions after 30 minutes of inactivity. The quota ledger uses keyed IP hashes, not raw IP addresses. Do not delete `.runtime` to bypass limits: it contains the local daily ledger, signing secret, and document index references.

Astra follows the language of the visitor's latest message or explicit EN/ID request, independently of the site's language setting. After the fifth successfully answered visitor message, it adds a one-time invitation with clickable WhatsApp links for Gavynn and Grace. Greetings and language switches count as answered exchanges; rejected messages and failed calls do not. The counter survives rolling the memory window. Links are built from the current organizer contacts and rendered as DOM anchors, never model HTML.

Internal page links update route content without recreating Astra. Its open/closed state, visible conversation, draft, cooldown and pending answer survive Home, Register, Merch and Closing Night navigation, including browser Back/Forward. The full-screen transition sits above the non-modal chat. A failed page load keeps the current page and chat available. Reloading the browser or opening another tab starts a new visible chat; this is not cross-device chat storage.

Before public deployment, use HTTPS, set `APP_ORIGIN` to the exact public origin, configure provider-side spending alerts/limits where available, and add host-level bot protection/WAF or a challenge for abuse. Origin checks deter cross-site browser requests; they are not authentication against custom clients. The current file-based quota ledger supports **one server process on persistent local storage**. Multiple replicas require a shared transactional rate limiter and usage ledger. Do not publish this repository as a static folder.

Keep `TRUST_LOOPBACK_PROXY=false` unless a controlled reverse proxy connects over loopback and appends the actual client IP to `X-Forwarded-For`. With that setting enabled, only the rightmost valid forwarded IP from a loopback connection is used. Configure the proxy correctly and prevent direct public access to the backend. Shared school networks may share an IP and therefore share its quota.

## Cloudflare Worker deploy

`wrangler.jsonc` deploys the site as Cloudflare Workers static assets, with `src/worker.mjs` handling `/api/*` (everything else is served directly from the assets, never touching the Worker - see `assets.run_worker_first` in `wrangler.jsonc`). This replaces `server.mjs`'s fs-based quota ledger/session Map/lock file - which only work for one process on persistent local storage (see above) - with a `ChatGuard` Durable Object: a single-threaded, persisted equivalent that works across Cloudflare's many concurrent, ephemeral isolates.

1. Set the secret (never put it in `wrangler.jsonc` - that file is committed to git):
   ```powershell
   npx wrangler secret put OPENAI_API_KEY
   ```
2. Set `APP_ORIGIN` in `wrangler.jsonc`'s `vars` to your real public origin (custom domain or `*.workers.dev` URL) before going live; `OPENAI_MODEL` and the `CHAT_*` limit overrides from the table above can go in `vars` too since they aren't secret.
3. Run `npm run sync-docs` locally as usual (needs `OPENAI_API_KEY` in `.env`), then **commit the `server/knowledge.json` it writes**. The Worker has no local disk at deploy time, so it imports that committed file instead of reading `.runtime/documents.json`; a fresh checkout without it starts in the same "AI setup pending" state as a fresh `npm start`. Re-run and re-commit it whenever documents change.
4. Deploy with `npx wrangler deploy`.

`server/openai.mjs` and `filterQuestion` (now in `server/filter.mjs`) run unchanged on both the Node server and the Worker. `server/guard.mjs`'s `Guard` class (the fs-based ledger) is Node-only and stays that way; only `filterQuestion` is shared, via `server/filter.mjs`, which is deliberately dependency-free (no `node:fs`, no `import.meta.url`) so the Worker bundle never pulls in `server/config.mjs`'s module-load-time filesystem code.

## Photos and sponsor boards

The supplied photos are optimized WebP copies in `assets/photos`. Original files are unchanged. Responsive CSS collages preserve the chosen focal points; the opening ceremony gives the MCs and screen a large image with the audience below. Both supplied sponsor PNGs are in `assets/sponsors` and remain uncropped.

`tools/import-media.cjs` is an optional one-time asset import helper requiring Sharp; it is not needed to run the website. All generated assets are already included.

## Verify

```powershell
npm test
```

Tests cover 500 common phrases and 500 unrelated phrases through both Node and Worker handlers, five-exchange memory, fifth-reply WhatsApp links, short replies, persistent quotas, concurrency, signed sessions, document citations, PDF serving, and secret-file protection. They use mock providers and do not spend API credits. Worker tests run the production handler with test platform/storage adapters rather than deploying it.

`npm run test:filter` prints acceptance/rejection scores; `node tools/evaluate-chat.mjs --write` also saves all 1,000 phrases and results to `tests/reports/filter-evaluation.json`. The measured target is at least 99% common-phrase acceptance and 90% unrelated-phrase rejection; these synthetic fixtures are a regression benchmark, not proof for every possible visitor message. See `tests/reports/chat-evaluation.md` for results and the 21-call real-model sample.

`npm run test:chat:live` explicitly runs a small 21-message real OpenAI smoke test for scope, response length, EN/ID switching and conversational memory. It uses `.env`, the committed document index, and API credits; it is never part of `npm test`. Its JSON output can be saved by passing a filename after `--`. Prompt wording uses concrete length limits and examples following [OpenAI's prompting guidance](https://developers.openai.com/api/docs/guides/prompt-engineering).
