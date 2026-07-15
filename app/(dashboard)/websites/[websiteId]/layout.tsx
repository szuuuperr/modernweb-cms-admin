"use client";

import { use } from "react";
import { WebsiteTabs } from "@/components/layout/website-tabs";

/**
 * Next 16 hands route params to client components as a Promise; `use` unwraps
 * it. Everything under one website shares this tab bar.
 */
export default function WebsiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);

  return (
    <div>
      <WebsiteTabs websiteId={websiteId} />
      {children}
    </div>
  );
}
