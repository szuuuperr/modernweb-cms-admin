"use client";

import { use } from "react";
import { MenusSection } from "@/sections/menus/menus-section";

export default function MenusPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  return <MenusSection websiteId={websiteId} />;
}
