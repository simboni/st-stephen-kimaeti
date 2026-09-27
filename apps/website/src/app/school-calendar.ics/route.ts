import { events, school, site, terms } from "@/lib/site";

export const dynamic = "force-static";

/* The school year as an iCalendar file, so a parent can put every term date
   and every event into the phone they already carry instead of writing them on
   the back of a receipt.

   Written by hand rather than with a library: the format is a dozen lines, and
   a dependency for that would be silly. Lines are folded at 75 octets as RFC
   5545 requires, and text is escaped. */

const CRLF = "\r\n";

function escape(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** RFC 5545 wants no line longer than 75 octets; continuations start with a space. */
function fold(line: string) {
  if (line.length <= 73) return line;
  const parts = [line.slice(0, 73)];
  let rest = line.slice(73);
  while (rest.length > 72) {
    parts.push(" " + rest.slice(0, 72));
    rest = rest.slice(72);
  }
  parts.push(" " + rest);
  return parts.join(CRLF);
}

/** All-day events use a DATE value; the end is exclusive, so add a day. */
function dayAfter(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

const compact = (iso: string) => iso.replace(/-/g, "");

function vevent({
  uid,
  start,
  end,
  summary,
  description,
  location,
}: {
  uid: string;
  start: string;
  end?: string;
  summary: string;
  description?: string;
  location?: string;
}) {
  return [
    "BEGIN:VEVENT",
    `UID:${uid}@${site.domain}`,
    // A fixed stamp keeps the file byte-identical between builds, so a
    // re-deploy does not look like a change to every calendar that has it.
    "DTSTAMP:20260101T000000Z",
    `DTSTART;VALUE=DATE:${compact(start)}`,
    `DTEND;VALUE=DATE:${dayAfter(end ?? start)}`,
    `SUMMARY:${escape(summary)}`,
    ...(description ? [`DESCRIPTION:${escape(description)}`] : []),
    ...(location ? [`LOCATION:${escape(location)}`] : []),
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
  ];
}

export function GET() {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${escape(school.shortName)}//School calendar//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escape(`${school.shortName} — school calendar`)}`,
    "X-WR-TIMEZONE:Africa/Nairobi",
  ];

  for (const t of terms) {
    const slug = t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    lines.push(
      ...vevent({
        uid: `${slug}-opens`,
        start: t.opens,
        summary: `${t.name} opens`,
        description: `Boarders report with their kit ready for inspection; day scholars by 8:00 AM.`,
        location: school.location,
      }),
      ...vevent({
        uid: `${slug}-half`,
        start: t.halfTerm,
        summary: `${t.name} half term`,
        location: school.location,
      }),
      ...vevent({
        uid: `${slug}-closes`,
        start: t.closes,
        summary: `${t.name} closes`,
        location: school.location,
      }),
    );
  }

  for (const e of events) {
    lines.push(
      ...vevent({
        uid: `event-${e.date}-${e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        start: e.date,
        end: e.endDate,
        summary: e.title,
        description: [e.time, e.text].filter(Boolean).join(" — "),
        location: e.venue,
      }),
    );
  }

  lines.push("END:VCALENDAR");

  return new Response(lines.map(fold).join(CRLF) + CRLF, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'attachment; filename="ststephen-kimaeti.ics"',
    },
  });
}
