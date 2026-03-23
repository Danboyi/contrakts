import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileText, Plus } from 'lucide-react'
import { ContractCard } from '@/components/contracts/contract-card'
import { PageHeader } from '@/components/shared/page-header'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/server'
import { getContractDisplayState } from '@/lib/contracts/state'
import type { Contract, ContractState } from '@/types'

type ListContract = Contract & {
  initiator: { full_name: string; avatar_url: string | null } | null
  counterparty: { full_name: string; avatar_url: string | null } | null
  milestones: Array<{ state: string; amount: number }> | null
}

export const metadata = { title: 'Contracts' }

const STATE_FILTERS: { label: string; value: ContractState | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'In review', value: 'in_review' },
  { label: 'Disputed', value: 'disputed' },
  { label: 'Complete', value: 'complete' },
  { label: 'Draft', value: 'draft' },
]

export default async function ContractsPage({
  searchParams,
}: {
  searchParams?: { state?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const rawState = searchParams?.state
  const stateFilter = STATE_FILTERS.some((filter) => filter.value === rawState)
    ? (rawState as ContractState | 'all')
    : 'all'

  const { data: contractsData } = await supabase
    .from('contracts')
    .select(
      `
      *,
      initiator:users!initiator_id(full_name, avatar_url),
      counterparty:users!counterparty_id(full_name, avatar_url),
      milestones(state, amount)
    `
    )
    .or(`initiator_id.eq.${user.id},counterparty_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const { data: unreadRows, error: unreadError } = await supabase
    .from('messages')
    .select('contract_id')
    .eq('read_by_recipient', false)
    .neq('sender_id', user.id)
    .is('deleted_at', null)

  const unreadCounts = unreadError
    ? {}
    : ((unreadRows ?? []) as Array<{ contract_id: string | null }>).reduce(
        (accumulator, row) => {
          if (!row.contract_id) {
            return accumulator
          }

          accumulator[row.contract_id] = (accumulator[row.contract_id] ?? 0) + 1
          return accumulator
        },
        {} as Record<string, number>
      )

  const allContracts = ((contractsData ?? []) as unknown as ListContract[]).map(
    (contract) => ({
      ...contract,
      state: getContractDisplayState(contract) as ContractState,
    })
  )
  const contracts =
    stateFilter === 'all'
      ? allContracts
      : allContracts.filter((contract) => contract.state === stateFilter)

  const counts = allContracts.reduce(
    (accumulator, contract) => {
      accumulator[contract.state] = (accumulator[contract.state] ?? 0) + 1
      return accumulator
    },
    {} as Record<string, number>
  )

  return (
    <div className="w-full max-w-full space-y-6">
      <PageHeader
        title="Contracts"
        subtitle={
          contracts.length > 0
            ? `${contracts.length} contract${contracts.length !== 1 ? 's' : ''} total`
            : 'Manage all your contracts'
        }
        actions={
          <Link
            href="/contracts/new"
            className={cn(
              buttonVariants({ variant: 'primary', size: 'md' }),
              'w-full flex-shrink-0 justify-center whitespace-nowrap sm:w-auto'
            )}
          >
            <Plus size={15} />
            <span>New contract</span>
          </Link>
        }
      />

      <div className="-mx-4 w-full overflow-x-auto px-4 scrollbar-hide md:mx-0 md:px-0">
        <div className="mb-6 flex min-w-max items-center gap-1 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-1">
          {STATE_FILTERS.map((filter) => {
            const active =
              (stateFilter === 'all' && filter.value === 'all') ||
              stateFilter === filter.value
            const count =
              filter.value === 'all'
                ? allContracts.length
                : counts[filter.value] ?? 0

            return (
              <Link
                key={filter.value}
                href={
                  filter.value === 'all'
                    ? '/contracts'
                    : `/contracts?state=${filter.value}`
                }
                className={cn(
                  'flex min-h-[36px] flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[calc(var(--radius-md)-2px)] px-3 py-1.5 text-sm transition-all duration-150',
                  active
                    ? 'bg-[hsl(var(--color-surface-2))] font-medium text-[hsl(var(--color-text-1))] shadow-sm'
                    : 'text-[hsl(var(--color-text-3))] hover:text-[hsl(var(--color-text-2))]'
                )}
              >
                {filter.label}
                {count > 0 && (
                  <span
                    className={cn(
                      'min-w-[18px] rounded-full px-1 py-0.5 text-center text-[10px] font-medium',
                      active
                        ? 'bg-[hsl(var(--color-border-2))] text-[hsl(var(--color-text-2))]'
                        : 'bg-[hsl(var(--color-surface-2))] text-[hsl(var(--color-text-3))]'
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title={
            stateFilter !== 'all'
              ? `No ${stateFilter.replace('_', ' ')} contracts`
              : 'No contracts yet'
          }
          description={
            stateFilter !== 'all'
              ? "You don't have any contracts with this status."
              : 'Create your first contract to start protecting your deals.'
          }
          action={
            stateFilter === 'all'
              ? {
                  label: 'Create contract',
                  href: '/contracts/new',
                  icon: <Plus size={14} />,
                }
              : undefined
          }
        />
      ) : (
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {contracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              unreadMessages={unreadCounts[contract.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
