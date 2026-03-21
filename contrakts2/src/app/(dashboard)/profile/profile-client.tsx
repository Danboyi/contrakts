'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle,
  Clock,
  FileText,
  Minus,
  Shield,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile } from '@/lib/profile/actions'
import { AvatarUpload } from '@/components/shared/avatar-upload'
import { ContractStateBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@/components/ui/tabs'
import { TrustScoreCircle } from '@/components/ui/trust-score-circle'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatDate, formatRelative } from '@/lib/utils/format-date'
import type { Contract, User } from '@/types'

interface TrustFactor {
  label: string
  impact: number
  detail: string
  positive: boolean
}

interface TrustBreakdown {
  score: number
  factors: TrustFactor[]
  stats: {
    totalContracts: number
    completedContracts: number
    disputesAgainst: number
  }
}

interface ProfileClientProps {
  profile: User
  contracts: Array<
    Pick<
      Contract,
      'id' | 'ref_code' | 'title' | 'state' | 'currency' | 'total_value' | 'created_at'
    >
  >
  breakdown: TrustBreakdown | null
}

function KYCBadge({ status }: { status: string }) {
  const config = {
    unverified: {
      icon: AlertCircle,
      label: 'Unverified',
      color: 'text-[hsl(var(--color-text-3))]',
      bg: 'bg-[hsl(var(--color-surface-2))]',
      border: 'border-[hsl(var(--color-border))]',
    },
    pending: {
      icon: Clock,
      label: 'Verification pending',
      color: 'text-[hsl(var(--color-warning))]',
      bg: 'bg-[hsl(var(--color-warning)/0.1)]',
      border: 'border-[hsl(var(--color-warning)/0.2)]',
    },
    verified: {
      icon: CheckCircle,
      label: 'Verified',
      color: 'text-[hsl(var(--color-gold))]',
      bg: 'bg-[hsl(var(--color-gold)/0.1)]',
      border: 'border-[hsl(var(--color-gold)/0.2)]',
    },
  }[status] ?? {
    icon: AlertCircle,
    label: status,
    color: 'text-[hsl(var(--color-text-3))]',
    bg: 'bg-[hsl(var(--color-surface-2))]',
    border: 'border-[hsl(var(--color-border))]',
  }

  const Icon = config.icon

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-transform duration-200 hover:scale-105',
        config.bg,
        config.border,
        config.color
      )}
    >
      <Icon size={12} />
      {config.label}
    </div>
  )
}

function TrustFactorRow({
  label,
  impact,
  detail,
  positive,
}: TrustFactor) {
  const isZero = impact === 0
  const Icon = isZero ? Minus : impact > 0 ? TrendingUp : TrendingDown

  return (
    <div className="group flex items-center gap-4 border-b border-[hsl(var(--color-border))] py-3 transition-colors duration-200 last:border-0 hover:bg-[hsl(var(--color-surface-2)/0.3)]">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110',
          isZero
            ? 'bg-[hsl(var(--color-surface-2))]'
            : positive && impact > 0
              ? 'bg-[hsl(var(--color-success)/0.1)]'
              : 'bg-[hsl(var(--color-danger)/0.1)]'
        )}
      >
        <Icon
          size={14}
          className={cn(
            isZero
              ? 'text-[hsl(var(--color-text-3))]'
              : positive && impact > 0
                ? 'text-[hsl(var(--color-success))]'
                : 'text-[hsl(var(--color-danger))]'
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">{label}</p>
        <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">{detail}</p>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-sm font-semibold',
          isZero
            ? 'text-[hsl(var(--color-text-3))]'
            : impact > 0
              ? 'bg-[hsl(var(--color-success)/0.08)] text-[hsl(var(--color-success))]'
              : 'bg-[hsl(var(--color-danger)/0.08)] text-[hsl(var(--color-danger))]'
        )}
      >
        {impact > 0 ? '+' : ''}
        {impact}
      </span>
    </div>
  )
}

function EditProfileForm({ profile }: { profile: User }) {
  const router = useRouter()
  const [name, setName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const result = await updateProfile({
        full_name: name,
        phone: phone || undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Profile updated.')
      router.refresh()
    })
  }

  return (
    <div className="flex max-w-sm flex-col gap-4">
      <Input
        label="Full name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Input
        label="Phone number (optional)"
        type="tel"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="+1 234 567 8900"
      />
      <div>
        <Button loading={isPending} onClick={handleSave} size="sm">
          Save changes
        </Button>
      </div>
    </div>
  )
}

