import Link from "next/link";
import Image from "next/image";
import {
  academics,
  announcement,
  coreValues,
  events,
  faqs,
  formatDate,
  news,
  school,
  stats,
  testimonials,
  videos,
} from "@/lib/site";
import { ButtonLink, Section, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";
import { ValuesMarquee } from "@/components/values-marquee";
import {
  ArrowRightIcon,
  BookIcon,
  CalendarIcon,
  CrossIcon,
  EyeIcon,
  HeartIcon,
  LightbulbIcon,
  ShieldIcon,
  StarIcon,
  TargetIcon,
} from "@/components/icons";

const valueTones: Record<string, string> = {
  brand: "from-brand-500 to-brand-400",
  leaf: "from-leaf-600 to-leaf-500",
  sky: "from-sky-500 to-indigo-400",
  sun: "from-sun-500 to-sun-400",
};

const valueIcons = [CrossIcon, ShieldIcon, StarIcon, HeartIcon];

export default function HomePage() {
  return (
    <>
      {/* ------------------------------------------------ Hero */}
      <section className="relative flex min-h-[92svh] items-end overflow-hidden bg-navy-950">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/campus-front.jpg"
            alt="The Holy Cross school compound in Bulimbo"
            fill
            priority
            className="kenburns object-cover"
            sizes="100vw"
          />
        </div>
        <div
          className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/55 to-navy-950/25"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-navy-950/60 to-transparent"
          aria-hidden
        />

        <div className="container-page relative pb-16 pt-36 md:pb-24">
          <div className="hero-stagger max-w-3xl">
            {announcement.text && (
              <Link
                href={announcement.href}
                className="glass inline-flex items-center gap-2 rounded-full py-1.5 pl-2 pr-4 text-xs font-bold text-white transition-colors hover:bg-white/20"
              >
                <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] uppercase tracking-wider">
                  New
                </span>
                {announcement.text}
                <ArrowRightIcon className="h-3.5 w-3.5 text-brand-300" />
              </Link>
            )}
            <h1 className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.04] tracking-tight text-white text-balance sm:text-6xl md:text-7xl">
              Where bright futures{" "}
              <span className="relative inline-block text-brand-400">
                begin
                <svg
                  className="absolute -bottom-2 left-0 w-full text-brand-500"
                  viewBox="0 0 120 10"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M2 7.5C25 3 60 2 118 6.5"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 md:text-xl">
              {school.name}, Bulimbo — quality education rooted in faith, discipline and
              service. Every child known by name, every potential nurtured.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/admissions/" className="!px-7 !py-3.5">
                Join Our School <ArrowRightIcon className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/gallery/" variant="onDark" className="!px-7 !py-3.5">
                Take a Look Around
              </ButtonLink>
            </div>

            {/* Glass proof chips */}
            <div className="mt-10 flex flex-wrap gap-3">
              {[
                { big: "340+", small: "learners" },
                { big: "CBC", small: "aligned curriculum" },
                { big: "PP1–G9", small: "infant to junior" },
                { big: "Faith", small: "centred community" },
              ].map((chip) => (
                <div key={chip.small} className="glass rounded-2xl px-4 py-2.5 text-white">
                  <span className="font-display text-base font-extrabold">{chip.big}</span>
                  <span className="ml-2 text-xs text-white/75">{chip.small}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="scroll-hint absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-white/70 md:block"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <path d="M12 4v14m0 0-6-6m6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ------------------------------------------------ Values marquee */}
      <ValuesMarquee />

      {/* ------------------------------------------------ Stats band */}
      <div className="border-b border-paper-300 bg-paper-50">
        <div className="container-page grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 90} className="text-center">
              <p className="font-display text-4xl font-extrabold text-brand-600 md:text-5xl">
                <CountUp end={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-sm font-semibold text-ink-700">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------ Bento: who we are */}
      <Section>
        <SectionHeading
          eyebrow="Who we are"
          title="A school family built on four pillars"
          intro="From 13 founding learners to a thriving community of over 340 — here's what holds it all together."
          center
        />
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {/* Big image + story card */}
          <Reveal className="md:col-span-2 lg:row-span-2">
            <div className="card card-hover relative h-full min-h-[24rem] overflow-hidden">
              <Image
                src="/campus-courtyard.jpg"
                alt="Learners' courtyard at Holy Cross, Bulimbo"
                fill
                className="object-cover"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/30 to-transparent"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 p-7">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">
                  Our story
                </p>
                <h3 className="mt-2 font-display text-2xl font-extrabold text-white">
                  From 13 learners to a thriving school family
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
                  Established to bring accessible, value-based education to the children of
                  Bulimbo — and still growing.
                </p>
                <Link
                  href="/about/"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-300 hover:text-brand-200"
                >
                  Read our full story <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Mission */}
          <Reveal delay={90}>
            <div className="card card-hover h-full p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <TargetIcon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-extrabold text-ink-900">Mission</h3>
              <p className="mt-2 text-sm leading-relaxed">{school.mission}</p>
            </div>
          </Reveal>

          {/* Vision */}
          <Reveal delay={140}>
            <div className="card card-hover h-full p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <EyeIcon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-extrabold text-ink-900">Vision</h3>
              <p className="mt-2 text-sm leading-relaxed">{school.vision}</p>
            </div>
          </Reveal>

          {/* Motto — brand card */}
          <Reveal delay={190}>
            <div className="card-hover relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 p-7 text-white">
              <span className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15" aria-hidden />
              <LightbulbIcon className="h-6 w-6 text-white/90" />
              <h3 className="mt-4 font-display text-lg font-extrabold">Our Motto</h3>
              <p className="mt-2 font-display text-xl font-extrabold leading-snug">{school.motto}.</p>
            </div>
          </Reveal>

          {/* Quick facts card */}
          <Reveal delay={240}>
            <div className="card-hover h-full rounded-2xl border border-navy-700 bg-navy-900 p-7">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">
                At a glance
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/85">
                <li>Day &amp; boarding school</li>
                <li>CBC — Playgroup to Grade 9</li>
                <li>Music, games &amp; clubs</li>
                <li>Bulimbo, Kakamega County</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------------------------ Core values */}
      <Section tinted className="bg-dots">
        <SectionHeading
          eyebrow="Our core values"
          title="The values that define who we are"
          intro="Woven into assemblies, classrooms, games and everything in between."
          center
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {coreValues.map((v, i) => {
            const Icon = valueIcons[i % valueIcons.length];
            return (
              <Reveal key={v.title} delay={i * 100}>
                <div
                  className={`card-hover relative h-full overflow-hidden rounded-2xl bg-gradient-to-br p-7 text-white ${valueTones[v.tone]}`}
                >
                  <span className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" aria-hidden />
                  <Icon className="h-8 w-8 text-white/90" />
                  <h3 className="mt-4 font-display text-lg font-extrabold">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/90">{v.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* ------------------------------------------------ Academics */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Learning at Holy Cross"
            title="One school, every step of the journey"
            intro="From a child's very first day of playgroup to junior school, learning here follows Kenya's Competency-Based Curriculum."
          />
          <ButtonLink href="/admissions/" variant="secondary" className="shrink-0">
            How to join <ArrowRightIcon className="h-4 w-4" />
          </ButtonLink>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {academics.map((a, i) => (
            <Reveal key={a.title} delay={i * 110}>
              <div className="card card-hover group relative h-full overflow-hidden p-8">
                <span
                  className="absolute -right-4 -top-6 font-display text-[7rem] font-extrabold leading-none text-paper-200 transition-colors group-hover:text-brand-100"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <BookIcon className="h-6 w-6" />
                </span>
                <h3 className="relative mt-5 font-display text-lg font-extrabold text-ink-900">
                  {a.title}
                </h3>
                <p className="relative mt-1 text-sm font-bold text-brand-600">{a.levels}</p>
                <p className="relative mt-3 text-sm leading-relaxed">{a.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------ Students in action */}
      <section className="bg-navy-900 py-16 md:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Students in action"
            title="Watch our learners shine"
            intro="Music, movement and performance are a proud part of everyday life at Holy Cross."
            center
            dark
          />
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {videos.map((v, i) => (
              <Reveal key={v.id} delay={i * 110}>
                <div className="overflow-hidden rounded-2xl shadow-2xl">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${v.id}`}
                    title={v.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="aspect-video w-full"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Testimonials */}
      <Section>
        <SectionHeading
          eyebrow="What parents say"
          title="Trusted by the families of Bulimbo"
          center
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 110}>
              <figure className="card card-hover flex h-full flex-col p-8">
                <span
                  className="font-display text-6xl font-extrabold leading-none text-brand-200"
                  aria-hidden
                >
                  &ldquo;
                </span>
                <blockquote className="mt-2 flex-1 text-[15px] leading-relaxed text-ink-700">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-paper-200 pt-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 font-display text-sm font-extrabold text-white">
                    {t.name.charAt(0)}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-ink-900">{t.name}</span>
                    <span className="block text-xs text-ink-400">{t.relation}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------ News + events preview */}
      <Section tinted>
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading eyebrow="News & updates" title="What's happening at school" />
              <Link
                href="/news/"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700"
              >
                All news <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {news.slice(0, 2).map((post, i) => (
                <Reveal key={post.slug} delay={i * 100}>
                  <Link href={`/news/${post.slug}/`} className="card card-hover block h-full overflow-hidden">
                    {post.image && (
                      <div className="overflow-hidden">
                        <Image
                          src={post.image}
                          alt=""
                          width={800}
                          height={500}
                          className="aspect-[8/5] w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
                        {formatDate(post.date)}
                      </p>
                      <h3 className="mt-2 font-display text-lg font-extrabold leading-snug text-ink-900">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed">{post.excerpt}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading eyebrow="Coming up" title="Events" />
              <Link
                href="/events/"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700"
              >
                All events <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
            <ul className="mt-10 space-y-4">
              {[...events]
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 3)
                .map((ev, i) => (
                  <Reveal key={ev.title} delay={i * 90}>
                    <li className="card card-hover flex items-center gap-4 p-4">
                      <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-500 text-white">
                        <span className="font-display text-xl font-extrabold leading-none">
                          {new Date(`${ev.date}T00:00:00`).getDate()}
                        </span>
                        <span className="text-[10px] font-bold uppercase">
                          {new Date(`${ev.date}T00:00:00`).toLocaleString("en-KE", { month: "short" })}
                        </span>
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-sm font-extrabold text-ink-900">
                          {ev.title}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-400">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {ev.venue}
                        </p>
                      </div>
                    </li>
                  </Reveal>
                ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------ FAQ */}
      <Section>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading
              eyebrow="Questions parents ask"
              title="Everything you need to know"
              intro="Can't find your answer? Call the office or chat with us on WhatsApp — we're happy to help."
            />
            <div className="mt-8">
              <ButtonLink href="/contact/" variant="secondary">
                Ask us directly <ArrowRightIcon className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
          <div className="lg:col-span-8">
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <Reveal key={f.q} delay={i * 60}>
                  <details className="faq-item card p-5 sm:p-6" name="faq">
                    <summary className="font-display text-base font-extrabold text-ink-900">
                      {f.q}
                    </summary>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-500">{f.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------ CTA band */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-500 py-16 md:py-20">
        <span className="absolute -left-10 -top-16 h-56 w-56 rounded-full bg-white/10" aria-hidden />
        <span className="absolute -bottom-20 right-10 h-64 w-64 rounded-full bg-white/10" aria-hidden />
        <div className="container-page relative flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-2xl font-display text-3xl font-extrabold text-white text-balance md:text-4xl">
            Give your child a foundation of faith, discipline and excellence
          </h2>
          <p className="max-w-xl text-lg text-white/90">
            Admissions are open from Playgroup to Grade 9. Visit us in Bulimbo or get in touch —
            we&rsquo;d love to show you around.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/admissions/" variant="onDark">
              Start Admission <ArrowRightIcon className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink
              href="/contact/"
              variant="secondary"
              className="!border-white/40 !bg-transparent !text-white hover:!border-white"
            >
              Contact Us
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
