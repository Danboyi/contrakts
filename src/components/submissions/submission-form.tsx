'use client'

import { useCallback, useState } from 'react'
import { FileUpload, type UploadedFile } from '@/components/contracts/file-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createSubmission } from '@/lib/submissions/actions'
import { cn } from '@/lib/utils/cn'
import type { SubmissionType } from '@/types'
import {
  Code,
  FileText,
  Layers,
  Link as LinkIcon,
  Loader2,
  Send,
} from 'lucide-react'

interface SubmissionFormProps {
  contractId: string
  milestoneId: string
  version: number
  onSuccess?: () => void
  onCancel?: () => void
}

const SUBMISSION_TYPES: Array<{
  value: SubmissionType
  label: string
  icon: typeof FileText
  description: string
}> = [
  {
    value: 'files',
    label: 'Files',
    icon: FileText,
    description: 'Upload design files, documents, images, or other assets.',
  },
  {
    value: 'link',
    label: 'Link',
    icon: LinkIcon,
    description: 'Share a deployed site, Figma file, Drive link, or similar URL.',
  },
  {
    value: 'code',
    label: 'Code',
    icon: Code,
    description: 'Share a repository or preview URL for technical deliverables.',
  },
  {
    value: 'mixed',
    label: 'Mixed',
    icon: Layers,
    description: 'Combine files and URLs in the same milestone submission.',
  },
]

export function SubmissionForm({
  contractId,
  milestoneId,
  version,
  onSuccess,
  onCancel,
}: SubmissionFormProps) {
  const [type, setType] = useState<SubmissionType>('files')
  const [note, setNote] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showFileUpload = type === 'files' || type === 'mixed'
  const showLinkInput = type === 'link' || type === 'code' || type === 'mixed'
  const canSubmit =
    !submitting && (uploadedFiles.length > 0 || Boolean(externalUrl.trim()))

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await createSubmission({
        contractId,
        milestoneId,
        note: note.trim() || undefined,
        submissionType: type,
        externalUrl: externalUrl.trim() || undefined,
        deliverables: uploadedFiles.map((file, index) => ({
          fileUrl: file.path,
          fileName: file.name,
          fileType: file.type,
          sortOrder: index,
        })),
      })

      setNote('')
      setExternalUrl('')
      setUploadedFiles([])
      onSuccess?.()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to submit this delivery.'
      )
    } finally {
      setSubmitting(false)
    }
  }, [canSubmit, contractId, externalUrl, milestoneId, note, onSuccess, type, uploadedFiles])

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
        'bg-[hsl(var(--color-surface))]'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-3 border-b border-[hsl(var(--color-border))]',
          'bg-[hsl(var(--color-surface-2)/0.5)] px-4 py-3 sm:px-5'
        )}
      >
        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
            Submit Delivery
          </h3>
          <p className="mt-0.5 text-[11px] text-[hsl(var(--color-text-3))]">
            Version {version}
          </p>
        </div>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-5 p-4 sm:p-5">
        <div>
          <p className="mb-2 text-xs font-medium text-[hsl(var(--color-text-2))]">
            Submission type
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SUBMISSION_TYPES.map((submissionType) => {
              const Icon = submissionType.icon
              const isActive = type === submissionType.value

              return (
                <button
                  key={submissionType.value}
                  type="button"
                  onClick={() => setType(submissionType.value)}
                  className={cn(
                    'flex min-h-[44px] flex-col items-center gap-1.5 rounded-[var(--radius-lg)] border p-3 text-center transition-all duration-150',
                    isActive
                      ? 'border-[hsl(var(--color-accent))] bg-[hsl(var(--color-accent)/0.06)]'
                      : 'border-[hsl(var(--color-border))] hover:border-[hsl(var(--color-border-2))] hover:bg-[hsl(var(--color-surface-2)/0.3)]'
                  )}
                >
                  <Icon
                    size={16}
                    className={
                      isActive
                        ? 'text-[hsl(var(--color-accent))]'
                        : 'text-[hsl(var(--color-text-3))]'
                    }
                  />
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isActive
                        ? 'text-[hsl(var(--color-accent))]'
                        : 'text-[hsl(var(--color-text-2))]'
                    )}
                  >
                    {submissionType.label}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-[hsl(var(--color-text-3))]">
            {
              SUBMISSION_TYPES.find((submissionType) => submissionType.value === type)
                ?.description
            }
          </p>
        </div>

        {showFileUpload && (
          <div>
            <p className="mb-2 text-xs font-medium text-[hsl(var(--color-text-2))]">
              Files
            </p>
            <FileUpload
              contractId={contractId}
              milestoneId={milestoneId}
              onFilesChange={setUploadedFiles}
              maxFiles={10}
              disabled={submitting}
            />
          </div>
        )}

        {showLinkInput && (
          <Input
            label={type === 'code' ? 'Repository or preview URL' : 'External link'}
            value={externalUrl}
            onChange={(event) => setExternalUrl(event.target.value)}
            placeholder={
              type === 'code'
                ? 'https://github.com/user/repo or https://preview.example.com'
                : 'https://figma.com/file/... or https://drive.google.com/...'
            }
            type="url"
          />
        )}

        <Textarea
          label="Notes for the service receiver"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Describe what you are delivering, what to review, or any setup instructions."
          rows={3}
        />

        {error && (
          <p className="text-xs text-[hsl(var(--color-danger))]">{error}</p>
        )}

        <Button
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send size={16} />
              Submit v{version}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
