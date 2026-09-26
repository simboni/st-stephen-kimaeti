/* Requirements & Data Collection Document — St Stephen's School
   Generates a fillable Word document for the school to complete. */

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  PageBreak, PageOrientation, LevelFormat, TableOfContents, Header, Footer,
  PageNumber, convertInchesToTwip,
} = require("docx");
const fs = require("fs");

const SCHOOL = "St Stephen's School";
const PREPARER = "Peter Misiati";
const W = 9746;            // usable width in DXA (A4 minus 0.75in margins)
const BRAND = "1F3A63";    // deep navy
const ACCENT = "C9A227";   // gold
const LIGHT = "EEF2F8";    // table header fill
const BLANK = "FFFFFF";

/* ------------------------------------------------------------ helpers --- */
const p = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    alignment: opts.align,
    children: [new TextRun({
      text, size: opts.size ?? 21, bold: opts.bold, italics: opts.italics,
      color: opts.color, font: "Calibri",
    })],
  });

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1, pageBreakBefore: true,
  spacing: { after: 200 },
  children: [new TextRun({ text, size: 34, bold: true, color: BRAND, font: "Calibri" })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 140 },
  children: [new TextRun({ text, size: 26, bold: true, color: BRAND, font: "Calibri" })],
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 },
  children: [new TextRun({ text, size: 22, bold: true, color: "333333", font: "Calibri" })],
});

const note = (text) => new Paragraph({
  spacing: { before: 80, after: 160 },
  border: { left: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 8 } },
  indent: { left: 160 },
  children: [new TextRun({ text, size: 19, italics: true, color: "444444", font: "Calibri" })],
});

const bullet = (text) => new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  spacing: { after: 60 },
  children: [new TextRun({ text, size: 21, font: "Calibri" })],
});

const cell = (text, { w, bold, fill, align, size } = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
  margins: { top: 80, bottom: 80, left: 110, right: 110 },
  children: [new Paragraph({
    alignment: align,
    children: [new TextRun({ text: text ?? "", size: size ?? 20, bold, font: "Calibri" })],
  })],
});

/** Two-column question / answer table. */
const qa = (rows, labelWidth = 4200) => new Table({
  columnWidths: [labelWidth, W - labelWidth],
  width: { size: W, type: WidthType.DXA },
  rows: rows.map((r) => new TableRow({
    children: [
      cell(r, { w: labelWidth, fill: LIGHT }),
      cell("", { w: W - labelWidth, fill: BLANK }),
    ],
  })),
});

/** Blank grid for the school to fill in: headers + n empty rows. */
const grid = (headers, widths, rowCount = 6) => new Table({
  columnWidths: widths,
  width: { size: W, type: WidthType.DXA },
  rows: [
    new TableRow({
      tableHeader: true,
      children: headers.map((hd, i) => cell(hd, { w: widths[i], bold: true, fill: LIGHT })),
    }),
    ...Array.from({ length: rowCount }, () => new TableRow({
      children: widths.map((w) => cell("", { w })),
    })),
  ],
});

/** Table with some rows pre-filled (e.g. example row). */
const gridWith = (headers, widths, dataRows, blankRows = 4) => new Table({
  columnWidths: widths,
  width: { size: W, type: WidthType.DXA },
  rows: [
    new TableRow({
      tableHeader: true,
      children: headers.map((hd, i) => cell(hd, { w: widths[i], bold: true, fill: LIGHT })),
    }),
    ...dataRows.map((row) => new TableRow({
      children: row.map((t, i) => cell(t, { w: widths[i], size: 19 })),
    })),
    ...Array.from({ length: blankRows }, () => new TableRow({
      children: widths.map((w) => cell("", { w })),
    })),
  ],
});

/** Yes/No/Not sure tick row set. */
const yesno = (questions) => new Table({
  columnWidths: [6146, 1200, 1200, 1200],
  width: { size: W, type: WidthType.DXA },
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell("Do you need this?", { w: 6146, bold: true, fill: LIGHT }),
        cell("Yes", { w: 1200, bold: true, fill: LIGHT, align: AlignmentType.CENTER }),
        cell("No", { w: 1200, bold: true, fill: LIGHT, align: AlignmentType.CENTER }),
        cell("Not sure", { w: 1200, bold: true, fill: LIGHT, align: AlignmentType.CENTER }),
      ],
    }),
    ...questions.map((q) => new TableRow({
      children: [
        cell(q, { w: 6146 }),
        cell("", { w: 1200 }), cell("", { w: 1200 }), cell("", { w: 1200 }),
      ],
    })),
  ],
});

