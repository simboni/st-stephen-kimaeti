/* ---------------------------------------------------------------------------
   St Stephen’s, Kimaeti — every word on the public site lives in this file.
   The pages are layout; this is content. To change what the site says, change
   it here.

   Facts below come from the school’s own papers unless a comment says
   otherwise:
     · letterheads and the 2026 fee sheets  → docs/school/FEE-STRUCTURE-2026.md
     · the Term II 2026 enrolment return    → docs/school/ENROLMENT-2026.md
     · the completed requirements form      → docs/school/requirements/

   Anything still marked SAMPLE is a realistic placeholder the school has to
   replace before launch. Search this file for "SAMPLE" to find them all.
--------------------------------------------------------------------------- */

export const site = {
  domain: "ststephenkimaeti.ac.ke",
  title: "St Stephen’s Brothers’ School — Kimaeti, Bungoma",
  /* Says nothing about grades on purpose. The roll figures and the grade range
     elsewhere in this file still describe the Playgroup-to-Grade-9 school the
     fee sheets and letterheads document; the school has mentioned a Senior
     School but not yet said which senior grades run or how many learners are
     in them, so nothing here may claim them. */
  description:
    "St Stephen Mixed Day and Boarding School, Kimaeti, Bungoma County. Day and boarding, under the Brothers of St Charles Lwanga, since 2002. Pray and Work.",
};

/**
 * True on the GitHub Pages preview build, false on the real site.
 *
 * The preview carries photographs of identifiable children, the school's fee
 * figures, and sample news and term dates nobody at the school has approved
 * yet. It exists so the school and Peter can look at the build from a phone —
 * not so it can turn up in a search for the school's name before anyone has
 * signed it off. When it is true the site asks not to be indexed, and says so
 * on the page.
 *
 * The deploy workflow sets NEXT_PUBLIC_SITE_PREVIEW. Drop it, or set it to
 * anything other than "1", for the real launch.
 */
export const isPreview = process.env.NEXT_PUBLIC_SITE_PREVIEW === "1";

/** The school management system — contact and complaint forms post into its
 *  front-office queue. The deploy script sets NEXT_PUBLIC_EMS_URL from the
 *  server’s EMS_DOMAIN; this fallback only matters for local builds. */
export const emsUrl =
  process.env.NEXT_PUBLIC_EMS_URL ?? "https://ems.ststephenkimaeti.ac.ke";

export const school = {
  /* Given by the school on 30 September 2026, replacing the long
     "Early Years of Education, Primary, Junior and Senior School" title it
     sent two days earlier. The message spelt it "ST STEPEHENS BROTHER'S
     SCHOOL"; Stepehens is a transposition of Stephens — the saint's name is
     on the crest, the letterheads and the school's own email address — and
     the sponsor is the *Brothers* of St Charles Lwanga, so it is set here as
     the plural possessive. Both readings are flagged for the school. Note
     that this is NOT the bank account name: see `payment.bank.holder`. */
  name: "St Stephen’s Brothers’ School",
  /** What the school is called in running text and in the header. */
  shortName: "St Stephen’s Kimaeti",
  /** Shorter still, for the logo lockup. */
  wordmark: "St Stephen’s",
  sponsor: "Brothers of St Charles Lwanga",
  /* 2002, per the school on 30 September 2026. Earlier copy said 2006. */
  founded: 2002,
  location: "Kimaeti, Bungoma County",
  /* The papers disagree: the letterhead says Box 93–50200 Bungoma, the
     administrator’s stamp reads "Myanga–Bungoma", and the requirements form
     said Napara, Kimaeti ward. Confirm the physical location before launch. */
  ward: "Napara, Kimaeti Ward",
  motto: "Pray and Work",
  /* Painted on the classroom wall, above the vision: "THE SCHOOL MOTTO —
     ORA ET LABORA (PRAY & WORK)". The Latin is the old Benedictine formula. */
  mottoLatin: "Ora et Labora",
  vision: "To form a holistic, self-reliant person in society.",
  mission:
    "To promote the intellectual, emotional and spiritual development of every learner.",
  /* From the completed requirements form. Note that the values painted on the
     classroom wall are a slightly different list — the legible words include
     Friendly, Professionalism and Accountability. Ask the school which set is
     current before launch. */
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
  address: "P.O. Box 93 – 50200, Bungoma, Kenya",
  portalUrl: emsUrl,
};

