import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { safeParseAiContractDraft } from '@/lib/ai/normalize'
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

  const key = process.env.ANTHROPIC_API_KEY
  if (!key || key.includes('placeholder')) {
    return NextResponse.json(
      {
        error:
          'AI features require an Anthropic API key. Add ANTHROPIC_API_KEY to your environment.',
      },
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

  const client = new Anthropic({ apiKey: key })
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const userPrompt = industry
          ? `Industry context: ${industry}\n\nDeal description: ${description.trim()}`
          : `Deal description: ${description.trim()}`

        const response = await client.messages.create({
          model: 'claude-opus-4-6',
          max_tokens: 4096,
          system: CONTRACT_SYSTEM_PROMPT,
          stream: true,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        })

        let fullText = ''

        for await (const chunk of response) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            fullText += chunk.delta.text
            const event = JSON.stringify({
              type: 'delta',
              content: chunk.delta.text,
            })
            controller.enqueue(encoder.encode(`data: ${event}\n\n`))
          }
        }

        const parsed = safeParseAiContractDraft(fullText)
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
          content:
            error instanceof Error ? error.message : 'Generation failed.',
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
