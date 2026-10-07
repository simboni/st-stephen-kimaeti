<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# St Stephen's, Kimaeti — read this before you touch anything

Two applications for one school in Bungoma County, Kenya, built for Peter
Misiati, who is selling this work to other schools. Read `README.md` for the
build, `docs/WEBSITE.md` and `docs/EMS-PLAN.md` for how each half works, and
`docs/DEPLOY-CONTABO.md` to put it on a server.

```
apps/website   public site. Next.js, output: "export" — static files only.
apps/ems       school management system. Next.js + Prisma + PostgreSQL.
tools/         the accessibility audit and the photo pipeline. Own package.json.
deploy/        contabo/ (a school's own server) and shared-server/ (one that
               already runs something else).
docs/school/   what the school actually told us. The source of truth for facts.
```

## Four rules that are not negotiable

**1. Never invent a fact about this school.** Not a learner count, not a grade
range, not a fee, not a term date, not a phone number. If it is not in
`docs/school/`, in `src/lib/site.ts`, or in a message from the school, it does
not go on the page. Where something is unknown the copy says so in plain words
("the school has not yet published a fee structure for Grade 4 to Grade 6")
rather than filling the gap. Real parents make decisions about real children
from these pages.

**2. School identity is data, not code.** Names, contacts, crests, mottoes,
admission prefixes and fees live in `apps/website/src/lib/site.ts` and in the
EMS `SchoolSetting` row — never typed into a component. This platform is meant
to run a second school. Every time this rule has been broken it has cost real
money: admission numbers read `HC-` for two days after the rename because the
prefix was hard-coded in six places, and the site header went on showing the
old school name after every other page had changed because the name was typed
into the JSX. Before adding a school-specific string anywhere, ask whether a
second school would need a different one.

**3. Open every photograph before you write about it.** Captions written from
thumbnails in this project called an open-air Mass "morning assembly", an
oxygen-atom model "the solar system", and an osmosis experiment
"chromatography". All three were wrong and all three would have been published.
Open the full-size image.

**4. Test it, then say what the test said.** `apps/website` must build and the
accessibility audit must pass before anything is pushed. The audit has caught
two functional bugs that had nothing to do with accessibility, so it is not a
formality. If something is untested, say so.

## Running things

```bash
# website
cd apps/website && npm run build          # static export into out/

# accessibility — 14 pages x 2 themes x 2 widths, plus a 404 check
cd tools && npm install
SITE_OUT=../apps/website/out \
CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node a11y.mjs

# EMS (needs DATABASE_URL, AUTH_SECRET and
# NEXT_SERVER_ACTIONS_ENCRYPTION_KEY exported, or it answers
# "This page couldn't load")
cd apps/ems && npm run build && npm run start      # port 3001
```

Database changes are **never** made with `prisma migrate dev`. Generate the SQL
against a shadow database and commit it:

```bash
prisma migrate diff --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "$SHADOW_URL" --script \
  > prisma/migrations/<timestamp>_<name>/migration.sql
prisma migrate deploy
```

## Where this is deployed, and what is wrong with each one

**Website — GitHub Pages.** <https://simboni.github.io/st-stephen-kimaeti/>,
from `.github/workflows/website-pages.yml` on every push to `main`. It builds
with `NEXT_PUBLIC_SITE_PREVIEW=1`, which makes the site ask not to be indexed:
it carries photographs of identifiable children and figures nobody at the
school has signed off. Drop that variable for the real launch. Pages had to be
switched on by hand once, in Settings → Pages → Source → "GitHub Actions"; the
workflow token may deploy a Pages site but may not create one.

**EMS — Render, a demonstration install.** `render.yaml` creates
`ststephen-ems` (Docker) plus a free `ststephen-ems-db`, at roughly
<https://ststephen-ems.onrender.com>. Three things about it:

- `SEED_DEMO=true`, so it is full of invented pupils and eight role accounts
  sharing the password `ststephen2026`, which is published in this repository.
  Correct for showing a client. Wrong the moment a real pupil's name goes in.
- The free database is **deleted 30 days after it is created**.
- `getSchoolSettings()` upserts with `update: {}`, so the defaults in
  `apps/ems/src/lib/school.ts` only ever apply when the row is created. An
  existing install will **never** pick up a renamed school from a redeploy.
  Changing the name in code and expecting the live instance to follow is a
  mistake that has already been made here — the school's details are changed
  in the app, under Settings → School Settings.

**EMS — the school's own server.** `deploy/contabo/setup.sh`. One
administrator with a generated password, no demo data, nightly backups,
automatic HTTPS. This is what a school that holds real records gets.

## Still unsettled

`docs/WEBSITE.md` ends with the launch checklist and
`docs/school/FEE-STRUCTURE-2026.md` records every correction the school has
sent, with dates, including where a later message replaced an earlier one.
Read both before changing anything the school told us. The large ones:

- **The spelling of the school's name.** Given on 30 Sep as
  `ST STEPEHENS BROTHER'S SCHOOL`; set as *St Stephen's Brothers' School*. Both
  of those corrections are ours, not the school's, and are unconfirmed.
- **Senior School.** The school has mentioned one. Every roll figure, fee sheet
  and letterhead we hold ends at Grade 9. Nothing may claim senior grades until
  the school says which run, with how many learners, on which CBC pathways, at
  what fees.
- **The bank account name is "St. Stefan Primary School"** and that spelling is
  deliberate — it is how KCB holds the account. Do not make it agree with the
  school's name. A transfer made out to "St Stephen" can be bounced, and a
  child then gets chased for fees the family already sent.
