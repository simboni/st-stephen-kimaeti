import type { Metadata } from "next";
import { requirePermission, can } from "@/lib/rbac";
import { getSchoolSettings, logoSrc } from "@/lib/school";
import { SchoolLogoForm, SchoolSettingsForm } from "@/components/settings-forms";

export const metadata: Metadata = { title: "School Settings" };

export default async function SettingsPage() {
  const user = await requirePermission("settings", "view");
  const [settings, mayEdit] = await Promise.all([
    getSchoolSettings(),
    can(user.role, "settings", "edit"),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">School Settings</h1>
        <p className="mt-1 text-sm">
          The school&rsquo;s identity — used on receipts, report cards and everywhere the
          system prints or displays the school&rsquo;s details.
        </p>
      </div>
      <SchoolLogoForm
        logoSrc={logoSrc(settings)}
        hasCustomLogo={!!settings.logoType}
        canEdit={mayEdit}
      />
      <SchoolSettingsForm
        settings={{
          name: settings.name,
          shortName: settings.shortName,
          motto: settings.motto,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          currency: settings.currency,
          admissionPrefix: settings.admissionPrefix,
          timezone: settings.timezone,
        }}
        canEdit={mayEdit}
      />
    </div>
  );
}
