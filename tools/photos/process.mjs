/* Curate the school's photographs into the web-ready set the site renders.

   Input  : sources.txt      — one source path per line, relative to SOURCE_DIR.
                               Line N is the photo referred to as "U<NNN>" in
                               the PICKS table below (U000 is the first line).
            SOURCE_DIR       — where the originals live. The 104 originals the
                               school sent over WhatsApp are NOT in this repo
                               (28 MB of duplicates); ask Peter for the archive,
                               or point this at a fresh drop.
   Output : apps/website/public/photos/<slug>-<width>.webp, several widths each
            apps/website/src/lib/photos.ts — the typed index, alt text included.

   Run:  SOURCE_DIR=/path/to/originals node tools/photos/process.mjs

   To add a photograph: put the file at the end of sources.txt, add a row to
   PICKS with its line number, and re-run. Everything downstream — the gallery
   page, the srcsets, the blur placeholders — follows from the index.          */
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const WEB = path.resolve(HERE, "../../apps/website");
const OUT = path.join(WEB, "public/photos");
const SOURCE_DIR = process.env.SOURCE_DIR ?? path.join(HERE, "originals");

// sharp comes from the website's own dependencies (Next.js installs it).
const require = createRequire(path.join(WEB, "/"));
const sharp = require("sharp");

/* Widths we emit. A photo never gets upscaled past its own width, and the
   largest variant is capped so a 1600px phone photo stays a 1600px file. */
const WIDTHS = [480, 800, 1200, 1800];

/* ---------------------------------------------------------------- selection --

   Hand-picked from the contact sheets. `i` is the stable index printed on the
   sheet; everything else is what the site needs to show the photo well.
   `focus` steers the crop when a tile is much wider or taller than the source:
   "attention" lets sharp find the subject, "north" keeps heads in frame.        */

