"use client";

import { use } from "react";
import { AnalyticsSection } from "@/sections/analytics/analytics-section";

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  return <AnalyticsSection websiteId={websiteId} />;
}