/* One published line, the director's, by the school's instruction on
   30 September 2026 — it had given three with roles two days earlier and then
   asked for this one only. The head teacher's and accountant's numbers are
   therefore off the site; they are recorded in docs/school/FEE-STRUCTURE-2026.md
   so nobody has to ask for them twice.

   This stays an array, and every page still maps over it, so restoring the
   other two is one edit here rather than a change to six components. */
export const contacts = [
  { role: "Director", phone: "0728 836 150", href: "+254728836150" },
];

/** The number shown in the header strip and used for "call the school". */
export const primaryPhone = contacts[0];

/** WhatsApp number in international format (for wa.me links). */
export const whatsapp = "254728836150";

/** Short announcement shown as a pill in the hero — set text to "" to hide. */
export const announcement = {
  text: "Admissions are open for the 2027 intake",
  href: "/admissions/",
};

/* ------------------------------------------------------------- the school -- */

/** Two paragraphs of plain English for the home page and the About page. */
export const intro = [
  "St Stephen’s is a mixed day and boarding school at Kimaeti in Bungoma County, sponsored by the Brothers of St Charles Lwanga. It opened in 2002 and now teaches 525 learners — from three-year-olds in Playgroup to Grade 9 candidates — across its Early Years, Primary and Junior sections.",
  "A hundred and fifty-seven of those learners board with us. Twenty-six teachers know every one of them by name. Our motto is two words long and it is the whole plan: Pray and Work.",
];

/* From the Term II 2026 enrolment return. */
export const stats = [
  { value: 525, suffix: "", label: "Learners on the roll" },
  { value: 157, suffix: "", label: "Boarders in residence" },
  { value: 26, suffix: "", label: "Teachers on the staff" },
  { value: 2002, suffix: "", label: "Teaching here since" },
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
    text: "157 boarders, a matron or master in charge of each dormitory, three cooked meals a day and supervised prep every evening. Parents are welcome on visiting days, announced or not.",
  },
  {
    title: "Work as well as prayer",
    photo: "agriculture-lesson",
    text: "The shamba, the kitchen garden in its old tyres, the tree line and the water tank were all made by learners and staff together. Agriculture is taught standing in the beds. Self-reliance is not a subject here; it is a habit.",
  },
  {
    title: "A school that travels",
    photo: "festival-troupe",
    text: "Football for the boys and the girls, a dance troupe and a drama team that compete at the music festival, and trips that have taken our learners as far as Kisumu International Airport.",
  },
];

/* ----------------------------------------------------------- school life -- */

/** The five strands of life outside the timetable. Each is its own section on
 *  /school-life, and each is anchored to photographs rather than adjectives. */
export const lifeStrands = [
  {
    slug: "boarding",
    title: "Boarding",
    icon: "bed" as const,
    lead: "157 of our 525 learners sleep here, so the evening matters as much as the morning.",
    body: [
      "Boarding here is not a dormitory bolted onto a day school. Nearly a third of the roll sleeps on the compound, so the evening — prep, supper, prayers, lights out — is as much part of the school’s week as the morning.",
      "Parents are welcome on visiting days, and welcome to come unannounced. We would rather you saw the place as it actually runs.",
    ],
    photos: ["dining-hall", "dining-juniors"],
  },
  {
    slug: "faith",
    title: "Faith",
    icon: "cross" as const,
    lead: "Mass is said in the open air, with the whole school standing round the lectern.",
    body: [
      "The school belongs to the Brothers of St Charles Lwanga, and the day opens and closes in prayer. Learners of every background are welcome and all take part in the values programme.",
      "Nothing about it is done behind closed doors — the altar table is carried out under the trees and the congregation is 525 learners deep.",
    ],
    photos: [
      "communion-brother",
      "communion-class",
      "mass-altar-candles",
      "altar-servers-cross",
      "mass-outdoors",
      "mass-lectern",
    ],
  },
  {
    slug: "music",
    title: "Music, dance and drama",
    icon: "music" as const,
    lead: "A dance troupe, a cultural group and a drama team — all of which travel, and come back with something.",
    body: [
      "The troupes rehearse outside the art room and perform far from Kimaeti. For a school in a rural ward, getting thirty learners onto a bus with a keyboard is a logistical feat; doing it every year is a tradition.",
      "Music and verse build the confidence that later shows up in a Grade 8 defending a science project in front of strangers.",
    ],
    photos: ["festival-troupe", "cultural-dancers", "troupe-close", "festival-travel"],
  },
  {
    slug: "sport",
    title: "Sport",
    icon: "trophy" as const,
    lead: "Football for the boys and the girls, and games every afternoon before prep.",
    body: [
      "The pitch is the flat ground at the top of the compound. Teams are picked from Grade 5 upwards and play through the term against the other schools in the ward.",
    ],
    photos: ["football-team", "football-squad"],
  },
  {
    slug: "shamba",
    title: "The shamba",
    icon: "leaf" as const,
    lead: "A working farm, a kitchen garden in old tyres, and agriculture taught standing in the beds.",
    body: [
      "Onions, kale and vegetables grow in timber-framed beds and stacked tyres a few steps from the classrooms. Learners dig, plant, weed and harvest, and the kitchen uses what comes out.",
      "It is the cheapest possible way to teach CBC agriculture and the most convincing: the lesson is the crop.",
    ],
    photos: ["kitchen-garden", "agriculture-lesson", "shamba-work", "farm-plot"],
  },
  {
    slug: "trips",
    title: "Beyond the ward",
    icon: "bus" as const,
    lead: "Our learners have stood under the sign at Kisumu International Airport. For most, the first aeroplane they had seen up close.",
    body: [
      "Educational trips take whole year groups out of Bungoma. They cost money and take organising, and they are worth both — a child who has been somewhere believes they can go somewhere.",
    ],
    photos: ["kisumu-airport", "airport-group", "school-gate-trip"],
  },
];

