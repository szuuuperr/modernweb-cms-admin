"use client";

import { use } from "react";
import { RolesSection } from "@/sections/roles/roles-section";

export default function RolesPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  return <RolesSection websiteId={websiteId} />;
}
