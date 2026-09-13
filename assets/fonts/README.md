# Self-hosted site fonts

These are unchanged WOFF2 binaries from the Google Fonts stylesheet previously used by all four pages. No glyph outlines, font weights, or formats were converted. Downloaded 2026-09-13.

Source stylesheet:

https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,600&display=swap

The exact binary source URLs are recorded in `tools/download-fonts.ps1`. The corresponding original SIL Open Font License 1.1 notices are included in this directory. The licenses were obtained from the Google Fonts repository:

- https://raw.githubusercontent.com/google/fonts/main/ofl/dmmono/OFL.txt
- https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt
- https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/OFL.txt

`fonts.css` registers the original families and requested weights/styles. Manrope and regular Playfair Display share variable font files across weights. Latin covers the website's English and Indonesian text; Latin-ext remains available on demand for extended names and diacritics. Other writing systems continue to use the system fallback stack.

The five Latin files total **116,224 bytes**. All ten Latin and Latin-ext files total **185,776 bytes**. Extended files are not fetched unless the page contains characters in their `unicode-range`.

Run `node tools/check-fonts.mjs` to verify all 11 requested weight/style combinations and all 10 files in Chrome. It uses an isolated localhost fixture without external requests or AI calls. Set `PLAYWRIGHT_PACKAGE` and `CHROME_PATH` if the local installation differs.

| File | SHA-256 |
| --- | --- |
| dm-mono-400-latin.woff2 | e1896b13b2b1bb112fac2f9571bd6c40e118746e77a4511edbf43fbb41bf3e1e |
| dm-mono-400-latin-ext.woff2 | a52e19ebe0398c9c0f8fa28a0c5e9a6bc324f35d9f0881c9aa407d10af447175 |
| dm-mono-500-latin.woff2 | 9964608a849396bd00c4bfd7034afe03486469dcf20b4f6b8cbdfdd310369951 |
| dm-mono-500-latin-ext.woff2 | 8711f938c3f04f91e35ae64ebc7f2eecd800d2ae1c3542f6c837c758a50422f5 |
| manrope-latin.woff2 | a30ddcd349703aff7464c34bef3fffdff405ee50c113440d7c8693c02d210972 |
| manrope-latin-ext.woff2 | 3911b66d9f2e005a4b989223405d0e5032619c668597ba467cc76a23c8fffcfb |
| playfair-display-latin.woff2 | e0c764a8e9e1cce92163c55bac4b2ad6cd4cf8c696ce2289ab5c41565e65b7e2 |
| playfair-display-latin-ext.woff2 | 42898ad49a6b23f32b109243e1df596edf831015ed685f429e4dabfb181d599d |
| playfair-display-600-italic-latin.woff2 | 8176ed854ef40b2cdebbdb7a1fd9283b3dada1e87c8e89d003f3485fc3c7435b |
| playfair-display-600-italic-latin-ext.woff2 | 4f6a4778dcb42d51a922c9ee7ba5b85482473ce33e3d4eb9280912b24794b341 |
