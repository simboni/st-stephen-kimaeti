"use client";

import { useId, useRef, useState } from "react";
import { emsUrl, school, whatsapp } from "@/lib/site";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";

type Status = "idle" | "submitting" | "done" | "error";

/**
 * Dual delivery: every message posts into the school management system's
 * front-office queue AND to FormSubmit, which emails the school inbox as a
 * backup. Submission succeeds if either channel accepts it, so nothing is lost
 * while the EMS is still being deployed.
 *
 * Accessibility notes, because forms are where sites usually fail an audit:
 * errors are announced through aria-live, tied to their field with
 * aria-describedby, and focus jumps to the first invalid field on submit.
 * Validation is ours rather than the browser's (`noValidate`) so the messages
 * are in our own words, but the fields still carry `required` and the right
 * `type`, so assistive technology and phone keyboards behave correctly.
 */

const FORM_ENDPOINT = `https://formsubmit.co/ajax/${school.email}`;
const EMS_ENDPOINT = `${emsUrl}/api/public/message`;

const field =
  "w-full rounded-lg border border-line bg-surface-3 px-4 py-3 text-[15px] text-text " +
  "placeholder:text-text-3 transition-colors focus:border-accent " +
  "aria-[invalid=true]:border-second";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function EnquiryForm({
  kind,
  subjects,
}: {
  /** Used in the subject line so the office can triage messages. */
  kind: "Enquiry" | "Complaint";
  subjects: string[];
}) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    _honey: "",
  });

  const id = (k: string) => `${uid}-${k}`;
  const errId = (k: string) => `${uid}-${k}-error`;

  const update =
    (k: keyof typeof form) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Please tell us your name.";
    if (!isEmail(form.email)) e.email = "Enter an email address we can reply to.";
    if (form.message.trim().length < 10) e.message = "Please give us a little more detail.";
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id(first))}`)?.focus();
    }
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form._honey) return; // bot trap
    if (!validate()) return;
    setStatus("submitting");

    const emsPost = fetch(EMS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: kind === "Complaint" ? "COMPLAINT" : "ENQUIRY",
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject || "General",
        message: form.message,
        website: form._honey,
      }),
    }).then((res) => (res.ok ? res : Promise.reject(new Error(`HTTP ${res.status}`))));

    const emailPost = fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone || "not given",
        subject: form.subject || "General",
        message: form.message,
        _subject: `${kind} from the school website — ${form.name}`,
        _template: "table",
        _captcha: "false",
      }),
    }).then((res) => (res.ok ? res : Promise.reject(new Error(`HTTP ${res.status}`))));

    const results = await Promise.allSettled([emsPost, emailPost]);
    setStatus(results.some((r) => r.status === "fulfilled") ? "done" : "error");
  }

  if (status === "done") {
    return (
      <div className="rounded-lg border border-line bg-surface-3 p-10 text-center" role="status">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <CheckIcon className="h-7 w-7" />
        </span>
        <h2 className="display mt-6 text-2xl">
          {kind === "Complaint" ? "Complaint received" : "Message sent"}
        </h2>
        <p className="mx-auto mt-3 max-w-sm leading-relaxed">
          Thank you, {form.name.split(" ")[0]}. The school office has your{" "}
          {kind.toLowerCase()} and will reply to {form.email}.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="relative rounded-lg border border-line bg-surface-3 p-6 sm:p-8"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={id("name")} className="mb-2 block text-sm font-semibold text-text">
            Full name <span className="text-second">*</span>
          </label>
          <input
            id={id("name")}
            type="text"
            required
            value={form.name}
            onChange={update("name")}
            placeholder="e.g. Jane Wanjala"
            className={field}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? errId("name") : undefined}
          />
          {errors.name && (
            <p id={errId("name")} className="mt-2 text-sm font-semibold text-second">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={id("email")} className="mb-2 block text-sm font-semibold text-text">
            Email address <span className="text-second">*</span>
          </label>
          <input
            id={id("email")}
            type="email"
            required
            value={form.email}
            onChange={update("email")}
            placeholder="you@example.com"
            className={field}
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? errId("email") : undefined}
          />
          {errors.email && (
            <p id={errId("email")} className="mt-2 text-sm font-semibold text-second">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={id("phone")} className="mb-2 block text-sm font-semibold text-text">
            Phone <span className="font-normal text-text-3">(optional)</span>
          </label>
          <input
            id={id("phone")}
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            placeholder="07xx xxx xxx"
            className={field}
            autoComplete="tel"
            inputMode="tel"
          />
        </div>

        <div>
          <label htmlFor={id("subject")} className="mb-2 block text-sm font-semibold text-text">
            {kind === "Complaint" ? "What is it about?" : "How can we help?"}
          </label>
          <select
            id={id("subject")}
            value={form.subject}
            onChange={update("subject")}
            className={field}
          >
            <option value="">Choose one…</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor={id("message")} className="mb-2 block text-sm font-semibold text-text">
          {kind === "Complaint" ? "Describe your complaint" : "Your message"}{" "}
          <span className="text-second">*</span>
        </label>
        <textarea
          id={id("message")}
          rows={6}
          required
          value={form.message}
          onChange={update("message")}
          placeholder={
            kind === "Complaint"
              ? "Tell us what happened, when, and who was involved. Every complaint is handled seriously and confidentially."
              : "Tell us a little about your enquiry…"
          }
          className={field}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? errId("message") : undefined}
        />
        {errors.message && (
          <p id={errId("message")} className="mt-2 text-sm font-semibold text-second">
            {errors.message}
          </p>
        )}
      </div>

      {/* Bot trap. Moved off-screen rather than display:none, which some bots
          detect and skip. Hidden from assistive technology and from the tab
          order, so nobody legitimate will ever meet it. */}
      <div aria-hidden className="absolute left-[-9999px] top-0 h-px w-px overflow-hidden">
        <label htmlFor={id("website")}>Leave this field empty</label>
        <input
          id={id("website")}
          type="text"
          value={form._honey}
          onChange={update("_honey")}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Announced the moment it appears, wherever the keyboard happens to be. */}
      <div aria-live="polite">
        {status === "error" && (
          <p className="mt-5 rounded-lg border border-second/40 bg-second-soft px-4 py-3 text-sm leading-relaxed">
            Something went wrong sending your message. Please try again, email us at{" "}
            <a className="link-underline break-all" href={`mailto:${school.email}`}>
              {school.email}
            </a>
            , or send it on WhatsApp.
          </p>
        )}
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={status === "submitting"} className="btn btn-primary">
          {status === "submitting"
            ? "Sending…"
            : kind === "Complaint"
              ? "Submit complaint"
              : "Send message"}
        </button>
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Or message on WhatsApp
        </a>
      </div>
    </form>
  );
}
