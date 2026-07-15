"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useWebsite } from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

/** Tabs are filtered by permission so the nav never offers a certain 403. */
const TABS = [
  { segment: "", label: "Ringkasan", permission: "websites.read" },
  { segment: "/collections", label: "Collections", permission: "collections.read" },
  { segment: "/pages", label: "Pages", permission: "pages.read" },
  { segment: "/menus", label: "Menus", permission: "menus.read" },
  { segment: "/media", label: "Media", permission: "media.read" },
  { segment: "/seo", label: "SEO", permission: "seo.read" },
  { segment: "/settings", label: "Settings", permission: "settings.read" },
  { segment: "/api-keys", label: "API Keys", permission: "apikeys.read" },
  { segment: "/members", label: "Anggota", permission: "members.read" },
  { segment: "/roles", label: "Role", permission: "roles.read" },
];

export function WebsiteTabs({ websiteId }: { websiteId: string }) {
  const pathname = usePathname();
  const { can } = useCan(websiteId);
  const { data: website } = useWebsite(websiteId);
  const base = `/websites/${websiteId}`;

  return (
    <PageHeader
      title={website?.name ?? "Memuat…"}
      breadcrumb={
        <Link
          href="/websites"
          className="mb-1 inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-primary-700"
        >
          <ChevronLeft className="h-3 w-3" />
          Semua website
        </Link>
      }
    >
      <nav className="-mb-px flex gap-1 overflow-x-auto">
        {TABS.filter((tab) => can(tab.permission)).map((tab) => {
          const href = `${base}${tab.segment}`;
          // Without the exact check, "Ringkasan" would stay active on every
          // nested route because every path starts with the base.
          const active = tab.segment
            ? pathname.startsWith(href)
            : pathname === base;
          return (
            <Link
              key={tab.label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors",
                active
                  ? "border-primary-700 font-medium text-primary-700"
                  : "border-transparent text-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </PageHeader>
  );
}
