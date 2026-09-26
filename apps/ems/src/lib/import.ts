import "server-only";

/** CSV parsing + fuzzy column mapping for the student importer.
 *  Built for KNEC progression exports saved as CSV, but tolerant of any
 *  reasonable spreadsheet: headers are matched by keyword, a single
 *  "learner name" column is split SURNAME-first (KNEC convention). */

export type ParsedRow = {
  line: number;
  admissionNo: string | null;
  upiNumber: string | null;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | null;
  className: string | null;
  streamName: string;
  boarding: "DAY" | "BOARDER";
  guardianName: string | null;
  guardianPhone: string | null;
};

/** RFC-4180-ish CSV parser: quoted fields, embedded commas and newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

type ColumnKey =
  | "admission"
  | "upi"
  | "fullName"
  | "firstName"
  | "lastName"
  | "gender"
  | "class"
  | "stream"
  | "boarding"
  | "guardianName"
  | "guardianPhone";

/** Fuzzy header → column mapping. First match wins per column. */
export function mapHeaders(headers: string[]): Partial<Record<ColumnKey, number>> {
  const map: Partial<Record<ColumnKey, number>> = {};
  const set = (key: ColumnKey, i: number) => {
    if (map[key] === undefined) map[key] = i;
  };
  headers.forEach((raw, i) => {
    const h = raw.toLowerCase().trim();
    if (!h) return;
    if (/(adm|admission)/.test(h) && !/date/.test(h)) set("admission", i);
    else if (/(upi|assessment\s*no|nemis)/.test(h)) set("upi", i);
    // guardian columns must win before the generic name matcher below
    else if (/guardian|parent|mother|father/.test(h) && /name/.test(h)) set("guardianName", i);
    else if (/^(guardian|parent)$/.test(h)) set("guardianName", i);
    else if (/first\s*name/.test(h)) set("firstName", i);
    else if (/(sur|last)\s*name/.test(h)) set("lastName", i);
    else if (/(learner|pupil|student|full)?\s*name/.test(h)) set("fullName", i);
    else if (/^(gender|sex)$/.test(h)) set("gender", i);
    else if (/(class|grade|form)/.test(h) && !/teacher/.test(h)) set("class", i);
    else if (/stream|section/.test(h)) set("stream", i);
    else if (/board/.test(h)) set("boarding", i);
    else if (/(phone|contact|mobile|tel)/.test(h)) set("guardianPhone", i);
  });
  return map;
}

/** "GRADE 4" / "G4" / "Grade4" / "PP 1" / "playgroup" → canonical key. */
export function normalizeClassName(raw: string): string {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.includes("PLAY")) return "PLAYGROUP";
  const pp = s.match(/PP(\d)/);
  if (pp) return `PP${pp[1]}`;
  const num = s.match(/(\d+)/);
  if (num) return `GRADE${Number(num[1])}`;
  return s;
}

function parseGender(raw: string): "MALE" | "FEMALE" | null {
  const g = raw.trim().toLowerCase();
  if (g.startsWith("m") || g.startsWith("b")) return "MALE";
  if (g.startsWith("f") || g.startsWith("g")) return "FEMALE";
  return null;
}

/** KNEC lists names surname-first: "WEKESA AMANI JOHN" → last=Wekesa. */
function splitFullName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  const [last, ...rest] = parts;
  return { lastName: titleCase(last), firstName: titleCase(rest.join(" ")) };
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Turns raw CSV text into structured rows; the first row must be headers. */
export function parseStudentCsv(text: string): {
  rows: ParsedRow[];
  headerIssues: string[];
} {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], headerIssues: ["Need a header row and at least one pupil row."] };

  const headers = table[0];
  const cols = mapHeaders(headers);

  const headerIssues: string[] = [];
  const hasName = cols.fullName !== undefined || (cols.firstName !== undefined && cols.lastName !== undefined);
  if (!hasName)
    headerIssues.push('No name column found — include "Learner Name" (or "First Name" + "Surname").');
  if (cols.class === undefined)
    headerIssues.push('No class column found — include "Grade" or "Class".');
  if (headerIssues.length > 0) return { rows: [], headerIssues };

  const cell = (row: string[], key: ColumnKey) =>
    cols[key] !== undefined ? (row[cols[key]!] ?? "").trim() : "";

  const rows: ParsedRow[] = table.slice(1).map((row, i) => {
    let firstName = "";
    let lastName = "";
    if (cols.firstName !== undefined && cols.lastName !== undefined) {
      firstName = titleCase(cell(row, "firstName"));
      lastName = titleCase(cell(row, "lastName"));
    } else {
      ({ firstName, lastName } = splitFullName(cell(row, "fullName")));
    }
    return {
      line: i + 2,
      admissionNo: cell(row, "admission") || null,
      upiNumber: cell(row, "upi") || null,
      firstName,
      lastName,
      gender: parseGender(cell(row, "gender")),
      className: cell(row, "class") || null,
      streamName: cell(row, "stream") || "A",
      boarding: /board/i.test(cell(row, "boarding")) ? "BOARDER" : "DAY",
      guardianName: cell(row, "guardianName") ? titleCase(cell(row, "guardianName")) : null,
      guardianPhone: cell(row, "guardianPhone") || null,
    };
  });

  return { rows, headerIssues: [] };
}
