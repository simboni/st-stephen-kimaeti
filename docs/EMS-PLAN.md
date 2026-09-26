# Holy Cross Education Management System — Master Plan & Build Workflow

> **The platform has two parts.** Part one — the public website — is live in this repo.
> Part two is the **education management system (EMS)**: a full replacement for the
> school's current Smart School (QDOCS) installation, built for Holy Cross and for
> Kenya (CBC, terms, M-PESA, KES). This document is the plan for part two.
>
> **How to read this:** section 7 is the roadmap — numbered items we build one at a
> time. Everything before it explains the architecture and why the order matters.

---

## 1. What we are building

A web application at the school's domain where:

- the **administration** runs the school: admissions, student records, fees, exams,
  attendance, staff, payroll, communication, reports;
- **teachers** manage their classes: attendance, marks entry, homework, lesson plans,
  timetable, leave;
- **parents and pupils** log in to see: fee statements and receipts, report cards,
  attendance, homework, notices, the school calendar;
- the **public website** (already built) feeds from it over time: online admission
  enquiries, news, events, and the complaints form all land inside the EMS.

The reference feature set is the school's current Smart School instance (screenshots
audited July 2026). We are not cloning it blindly — we rebuild the features the school
actually uses, adapted to Kenya's CBC system, with a cleaner UI in the school's brand.

## 2. Reference: the current system's module inventory

Modules and submenus observed in the live Smart School installation
("Holy Cross Junior School Bulimbo", session 2025-2026, currency KES, 18 staff):

| # | Module | Submenus |
|---|--------|----------|
| 1 | Front Office | Admission Enquiry, Visitor Book, Phone Call Log, Postal Dispatch/Receive, Complain, Setup |
| 2 | Student Information | Student Details, Admission, Online Admission, Disabled Students, Multi-Class, Bulk Delete, Categories, Houses, Disable Reasons |
| 3 | Fees Collection | Collect Fees, Offline Bank Payments, Search Payments, Search Dues, Fees Master, Fees Group, Fees Type, Discounts, Carry Forward, Reminders |
| 4 | Income | Add/Search Income, Income Heads |
| 5 | Expenses | Add/Search Expense, Expense Heads |
| 6 | Examinations | Exam Group, Schedule, Results, Admit Cards (design/print), Marksheets (design/print), Marks Grade, Marks Division |
| 7 | Attendance | Student Attendance, Approve Leave, Attendance By Date |
| 8 | Online Examinations | Online Exam, Question Bank |
| 9 | Academics | Class Timetable, Teachers Timetable, Assign Class Teacher, Promote Students, Subject Groups, Subjects, Classes, Sections |
| 10 | Lesson Plan | Copy Old Lessons, Manage Lesson Plan, Syllabus Status, Lessons, Topics |
| 11 | Human Resource | Staff Directory, Staff Attendance, Payroll, Leave (apply/approve/types), Teachers Rating, Departments, Designations, Disabled Staff |
| 12 | Communicate | Notice Board, Send Email, Send SMS, Logs, Scheduled Logs, Login Credentials Send, Email/SMS Templates |
| 13 | Download Center | Content Types, Share Lists, Upload/Share Content, Video Tutorials |
| 14 | Homework | Add Homework, Daily Assignment |
| 15 | Library | Book List, Issue–Return, Add Student/Staff Members |
| 16 | Inventory | Issue Item, Add Stock, Items, Categories, Stores, Suppliers |
| 17 | Transport | Fees Master, Pickup Points, Routes, Vehicles, Assign Vehicle, Route Pickup Points, Student Transport Fees |
| 18 | Hostel | Hostels, Room Types, Rooms |
| 19 | Certificate | Student Certificates & ID Cards, Staff ID Cards (design + generate) |
| 20 | Front CMS | Website content management (superseded by our Next.js site) |
| 21 | Alumni | Manage Alumni, Alumni Events |
| 22 | Reports | Per-module reports + User Log + Audit Trail |
| 23 | System Settings | General, Session, Notifications, SMS, Email, Payment Methods, Print Header/Footer, Roles & Permissions, Backup/Restore, Languages, Currency, Users, Modules, Custom Fields, and more |

