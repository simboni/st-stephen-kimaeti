# Competitive Assessment — eBingwa vs Holy Cross EMS

*Swept 12 Jul 2026 from ebingwa.co.ke / ebingwa.com public pages and search-indexed
content (the site blocks automated fetching, so claims are reconstructed from their
indexed marketing pages and third-party directories). This document feeds the roadmap
— items adopted from it are tracked in EMS-PLAN.md.*

## 1. What eBingwa is

A **free, multi-tenant SaaS** school management system for Kenyan schools ("free
school operating system"): no setup fees, no subscriptions, monetized through
optional services. Built for CBC schools; claims most schools launch core modules
in 4–6 weeks using "Kenyan-ready templates".

**Advertised feature set:**

| Area | Their claim |
|---|---|
| Admissions & records | Full pupil profiles (guardians, medical, history), bulk upload, **KNEC progression Excel import** (auto-detects the sheet, map columns once) |
| Fees | **M-PESA Paybill/Till integration with automatic reconciliation and receipting**, learner statements, bursary management, automatic arrears tracking |
| CBC | Competency rubrics (EE/ME/AE/BE), evidence uploads, narrative reports, automated tabulation/"grading curves", KNEC-compliant report cards with logo |
| Attendance | Mark on any device; **instant SMS/WhatsApp alerts to guardians** |
| Communication | SMS, email, WhatsApp notifications; notices |
| Transport | Routes, pickup confirmation capture, bus depart/arrive notifications to guardians |
| Mobile | Parent mobile access (fees, notices, homework, attendance, library history); **native iOS/Android apps "coming soon"** |
| Offline | Offline capture for CBC evidence, transport check-ins, bursar receipting during outages |
| Roadmap | Predictive analytics / at-risk learner ML, virtual classroom integration, analytics dashboards |
| Security | "Bank-grade encryption", secure cloud hosting (marketing-level claims, no specifics) |

Not advertised (apparent gaps on their side): payroll, staff HR/leave, income &
expenses ledger, front-office registers (visitors/calls/postal), timetabling,
hostel, editable role/permission matrix, audit trail, an integrated public
school website.

## 2. Where they beat us today (work on these)

Ranked by impact:

1. **M-PESA auto-reconciliation** *(their flagship; our decision D4 deferred it)* —
   we record M-PESA codes manually. Adopt: Safaricom **Daraja C2B confirmation
   webhook** on the school Paybill; match `BillRefNumber` = admission number →
   auto-create the receipt (vote-head allocation to oldest arrears first), flag
   unmatched payments for the accountant. Needs from the school: Paybill/Till +
   Daraja app credentials.
2. **SMS/WhatsApp notifications** *(our 7.2, blocked on decision D3)* — absence
   alerts, fee reminders (4.3), results-published notices. Needs: Africa's Talking
   account (SMS) and/or WhatsApp Business API; SMTP for email.
3. **Bulk onboarding imports** — they onboard from a KNEC progression Excel in
   minutes; we type pupils one by one. Build: CSV/Excel student import (KNEC
   progression column mapping), plus opening-balance import. No decision needed —
   also required anyway for migration item 10.2.
4. **CBC depth on report cards** — we grade exams to EE/ME/AE/BE with auto
   remarks; they market strand-level rubrics, evidence uploads and narrative
   comments. Build next: **editable class-teacher/head remarks** per report card
   and a **KNEC-format results export**; strand-level assessment as a later
   enhancement.
5. **Transport with parent notifications** *(our 9.3, planned)* — becomes much more
   valuable after (2) exists.
6. **Installable/offline experience** — they tout offline capture and native apps
   ("coming soon"). Cheap counter: ship a **PWA** (installable icon, cached shell,
   read-only offline for portals). True offline data entry is a heavy build — defer.
7. **Operational maturity** — they run managed multi-tenant cloud; we self-host
   on one VPS, which trades their ops team for our own patching and backups.
   Addressed at go-live by `deploy/contabo/`: a German-region server (no free
   tier to sleep), nightly dumps with a `--verify` restore drill, automatic
   security updates and a firewalled, localhost-only database.

## 3. Where we are stronger or safer

1. **Ownership & no lock-in** — the school owns the code, database and hosting.
   eBingwa's "free" is a business model: the school's data lives on their servers,
   monetization is via optional paid services, and if the vendor pivots or folds
   the school is stranded. We can export everything (CSV reports exist today) and
   move hosts at will.
2. **Data protection posture** — under Kenya's Data Protection Act the school stays
   in direct control as data controller; no third-party processor holding every
   pupil's records. Concrete, verifiable measures (vs "bank-grade" marketing):
   bcrypt passwords, httpOnly signed-JWT sessions, per-IP login throttling,
   server-enforced RBAC on every action, rate-limited + honeypotted public
   endpoints.
3. **Financial integrity engineering** — money as integer cents; payments are
   immutable (corrections are audited voids); vote-head allocations printed on
   receipts; oldest-first arrears with a reconciling term-position view; payroll
   posts to the ledger; year-end balances carry forward through promotions. All of
   it locked by ~600 automated end-to-end checks with exact-shilling assertions.
4. **Immutable audit trail** — every login and every sensitive action recorded and
   filterable per module. Not in their advertised set.
5. **Breadth they don't advertise** — payroll with payslips, staff HR + leave
   self-service, income & expenses ledger, timetabling with teacher-clash
   detection, front-office registers, promotions with per-pupil repeat, an
   editable role/permission matrix, and a **public school website that feeds the
   EMS** (complaints/enquiries land in the front office).
6. **Tailored, not generic** — Holy Cross branding, CBC stages and vote heads
   matching how this school actually bills; changes ship on request rather than a
   vendor's roadmap. SaaS-ready by design (school identity is data, not code).

## 4. Verdict & recommended order of work

They are ahead on **integrations and onboarding convenience** (M-PESA, SMS/WhatsApp,
Excel import, offline/mobile). We are ahead on **ownership, financial rigor,
accountability and breadth of back-office modules**. Their advantages are features
we can build; ours are structural and hard for them to copy.

Build order to close the gap:

1. Bulk student import (CSV/Excel incl. KNEC progression) — no blockers, also needed for go-live.
2. Editable report-card remarks + KNEC-format export — no blockers.
3. PWA install/offline shell — no blockers.
4. M-PESA Daraja C2B auto-reconciliation — needs Paybill + Daraja credentials (upgrade of D4).
5. SMS/WhatsApp/email center (7.2) + fee reminders (4.3) — needs D3 (Africa's Talking / SMTP).
6. Transport module (9.3) with notifications once (5) exists.
