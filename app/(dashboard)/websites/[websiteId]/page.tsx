"use client";

import { use } from "react";
import { useIsPlatformAdmin } from "@/lib/auth/use-view";
import { DashboardSection } from "@/sections/dashboard/dashboard-section";
import { WebsiteOverviewSection } from "@/sections/websites/website-overview-section";

/**
 * Same URL, two screens. Platform admins get the editable website settings;
 * clients get a dashboard where those details are read-only, because slug and
 * domain are wired into the deployed frontend and the public Content API.
 */
export default function WebsitePage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const isPlatformAdmin = useIsPlatformAdmin();

  return isPlatformAdmin ? (
    <WebsiteOverviewSection websiteId={websiteId} />
  ) : (
    <DashboardSection websiteId={websiteId} />
  );
}
