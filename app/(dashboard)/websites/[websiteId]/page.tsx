"use client";

import { use } from "react";
import { WebsiteOverviewSection } from "@/sections/websites/website-overview-section";

export default function WebsitePage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  return <WebsiteOverviewSection websiteId={websiteId} />;
}
