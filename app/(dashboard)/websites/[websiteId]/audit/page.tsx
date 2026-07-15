"use client";

import { use } from "react";
import { AuditSection } from "@/sections/audit/audit-section";

export default function AuditPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  return <AuditSection websiteId={websiteId} />;
}
