import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const sources = serverStore.sources.get(params.id) || [];
  return NextResponse.json(sources);
}
