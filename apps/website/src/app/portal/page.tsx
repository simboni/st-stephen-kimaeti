import type { Metadata } from "next";
import { school, primaryPhone } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { ButtonLink, Reveal, Section, SectionHead } from "@/components/ui";
import {
  ArrowRightIcon,
  BookIcon,
  CheckIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Parents' portal",
  description: `Portal login for parents, teachers and staff of ${school.shortName} — fee statements, attendance, assessments and announcements.`,
};

const ROLES = [
  {
    icon: UserIcon,
    title: "Parents and guardians",
    text: "Your child’s attendance, report cards, fee statement and the school’s announcements — without ringing the office to ask.",
  },
  {
    icon: BookIcon,
    title: "Teachers",
    text: "Class registers, continuous assessment against the CBC bands, and learning materials shared with the class.",
  },
  {
    icon: ShieldIcon,
    title: "Administration",
    text: "Admissions, finance, staff, transport, boarding and timetabling — the whole school in one place.",
  },
];

const COMING = [
  "Learner admissions and records",
  "Attendance registers",
  "CBC assessments and report cards",
  "Fee invoices and M-PESA payments",
  "School bus routes and stages",
  "Dormitory and bed allocation",
  "Timetables and class management",
  "SMS and email announcements",
];

export default function PortalPage() {
  return (
    <>
      <PageHero
        index="10"
        eyebrow="Parents' portal"
        title="One login for the whole school"
        lede="Parents, teachers and staff reach school records through the St Stephen’s management system."
        photo="fair-stand"
      />

      <Section size="loose">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <div className="rounded-lg border border-line bg-surface-3 p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <UserIcon className="h-6 w-6" />
                </span>
                <h2 className="display mt-6 text-2xl">Sign in</h2>
                <p className="mt-2 leading-relaxed">
                  Use the account the school office issued you.
                </p>
                <ButtonLink
                  href={school.portalUrl}
                  external
                  className="mt-7 w-full"
                >
                  Continue to the portal
                  <ArrowRightIcon className="h-4 w-4" />
                </ButtonLink>
                <p className="mt-5 text-sm leading-relaxed text-text-3">
                  No account yet, or forgotten the password? Ring the office on{" "}
                  <a href={`tel:${primaryPhone.href}`} className="link-underline">
                    {primaryPhone.phone}
                  </a>
                  .
                </p>
              </div>

              <div className="mt-6 rounded-lg border border-second/30 bg-second-soft p-6">
                <p className="font-display text-lg text-text">A new system is on the way</p>
                <p className="mt-2 leading-relaxed">
                  We are building a new education management system for St
                  Stephen&rsquo;s. When it launches this page becomes its front door —
                  same address, a great deal more behind it.
                </p>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={80}>
              <SectionHead index="01" eyebrow="Who uses it" title="Built for everyone in the school" />
              <div className="mt-10 divide-y divide-line border-y border-line">
                {ROLES.map((role) => (
                  <div key={role.title} className="flex items-start gap-5 py-6">
                    <role.icon className="mt-1 h-6 w-6 shrink-0 text-second" />
                    <div>
                      <h3 className="display text-lg">{role.title}</h3>
                      <p className="mt-2 leading-relaxed">{role.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={140}>
              <div className="mt-10 rounded-lg bg-band p-8">
                <p className="eyebrow !text-band-text-2">Coming in the new system</p>
                <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {COMING.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-band-text-2">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-band-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
