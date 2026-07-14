import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avanguard Workout Tool",
  description: "Gestisci le tue schede di palestra: settimane, giorni, esercizi e carichi con tracking progressivo.",
  keywords: ["palestra", "scheda", "workout", "avanguard", "carichi", "progressione"],
  authors: [{ name: "Avanguard" }],
  icons: {
    icon: "/avanguard-logo.png",
  },
  openGraph: {
    title: "Avanguard Workout Tool",
    description: "Gestione completa delle tue schede di allenamento",
    siteName: "Avanguard Workout Tool",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster richColors position="top-center" />
      </body>
    </html>
  );
}
