'use client'

import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal, ModalFooter } from '@/components/ui/modal'

export function FundEscrowModal({
  open,
  onOpenChange,
  contractId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId: string
}) {
  const router = useRouter()

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Fund escrow"
      description="Choose a payment method to secure the contract amount in escrow."
      size="sm"
    >
      <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-success)/0.15)] bg-[hsl(var(--color-success)/0.05)] p-4">
        <div className="mb-2 flex items-center gap-2 text-[hsl(var(--color-success))]">
          <Shield size={14} />
          <span className="text-sm font-medium">Protected release flow</span>
        </div>
        <p className="text-sm leading-6 text-[hsl(var(--color-text-2))]">
          Funds remain locked until milestone approval. You will be redirected to a
          secure provider checkout.
        </p>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={() => router.push(`/contracts/${contractId}/fund`)}>
          Continue
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default FundEscrowModal
