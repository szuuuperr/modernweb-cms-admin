import type { MetadataRoute } from "next";

/**
 * Second layer over the `robots` metadata in layout.tsx. The meta tag only
 * works once a crawler renders the page; this refuses it at the door.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
