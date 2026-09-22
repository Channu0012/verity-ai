import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    id: "user-verity-researcher",
    email: "researcher@verity.ai",
    full_name: "Verity Senior Researcher",
    role: "admin",
    created_at: new Date().toISOString(),
  });
}
