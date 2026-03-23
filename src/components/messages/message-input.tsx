'use client'

import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Paperclip, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/lib/messages/actions'
import { cn } from '@/lib/utils/cn'

interface MessageInputProps {
  contractId: string
  disabled?: boolean
}

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024

type AttachmentState = {
  file: File
  uploading: boolean
}

export function MessageInput({ contractId, disabled }: MessageInputProps) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [attachment, setAttachment] = useState<AttachmentState | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleAttach = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('File type not supported.')
      return
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error('File must be under 25MB.')
      return
    }

    setAttachment({ file, uploading: false })
  }, [])

  const removeAttachment = useCallback(() => {
    setAttachment(null)
    if (fileRef.current) {
      fileRef.current.value = ''
    }
  }, [])

  const handleInput = useCallback(() => {
    const element = textareaRef.current
    if (!element) {
      return
    }

    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`
  }, [])

  const handleSend = useCallback(async () => {
    if ((!body.trim() && !attachment) || sending || disabled) {
      return
    }

    setSending(true)
    let attachmentPath: string | undefined

    try {
      let attachmentName: string | undefined
      let attachmentType: string | undefined
      let attachmentSize: number | undefined

      if (attachment?.file) {
        setAttachment((current) =>
          current ? { ...current, uploading: true } : current
        )

        const supabase = createClient()
        const safeName = attachment.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `${contractId}/${Date.now()}_${safeName}`

        const { data, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(path, attachment.file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        attachmentPath = data.path
        attachmentName = attachment.file.name
        attachmentType = attachment.file.type
        attachmentSize = attachment.file.size
      }

      await sendMessage({
        contractId,
        body: body.trim() || (attachment ? `Sent a file: ${attachment.file.name}` : ''),
        messageType: attachment && !body.trim() ? 'file' : 'user',
        attachmentUrl: attachmentPath,
        attachmentName,
        attachmentType,
        attachmentSize,
      })

      setBody('')
      setAttachment(null)

      if (fileRef.current) {
        fileRef.current.value = ''
      }

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.focus()
      }
    } catch (error) {
      if (attachmentPath) {
        const supabase = createClient()
        await supabase.storage.from('attachments').remove([attachmentPath])
      }

      toast.error(
        error instanceof Error ? error.message : 'Failed to send message.'
      )
    } finally {
      setSending(false)
      setAttachment((current) =>
        current ? { ...current, uploading: false } : current
      )
    }
  }, [attachment, body, contractId, disabled, sending])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        void handleSend()
      }
    },
    [handleSend]
  )

  const canSend = Boolean(body.trim() || attachment) && !sending && !disabled

  return (
    <div className="border-t border-[hsl(var(--color-border))]">
      {attachment && (
        <div className="px-4 pt-3">
          <div
            className={cn(
              'flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2',
              'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))]'
            )}
          >
            <Paperclip size={13} className="shrink-0 text-[hsl(var(--color-text-3))]" />
            <span className="min-w-0 flex-1 truncate text-xs text-[hsl(var(--color-text-1))]">
              {attachment.file.name}
            </span>
            {attachment.uploading ? (
              <Loader2
                size={13}
                className="shrink-0 animate-spin text-[hsl(var(--color-accent))]"
              />
            ) : (
              <button
                type="button"
                onClick={removeAttachment}
                className="rounded p-0.5 text-[hsl(var(--color-text-3))] transition-colors hover:text-[hsl(var(--color-danger))]"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || sending || Boolean(attachment)}
          className="shrink-0"
        >
          <Paperclip size={18} />
        </Button>

        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              handleAttach(file)
            }

            event.currentTarget.value = ''
          }}
        />

        <textarea
          ref={textareaRef}
          value={body}
          onChange={(event) => {
            setBody(event.target.value)
            handleInput()
          }}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Messaging is disabled on this contract.' : 'Type a message...'}
          disabled={disabled || sending}
          rows={1}
          className={cn(
            'min-h-[44px] max-h-[120px] flex-1 resize-none rounded-[var(--radius-lg)] border px-3.5 py-2.5',
            'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]',
            'text-sm text-[hsl(var(--color-text-1))] placeholder:text-[hsl(var(--color-text-3))]',
            'outline-none transition-all duration-150',
            'focus:border-[hsl(var(--color-accent))] focus:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.12)]',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />

        <Button
          type="button"
          size="icon"
          onClick={() => void handleSend()}
          disabled={!canSend}
          className="shrink-0"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </Button>
      </div>
    </div>
  )
}
