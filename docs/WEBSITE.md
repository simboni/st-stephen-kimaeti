# The St Stephen's website

`apps/website` — a Next.js 16 static export. No server, no database, no build
step at request time. `npm run build` produces `out/`, which any static host
will serve: Cloudflare Pages, GitHub Pages, Netlify, or a folder behind Caddy
on the same VPS as the EMS.

```
apps/website/
  src/lib/site.ts      every word on the site
  src/lib/photos.ts    GENERATED — the photo index
  src/components/      photo, crest, header, footer, ui primitives
  src/app/             one folder per page
  public/photos/       GENERATED — 132 WebP files
tools/photos/
  process.mjs          the photo pipeline
  sources.txt          the source list the pipeline indexes into
```

## Content lives in one file

`src/lib/site.ts` holds the school's identity, the intro copy, the three
sections, the four pillars, the day-in-the-life strip, the fee tables, the
payment details, admissions steps, FAQs, news, events and testimonials. The
pages are layout and nothing else. To change what the site says, change that
file — not a page.

Everything in it came from the school's own papers (letterheads, the 2026 fee
sheets, the Term II enrolment return, the completed requirements form) except
where a comment says `SAMPLE`. **Search the file for `SAMPLE` before launch.**
As of this commit the samples are:

| What | Why it is a sample |
|---|---|
| `testimonials` | Nobody has given us a quote or permission yet. Three plausible ones stand in, and `showTestimonials` is **false**, so the home page does not render them. Replace the array with real, permitted words, then flip the flag. |
| `news` | Written from the photographs. The school must confirm dates and details. |
| `events` | A plausible term calendar. Replace with the school's own. |

Two things are deliberately **absent** rather than invented:

- **Grade 4–6 fees.** The school supplied EYE, Grade 1–3 and Junior sheets only.
  The fee table says so out loud instead of guessing.
- **The school's logo.** `components/crest.tsx` draws a placeholder roundel in
  the uniform colours. When the badge arrives, put it in `public/logo.png` and
  swap the component's body for an `<Image>`; every page uses `<Crest />` and
  none references the file, so nothing else changes.

## Photographs

The school sent 176 files over WhatsApp. After stripping `__MACOSX` junk and
perceptual duplicates, 92 distinct photographs remained; 33 are on the site.

Every caption and every piece of alt text was written after looking at the
photograph at full size, not at a contact-sheet thumbnail. That matters more
than it sounds: the first pass, written from thumbnails, called an open-air
Mass "morning assembly", a model of the oxygen atom "the solar system", and an
osmosis experiment "chromatography". If you add photographs, open them.

`tools/photos/process.mjs` is the whole pipeline. It reads a hand-picked table
of stable indices, exports each photo as WebP at 480/800/1200/1600px (never
upscaled past the original), writes a 20px inline blur placeholder, and
generates `src/lib/photos.ts` with alt text and a caption for every one.

```sh
SOURCE_DIR=/path/to/originals node tools/photos/process.mjs
```

The originals are not in this repo — 28 MB of near-duplicates. Ask Peter for
the archive if you need to re-run it. The *outputs* are committed, so the site
builds without them.

`<Photo>` renders a plain `<img srcset>` rather than `next/image`, because this
is a static export with `images.unoptimized`, where `<Image>` emits one source
and no srcset. A phone downloads the 480px file (~34 KB); a desktop hero takes
the 1600px one (~190 KB). While a file is in flight, its blur placeholder is
painted as a stretched background, so the layout never jumps. None of this
needs JavaScript.

### Adding a photograph

1. Append its path to `tools/photos/sources.txt`.
2. Add a row to `PICKS` in `process.mjs` — the line number, a slug, a category,
   alt text and a caption.
3. Re-run the pipeline and commit both generated outputs.

The gallery page groups itself by category automatically.

## Accessibility and performance

- Every photograph carries alt text written for it, not a filename.
- The FAQ accordion is `<details>`; the mobile menu is the only JavaScript the
  chrome needs.
- Scroll reveals hide content only once JS has marked `<html class="js">`, so
  nothing is invisible if scripts fail.
- `prefers-reduced-motion` switches off the Ken Burns pan, the marquee and all
  reveals.
- `NEXT_PUBLIC_BASE_PATH` is inlined at build time so `<Photo>` can prefix its
  own `src` attributes when the site is hosted under a sub-path (Next does not
  rewrite hand-written `src`).

## Still to do before launch

- [ ] Replace the three sample testimonials with real, permitted quotes.
- [ ] Confirm the news posts and the term calendar with the school.
- [ ] Get the Grade 4–6 fee sheet and add the row.
- [ ] Get the school's logo file.
- [ ] Settle the address — the letterhead, the stamp and the requirements form
      give three different places (Box 93–50200 Bungoma / Myanga / Napara,
      Kimaeti). `school.ward` currently says Napara, Kimaeti Ward.
- [ ] Confirm whether boarders pay more than day scholars, and what the school
      bus actually costs, so the fees page can stop saying "ask the office".
- [ ] Point `ststephenkimaeti.ac.ke` at the host and set `NEXT_PUBLIC_EMS_URL`.
