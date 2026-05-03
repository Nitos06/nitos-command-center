import { createBrandedClient } from "@/lib/supabase/branded-query";
import WidgetConfigurator from "./widget-configurator";

export default async function WidgetsPage() {
  const { brandId } = await createBrandedClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.example.com";

  return <WidgetConfigurator brandId={brandId ?? ""} appUrl={appUrl} />;
}
