# Bringing the register in — bulk enrolment

How to get a whole school's pupils into the system from a spreadsheet, and
what the system does with each row.

**The template:** [`docs/templates/pupil-import-template.xlsx`](templates/pupil-import-template.xlsx).
It is also served by the EMS itself at `/pupil-import-template.xlsx`, and
linked from the import page, so the office can always get a fresh copy without
going near this repository.

Regenerate it with `python3 tools/make-import-template.py` if the importer's
columns ever change. The template is built from the same column list the
importer matches on, which is the point.

---

## Before you start

Two things must be true, or the import will refuse and tell you so:

1. **An academic session is active** — Settings → Sessions & terms. Pupils are
   enrolled *into* a session, so there has to be one.
2. **The classes exist** — Academics → Classes. The import will not invent a
   class. A row naming one that doesn't exist is skipped, by row number, with
   the class it couldn't find.

## The columns

| Column | | What it is |
|---|---|---|
| Admission No | optional | Leave blank and the next number is assigned. Fill it in only to keep a number the pupil already has. |
| UPI / Assessment No | optional | The NEMIS/KNEC number. Used to recognise a pupil already in the system. |
| Surname | **required** | Family name. |
| First Name | **required** | Given names, middle names included. |
| Gender | **required** | Male or Female. `M`/`F`, `Boy`/`Girl` also work. **A row without this is skipped.** |
| Class | **required** | Playgroup, PP1, PP2, Grade 1–9. `Grade 1`, `GRADE1`, `G1` and `1` all resolve. |
| Stream | optional | A, B, C… Blank uses the class's first stream. |
| Boarding | optional | Day or Boarder. Blank means day scholar. |
| Guardian Name | optional | Creates a guardian record attached to the pupil. |
| Guardian Phone | optional | Keep it as text, or Excel eats the leading zero off `0712…`. |

If your file has a single **Learner Name** column instead of Surname + First
Name — a KNEC progression export, typically — that works too. It is split
surname-first, the KNEC way: `WEKESA AMANI JOHN` becomes Wekesa, Amani John.

Headers are matched by keyword, not by exact text, so `Adm No.`, `Admission
Number` and `ADM` all find the same column. Order does not matter.

## The workflow

1. **Fill in the template.** One pupil per row. Delete the four grey example
   rows.
2. **Save as CSV.** File → Save As → CSV (Comma delimited). The importer reads
   CSV, not `.xlsx`.
3. **Students → Import pupils from a spreadsheet**, and choose the file. You
   can paste rows into the box instead, if that is easier.
4. **Press Preview import.** Nothing is saved yet.
5. **Read the preview.** Every row is listed with what will happen to it, and
   anything that cannot be admitted says why, by row number. Fix those rows in
   the spreadsheet and preview again — there is no penalty for doing this
   several times.
6. **Press "Import N pupils".** Only now is anything written.

## What it does with each pupil

Admits them into the class and stream named, enrols them in the active
session, assigns an admission number if the column was blank, and creates a
guardian record if a guardian name was given. Nothing else is assumed: fees,
transport and dormitory placement are set separately.

## What it refuses to do

- **Admit the same pupil twice.** A pupil already on the roll is skipped, not
  duplicated — matched on admission number, on UPI, or on the same name in the
  same class. So re-running the same file after fixing three rows is safe, and
  only the three go in.

  The name-and-class check matters more than it looks. Admission numbers and
  UPIs only help when the file has those columns, and a school typing its
  register in for the first time has neither — so before 8 Oct 2026 an
  operator who re-ran a file, which is what anyone does when unsure the first
  run worked, silently doubled the roll.

  It is a heuristic, and genuine namesakes in the same class exist. If two
  real pupils share a name and a class, the second is skipped and the message
  names the record it matched; admit that one by hand from **Students → Admit
  pupil**. That is a cheaper mistake than a doubled register nobody notices
  for a month.
- **Admit a row it cannot place.** No name, no gender, or an unknown class and
  the row is skipped with the reason. The rest of the file still imports.
- **Take more than 1,000 rows at once.** Split a larger register and import it
  in parts.

## Admission numbers

They look like `SSK-260041`: the school's prefix, the year, then a serial.

The prefix is **Settings → School Settings → Admission number prefix**. It is
the school's own identity, not something baked into the software — a second
school on this platform must not issue numbers starting with another school's
letters. Changing it never renumbers anyone; numbers already issued are on
report cards and receipts and are how a parent refers to their child. Only
pupils admitted afterwards get the new prefix.

> **Check this before your first real import.** Until 8 Oct 2026 the settings
> row was created without a prefix and silently took the schema default, so
> pupils came out as `ADM-26xxxx`. New installs are correct. An install made
> before that keeps whatever it has — look at Settings → School Settings and
> set it to `SSK` if it says `ADM`.

## If something goes wrong

The preview is the safety net: it is a dry run, and it shows you the outcome
of every row before anything is written. Use it. If pupils do get admitted in
error, each can be archived from their record — there is no bulk undo, which
is the other reason to read the preview.
