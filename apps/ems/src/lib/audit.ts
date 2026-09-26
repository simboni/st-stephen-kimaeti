import "server-only";
import { db } from "@/lib/db";
import { clientIp, type SessionUser } from "@/lib/auth";

/** Append to the immutable audit trail. Never throws — auditing must not break the action. */
export async function audit(
  actor: Pick<SessionUser, "id" | "username"> | { id?: string; username: string },
  module: string,
  action: string,
  detail = "",
) {
  try {
    await db.auditLog.create({
      data: {
        userId: "id" in actor ? actor.id : undefined,
        username: actor.username,
        module,
        action,
        detail,
        ip: await clientIp(),
      },
    });
  } catch (e) {
    console.error("audit write failed", e);
  }
}
