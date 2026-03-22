'use client'

import * as React from 'react'
import {
  motion,
  useMotionValue,
  useTransform,
} from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeRight?: () => void
  onSwipeLeft?: () => void
  rightLabel?: string
  leftLabel?: string
}

const SWIPE_THRESHOLD = 100
const ACTION_WIDTH = 80

export function SwipeableCard({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = 'Approve',
  leftLabel = 'Dispute',
}: SwipeableCardProps) {
  const x = useMotionValue(0)
  const [isTouchDevice, setIsTouchDevice] = React.useState(false)

  React.useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  // Action label opacity based on swipe distance
  const rightActionOpacity = useTransform(x, [0, ACTION_WIDTH], [0, 1])
  const leftActionOpacity = useTransform(x, [-ACTION_WIDTH, 0], [1, 0])

  // Action scale for a nice spring feel
  const rightActionScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.8, 1])
  const leftActionScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0.8])

  const handleDragEnd = (
    _: unknown,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    const offsetX = info.offset.x
    const velocityX = info.velocity.x

    if (offsetX > SWIPE_THRESHOLD || velocityX > 500) {
      onSwipeRight?.()
    } else if (offsetX < -SWIPE_THRESHOLD || velocityX < -500) {
      onSwipeLeft?.()
    }
  }

  // Non-touch devices: render children directly
  if (!isTouchDevice) {
    return <>{children}</>
  }

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)]">
      {/* Right swipe action (Approve) - behind on the left */}
      <motion.div
        className={cn(
          'absolute inset-y-0 left-0 z-0',
          'flex items-center justify-center',
          'bg-[hsl(var(--color-success))]',
          'px-5'
        )}
        style={{
          width: ACTION_WIDTH,
          opacity: rightActionOpacity,
          scale: rightActionScale,
        }}
      >
        <span className="text-sm font-semibold text-white whitespace-nowrap">
          {rightLabel}
        </span>
      </motion.div>

      {/* Left swipe action (Dispute) - behind on the right */}
      <motion.div
        className={cn(
          'absolute inset-y-0 right-0 z-0',
          'flex items-center justify-center',
          'bg-[hsl(var(--color-danger))]',
          'px-5'
        )}
        style={{
          width: ACTION_WIDTH,
          opacity: leftActionOpacity,
          scale: leftActionScale,
        }}
      >
        <span className="text-sm font-semibold text-white whitespace-nowrap">
          {leftLabel}
        </span>
      </motion.div>

      {/* Draggable card content */}
      <motion.div
        className="relative z-10"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDragEnd={handleDragEnd}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
