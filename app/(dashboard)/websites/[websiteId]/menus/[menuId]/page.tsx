"use client";

import { use } from "react";
import { MenuEditorSection } from "@/sections/menus/menu-editor-section";

export default function MenuEditorPage({
  params,
}: {
  params: Promise<{ websiteId: string; menuId: string }>;
}) {
  const { websiteId, menuId } = use(params);
  return <MenuEditorSection websiteId={websiteId} menuId={menuId} />;
}