/* ------------------------------------------------------------- calendar -- */

/** Kenya’s three-term year as the school runs it. SAMPLE dates — confirm
 *  against the Ministry calendar and the school’s own diary before launch.
 *  These drive the term-dates table and the .ics download. */
export const terms = [
  { name: "Term 1, 2027", opens: "2027-01-04", closes: "2027-04-09", halfTerm: "2027-02-18" },
  { name: "Term 2, 2027", opens: "2027-05-03", closes: "2027-08-06", halfTerm: "2027-06-24" },
  { name: "Term 3, 2027", opens: "2027-08-30", closes: "2027-10-22", halfTerm: "2027-09-24" },
];

/** The photo strip under "A day at St Stephen’s". Order is the day’s order. */
/** The photographs that crossfade behind the hero. Five, chosen to say five
 *  different things in the first thirty seconds: this is a school, it sings,
 *  it prays, it works, it plays. Order matters — the first is what a visitor
 *  sees before anything else has loaded, so it has to be the one that says
 *  "school" without a caption. */
/* The photographs behind the headline. First one first: it is the single
   warmest picture the school has sent — a Brother ringed by pupils on First
   Communion day, half of them giving a thumbs up — and a parent deciding
   between schools sees it before they read a word.

   festival-troupe and football-team are 1040x780 and 1600x720, small enough
   that a full-bleed hero on a large screen softens them. They have been moved
   down the list so the sharp ones carry the first impression, and they still
   appear at tile size in the gallery, where the resolution is ample. */
export const heroSlides = [
  "communion-brother",
  "learners-on-the-field",
  "procession-to-chapel",
  "communion-class",
  "agriculture-lesson",
  "mass-altar-candles",
];

export const dayInTheLife = [
  { photo: "mass-outdoors", time: "7:30", label: "Assembly and prayers" },
  { photo: "classroom-lesson", time: "8:00", label: "First lesson" },
  { photo: "science-bottles", time: "11:00", label: "Practical work" },
  { photo: "dining-juniors", time: "13:00", label: "Lunch" },
  { photo: "football-team", time: "16:00", label: "Games" },
  { photo: "dining-hall", time: "19:00", label: "Supper and prep" },
];

/* ------------------------------------------------------------------ fees -- */

