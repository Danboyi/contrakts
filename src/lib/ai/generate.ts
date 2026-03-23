'use server'

import {
  CONTRACT_REFINE_PROMPT,
  CONTRACT_SYSTEM_PROMPT,
} from './prompts'
import {
  generateAiText,
  getConfiguredAiProvider,
  getAiNotConfiguredMessage,
  mapAiProviderError,
} from './provider'
import { safeParseAiContractDraft } from './normalize'
import type { AiContractDraft } from './types'

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

export async function generateContractDraft(
  description: string,
  industry?: string
): Promise<GenerateResult> {
  if (!getConfiguredAiProvider()) {
    return {
      success: false,
      error: getAiNotConfiguredMessage(),
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
    const response = await generateAiText({
      systemPrompt: CONTRACT_SYSTEM_PROMPT,
      userPrompt,
      maxOutputTokens: 4096,
    })

    const parsed = safeParseAiContractDraft(response.text)
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
      error: mapAiProviderError(error),
    }
  }
}

export async function refineContractDraft(
  originalDescription: string,
  feedback: string,
  industry?: string
): Promise<GenerateResult> {
  if (!getConfiguredAiProvider()) {
    return {
      success: false,
      error: getAiNotConfiguredMessage(),
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
    const response = await generateAiText({
      systemPrompt: CONTRACT_SYSTEM_PROMPT,
      userPrompt,
      maxOutputTokens: 4096,
    })

    const parsed = safeParseAiContractDraft(response.text)
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
      error: mapAiProviderError(error),
    }
  }
}
