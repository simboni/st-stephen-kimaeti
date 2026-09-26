import type { Metadata } from "next";
import { events, formatDate, school } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { ClockIcon, PinIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Events",
  description: `The school calendar for ${school.shortName} — opening days, assessments, academic day and parents' consultation days.`,
};

export default function EventsPage() {
  const upcoming = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <PageHero
        eyebrow="School events"
        title="Mark your calendar"
        intro="Opening days, assessments, academic day and parents' consultations — the term as it stands."
        photo="mass-lectern"
      />
      <Section>
        <ol className="mx-auto max-w-3xl space-y-6">
          {upcoming.map((ev, i) => (
            <Reveal key={`${ev.date}-${ev.title}`} delay={i * 80}>
              <li className="card card-hover flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:p-8">
                <span className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-500 text-white">
                  <span className="font-display text-3xl font-extrabold leading-none">
                    {new Date(`${ev.date}T00:00:00`).getDate()}
                  </span>
                  <span className="mt-1 text-xs font-bold uppercase">
                    {new Date(`${ev.date}T00:00:00`).toLocaleString("en-KE", {
                      month: "short",
                      year: "2-digit",
                    })}
                  </span>
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-extrabold text-ink-900">{ev.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-400">
                    <span className="inline-flex items-center gap-1.5">
                      <ClockIcon className="h-4 w-4" />
                      {formatDate(ev.date)}
                      {ev.time ? ` · ${ev.time}` : ""}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <PinIcon className="h-4 w-4" />
                      {ev.venue}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">{ev.text}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>
    </>
  );
}
