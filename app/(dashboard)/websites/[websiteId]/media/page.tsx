"use client";

import { use } from "react";
import { MediaSection } from "@/sections/media/media-section";

export default function MediaPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  return <MediaSection websiteId={websiteId} />;
}
