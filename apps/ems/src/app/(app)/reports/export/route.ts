import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getActiveSession } from "@/lib/school";
import { buildReport, findReport } from "@/lib/reports";

/** CSV download — renders the same data the on-screen report shows. */

function csvEscape(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user || !(await can(user.role, "reports", "view"))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const type = params.get("type") ?? "";
  if (!findReport(type)) return NextResponse.json({ error: "Unknown report" }, { status: 400 });
  const session = await getActiveSession();
  if (!session) return NextResponse.json({ error: "No active session" }, { status: 400 });

  const data = await buildReport(
    type,
    {
      stream: params.get("stream") ?? undefined,
      month: params.get("month") ?? undefined,
      from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined,
      exam: params.get("exam") ?? undefined,
      run: params.get("run") ?? undefined,
      class: params.get("class") ?? undefined,
      gender: params.get("gender") ?? undefined,
      boarding: params.get("boarding") ?? undefined,
      owing: params.get("owing") ?? undefined,
      method: params.get("method") ?? undefined,
      feeType: params.get("feeType") ?? undefined,
      exitType: params.get("exitType") ?? undefined,
      leaveStatus: params.get("leaveStatus") ?? undefined,
    },
    session,
  );
  if (data.error) return NextResponse.json({ error: data.error }, { status: 400 });

  const header = data.columns
    .map((c) => csvEscape(c.kind === "money" ? `${c.label} (KES)` : c.label))
    .join(",");
  const body = data.rows
    .map((row) =>
      row
        .map((cell, i) => {
          if (cell === null || cell === undefined) return "";
          if (data.columns[i]?.kind === "money" && typeof cell === "number")
            return (cell / 100).toFixed(2);
          return csvEscape(String(cell));
        })
        .join(","),
    )
    .join("\n");

  return new NextResponse(`${header}\n${body}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-${session.name}.csv"`,
    },
  });
}
