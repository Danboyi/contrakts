'use client'

import { useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { useMessages, useUser } from '@/hooks'
import { deleteMessage, markMessagesRead } from '@/lib/messages'
import { cn } from '@/lib/utils/cn'
import { MessageBubble } from './message-bubble'
import { MessageInput } from './message-input'

interface MessageThreadProps {
  contractId: string
  disabled?: boolean
  className?: string
}

export function MessageThread({
  contractId,
  disabled,
  className,
}: MessageThreadProps) {
  const { user } = useUser()
  const { messages, loading, bottomRef, markAllRead } = useMessages(contractId)

  useEffect(() => {
    if (!user?.id || messages.length === 0) {
      return
    }

    void markAllRead(user.id)
    void markMessagesRead({ contractId }).catch(console.error)
  }, [contractId, markAllRead, messages.length, user?.id])

  async function handleDelete(messageId: string) {
    try {
      await deleteMessage({ messageId })
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  if (loading) {
    return (
      <div
        className={cn(
          'flex min-h-[240px] items-center justify-center rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]',
          className
        )}
      >
        <Spinner />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]',
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2)/0.5)] px-4 py-3">
        <MessageSquare size={15} className="text-[hsl(var(--color-text-3))]" />
        <span className="text-sm font-medium text-[hsl(var(--color-text-1))]">
          Messages
        </span>
        <span className="ml-auto text-xs text-[hsl(var(--color-text-3))]">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex max-h-[500px] min-h-[220px] flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={18} />}
            title="No messages yet"
            description="Start a conversation with the other party."
            size="sm"
            className="min-h-[220px]"
          />
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user?.id}
                onDelete={message.sender_id === user?.id ? handleDelete : undefined}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <MessageInput contractId={contractId} disabled={disabled} />
    </div>
  )
}
