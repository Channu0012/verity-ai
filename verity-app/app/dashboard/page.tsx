"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen, Plus, Search, FolderOpen, FileText, Clock,
  ArrowRight, LogOut, Settings, Sparkles, User, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { auth, type AuthUser } from "@/lib/auth";
import { api } from "@/lib/api";
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
      const [projectsData, researchData] = await Promise.allSettled([
        api.getProjects("user-token"),
        api.listResearch("user-token"),
      ]);

      if (projectsData.status === "fulfilled") {
        setProjects(projectsData.value as Project[]);
      }
      if (researchData.status === "fulfilled") {
        setResearch(researchData.value as Research[]);
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <Skeleton className="h-12 w-48 sm:w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <Skeleton className="h-28 sm:h-32" />
            <Skeleton className="h-28 sm:h-32" />
            <Skeleton className="h-28 sm:h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-lg z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VerityBrandLogo size={28} href="/dashboard" />
            <Separator orientation="vertical" className="h-5 hidden sm:block" />
            <div className="hidden md:flex items-center gap-4 text-xs sm:text-sm">
              <Link href="/dashboard" className="font-semibold text-foreground">
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
              <Button size="sm" className="gap-1.5 text-xs bg-sky-500 hover:bg-sky-400 text-black font-semibold h-8 sm:h-9">
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
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-primary"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/projects"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Projects
            </Link>
            <Link
              href="/dashboard/reports"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Reports
            </Link>
            <Link
              href="/dashboard/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
            >
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Welcome, {currentUser?.full_name || "Researcher"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Your evidence-first research workspace</p>
          </div>
          <Link href="/dashboard/research/new">
            <Button className="bg-sky-500 hover:bg-sky-400 text-black font-semibold shadow-[0_0_20px_rgba(56,189,248,0.2)]">
              <Plus className="w-4 h-4 mr-2" />
              New Research Session
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { icon: FolderOpen, label: "Projects", value: projects.length, color: "text-blue-400" },
            { icon: Search, label: "Research Sessions", value: research.length, color: "text-purple-400" },
            { icon: FileText, label: "Completed Reports", value: research.filter(r => r.status === "completed").length, color: "text-emerald-400" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/40 border-border/50 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Research */}
        <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Recent Research Sessions</CardTitle>
            <Link href="/dashboard/research/new">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                New <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {research.length === 0 ? (
              <div className="text-center py-10 sm:py-12">
                <Search className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-base sm:text-lg font-medium mb-1">No research yet</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-5">
                  Launch your first evidence-backed deep research investigation.
                </p>
                <Link href="/dashboard/research/new">
                  <Button size="sm" className="bg-sky-500 hover:bg-sky-400 text-black font-semibold">
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                    Start Research
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                {research.slice(0, 6).map((r) => (
                  <Link
                    key={r.id}
                    href={`/dashboard/research/${r.id}`}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-white/[0.02] transition-all group gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {r.question}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 mt-1">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {r.mode}
                        </Badge>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Badge className={`text-[10px] sm:text-xs shrink-0 ${statusColors[r.status] || "bg-muted text-muted-foreground"}`}>
                      {r.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Research Projects</CardTitle>
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
                <p className="text-muted-foreground text-xs sm:text-sm">No projects yet. Create one to organize your research.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {projects.slice(0, 6).map((p) => (
                  <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
                    <Card className="bg-card/30 hover:border-primary/40 transition-all hover:-translate-y-0.5 cursor-pointer h-full border-border/40">
                      <CardContent className="p-4">
                        <h3 className="text-sm font-semibold mb-1 truncate">{p.name}</h3>
                        {p.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {p.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Search className="w-3 h-3 text-sky-400" />
                          <span>{p.research_count} research sessions</span>
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
    </div>
  );
}
