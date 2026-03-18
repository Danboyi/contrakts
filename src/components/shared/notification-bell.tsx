'use client'

import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Bell, CheckCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/hooks/use-notifications'
import { getNotificationConfig } from '@/lib/notifications/registry'
import { cn } from '@/lib/utils/cn'
import { formatRelative } from '@/lib/utils/format-date'
import type { Notification } from '@/types'

export function NotificationBell() {
  const router = useRouter()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)

  const recent = notifications.slice(0, 5)

  async function handleClick(notification: Notification) {
    if (!notification.read) {
      await markRead(notification.id)
    }

    const config = getNotificationConfig(notification.type)
    setOpen(false)
    router.push(config.route(notification.contract_id ?? undefined))
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className={cn(
            'relative inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]',
            'border border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface))] text-[hsl(var(--color-text-2))]',
            'transition-all duration-150',
            'hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent)/0.5)]'
          )}
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 border-[hsl(var(--color-bg))]',
                'bg-[hsl(var(--color-danger))] px-1 text-[9px] font-bold text-white'
              )}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 w-[380px] overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface-2))] shadow-[0_8px_32px_hsl(0_0%_0%/0.4)]',
            'outline-none data-[state=open]:animate-scale-in'
          )}
        >
          <div className="flex items-center justify-between border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[hsl(var(--color-danger)/0.12)] px-1.5 py-0.5 text-[10px] font-bold text-[hsl(var(--color-danger))]">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="flex items-center gap-1.5 text-xs text-[hsl(var(--color-text-3))] transition-colors duration-150 hover:text-[hsl(var(--color-text-2))]"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell size={22} className="mb-3 text-[hsl(var(--color-text-3))]" />
                <p className="mb-1 text-sm font-medium text-[hsl(var(--color-text-1))]">
                  All caught up
                </p>
                <p className="text-xs text-[hsl(var(--color-text-3))]">
                  No notifications yet.
                </p>
              </div>
            ) : (
              recent.map((notification) => {
                const config = getNotificationConfig(notification.type)
                const Icon = config.icon

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void handleClick(notification)}
                    className={cn(
                      'flex w-full items-start gap-3 border-b border-[hsl(var(--color-border))] px-4 py-3 text-left transition-all duration-150 last:border-0',
                      'hover:bg-[hsl(var(--color-surface))]',
                      !notification.read && [
                        'border-l-2 border-l-[hsl(var(--color-accent))]',
                        'bg-[hsl(var(--color-accent)/0.02)]',
                      ]
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        config.bg
                      )}
                    >
                      <Icon size={14} className={config.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-xs font-semibold leading-snug text-[hsl(var(--color-text-1))]">
                        {notification.title}
                      </p>
                      <p className="line-clamp-2 text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                        {notification.body}
                      </p>
                      <p className="mt-1 text-[11px] text-[hsl(var(--color-text-3))]">
                        {formatRelative(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--color-accent))]" />
                    )}
                  </button>
                )
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  router.push('/notifications')
                }}
                className="w-full py-3 text-xs font-medium text-[hsl(var(--color-text-3))] transition-colors duration-150 hover:text-[hsl(var(--color-text-2))]"
              >
                View all notifications
              </button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
