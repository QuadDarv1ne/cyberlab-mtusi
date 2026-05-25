import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CyberLab — Платформа лабораторных работ по кибербезопасности",
  description: "Образовательная платформа МТУСИ для проведения лабораторных работ по информационной безопасности. OSINT, пентестинг, SQL-инъекции, сетевые атаки.",
  keywords: ["кибербезопасность", "лабораторные", "МТУСИ", "OSINT", "пентестинг", "CTF", "SQL-инъекции", "Metasploit", "Nmap"],
  authors: [{ name: "Кафедра ИБ МТУСИ" }],
  openGraph: {
    title: "CyberLab — МТУСИ",
    description: "Образовательная платформа для лабораторных работ по кибербезопасности",
    type: "website",
    locale: "ru_RU",
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
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
