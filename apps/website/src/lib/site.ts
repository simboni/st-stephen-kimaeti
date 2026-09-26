/* ---------------------------------------------------------------------------
   St Stephen's School, Kimaeti — all site content lives in this file.
   Edit text, add news posts, events or gallery photos here; the pages render
   from this data automatically. Items marked `SAMPLE — replace` are realistic
   placeholders awaiting real school content.
--------------------------------------------------------------------------- */

export const site = {
  domain: "ststephenkimaeti.ac.ke",
  title: "St Stephen's School, Kimaeti — Primary, Junior & Early Years",
  description:
    "St Stephen's Mixed Day and Boarding School, Kimaeti (Bungoma) — Early Years, Primary and Junior education rooted in faith and service. Pray and Work.",
};

/** The school management system — contact & complaint forms post into its
 *  front-office queue. The deploy script sets NEXT_PUBLIC_EMS_URL from the
 *  server's EMS_DOMAIN; this fallback only matters for local builds. */
export const emsUrl =
  process.env.NEXT_PUBLIC_EMS_URL ?? "https://ems.ststephenkimaeti.ac.ke";

export const school = {
  name: "St Stephen Mixed Day and Boarding Primary School, Junior School & Early Years of Education Centre",
  shortName: "St Stephen's Kimaeti",
  location: "Kimaeti, Bungoma County, Kenya",
  motto: "Pray and Work",
  /* Vision, mission and values as the school gave them on its requirements
     form, tidied into sentence case. Confirm the wording before launch. */
  mission:
    "To promote intellectual, emotional and spiritual development in every learner.",
  vision:
    "To form a holistic, self-reliant person in society.",
  values: [
    "God-fearing",
    "Honesty",
    "Respect",
    "Punctuality",
    "Integrity",
    "Time management",
  ],
  welcome: "Come all and learn together.",
  intro:
    "St Stephen's, Kimaeti, is a mixed day and boarding school run by the Brothers of St Charles Lwanga. Founded in 2006, it teaches 525 learners from playgroup to Grade 9 across its Early Years, Primary and Junior sections, 157 of them boarding. SAMPLE - replace with the school's own wording.",
  email: "ststephenprimarykimaeti@gmail.com",
  phone: "0714 118 611",
  phoneHref: "+254714118611",
  address: "P.O. Box 93 – 50200, Bungoma",
  /** Existing school-portal login — replaced by the new EMS in phase two. */
  portalUrl: "https://ems.ststephenkimaeti.ac.ke",
};

/* From the Term II 2026 enrolment return - see docs/school/ENROLMENT-2026.md. */
export const stats = [
  { value: 525, suffix: "", label: "Learners enrolled today" },
  { value: 157, suffix: "", label: "Boarders in residence" },
  { value: 12, suffix: "", label: "Classes, playgroup to Grade 9" },
  { value: 2006, suffix: "", label: "Serving the community since" },
];

export const coreValues = [
  {
    title: "God-Fearing",
    text: "Faith in God is the foundation of all our activities, ensuring spiritual growth and moral integrity.",
    tone: "brand" as const,
  },
  {
    title: "Discipline",
    text: "Discipline is at the core of our education, fostering respect, responsibility and personal growth.",
    tone: "leaf" as const,
  },
  {
    title: "Hard Work",
    text: "We instil a strong work ethic, empowering learners to strive for excellence in all aspects of life.",
    tone: "sky" as const,
  },
  {
    title: "Social Transformation",
    text: "Education is a tool for change, and we encourage our pupils to impact society positively.",
    tone: "sun" as const,
  },
];

/** Academic sections offered, aligned to Kenya's Competency-Based Curriculum. */
export const academics = [
  {
    title: "Infant School — Early Years",
    levels: "Playgroup · PP1 · PP2",
    text: "A warm, playful start to learning. Our early-years classrooms build language, numeracy and social skills through guided play, music and storytelling.",
  },
  {
    title: "Primary School",
    levels: "Grade 1 – Grade 6",
    text: "Solid CBC foundations in literacy, numeracy, science and creative arts — with continuous assessment and small-group attention for every learner.",
  },
  {
    title: "Junior School",
    levels: "Grade 7 – Grade 9",
    text: "Broad-based junior secondary learning that develops competence and character, preparing pupils for senior school pathways with confidence.",
  },
];

