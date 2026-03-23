'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Mail, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CURRENCIES, INDUSTRIES } from '@/lib/utils/constants'
import { cn } from '@/lib/utils/cn'
import type {
  ContractFormData,
  MilestoneInput,
} from '@/hooks/use-contract-builder'

const TERMS_TEMPLATES = [
  {
    label: 'Creative services',
    text: 'Scope of work is limited to deliverables specified in the milestones above. All revisions beyond those noted per milestone will be quoted separately. Intellectual property transfers fully to the service receiver upon final payment. The service provider retains the right to display completed work in their portfolio unless otherwise agreed in writing. Communication will occur exclusively on the Contrakts platform.',
  },
  {
    label: 'Software development',
    text: 'All code deliverables will be original work free of third-party license conflicts unless explicitly disclosed. Source code and all related assets transfer to the service receiver upon full payment. The service provider provides bug fixes for 30 days after final milestone approval at no additional cost. Scope changes after contract signing require a contract amendment. Communication and file delivery occur exclusively on the Contrakts platform.',
  },
  {
    label: 'Consulting',
    text: 'Services are advisory in nature. The service provider will provide deliverables as described in each milestone. The service receiver is responsible for implementation decisions based on advice received. All information shared by either party is confidential. The service provider may not engage competing service receivers in the same specific domain during the contract period without written consent. Communication occurs exclusively on the Contrakts platform.',
  },
  {
    label: 'Construction',
    text: 'All work will comply with applicable local building codes and regulations. Materials will meet or exceed specifications agreed upon at contract signing. The service provider carries full liability insurance. Any scope changes require written amendment before work proceeds. Site access must be provided as agreed. Delays caused by service receiver unavailability do not constitute service provider breach. Communication and delivery documentation occur exclusively on the Contrakts platform.',
  },
] as const

function getCurrencySymbol(currency: string) {
  return (
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value ?? '$'
  )
}

export function StepDetails({
  data,
  errors,
  update,
}: {
  data: ContractFormData
  errors: Partial<Record<keyof ContractFormData, string>>
  update: (field: keyof ContractFormData, value: unknown) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <Input
        label="Contract title"
        placeholder="e.g. Brand identity project for Nexgen Ltd"
        value={data.title}
        onChange={(event) => update('title', event.target.value)}
        error={errors.title}
        autoFocus
      />
      <Textarea
        label="Description (optional)"
        placeholder="Briefly describe what this contract covers..."
        value={data.description}
        onChange={(event) => update('description', event.target.value)}
        hint="Shown to the counterparty on their invite."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Industry"
          value={data.industry}
          onValueChange={(value) => update('industry', value)}
          options={INDUSTRIES.map((industry) => ({
            value: industry.value,
            label: industry.label,
          }))}
          placeholder="Select industry"
          error={errors.industry}
        />
        <Select
          label="Currency"
          value={data.currency}
          onValueChange={(value) => update('currency', value)}
          options={CURRENCIES.map((currency) => ({
            value: currency.value,
            label: currency.label,
          }))}
          placeholder="Select currency"
          error={errors.currency}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Start date (optional)"
          type="date"
          value={data.start_date}
          onChange={(event) => update('start_date', event.target.value)}
        />
        <Input
          label="End date (optional)"
          type="date"
          value={data.end_date}
          onChange={(event) => update('end_date', event.target.value)}
        />
      </div>
    </div>
  )
}

