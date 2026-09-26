import type { Metadata } from "next";
import Link from "next/link";
import { school } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/ui";
import { EnquiryForm } from "@/components/enquiry-form";
import { ChatIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Get in touch with ${school.name}, Bulimbo — admissions enquiries, visits and general questions.`,
};

const ENQUIRY_SUBJECTS = [
  "Admissions enquiry",
  "Fees and payments",
  "Visiting the school",
  "General question",
  "Something else",
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact us"
        title="We'd love to hear from you"
        intro="Questions about admissions, fees or school life? Send us a message or reach the office directly."
      />
      <Section>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="font-display text-2xl font-extrabold text-ink-900">
              Reach the school office
            </h2>
            <p className="mt-3 leading-relaxed">
              The office is open on all working days during term time. Prefer to talk? Any of
              these work:
            </p>
            <ul className="mt-8 space-y-6">
              <li className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <PhoneIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Phone</p>
                  <a href={`tel:${school.phoneHref}`} className="font-bold text-ink-900 hover:text-brand-600">
                    {school.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <MailIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Email</p>
                  <a href={`mailto:${school.email}`} className="font-bold text-ink-900 hover:text-brand-600">
                    {school.email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <PinIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Address</p>
                  <p className="font-bold text-ink-900">{school.address}</p>
                  <p className="mt-1 text-sm">{school.location}</p>
                </div>
              </li>
            </ul>

            <div className="mt-10 rounded-2xl border border-brand-200 bg-brand-50 p-6">
              <p className="flex items-center gap-2 font-display text-sm font-extrabold text-brand-800">
                <ChatIcon className="h-4 w-4" /> Have a concern to raise?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">
                We take feedback seriously. Use our dedicated{" "}
                <Link href="/complain/" className="font-bold text-brand-700 underline">
                  complaints page
                </Link>{" "}
                and the administration will handle it confidentially.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <EnquiryForm kind="Enquiry" subjects={ENQUIRY_SUBJECTS} />
          </div>
        </div>
      </Section>
    </>
  );
}
