'use client'

import { Briefcase, Wallet } from 'lucide-react'
import { ROLE_LABELS, type PartyRole } from '@/lib/types/negotiation'
import { cn } from '@/lib/utils/cn'

interface RoleSelectorProps {
  selected: PartyRole | null
  onSelect: (role: PartyRole) => void
}

export function RoleSelector({ selected, onSelect }: RoleSelectorProps) {
  const roles = [
    {
      value: 'service_provider' as PartyRole,
      icon: Briefcase,
      title: "I'm the Service Provider",
      subtitle: 'I will do the work',
      description:
        "You are offering a service or delivering a product. You'll set the scope, milestones, and pricing. The service receiver will review your terms, fund the escrow, and approve milestones as you deliver.",
      examples: [
        'Freelancer sending a proposal',
        'Agency pitching a project',
        'Contractor quoting a job',
        'Developer selling a build',
      ],
    },
    {
      value: 'service_receiver' as PartyRole,
      icon: Wallet,
      title: "I'm the Service Receiver",
      subtitle: 'I need work done',
      description:
        "You need a service or product delivered. You'll define what you need, set milestones and budget. The service provider will review your terms and deliver against each milestone.",
      examples: [
        'Hiring a designer for branding',
        'Contracting a developer for an app',
        'Commissioning a renovation',
        'Engaging a consultant',
      ],
    },
  ]

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h2
          className={cn(
            'mb-2 text-xl font-semibold sm:text-2xl',
            'text-[hsl(var(--color-text-1))]'
          )}
        >
          What&apos;s your role?
        </h2>
        <p
          className={cn(
            'mx-auto max-w-[400px] text-sm text-[hsl(var(--color-text-2))]'
          )}
        >
          This helps us set up the contract correctly. Either role can create
          and send a contract.
        </p>
      </div>

      <div
        className={cn(
          'mx-auto grid max-w-[640px] grid-cols-1 gap-4 sm:grid-cols-2'
        )}
      >
        {roles.map((role) => {
          const isSelected = selected === role.value
          const Icon = role.icon

          return (
            <button
              key={role.value}
              type="button"
              onClick={() => onSelect(role.value)}
              className={cn(
                'min-h-[44px] rounded-[var(--radius-xl)] border-2 p-5 text-left transition-all duration-200 sm:p-6',
                isSelected
                  ? cn(
                      'border-[hsl(var(--color-accent))]',
                      'bg-[hsl(var(--color-accent)/0.06)]',
                      'shadow-[0_0_0_1px_hsl(var(--color-accent)/0.3)]'
                    )
                  : cn(
                      'border-[hsl(var(--color-border))]',
                      'bg-[hsl(var(--color-surface))]',
                      'hover:border-[hsl(var(--color-border-2))]',
                      'hover:bg-[hsl(var(--color-surface-2)/0.3)]'
                    )
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]',
                    isSelected
                      ? 'bg-[hsl(var(--color-accent)/0.15)]'
                      : 'bg-[hsl(var(--color-surface-2))]'
                  )}
                >
                  <Icon
                    size={20}
                    className={
                      isSelected
                        ? 'text-[hsl(var(--color-accent))]'
                        : 'text-[hsl(var(--color-text-3))]'
                    }
                  />
                </div>

                <div
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200',
                    isSelected
                      ? 'border-[hsl(var(--color-accent))]'
                      : 'border-[hsl(var(--color-border-2))]'
                  )}
                >
                  {isSelected && (
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        'bg-[hsl(var(--color-accent))]'
                      )}
                    />
                  )}
                </div>
              </div>

              <h3
                className={cn(
                  'mb-1 text-base font-semibold',
                  isSelected
                    ? 'text-[hsl(var(--color-accent))]'
                    : 'text-[hsl(var(--color-text-1))]'
                )}
              >
                {role.title}
              </h3>

              <p
                className={cn(
                  'mb-3 text-xs font-medium text-[hsl(var(--color-text-3))]'
                )}
              >
                {role.subtitle}
              </p>

              <p
                className={cn(
                  'mb-4 text-sm leading-relaxed text-[hsl(var(--color-text-2))]'
                )}
              >
                {role.description}
              </p>

              <div className="flex flex-col gap-1.5">
                {role.examples.map((example) => (
                  <div key={example} className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-1 w-1 flex-shrink-0 rounded-full',
                        isSelected
                          ? 'bg-[hsl(var(--color-accent))]'
                          : 'bg-[hsl(var(--color-text-3))]'
                      )}
                    />
                    <span className="text-xs text-[hsl(var(--color-text-3))]">
                      {example}
                    </span>
                  </div>
                ))}
              </div>

              {isSelected && (
                <div
                  className={cn(
                    'mt-4 inline-flex rounded-full bg-[hsl(var(--color-accent)/0.12)] px-2.5 py-1 text-[11px] font-medium text-[hsl(var(--color-accent))]'
                  )}
                >
                  {ROLE_LABELS[role.value]}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
