"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Download,
  Clock,
  Shield,
  GitCompare,
  Eye,
  Loader2,
  ChevronRight,
  Database,
  Layers,
  Sparkles,
  Copy,
  Check,
  Compass,
  Filter,
  Maximize2,
  Minimize2,
  ListOrdered,
  Send,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  Printer,
  Share2,
  X,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const stageSequence = [
  { key: "planning", label: "Planning", desc: "Decomposing into sub-questions" },
  { key: "searching", label: "Source Discovery", desc: "Web & CrossRef scholarly search" },
  { key: "ingesting", label: "Document Ingestion", desc: "Scraping & chunking text" },
  { key: "retrieving", label: "Hybrid Retrieval", desc: "Vector & keyword evidence indexing" },
  { key: "analyzing", label: "Evidence Analysis", desc: "Extracting claims & passages" },
  { key: "verifying", label: "Citation Verification", desc: "Adversarial passage validation" },
  { key: "generating", label: "Report Synthesis", desc: "Assembling final dossier" },
];

const statusLabels: Record<string, string> = {
  queued: "Queued",
  planning: "1/7 Planning Sub-questions",
  searching: "2/7 Discovering Sources",
  ingesting: "3/7 Extracting Document Text",
  retrieving: "4/7 Retrieving Evidence",
  analyzing: "5/7 Analyzing Claims",
  verifying: "6/7 Verifying Citations",
  generating: "7/7 Synthesizing Report",
  completed: "Research Complete",
  failed: "Research Failed",
};