/* ============================================================== CONTENT === */
const body = [];

/* ---- cover ---- */
body.push(
  new Paragraph({ spacing: { before: 1800, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: SCHOOL.toUpperCase(), size: 48, bold: true, color: BRAND, font: "Calibri" })] }),
  new Paragraph({ spacing: { after: 600 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Website & School Management System", size: 30, color: "555555", font: "Calibri" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
    border: { top: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 10 } },
    children: [new TextRun({ text: "REQUIREMENTS & DATA COLLECTION DOCUMENT", size: 28, bold: true, font: "Calibri" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 900 },
    children: [new TextRun({ text: "Please complete and return — your answers configure the system", size: 20, italics: true, color: "666666", font: "Calibri" })] }),
);

body.push(new Table({
  columnWidths: [3000, 6746],
  width: { size: W, type: WidthType.DXA },
  rows: [
    ["Prepared for", `${SCHOOL} — Office of the Principal`],
    ["Prepared by", PREPARER],
    ["Document version", "1.0"],
    ["Date issued", "____ / ____ / 2026"],
    ["Please return by", "____ / ____ / 2026"],
    ["Return to", "Email: ______________________   Phone: ______________________"],
  ].map((r) => new TableRow({
    children: [cell(r[0], { w: 3000, bold: true, fill: LIGHT }), cell(r[1], { w: 6746 })],
  })),
}));

body.push(new Paragraph({ children: [new PageBreak()] }));

/* ---- how to use ---- */
body.push(
  new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 200 },
    children: [new TextRun({ text: "How to use this document", size: 34, bold: true, color: BRAND, font: "Calibri" })] }),
  p("This document has one purpose: to gather everything needed to build your website and your school management system, so that when the system is delivered it already contains your classes, your subjects, your fee structure and your staff — not placeholder data you have to correct afterwards."),
  p("It is written as a set of questions. Where you see an empty box, write in it. Where you see a table, add as many rows as you need.", { after: 200 }),
  h3("Who should answer what"),
);

body.push(gridWith(
  ["Part", "Section", "Best answered by"],
  [1600, 5146, 3000],
  [
    ["A", "Website content, branding, public information", "Principal / Director / Marketing"],
    ["B1–B3", "Academic structure, subjects, pathways", "Director of Studies / Deputy Academics"],
    ["B4–B5", "Learners and guardians", "Registrar / Class teachers"],
    ["B6", "Staff, payroll, leave", "HR / Bursar / Principal"],
    ["B7", "Fees, vote heads, finance", "Bursar / Accountant"],
    ["B8–B9", "Transport and boarding", "Transport officer / Boarding master or matron"],
    ["B10–B13", "Attendance, assessment, library, stores", "Deputy Principal / Heads of department"],
    ["B14–B18", "Communication, users, portals, migration", "Principal / ICT focal person"],
    ["C", "Infrastructure, hosting, training, timeline", "Principal / ICT focal person"],
  ], 0));

body.push(
  h3("Three things that will speed this up"),
  bullet("Attach your current fee structure document, class lists and staff list rather than retyping them. Photographs of printed sheets are fine — legibility matters more than format."),
  bullet("If you cannot answer something, write \"not sure\" rather than guessing. A wrong answer costs more to undo than a blank one."),
  bullet("Anything marked REQUIRED TO START must be answered before build begins. The rest can follow during the build."),
  note("Nothing in this document commits you to a price or a date. It defines scope so that the quotation and timeline that follow are accurate rather than optimistic."),
);

/* ================================================== PART A — WEBSITE ==== */
body.push(h1("PART A — The Website"));
body.push(p("The public website is what parents see before they ever visit. It carries your identity, your admissions information, and the link into the parent portal.", { after: 200 }));

