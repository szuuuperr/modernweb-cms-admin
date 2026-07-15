"use client";

import { use } from "react";
import { SeoDefaultsSection } from "@/sections/seo/seo-defaults-section";

export default function SeoPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  return <SeoDefaultsSection websiteId={websiteId} />;
}
