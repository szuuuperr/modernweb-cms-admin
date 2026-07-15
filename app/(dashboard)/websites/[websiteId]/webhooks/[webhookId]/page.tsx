"use client";

import { use } from "react";
import { WebhookDeliveriesSection } from "@/sections/webhooks/webhook-deliveries-section";

export default function WebhookDeliveriesPage({
  params,
}: {
  params: Promise<{ websiteId: string; webhookId: string }>;
}) {
  const { websiteId, webhookId } = use(params);
  return (
    <WebhookDeliveriesSection websiteId={websiteId} webhookId={webhookId} />
  );
}
