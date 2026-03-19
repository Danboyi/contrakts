import { notFound } from 'next/navigation'
import { AlertCircle, CheckCircle, FileText } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TrustScoreCircle } from '@/components/ui/trust-score-circle'
import { getTrustBreakdown } from '@/lib/profile/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/supabase/config'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/format-date'

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}) {
  if (!isUuid(params.id) || !isSupabaseAdminConfigured()) {
    return { title: 'Profile' }
  }

  const supabaseAdmin = createAdminClient()
  const { data } = await supabaseAdmin
    .from('users')
    .select('full_name')
    .eq('id', params.id)
    .maybeSingle()

  return { title: data?.full_name ?? 'Profile' }
}

function getKycBadge(status: string) {
  const config = {
    verified: { label: 'Verified', variant: 'gold' as const },
    pending: { label: 'Verification pending', variant: 'warning' as const },
    unverified: { label: 'Unverified', variant: 'default' as const },
  }

  return config[status as keyof typeof config] ?? config.unverified
}

export default async function PublicProfilePage({
  params,
}: {
  params: { id: string }
}) {
  if (!isUuid(params.id) || !isSupabaseAdminConfigured()) {
    notFound()
  }

  const supabaseAdmin = createAdminClient()
  const [profileData, breakdown] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select(
        'id, full_name, avatar_url, trust_score, kyc_status, total_contracts, completed_count, dispute_count, created_at'
      )
      .eq('id', params.id)
      .maybeSingle(),
    getTrustBreakdown(params.id),
  ])

  const profile = profileData.data
  if (!profile) {
    notFound()
  }

  const kycBadge = getKycBadge(profile.kyc_status)

  return (
    <div className="mx-auto max-w-[560px] px-6 py-10 md:px-8">
      <div
        className={cn(
          'rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
          'bg-[hsl(var(--color-surface))] p-6'
        )}
      >
        <div className="mb-6 flex items-center gap-5">
          <Avatar
            name={profile.full_name}
            src={profile.avatar_url}
            size="xl"
            verified={profile.kyc_status === 'verified'}
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-[hsl(var(--color-text-1))]">
              {profile.full_name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={kycBadge.variant} size="sm">
                {kycBadge.label}
              </Badge>
              <span className="text-xs text-[hsl(var(--color-text-3))]">
                Member since {formatDate(profile.created_at)}
              </span>
            </div>
          </div>
          <TrustScoreCircle
            score={breakdown?.score ?? profile.trust_score}
            size={80}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: FileText,
              label: 'Contracts',
              value: breakdown?.stats.totalContracts ?? profile.total_contracts,
            },
            {
              icon: CheckCircle,
              label: 'Completed',
              value: breakdown?.stats.completedContracts ?? profile.completed_count,
              color:
                (breakdown?.stats.completedContracts ?? profile.completed_count) > 0
                  ? 'text-[hsl(var(--color-success))]'
                  : undefined,
            },
            {
              icon: AlertCircle,
              label: 'Disputes',
              value: breakdown?.stats.disputesAgainst ?? profile.dispute_count,
              color:
                (breakdown?.stats.disputesAgainst ?? profile.dispute_count) > 0
                  ? 'text-[hsl(var(--color-danger))]'
                  : undefined,
            },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className={cn(
                'flex flex-col items-center rounded-[var(--radius-lg)] bg-[hsl(var(--color-surface-2))] p-3 text-center'
              )}
            >
              <Icon
                size={16}
                className={cn('mb-1.5', color ?? 'text-[hsl(var(--color-text-3))]')}
              />
              <span
                className={cn(
                  'mb-1 text-lg font-semibold leading-none',
                  color ?? 'text-[hsl(var(--color-text-1))]'
                )}
              >
                {value}
              </span>
              <span className="text-[11px] text-[hsl(var(--color-text-3))]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
