import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

/** Poppins has no variable font on Google Fonts, so the weights are explicit. */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Kept for slugs, keys and JSON, which need to stay monospaced.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Stays a Server Component on purpose: `metadata` is ignored in client
 * components, and this export is what keeps the panel out of search results.
 * Everything below it is client-rendered — see `Providers`.
 */
export const metadata: Metadata = {
  title: {
    default: "ModernWeb CMS",
    template: "%s · ModernWeb CMS",
  },
  description: "Panel admin ModernWeb CMS",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-canvas text-foreground flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
