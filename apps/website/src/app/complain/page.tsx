import type { Metadata } from "next";
import { school } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/ui";
import { EnquiryForm } from "@/components/enquiry-form";
import { CheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Make a Complaint",
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
        eyebrow="Complaints"
        title="Raise a concern with us"
        intro="Your feedback helps us protect our learners and improve our school. Every complaint reaches the administration directly."
      />
      <Section>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="font-display text-2xl font-extrabold text-ink-900">
              How we handle complaints
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                "Your complaint goes straight to the school administration.",
                "We treat every report seriously and confidentially.",
                "We acknowledge receipt and follow up with you on the outcome.",
                "Matters touching on child welfare are always given first priority.",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 leading-relaxed">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf-500/15 text-leaf-600">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <p className="mt-8 rounded-2xl bg-paper-200 p-5 text-sm leading-relaxed">
              You can also raise a concern in person at the school office, call{" "}
              <a href={`tel:${school.phoneHref}`} className="font-bold text-ink-900">
                {school.phone}
              </a>{" "}
              or email{" "}
              <a href={`mailto:${school.email}`} className="font-bold text-ink-900">
                {school.email}
              </a>
              .
            </p>
          </div>
          <div className="lg:col-span-7">
            <EnquiryForm kind="Complaint" subjects={COMPLAINT_SUBJECTS} />
          </div>
        </div>
      </Section>
    </>
  );
}
