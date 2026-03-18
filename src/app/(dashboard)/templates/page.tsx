import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TemplatesClient } from './templates-client'
import type { ContractTemplate } from '@/types'

export const metadata = { title: 'Templates' }

export default async function TemplatesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data } = await supabase
    .from('contract_templates')
    .select(
      `
        *,
        milestones:template_milestones(
          id,
          template_id,
          order_index,
          title,
          description,
          amount_hint
        ),
        author:users!author_id(full_name)
      `
    )
    .order('use_count', { ascending: false })

  const initialTemplates = ((data ?? []) as unknown as ContractTemplate[]).map(
    (template) => ({
      ...template,
      milestones: [...(template.milestones ?? [])].sort(
        (left, right) => left.order_index - right.order_index
      ),
    })
  )

  return (
    <TemplatesClient
      initialTemplates={initialTemplates}
      currentUserId={user.id}
    />
  )
}
