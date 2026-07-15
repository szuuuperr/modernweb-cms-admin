"use client";

import { use } from "react";
import { SettingsSection } from "@/sections/settings/settings-section";

export default function SettingsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  return <SettingsSection websiteId={websiteId} />;
}
