'use client'

import { useCallback, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import {
  AlertTriangle,
  Archive,
  CheckCircle,
  File,
  FileText,
  Film,
  Image,
  Music,
  Upload,
  X,
} from 'lucide-react'

export interface UploadedFile {
  path: string
  name: string
  type: string
  size: number
}

interface FileUploadProps {
  contractId: string
  milestoneId: string
  onFilesChange: (files: UploadedFile[]) => void
  maxFiles?: number
  disabled?: boolean
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'audio/mpeg',
  'text/plain',
]

const MAX_SIZE = 50 * 1024 * 1024

type FileItem = {
  file: File
  id: string
  progress: number
  status: 'idle' | 'uploading' | 'done' | 'error'
  error?: string
  uploaded?: UploadedFile
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) {
    return Image
  }

  if (type.startsWith('video/')) {
    return Film
  }

  if (type.startsWith('audio/')) {
    return Music
  }

  if (type.includes('pdf')) {
    return FileText
  }

  if (type.includes('zip')) {
    return Archive
  }

  return File
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 ** 2) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export function FileUpload({
  contractId,
  milestoneId,
  onFilesChange,
  maxFiles = 5,
  disabled,
}: FileUploadProps) {
  const [items, setItems] = useState<FileItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const emitFiles = useCallback(
    (nextItems: FileItem[]) => {
      onFilesChange(
        nextItems
          .filter((item) => item.status === 'done' && item.uploaded)
          .map((item) => item.uploaded as UploadedFile)
      )
    },
    [onFilesChange]
  )

  const addFiles = useCallback(
    async (incoming: File[]) => {
      if (disabled) {
        return
      }

      setMessage(null)

      const remainingSlots = Math.max(0, maxFiles - items.length)
      const nextFiles = incoming.slice(0, remainingSlots)

      if (incoming.length > remainingSlots) {
        setMessage(`You can upload up to ${maxFiles} files per submission.`)
      }

      const valid: File[] = []

      for (const file of nextFiles) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          setMessage(`"${file.name}" is not an accepted file type.`)
          continue
        }

        if (file.size > MAX_SIZE) {
          setMessage(`"${file.name}" is larger than the 50MB limit.`)
          continue
        }

        valid.push(file)
      }

      if (valid.length === 0) {
        return
      }

      const supabase = createClient()
      const newItems = valid.map((file) => ({
        file,
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        progress: 0,
        status: 'idle' as const,
      }))

      setItems((current) => [...current, ...newItems])

      for (const item of newItems) {
        const safeName = sanitizeFileName(item.file.name)
        const path = `${contractId}/${milestoneId}/${Date.now()}_${safeName}`

        setItems((current) =>
          current.map((candidate) =>
            candidate.id === item.id
              ? { ...candidate, status: 'uploading', progress: 10 }
              : candidate
          )
        )

        const progressInterval = setInterval(() => {
          setItems((current) =>
            current.map((candidate) =>
              candidate.id === item.id &&
              candidate.status === 'uploading' &&
              candidate.progress < 85
                ? { ...candidate, progress: candidate.progress + 15 }
                : candidate
            )
          )
        }, 180)

        const { data, error } = await supabase.storage
          .from('deliverables')
          .upload(path, item.file, {
            cacheControl: '3600',
            upsert: false,
          })

        clearInterval(progressInterval)

        if (error) {
          setItems((current) =>
            current.map((candidate) =>
              candidate.id === item.id
                ? {
                    ...candidate,
                    status: 'error',
                    progress: 0,
                    error: error.message,
                  }
                : candidate
            )
          )
          continue
        }

        const uploaded: UploadedFile = {
          path: data.path,
          name: item.file.name,
          type: item.file.type,
          size: item.file.size,
        }

        setItems((current) => {
          const next = current.map((candidate) =>
            candidate.id === item.id
              ? {
                  ...candidate,
                  status: 'done' as const,
                  progress: 100,
                  uploaded,
                }
              : candidate
          )

          emitFiles(next)
          return next
        })
      }
    },
    [contractId, disabled, emitFiles, items.length, maxFiles, milestoneId]
  )

  const removeItem = useCallback(
    async (id: string) => {
      const item = items.find((candidate) => candidate.id === id)

      setItems((current) => {
        const next = current.filter((candidate) => candidate.id !== id)
        emitFiles(next)
        return next
      })

      if (item?.uploaded?.path) {
        const supabase = createClient()
        await supabase.storage.from('deliverables').remove([item.uploaded.path])
      }
    },
    [emitFiles, items]
  )

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    void addFiles(Array.from(event.dataTransfer.files))
  }

  const canAdd = items.length < maxFiles && !disabled

  return (
    <div>
      {canAdd && (
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex min-h-[148px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border-2 border-dashed px-5 py-6 text-center transition-all duration-150',
            dragging
              ? 'border-[hsl(var(--color-accent))] bg-[hsl(var(--color-accent)/0.05)]'
              : 'border-[hsl(var(--color-border-2))] hover:border-[hsl(var(--color-accent)/0.4)] hover:bg-[hsl(var(--color-surface-2)/0.5)]'
          )}
        >
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--color-surface-2))] transition-colors duration-150',
              dragging && 'bg-[hsl(var(--color-accent)/0.1)]'
            )}
          >
            <Upload
              size={18}
              className={
                dragging
                  ? 'text-[hsl(var(--color-accent))]'
                  : 'text-[hsl(var(--color-text-3))]'
              }
            />
          </div>
          <div>
            <p className="text-sm font-medium text-[hsl(var(--color-text-2))]">
              {dragging ? 'Drop files here' : 'Upload deliverables'}
            </p>
            <p className="mt-1 text-xs text-[hsl(var(--color-text-3))]">
              PDF, images, ZIP, Word, video, audio, text. Max 50MB each. Up to {maxFiles} files.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(',')}
            className="hidden"
            onChange={(event) => {
              void addFiles(Array.from(event.target.files ?? []))
              event.currentTarget.value = ''
            }}
          />
        </div>
      )}

      {message && (
        <div className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-warning)/0.25)] bg-[hsl(var(--color-warning)/0.08)] p-3">
          <AlertTriangle
            size={14}
            className="mt-0.5 shrink-0 text-[hsl(var(--color-warning))]"
          />
          <p className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
            {message}
          </p>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {items.map((item) => {
            const Icon = getFileIcon(item.file.type)

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-3"
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)]',
                    item.status === 'done'
                      ? 'bg-[hsl(var(--color-success)/0.1)]'
                      : item.status === 'error'
                        ? 'bg-[hsl(var(--color-danger)/0.1)]'
                        : 'bg-[hsl(var(--color-surface))]'
                  )}
                >
                  {item.status === 'done' ? (
                    <CheckCircle size={16} className="text-[hsl(var(--color-success))]" />
                  ) : item.status === 'error' ? (
                    <AlertTriangle size={16} className="text-[hsl(var(--color-danger))]" />
                  ) : (
                    <Icon size={16} className="text-[hsl(var(--color-text-3))]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[hsl(var(--color-text-1))]">
                    {item.file.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">
                    {formatBytes(item.file.size)}
                    {item.status === 'error' && item.error ? (
                      <span className="text-[hsl(var(--color-danger))]">
                        {' '}
                        · {item.error}
                      </span>
                    ) : null}
                  </p>
                  {item.status === 'uploading' && (
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-[hsl(var(--color-border))]">
                      <div
                        className="h-full rounded-full bg-[hsl(var(--color-accent))] transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {item.status !== 'uploading' && !disabled && (
                  <button
                    type="button"
                    onClick={() => {
                      void removeItem(item.id)
                    }}
                    className="shrink-0 rounded-[var(--radius-sm)] p-1.5 text-[hsl(var(--color-text-3))] transition-all duration-150 hover:bg-[hsl(var(--color-danger)/0.08)] hover:text-[hsl(var(--color-danger))]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
