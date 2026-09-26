/* ---------------------------------------------------------------------------
   St Stephen's, Kimaeti — every word on the public site lives in this file.
   The pages are layout; this is content. To change what the site says, change
   it here.

   Facts below come from the school's own papers unless a comment says
   otherwise:
     · letterheads and the 2026 fee sheets  → docs/school/FEE-STRUCTURE-2026.md
     · the Term II 2026 enrolment return    → docs/school/ENROLMENT-2026.md
     · the completed requirements form      → docs/school/requirements/

   Anything still marked SAMPLE is a realistic placeholder the school has to
   replace before launch. Search this file for "SAMPLE" to find them all.
--------------------------------------------------------------------------- */

export const site = {
  domain: "ststephenkimaeti.ac.ke",
  title: "St Stephen's Kimaeti — Early Years, Primary & Junior School, Bungoma",
  description:
    "St Stephen Mixed Day and Boarding School, Kimaeti, Bungoma County. 525 learners from Playgroup to Grade 9, day and boarding, under the Brothers of St Charles Lwanga. Pray and Work.",
};

/** The school management system — contact and complaint forms post into its
 *  front-office queue. The deploy script sets NEXT_PUBLIC_EMS_URL from the
 *  server's EMS_DOMAIN; this fallback only matters for local builds. */
export const emsUrl =
  process.env.NEXT_PUBLIC_EMS_URL ?? "https://ems.ststephenkimaeti.ac.ke";

export const school = {
  name: "St Stephen Mixed Day and Boarding Primary School, Junior School & Early Years of Education Centre",
  /** What the school is called in running text and in the header. */
  shortName: "St Stephen's Kimaeti",
  /** Shorter still, for the logo lockup. */
  wordmark: "St Stephen's",
  sponsor: "Brothers of St Charles Lwanga",
  founded: 2006,
  location: "Kimaeti, Bungoma County",
  /* The papers disagree: the letterhead says Box 93–50200 Bungoma, the
     administrator's stamp reads "Myanga–Bungoma", and the requirements form
     said Napara, Kimaeti ward. Confirm the physical location before launch. */
  ward: "Napara, Kimaeti Ward",
  motto: "Pray and Work",
  vision: "To form a holistic, self-reliant person in society.",
  mission:
    "To promote the intellectual, emotional and spiritual development of every learner.",
  values: [
    "God-fearing",
    "Honesty",
    "Respect",
    "Punctuality",
    "Integrity",
    "Time management",
  ],
  welcome: "Come all and learn together.",
  email: "ststephenprimarykimaeti@gmail.com",
  phone: "0714 118 611",
  phoneHref: "+254714118611",
  phoneAlt: "0724 570 171",
  phoneAltHref: "+254724570171",
  address: "P.O. Box 93 – 50200, Bungoma, Kenya",
  portalUrl: emsUrl,
};

/** WhatsApp number in international format (for wa.me links). */
export const whatsapp = "254714118611";

/** Short announcement shown as a pill in the hero — set text to "" to hide. */
export const announcement = {
  text: "Admissions are open for the 2027 intake",
  href: "/admissions/",
};

/* ------------------------------------------------------------- the school -- */

/** Two paragraphs of plain English for the home page and the About page. */
export const intro = [
  "St Stephen's is a mixed day and boarding school at Kimaeti in Bungoma County, sponsored by the Brothers of St Charles Lwanga. It opened in 2006 and now teaches 525 learners — from three-year-olds in Playgroup to Grade 9 candidates — across its Early Years, Primary and Junior sections.",
  "A hundred and fifty-seven of those learners board with us. Twenty-six teachers know every one of them by name. Our motto is two words long and it is the whole plan: Pray and Work.",
];

/* From the Term II 2026 enrolment return. */
export const stats = [
  { value: 525, suffix: "", label: "Learners on the roll" },
  { value: 157, suffix: "", label: "Boarders in residence" },
  { value: 26, suffix: "", label: "Teachers on the staff" },
  { value: 2006, suffix: "", label: "Teaching here since" },
];

