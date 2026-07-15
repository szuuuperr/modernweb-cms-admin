"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "./auth-context";

/**
 * The panel serves two audiences with one codebase.
 *
 * Platform admins (ModernWeb staff) define collections, manage pages/menus,
 * mint API keys and read the audit log across every website. Clients — owners,
 * managers, editors of a single website — only fill in content. The two need
 * different navigation, so the shell branches on this.
 *
 * This decides *what to render*, never what is allowed: PermissionsGuard and
 * RequirePlatformRole on the backend do that.
 */
export function useIsPlatformAdmin() {
  const { user } = useAuth();
  return (
    user?.platformRole === "SUPER_ADMIN" || user?.platformRole === "PLATFORM_ADMIN"
  );
}

/**
 * The website the user is currently inside, read from the URL.
 *
 * The client sidebar links into a specific website, but it lives in the
 * dashboard layout which has no route params of its own — so the id comes from
 * the path rather than from a context provider nothing else would use.
 */
export function useCurrentWebsiteId(): string | null {
  const pathname = usePathname();
  return /^\/websites\/([^/]+)/.exec(pathname)?.[1] ?? null;
}