Roles observed: **Super Admin, Admin, Teacher, Accountant, Librarian, Receptionist**
(+ Student and Parent portal logins).

## 3. How we will work — the item loop

The system is interlinked, so we build in dependency order, one item at a time:

1. **I build one roadmap item** on a feature branch, with seed/demo data so it's
   testable the moment it deploys.
2. **You test it** on the deployed app against the item's *"Test this"*
   checklist, using the demo logins.
3. **You report** what's wrong or what should change → I fix → you re-test.
4. **We check the item off** in this document (its checkbox gets ticked in a commit)
   and start the next one.

Ground rules that keep us sane:

- **One item in flight at a time.** No half-finished modules.
- **The roadmap is the source of truth.** New ideas get added as items, not smuggled
  into the current one.
- **Every item ships with demo data** (a seed script) so testing never starts from a
  blank screen.
- **Nothing real is deleted** — records are deactivated/archived (like Smart School's
  "disable" pattern), and every sensitive action is written to the audit log (built in
  item 0.1, visible from day one).

### Platform verification record — 12 Jul 2026

A full compatibility sweep ran against one final production build (commit series
through items 0.1–5.3):

- **All 12 module E2E suites green** against a single fresh-seeded database, in
  dependency order: 0.1 auth/users/RBAC/audit (12), 0.2 settings/sessions (10),
  logo upload (8), 1.1 classes (13), 1.2 subjects (11), 1.3 timetable (10),
  2.1 students (17), 2.2 portal logins (11), 3.1 attendance (9), 4.1+4.2 fees (14),
  4.4 finance (16), 5.1–5.3 exams/report cards (23) — **154 checks**.
- **Fresh-database bootstrap**: empty migrated DB with no seed → first request
  self-heals (users, permission matrix incl. exams + finance, school profile,
  session, classes, subjects, pupils, fees, finance heads); superadmin login and
  every module page verified on the bootstrapped DB.
- **No-DB build**: the production build compiles with an unreachable DATABASE_URL
  (the build must never need the database).
- **Mobile width audit**: EMS — 27/27 pages no horizontal overflow at 390 px;
  website — 10 pages × 5 widths (320–768 px) all clean.
- **Lint**: both apps clean.

Cross-module coordination covered by the suites: fees ↔ finance (ledger folds in
live fee collections), attendance ↔ report cards (summary line), exams ↔ portals
(publish gates parent/pupil access), parents ↔ fees/attendance/exams on one
dashboard card per child.

## 4. Architecture

### Recommended stack (decision D1 — confirm before item 0.1)

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 16 (App Router, full-stack)** — same as the website | One language (TypeScript) across the whole platform; server actions + route handlers give us the API; runs anywhere Node runs |
| Database | **PostgreSQL** (self-hosted, same server) | Relational fits school data; local queries need no network hop; `pg_dump` backups the school owns |
| ORM | **Prisma** | Typed schema = living data-model documentation; safe migrations per item |
| Auth | **Auth.js (credentials) + role-based access control** | Username/password logins the office can issue; roles mirror Smart School's |
| UI | Tailwind CSS v4, same design system as the website | The school's brand everywhere; shared components |
| PDFs (receipts, report cards, ID cards) | Server-side HTML→PDF | Print-perfect documents from the same templates we show on screen |
| Email | Nodemailer over the school's SMTP (or Resend) | Notices, credentials, receipts |
| SMS | **Africa's Talking** (decision D3) | The Kenyan standard; cheap, reliable sender IDs |
| Payments | **M-PESA Daraja API** — STK Push + C2B Paybill reconciliation (decision D4) | How parents actually pay; auto-receipt on callback |

**Alternative considered:** Laravel API + separate Next frontend. Solid, but two
codebases and two deploys for a one-developer team; only worth it if you strongly
prefer PHP on the server. Say so at D1 and the roadmap stays identical — only the
implementation notes change.

### Repository layout (monorepo — restructured in item 0.1)

