import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/context/UserContext";
import { StatsProvider } from "@/context/StatsContext";

export const metadata: Metadata = {
  title: "DSA Tracker",
  description: "Your personal DSA practice companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <UserProvider>
          <StatsProvider>{children}</StatsProvider>
        </UserProvider>
        <Toaster />
      </body>
    </html>
  );
}
