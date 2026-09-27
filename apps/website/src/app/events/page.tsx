import type { Metadata } from "next";
import { events, formatDate, school, terms } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { ButtonLink, Reveal, Section, SectionHead } from "@/components/ui";
import { CalendarIcon, ClockIcon, PinIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Term dates & events",
  description: `Term dates and the school calendar for ${school.shortName} — opening and closing days, half terms, assessments, academic day and parents' consultations. Download it straight into your phone’s calendar.`,
};

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function dayName(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-KE", { weekday: "long" });
}

export default function EventsPage() {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <PageHero
        index="06"
        eyebrow="Term dates & events"
        title="The year, so you can plan around it"
        lede="Opening and closing days, half terms, assessments and the days we would like parents here. Take the whole calendar into your phone in one tap."
        photo="mass-lectern"
        crumb={[{ href: "/news/", label: "News" }]}
      />

      {/* Term dates */}
      <Section size="loose">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead index="01" eyebrow="Term dates" title="Three terms, as the year runs" />
            <ButtonLink href={`${base}/school-calendar.ics`} download variant="outline">
              <CalendarIcon className="h-4 w-4" />
              Add to your calendar
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-12 overflow-x-auto" tabIndex={0} role="group" aria-label="Table, scrolls sideways">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <caption className="sr-only">School term dates</caption>
              <thead>
                <tr className="border-y border-line-strong">
                  <th scope="col" className="py-4 pr-4 text-left eyebrow eyebrow-plain">
                    Term
                  </th>
                  <th scope="col" className="px-4 py-4 text-left eyebrow eyebrow-plain">
                    Opens
                  </th>
                  <th scope="col" className="px-4 py-4 text-left eyebrow eyebrow-plain">
                    Half term
                  </th>
                  <th scope="col" className="py-4 pl-4 text-left eyebrow eyebrow-plain">
                    Closes
                  </th>
                </tr>
              </thead>
              <tbody>
                {terms.map((t) => (
                  <tr key={t.name} className="border-b border-line">
                    <th scope="row" className="py-5 pr-4 text-left font-display text-lg text-text">
                      {t.name}
                    </th>
                    <td className="px-4 py-5">
                      <span className="block text-text">{formatDate(t.opens)}</span>
                      <span className="text-xs text-text-3">{dayName(t.opens)}</span>
                    </td>
                    <td className="px-4 py-5">
                      <span className="block text-text">{formatDate(t.halfTerm)}</span>
                      <span className="text-xs text-text-3">{dayName(t.halfTerm)}</span>
                    </td>
                    <td className="py-5 pl-4">
                      <span className="block text-text">{formatDate(t.closes)}</span>
                      <span className="text-xs text-text-3">{dayName(t.closes)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 text-sm text-text-3">
            Boarders report on the opening day with their kit ready for inspection; day
            scholars by 8:00 AM. Confirm any date with the office before you book travel.
          </p>
        </Reveal>
      </Section>

      {/* Events */}
      <Section tone="tint" size="loose">
        <Reveal>
          <SectionHead index="02" eyebrow="Diary" title="What is coming up" />
        </Reveal>

        <ol className="mt-12 divide-y divide-line border-y border-line">
          {sorted.map((ev, i) => (
            <Reveal
              as="li"
              key={`${ev.date}-${ev.title}`}
              delay={(i % 4) * 60}
              className="grid grid-cols-1 gap-4 py-8 md:grid-cols-12 md:gap-8"
            >
                <div className="md:col-span-2">
                  <p className="numeral text-4xl">
                    {new Date(`${ev.date}T00:00:00`).getDate()}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-second">
                    {new Date(`${ev.date}T00:00:00`).toLocaleDateString("en-KE", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="md:col-span-10">
                  <h3 className="display text-xl md:text-2xl">{ev.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-text-3">
                    <span className="inline-flex items-center gap-1.5">
                      <ClockIcon className="h-4 w-4" />
                      {formatDate(ev.date)}
                      {ev.endDate ? ` – ${formatDate(ev.endDate)}` : ""}
                      {ev.time ? ` · ${ev.time}` : ""}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <PinIcon className="h-4 w-4" />
                      {ev.venue}
                    </span>
                  </div>
                  <p className="mt-4 max-w-2xl leading-relaxed">{ev.text}</p>
                </div>
            </Reveal>
          ))}
        </ol>
      </Section>
    </>
  );
}
