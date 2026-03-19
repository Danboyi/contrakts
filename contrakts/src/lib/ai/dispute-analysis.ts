'use server'

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  DISPUTE_ANALYSIS_PROMPT,
  buildDisputePrompt,
} from './prompts'
import type { AiDisputeAnalysis } from './types'

const disputeAnalysisSchema = z.object({
  recommended_ruling: z.enum([
    'vendor_wins',
    'client_wins',
    'partial',
    'insufficient_evidence',
  ]),
  vendor_pct: z.number().min(0).max(100).optional(),
  confidence: z.number().min(0).max(100),
  reasoning: z.string().min(30).max(10000),
  key_factors: z.array(z.string().min(1).max(500)).max(8).default([]),
  evidence_summary: z.object({
    client_case: z.string().min(1).max(1000),
    vendor_case: z.string().min(1).max(1000),
    gap_analysis: z.string().min(1).max(1500),
  }),
  contract_compliance: z.object({
    scope_met: z.boolean(),
    quality_met: z.boolean().nullable(),
    deadline_met: z.boolean().nullable(),
    assessment: z.string().min(1).max(1500),
  }),
  auto_resolvable: z.boolean().default(false),
  appeal_risk: z.enum(['low', 'medium', 'high']).default('medium'),
})

function getClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || key.includes('placeholder')) {
    return null
  }

  return new Anthropic({ apiKey: key })
}

