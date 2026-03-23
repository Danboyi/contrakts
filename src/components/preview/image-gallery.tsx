/* eslint-disable @next/next/no-img-element */
'use client'

import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

interface ImageFile {
  url: string
  name: string
}

interface ImageGalleryProps {
  images: ImageFile[]
  className?: string
}

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)
  const isOpen = selectedIndex !== null
  const current = selectedIndex !== null ? images[selectedIndex] : null

  const close = useCallback(() => {
    setSelectedIndex(null)
    setZoom(1)
  }, [])

  const prev = useCallback(() => {
    setSelectedIndex((currentIndex) =>
      currentIndex !== null
        ? currentIndex > 0
          ? currentIndex - 1
          : images.length - 1
        : null
    )
    setZoom(1)
  }, [images.length])

  const next = useCallback(() => {
    setSelectedIndex((currentIndex) =>
      currentIndex !== null
        ? currentIndex < images.length - 1
          ? currentIndex + 1
          : 0
        : null
    )
    setZoom(1)
  }, [images.length])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close()
      }
      if (event.key === 'ArrowLeft') {
        prev()
      }
      if (event.key === 'ArrowRight') {
        next()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [close, isOpen, next, prev])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (images.length === 0) {
    return null
  }

  return (
    <>
      <div
        className={cn(
          'grid gap-2',
          images.length === 1
            ? 'grid-cols-1'
            : images.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-2 sm:grid-cols-3',
          className
        )}
      >
        {images.map((image, index) => (
          <button
            key={`${image.url}-${index}`}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={cn(
              'group relative aspect-video overflow-hidden rounded-[var(--radius-lg)]',
              'border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))]',
              'transition-all duration-150 hover:border-[hsl(var(--color-accent)/0.4)]'
            )}
          >
            <img
              src={image.url}
              alt={image.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center bg-black/0',
                'transition-colors duration-150 group-hover:bg-black/30'
              )}
            >
              <Maximize2
                size={20}
                className="opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              />
            </div>
            <span
              className={cn(
                'absolute bottom-1.5 left-1.5 max-w-[90%] truncate rounded-[var(--radius-sm)]',
                'bg-black/55 px-1.5 py-0.5 text-[10px] text-white'
              )}
            >
              {image.name}
            </span>
          </button>
        ))}
      </div>

      {isOpen && current ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-white/70">
              {selectedIndex! + 1} / {images.length}
              <span className="ml-2 text-white/40">{current.name}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
                className="rounded-[var(--radius-sm)] p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ZoomOut size={16} />
              </button>
              <span className="min-w-[40px] text-center text-xs text-white/40">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((value) => Math.min(3, value + 0.25))}
                className="rounded-[var(--radius-sm)] p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ZoomIn size={16} />
              </button>
              <a
                href={current.url}
                download={current.name}
                className="rounded-[var(--radius-sm)] p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Download size={16} />
              </a>
              <button
                type="button"
                onClick={close}
                className="rounded-[var(--radius-sm)] p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-auto px-4">
            {images.length > 1 ? (
              <button
                type="button"
                onClick={prev}
                className={cn(
                  'absolute left-2 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full',
                  'bg-black/40 text-white/70 transition-colors hover:bg-black/60 hover:text-white sm:left-4'
                )}
              >
                <ChevronLeft size={20} />
              </button>
            ) : null}

            <img
              src={current.url}
              alt={current.name}
              className="max-h-full max-w-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
              draggable={false}
            />

            {images.length > 1 ? (
              <button
                type="button"
                onClick={next}
                className={cn(
                  'absolute right-2 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full',
                  'bg-black/40 text-white/70 transition-colors hover:bg-black/60 hover:text-white sm:right-4'
                )}
              >
                <ChevronRight size={20} />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
