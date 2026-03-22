'use client'

import type { ReactNode } from 'react'
import { useInView } from '@/hooks/use-in-view'
import { cn } from '@/lib/utils/cn'

interface AnimateOnScrollProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function AnimateOnScroll({ children, className, delay = 0 }: AnimateOnScrollProps) {
  const { ref, inView } = useInView(0.1)

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        inView
          ? 'translate-y-0 opacity-100'
          : 'translate-y-8 opacity-0',
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export function StaggerChildren({
  children,
  className,
  staggerMs = 100,
}: {
  children: ReactNode[]
  className?: string
  staggerMs?: number
}) {
  const { ref, inView } = useInView(0.1)

  return (
    <div ref={ref} className={className}>
      {children.map((child, i) => (
        <div
          key={i}
          className={cn(
            'transition-all duration-500 ease-out',
            inView
              ? 'translate-y-0 opacity-100'
              : 'translate-y-6 opacity-0'
          )}
          style={{ transitionDelay: `${i * staggerMs}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
