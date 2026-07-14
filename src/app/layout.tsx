import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import { ConsentBanner } from "@/components/ads/ConsentBanner";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { brand } from "@/config/brand";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: {
    default: `${brand.name} — ${brand.tagline.toLowerCase()}`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  openGraph: {
    siteName: brand.name,
    type: "website",
  },
  appleWebApp: {
    capable: true,
    title: brand.name,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf4ec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <Header />
        <AnnouncementBanner />
        <main className="flex-1">{children}</main>
        <Footer />
        <ConsentBanner />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
