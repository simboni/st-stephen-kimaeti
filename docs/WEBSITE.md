# The St Stephen's website

`apps/website` — a Next.js 16 static export. No server, no database, nothing to
run at request time. `npm run build` produces `out/`, which any static host will
serve: Cloudflare Pages, GitHub Pages, Netlify, or a folder behind Caddy on the
same VPS as the EMS.

```
apps/website/
  src/lib/site.ts        every word on the site
  src/lib/photos.ts      GENERATED — the photo index
  src/components/        crest, photo, chrome, gallery, fee calculator
  src/app/               one folder per page
  public/photos/         GENERATED — responsive WebP
  public/sw.js           the offline service worker
tools/photos/
  process.mjs            the photo pipeline
  sources.txt            the source list the pipeline indexes into
```

## The look

Editorial, not corporate. A warm paper ground rather than a cold grey, a
high-contrast serif for display, hairline rules instead of boxes everywhere, and
the school's own photography carrying the page.

Two things anchor it to this particular school:

- **The type.** Fraunces, a serif with the slightly hand-painted quality of the
  signwriting on the school's own classroom wall — where `ORA ET LABORA (PRAY &
  WORK)` is painted in hand-lettered capitals. Inter carries the text.
- **The colour.** The uniform gives sky blue and maroon. The compound gives the
  clay of the murram underfoot, which is the accent on every rule and eyebrow.
  The gold is from the crest and is used almost nowhere else.

### Tokens, not colours

Everything the page paints with is a semantic token — `--surface`, `--text`,
`--accent`, `--line`, `--band` — defined on `:root` and redefined under
`[data-theme="dark"]`, then exposed to Tailwind through `@theme inline`.

Write `bg-surface text-text border-line`. Never `bg-white text-slate-900`. Dark
mode then comes free and cannot drift.

`--band` is the exception: it is a dark band in *both* themes, for sections that
are meant to be dark (the hero, the footer, the payment panel). Its own tokens
are `--band-text`, `--band-text-2`, `--band-accent`.

### Dark mode

An inline boot script in `<head>` reads `localStorage.theme`, falls back to the
system preference, and sets `<html data-theme>` **before first paint**, so there
is no flash of the wrong theme. The toggle in the header is stateless — it flips
the attribute and CSS does the rest, which is also why the control shows the
right icon in the instant before React hydrates.

## Content lives in one file

**`src/lib/site.ts` holds every word.** School identity, the intro copy, the
three sections, the four pillars, the six strands of school life, fee tables,
payment details, term dates, admission steps, FAQs, news and events. The pages
are layout and nothing else.

Everything in it came from the school's own papers — letterheads, the 2026 fee
sheets, the Term II enrolment return, the completed requirements form, and
photographs of the classroom wall — except where a comment says `SAMPLE`.
**Search the file for `SAMPLE` before launch.** As of this commit:

| What | Why it is a sample |
|---|---|
| `testimonials` | Nobody has given us a quote or permission. Three plausible ones stand in, and `showTestimonials` is **false**, so the home page does not render them. An invented parent quote on a school's own website is a lie about a real person. Replace the array, then flip the flag. |
| `news` | Written from the photographs. The school must confirm dates and details. |
| `events`, `terms` | A plausible term calendar. Replace with the school's own; the `.ics` download is generated from it. |

Two things are deliberately **absent** rather than invented:

- **Grade 4–6 fees.** The school supplied Early Years, Grade 1–3 and Junior
  sheets only. The table says so out loud, and the fee calculator, asked about
  Grade 4, 5 or 6, says the sheet is not published rather than estimating.
- **Boarding and transport premiums.** The sheets do not distinguish them, so
  the site says "quoted by the office".

## Photographs

The school has sent 198 files over WhatsApp across three batches. After
stripping `__MACOSX` junk and perceptual duplicates, 114 distinct photographs
remain; **46 are on the site**.

`tools/photos/process.mjs` is the whole pipeline. It reads a hand-picked table
of stable indices, exports each photo as WebP at 480/800/1200/1600px (never
upscaled past the original), writes a 20px inline blur placeholder, and
generates `src/lib/photos.ts` with alt text and a caption for every one.

```sh
SOURCE_DIR=/path/to/originals node tools/photos/process.mjs
```

The originals are not in this repo — tens of megabytes of near-duplicates. Ask
Peter for the archive if you need to re-run it. The *outputs* are committed, so
the site builds without them.

Every caption and every piece of alt text was written after looking at the
photograph at full size, not at a contact-sheet thumbnail. That matters more
than it sounds: the first pass, written from thumbnails, called an open-air Mass
"morning assembly", a model of the oxygen atom "the solar system", and an
osmosis experiment "chromatography". **If you add photographs, open them.**

`<Photo>` renders a plain `<img srcset>` rather than `next/image`, because this
is a static export with `images.unoptimized`, where `<Image>` emits one source
and no srcset. A phone downloads the 480px file (~34 KB); a desktop hero takes
the 1600px one (~190 KB). While a file is in flight its blur placeholder is
painted as a stretched background, so the layout never jumps, and none of it
needs JavaScript.

### Adding a photograph

1. Append its path to `tools/photos/sources.txt`.
2. Add a row to `PICKS` in `process.mjs` — the line number, a slug, a category,
   alt text and a caption.
3. Re-run the pipeline and commit both generated outputs.

The gallery groups itself by category automatically.

## The crest

`src/components/crest.tsx` **redraws the school's badge as vector paths**. The
school sent a photograph of it: a low-resolution screenshot on a black field
with a phone clock burnt into the corner. The traced version carries the same
arms — a quartered shield under a pale cross, charged with the S of Stephen, the
open book, five stars and the Latin cross, between two ribbons — at any size,
in about 3 KB, with no artefacts.

Two variants, because a crest that reads at 200px is mud at 40px:

```tsx
<Crest />        {/* full arms with both ribbons — footer, about page, closing panel */}
<Crest mark />   {/* the shield alone — header, favicon, small chrome */}
```

The PWA icons in `public/` are rendered from the same paths.

## Features

| Feature | Where | Notes |
|---|---|---|
| **Fee calculator** | `/fees` | Pick a class and a term; it adds the term fee, one-off registration and uniform. Computed in the browser from the published sheet, so it works offline and sends nothing anywhere. Saves a plain-text estimate the parent can keep or send on WhatsApp. |
| **Offline / installable** | everywhere | `public/sw.js`: network-first for pages, cache-first for assets, falling back to `/offline/`. A parent who opened the fee structure on Tuesday can read it on Thursday with no signal. Bump `VERSION` in the worker on deploy. |
| **Gallery lightbox** | `/gallery` | Filters by category; the lightbox traps focus, moves with the arrow keys, closes on Escape and returns focus to the thumbnail that opened it. |
| **Calendar export** | `/events` | `school-calendar.ics`, hand-written RFC 5545 with folded lines. Term dates and events straight into a phone. |
| **News feed** | `/news.xml` | RSS, so the school can be followed without anyone remembering to tell people. |
| **Dark mode** | header | See above. |
| **View transitions** | all | `experimental.viewTransition`; a 0.22s crossfade where the browser supports it, an ordinary navigation where it does not. |
| **Print** | `/fees` | A print stylesheet, because parents print and screenshot fee structures. |
| **Structured data** | all | `School` on every page with address, phone and opening hours; `FAQPage` on the home page; `NewsArticle` on each post. |

## Accessibility

Audited, not asserted. `scratchpad/a11y.mjs` drives Chromium over **every page,
in both themes, at 320px and 1440px**, and checks:

- axe-core, WCAG 2.0/2.1/2.2 A and AA
- exactly one `<h1>`, and no skipped heading levels
- every `<img>` has an `alt` attribute
- no horizontal overflow at 320px
- every interactive element is focusable and has a visible focus ring

It exits non-zero on any finding, so it can gate a deploy. The first run found
54 problems; all are fixed. Things that came out of it and are worth keeping in
mind when editing:

- **Contrast is computed, not eyeballed.** `--text-3` is `#5f6775` because
  `#6a7280` was 4.19:1 on the tinted band, just under AA. Do not lighten it.
