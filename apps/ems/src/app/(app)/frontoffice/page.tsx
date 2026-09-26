import type { Metadata } from "next";
import { EnquiryStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { resolveComplaint, updateEnquiry } from "@/lib/actions/frontoffice-actions";
import { ComplaintLogForm, EnquiryLogForm } from "@/components/frontoffice-forms";

export const metadata: Metadata = { title: "Front Office" };

const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  NEW: "New",
  FOLLOW_UP: "Follow up",
  WON: "Won (admitted)",
  LOST: "Lost",
};

const ENQUIRY_STATUS_STYLE: Record<string, string> = {
  NEW: "bg-brand-50 text-brand-700",
  FOLLOW_UP: "bg-sun-400/15 text-sun-500",
  WON: "bg-leaf-500/10 text-leaf-600",
  LOST: "bg-paper-200 text-ink-400",
};

export default async function FrontOfficePage({
  searchParams,
}: {
  searchParams: Promise<{ logged?: string }>;
}) {
  const user = await requirePermission("frontoffice", "view");
  const { logged = "" } = await searchParams;

  const [mayCreate, mayEdit, enquiries, complaints] = await Promise.all([
    can(user.role, "frontoffice", "create"),
    can(user.role, "frontoffice", "edit"),
    db.enquiry.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 40 }),
    db.complaint.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 40 }),
  ]);

  const openComplaints = complaints.filter((c) => c.status === "OPEN").length;
  const newEnquiries = enquiries.filter((e) => e.status === "NEW").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Front Office</h1>
        <p className="mt-1 text-sm">
          {newEnquiries} new enquir{newEnquiries === 1 ? "y" : "ies"} · {openComplaints} open
          complaint{openComplaints === 1 ? "" : "s"}. Website contact &amp; complaint forms
          land here automatically.
        </p>
      </div>

      {logged && (
        <p className="rounded-xl bg-leaf-500/10 px-4 py-3 text-sm font-semibold text-leaf-600">
          {logged === "enquiry" ? "Enquiry logged." : "Complaint logged."}
        </p>
      )}

      {mayCreate && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EnquiryLogForm />
          <ComplaintLogForm />
        </div>
      )}

      {/* Enquiries */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          Admission &amp; general enquiries
        </h2>
        <div className="card overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Enquirer</th>
                <th>Message</th>
                <th>Source</th>
                <th>Status</th>
                {mayEdit && <th className="text-right">Update</th>}
              </tr>
            </thead>
            <tbody>
              {enquiries.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-ink-400">
                    No enquiries yet.
                  </td>
                </tr>
              )}
              {enquiries.map((e) => (
                <tr key={e.id} className={e.status === "LOST" ? "opacity-50" : ""}>
                  <td>
                    <p className="font-semibold text-ink-900">{e.name}</p>
                    <p className="text-xs text-ink-400">
                      {[e.phone, e.email].filter(Boolean).join(" · ") || "no contact"}
                      {e.subject ? ` · ${e.subject}` : ""}
                    </p>
                  </td>
                  <td className="max-w-xs">
                    <p className="truncate text-ink-500" title={e.message}>{e.message}</p>
                    {e.note && <p className="truncate text-xs text-ink-400">Note: {e.note}</p>}
                  </td>
                  <td>
                    <span className="chip bg-paper-200 text-ink-700">{e.source.toLowerCase()}</span>
                  </td>
                  <td>
                    <span className={`chip ${ENQUIRY_STATUS_STYLE[e.status]}`}>
                      {ENQUIRY_STATUS_LABELS[e.status]}
                    </span>
                    {e.followUpAt && (
                      <p className="mt-0.5 text-[10px] text-ink-400">
                        follow up{" "}
                        {e.followUpAt.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })}
                      </p>
                    )}
                  </td>
                  {mayEdit && (
                    <td>
                      <form action={updateEnquiry} className="flex items-center justify-end gap-1.5">
                        <input type="hidden" name="id" value={e.id} />
                        <select name="status" defaultValue={e.status} className="field !w-28 !py-1.5 text-xs" aria-label={`Status for ${e.name}`}>
                          {Object.entries(ENQUIRY_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <input name="note" placeholder="Note" className="field !w-24 !py-1.5 text-xs" aria-label={`Note for ${e.name}`} />
                        <input name="followUpAt" type="date" className="field !w-32 !py-1.5 text-xs" aria-label={`Follow-up date for ${e.name}`} />
                        <button type="submit" className="btn btn-secondary !px-3 !py-1.5 text-xs">
                          Save
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Complaints */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-400">
          Complaints register
        </h2>
        <div className="card overflow-x-auto">
          <table className="table-admin">
            <thead>
              <tr>
                <th>From</th>
                <th>Complaint</th>
                <th>Source</th>
                <th>Status</th>
                {mayEdit && <th className="text-right">Resolve</th>}
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-ink-400">
                    No complaints — long may it last.
                  </td>
                </tr>
              )}
              {complaints.map((c) => (
                <tr key={c.id} className={c.status === "RESOLVED" ? "opacity-60" : ""}>
                  <td>
                    <p className="font-semibold text-ink-900">{c.name}</p>
                    <p className="text-xs text-ink-400">
                      {[c.phone, c.email].filter(Boolean).join(" · ") || "no contact"}
                      {c.subject ? ` · ${c.subject}` : ""}
                    </p>
                  </td>
                  <td className="max-w-xs">
                    <p className="truncate text-ink-500" title={c.message}>{c.message}</p>
                    {c.resolutionNote && (
                      <p className="truncate text-xs text-leaf-600">Resolved: {c.resolutionNote}</p>
                    )}
                  </td>
                  <td>
                    <span className={`chip ${c.source === "WEBSITE" ? "bg-brand-50 text-brand-700" : "bg-paper-200 text-ink-700"}`}>
                      {c.source.toLowerCase()}
                    </span>
                  </td>
                  <td>
                    {c.status === "OPEN" ? (
                      <span className="chip bg-danger-500/10 text-danger-500">Open</span>
                    ) : (
                      <span className="chip bg-leaf-500/10 text-leaf-600">Resolved</span>
                    )}
                  </td>
                  {mayEdit && (
                    <td>
                      {c.status === "OPEN" ? (
                        <form action={resolveComplaint} className="flex items-center justify-end gap-1.5">
                          <input type="hidden" name="id" value={c.id} />
                          <input name="resolutionNote" placeholder="How was it resolved?" className="field !w-40 !py-1.5 text-xs" aria-label={`Resolution for ${c.name}`} />
                          <button type="submit" className="btn btn-primary !px-3 !py-1.5 text-xs">
                            Resolve
                          </button>
                        </form>
                      ) : (
                        <p className="text-right text-xs text-ink-400">{c.resolvedBy}</p>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