body.push(h2("A1. School identity"), p("REQUIRED TO START.", { bold: true, color: "B00020", size: 19 }));
body.push(qa([
  "Full registered name of the school",
  "Short name / how it is commonly known",
  "School motto",
  "Year founded",
  "Ministry of Education registration number",
  "TSC / county code (if applicable)",
  "Sponsor or church affiliation (if any)",
  "Is the school day, boarding, or both?",
  "Is the school boys, girls, or mixed?",
]));

body.push(h3("A1.1 Vision, mission and values"));
body.push(qa([
  "Vision statement",
  "Mission statement",
  "Core values (list)",
  "Short history / about the school (one or two paragraphs)",
  "Principal's welcome message",
], 3000));

body.push(h3("A1.2 Logo and colours"));
body.push(yesno([
  "Do you have the school logo as a digital file (PNG, SVG or AI)?",
  "Do you have the logo only on printed material (we would redraw it)?",
  "Do you have official school colours we must use?",
  "Do you have a school crest or badge with a meaning we should explain on the site?",
]));
body.push(qa(["School colours (names or codes)", "Who holds the original logo file?"], 3400));
body.push(note("If the logo exists only on a letterhead or signboard, send a clear photograph. Redrawing it cleanly is part of the work and costs nothing extra, but it needs a legible original."));

body.push(h2("A2. Contact and location"));
body.push(qa([
  "Postal address",
  "Physical location (village, ward, sub-county, county)",
  "Directions / nearest landmark",
  "GPS coordinates or Google Maps link",
  "Main telephone number(s)",
  "WhatsApp number for enquiries",
  "Official school email address",
  "Admissions / enquiries email",
  "Office opening hours",
]));

body.push(h2("A3. Leadership and staff to feature publicly"));
body.push(p("Names and photographs of people the school wants shown on the site. Only include those who have agreed."));
body.push(grid(
  ["Name", "Position", "Short bio (1–2 lines)", "Photo available?"],
  [2400, 2200, 3746, 1400], 7));

body.push(h2("A4. Academic profile (public-facing)"));
body.push(qa([
  "Levels offered (confirm: ECD, Primary, Junior, Senior)",
  "Senior school pathways offered (see Part B3)",
  "Total current enrolment (approximate)",
  "Number of teaching staff",
  "Recent national assessment results to publish (if any)",
  "Notable academic achievements",
  "Notable co-curricular achievements",
], 3600));

body.push(h2("A5. Admissions information to publish"));
body.push(qa([
  "Entry requirements per level",
  "When is the intake / admission period?",
  "Documents a parent must bring",
  "Do you want fees published on the website?",
  "Do you want an online application form on the website?",
  "Who receives online applications?",
], 3600));

body.push(h2("A6. Facilities and co-curricular activities"));
body.push(p("Tick what the school has, and which you want featured with photographs."));
body.push(grid(["Facility / activity", "Have it?", "Feature on site?", "Notes"],
  [4146, 1400, 1800, 2400], 10));
body.push(note("Common entries: classrooms, science laboratory, computer lab, library, dining hall, dormitories, playing field, chapel, sick bay, school bus, water supply, football, netball, athletics, music, drama, scouts, clubs."));

body.push(h2("A7. News, events and gallery"));
body.push(yesno([
  "Do you want a news / announcements section you can update?",
  "Do you want an events calendar visible to parents?",
  "Do you want a photo gallery?",
  "Do you have existing photographs we can use?",
  "Will you need us to photograph the school?",
]));
body.push(qa(["Who at the school will post news after handover?"], 3600));

body.push(h2("A8. Online presence"));
body.push(qa([
  "Facebook page",
  "X / Twitter",
  "Instagram",
  "YouTube / TikTok",
  "Existing website address (if any)",
  "Who controls the existing website and domain?",
], 3600));

body.push(h2("A9. Domain name and email"));
body.push(qa([
  "Preferred website address (e.g. ststephens.ac.ke)",
  "Do you already own a domain? Which?",
  "Who is the registrar, and who has the login?",
  "Do you want school email addresses (e.g. principal@yourdomain)?",
  "How many email accounts would you need?",
], 3800));
body.push(note("A .ac.ke domain requires proof of registration as an educational institution. A .sc.ke or .co.ke can be registered faster if the paperwork is not immediately available."));