- **Decorative numerals live in CSS.** The big pale `01 02 03` are
  `.index-ghost::before { content: attr(data-index) }`, so a screen reader does
  not read them out between headings.
- **`<Reveal as="li">`** inside a list. A `<div>` between `<ol>` and `<li>`
  destroys the list semantics a screen reader announces.
- **Sideways-scrolling strips** carry `tabIndex={0}` and a label, so a keyboard
  can reach them.
- Motion — the drift on hero photography, the marquee, the scroll reveals and
  the view transitions — is all switched off under `prefers-reduced-motion`.

## Performance

Measured on the built output:

| | |
|---|---|
| HTML (home, gzipped) | ~35 KB |
| CSS (gzipped) | ~11 KB |
| JS (gzipped) | ~189 KB — Next's App Router runtime |
| Fonts preloaded | ~196 KB across three woff2 files |
| Largest photograph served | ~190 KB (1600px); a phone takes ~34 KB |

The fonts are the one deliberate indulgence, and `display: swap` means text
paints immediately in a metric-matched fallback rather than waiting. Fraunces is
requested with only its optical-size axis; its SOFT and WONK axes are lovely and
cost about 80 KB, which is not a trade worth making for this audience.

## Where to see it

| | |
|---|---|
| Preview | **https://simboni.github.io/st-stephen-kimaeti/** — rebuilt by `.github/workflows/website-pages.yml` on every push to `main` that touches the site. Needs one manual switch first: [Settings → Pages](https://github.com/simboni/st-stephen-kimaeti/settings/pages) → Source → **GitHub Actions**. The Actions token may deploy to a Pages site but may not create one, so this cannot be automated. |
| Live | `ststephenkimaeti.ac.ke`, once the domain is pointed — see `docs/DEPLOY-CONTABO.md` |

