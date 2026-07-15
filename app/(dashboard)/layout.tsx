"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/layout/auth-guard";

/**
 * Wraps every signed-in route: the guard decides whether to render at all, the
 * shell supplies the chrome. Route group `(dashboard)` keeps these together
 * without adding a path segment.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
