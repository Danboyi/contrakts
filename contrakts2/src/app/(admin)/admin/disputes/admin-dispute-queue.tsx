'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { acceptAiRuling } from '@/lib/ai/dispute-analysis'
import { issueRuling } from '@/lib/disputes/actions'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatDateTime, formatRelative } from '@/lib/utils/format-date'
import { Button } from '@/components/ui/button'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { cn } from '@/lib/utils/cn'
import { AlertTriangle, ChevronRight, Scale } from 'lucide-react'

export type QueueDispute = {
  id: string
  status: string
  reason: string
  description: string
  raised_at: string
  response_due_at: string | null
  contract: {
    id: string
    ref_code: string
    title: string
    currency: string
  } | null
  milestone: {
    id: string
    title: string
    amount: number
  } | null
  raiser: {
    full_name: string
    email: string
  } | null
  respondent: {
    full_name: string
    email: string
  } | null
  evidence: Array<{
    id: string
    submitted_by: string
    file_name: string | null
    description: string | null
    created_at: string
    submitter: { full_name: string } | null
  }> | null
}

type AnalysisMap = Record<
  string,
  {
    dispute_id: string
    recommended_ruling: string
    confidence: number
    auto_resolvable: boolean
    applied: boolean
  }
>

const RULINGS = [
  { value: 'vendor_wins', label: 'Vendor wins' },
  { value: 'client_wins', label: 'Client wins' },
  { value: 'partial', label: 'Partial split' },
  { value: 'cancelled', label: 'Cancel dispute' },
] as const

function reasonLabel(reason: string) {
  return reason.replaceAll('_', ' ')
}