```
hollycrossbulimbo/
├─ deploy/contabo/        # one-server provisioning: Caddy, Postgres, systemd, backups
├─ apps/
│  ├─ website/            # the public site (moves from repo root, unchanged)
│  └─ ems/                # the EMS Next.js app
│     ├─ prisma/          # schema + migrations + seed
│     └─ src/
│        ├─ app/          # (portal) parent/student · (staff) admin/teacher areas
│        ├─ components/
│        └─ lib/          # auth, rbac, money, dates, mpesa, sms, pdf
└─ docs/EMS-PLAN.md       # this file — the living roadmap
```

The whole platform runs on **one Ubuntu VPS the school owns**: Caddy serves the
static website and reverse-proxies the EMS, PostgreSQL runs locally bound to
localhost, and the EMS runs under systemd. `deploy/contabo/setup.sh` provisions
it; `docs/DEPLOY-CONTABO.md` is the runbook. One fixed monthly cost, no service
that sleeps, and the pupil data sits on hardware the school controls.

## 5. The core data model — and why the build order matters

Everything in a school system hangs off a small spine. Get the spine right and every
module afterwards is "just" screens over it:

```
AcademicSession (2025-2026)         ← everything is scoped to a session
 └─ Term (1 · 2 · 3)                ← Kenyan calendar, not semesters
Class (PP1 … Grade 9)  ──┐
 └─ Section/Stream (A, B)├─→ Enrollment (student ↔ class+section ↔ session)
Subject ─────────────────┘      ↑
Student ── Guardian(s) ─────────┘
Staff ── Department · Designation · Role
```

Interlinks that dictate sequencing:

- **Attendance, fees, exams, homework all reference an Enrollment**, not a bare
  student — that's how history survives promotion between sessions. So academic
  structure (phase 1) and students (phase 2) must precede all of them.
- **Fee allocation = fee structure × enrollment** (class-based) ± discounts; a
  payment settles allocations and prints a receipt; M-PESA is "just" a payment
  source. So fees setup precedes collection, which precedes M-PESA.
- **Report cards join marks (exams) with attendance and teacher remarks** — exams
  and attendance come before report-card printing.
- **Payroll reads staff attendance and approved leave** — HR directory precedes
  staff attendance, which precedes payroll.
- **Every module posts to Communicate** (notices/SMS/email) and **Reports** — both
  are built as shared services early (0.1, 7.x) and each module plugs into them.

## 6. Roles & permissions

Same roles as today so nobody has to relearn their job:

| Role | Scope |
|------|-------|
| Super Admin | Everything, including settings, roles, backups |
| Admin | Day-to-day administration; no destructive settings |
| Accountant | Fees, income/expenses, payroll, finance reports |
| Teacher | Own classes: attendance, marks, homework, lesson plans, leave |
| Receptionist | Front office: enquiries, visitors, calls, complaints |
| Librarian | Library module |
| Parent | Own children: fees, results, attendance, homework, notices |
| Student | Own record: results, attendance, homework, downloads, notices |

