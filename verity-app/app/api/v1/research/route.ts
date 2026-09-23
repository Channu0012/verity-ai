import { NextRequest, NextResponse } from "next/server";
import { serverStore, ResearchSessionData } from "@/lib/server-store";

export async function GET(req: NextRequest) {
  serverStore.loadFromDisk();
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id");

  let list = Array.from(serverStore.sessions.values()).sort(
    (a: ResearchSessionData, b: ResearchSessionData) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (projectId) {
    list = list.filter((s: ResearchSessionData) => s.project_id === projectId);
  }

  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = body.question?.trim();
    const projectId = body.project_id || "d448a954-ce4b-4f0e-b392-4073e1b9ebe6";
    const mode = body.mode || "quick";

    if (!question) {
      return NextResponse.json({ detail: "Question is required" }, { status: 400 });
    }

    const session = await serverStore.createAndExecuteResearch(projectId, question, mode);
    const report = serverStore.reports.get(session.id);
    const sources = serverStore.sources.get(session.id) || [];
    const claims = serverStore.claims.get(session.id) || [];
    const contradictions = serverStore.contradictions.get(session.id) || [];
    const chats = serverStore.chats.get(session.id) || [];

    return NextResponse.json(
      {
        id: session.id,
        research_id: session.id,
        status: session.status,
        message: "Research completed successfully",
        session,
        report,
        sources,
        claims,
        contradictions,
        chats,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to create research" }, { status: 500 });
  }
}
