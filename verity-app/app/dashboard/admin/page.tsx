"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Shield, BarChart3, Users, FileText, Sparkles,
  Database, DollarSign, Cpu, Clock, Activity, AlertTriangle,
  RefreshCw, CheckCircle2, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";

interface UsageStats {
  total_users: number;
  total_research: number;
  total_sources: number;
  total_reports: number;
  total_model_runs: number;
  total_tokens: number;
  estimated_cost: number;
}

interface ModelRun {
  id: string;
  provider: string;
  model: string;
  purpose: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  estimated_cost: number;
  created_at: string;
}

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, any>;
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [modelRuns, setModelRuns] = useState<ModelRun[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [token, setToken] = useState("");

  async function loadAdminData(authToken: string) {
    try {
      setLoading(true);
      setForbidden(false);
      const [statsData, runsData, logsData] = await Promise.all([
        api.getAdminStats(authToken),
        api.getAdminModelRuns(authToken),
        api.getAdminAuditLogs(authToken),
      ]);
      setStats(statsData as UsageStats);
      setModelRuns(runsData as ModelRun[]);
      setAuditLogs(logsData as AuditLog[]);
    } catch (err: any) {
      if (err?.message?.includes("403") || err?.message?.includes("Admin access")) {
        setForbidden(true);
      } else {
        console.error("Admin load error:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setToken(session.access_token);
      await loadAdminData(session.access_token);
    }
    init();
  }, [router]);

  if (forbidden) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-4 border-destructive/30">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto text-destructive">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Admin Privileges Required</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your account does not possess administrator role permissions to access system telemetry, model run statistics, or audit logs.
          </p>
          <Link href="/dashboard">
            <Button variant="outline">Return to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-40 bg-background/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">System Administration</span>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              Superadmin
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadAdminData(token)}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Telemetry
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Telemetry & Governance</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time observability of AI model invocations, token budgets, and security audit logs.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/40 border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <Users className="w-3.5 h-3.5 text-primary" />
                Active Users
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-7 w-16" /> : stats?.total_users ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Total Research
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-7 w-16" /> : stats?.total_research ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                LLM Tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono">
                {loading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  (stats?.total_tokens ?? 0).toLocaleString()
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Est. AI Cost
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {loading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  `$${(stats?.estimated_cost ?? 0).toFixed(4)}`
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Model Runs and Audit Logs */}
        <Tabs defaultValue="runs" className="space-y-4">
          <TabsList className="bg-card/60 border border-border/50">
            <TabsTrigger value="runs" className="text-xs gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Model Runs ({modelRuns.length})
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Audit Trail ({auditLogs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="runs" className="space-y-4">
            <Card className="bg-card/40 border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 border-b border-border/40 text-muted-foreground font-mono">
                    <tr>
                      <th className="p-3 font-medium">TIMESTAMP</th>
                      <th className="p-3 font-medium">PROVIDER / MODEL</th>
                      <th className="p-3 font-medium">PURPOSE</th>
                      <th className="p-3 font-medium text-right">PROMPT / COMPL</th>
                      <th className="p-3 font-medium text-right">TOTAL TOKENS</th>
                      <th className="p-3 font-medium text-right">LATENCY</th>
                      <th className="p-3 font-medium text-right">COST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20 font-mono">
                    {modelRuns.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground font-sans">
                          No model runs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      modelRuns.map((run) => (
                        <tr key={run.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3 text-muted-foreground">
                            {new Date(run.created_at).toLocaleTimeString()}
                          </td>
                          <td className="p-3 font-sans">
                            <span className="font-semibold text-foreground">{run.model}</span>
                            <span className="text-muted-foreground text-[10px] ml-1.5">({run.provider})</span>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {run.purpose}
                            </Badge>
                          </td>
                          <td className="p-3 text-right text-muted-foreground">
                            {run.prompt_tokens} / {run.completion_tokens}
                          </td>
                          <td className="p-3 text-right font-bold text-foreground">
                            {run.total_tokens.toLocaleString()}
                          </td>
                          <td className="p-3 text-right text-muted-foreground">
                            {run.latency_ms}ms
                          </td>
                          <td className="p-3 text-right text-emerald-400">
                            ${run.estimated_cost?.toFixed(5) ?? "0.00000"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card className="bg-card/40 border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 border-b border-border/40 text-muted-foreground font-mono">
                    <tr>
                      <th className="p-3 font-medium">TIMESTAMP</th>
                      <th className="p-3 font-medium">ACTION</th>
                      <th className="p-3 font-medium">RESOURCE TYPE</th>
                      <th className="p-3 font-medium">DETAILS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20 font-mono">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground font-sans">
                          No audit log entries recorded.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3 text-muted-foreground whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="p-3 font-bold text-primary">
                            {log.action}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {log.resource_type}
                          </td>
                          <td className="p-3 text-foreground/80 truncate max-w-xs font-sans">
                            {log.details ? JSON.stringify(log.details) : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
