"use client";

import { use } from "react";
import { CollectionsSection } from "@/sections/collections/collections-section";

export default function CollectionsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  return <CollectionsSection websiteId={websiteId} />;
}
