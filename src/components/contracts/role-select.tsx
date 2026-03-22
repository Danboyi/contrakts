'use client'

import { motion } from 'framer-motion'
import { Briefcase, ShieldCheck } from 'lucide-react'
import type { InitiatorRoleChoice } from '@/hooks/use-contract-builder'
import { cn } from '@/lib/utils/cn'

interface RoleSelectProps {
  value: InitiatorRoleChoice
  onChange: (role: InitiatorRoleChoice) => void
}

const ROLES: {
  value: InitiatorRoleChoice
  label: string
  description: string
  detail: string
  icon: typeof Briefcase
}[] = [
  {
    value: 'service_receiver',
    label: 'I am hiring',
    description: 'Service Receiver',
    detail:
      'You are the client. You set the project scope, milestones, and terms. Your vendor will review, negotiate, then start work once funded.',
    icon: ShieldCheck,
  },
  {
    value: 'vendor',
    label: 'I am offering services',
    description: 'Vendor / Service Provider',
    detail:
      'You are the vendor. You define the deliverables, pricing, and milestones. Your client will review, negotiate, then fund the project.',
    icon: Briefcase,
  },
]

export function RoleSelect({ value, onChange }: RoleSelectProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="mb-1 text-sm font-medium text-[hsl(var(--color-text-2))]">
        What is your role in this contract?
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {ROLES.map((role) => {
          const isSelected = value === role.value
          const Icon = role.icon

          return (
            <motion.button
              key={role.value}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onChange(role.value)}
              className={cn(
                'relative rounded-[var(--radius-xl)] border-2 p-5 text-left transition-all duration-200',
                isSelected
                  ? 'border-[hsl(var(--color-accent))] bg-[hsl(var(--color-accent)/0.06)]'
                  : 'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] hover:border-[hsl(var(--color-border-2))]'
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId="role-indicator"
                  className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[hsl(var(--color-accent))]"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200',
                    isSelected
                      ? 'bg-[hsl(var(--color-accent)/0.15)]'
                      : 'bg-[hsl(var(--color-surface))]'
                  )}
                >
                  <Icon
                    size={20}
                    className={cn(
                      'transition-colors duration-200',
                      isSelected
                        ? 'text-[hsl(var(--color-accent))]'
                        : 'text-[hsl(var(--color-text-3))]'
                    )}
                  />
                </div>
                <div>
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      isSelected
                        ? 'text-[hsl(var(--color-accent))]'
                        : 'text-[hsl(var(--color-text-1))]'
                    )}
                  >
                    {role.label}
                  </p>
                  <p className="text-[11px] text-[hsl(var(--color-text-3))]">
                    {role.description}
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                {role.detail}
              </p>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
