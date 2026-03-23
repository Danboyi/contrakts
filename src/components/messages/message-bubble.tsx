'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  Archive,
  Bot,
  Download,
  File,
  FileText,
  Film,
  Image as ImageIcon,
  Music,
  Trash2,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  onDelete?: (messageId: string) => void
}

function getAttachmentIcon(type: string | null) {
  if (!type) {
    return File
  }

  if (type.startsWith('image/')) {
    return ImageIcon
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

  if (type.includes('zip') || type.includes('tar')) {
    return Archive
  }

  return File
}

function formatSize(bytes: number | null) {
  if (!bytes) {
    return ''
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MessageBubble({ message, isOwn, onDelete }: MessageBubbleProps) {
  const [resolvedAttachmentUrl, setResolvedAttachmentUrl] = useState<string | null>(
    null
  )
  const isSystem = ['system', 'submission', 'feedback'].includes(
    message.message_type
  )
  const senderName = message.sender?.full_name ?? message.sender?.email ?? 'Unknown'
  const timeAgo = formatDistanceToNow(new Date(message.created_at), {
    addSuffix: true,
  })

  useEffect(() => {
    let active = true

    async function resolveAttachmentUrl() {
      if (!message.attachment_url) {
        setResolvedAttachmentUrl(null)
        return
      }

      if (/^https?:\/\//i.test(message.attachment_url)) {
        setResolvedAttachmentUrl(message.attachment_url)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('attachments')
        .createSignedUrl(message.attachment_url, 3600)

      if (!active) {
        return
      }

      setResolvedAttachmentUrl(error ? null : data.signedUrl)
    }

    void resolveAttachmentUrl()

    return () => {
      active = false
    }
  }, [message.attachment_url])

  if (isSystem) {
    return (
      <div className="flex justify-center py-1.5">
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
            'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))]'
          )}
        >
          <Bot size={12} className="shrink-0 text-[hsl(var(--color-text-3))]" />
          <span className="text-[11px] leading-relaxed text-[hsl(var(--color-text-3))]">
            {message.body}
          </span>
        </div>
      </div>
    )
  }

  const AttachmentIcon = getAttachmentIcon(message.attachment_type)

  return (
    <div
      className={cn(
        'group flex gap-2.5',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {!isOwn && (
        <div className="mt-0.5 shrink-0">
          <Avatar
            name={senderName}
            src={message.sender?.avatar_url}
            size="sm"
          />
        </div>
      )}

      <div className="min-w-0 max-w-[75%]">
        {!isOwn && (
          <p className="mb-1 ml-1 text-[10px] font-medium text-[hsl(var(--color-text-3))]">
            {senderName}
          </p>
        )}

        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5',
            isOwn
              ? 'rounded-br-md bg-[hsl(var(--color-accent))] text-white'
              : 'rounded-bl-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))]'
          )}
        >
          {message.body && (
            <p
              className={cn(
                'whitespace-pre-wrap break-words text-sm leading-relaxed',
                isOwn ? 'text-white' : 'text-[hsl(var(--color-text-1))]'
              )}
            >
              {message.body}
            </p>
          )}

          {message.attachment_url && (
            <div
              className={cn(
                'mt-2 rounded-[var(--radius-md)] p-2.5',
                isOwn ? 'bg-white/10' : 'bg-[hsl(var(--color-surface))]'
              )}
            >
              {message.attachment_type?.startsWith('image/') &&
              resolvedAttachmentUrl ? (
                <Link
                  href={resolvedAttachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-[var(--radius-sm)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolvedAttachmentUrl}
                    alt={message.attachment_name ?? 'Attachment'}
                    className="h-auto max-h-[200px] w-full object-cover"
                    loading="lazy"
                  />
                </Link>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]',
                      isOwn ? 'bg-white/10' : 'bg-[hsl(var(--color-surface-2))]'
                    )}
                  >
                    <AttachmentIcon
                      size={14}
                      className={
                        isOwn ? 'text-white/70' : 'text-[hsl(var(--color-text-3))]'
                      }
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-xs font-medium',
                        isOwn ? 'text-white' : 'text-[hsl(var(--color-text-1))]'
                      )}
                    >
                      {message.attachment_name ?? 'Attachment'}
                    </p>
                    <p
                      className={cn(
                        'text-[10px]',
                        isOwn ? 'text-white/60' : 'text-[hsl(var(--color-text-3))]'
                      )}
                    >
                      {formatSize(message.attachment_size)}
                    </p>
                  </div>
                  {resolvedAttachmentUrl && (
                    <Link
                      href={resolvedAttachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'rounded-[var(--radius-sm)] p-1.5 transition-colors duration-150',
                        isOwn
                          ? 'text-white/70 hover:bg-white/10'
                          : 'text-[hsl(var(--color-text-3))] hover:bg-[hsl(var(--color-surface-2))]'
                      )}
                    >
                      <Download size={14} />
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            'mt-1 flex items-center gap-2 px-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}
        >
          <span className="text-[10px] text-[hsl(var(--color-text-3))]">
            {timeAgo}
          </span>
          {isOwn && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              className={cn(
                'rounded p-0.5 text-[hsl(var(--color-text-3))] transition-all duration-150',
                'opacity-0 group-hover:opacity-100 hover:text-[hsl(var(--color-danger))]'
              )}
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
