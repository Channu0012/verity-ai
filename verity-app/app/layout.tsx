import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommandPalette } from "@/components/ui/command-palette";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://verity-ai-xi.vercel.app";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "VERITY — Evidence-First Autonomous AI Research Engine",
    template: "%s | VERITY Evidence Engine",
  },
  description:
    "The autonomous evidence engine for high-stakes decisions. Extracts verbatim passages from peer-reviewed literature, cross-audits empirical discrepancies, and guarantees zero hallucinated citations.",
  applicationName: "VERITY",
  authors: [{ name: "VERITY Research Lab", url: SITE_URL }],
  creator: "VERITY",
  publisher: "VERITY Inc.",
  keywords: [
    "AI research engine",
    "evidence-based AI",
    "citation verification",
    "autonomous literature review",
    "peer-reviewed search",
    "contradiction detection",
    "deep research",
    "academic research AI",
    "truthful AI",
    "unhallucinated research",
  ],
  category: "Technology & Research",
  classification: "Autonomous Research & Intelligence",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/verity-logo.png", sizes: "32x32", type: "image/png" },
      { url: "/verity-logo.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/verity-logo.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "VERITY — Evidence-First Autonomous AI Research Engine",
    description:
      "Don't trust the answer. Follow the evidence. Extracts verbatim passages from peer-reviewed literature, cross-audits empirical discrepancies, and guarantees every citation.",
    url: SITE_URL,
    siteName: "VERITY",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/verity-logo.png",
        width: 1200,
        height: 630,
        alt: "VERITY — Evidence-First Autonomous AI Research Engine",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VERITY — Evidence-First Autonomous AI Research Engine",
    description:
      "The autonomous evidence engine for high-stakes decisions. Extracts verbatim passages from peer-reviewed literature, cross-audits empirical discrepancies, and guarantees every citation.",
    creator: "@verity_ai",
    site: "@verity_ai",
    images: ["/verity-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "og:updated_time": new Date().toISOString(),
    "article:modified_time": new Date().toISOString(),
    "last-modified": new Date().toUTCString(),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Schema.org Structured Data (JSON-LD)
  const schemaOrgData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        "url": SITE_URL,
        "name": "VERITY",
        "description": "Evidence-First Autonomous AI Research Engine",
        "publisher": {
          "@id": `${SITE_URL}/#organization`,
        },
        "potentialAction": [
          {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${SITE_URL}/dashboard/research/new?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        ],
        "inLanguage": "en-US",
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        "name": "VERITY",
        "url": SITE_URL,
        "logo": {
          "@type": "ImageObject",
          "url": `${SITE_URL}/verity-logo.png`,
          "width": 512,
          "height": 512,
        },
        "sameAs": [
          "https://github.com/Channu0012/verity-ai",
        ],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#application`,
        "name": "VERITY Autonomous Evidence Engine",
        "applicationCategory": "BusinessApplication, ResearchApplication",
        "operatingSystem": "All modern browsers (Web, iOS, Android)",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
        },
        "description": "Autonomous evidence-first AI research engine with multi-source retrieval, claim verification, and citation fidelity guarantees.",
        "softwareVersion": "1.0.0",
        "author": {
          "@id": `${SITE_URL}/#organization`,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How does VERITY guarantee zero hallucinated citations?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "VERITY operates an adversarial multi-agent pipeline: claims are isolated and verified against verbatim scraped text passages from peer-reviewed databases (CrossRef, arXiv, IEEE) before being synthesized into reports.",
            },
          },
          {
            "@type": "Question",
            "name": "What is the difference between standard AI search and VERITY?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Unlike standard generative chatbots that hallucinate plausible answers, VERITY provides verifiable evidence mapping, contradiction detection between competing studies, and a full provenance audit trail.",
            },
          },
          {
            "@type": "Question",
            "name": "Can I export verified research dossiers?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, every completed investigation produces an interactive dossier that can be exported as structured Markdown, machine-readable JSON metadata, or printed directly to PDF.",
            },
          },
        ],
      },
    ],
  };

  return (
    <html lang="en" className="dark h-full antialiased scroll-smooth">
      <head>
        <link rel="canonical" href={SITE_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgData) }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans min-h-full flex flex-col bg-background text-foreground selection:bg-sky-500/20 selection:text-sky-200`}
      >
        <TooltipProvider>
          {children}
          <CommandPalette />
        </TooltipProvider>
      </body>
    </html>
  );
}