body.push(h2("A10. Website features"));
body.push(yesno([
  "Parent portal login link from the website",
  "Online admission application form",
  "Contact / enquiry form that reaches the office",
  "Complaints or suggestion form",
  "Downloadable documents (fee structure, forms, newsletters)",
  "Staff recruitment / vacancies page",
  "Alumni page",
  "Board of Management page",
  "Newsletter sign-up",
  "Live fee balance check for parents",
  "Multi-language (English and Kiswahili)",
]));

/* ========================================== PART B — MANAGEMENT SYSTEM == */
body.push(h1("PART B — The School Management System"));
body.push(p("This part configures the system itself. The more precisely it is answered, the less correcting you will do after go-live.", { after: 200 }));

body.push(h2("B1. Academic structure"), p("REQUIRED TO START.", { bold: true, color: "B00020", size: 19 }));
body.push(p("List every class the school runs. Add a row per stream — if Grade 4 has two streams, that is two rows."));
body.push(gridWith(
  ["Level", "Class name", "Stream(s)", "Learners", "Class teacher"],
  [1800, 2200, 2000, 1400, 2346],
  [
    ["ECD", "Playgroup", "A", "", ""],
    ["ECD", "PP1", "A", "", ""],
    ["ECD", "PP2", "A", "", ""],
    ["Primary", "Grade 1", "", "", ""],
    ["Junior", "Grade 7", "", "", ""],
    ["Senior", "Grade 10", "", "", ""],
  ], 10));
body.push(note("The rows above are examples showing the format — overwrite them. We expect roughly ECD (Playgroup, PP1, PP2), Primary (Grade 1–6), Junior (Grade 7–9) and Senior (Grade 10–12). Correct anything that does not match."));

body.push(qa([
  "Do you use names for streams (A/B, or North/South, or colours)?",
  "Maximum learners per class",
  "Do classes have a house system (e.g. for sports)?",
], 4600));

body.push(h2("B2. Academic calendar"), p("REQUIRED TO START.", { bold: true, color: "B00020", size: 19 }));
body.push(qa([
  "How do you name the academic year (e.g. 2026 or 2026–2027)?",
  "Current academic year",
], 4600));
body.push(grid(["Term", "Opening date", "Closing date", "Mid-term break"],
  [1800, 2600, 2600, 2746], 3));

body.push(h2("B3. Subjects and learning areas"), p("REQUIRED TO START.", { bold: true, color: "B00020", size: 19 }));
body.push(h3("B3.1 ECD, Primary and Junior"));
body.push(p("List the learning areas taught at each level. If you follow the standard KICD list exactly, write \"standard\" and we will load it for your confirmation."));
body.push(grid(["Level", "Learning area / subject", "Taught in which classes?", "Examined?"],
  [1800, 3200, 2600, 2146], 8));

body.push(h3("B3.2 Senior School (Grade 10–12) — pathways"));
body.push(p("Senior school is where this system must differ most from a primary school: learners choose a pathway and a subject combination rather than all taking the same list. Tell us exactly what you offer."));
body.push(yesno([
  "STEM pathway",
  "Social Sciences pathway",
  "Arts and Sports Science pathway",
]));
body.push(p("For each pathway you offer, list the tracks and the subjects available:", { before: 160 }));
body.push(grid(["Pathway", "Track", "Subjects offered in this track", "Max learners"],
  [2000, 2200, 3746, 1800], 8));

body.push(h3("B3.3 How learners choose"));
body.push(qa([
  "How many subjects does a senior learner take in total?",
  "Which subjects are compulsory for everyone?",
  "How many optional subjects do they choose?",
  "When do they choose (which term of which grade)?",
  "Who approves a learner's subject combination?",
  "Can a learner change combination later? Under what conditions?",
], 4600));
body.push(note("This is the single most important section for the senior school. It determines whether the system can produce a correct report card, timetable and class register for Grade 10–12, because two learners in the same class may sit different subjects."));

