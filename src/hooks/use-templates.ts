'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ContractTemplate } from '@/types'

export function useTemplates(
  filter?: {
    industry?: string
    mine?: boolean
  },
  initialTemplates: ContractTemplate[] = []
) {
  const [templates, setTemplates] = useState<ContractTemplate[]>(initialTemplates)
  const [loading, setLoading] = useState(initialTemplates.length === 0)

  const fetch = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let query = supabase
      .from('contract_templates')
      .select(
        `
          *,
          milestones:template_milestones(
            id,
            order_index,
            title,
            description,
            amount_hint
          ),
          author:users!author_id(full_name)
        `
      )
      .order('use_count', { ascending: false })

    if (filter?.mine) {
      if (!user) {
        setTemplates([])
        setLoading(false)
        return
      }

      query = query.eq('author_id', user.id)
    }

    if (filter?.industry) {
      query = query.eq('industry', filter.industry)
    }

    const { data } = await query

    setTemplates(
      ((data ?? []) as unknown as ContractTemplate[]).map((template) => ({
        ...template,
        milestones: [...(template.milestones ?? [])].sort(
          (left, right) => left.order_index - right.order_index
        ),
      }))
    )
    setLoading(false)
  }, [filter?.industry, filter?.mine])

  useEffect(() => {
    void fetch()
  }, [fetch])

  return { templates, loading, refetch: fetch }
}
