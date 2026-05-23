import { NextRequest } from 'next/server'
import { getRequestIp, rateLimit } from '@/lib/rate-limit'
import { errorResponse, jsonResponse } from '@/lib/api-utils'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB
const MAX_EXTRACTED_TEXT_LENGTH = 10_000

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request.headers)
    const rl = rateLimit(`parse:${ip}`, { windowMs: 60_000, max: 10 })
    if (!rl.ok) {
      return errorResponse('Too many requests. Please wait and try again.', 429, 'rate_limited')
    }

    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength && contentLength > MAX_UPLOAD_BYTES) {
      return errorResponse('File too large for this deployment. Please upload a file under 10 MB.', 413, 'payload_too_large')
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return errorResponse('No file provided.', 400, 'missing_file')
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return errorResponse('File too large for this deployment. Please upload a file under 10 MB.', 413, 'payload_too_large')
    }

    const fileName = file.name.toLowerCase()
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let extractedText = ''

    if (fileName.endsWith('.pdf')) {
      // Dynamic import for pdf-parse
      const pdfParseModule = await import('pdf-parse')
      const pdfParse = (pdfParseModule as unknown as { default?: (b: Buffer) => Promise<{ text: string }> }).default
        ?? (pdfParseModule as unknown as (b: Buffer) => Promise<{ text: string }>)
      const data = await pdfParse(buffer)
      extractedText = data.text
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      // Dynamic import for mammoth
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else if (fileName.endsWith('.pptx')) {
      // Dynamic import for pptx-parser
      const pptxParserModule = await import('pptx-parser')
      const parsePptx = pptxParserModule.default ?? (pptxParserModule as unknown as (b: Buffer) => Promise<Array<{ content?: string }>>)
      const slides = await parsePptx(buffer)
      extractedText = slides
        .map((slide: { content?: string }) => slide.content || '')
        .filter(Boolean)
        .join('\n\n')
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      extractedText = buffer.toString('utf-8')
    } else {
      return errorResponse('Unsupported file format. Please upload PDF, DOCX, PPTX, TXT, or MD files.', 400, 'unsupported_file_type')
    }

    // Clean up the text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim()

    if (!extractedText || extractedText.length < 50) {
      return errorResponse('Could not extract enough text from the document. Please try a different file.', 400, 'insufficient_text')
    }

    // Truncate if too long (keep first ~10000 chars for AI processing)
    if (extractedText.length > MAX_EXTRACTED_TEXT_LENGTH) {
      extractedText = extractedText.substring(0, MAX_EXTRACTED_TEXT_LENGTH) + '...'
    }

    return jsonResponse({
      text: extractedText,
      fileName: file.name,
      fileSize: file.size,
      charCount: extractedText.length,
    })
  } catch (error) {
    console.error('Parse document API error:', error)
    return errorResponse('Failed to parse document. Please try again.', 500, 'parse_error')
  }
}
