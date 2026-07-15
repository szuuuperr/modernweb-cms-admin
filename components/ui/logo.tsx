import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The brand asset is a 247×72 wordmark ("Modernweb" + tagline), not a square
 * icon — so it is rendered whole at its own ratio rather than cropped into an
 * avatar box. `priority` because it sits in the first paint of every screen.
 */
export function Logo({
  width = 152,
  className,
}: {
  width?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo-modernweb.png"
      alt="ModernWeb CMS"
      width={width}
      height={Math.round((width * 72) / 247)}
      priority
      className={cn("h-auto", className)}
    />
  );
}
