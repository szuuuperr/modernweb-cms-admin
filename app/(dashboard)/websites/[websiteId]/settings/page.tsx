"use client";

import { use } from "react";
import { useIsPlatformAdmin } from "@/lib/auth/use-view";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsSection } from "@/sections/settings/settings-section";
import { SeoDefaultsSection } from "@/sections/seo/seo-defaults-section";

/**
 * Settings and SEO defaults live on one screen: both are website-wide values
 * the frontend reads, and splitting them across two tabs made the reader hunt
 * for which one held "the site's title". The standalone /seo route is gone —
 * this is the only place it lives now.
 */
export default function SettingsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const isPlatformAdmin = useIsPlatformAdmin();

  return (
    <div>
      {!isPlatformAdmin && (
        <PageHeader
          title="Setting"
          description="Nilai yang dibaca frontend website Anda."
        />
      )}

      <div className="space-y-8">
        <SeoDefaultsSection websiteId={websiteId} />

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Setting lain</h2>
          <SettingsSection websiteId={websiteId} />
        </div>
      </div>
    </div>
  );
}
