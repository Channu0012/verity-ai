"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
  ListOrdered,
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

  // Inspector Selection State
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [rightPanelTab, setRightPanelTab] = useState<string>("inspector");
  const [mobileView, setMobileView] = useState<"tracker" | "report" | "inspector">("report");
  const [copied, setCopied] = useState(false);

  const loadResearch = useCallback(
    async (token: string) => {
      try {
        const data = await api.getResearch(token, researchId);
        setResearch(data);

        // Always load secondary assets if data is available
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
      if (!authSession) {
        router.push("/login");
        return;
      }
      setSession(authSession);
      await loadResearch(authSession.access_token);
    }
    init();
  }, [router, loadResearch]);

  // Polling for active research
  useEffect(() => {
    if (!session || !research) return;
    const status = research.status;
    if (status === "completed" || status === "failed") return;

    const interval = setInterval(() => {
      loadResearch(session.access_token);
    }, 3000);

    return () => clearInterval(interval);
  }, [session, research, loadResearch]);

  async function handleExport(format: string) {
    if (!report || !session) return;
    try {
      const data = await api.exportReport(session.access_token, report.id, format);
      const blob = new Blob([typeof data === "string" ? data : JSON.stringify(data, null, 2)], {
        type: format === "json" ? "application/json" : "text/markdown",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(report.title || "research_report").replace(/[^a-zA-Z0-9_-]/g, "_")}.${format === "markdown" ? "md" : format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  }

  function handleCopyReport() {
    if (!report?.full_content) return;
    navigator.clipboard.writeText(report.full_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Handle clicking citation tags in text
  function handleCitationClick(sourceNumber: number) {
    const idx = sourceNumber - 1;
    if (idx >= 0 && idx < sources.length) {
      setSelectedSource(sources[idx]);
      setRightPanelTab("sources");
      setMobileView("inspector");
    }
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
            This session may have been deleted or is not accessible under your account.
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Precision Workspace Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm truncate max-w-lg">
                {research.question}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Status Indicator */}
            <Badge
              className={`px-3 py-1 font-mono text-xs border ${
                isCompleted
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : isFailed
                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-sky-500/10 text-sky-400 border-sky-500/30 animate-pulse"
              }`}
            >
              {isActive && <Loader2 className="w-3 h-3 mr-1.5 animate-spin inline" />}
              {statusLabels[research.status] || research.status}
            </Badge>

            {/* Mobile View Toggle */}
            <div className="flex lg:hidden rounded-lg border border-border/60 p-0.5 bg-accent/30 text-xs">
              <button
                onClick={() => setMobileView("tracker")}
                className={`px-2.5 py-1 rounded-md transition-colors ${mobileView === "tracker" ? "bg-background text-foreground font-medium" : "text-muted-foreground"}`}
              >
                Tracker
              </button>
              <button
                onClick={() => setMobileView("report")}
                className={`px-2.5 py-1 rounded-md transition-colors ${mobileView === "report" ? "bg-background text-foreground font-medium" : "text-muted-foreground"}`}
              >
                Report
              </button>
              <button
                onClick={() => setMobileView("inspector")}
                className={`px-2.5 py-1 rounded-md transition-colors ${mobileView === "inspector" ? "bg-background text-foreground font-medium" : "text-muted-foreground"}`}
              >
                Evidence ({evidence.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3-Column Precision Workspace Grid */}
      <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =================================================================== */}
        {/* COLUMN 1: Research Stage Tracker & Sub-questions (Width: 3 cols)     */}
        {/* =================================================================== */}
        <div
          className={`lg:col-span-3 space-y-4 ${
            mobileView === "tracker" ? "block" : "hidden lg:block"
          }`}
        >
          {/* Progress Header Card */}
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

              {/* Sequential Pipeline Stages */}
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
                        <div className="leading-snug">{stg.label}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight">
                          {stg.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sub-questions & Tasks Card */}
          <Card className="glass border-border/70">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground uppercase">
                Sub-questions ({research.tasks?.length || 0})
              </span>
              <Badge variant="outline" className="text-[10px] font-mono uppercase">
                {research.mode || "standard"}
              </Badge>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="space-y-2.5">
                {(research.tasks || []).map((t: any) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-lg border border-border/50 bg-background/50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-primary font-semibold">
                        Task {t.task_number}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Priority {t.priority}
                      </span>
                    </div>
                    <p className="text-foreground/90 font-medium leading-relaxed">
                      {t.objective}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =================================================================== */}
        {/* COLUMN 2: Synthesis Report & Live Investigation (Width: 6 cols)      */}
        {/* =================================================================== */}
        <div
          className={`lg:col-span-6 space-y-4 ${
            mobileView === "report" ? "block" : "hidden lg:block"
          }`}
        >
          <Card className="glass border-border/80 shadow-md min-h-[75vh] flex flex-col">
            {/* Report Action Header */}
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
                    onClick={() => handleExport("markdown")}
                    className="h-8 px-2.5 text-xs font-mono"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> MD
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("json")}
                    className="h-8 px-2.5 text-xs font-mono"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> JSON
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-5 sm:p-7 flex-1">
              {/* Active Pipeline Status Terminal */}
              {isActive && (
                <div className="p-6 rounded-xl border border-primary/30 bg-primary/[0.02] space-y-4 my-8">
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

                  <div className="p-3.5 rounded-lg bg-background/90 border border-border/70 font-mono text-xs space-y-1.5">
                    <div className="text-emerald-400">✔ Agent Planner: 3 tasks initialized</div>
                    <div className="text-sky-400">
                      ➜ Discovering sources via DuckDuckGo HTML & CrossRef Academic...
                    </div>
                    {sources.length > 0 && (
                      <div className="text-muted-foreground">
                        Indexed {sources.length} sources so far.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Completed Report Content */}
              {report && (
                <ScrollArea className="h-[68vh] pr-4">
                  <article className="prose prose-invert max-w-none text-sm leading-relaxed space-y-6">
                    {/* Executive Summary */}
                    {report.executive_summary && (
                      <div className="p-4 rounded-xl bg-accent/30 border border-border/60">
                        <h3 className="text-xs font-mono uppercase tracking-wider text-primary font-bold mb-2">
                          Executive Summary
                        </h3>
                        <p className="text-foreground/90 leading-relaxed m-0 text-sm">
                          {report.executive_summary}
                        </p>
                      </div>
                    )}

                    {/* Report Body Sections */}
                    {report.sections && report.sections.length > 0 ? (
                      report.sections
                        .sort((a: any, b: any) => a.order - b.order)
                        .map((sec: any) => (
                          <div key={sec.id || sec.order} className="space-y-2">
                            <h2 className="text-base font-bold text-foreground border-b border-border/40 pb-1.5 flex items-center justify-between">
                              <span>{sec.title}</span>
                              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground font-normal">
                                {sec.section_type}
                              </Badge>
                            </h2>
                            <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm">
                              {sec.content}
                            </div>
                          </div>
                        ))
                    ) : report.full_content ? (
                      <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
                        {report.full_content}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">
                        Report generated without structured sections.
                      </p>
                    )}

                    {/* Limitations & Methodology */}
                    {(report.limitations || report.methodology) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/50 text-xs">
                        {report.methodology && (
                          <div className="p-3 rounded-lg border border-border/50 bg-background/40">
                            <span className="font-mono uppercase text-muted-foreground font-semibold block mb-1">
                              Methodology
                            </span>
                            <p className="text-foreground/80 m-0">{report.methodology}</p>
                          </div>
                        )}
                        {report.limitations && (
                          <div className="p-3 rounded-lg border border-border/50 bg-background/40">
                            <span className="font-mono uppercase text-muted-foreground font-semibold block mb-1">
                              Known Limitations
                            </span>
                            <p className="text-foreground/80 m-0">{report.limitations}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                </ScrollArea>
              )}

              {/* Error Message if Failed */}
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

        {/* =================================================================== */}
        {/* COLUMN 3: Interactive Evidence & Source Inspector (Width: 3 cols)    */}
        {/* =================================================================== */}
        <div
          className={`lg:col-span-3 space-y-4 ${
            mobileView === "inspector" ? "block" : "hidden lg:block"
          }`}
        >
          <Card className="glass border-border/80 shadow-md min-h-[75vh] flex flex-col">
            <CardHeader className="p-3 sm:p-4 border-b border-border/60">
              <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="w-full">
                <TabsList className="grid grid-cols-4 w-full h-8 text-[11px]">
                  <TabsTrigger value="inspector">Audit</TabsTrigger>
                  <TabsTrigger value="claims">Claims ({evidence.length})</TabsTrigger>
                  <TabsTrigger value="sources">Sources ({sources.length})</TabsTrigger>
                  <TabsTrigger value="contradictions">Diff ({contradictions.length})</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent className="p-4 flex-1">
              <ScrollArea className="h-[68vh] pr-2">
                {/* 1. INSPECTOR TAB: Deep Inspection of Selected Claim or Source */}
                {rightPanelTab === "inspector" && (
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

                        {/* Claim Text */}
                        <div className="p-3 rounded-lg border border-border/70 bg-background/60">
                          <span className="text-[10px] font-mono text-primary block uppercase mb-1">
                            Asserted Claim ({selectedClaim.claim_type})
                          </span>
                          <p className="text-xs font-medium text-foreground leading-relaxed">
                            {selectedClaim.claim_text || selectedClaim.text}
                          </p>
                        </div>

                        {/* Mapped Verbatim Evidence Passages */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-mono uppercase text-muted-foreground">
                            Supporting Passages ({selectedClaim.evidence_items?.length || 0})
                          </span>

                          {selectedClaim.evidence_items && selectedClaim.evidence_items.length > 0 ? (
                            selectedClaim.evidence_items.map((ev: any, i: number) => (
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
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              Passage extracted from index during claim extraction.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground text-xs space-y-2">
                        <Database className="w-8 h-8 mx-auto opacity-30" />
                        <p>Select any claim or citation to inspect verbatim source passages.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. CLAIMS TAB: All Extracted Claims */}
                {rightPanelTab === "claims" && (
                  <div className="space-y-3">
                    {evidence.map((clm) => (
                      <div
                        key={clm.id}
                        onClick={() => {
                          setSelectedClaim(clm);
                          setRightPanelTab("inspector");
                        }}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          selectedClaim?.id === clm.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:border-border hover:bg-accent/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <Badge
                            className={`text-[9px] font-mono border ${
                              supportStatusColors[clm.support_status] || ""
                            }`}
                          >
                            {clm.support_status?.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {clm.claim_type}
                          </span>
                        </div>
                        <p className="font-medium text-foreground line-clamp-3">
                          {clm.claim_text || clm.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. SOURCES TAB: Discovered Web & Academic Sources */}
                {rightPanelTab === "sources" && (
                  <div className="space-y-3">
                    {sources.map((src, i) => (
                      <div
                        key={src.id}
                        className="p-3 rounded-lg border border-border/50 bg-background/50 text-xs space-y-2 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="text-[9px] font-mono">
                            Source [{i + 1}] · {src.source_type}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                            {src.publisher || "Web"}
                          </span>
                        </div>

                        <h4 className="font-semibold text-foreground leading-snug line-clamp-2">
                          {src.title}
                        </h4>

                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-mono"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {src.url.replace(/^https?:\/\//, "").slice(0, 32)}...
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. CONTRADICTIONS TAB */}
                {rightPanelTab === "contradictions" && (
                  <div className="space-y-3">
                    {contradictions.length > 0 ? (
                      contradictions.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-lg border border-orange-500/30 bg-orange-500/5 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-orange-400 font-bold uppercase">
                              Contradiction ({c.severity})
                            </span>
                          </div>
                          <p className="text-foreground leading-snug font-medium">
                            {c.description}
                          </p>
                          <div className="p-2 rounded bg-background/80 border border-border/40 text-[11px] space-y-1">
                            <span className="text-muted-foreground font-mono block">Opposing Claims:</span>
                            <div className="text-foreground/90">• {c.claim_a?.claim_text}</div>
                            <div className="text-foreground/90">• {c.claim_b?.claim_text}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-xs text-muted-foreground space-y-1">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto opacity-70" />
                        <p>No major contradictions detected across primary literature.</p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
