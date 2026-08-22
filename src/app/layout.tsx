import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "AeroOps AI — Autonomous Flight Readiness & Risk Intelligence",
  description:
    "Dyson Sky Aviation Edition: From live aviation data to an explainable, evidence-backed GO / AMBER / NO-GO mission decision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-obsidian-950 text-slate-100 min-h-screen antialiased selection:bg-cyan-500 selection:text-obsidian-950`}
      >
        {children}
      </body>
    </html>
  );
}