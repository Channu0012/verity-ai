import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (!data?.id) {
      return NextResponse.json({ error: "Missing research session ID" }, { status: 400 });
    }

    serverStore.syncFromClient(data);

    return NextResponse.json({
      status: "synced",
      id: data.id,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Sync failed" }, { status: 500 });
  }
}