export function AdminDisputeQueue({
  disputes,
  analysisMap,
}: {
  disputes: QueueDispute[]
  analysisMap?: AnalysisMap
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<QueueDispute | null>(null)
  const [ruling, setRuling] = useState<string>('')
  const [rulingNotes, setRulingNotes] = useState('')
  const [vendorPct, setVendorPct] = useState(50)
  const [rulingModal, setRulingModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isAcceptPending, startAcceptTransition] = useTransition()

  const sortedEvidence = useMemo(
    () =>
      [...(selected?.evidence ?? [])].sort(
        (left, right) =>
          new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      ),
    [selected?.evidence]
  )

  function resetModal() {
    setSelected(null)
    setRuling('')
    setRulingNotes('')
    setVendorPct(50)
    setRulingModal(false)
  }

  function handleIssueRuling() {
    if (!selected) {
      return
    }

    if (!ruling) {
      toast.error('Select a ruling.')
      return
    }

    if (rulingNotes.length < 50) {
      toast.error('Notes must be at least 50 characters.')
      return
    }

    startTransition(async () => {
      const result = await issueRuling({
        disputeId: selected.id,
        ruling: ruling as 'vendor_wins' | 'client_wins' | 'partial' | 'cancelled',
        rulingNotes,
        rulingPctVendor: ruling === 'partial' ? vendorPct : undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Ruling issued. Distribution has been queued.')
      router.refresh()
      resetModal()
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[hsl(var(--color-text-1))]">
          Arbitration queue
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--color-text-2))]">
          {disputes.length} dispute{disputes.length === 1 ? '' : 's'} awaiting review
        </p>
      </div>

      {disputes.length === 0 ? (
        <div className="flex flex-col items-center rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-6 py-16 text-center">
          <Scale size={24} className="mb-3 text-[hsl(var(--color-text-3))]" />
          <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
            No open disputes
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4 transition-colors duration-150 hover:border-[hsl(var(--color-border-2))] md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                    {dispute.contract?.title}
                  </span>
                  <span className="text-xs text-[hsl(var(--color-text-3))]">
                    {dispute.contract?.ref_code}
                  </span>
                  <span className="text-xs capitalize text-[hsl(var(--color-danger))]">
                    {dispute.status.replaceAll('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-[hsl(var(--color-text-2))]">
                  {dispute.milestone?.title} - {reasonLabel(dispute.reason)}
                </p>
                {analysisMap?.[dispute.id] && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium',
                        'bg-[hsl(var(--color-accent)/0.1)] text-[hsl(var(--color-accent))]'
                      )}
                    >
                      AI:{' '}
                      {analysisMap[dispute.id].recommended_ruling.replaceAll('_', ' ')}
                    </span>
                    <span className="text-[10px] text-[hsl(var(--color-text-3))]">
                      {analysisMap[dispute.id].confidence}% confidence
                    </span>
                    {analysisMap[dispute.id].auto_resolvable && (
                      <span className="text-[10px] text-[hsl(var(--color-success))]">
                        Auto-resolve eligible
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[hsl(var(--color-text-3))]">
                  <span>Raised {formatRelative(dispute.raised_at)}</span>
                  {dispute.response_due_at && (
                    <span>Response due {formatDateTime(dispute.response_due_at)}</span>
                  )}
                  <span>
                    {formatCurrency(
                      dispute.milestone?.amount ?? 0,
                      dispute.contract?.currency ?? 'USD'
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {analysisMap?.[dispute.id] &&
                  !analysisMap[dispute.id].applied &&
                  analysisMap[dispute.id].recommended_ruling !==
                    'insufficient_evidence' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={isAcceptPending}
                    onClick={() => {
                      startAcceptTransition(async () => {
                        const result = await acceptAiRuling(dispute.id)
                        if (result.error) {
                          toast.error(result.error)
                          return
                        }

                        toast.success('AI ruling applied.')
                        router.refresh()
                      })
                    }}
                  >
                    Accept AI
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  rightIcon={<ChevronRight size={13} />}
                  onClick={() => {
                    setSelected(dispute)
                    setRulingModal(true)
                  }}
                >
                  Review
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={rulingModal}
        onOpenChange={(open) => {
          if (!open) {
            resetModal()
            return
          }

          setRulingModal(open)
        }}
        title="Issue ruling"
        description={
          selected
            ? `${selected.contract?.ref_code} - ${selected.milestone?.title}`
            : ''
        }
        size="xl"
      >
        {selected && (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                Dispute summary
              </p>
              <p className="text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                {selected.description}
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-3">
                  <p className="text-xs text-[hsl(var(--color-text-3))]">Raiser</p>
                  <p className="mt-1 text-sm font-medium text-[hsl(var(--color-text-1))]">
                    {selected.raiser?.full_name ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-[hsl(var(--color-text-3))]">
                    {selected.raiser?.email ?? ''}
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-3">
                  <p className="text-xs text-[hsl(var(--color-text-3))]">Respondent</p>
                  <p className="mt-1 text-sm font-medium text-[hsl(var(--color-text-1))]">
                    {selected.respondent?.full_name ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-[hsl(var(--color-text-3))]">
                    {selected.respondent?.email ?? ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                Evidence
              </p>
              {sortedEvidence.length === 0 ? (
                <p className="text-sm text-[hsl(var(--color-text-3))]">
                  No evidence submitted yet.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {sortedEvidence.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                            {entry.file_name ?? 'Written statement'}
                          </p>
                          {entry.description && (
                            <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                              {entry.description}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right text-xs text-[hsl(var(--color-text-3))]">
                          <p>{entry.submitter?.full_name ?? 'Unknown'}</p>
                          <p>{formatRelative(entry.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-[hsl(var(--color-text-2))]">
                Ruling
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {RULINGS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRuling(option.value)}
                    className={cn(
                      'rounded-[var(--radius-md)] border p-3 text-left text-sm font-medium transition-all duration-150',
                      ruling === option.value
                        ? 'border-[hsl(var(--color-accent)/0.5)] bg-[hsl(var(--color-accent)/0.08)] text-[hsl(var(--color-accent))]'
                        : 'border-[hsl(var(--color-border))] text-[hsl(var(--color-text-2))] hover:border-[hsl(var(--color-border-2))]'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {ruling === 'partial' && (
              <div>
                <label className="mb-2 block text-xs font-medium text-[hsl(var(--color-text-2))]">
                  Vendor receives: {vendorPct}% (
                  {formatCurrency(
                    Math.round((selected.milestone?.amount ?? 0) * (vendorPct / 100)),
                    selected.contract?.currency ?? 'USD'
                  )}
                  )
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={vendorPct}
                  onChange={(event) => setVendorPct(Number(event.target.value))}
                  className="w-full"
                />
                <div className="mt-1 flex justify-between text-xs text-[hsl(var(--color-text-3))]">
                  <span>0% client receives all</span>
                  <span>100% vendor receives all</span>
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-medium text-[hsl(var(--color-text-2))]">
                Ruling notes (visible to both parties)
              </label>
              <textarea
                placeholder="Explain your reasoning clearly. This note becomes part of the dispute record."
                value={rulingNotes}
                onChange={(event) => setRulingNotes(event.target.value)}
                rows={5}
                className="w-full resize-y rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 py-2.5 text-sm text-[hsl(var(--color-text-1))] outline-none placeholder:text-[hsl(var(--color-text-3))] focus:border-[hsl(var(--color-accent))]"
              />
              <p className="mt-1 text-xs text-[hsl(var(--color-text-3))]">
                {rulingNotes.length}/50 minimum
              </p>
            </div>

            {ruling === 'client_wins' && (
              <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--color-warning)/0.2)] bg-[hsl(var(--color-warning)/0.06)] p-4">
                <AlertTriangle
                  size={14}
                  className="mt-0.5 shrink-0 text-[hsl(var(--color-warning))]"
                />
                <p className="text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                  Client-win refunds are queued for manual handling and audit review.
                </p>
              </div>
            )}
          </div>
        )}

        <ModalFooter>
          <Button variant="secondary" onClick={resetModal}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={isPending}
            onClick={handleIssueRuling}
            disabled={!ruling || rulingNotes.length < 50}
          >
            Issue ruling
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
