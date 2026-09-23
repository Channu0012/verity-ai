import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const report = serverStore.ensureReport(params.id);

  let body = { format: "markdown" };
  try {
    body = await req.json();
  } catch {
    // default to markdown
  }

  if (body.format === "json") {
    return NextResponse.json(report);
  }

  return new NextResponse(report.full_content || report.executive_summary, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="verity-report-${params.id}.md"`,
    },
  });
}
