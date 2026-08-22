import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AeroOps AI | Autonomous Flight Readiness",
  description: "Enterprise Flight Operations and In-Flight Fleet Intelligence",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#0A0E17] text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}