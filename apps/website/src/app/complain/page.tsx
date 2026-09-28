import type { Metadata } from "next";
import { school, primaryPhone } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { Reveal, Section, SectionHead } from "@/components/ui";
import { EnquiryForm } from "@/components/enquiry-form";
import { CheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Raise a concern",
  description: `Raise a concern or complaint with the administration of ${school.shortName}. Every complaint is handled seriously and confidentially.`,
};

const COMPLAINT_SUBJECTS = [
  "Learner welfare",
  "Academics",
  "Fees and billing",
  "Staff conduct",
  "Facilities",
  "Other",
];

export default function ComplainPage() {
  return (
    <>
      <PageHero
        eyebrow="Raise a concern"
        title="Tell us when something is wrong"
        lede="Your feedback protects our learners and improves the school. Every complaint reaches the administration directly."
        photo="office-desk"
        crumb={[{ href: "/contact/", label: "Contact" }]}
      />
      <Section size="loose">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
            <SectionHead index="01" eyebrow="Our promise" title="How we handle a complaint" />
            <ul className="mt-8 space-y-4">
              {[
                "Your complaint goes straight to the school administration.",
                "We treat every report seriously and confidentially.",
                "We acknowledge receipt and follow up with you on the outcome.",
                "Matters touching on child welfare are always given first priority.",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 leading-relaxed">
                  <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-second" />
                  {point}
                </li>
              ))}
            </ul>
            <p className="mt-8 rounded-lg border border-line bg-surface-2 p-5 text-sm leading-relaxed">
              You can also raise a concern in person at the school office, call{" "}
              <a href={`tel:${primaryPhone.href}`} className="link-underline">
                {primaryPhone.phone}
              </a>{" "}
              or email{" "}
              <a href={`mailto:${school.email}`} className="link-underline break-all">
                {school.email}
              </a>
              .
            </p>
            </Reveal>
          </div>
          <div className="lg:col-span-7">
            <EnquiryForm kind="Complaint" subjects={COMPLAINT_SUBJECTS} />
          </div>
        </div>
      </Section>
    </>
  );
}
