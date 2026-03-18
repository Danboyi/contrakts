'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import { toast } from 'sonner'
import { createFraudFlag } from '@/lib/admin/actions'
import { PageHeader } from '@/components/shared/page-header'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { TrustScore } from '@/components/ui/trust-score'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/format-date'

const KYC_FILTERS = ['all', 'unverified', 'pending', 'verified'] as const

export function AdminUsersClient({
  users,
  total,
  page,
  limit,
  query,
  kycFilter,
}: {
  users: Array<{
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    kyc_status: string
    trust_score: number
    total_contracts: number
    created_at: string
  }>
  total: number
  page: number
  limit: number
  query?: string
  kycFilter?: string
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<{
    id: string
    full_name: string
  } | null>(null)
  const [flagReason, setFlagReason] = useState('')
  const [isPending, startTransition] = useTransition()

  const totalPages = Math.max(1, Math.ceil(total / limit))

  function navigate(params: {
    q?: string
    kyc?: string
    page?: string
  }) {
    const searchParams = new URLSearchParams()

    if (params.q) {
      searchParams.set('q', params.q)
    }
    if (params.kyc) {
      searchParams.set('kyc', params.kyc)
    }
    if (params.page && params.page !== '1') {
      searchParams.set('page', params.page)
    }

    const suffix = searchParams.toString()
    router.push(`/admin/users${suffix ? `?${suffix}` : ''}`)
  }

  function handleFlag() {
    if (!selected || !flagReason.trim()) {
      return
    }

    startTransition(async () => {
      const result = await createFraudFlag({
        userId: selected.id,
        reason: flagReason,
        severity: 'medium',
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('User flagged for review.')
      setSelected(null)
      setFlagReason('')
      router.refresh()
    })
  }

  return (
    <div>
      <PageHeader
        title="User management"
        subtitle={`${total.toLocaleString()} registered users`}
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          defaultValue={query}
          placeholder="Search by name or email..."
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              navigate({
                q: (event.target as HTMLInputElement).value || undefined,
                kyc: kycFilter,
              })
            }
          }}
          className={cn(
            'h-9 w-full max-w-sm rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface-2))] px-3 text-sm text-[hsl(var(--color-text-1))]',
            'outline-none placeholder:text-[hsl(var(--color-text-3))] focus:border-[hsl(var(--color-accent))]'
          )}
        />

        <div
          className={cn(
            'flex items-center gap-1 overflow-x-auto rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface))] p-1'
          )}
        >
          {KYC_FILTERS.map((filter) => {
            const active =
              (filter === 'all' && !kycFilter) || filter === kycFilter

            return (
              <button
                key={filter}
                type="button"
                onClick={() =>
                  navigate({
                    q: query,
                    kyc: filter === 'all' ? undefined : filter,
                  })
                }
                className={cn(
                  'rounded-[calc(var(--radius-md)-2px)] px-2.5 py-1 text-xs capitalize transition-all duration-150',
                  active
                    ? 'bg-[hsl(var(--color-surface-2))] font-medium text-[hsl(var(--color-text-1))]'
                    : 'text-[hsl(var(--color-text-3))] hover:text-[hsl(var(--color-text-2))]'
                )}
              >
                {filter}
              </button>
            )
          })}
        </div>
      </div>

      <div
        className={cn(
          'mb-4 overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
          'bg-[hsl(var(--color-surface))]'
        )}
      >
        <div
          className={cn(
            'grid grid-cols-[1fr_100px_80px_90px_110px_60px] items-center gap-4 border-b border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface-2))] px-5 py-3'
          )}
        >
          {['User', 'KYC', 'Trust', 'Contracts', 'Joined', ''].map((heading) => (
            <span
              key={heading}
              className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]"
            >
              {heading}
            </span>
          ))}
        </div>

        {users.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[hsl(var(--color-text-3))]">
              No users found.
            </p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className={cn(
                'grid grid-cols-[1fr_100px_80px_90px_110px_60px] items-center gap-4 border-b border-[hsl(var(--color-border))]',
                'px-5 py-3.5 transition-colors duration-150 last:border-0 hover:bg-[hsl(var(--color-surface-2)/0.5)]'
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
                    {user.full_name}
                  </p>
                  <p className="truncate text-xs text-[hsl(var(--color-text-3))]">
                    {user.email}
                  </p>
                </div>
              </div>

              <Badge
                variant={
                  user.kyc_status === 'verified'
                    ? 'gold'
                    : user.kyc_status === 'pending'
                      ? 'warning'
                      : 'default'
                }
                size="sm"
              >
                {user.kyc_status}
              </Badge>

              <TrustScore score={user.trust_score} size="sm" />

              <span className="text-sm text-[hsl(var(--color-text-1))]">
                {user.total_contracts}
              </span>

              <span className="text-xs text-[hsl(var(--color-text-3))]">
                {formatDate(user.created_at)}
              </span>

              <button
                type="button"
                onClick={() =>
                  setSelected({ id: user.id, full_name: user.full_name })
                }
                className={cn(
                  'rounded-[var(--radius-sm)] p-1.5 text-[hsl(var(--color-text-3))] transition-all duration-150',
                  'hover:bg-[hsl(var(--color-danger)/0.08)] hover:text-[hsl(var(--color-danger))]'
                )}
                title="Flag user"
              >
                <Flag size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[hsl(var(--color-text-3))]">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              leftIcon={<ChevronLeft size={14} />}
              onClick={() =>
                navigate({
                  q: query,
                  kyc: kycFilter,
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
                  q: query,
                  kyc: kycFilter,
                  page: String(page + 1),
                })
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null)
            setFlagReason('')
          }
        }}
        title={selected ? `Flag ${selected.full_name}` : 'Flag user'}
        description="Add a note about why this user should be reviewed."
        size="sm"
      >
        <textarea
          value={flagReason}
          onChange={(event) => setFlagReason(event.target.value)}
          rows={4}
          placeholder="Describe the suspicious behaviour or reason for flagging..."
          className={cn(
            'w-full resize-none rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface))] px-3 py-2.5 text-sm text-[hsl(var(--color-text-1))]',
            'outline-none placeholder:text-[hsl(var(--color-text-3))] focus:border-[hsl(var(--color-accent))]'
          )}
        />
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setSelected(null)
              setFlagReason('')
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={isPending}
            disabled={!flagReason.trim()}
            onClick={handleFlag}
            leftIcon={<Flag size={14} />}
          >
            Flag user
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
