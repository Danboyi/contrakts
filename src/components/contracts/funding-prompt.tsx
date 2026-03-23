'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Building,
  CheckCircle,
  Coins,
  CreditCard,
  Lock,
  Shield,
} from 'lucide-react'
import { fundEscrow, type PaymentMethod } from '@/lib/payments/actions'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { Contract, Milestone } from '@/types'

interface FundingPromptProps {
  contract: Contract
  milestones: Milestone[]
  currentUserId: string
}

const PAYMENT_METHODS: Array<{
  id: PaymentMethod
  label: string
  description: string
  icon: typeof CreditCard
}> = [
  {
    id: 'paystack',
    label: 'Card or bank via Paystack',
    description: 'Best for NGN and supported card flows',
    icon: CreditCard,
  },
  {
    id: 'flutterwave',
    label: 'Flutterwave',
    description: 'Multi-country card and bank payments',
    icon: Building,
  },
  {
    id: 'crypto',
    label: 'USDC stablecoin',
    description: 'Pay from a crypto wallet using Coinbase Commerce',
    icon: Coins,
  },
]

export function FundingPrompt({
  contract,
  milestones,
  currentUserId,
}: FundingPromptProps) {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const serviceReceiverId =
    contract.service_receiver_id ??
    (contract.initiator_role === 'service_receiver'
      ? contract.initiator_id
      : contract.counterparty_id)

  if (contract.state !== 'signed' || serviceReceiverId !== currentUserId) {
    return null
  }

  const fundedAmount = contract.total_value
  const milestoneCount = milestones.length

  function handleFund() {
    if (!selectedMethod) {
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await fundEscrow(contract.id, selectedMethod)

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.paymentUrl) {
        window.location.assign(result.paymentUrl)
        return
      }

      router.refresh()
    })
  }

  return (
    <div
      className={cn(
        'mb-6 rounded-[var(--radius-xl)] border-2 border-[hsl(var(--color-success)/0.2)]',
        'bg-[hsl(var(--color-success)/0.04)] p-5 sm:p-6'
      )}
    >
      <div className="mb-5 flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)]',
            'bg-[hsl(var(--color-success)/0.15)]'
          )}
        >
          <Shield size={20} className="text-[hsl(var(--color-success))]" />
        </div>
        <div>
          <h3 className="mb-1 text-base font-semibold text-[hsl(var(--color-text-1))]">
            Fund the Escrow
          </h3>
          <p className="text-sm text-[hsl(var(--color-text-2))]">
            Both parties have signed. Fund the protected contract value so work
            can begin and milestone delivery can move forward.
          </p>
        </div>
      </div>

      <div
        className={cn(
          'mb-5 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
          'bg-[hsl(var(--color-surface))] p-3 sm:flex-row sm:items-center'
        )}
      >
        <div className="flex flex-1 items-center gap-2">
          <CheckCircle size={14} className="text-[hsl(var(--color-success))]" />
          <div>
            <p className="text-[10px] text-[hsl(var(--color-text-3))]">
              Service Receiver signature
            </p>
            <p className="text-xs font-serif italic text-[hsl(var(--color-text-1))]">
              {contract.receiver_signature || 'Signed'}
            </p>
          </div>
        </div>
        <div className="hidden h-px flex-1 bg-[hsl(var(--color-border))] sm:block sm:h-8 sm:w-px sm:flex-none" />
        <div className="flex flex-1 items-center gap-2">
          <CheckCircle size={14} className="text-[hsl(var(--color-success))]" />
          <div>
            <p className="text-[10px] text-[hsl(var(--color-text-3))]">
              Service Provider signature
            </p>
            <p className="text-xs font-serif italic text-[hsl(var(--color-text-1))]">
              {contract.provider_signature || 'Signed'}
            </p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'mb-5 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
          'bg-[hsl(var(--color-surface))] p-4'
        )}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[hsl(var(--color-text-2))]">Protected contract value</span>
            <span className="font-medium text-[hsl(var(--color-text-1))]">
              {formatCurrency(fundedAmount, contract.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[hsl(var(--color-text-2))]">
              Milestones covered
            </span>
            <span className="font-medium text-[hsl(var(--color-text-1))]">
              {milestoneCount}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-[hsl(var(--color-border))] pt-2 text-sm">
            <span className="font-semibold text-[hsl(var(--color-text-1))]">
              Amount to fund now
            </span>
            <span className="text-base font-bold text-[hsl(var(--color-success))]">
              {formatCurrency(fundedAmount, contract.currency)}
            </span>
          </div>
        </div>
      </div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--color-text-3))]">
        Payment method
      </p>
      <div className="mb-5 flex flex-col gap-2">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = selectedMethod === method.id
          const Icon = method.icon

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelectedMethod(method.id)}
              className={cn(
                'flex min-h-[52px] w-full items-center gap-3 rounded-[var(--radius-lg)] border p-3 text-left transition-all duration-200',
                isSelected
                  ? 'border-[hsl(var(--color-success))] bg-[hsl(var(--color-success)/0.06)]'
                  : 'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] hover:border-[hsl(var(--color-border-2))]'
              )}
            >
              <Icon
                size={18}
                className={
                  isSelected
                    ? 'text-[hsl(var(--color-success))]'
                    : 'text-[hsl(var(--color-text-3))]'
                }
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isSelected
                      ? 'text-[hsl(var(--color-success))]'
                      : 'text-[hsl(var(--color-text-1))]'
                  )}
                >
                  {method.label}
                </p>
                <p className="text-[10px] text-[hsl(var(--color-text-3))]">
                  {method.description}
                </p>
              </div>
              <div
                className={cn(
                  'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2',
                  isSelected
                    ? 'border-[hsl(var(--color-success))]'
                    : 'border-[hsl(var(--color-border-2))]'
                )}
              >
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-[hsl(var(--color-success))]" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="mb-5 flex items-center gap-2 text-[10px] text-[hsl(var(--color-text-3))]">
        <Lock size={11} className="flex-shrink-0" />
        <span>
          Funds stay locked in escrow until milestone approval or the auto-release
          window completes.
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-[var(--radius-md)] border border-[hsl(var(--color-danger)/0.25)] bg-[hsl(var(--color-danger)/0.08)] px-3 py-2 text-xs text-[hsl(var(--color-danger))]">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleFund}
        disabled={!selectedMethod || isPending}
        className={cn(
          'flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] px-6 py-3.5 text-sm font-semibold',
          'transition-all duration-200',
          selectedMethod && !isPending
            ? 'bg-[hsl(var(--color-success))] text-white shadow-[0_4px_16px_hsl(var(--color-success)/0.3)] hover:brightness-110 active:scale-[0.98]'
            : 'cursor-not-allowed bg-[hsl(var(--color-surface-2))] text-[hsl(var(--color-text-3))]'
        )}
      >
        {isPending ? (
          <span>Processing...</span>
        ) : (
          <>
            Fund {formatCurrency(fundedAmount, contract.currency)}
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  )
}
