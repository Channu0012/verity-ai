"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, FileText, Search, Download, Clock, Shield,
  Award, ExternalLink, Filter, Loader2, Sparkles, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { clientCache } from "@/lib/client-cache";

interface ReportItem {
  id: string;
  session_id: string;
  title: string;
  executive_summary?: string;
  quality_score?: number;
  citation_accuracy?: number;
  created_at: string;
  sections?: any[];
  full_content?: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push("/login?redirect=/dashboard/reports");
      return;
    }

    async function fetchReports() {
      try {
        const authToken = "user-token";
        setToken(authToken);

        const localReports = clientCache.getUserReports();
        const data = await api.getReports(authToken).catch(() => []);
        const serverReports = Array.isArray(data) ? (data as ReportItem[]) : [];

        const reportMap = new Map<string, ReportItem>();
        for (const r of localReports) {
          if (r?.id) reportMap.set(r.id, r);
        }
        for (const r of serverReports) {
          if (r?.id) reportMap.set(r.id, r);
        }

        const mergedReports = Array.from(reportMap.values()).sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );

        setReports(mergedReports);
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [router]);

  async function handleExport(reportId: string, format: "markdown" | "json", title: string) {
    if (!token) return;
    try {
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
        a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.md`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const json = await res.json();
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setDownloadingId(null);
    }
  }

  const filteredReports = reports.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.executive_summary && r.executive_summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-40 bg-background/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="VERITY"
                width={24}
                height={24}
                className="rounded-md object-contain shadow-[0_0_10px_rgba(56,189,248,0.25)]"
              />
              <span className="font-semibold text-lg">Research Reports Library</span>
            </div>
          </div>
          <Link href="/dashboard/research/new">
            <Button size="sm" className="gap-2">
              <Sparkles className="w-4 h-4" />
              New Research
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Verified Reports</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Browse, analyze, and export evidence-grounded research reports.
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by title or content..."
              className="pl-9 bg-card/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-card/50 border-border/50">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <Card className="border-dashed border-border/60 bg-card/20 p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold">No reports found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "No reports match your current search query. Try clearing your search."
                  : "You haven't completed any research tasks yet. Initiate a research query to generate your first verified report."}
              </p>
              {!searchQuery && (
                <Link href="/dashboard/research/new">
                  <Button className="mt-2">Start First Research</Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full flex flex-col justify-between hover:border-primary/50 transition-colors bg-card/60 backdrop-blur-sm group border-border/50">
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="text-xs bg-muted/40 font-mono">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(report.created_at).toLocaleDateString(undefined, {
                          month: "short",
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
                              : report.quality_score >= 0.6
                              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                              : "bg-orange-500/10 text-orange-400 border-orange-500/30"
                          }
                        >
                          <Award className="w-3 h-3 mr-1" />
                          {Math.round(report.quality_score * 100)}% Quality
                        </Badge>
                      )}
                    </div>

                    <CardTitle className="text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      <Link href={`/dashboard/reports/${report.id}`}>
                        {report.title}
                      </Link>
                    </CardTitle>

                    {report.executive_summary && (
                      <CardDescription className="line-clamp-3 text-xs text-muted-foreground/90 leading-relaxed">
                        {report.executive_summary}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="pt-2 border-t border-border/30 mt-auto">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        <span>
                          {report.citation_accuracy !== undefined
                            ? `${Math.round(report.citation_accuracy * 100)}% Citations Verified`
                            : "Evidence Grounded"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Export Markdown"
                          disabled={downloadingId === report.id}
                          onClick={() => handleExport(report.id, "markdown", report.title)}
                        >
                          {downloadingId === report.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Link href={`/dashboard/reports/${report.id}`}>
                          <Button variant="secondary" size="sm" className="h-8 px-3 text-xs gap-1.5">
                            <span>Read</span>
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
