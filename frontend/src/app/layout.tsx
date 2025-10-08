import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PeerPrep Matching",
  description: "Find your perfect coding partner instantly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white overflow-hidden">{children}</body>
    </html>
  );
}
