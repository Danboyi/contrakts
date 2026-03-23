'use client'

import { useEffect, useMemo, useState } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils/cn'
import { PreviewToolbar } from './preview-toolbar'
import { Download, ExternalLink, FileText } from 'lucide-react'

interface FilePreviewProps {
  url: string
  name: string
  type: string
  className?: string
}

function isTextLike(type: string) {
  return (
    type.startsWith('text/') ||
    [
      'application/json',
      'application/xml',
      'application/javascript',
      'application/typescript',
    ].includes(type)
  )
}

export function FilePreview({
  url,
  name,
  type,
  className,
}: FilePreviewProps) {
  const [textContent, setTextContent] = useState<string | null>(null)
  const [loadingText, setLoadingText] = useState(false)
  const [textError, setTextError] = useState(false)
  const textLike = useMemo(() => isTextLike(type), [type])

  useEffect(() => {
    if (!textLike) {
      setTextContent(null)
      setLoadingText(false)
      setTextError(false)
      return
    }

    const controller = new AbortController()

    async function loadTextPreview() {
      setLoadingText(true)
      setTextError(false)

      try {
        const response = await fetch(url, { signal: controller.signal })
        const text = await response.text()
        setTextContent(text.slice(0, 8000))
      } catch {
        if (!controller.signal.aborted) {
          setTextError(true)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingText(false)
        }
      }
    }

    void loadTextPreview()

    return () => controller.abort()
  }, [textLike, url])

  const actions = (
    <>
      <a
        href={url}
        download={name}
        className="rounded-[var(--radius-sm)] p-1.5 text-[hsl(var(--color-text-3))] transition-colors hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]"
        title="Download"
      >
        <Download size={13} />
      </a>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-[var(--radius-sm)] p-1.5 text-[hsl(var(--color-text-3))] transition-colors hover:bg-[hsl(var(--color-surface-2))] hover:text-[hsl(var(--color-text-1))]"
        title="Open in new tab"
      >
        <ExternalLink size={13} />
      </a>
    </>
  )

  if (type === 'application/pdf') {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]',
          className
        )}
      >
        <PreviewToolbar
          left={
            <div className="flex min-w-0 items-center gap-2">
              <FileText
                size={14}
                className="shrink-0 text-[hsl(var(--color-text-3))]"
              />
              <span className="truncate text-xs text-[hsl(var(--color-text-2))]">
                {name}
              </span>
            </div>
          }
          right={actions}
        />
        <iframe
          src={`${url}#toolbar=0`}
          title={name}
          className="w-full border-0"
          style={{ height: '500px' }}
        />
      </div>
    )
  }

  if (textLike) {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]',
          className
        )}
      >
        <PreviewToolbar
          left={
            <div className="flex min-w-0 items-center gap-2">
              <FileText
                size={14}
                className="shrink-0 text-[hsl(var(--color-text-3))]"
              />
              <span className="truncate text-xs text-[hsl(var(--color-text-2))]">
                {name}
              </span>
            </div>
          }
          right={actions}
        />

        <div className="max-h-[420px] overflow-auto bg-[hsl(var(--color-bg))] p-4">
          {loadingText ? (
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--color-text-3))]">
              <Spinner size="sm" />
              Loading text preview...
            </div>
          ) : textError ? (
            <p className="text-sm text-[hsl(var(--color-text-3))]">
              Text preview is not available for this file. Use download or open
              in a new tab.
            </p>
          ) : (
            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-[hsl(var(--color-text-2))]">
              {textContent}
            </pre>
          )}
        </div>
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex min-h-[44px] items-center gap-3 rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
        'bg-[hsl(var(--color-surface))] p-4 transition-colors duration-150',
        'hover:border-[hsl(var(--color-border-2))]',
        className
      )}
    >
      <FileText
        size={18}
        className="shrink-0 text-[hsl(var(--color-text-3))]"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
          {name}
        </p>
      </div>
      <Download
        size={14}
        className="shrink-0 text-[hsl(var(--color-text-3))]"
      />
    </a>
  )
}
