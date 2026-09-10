# The Premiere 2027: Astra Aeterna

A dependency-free static website. It can be opened directly in a browser or served locally.

## Run locally

In PowerShell from this folder, run:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Customize before launch

- Replace the four photo placeholder blocks in `index.html` with your images. Their classes are `photo-preopening`, `photo-competition`, `photo-opening`, and `photo-closing`.
- Replace the sponsor placeholder in `index.html` with the actual logo images.
- In `register.html`, replace each `href="#"` with its Google Form URL.
- Add the merch shop details to `merch.html` when they are ready.
- Add ticket details to `closing-night.html` when Closing Night tickets are ready.
- Your supplied logo is installed as `assets/premiere-logo.png` in the header on all four pages.

## Add the PDFs

Both supplied sponsor proposals are installed on the Home page. The selected site language chooses the matching preview and download. The e-invite on the Register page still shows **Coming soon** until its PDF is supplied.

1. Put new PDFs in `assets/documents/`, for example `e-invite.pdf`.
2. Open `content.js` and set the corresponding `url` values:

```javascript
invitation: {
  url: "assets/documents/e-invite.pdf",
  filename: "The-Premiere-2027-E-Invite.pdf"
},
sponsorship: {
  en: {
    url: "assets/documents/sponsor-proposal-en.pdf",
    filename: "The-Premiere-2027-Sponsor-Proposal-EN.pdf"
  },
  id: {
    url: "assets/documents/sponsor-proposal-id.pdf",
    filename: "The-Premiere-2027-Proposal-Sponsor-ID.pdf"
  }
}
```

Each card automatically becomes an embedded PDF preview with **Open PDF** and **Download PDF** links. The separate links remain available on phones whose browsers do not support inline PDF viewing. Keep PDFs on the same server as the website for reliable downloads. Leave a URL blank to keep its coming-soon state.

For a bilingual e-invite, use the same nested `en` / `id` structure as the sponsor proposal. A single `url` is shared by both site languages. If you replace a sponsor filename, also update the English fallback links and iframe in `index.html` so the document remains available without JavaScript.

## Languages

- The top-right EN / ID buttons translate all four pages immediately, without reloading.
- The choice is remembered in this browser. Internal page links also carry `?lang=en` or `?lang=id`, including when browser storage is unavailable.
- `locale.js` contains the English and Indonesian text. HTML translation hooks use `data-i18n`, `data-i18n-aria`, and `data-i18n-content`; update both dictionary entries when editing copy.
- The event name, school name, contact details, and Instagram handle stay unchanged in both languages.
- Without JavaScript, the English page and English sponsor PDF links remain available.

## Shared appearance and interactions

- `styles.css` holds the original theme; `polish.css` adds responsive layouts, the continuous star field, and finishing styles.
- `script.js` handles the phone menu, page transitions, scroll reveals, shooting star, and document previews.
- All four pages contain the shared header and footer. Update each page if navigation or contact details change.
- Animations respect the device's reduced-motion setting. The menu can be closed with Escape, and navigation remains available without JavaScript.

## Move to a server later

Upload the four HTML pages, both CSS files, all three JavaScript files (`content.js`, `locale.js`, and `script.js`), and `assets/` together to a static web host. No build step, database, or application server is required.

## Venue used

PENABUR Primary, Secondary & Junior College Kelapa Gading, Jalan Boulevard Bukit Gading Raya Blok A5–A8, Kelapa Gading Barat, Jakarta Utara 14240.

Source: https://www.penabur-inter.sch.id/
