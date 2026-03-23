import type { ContractState } from '@/types'

type ContractStateSource = {
  state: string
  signed_initiator_at?: string | null
  signed_counterparty_at?: string | null
}

export function getContractDisplayState(
  contract: ContractStateSource
): ContractState | string {
  if (
    contract.state === 'draft' &&
    (contract.signed_initiator_at || contract.signed_counterparty_at)
  ) {
    return 'pending'
  }

  return contract.state
}
