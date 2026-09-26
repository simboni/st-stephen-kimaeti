# Holy Cross Junior & Infant Schools — Bulimbo

The public website for **Holy Cross Junior and Infant Schools** (Bulimbo, Kakamega, Kenya) —
phase one of a two-part platform. Phase two is a full **education management system** (EMS);
the `/portal` page is its front door.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript** and **Tailwind CSS v4**,
exported as a fast static site.

## Pages

| Route            | Purpose                                                              |
| ---------------- | -------------------------------------------------------------------- |
| `/`              | Home — hero, stats, about, mission/vision/motto, values, academics, videos, news & events preview |
| `/about`         | The school's story, pillars, values and sections                     |
| `/admissions`    | How to enrol, classes offered, office contacts                       |
| `/news`          | News & updates listing                                               |
| `/news/[slug]`   | Individual news article                                              |
| `/events`        | Upcoming school events                                               |
| `/gallery`       | Photo gallery + Students-in-Action videos                            |
| `/contact`       | Contact info + enquiry form                                          |
| `/complain`      | Complaints form (delivered confidentially to the administration)     |
| `/portal`        | Portal login — links to the current system; becomes the EMS login    |

Plus `sitemap.xml`, `robots.txt` and JSON-LD `School` schema.

## Editing content — one file

**All content lives in [`src/lib/site.ts`](src/lib/site.ts).** School details, mission/vision,
core values, academics, admission steps, news posts, events, gallery photos and videos are all
plain typed data — edit that one file and every page updates. Items marked `SAMPLE — replace`
are realistic placeholders awaiting real school content.

To add a news post: drop an image in `public/` (optional) and add an entry to `news[]` —
its card, article page and sitemap entry are generated automatically.

## Forms

The contact and complaints forms post to [FormSubmit](https://formsubmit.co), which emails each
message to `info@holycrossbulimbo.com` with no backend needed. The first submission triggers a
one-time activation email to that inbox — click the link once and delivery is on for good.
When the EMS backend lands, point the forms at its API instead
(see `src/components/enquiry-form.tsx`).

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export → ./out
```

## Deployment

Static export (`output: 'export'`), so it deploys to any static host — Vercel, Cloudflare
Pages, Netlify, GitHub Pages or plain cPanel hosting (upload the contents of `out/`).
Set the build command to `npm run build` and the output directory to `out`.

## Phase two — education management system

The EMS (admissions, attendance, CBC assessments, fees & M-PESA, timetables, messaging) will be
built as the platform's second part. The website is deliberately structured for it:

- `/portal` is the login entry point — swap its link to the EMS URL when live.
- Content in `src/lib/site.ts` (news, events) can later be fetched from the EMS API instead.
- The design system in `src/app/globals.css` carries the school's brand into the EMS UI.