function MilestoneCard({
  currency,
  milestone,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  currency: string
  milestone: MilestoneInput
  index: number
  total: number
  onUpdate: (field: keyof MilestoneInput, value: string) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const symbol = getCurrencySymbol(currency)

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] transition-all duration-200">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
        <div className="flex shrink-0 items-center gap-1 sm:flex-col sm:items-center sm:gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] text-[hsl(var(--color-text-3))] transition-colors hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-2))] disabled:opacity-20"
          >
            <ChevronUp size={13} />
          </button>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--color-surface))] text-[11px] font-semibold text-[hsl(var(--color-text-3))]">
            {index + 1}
          </span>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] text-[hsl(var(--color-text-3))] transition-colors hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-2))] disabled:opacity-20"
          >
            <ChevronDown size={13} />
          </button>
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
          <div className="min-w-0 sm:col-span-2">
            <label className="mb-1 block text-xs text-[hsl(var(--color-text-3))]">
              Milestone
            </label>
            <input
              type="text"
              placeholder={`Milestone ${index + 1} title`}
              value={milestone.title}
              onChange={(event) => onUpdate('title', event.target.value)}
              className={cn(
                'min-h-[44px] w-full rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3',
                'text-sm text-[hsl(var(--color-text-1))] placeholder:text-[hsl(var(--color-text-3))] outline-none transition-all duration-150',
                'focus:border-[hsl(var(--color-accent))] focus:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.12)]'
              )}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[hsl(var(--color-text-3))]">
              Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[hsl(var(--color-text-3))]">
                {symbol}
              </span>
              <input
                type="number"
                placeholder="0.00"
                value={milestone.amount}
                onChange={(event) => onUpdate('amount', event.target.value)}
                min="0"
                step="0.01"
                className={cn(
                  'min-h-[44px] w-full rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] pl-7 pr-3',
                  'text-sm text-[hsl(var(--color-text-1))] placeholder:text-[hsl(var(--color-text-3))] outline-none transition-all duration-150',
                  'focus:border-[hsl(var(--color-accent))] focus:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.12)]'
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className={cn(
              'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] text-[hsl(var(--color-text-3))] transition-all duration-150',
              'hover:bg-[hsl(var(--color-surface))] hover:text-[hsl(var(--color-text-2))]'
            )}
          >
            <ChevronDown
              size={14}
              className={cn(
                'transition-transform duration-200',
                expanded && 'rotate-180'
              )}
            />
          </button>
          {total > 1 && (
            <button
              type="button"
              onClick={onRemove}
              className={cn(
                'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] text-[hsl(var(--color-text-3))] transition-all duration-150',
                'hover:bg-[hsl(var(--color-danger)/0.08)] hover:text-[hsl(var(--color-danger))]'
              )}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 gap-3 border-t border-[hsl(var(--color-border))] px-4 pb-4 pt-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <textarea
              placeholder="Description (optional) — what does completion of this milestone look like?"
              value={milestone.description}
              onChange={(event) => onUpdate('description', event.target.value)}
              rows={2}
              className={cn(
                'w-full resize-none rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 py-2.5',
                'text-sm text-[hsl(var(--color-text-1))] placeholder:text-[hsl(var(--color-text-3))] outline-none transition-all duration-150',
                'focus:border-[hsl(var(--color-accent))] focus:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.12)]'
              )}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[hsl(var(--color-text-2))]">
              Deadline (optional)
            </label>
            <input
              type="date"
              value={milestone.deadline}
              onChange={(event) => onUpdate('deadline', event.target.value)}
              className={cn(
                'min-h-[44px] w-full rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3',
                'text-sm text-[hsl(var(--color-text-1))] outline-none transition-all duration-150',
                'focus:border-[hsl(var(--color-accent))] focus:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.12)]'
              )}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function StepMilestones({
  data,
  errors,
  updateMilestone,
  addMilestone,
  removeMilestone,
  moveMilestone,
}: {
  data: ContractFormData
  errors: Partial<Record<keyof ContractFormData, string>>
  updateMilestone: (id: string, field: keyof MilestoneInput, value: string) => void
  addMilestone: () => void
  removeMilestone: (id: string) => void
  moveMilestone: (from: number, to: number) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {data.milestones.map((milestone, index) => (
        <MilestoneCard
          key={milestone.id}
          currency={data.currency}
          milestone={milestone}
          index={index}
          total={data.milestones.length}
          onUpdate={(field, value) => updateMilestone(milestone.id, field, value)}
          onRemove={() => removeMilestone(milestone.id)}
          onMoveUp={() => moveMilestone(index, index - 1)}
          onMoveDown={() => moveMilestone(index, index + 1)}
        />
      ))}

      {errors.milestones && (
        <p className="mt-1 text-xs text-[hsl(var(--color-danger))]">
          {errors.milestones}
        </p>
      )}

      <button
        type="button"
        onClick={addMilestone}
        className={cn(
          'flex h-11 items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[hsl(var(--color-border-2))]',
          'text-sm text-[hsl(var(--color-text-3))] transition-all duration-150',
          'hover:border-[hsl(var(--color-accent)/0.4)] hover:bg-[hsl(var(--color-accent)/0.04)] hover:text-[hsl(var(--color-text-2))]'
        )}
      >
        <Plus size={15} />
        Add milestone
      </button>
    </div>
  )
}

export function StepTerms({
  data,
  errors,
  update,
}: {
  data: ContractFormData
  errors: Partial<Record<keyof ContractFormData, string>>
  update: (field: keyof ContractFormData, value: unknown) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-xs font-medium text-[hsl(var(--color-text-2))]">
          Start from a template
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TERMS_TEMPLATES.map((template) => (
            <button
              key={template.label}
              type="button"
              onClick={() => update('terms', template.text)}
              className={cn(
                'min-h-[44px] rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-3 py-2.5 text-left text-xs',
                'text-[hsl(var(--color-text-2))] transition-all duration-150',
                'hover:border-[hsl(var(--color-accent)/0.4)] hover:bg-[hsl(var(--color-accent)/0.05)] hover:text-[hsl(var(--color-text-1))]',
                data.terms === template.text && 'border-[hsl(var(--color-accent)/0.5)] bg-[hsl(var(--color-accent)/0.06)] text-[hsl(var(--color-text-1))]'
              )}
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      <Textarea
        label="Contract terms"
        placeholder="Describe the full scope, obligations, and conditions of this contract. Both parties will sign and be legally bound by these terms within the Contrakts platform."
        value={data.terms}
        onChange={(event) => update('terms', event.target.value)}
        error={errors.terms}
        hint={`${data.terms.length} characters — minimum 20 required`}
        style={{ minHeight: '200px' }}
      />
    </div>
  )
}

export function StepCounterparty({
  data,
  errors,
  update,
}: {
  data: ContractFormData
  errors: Partial<Record<keyof ContractFormData, string>>
  update: (field: keyof ContractFormData, value: unknown) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-accent)/0.1)]">
          <Mail size={15} className="text-[hsl(var(--color-accent))]" />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-[hsl(var(--color-text-1))]">
            Invite by email
          </p>
          <p className="text-xs leading-relaxed text-[hsl(var(--color-text-3))]">
            We&apos;ll send them a secure link to review and sign the contract.
            If they don&apos;t have a Contrakts account, they&apos;ll be prompted
            to create one. It takes under a minute.
          </p>
        </div>
      </div>

      <Input
        label="Counterparty email address"
        type="email"
        placeholder="their@email.com"
        value={data.counterparty_email}
        onChange={(event) => update('counterparty_email', event.target.value)}
        error={errors.counterparty_email}
        hint="This person will receive the contract invite and must sign before escrow can be funded."
        autoFocus
      />
    </div>
  )
}

export function StepReview({
  data,
  totalAmount,
  platformFee,
  netToVendor,
}: {
  data: ContractFormData
  totalAmount: number
  platformFee: number
  netToVendor: number
}) {
  const currency = data.currency || 'USD'
  const industryLabel =
    INDUSTRIES.find((industry) => industry.value === data.industry)?.label ??
    data.industry

  return (
    <div className="flex flex-col gap-5">
      {[
        { label: 'Title', value: data.title },
        { label: 'Industry', value: industryLabel },
        { label: 'Currency', value: data.currency },
        { label: 'Counterparty', value: data.counterparty_email },
        {
          label: 'Milestones',
          value: `${data.milestones.length} milestone${data.milestones.length !== 1 ? 's' : ''}`,
        },
        {
          label: 'Total value',
          value: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
          }).format(totalAmount),
        },
        {
          label: 'Platform fee',
          value: `-${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
          }).format(platformFee)} (2%)`,
        },
        {
          label: 'Net to service provider',
          value: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
          }).format(netToVendor),
        },
      ].map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col gap-1 border-b border-[hsl(var(--color-border))] py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
        >
          <span className="text-xs uppercase tracking-wide text-[hsl(var(--color-text-3))]">
            {label}
          </span>
          <span className="min-w-0 text-sm font-medium text-[hsl(var(--color-text-1))] sm:max-w-[60%] sm:text-right">
            {value}
          </span>
        </div>
      ))}

      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-4">
        <p className="text-xs leading-relaxed text-[hsl(var(--color-text-3))]">
          By sending this contract, you confirm that all details are accurate and
          you agree to be bound by the terms. Once both parties sign, terms are
          immutable. The platform fee (2%) is deducted from each milestone
          payment before it reaches the service provider.
        </p>
      </div>
    </div>
  )
}
