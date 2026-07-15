"use client";

import { use } from "react";
import { CollectionBuilderSection } from "@/sections/collections/collection-builder-section";

export default function CollectionBuilderPage({
  params,
}: {
  params: Promise<{ websiteId: string; collectionId: string }>;
}) {
  const { websiteId, collectionId } = use(params);
  return (
    <CollectionBuilderSection
      websiteId={websiteId}
      collectionId={collectionId}
    />
  );
}
