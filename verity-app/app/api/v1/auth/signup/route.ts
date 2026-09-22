import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email || "demo@verity.ai";
    const fullName = body.full_name || email.split("@")[0] || "Researcher";

    return NextResponse.json({
      access_token: "verity-auth-token-" + Math.random().toString(36).substring(2),
      token_type: "bearer",
      user: {
        id: "user-" + Math.random().toString(36).substring(2, 8),
        email,
        full_name: fullName,
        role: "user",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Signup failed" }, { status: 500 });
  }
}
