"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Globe, Users } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/websites", label: "Websites", icon: Globe },
  { href: "/users", label: "Pengguna", icon: Users, platformOnly: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // /users is guarded by RequirePlatformRole(SUPPORT) on the backend; hiding it
  // from everyone else keeps the nav from advertising a guaranteed 403.
  const canSeeUsers = user?.platformRole !== "NONE";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4">
          <Link href="/websites" className="text-sm font-semibold">
            ModernWeb <span className="text-slate-400">CMS</span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV.filter((item) => !item.platformOnly || canSeeUsers).map(
              (item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-slate-100 font-medium text-slate-900"
                        : "text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              },
            )}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.platformRole}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Keluar">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
