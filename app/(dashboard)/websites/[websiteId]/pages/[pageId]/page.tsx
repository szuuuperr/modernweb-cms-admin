"use client";

import { use } from "react";
import { PageEditorSection } from "@/sections/pages/page-editor-section";

/** `pageId` is the literal "new" when creating — the section branches on it. */
export default function PageEditorPage({
  params,
}: {
  params: Promise<{ websiteId: string; pageId: string }>;
}) {
  const { websiteId, pageId } = use(params);
  return <PageEditorSection websiteId={websiteId} pageId={pageId} />;
}
