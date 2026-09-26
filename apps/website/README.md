# St Stephen's, Kimaeti — the public website

The public site for **St Stephen Mixed Day and Boarding Primary School, Junior
School & Early Years of Education Centre**, Kimaeti, Bungoma. Next.js 16 (App
Router), React 19, TypeScript, Tailwind v4, exported as static HTML.

Design notes, the photo pipeline and the pre-launch checklist are in
[`../../docs/WEBSITE.md`](../../docs/WEBSITE.md). This file is the quick start.

## Pages

| Route | What it is |
|---|---|
| `/` | Hero, stats, welcome, the three sections, four pillars, a day at the school, fees, testimonials, news, events, FAQ |
| `/about` | The story, the school in figures, vision/mission/motto, the sections |
| `/admissions` | Four steps, classes offered, what to bring and what it costs |
| `/fees` | The 2026 fee structure by level and term, uniform, and how to pay |
| `/news`, `/news/[slug]` | News listing and articles |
| `/events` | The term calendar |
| `/gallery` | 33 of the school's own photographs, grouped |
| `/contact` | Office details and an enquiry form |
| `/complain` | A complaints form, handled confidentially |
| `/portal` | Front door to the EMS |

Plus `sitemap.xml`, `robots.txt` and JSON-LD `School` schema.

## Editing content

**Every word is in [`src/lib/site.ts`](src/lib/site.ts).** School details, copy,
fees, payment channels, admission steps, FAQs, news, events and testimonials are
plain typed data; the pages are layout only. Anything marked `SAMPLE` is a
placeholder the school must replace — see the checklist in `docs/WEBSITE.md`.

Photographs are indexed in `src/lib/photos.ts`, which is **generated** — do not
edit it by hand. Run `tools/photos/process.mjs` instead.

## Forms

The contact and complaints forms post to [FormSubmit](https://formsubmit.co),
which emails each message to the school with no backend. The first submission
triggers a one-time activation email to that inbox. When the EMS is live, point
the forms at its front-office API instead — see
`src/components/enquiry-form.tsx`.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export → ./out
```

## Deployment

`output: 'export'`, so `out/` deploys to any static host — Cloudflare Pages,
Netlify, GitHub Pages, or Caddy on the same VPS as the EMS. Build command
`npm run build`, output directory `out`.

Two build-time environment variables:

| Variable | Effect |
|---|---|
| `PAGES_BASE_PATH` | Sets Next's `basePath` for hosting under a sub-path. Also inlined as `NEXT_PUBLIC_BASE_PATH` so `<Photo>` can prefix its own `src` attributes. |
| `NEXT_PUBLIC_EMS_URL` | Where `/portal` and the footer send people to log in. The deploy script sets it from the server's `EMS_DOMAIN`. |
