'use client'

import { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { useNotifications } from '@/hooks/use-notifications'
import { getNotificationConfig } from '@/lib/notifications/registry'
import { cn } from '@/lib/utils/cn'
import { formatRelative } from '@/lib/utils/format-date'
import type { Notification } from '@/types'

type FilterTab = 'all' | 'unread' | 'contracts' | 'payments' | 'disputes'

const FILTER_TABS: Array<{ value: FilterTab; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'payments', label: 'Payments' },
  { value: 'disputes', label: 'Disputes' },
]

const FILTER_TYPES: Record<FilterTab, string[]> = {
  all: [],
  unread: [],
  contracts: ['contract_invite', 'counterparty_signed', 'contract_funded', 'contract_complete'],
  payments: ['payment_released', 'payment_failed', 'bank_details_needed', 'transfer_failed'],
  disputes: ['dispute_raised', 'dispute_resolved'],
}

export default function NotificationsPage() {
  const router = useRouter()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [tab, setTab] = useState<FilterTab>('all')

  const filtered = notifications.filter((notification) => {
    if (tab === 'unread') {
      return !notification.read
    }

    if (tab === 'all') {
      return true
    }

    return FILTER_TYPES[tab].includes(notification.type)
  })

  async function handleClick(notification: Notification) {
    if (!notification.read) {
      await markRead(notification.id)
    }

    const config = getNotificationConfig(notification.type)
    router.push(config.route(notification.contract_id ?? undefined))
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        actions={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CheckCheck size={14} />}
              onClick={() => void markAllRead()}
            >
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 flex items-center gap-1 overflow-x-auto rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-1">
        {FILTER_TABS.map((filter) => {
          const isActive = tab === filter.value
          const count =
            filter.value === 'all'
              ? notifications.length
              : filter.value === 'unread'
                ? unreadCount
                : notifications.filter((notification) =>
                    FILTER_TYPES[filter.value].includes(notification.type)
                  ).length

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setTab(filter.value)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-[calc(var(--radius-md)-2px)] px-3 py-1.5 text-sm transition-all duration-150',
                isActive
                  ? 'bg-[hsl(var(--color-surface-2))] font-medium text-[hsl(var(--color-text-1))] shadow-sm'
                  : 'text-[hsl(var(--color-text-3))] hover:text-[hsl(var(--color-text-2))]'
              )}
            >
              {filter.label}
              {count > 0 && (
                <span
                  className={cn(
                    'min-w-[18px] rounded-full px-1 py-0.5 text-center text-[10px] font-medium',
                    isActive
                      ? 'bg-[hsl(var(--color-border-2))] text-[hsl(var(--color-text-2))]'
                      : 'bg-[hsl(var(--color-surface-2))] text-[hsl(var(--color-text-3))]'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          illustration="notifications"
          title="No notifications"
          description={
            tab === 'unread'
              ? 'You have no unread notifications.'
              : 'No notifications in this category yet.'
          }
          size="md"
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]">
          {filtered.map((notification) => {
            const config = getNotificationConfig(notification.type)
            const Icon = config.icon

            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => void handleClick(notification)}
                className={cn(
                  'flex w-full items-start gap-4 border-b border-[hsl(var(--color-border))] px-5 py-4 text-left transition-all duration-150 last:border-0',
                  'hover:bg-[hsl(var(--color-surface-2)/0.5)]',
                  !notification.read && [
                    'border-l-2 border-l-[hsl(var(--color-accent))]',
                    'bg-[hsl(var(--color-accent)/0.02)]',
                  ]
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    config.bg
                  )}
                >
                  <Icon size={16} className={config.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-semibold leading-snug text-[hsl(var(--color-text-1))]">
                      {notification.title}
                    </p>
                    <p className="mt-0.5 shrink-0 text-xs text-[hsl(var(--color-text-3))]">
                      {formatRelative(notification.created_at)}
                    </p>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                    {notification.body}
                  </p>
                </div>
                {!notification.read && (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--color-accent))]" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
