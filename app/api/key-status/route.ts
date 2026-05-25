import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    serverKeyAvailable: Boolean(process.env.GEMINI_API_KEY),
  })
}
