'use client'

import { cn } from '@/lib/utils/cn'
import { getRepoProvider } from '@/lib/utils/preview'
import { Code, ExternalLink, GitBranch } from 'lucide-react'

interface CodeLinkPreviewProps {
  url: string
  className?: string
}

export function CodeLinkPreview({
  url,
  className,
}: CodeLinkPreviewProps) {
  const repo = getRepoProvider(url)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex min-h-[44px] items-center gap-4 rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
        'bg-[hsl(var(--color-surface))] p-4 transition-all duration-150',
        'hover:border-[hsl(var(--color-accent)/0.3)] hover:bg-[hsl(var(--color-surface-2)/0.3)]',
        className
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]',
          'bg-[hsl(var(--color-surface-2))] transition-colors duration-150',
          'group-hover:bg-[hsl(var(--color-accent)/0.1)]'
        )}
      >
        {repo ? (
          <span className="text-sm font-semibold text-[hsl(var(--color-text-2))]">
            {repo.icon}
          </span>
        ) : (
          <Code size={18} className="text-[hsl(var(--color-text-3))]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {repo ? (
          <>
            <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
              {repo.owner}/{repo.repo}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <GitBranch size={11} className="text-[hsl(var(--color-text-3))]" />
              <span className="text-[11px] text-[hsl(var(--color-text-3))]">
                {repo.provider}
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
              {url}
            </p>
            <p className="mt-0.5 text-[11px] text-[hsl(var(--color-text-3))]">
              Code repository
            </p>
          </>
        )}
      </div>

      <ExternalLink
        size={14}
        className={cn(
          'shrink-0 text-[hsl(var(--color-text-3))] transition-colors duration-150',
          'group-hover:text-[hsl(var(--color-accent))]'
        )}
      />
    </a>
  )
}
