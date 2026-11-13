"use client"

import React, { useMemo } from 'react'
import { BG_INK, BG_MOTION, BG_PAPER } from '@/lib/brand'
import { Page, PageTemplate, pageLabel } from '@/lib/deck'
import { Slide } from '@/components/deck/Slide'
import { DECK_ORDER, demoBrand, demoPage } from './demo'

/** The second row's variations, so it doesn't mirror the first. */
const ROW_B: Partial<Record<PageTemplate, Partial<Page>>> = {
    cover: { bg: BG_MOTION },
    logo: { bg: BG_INK, logoMode: 'mono' },
    story: { bg: BG_PAPER },
}

/** Two rows of real slides drifting past in opposite directions — every
 *  kind of page the studio makes, in two different brands. */
export function DeckMarquee() {
    const rows = useMemo(() => {
        const a = demoBrand({ palette: 0, pairing: 0 })
        const b = demoBrand({ palette: 1, pairing: 3, motion: 'aurora' })
        const rowA = DECK_ORDER.map((t) => ({ brand: a, page: demoPage(a, t) }))
        const rowB = [...DECK_ORDER].reverse().map((t) => ({ brand: b, page: demoPage(b, t, ROW_B[t]) }))
        return [rowA, rowB]
    }, [])

    return (
        <section aria-label="Pages in every deck" className="relative py-24">
            <p className="mb-10 text-center text-[12px] uppercase tracking-[0.22em] text-zinc-600">Nine pages, built from a single file</p>
            <div className="group/marquee flex flex-col gap-5">
                {rows.map((row, r) => (
                    <div key={r} className="flex w-max gap-5 group-hover/marquee:[animation-play-state:paused]" style={{ animation: `marquee ${r ? 70 : 60}s linear infinite ${r ? 'reverse' : ''}` }}>
                        {/* Twice over, so the loop has no seam. */}
                        {[...row, ...row].map(({ brand, page }, i) => (
                            <figure key={`${page.id}-${i}`} aria-hidden={i >= row.length || undefined} className="w-[300px] shrink-0 sm:w-[340px]">
                                <div className="overflow-hidden rounded-lg ring-1 ring-white/[0.08]">
                                    <Slide page={page} brand={brand} index={i % row.length} mode="thumb" />
                                </div>
                                <figcaption className="mt-2.5 text-[11px] text-zinc-600">{pageLabel(page)}</figcaption>
                            </figure>
                        ))}
                    </div>
                ))}
            </div>
        </section>
    )
}
