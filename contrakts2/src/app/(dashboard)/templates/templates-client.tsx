'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Layers, Plus, Search, X } from 'lucide-react'
import type { ContractTemplate } from '@/types'
import { useTemplates } from '@/hooks/use-templates'
import { TemplateCard } from '@/components/contracts/template-card'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils/cn'

const INDUSTRIES = [
  { value: 'all', label: 'All' },
  { value: 'creative', label: 'Creative' },
  { value: 'software', label: 'Software' },
  { value: 'construction', label: 'Construction' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'events', label: 'Events' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'supply', label: 'Supply' },
  { value: 'other', label: 'Other' },
] as const

export function TemplatesClient({
  initialTemplates,
  currentUserId,
}: {
  initialTemplates: ContractTemplate[]
  currentUserId: string
}) {
  const [tab, setTab] = useState('all')
  const [industry, setIndustry] = useState('all')
  const [search, setSearch] = useState('')
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const { templates: loadedTemplates, loading, refetch } = useTemplates(
    undefined,
    initialTemplates
  )

  const templates = loadedTemplates.filter(
    (template) => !hiddenIds.includes(template.id)
  )

  function matchesFilters(template: ContractTemplate) {
    const matchesIndustry =
      industry === 'all' || template.industry === industry
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      template.title.toLowerCase().includes(query) ||
      (template.description ?? '').toLowerCase().includes(query)

    return matchesIndustry && matchesSearch
  }

  const filteredAll = templates.filter(matchesFilters)
  const filteredMine = templates.filter(
    (template) => template.author_id === currentUserId && matchesFilters(template)
  )

  function handleDeleted(templateId: string) {
    setHiddenIds((current) =>
      current.includes(templateId) ? current : [...current, templateId]
    )
    void refetch()
  }

  return (
    <div>
      <PageHeader
        title="Templates"
        subtitle="Start faster with reusable contract templates"
        actions={
          <Link href="/templates/new">
            <Button leftIcon={<Plus size={15} />}>New template</Button>
          </Link>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="all">
              All templates
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  tab === 'all'
                    ? 'bg-[hsl(var(--color-accent)/0.1)] text-[hsl(var(--color-accent))]'
                    : 'bg-[hsl(var(--color-border))] text-[hsl(var(--color-text-3))]'
                )}
              >
                {templates.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="mine">
              My templates
              {templates.some((template) => template.author_id === currentUserId) && (
                <span
                  className={cn(
                    'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    tab === 'mine'
                      ? 'bg-[hsl(var(--color-accent)/0.1)] text-[hsl(var(--color-accent))]'
                      : 'bg-[hsl(var(--color-border))] text-[hsl(var(--color-text-3))]'
                  )}
                >
                  {
                    templates.filter(
                      (template) => template.author_id === currentUserId
                    ).length
                  }
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Enhanced search with clear button */}
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-text-3))]"
            />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={cn(
                'h-9 min-w-[220px] rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
                'bg-[hsl(var(--color-surface-2))] pl-9 pr-8 text-sm text-[hsl(var(--color-text-1))]',
                'outline-none placeholder:text-[hsl(var(--color-text-3))] transition-all duration-200',
                'focus:border-[hsl(var(--color-accent))] focus:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.1)]'
              )}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[hsl(var(--color-text-3))] transition-colors duration-200 hover:text-[hsl(var(--color-text-1))]"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Industry filter pills */}
        <div
          className={cn(
            'mb-6 flex items-center gap-1 overflow-x-auto rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface))] p-1.5'
          )}
        >
          {INDUSTRIES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setIndustry(option.value)}
              className={cn(
                'rounded-[var(--radius-md)] px-3.5 py-2 text-sm whitespace-nowrap transition-all duration-200',
                industry === option.value
                  ? 'bg-[hsl(var(--color-surface-2))] font-medium text-[hsl(var(--color-text-1))] shadow-sm'
                  : 'text-[hsl(var(--color-text-3))] hover:bg-[hsl(var(--color-surface-2)/0.5)] hover:text-[hsl(var(--color-text-2))]'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <TabsPanel value="all">
          {loading && templates.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--color-border))] border-t-[hsl(var(--color-accent))]" />
              <p className="text-sm text-[hsl(var(--color-text-3))]">Loading templates...</p>
            </div>
          ) : filteredAll.length === 0 ? (
            <EmptyState
              icon={<Layers size={22} />}
              title={
                search || industry !== 'all'
                  ? 'No templates match your filters'
                  : 'No templates yet'
              }
              description={
                search || industry !== 'all'
                  ? 'Try a different search or industry filter.'
                  : 'Create your first template to start building contracts faster.'
              }
              action={
                !search && industry === 'all'
                  ? {
                      label: 'Create template',
                      href: '/templates/new',
                      icon: <Plus size={14} />,
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredAll.map((template, index) => (
                <div
                  key={template.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                >
                  <TemplateCard
                    template={template}
                    isOwn={template.author_id === currentUserId}
                    onDeleted={handleDeleted}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsPanel>

        <TabsPanel value="mine">
          {filteredMine.length === 0 ? (
            <EmptyState
              icon={<Layers size={22} />}
              title="No personal templates yet"
              description="Save a contract as a template or create one from scratch to reuse it for future deals."
              action={{
                label: 'Create template',
                href: '/templates/new',
                icon: <Plus size={14} />,
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredMine.map((template, index) => (
                <div
                  key={template.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                >
                  <TemplateCard
                    template={template}
                    isOwn
                    onDeleted={handleDeleted}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsPanel>
      </Tabs>
    </div>
  )
}
