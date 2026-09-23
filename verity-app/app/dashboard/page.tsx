"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen, Plus, Search, FolderOpen, FileText, Clock,
  ArrowRight, LogOut, Settings, Sparkles, User, Menu, X,
  Bookmark, CheckCircle2, AlertTriangle, Compass, Filter,
  ShieldCheck, BarChart3, PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { auth, type AuthUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { clientCache } from "@/lib/client-cache";
import { VerityBrandLogo } from "@/components/ui/verity-logo";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  research_count: number;
}

interface Research {
  id: string;
  question: string;
  mode: string;
  status: string;
  progress: number;
  created_at: string;
  is_favorite?: boolean;
}

const statusColors: Record<string, string> = {
  queued: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  planning: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  searching: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ingesting: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  retrieving: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  analyzing: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  verifying: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  generating: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [research, setResearch] = useState<Research[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "active">("all");
  const [quickInput, setQuickInput] = useState("");

  useEffect(() => {
    // Enforce auth check on client
    if (!auth.isAuthenticated()) {
      router.push("/login?redirect=/dashboard");
      return;
    }
    const usr = auth.getUser();
    setCurrentUser(usr);
    loadData();
  }, []);

  async function loadData() {
    try {
      const localSessions = clientCache.getUserSessions();

      const [projectsData, researchData] = await Promise.allSettled([
        api.getProjects("user-token"),
        api.listResearch("user-token"),
      ]);

      if (projectsData.status === "fulfilled") {
        setProjects(projectsData.value as Project[]);
      }

      const serverList = (researchData.status === "fulfilled" && Array.isArray(researchData.value))
        ? (researchData.value as Research[])
        : [];

      const sessionMap = new Map<string, Research>();
      for (const s of localSessions) {
        if (s?.id) sessionMap.set(s.id, s);
      }
      for (const s of serverList) {
        if (s?.id) sessionMap.set(s.id, s);
      }

      const mergedList = Array.from(sessionMap.values()).sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      setResearch(mergedList);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const handleQuickLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = quickInput.trim();
    if (!q) return;
    router.push(`/dashboard/research/new?q=${encodeURIComponent(q)}&autoStart=true`);
  };

  const filteredResearch = research.filter((r) => {
    const matchesSearch =
      !searchQuery.trim() || r.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "completed"
        ? r.status === "completed"
        : r.status !== "completed" && r.status !== "failed";
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <Skeleton className="h-12 w-48 sm:w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
            <Skeleton className="h-28 sm:h-32" />
            <Skeleton className="h-28 sm:h-32" />
            <Skeleton className="h-28 sm:h-32" />
            <Skeleton className="h-28 sm:h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const completedCount = research.filter((r) => r.status === "completed").length;
  const activeCount = research.filter((r) => r.status !== "completed" && r.status !== "failed").length;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 sm:pb-8">
      {/* ─── TOP NAVIGATION BAR ────────────────────────────────────── */}
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-xl z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VerityBrandLogo size={28} href="/dashboard" />
            <Separator orientation="vertical" className="h-5 hidden sm:block" />
            <div className="hidden md:flex items-center gap-5 text-xs sm:text-sm">
              <Link href="/dashboard" className="font-semibold text-primary">
                Dashboard
              </Link>
              <Link href="/dashboard/projects" className="text-muted-foreground hover:text-foreground transition-colors">
                Projects
              </Link>
              <Link href="/dashboard/reports" className="text-muted-foreground hover:text-foreground transition-colors">
                Reports
              </Link>
              <Link href="/dashboard/settings" className="text-muted-foreground hover:text-foreground transition-colors">
                Settings
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/research/new">
              <Button size="sm" className="gap-1.5 text-xs bg-sky-500 hover:bg-sky-400 text-black font-semibold h-8 sm:h-9 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Research</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-xs text-muted-foreground hover:text-red-400 h-8 sm:h-9 px-2 sm:px-3 gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 py-3 space-y-2">
            <div className="pb-2 mb-2 border-b border-border/30 flex items-center justify-between text-xs text-muted-foreground">
              <span>Signed in as <strong className="text-foreground">{currentUser?.full_name || currentUser?.email}</strong></span>
            </div>
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-primary">
              Dashboard
            </Link>
            <Link href="/dashboard/projects" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-muted-foreground hover:text-foreground">
              Projects
            </Link>
            <Link href="/dashboard/reports" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-muted-foreground hover:text-foreground">
              Reports
            </Link>
            <Link href="/dashboard/settings" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-muted-foreground hover:text-foreground">
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left py-2 text-sm text-red-400 hover:text-red-300 flex items-center gap-2 pt-2 border-t border-border/30"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* ─── MAIN DASHBOARD BODY ─────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Welcome & Fast Launch Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl border border-sky-500/20 bg-sky-500/[0.03] backdrop-blur-xl"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <span>Welcome back, {currentUser?.full_name || "Researcher"}</span>
              <Badge variant="outline" className="text-[10px] font-mono text-sky-400 border-sky-500/30">
                PRO ACTIVE
              </Badge>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Autonomous factuality, multi-engine discovery, and citation verification workspace.
            </p>
          </div>

          {/* Inline Instant Research Trigger */}
          <form onSubmit={handleQuickLaunch} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ask any empirical hypothesis..."
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-background/80 border border-border/60 text-xs sm:text-sm outline-none focus:border-sky-500/50"
              />
            </div>
            <Button type="submit" size="sm" className="bg-sky-500 hover:bg-sky-400 text-black font-semibold shrink-0 text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Launch
            </Button>
          </form>
        </motion.div>

        {/* Analytics Matrix */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Search, label: "Total Inquiries", value: research.length, color: "text-sky-400" },
            { icon: CheckCircle2, label: "Completed Dossiers", value: completedCount, color: "text-emerald-400" },
            { icon: Clock, label: "Active Pipelines", value: activeCount, color: "text-amber-400" },
            { icon: FolderOpen, label: "Workspaces", value: projects.length, color: "text-purple-400" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/40 border-border/50 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-mono">{stat.value}</div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ─── RESEARCH LEDGER WITH SEARCH & FILTERS ─────────────── */}
        <Card className="bg-card/40 border-border/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Research Dossiers & Pipeline History</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Filter, inspect, and continue investigations</p>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-border/60 p-0.5 bg-accent/20 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === "all" ? "bg-background text-foreground font-semibold shadow-xs" : "text-muted-foreground"}`}
                >
                  All ({research.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("completed")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === "completed" ? "bg-background text-emerald-400 font-semibold shadow-xs" : "text-muted-foreground"}`}
                >
                  Done ({completedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === "active" ? "bg-background text-sky-400 font-semibold shadow-xs" : "text-muted-foreground"}`}
                >
                  Active ({activeCount})
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter inquiries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-2.5 py-1 rounded-lg bg-background/80 border border-border/60 text-xs outline-none focus:border-sky-500/50 w-36 sm:w-44"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {filteredResearch.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-semibold mb-1">No matching investigations found</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Try adjusting your filter or start a new evidence inquiry.
                </p>
                <Link href="/dashboard/research/new">
                  <Button size="sm" className="bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs">
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> Start New Research
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredResearch.map((r) => (
                  <Link
                    key={r.id}
                    href={`/dashboard/research/${r.id}`}
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-border/50 hover:border-sky-500/40 hover:bg-sky-500/[0.02] transition-all group gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-semibold truncate group-hover:text-sky-300 transition-colors">
                        {r.question}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Badge variant="outline" className="text-[10px] font-mono capitalize">
                          {r.mode} mode
                        </Badge>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[10px] sm:text-xs font-mono border ${statusColors[r.status] || "bg-muted text-muted-foreground"}`}>
                        {r.status}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── PROJECT WORKSPACES ─────────────────────────────────── */}
        <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2 sm:pb-4">
            <div>
              <CardTitle className="text-base sm:text-lg">Project Folders & Portfolios</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Organize related dossiers into collaborative workspaces</p>
            </div>
            <Link href="/dashboard/projects">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground text-xs sm:text-sm">No project folders created yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {projects.slice(0, 6).map((p) => (
                  <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
                    <Card className="bg-card/30 hover:border-sky-500/40 hover:bg-sky-500/[0.02] transition-all hover:-translate-y-0.5 cursor-pointer h-full border-border/40">
                      <CardContent className="p-4">
                        <h3 className="text-sm font-semibold mb-1 truncate text-foreground">{p.name}</h3>
                        {p.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {p.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Search className="w-3 h-3 text-sky-400" />
                          <span>{p.research_count} investigations cataloged</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* ─── MOBILE BOTTOM ACTION DOCK ────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 border-t border-border/60 bg-black/90 backdrop-blur-2xl px-6 py-2 flex items-center justify-around z-40 text-xs">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-sky-400 font-medium">
          <Clock className="w-4 h-4" />
          <span className="text-[10px]">Dashboard</span>
        </Link>
        <Link href="/dashboard/research/new" className="flex flex-col items-center gap-1 text-white/70 hover:text-white">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span className="text-[10px]">New</span>
        </Link>
        <Link href="/dashboard/projects" className="flex flex-col items-center gap-1 text-white/70 hover:text-white">
          <FolderOpen className="w-4 h-4" />
          <span className="text-[10px]">Projects</span>
        </Link>
        <Link href="/dashboard/reports" className="flex flex-col items-center gap-1 text-white/70 hover:text-white">
          <FileText className="w-4 h-4" />
          <span className="text-[10px]">Reports</span>
        </Link>
      </div>
    </div>
  );
}
