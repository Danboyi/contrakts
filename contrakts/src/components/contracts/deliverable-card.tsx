'use client'

import { useTransition } from 'react'
import { getDeliverableUrl } from '@/lib/milestones/actions'
import { cn } from '@/lib/utils/cn'
import {
  Archive,
  Download,
  File,
  FileText,
  Film,
  Image,
  Loader2,
  Music,
} from 'lucide-react'

interface DeliverableCardProps {
  deliverable: {
    id: string
    file_url: string | null
    file_name: string | null
    file_type: string | null
    note: string | null
    created_at: string
  }
}

function getIcon(type: string | null) {
  if (!type) {
    return File
  }

  if (type.startsWith('image/')) {
    return Image
  }

  if (type.startsWith('video/')) {
    return Film
  }

  if (type.startsWith('audio/')) {
    return Music
  }

  if (type.includes('pdf')) {
    return FileText
  }

  if (type.includes('zip')) {
    return Archive
  }

  return File
}

export function DeliverableCard({ deliverable }: DeliverableCardProps) {
  const [loading, startTransition] = useTransition()

  function handleDownload() {
    const fileUrl = deliverable.file_url

    if (!fileUrl) {
      return
    }

    startTransition(async () => {
      const result = await getDeliverableUrl(fileUrl)

      if (result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer')
      }
    })
  }

  if (!deliverable.file_url && deliverable.note) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
          Delivery note
        </p>
        <p className="text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
          {deliverable.note}
        </p>
      </div>
    )
  }

  const Icon = getIcon(deliverable.file_type)

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[hsl(var(--color-surface))]">
        <Icon size={16} className="text-[hsl(var(--color-text-3))]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
          {deliverable.file_name ?? 'File'}
        </p>
        {deliverable.note && (
          <p className="mt-0.5 truncate text-xs text-[hsl(var(--color-text-3))]">
            {deliverable.note}
          </p>
        )}
      </div>

      {deliverable.file_url && (
        <button
          type="button"
          onClick={handleDownload}
          disabled={loading}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-2.5 py-1.5 text-xs font-medium text-[hsl(var(--color-text-2))]',
            'transition-all duration-150 hover:border-[hsl(var(--color-border-2))] hover:text-[hsl(var(--color-text-1))] disabled:opacity-50'
          )}
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Download size={12} />
          )}
          Download
        </button>
      )}
    </div>
  )
}
