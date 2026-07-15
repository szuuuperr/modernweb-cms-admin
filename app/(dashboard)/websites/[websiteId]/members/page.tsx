"use client";

import { use } from "react";
import { MembersSection } from "@/sections/members/members-section";

export default function MembersPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  return <MembersSection websiteId={websiteId} />;
}
