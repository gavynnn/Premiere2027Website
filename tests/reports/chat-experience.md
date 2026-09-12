# Astra chat experience evaluation, 2026-09-12

## Real OpenAI sample (12 approved calls, not a production deployment)

Saved results: `chat-experience-live.json`. The run used the configured model, 10 text calls and 2 direct PDF inputs. No automatic retries or extra paid rechecks were made. A sandbox-denied connection sent no API request and was rerun with network permission.

- All 12 tested messages reached Astra and were in scope.
- The nine ordinary replies averaged 2.78 raw sentences and 2.56 displayed sentences; longer sponsor answers were intentionally excluded from this average.
- The fifth reply included both committee WhatsApp links. The school name remained available across EN/ID changes within the five-exchange window.
- The first PDF test read all 12 names from the Previous Guest Stars logos. The second read the approximate 2024–2026 chart values in Indonesian.
- Language matched in 11/12 overall. One Indonesian sponsorship reply was incorrectly English in the first 11 calls. The final call used the added explicit language resolver/schema and required section format, and answered an Indonesian sponsor/chart question correctly. This is one post-change live check, not a full 12-case retest of the final prompt.
- The first English sponsorship answer ignored headings. A fallback now converts longer plain paragraphs into readable headings/bullets; the final live reply supplied headings itself.
- The final model reply added an unsupported exposure guarantee. A subsequent local output guard now replaces positive guarantee claims about exposure/returns with a historical-estimate qualification. This guard and school-count attribution are regression-tested with mocked/saved text; no further paid call was made.
- The audience-chart phrasing was initially blocked locally before a paid call. Relevant chart/audience vocabulary was added, covered by regression tests, and the remaining approved call used the chart.

This deliberately preserves the initial failures instead of claiming 100% language or grounding accuracy. Model behavior is probabilistic; these 12 authored messages do not prove reliability for every visitor.

## Local regression checks

`npm test` covers the existing 500 common / 500 unrelated fixtures through Node and Worker handlers, plus citation cleanup, uncited document links, missing documents, safe action intents, bounded short/detailed replies, paragraph spacing, explicit language selection, reviewed PDF hash invalidation, fifth-message contacts and WhatsApp-only links.

`tools/check-chat-ui.mjs` uses a fake provider and real static PDFs. It checks desktop width, the larger launcher, PDF download bytes, register/proposal navigation, persistent open chat/draft, full-screen transition layering, avatars, headings/bullets, no raw citation artifacts, 390px/320px/landscape layouts, reduced motion and browser errors. It never spends API credits.

Deployment was not performed. Production needs the updated Worker and static assets deployed together.