const PICKS = [
  // --- the staff ----------------------------------------------------------
  { i: 64, slug: "staff-outside-block", cat: "staff", focus: "north",
    alt: "The teaching staff of St Stephen's standing together outside the long sky-blue classroom block",
    caption: "Twenty-six teachers, one staffroom" },
  { i: 61, slug: "staff-parade", cat: "staff", focus: "north",
    alt: "Members of staff lined up along the classroom veranda before the school day",
    caption: "Before the bell" },

  // --- the compound -------------------------------------------------------
  { i: 50, slug: "classroom-lesson", cat: "campus", focus: "attention",
    alt: "A teacher standing over young learners working at a desk inside a classroom",
    caption: "Inside a classroom" },
  { i: 22, slug: "school-grounds", cat: "campus", focus: "attention",
    alt: "A speaker addressing the school beside the flowerbeds, with the sky-blue buildings behind",
    caption: "The compound at Kimaeti" },
  { i: 69, slug: "water-tank", cat: "campus", focus: "attention",
    alt: "Learners and workmen laying the concrete rings of the school's water tank",
    caption: "Building the school's water tank" },
  { i: 85, slug: "tank-rings", cat: "campus", focus: "attention",
    alt: "Staff and learners easing a concrete ring into the ground during the water project",
    caption: "The water project, ring by ring" },

  // --- boarding and meals -------------------------------------------------
  { i: 60, slug: "dining-hall", cat: "boarding", focus: "attention",
    alt: "Boarders seated along a long dining table with plates and water bottles",
    caption: "Supper in the dining hall" },
  { i: 74, slug: "dining-juniors", cat: "boarding", focus: "attention",
    alt: "Junior school boarders eating together at the dining tables",
    caption: "157 boarders eat here every day" },

  // --- faith --------------------------------------------------------------
  { i: 78, slug: "mass-outdoors", cat: "faith", focus: "attention",
    alt: "A priest in green vestments at a lectern in the school compound, the whole school standing around him",
    caption: "Open-air Mass in the compound" },
  { i: 66, slug: "mass-lectern", cat: "faith", focus: "attention",
    alt: "Learners standing with hands joined in prayer around the lectern at an open-air Mass",
    caption: "The praying half of the motto" },

  // --- early years --------------------------------------------------------
  { i: 49, slug: "early-years-nutrition", cat: "earlyyears", focus: "attention",
    alt: "Early-years children in yellow t-shirts behind a table of vegetables, fish and chapati, with hand-drawn charts naming each food",
    caption: "Food groups, Early Years" },
  { i: 13, slug: "early-years-desks", cat: "earlyyears", focus: "attention",
    alt: "Small children in yellow t-shirts sitting at a desk at the science fair",
    caption: "Playgroup, PP1 and PP2" },
  { i: 54, slug: "early-years-presenting", cat: "earlyyears", focus: "north",
    alt: "A boy in a yellow t-shirt standing beside his own project chart, waiting to explain it",
    caption: "His first time presenting" },
  { i: 28, slug: "gases-balloons", cat: "earlyyears", focus: "north",
    alt: "Three small boys holding balloons beside a chart reading: gases do not have fixed shape, they take the shape of the balloon",
    caption: "\u201cThey take the shape of the balloon\u201d" },

  // --- academics: the science and engineering fair ------------------------
  { i: 20, slug: "science-bottles", cat: "academics", focus: "attention",
    alt: "Learners pouring liquid between bottles and jars at an outdoor bench, beside a chart headed Investigating Osmosis",
    caption: "Investigating osmosis" },
  { i: 35, slug: "lab-coats", cat: "academics", focus: "north",
    alt: "Learners in white lab coats demonstrating their apparatus for softening hard water",
    caption: "Softening hard water" },
  { i: 53, slug: "conduction-liquid", cat: "academics", focus: "north",
    alt: "Pupils presenting a chart headed Conduction in Liquid outside a classroom",
    caption: "Conduction in liquids" },
  { i: 11, slug: "project-chart", cat: "academics", focus: "north",
    alt: "Two learners at their table with a chart showing the arrangement of particles in solids, liquids and gases",
    caption: "The arrangement of particles" },
  { i: 26, slug: "girls-presenting", cat: "academics", focus: "north",
    alt: "Girls in blue check dresses presenting their model under the fair tent",
    caption: "Presenting under the tents" },
  { i: 30, slug: "phototropism", cat: "academics", focus: "north",
    alt: "Learners standing beside a chart headed: plants grow towards the source of light",
    caption: "Plants grow towards the light" },
  { i: 38, slug: "young-exhibitors", cat: "academics", focus: "north",
    alt: "Young learners behind their exhibit on conduction in solids, under the fair tent",
    caption: "Conduction in solids" },
  { i: 44, slug: "oxygen-model", cat: "academics", focus: "north",
    alt: "Learners seated behind a hand-drawn model of the oxygen atom built from locally available materials",
    caption: "Modelling the oxygen atom" },
  { i: 59, slug: "explaining-to-judge", cat: "academics", focus: "north",
    alt: "Two boys explaining their project to a teacher judging the science fair",
    caption: "Making the case to the judge" },
  { i: 37, slug: "fair-stand", cat: "academics", focus: "north",
    alt: "Learners at exhibition stand 114, a teacher in a white coat standing behind them",
    caption: "Stand 114" },

  // --- sport, culture, community -----------------------------------------
  { i: 88, slug: "football-team", cat: "sport", focus: "attention",
    alt: "The school football team in yellow-green kit posing with the ball on the pitch",
    caption: "The school team" },
  { i: 72, slug: "football-squad", cat: "sport", focus: "attention",
    alt: "Footballers in yellow-green strip lined up before kick-off",
    caption: "Before kick-off" },
  { i: 68, slug: "cultural-troupe", cat: "culture", focus: "attention",
    alt: "The cultural dance troupe in matching blue patterned outfits and red headbands",
    caption: "Our cultural dance troupe" },
  { i: 70, slug: "shamba-work", cat: "community", focus: "attention",
    alt: "Learners standing on the freshly planted school shamba",
    caption: "Work as well as prayer" },
  { i: 90, slug: "farm-plot", cat: "community", focus: "attention",
    alt: "Pupils in sky-blue t-shirts on the school farm plot, the seedlings just coming up",
    caption: "The school shamba" },

  // --- faces --------------------------------------------------------------
  { i: 86, slug: "learners-on-the-field", cat: "life", focus: "attention",
    alt: "Junior school learners in sky-blue shirts and maroon ties standing together on the grass",
    caption: "Junior school, Grade 7 to 9" },
  { i: 65, slug: "headteacher-and-pupils", cat: "life", focus: "attention",
    alt: "A member of staff among a crowd of learners in the compound, the classroom block behind",
    caption: "Known by name" },
  { i: 83, slug: "pupils-maroon-jumpers", cat: "life", focus: "attention",
    alt: "A crowd of primary learners in maroon jumpers smiling at the camera",
    caption: "Between lessons" },
  { i: 80, slug: "pupils-under-trees", cat: "life", focus: "attention",
    alt: "Learners in maroon jumpers gathered under the trees at the edge of the compound",
    caption: "Under the trees" },
];

