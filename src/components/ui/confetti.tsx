'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const COLORS = [
  'hsl(var(--color-accent))',
  'hsl(var(--color-success))',
  'hsl(45, 100%, 60%)',
  'hsl(280, 80%, 60%)',
  'hsl(200, 90%, 55%)',
  'hsl(340, 80%, 55%)',
]

interface Particle {
  id: number
  x: number
  y: number
  color: string
  rotation: number
  scale: number
  delay: number
  dx: number
  dy: number
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 20,
    y: 40,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 1,
    delay: Math.random() * 0.3,
    dx: (Math.random() - 0.5) * 80,
    dy: -(20 + Math.random() * 40),
  }))
}

export function Confetti({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (trigger) {
      setParticles(generateParticles(40))
      setShow(true)
      const timer = setTimeout(() => setShow(false), 2500)
      return () => clearTimeout(timer)
    }
  }, [trigger])

  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                opacity: 1,
                scale: 0,
                rotate: 0,
              }}
              animate={{
                left: `${p.x + p.dx}%`,
                top: `${p.y - p.dy + 80}%`,
                opacity: [1, 1, 0],
                scale: p.scale,
                rotate: p.rotation + 360,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5 + Math.random() * 0.5,
                delay: p.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute"
              style={{
                width: 8,
                height: 8,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                backgroundColor: p.color,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
