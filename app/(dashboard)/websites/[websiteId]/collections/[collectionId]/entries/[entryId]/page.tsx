"use client";

import { use } from "react";
import { EntryEditorSection } from "@/sections/entries/entry-editor-section";

/** `entryId` is the literal "new" when creating — the section branches on it. */
export default function EntryEditorPage({
  params,
}: {
  params: Promise<{ websiteId: string; collectionId: string; entryId: string }>;
}) {
  const { websiteId, collectionId, entryId } = use(params);
  return (
    <EntryEditorSection
      websiteId={websiteId}
      collectionId={collectionId}
      entryId={entryId}
    />
  );
}
