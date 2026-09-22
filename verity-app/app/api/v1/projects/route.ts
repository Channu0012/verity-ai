import { NextRequest, NextResponse } from "next/server";
import { serverStore, ProjectData } from "@/lib/server-store";

export async function GET() {
  const projectsList = Array.from(serverStore.projects.values()).sort(
    (a: ProjectData, b: ProjectData) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return NextResponse.json(projectsList);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ detail: "Project name is required" }, { status: 400 });
    }

    const id = "proj-" + Math.random().toString(36).substring(2, 10);
    const newProject = {
      id,
      name,
      description: body.description?.trim() || null,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      research_count: 0,
    };

    serverStore.projects.set(id, newProject);
    return NextResponse.json(newProject, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to create project" }, { status: 500 });
  }
}
