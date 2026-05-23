import { getRequestIp, rateLimit } from '@/lib/rate-limit'
import { errorResponse, jsonResponse, safeJsonParse } from '@/lib/api-utils'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request.headers)
    const rl = rateLimit(`cards:${ip}`, { windowMs: 60_000, max: 15 })
    if (!rl.ok) {
      return errorResponse('Too many requests. Please wait and try again.', 429, 'rate_limited')
    }

    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength && contentLength > 400_000) {
      return errorResponse('Request too large.', 413, 'payload_too_large')
    }

    const { text, topic } = await request.json()
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return errorResponse('Gemini API key is not configured.', 401, 'missing_api_key')
    }

    let prompt = ''
    if (text) {
      prompt = `Analyze the following document text and extract the most important concepts, definitions, and key facts. 
Create exactly 5 to 10 high-quality flashcards based on this text.
Return the result strictly as a JSON array of objects, where each object has a "front" (the question or term) and a "back" (the concise answer or definition).
Do not wrap the JSON in markdown blocks like \`\`\`json. Just return the raw JSON array.

Text to analyze:
${text}`
    } else if (topic) {
      prompt = `Create exactly 5 to 10 high-quality flashcards about the following topic: "${topic}".
Return the result strictly as a JSON array of objects, where each object has a "front" (the question or term) and a "back" (the concise answer or definition).
Do not wrap the JSON in markdown blocks like \`\`\`json. Just return the raw JSON array.`
    } else {
      return errorResponse('No text or topic provided.', 400, 'invalid_request')
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!response.ok) {
      const remoteErrorText = await response.text().catch(() => '')
      return errorResponse(
        'Failed to generate flashcards from Gemini API.',
        response.status,
        'external_api_error',
        remoteErrorText || undefined
      )
    }

    const data = await response.json().catch(() => ({}))
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
    
    const flashcardsPayload = safeJsonParse<Array<unknown>>(responseText)
    if (!Array.isArray(flashcardsPayload)) {
      return errorResponse('AI returned invalid JSON format.', 500, 'invalid_json')
    }

    const flashcards: Array<{ front: string; back: string }> = flashcardsPayload.map((item, index) => {
      const card = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}
      return {
        front: typeof card.front === 'string' ? card.front : `Card ${index + 1}`,
        back: typeof card.back === 'string' ? card.back : '',
      }
    }).filter((card) => card.front && card.back)

    if (flashcards.length === 0) {
      return errorResponse('AI returned no valid flashcards.', 500, 'empty_response')
    }

    return jsonResponse({ flashcards })
  } catch (error) {
    console.error('Generate cards API error:', error)
    return errorResponse('Internal Server Error', 500, 'server_error')
  }
}
