# Astra evaluation, 12 September 2026

## Filter and provider boundary

- 500 unique common visitor phrases: 250 English and 250 Indonesian, 10 intent groups with 50 examples each.
- 500 unique unrelated inputs: 100 distinct unrelated requests in EN/ID, each with five framings (plain, greeting, polite, follow-up, and an event-keyword prefix).
- The phrases are test fixtures, not a production allowlist.
- Result: 500/500 common phrases accepted; 500/500 unrelated inputs rejected. Repeated with and without prior context.
- The actual Node HTTP handler and Cloudflare Worker handler both pass every accepted phrase through to a mocked OpenAI provider boundary. Every unrelated input is rejected before that boundary.
- Worker tests execute its actual routing and Durable Object code with test storage and a mock OpenAI response. They are not a Cloudflare deployment test.
- An additional 50 unseen conversational/off-topic regressions test wording outside the main corpus.

Run `node tools/evaluate-chat.mjs --write` to refresh the machine-readable result and expanded lists of all 1,000 inputs in `filter-evaluation.json`. Run `npm test` for the integration and behavioral checks. These synthetic results are regression measurements, not a guarantee for all real-world language.

## Real OpenAI sample (21 paid calls, explicitly authorized)

The first 20 replies all passed model scope classification and matched the expected EN/ID language. Raw sentence counts, before the display cap, were:

`4, 4, 4, 4, 5, 3, 4, 4, 4, 3, 3, 4, 3, 2, 4, 3, 3, 2, 2, 3`

Mean: 3.4 sentences. All displayed replies were at most five sentences, including the fifth-reply WhatsApp invitation. The conversation checked school-name recall and EN/ID switches while the website preference was English.

This sample exposed old PDF contacts being repeated and unnecessary document checks for visitor-provided details. The final prompt now prioritizes the current committee contacts, distinguishes visitor context from document facts, and uses optional file search. It also exposed the phrase “Which sport did I mention?” being rejected locally; that phrase is now an additional regression test.

The remaining 21st call tested the final prompt with the previous five exchanges, deliberately retaining the stale contact answers as a conflicting history. Query: “Which sport did I mention, and who should I WhatsApp?” The answer correctly recalled futsal, supplied Gavynn and Grace, and did not repeat the older contacts. It used 3 sentences. Overall mean across the 21 sampled outputs: 3.38 sentences. Only this final call used the last prompt revision; the earlier 20 measured the preceding revision.

## Behavior and UI

- Replies keep at most five complete sentences. The prompt requests 2–5 short sentences and at most 80 words; simple confirmations may be shorter.
- Server context keeps the last five exchanges (10 prior messages). Visible chat history remains on screen.
- A successfully answered visitor message advances the exchange counter, including greetings and language switches. Rejections and failed calls do not advance it.
- The fifth answered message adds one-time WhatsApp links for Gavynn and Grace. Later replies do not repeat the invitation.
- Long conversations roll their memory window without resetting the counter. Inactive sessions expire after 30 minutes.
- Local Chrome checks at 1093×958 and 390×844 verified WhatsApp buttons, hidden starter options, cross-page chat persistence, no horizontal overflow, and no JavaScript errors. UI chat responses were mocked.
- The sponsor board uses a muted dark-gold gradient: `#887137`, `#665225`, `#45371e`.

Changes have not been committed, pushed or deployed by this evaluation.
