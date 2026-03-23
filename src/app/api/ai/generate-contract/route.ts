import { NextRequest, NextResponse } from 'next/server'
import { safeParseAiContractDraft } from '@/lib/ai/normalize'
import {
  getConfiguredAiProvider,
  getAiNotConfiguredMessage,
  mapAiProviderError,
  streamAiText,
} from '@/lib/ai/provider'
import { CONTRACT_SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { createClient } from '@/lib/supabase/server'
import { sanitizeShortText, sanitizeText } from '@/lib/utils/sanitize'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (!getConfiguredAiProvider()) {
    return NextResponse.json(
      { error: getAiNotConfiguredMessage() },
      { status: 503 }
    )
  }

  let body: { description?: string; industry?: string }
  try {
    body = (await req.json()) as { description?: string; industry?: string }
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }

  const description = sanitizeText(body.description ?? '')
  const industry = body.industry ? sanitizeShortText(body.industry) : ''

  if (!description.trim()) {
    return NextResponse.json(
      { error: 'Description is required' },
      { status: 400 }
    )
  }

  if (description.trim().length < 20) {
    return NextResponse.json(
      {
        error:
          'Please describe your deal in more detail (at least 20 characters).',
      },
      { status: 400 }
    )
  }

  if (description.length > 2000) {
    return NextResponse.json(
      { error: 'Description is too long. Keep it under 2000 characters.' },
      { status: 400 }
    )
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const userPrompt = industry
          ? `Industry context: ${industry}\n\nDeal description: ${description.trim()}`
          : `Deal description: ${description.trim()}`

        const response = await streamAiText({
          systemPrompt: CONTRACT_SYSTEM_PROMPT,
          userPrompt,
          maxOutputTokens: 4096,
          onDelta: (delta) => {
            const event = JSON.stringify({
              type: 'delta',
              content: delta,
            })
            controller.enqueue(encoder.encode(`data: ${event}\n\n`))
          },
        })

        const parsed = safeParseAiContractDraft(response.text)
        if (!parsed.success) {
          const errorEvent = JSON.stringify({
            type: 'error',
            content: 'Failed to parse AI response.',
          })
          controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`))
          controller.close()
          return
        }

        const completeEvent = JSON.stringify({
          type: 'complete',
          data: parsed.draft,
        })
        controller.enqueue(encoder.encode(`data: ${completeEvent}\n\n`))
        controller.close()
      } catch (error) {
        const errorEvent = JSON.stringify({
          type: 'error',
          content: mapAiProviderError(error),
        })
        controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`))
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
