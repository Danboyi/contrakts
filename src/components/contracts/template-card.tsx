'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { ArrowRight, Layers, Shield, Trash2, User } from 'lucide-react'
import { toast } from 'sonner'
import type { ContractTemplate } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { deleteTemplate } from '@/lib/templates/actions'
import {
  TEMPLATE_INDUSTRY_LABELS,
  TEMPLATE_INDUSTRY_VARIANTS,
} from '@/lib/templates/constants'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'

interface TemplateCardProps {
  template: ContractTemplate
  isOwn?: boolean
  onDeleted?: (id: string) => void
}

export function TemplateCard({
  template,
  isOwn,
  onDeleted,
}: TemplateCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const milestones = template.milestones ?? []
  const totalHint = milestones.reduce(
    (sum, milestone) => sum + (milestone.amount_hint ?? 0),
    0
  )
  const hasAmounts = milestones.some(
    (milestone) => (milestone.amount_hint ?? 0) > 0
  )

  function handleUse() {
    router.push(`/contracts/new?template=${template.id}`)
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTemplate(template.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Template deleted.')
      onDeleted?.(template.id)
    })
  }

  return (
    <div
      className={cn(
        'group flex h-full flex-col rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5',
        'transition-all duration-150 hover:border-[hsl(var(--color-border-2))] hover:shadow-[0_4px_20px_hsl(0_0%_0%/0.15)]'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <Badge
          variant={
            (TEMPLATE_INDUSTRY_VARIANTS[template.industry] ?? 'default') as never
          }
          size="sm"
        >
          {TEMPLATE_INDUSTRY_LABELS[template.industry] ?? template.industry}
        </Badge>
        <div className="flex shrink-0 items-center gap-1.5">
          {template.is_system ? (
            <>
              <Shield size={11} className="text-[hsl(var(--color-gold))]" />
              <span className="text-[10px] font-medium text-[hsl(var(--color-gold))]">
                Official
              </span>
            </>
          ) : (
            <>
              <User size={11} className="text-[hsl(var(--color-text-3))]" />
              <span className="text-[10px] text-[hsl(var(--color-text-3))]">
                {template.author?.full_name ?? 'Custom'}
              </span>
            </>
          )}
        </div>
      </div>

      <Link href={`/templates/${template.id}`} className="mb-2 block">
        <h3 className="text-sm font-semibold leading-snug text-[hsl(var(--color-text-1))] transition-colors duration-150 hover:text-[hsl(var(--color-accent))]">
          {template.title}
        </h3>
      </Link>

      {template.description ? (
        <p className="mb-4 line-clamp-2 flex-1 text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
          {template.description}
        </p>
      ) : (
        <div className="mb-4 flex-1" />
      )}

      <div className="mb-4 mt-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Layers size={12} className="text-[hsl(var(--color-text-3))]" />
          <span className="text-xs text-[hsl(var(--color-text-3))]">
            {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-xs text-[hsl(var(--color-text-3))]">
          {hasAmounts && totalHint > 0
            ? `~${formatCurrency(totalHint * 100, template.currency)} typical`
            : 'Custom'}
        </span>
        {template.use_count > 0 && (
          <span className="ml-auto text-xs text-[hsl(var(--color-text-3))]">
            {template.use_count}x used
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={handleUse}
          rightIcon={<ArrowRight size={13} />}
        >
          Use template
        </Button>
        {isOwn && !template.is_system && (
          <Button
            size="sm"
            variant="ghost"
            loading={isPending}
            onClick={handleDelete}
            className={cn(
              'text-[hsl(var(--color-text-3))]',
              'hover:bg-[hsl(var(--color-danger)/0.08)] hover:text-[hsl(var(--color-danger))]'
            )}
          >
            <Trash2 size={13} />
          </Button>
        )}
      </div>
    </div>
  )
}
