'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type TemplateActionResult = {
  error?: string
  success?: boolean
  templateId?: string
}

const TemplateMilestoneSchema = z.object({
  title: z.string().min(1, 'Milestone title required'),
  description: z.string().optional(),
  amount_hint: z.number().positive().optional(),
})

const SaveTemplateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  industry: z.string().min(1, 'Select an industry'),
  currency: z.string().min(1),
  terms: z.string().optional(),
  is_public: z.boolean().default(false),
  milestones: z.array(TemplateMilestoneSchema).min(1),
})

export async function saveTemplate(
  input: z.infer<typeof SaveTemplateSchema>
): Promise<TemplateActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const parsed = SaveTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid template.' }
  }

  const { milestones, ...templateData } = parsed.data

  const { data: template, error: templateError } = await supabase
    .from('contract_templates')
    .insert({
      ...templateData,
      author_id: user.id,
      is_system: false,
    })
    .select('id')
    .single()

  if (templateError || !template) {
    return { error: 'Failed to save template.' }
  }

  const { error: milestoneError } = await supabase
    .from('template_milestones')
    .insert(
      milestones.map((milestone, index) => ({
        template_id: template.id,
        order_index: index,
        title: milestone.title,
        description: milestone.description ?? null,
        amount_hint: milestone.amount_hint ?? null,
      }))
    )

  if (milestoneError) {
    await supabase.from('contract_templates').delete().eq('id', template.id)
    return { error: 'Failed to save template milestones.' }
  }

  revalidatePath('/templates')
  revalidatePath(`/templates/${template.id}`)

  return { success: true, templateId: template.id }
}

export async function saveContractAsTemplate(
  contractId: string,
  isPublic: boolean = false
): Promise<TemplateActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const { data: contract } = await supabase
    .from('contracts')
    .select('title, description, industry, currency, terms')
    .eq('id', contractId)
    .eq('initiator_id', user.id)
    .single()

  if (!contract) {
    return { error: 'Contract not found.' }
  }

  const { data: milestonesData, error: milestonesError } = await supabase
    .from('milestones')
    .select('title, description, amount, order_index')
    .eq('contract_id', contractId)
    .order('order_index', { ascending: true })

  if (milestonesError) {
    return { error: 'Failed to load contract milestones.' }
  }

  const milestones = milestonesData ?? []

  return saveTemplate({
    title: `${contract.title} (template)`,
    description: contract.description ?? undefined,
    industry: contract.industry,
    currency: contract.currency,
    terms: contract.terms ?? undefined,
    is_public: isPublic,
    milestones: milestones.map((milestone) => ({
      title: String(milestone.title ?? ''),
      description:
        typeof milestone.description === 'string'
          ? milestone.description
          : undefined,
      amount_hint:
        typeof milestone.amount === 'number' ? milestone.amount : undefined,
    })),
  })
}

export async function deleteTemplate(
  templateId: string
): Promise<TemplateActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const { error } = await supabase
    .from('contract_templates')
    .delete()
    .eq('id', templateId)
    .eq('author_id', user.id)
    .eq('is_system', false)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/templates')
  revalidatePath(`/templates/${templateId}`)

  return { success: true }
}

export async function useTemplate(
  templateId: string
): Promise<TemplateActionResult> {
  const supabase = await createClient()

  await supabase.rpc('increment_template_use', {
    template_id: templateId,
  })

  revalidatePath('/templates')
  revalidatePath(`/templates/${templateId}`)

  return { success: true }
}
