"use client";

import { use } from "react";
import { WebhooksSection } from "@/sections/webhooks/webhooks-section";

export default function WebhooksPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  return <WebhooksSection websiteId={websiteId} />;
}
