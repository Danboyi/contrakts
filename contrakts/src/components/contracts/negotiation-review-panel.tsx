'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRightLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  Plus,
  Send,
  Trash2,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, fromSmallestUnit } from '@/lib/utils/format-currency'
import {
  submitContractReview,
  acceptContractTerms,
} from '@/lib/contracts/negotiation-actions'
import type { Contract, Milestone, InitiatorRole } from '@/types'

interface MilestoneEdit {
  id: string
  title: string
  description: string
  amount: string
  deadline: string
  isNew?: boolean
}

interface NegotiationReviewPanelProps {
  contract: Contract & { milestones?: Milestone[] }
  currentUserId: string
  onUpdate?: () => void
}

function getRoleLabels(
  initiatorRole: InitiatorRole,
  isInitiator: boolean
) {
  const isVendorInitiator = initiatorRole === 'vendor'

  if (isInitiator) {
    return {
      yourRole: isVendorInitiator ? 'Vendor' : 'Client',
      theirRole: isVendorInitiator ? 'Client' : 'Vendor',
    }
  }

  return {
    yourRole: isVendorInitiator ? 'Client' : 'Vendor',
    theirRole: isVendorInitiator ? 'Vendor' : 'Client',
  }
}

export function NegotiationReviewPanel({
  contract,
  currentUserId,
  onUpdate,
}: NegotiationReviewPanelProps) {
  const isInitiator = contract.initiator_id === currentUserId
  const { yourRole, theirRole } = getRoleLabels(
    contract.initiator_role ?? 'service_receiver',
    isInitiator
  )

  const milestones = [...(contract.milestones ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  )

  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [editMilestones, setEditMilestones] = useState<MilestoneEdit[]>(() =>
    milestones.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description ?? '',
      amount: String(fromSmallestUnit(m.amount)),
      deadline: m.deadline ?? '',
    }))
  )
  const [editTerms, setEditTerms] = useState(contract.terms ?? '')
  const [changesSummary, setChangesSummary] = useState('')
  const [acceptModal, setAcceptModal] = useState(false)
  const [isPending, startTransition] = useTransition()

  const editTotal = editMilestones.reduce((sum, m) => {
    const amount = parseFloat(m.amount)
    return sum + (Number.isNaN(amount) ? 0 : amount)
  }, 0)

  function handleStartEdit() {
    setEditMilestones(
      milestones.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description ?? '',
        amount: String(fromSmallestUnit(m.amount)),
        deadline: m.deadline ?? '',
      }))
    )
    setEditTerms(contract.terms ?? '')
    setChangesSummary('')
    setMode('edit')
  }

  function updateMilestone(
    id: string,
    field: keyof MilestoneEdit,
    value: string
  ) {
    setEditMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    )
  }

  function addMilestone() {
    setEditMilestones((prev) => [
      ...prev,
      {
        id: nanoid(),
        title: '',
        description: '',
        amount: '',
        deadline: '',
        isNew: true,
      },
    ])
  }

  function removeMilestone(id: string) {
    setEditMilestones((prev) =>
      prev.length > 1 ? prev.filter((m) => m.id !== id) : prev
    )
  }

  function moveMilestone(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= editMilestones.length) return
    setEditMilestones((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  function handleSubmitReview() {
    if (!changesSummary.trim()) {
      toast.error('Please describe what you changed')
      return
    }

    const invalidMilestone = editMilestones.find(
      (m) => !m.title.trim() || !parseFloat(m.amount)
    )
    if (invalidMilestone) {
      toast.error('All milestones need a title and valid amount')
      return
    }

    startTransition(async () => {
      const result = await submitContractReview({
        contractId: contract.id,
        changes_summary: changesSummary,
        milestones: editMilestones.map((m) => ({
          id: m.isNew ? undefined : m.id,
          title: m.title,
          description: m.description || undefined,
          amount: parseFloat(m.amount),
          deadline: m.deadline || undefined,
        })),
        terms: editTerms !== contract.terms ? editTerms : undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Review submitted. Waiting for the other party to respond.')
      setMode('view')
      onUpdate?.()
    })
  }

  function handleAcceptTerms() {
    startTransition(async () => {
      const result = await acceptContractTerms(contract.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(
        'Terms accepted! The contract is now ready for signing and funding.'
      )
      setAcceptModal(false)
      onUpdate?.()
    })
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]">
      <div className="flex items-center justify-between border-b border-[hsl(var(--color-border))] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
            {mode === 'edit' ? 'Propose changes' : 'Contract terms & milestones'}
          </h2>
          <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">
            You are the{' '}
            <span className="font-medium text-[hsl(var(--color-accent))]">
              {yourRole}
            </span>
            . Review the {theirRole.toLowerCase()}&apos;s proposal below.
          </p>
        </div>
        {mode === 'view' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Edit3 size={13} />}
              onClick={handleStartEdit}
            >
              Propose changes
            </Button>
            <Button
              size="sm"
              leftIcon={<Check size={13} />}
              onClick={() => setAcceptModal(true)}
            >
              Accept terms
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'view' ? (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5"
          >
            {/* Current milestones */}
            <div className="mb-5">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                Milestones ({milestones.length})
              </p>
              <div className="flex flex-col gap-2">
                {milestones.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-4 py-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-surface))] text-[11px] font-semibold text-[hsl(var(--color-text-3))]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                        {milestone.title}
                      </p>
                      {milestone.description && (
                        <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[hsl(var(--color-text-1))]">
                      {formatCurrency(milestone.amount, contract.currency)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between px-1">
                <span className="text-xs text-[hsl(var(--color-text-3))]">
                  Total value
                </span>
                <span className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                  {formatCurrency(contract.total_value, contract.currency)}
                </span>
              </div>
            </div>

            {/* Current terms */}
            {contract.terms && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                  Terms
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                  {contract.terms}
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5"
          >
            {/* Edit milestones */}
            <div className="mb-5">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                Edit milestones
              </p>
              <div className="flex flex-col gap-2">
                {editMilestones.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className={cn(
                      'rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-3',
                      milestone.isNew &&
                        'border-[hsl(var(--color-accent)/0.3)] bg-[hsl(var(--color-accent)/0.03)]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex shrink-0 flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveMilestone(index, index - 1)}
                          disabled={index === 0}
                          className="p-0.5 text-[hsl(var(--color-text-3))] transition-colors hover:text-[hsl(var(--color-text-2))] disabled:opacity-20"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--color-surface))] text-[10px] font-semibold text-[hsl(var(--color-text-3))]">
                          {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => moveMilestone(index, index + 1)}
                          disabled={index === editMilestones.length - 1}
                          className="p-0.5 text-[hsl(var(--color-text-3))] transition-colors hover:text-[hsl(var(--color-text-2))] disabled:opacity-20"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>
                      <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-3">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            placeholder="Milestone title"
                            value={milestone.title}
                            onChange={(e) =>
                              updateMilestone(milestone.id, 'title', e.target.value)
                            }
                            className={cn(
                              'h-[36px] w-full rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3',
                              'text-sm text-[hsl(var(--color-text-1))] placeholder:text-[hsl(var(--color-text-3))] outline-none transition-all duration-150',
                              'focus:border-[hsl(var(--color-accent))] focus:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.12)]'
                            )}
                          />
                        </div>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={milestone.amount}
                          onChange={(e) =>
                            updateMilestone(milestone.id, 'amount', e.target.value)
                          }
                          min="0"
                          step="0.01"
                          className={cn(
                            'h-[36px] w-full rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3',
                            'text-sm text-[hsl(var(--color-text-1))] placeholder:text-[hsl(var(--color-text-3))] outline-none transition-all duration-150',
                            'focus:border-[hsl(var(--color-accent))] focus:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.12)]'
                          )}
                        />
                      </div>
                      {editMilestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMilestone(milestone.id)}
                          className={cn(
                            'shrink-0 rounded-[var(--radius-sm)] p-1.5 text-[hsl(var(--color-text-3))] transition-all duration-150',
                            'hover:bg-[hsl(var(--color-danger)/0.08)] hover:text-[hsl(var(--color-danger))]'
                          )}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addMilestone}
                className={cn(
                  'mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[hsl(var(--color-border-2))]',
                  'text-sm text-[hsl(var(--color-text-3))] transition-all duration-150',
                  'hover:border-[hsl(var(--color-accent)/0.4)] hover:bg-[hsl(var(--color-accent)/0.04)] hover:text-[hsl(var(--color-text-2))]'
                )}
              >
                <Plus size={14} />
                Add milestone
              </button>

              <div className="mt-2 flex items-center justify-between px-1">
                <span className="text-xs text-[hsl(var(--color-text-3))]">
                  New total
                </span>
                <span className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: contract.currency || 'USD',
                  }).format(editTotal)}
                </span>
              </div>
            </div>

            {/* Edit terms */}
            <div className="mb-5">
              <Textarea
                label="Contract terms"
                value={editTerms}
                onChange={(e) => setEditTerms(e.target.value)}
                style={{ minHeight: '120px' }}
              />
            </div>

            {/* Changes summary */}
            <div className="mb-5">
              <Textarea
                label="What did you change? (required)"
                placeholder="Describe the changes you made so the other party can quickly understand your counter-proposal..."
                value={changesSummary}
                onChange={(e) => setChangesSummary(e.target.value)}
                style={{ minHeight: '80px' }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-[hsl(var(--color-border))] pt-4">
              <Button
                variant="ghost"
                onClick={() => setMode('view')}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                leftIcon={<Send size={14} />}
                loading={isPending}
                onClick={handleSubmitReview}
              >
                Send review
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accept modal */}
      <Modal
        open={acceptModal}
        onOpenChange={setAcceptModal}
        title="Accept contract terms?"
        description="By accepting, you agree to the current milestones, amounts, and terms. The contract will move to the signing phase."
        size="sm"
      >
        <div className="mt-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-3">
          <p className="text-xs leading-relaxed text-[hsl(var(--color-text-3))]">
            After accepting, both parties will need to sign the contract. Then,
            the service receiver (client) will fund the escrow to begin work.
          </p>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setAcceptModal(false)}>
            Cancel
          </Button>
          <Button
            leftIcon={<Check size={14} />}
            loading={isPending}
            onClick={handleAcceptTerms}
          >
            Accept terms
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
