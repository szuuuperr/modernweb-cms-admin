"use client";

import { use } from "react";
import { FormsSection } from "@/sections/forms/forms-section";

export default function FormsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  return <FormsSection websiteId={websiteId} />;
}