Permissions are per-module **view / create / edit / archive** flags per role
(editable matrix, like Smart School's Roles & Permissions screen), enforced on the
server, not just hidden in the UI.

## 7. The roadmap

> Legend: each item lists what it delivers, what it depends on, and how you test it.
> We tick the boxes as items pass your testing. Items are sized to be one review each.

### Phase 0 — Foundation *(everything depends on this)*

- [x] **0.1 Monorepo + app shell + login + users + audit log** ✅ *tested & accepted 11 Jul 2026*
  Restructure repo to `apps/website` + `apps/ems`; wire up deployment for the two
  apps plus Postgres (now `deploy/contabo/`); EMS app boots with: login page (school brand), Auth.js
  credentials, user management (create/disable users, reset passwords), the eight
  roles with a permissions matrix, role-aware dashboard skeleton with sidebar
  navigation, and an audit-log table recording every login and admin action.
  *Depends on:* nothing. *Test:* log in as each demo role; create a user; disable
  them; watch the audit trail; confirm the website still deploys untouched.

- [x] **0.2 School settings + academic sessions & terms**
  General settings (name, logo, address, phone, currency KES, timezone); create
  academic sessions (2025-2026, 2026-2027) with Terms 1–3 and their dates; set the
  active session; session selector in the header (like Smart School's).
  *Depends on:* 0.1. *Test:* edit school details, create next session with term
  dates, switch active session.

### Phase 1 — Academic structure

- [x] **1.1 Classes, streams & class teachers**
  Classes PP1→Grade 9, streams/sections per class, assign class teacher(s) per
  stream per session.
  *Test:* recreate the school's real class list; assign teachers.

- [x] **1.2 Subjects & subject groups**
  CBC learning areas (subjects) with codes and type (core/optional); subject groups
  binding subjects to classes; assign subject teachers.
  *Test:* enter the school's real learning areas per level.

- [x] **1.3 Timetables**
  Build class timetable (day, period, subject, teacher, room); auto-derive each
  teacher's timetable; clash warnings; printable views.
  *Test:* enter one real class timetable; check the teacher view catches a clash.

### Phase 2 — Students

- [x] **2.1 Student admission & profiles**
  Admission form (admission no., UPI/NEMIS no., photo, DOB, gender, category, house,
  religion, address) + guardians (father/mother/other, phone, occupation) + documents
  upload + medical notes; searchable student directory with filters; profile page
  with tabs that later modules fill in (fees, attendance, exams…); archive with
  reason (never hard-delete).
  *Depends on:* 1.1. *Test:* admit three demo pupils, search, edit, archive one.

- [x] **2.2 Parent & student portal logins**
  Generate portal credentials (single or in bulk per class); parent sees all their
  children on one login; student sees self; profile + published timetable visible.
  *Depends on:* 2.1. *Test:* log in as parent of two children; as a pupil.

- [x] **2.3 Promotion & session transitions** *(built & E2E-verified 12 Jul 2026 — 14 checks)*
  One-screen year-end promotion: every pupil moves a class up into the chosen target
  session, per-pupil **Repeat** keeps them in the current class, and top-class pupils
  graduate (archived with reason "Graduated <session>", alumni-eligible for 9.7).
  Optional carry-forward posts each pupil's outstanding balance into the new session
  as a "Balance b/f" adjustment. Idempotent — re-runs skip anyone already placed.
  Enrollment history preserved per session (verified by switching active sessions).
  *Depends on:* 2.1, 0.2. *Test:* promote a demo class to 2026-2027; check history.

- [ ] **2.4 Online admission (website → EMS)**
  Admission application form on the public website posting into the EMS as an
  enquiry/application queue (review → approve → becomes admission with number
  auto-assigned).
  *Depends on:* 2.1. *Test:* apply from the live website; approve into a real admission.

### Phase 3 — Attendance

- [x] **3.1 Student attendance**
  Class-teacher daily register (present/late/absent/half-day) with one-tap "all
  present"; attendance-by-date view; per-pupil percentage; month grid report;
  parents see their child's record in the portal.
  *Depends on:* 2.1. *Test:* mark a class register for a week; check the portal view.

- [x] **3.2 Student leave** *(built & E2E-verified 12 Jul 2026 — 13 checks)*
  Parents (and pupils) request absence permission from the /absence self-service
  page (linked children only, own data — no module permission needed); teachers/
  admin approve or reject with notes from Attendance → Pupil Leave; approved days
  auto-mark the register "Absent — approved leave" for working days in the range.
  *Depends on:* 3.1. *Test:* apply as parent, approve as teacher, verify register.

### Phase 4 — Fees & finance *(the module the office feels daily)*

- [x] **4.1 Fees setup** *(built & E2E-verified 12 Jul 2026)*
  Vote heads (fee types: Tuition, Examinations, Lunch, Boarding, Activity…) and the
  fee structure: amounts per session/term, per class or all classes, day/boarder
  scoped; archive/restore lines; per-pupil discounts & extra charges.
  *Depends on:* 2.1, 0.2. *Test:* set up the school's real Term 1 fee structure.

- [x] **4.2 Fee collection & receipts — vote-head based** *(built 12 Jul 2026; upgraded to
  vote-head collection the same day — 19-check suite + legacy regression)*
  **Collections are guided by vote heads**: the cashier screen shows each pupil's
  balance per vote head (charged / adjustments / paid / balance, reconciling to the
  overall total) and payments are recorded as full or partial amounts against one or
  several heads on a single numbered receipt (allocation lines printed on it).
  Discounts can target a specific head or apply generally. Fill-all-outstanding
  shortcut, live receipt total, dues list per stream, voids restore per-head
  balances, parents see the live balance in the portal.
  **Arrears (added 12 Jul 2026 — 18-check suite):** charges accumulate per term
  within the session (unpaid Term 1 money never disappears — nothing to re-bill);
  payments settle the oldest charges first, and each account shows a **Term
  position** table: charged / settled / outstanding per term with Arrears,
  Current-term and Cleared tags, plus an "incl. arrears" flag on the balance and
  an Arrears column + total on the dues list. Session-wide charges, adjustments
  and brought-forward balances fall due immediately, so year-end carry-forwards
  (2.3) show as arrears from day one of the new session.
  *Depends on:* 4.1. *Test:* collect full & partial payments per vote head, print the
  receipt, pull the defaulters list, check a parent's statement.

- [ ] **4.3 Fee reminders** *(M-PESA deferred — decision D4)*
  SMS/email fee reminders to defaulters (manual trigger + scheduled), balance
  summaries to parents. M-PESA STK Push / Paybill reconciliation moved to a later
  item (4.5, unscheduled) — the collection screen in 4.2 already handles cash and
  bank-slip payments, so nothing blocks on it.
  *Depends on:* 4.2, 7.2 (uses the messaging service).
  *Test:* send reminders to a demo defaulters list; check the delivery log.

- [x] **4.4 Income & expenses** *(built & E2E-verified 12 Jul 2026 — 16 checks)*
  Income heads / expense heads (archivable chips); ledger entries with reference +
  void-with-reason (never edited); monthly summary cards including fees collected
  pulled live from the Fees module; month navigation; finance module permissions
  (Admin + Accountant full). Attachments and the dashboard chart move to the
  reports phase.
  *Depends on:* 0.2. *Test:* enter a month of demo income/expenses; read the summary.

### Phase 5 — Examinations & report cards

- [x] **5.1 Exam setup** *(built & E2E-verified 12 Jul 2026 — part of the 23-check 5.x suite)*
  Exams per term (name, marked-out-of, duplicate-name guard) with the **CBC
  performance levels (EE ≥80 / ME 60–79 / AE 40–59 / BE <40)** as the fixed grade
  scale (`lib/cbc.ts`); publish/unpublish + archive controls. Per-subject exam
  timetabling stays optional and can join a later polish pass.
  *Depends on:* 1.2, 2.1, 0.2. *Test:* configure a real end-term exam.

- [x] **5.2 Marks entry & results** *(built & E2E-verified 12 Jul 2026)*
  Whole-stream marks grid per subject (single-submit like the attendance register),
  absent flag, out-of-range scores rejected; results overview per stream with
  per-subject scores, totals, averages and competition-ranked positions.
  Teachers enter marks; publishing stays an Admin action (exams:edit).
  *Depends on:* 5.1. *Test:* enter marks for a class across subjects; check totals,
  averages and positions.

- [x] **5.3 Report cards** *(built & E2E-verified 12 Jul 2026)*
  Printable CBC report card (school header + logo, per-subject scores, levels &
  remarks, total/average/overall level/position, attendance summary, class-teacher
  remark + head's signature line, next-term start date, motto footer); batch-print
  a whole stream with page breaks; publish-to-portal per exam — parents and pupils
  get report-card links on their dashboards, and direct URLs bounce to /denied
  while unpublished. Admit cards deferred to the exams polish pass with 4.3.
  *Depends on:* 5.2, 3.1. *Test:* print one pupil's card and a class batch; view as
  parent after publishing.

### Phase 6 — Staff & HR

- [x] **6.1 Staff directory** *(built & E2E-verified 12 Jul 2026 — part of the 31-check 6.x suite)*
  Staff profiles with auto employee numbers (ST-001…), designation/department/
  qualification/contacts, searchable directory with archived filter, link/unlink an
  existing login (unlocks self-service), archive with reason. Photos and document
  uploads deferred to a later polish pass.
  *Depends on:* 0.1. *Test:* enter the school's real staff list (18).

- [x] **6.2 Staff attendance & leave** *(built & E2E-verified 12 Jul 2026)*
  Daily staff register (single-submit, mark-all-present, ON_LEAVE status); leave
  types with annual quotas (Kenya defaults: Annual 21, Sick 14, Maternity 90,
  Paternity 14, Compassionate 5); apply → approve/reject with notes; balances count
  working days (Mon–Fri) per calendar year; approval auto-fills the register with
  On leave; **/my-leave self-service** for any linked login (own data only, no
  staff-module permission needed) plus a dashboard card.
  *Depends on:* 6.1. *Test:* mark a week's register; run one leave request through.

- [x] **6.3 Payroll** *(built & E2E-verified 12 Jul 2026 — 15 checks)*
  Salary structure per staff (basic + allowances − NSSF/SHIF/PAYE/other, entered
  not computed); monthly run generated as an immutable snapshot (drafts deletable
  for regeneration, one run per month); printable payroll register + payslips with
  the school header; **mark-paid posts the gross total to Income & Expenses**
  under Salaries & Wages with a PAYROLL-YYYY-MM reference. New "payroll" module
  (Admin + Accountant full).
  *Depends on:* 6.2, 4.4 (posts to expenses).
  *Test:* run a demo month's payroll and print a payslip.

### Phase 7 — Communication

- [x] **7.1 Notice board & calendar** *(built & E2E-verified 12 Jul 2026 — part of the 25-check 7.1+8.1 suite)*
  Notices targeted by audience (everyone / staff / parents / pupils) with optional
  expiry and archive; school calendar events (date ranges, audience-scoped); both
  render as dashboard widgets for every role, filtered to that role's audience.
  Per-class targeting joins when messaging (7.2) lands.
  *Depends on:* 0.1. *Test:* post a parents-only notice; verify a teacher doesn't see it.

- [ ] **7.2 Email & SMS center**
  Templates with placeholders ({name}, {balance}, {class}); send to individuals,
  classes or role groups; delivery log; scheduled sends; "send login credentials"
  bulk action; Africa's Talking + SMTP wiring.
  *Depends on:* 7.1. *Test:* send templated email + SMS to a demo group; check logs.

### Phase 8 — Teaching & learning

- [x] **8.1 Homework & assignments** *(built & E2E-verified 12 Jul 2026)*
  Teacher posts homework per stream/subject with due date (subject list validated
  against the class's subject group); pupils see it on their dashboard and mark it
  done (with an optional note); parents see each child's open homework; teacher
  reviews the class list (done / not done / evaluated) and evaluates with remarks
  that flow back to the pupil. Attachments join with the download center (8.3).
  *Depends on:* 2.2, 1.2. *Test:* full homework round-trip as teacher → pupil → teacher.

- [ ] **8.2 Lesson plans & syllabus tracking**
  Lessons & topics per subject per class; weekly lesson plan; syllabus completion
  percentages; copy from previous session.
  *Depends on:* 1.2, 1.3. *Test:* plan two weeks; tick topics complete; read progress.

- [ ] **8.3 Download center**
  Categorised study materials/documents shared to classes or staff; visible in portals.
  *Depends on:* 2.2. *Test:* share a revision paper to one class only.

- [ ] **8.4 Online examinations**
  Question bank (MCQ/true-false/short answer) by subject/class; timed online exams;
  auto-marking of objective questions; results feed the exams module.
  *Depends on:* 5.1, 2.2. *Test:* sit a demo quiz as a pupil; confirm auto-marks.

### Phase 9 — School operations

- [ ] **9.1 Library** — catalogue, member cards (pupils/staff), issue–return with due
  dates & fine calculation. *Test:* issue and return a book, one overdue.
- [ ] **9.2 Inventory** — items, categories, stores, suppliers, stock in/out, issue to
  staff/rooms, low-stock alerts. *Test:* receive stock and issue items.
- [ ] **9.3 Transport** — routes, pickup points, vehicles & drivers, pupil
  assignments, transport fees feeding module 4. *Test:* assign pupils to a route and
  bill them.
- [ ] **9.4 Hostel/Boarding** — hostels, room types, rooms & beds, pupil allocation,
  boarding fees feeding module 4. *Test:* allocate boarders to rooms.
- [ ] **9.5 Certificates & ID cards** — template designer (school header, fields,
  photo, QR verification), batch-generate pupil/staff ID cards and certificates as
  PDFs. *Test:* print a class's ID cards.
- [x] **9.6 Front office** *(built & E2E-verified 12 Jul 2026 — 25 checks incl. cross-app)*
  Admission/general enquiries with statuses (new → follow-up → won/lost), notes and
  follow-up dates; complaints register with resolve-with-note; visitor book with
  sign-in/out; phone-call log; postal dispatch/receive. **The website's complaint
  AND contact forms now post straight into the EMS** via a public rate-limited API
  (5/hour/IP, honeypot, CORS) with FormSubmit email kept as a backup channel; each
  arrival is audit-logged as website_complaint/enquiry_received. New "frontoffice"
  module (Admin + Receptionist full).
  *Depends on:* 0.1. *Test:* log an enquiry through to "won"; submit a complaint
  from the live website and see it land.
- [ ] **9.7 Alumni** — leavers' register with contacts, alumni events. *Test:* promote
  Grade 9 leavers into alumni; record an event.

### Phase 10 — Reports, migration & go-live

- [x] **10.1 Reports center & dashboards** *(rebuilt as interactive catalog & E2E-verified 12 Jul 2026 — 18 checks)*
  Reports is now a categorized catalog (matching the Smart School layout the school
  knows): Student Information (Student, Guardian, Class & Stream, Admission, Leavers),
  Finance (Balance Fees, Fees Collection, Daily Collection, Income, Expense,
  Income & Expense Summary, Payroll), Attendance (pupil register grid, staff
  attendance), Examinations (results per exam/stream) and Human Resource (staff,
  leave) — 17 reports. Each opens on-screen below its filters (stream/exam/month/date
  range/payroll run, sensible defaults so the first view always renders), with summary
  chips, a formatted table (money right-aligned KES, 20 rows per page with
  Prev/Next preserving filters) and a Download CSV button rendering the exact same
  data (single shared `buildReport()` layer). Narrowing filters per report
  (empty = All): class/grade + gender + day/boarder on Student Report, class on
  Guardian Report, gender on Admissions, exit type on Leavers, class + boarding +
  owing/cleared on Balance Fees (chips always describe exactly the listed pupils),
  payment method + vote head on Fees Collection (with an "Allocated to <head>"
  chip), and status on Leave. Guarded on screen and export (403
  without permission, 400 on bad params, 404 on unknown report). Dashboards keep
  their operating widgets. Reports for later modules (library, inventory, transport,
  hostel) join as those modules are built.
  *Depends on:* the modules it reports on. *Test:* pull each report against demo data.

- [ ] **10.2 Data migration & launch**
  Export real data from Smart School (students, guardians, classes, fee balances,
  staff) → import scripts → verification checklists; automated DB backups + restore
  drill; domain cutover: EMS at `ems.holycrossbulimbo.com` (website `/portal` page
  links to it), website moved onto the school's root domain once Smart School is
  retired; staff training notes per role.
  *Depends on:* everything the school needs live on day one (minimum: phases 0–5).
  *Test:* dry-run migration; spot-check 20 pupils' balances against the old system.

### Build order at a glance

```
0.1 → 0.2 → 1.1 → 1.2 → 1.3
              └→ 2.1 → 2.2 → 2.3 → 2.4
                   ├→ 3.1 → 3.2
                   ├→ 4.1 → 4.2 → 4.3
                   └→ 5.1 → 5.2 → 5.3
0.1 → 6.1 → 6.2 → 6.3
0.1 → 7.1 → 7.2        (7.2 unlocks 4.3's reminders)
2.2 → 8.1 · 8.2 · 8.3 · 8.4
9.x  anytime after their dependencies (9.6 after 0.1)
10.x last
```

Phases 6–9 can be re-ordered to match the school's urgency — say the word during
testing and we shuffle.

## 8. Cross-cutting standards (apply to every item)

- **Audit trail** — who did what, when, from where; immutable; Super Admin can view.
- **Soft delete only** — archive + reason; restore possible; bulk-delete is
  Super-Admin-only and still archives.
- **Money** — integer cents, KES formatting, no floating point; every financial row
  is created-by-stamped and never edited after receipt printing (reversals instead).
- **Dates** — Africa/Nairobi timezone everywhere; term-aware date pickers.
- **Files** — uploads (photos, documents, attachments) go to object storage with
  type/size validation; never into the database or git.
- **Printing** — every printable (receipt, report card, ID, payslip) uses the school
  print header/footer set in 0.2.
- **Security** — server-enforced RBAC, hashed passwords, rate-limited logins, CSRF
  protection, per-role session timeouts; parents/pupils can only ever reach their
  own records.
- **Seed data** — `prisma/seed` maintains the demo school (roles, one class per
  level, ~30 demo pupils, fee structures) so every deploy is instantly testable.

## 8b. SaaS trajectory

The long-term ambition is to offer this EMS to other schools as a product. We are
not building multi-tenancy now (it would slow every item down), but every item is
built so the pivot is cheap:

- **School identity is data, not code** — name, motto, contacts, currency and the
  uploaded logo live in the `SchoolSetting` row and flow into every screen and
  printout. A second school = a second row (plus a tenant id).
- **No school-specific hardcoding** in the EMS beyond seed defaults.
- **Uploads live in the database/object storage**, never baked into the app bundle.
- When the time comes: add a `schoolId` to every table, subdomain-based tenant
  resolution, per-tenant admins, and a billing plan — a contained project on top of
  what we're building, not a rewrite.

## 9. Kenya-specific adaptations (differences from Smart School)

- **CBC assessment** — performance levels (EE/ME/AE/BE) and strand-based remarks on
  report cards, alongside raw marks; Grade 1–9 naming, not "Class 1–8".
- **Terms, not semesters** — three terms with half-term breaks; fee structures and
  exams are term-scoped.
- **M-PESA first** — STK Push + Paybill reconciliation as the primary online payment
  method (card gateways can come later, if ever).
- **Africa's Talking SMS** — bulk SMS with sender ID, the way Kenyan schools actually
  reach parents.
- **UPI/NEMIS number** on every pupil record; KRA PIN, NSSF, SHIF fields on staff.

## 10. Open decisions — need your word before item 0.1

| # | Decision | Recommendation |
|---|----------|----------------|
| # | Decision | Status |
|---|----------|--------|
| D1 | Stack | ✅ **Decided: Next.js full-stack monorepo** (TypeScript, PostgreSQL + Prisma) |
| D2 | Hosting | ✅ **Decided: self-hosted VPS** — website, EMS and PostgreSQL on one Ubuntu server the school owns (was Render + Neon; dropped before any real data, see `docs/DEPLOY-CONTABO.md`) |
| D3 | SMS provider account (Africa's Talking sender ID?) | Open — needed by 7.2 |
| D4 | M-PESA | ✅ **Decided: deferred.** Fees run on cash/bank-slip receipts; M-PESA becomes a later item when the school is ready |
| D5 | EMS URL | ✅ **Decided: `ems.holycrossbulimbo.com`** subdomain, served by Caddy on the school's own server |
| D6 | Data migration source: Smart School DB export or CSVs | Open — needed by 10.2 |

Auth implementation note: item 0.1 uses lean signed-cookie credentials auth (JWT in
an httpOnly cookie) rather than pulling in an auth framework — fewer moving parts,
same security properties, easy to swap later if ever needed.

---

*This is a living document — checkboxes get ticked as items pass your testing, and
scope changes are edited in, so the plan always reflects reality.*
