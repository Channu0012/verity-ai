import { NextRequest, NextResponse } from "next/server";
import { serverStore, ResearchSessionData } from "@/lib/server-store";

export async function GET(req: NextRequest) {
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

    return NextResponse.json(
      {
        id: session.id,
        research_id: session.id,
        status: session.status,
        message: "Research has been queued for processing",
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to create research" }, { status: 500 });
  }
}
