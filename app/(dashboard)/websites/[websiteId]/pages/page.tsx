"use client";

import { use } from "react";
import { PagesSection } from "@/sections/pages/pages-section";

export default function PagesPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  return <PagesSection websiteId={websiteId} />;
}