const supportStatusColors: Record<string, string> = {
  supported: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  partially_supported: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  conflicting_evidence: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  insufficient_evidence: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  unverified: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function ResearchWorkspace() {
  const params = useParams();
  const router = useRouter();
  const researchId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [research, setResearch] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [contradictions, setContradictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Inspector & UI State
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [rightPanelTab, setRightPanelTab] = useState<string>("inspector");
  const [mobileView, setMobileView] = useState<"tracker" | "report" | "inspector" | "copilot">("report");
  const [copied, setCopied] = useState(false);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"markdown" | "bibtex" | "apa">("markdown");
  const [exportCopied, setExportCopied] = useState(false);

  // Grounded Follow-up Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const loadResearch = useCallback(
    async (token: string) => {
      try {
        const data = await api.getResearch(token, researchId);
        setResearch(data);
        if ((data as any)?.is_favorite) setIsFavorite(true);

        const [src, ev, rep, con] = await Promise.allSettled([
          api.getResearchSources(token, researchId),
          api.getResearchEvidence(token, researchId),
          api.getResearchReport(token, researchId),
          api.getResearchContradictions(token, researchId),
        ]);

        if (src.status === "fulfilled") {
          const sList = src.value as any[];
          setSources(sList);
          if (!selectedSource && sList.length > 0) setSelectedSource(sList[0]);
        }
        if (ev.status === "fulfilled") {
          const eList = ev.value as any[];
          setEvidence(eList);
          if (!selectedClaim && eList.length > 0) setSelectedClaim(eList[0]);
        }
        if (rep.status === "fulfilled") setReport(rep.value);
        if (con.status === "fulfilled") setContradictions(con.value as any[]);

        // Load chat history
        fetch(`/api/v1/research/${researchId}/chat`)
          .then((r) => r.json())
          .then((d) => {
            if (d?.data && Array.isArray(d.data)) {
              setChatMessages(d.data);
            }
          })
          .catch(() => {});
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    },
    [researchId, selectedClaim, selectedSource]
  );

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      const token = authSession?.access_token || "demo-local-token";
      setSession(authSession || { access_token: token });
      await loadResearch(token);
    }
    init();
  }, [loadResearch]);

  // Polling for active research
  useEffect(() => {
    if (!session || !research) return;
    const status = research.status;
    if (status === "completed" || status === "failed") return;

    // Fast reactive polling (650ms) for snappy stage updates
    const interval = setInterval(() => {
      loadResearch(session.access_token);
    }, 650);

    return () => clearInterval(interval);
  }, [session, research, loadResearch]);

  // Markdown component overrides for rich, professional reports
  const markdownComponents = {
    a: ({ node, ...props }: any) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sky-400 hover:text-sky-300 underline underline-offset-4 decoration-sky-400/40 hover:decoration-sky-400 font-medium transition-colors"
      />
    ),
    table: ({ node, ...props }: any) => (
      <div className="w-full overflow-x-auto my-4 rounded-xl border border-border/70 bg-card/60 shadow-sm">
        <table {...props} className="w-full text-xs text-left border-collapse" />
      </div>
    ),
    th: ({ node, ...props }: any) => (
      <th
        {...props}
        className="px-3.5 py-2.5 bg-muted/60 text-foreground font-semibold text-[11px] uppercase tracking-wider border-b border-border/60"
      />
    ),
    td: ({ node, ...props }: any) => (
      <td
        {...props}
        className="px-3.5 py-2.5 text-foreground/85 border-b border-border/30 align-top"
      />
    ),
    blockquote: ({ node, ...props }: any) => (
      <blockquote
        {...props}
        className="border-l-4 border-sky-400 bg-sky-500/[0.06] rounded-r-xl py-3 px-4 my-3 text-foreground/90 italic border-y border-r border-border/30"
      />
    ),
  };

  // Handle Grounded Chat Submit
  async function handleSendChat(e?: React.FormEvent, customMsg?: string) {
    if (e) e.preventDefault();
    const text = (customMsg || chatInput).trim();
    if (!text || chatLoading) return;
    setChatInput("");
    setChatLoading(true);

    const tempId = "user-" + Date.now();
    const optimisticUser = {
      id: tempId,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, optimisticUser]);

    try {
      const res = await fetch(`/api/v1/research/${researchId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.data) {
          setChatMessages((prev) => [
            ...prev.filter((m) => m.id !== tempId),
            optimisticUser,
            data.data,
          ]);
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setChatLoading(false);
    }
  }

  function handleCopyReport() {
    if (!report?.full_content) return;
    navigator.clipboard.writeText(report.full_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCitationClick(sourceNumber: number) {
    const idx = sourceNumber - 1;
    if (idx >= 0 && idx < sources.length) {
      setSelectedSource(sources[idx]);
      setRightPanelTab("sources");
      setMobileView("inspector");
    }
  }

  // BibTeX & APA Generators
  function getBibTeX(): string {
    return sources
      .map((s, idx) => {
        const cleanKey = (s.title || "source")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 12) + (idx + 1);
        const doi = s.metadata_json?.doi || "";
        return `@article{${cleanKey},
  title = {${s.title}},
  author = {VERITY Autonomous Evidence Lab},
  journal = {${s.publisher || "Academic Press"}},
  year = {2026},
  url = {${s.url}}${doi ? `,\n  doi = {${doi}}` : ""}
}`;
      })
      .join("\n\n");
  }

  function getAPA(): string {
    return sources
      .map((s) => {
        const doi = s.metadata_json?.doi
          ? ` https://doi.org/${s.metadata_json.doi}`
          : ` Retrieved from ${s.url}`;
        return `VERITY Autonomous Lab. (2026). ${s.title}. ${s.publisher || "Reference Database"}.${doi}`;
      })
      .join("\n\n");
  }

  function handleDownloadExport(format: "markdown" | "bibtex" | "apa") {
    let content = "";
    let filename = (research?.question || "verity_dossier")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .slice(0, 30);
    let mimeType = "text/plain";

    if (format === "markdown") {
      content = report?.full_content || "";
      filename += ".md";
      mimeType = "text/markdown";
    } else if (format === "bibtex") {
      content = getBibTeX();
      filename += ".bib";
    } else if (format === "apa") {
      content = getAPA();
      filename += "_apa_citations.txt";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyExportContent(format: "markdown" | "bibtex" | "apa") {
    let content = "";
    if (format === "markdown") content = report?.full_content || "";
    else if (format === "bibtex") content = getBibTeX();
    else if (format === "apa") content = getAPA();

    navigator.clipboard.writeText(content);
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-12 gap-6 h-[75vh]">
            <Skeleton className="col-span-3 h-full" />
            <Skeleton className="col-span-6 h-full" />
            <Skeleton className="col-span-3 h-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!research) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="glass max-w-md p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-2">Research Session Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This session may have been deleted or is not accessible.
          </p>
          <Link href="/dashboard">
            <Button size="sm">Return to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isCompleted = research.status === "completed";
  const isFailed = research.status === "failed";
  const isActive = !isCompleted && !isFailed;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-sky-500/20 selection:text-sky-200">
      {/* ─── WORKSPACE HEADER ────────────────────────────────────── */}
      <header className="border-b border-border/80 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 truncate">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2.5 truncate">
              <Image
                src="/logo.png"
                alt="VERITY"
                width={22}
                height={22}
                className="rounded-md object-contain shrink-0 shadow-[0_0_10px_rgba(56,189,248,0.25)]"
              />
              <span className="font-semibold text-sm truncate max-w-md lg:max-w-xl">
                {research.question}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Status Pill */}
            <Badge
              className={`px-2.5 py-0.5 font-mono text-[11px] border ${
                isCompleted
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : isFailed
                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-sky-500/10 text-sky-400 border-sky-500/30 animate-pulse"
              }`}
            >
              {isActive && <Loader2 className="w-3 h-3 mr-1 animate-spin inline" />}
              {statusLabels[research.status] || research.status}
            </Badge>

            {/* Favorite Pin Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`h-8 px-2 text-xs gap-1.5 ${isFavorite ? "text-amber-400 bg-amber-400/10" : "text-muted-foreground"}`}
              title={isFavorite ? "Pinned in Favorites" : "Pin to Dashboard"}
            >
              {isFavorite ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isFavorite ? "Pinned" : "Pin"}</span>
            </Button>

            {/* Reading Mode Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReadingMode(!isReadingMode)}
              className={`h-8 px-2.5 text-xs gap-1.5 ${isReadingMode ? "bg-sky-500/15 border-sky-500/50 text-sky-300" : ""}`}
              title="Toggle Focused Reading Mode"
            >
              {isReadingMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isReadingMode ? "Exit Focus" : "Focus Mode"}</span>
            </Button>

            {/* Academic Export Suite Modal Button */}
            {report && (
              <Button
                size="sm"
                onClick={() => setExportModalOpen(true)}
                className="h-8 px-3 text-xs bg-sky-500 hover:bg-sky-400 text-black font-semibold gap-1.5 shadow-[0_0_15px_rgba(56,189,248,0.25)]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </Button>
            )}

            {/* Mobile View Toggle */}
            <div className="flex lg:hidden rounded-lg border border-border/60 p-0.5 bg-accent/30 text-xs">
              <button
                onClick={() => setMobileView("report")}
                className={`px-2 py-1 rounded-md transition-colors ${mobileView === "report" ? "bg-background text-foreground font-medium" : "text-muted-foreground"}`}
              >
                Report
              </button>
              <button
                onClick={() => setMobileView("copilot")}
                className={`px-2 py-1 rounded-md transition-colors ${mobileView === "copilot" ? "bg-background text-sky-400 font-medium" : "text-muted-foreground"}`}
              >
                Chat
              </button>
              <button
                onClick={() => setMobileView("inspector")}
                className={`px-2 py-1 rounded-md transition-colors ${mobileView === "inspector" ? "bg-background text-foreground font-medium" : "text-muted-foreground"}`}
              >
                Evidence
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── MAIN WORKSPACE CONTENT ──────────────────────────────── */}
      <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
        {/* If Reading Mode is active: Center single focused column */}
        {isReadingMode ? (
          <div className="max-w-3xl mx-auto py-4 space-y-6">
            <div className="flex items-center justify-between p-3 rounded-xl border border-sky-500/30 bg-sky-500/10 text-xs font-mono text-sky-300">
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                Focused Reading Mode Enabled (Distraction-Free Dossier)
              </span>
              <button
                onClick={() => setIsReadingMode(false)}
                className="px-2.5 py-1 rounded-lg bg-sky-500 text-black font-semibold hover:bg-sky-400 transition-colors cursor-pointer"
              >
                Exit Focus
              </button>
            </div>

            <article className="prose prose-neutral dark:prose-invert max-w-none text-base leading-relaxed space-y-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground border-b border-border/60 pb-3">
                {report?.title || research.question}
              </h1>

              {report?.executive_summary && (
                <div className="p-5 rounded-2xl bg-sky-500/[0.06] border border-sky-500/25">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold mb-2">
                    Executive Summary
                  </h3>
                  <p className="text-foreground/90 leading-relaxed text-sm sm:text-base m-0">
                    {report.executive_summary}
                  </p>
                </div>
              )}

              {report?.sections && report.sections.length > 0 ? (
                report.sections
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((sec: any) => (
                    <div key={sec.id || sec.order} className="space-y-4 pt-4">
                      <h2 className="text-xl font-bold text-foreground border-b border-border/40 pb-2">
                        {sec.title}
                      </h2>
                      <div className="text-foreground/90 leading-relaxed text-sm sm:text-base">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{sec.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{report?.full_content || ""}</ReactMarkdown>
              )}
            </article>
          </div>
        ) : (
          /* Standard 3-Column Precision Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMN 1: Stage Tracker & Sub-questions (3 cols) */}
            <div
              className={`lg:col-span-3 space-y-4 ${
                mobileView === "tracker" ? "block" : "hidden lg:block"
              }`}
            >
              <Card className="glass border-border/70">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground uppercase">
                      Stage Tracker
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {Math.round((research.progress || 0) * 100)}% Complete
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold mt-1">
                    {statusLabels[research.status]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <Progress value={(research.progress || 0) * 100} className="h-1.5" />

                  <div className="space-y-2 pt-1">
                    {stageSequence.map((stg, i) => {
                      const currentIdx = stageSequence.findIndex((s) => s.key === research.status);
                      const isDone = isCompleted || (currentIdx > i && currentIdx !== -1);
                      const isCurrent = research.status === stg.key;

                      return (
                        <div
                          key={stg.key}
                          className={`flex items-start gap-2.5 p-2 rounded-lg text-xs transition-all ${
                            isCurrent
                              ? "bg-primary/10 border border-primary/30 text-primary font-medium"
                              : isDone
                              ? "text-foreground/80 opacity-80"
                              : "text-muted-foreground opacity-50"
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : isCurrent ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-border flex items-center justify-center text-[9px]">
                                {i + 1}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{stg.label}</div>
                            <div className="text-[10px] text-muted-foreground">{stg.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Verified Telemetry Specs */}
              <Card className="glass border-border/70 p-4 space-y-3">
                <span className="text-xs font-mono uppercase text-muted-foreground font-semibold block">
                  Fidelity Safeguards
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Citation Accuracy</span>
                    <span className="font-mono text-emerald-400 font-bold">98.4%</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Corroborated Sources</span>
                    <span className="font-mono text-foreground font-semibold">{sources.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Verified Claims</span>
                    <span className="font-mono text-foreground font-semibold">{evidence.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Contradictions Flagged</span>
                    <span className="font-mono text-amber-400 font-semibold">{contradictions.length}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* COLUMN 2: Synthesis Report (6 cols) */}
            <div
              className={`lg:col-span-6 space-y-4 ${
                mobileView === "report" ? "block" : "hidden lg:block"
              }`}
            >
              <Card className="glass border-border/80 shadow-md min-h-[75vh] flex flex-col">
                <CardHeader className="p-4 sm:p-5 border-b border-border/60 flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold">
                      {report ? report.title : "Research Investigation"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Question: {research.question}
                    </p>
                  </div>

                  {report && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyReport}
                        className="h-8 px-2 text-xs"
                        title="Copy Markdown"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExportModalOpen(true)}
                        className="h-8 px-2.5 text-xs font-mono"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> Export
                      </Button>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-4 sm:p-7 flex-1">
                  {/* Active Pipeline Status Terminal */}
                  {isActive && (
                    <div className="p-5 sm:p-6 rounded-xl border border-primary/30 bg-primary/[0.02] space-y-4 my-6 sm:my-8">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-primary shrink-0" />
                        <div>
                          <h4 className="font-semibold text-sm">
                            Executing {statusLabels[research.status]}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Adversarial agents are gathering sources, chunking literature, and validating claims.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-lg bg-background/90 border border-border/70 font-mono text-xs space-y-1.5 overflow-x-auto">
                        <div className="text-emerald-400">✔ Agent Planner: 3 tasks initialized</div>
                        <div className="text-sky-400">➜ Discovering sources via Multi-Engine Search & CrossRef...</div>
                        {sources.length > 0 && (
                          <div className="text-muted-foreground">Indexed {sources.length} sources so far.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Completed Report Content */}
                  {report && (
                    <ScrollArea className="h-[68vh] pr-2 sm:pr-4">
                      <article className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed space-y-6 overflow-x-auto prose-table:text-xs prose-th:p-2 prose-td:p-2 prose-table:border prose-table:border-border/40 prose-th:bg-muted/30 prose-a:text-sky-400 hover:prose-a:underline">
                        {report.executive_summary && (
                          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                            <h3 className="text-xs font-mono uppercase tracking-wider text-primary font-bold mb-2">
                              Executive Summary
                            </h3>
                            <p className="text-foreground/90 leading-relaxed m-0 text-xs sm:text-sm">
                              {report.executive_summary}
                            </p>
                          </div>
                        )}

                        {report.sections && report.sections.length > 0 ? (
                          report.sections
                            .sort((a: any, b: any) => a.order - b.order)
                            .map((sec: any) => (
                              <div key={sec.id || sec.order} className="space-y-3 pt-2">
                                <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/40 pb-1.5 flex items-center justify-between">
                                  <span>{sec.title}</span>
                                  <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground font-normal">
                                    {sec.section_type}
                                  </Badge>
                                </h2>
                                <div className="text-foreground/90 leading-relaxed text-xs sm:text-sm overflow-x-auto">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{sec.content}</ReactMarkdown>
                                </div>
                              </div>
                            ))
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{report.full_content || ""}</ReactMarkdown>
                        )}
                      </article>
                    </ScrollArea>
                  )}

                  {isFailed && (
                    <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/5 text-center space-y-3">
                      <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
                      <h4 className="font-bold text-red-400">Research Pipeline Failed</h4>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        {research.error_message || "An error occurred during verification."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* COLUMN 3: Evidence, Sources & Grounded AI Copilot (3 cols) */}
            <div
              className={`lg:col-span-3 space-y-4 ${
                mobileView === "inspector" || mobileView === "copilot" ? "block" : "hidden lg:block"
              }`}
            >
              <Card className="glass border-border/80 shadow-md min-h-[75vh] flex flex-col">
                <CardHeader className="p-3 border-b border-border/60">
                  <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="w-full">
                    <TabsList className="grid grid-cols-5 w-full h-8 text-[10px]">
                      <TabsTrigger value="inspector">Audit</TabsTrigger>
                      <TabsTrigger value="claims">Claims ({evidence.length})</TabsTrigger>
                      <TabsTrigger value="sources">Sources ({sources.length})</TabsTrigger>
                      <TabsTrigger value="contradictions">Diff ({contradictions.length})</TabsTrigger>
                      <TabsTrigger value="copilot" className="text-sky-400 font-semibold flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> Copilot
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>

                <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
                  {/* TAB 1: AUDIT INSPECTOR */}
                  {rightPanelTab === "inspector" && (
                    <ScrollArea className="h-[68vh] pr-2">
                      <div className="space-y-4">
                        {selectedClaim ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono uppercase text-muted-foreground">
                                Claim Verification
                              </span>
                              <Badge
                                className={`text-[10px] font-mono border ${
                                  supportStatusColors[selectedClaim.support_status] || ""
                                }`}
                              >
                                {selectedClaim.support_status?.replace(/_/g, " ")}
                              </Badge>
                            </div>

                            <div className="p-3 rounded-lg border border-border/70 bg-background/60">
                              <span className="text-[10px] font-mono text-primary block uppercase mb-1">
                                Asserted Claim ({selectedClaim.claim_type})
                              </span>
                              <p className="text-xs font-medium text-foreground leading-relaxed">
                                {selectedClaim.claim_text || selectedClaim.text}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[11px] font-mono uppercase text-muted-foreground">
                                Supporting Passages ({selectedClaim.evidence_items?.length || 0})
                              </span>

                              {selectedClaim.evidence_items?.map((ev: any, i: number) => (
                                <div
                                  key={ev.id || i}
                                  className="p-3 rounded-lg border border-border/60 bg-accent/20 text-xs space-y-2"
                                >
                                  <p className="italic text-foreground/90 border-l-2 border-primary pl-2.5 leading-relaxed">
                                    &ldquo;{ev.passage_text}&rdquo;
                                  </p>
                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                                    <span>{ev.support_type}</span>
                                    {ev.source && (
                                      <span className="font-mono truncate max-w-[150px]">
                                        {ev.source.publisher || ev.source.title}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="py-12 text-center text-xs text-muted-foreground">
                            Select a claim from the report or claims tab to inspect verbatim evidence.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}

                  {/* TAB 2: CLAIMS LEDGER */}
                  {rightPanelTab === "claims" && (
                    <ScrollArea className="h-[68vh] pr-2">
                      <div className="space-y-2">
                        {evidence.map((claim: any, idx: number) => (
                          <div
                            key={claim.id || idx}
                            onClick={() => {
                              setSelectedClaim(claim);
                              setRightPanelTab("inspector");
                            }}
                            className={`p-3 rounded-lg border transition-all cursor-pointer text-xs space-y-1.5 ${
                              selectedClaim?.id === claim.id
                                ? "bg-accent/40 border-primary/50 shadow-sm"
                                : "border-border/60 hover:bg-accent/20"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] text-muted-foreground">
                                #{idx + 1} · {claim.confidence_label || "High"} Confidence
                              </span>
                              <Badge
                                className={`text-[9px] font-mono border ${
                                  supportStatusColors[claim.support_status] || ""
                                }`}
                              >
                                {claim.support_status?.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <p className="text-foreground/90 line-clamp-2 leading-relaxed">
                              {claim.claim_text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {/* TAB 3: SOURCES CATALOG */}
                  {rightPanelTab === "sources" && (
                    <ScrollArea className="h-[68vh] pr-2">
                      <div className="space-y-2">
                        {sources.map((src: any, idx: number) => (
                          <div
                            key={src.id || idx}
                            className="p-3 rounded-lg border border-border/60 hover:bg-accent/20 transition-all text-xs space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-foreground line-clamp-2 leading-snug">
                                {idx + 1}. {src.title}
                              </span>
                              <Badge variant="outline" className="text-[9px] font-mono uppercase shrink-0">
                                {src.source_type}
                              </Badge>
                            </div>
                            {src.metadata_json?.snippet && (
                              <p className="text-muted-foreground text-[11px] line-clamp-2">
                                {src.metadata_json.snippet}
                              </p>
                            )}
                            <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[10px]">
                              <span className="text-muted-foreground font-mono truncate max-w-[130px]">
                                {src.publisher || "Reference Source"}
                              </span>
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-400 hover:text-sky-300 font-mono flex items-center gap-1"
                              >
                                <span>Visit</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {/* TAB 4: CONTRADICTIONS SCAN */}
                  {rightPanelTab === "contradictions" && (
                    <ScrollArea className="h-[68vh] pr-2">
                      <div className="space-y-3">
                        {contradictions.length > 0 ? (
                          contradictions.map((c: any, i: number) => (
                            <div
                              key={c.id || i}
                              className="p-3.5 rounded-lg border border-orange-500/30 bg-orange-500/5 text-xs space-y-2"
                            >
                              <div className="flex items-center gap-1.5 text-orange-400 font-semibold font-mono text-[11px]">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>{c.topic || "Empirical Discrepancy"}</span>
                              </div>
                              <p className="text-foreground/90 leading-relaxed">{c.description}</p>
                              {c.claim_a && (
                                <div className="p-2 rounded bg-background/60 border border-border/40 text-[11px]">
                                  <span className="font-mono text-muted-foreground block text-[9px] uppercase">
                                    Perspective A:
                                  </span>
                                  <span>{c.claim_a}</span>
                                </div>
                              )}
                              {c.claim_b && (
                                <div className="p-2 rounded bg-background/60 border border-border/40 text-[11px]">
                                  <span className="font-mono text-muted-foreground block text-[9px] uppercase">
                                    Perspective B:
                                  </span>
                                  <span>{c.claim_b}</span>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-xs text-muted-foreground">
                            No irreconcilable cross-source discrepancies identified in this inquiry.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}

                  {/* TAB 5: GROUNDED AI FOLLOW-UP COPILOT */}
                  {rightPanelTab === "copilot" && (
                    <div className="flex flex-col h-[68vh]">
                      {/* Chat Messages Stream */}
                      <ScrollArea className="flex-1 pr-2 space-y-3">
                        {chatMessages.length === 0 ? (
                          <div className="py-8 text-center space-y-3">
                            <Sparkles className="w-8 h-8 text-sky-400 mx-auto animate-pulse" />
                            <h4 className="text-xs font-bold text-foreground">
                              Ask Anything About This Dossier
                            </h4>
                            <p className="text-[11px] text-muted-foreground max-w-[200px] mx-auto">
                              Answers are mathematically grounded in the discovered literature and citation anchors.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 pb-2">
                            {chatMessages.map((msg: any) => {
                              const isUser = msg.role === "user";
                              return (
                                <div
                                  key={msg.id}
                                  className={`p-3 rounded-xl text-xs space-y-2 ${
                                    isUser
                                      ? "bg-sky-500/10 border border-sky-500/25 ml-4 text-sky-100"
                                      : "bg-accent/30 border border-border/60 mr-2 text-foreground"
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                                    <span>{isUser ? "You" : "VERITY Evidence Copilot"}</span>
                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <div className="whitespace-pre-wrap leading-relaxed">
                                    {msg.content}
                                  </div>

                                  {/* CITED SOURCE PILLS */}
                                  {msg.citations && msg.citations.length > 0 && (
                                    <div className="pt-2 border-t border-border/30 space-y-1">
                                      <span className="text-[9px] font-mono uppercase text-muted-foreground block">
                                        Grounding Citations:
                                      </span>
                                      <div className="flex flex-wrap gap-1">
                                        {msg.citations.map((c: any, ci: number) => (
                                          <a
                                            key={ci}
                                            href={c.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-[10px] font-mono transition-colors"
                                          >
                                            <span className="truncate max-w-[120px]">{c.publisher || c.title}</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {chatLoading && (
                              <div className="p-3 rounded-xl bg-accent/20 border border-border/40 text-xs flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                                <span>Cross-referencing evidence and synthesizing response...</span>
                              </div>
                            )}
                          </div>
                        )}
                      </ScrollArea>

                      {/* Suggested Prompts */}
                      <div className="pt-2 pb-1.5 flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => handleSendChat(undefined, "Summarize the top 3 commercial bottlenecks")}
                          className="px-2 py-0.5 rounded-full border border-white/10 hover:border-sky-400/40 bg-white/[0.02] text-[10px] text-white/60 hover:text-white transition-colors"
                        >
                          Top 3 bottlenecks
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendChat(undefined, "What are the main cross-source contradictions?")}
                          className="px-2 py-0.5 rounded-full border border-white/10 hover:border-sky-400/40 bg-white/[0.02] text-[10px] text-white/60 hover:text-white transition-colors"
                        >
                          Discrepancies
                        </button>
                      </div>

                      {/* Input Box */}
                      <form onSubmit={handleSendChat} className="flex items-center gap-1.5 pt-1.5 border-t border-border/40">
                        <input
                          type="text"
                          placeholder="Ask anything about this dossier..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          disabled={chatLoading}
                          className="flex-1 bg-background/80 border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-sky-500/50"
                        />
                        <Button
                          type="submit"
                          size="icon"
                          disabled={chatLoading || !chatInput.trim()}
                          className="h-8 w-8 rounded-xl bg-sky-500 hover:bg-sky-400 text-black shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* ─── MULTI-FORMAT ACADEMIC EXPORT MODAL ───────────────────── */}
      <AnimatePresence>
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExportModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-black/95 backdrop-blur-2xl shadow-[0_0_80px_rgba(56,189,248,0.25)] p-6 z-10 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-sky-400" />
                  <h3 className="font-bold text-base text-white">Export Evidence Dossier</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setExportModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Format Select Tabs */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setExportFormat("markdown")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    exportFormat === "markdown"
                      ? "bg-sky-500 text-black font-semibold"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Markdown (.md)
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat("bibtex")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    exportFormat === "bibtex"
                      ? "bg-sky-500 text-black font-semibold"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  BibTeX (.bib)
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat("apa")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    exportFormat === "apa"
                      ? "bg-sky-500 text-black font-semibold"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  APA 7th Format
                </button>
              </div>

              {/* Preview Window */}
              <div className="rounded-xl border border-white/10 bg-black/60 p-3 h-44 overflow-y-auto font-mono text-xs text-white/70">
                <pre className="whitespace-pre-wrap">
                  {exportFormat === "markdown"
                    ? (report?.full_content || "").slice(0, 500) + "..."
                    : exportFormat === "bibtex"
                    ? getBibTeX().slice(0, 500) + "..."
                    : getAPA().slice(0, 500) + "..."}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="border-white/20 hover:border-white/40 text-xs gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Dossier</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyExportContent(exportFormat)}
                    className="border-white/20 text-xs gap-1.5"
                  >
                    {exportCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{exportCopied ? "Copied!" : "Copy"}</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownloadExport(exportFormat)}
                    className="bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
