import Link from "next/link";
import {
  announcement,
  dayInTheLife,
  events,
  faqs,
  fees,
  formatDate,
  intro,
  money,
  news,
  payment,
  pillars,
  school,
  sections,
  showTestimonials,
  stats,
  testimonials,
} from "@/lib/site";
import { Photo } from "@/components/photo";
import { Crest } from "@/components/crest";
import { ButtonLink, Section, SectionHeading } from "@/components/ui";
import { CountUp } from "@/components/count-up";
import { Reveal } from "@/components/reveal";
import { ValuesMarquee } from "@/components/values-marquee";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  MegaphoneIcon,
  PhoneIcon,
} from "@/components/icons";

export default function HomePage() {
  return (
    <>
      {/* ------------------------------------------------------------ hero -- */}
      <section className="relative isolate overflow-hidden bg-navy-900">
        <Photo
          src="learners-on-the-field"
          sizes="100vw"
          fill
          priority
          imgClassName="kenburns"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-navy-950/92 via-navy-900/78 to-brand-900/70"
          aria-hidden
        />

        <div className="container-page relative py-20 md:py-28 lg:py-32">
          <div className="hero-stagger max-w-3xl">
            {announcement.text && (
              <Link
                href={announcement.href}
                className="glass inline-flex items-center gap-2 rounded-full py-1.5 pl-2 pr-4 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                <span className="rounded-full bg-maroon-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
                  New
                </span>
                {announcement.text}
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            )}

            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
              Pray and Work.
              <span className="block text-brand-300">Since 2006, at Kimaeti.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              St Stephen&rsquo;s is a mixed day and boarding school in Bungoma County
              teaching 525 learners from Playgroup to Grade 9 — Early Years, Primary
              and Junior — under the {school.sponsor}.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/admissions/" variant="onDark">
                Apply for a place
                <ArrowRightIcon className="h-4 w-4" />
              </ButtonLink>
              <a
                href={`tel:${school.phoneHref}`}
                className="glass inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
              >
                <PhoneIcon className="h-4 w-4" />
                {school.phone}
              </a>
            </div>
          </div>
        </div>

        {/* Stat strip along the foot of the hero */}
        <div className="relative border-t border-white/15 bg-navy-950/45 backdrop-blur-sm">
          <div className="container-page grid grid-cols-2 divide-x divide-white/10 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="px-1 py-5 text-center">
                <p className="font-display text-2xl font-extrabold text-white md:text-3xl">
                  <CountUp end={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-300 md:text-xs">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- welcome -- */}
      <Section>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow="Welcome" title={school.welcome} intro={intro[0]} />
            <p className="mt-4 text-lg leading-relaxed">{intro[1]}</p>

            <dl className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-paper-300 bg-paper-50 p-5">
                <dt className="kicker">Our vision</dt>
                <dd className="mt-3 font-display text-lg font-bold leading-snug text-ink-900">
                  {school.vision}
                </dd>
              </div>
              <div className="rounded-2xl border border-paper-300 bg-paper-50 p-5">
                <dt className="kicker">Our mission</dt>
                <dd className="mt-3 font-display text-lg font-bold leading-snug text-ink-900">
                  {school.mission}
                </dd>
              </div>
            </dl>

            <ul className="mt-6 flex flex-wrap gap-2">
              {school.values.map((v) => (
                <li
                  key={v}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-700"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  {v}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            {/* A small collage rather than one flat photograph. */}
            <div className="grid grid-cols-5 grid-rows-5 gap-3 lg:gap-4">
              <Photo
                src="staff-outside-block"
                sizes="(min-width: 1024px) 34vw, 55vw"
                ratio="4/3"
                className="col-span-3 row-span-3 rounded-2xl shadow-[0_24px_60px_-30px_rgba(26,33,48,0.55)]"
              />
              <Photo
                src="gases-balloons"
                sizes="(min-width: 1024px) 20vw, 36vw"
                ratio="3/4"
                className="col-span-2 col-start-4 row-span-3 row-start-2 rounded-2xl shadow-[0_24px_60px_-30px_rgba(26,33,48,0.55)]"
              />
              <Photo
                src="mass-outdoors"
                sizes="(min-width: 1024px) 28vw, 45vw"
                ratio="16/9"
                className="col-span-3 col-start-1 row-span-2 row-start-4 rounded-2xl shadow-[0_24px_60px_-30px_rgba(26,33,48,0.55)]"
              />
            </div>
          </Reveal>
        </div>
      </Section>

      <ValuesMarquee />

      {/* ------------------------------------------------------- sections -- */}
      <Section tinted id="sections">
        <Reveal>
          <SectionHeading
            center
            eyebrow="Twelve classes"
            title="Three sections, one school"
            intro="A learner can arrive at three and leave at fifteen without ever changing school, teachers or friends. The numbers are from the Term II 2026 return."
          />
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {sections.map((s, i) => (
            <Reveal key={s.slug} delay={i * 110}>
              <article className="card card-hover h-full overflow-hidden">
                <Photo src={s.photo} sizes="(min-width: 768px) 33vw, 100vw" ratio="4/3" />
                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-maroon-500">
                    {s.levels}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-extrabold text-ink-900">
                    {s.title}
                  </h3>
                  <p className="mt-3 leading-relaxed">{s.text}</p>
                  <p className="mt-5 inline-flex items-baseline gap-1.5 rounded-full bg-brand-50 px-3.5 py-1.5 text-sm text-brand-700">
                    <b className="font-display text-base font-extrabold">{s.learners}</b>
                    learners today
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* -------------------------------------------------------- pillars -- */}
      <Section>
        <Reveal>
          <SectionHeading
            eyebrow="What we are like"
            title="Four things you would notice on a Tuesday"
            intro="Not a prospectus promise — these are photographs of an ordinary term."
          />
        </Reveal>

        <div className="mt-12 space-y-14 md:space-y-20">
          {pillars.map((p, i) => (
            <Reveal key={p.title}>
              <div
                className={`grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-14 ${
                  i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <Photo
                  src={p.photo}
                  sizes="(min-width: 768px) 46vw, 100vw"
                  ratio="16/10"
                  className="rounded-3xl shadow-[0_30px_70px_-40px_rgba(26,33,48,0.6)]"
                />
                <div>
                  <span className="font-display text-5xl font-extrabold text-paper-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink-900 text-balance md:text-3xl">
                    {p.title}
                  </h3>
                  <p className="mt-4 text-lg leading-relaxed">{p.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* --------------------------------------------------- day in the life */}
      <section className="bg-navy-900 py-16 md:py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              dark
              center
              eyebrow="7:30 to 19:00"
              title="A day at St Stephen's"
              intro="From the handwashing line at assembly to prep after supper."
            />
          </Reveal>
        </div>

        {/* Horizontal scroller on small screens, one row on large ones. */}
        <div className="mt-12 overflow-x-auto pb-4">
          <ol className="container-page flex w-max gap-4 lg:w-full lg:max-w-none">
            {dayInTheLife.map((d, i) => (
              <li key={d.label} className="w-56 shrink-0 lg:w-auto lg:flex-1">
                <Reveal delay={i * 70}>
                  <Photo
                    src={d.photo}
                    sizes="(min-width: 1024px) 16vw, 224px"
                    ratio="3/4"
                    className="rounded-2xl"
                  />
                  <p className="mt-3 font-display text-sm font-extrabold text-brand-300">
                    {d.time}
                  </p>
                  <p className="text-sm font-semibold text-white">{d.label}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ----------------------------------------------------------- fees -- */}
      <Section tinted id="fees">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow={`${fees.year} fees`}
              title="Published, so you can plan"
              intro={fees.note}
            />
            <div className="mt-8 rounded-2xl border border-paper-300 bg-paper-50 p-6">
              <p className="kicker">How to pay</p>
              <p className="mt-3 leading-relaxed">
                M-PESA to the {payment.mpesa.label} paybill{" "}
                <b className="font-display text-ink-900">{payment.mpesa.paybill}</b>, with the
                account number{" "}
                <b className="font-display text-ink-900">{payment.accountFormat}</b> followed by
                your child&rsquo;s name and no spaces —{" "}
                <code className="rounded bg-paper-200 px-1.5 py-0.5 text-sm text-ink-900">
                  {payment.accountExample}
                </code>
                .
              </p>
              <p className="mt-3 leading-relaxed">
                Or pay into {payment.bank.name} account{" "}
                <b className="font-display text-ink-900">{payment.bank.account}</b>, in the name
                of {payment.bank.holder}. Bring the receipt to the office either way.
              </p>
            </div>
            <div className="mt-6">
              <ButtonLink href="/fees/" variant="secondary">
                Full fee structure
                <ArrowRightIcon className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-navy-900 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-display text-xs font-bold uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-3 py-3 text-right font-display text-xs font-bold uppercase tracking-wider">
                        Term 1
                      </th>
                      <th className="px-3 py-3 text-right font-display text-xs font-bold uppercase tracking-wider">
                        Term 2
                      </th>
                      <th className="px-3 py-3 text-right font-display text-xs font-bold uppercase tracking-wider">
                        Term 3
                      </th>
                      <th className="px-4 py-3 text-right font-display text-xs font-bold uppercase tracking-wider">
                        Year
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper-300">
                    {fees.rows.map((r) => (
                      <tr key={r.level}>
                        <td className="px-4 py-3.5 font-semibold text-ink-900">{r.level}</td>
                        <td className="px-3 py-3.5 text-right tabular-nums">
                          {r.t1.toLocaleString("en-KE")}
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums">
                          {r.t2.toLocaleString("en-KE")}
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums">
                          {r.t3.toLocaleString("en-KE")}
                        </td>
                        <td className="px-4 py-3.5 text-right font-display font-extrabold tabular-nums text-ink-900">
                          {r.total.toLocaleString("en-KE")}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-paper-100">
                      <td colSpan={5} className="px-4 py-3.5 text-ink-400">
                        {fees.missing} — please ask the office for the current sheet.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="border-t border-paper-300 px-4 py-3 text-xs text-ink-400">
                All amounts in Kenya shillings. One-off on admission:{" "}
                {fees.oneOff
                  .map((o) => `${o.item.toLowerCase()} ${money(o.amount)}`)
                  .join(", ")}
                .
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* -------------------------------------------------- testimonials ---
          Hidden until the school gives us real quotes — see showTestimonials. */}
      {showTestimonials && (
      <Section>
        <Reveal>
          <SectionHeading center eyebrow="Parents and alumni" title="In their words" />
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.quote} delay={i * 110}>
              <figure className="card h-full p-7">
                <span className="font-display text-5xl leading-none text-brand-200" aria-hidden>
                  &ldquo;
                </span>
                <blockquote className="mt-2 leading-relaxed text-ink-700">{t.quote}</blockquote>
                <figcaption className="mt-5 border-t border-paper-300 pt-4">
                  <span className="block font-display text-sm font-extrabold text-ink-900">
                    {t.name}
                  </span>
                  <span className="block text-xs text-ink-400">{t.relation}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Section>
      )}

      {/* ------------------------------------------------- news and events -- */}
      <Section tinted>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <Reveal>
              <SectionHeading eyebrow="From the school" title="News" />
            </Reveal>
            <div className="mt-8 space-y-5">
              {news.slice(0, 3).map((n, i) => (
                <Reveal key={n.slug} delay={i * 90}>
                  <Link
                    href={`/news/${n.slug}/`}
                    className="card card-hover flex gap-4 overflow-hidden p-3 sm:gap-5"
                  >
                    {n.photo && (
                      <Photo
                        src={n.photo}
                        sizes="180px"
                        ratio="1/1"
                        className="w-24 shrink-0 rounded-xl sm:w-32"
                      />
                    )}
                    <span className="min-w-0 py-1 pr-2">
                      <span className="block text-xs font-semibold uppercase tracking-wider text-ink-400">
                        {formatDate(n.date)}
                      </span>
                      <span className="mt-1 block font-display text-base font-extrabold leading-snug text-ink-900 sm:text-lg">
                        {n.title}
                      </span>
                      <span className="mt-1.5 line-clamp-2 block text-sm leading-relaxed">
                        {n.excerpt}
                      </span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
            <div className="mt-7">
              <ButtonLink href="/news/" variant="secondary">
                All news
                <ArrowRightIcon className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>

          <div>
            <Reveal>
              <SectionHeading eyebrow="Diary" title="Coming up" />
            </Reveal>
            <ul className="mt-8 space-y-4">
              {events.slice(0, 3).map((e, i) => (
                <Reveal key={e.title} delay={i * 90}>
                  <li className="card flex gap-4 p-5">
                    <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-500 text-white">
                      <span className="font-display text-lg font-extrabold leading-none">
                        {new Date(`${e.date}T00:00:00`).getDate()}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {new Date(`${e.date}T00:00:00`).toLocaleDateString("en-KE", {
                          month: "short",
                        })}
                      </span>
                    </span>
                    <span>
                      <span className="block font-display text-base font-extrabold text-ink-900">
                        {e.title}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                        <span className="inline-flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {e.time ?? "All day"}
                        </span>
                        <span>{e.venue}</span>
                      </span>
                    </span>
                  </li>
                </Reveal>
              ))}
            </ul>
            <div className="mt-7">
              <ButtonLink href="/events/" variant="secondary">
                Full calendar
                <ArrowRightIcon className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------ faq -- */}
      <Section>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow="Questions"
              title="The things parents ask first"
              intro="If yours is not here, ring the office — somebody picks up."
            />
            <div className="mt-8">
              <ButtonLink href="/contact/">
                Ask us anything
                <ArrowRightIcon className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="faq-item card p-5">
                  <summary className="font-display text-base font-bold text-ink-900">
                    {f.q}
                  </summary>
                  <p className="mt-3 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------------------------------------ cta -- */}
      <section className="relative isolate overflow-hidden">
        <Photo
          src="headteacher-and-pupils"
          sizes="100vw"
          fill
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-navy-950/94 via-navy-900/82 to-brand-800/60"
          aria-hidden
        />
        <div className="container-page relative py-20 text-center md:py-28">
          <Crest className="mx-auto h-16 w-16" />
          <h2 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-white text-balance md:text-4xl">
            Come and see the school before you choose it
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/80">
            Visit on any working day. Walk the classrooms, the dormitories, the dining hall
            and the shamba, and ask us anything you like.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/admissions/" variant="onDark">
              How to apply
              <ArrowRightIcon className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/contact/" variant="ghost" className="!text-white hover:!bg-white/10">
              <MegaphoneIcon className="h-4 w-4" />
              Contact the office
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
