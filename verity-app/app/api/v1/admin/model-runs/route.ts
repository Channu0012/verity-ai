import { NextResponse } from "next/server";

export async function GET() {
  const sampleRuns = [
    {
      id: "run-1",
      provider: "google_genai",
      model: "gemini-2.5-flash",
      purpose: "crossref_passage_ranking",
      prompt_tokens: 1840,
      completion_tokens: 420,
      total_tokens: 2260,
      latency_ms: 680,
      estimated_cost: 0.0012,
      created_at: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: "run-2",
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      purpose: "claim_extraction_and_citation_anchor",
      prompt_tokens: 3410,
      completion_tokens: 950,
      total_tokens: 4360,
      latency_ms: 1120,
      estimated_cost: 0.0028,
      created_at: new Date(Date.now() - 240000).toISOString(),
    },
    {
      id: "run-3",
      provider: "google_genai",
      model: "gemini-2.5-pro",
      purpose: "contradiction_detection_audit",
      prompt_tokens: 4200,
      completion_tokens: 1100,
      total_tokens: 5300,
      latency_ms: 1540,
      estimated_cost: 0.0053,
      created_at: new Date(Date.now() - 480000).toISOString(),
    },
  ];

  return NextResponse.json(sampleRuns);
}
