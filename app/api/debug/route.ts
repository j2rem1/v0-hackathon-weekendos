import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.SERPAPI_KEY;
  return NextResponse.json({
    hasKey: !!key,
    keyLength: key?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
  });
}