/** The three sections, with real class counts from the enrolment return. */
export const sections = [
  {
    slug: "early-years",
    title: "Early Years",
    levels: "Playgroup · PP1 · PP2",
    learners: 123,
    photo: "early-years-desks",
    text: "A gentle, noisy, happy start. Language, numeracy and confidence built through play, song and story — and a teacher who notices when a three-year-old has had enough.",
  },
  {
    slug: "primary",
    title: "Primary School",
    levels: "Grade 1 – Grade 6",
    learners: 276,
    photo: "classroom-lesson",
    text: "The CBC foundation years. Reading, number, science and creative arts, assessed continuously rather than once a year, with small-group attention where a learner needs it.",
  },
  {
    slug: "junior",
    title: "Junior School",
    levels: "Grade 7 – Grade 9",
    learners: 126,
    photo: "learners-on-the-field",
    text: "Broad-based junior secondary learning with real practical work — our learners design, build and defend their own science projects — preparing them for senior school with something to show for it.",
  },
];

/** Why a parent should choose this school, each anchored to a photograph. */
export const pillars = [
  {
    title: "Learning you can hold",
    photo: "science-bottles",
    text: "Every learner builds and presents a project of their own at the school science and engineering fair. Osmosis in a jam jar, the oxygen atom modelled out of whatever was to hand, charts drawn by hand — and a case to argue in front of a judge.",
  },
  {
    title: "Boarding that feels like home",
    photo: "dining-hall",
    text: "157 boarders, a matron and master in each dormitory, three cooked meals a day, and supervised prep every evening. Parents are welcome on visiting days.",
  },
  {
    title: "Work as well as prayer",
    photo: "shamba-work",
    text: "The school shamba, the tree line and the water tank were all built by learners and staff together. Self-reliance is not a subject here; it is a habit.",
  },
  {
    title: "Sport, music and dance",
    photo: "cultural-troupe",
    text: "Football for the boys and the girls, a cultural dance troupe that travels, and music and verse teams that take the school beyond the ward.",
  },
];

/** The photo strip under "A day at St Stephen's". Order is the day's order. */
export const dayInTheLife = [
  { photo: "mass-outdoors", time: "7:30", label: "Assembly and prayers" },
  { photo: "classroom-lesson", time: "8:00", label: "First lesson" },
  { photo: "science-bottles", time: "11:00", label: "Practical work" },
  { photo: "dining-juniors", time: "13:00", label: "Lunch" },
  { photo: "football-team", time: "16:00", label: "Games" },
  { photo: "dining-hall", time: "19:00", label: "Supper and prep" },
];

/* ------------------------------------------------------------------ fees -- */

/** 2026 termly fees, exactly as the school's own sheets read. The Grade 4–6
 *  sheet has not been supplied — see docs/school/FEE-STRUCTURE-2026.md. */
export const fees = {
  year: 2026,
  rows: [
    { level: "Early Years (Playgroup, PP1, PP2)", t1: 6900, t2: 5400, t3: 4250, total: 16550 },
    { level: "Grade 1 – Grade 3", t1: 8800, t2: 5440, t3: 5170, total: 19410 },
    { level: "Grade 7 – Grade 9", t1: 17250, t2: 12950, t3: 11650, total: 41850 },
  ],
  /* Grade 4–6 is deliberately absent rather than invented. */
  missing: "Grade 4 – Grade 6",
  oneOff: [
    { item: "Registration (new learners)", amount: 500 },
    { item: "Placement assessment (new learners)", amount: 500 },
  ],
  uniform: [
    { item: "Uniform", eye: 900, primary: 1100, junior: 1500 },
    { item: "Sweater", eye: 900, primary: 1100, junior: 1200 },
    { item: "Games kit", eye: 900, primary: 1100, junior: 1200 },
    { item: "Tracksuit", eye: 1600, primary: 1850, junior: 1850 },
    { item: "Windbreaker", eye: null, primary: null, junior: 1100 },
  ],
  note: "Fees cover tuition, meals, medical, electricity, bus maintenance, games and music, welfare and development. Boarding and transport are quoted by the office. Bursary and sibling considerations are handled case by case — please ask.",
};

export const payment = {
  bank: { name: "KCB", account: "1117950980", holder: "St Stephen Primary" },
  mpesa: { paybill: "522123", label: "KCB Lipa Karo" },
  /** How the M-PESA account number must be typed, from the fee sheet. */
  accountFormat: "51180K",
  accountExample: "51180KMARYNEKESA",
};

export function money(kes: number) {
  return `KES ${kes.toLocaleString("en-KE")}`;
}

