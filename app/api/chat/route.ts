import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

type ChatRole = 'user' | 'assistant'

interface IncomingMessage {
  role: ChatRole
  content: string
}

interface ChatRequest {
  messages?: IncomingMessage[]
}

interface ProviderChunk {
  choices?: Array<{ delta?: { content?: string } }>
}

const MAX_MESSAGES = 60
const MAX_CONTENT_LENGTH = 40_000

function isValidMessage(value: unknown): value is IncomingMessage {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<IncomingMessage>
  return (
    (candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.content === 'string' &&
    candidate.content.length > 0 &&
    candidate.content.length <= MAX_CONTENT_LENGTH
  )
}

function textStream(message: string, status = 200): Response {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: ChatRequest

  try {
    body = (await request.json()) as ChatRequest
  } catch {
    return textStream('Geçersiz istek gövdesi.', 400)
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return textStream('En az bir mesaj gerekli.', 400)
  }

  const messages = body.messages.slice(-MAX_MESSAGES)
  if (!messages.every(isValidMessage)) {
    return textStream('Mesaj formatı geçersiz veya çok uzun.', 400)
  }

  const apiKey = process.env.AI_API_KEY?.trim()
  if (!apiKey) {
    return textStream(
      'Aklora önizleme modunda çalışıyor. Gerçek yanıtlar için `.env.local` dosyasına `AI_API_KEY` değerini ekleyin.'
    )
  }

  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.AI_MODEL || 'gpt-4.1-mini'
  const systemPrompt =
    process.env.AI_SYSTEM_PROMPT ||
    "You are Aklora, a precise and thoughtful AI work assistant. Answer in the user's language."

  let upstream: Response
  try {
    upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      }),
      signal: request.signal,
    })
  } catch {
    return textStream('Model sunucusuna ulaşılamadı.', 502)
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '')
    const compactDetail = detail.slice(0, 300)
    return textStream(
      `Model sunucusu istegi reddetti (${upstream.status}).${compactDetail ? ` ${compactDetail}` : ''}`,
      502
    )
  }

  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const data = trimmed.slice(5).trim()
            if (!data || data === '[DONE]') continue
            try {
              const chunk = JSON.parse(data) as ProviderChunk
              const content = chunk.choices?.[0]?.delta?.content
              if (content) controller.enqueue(encoder.encode(content))
            } catch {
              continue
            }
          }
        }
      } catch (error) {
        controller.error(error)
        return
      } finally {
        reader.releaseLock()
      }
      controller.close()
    },
    cancel() {
      upstream.body?.cancel().catch(() => undefined)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
