import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { SessionProvider } from "@/components/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CyberLab — Платформа лабораторных работ по кибербезопасности",
    template: "%s | CyberLab МТУСИ",
  },
  description: "Образовательная платформа МТУСИ для проведения лабораторных работ по информационной безопасности. Практические задания по OSINT, пентестингу, SQL-инъекциям, сетевым атакам и CTF-соревнованиям.",
  keywords: ["кибербезопасность", "лабораторные", "МТУСИ", "OSINT", "пентестинг", "CTF", "SQL-инъекции", "Metasploit", "Nmap", "информационная безопасность"],
  authors: [{ name: "Кафедра информационной безопасности МТУСИ" }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: "CyberLab — Платформа лабораторных работ по кибербезопасности",
    description: "Образовательная платформа МТУСИ для проведения лабораторных работ по информационной безопасности",
    type: "website",
    locale: "ru_RU",
    siteName: "CyberLab МТУСИ",
  },
  twitter: {
    card: "summary_large_image",
    title: "CyberLab — МТУСИ",
    description: "Образовательная платформа для лабораторных работ по кибербезопасности",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ErrorBoundary>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ErrorBoundary>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              name: "CyberLab — МТУСИ",
              description: "Образовательная платформа для проведения лабораторных работ по информационной безопасности",
              url: "https://cyberlab.mtusi.ru",
              sameAs: [],
            }),
          }}
        />
        <Toaster />
      </body>
    </html>
  );
}
