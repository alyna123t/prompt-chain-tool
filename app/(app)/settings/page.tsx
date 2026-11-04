import { getSettingsView } from "@/lib/settings";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const view = await getSettingsView();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Set the Anthropic API key used to run chains. Stored in your database,
          readable only by superadmins, and never sent to the browser.
        </p>
      </div>

      <SettingsForm view={view} />
    </div>
  );
}
