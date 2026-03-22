'use client'

import type { ReactNode } from 'react'
import { AnimateOnScroll } from '@/components/shared/animate-on-scroll'
import { useInView } from '@/hooks/use-in-view'
import { cn } from '@/lib/utils/cn'

export function AnimatedHeroBadge({ children }: { children: ReactNode }) {
  return (
    <div className="animate-fade-in" style={{ animationDuration: '600ms' }}>
      {children}
    </div>
  )
}

export function AnimatedHeadline({ children }: { children: ReactNode }) {
  return (
    <div className="animate-slide-up" style={{ animationDuration: '600ms', animationDelay: '150ms', animationFillMode: 'backwards' }}>
      {children}
    </div>
  )
}

export function AnimatedHeroCtas({ children }: { children: ReactNode }) {
  return (
    <div className="animate-slide-up" style={{ animationDuration: '600ms', animationDelay: '300ms', animationFillMode: 'backwards' }}>
      {children}
    </div>
  )
}

export function AnimatedStats({ children }: { children: ReactNode }) {
  return (
    <div className="animate-slide-up" style={{ animationDuration: '600ms', animationDelay: '450ms', animationFillMode: 'backwards' }}>
      {children}
    </div>
  )
}

export function AnimatedSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <AnimateOnScroll className={className}>
      {children}
    </AnimateOnScroll>
  )
}

export function AnimatedFeatureGrid({ children }: { children: ReactNode[] }) {
  const { ref, inView } = useInView(0.1)

  return (
    <div ref={ref} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {children.map((child, i) => (
        <div
          key={i}
          className={cn(
            'transition-all duration-500 ease-out',
            inView
              ? 'translate-y-0 opacity-100 scale-100'
              : 'translate-y-8 opacity-0 scale-[0.97]'
          )}
          style={{ transitionDelay: `${i * 80}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

export function AnimatedStepGrid({ children }: { children: ReactNode[] }) {
  const { ref, inView } = useInView(0.1)

  return (
    <div ref={ref} className="grid gap-8 md:grid-cols-4">
      {children.map((child, i) => (
        <div
          key={i}
          className={cn(
            'transition-all duration-600 ease-out',
            inView
              ? 'translate-y-0 opacity-100'
              : 'translate-y-10 opacity-0'
          )}
          style={{ transitionDelay: `${i * 120}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

export function AnimatedCounter({ value, label }: { value: string; label: string }) {
  const { ref, inView } = useInView(0.3)

  return (
    <div ref={ref}>
      <p
        className={cn(
          'text-2xl font-bold text-[hsl(var(--color-accent))] transition-all duration-700',
          inView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        )}
      >
        {value}
      </p>
      <p className={cn(
        'mt-1 text-xs text-[hsl(var(--color-text-3))] transition-all duration-700 delay-100',
        inView ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      )}>
        {label}
      </p>
    </div>
  )
}
