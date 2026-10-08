import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { visibleModules, type Module } from "@/lib/rbac";
import { logout } from "@/lib/actions/auth-actions";
import { getActiveSession, getSchoolSettings, logoSrc } from "@/lib/school";
import { RoleChip } from "@/components/role-chip";
import { MobileNav } from "@/components/mobile-nav";
import {
  AwardIcon,
  BookIcon,
  CalendarIcon,
  CashIcon,
  CheckSquareIcon,
  HomeIcon,
  LogoutIcon,
  PlusIcon,
  ScrollIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/icons";

type NavItem = {
  module: Module;
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

/** Sidebar grouped by workflow, in order of precedence: enquiries arrive at
 *  the front office, pupils are admitted and tracked, the school is set up
 *  under Academics, pupils are taught and assessed, billed, staffed — with
 *  administration closing the list. Links show only to roles whose module
 *  permission allows them; empty groups disappear. */
const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [{ module: "dashboard", href: "/", label: "Dashboard", icon: HomeIcon }],
  },
  {
    label: "Front Office",
    items: [
      { module: "frontoffice", href: "/frontoffice", label: "Enquiries & Complaints", icon: UsersIcon },
      { module: "frontoffice", href: "/frontoffice/logs", label: "Office Logs", icon: ScrollIcon },
    ],
  },
  {
    label: "Pupils",
    items: [
      { module: "students", href: "/students/new", label: "New Admission", icon: PlusIcon },
      { module: "students", href: "/students", label: "Students", icon: UsersIcon },
      { module: "attendance", href: "/attendance", label: "Attendance", icon: CheckSquareIcon },
      { module: "attendance", href: "/attendance/leave", label: "Pupil Leave", icon: CalendarIcon },
    ],
  },
  {
    label: "Academics",
    items: [
      { module: "academics", href: "/academics/classes", label: "Classes & Streams", icon: BookIcon },
      { module: "academics", href: "/academics/subjects", label: "Subjects", icon: BookIcon },
      { module: "academics", href: "/academics/timetable", label: "Timetable", icon: CalendarIcon },
    ],
  },
  {
    label: "Learning",
    items: [
      { module: "exams", href: "/exams", label: "Examinations", icon: AwardIcon },
      { module: "homework", href: "/homework", label: "Homework", icon: BookIcon },
    ],
  },
  {
    label: "Finance",
    items: [
      { module: "fees", href: "/fees", label: "Fees Collection", icon: CashIcon },
      { module: "fees", href: "/fees/setup", label: "Fees Setup", icon: SettingsIcon },
      { module: "finance", href: "/finance", label: "Income & Expenses", icon: CashIcon },
    ],
  },
  {
    label: "Transport & Boarding",
    items: [
      { module: "transport", href: "/transport", label: "Routes & Riders", icon: UsersIcon },
      { module: "transport", href: "/transport/vehicles", label: "Vehicles & Drivers", icon: SettingsIcon },
      { module: "boarding", href: "/boarding", label: "Dormitories", icon: HomeIcon },
    ],
  },
  {
    label: "Staff & HR",
    items: [
      { module: "staff", href: "/staff", label: "Staff Directory", icon: UsersIcon },
      { module: "staff", href: "/staff/attendance", label: "Staff Attendance", icon: CheckSquareIcon },
      { module: "staff", href: "/staff/leave", label: "Leave Management", icon: CalendarIcon },
      { module: "payroll", href: "/payroll", label: "Payroll", icon: CashIcon },
    ],
  },
  {
    label: "Communication",
    items: [
      { module: "communication", href: "/communication", label: "Notices & Calendar", icon: ScrollIcon },
    ],
  },
  {
    label: "Administration",
    items: [
      { module: "reports", href: "/reports", label: "Reports", icon: ScrollIcon },
      { module: "users", href: "/users", label: "Users & Logins", icon: UsersIcon },
      { module: "settings", href: "/settings", label: "School Settings", icon: SettingsIcon },
      { module: "settings", href: "/settings/sessions", label: "Sessions & Terms", icon: CalendarIcon },
      { module: "settings", href: "/settings/permissions", label: "Roles & Permissions", icon: ShieldIcon },
      { module: "audit", href: "/audit", label: "Audit Trail", icon: ScrollIcon },
    ],
  },
];

