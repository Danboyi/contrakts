import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { requireAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { cn } from '@/lib/utils/cn'
import { formatDateTime } from '@/lib/utils/format-date'

export const metadata = { title: 'Audit log - Admin' }

const EVENT_TYPES = [
  'all',
  'contract.created',
  'contract.signed',
  'contract.funded',
  'milestone.submitted',
  'milestone.approved',
  'payment.released',
  'payment.failed',
  'dispute.raised',
  'dispute.resolved',
  'contract.complete',
  'fraud.flagged',
] as const

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: { event?: string; page?: string }
}) {
  await requireAdmin('admin')

  const page = Math.max(1, Number.parseInt(searchParams.page ?? '1', 10))
  const limit = 50
  const from = (page - 1) * limit
  const to = from + limit - 1

  const supabaseAdmin = createAdminClient()
  let query = supabaseAdmin
    .from('audit_log')
    .select(
      `
        id,
        created_at,
        event_type,
        actor:users!actor_id(full_name, email),
        contract:contracts!contract_id(ref_code, title)
      `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (searchParams.event) {
    query = query.eq('event_type', searchParams.event)
  }

  const { data, count } = await query
  const events = (data ?? []) as unknown as Array<{
    id: string
    created_at: string
    event_type: string
    actor: { full_name: string; email: string } | null
    contract: { ref_code: string; title: string } | null
  }>

  function buildHref(nextPage: number, eventType?: string) {
    const params = new URLSearchParams()
    if (nextPage > 1) {
      params.set('page', String(nextPage))
    }
    if (eventType) {
      params.set('event', eventType)
    }
    const suffix = params.toString()
    return `/admin/audit${suffix ? `?${suffix}` : ''}`
  }

  return (
    <div>
      <PageHeader
        title="Audit log"
        subtitle={`${(count ?? 0).toLocaleString()} total events`}
      />

      <div
        className={cn(
          'mb-6 flex items-center gap-1 overflow-x-auto rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
          'bg-[hsl(var(--color-surface))] p-1'
        )}
      >
        {EVENT_TYPES.map((eventType) => {
          const active =
            (eventType === 'all' && !searchParams.event) ||
            searchParams.event === eventType

          return (
            <Link
              key={eventType}
              href={eventType === 'all' ? '/admin/audit' : `/admin/audit?event=${eventType}`}
              className={cn(
                'rounded-[calc(var(--radius-md)-2px)] px-2.5 py-1 text-xs whitespace-nowrap transition-all duration-150',
                active
                  ? 'bg-[hsl(var(--color-surface-2))] font-medium text-[hsl(var(--color-text-1))]'
                  : 'text-[hsl(var(--color-text-3))] hover:text-[hsl(var(--color-text-2))]'
              )}
            >
              {eventType === 'all' ? 'All events' : eventType}
            </Link>
          )
        })}
      </div>

      <div
        className={cn(
          'overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
          'bg-[hsl(var(--color-surface))]'
        )}
      >
        {events.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[hsl(var(--color-text-3))]">
              No events found.
            </p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={cn(
                'grid grid-cols-[180px_160px_1fr_160px] items-start gap-4 border-b border-[hsl(var(--color-border))]',
                'px-5 py-3.5 last:border-0'
              )}
            >
              <span className="text-xs font-mono font-medium text-[hsl(var(--color-accent))]">
                {event.event_type}
              </span>
              <span className="truncate text-xs text-[hsl(var(--color-text-2))]">
                {event.actor?.full_name ?? 'System'}
              </span>
              <span className="truncate text-xs text-[hsl(var(--color-text-3))]">
                {event.contract
                  ? `${event.contract.ref_code} - ${event.contract.title}`
                  : '-'}
              </span>
              <span className="text-right text-xs text-[hsl(var(--color-text-3))]">
                {formatDateTime(event.created_at)}
              </span>
            </div>
          ))
        )}
      </div>

      {(count ?? 0) > limit && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-[hsl(var(--color-text-3))]">
            Page {page} - {(count ?? 0).toLocaleString()} events
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref(page - 1, searchParams.event)}
                className={cn(
                  'rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]',
                  'px-3 py-1.5 text-xs text-[hsl(var(--color-text-2))] hover:border-[hsl(var(--color-border-2))]'
                )}
              >
                Previous
              </Link>
            )}
            {(count ?? 0) > page * limit && (
              <Link
                href={buildHref(page + 1, searchParams.event)}
                className={cn(
                  'rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]',
                  'px-3 py-1.5 text-xs text-[hsl(var(--color-text-2))] hover:border-[hsl(var(--color-border-2))]'
                )}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
