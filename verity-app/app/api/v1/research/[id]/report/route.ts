import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const report = serverStore.reports.get(params.id);
  if (!report) {
    return NextResponse.json({ detail: "Report not generated yet" }, { status: 404 });
  }
  return NextResponse.json(report);
}
