import { z } from 'zod'
import type { AiContractDraft } from './types'

const milestoneSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  amount: z.number().finite().int().positive(),
  percentage: z.number().finite().positive().max(100),
  deadline_days: z.number().finite().int().positive().max(3650),
})

const riskFlagSchema = z.object({
  severity: z.enum(['low', 'medium', 'high']),
  section: z.enum(['terms', 'milestones', 'general']),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(1000),
  suggestion: z.string().trim().min(1).max(1000),
})

const contractDraftSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(2000),
  industry: z.string().trim().min(1).max(100),
  currency: z.enum(['USD', 'NGN', 'GBP', 'EUR', 'GHS', 'KES']).catch('USD'),
  estimated_value: z.number().finite().int().positive(),
  duration_days: z.number().finite().int().positive().max(3650),
  terms: z.string().trim().min(300).max(10000),
  milestones: z.array(milestoneSchema).min(2).max(6),
  risk_flags: z.array(riskFlagSchema).max(5),
  confidence: z.number().finite().min(0).max(100),
  language_used: z.string().trim().min(1).max(100),
})

function stripCodeFence(text: string): string {
  if (!text.startsWith('```')) {
    return text.trim()
  }

  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

function normalizePercentages(draft: AiContractDraft): AiContractDraft {
  const milestones = draft.milestones.map((milestone) => ({ ...milestone }))
  const total = milestones.reduce(
    (sum, milestone) => sum + milestone.percentage,
    0
  )

  if (milestones.length > 0 && Math.abs(total - 100) > 0.01) {
    const lastMilestone = milestones[milestones.length - 1]
    lastMilestone.percentage = Math.max(
      1,
      Number((lastMilestone.percentage + (100 - total)).toFixed(2))
    )
  }

  return {
    ...draft,
    milestones,
    confidence: Math.min(100, Math.max(0, Math.round(draft.confidence))),
    risk_flags: draft.risk_flags.slice(0, 5),
  }
}

export function parseAiContractDraft(rawText: string): AiContractDraft {
  const jsonText = stripCodeFence(rawText)
  const parsed = JSON.parse(jsonText) as unknown
  return normalizePercentages(contractDraftSchema.parse(parsed))
}

export function safeParseAiContractDraft(rawText: string) {
  try {
    return {
      success: true as const,
      draft: parseAiContractDraft(rawText),
    }
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : 'AI returned an unexpected format.',
    }
  }
}
