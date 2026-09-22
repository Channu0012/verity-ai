import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  // Can be requested by report ID or session ID
  let report = serverStore.reports.get(params.id);
  if (!report) {
    // Try finding by report.id
    for (const r of serverStore.reports.values()) {
      if (r.id === params.id || r.session_id === params.id) {
        report = r;
        break;
      }
    }
  }

  if (!report) {
    return NextResponse.json({ detail: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}
