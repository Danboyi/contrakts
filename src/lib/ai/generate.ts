'use server'

import Anthropic from '@anthropic-ai/sdk'
import {
  CONTRACT_REFINE_PROMPT,
  CONTRACT_SYSTEM_PROMPT,
} from './prompts'
import { safeParseAiContractDraft } from './normalize'
import type { AiContractDraft } from './types'

function getClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || key.includes('placeholder')) {
    return null
  }

  return new Anthropic({ apiKey: key })
}

export type GenerateResult = {
  success: boolean
  draft?: AiContractDraft
  error?: string
}

function validateDescription(description: string): string | null {
  const trimmed = description.trim()

  if (!trimmed || trimmed.length < 20) {
    return 'Please describe your deal in more detail (at least 20 characters).'
  }

  if (trimmed.length > 2000) {
    return 'Description is too long. Keep it under 2000 characters.'
  }

  return null
}

function mapAnthropicError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : 'AI generation failed.'

  if (message.includes('overloaded')) {
    return 'AI is busy right now. Please try again in a moment.'
  }

  if (message.includes('invalid_api_key')) {
    return 'Invalid Anthropic API key. Check your configuration.'
  }

  return message
}

export async function generateContractDraft(
  description: string,
  industry?: string
): Promise<GenerateResult> {
  const client = getClient()

  if (!client) {
    return {
      success: false,
      error:
        'AI features require an Anthropic API key. Add ANTHROPIC_API_KEY to your environment.',
    }
  }

  const descriptionError = validateDescription(description)
  if (descriptionError) {
    return { success: false, error: descriptionError }
  }

  const userPrompt = industry?.trim()
    ? `Industry context: ${industry.trim()}\n\nDeal description: ${description.trim()}`
    : `Deal description: ${description.trim()}`

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: CONTRACT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const content = message.content[0]
    if (!content || content.type !== 'text') {
      return { success: false, error: 'Unexpected AI response format.' }
    }

    const parsed = safeParseAiContractDraft(content.text)
    if (!parsed.success) {
      return {
        success: false,
        error: 'AI returned an unexpected format. Please try again.',
      }
    }

    return { success: true, draft: parsed.draft }
  } catch (error) {
    return {
      success: false,
      error: mapAnthropicError(error),
    }
  }
}

export async function refineContractDraft(
  originalDescription: string,
  feedback: string,
  industry?: string
): Promise<GenerateResult> {
  const client = getClient()
  if (!client) {
    return {
      success: false,
      error:
        'AI features require an Anthropic API key. Add ANTHROPIC_API_KEY to your environment.',
    }
  }

  const descriptionError = validateDescription(originalDescription)
  if (descriptionError) {
    return { success: false, error: descriptionError }
  }

  if (!feedback.trim()) {
    return { success: false, error: 'Add some feedback before refining.' }
  }

  const userPrompt = [
    industry?.trim() ? `Industry context: ${industry.trim()}` : null,
    CONTRACT_REFINE_PROMPT(originalDescription.trim(), feedback.trim()),
  ]
    .filter(Boolean)
    .join('\n\n')

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: CONTRACT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const content = message.content[0]
    if (!content || content.type !== 'text') {
      return { success: false, error: 'Unexpected AI response format.' }
    }

    const parsed = safeParseAiContractDraft(content.text)
    if (!parsed.success) {
      return {
        success: false,
        error: 'AI returned an unexpected format. Please try again.',
      }
    }

    return { success: true, draft: parsed.draft }
  } catch (error) {
    return {
      success: false,
      error: mapAnthropicError(error),
    }
  }
}