body.push(h2("B4. Learners"), p("REQUIRED TO START (the counts, at least).", { bold: true, color: "B00020", size: 19 }));
body.push(qa([
  "Total learners currently enrolled",
  "Admission number format (e.g. SS/2026/001)",
  "Does numbering restart each year?",
  "Do you record the UPI / NEMIS number?",
  "Do you record the assessment number?",
  "Do you keep learner photographs?",
], 4600));
body.push(h3("B4.1 Information held about each learner"));
body.push(p("Tick everything the school records. Anything ticked becomes a field in the system."));
body.push(yesno([
  "Full name, date of birth, gender",
  "Birth certificate number",
  "UPI / NEMIS number",
  "Home address and village",
  "Religion",
  "Medical conditions and allergies",
  "Special educational needs",
  "Previous school",
  "Day or boarder",
  "Transport route used",
  "Photograph",
  "Nearest hospital / NHIF or SHIF details",
]));

body.push(h2("B5. Parents and guardians"));
body.push(yesno([
  "Do you record more than one guardian per learner?",
  "Do you record the guardian's occupation?",
  "Do you record which guardian pays the fees?",
  "Do you record an emergency contact separate from the guardian?",
  "Do parents need their own login to see results and fee balances?",
]));

body.push(h2("B6. Staff and human resources"));
body.push(qa([
  "Total teaching staff",
  "Total non-teaching staff",
  "Do you record TSC numbers?",
  "Departments used (e.g. Sciences, Languages, Administration)",
], 4600));
body.push(h3("B6.1 Payroll"));
body.push(yesno([
  "Do you want payroll in the system?",
  "Do you pay a basic salary plus allowances?",
  "Do you deduct NSSF?",
  "Do you deduct SHIF?",
  "Do you deduct PAYE?",
  "Do you deduct a housing levy?",
  "Do staff take salary advances or loans to be recovered?",
  "Do you issue printed payslips?",
]));
body.push(h3("B6.2 Leave"));
body.push(grid(["Leave type", "Days per year", "Who approves?"], [3400, 2600, 3746], 6));

body.push(h2("B7. Fees and finance"), p("REQUIRED TO START.", { bold: true, color: "B00020", size: 19 }));
body.push(p("Fees are collected against vote heads — the categories a payment is split into. List every vote head you bill."));
body.push(gridWith(
  ["Vote head", "Applies to", "Per term or per year?", "Amount (KES)"],
  [2600, 2600, 2400, 2146],
  [["Tuition", "All learners", "Per term", ""], ["Transport", "Bus users only", "Per term", ""]], 10));

body.push(h3("B7.1 Fee amounts by class"));
body.push(p("Attach your current fee structure document if you have one — that is faster than filling this in."));
body.push(grid(["Class", "Term 1", "Term 2", "Term 3", "Boarder extra"],
  [2146, 1900, 1900, 1900, 1900], 8));

body.push(h3("B7.2 Payments and balances"));
body.push(qa([
  "Payment methods accepted (cash, bank, M-PESA, cheque)",
  "Bank name and account number for fees",
  "M-PESA Paybill / Till number",
  "Do you want M-PESA payments to reconcile automatically?",
  "Do you issue numbered receipts? What format?",
  "Do learners carry balances forward between terms?",
  "Do you offer discounts or bursaries? On what basis?",
  "Do staff children pay reduced fees?",
  "Is there a penalty for late payment?",
], 4600));
body.push(note("Automatic M-PESA reconciliation requires a Paybill and Safaricom Daraja API credentials in the school's name. Without them, M-PESA payments are still recorded — they are simply keyed in by the bursar rather than appearing on their own."));

body.push(h3("B7.3 Income and expenses"));
body.push(p("Categories the school uses in its books, beyond fees."));
body.push(grid(["Category", "Income or expense?", "Notes"], [3400, 2600, 3746], 8));

body.push(h2("B8. Transport"), p("Confirmed as required.", { bold: true, color: "B00020", size: 19 }));
body.push(h3("B8.1 Routes and charges"));
body.push(grid(["Route name", "Area covered", "Stages / pickup points", "Fee per term (KES)", "Learners"],
  [2000, 2200, 2600, 1600, 1346], 8));
body.push(h3("B8.2 Vehicles and drivers"));
body.push(grid(["Vehicle / registration", "Capacity", "Route assigned", "Driver name", "Driver phone"],
  [2200, 1200, 2000, 2200, 2146], 6));