/* ------------------------------------------------------------ admissions -- */

export const admissionSteps = [
  {
    title: "Call or visit",
    text: `Ring ${school.phone} or come to the school on any working day. Ask for the office — someone will walk you round the classrooms, the dormitories and the grounds.`,
  },
  {
    title: "Collect an admission form",
    text: "The office gives you the form, the current fee structure and the requirements list. Bring a copy of the child's birth certificate, and the last report card if they are transferring.",
  },
  {
    title: "A friendly placement assessment",
    text: "New learners sit a short assessment so we know where they are and which class will suit them. It is not a pass-or-fail exam.",
  },
  {
    title: "Complete enrolment",
    text: "Return the form with the documents, pay the registration fee, and collect the uniform list. Your child starts on the agreed day with a class and a teacher already expecting them.",
  },
];

export type Faq = { q: string; a: string };

export const faqs: Faq[] = [
  {
    q: "Which classes do you offer?",
    a: "Playgroup, PP1 and PP2 in Early Years; Grade 1 to Grade 6 in Primary; and Grade 7 to Grade 9 in Junior School — twelve classes in all, following Kenya's Competency-Based Curriculum. Grade 9 is our highest class.",
  },
  {
    q: "Is St Stephen's a day school or a boarding school?",
    a: "Both. Of the 525 learners on the roll, 157 board. Boarders have a matron or master in charge of each dormitory, cooked meals and supervised evening prep.",
  },
  {
    q: "What do the fees come to?",
    a: `For 2026, Early Years is ${money(16550)} for the year, Grade 1–3 is ${money(19410)}, and Junior School is ${money(41850)}, payable by term. The office will give you the sheet for your child's class, including uniform and one-off charges.`,
  },
  {
    q: "How do I pay?",
    a: `By M-PESA to the KCB Lipa Karo paybill ${payment.mpesa.paybill}, using account number ${payment.accountFormat} followed by your child's name with no spaces — for example ${payment.accountExample}. Or into KCB account ${payment.bank.account}, "${payment.bank.holder}". Always bring or send the receipt to the office.`,
  },
  {
    q: "Is there a school bus?",
    a: "Yes. Ask the office about routes and stages near you, and what the transport charge is for your side of the ward.",
  },
  {
    q: "Is the school faith-based?",
    a: `We are sponsored by the ${school.sponsor} and our day begins and ends in prayer. Learners of every background are welcome, and all of them take part in the values programme — the motto is "${school.motto}" and both halves are meant.`,
  },
  {
    q: "How do I follow my child's progress?",
    a: "Report cards come home each term and parents are invited to consultation days. A parents' portal showing live fee statements, attendance and assessment results is being rolled out with the school's new management system.",
  },
];

/* ----------------------------------------------------------------- news --- */

export type NewsPost = {
  slug: string;
  title: string;
  date: string; // ISO date
  excerpt: string;
  body: string[]; // paragraphs
  photo?: string; // slug from lib/photos
};

// SAMPLE — written from the photographs, but the school must confirm the
// dates, names and details before launch.
export const news: NewsPost[] = [
  {
    slug: "science-and-engineering-fair",
    title: "The whole school turns scientist for a day",
    date: "2026-08-14",
    excerpt:
      "Every class from PP2 to Grade 9 built, drew and defended a project of its own at this year's science and engineering fair.",
    body: [
      "For one long, bright day the eucalyptus grove behind the classrooms became a laboratory. Desks were carried out under the trees, tents went up, and every class from PP2 to Grade 9 set out a project it had built itself.",
      "There were bottles of coloured water demonstrating chromatography, balloons proving that a gas takes the shape of its container, a hand-drawn solar system, a working model of conduction in liquids, and a great deal of careful argument in front of the judges.",
      "The fair is the clearest answer we can give to a parent who asks what CBC actually looks like. It looks like a nine-year-old explaining her own findings, out loud, to a stranger — and getting them right.",
    ],
    photo: "science-bottles",
  },
  {
    slug: "new-water-tank",
    title: "A water tank built by the school, for the school",
    date: "2026-06-05",
    excerpt:
      "Staff and learners spent the term raising a concrete tank beside the classroom block — clean water, close to the kitchen and the dormitories.",
    body: [
      "Water has always been the harder half of running a boarding school. This term the school community set about fixing it: staff, learners and local fundis built a concrete storage tank beside the classroom block, ring by ring.",
      "It now serves the kitchen, the handwashing stations at assembly, and the dormitories that house our 157 boarders.",
      "It cost far less than a contractor would have charged, and the learners who mixed the mortar will be able to point at it for the rest of their lives. Pray and work.",
    ],
    photo: "water-tank",
  },
  {
    slug: "admissions-open-2027",
    title: "Admissions are open for the 2027 intake",
    date: "2026-09-01",
    excerpt:
      "Places are available from Playgroup to Grade 9, day and boarding. Visit any working day or call the office.",
    body: [
      "We are receiving applications for the 2027 academic year across all twelve classes — Playgroup, PP1 and PP2 in Early Years, Grade 1 to 6 in Primary, and Grade 7 to 9 in Junior School.",
      "Parents are welcome to visit on any working day. Come and see the classrooms, the dormitories, the dining hall and the shamba before you decide; nobody should choose a school from a poster.",
      `Call ${school.phone} or ${school.phoneAlt}, or email ${school.email}. The Admissions page sets out the four steps.`,
    ],
    photo: "headteacher-and-pupils",
  },
];

