'use client'

import type { ElementType } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bitcoin,
  CreditCard,
  Globe,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fundEscrow, type PaymentMethod } from '@/lib/payments/actions'
import { cn } from '@/lib/utils/cn'

const METHODS: Array<{
  id: PaymentMethod
  label: string
  sub: string
  icon: ElementType
  badge?: string
  regions: string
}> = [
  {
    id: 'paystack',
    label: 'Paystack',
    sub: 'Cards, bank transfer, USSD',
    icon: CreditCard,
    badge: 'Best for Nigeria',
    regions: 'Nigeria, Ghana, South Africa',
  },
  {
    id: 'flutterwave',
    label: 'Flutterwave',
    sub: 'Cards, mobile money, bank',
    icon: Globe,
    badge: 'Best for Africa',
    regions: '30+ African countries',
  },
  {
    id: 'crypto',
    label: 'Crypto (USDC)',
    sub: 'Pay with USDC or USDT stablecoins',
    icon: Bitcoin,
    badge: 'Global \u00b7 Instant',
    regions: 'Worldwide',
  },
]

export default function FundEscrowPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string

  const [selected, setSelected] = useState<PaymentMethod>('paystack')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFund() {
    setError(null)
    startTransition(async () => {
      const result = await fundEscrow(contractId, selected)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.paymentUrl) {
        window.location.assign(result.paymentUrl)
      }
    })
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-2 text-sm text-[hsl(var(--color-text-3))] transition-colors duration-150 hover:text-[hsl(var(--color-text-2))]"
      >
        <ArrowLeft size={14} />
        Back to contract
      </button>

      <div className="mb-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--color-success)/0.12)]">
          <Shield size={22} className="text-[hsl(var(--color-success))]" />
        </div>
        <h1 className="mb-2 text-[24px] font-semibold text-[hsl(var(--color-text-1))]">
          Fund escrow
        </h1>
        <p className="text-sm leading-7 text-[hsl(var(--color-text-2))]">
          Your payment will be held securely in escrow until each milestone is
          approved. Select a payment method below.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        {METHODS.map((method) => {
          const Icon = method.icon
          const isActive = selected === method.id

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelected(method.id)}
              className={cn(
                'flex w-full items-center gap-4 rounded-[var(--radius-lg)] border px-4 py-4 text-left transition-all duration-150',
                isActive
                  ? 'border-[hsl(var(--color-accent)/0.4)] bg-[hsl(var(--color-accent)/0.06)] shadow-[0_0_0_1px_hsl(var(--color-accent)/0.12)]'
                  : 'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] hover:border-[hsl(var(--color-border-2))]'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]',
                  isActive
                    ? 'bg-[hsl(var(--color-accent)/0.12)]'
                    : 'bg-[hsl(var(--color-surface-2))]'
                )}
              >
                <Icon
                  size={18}
                  className={
                    isActive
                      ? 'text-[hsl(var(--color-accent))]'
                      : 'text-[hsl(var(--color-text-3))]'
                  }
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                    {method.label}
                  </span>
                  {method.badge && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        isActive
                          ? 'bg-[hsl(var(--color-accent)/0.12)] text-[hsl(var(--color-accent))]'
                          : 'bg-[hsl(var(--color-surface-2))] text-[hsl(var(--color-text-3))]'
                      )}
                    >
                      {method.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[hsl(var(--color-text-3))]">{method.sub}</p>
                <p className="mt-1 text-[11px] text-[hsl(var(--color-text-3))] opacity-80">
                  {method.regions}
                </p>
              </div>

              <div
                className={cn(
                  'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-all duration-150',
                  isActive
                    ? 'border-[hsl(var(--color-accent))]'
                    : 'border-[hsl(var(--color-border-2))]'
                )}
              >
                {isActive && (
                  <div className="h-[9px] w-[9px] rounded-full bg-[hsl(var(--color-accent))]" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selected === 'crypto' && (
        <div className="mb-4 flex items-start gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--color-warning)/0.2)] bg-[hsl(var(--color-warning)/0.06)] px-4 py-3">
          <AlertTriangle
            size={14}
            className="mt-0.5 shrink-0 text-[hsl(var(--color-warning))]"
          />
          <p className="text-xs leading-6 text-[hsl(var(--color-text-2))]">
            Crypto escrow uses USDC stablecoins only. Send only USDC or USDT.
            Other tokens will not be accepted. Vendor payouts stay under manual
            review unless bank details are configured.
          </p>
        </div>
      )}

      <div className="mb-6 flex items-start gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--color-success)/0.15)] bg-[hsl(var(--color-success)/0.05)] px-4 py-3">
        <Shield size={14} className="mt-0.5 shrink-0 text-[hsl(var(--color-success))]" />
        <p className="text-xs leading-6 text-[hsl(var(--color-text-2))]">
          Your payment is held securely. It cannot be accessed by the vendor
          until each milestone is approved by you. Disputes are arbitrated by
          Contrakts.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-[var(--radius-md)] border border-[hsl(var(--color-danger)/0.3)] bg-[hsl(var(--color-danger)/0.1)] px-4 py-3 text-sm text-[hsl(var(--color-danger))]">
          {error}
        </div>
      )}

      <Button
        size="lg"
        loading={isPending}
        onClick={handleFund}
        rightIcon={<ArrowRight size={16} />}
        className="w-full"
      >
        {isPending
          ? 'Redirecting to payment...'
          : `Continue with ${METHODS.find((method) => method.id === selected)?.label}`}
      </Button>

      <p className="mt-4 text-center text-[11px] leading-6 text-[hsl(var(--color-text-3))]">
        You will be redirected to a secure payment page. Do not close the tab
        until payment is confirmed.
      </p>
    </div>
  )
}