body.push(h3("B8.3 How transport is charged and run"));
body.push(qa([
  "Is the transport fee the same for every route, or by distance?",
  "Can a learner use transport one way only (morning or evening)?",
  "Is transport billed per term or per month?",
  "Who is responsible for the daily bus register?",
  "Do you want the system to bill transport automatically when a learner is assigned a route?",
], 4800));
body.push(yesno([
  "Do you want parents notified by SMS when the bus departs school?",
  "Do you want parents notified when the bus reaches their stage?",
  "Do you want a boarding register (who got on the bus) per trip?",
  "Do you want to track vehicle servicing, insurance and inspection dates?",
]));
body.push(note("SMS notifications require an SMS account in the school's name (Africa's Talking or similar) and are charged per message. We will quote this separately once volumes are known."));

body.push(h2("B9. Boarding"));
body.push(yesno([
  "Does the school board learners?",
  "Do you want the system to manage dormitory and bed allocation?",
  "Do you run a house system?",
]));
body.push(grid(["Dormitory / house", "For boys or girls?", "Capacity", "Matron / master in charge"],
  [2600, 2200, 1600, 3346], 6));

body.push(h2("B10. Attendance"));
body.push(qa([
  "Who marks learner attendance?",
  "Is it marked once a day, or per lesson?",
  "At what time is the register taken?",
  "Do you mark staff attendance too?",
  "Do you want parents notified when a learner is absent?",
], 4600));

body.push(h2("B11. Assessment and reporting"), p("REQUIRED TO START.", { bold: true, color: "B00020", size: 19 }));
body.push(h3("B11.1 Examinations per term"));
body.push(grid(["Assessment name", "Which term", "Out of how many marks?", "Counts toward final?"],
  [2800, 2000, 2400, 2546], 6));

body.push(h3("B11.2 Grading"));
body.push(p("CBC uses performance levels. Confirm the boundaries your school uses, or correct them."));
body.push(gridWith(
  ["Performance level", "Code", "Mark range"],
  [4000, 2000, 3746],
  [
    ["Exceeding Expectation", "EE", "80 – 100"],
    ["Meeting Expectation", "ME", "60 – 79"],
    ["Approaching Expectation", "AE", "40 – 59"],
    ["Below Expectation", "BE", "0 – 39"],
  ], 2));
body.push(qa([
  "Does senior school (Grade 10–12) use a different grading scale?",
  "If yes, describe it",
  "Do you rank learners within a class?",
  "Do you rank learners across the whole level?",
  "Do you show the class average on report cards?",
], 4600));

body.push(h3("B11.3 Report cards"));
body.push(yesno([
  "Class teacher's remarks on each report",
  "Principal's remarks on each report",
  "Attendance summary on the report",
  "Fee balance shown on the report",
  "Previous term's marks shown for comparison",
  "Strand or sub-strand level detail (CBC rubrics)",
  "Space for a parent's signature",
  "School stamp or signature image",
]));
body.push(note("Attach a copy of your current report card. Matching what parents already recognise is usually better than introducing a new layout."));

body.push(h2("B12. Library"));
body.push(yesno([
  "Do you want a library module?",
  "Do you lend books to learners?",
  "Do you lend to staff?",
  "Do you charge fines for late return?",
  "Do books have barcodes or accession numbers already?",
]));
body.push(qa(["Approximately how many titles?", "Who runs the library?"], 4600));

body.push(h2("B13. Stores and inventory"));
body.push(yesno([
  "Do you want a stores / inventory module?",
  "Do you track textbooks issued to learners?",
  "Do you track uniforms sold?",
  "Do you track laboratory equipment?",
  "Do you record suppliers and purchase orders?",
]));

body.push(h2("B14. Health records"));
body.push(yesno([
  "Do you run a sick bay or clinic?",
  "Do you want to record clinic visits and treatment?",
  "Do you record immunisation records?",
  "Do you notify parents when a learner is treated?",
]));

body.push(h2("B15. Communication"));
body.push(qa([
  "Do you currently send SMS to parents? Through whom?",
  "Do you have an SMS sender ID registered?",
  "Roughly how many SMS per term?",
  "Do you send email to parents?",
], 4600));
body.push(p("Tick what you want the system to send:", { before: 160 }));
body.push(yesno([
  "Fee balance reminders to defaulters",
  "Receipt confirmation when a payment is recorded",
  "Absence notification to parents",
  "Examination results released",
  "General announcements to all parents",
  "Announcements to one class only",
  "Login credentials to new parents",
  "Bus departure and arrival alerts",
]));