/* --------------------------------------------------------------- events --- */

export type SchoolEvent = {
  title: string;
  date: string; // ISO date
  endDate?: string;
  time?: string;
  venue: string;
  text: string;
};

// SAMPLE — replace with the school's real calendar.
export const events: SchoolEvent[] = [
  {
    title: "Term 3 opening day",
    date: "2026-09-01",
    time: "8:00 AM",
    venue: "School grounds",
    text: "All learners report for Term 3. Boarders arrive with their kit ready for inspection; day scholars report by 8:00 AM.",
  },
  {
    title: "Grade 9 external assessment",
    date: "2026-10-06",
    endDate: "2026-10-09",
    venue: "Junior School block",
    text: "Our Grade 9 candidates sit the national junior school assessment. The timetable is posted on the notice board and sent to parents.",
  },
  {
    title: "Academic day and prize giving",
    date: "2026-10-16",
    time: "9:00 AM – 3:00 PM",
    venue: "School assembly ground",
    text: "Parents join us to celebrate the year's work. Class exhibitions, the cultural troupe and the choir, and awards for the top performers in every class.",
  },
  {
    title: "Parents' consultation day",
    date: "2026-11-06",
    time: "9:00 AM – 1:00 PM",
    venue: "Classrooms",
    text: "One-to-one meetings between parents and class teachers to go through each learner's progress before the end-of-year assessments.",
  },
];

/* --------------------------------------------------------- testimonials --- */

export type Testimonial = { quote: string; name: string; relation: string };

/** The home page shows the testimonials only when this is true.
 *
 *  It is false because the quotes below are SAMPLES — nobody said them. An
 *  invented parent quote on a school's own website is a lie about a real
 *  person, so the section stays hidden until the school supplies real words
 *  and permission to use them. Replace the array, then flip this to true. */
export const showTestimonials = false;

// SAMPLE — do not publish until real parents and alumni have given these
// words and their permission to use them.
export const testimonials: Testimonial[] = [
  {
    quote:
      "I moved my daughter here in Grade 4. By the end of the year she was standing in front of strangers explaining her own science project. That is not the child who left the other school.",
    name: "Parent, Grade 6",
    relation: "SAMPLE — awaiting the school's real quotes",
  },
  {
    quote:
      "My son boards. I was worried about the food and the nights. I have visited unannounced twice and found him fed, warm and doing prep. That is all a parent wants.",
    name: "Parent, Grade 8",
    relation: "SAMPLE — awaiting the school's real quotes",
  },
  {
    quote:
      "Pray and Work sounds like a slogan until you have dug the shamba and then sat down to revise. It stayed with me.",
    name: "Alumnus",
    relation: "SAMPLE — awaiting the school's real quotes",
  },
];

/* ------------------------------------------------------------------ nav --- */

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about/", label: "About" },
  { href: "/admissions/", label: "Admissions" },
  { href: "/fees/", label: "Fees" },
  { href: "/news/", label: "News" },
  { href: "/events/", label: "Events" },
  { href: "/gallery/", label: "Gallery" },
  { href: "/contact/", label: "Contact" },
];

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
