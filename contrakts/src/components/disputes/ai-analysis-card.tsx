'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { analyseDispute } from '@/lib/ai/dispute-analysis'
import type { AiDisputeAnalysis } from '@/lib/ai/types'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Minus,
  Shield,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react'

interface AiAnalysisCardProps {
  disputeId: string
  milestoneAmount: number
  currency: string
  initialAnalysis?: AiDisputeAnalysis | null
  canRequest: boolean
}

const RULING_CONFIG = {
  vendor_wins: {
    label: 'Vendor wins',
    color: 'text-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.1)]',
    border: 'border-[hsl(var(--color-success)/0.2)]',
    icon: CheckCircle,
  },
  client_wins: {
    label: 'Client wins',
    color: 'text-[hsl(var(--color-danger))]',
    bg: 'bg-[hsl(var(--color-danger)/0.1)]',
    border: 'border-[hsl(var(--color-danger)/0.2)]',
    icon: XCircle,
  },
  partial: {
    label: 'Partial ruling',
    color: 'text-[hsl(var(--color-accent))]',
    bg: 'bg-[hsl(var(--color-accent)/0.1)]',
    border: 'border-[hsl(var(--color-accent)/0.2)]',
    icon: Minus,
  },
  insufficient_evidence: {
    label: 'Insufficient evidence',
    color: 'text-[hsl(var(--color-warning))]',
    bg: 'bg-[hsl(var(--color-warning)/0.1)]',
    border: 'border-[hsl(var(--color-warning)/0.2)]',
    icon: AlertTriangle,
  },
} satisfies Record<
  AiDisputeAnalysis['recommended_ruling'],
  {
    label: string
    color: string
    bg: string
    border: string
    icon: typeof CheckCircle
  }
>

function ConfidenceBar({ value }: { value: number }) {
  const tone =
    value >= 80
      ? 'bg-[hsl(var(--color-success))]'
      : value >= 60
        ? 'bg-[hsl(var(--color-warning))]'
        : 'bg-[hsl(var(--color-danger))]'

  const textTone =
    value >= 80
      ? 'text-[hsl(var(--color-success))]'
      : value >= 60
        ? 'text-[hsl(var(--color-warning))]'
        : 'text-[hsl(var(--color-danger))]'

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'h-1.5 flex-1 overflow-hidden rounded-full',
          'bg-[hsl(var(--color-border))]'
        )}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-700', tone)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn('text-xs font-semibold', textTone)}>{value}%</span>
    </div>
  )
}

