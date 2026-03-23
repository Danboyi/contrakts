'use client'

import { useEffect, useMemo, useState } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import { detectPreviewMode } from '@/lib/utils/preview'
import { CodeLinkPreview } from './code-link-preview'
import { FilePreview } from './file-preview'
import { IframePreview } from './iframe-preview'
import { ImageGallery } from './image-gallery'
import type { Deliverable, Submission } from '@/types'

interface PreviewPanelProps {
  submission: Submission
  className?: string
}

type ResolvedDeliverable = Deliverable & {
  preview_url: string | null
}

function isAbsoluteUrl(path: string) {
  return /^https?:\/\//i.test(path)
}

export function PreviewPanel({
  submission,
  className,
}: PreviewPanelProps) {
  const [resolvedDeliverables, setResolvedDeliverables] = useState<
    ResolvedDeliverable[]
  >([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function resolveDeliverables() {
      const deliverables = submission.deliverables ?? []

      if (deliverables.length === 0) {
        setResolvedDeliverables([])
        setLoading(false)
        return
      }

      setLoading(true)
      const supabase = createClient()

      const resolved = await Promise.all(
        deliverables.map(async (deliverable) => {
          if (!deliverable.file_url) {
            return { ...deliverable, preview_url: null }
          }

          if (isAbsoluteUrl(deliverable.file_url)) {
            return {
              ...deliverable,
              preview_url: deliverable.file_url,
            }
          }

          const { data, error } = await supabase.storage
            .from('deliverables')
            .createSignedUrl(deliverable.file_url, 60 * 60)

          return {
            ...deliverable,
            preview_url: error ? null : data.signedUrl,
          }
        })
      )

      if (!active) {
        return
      }

      setResolvedDeliverables(resolved)
      setLoading(false)
    }

    void resolveDeliverables()

    return () => {
      active = false
    }
  }, [submission.deliverables])

  const images = useMemo(
    () =>
      resolvedDeliverables
        .filter(
          (deliverable) =>
            !!deliverable.preview_url && deliverable.file_type?.startsWith('image/')
        )
        .map((deliverable) => ({
          url: deliverable.preview_url as string,
          name: deliverable.file_name ?? 'Image',
        })),
    [resolvedDeliverables]
  )

  const pdfs = useMemo(
    () =>
      resolvedDeliverables.filter(
        (deliverable) =>
          !!deliverable.preview_url && deliverable.file_type === 'application/pdf'
      ),
    [resolvedDeliverables]
  )

  const otherFiles = useMemo(
    () =>
      resolvedDeliverables.filter(
        (deliverable) =>
          !!deliverable.preview_url &&
          !deliverable.file_type?.startsWith('image/') &&
          deliverable.file_type !== 'application/pdf'
      ),
    [resolvedDeliverables]
  )

  const primaryMode = detectPreviewMode({
    submissionType: submission.submission_type,
    externalUrl: submission.external_url,
    fileType: resolvedDeliverables[0]?.file_type ?? null,
  })

  const hasUrl = !!submission.external_url
  const hasAnything =
    hasUrl ||
    images.length > 0 ||
    pdfs.length > 0 ||
    otherFiles.length > 0 ||
    loading

  if (!hasAnything) {
    return null
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {hasUrl && primaryMode === 'iframe' ? (
        <IframePreview
          url={submission.external_url as string}
          title={`Preview - v${submission.version}`}
        />
      ) : null}

      {hasUrl && primaryMode === 'code_link' ? (
        <CodeLinkPreview url={submission.external_url as string} />
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2)/0.35)] px-4 py-3 text-sm text-[hsl(var(--color-text-3))]">
          <Spinner size="sm" />
          Preparing file previews...
        </div>
      ) : null}

      {images.length > 0 ? <ImageGallery images={images} /> : null}

      {pdfs.map((pdf) => (
        <FilePreview
          key={pdf.id}
          url={pdf.preview_url as string}
          name={pdf.file_name ?? 'Document.pdf'}
          type={pdf.file_type ?? 'application/pdf'}
        />
      ))}

      {otherFiles.map((file) => (
        <FilePreview
          key={file.id}
          url={file.preview_url as string}
          name={file.file_name ?? 'File'}
          type={file.file_type ?? 'application/octet-stream'}
        />
      ))}
    </div>
  )
}
