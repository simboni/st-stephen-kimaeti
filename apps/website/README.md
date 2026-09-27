# St Stephen's, Kimaeti — the public website

The public site for **St Stephen Mixed Day and Boarding Primary School, Junior
School & Early Years of Education Centre**, Kimaeti, Bungoma. Next.js 16 (App
Router), React 19, TypeScript, Tailwind v4, exported as static HTML.

The design notes, the photo pipeline, the accessibility results and the
pre-launch checklist are in [`../../docs/WEBSITE.md`](../../docs/WEBSITE.md).
This file is the quick start.

## Pages

| Route | What it is |
|---|---|
| `/` | Hero, the school in figures, welcome, three sections, four pillars, a day at the school, school life, fees, news, term diary, FAQ |
| `/about` | The story, vision, mission, the motto on the wall, the crest, the school in figures |
| `/academics` | The three sections, how we teach, the science fair, the CBC assessment bands |
| `/school-life` | Boarding, faith, music and dance, sport, the shamba, trips beyond the ward |
| `/admissions` | Four steps, what to bring, what it costs, places by level |
| `/fees` | A fee calculator, the 2026 structure, uniform prices, M-PESA and bank details |
| `/gallery` | 46 photographs with category filters and a keyboard-accessible lightbox |
| `/news`, `/news/[slug]` | News listing and articles |
| `/events` | Term dates and the diary, with a calendar download |
| `/contact` | Four ways to reach the office, and an enquiry form |
| `/complain` | A complaints form, handled confidentially |
| `/portal` | Front door to the EMS |
| `/offline` | Shown by the service worker with no network |

Plus `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, `news.xml` (RSS) and
`school-calendar.ics`.

## Editing content

**Every word is in [`src/lib/site.ts`](src/lib/site.ts).** School details, copy,
fees, payment channels, term dates, admission steps, FAQs, news and events are
plain typed data; the pages are layout only. Anything marked `SAMPLE` is a
placeholder the school must replace — the checklist is in `docs/WEBSITE.md`.

Photographs are indexed in `src/lib/photos.ts`, which is **generated**. Do not
edit it by hand; run `tools/photos/process.mjs` instead.

## Forms

The contact and complaints forms post to the EMS front-office queue *and* to
[FormSubmit](https://formsubmit.co), which emails the school as a backup;
submission succeeds if either accepts. The first FormSubmit message triggers a
one-time activation email to the school inbox.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export → ./out
```

## Checks

```bash
npm run build
cd ../../tools && npm install && npm run a11y
```

axe-core over every page in both themes at 320px and 1440px, plus heading
order, alt text, horizontal overflow and keyboard focus. It exits non-zero on
any finding. The browser and axe live in `tools/package.json`, not in the
site's own dependencies.

## Where to see it

Every push to `main` that touches the site builds it and publishes it to GitHub
Pages:

**https://simboni.github.io/st-stephen-kimaeti/**

That is a preview host, not the real one. It costs nothing and needs no server,
so the school and anyone else can look at the current build from a phone while
the domain and the VPS are still being settled. The live site belongs on
`ststephenkimaeti.ac.ke` — see [`../../docs/DEPLOY-CONTABO.md`](../../docs/DEPLOY-CONTABO.md).

Pages serves a project repository under `/<repo>/`, so the workflow passes
`PAGES_BASE_PATH` and everything — Next's own URLs, `<Photo>`, the web manifest,
the service-worker scope — is prefixed from it.

It also sets `NEXT_PUBLIC_SITE_PREVIEW=1`, which adds a banner and makes
`robots.txt` disallow everything, so an unapproved build carrying photographs of
children does not get indexed. Drop it for the real launch.

## Deployment

`output: 'export'`, so `out/` deploys to any static host — Cloudflare Pages,
Netlify, GitHub Pages, or Caddy on the same VPS as the EMS. Build command
`npm run build`, output directory `out`.

Two build-time environment variables:

| Variable | Effect |
|---|---|
| `PAGES_BASE_PATH` | Sets Next's `basePath` for hosting under a sub-path. Also inlined as `NEXT_PUBLIC_BASE_PATH`, which `<Photo>` and the service worker use to prefix their own URLs. |
| `NEXT_PUBLIC_EMS_URL` | Where `/portal`, the footer and the enquiry forms point. The deploy script sets it from the server's `EMS_DOMAIN`. |
| `NEXT_PUBLIC_SITE_PREVIEW` | `1` marks the build as a preview: a banner on every page, and `robots.txt` disallowing everything. Unset on the live site. |

**On every deploy, bump `VERSION` in `public/sw.js`.** That is what tells copies
already installed on people's phones to fetch the new build.