body.push(h2("B16. Users and access"));
body.push(p("Who gets a login, and what should each be able to see? Tick the roles you need."));
body.push(grid(["Role", "How many people?", "What they must be able to do", "What they must NOT see"],
  [2200, 1800, 3000, 2746], 8));
body.push(note("Common roles: Principal, Deputy, Director of Studies, Bursar/Accountant, Registrar, Class teacher, Subject teacher, Librarian, Transport officer, Boarding matron, Parent, Learner."));

body.push(h2("B17. Parent and learner portals"));
body.push(yesno([
  "Parents can see their child's fee balance and statement",
  "Parents can see examination results and report cards",
  "Parents can see attendance",
  "Parents can see homework or assignments",
  "Parents can apply for the learner's absence or leave",
  "Learners get their own login",
  "Learners can see their own results",
  "Learners can submit homework online",
]));

body.push(h2("B18. Existing records and migration"), p("REQUIRED TO START.", { bold: true, color: "B00020", size: 19 }));
body.push(qa([
  "What system do you use now (name, or \"paper and Excel\")?",
  "Can data be exported from it? In what format?",
  "Who administers it, and do you have the login?",
  "Are learner records in Excel already?",
  "Are fee balances in Excel already?",
  "Are staff records in Excel already?",
  "How many past years of records must be carried over?",
  "When would you want to switch over?",
], 4600));
body.push(note("Opening fee balances matter more than anything else here. If a learner owes money from last term and the new system does not know, the school loses that money quietly. We import opening balances as a deliberate step and reconcile them against your records before go-live."));

/* ============================================ PART C — DELIVERY ========= */
body.push(h1("PART C — Infrastructure, delivery and sign-off"));

body.push(h2("C1. What the school already has"));
body.push(qa([
  "Internet connection at the school (provider and speed)",
  "Is the internet reliable during working hours?",
  "Number of computers in the office",
  "Do teachers have computers or smartphones?",
  "Do you have a printer? Laser or inkjet?",
  "Do you have a receipt printer?",
  "Is there mains power reliability? Do you have backup?",
], 4600));
body.push(note("The system works on a phone browser, so teachers do not need laptops. But whoever handles fees needs a computer and a printer for receipts."));

body.push(h2("C2. Hosting"));
body.push(p("The system needs a server. Three options, to be decided with you:"));
body.push(gridWith(
  ["Option", "What it means", "Roughly"],
  [2400, 5346, 2000],
  [
    ["Own server", "A private server used only by St Stephen's. Fully isolated — no other school's data on the same machine. Recommended.", "Monthly fee"],
    ["Shared server", "The school's system runs on a server shared with another school, in a separate database.", "Lower monthly fee"],
    ["School's own hardware", "A machine at the school. No monthly hosting fee, but it depends on school power and internet, and backups become the school's responsibility.", "One-off cost"],
  ], 0));
body.push(qa(["Which option does the school prefer?", "Who pays the hosting cost, and how often?"], 4600));

body.push(h2("C3. Data protection"));
body.push(p("The system will hold children's personal data, which is regulated in Kenya under the Data Protection Act, 2019."));
body.push(yesno([
  "Is the school registered with the Office of the Data Protection Commissioner (ODPC)?",
  "Do you have a data protection policy?",
  "Do you obtain parental consent to hold learner data?",
  "Do you obtain consent before publishing learner photographs?",
  "Has a member of staff been named as the data contact?",
]));
body.push(qa(["Named data protection contact"], 4600));
body.push(note("If the school is not registered with the ODPC, we will flag it. Registration is inexpensive and is the school's obligation, not ours, but a system holding learner records makes it harder to ignore."));

body.push(h2("C4. Training and handover"));
body.push(qa([
  "How many staff need training?",
  "Can they be trained together, or in shifts?",
  "Preferred training dates",
  "Who will be the school's internal system administrator?",
  "Do you want printed user guides?",
], 4600));

