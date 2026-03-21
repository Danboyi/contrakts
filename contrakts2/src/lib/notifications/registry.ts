import type { ElementType } from 'react'
import {
  Bell,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  PenLine,
  Scale,
  Shield,
  AlertTriangle,
  UserCheck,
} from 'lucide-react'

export interface NotificationConfig {
  icon: ElementType
  color: string
  bg: string
  label: string
  emailSubject: (data: Record<string, string>) => string
  route: (contractId?: string) => string
}

export const NOTIFICATION_REGISTRY: Record<string, NotificationConfig> = {
  contract_invite: {
    icon: FileText,
    color: 'text-[hsl(var(--color-accent))]',
    bg: 'bg-[hsl(var(--color-accent)/0.1)]',
    label: 'Contract invite',
    emailSubject: () => 'You have been invited to a contract',
    route: (id) => (id ? `/contracts/${id}` : '/contracts'),
  },
  counterparty_signed: {
    icon: PenLine,
    color: 'text-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.1)]',
    label: 'Contract signed',
    emailSubject: () => 'Contract signed - fund escrow to begin',
    route: (id) => (id ? `/contracts/${id}` : '/contracts'),
  },
  contract_funded: {
    icon: Shield,
    color: 'text-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.1)]',
    label: 'Escrow funded',
    emailSubject: () => 'Escrow funded - work can begin',
    route: (id) => (id ? `/contracts/${id}` : '/contracts'),
  },
  milestone_submitted: {
    icon: Clock,
    color: 'text-[hsl(var(--color-warning))]',
    bg: 'bg-[hsl(var(--color-warning)/0.1)]',
    label: 'Delivery submitted',
    emailSubject: () => 'Milestone delivery submitted - review required',
    route: (id) => (id ? `/contracts/${id}/milestones` : '/contracts'),
  },
  milestone_approved: {
    icon: CheckCircle,
    color: 'text-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.1)]',
    label: 'Milestone approved',
    emailSubject: () => 'Milestone approved - payment released',
    route: (id) => (id ? `/contracts/${id}/milestones` : '/contracts'),
  },
  payment_released: {
    icon: DollarSign,
    color: 'text-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.1)]',
    label: 'Payment released',
    emailSubject: () => 'Payment has been released to your account',
    route: (id) => (id ? `/contracts/${id}/payments` : '/contracts'),
  },
  payment_failed: {
    icon: CreditCard,
    color: 'text-[hsl(var(--color-danger))]',
    bg: 'bg-[hsl(var(--color-danger)/0.1)]',
    label: 'Payment failed',
    emailSubject: () => 'Payment transfer failed - action required',
    route: (id) => (id ? `/contracts/${id}/payments` : '/contracts'),
  },
  dispute_raised: {
    icon: AlertTriangle,
    color: 'text-[hsl(var(--color-danger))]',
    bg: 'bg-[hsl(var(--color-danger)/0.1)]',
    label: 'Dispute raised',
    emailSubject: () => 'A dispute has been raised on your contract',
    route: (id) => (id ? `/contracts/${id}/dispute` : '/contracts'),
  },
  dispute_resolved: {
    icon: Scale,
    color: 'text-[hsl(var(--color-accent))]',
    bg: 'bg-[hsl(var(--color-accent)/0.1)]',
    label: 'Dispute resolved',
    emailSubject: () => 'Dispute ruling issued - see the outcome',
    route: (id) => (id ? `/contracts/${id}/dispute` : '/contracts'),
  },
  contract_complete: {
    icon: CheckCircle,
    color: 'text-[hsl(var(--color-success))]',
    bg: 'bg-[hsl(var(--color-success)/0.1)]',
    label: 'Contract complete',
    emailSubject: () => 'Contract completed successfully',
    route: (id) => (id ? `/contracts/${id}` : '/contracts'),
  },
  bank_details_needed: {
    icon: Building2,
    color: 'text-[hsl(var(--color-warning))]',
    bg: 'bg-[hsl(var(--color-warning)/0.1)]',
    label: 'Bank details needed',
    emailSubject: () => 'Add your bank details to receive payment',
    route: () => '/settings',
  },
  transfer_failed: {
    icon: AlertTriangle,
    color: 'text-[hsl(var(--color-danger))]',
    bg: 'bg-[hsl(var(--color-danger)/0.1)]',
    label: 'Transfer failed',
    emailSubject: () => 'Transfer failed - manual review needed',
    route: (id) => (id ? `/contracts/${id}/payments` : '/contracts'),
  },
  kyc_approved: {
    icon: UserCheck,
    color: 'text-[hsl(var(--color-gold))]',
    bg: 'bg-[hsl(var(--color-gold)/0.1)]',
    label: 'Identity verified',
    emailSubject: () => 'Your identity has been verified',
    route: () => '/profile',
  },
}

export function getNotificationConfig(type: string): NotificationConfig {
  return (
    NOTIFICATION_REGISTRY[type] ?? {
      icon: Bell,
      color: 'text-[hsl(var(--color-text-3))]',
      bg: 'bg-[hsl(var(--color-surface-2))]',
      label: 'Notification',
      emailSubject: () => 'New notification from Contrakts',
      route: () => '/dashboard',
    }
  )
}
