'use client'

import * as React from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
}

const PULL_THRESHOLD = 60
const MAX_PULL = 120

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [isPulling, setIsPulling] = React.useState(false)
  const pullDistance = useMotionValue(0)
  const startY = React.useRef(0)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const spinnerOpacity = useTransform(
    pullDistance,
    [0, PULL_THRESHOLD * 0.5, PULL_THRESHOLD],
    [0, 0.4, 1]
  )
  const spinnerScale = useTransform(
    pullDistance,
    [0, PULL_THRESHOLD],
    [0.5, 1]
  )
  const spinnerRotation = useTransform(
    pullDistance,
    [0, MAX_PULL],
    [0, 360]
  )

  const handleTouchStart = React.useCallback(
    (e: React.TouchEvent) => {
      if (isRefreshing) return

      // Only activate when scrolled to top
      const scrollTop = containerRef.current?.scrollTop ?? 0
      if (scrollTop > 0) return

      startY.current = e.touches[0].clientY
      setIsPulling(true)
    },
    [isRefreshing]
  )

  const handleTouchMove = React.useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling || isRefreshing) return

      const currentY = e.touches[0].clientY
      const delta = currentY - startY.current

      if (delta < 0) {
        pullDistance.set(0)
        return
      }

      // Apply resistance: distance tapers off as user pulls further
      const resistedDelta = Math.min(delta * 0.5, MAX_PULL)
      pullDistance.set(resistedDelta)
    },
    [isPulling, isRefreshing, pullDistance]
  )

  const handleTouchEnd = React.useCallback(async () => {
    if (!isPulling) return
    setIsPulling(false)

    const currentPull = pullDistance.get()

    if (currentPull >= PULL_THRESHOLD && !isRefreshing) {
      // Snap to threshold and start refresh
      pullDistance.set(PULL_THRESHOLD)
      setIsRefreshing(true)

      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        pullDistance.set(0)
      }
    } else {
      // Spring back
      pullDistance.set(0)
    }
  }, [isPulling, isRefreshing, onRefresh, pullDistance])

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Spinner indicator */}
      <motion.div
        className={cn(
          'flex items-center justify-center',
          'overflow-hidden'
        )}
        style={{ height: pullDistance }}
      >
        <motion.div
          className={cn(
            'flex items-center justify-center',
            'h-8 w-8 rounded-full',
            'border-2 border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface))]',
            'shadow-sm'
          )}
          style={{
            opacity: spinnerOpacity,
            scale: spinnerScale,
          }}
        >
          <motion.svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="text-[hsl(var(--color-accent))]"
            style={{
              rotate: isRefreshing ? undefined : spinnerRotation,
            }}
            animate={isRefreshing ? { rotate: 360 } : undefined}
            transition={
              isRefreshing
                ? { repeat: Infinity, duration: 0.8, ease: 'linear' }
                : undefined
            }
          >
            <path
              d="M21 12a9 9 0 1 1-6.219-8.56"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </motion.svg>
        </motion.div>
      </motion.div>

      {/* Content */}
      {children}
    </div>
  )
}
