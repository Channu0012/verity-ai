import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VERITY — Evidence-First AI Research Engine",
  description:
    "Ask a difficult question. Follow the evidence. Understand what the sources actually support.",
  keywords: [
    "AI research",
    "evidence-based",
    "citation verification",
    "research engine",
  ],
  openGraph: {
    title: "VERITY — Evidence-First AI Research Engine",
    description:
      "Transform complex research questions into structured, evidence-backed reports.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body
        className={`${inter.variable} font-sans min-h-full flex flex-col bg-background text-foreground`}
      >
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
