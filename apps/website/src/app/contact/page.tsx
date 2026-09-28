import type { Metadata } from "next";
import Link from "next/link";
import { contacts, school, whatsapp } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { Photo } from "@/components/photo";
import { Reveal, Section, SectionHead } from "@/components/ui";
import { EnquiryForm } from "@/components/enquiry-form";
import {
  ChatIcon,
  ClockIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  WhatsAppIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Contact",
  description: `Reach ${school.shortName} — admissions enquiries, fees, boarding and visits. ${school.address}. Call the director, the head teacher or the accountant direct, or message the school on WhatsApp.`,
};

const ENQUIRY_SUBJECTS = [
  "Admissions enquiry",
  "Fees and payments",
  "Boarding",
  "School transport",
  "Visiting the school",
  "General question",
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        index="09"
        eyebrow="Contact"
        title="Somebody picks up"
        lede="Questions about admissions, fees, boarding or the bus? Send a message, or just ring the office."
        photo="school-grounds"
      />

      <Section size="loose">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Ways to reach the school */}
          <div className="lg:col-span-5">
            <Reveal>
              <SectionHead
                index="01"
                eyebrow="The office"
                title="Four ways to reach us"
                lede="Open every working day during term. Any of these will get an answer."
              />

              <ul className="mt-10 divide-y divide-line border-y border-line">
                <li className="flex items-start gap-4 py-6">
                  <PhoneIcon className="mt-1 h-5 w-5 shrink-0 text-second" />
                  <div>
                    <p className="eyebrow eyebrow-plain">Telephone</p>
                    <ul className="mt-2 space-y-2.5">
                      {contacts.map((c) => (
                        <li key={c.href}>
                          <a
                            href={`tel:${c.href}`}
                            className="block font-display text-xl text-text hover:text-accent"
                          >
                            {c.phone}
                          </a>
                          <span className="text-sm text-text-3">{c.role}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>

                <li className="flex items-start gap-4 py-6">
                  <WhatsAppIcon className="mt-1 h-5 w-5 shrink-0 text-second" />
                  <div>
                    <p className="eyebrow eyebrow-plain">WhatsApp</p>
                    <a
                      href={`https://wa.me/${whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 block font-display text-xl text-text hover:text-accent"
                    >
                      Message the school
                    </a>
                    <p className="mt-1 text-sm text-text-3">
                      The fastest way to send a fee receipt.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-4 py-6">
                  <MailIcon className="mt-1 h-5 w-5 shrink-0 text-second" />
                  <div>
                    <p className="eyebrow eyebrow-plain">Email</p>
                    <a
                      href={`mailto:${school.email}`}
                      className="mt-1.5 block break-all font-display text-lg text-text hover:text-accent"
                    >
                      {school.email}
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4 py-6">
                  <PinIcon className="mt-1 h-5 w-5 shrink-0 text-second" />
                  <div>
                    <p className="eyebrow eyebrow-plain">In person</p>
                    <p className="mt-1.5 font-display text-lg text-text">{school.address}</p>
                    <p className="text-text-3">
                      {school.ward} · {school.location}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-text-3">
                      <ClockIcon className="h-4 w-4" />
                      Monday to Friday, 7:30 AM – 5:00 PM
                    </p>
                  </div>
                </li>
              </ul>

              <div className="mt-8 rounded-lg border border-line bg-surface-2 p-6">
                <p className="inline-flex items-center gap-2 font-display text-lg text-text">
                  <ChatIcon className="h-4 w-4 text-second" />
                  Something to raise, not to ask?
                </p>
                <p className="mt-2 leading-relaxed">
                  Use the{" "}
                  <Link href="/complain/" className="link-underline">
                    complaints page
                  </Link>
                  . It goes straight to the administration and is handled confidentially.
                </p>
              </div>
            </Reveal>
          </div>

          {/* The form */}
          <div className="lg:col-span-7">
            <Reveal delay={80}>
              <EnquiryForm kind="Enquiry" subjects={ENQUIRY_SUBJECTS} />
            </Reveal>

            <Reveal delay={140}>
              <figure className="mt-10">
                <Photo
                  src="one-to-one"
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  ratio="16/10"
                  className="rounded-lg"
                />
                <figcaption className="plate-caption">
                  Come on any working day — the office will walk you round.
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
