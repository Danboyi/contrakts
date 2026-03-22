'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  contracts: 'Contracts',
  templates: 'Templates',
  notifications: 'Notifications',
  profile: 'Profile',
  settings: 'Settings',
  developers: 'Developers',
  new: 'New',
  edit: 'Edit',
  review: 'Review',
  drafts: 'Drafts',
  active: 'Active',
  archived: 'Archived',
}

function formatSegment(segment: string): string {
  if (routeLabels[segment]) return routeLabels[segment]
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

interface BreadcrumbsProps {
  /** Override the label of the last segment (e.g. contract title) */
  currentLabel?: string
  className?: string
}

export function Breadcrumbs({ currentLabel, className }: BreadcrumbsProps) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1.5 text-xs', className)}
    >
      <Link
        href="/dashboard"
        className={cn(
          'flex items-center rounded-[var(--radius-md)] p-0.5 text-[hsl(var(--color-text-3))]',
          'transition-colors duration-150 hover:text-[hsl(var(--color-text-1))]'
        )}
      >
        <Home size={13} />
      </Link>

      {segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/')
        const isLast = index === segments.length - 1
        const label = isLast && currentLabel
          ? currentLabel
          : formatSegment(segment)

        return (
          <span key={href} className="flex items-center gap-1.5">
            <ChevronRight
              size={12}
              className="shrink-0 text-[hsl(var(--color-text-3))]"
            />
            {isLast ? (
              <span className="font-medium text-[hsl(var(--color-text-1))]">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className={cn(
                  'rounded-[var(--radius-md)] text-[hsl(var(--color-text-3))]',
                  'transition-colors duration-150 hover:text-[hsl(var(--color-text-1))]'
                )}
              >
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
