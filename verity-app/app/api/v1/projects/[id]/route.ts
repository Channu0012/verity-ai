import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const project = serverStore.projects.get(params.id);
  if (!project) {
    return NextResponse.json({ detail: "Project not found" }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  if (serverStore.projects.has(params.id)) {
    serverStore.projects.delete(params.id);
    return NextResponse.json({ message: "Project deleted successfully" });
  }
  return NextResponse.json({ detail: "Project not found" }, { status: 404 });
}
