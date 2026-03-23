'use client'

import { useCallback, useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import type { PartyRole } from '@/lib/types/negotiation'

export interface MilestoneInput {
  id: string
  title: string
  description: string
  amount: string
  deadline: string
}

export interface ContractFormData {
  initiator_role: PartyRole | null
  title: string
  description: string
  industry: string
  total_value: string
  currency: string
  start_date: string
  end_date: string
  terms: string
  counterparty_name: string
  counterparty_email: string
  invite_message: string
  milestones: MilestoneInput[]
}

const STORAGE_KEY = 'contrakts_builder_draft'

interface ContractBuilderOptions {
  requireMilestoneAmounts?: boolean
  requireCounterparty?: boolean
  storageKey?: string
}

const defaultMilestone = (): MilestoneInput => ({
  id: nanoid(),
  title: '',
  description: '',
  amount: '',
  deadline: '',
})

const createInitialData = (): ContractFormData => ({
  initiator_role: null,
  title: '',
  description: '',
  industry: '',
  total_value: '',
  currency: 'USD',
  start_date: '',
  end_date: '',
  terms: '',
  counterparty_name: '',
  counterparty_email: '',
  invite_message: '',
  milestones: [defaultMilestone()],
})

function normalizeDraft(value: unknown): ContractFormData {
  if (!value || typeof value !== 'object') {
    return createInitialData()
  }

  const draft = value as Partial<ContractFormData>
  const milestones = Array.isArray(draft.milestones)
    ? draft.milestones.flatMap((milestone) => {
        if (!milestone || typeof milestone !== 'object') {
          return []
        }

        const safeMilestone = milestone as Partial<MilestoneInput>

        return [
          {
            id:
              typeof safeMilestone.id === 'string' && safeMilestone.id
                ? safeMilestone.id
                : nanoid(),
            title:
              typeof safeMilestone.title === 'string' ? safeMilestone.title : '',
            description:
              typeof safeMilestone.description === 'string'
                ? safeMilestone.description
                : '',
            amount:
              typeof safeMilestone.amount === 'string' ? safeMilestone.amount : '',
            deadline:
              typeof safeMilestone.deadline === 'string'
                ? safeMilestone.deadline
                : '',
          },
        ]
      })
    : []

  return {
    initiator_role:
      draft.initiator_role === 'service_provider' ||
      draft.initiator_role === 'service_receiver'
        ? draft.initiator_role
        : null,
    title: typeof draft.title === 'string' ? draft.title : '',
    description: typeof draft.description === 'string' ? draft.description : '',
    industry: typeof draft.industry === 'string' ? draft.industry : '',
    total_value:
      typeof draft.total_value === 'string' ? draft.total_value : '',
    currency: typeof draft.currency === 'string' && draft.currency ? draft.currency : 'USD',
    start_date: typeof draft.start_date === 'string' ? draft.start_date : '',
    end_date: typeof draft.end_date === 'string' ? draft.end_date : '',
    terms: typeof draft.terms === 'string' ? draft.terms : '',
    counterparty_name:
      typeof draft.counterparty_name === 'string' ? draft.counterparty_name : '',
    counterparty_email:
      typeof draft.counterparty_email === 'string' ? draft.counterparty_email : '',
    invite_message:
      typeof draft.invite_message === 'string' ? draft.invite_message : '',
    milestones: milestones.length > 0 ? milestones : [defaultMilestone()],
  }
}

export function useContractBuilder(options: ContractBuilderOptions = {}) {
  const requireMilestoneAmounts = options.requireMilestoneAmounts ?? true
  const requireCounterparty = options.requireCounterparty ?? true
  const storageKey = options.storageKey ?? STORAGE_KEY
  const maxStep = 3
  const [step, setStep] = useState(0)
  const [data, setData] = useState<ContractFormData>(createInitialData)
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContractFormData, string>>
  >({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        setData(normalizeDraft(JSON.parse(saved)))
      }
    } catch {}
  }, [storageKey])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch {}
  }, [data, storageKey])

  const update = useCallback((field: keyof ContractFormData, value: unknown) => {
    setData((previous) => ({ ...previous, [field]: value }))
    setErrors((previous) => ({ ...previous, [field]: undefined }))
  }, [])

  const updateMilestone = useCallback(
    (id: string, field: keyof MilestoneInput, value: string) => {
      setData((previous) => ({
        ...previous,
        milestones: previous.milestones.map((milestone) =>
          milestone.id === id ? { ...milestone, [field]: value } : milestone
        ),
      }))
    },
    []
  )

  const addMilestone = useCallback(() => {
    setData((previous) => ({
      ...previous,
      milestones: [...previous.milestones, defaultMilestone()],
    }))
  }, [])

  const removeMilestone = useCallback((id: string) => {
    setData((previous) => ({
      ...previous,
      milestones:
        previous.milestones.length > 1
          ? previous.milestones.filter((milestone) => milestone.id !== id)
          : previous.milestones,
    }))
  }, [])

  const moveMilestone = useCallback((fromIndex: number, toIndex: number) => {
    setData((previous) => {
      if (
        toIndex < 0 ||
        toIndex >= previous.milestones.length ||
        fromIndex === toIndex
      ) {
        return previous
      }

      const milestones = [...previous.milestones]
      const [moved] = milestones.splice(fromIndex, 1)
      milestones.splice(toIndex, 0, moved)

      return { ...previous, milestones }
    })
  }, [])

  const totalAmount = data.milestones.reduce((sum, milestone) => {
    const amount = parseFloat(milestone.amount)
    return sum + (Number.isNaN(amount) ? 0 : amount)
  }, 0)

  const platformFee = totalAmount * 0.02
  const netToVendor = totalAmount - platformFee

  const validateStep = useCallback(
    (currentStep: number): boolean => {
      const nextErrors: typeof errors = {}
      const quotedTotal = Number.parseFloat(data.total_value)
      const milestoneTotal = data.milestones.reduce((sum, milestone) => {
        const amount = Number.parseFloat(milestone.amount)
        return sum + (Number.isNaN(amount) ? 0 : amount)
      }, 0)

      if (requireCounterparty && currentStep === 0) {
        if (!data.initiator_role) {
          nextErrors.initiator_role = 'Choose your role to continue'
        }
      }

      if (!requireCounterparty && currentStep === 0) {
        if (!data.title.trim() || data.title.trim().length < 3) {
          nextErrors.title = 'Title must be at least 3 characters'
        }
        if (!data.industry) {
          nextErrors.industry = 'Select an industry'
        }
        if (!data.currency) {
          nextErrors.currency = 'Select a currency'
        }
      }

      if (requireCounterparty && currentStep === 1) {
        if (!data.title.trim() || data.title.trim().length < 3) {
          nextErrors.title = 'Title must be at least 3 characters'
        }
        if (!data.industry) {
          nextErrors.industry = 'Select a category'
        }
        if (!data.total_value.trim()) {
          nextErrors.total_value = 'Enter the total contract value'
        } else if (Number.isNaN(quotedTotal) || quotedTotal <= 0) {
          nextErrors.total_value = 'Enter a valid total value'
        }
        if (!data.currency) {
          nextErrors.currency = 'Select a currency'
        }
        if (!data.terms.trim() || data.terms.trim().length < 20) {
          nextErrors.terms = 'Terms must be at least 20 characters'
        }
        if (!data.counterparty_name.trim() || data.counterparty_name.trim().length < 2) {
          nextErrors.counterparty_name = "Enter the other party's name"
        }
        if (!data.counterparty_email.trim()) {
          nextErrors.counterparty_email = "Enter the other party's email address"
        } else if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.counterparty_email)
        ) {
          nextErrors.counterparty_email = 'Enter a valid email address'
        }
      }

      if (currentStep === 1 && !requireCounterparty) {
        const hasInvalidMilestone =
          data.milestones.length === 0 ||
          data.milestones.some((milestone) => {
            const amount = parseFloat(milestone.amount)
            if (!milestone.title.trim()) {
              return true
            }

            if (!requireMilestoneAmounts) {
              return false
            }

            return Number.isNaN(amount) || amount <= 0
          })

        if (hasInvalidMilestone) {
          nextErrors.milestones =
            requireMilestoneAmounts
              ? 'All milestones need a title and a valid amount'
              : 'All milestones need a title'
        }
      }

      if (requireCounterparty && currentStep === 2) {
        const hasInvalidMilestone =
          data.milestones.length === 0 ||
          data.milestones.some((milestone) => {
            const amount = parseFloat(milestone.amount)
            return !milestone.title.trim() || Number.isNaN(amount) || amount <= 0
          })

        if (hasInvalidMilestone) {
          nextErrors.milestones = 'All milestones need a title and a valid amount'
        } else if (
          !Number.isNaN(quotedTotal) &&
          quotedTotal > 0 &&
          Math.abs(milestoneTotal - quotedTotal) > 0.01
        ) {
          nextErrors.milestones =
            'Milestone amounts must add up to the total contract value'
        }
      }

      if (currentStep === 2 && !requireCounterparty) {
        if (!data.terms.trim() || data.terms.trim().length < 20) {
          nextErrors.terms = 'Terms must be at least 20 characters'
        }
      }

      setErrors(nextErrors)
      return Object.keys(nextErrors).length === 0
    },
    [data, requireCounterparty, requireMilestoneAmounts]
  )

  const next = useCallback(() => {
    if (validateStep(step)) {
      setStep((current) => Math.min(current + 1, maxStep))
    }
  }, [maxStep, step, validateStep])

  const goToStep = useCallback(
    (targetStep: number) => {
      setErrors({})
      setStep(Math.max(0, Math.min(targetStep, maxStep)))
    },
    [maxStep]
  )

  const back = useCallback(() => {
    setErrors({})
    setStep((current) => Math.max(current - 1, 0))
  }, [])

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch {}

    setData(createInitialData())
    setErrors({})
    setStep(0)
  }, [storageKey])

  return {
    step,
    data,
    errors,
    totalAmount,
    platformFee,
    netToVendor,
    update,
    updateMilestone,
    addMilestone,
    removeMilestone,
    moveMilestone,
    next,
    goToStep,
    back,
    validateStep,
    clearDraft,
  }
}