export type NewsPost = {
  slug: string;
  title: string;
  date: string; // ISO date
  excerpt: string;
  body: string[]; // paragraphs
  image?: string;
};

// SAMPLE — replace with the school's real news posts.
export const news: NewsPost[] = [
  {
    slug: "new-classroom-block-officially-opened",
    title: "Our new classroom block is officially open",
    date: "2026-05-18",
    excerpt:
      "The colourful two-storey classroom block is now home to our junior school classes, giving every grade a bright, modern learning space.",
    body: [
      "It was a day of song, prayer and celebration as the school community gathered to officially open our new two-storey classroom block. The bright, well-ventilated classrooms now host our junior school grades.",
      "The new block adds spacious classrooms, staff offices and improved sanitation facilities. It is a major milestone in the school's growth from 13 founding learners to a family of more than 340 pupils.",
      "We thank our parents, the parish and all well-wishers whose support made this project possible. Learners today, leaders tomorrow!",
    ],
    image: "/campus-front.jpg",
  },
  {
    slug: "holy-cross-shines-at-music-festival",
    title: "Holy Cross shines at the county music festival",
    date: "2026-04-02",
    excerpt:
      "Our choir and verse-speaking teams brought home top positions from the county round of the Kenya Music Festival.",
    body: [
      "Our learners once again proved that talent grows here. The school choir and verse-speaking teams delivered outstanding performances at the county round of the Kenya Music Festival, earning top positions and qualifying for the regional round.",
      "Music, drama and performance are a proud part of life at Holy Cross — they build confidence, teamwork and joy in every child who takes part.",
      "Congratulations to our pupils and the teachers who prepared them. Watch our Students in Action videos on the home page to see them perform.",
    ],
    image: "/campus-courtyard.jpg",
  },
  {
    slug: "admissions-open-2027-intake",
    title: "Admissions are open for the 2027 intake",
    date: "2026-03-10",
    excerpt:
      "Places are available from Playgroup to Grade 9. Visit the school or contact the office to begin your child's journey.",
    body: [
      "We are now receiving applications for the 2027 academic year across all levels — Playgroup, PP1 and PP2 in the Infant School, and Grade 1 to Grade 9 in the Primary and Junior Schools.",
      "Parents are welcome to visit the school on any working day for a guided tour of our classrooms, boarding facilities and grounds. The school office will take you through the admission requirements and fee structure.",
      "Call 0714 103 761 or email info@holycrossbulimbo.com to book a visit, or see the Admissions page for the step-by-step process.",
    ],
  },
];

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
    text: "All learners report back for Term 3. Boarders arrive with their kit ready for inspection; day scholars report by 8:00 AM.",
  },
  {
    title: "Annual academic day & prize giving",
    date: "2026-10-16",
    time: "9:00 AM – 3:00 PM",
    venue: "School assembly grounds",
    text: "Parents join us to celebrate learners' academic achievement. Class exhibitions, performances by our choir, and awards for top performers.",
  },
  {
    title: "Parents' consultation day",
    date: "2026-11-06",
    time: "9:00 AM – 1:00 PM",
    venue: "Classrooms",
    text: "One-on-one meetings between parents and class teachers to review each learner's progress before end-of-year assessments.",
  },
  {
    title: "Holy Cross feast day & thanksgiving mass",
    date: "2026-09-14",
    time: "10:00 AM",
    venue: "Parish church, Bulimbo",
    text: "The whole school community celebrates the Feast of the Holy Cross with a thanksgiving mass followed by games and a shared meal.",
  },
];

export type GalleryItem = { src: string; alt: string; caption: string };

