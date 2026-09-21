"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BookOpen, FileText, Search, CheckCircle2,
  AlertTriangle, ExternalLink, Download, Clock, Shield,
  GitCompare, Eye, Loader2, ChevronRight,
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

const statusLabels: Record<string, string> = {
  queued: "Queued",
  planning: "Planning Research...",
  searching: "Discovering Sources...",
  ingesting: "Processing Documents...",
  retrieving: "Retrieving Evidence...",
  analyzing: "Analyzing Evidence...",
  verifying: "Verifying Citations...",
  generating: "Generating Report...",
  completed: "Research Complete",
  failed: "Research Failed",
};

const supportStatusColors: Record<string, string> = {
  supported: "bg-emerald-500/10 text-emerald-400",
  partially_supported: "bg-yellow-500/10 text-yellow-400",
  conflicting_evidence: "bg-orange-500/10 text-orange-400",
  insufficient_evidence: "bg-gray-500/10 text-gray-400",
  unverified: "bg-gray-500/10 text-gray-400",
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
  const [activeTab, setActiveTab] = useState("progress");

  const loadResearch = useCallback(async (token: string) => {
    try {
      const data = await api.getResearch(token, researchId);
      setResearch(data);

      // Auto-switch to report tab when completed
      if ((data as any).status === "completed") {
        setActiveTab("report");

        // Load all data
        const [src, ev, rep, con] = await Promise.allSettled([
          api.getResearchSources(token, researchId),
          api.getResearchEvidence(token, researchId),
          api.getResearchReport(token, researchId),
          api.getResearchContradictions(token, researchId),
        ]);

        if (src.status === "fulfilled") setSources(src.value as any[]);
        if (ev.status === "fulfilled") setEvidence(ev.value as any[]);
        if (rep.status === "fulfilled") setReport(rep.value);
        if (con.status === "fulfilled") setContradictions(con.value as any[]);
      }
    } catch (err) {
      console.error("Load error", err);
    } finally {
      setLoading(false);
    }
  }, [researchId]);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        router.push("/login");
        return;
      }
      setSession(authSession);
      await loadResearch(authSession.access_token);
    }
    init();
  }, [router, loadResearch]);

  // Poll for status updates when research is active
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
      // For markdown/JSON, create downloadable blob
      const blob = new Blob([typeof data === "string" ? data : JSON.stringify(data, null, 2)], {
        type: format === "json" ? "application/json" : "text/markdown",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.title || "report"}.${format === "markdown" ? "md" : format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!research) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Research session not found.</p>
      </div>
    );
  }

  const isActive = !["completed", "failed"].includes(research.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-lg z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-semibold truncate max-w-md">{research.question}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={research.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}>
              <div className={`status-dot mr-2 ${research.status === "completed" ? "completed" : "active"}`} />
              {statusLabels[research.status] || research.status}
            </Badge>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Progress Bar (active research) */}
        {isActive && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{statusLabels[research.status]}</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(research.progress * 100)}%
              </span>
            </div>
            <Progress value={research.progress * 100} className="h-2" />
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="report" disabled={!report}>
              Report
            </TabsTrigger>
            <TabsTrigger value="evidence" disabled={evidence.length === 0}>
              Evidence ({evidence.length})
            </TabsTrigger>
            <TabsTrigger value="sources" disabled={sources.length === 0}>
              Sources ({sources.length})
            </TabsTrigger>
            {contradictions.length > 0 && (
              <TabsTrigger value="contradictions">
                Contradictions ({contradictions.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <Card className="glass">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Research Progress</h2>
                <div className="space-y-4">
                  {(research.tasks || []).map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-4 rounded-lg border border-border/50"
                    >
                      <div className="mt-0.5">
                        {task.status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : task.status === "active" ? (
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        ) : (
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">Task {task.task_number}</div>
                        <div className="text-sm text-muted-foreground">{task.objective}</div>
                      </div>
                    </div>
                  ))}

                  {research.error_message && (
                    <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5">
                      <div className="flex items-center gap-2 text-red-400 mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Error</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{research.error_message}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report">
            {report && (
              <Card className="glass">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{report.title}</CardTitle>
                    {report.quality_score && (
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline">
                          Quality: {Math.round(report.quality_score * 100)}%
                        </Badge>
                        {report.citation_accuracy && (
                          <Badge variant="outline">
                            Citations: {Math.round(report.citation_accuracy * 100)}%
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExport("markdown")}>
                      <Download className="w-4 h-4 mr-1" />
                      MD
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport("json")}>
                      <Download className="w-4 h-4 mr-1" />
                      JSON
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[70vh]">
                    <div className="prose prose-invert max-w-none">
                      {report.full_content ? (
                        <div
                          className="whitespace-pre-wrap text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: report.full_content
                              .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
                              .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-6 mb-3 text-primary">$1</h2>')
                              .replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium mt-4 mb-2">$1</h3>')
                              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n/g, '<br />')
                          }}
                        />
                      ) : (
                        report.sections?.sort((a: any, b: any) => a.order - b.order).map((section: any) => (
                          <div key={section.id} className="mb-8">
                            <h2 className="text-xl font-semibold mb-3 text-primary">{section.title}</h2>
                            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                              {section.content}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Evidence Tab */}
          <TabsContent value="evidence">
            <div className="space-y-4">
              {evidence.map((claim: any) => (
                <Card key={claim.id} className="glass">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <p className="font-medium">{claim.claim_text}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={supportStatusColors[claim.support_status] || ""}>
                            {claim.support_status?.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {claim.claim_type}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {claim.evidence_items?.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Evidence</h4>
                        {claim.evidence_items.map((ev: any) => (
                          <div
                            key={ev.id}
                            className="p-3 rounded-lg bg-background/50 border border-border/30 text-sm"
                          >
                            <p className="text-foreground/90 italic">&ldquo;{ev.passage_text}&rdquo;</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {ev.support_type}
                              </Badge>
                              {ev.location_info && (
                                <span>{ev.location_info}</span>
                              )}
                              {ev.source && (
                                <span className="truncate">
                                  Source: {ev.source.title}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sources.map((source: any) => (
                <Card key={source.id} className="glass">
                  <CardContent className="p-5">
                    <h3 className="font-medium mb-1 line-clamp-2">{source.title}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">{source.source_type}</Badge>
                      <Badge variant="outline" className="text-xs">{source.status}</Badge>
                    </div>
                    {source.publisher && (
                      <p className="text-xs text-muted-foreground mb-2">{source.publisher}</p>
                    )}
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Source
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Contradictions Tab */}
          <TabsContent value="contradictions">
            <div className="space-y-4">
              {contradictions.map((c: any) => (
                <Card key={c.id} className="glass border-orange-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <GitCompare className="w-5 h-5 text-orange-400" />
                      <span className="font-medium">Contradiction</span>
                      <Badge className="bg-orange-500/10 text-orange-400">{c.severity}</Badge>
                    </div>
                    <p className="text-sm mb-4">{c.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                        <div className="text-xs text-muted-foreground mb-1">Claim A</div>
                        <p className="text-sm">{c.claim_a?.claim_text}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                        <div className="text-xs text-muted-foreground mb-1">Claim B</div>
                        <p className="text-sm">{c.claim_b?.claim_text}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