export function ProfileClient({
  profile,
  contracts,
  breakdown,
}: ProfileClientProps) {
  const [tab, setTab] = useState('overview')

  const totalContracts = breakdown?.stats.totalContracts ?? contracts.length
  const completedCount =
    breakdown?.stats.completedContracts ??
    contracts.filter((contract) => contract.state === 'complete').length
  const disputeCount = breakdown?.stats.disputesAgainst ?? profile.dispute_count
  const activeCount = contracts.filter((contract) =>
    ['active', 'funded', 'in_review', 'disputed'].includes(contract.state)
  ).length
  const recentContracts = contracts.slice(0, 3)

  return (
    <div className="mx-auto max-w-[720px]">
      {/* Profile hero card */}
      <div
        className={cn(
          'mb-6 overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
          'bg-[hsl(var(--color-surface))]'
        )}
      >
        {/* Gradient banner */}
        <div className="h-20 bg-gradient-to-r from-[hsl(var(--color-accent)/0.15)] via-[hsl(var(--color-accent-2)/0.1)] to-[hsl(var(--color-accent)/0.05)]" />

        <div className="px-6 pb-6">
          <div className="-mt-10 mb-5 flex items-end gap-5">
            <div className="rounded-full border-4 border-[hsl(var(--color-surface))] shadow-lg">
              <AvatarUpload
                userId={profile.id}
                name={profile.full_name}
                currentUrl={profile.avatar_url}
                size="lg"
              />
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <h1 className="text-xl font-bold leading-tight text-[hsl(var(--color-text-1))]">
                {profile.full_name}
              </h1>
              <p className="mt-1 text-sm text-[hsl(var(--color-text-3))]">{profile.email}</p>
            </div>

            <TrustScoreCircle score={breakdown?.score ?? profile.trust_score} size={100} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <KYCBadge status={profile.kyc_status} />
            {profile.kyc_status === 'unverified' && (
              <button
                className="text-xs font-medium text-[hsl(var(--color-accent))] transition-colors duration-200 hover:text-[hsl(var(--color-accent-hover))] hover:underline"
                onClick={() => toast.info('KYC verification coming soon.')}
              >
                Get verified
              </button>
            )}
          </div>

          <Separator className="my-5" />

          {/* Stats grid with enhanced cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                icon: FileText,
                label: 'Total contracts',
                value: totalContracts,
                color: 'text-[hsl(var(--color-accent))]',
                bg: 'bg-[hsl(var(--color-accent)/0.08)]',
              },
              {
                icon: CheckCircle,
                label: 'Completed',
                value: completedCount,
                color: 'text-[hsl(var(--color-success))]',
                bg: 'bg-[hsl(var(--color-success)/0.08)]',
              },
              {
                icon: AlertCircle,
                label: 'Disputes',
                value: disputeCount,
                color: disputeCount > 0 ? 'text-[hsl(var(--color-danger))]' : 'text-[hsl(var(--color-text-3))]',
                bg: disputeCount > 0 ? 'bg-[hsl(var(--color-danger)/0.08)]' : 'bg-[hsl(var(--color-surface-2))]',
                danger: disputeCount > 0,
              },
              {
                icon: CalendarDays,
                label: 'Member since',
                value: formatDate(profile.created_at),
                color: 'text-[hsl(var(--color-text-3))]',
                bg: 'bg-[hsl(var(--color-surface-2))]',
                small: true,
              },
            ].map(({ icon: Icon, label, value, color, bg, danger, small }) => (
              <div
                key={label}
                className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-border)/0.5)] bg-[hsl(var(--color-surface-2)/0.3)] p-3 text-center transition-all duration-200 hover:border-[hsl(var(--color-border))] hover:shadow-sm"
              >
                <div
                  className={cn(
                    'mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full',
                    bg
                  )}
                >
                  <Icon size={14} className={color} />
                </div>
                <p
                  className={cn(
                    'mb-1 font-semibold leading-none',
                    small ? 'text-xs' : 'text-lg',
                    danger && 'text-[hsl(var(--color-danger))]'
                  )}
                >
                  {value}
                </p>
                <p className="text-[11px] text-[hsl(var(--color-text-3))]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contracts">
            Contracts
            {contracts.length > 0 && (
              <span
                className={cn(
                  'ml-1.5 rounded-full bg-[hsl(var(--color-accent)/0.1)] px-1.5 py-0.5 text-[10px] font-semibold',
                  'text-[hsl(var(--color-accent))]'
                )}
              >
                {contracts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="edit">Edit profile</TabsTrigger>
        </TabsList>

        <TabsPanel value="overview">
          <div id="overview" className="space-y-5">
            {/* Trust score breakdown */}
            <div
              className={cn(
                'rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
                'bg-[hsl(var(--color-surface))] p-5 transition-shadow duration-200 hover:shadow-card'
              )}
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <TrustScoreCircle
                  score={breakdown?.score ?? profile.trust_score}
                  size={140}
                  className="shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <h2 className="mb-1 text-sm font-semibold text-[hsl(var(--color-text-1))]">
                    Trust score breakdown
                  </h2>
                  <p className="mb-4 text-xs text-[hsl(var(--color-text-3))]">
                    Your score affects how counterparties perceive you before agreeing
                    to a contract.
                  </p>
                  {(breakdown?.factors ?? []).map((factor) => (
                    <TrustFactorRow key={factor.label} {...factor} />
                  ))}
                </div>
              </div>
            </div>

            {/* KYC promotion */}
            {profile.kyc_status === 'unverified' && (
              <div
                className={cn(
                  'group flex items-start gap-4 rounded-[var(--radius-lg)] border border-[hsl(var(--color-gold)/0.2)]',
                  'bg-[hsl(var(--color-gold)/0.05)] p-4 transition-all duration-200',
                  'hover:border-[hsl(var(--color-gold)/0.3)] hover:shadow-[0_0_20px_hsl(var(--color-gold)/0.06)]'
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110',
                    'bg-[hsl(var(--color-gold)/0.12)]'
                  )}
                >
                  <Shield size={16} className="text-[hsl(var(--color-gold))]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-sm font-medium text-[hsl(var(--color-gold))]">
                    Verify your identity - earn +10 trust points
                  </p>
                  <p className="mb-3 text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                    KYC verification increases your trust score, unlocks higher
                    contract limits, and shows a verified badge on your profile and
                    contracts.
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toast.info('KYC verification coming soon.')}
                  >
                    Start verification
                  </Button>
                </div>
              </div>
            )}

            {/* Active contracts indicator */}
            {activeCount > 0 && (
              <div
                className={cn(
                  'flex items-center justify-between rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
                  'bg-[hsl(var(--color-surface))] p-4 transition-all duration-200 hover:shadow-card'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--color-success))] shadow-[0_0_8px_hsl(var(--color-success)/0.4)] animate-pulse-soft" />
                  <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                    {activeCount} active contract{activeCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <Link
                  href="/contracts"
                  className="text-xs font-medium text-[hsl(var(--color-accent))] transition-colors duration-200 hover:text-[hsl(var(--color-accent-hover))] hover:underline"
                >
                  View all
                </Link>
              </div>
            )}

            {/* Recent contracts */}
            {recentContracts.length > 0 && (
              <div
                className={cn(
                  'rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
                  'bg-[hsl(var(--color-surface))] p-5 transition-shadow duration-200 hover:shadow-card'
                )}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                      Recent activity
                    </h2>
                    <p className="mt-1 text-xs text-[hsl(var(--color-text-3))]">
                      Your latest contract movement on Contrakts.
                    </p>
                  </div>
                  <Link
                    href="/contracts"
                    className="text-xs font-medium text-[hsl(var(--color-accent))] transition-colors duration-200 hover:text-[hsl(var(--color-accent-hover))]"
                  >
                    View all
                  </Link>
                </div>
                <div className="flex flex-col gap-3">
                  {recentContracts.map((contract, index) => (
                    <Link
                      key={contract.id}
                      href={`/contracts/${contract.id}`}
                      className={cn(
                        'group flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
                        'bg-[hsl(var(--color-surface-2))] p-4 transition-all duration-200',
                        'hover:-translate-y-0.5 hover:border-[hsl(var(--color-border-2))] hover:shadow-card'
                      )}
                      style={{
                        animationDelay: `${index * 60}ms`,
                      }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
                          {contract.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">
                          {contract.ref_code} &middot; {formatRelative(contract.created_at)}
                        </p>
                      </div>
                      <ContractStateBadge state={contract.state} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsPanel>

        <TabsPanel value="contracts">
          {contracts.length === 0 ? (
            <div
              className={cn(
                'flex flex-col items-center rounded-[var(--radius-xl)] border border-dashed border-[hsl(var(--color-border))]',
                'bg-[hsl(var(--color-surface)/0.5)] py-16 text-center'
              )}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--color-surface-2))]">
                <FileText size={22} className="text-[hsl(var(--color-text-3))]" />
              </div>
              <p className="mb-1 text-sm font-medium text-[hsl(var(--color-text-1))]">
                No contracts yet
              </p>
              <p className="text-xs text-[hsl(var(--color-text-3))]">
                Create your first contract to get started.
              </p>
            </div>
          ) : (
            <div
              className={cn(
                'overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
                'bg-[hsl(var(--color-surface))]'
              )}
            >
              {contracts.map((contract) => (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className={cn(
                    'group flex items-center gap-4 border-b border-[hsl(var(--color-border))] px-5 py-4',
                    'last:border-0 transition-all duration-200 hover:bg-[hsl(var(--color-surface-2)/0.5)]'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))] transition-colors duration-200 group-hover:text-[hsl(var(--color-accent))]">
                      {contract.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">
                      {contract.ref_code} &middot; {formatRelative(contract.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                      {formatCurrency(contract.total_value, contract.currency)}
                    </span>
                    <ContractStateBadge state={contract.state} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsPanel>

        <TabsPanel value="edit">
          <div
            className={cn(
              'rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
              'bg-[hsl(var(--color-surface))] p-5'
            )}
          >
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                Personal information
              </h2>
              <p className="mt-1 text-xs text-[hsl(var(--color-text-3))]">
                Update the details counterparties see when they review your profile.
              </p>
            </div>
            <EditProfileForm profile={profile} />
          </div>
        </TabsPanel>
      </Tabs>
    </div>
  )
}
