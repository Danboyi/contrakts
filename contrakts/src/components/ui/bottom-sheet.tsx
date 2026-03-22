'use client'

import * as React from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
}

const SNAP_LOW = 0.5
const SNAP_HIGH = 0.9
const DISMISS_THRESHOLD = 0.3

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
}: BottomSheetProps) {
  const sheetRef = React.useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)
  const [snapHeight, setSnapHeight] = React.useState(SNAP_HIGH)

  const windowHeight = React.useMemo(() => {
    if (typeof window === 'undefined') return 800
    return window.innerHeight
  }, [])

  const sheetHeight = snapHeight * windowHeight
  const backdropOpacity = useTransform(
    y,
    [0, sheetHeight],
    [0.6, 0]
  )

  const handleDragEnd = (
    _: unknown,
    info: { offset: { y: number }; velocity: { y: number } }
  ) => {
    const offsetY = info.offset.y
    const velocityY = info.velocity.y

    // Fast fling down -> dismiss
    if (velocityY > 500) {
      onOpenChange(false)
      return
    }

    // Fast fling up -> snap high
    if (velocityY < -500) {
      setSnapHeight(SNAP_HIGH)
      return
    }

    const currentPosition = sheetHeight - offsetY
    const currentRatio = currentPosition / windowHeight

    // Below dismiss threshold -> close
    if (currentRatio < DISMISS_THRESHOLD) {
      onOpenChange(false)
      return
    }

    // Snap to nearest point
    const midpoint = (SNAP_LOW + SNAP_HIGH) / 2
    if (currentRatio < midpoint) {
      setSnapHeight(SNAP_LOW)
    } else {
      setSnapHeight(SNAP_HIGH)
    }
  }

  // Desktop fallback: render children in a plain div
  return (
    <>
      {/* Desktop fallback */}
      <div className="hidden md:block">{open && children}</div>

      {/* Mobile bottom sheet */}
      <div className="block md:hidden">
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <motion.div
                key="bottom-sheet-backdrop"
                className="fixed inset-0 z-50 backdrop-blur-sm"
                style={{
                  backgroundColor: `hsla(0, 0%, 0%, var(--backdrop-opacity))`,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => onOpenChange(false)}
              >
                <motion.div
                  className="absolute inset-0 bg-black"
                  style={{ opacity: backdropOpacity }}
                />
              </motion.div>

              {/* Sheet */}
              <motion.div
                key="bottom-sheet-content"
                ref={sheetRef}
                className={cn(
                  'fixed bottom-0 left-0 right-0 z-50',
                  'rounded-t-[var(--radius-xl)]',
                  'bg-[hsl(var(--color-surface))]',
                  'border-t border-x border-[hsl(var(--color-border))]',
                  'shadow-[0_-8px_30px_hsl(0_0%_0%/0.3)]',
                  'flex flex-col',
                  'touch-none'
                )}
                style={{
                  height: sheetHeight,
                  y,
                }}
                initial={{ y: windowHeight }}
                animate={{ y: 0 }}
                exit={{ y: windowHeight }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: sheetHeight }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
              >
                {/* Drag handle */}
                <div className="flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                  <div
                    className={cn(
                      'h-1 w-10 rounded-full',
                      'bg-[hsl(var(--color-text-3)/0.4)]'
                    )}
                  />
                </div>

                {/* Title */}
                {title && (
                  <div
                    className={cn(
                      'px-5 pb-3',
                      'border-b border-[hsl(var(--color-border))]'
                    )}
                  >
                    <h2 className="text-base font-semibold text-[hsl(var(--color-text-1))]">
                      {title}
                    </h2>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                  {children}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
