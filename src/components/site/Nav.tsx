"use client"

import React, { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { savedDeckName } from '@/lib/useDeck'
import { cn } from '@/lib/utils'
import { SPRING } from '@/components/deck/ui'

const LINKS = [
    { href: '#features', label: 'Features' },
    { href: '#how', label: 'How it works' },
    { href: '#who', label: 'Who it’s for' },
    { href: '#faq', label: 'FAQ' },
]

/** The mark: a circle opening to the north-east, like the sample brand. */
export function Mark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 120 120" aria-hidden className={className}>
            <path d="M60 12a48 48 0 1 0 48 48H60Z" fill="currentColor" />
            <circle cx="86" cy="34" r="22" fill="#FF4800" />
        </svg>
    )
}

// Another tab saving or clearing a deck updates the label here too.
const subscribe = (onChange: () => void) => {
    window.addEventListener('storage', onChange)
    return () => window.removeEventListener('storage', onChange)
}

/** Returning visitors are taken back to their deck by name. */
export function useStudioLabel() {
    const deck = useSyncExternalStore(subscribe, savedDeckName, () => null)
    return deck ? `Open ${deck}` : 'Open the studio'
}

export function Nav() {
    const { scrollY } = useScroll()
    const [scrolled, setScrolled] = useState(false)
    useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24))
    const studio = useStudioLabel()

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...SPRING, delay: 0.1 }}
            className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3"
        >
            <nav
                className={cn(
                    'flex h-12 w-full max-w-5xl items-center justify-between rounded-full pl-5 pr-1.5 transition-all duration-500',
                    scrolled ? 'bg-[#141416] ring-1 ring-white/[0.08]' : 'bg-transparent',
                )}
            >
                <Link href="/" className="group flex items-center gap-2.5 text-[14px] tracking-tight text-zinc-100">
                    <Mark className="size-5 text-zinc-100 transition-transform duration-500 group-hover:rotate-[-20deg]" />
                    OnYourMark
                </Link>

                <div className="hidden items-center gap-1 md:flex">
                    {LINKS.map((l) => (
                        <a key={l.href} href={l.href} className="group relative px-3.5 py-1.5 text-[13px] text-zinc-400 transition-colors hover:text-zinc-100">
                            {l.label}
                            <span className="absolute inset-x-3.5 bottom-0.5 h-px origin-right scale-x-0 bg-[#FF4800] transition-transform duration-300 ease-out group-hover:origin-left group-hover:scale-x-100" />
                        </a>
                    ))}
                </div>

                <Link
                    href="/studio"
                    className="group flex h-9 items-center gap-1.5 rounded-full bg-zinc-100 pl-4 pr-3.5 text-[13px] font-medium text-zinc-900 transition-all duration-200 hover:bg-white active:scale-95"
                >
                    <span className="max-w-[40vw] truncate">{studio}</span>
                    <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
            </nav>
        </motion.header>
    )
}
