import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, Shield, User } from 'lucide-react'
import type { ContractTemplate, TemplateMilestone } from '@/types'
import { ContractPreview } from '@/components/contracts/contract-preview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import {
  TEMPLATE_INDUSTRY_LABELS,
  TEMPLATE_INDUSTRY_VARIANTS,
} from '@/lib/templates/constants'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'

export const metadata = { title: 'Template' }

export default async function TemplateDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: templateRow } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!templateRow) {
    notFound()
  }

  const { data: milestones } = await supabase
    .from('template_milestones')
    .select('id, template_id, order_index, title, description, amount_hint')
    .eq('template_id', params.id)
    .order('order_index', { ascending: true })

  const authorId = templateRow.author_id
  const { data: author } = authorId
    ? await supabase.from('users').select('full_name').eq('id', authorId).single()
    : { data: null }

  const template: ContractTemplate = {
    ...(templateRow as ContractTemplate),
    author: author ? { full_name: author.full_name } : null,
    milestones: (milestones ?? []) as TemplateMilestone[],
  }

  const totalHint = (template.milestones ?? []).reduce(
    (sum, milestone) => sum + (milestone.amount_hint ?? 0),
    0
  )
  const previewData = {
    initiator_role: 'service_receiver' as const,
    title: template.title,
    description: template.description ?? '',
    industry: template.industry,
    total_value: totalHint ? String(totalHint) : '',
    currency: template.currency,
    start_date: '',
    end_date: '',
    terms: template.terms ?? '',
    counterparty_name: '',
    counterparty_email: '',
    invite_message: '',
    milestones: (template.milestones ?? []).map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description ?? '',
      amount: milestone.amount_hint ? String(milestone.amount_hint) : '',
      deadline: '',
    })),
  }

  return (
    <div className="mx-auto max-w-[980px]">
      <Link
        href="/templates"
        className={cn(
          'mb-4 inline-flex items-center gap-1.5 text-xs text-[hsl(var(--color-text-3))]',
          'transition-colors duration-150 hover:text-[hsl(var(--color-text-2))]'
        )}
      >
        <ArrowLeft size={12} />
        Templates
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge
              variant={
                (TEMPLATE_INDUSTRY_VARIANTS[template.industry] ?? 'default') as never
              }
              size="sm"
            >
              {TEMPLATE_INDUSTRY_LABELS[template.industry] ?? template.industry}
            </Badge>
            {template.is_system ? (
              <Badge variant="gold" size="sm">
                <Shield size={11} />
                Official
              </Badge>
            ) : (
              <Badge variant="default" size="sm">
                <User size={11} />
                {template.author?.full_name ?? 'Custom'}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-semibold leading-tight text-[hsl(var(--color-text-1))]">
            {template.title}
          </h1>
          {template.description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
              {template.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[hsl(var(--color-text-3))]">
            <span>{(template.milestones ?? []).length} milestones</span>
            <span>
              {totalHint > 0
                ? `Typical value ${formatCurrency(totalHint * 100, template.currency)}`
                : 'Custom pricing'}
            </span>
            <span>{template.use_count}x used</span>
          </div>
        </div>

        <Link href={`/contracts/new?template=${template.id}`}>
          <Button rightIcon={<ArrowRight size={15} />}>Use this template</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <ContractPreview
          data={previewData}
          totalAmount={totalHint}
          platformFee={totalHint * 0.02}
          netToVendor={totalHint * 0.98}
          userName={
            template.is_system
              ? 'Contrakts'
              : template.author?.full_name ?? 'Template author'
          }
          className="static top-auto"
        />

        <div className="flex flex-col gap-6">
          <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5">
            <h2 className="mb-4 text-sm font-semibold text-[hsl(var(--color-text-1))]">
              Milestones
            </h2>
            <div className="flex flex-col gap-3">
              {(template.milestones ?? []).map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--color-surface))] text-[11px] font-semibold text-[hsl(var(--color-text-3))]">
                        {index + 1}
                      </span>
                      <h3 className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                        {milestone.title}
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-[hsl(var(--color-text-2))]">
                      {milestone.amount_hint
                        ? formatCurrency(milestone.amount_hint * 100, template.currency)
                        : 'Custom'}
                    </span>
                  </div>
                  {milestone.description && (
                    <p className="text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                      {milestone.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <details className="overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]">
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-[hsl(var(--color-text-1))]">
              Full terms
            </summary>
            <div className="border-t border-[hsl(var(--color-border))] px-5 py-4">
              <div className="max-h-[320px] overflow-y-auto pr-2">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                  {template.terms ?? 'No default terms provided.'}
                </p>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
