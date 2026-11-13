"use client"

import React, { useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring } from 'motion/react'
import { cn } from '@/lib/utils'
import { EASE } from '@/components/deck/ui'

interface RevealHeadingProps {
    text: string
    /** A second phrase in the quieter grey, carried on after `text`. */
    muted?: string
    as?: 'h1' | 'h2' | 'h3'
    className?: string
    /** Start immediately rather than when scrolled into view. */
    immediate?: boolean
}

/** A heading whose words rise into place, one after another, the first
 *  time it scrolls into view. */
export function RevealHeading({ text, muted, as = 'h2', className, immediate }: RevealHeadingProps) {
    const Tag = motion[as]
    const words = [...text.split(' ').map((w) => ({ w, muted: false })), ...(muted ? muted.split(' ').map((w) => ({ w, muted: true })) : [])]
    return (
        <Tag
            className={className}
            initial="hidden"
            whileInView={immediate ? undefined : 'shown'}
            animate={immediate ? 'shown' : undefined}
            viewport={{ once: true, amount: 0.6 }}
        >
            {words.map(({ w, muted }, i) => (
                <React.Fragment key={i}>
                    <Word word={w} delay={i * 0.05} className={muted ? 'text-zinc-500' : undefined} />{' '}
                </React.Fragment>
            ))}
        </Tag>
    )
}

/** One word rising out of its own mask, on the heading's cue. */
function Word({ word, delay, className }: { word: string; delay: number; className?: string }) {
    return (
        <span className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
            <motion.span
                className={cn('inline-block', className)}
                variants={{ hidden: { y: '105%', rotate: 4 }, shown: { y: 0, rotate: 0 } }}
                transition={{ duration: 0.9, ease: EASE, delay }}
            >
                {word}
            </motion.span>
        </span>
    )
}


/** Leans its child toward the pointer while it's near, and springs back
 *  when it leaves. */
export function Magnetic({ children, strength = 0.3, className }: { children: React.ReactNode; strength?: number; className?: string }) {
    const ref = useRef<HTMLDivElement>(null)
    const reduce = useReducedMotion()
    const x = useSpring(useMotionValue(0), { stiffness: 300, damping: 20, mass: 0.5 })
    const y = useSpring(useMotionValue(0), { stiffness: 300, damping: 20, mass: 0.5 })
    return (
        <motion.div
            ref={ref}
            className={cn('inline-block', className)}
            style={{ x, y }}
            onPointerMove={(e) => {
                if (reduce || e.pointerType !== 'mouse') return
                const r = ref.current!.getBoundingClientRect()
                x.set((e.clientX - r.left - r.width / 2) * strength)
                y.set((e.clientY - r.top - r.height / 2) * strength)
            }}
            onPointerLeave={() => { x.set(0); y.set(0) }}
        >
            {children}
        </motion.div>
    )
}

/** A hairline across the top of the page that fills as you read. */
export function ScrollProgress() {
    const { scrollYProgress } = useScroll()
    const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 })
    return <motion.div aria-hidden style={{ scaleX }} className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-[#FF4800]" />
}
