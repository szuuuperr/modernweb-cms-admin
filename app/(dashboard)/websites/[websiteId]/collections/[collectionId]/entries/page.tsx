"use client";

import { use } from "react";
import { EntriesSection } from "@/sections/entries/entries-section";

export default function EntriesPage({
  params,
}: {
  params: Promise<{ websiteId: string; collectionId: string }>;
}) {
  const { websiteId, collectionId } = use(params);
  return <EntriesSection websiteId={websiteId} collectionId={collectionId} />;
}
