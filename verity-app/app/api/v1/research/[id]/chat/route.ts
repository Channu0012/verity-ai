import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const history = serverStore.getChatHistory(id);
    return NextResponse.json({ data: history });
  } catch (error) {
    console.error("GET research chat error:", error);
    return NextResponse.json({ error: "Failed to retrieve chat history" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const message = body?.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    const reply = await serverStore.askFollowUp(id, message);
    return NextResponse.json({ data: reply });
  } catch (error) {
    console.error("POST research chat error:", error);
    return NextResponse.json({ error: "Failed to process research inquiry" }, { status: 500 });
  }
}
