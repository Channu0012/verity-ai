import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const session = serverStore.sessions.get(params.id);
  if (!session) {
    return NextResponse.json({ detail: "Research session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}
