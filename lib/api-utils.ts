import { NextResponse } from 'next/server'

export interface ApiErrorResponse {
  error: string
  code?: string
  details?: string
}

export function jsonResponse<T extends Record<string, unknown>>(body: T, status = 200) {
  return NextResponse.json(body, { status })
}

export function errorResponse(message: string, status = 500, code?: string, details?: string) {
  const body: ApiErrorResponse = { error: message }
  if (code) body.code = code
  if (details) body.details = details
  return NextResponse.json(body, { status })
}

export function assistantErrorResponse(message: string, status = 500, code?: string, details?: string) {
  return NextResponse.json(
    {
      role: 'assistant',
      content: message,
      error: message,
      ...(code ? { code } : {}),
      ...(details ? { details } : {}),
    },
    { status }
  )
}

export function safeJsonParse<T = unknown>(value: string): T | null {
  const cleaned = value
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    try {
      const withoutComments = cleaned.replace(/\/\*[^]*?\*\//g, '')
      return JSON.parse(withoutComments) as T
    } catch {
      return null
    }
  }
}
