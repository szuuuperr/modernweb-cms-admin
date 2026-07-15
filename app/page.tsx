"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { LoadingBlock } from "@/components/ui/feedback";

/**
 * The panel has no landing page of its own — it forwards to the websites list,
 * or to /login once the session bootstrap has had its say.
 */
export default function RootPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/websites");
    else if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  return <LoadingBlock label="Mengalihkan…" />;
}
