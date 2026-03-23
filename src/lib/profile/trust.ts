import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/supabase/config'

const TRUST_BASE_SCORE = 50
const TRUST_MAX_SCORE = 100
const RESPONSE_TIME_THRESHOLD_MS = 24 * 60 * 60 * 1000
const MONTH_MS = 30 * 24 * 60 * 60 * 1000

export interface TrustFactor {
  label: string
  impact: number
  detail: string
  positive: boolean
}

export interface TrustBreakdown {
  score: number
  factors: TrustFactor[]
  stats: {
    totalContracts: number
    completedContracts: number
    disputesAgainst: number
    disputesWon: number
    accountAgeMonths: number
    averageResponseHours: number | null
  }
}

function clampScore(value: number) {
  return Math.max(0, Math.min(TRUST_MAX_SCORE, value))
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

function formatAverageResponse(ms: number | null, samples: number) {
  if (ms === null || samples === 0) {
    return 'No response-time history yet'
  }

  const hours = ms / (60 * 60 * 1000)

  if (hours < 1) {
    return `Average response under 1 hour across ${pluralize(samples, 'action')}`
  }

  if (hours < 24) {
    return `Average response ${hours.toFixed(hours >= 10 ? 0 : 1)}h across ${pluralize(samples, 'action')}`
  }

  const days = hours / 24
  return `Average response ${days.toFixed(days >= 10 ? 0 : 1)}d across ${pluralize(samples, 'action')}`
}

export async function syncTrustScore(userId: string): Promise<TrustBreakdown | null> {
  if (!isSupabaseAdminConfigured()) {
    return null
  }

  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select(
      'id, created_at, kyc_status, trust_score, total_contracts, completed_count, dispute_count'
    )
    .eq('id', userId)
    .maybeSingle()

  if (!profile) {
    return null
  }

  const { data: contractsData } = await supabaseAdmin
    .from('contracts')
    .select(
      'id, initiator_id, counterparty_id, state, created_at, signed_counterparty_at'
    )
    .or(`initiator_id.eq.${userId},counterparty_id.eq.${userId}`)

  const contracts = contractsData ?? []
  const totalContracts = contracts.length
  const completedContracts = contracts.filter(
    (contract) => contract.state === 'complete'
  ).length

  const signingResponseSamples = contracts
    .filter(
      (contract) =>
        contract.counterparty_id === userId && Boolean(contract.signed_counterparty_at)
    )
    .map((contract) => {
      const createdAt = new Date(contract.created_at).getTime()
      const respondedAt = new Date(contract.signed_counterparty_at!).getTime()
      return respondedAt - createdAt
    })
    .filter((value) => Number.isFinite(value) && value >= 0)

  const initiatedContractIds = contracts
    .filter((contract) => contract.initiator_id === userId)
    .map((contract) => contract.id)

  let reviewResponseSamples: number[] = []

  if (initiatedContractIds.length > 0) {
    const { data: milestonesData } = await supabaseAdmin
      .from('milestones')
      .select('submitted_at, approved_at, auto_released')
      .in('contract_id', initiatedContractIds)
      .not('submitted_at', 'is', null)
      .not('approved_at', 'is', null)
      .eq('auto_released', false)

    reviewResponseSamples = (milestonesData ?? [])
      .map((milestone) => {
        const submittedAt = new Date(milestone.submitted_at!).getTime()
        const approvedAt = new Date(milestone.approved_at!).getTime()
        return approvedAt - submittedAt
      })
      .filter((value) => Number.isFinite(value) && value >= 0)
  }

  const responseSamples = [...signingResponseSamples, ...reviewResponseSamples]
  const averageResponseMs =
    responseSamples.length > 0
      ? responseSamples.reduce((sum, value) => sum + value, 0) / responseSamples.length
      : null

  const { data: disputesData } = await supabaseAdmin
    .from('disputes')
    .select('contract_id, respondent_id, ruling, status')
    .or(`raised_by.eq.${userId},respondent_id.eq.${userId}`)

  const disputes = disputesData ?? []
  const disputesAgainst = disputes.filter(
    (dispute) => dispute.respondent_id === userId
  ).length

  const contractMap = new Map(contracts.map((contract) => [contract.id, contract]))
  const disputesWon = disputes.filter((dispute) => {
    if (dispute.status !== 'resolved' || !dispute.ruling) {
      return false
    }

    const contract = contractMap.get(dispute.contract_id)
    if (!contract) {
      return false
    }

    if (dispute.ruling === 'vendor_wins') {
      return contract.counterparty_id === userId
    }

    if (dispute.ruling === 'client_wins') {
      return contract.initiator_id === userId
    }

    return false
  }).length

  const completedPoints = Math.min(completedContracts * 2, 40)
  const disputePoints = disputesAgainst * -10
  const disputesWonPoints = disputesWon * 5
  const kycPoints = profile.kyc_status === 'verified' ? 10 : 0
  const accountAgeMonths = Math.max(
    0,
    Math.floor((Date.now() - new Date(profile.created_at).getTime()) / MONTH_MS)
  )
  const agePoints = Math.min(accountAgeMonths, 10)
  const responsePoints =
    averageResponseMs !== null && averageResponseMs < RESPONSE_TIME_THRESHOLD_MS ? 5 : 0

  const score = clampScore(
    TRUST_BASE_SCORE +
      completedPoints +
      disputePoints +
      disputesWonPoints +
      kycPoints +
      agePoints +
      responsePoints
  )

  const factors: TrustFactor[] = [
    {
      label: 'Completed contracts',
      impact: completedPoints,
      detail: `${completedContracts} completed x 2pts (max +40)`,
      positive: true,
    },
    {
      label: 'Disputes raised against',
      impact: disputePoints,
      detail: `${pluralize(disputesAgainst, 'dispute')} x -10pts`,
      positive: false,
    },
    {
      label: 'Disputes won',
      impact: disputesWonPoints,
      detail:
        disputesWon > 0
          ? `${pluralize(disputesWon, 'ruling')} in your favour x +5pts`
          : 'No dispute wins recorded yet',
      positive: true,
    },
    {
      label: 'Identity verification',
      impact: kycPoints,
      detail:
        profile.kyc_status === 'verified'
          ? 'KYC verified +10pts'
          : 'Verify your identity to unlock +10pts',
      positive: true,
    },
    {
      label: 'Account age',
      impact: agePoints,
      detail: `${pluralize(accountAgeMonths, 'month')} on Contrakts (max +10)`,
      positive: true,
    },
    {
      label: 'Response time',
      impact: responsePoints,
      detail: formatAverageResponse(averageResponseMs, responseSamples.length),
      positive: true,
    },
  ]

  if (
    profile.trust_score !== score ||
    profile.total_contracts !== totalContracts ||
    profile.completed_count !== completedContracts ||
    profile.dispute_count !== disputesAgainst
  ) {
    await supabaseAdmin
      .from('users')
      .update({
        trust_score: score,
        total_contracts: totalContracts,
        completed_count: completedContracts,
        dispute_count: disputesAgainst,
      })
      .eq('id', userId)
  }

  return {
    score,
    factors,
    stats: {
      totalContracts,
      completedContracts,
      disputesAgainst,
      disputesWon,
      accountAgeMonths,
      averageResponseHours:
        averageResponseMs === null
          ? null
          : Number((averageResponseMs / (60 * 60 * 1000)).toFixed(1)),
    },
  }
}
