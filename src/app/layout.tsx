import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Grid } from "@/components/ui/grid";
import Script from "next/script";

export const metadata: Metadata = {
  alternates: { canonical: "https://telegram.uncoverit.org" },
  title: "Telegram Bot Multi-Tool",
  description:
    "Lightweight Telegram multitool for instant message sending and fast admin utilities.",
  keywords: [
    "telegram",
    "bot",
    "multitool",
    "send",
    "spam",
    "info",
    "telegram bot spam",
    "telegram bots",
    "telegram bot spammer",
    "telegram multitool",
    "uncover it telegram",
    "uncover it telegram spammer",
    "uncover it spammer",
    "telegram bot uncover it",
    "telegram uncoverit",
    "uncoverit telegram",
    "uncoverit",
    "uncover it",
    "online",
    "customize",
  ],
  openGraph: {
    title: "Telegram Bot Multi-Tool",
    description:
      "Lightweight Telegram multitool for instant message sending and fast admin utilities.",
    url: "https://telegram.uncoverit.org",
    siteName: "Telegram Bot Multi-Tool",
    images: [
      {
        url: "https://telegram.uncoverit.org/og.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
  twitter: {
    title: "Telegram Bot Multi-Tool",
    card: "summary_large_image",
    description:
      "Lightweight Telegram multitool for instant message sending and fast admin utilities.",
    images: ["https://telegram.uncoverit.org/og.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <div
            style={{ position: "fixed", inset: 0, zIndex: -1 }}
            aria-hidden="true"
          >
            <Grid />
          </div>
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-MDFG4Q12JK" />
      <Script src="https://api.instatus.com/widget?host=status.uncoverit.org&code=4f0eef87&locale=en" />
    </html>
  );
}