export const gallery: GalleryItem[] = [
  {
    src: "/campus-front.jpg",
    alt: "Front view of the Holy Cross school compound with the new classroom block",
    caption: "Our modern two-storey classroom block",
  },
  {
    src: "/campus-courtyard.jpg",
    alt: "Colourful classroom wing seen from the green courtyard",
    caption: "The bright courtyard where learners play and gather",
  },
];

/** YouTube videos of pupils performing — shown on the home page. */
export const videos = [
  { id: "8ploKviKZJo", title: "Holy Cross students in action" },
  { id: "OWmwhAjj6pk", title: "School performance" },
  { id: "oph62NpSoD4", title: "Music and movement" },
];

export const admissionSteps = [
  {
    title: "Visit or contact the school",
    text: "Come see the school on any working day, or call 0714 103 761 / email info@holycrossbulimbo.com to ask about available places.",
  },
  {
    title: "Collect an admission form",
    text: "Pick an admission form from the school office. You'll need a copy of the child's birth certificate and the most recent school report (for transfers).",
  },
  {
    title: "Assessment & placement",
    text: "New learners take a friendly placement assessment so we understand where they are and how best to support them.",
  },
  {
    title: "Complete enrolment",
    text: "Return the completed form with the required documents, pay the admission fee at the office, and receive the fee structure and school-requirements list.",
  },
];

/** WhatsApp number in international format (for wa.me links). */
export const whatsapp = "254714103761";

/** Short announcement shown as a pill in the hero — set text to "" to hide. */
export const announcement = {
  text: "Admissions are open for the 2027 intake",
  href: "/admissions/",
};

export type Testimonial = { quote: string; name: string; relation: string };

// SAMPLE — replace with real parent/alumni words (with their permission).
export const testimonials: Testimonial[] = [
  {
    quote:
      "Holy Cross turned my shy little girl into a confident reader who leads prayers at home. The teachers know every child by name.",
    name: "Mama Achieng'",
    relation: "Parent, Grade 3",
  },
  {
    quote:
      "Discipline and academics go hand in hand here. My son joined in PP2 and the growth we have seen in him is remarkable.",
    name: "Mr. Wafula",
    relation: "Parent, Grade 6",
  },
  {
    quote:
      "The values I learnt at Holy Cross carried me through high school. Learners today, leaders tomorrow is not just a motto — it's true.",
    name: "Sharon N.",
    relation: "Alumna, Class of 2022",
  },
];

export type Faq = { q: string; a: string };

export const faqs: Faq[] = [
  {
    q: "Which classes can my child join?",
    a: "We admit learners from Playgroup, PP1 and PP2 in the Infant School through Grade 1–6 in Primary and Grade 7–9 in Junior School — all following Kenya's Competency-Based Curriculum (CBC).",
  },
  {
    q: "How do I apply for admission?",
    a: "Visit the school on any working day or call 0714 103 761 to check for places. You'll fill an admission form, bring a copy of the child's birth certificate (and last report for transfers), and complete registration at the office. The Admissions page walks you through each step.",
  },
  {
    q: "Is Holy Cross a boarding or day school?",
    a: "We serve both day scholars and boarders. Ask the office about boarding places, requirements and the boarding fee structure for your child's class.",
  },
  {
    q: "What are the school fees?",
    a: "Fees depend on the class and whether your child is a boarder or day scholar. The office will give you the current fee structure when you visit or call — bursary and sibling considerations are handled case by case.",
  },
  {
    q: "Is the school faith-based?",
    a: "Yes — we are rooted in the Catholic tradition of the Holy Cross. Learners of all backgrounds are welcome; every child takes part in our values programme built on faith, discipline, hard work and service.",
  },
  {
    q: "How can I follow my child's progress?",
    a: "Parents receive termly report cards and are invited to consultation days each term. A parents' portal with live fee statements, attendance and results is launching soon as part of our new school management system.",
  },
];

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about/", label: "About Us" },
  { href: "/admissions/", label: "Admissions" },
  { href: "/news/", label: "News & Updates" },
  { href: "/events/", label: "Events" },
  { href: "/gallery/", label: "Gallery" },
  { href: "/contact/", label: "Contact Us" },
];

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
