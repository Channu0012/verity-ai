"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Download, FileText, CheckCircle2, Shield, Award,
  Clock, Share2, Printer, ExternalLink, AlertTriangle, BookOpen,
  ChevronRight, Loader2, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";

interface ReportSection {
  id: string;
  section_type: string;
  title: string;
  content: string;
  claims_count?: number;
  order_index: number;
}

interface ReportDetail {
  id: string;
  session_id: string;
  title: string;
  executive_summary?: string;
  methodology?: string;
  limitations?: string;
  quality_score?: number;
  citation_accuracy?: number;
  full_content?: string;
  created_at: string;
  sections?: ReportSection[];
}

export default function ReportViewerPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }
        setToken(session.access_token);
        const data = await api.getReport(session.access_token, reportId);
        setReport(data as ReportDetail);
      } catch (err) {
        console.error("Failed to load report", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reportId, router]);

  async function handleExport(format: "markdown" | "json") {
    if (!token || !report) return;
    try {
      setDownloading(true);
      const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      const apiBase = isLocalhost && process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "") : "";
      const res = await fetch(`${apiBase}/api/v1/reports/${reportId}/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ format }),
      });

      if (!res.ok) throw new Error("Export failed");

      if (format === "markdown") {
        const text = await res.text();
        const blob = new Blob([text], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${report.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.md`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const json = await res.json();
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${report.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setDownloading(false);
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Report Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The requested research report does not exist or you do not have permission to view it.
          </p>
          <Link href="/dashboard/reports">
            <Button variant="outline">Back to Reports</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const sortedSections = [...(report.sections || [])].sort(
    (a, b) => a.order_index - b.order_index
  );

  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white print:text-black">
      {/* Top Header */}
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-40 bg-background/80 print:hidden">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/reports"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image
              src="/logo.png"
              alt="VERITY"
              width={22}
              height={22}
              className="rounded-md object-contain shadow-[0_0_10px_rgba(56,189,248,0.25)]"
            />
            <span className="text-xs text-muted-foreground font-mono">
              REPORT #{report.id.slice(0, 8)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 text-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? "Link Copied!" : "Share"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={downloading}
              onClick={() => handleExport("markdown")}
              className="gap-1.5 text-xs"
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Export Markdown
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Document Content */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Document Header */}
        <header className="space-y-4 pb-6 border-b border-border/50">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline" className="bg-muted/40 font-mono">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(report.created_at).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Badge>

            {report.quality_score !== undefined && (
              <Badge
                variant="outline"
                className={
                  report.quality_score >= 0.8
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                }
              >
                <Award className="w-3 h-3 mr-1" />
                Score: {Math.round(report.quality_score * 100)}%
              </Badge>
            )}

            {report.citation_accuracy !== undefined && (
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/30"
              >
                <Shield className="w-3 h-3 mr-1" />
                Citations: {Math.round(report.citation_accuracy * 100)}% Verified
              </Badge>
            )}

            <Link
              href={`/dashboard/research/${report.session_id}`}
              className="ml-auto text-xs text-primary hover:underline flex items-center gap-1 print:hidden"
            >
              <span>View Research Session</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {report.title}
          </h1>
        </header>

        {/* Executive Summary */}
        {report.executive_summary && (
          <Card className="bg-primary/5 border-primary/20 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Info className="w-4 h-4" />
                <span>Executive Summary</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-base text-foreground/90 leading-relaxed">
                {report.executive_summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Structured Sections */}
        {sortedSections.length > 0 ? (
          <div className="space-y-8">
            {sortedSections.map((section, idx) => (
              <section key={section.id || idx} className="space-y-3 pt-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <span className="text-muted-foreground text-lg font-mono">
                      {String(idx + 1).padStart(2, "0")}.
                    </span>
                    {section.title}
                  </h2>
                  {section.section_type && (
                    <Badge variant="secondary" className="text-xs uppercase tracking-wider font-mono">
                      {section.section_type}
                    </Badge>
                  )}
                </div>

                <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground/85 leading-relaxed whitespace-pre-line text-base">
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        ) : report.full_content ? (
          <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground/90 whitespace-pre-line leading-relaxed text-base">
            {report.full_content}
          </div>
        ) : null}

        {/* Methodology & Limitations */}
        {(report.methodology || report.limitations) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-border/40">
            {report.methodology && (
              <Card className="bg-card/40 border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    Methodology & Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {report.methodology}
                  </p>
                </CardContent>
              </Card>
            )}

            {report.limitations && (
              <Card className="bg-card/40 border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    Limitations & Disclaimers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {report.limitations}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Verification Guarantee Footer */}
        <footer className="pt-8 pb-12 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Generated by VERITY Evidence-First AI Engine — Grounded in Source Verification</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => handleExport("json")}
            >
              Download JSON Metadata
            </Button>
          </div>
        </footer>
      </main>
    </div>
  );
}
