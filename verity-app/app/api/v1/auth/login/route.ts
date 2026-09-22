import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email || "demo@verity.ai";

    return NextResponse.json({
      access_token: "verity-auth-token-" + Math.random().toString(36).substring(2),
      token_type: "bearer",
      user: {
        id: "user-" + Math.random().toString(36).substring(2, 8),
        email,
        full_name: email.split("@")[0] || "Researcher",
        role: "admin",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Authentication failed" }, { status: 500 });
  }
}