body.push(h2("C5. Support after go-live"));
body.push(yesno([
  "Do you want a support agreement after handover?",
  "Do you expect changes and new features over time?",
  "Do you want us to hold and manage the backups?",
]));

body.push(h2("C6. Priorities"));
body.push(p("If everything cannot be delivered at once, what must work first? Number these 1 (most urgent) to 8."));
body.push(gridWith(["Priority (1–8)", "Area"], [2400, 7346],
  [
    ["", "Fees, receipts and balances"],
    ["", "Learner records and admission"],
    ["", "Examinations and report cards"],
    ["", "Attendance"],
    ["", "Transport"],
    ["", "Staff, payroll and leave"],
    ["", "Parent portal and SMS"],
    ["", "The public website"],
  ], 0));

body.push(h2("C7. Anything else"));
body.push(p("What does your current way of working do badly that this system must fix? What must it not break?"));
body.push(new Table({
  columnWidths: [W], width: { size: W, type: WidthType.DXA },
  rows: [new TableRow({ children: [new TableCell({
    width: { size: W, type: WidthType.DXA },
    margins: { top: 120, bottom: 120, left: 110, right: 110 },
    children: Array.from({ length: 8 }, () => new Paragraph({ spacing: { after: 180 }, children: [new TextRun({ text: "", size: 21 })] })),
  })] })],
}));

body.push(h2("C8. Confirmation"));
body.push(p("By signing, the school confirms the information given is accurate to the best of its knowledge and may be used to configure the system."));
body.push(new Table({
  columnWidths: [3200, 3200, 3346],
  width: { size: W, type: WidthType.DXA },
  rows: [
    new TableRow({ children: [
      cell("Name", { w: 3200, bold: true, fill: LIGHT }),
      cell("Position", { w: 3200, bold: true, fill: LIGHT }),
      cell("Signature and date", { w: 3346, bold: true, fill: LIGHT }),
    ]}),
    ...Array.from({ length: 3 }, () => new TableRow({
      children: [cell("", { w: 3200 }), cell("", { w: 3200 }), cell("", { w: 3346 })],
    })),
  ],
}));

/* ---- appendix ---- */
body.push(h1("Appendix — What to attach"));
body.push(p("Send these with the completed document. Photographs of printed pages are acceptable."));
body.push(gridWith(
  ["#", "Document", "Why it is needed", "Attached?"],
  [700, 3600, 3900, 1546],
  [
    ["1", "Current fee structure", "Loads vote heads and amounts without retyping", ""],
    ["2", "Class lists with learner names", "Bulk import of the learner roll", ""],
    ["3", "Outstanding fee balances per learner", "Opening balances, so arrears carry over correctly", ""],
    ["4", "Staff list with roles and phone numbers", "Creates staff records and logins", ""],
    ["5", "A sample report card", "Matches the format parents already know", ""],
    ["6", "A sample fee receipt", "Matches your receipt numbering and layout", ""],
    ["7", "School logo (digital or photograph)", "Website and all printed documents", ""],
    ["8", "Photographs of the school", "Website gallery", ""],
    ["9", "Transport routes and charges", "Sets up the transport module", ""],
    ["10", "Timetable (if one exists)", "Class and teacher timetables", ""],
  ], 2));

body.push(h2("A note on learner data"));
body.push(p("Class lists and fee balances contain personal information about children. Please send them by an agreed private channel rather than a public group, and tell us if any learner's information must be treated as confidential. Once the system is live, this data lives on the school's own server and is not shared with anyone."));

/* ================================================================ BUILD == */
const doc = new Document({
  creator: PREPARER,
  title: `${SCHOOL} — Requirements & Data Collection`,
  description: "Requirements gathering for the school website and management system",
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: "•",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 460, hanging: 240 } } },
      }],
    }],
  },
  styles: {
    default: { document: { run: { font: "Calibri", size: 21 } } },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 6 } },
        children: [new TextRun({ text: `${SCHOOL} — Requirements & Data Collection`, size: 16, color: "888888", font: "Calibri" })],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], size: 16, color: "888888", font: "Calibri" })],
      })] }),
    },
    children: body,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("St-Stephens-Requirements.docx", buf);
  console.log("written:", buf.length, "bytes");
});
