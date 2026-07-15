"use client";

import { use } from "react";
import { ApiKeysSection } from "@/sections/api-keys/api-keys-section";

export default function ApiKeysPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  return <ApiKeysSection websiteId={websiteId} />;
}
