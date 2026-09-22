import { NextResponse } from "next/server";

export async function GET() {
  const logs = [
    {
      id: "log-1",
      user_id: "user-admin",
      action: "research_session_initiated",
      resource_type: "research_session",
      resource_id: "65b44f9c-8573-417f-b924-834ab3eb7068",
      details: { mode: "standard", citations: 2 },
      created_at: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: "log-2",
      user_id: "user-admin",
      action: "project_created",
      resource_type: "project",
      resource_id: "d448a954-ce4b-4f0e-b392-4073e1b9ebe6",
      details: { name: "Primary Research & Diligence" },
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  return NextResponse.json(logs);
}