/** 2026 termly fees, exactly as the school’s own sheets read. The Grade 4–6
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
  /* The account name is spelt "Stefan", not "Stephen", and it is not a typo —
     it is how the account is registered at the bank, confirmed by the school
     on 28 September 2026. A transfer made out to "St Stephen" can be bounced
     or held. Do not make it agree with school.name. */
  bank: { name: "KCB", account: "1117950980", holder: "St. Stefan Primary School" },
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
    text: `Ring ${primaryPhone.phone} or come to the school on any working day. Ask for the office — someone will walk you round the classrooms, the dormitories and the grounds.`,
  },
  {
    title: "Collect an admission form",
    text: "The office gives you the form, the current fee structure and the requirements list. Bring a copy of the child’s birth certificate, and the last report card if they are transferring.",
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
    a: "Playgroup, PP1 and PP2 in Early Years; Grade 1 to Grade 6 in Primary; and Grade 7 to Grade 9 in Junior School — twelve classes in all, following Kenya’s Competency-Based Curriculum. Grade 9 is our highest class.",
  },
  {
    q: "Is St Stephen’s a day school or a boarding school?",
    a: "Both. Of the 525 learners on the roll, 157 board. Boarders have a matron or master in charge of each dormitory, cooked meals and supervised evening prep.",
  },
  {
    q: "What do the fees come to?",
    a: `For 2026, Early Years is ${money(16550)} for the year, Grade 1–3 is ${money(19410)}, and Junior School is ${money(41850)}, payable by term. The office will give you the sheet for your child’s class, including uniform and one-off charges.`,
  },
  {
    q: "How do I pay?",
    a: `By M-PESA to the KCB Lipa Karo paybill ${payment.mpesa.paybill}, using account number ${payment.accountFormat} followed by your child’s name with no spaces — for example ${payment.accountExample}. Or into KCB account ${payment.bank.account}, "${payment.bank.holder}". Always bring or send the receipt to the office.`,
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
    q: "How do I follow my child’s progress?",
    a: "Report cards come home each term and parents are invited to consultation days. A parents' portal showing live fee statements, attendance and assessment results is being rolled out with the school’s new management system.",
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
      "Every class from PP2 to Grade 9 built, drew and defended a project of its own at this year’s science and engineering fair.",
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
      `Call ${contacts.map((c) => c.phone).join(" or ")}, or email ${school.email}. The Admissions page sets out the four steps.`,
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

// SAMPLE — replace with the school’s real calendar.
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
    text: "Parents join us to celebrate the year’s work. Class exhibitions, the cultural troupe and the choir, and awards for the top performers in every class.",
  },
  {
    title: "Parents' consultation day",
    date: "2026-11-06",
    time: "9:00 AM – 1:00 PM",
    venue: "Classrooms",
    text: "One-to-one meetings between parents and class teachers to go through each learner’s progress before the end-of-year assessments.",
  },
];

/* --------------------------------------------------------- testimonials --- */

export type Testimonial = { quote: string; name: string; relation: string };

/** The home page shows the testimonials only when this is true.
 *
 *  It is false because the quotes below are SAMPLES — nobody said them. An
 *  invented parent quote on a school’s own website is a lie about a real
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
    relation: "SAMPLE — awaiting the school’s real quotes",
  },
  {
    quote:
      "My son boards. I was worried about the food and the nights. I have visited unannounced twice and found him fed, warm and doing prep. That is all a parent wants.",
    name: "Parent, Grade 8",
    relation: "SAMPLE — awaiting the school’s real quotes",
  },
  {
    quote:
      "Pray and Work sounds like a slogan until you have dug the shamba and then sat down to revise. It stayed with me.",
    name: "Alumnus",
    relation: "SAMPLE — awaiting the school’s real quotes",
  },
];

/* ------------------------------------------------------------------ nav --- */

export const navLinks = [
  { href: "/about/", label: "About" },
  { href: "/academics/", label: "Academics" },
  { href: "/school-life/", label: "School life" },
  { href: "/admissions/", label: "Admissions" },
  { href: "/fees/", label: "Fees" },
  { href: "/gallery/", label: "Gallery" },
  { href: "/news/", label: "News" },
  { href: "/contact/", label: "Contact" },
];

/** Everything, for the footer sitemap and the mobile menu. */
export const allLinks = [
  {
    heading: "The school",
    links: [
      { href: "/about/", label: "About us" },
      { href: "/academics/", label: "Academics" },
      { href: "/school-life/", label: "School life" },
      { href: "/gallery/", label: "Gallery" },
    ],
  },
  {
    heading: "Joining us",
    links: [
      { href: "/admissions/", label: "Admissions" },
      { href: "/fees/", label: "Fees" },
      { href: "/contact/", label: "Visit the school" },
      { href: "/complain/", label: "Raise a concern" },
    ],
  },
  {
    heading: "Keeping up",
    links: [
      { href: "/news/", label: "News" },
      { href: "/events/", label: "Term dates & events" },
      { href: "/portal/", label: "Parents' portal" },
      // Not a page: a route handler that returns XML. `file: true` tells the
      // footer to render a plain <a>, because Next's router would try to
      // client-navigate to it as a route and fail.
      { href: "/news.xml", label: "News feed (RSS)", file: true },
    ],
  },
];

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
