import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const qHint = req.nextUrl.searchParams.get("q") || req.headers.get("x-research-question") || undefined;
  const session = serverStore.ensureSession(params.id, qHint);
  return NextResponse.json(session);
}
