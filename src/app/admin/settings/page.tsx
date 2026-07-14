import { AdminSettingsForm } from "@/app/admin/settings/AdminSettingsForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin · Settings" };

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("*")
    .maybeSingle();

  return (
    <AdminSettingsForm
      initialAdsEnabled={settings?.ads_enabled ?? false}
      initialBanner={settings?.announcement_banner ?? ""}
    />
  );
}