function stripCodeFence(text: string) {
  if (!text.startsWith('```')) {
    return text.trim()
  }

  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

export type DisputeAnalysisResult = {
  success: boolean
  analysis?: AiDisputeAnalysis
  error?: string
}

type StoredAnalysisRow = AiDisputeAnalysis & {
  id: string
  applied: boolean
  applied_by: string | null
  applied_at: string | null
  overridden: boolean
}

type ApplyAiRulingResult = {
  success: boolean
  error?: string
}

type ServiceRulingInput = {
  disputeId: string
  ruling: 'vendor_wins' | 'client_wins' | 'partial' | 'cancelled'
  rulingNotes: string
  rulingPctVendor?: number
  arbitratorId?: string | null
}

function mapStoredAnalysis(row: Record<string, unknown>): AiDisputeAnalysis {
  return {
    dispute_id: String(row.dispute_id),
    recommended_ruling: row.recommended_ruling as AiDisputeAnalysis['recommended_ruling'],
    vendor_pct: Number(row.vendor_pct ?? 0),
    confidence: Number(row.confidence ?? 0),
    reasoning: String(row.reasoning ?? ''),
    key_factors: Array.isArray(row.key_factors)
      ? row.key_factors.map((item) => String(item))
      : [],
    evidence_summary: (row.evidence_summary ?? {
      client_case: '',
      vendor_case: '',
      gap_analysis: '',
    }) as AiDisputeAnalysis['evidence_summary'],
    contract_compliance: (row.contract_compliance ?? {
      scope_met: false,
      quality_met: null,
      deadline_met: null,
      assessment: '',
    }) as AiDisputeAnalysis['contract_compliance'],
    auto_resolvable: Boolean(row.auto_resolvable),
    appeal_risk: (row.appeal_risk as AiDisputeAnalysis['appeal_risk']) ?? 'medium',
    created_at: String(row.created_at ?? new Date().toISOString()),
  }
}

async function applyAiRuling(
  input: ServiceRulingInput,
  actorId: string
): Promise<ApplyAiRulingResult> {
  const { issueRulingInternal } = await import('@/lib/disputes/actions')
  const result = await issueRulingInternal(
    {
      disputeId: input.disputeId,
      ruling: input.ruling,
      rulingNotes: input.rulingNotes,
      rulingPctVendor: input.rulingPctVendor,
    },
    actorId,
    input.arbitratorId === undefined ? actorId : input.arbitratorId
  )
  if (result.error) {
    return { success: false, error: result.error }
  }

  return { success: true }
}

async function autoResolveDispute(params: {
  disputeId: string
  analysisId: string
  actorId: string
  ruling: 'vendor_wins' | 'client_wins' | 'partial'
  vendorPct: number
  reasoning: string
  confidence: number
}) {
  const supabaseAdmin = createAdminClient()
  const result = await applyAiRuling(
    {
      disputeId: params.disputeId,
      ruling: params.ruling,
      rulingNotes: `AI Auto-Ruling (${params.confidence}% confidence)\n\n${params.reasoning}`,
      rulingPctVendor: params.ruling === 'partial' ? params.vendorPct : undefined,
      arbitratorId: null,
    },
    params.actorId
  )

  if (!result.success) {
    return result
  }

  await supabaseAdmin
    .from('dispute_ai_analyses')
    .update({
      applied: true,
      applied_by: params.actorId,
      applied_at: new Date().toISOString(),
    })
    .eq('id', params.analysisId)

  return { success: true }
}

export async function analyseDispute(
  disputeId: string
): Promise<DisputeAnalysisResult> {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated.' }
  }

  const client = getClient()
  if (!client) {
    return {
      success: false,
      error: 'AI not configured. Add ANTHROPIC_API_KEY.',
    }
  }

  const { data: disputeData } = await supabaseAdmin
    .from('disputes')
    .select(
      `
        *,
        contract:contracts(
          id, title, terms, currency, initiator_id, counterparty_id
        ),
        milestone:milestones!milestone_id(
          title, description, amount
        ),
        evidence:dispute_evidence(
          submitted_by, description, file_name
        )
      `
    )
    .eq('id', disputeId)
    .single()

  const dispute = disputeData as
    | (Record<string, unknown> & {
        contract: {
          id: string
          title: string
          terms: string
          currency: string
          initiator_id: string
          counterparty_id: string | null
        }
        milestone: {
          title: string
          description: string | null
          amount: number
        }
        evidence:
          | Array<{
              submitted_by: string
              description: string | null
              file_name: string | null
            }>
          | null
      })
    | null

  if (!dispute) {
    return { success: false, error: 'Dispute not found.' }
  }

  const isParty =
    dispute.contract.initiator_id === user.id ||
    dispute.contract.counterparty_id === user.id

  const { data: adminCheck } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!isParty && !adminCheck) {
    return { success: false, error: 'Access denied.' }
  }

  const { data: existingAnalysis } = await supabaseAdmin
    .from('dispute_ai_analyses')
    .select('*')
    .eq('dispute_id', disputeId)
    .maybeSingle()

  if (existingAnalysis) {
    return {
      success: true,
      analysis: mapStoredAnalysis(existingAnalysis as Record<string, unknown>),
    }
  }

  const clientEvidence = (dispute.evidence ?? [])
    .filter((entry) => entry.submitted_by === dispute.contract.initiator_id)
    .map((entry) => ({
      text: entry.description ?? '',
      files: entry.file_name ? [entry.file_name] : [],
    }))

  const vendorEvidence = (dispute.evidence ?? [])
    .filter((entry) => entry.submitted_by === dispute.contract.counterparty_id)
    .map((entry) => ({
      text: entry.description ?? '',
      files: entry.file_name ? [entry.file_name] : [],
    }))

  const responseExpired = dispute.response_due_at
    ? new Date(String(dispute.response_due_at)).getTime() < Date.now()
    : false
  const canAnalyse =
    ['under_review', 'clarification'].includes(String(dispute.status ?? '')) ||
    (clientEvidence.length > 0 && vendorEvidence.length > 0) ||
    responseExpired

  if (!canAnalyse) {
    return {
      success: false,
      error:
        'AI analysis is available once both parties submit evidence or the response window expires.',
    }
  }

  const prompt = buildDisputePrompt(
    {
      title: dispute.contract.title,
      terms: dispute.contract.terms ?? '',
      currency: dispute.contract.currency,
    },
    {
      title: dispute.milestone.title,
      description: dispute.milestone.description ?? '',
      amount: Number(dispute.milestone.amount ?? 0) / 100,
    },
    {
      reason: String(dispute.reason ?? ''),
      description: String(dispute.description ?? ''),
    },
    {
      client: clientEvidence,
      vendor: vendorEvidence,
    }
  )

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: DISPUTE_ANALYSIS_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = message.content[0]
    if (!content || content.type !== 'text') {
      return { success: false, error: 'Unexpected AI response.' }
    }

    const parsed = disputeAnalysisSchema.parse(
      JSON.parse(stripCodeFence(content.text))
    )
    const now = new Date().toISOString()

    const { data: storedAnalysis, error: storeError } = await supabaseAdmin
      .from('dispute_ai_analyses')
      .insert({
        dispute_id: disputeId,
        recommended_ruling: parsed.recommended_ruling,
        vendor_pct: parsed.vendor_pct ?? null,
        confidence: Math.round(parsed.confidence),
        reasoning: parsed.reasoning,
        key_factors: parsed.key_factors,
        evidence_summary: parsed.evidence_summary,
        contract_compliance: parsed.contract_compliance,
        auto_resolvable: parsed.auto_resolvable,
        appeal_risk: parsed.appeal_risk,
      })
      .select('*')
      .single()

    if (storeError || !storedAnalysis) {
      return { success: false, error: 'Failed to store analysis.' }
    }

    await supabaseAdmin.from('audit_log').insert({
      contract_id: String(dispute.contract_id),
      actor_id: user.id,
      event_type: 'dispute.ai_analysed',
      payload: {
        dispute_id: disputeId,
        recommended_ruling: parsed.recommended_ruling,
        confidence: parsed.confidence,
        auto_resolvable: parsed.auto_resolvable,
      },
    })

    if (
      parsed.auto_resolvable &&
      parsed.confidence >= 85 &&
      parsed.recommended_ruling !== 'insufficient_evidence' &&
      Number(dispute.milestone.amount ?? 0) <= 50000
    ) {
      await autoResolveDispute({
        disputeId,
        analysisId: String((storedAnalysis as Record<string, unknown>).id),
        actorId: user.id,
        ruling: parsed.recommended_ruling,
        vendorPct: parsed.vendor_pct ?? 0,
        reasoning: parsed.reasoning,
        confidence: Math.round(parsed.confidence),
      })
    }

    const analysis: AiDisputeAnalysis = {
      dispute_id: disputeId,
      recommended_ruling: parsed.recommended_ruling,
      vendor_pct: parsed.vendor_pct ?? 0,
      confidence: Math.round(parsed.confidence),
      reasoning: parsed.reasoning,
      key_factors: parsed.key_factors,
      evidence_summary: parsed.evidence_summary,
      contract_compliance: parsed.contract_compliance,
      auto_resolvable: parsed.auto_resolvable,
      appeal_risk: parsed.appeal_risk,
      created_at: now,
    }

    return { success: true, analysis }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Analysis failed. Please try again.',
    }
  }
}

