"use client";

import { useState } from "react";
import { emsUrl, school } from "@/lib/site";
import { CheckIcon } from "@/components/icons";

type Status = "idle" | "submitting" | "done" | "error";

/**
 * Dual delivery: every message posts into the school management system's
 * front-office queue AND to FormSubmit (which emails the school inbox as a
 * backup). Submission succeeds if either channel accepts it.
 */
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${school.email}`;
const EMS_ENDPOINT = `${emsUrl}/api/public/message`;

const inputCls =
  "w-full rounded-xl border border-paper-300 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 transition";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function EnquiryForm({
  kind,
  subjects,
}: {
  /** Used in the email subject line so the office can triage messages. */
  kind: "Enquiry" | "Complaint";
  subjects: string[];
}) {
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

  const update =
    (k: keyof typeof form) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Please tell us your name.";
    if (!isEmail(form.email)) e.email = "Enter a valid email address.";
    if (form.message.trim().length < 10) e.message = "Please give us a little more detail.";
    setErrors(e);
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
      <div className="card flex flex-col items-center gap-4 p-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-leaf-500/15 text-leaf-600">
          <CheckIcon className="h-7 w-7" />
        </span>
        <h3 className="font-display text-2xl font-extrabold text-ink-900">
          {kind === "Complaint" ? "Complaint received" : "Message sent"}
        </h3>
        <p className="max-w-sm leading-relaxed">
          Thank you, {form.name.split(" ")[0]}. The school office has received your{" "}
          {kind.toLowerCase()} and will get back to you at {form.email}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-bold text-ink-900">
            Full name <span className="text-brand-600">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={update("name")}
            placeholder="e.g. Jane Wanjala"
            className={inputCls}
            autoComplete="name"
          />
          {errors.name && <p className="mt-1.5 text-xs font-semibold text-brand-700">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-ink-900">
            Email address <span className="text-brand-600">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={update("email")}
            placeholder="you@example.com"
            className={inputCls}
            autoComplete="email"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs font-semibold text-brand-700">{errors.email}</p>
          )}
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-bold text-ink-900">
            Phone <span className="text-ink-400 font-normal">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            placeholder="07xx xxx xxx"
            className={inputCls}
            autoComplete="tel"
          />
        </div>
        <div>
          <label htmlFor="subject" className="mb-1.5 block text-sm font-bold text-ink-900">
            {kind === "Complaint" ? "What is it about?" : "How can we help?"}
          </label>
          <select id="subject" value={form.subject} onChange={update("subject")} className={inputCls}>
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
        <label htmlFor="message" className="mb-1.5 block text-sm font-bold text-ink-900">
          {kind === "Complaint" ? "Describe your complaint" : "Your message"}{" "}
          <span className="text-brand-600">*</span>
        </label>
        <textarea
          id="message"
          rows={6}
          value={form.message}
          onChange={update("message")}
          placeholder={
            kind === "Complaint"
              ? "Tell us what happened, when, and who was involved. We treat every complaint seriously and confidentially."
              : "Tell us a little about your enquiry…"
          }
          className={inputCls}
        />
        {errors.message && (
          <p className="mt-1.5 text-xs font-semibold text-brand-700">{errors.message}</p>
        )}
      </div>

      {/* honeypot */}
      <input
        type="text"
        value={form._honey}
        onChange={update("_honey")}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />

      {status === "error" && (
        <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
          Something went wrong sending your message. Please try again, or email us directly at{" "}
          <a className="underline" href={`mailto:${school.email}`}>
            {school.email}
          </a>
          .
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting"
          ? "Sending…"
          : kind === "Complaint"
            ? "Submit complaint"
            : "Send message"}
      </button>
    </form>
  );
}
