import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { Button } from './button'

// --- Inline SVG illustrations ---
function IllustrationContracts() {
  return (
    <svg width="80" height="64" viewBox="0 0 80 64" fill="none" aria-hidden>
      <rect x="12" y="8" width="40" height="48" rx="4" fill="hsl(var(--color-surface-2))" stroke="hsl(var(--color-border))" strokeWidth="1.5" />
      <rect x="20" y="20" width="24" height="2.5" rx="1.25" fill="hsl(var(--color-border-2))" />
      <rect x="20" y="27" width="18" height="2.5" rx="1.25" fill="hsl(var(--color-border-2))" />
      <rect x="20" y="34" width="21" height="2.5" rx="1.25" fill="hsl(var(--color-border-2))" />
      <rect x="28" y="16" width="46" height="40" rx="4" fill="hsl(var(--color-surface))" stroke="hsl(var(--color-border))" strokeWidth="1.5" />
      <rect x="36" y="24" width="22" height="2.5" rx="1.25" fill="hsl(var(--color-accent)/0.4)" />
      <rect x="36" y="31" width="16" height="2.5" rx="1.25" fill="hsl(var(--color-border-2))" />
      <rect x="36" y="38" width="19" height="2.5" rx="1.25" fill="hsl(var(--color-border-2))" />
      <circle cx="63" cy="48" r="8" fill="hsl(var(--color-accent)/0.12)" stroke="hsl(var(--color-accent)/0.4)" strokeWidth="1.5" />
      <path d="M60 48l2 2 4-4" stroke="hsl(var(--color-accent))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IllustrationTemplates() {
  return (
    <svg width="80" height="64" viewBox="0 0 80 64" fill="none" aria-hidden>
      <rect x="8" y="6" width="38" height="52" rx="4" fill="hsl(var(--color-surface-2))" stroke="hsl(var(--color-border))" strokeWidth="1.5" />
      <rect x="14" y="16" width="20" height="2" rx="1" fill="hsl(var(--color-border-2))" />
      <rect x="14" y="22" width="26" height="2" rx="1" fill="hsl(var(--color-border-2))" />
      <rect x="14" y="28" width="16" height="2" rx="1" fill="hsl(var(--color-border-2))" />
      <rect x="14" y="34" width="22" height="2" rx="1" fill="hsl(var(--color-border-2))" />
      <rect x="34" y="20" width="38" height="38" rx="4" fill="hsl(var(--color-surface))" stroke="hsl(var(--color-border))" strokeWidth="1.5" />
      <rect x="40" y="28" width="22" height="2" rx="1" fill="hsl(var(--color-accent)/0.5)" />
      <rect x="40" y="34" width="16" height="2" rx="1" fill="hsl(var(--color-border-2))" />
      <rect x="40" y="40" width="19" height="2" rx="1" fill="hsl(var(--color-border-2))" />
      <path d="M8 10 Q20 4 32 10" stroke="hsl(var(--color-accent)/0.3)" strokeWidth="1" fill="none" strokeDasharray="2 2" />
    </svg>
  )
}

function IllustrationActivity() {
  return (
    <svg width="80" height="64" viewBox="0 0 80 64" fill="none" aria-hidden>
      <rect x="8" y="8" width="64" height="12" rx="3" fill="hsl(var(--color-surface-2))" stroke="hsl(var(--color-border))" strokeWidth="1.5" />
      <circle cx="18" cy="14" r="4" fill="hsl(var(--color-accent)/0.2)" stroke="hsl(var(--color-accent)/0.4)" strokeWidth="1" />
      <rect x="27" y="12" width="24" height="2" rx="1" fill="hsl(var(--color-border-2))" />
      <rect x="27" y="16" width="14" height="1.5" rx="0.75" fill="hsl(var(--color-border))" />
      <rect x="8" y="26" width="64" height="12" rx="3" fill="hsl(var(--color-surface-2))" stroke="hsl(var(--color-border))" strokeWidth="1.5" />
      <circle cx="18" cy="32" r="4" fill="hsl(var(--color-success)/0.2)" stroke="hsl(var(--color-success)/0.4)" strokeWidth="1" />
      <rect x="27" y="30" width="20" height="2" rx="1" fill="hsl(var(--color-border-2))" />
      <rect x="27" y="34" width="10" height="1.5" rx="0.75" fill="hsl(var(--color-border))" />
      <rect x="8" y="44" width="64" height="12" rx="3" fill="hsl(var(--color-surface-2))" stroke="hsl(var(--color-border))" strokeWidth="1.5" opacity="0.5" />
      <circle cx="18" cy="50" r="4" fill="hsl(var(--color-border))" stroke="hsl(var(--color-border-2))" strokeWidth="1" />
      <rect x="27" y="48" width="16" height="2" rx="1" fill="hsl(var(--color-border))" />
    </svg>
  )
}

function IllustrationNotifications() {
  return (
    <svg width="80" height="64" viewBox="0 0 80 64" fill="none" aria-hidden>
      <path d="M40 8C26 8 18 18 18 28V40L12 46H68L62 40V28C62 18 54 8 40 8Z" fill="hsl(var(--color-surface-2))" stroke="hsl(var(--color-border))" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M34 46C34 49.314 36.686 52 40 52C43.314 52 46 49.314 46 46" stroke="hsl(var(--color-border-2))" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="58" cy="14" r="7" fill="hsl(var(--color-success)/0.15)" stroke="hsl(var(--color-success)/0.5)" strokeWidth="1.5" />
      <path d="M55 14l2 2 4-4" stroke="hsl(var(--color-success))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IllustrationGeneric() {
  return (
    <svg width="80" height="64" viewBox="0 0 80 64" fill="none" aria-hidden>
      <rect x="16" y="12" width="48" height="40" rx="6" fill="hsl(var(--color-surface-2))" stroke="hsl(var(--color-border))" strokeWidth="1.5" />
      <rect x="26" y="24" width="28" height="3" rx="1.5" fill="hsl(var(--color-accent)/0.3)" />
      <rect x="26" y="32" width="20" height="2.5" rx="1.25" fill="hsl(var(--color-border-2))" />
      <rect x="26" y="38" width="24" height="2.5" rx="1.25" fill="hsl(var(--color-border-2))" />
    </svg>
  )
}

const ILLUSTRATION_MAP: Record<string, React.FC> = {
  contracts: IllustrationContracts,
  templates: IllustrationTemplates,
  activity: IllustrationActivity,
  notifications: IllustrationNotifications,
}

interface EmptyStateProps {
  icon?: React.ReactNode
  illustration?: 'contracts' | 'templates' | 'activity' | 'notifications' | 'generic'
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
    icon?: React.ReactNode
  }
  className?: string
  size?: 'sm' | 'md'
}

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const Illustration = illustration
    ? ILLUSTRATION_MAP[illustration] ?? IllustrationGeneric
    : null

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        size === 'md' ? 'px-8 py-16' : 'px-4 py-8',
        className
      )}
    >
      {Illustration ? (
        <div className={cn('mb-4 opacity-80', size === 'md' ? 'mb-5' : 'mb-4')}>
          <Illustration />
        </div>
      ) : icon ? (
        <div
          className={cn(
            'flex items-center justify-center rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface-2))] text-[hsl(var(--color-text-3))]',
            size === 'md' ? 'mb-5 p-4' : 'mb-4 p-3'
          )}
        >
          {icon}
        </div>
      ) : null}

      <p
        className={cn(
          'mb-2 font-semibold text-[hsl(var(--color-text-1))]',
          size === 'md' ? 'text-base' : 'text-sm'
        )}
      >
        {title}
      </p>
      {description && (
        <p
          className={cn(
            'mb-6 max-w-sm leading-relaxed text-[hsl(var(--color-text-3))]',
            size === 'md' ? 'text-sm' : 'text-xs'
          )}
        >
          {description}
        </p>
      )}
      {action && (
        action.href ? (
          <Link href={action.href} className="inline-flex">
            <Button
              variant="secondary"
              size={size === 'md' ? 'md' : 'sm'}
              leftIcon={action.icon}
            >
              {action.label}
            </Button>
          </Link>
        ) : (
          <Button
            variant="secondary"
            size={size === 'md' ? 'md' : 'sm'}
            leftIcon={action.icon}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )
      )}
    </div>
  )
}
