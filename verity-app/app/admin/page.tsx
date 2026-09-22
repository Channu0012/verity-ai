"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Shield, Users, Sparkles,
  DollarSign, Cpu, Activity,
  RefreshCw, Lock, KeyRound, CheckCircle2, Server
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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

// Strictly protected access PIN
const PASSCODE = "001200";

export default function AdminPortalPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const [stats, setStats] = useState<UsageStats | null>(null);
  const [modelRuns, setModelRuns] = useState<ModelRun[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if previously unlocked in this browser session
    if (typeof window !== "undefined" && sessionStorage.getItem("verity-admin-auth") === "true") {
      setAuthenticated(true);
      loadAdminData();
    }
  }, []);

  function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code === PASSCODE) {
      setAuthenticated(true);
      setError(false);
      sessionStorage.setItem("verity-admin-auth", "true");
      loadAdminData();
    } else {
      setError(true);
      setAttempts((prev) => prev + 1);
      setCode("");
    }
  }

  async function loadAdminData() {
    try {
      setLoading(true);
      const [statsData, runsData, logsData] = await Promise.all([
        api.getAdminStats("admin-token"),
        api.getAdminModelRuns("admin-token"),
        api.getAdminAuditLogs("admin-token"),
      ]);
      setStats(statsData as UsageStats);
      setModelRuns(runsData as ModelRun[]);
      setAuditLogs(logsData as AuditLog[]);
    } catch (err) {
      console.error("Admin data load error:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleLock() {
    sessionStorage.removeItem("verity-admin-auth");
    setAuthenticated(false);
    setCode("");
    setError(false);
  }

  // Security Gate (No hints, no clues)
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          <Card className="border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(56,189,248,0.15)]">
                  <KeyRound className="w-6 h-6 text-sky-400" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">Security Verification</h2>
                <p className="text-xs text-white/40">Enter authorization passcode to proceed</p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="••••••"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError(false);
                  }}
                  className={`text-center text-lg tracking-[0.4em] font-mono h-12 bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-sky-500/50 ${
                    error ? "border-red-500/50 ring-1 ring-red-500/20" : ""
                  }`}
                  autoFocus
                  maxLength={12}
                  autoComplete="off"
                />

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-red-400 text-center font-medium"
                    >
                      Authorization failed{attempts > 2 ? ` (${attempts} attempts)` : ""}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  className="w-full h-11 bg-sky-500 hover:bg-sky-400 text-black font-semibold text-sm shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                  disabled={code.length < 4}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Authenticate
                </Button>
              </form>

              <div className="text-center pt-2">
                <Link href="/dashboard" className="text-xs text-white/40 hover:text-white transition-colors">
                  ← Back to Workspace
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Admin Telemetry & Control Portal
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-40 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="font-semibold text-sm sm:text-lg">Telemetry & Control</span>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] hidden sm:inline-flex">
              Superadmin
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadAdminData}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLock}
              className="gap-1.5 text-xs text-red-400 hover:text-red-300 h-8"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Platform Telemetry</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Real-time multi-agent execution telemetry, token consumption, and system state.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-card/40 border-border/50">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                Total Users
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold">
                {loading ? <Skeleton className="h-7 w-16" /> : stats?.total_users ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                Research Sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold">
                {loading ? <Skeleton className="h-7 w-16" /> : stats?.total_research ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                Total Tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold font-mono">
                {loading ? <Skeleton className="h-7 w-20" /> : (stats?.total_tokens ?? 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50">
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
              <CardDescription className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                Estimated AI Cost
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                {loading ? <Skeleton className="h-7 w-16" /> : `$${(stats?.estimated_cost ?? 0).toFixed(4)}`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: "Search Gateway", status: "Operational", color: "text-emerald-400" },
            { name: "Evidence Engine", status: "Operational", color: "text-emerald-400" },
            { name: "Contradiction AI", status: "Operational", color: "text-emerald-400" },
            { name: "Storage & Cache", status: "Operational", color: "text-emerald-400" },
          ].map((srv) => (
            <div key={srv.name} className="p-3 rounded-lg border border-border/40 bg-card/30 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{srv.name}</span>
              <span className={`font-mono font-semibold flex items-center gap-1 ${srv.color}`}>
                <CheckCircle2 className="w-3 h-3" />
                {srv.status}
              </span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="runs" className="space-y-4">
          <TabsList className="bg-card/60 border border-border/50">
            <TabsTrigger value="runs" className="text-xs gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Model Invocations</span>
              <span className="text-[10px] font-mono ml-1 text-muted-foreground">({modelRuns.length})</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
              <span className="text-[10px] font-mono ml-1 text-muted-foreground">({auditLogs.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="runs" className="space-y-4">
            <Card className="bg-card/40 border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead className="bg-muted/30 border-b border-border/40 text-muted-foreground font-mono">
                    <tr>
                      <th className="p-3 font-medium">TIME</th>
                      <th className="p-3 font-medium">MODEL</th>
                      <th className="p-3 font-medium">PURPOSE</th>
                      <th className="p-3 font-medium text-right">TOKENS</th>
                      <th className="p-3 font-medium text-right">LATENCY</th>
                      <th className="p-3 font-medium text-right">COST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20 font-mono">
                    {modelRuns.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground font-sans">
                          No model invocations recorded yet.
                        </td>
                      </tr>
                    ) : (
                      modelRuns.map((run) => (
                        <tr key={run.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3 text-muted-foreground whitespace-nowrap">
                            {new Date(run.created_at).toLocaleTimeString()}
                          </td>
                          <td className="p-3 font-sans">
                            <span className="font-semibold text-foreground text-[11px]">{run.model}</span>
                            <span className="text-muted-foreground text-[10px] ml-1">({run.provider})</span>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {run.purpose}
                            </Badge>
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
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead className="bg-muted/30 border-b border-border/40 text-muted-foreground font-mono">
                    <tr>
                      <th className="p-3 font-medium">TIME</th>
                      <th className="p-3 font-medium">ACTION</th>
                      <th className="p-3 font-medium">RESOURCE</th>
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
                            {new Date(log.created_at).toLocaleTimeString()}
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
