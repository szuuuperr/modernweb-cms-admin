"use client";

import { useCallback } from "react";
import { useWebsitePermissions } from "@/lib/api/hooks";

/**
 * Reads the caller's effective permissions for one website (GET
 * /websites/:id/me) and answers "may I". Purely cosmetic — it decides what to
 * render, never what is allowed; PermissionsGuard on the backend does that.
 */
export function useCan(websiteId: string) {
  const { data, isLoading } = useWebsitePermissions(websiteId);
  const granted = data?.permissions;

  const can = useCallback(
    (permission: string) => granted?.includes(permission) ?? false,
    [granted],
  );

  return { can, role: data?.role ?? null, isLoading };
}
