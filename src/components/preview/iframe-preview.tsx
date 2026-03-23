'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { isEmbeddableUrl } from '@/lib/utils/preview'
import { PreviewToolbar } from './preview-toolbar'
import {
  AlertTriangle,
  ExternalLink,
  Maximize2,
  Minimize2,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
} from 'lucide-react'

interface IframePreviewProps {
  url: string
  title?: string
  className?: string
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile'

const VIEWPORT_WIDTHS: Record<ViewportSize, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

export function IframePreview({
  url,
  title,
  className,
}: IframePreviewProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const embeddable = useMemo(() => isEmbeddableUrl(url), [url])

  useEffect(() => {
    setLoading(true)
  }, [url, refreshKey])

  useEffect(() => {
    if (!isFullscreen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  if (!embeddable) {
    return (
      <div
        className={cn(
          'rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
          'bg-[hsl(var(--color-surface))] p-5',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={16}
            className="mt-0.5 shrink-0 text-[hsl(var(--color-warning))]"
          />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-sm font-medium text-[hsl(var(--color-text-1))]">
              Preview not available
            </p>
            <p className="mb-3 text-xs text-[hsl(var(--color-text-2))]">
              This site does not allow embedded previews. Open it directly to
              review the work.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-md)]',
                'bg-[hsl(var(--color-accent))] px-4 py-2.5 text-sm font-semibold text-white',
                'transition-all duration-150 hover:brightness-110 active:scale-[0.98]'
              )}
            >
              <ExternalLink size={14} />
              Open in new tab
            </a>
          </div>
        </div>
      </div>
    )
  }

  const viewportButtons = [
    { size: 'desktop' as const, icon: Monitor },
    { size: 'tablet' as const, icon: Tablet },
    { size: 'mobile' as const, icon: Smartphone },
  ]

  return (
    <div
      className={cn(
        isFullscreen
          ? 'fixed inset-0 z-50 flex flex-col bg-[hsl(var(--color-bg))]'
          : 'overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]',
        className
      )}
    >
      <PreviewToolbar
        left={
          <div
            className={cn(
              'flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-md)]',
              'border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-2.5 py-1.5'
            )}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--color-success))]" />
            <span className="truncate text-[11px] text-[hsl(var(--color-text-3))]">
              {url}
            </span>
          </div>
        }
        center={viewportButtons.map(({ size, icon: Icon }) => (
          <button
            key={size}
            type="button"
            onClick={() => setViewport(size)}
            className={cn(
              'rounded-[var(--radius-sm)] p-1.5 transition-colors duration-150',
              viewport === size
                ? 'bg-[hsl(var(--color-accent)/0.1)] text-[hsl(var(--color-accent))]'
                : 'text-[hsl(var(--color-text-3))] hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]'
            )}
            title={size}
          >
            <Icon size={14} />
          </button>
        ))}
        right={
          <>
            <button
              type="button"
              onClick={() => setRefreshKey((current) => current + 1)}
              className="rounded-[var(--radius-sm)] p-1.5 text-[hsl(var(--color-text-3))] transition-colors hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen((current) => !current)}
              className="rounded-[var(--radius-sm)] p-1.5 text-[hsl(var(--color-text-3))] transition-colors hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[var(--radius-sm)] p-1.5 text-[hsl(var(--color-text-3))] transition-colors hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]"
              title="Open in new tab"
            >
              <ExternalLink size={14} />
            </a>
          </>
        }
      />

      <div
        className={cn(
          'flex flex-1 items-start justify-center overflow-auto bg-[hsl(var(--color-bg))]',
          isFullscreen ? 'p-4' : 'min-h-[400px] max-h-[600px] p-3'
        )}
      >
        <div
          className={cn(
            'relative h-full max-w-full shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
            'bg-white shadow-lg transition-all duration-300'
          )}
          style={{ width: VIEWPORT_WIDTHS[viewport] }}
        >
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--color-surface))]">
              <div className="flex flex-col items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[hsl(var(--color-accent))] border-t-transparent" />
                <span className="text-xs text-[hsl(var(--color-text-3))]">
                  Loading preview...
                </span>
              </div>
            </div>
          ) : null}

          <iframe
            key={`${url}-${refreshKey}`}
            src={url}
            title={title ?? 'Preview'}
            className={cn('h-full w-full border-0', loading && 'opacity-0')}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            onLoad={() => setLoading(false)}
          />
        </div>
      </div>

      {isFullscreen ? (
        <div className="border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-3">
          <Button
            variant="secondary"
            onClick={() => setIsFullscreen(false)}
            className="w-full"
          >
            Exit fullscreen
          </Button>
        </div>
      ) : null}
    </div>
  )
}