/* ------------------------------------------------------------------- build -- */

const sources = (await readFile(path.join(HERE, "sources.txt"), "utf8"))
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

const seen = new Set();
for (const p of PICKS) {
  if (seen.has(p.slug)) throw new Error(`duplicate slug ${p.slug}`);
  if (seen.has(`i${p.i}`)) throw new Error(`photo U${p.i} picked twice`);
  seen.add(p.slug).add(`i${p.i}`);
  if (!sources[p.i]) throw new Error(`no source on line ${p.i} of sources.txt`);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const index = [];
for (const pick of PICKS) {
  const src = path.join(SOURCE_DIR, sources[pick.i]);
  const img = sharp(src, { failOn: "none" }).rotate(); // honour EXIF orientation
  const meta = await img.metadata();
  const w = meta.autoOrient?.width ?? meta.width;
  const h = meta.autoOrient?.height ?? meta.height;

  const widths = WIDTHS.filter((x) => x <= w);
  if (widths.length === 0 || widths.at(-1) < w) widths.push(Math.min(w, 1800));

  for (const width of widths) {
    await sharp(src, { failOn: "none" })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      /* These are phone snaps of dusty compounds and eucalyptus — noisy detail
         that WebP spends a lot of bits on for no visible gain. Lower quality
         on the big variants keeps hero files near 150 KB, not 400 KB. */
      .webp({ quality: width >= 1200 ? 68 : 72, effort: 6, smartSubsample: true })
      .toFile(path.join(OUT, `${pick.slug}-${width}.webp`));
  }

  /* A 20px-wide WebP inlined as a data URI. Blown up and blurred by CSS it
     holds the layout with the right colours while the real file loads. */
  const tiny = await sharp(src, { failOn: "none" })
    .rotate()
    .resize({ width: 20 })
    .webp({ quality: 32 })
    .toBuffer();

  index.push({
    slug: pick.slug,
    cat: pick.cat,
    alt: pick.alt,
    caption: pick.caption,
    focus: pick.focus,
    width: Math.min(w, widths.at(-1)),
    height: Math.round((h * Math.min(w, widths.at(-1))) / w),
    widths,
    blur: `data:image/webp;base64,${tiny.toString("base64")}`,
  });
  process.stdout.write(`${pick.slug} ${w}x${h} -> ${widths.join(",")}\n`);
}

const ts = `/* GENERATED by scratchpad/photos/process.mjs — do not edit by hand.
   ${index.length} photographs from the school, exported as responsive WebP
   into public/photos/. Every entry carries its own alt text and caption. */

export type PhotoCategory =
  | "staff"
  | "campus"
  | "boarding"
  | "faith"
  | "earlyyears"
  | "academics"
  | "sport"
  | "culture"
  | "community"
  | "life";

export type Photo = {
  slug: string;
  cat: PhotoCategory;
  alt: string;
  caption: string;
  /** object-position hint for tiles cropped tighter than the source. */
  focus: "attention" | "north";
  width: number;
  height: number;
  widths: number[];
  /** 20px WebP, inlined — the blur shown while the real file loads. */
  blur: string;
};

export const photos: Photo[] = ${JSON.stringify(index, null, 2)};

const bySlug = new Map(photos.map((p) => [p.slug, p]));

/** Look a photo up by slug. Throws at build time if the slug is wrong, so a
 *  typo in a page never ships as a silently missing image. */
export function photo(slug: string): Photo {
  const found = bySlug.get(slug);
  if (!found) throw new Error(\`Unknown photo "\${slug}"\`);
  return found;
}

export function photosIn(cat: PhotoCategory): Photo[] {
  return photos.filter((p) => p.cat === cat);
}
`;

await writeFile(path.join(WEB, "src/lib/photos.ts"), ts);
console.log(`\n${index.length} photos -> ${OUT}`);
