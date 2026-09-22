"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, FolderOpen, Plus, Search, Trash2, Clock,
  FileText, Sparkles, AlertCircle, Loader2, ExternalLink,
  ChevronRight, CheckCircle2, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";

interface ProjectDetail {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
}

interface ResearchSession {
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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [researchList, setResearchList] = useState<ResearchSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async (authToken: string) => {
    try {
      const [proj, res] = await Promise.all([
        api.getProject(authToken, projectId),
        api.listResearch(authToken, projectId),
      ]);
      setProject(proj as ProjectDetail);
      setResearchList(res as ResearchSession[]);
    } catch (err) {
      console.error("Failed to load project:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || "guest-token";
      setToken(authToken);
      await loadData(authToken);
    }
    init();
  }, [loadData, router]);

  async function handleDeleteProject() {
    if (!confirm("Are you sure you want to delete this project? All associated research will be preserved.")) {
      return;
    }
    try {
      setIsDeleting(true);
      await api.deleteProject(token, projectId);
      router.push("/dashboard/projects");
    } catch (err) {
      console.error("Delete failed:", err);
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <div className="space-y-4 pt-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Project Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The project does not exist or you do not have permission to view it.
          </p>
          <Link href="/dashboard/projects">
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const filteredResearch = researchList.filter((r) =>
    r.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-40 bg-background/80">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/projects"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">{project.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteProject}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs gap-1.5"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete Project
            </Button>
            <Link href={`/dashboard/research/new?project=${projectId}`}>
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" />
                New Research
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Project Overview Card */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">{project.name}</CardTitle>
                {project.description && (
                  <CardDescription className="mt-1 text-sm text-foreground/80">
                    {project.description}
                  </CardDescription>
                )}
              </div>
              <Badge variant="outline" className="text-xs bg-muted/40 font-mono">
                <Clock className="w-3 h-3 mr-1" />
                Created {new Date(project.created_at).toLocaleDateString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex items-center gap-6 text-sm text-muted-foreground pt-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{researchList.length} Research Runs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                {researchList.filter((r) => r.status === "completed").length} Completed
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Research Sessions List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight">Research Sessions</h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search research..."
                className="pl-8 text-xs bg-card/40"
              />
            </div>
          </div>

          {filteredResearch.length === 0 ? (
            <Card className="border-dashed border-border/60 bg-card/20 p-8 text-center space-y-3">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                {search ? "No research sessions match your search." : "No research sessions in this project yet."}
              </p>
              {!search && (
                <Link href={`/dashboard/research/new?project=${projectId}`}>
                  <Button size="sm">Start Research</Button>
                </Link>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredResearch.map((res) => (
                <Link key={res.id} href={`/dashboard/research/${res.id}`}>
                  <Card className="hover:border-primary/40 transition-colors bg-card/40 cursor-pointer p-4 group">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize font-mono ${
                              statusColors[res.status] || "bg-muted text-muted-foreground"
                            }`}
                          >
                            {res.status}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                            {res.mode}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {new Date(res.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {res.question}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground">
                        <span className="text-xs font-mono">
                          {Math.round(res.progress * 100)}%
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