export async function acceptAiRuling(
  disputeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated.' }
  }

  const { data: adminCheck } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!adminCheck) {
    return { success: false, error: 'Admin access required.' }
  }

  const { data: analysisData } = await supabaseAdmin
    .from('dispute_ai_analyses')
    .select('*')
    .eq('dispute_id', disputeId)
    .maybeSingle()

  const analysis = analysisData as StoredAnalysisRow | null
  if (!analysis) {
    return { success: false, error: 'No AI analysis found.' }
  }

  if (analysis.recommended_ruling === 'insufficient_evidence') {
    return {
      success: false,
      error: 'Low-confidence AI recommendations require manual review.',
    }
  }

  const result = await applyAiRuling(
    {
      disputeId,
      ruling: analysis.recommended_ruling,
      rulingNotes: `Ruling accepted from AI analysis (${analysis.confidence}% confidence).\n\n${analysis.reasoning}`,
      rulingPctVendor:
        analysis.recommended_ruling === 'partial'
          ? analysis.vendor_pct ?? 50
          : undefined,
    },
    user.id
  )

  if (!result.success) {
    return { success: false, error: result.error }
  }

  await supabaseAdmin
    .from('dispute_ai_analyses')
    .update({
      applied: true,
      applied_by: user.id,
      applied_at: new Date().toISOString(),
    })
    .eq('id', analysis.id)

  return { success: true }
}