export function AiAnalysisCard({
  disputeId,
  milestoneAmount,
  currency,
  initialAnalysis,
  canRequest,
}: AiAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<AiDisputeAnalysis | null>(
    initialAnalysis ?? null
  )
  const [reasoningOpen, setReasoningOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleRequest() {
    startTransition(async () => {
      const result = await analyseDispute(disputeId)
      if (result.success && result.analysis) {
        setAnalysis(result.analysis)
        toast.success('AI analysis complete.')
        return
      }

      toast.error(result.error ?? 'Analysis failed.')
    })
  }

  const rulingConfig = analysis
    ? RULING_CONFIG[analysis.recommended_ruling]
    : null

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-xl)] border',
        'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 border-b px-5 py-4',
          'border-[hsl(var(--color-border))]'
        )}
      >
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            'bg-[hsl(var(--color-accent)/0.12)]'
          )}
        >
          <Brain size={15} className="text-[hsl(var(--color-accent))]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
            ContraktsAI Analysis
          </p>
          <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">
            {analysis
              ? 'AI reviewed the contract, milestone, and evidence on record.'
              : 'AI can compare the evidence against the contracted deliverables.'}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-1 text-[10px] font-bold',
            analysis
              ? 'bg-[hsl(var(--color-success)/0.12)] text-[hsl(var(--color-success))]'
              : 'bg-[hsl(var(--color-warning)/0.12)] text-[hsl(var(--color-warning))]'
          )}
        >
          {analysis ? 'Complete' : 'Analysing'}
        </span>
      </div>

      <div className="p-5">
        {!analysis && (
          <div className="flex flex-col items-center py-4 text-center">
            {!canRequest ? (
              <>
                <Sparkles
                  size={20}
                  className="mb-3 text-[hsl(var(--color-text-3))]"
                />
                <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                  Waiting for evidence
                </p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                  AI analysis becomes available once both parties have had a fair
                  chance to submit evidence or the response window expires.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                  AI analysis available
                </p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                  At stake: {formatCurrency(milestoneAmount, currency)}. AI will
                  compare the milestone requirements against both sides&apos;
                  evidence and propose a fair outcome.
                </p>
                <button
                  type="button"
                  onClick={handleRequest}
                  disabled={isPending}
                  className={cn(
                    'mt-4 flex items-center gap-2 rounded-[var(--radius-md)] px-5 py-2.5',
                    'bg-[hsl(var(--color-accent))] text-sm font-medium text-white',
                    'transition-all duration-150 hover:brightness-110 disabled:opacity-50'
                  )}
                >
                  {isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Analysing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Request AI analysis
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {analysis && rulingConfig && (
          <div className="flex flex-col gap-4">
            <div
              className={cn(
                'flex items-center gap-3 rounded-[var(--radius-lg)] border p-3',
                rulingConfig.bg,
                rulingConfig.border
              )}
            >
              <rulingConfig.icon size={16} className={rulingConfig.color} />
              <div className="flex-1">
                <p className={cn('text-sm font-semibold', rulingConfig.color)}>
                  {rulingConfig.label}
                  {analysis.recommended_ruling === 'partial'
                    ? ` - ${analysis.vendor_pct}% to vendor`
                    : ''}
                </p>
                <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">
                  AI recommendation for {formatCurrency(milestoneAmount, currency)}
                </p>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-[hsl(var(--color-text-2))]">
                  Confidence
                </p>
                <span className="text-xs text-[hsl(var(--color-text-3))]">
                  {analysis.confidence >= 80
                    ? 'High confidence'
                    : analysis.confidence >= 60
                      ? 'Moderate confidence'
                      : 'Low confidence'}
                </span>
              </div>
              <ConfidenceBar value={analysis.confidence} />
            </div>

            {analysis.key_factors.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-[hsl(var(--color-text-2))]">
                  Key factors
                </p>
                <div className="flex flex-col gap-1.5">
                  {analysis.key_factors.map((factor, index) => (
                    <div key={`${factor}-${index}`} className="flex items-start gap-2">
                      <TrendingUp
                        size={11}
                        className="mt-0.5 shrink-0 text-[hsl(var(--color-accent))]"
                      />
                      <p className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                        {factor}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              className={cn(
                'rounded-[var(--radius-md)] border p-3',
                'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))]'
              )}
            >
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                Evidence gap
              </p>
              <p className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                {analysis.evidence_summary.gap_analysis}
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setReasoningOpen((open) => !open)}
                className={cn(
                  'flex w-full items-center gap-2 text-xs font-medium',
                  'text-[hsl(var(--color-text-3))] transition-colors duration-150',
                  'hover:text-[hsl(var(--color-text-2))]'
                )}
              >
                {reasoningOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {reasoningOpen ? 'Hide' : 'Show'} full reasoning
              </button>
              {reasoningOpen && (
                <div
                  className={cn(
                    'mt-3 rounded-[var(--radius-md)] border p-4',
                    'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))]'
                  )}
                >
                  <p className="whitespace-pre-line text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                    {analysis.reasoning}
                  </p>
                </div>
              )}
            </div>

            {analysis.auto_resolvable && (
              <div
                className={cn(
                  'flex items-start gap-2 rounded-[var(--radius-md)] border p-3',
                  'border-[hsl(var(--color-success)/0.2)] bg-[hsl(var(--color-success)/0.06)]'
                )}
              >
                <Shield
                  size={13}
                  className="mt-0.5 shrink-0 text-[hsl(var(--color-success))]"
                />
                <p className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                  This dispute qualifies for AI auto-resolution because the amount is
                  below the small-claim threshold and the evidence is highly conclusive.
                </p>
              </div>
            )}

            {analysis.appeal_risk === 'high' && (
              <div
                className={cn(
                  'flex items-start gap-2 rounded-[var(--radius-md)] border p-3',
                  'border-[hsl(var(--color-warning)/0.2)] bg-[hsl(var(--color-warning)/0.06)]'
                )}
              >
                <AlertTriangle
                  size={13}
                  className="mt-0.5 shrink-0 text-[hsl(var(--color-warning))]"
                />
                <p className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                  High appeal risk detected. Human arbitrator review is still advised
                  before treating this as a final outcome.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
