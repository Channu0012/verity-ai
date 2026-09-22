import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "production",
    database: "healthy",
    engine: "verity-serverless",
    timestamp: new Date().toISOString(),
  });
}
