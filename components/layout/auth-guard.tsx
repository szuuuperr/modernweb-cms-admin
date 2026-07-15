"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { LoadingBlock } from "@/components/ui/feedback";

/**
 * A convenience redirect, not a security boundary. It runs in the browser and
 * anyone can skip it — which is fine, because the pages behind it hold no data
 * until the API hands it over, and the API checks the token on every call.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return <LoadingBlock label="Memeriksa sesi…" />;
  }
  return <>{children}</>;
}
