import { getRequestIp, rateLimit } from '@/lib/rate-limit'
import { assistantErrorResponse, jsonResponse } from '@/lib/api-utils'

export const runtime = 'nodejs'
export const maxDuration = 60

type TutorRequestMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request.headers)
    const rl = rateLimit(`tutor:${ip}`, { windowMs: 60_000, max: 30 })
    if (!rl.ok) {
      return assistantErrorResponse(
        'Too many messages right now. Please wait a bit and try again.',
        429,
        'rate_limited'
      )
    }

    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength && contentLength > 200_000) {
      return assistantErrorResponse(
        'That message is too large. Please shorten it and try again.',
        413,
        'payload_too_large'
      )
    }

    const requestBody = await request.json().catch(() => ({}))
    const { messages, mode, apiKey: clientApiKey } = requestBody as { messages?: unknown; mode?: unknown; apiKey?: string }
    const apiKey = process.env.GEMINI_API_KEY || clientApiKey

    if (!Array.isArray(messages) || messages.length === 0) {
      return assistantErrorResponse('Invalid request: missing conversation history.', 400, 'invalid_request')
    }

    if (!apiKey) {
      return assistantErrorResponse(
        "I'm ready to be your AI study tutor, but the Gemini API key isn't configured yet.\n\n" +
        "You can configure it instantly in the Setup Wizard, or explore the full conversational experience via our offline Socratic Demo Mode!",
        401,
        'missing_api_key'
      )
    }

    // Format messages for Google's Gemini chat model format
    // Gemini chat API uses "model" instead of "assistant"
    const contents = (Array.isArray(messages) ? messages : []).map((msg: TutorRequestMessage) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    const tutorMode = mode === 'direct' ? 'direct' : 'socratic'

    const systemPrompt = tutorMode === 'direct'
      ? `You are Nova, an elite AI Study Tutor for an advanced spatial learning app.
Style rules:
- You may use Markdown for formatting when helpful (e.g., **bold**, lists, short code blocks).
- Keep it iMessage-like: short paragraphs, clean formatting, no emojis unless the user uses them.
Your goals:
1. Use direct instruction: give a clear, correct answer first.
2. Then explain step-by-step with short labels, examples, and any key formulas/definitions.
3. End with a quick check for understanding (1-3 questions) or offer 1-3 practice problems.`
      : `You are Nova, an elite Socratic AI Study Tutor for an advanced spatial learning app.
Style rules:
- You may use Markdown for formatting when helpful (e.g., **bold**, lists, short code blocks).
- Keep it iMessage-like: short paragraphs, clean formatting, no emojis unless the user uses them.
Your goals:
1. Use the Socratic method: do not give the final answer immediately. Ask leading, helpful questions that encourage the student to think.
2. Use simple analogies suited for active recall.
3. Reward correct logic and progress. Keep the tone friendly and focused on fundamentals.`

    // Call the free-tier Gemini API endpoint (utilizes active gemini-2.5-flash model)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    })

    if (!response.ok) {
      const remoteError = await response.text().catch(() => '')
      return assistantErrorResponse(
        `Sorry — the AI service is temporarily unavailable (status ${response.status}). Please try again in a moment.`,
        response.status,
        'external_api_error',
        remoteError || undefined
      )
    }

    const data = await response.json().catch(() => ({}))
    const responseTextRaw = data.candidates?.[0]?.content?.parts?.[0]?.text
    const responseText = responseTextRaw ?? "I'm sorry, I couldn't process that. Could you try rephrasing your question?"

    return jsonResponse({
      role: 'assistant',
      content: responseText
    })
  } catch (error) {
    console.error('Tutor API error:', error)
    return assistantErrorResponse(
      "Sorry — I ran into a server error while generating a response. Please try again in a moment.",
      500,
      'server_error'
    )
  }
}
