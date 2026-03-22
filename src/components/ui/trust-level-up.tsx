'use client'

import { useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

const THRESHOLDS = [50, 75, 90] as const

interface TrustLevelUpProps {
  score: number
  previousScore: number
  show: boolean
  onDismiss: () => void
}

function getScoreColor(score: number): {
  stroke: string
  label: string
  textClass: string
  particleColor: string
} {
  if (score >= 90) {
    return {
      stroke: 'hsl(var(--color-success))',
      label: 'Excellent',
      textClass: 'text-[hsl(var(--color-success))]',
      particleColor: 'hsl(var(--color-success))',
    }
  }
  if (score >= 75) {
    return {
      stroke: 'hsl(var(--color-accent))',
      label: 'Good',
      textClass: 'text-[hsl(var(--color-accent))]',
      particleColor: 'hsl(var(--color-accent))',
    }
  }
  if (score >= 50) {
    return {
      stroke: 'hsl(var(--color-warning))',
      label: 'Fair',
      textClass: 'text-[hsl(var(--color-warning))]',
      particleColor: 'hsl(var(--color-warning))',
    }
  }
  return {
    stroke: 'hsl(var(--color-danger))',
    label: 'Poor',
    textClass: 'text-[hsl(var(--color-danger))]',
    particleColor: 'hsl(var(--color-danger))',
  }
}

function crossedThreshold(previous: number, current: number): boolean {
  return THRESHOLDS.some((t) => previous < t && current >= t)
}

interface Particle {
  id: number
  angle: number
  distance: number
  size: number
  delay: number
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (360 / count) * i + (Math.random() - 0.5) * 30,
    distance: 60 + Math.random() * 50,
    size: 3 + Math.random() * 5,
    delay: Math.random() * 0.2,
  }))
}

export function TrustLevelUp({
  score,
  previousScore,
  show,
  onDismiss,
}: TrustLevelUpProps) {
  const shouldShow = show && crossedThreshold(previousScore, score)
  const safeScore = Math.max(0, Math.min(100, score))
  const { stroke, label, textClass, particleColor } = getScoreColor(safeScore)
  const particles = useMemo(() => generateParticles(24), [])

  const handleDismiss = useCallback(() => {
    onDismiss()
  }, [onDismiss])

  useEffect(() => {
    if (!shouldShow) return
    const timer = window.setTimeout(handleDismiss, 3000)
    return () => window.clearTimeout(timer)
  }, [shouldShow, handleDismiss])

  const size = 140
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className={cn(
              'relative flex flex-col items-center gap-4 rounded-2xl',
              'bg-[hsl(var(--color-surface-1))] p-8 shadow-xl',
              'border border-[hsl(var(--color-border))]',
            )}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Particle burst */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {particles.map((p) => {
                const rad = (p.angle * Math.PI) / 180
                const tx = Math.cos(rad) * p.distance
                const ty = Math.sin(rad) * p.distance
                return (
                  <motion.div
                    key={p.id}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                    animate={{
                      x: tx,
                      y: ty,
                      opacity: [1, 1, 0],
                      scale: [0, 1.2, 0.6],
                    }}
                    transition={{
                      duration: 1,
                      delay: 0.3 + p.delay,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="absolute rounded-full"
                    style={{
                      width: p.size,
                      height: p.size,
                      backgroundColor: particleColor,
                    }}
                  />
                )
              })}
            </div>

            {/* Title */}
            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-sm font-semibold tracking-wide text-[hsl(var(--color-text-2))] uppercase"
            >
              Trust Score Level Up!
            </motion.p>

            {/* Animated progress ring */}
            <div className="relative" style={{ width: size, height: size }}>
              <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                style={{ transform: 'rotate(-90deg)' }}
              >
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="hsl(var(--color-border))"
                  strokeWidth={6}
                />
                <motion.circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{
                    strokeDashoffset:
                      circumference - (safeScore / 100) * circumference,
                  }}
                  transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                  className={cn('text-3xl font-bold leading-none', textClass)}
                >
                  {safeScore}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className={cn('mt-1 text-sm font-medium', textClass)}
                >
                  {label}
                </motion.span>
              </div>
            </div>

            {/* Dismiss hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1 }}
              className="text-xs text-[hsl(var(--color-text-3))]"
            >
              Tap to dismiss
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
