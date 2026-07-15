"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWebsite } from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { cn } from "@/lib/utils";

/** Tabs are filtered by permission so the nav never offers a certain 403. */
const TABS = [
  { segment: "", label: "Ringkasan", permission: "websites.read" },
  { segment: "/collections", label: "Collections", permission: "collections.read" },
  { segment: "/media", label: "Media", permission: "media.read" },
  { segment: "/members", label: "Anggota", permission: "members.read" },
  { segment: "/roles", label: "Role", permission: "roles.read" },
];

export function WebsiteTabs({ websiteId }: { websiteId: string }) {
  const pathname = usePathname();
  const { can } = useCan(websiteId);
  const { data: website } = useWebsite(websiteId);
  const base = `/websites/${websiteId}`;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/websites" className="text-xs text-slate-500 hover:underline">
          ← Semua website
        </Link>
        <h1 className="mt-1 text-lg font-semibold">
          {website?.name ?? "Memuat…"}
        </h1>
      </div>

      <nav className="flex gap-1 border-b border-slate-200">
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
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
                active
                  ? "border-slate-900 font-medium text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
