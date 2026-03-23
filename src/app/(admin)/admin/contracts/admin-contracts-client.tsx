'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { ContractStateBadge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatRelative } from '@/lib/utils/format-date'

const STATES = [
  'all',
  'draft',
  'pending',
  'funded',
  'active',
  'in_review',
  'disputed',
  'complete',
  'voided',
] as const

export function AdminContractsClient({
  contracts,
  total,
  page,
  limit,
  stateFilter,
  query,
}: {
  contracts: Array<{
    id: string
    ref_code: string
    title: string
    state: string
    currency: string
    total_value: number
    created_at: string
    initiator: { full_name: string; email: string } | null
  }>
  total: number
  page: number
  limit: number
  stateFilter?: string
  query?: string
}) {
  const router = useRouter()
  const totalPages = Math.max(1, Math.ceil(total / limit))

  function navigate(params: {
    state?: string
    q?: string
    page?: string
  }) {
    const searchParams = new URLSearchParams()

    if (params.state) {
      searchParams.set('state', params.state)
    }
    if (params.q) {
      searchParams.set('q', params.q)
    }
    if (params.page && params.page !== '1') {
      searchParams.set('page', params.page)
    }

    const suffix = searchParams.toString()
    router.push(`/admin/contracts${suffix ? `?${suffix}` : ''}`)
  }

  return (
    <div className="w-full max-w-full">
      <PageHeader
        title="All contracts"
        subtitle={`${total.toLocaleString()} total`}
      />

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:flex-wrap">
        <input
          type="text"
          defaultValue={query}
          placeholder="Search by title or ref code..."
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              navigate({
                state: stateFilter,
                q: (event.target as HTMLInputElement).value || undefined,
              })
            }
          }}
          className={cn(
            'h-11 w-full rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] md:min-w-[240px] md:w-auto',
            'bg-[hsl(var(--color-surface-2))] px-3 text-sm text-[hsl(var(--color-text-1))]',
            'outline-none placeholder:text-[hsl(var(--color-text-3))] focus:border-[hsl(var(--color-accent))]'
          )}
        />

        <div className="w-full overflow-x-auto scrollbar-hide md:w-auto">
          <div
            className={cn(
              'flex min-w-max items-center gap-1 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
              'bg-[hsl(var(--color-surface))] p-1'
            )}
          >
            {STATES.map((state) => {
              const active =
                (state === 'all' && !stateFilter) || stateFilter === state

              return (
                <button
                  key={state}
                  type="button"
                  onClick={() =>
                    navigate({
                      state: state === 'all' ? undefined : state,
                      q: query,
                    })
                  }
                  className={cn(
                    'min-h-[40px] rounded-[calc(var(--radius-md)-2px)] px-2.5 py-1 text-xs capitalize transition-all duration-150',
                    active
                      ? 'bg-[hsl(var(--color-surface-2))] font-medium text-[hsl(var(--color-text-1))]'
                      : 'text-[hsl(var(--color-text-3))] hover:text-[hsl(var(--color-text-2))]'
                  )}
                >
                  {state === 'in_review' ? 'In review' : state}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:hidden">
        {contracts.length === 0 ? (
          <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-4 py-10 text-center">
            <p className="text-sm text-[hsl(var(--color-text-3))]">
              No contracts found.
            </p>
          </div>
        ) : (
          contracts.map((contract) => (
            <Link
              key={contract.id}
              href={`/contracts/${contract.id}`}
              target="_blank"
              className={cn(
                'block rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4 transition-all duration-150',
                'hover:border-[hsl(var(--color-border-2))]'
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
                    {contract.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[hsl(var(--color-text-3))]">
                    {contract.ref_code}
                    {contract.initiator?.full_name
                      ? ` - ${contract.initiator.full_name}`
                      : ''}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <ContractStateBadge state={contract.state} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                  {formatCurrency(contract.total_value, contract.currency)}
                </span>
                <span className="text-xs text-[hsl(var(--color-text-3))]">
                  {formatRelative(contract.created_at)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      <div
        className={cn(
          'mb-4 hidden overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] md:block',
          'bg-[hsl(var(--color-surface))]'
        )}
      >
        <div className="overflow-x-auto">
          <div
            className={cn(
              'grid min-w-[760px] grid-cols-[1fr_120px_140px_120px_80px] items-center gap-4 border-b border-[hsl(var(--color-border))]',
              'bg-[hsl(var(--color-surface-2))] px-5 py-3'
            )}
          >
            {['Contract', 'State', 'Value', 'Created', ''].map((heading) => (
              <span
                key={heading}
                className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]"
              >
                {heading}
              </span>
            ))}
          </div>

          {contracts.length === 0 ? (
            <div className="min-w-[760px] py-12 text-center">
              <p className="text-sm text-[hsl(var(--color-text-3))]">
                No contracts found.
              </p>
            </div>
          ) : (
            contracts.map((contract) => (
              <div
                key={contract.id}
                className={cn(
                  'grid min-w-[760px] grid-cols-[1fr_120px_140px_120px_80px] items-center gap-4 border-b border-[hsl(var(--color-border))]',
                  'px-5 py-3.5 transition-colors duration-150 last:border-0 hover:bg-[hsl(var(--color-surface-2)/0.5)]'
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
                    {contract.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[hsl(var(--color-text-3))]">
                    {contract.ref_code}
                    {contract.initiator?.full_name
                      ? ` - ${contract.initiator.full_name}`
                      : ''}
                  </p>
                </div>
                <ContractStateBadge state={contract.state} />
                <span className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                  {formatCurrency(contract.total_value, contract.currency)}
                </span>
                <span className="text-xs text-[hsl(var(--color-text-3))]">
                  {formatRelative(contract.created_at)}
                </span>
                <Link
                  href={`/contracts/${contract.id}`}
                  target="_blank"
                  className={cn(
                    'inline-flex items-center gap-1 text-xs text-[hsl(var(--color-text-3))]',
                    'transition-colors hover:text-[hsl(var(--color-accent))]'
                  )}
                >
                  <ExternalLink size={12} />
                  View
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-[hsl(var(--color-text-3))]">
            Page {page} of {totalPages} - {total} results
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              leftIcon={<ChevronLeft size={14} />}
              onClick={() =>
                navigate({
                  state: stateFilter,
                  q: query,
                  page: String(page - 1),
                })
              }
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              rightIcon={<ChevronRight size={14} />}
              onClick={() =>
                navigate({
                  state: stateFilter,
                  q: query,
                  page: String(page + 1),
                })
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
