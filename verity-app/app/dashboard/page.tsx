"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen, Plus, Search, FolderOpen, FileText, Clock, TrendingUp,
  ArrowRight, LogOut, Settings, BarChart3, Sparkles, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase";
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
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [research, setResearch] = useState<Research[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      const token = session.access_token;
      const [projectsData, researchData] = await Promise.allSettled([
        api.getProjects(token),
        api.listResearch(token),
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

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-lg z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VerityBrandLogo size={28} href="/dashboard" />
            <Separator orientation="vertical" className="h-6" />
            <div className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="font-medium text-foreground">
                Dashboard
              </Link>
              <Link href="/dashboard/projects" className="text-muted-foreground hover:text-foreground transition-colors">
                Projects
              </Link>
              <Link href="/dashboard/reports" className="text-muted-foreground hover:text-foreground transition-colors">
                Reports
              </Link>
              <Link href="/dashboard/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                Admin
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}
            </h1>
            <p className="text-muted-foreground">Your evidence-first research workspace</p>
          </div>
          <Link href="/dashboard/research/new">
            <Button className="verity-glow">
              <Plus className="w-4 h-4 mr-2" />
              New Research
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: FolderOpen, label: "Projects", value: projects.length, color: "text-blue-400" },
            { icon: Search, label: "Research Sessions", value: research.length, color: "text-purple-400" },
            { icon: FileText, label: "Completed", value: research.filter(r => r.status === "completed").length, color: "text-emerald-400" },
          ].map((stat) => (
            <Card key={stat.label} className="glass">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Research */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Research</CardTitle>
            {research.length > 0 && (
              <Link href="/dashboard/research">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {research.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">No research yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start your first evidence-based research session.
                </p>
                <Link href="/dashboard/research/new">
                  <Button>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Research
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {research.slice(0, 5).map((r) => (
                  <Link
                    key={r.id}
                    href={`/dashboard/research/${r.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-accent/50 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate group-hover:text-primary transition-colors">
                        {r.question}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {r.mode}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Badge className={statusColors[r.status] || "bg-muted text-muted-foreground"}>
                      {r.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Projects</CardTitle>
            <Link href="/dashboard/projects">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">No projects yet. Create one to organize your research.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.slice(0, 6).map((p) => (
                  <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
                    <Card className="hover:border-primary/30 transition-all hover:-translate-y-0.5 cursor-pointer h-full">
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-1">{p.name}</h3>
                        {p.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {p.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Search className="w-3 h-3" />
                          {p.research_count} research sessions
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
