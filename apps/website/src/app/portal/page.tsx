import type { Metadata } from "next";
import { school } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { ButtonLink, Section, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import {
  ArrowRightIcon,
  BookIcon,
  CalendarIcon,
  ChatIcon,
  CheckIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Portal Login",
  description: `Portal login for parents, teachers and staff of ${school.shortName} — fee statements, attendance, assessments and announcements.`,
};

/**
 * Phase two of this platform is a full education-management system. This page
 * is its front door: today it links to the current portal, and it will point
 * to the new system's login once the backend is built.
 */
const roles = [
  {
    icon: UserIcon,
    title: "Parents & Guardians",
    text: "Follow your child's attendance, report cards, fee statements and school announcements.",
  },
  {
    icon: BookIcon,
    title: "Teachers",
    text: "Manage classes, record assessments and share learning materials with your learners.",
  },
  {
    icon: ShieldIcon,
    title: "Administration",
    text: "Admissions, finance, staff and timetabling — the whole school at a glance.",
  },
];

const comingFeatures = [
  "Learner admissions & records",
  "Attendance registers",
  "CBC assessments & report cards",
  "Fee invoices & M-PESA payments",
  "School bus routes & stages",
  "Dormitory and bed allocation",
  "Timetables & class management",
  "SMS / email announcements",
];

export default function PortalPage() {
  return (
    <>
      <PageHero
        eyebrow="School portal"
        title="One login for the whole school community"
        intro="Parents, teachers and staff reach school records through the St Stephen's management system."
        photo="fair-stand"
      />

      <Section>
        <div className="grid items-start gap-12 lg:grid-cols-12">
          {/* Login card */}
          <div className="lg:col-span-5">
            <Reveal>
              <div className="card overflow-hidden">
                <div className="bg-navy-900 p-8 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-brand-300">
                    <UserIcon className="h-7 w-7" />
                  </span>
                  <h2 className="mt-4 font-display text-xl font-extrabold text-white">
                    Portal Login
                  </h2>
                  <p className="mt-1 text-sm text-white/70">
                    Sign in with the account issued by the school office.
                  </p>
                </div>
                <div className="p-8">
                  <ButtonLink href={school.portalUrl} external className="w-full">
                    Continue to login <ArrowRightIcon className="h-4 w-4" />
                  </ButtonLink>
                  <p className="mt-4 text-center text-xs leading-relaxed text-ink-400">
                    Forgot your password or don&rsquo;t have an account yet? Contact the school
                    office on{" "}
                    <a href={`tel:${school.phoneHref}`} className="font-bold text-ink-700">
                      {school.phone}
                    </a>
                    .
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-6 rounded-2xl border border-sun-400/50 bg-sun-400/10 p-6">
                <p className="flex items-center gap-2 font-display text-sm font-extrabold text-ink-900">
                  <ChatIcon className="h-4 w-4 text-sun-500" /> A new system is on the way
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">
                  We are building a new education management system for St Stephen&rsquo;s. When it
                  launches, this page becomes its front door — same address, much more power.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Roles + coming features */}
          <div className="lg:col-span-7">
            <SectionHeading
              eyebrow="Who uses the portal"
              title="Built for every member of the school"
            />
            <div className="mt-8 space-y-4">
              {roles.map((role, i) => (
                <Reveal key={role.title} delay={i * 90}>
                  <div className="card card-hover flex items-start gap-5 p-6">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <role.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-extrabold text-ink-900">
                        {role.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed">{role.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={150}>
              <div className="mt-8 rounded-2xl bg-navy-900 p-8">
                <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-[0.14em] text-brand-300">
                  <CalendarIcon className="h-4 w-4" /> Coming in the new system
                </p>
                <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {comingFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/85">
                      <CheckIcon className="h-4 w-4 shrink-0 text-leaf-500" />
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
