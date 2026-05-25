import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