/** One word each, for the bottom bar: a tab is a fifth of a phone screen. */
const SHORT_LABELS: Record<string, string> = {
  "/": "Home",
  "/students": "Pupils",
  "/attendance": "Register",
  "/fees": "Fees",
  "/exams": "Exams",
  "/staff": "Staff",
  "/finance": "Finance",
  "/reports": "Reports",
  "/frontoffice": "Office",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [modules, school, activeSession] = await Promise.all([
    visibleModules(user.role),
    getSchoolSettings(),
    getActiveSession(),
  ]);
  const moduleSet = new Set<Module>(modules);
  const navGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => moduleSet.has(i.module)),
  })).filter((g) => g.items.length > 0);
  const navItems = navGroups.flatMap((g) => g.items);

  /* The four destinations that get a slot in the phone's bottom bar, picked
     from this role's own visible links. An accountant should not be given a
     tab for Attendance just because an administrator would want one, so the
     order below is a preference list and the first four that survive the
     role filter win. Anything not chosen is still one tap away under More. */
  const PRIMARY_ORDER = [
    "/", "/students", "/attendance", "/fees", "/exams",
    "/staff", "/finance", "/reports", "/frontoffice",
  ];
  const mobileAll = navGroups.flatMap((g) =>
    g.items.map((i) => ({ href: i.href, label: i.label, group: g.label })),
  );
  const mobilePrimary = PRIMARY_ORDER.map((href) =>
    mobileAll.find((i) => i.href === href),
  )
    .filter((i): i is (typeof mobileAll)[number] => Boolean(i))
    .slice(0, 4)
    // "Enquiries & Complaints" does not fit under a 20%-wide tab.
    .map((i) => ({ ...i, label: SHORT_LABELS[i.href] ?? i.label }));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-navy-900 text-white/80 lg:flex">
        <div className="flex items-center gap-3 border-b-2 border-maroon-500 px-5 py-5">
          <Image
            src={logoSrc(school)}
            alt=""
            width={44}
            height={44}
            unoptimized
            className="h-11 w-11 rounded-full bg-white object-contain"
          />
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-extrabold text-white">
              {school.shortName}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-maroon-300">
              School Management
            </p>
          </div>
        </div>

        <nav className="mt-1 flex-1 overflow-y-auto px-3 pb-3" aria-label="Main">
          {navGroups.map((group, gi) => (
            <div key={group.label ?? "top"} className={gi > 0 ? "mt-4" : ""}>
              {group.label && (
                <p className="px-3.5 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-white/8 hover:text-white"
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0 text-brand-300" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="!mt-6 border-t border-navy-700 pt-4">
            <p className="px-3.5 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
              Coming next
            </p>
            {["SMS & Email"].map((label) => (
              <p key={label} className="cursor-default px-3.5 py-1.5 text-sm text-white/30">
                {label}
              </p>
            ))}
          </div>
        </nav>

        <p className="px-5 py-4 text-[10px] text-white/30">
          {activeSession ? `Session ${activeSession.name}` : "No active session"} · {school.shortName}
        </p>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-paper-300 bg-paper-50/95 px-5 backdrop-blur lg:px-8">
          {/* min-w-0 + truncate, or a long school name pushes the user's name
              into three wrapped lines and the 64px header grows to 110px. */}
          <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
            <Image src={logoSrc(school)} alt="" width={34} height={34} unoptimized className="h-9 w-9 shrink-0 rounded-full bg-white object-contain" />
            <span className="truncate font-display text-sm font-extrabold text-ink-900">
              {school.shortName}
            </span>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            {activeSession && (
              <span className="chip bg-brand-50 text-brand-700">
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                Session {activeSession.name}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3 lg:gap-4">
            {/* The name is the thing that wraps; the role chip alone is enough
                identification on a phone, and the full name is on the desktop
                header where there is room for it. */}
            <div className="text-right">
              <p className="hidden text-sm font-bold leading-tight text-ink-900 sm:block">
                {user.name}
              </p>
              <RoleChip role={user.role} />
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="btn btn-secondary !min-h-11 !min-w-11 !px-3"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogoutIcon className="h-4 w-4" />
              </button>
            </form>
          </div>
        </header>

        {/* Phones get a bottom bar and a sheet instead of the old horizontal
            strip holding every link — see components/mobile-nav.tsx for the
            measurements that justified the change. pb-24 keeps the last row
            of a long table clear of the bar. */}
        <main className="flex-1 p-5 pb-24 lg:p-8 lg:pb-8">{children}</main>
      </div>

      <MobileNav primary={mobilePrimary} all={mobileAll} />
    </div>
  );
}
