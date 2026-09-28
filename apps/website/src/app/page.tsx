import Link from "next/link";
import {
  announcement,
  dayInTheLife,
  events,
  faqs,
  fees,
  formatDate,
  intro,
  lifeStrands,
  money,
  news,
  pillars,
  school,
  heroSlides,
  sections,
  stats,
} from "@/lib/site";
import { photo } from "@/lib/photos";
import { Photo } from "@/components/photo";
import { HeroSlider } from "@/components/hero-slider";
import { Crest } from "@/components/crest";
import { ButtonLink, Reveal, Section, SectionHead, Stat } from "@/components/ui";
import {
  ArrowRightIcon,
  BedIcon,
  BusIcon,
  CrossIcon,
  LeafIcon,
  MusicIcon,
  PhoneIcon,
  TrophyIcon,
} from "@/components/icons";

const STRAND_ICON = {
  bed: BedIcon,
  cross: CrossIcon,
  music: MusicIcon,
  trophy: TrophyIcon,
  leaf: LeafIcon,
  bus: BusIcon,
} as const;

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function HomePage() {
  const lead = news[0];
  const rest = news.slice(1, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* ═══════════════════════════════════════════════════════════ hero ═══ */}
      <section className="relative isolate overflow-hidden bg-band">
        <HeroSlider slides={heroSlides} />
        <div
          className="absolute inset-0 bg-gradient-to-br from-band/92 via-band/72 to-band/38"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-band to-transparent"
          aria-hidden
        />

        <div className="container-page relative">
          <div className="stagger max-w-4xl py-20 md:py-28 lg:py-36">
            {announcement.text && (
              <Link
                href={announcement.href}
                className="group inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 py-1.5 pl-2 pr-4 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <span className="rounded-full bg-maroon-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                  Open
                </span>
                {announcement.text}
                <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}

            <h1 className="display mt-7 !text-white text-[2.9rem] leading-[0.98] sm:text-[4.2rem] md:text-[5.4rem] lg:text-[6.2rem]">
              <span className="block italic font-normal text-band-accent">Ora et Labora.</span>
              <span className="block">Pray and Work.</span>
            </h1>

            <p className="lede mt-7 max-w-xl !text-white/85">
              A mixed day and boarding school at Kimaeti in Bungoma County. 525 learners
              from Playgroup to Grade 9, under the {school.sponsor}, since{" "}
              {school.founded}.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/admissions/" variant="onBand">
                Apply for a place
                <ArrowRightIcon className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href={`tel:${school.phoneHref}`} variant="ghostBand" external>
                <PhoneIcon className="h-4 w-4" />
                {school.phone}
              </ButtonLink>
            </div>
          </div>
        </div>

        {/* Statistics, ruled across the foot of the hero */}
        <div className="relative border-t border-white/12">
          <div className="container-page grid grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`py-7 ${i % 2 === 1 ? "border-l border-white/12 pl-5" : "pr-5"} ${
                  i >= 2 ? "border-t border-white/12 lg:border-t-0" : ""
                } ${i === 2 ? "lg:border-l lg:pl-5" : ""} ${i === 3 ? "lg:pl-5" : ""}`}
              >
                <Stat value={s.value} label={s.label} onBand size="lg" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════ welcome ═══ */}
      <Section size="loose">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionHead
                index="01"
                eyebrow="Welcome"
                title={school.welcome}
                lede={intro[0]}
              />
              <p className="mt-5 text-lg leading-relaxed">{intro[1]}</p>

              <div className="mt-10 space-y-6 border-l-2 border-rule pl-6">
                <div>
                  <p className="eyebrow eyebrow-plain">Our vision</p>
                  <p className="quote mt-2 text-2xl">{school.vision}</p>
                </div>
                <div>
                  <p className="eyebrow eyebrow-plain">Our mission</p>
                  <p className="quote mt-2 text-2xl">{school.mission}</p>
                </div>
              </div>

              <div className="mt-9">
                <ButtonLink href="/about/" variant="outline">
                  More about the school
                  <ArrowRightIcon className="h-4 w-4" />
                </ButtonLink>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={90}>
              {/* An asymmetric plate: one tall photograph, two stacked beside it. */}
              <div className="grid grid-cols-12 gap-4">
                <figure className="col-span-12 sm:col-span-7">
                  <Photo
                    src="motto-wall"
                    sizes="(min-width: 1024px) 34vw, (min-width: 640px) 55vw, 100vw"
                    ratio="3/4"
                    className="rounded-lg"
                  />
                  <figcaption className="plate-caption">
                    {photo("motto-wall").caption}
                  </figcaption>
                </figure>
                <div className="col-span-12 grid grid-cols-2 gap-4 sm:col-span-5 sm:grid-cols-1">
                  <Photo
                    src="gases-balloons"
                    sizes="(min-width: 1024px) 24vw, 45vw"
                    ratio="3/4"
                    className="rounded-lg"
                  />
                  <figure>
                    <Photo
                      src="mass-outdoors"
                      sizes="(min-width: 1024px) 24vw, 45vw"
                      ratio="4/3"
                      className="rounded-lg"
                    />
                    <figcaption className="plate-caption">
                      {photo("mass-outdoors").caption}
                    </figcaption>
                  </figure>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════ motto marquee ═══ */}
      <div className="overflow-hidden border-y border-line bg-surface-2 py-5">
        <div className="marquee-track">
          {[0, 1].map((row) => (
            <div key={row} className="flex shrink-0 items-center" aria-hidden={row === 1}>
              {[school.mottoLatin, ...school.values].map((item) => (
                <span key={item} className="flex items-center">
                  <span className="px-7 font-display text-xl text-text-2 md:text-2xl">
                    {item}
                  </span>
                  <span className="text-rule" aria-hidden>
                    ✦
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ sections ═══ */}
      <Section size="loose">
        <Reveal>
          <SectionHead
            index="02"
            eyebrow="Twelve classes"
            title={
              <>
                Three sections,
                <br />
                one compound
              </>
            }
            lede="A learner can arrive at three and leave at fifteen without ever changing school, teachers or friends. These are the roll figures from the Term II 2026 return."
          />
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3">
          {sections.map((s, i) => (
            <Reveal key={s.slug} delay={i * 80}>
              <article className="group">
                <Photo
                  src={s.photo}
                  sizes="(min-width: 768px) 31vw, 100vw"
                  ratio="5/4"
                  className="rounded-lg"
                  imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="mt-6 flex items-baseline justify-between gap-4 border-b border-line pb-3">
                  <h3 className="display text-2xl">{s.title}</h3>
                  <span className="numeral shrink-0 text-2xl text-second">{s.learners}</span>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-text-3">
                  {s.levels}
                </p>
                <p className="mt-4 leading-relaxed">{s.text}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-14">
            <ButtonLink href="/academics/" variant="outline">
              How we teach
              <ArrowRightIcon className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Reveal>
      </Section>

      {/* ════════════════════════════════════════════════════════ pillars ═══ */}
      <Section tone="tint" size="loose">
        <Reveal>
          <SectionHead
            index="03"
            eyebrow="What we are like"
            title="Four things you would notice on a Tuesday"
            lede="Not a prospectus promise — these are photographs of an ordinary term."
          />
        </Reveal>

        <div className="mt-16 space-y-20 md:space-y-28">
          {pillars.map((p, i) => (
            <Reveal key={p.title}>
              <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-14">
                <figure
                  className={`md:col-span-7 ${i % 2 === 1 ? "md:order-2 md:col-start-6" : ""}`}
                >
                  <Photo
                    src={p.photo}
                    sizes="(min-width: 768px) 55vw, 100vw"
                    ratio="16/10"
                    className="rounded-lg shadow-[var(--shadow-e3)]"
                  />
                </figure>
                <div className={`md:col-span-5 ${i % 2 === 1 ? "md:order-1 md:row-start-1" : ""}`}>
                  <span
                    className="index-ghost block text-6xl"
                    data-index={String(i + 1).padStart(2, "0")}
                    aria-hidden
                  />
                  <h3 className="display mt-3 text-[1.8rem] leading-tight md:text-[2.25rem]">
                    {p.title}
                  </h3>
                  <p className="mt-5 text-lg leading-relaxed">{p.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ═════════════════════════════════════════════════ day in the life ═══ */}
      <Section tone="band" size="loose">
        <Reveal>
          <SectionHead
            onBand
            index="04"
            eyebrow="7:30 to 19:00"
            title="A day at St Stephen&rsquo;s"
            lede="From prayers at assembly to prep after supper."
          />
        </Reveal>
      </Section>
      <div className="-mt-16 bg-band pb-20 md:-mt-24 md:pb-28">
        <div
          className="overflow-x-auto pb-4"
          tabIndex={0}
          role="group"
          aria-label="A day at the school, hour by hour"
        >
          <ol className="container-page flex w-max gap-4 lg:w-full lg:max-w-none">
            {dayInTheLife.map((d, i) => (
              <li key={d.label} className="w-52 shrink-0 lg:w-auto lg:flex-1">
                <Reveal delay={i * 60}>
                  <Photo
                    src={d.photo}
                    sizes="(min-width: 1024px) 16vw, 208px"
                    ratio="3/4"
                    className="rounded-lg"
                  />
                  <p className="numeral mt-4 text-xl !text-band-accent">{d.time}</p>
                  <p className="mt-1 text-sm font-semibold text-band-text">{d.label}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════ school life ═══ */}
      <Section size="loose">
        <Reveal>
          <SectionHead
            index="05"
            eyebrow="Outside the timetable"
            title="Six things that happen here that do not happen everywhere"
          />
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {lifeStrands.map((s, i) => {
            const Icon = STRAND_ICON[s.icon];
            return (
              <Reveal key={s.slug} delay={(i % 3) * 70}>
                <Link
                  href={`/school-life/#${s.slug}`}
                  className="group flex h-full flex-col bg-surface p-7 transition-colors hover:bg-surface-2"
                >
                  <Icon className="h-7 w-7 text-second" />
                  <h3 className="display mt-5 text-xl">{s.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed">{s.lead}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                    See more
                    <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════ fees ═══ */}
      <Section tone="tint" size="loose" id="fees">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionHead
                index="06"
                eyebrow="Fees, published"
                title="No school should make a parent guess"
                lede="The whole structure is on this site — by level, by term, with what it covers and how to pay it. Most schools make you ring and ask."
              />
              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink href="/fees/">
                  Fees and the calculator
                  <ArrowRightIcon className="h-4 w-4" />
                </ButtonLink>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={90}>
              <dl className="divide-y divide-line border-y border-line">
                {fees.rows.map((r) => (
                  <div
                    key={r.level}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-5"
                  >
                    <dt className="font-display text-lg text-text">{r.level}</dt>
                    <dd className="flex items-baseline gap-3">
                      <span className="text-sm text-text-3">
                        {r.t1.toLocaleString("en-KE")} · {r.t2.toLocaleString("en-KE")} ·{" "}
                        {r.t3.toLocaleString("en-KE")}
                      </span>
                      <span className="numeral text-2xl">{money(r.total)}</span>
                    </dd>
                  </div>
                ))}
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 py-5 text-text-3">
                  <dt>{fees.missing}</dt>
                  <dd className="text-sm">Ask the office for the current sheet</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-text-3">
                Kenya shillings, {fees.year}. The three small figures are terms one, two
                and three.
              </p>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════ news ═══ */}
      <Section size="loose">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead index="07" eyebrow="From the school" title="Latest" />
            <ButtonLink href="/news/" variant="outline" className="!py-2.5">
              All news
              <ArrowRightIcon className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12">
          {lead && (
            <Reveal className="lg:col-span-7">
              <Link href={`/news/${lead.slug}/`} className="group block">
                {lead.photo && (
                  <Photo
                    src={lead.photo}
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    ratio="16/10"
                    className="rounded-lg"
                    imgClassName="transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                )}
                <p className="eyebrow mt-6">{formatDate(lead.date)}</p>
                <h3 className="display mt-3 text-[1.7rem] leading-tight md:text-[2.1rem]">
                  {lead.title}
                </h3>
                <p className="mt-4 max-w-xl leading-relaxed">{lead.excerpt}</p>
              </Link>
            </Reveal>
          )}

          <div className="lg:col-span-5">
            <div className="divide-y divide-line border-t border-line">
              {rest.map((n, i) => (
                <Reveal key={n.slug} delay={i * 80}>
                  <Link href={`/news/${n.slug}/`} className="group flex gap-5 py-6">
                    {n.photo && (
                      <Photo
                        src={n.photo}
                        sizes="120px"
                        ratio="1/1"
                        className="w-24 shrink-0 rounded-md"
                      />
                    )}
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wider text-text-3">
                        {formatDate(n.date)}
                      </span>
                      <span className="mt-1.5 block font-display text-lg leading-snug text-text">
                        {n.title}
                      </span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>

            <Reveal>
              <div className="mt-8 rounded-lg border border-line bg-surface-3 p-6">
                <p className="eyebrow">Coming up</p>
                <ul className="mt-4 space-y-4">
                  {events.slice(0, 3).map((e) => (
                    <li key={e.title} className="flex gap-4">
                      <span className="w-14 shrink-0 border-r border-line pr-3 text-right">
                        <span className="numeral block text-xl">
                          {new Date(`${e.date}T00:00:00`).getDate()}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">
                          {new Date(`${e.date}T00:00:00`).toLocaleDateString("en-KE", {
                            month: "short",
                          })}
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-text">{e.title}</span>
                        <span className="text-sm text-text-3">
                          {e.time ?? "All day"} · {e.venue}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/events/"
                  className="link-underline mt-5 inline-block text-sm"
                >
                  Term dates and the full calendar
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════════ faq ═══ */}
      <Section tone="tint" size="loose">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Reveal>
              <SectionHead
                index="08"
                eyebrow="Questions"
                title="What parents ask first"
                lede="If yours is not here, ring the office — somebody picks up."
              />
              <div className="mt-8">
                <ButtonLink href="/contact/">
                  Ask us anything
                  <ArrowRightIcon className="h-4 w-4" />
                </ButtonLink>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            <Reveal delay={90}>
              <div className="divide-y divide-line border-y border-line">
                {faqs.map((f) => (
                  <details key={f.q} className="qa group py-5">
                    <summary className="font-display text-lg text-text">{f.q}</summary>
                    <p className="mt-3 max-w-2xl leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════════════ cta ═══ */}
      <section className="relative isolate overflow-hidden">
        <Photo src="headteacher-and-pupils" sizes="100vw" fill />
        <div
          className="absolute inset-0 bg-gradient-to-r from-band/95 via-band/85 to-band/60"
          aria-hidden
        />
        <div className="container-page relative py-24 md:py-32">
          <div className="max-w-2xl">
            <Crest className="h-36 w-auto" />
            <h2 className="display mt-8 !text-white text-[2.2rem] leading-[1.05] md:text-[3.2rem]">
              Come and see the school before you choose it
            </h2>
            <p className="lede mt-6 !text-white/80">
              Visit on any working day. Walk the classrooms, the dormitories, the dining
              hall and the shamba, and ask us anything you like.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/admissions/" variant="onBand">
                How to apply
                <ArrowRightIcon className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/contact/" variant="ghostBand">
                Contact the office
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
