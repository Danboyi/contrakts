'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/cn'
import type { FeedbackItemType } from '@/types'
import {
  AlertCircle,
  Lightbulb,
  ThumbsUp,
  X,
} from 'lucide-react'

interface FeedbackItemRowProps {
  index: number
  type: FeedbackItemType
  content: string
  fileRef: string
  onChangeType: (type: FeedbackItemType) => void
  onChangeContent: (content: string) => void
  onChangeFileRef: (fileRef: string) => void
  onRemove: () => void
}

const TYPE_CONFIG: Record<
  FeedbackItemType,
  {
    label: string
    icon: typeof AlertCircle
    color: string
    bg: string
    borderColor: string
  }
> = {
  issue: {
    label: 'Issue',
    icon: AlertCircle,
    color: 'text-[hsl(var(--color-danger))]',
    bg: 'bg-[hsl(var(--color-danger)/0.08)]',
    borderColor: 'border-[hsl(var(--color-danger)/0.2)]',
  },
  suggestion: {
    label: 'Suggestion',
    icon: Lightbulb,
    color: 'text-[hsl(var(--color-warning))]',
    bg: 'bg-[hsl(var(--color-warning)/0.08)]',
    borderColor: 'border-[hsl(var(--color-warning)/0.2)]',
  },
  praise: {
    label: 'Praise',
    icon: ThumbsUp,
    color: 'text-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.08)]',
    borderColor: 'border-[hsl(var(--color-success)/0.2)]',
  },
}

export function FeedbackItemRow({
  index,
  type,
  content,
  fileRef,
  onChangeType,
  onChangeContent,
  onChangeFileRef,
  onRemove,
}: FeedbackItemRowProps) {
  const config = TYPE_CONFIG[type]

  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border p-3',
        config.borderColor,
        config.bg
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] text-[hsl(var(--color-text-3))]">
            #{index + 1}
          </span>
          {(Object.keys(TYPE_CONFIG) as FeedbackItemType[]).map((itemType) => {
            const itemConfig = TYPE_CONFIG[itemType]
            const Icon = itemConfig.icon
            const isActive = type === itemType

            return (
              <button
                key={itemType}
                type="button"
                onClick={() => onChangeType(itemType)}
                className={cn(
                  'flex min-h-[28px] items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium transition-all duration-150',
                  isActive
                    ? cn(itemConfig.color, itemConfig.bg, itemConfig.borderColor)
                    : 'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] text-[hsl(var(--color-text-3))] hover:text-[hsl(var(--color-text-2))]'
                )}
              >
                <Icon size={10} />
                {itemConfig.label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'rounded-[var(--radius-sm)] p-1 text-[hsl(var(--color-text-3))]',
            'transition-colors duration-150 hover:bg-[hsl(var(--color-danger)/0.08)] hover:text-[hsl(var(--color-danger))]'
          )}
        >
          <X size={13} />
        </button>
      </div>

      <Textarea
        value={content}
        onChange={(event) => onChangeContent(event.target.value)}
        placeholder={
          type === 'issue'
            ? 'Describe the issue that needs fixing...'
            : type === 'suggestion'
              ? 'Describe your suggestion...'
              : 'What looks great...'
        }
        rows={2}
        className="mb-2 min-h-[88px] text-sm"
      />

      <Input
        value={fileRef}
        onChange={(event) => onChangeFileRef(event.target.value)}
        placeholder="File reference (optional) — e.g. homepage.tsx, hero-section.png"
        className="text-xs"
      />
    </div>
  )
}
