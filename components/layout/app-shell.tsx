"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useCan } from "@/lib/auth/use-can";
import { useCurrentWebsiteId, useIsPlatformAdmin } from "@/lib/auth/use-view";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Website permission required; omitted means "always show". */
  permission?: string;
  /** Exact match instead of prefix — for the website root. */
  exact?: boolean;
}

/** ModernWeb staff: pick a website, then work inside it via the tab bar. */
const PLATFORM_NAV: NavItem[] = [
  { href: "/websites", label: "Websites", icon: Globe },
  { href: "/users", label: "Pengguna", icon: Users },
];

/**
 * Clients live inside one website and only fill in content. Deliberately absent:
 * Pages, Menus, Audit and Role (platform admin's job), and API Keys/Webhooks —
 * which no website role can reach at all since they became platform-only.
 */
function clientNav(websiteId: string): NavItem[] {
  const base = `/websites/${websiteId}`;
  return [
    {
      href: base,
      label: "Dashboard",
      icon: LayoutDashboard,
      permission: "websites.read",
      exact: true,
    },
    {
      href: `${base}/collections`,
      label: "Collection",
      icon: FileText,
      permission: "collections.read",
    },
    {
      href: `${base}/media`,
      label: "Media",
      icon: ImageIcon,
      permission: "media.read",
    },
    {
      href: `${base}/forms`,
      label: "Forms",
      icon: UsersRound,
      permission: "forms.read",
    },
    {
      href: `${base}/settings`,
      label: "Setting",
      icon: Settings,
      permission: "settings.read",
    },
    {
      href: `${base}/members`,
      label: "Anggota",
      icon: Users,
      permission: "members.read",
    },
  ];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isPlatformAdmin = useIsPlatformAdmin();
  const websiteId = useCurrentWebsiteId();
  const { can } = useCan(isPlatformAdmin ? "" : (websiteId ?? ""));

  const items = isPlatformAdmin
    ? PLATFORM_NAV
    : websiteId
      ? clientNav(websiteId).filter(
          (item) => !item.permission || can(item.permission),
        )
      : // A client outside a website (the chooser, when they have several):
        // nothing to link to yet.
        [];

  return (
    <div className="flex min-h-screen">
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-primary-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-[72px] items-center justify-center py-12">
          <Link
            href={isPlatformAdmin ? "/websites" : (websiteId ? `/websites/${websiteId}` : "/websites")}
            aria-label="ModernWeb CMS"
          >
            <Logo width={152} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-label="Tutup menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-6 py-3">
          {items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                  active
                    ? "bg-primary-50 font-medium text-primary-700"
                    : "text-muted hover:bg-slate-50 hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 h-6 w-[3px] rounded-r-full bg-primary-700" />
                )}
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <UserBlock />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface px-5 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDrawerOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Logo width={120} />
        </header>

        {/* PageHeader bleeds to the edges using negative margins that mirror
            this padding — change one and you must change the other. */}
        <main className="flex-1 bg-canvas px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function UserBlock() {
  const { user, logout } = useAuth();

  return (
    <div className="mt-auto border-t border-border p-4">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
          {initials(user?.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">
            {user?.name}
          </p>
          <p className="truncate text-xs text-muted">{user?.email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Keluar">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