The preview is a project page, so it is served under `/st-stephen-kimaeti/`. The
workflow passes `PAGES_BASE_PATH`, and the accessibility audit is run against a
build made the same way, so what is checked is what is served.

**The preview asks not to be indexed.** The workflow also sets
`NEXT_PUBLIC_SITE_PREVIEW=1`, which puts a strip across the top of every page
and makes `robots.txt` disallow everything. Two reasons: the news posts and term
dates are still placeholders and the school has not confirmed its own address;
and the pages carry photographs of identifiable children, which should not turn
up in a search for the school before the school has published them itself. Drop
that variable when the site moves to its own domain.

## Still to do before launch

- [ ] **Settle the Senior School.** On 28 September the school gave its title
      as *St Stephen Early Years of Education, Primary, Junior and Senior
      School, Kimaeti – Bungoma*. Nothing else we hold mentions a senior
      section: the enrolment sheet counts 525 learners in twelve classes
      ending at Grade 9, the fee structure has three bands ending at Junior,
      and the FAQ answer still says "Grade 9 is our highest class". The name
      is in, because it is the school's own name. The claims are not. Before
      those lines change we need, from the school:
      which senior grades actually run (10 only? 10–11?), how many learners
      are in each, which CBC pathways and subject combinations are offered,
      and the senior fee sheet. Until then do not edit `intro`, `sections`,
      `stats`, `faqs` or the 2027 admissions post to mention senior grades.
- [ ] Confirm the fourth phone number. The school's message listed
      0143506720 alongside the three it then assigned roles to (Director
      0728 836 150, Head teacher 0705 046 610, Accountant 0711 288 784).
      Only the three with roles are on the site.
- [ ] Replace the three sample testimonials with real, permitted quotes, then
      set `showTestimonials` to true.
- [ ] Confirm the news posts, the term dates and the event calendar.
- [ ] Get the Grade 4–6 fee sheet and add the row.
- [ ] Settle the address — the letterhead, the administrator's stamp and the
      requirements form give three different places (Box 93–50200 Bungoma /
      Myanga / Napara, Kimaeti). `school.ward` currently says Napara.
- [ ] Settle the values. The requirements form lists six; the classroom wall
      lists a different set including Friendly, Professionalism and
      Accountability. The site uses the form's list.
- [ ] Confirm whether boarders pay more than day scholars, and what the school
      bus costs, so the fees page can stop saying "ask the office".
- [ ] Point `ststephenkimaeti.ac.ke` at the host and set `NEXT_PUBLIC_EMS_URL`.
- [ ] Bump `VERSION` in `public/sw.js` on every deploy so installed copies
      update.
