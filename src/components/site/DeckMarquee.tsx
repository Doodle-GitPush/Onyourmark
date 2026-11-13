"use client"

import React, { useMemo, useRef } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { BG_INK, BG_PAPER } from '@/lib/brand'
import { Page, PageTemplate, pageLabel } from '@/lib/deck'
import { Slide } from '@/components/deck/Slide'
import { DECK_ORDER, demoBrand, demoPage } from './demo'

/** The second row's variations, so it doesn't mirror the first. */
const ROW_B: Partial<Record<PageTemplate, Partial<Page>>> = {
    logo: { bg: BG_INK, logoMode: 'mono' },
    story: { bg: BG_PAPER },
}

/** Two rows of real slides that slide past in opposite directions as you
 *  scroll — every kind of page the studio makes, in two different brands. */
export function DeckMarquee() {
    const ref = useRef<HTMLElement>(null)
    const rows = useMemo(() => {
        const a = demoBrand({ palette: 0, pairing: 0 })
        const b = demoBrand({ palette: 1, pairing: 3 })
        const rowA = DECK_ORDER.map((t) => ({ brand: a, page: demoPage(a, t) }))
        const rowB = [...DECK_ORDER].reverse().map((t) => ({ brand: b, page: demoPage(b, t, ROW_B[t]) }))
        return [rowA, rowB]
    }, [])

    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
    // A spring between the scroll and the rows gives them a little weight.
    const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 24, restDelta: 0.0005 })
    const xA = useTransform(smooth, [0, 1], ['-4%', '-34%'])
    const xB = useTransform(smooth, [0, 1], ['-34%', '-4%'])
    const tilt = useTransform(smooth, [0, 0.5, 1], [-3, 0, 3])

    return (
        <section ref={ref} aria-label="Pages in every deck" className="relative overflow-hidden py-28">
            <motion.div style={{ rotate: tilt }} className="flex flex-col gap-5">
                {rows.map((row, r) => (
                    <motion.div key={r} style={{ x: r ? xB : xA }} className="flex w-max gap-5">
                        {[...row, ...row].map(({ brand, page }, i) => (
                            <figure key={`${page.id}-${i}`} aria-hidden={i >= row.length || undefined} className="group w-[300px] shrink-0 sm:w-[360px]">
                                <div className="overflow-hidden rounded-lg ring-1 ring-white/[0.08] transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:ring-white/30">
                                    <Slide page={page} brand={brand} index={i % row.length} mode="thumb" />
                                </div>
                                <figcaption className="mt-2.5 text-[12px] text-zinc-600 transition-colors duration-300 group-hover:text-zinc-300">{pageLabel(page)}</figcaption>
                            </figure>
                        ))}
                    </motion.div>
                ))}
            </motion.div>
        </section>
    )
}
