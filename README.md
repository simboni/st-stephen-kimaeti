# St Stephen's School, Kimaeti — platform

The website and school management system for **St Stephen Mixed Day and
Boarding Primary School, Junior School & Early Years of Education Centre**,
Kimaeti, Bungoma — run by the Brothers of St Charles Lwanga.

| App | Path | What it is |
|-----|------|-----------|
| **Website** | [`apps/website`](apps/website) | Public site — home, about, admissions, news, events, gallery, contact, complaints, portal entry |
| **EMS** | [`apps/ems`](apps/ems) | Management system — pupils, attendance, exams, fees, finance, staff, payroll, front office, reports |

Built from the platform first delivered for Holy Cross Bulimbo. School identity
is data rather than code, so one codebase serves both schools.

## The school, from its own documents

| | |
|---|---|
| Levels | Early Years (Playgroup, PP1, PP2), Primary (Grade 1–6), Junior (Grade 7–9) |
| Enrolment | 525 — 250 boys, 275 girls (Term II 2026) |
| Boarders | 157, about 30% of the roll |
| Classes | 12 |
| Fee voteheads | 15 |
| Bank | KCB 1117950980 |
| M-PESA | Lipa Karo paybill 522123, account `51180K` + pupil name |

**Grade 9 is the highest class — there is no Senior School.** The enrolment
return, every fee sheet and every letterhead agree. That matters: CBC senior
pathways, where learners in one class sit different subjects, would have been
the largest piece of new development, and they are not needed here.

Details in [`docs/school/ENROLMENT-2026.md`](docs/school/ENROLMENT-2026.md) and
[`docs/school/FEE-STRUCTURE-2026.md`](docs/school/FEE-STRUCTURE-2026.md).

## Deployment

The whole platform — website, EMS and database — runs on one Ubuntu server.

```bash
# a server dedicated to this school
WEBSITE_DOMAIN=ststephenkimaeti.ac.ke EMS_DOMAIN=ems.ststephenkimaeti.ac.ke \
LETSENCRYPT_EMAIL=you@example.com bash deploy/contabo/setup.sh

# a server that already runs something else — preflight changes nothing
bash deploy/contabo/preflight.sh
bash deploy/shared-server/integrate.sh
```

Runbook: [`docs/DEPLOY-CONTABO.md`](docs/DEPLOY-CONTABO.md).

Production installs create a single `superadmin` from `ADMIN_PASSWORD` and no
sample data. `SEED_DEMO=true` is for demonstration installs only — it creates
accounts that share a password published in this repository.

## Still to confirm with the school

1. **The Grade 4–6 fee structure** is missing; we have Early Years, Grade 1–3
   and Junior only.
2. **Boarding has no premium.** The boarding sheet repeats the junior day
   figures, yet 157 pupils board. What does a boarder actually pay?
3. **Transport is not charged by route.** Bus maintenance is billed to every
   pupil at 300 a term, including those who never use a bus — yet transport is
   the principal's headline request.
4. **The boarding sheet's totals are wrong** on three rows. The errors cancel
   out, so the grand total still reads 41,850 and nobody has noticed. Which
   column is authoritative?
5. **Stream names.** 48 pupils in Grade 1 implies more than one stream, but the
   enrolment return counts by grade only.
6. **Location.** The letterhead says Box 93–50200 Bungoma, the administrator's
   stamp says Myanga, and the requirements form says Napara, Kimaeti.
7. **Parts B and C of the requirements document** are unanswered — academic
   calendar, staff, attendance, assessment, communication and migration.

## Local development

```bash
cd apps/ems     && npm install && npm run dev    # http://localhost:3001
cd apps/website && npm install && npm run dev    # http://localhost:3000
```

The EMS needs PostgreSQL and a `DATABASE_URL`. See
[`docs/EMS-PLAN.md`](docs/EMS-PLAN.md) for the roadmap, and read
[`AGENTS.md`](AGENTS.md) before changing any Next.js code.
