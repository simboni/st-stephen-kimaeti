import type { Role } from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  ACCOUNTANT: "Accountant",
  TEACHER: "Teacher",
  RECEPTIONIST: "Receptionist",
  LIBRARIAN: "Librarian",
  PARENT: "Parent",
  STUDENT: "Student",
};

const tones: Record<Role, string> = {
  SUPER_ADMIN: "bg-navy-900 text-white",
  ADMIN: "bg-brand-100 text-brand-800",
  ACCOUNTANT: "bg-leaf-500/15 text-leaf-600",
  TEACHER: "bg-sky-500/15 text-sky-500",
  RECEPTIONIST: "bg-sun-400/20 text-[#8a6d00]",
  LIBRARIAN: "bg-paper-200 text-ink-700",
  PARENT: "bg-brand-50 text-brand-700",
  STUDENT: "bg-navy-700/10 text-navy-700",
};

export function RoleChip({ role }: { role: Role }) {
  return <span className={`chip ${tones[role]}`}>{ROLE_LABELS[role]}</span>;
}

export type RoleOption = { value: string; label: string };

export function roleOptions(roles: string[]): RoleOption[] {
  return roles.map((r) => ({ value: r, label: ROLE_LABELS[r as Role] ?? r }));
}
