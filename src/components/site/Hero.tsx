"use client"

import React, { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
    MotionValue, motion, useMotionTemplate, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform,
} from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { BG_PAPER } from '@/lib/brand'
import { PageTemplate } from '@/lib/deck'
import { Slide } from '@/components/deck/Slide'
import { EASE, SPRING } from '@/components/deck/ui'
import { PALETTES, demoBrand, demoPage, useCycle } from './demo'
import { Magnetic } from './motion'
import { useStudioLabel } from './Nav'

/** Gap between cells of the finished deck, as a fraction of the stage. */
const GAP = 0.02
/** A cell's size relative to the whole stage. */
const CELL = (1 - 2 * GAP) / 3

/** The eight pages dealt out around the cover — every one of them flat, so
 *  the hero has no motion background in it. */
const AROUND: { template: PageTemplate; cell: number }[] = [
    { template: 'logo', cell: 1 },
    { template: 'palette', cell: 3 },
    { template: 'type', cell: 5 },
    { template: 'variations', cell: 7 },
    { template: 'clearspace', cell: 0 },
    { template: 'story', cell: 2 },
    { template: 'logo', cell: 6 },
    { template: 'text', cell: 8 },
]

const PHRASE_A = ['Start', 'with', 'a', 'logo.']
const PHRASE_B = ['Leave', 'with', 'the', 'deck.']

/** One page flying from behind the cover out to its place in the grid. */
function DealtPage({ progress, cell, order, children }: { progress: MotionValue<number>; cell: number; order: number; children: React.ReactNode }) {
    const col = (cell % 3) - 1
    const row = Math.floor(cell / 3) - 1
    // The four edge-neighbours land first, then the corners.
    const start = 0.42 + order * 0.03
    // Every mapping names its resting value at the end of the hero too, so
    // nothing drifts once the deck has formed.
    const range = [0, start, start + 0.2, 1]
    const x = useTransform(progress, range, ['0%', '0%', `${col * (CELL + GAP) * 100}%`, `${col * (CELL + GAP) * 100}%`])
    const y = useTransform(progress, range, ['0%', '0%', `${row * (CELL + GAP) * 100}%`, `${row * (CELL + GAP) * 100}%`])
    const scale = useTransform(progress, range, [CELL * 0.7, CELL * 0.7, CELL, CELL])
    const opacity = useTransform(progress, [0, start, start + 0.06, 1], [0, 0, 1, 1])
    const rotate = useTransform(progress, range, [col * -8 + row * 4, col * -8 + row * 4, 0, 0])
    return (
        <motion.div className="absolute inset-0" style={{ x, y, scale, opacity, rotate }}>
            <div className="h-full w-full overflow-hidden rounded-[2.4%/4.2%] ring-1 ring-white/10 transition-transform duration-300 ease-out hover:scale-[1.04]">
                {children}
            </div>
        </motion.div>
    )
}

function HeadlineWord({ word, i, progress, phrase }: { word: string; i: number; progress: MotionValue<number>; phrase: 'a' | 'b' }) {
    // Phrase A leaves upward as the deck forms; phrase B arrives from below.
    const out = useTransform(progress, [0.3 + i * 0.015, 0.42 + i * 0.015], ['0%', '-110%'])
    const into = useTransform(progress, [0.5 + i * 0.02, 0.62 + i * 0.02], ['110%', '0%'])
    return (
        <span className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-bottom">
            {phrase === 'a' ? (
                <motion.span style={{ y: out }} className="inline-block">
                    <motion.span
                        className="inline-block"
                        initial={{ y: '110%' }}
                        animate={{ y: 0 }}
                        transition={{ duration: 1, ease: EASE, delay: 0.1 + i * 0.07 }}
                    >
                        {word}
                    </motion.span>
                </motion.span>
            ) : (
                <motion.span style={{ y: into }} className="inline-block text-[#FF4800]">{word}</motion.span>
            )}
        </span>
    )
}

/**
 * The hero is a short scroll story. Pinned in place, the logo sits alone as
 * a badge; scrolling opens it out into a cover slide, which then shrinks to
 * the middle of a 3 × 3 deck as eight more pages are dealt around it. Once
 * the deck has formed, its palette cycles — change a colour once and every
 * page follows.
 */
export function Hero() {
    const studio = useStudioLabel()
    const reduce = useReducedMotion()
    const sectionRef = useRef<HTMLElement>(null)
    const { scrollYProgress: p } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })

    const [formed, setFormed] = useState(false)
    useMotionValueEvent(p, 'change', (v) => setFormed(v > 0.72))
    const palette = useCycle(PALETTES.length, 2400, formed)

    const { brand, cover, around } = useMemo(() => {
        const brand = demoBrand({ palette, pairing: [0, 1, 2, 3][palette] })
        return {
            brand,
            cover: demoPage(brand, 'cover'),
            // Pages that would be black on the black page sit on the
            // brand's colours instead, so every cell reads as a page.
            around: AROUND.map(({ template, cell }) => ({
                cell,
                page: demoPage(brand, template,
                    template === 'text' ? { title: 'Our principles', body: 'Direct. Calm. Always pointing somewhere.', bg: BG_PAPER }
                        : template === 'story' ? { bg: brand.colors[1].id }
                            : cell === 6 ? { bg: brand.colors[0].id, logoMode: 'mono', title: 'One-colour mark' } : {}),
            })),
        }
    }, [palette])

    // Phase 1: the badge — a circle around the mark — opens to the full slide.
    const radius = useTransform(p, [0, 0.26, 1], [19, 74, 74])
    const clipPath = useMotionTemplate`circle(${radius}% at 50% 50%)`
    // Phase 2: the cover settles into the centre cell.
    const coverScale = useTransform(p, [0, 0.32, 0.6, 1], [1, 1, CELL, CELL])
    const coverRound = useTransform(p, [0, 0.32, 0.6, 1], [0, 0, 2.4, 2.4])
    const coverRadius = useMotionTemplate`${coverRound}%/${useTransform(coverRound, (r) => r * 1.78)}%`

    // The stage leans toward the pointer.
    const tiltX = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 })
    const tiltY = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 })
    const onPointerMove = (e: React.PointerEvent) => {
        if (reduce || e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        tiltY.set(((e.clientX - r.left) / r.width - 0.5) * 10)
        tiltX.set(-((e.clientY - r.top) / r.height - 0.5) * 8)
    }

    const cueOpacity = useTransform(p, [0, 0.06, 1], [1, 0, 0])
    const footOpacity = useTransform(p, [0, 0.7, 0.78, 1], [0, 0, 1, 1])
    const footY = useTransform(p, [0, 0.7, 0.78, 1], [12, 12, 0, 0])

    return (
        <section ref={sectionRef} className="relative h-[340vh]">
            <div
                className="sticky top-0 flex h-[100svh] flex-col items-center overflow-hidden px-5 pt-[6.5rem]"
                onPointerMove={onPointerMove}
                onPointerLeave={() => { tiltX.set(0); tiltY.set(0) }}
            >
                <h1 className="grid text-center text-[clamp(2.5rem,6.6vw,5.5rem)] font-medium leading-[1] tracking-[-0.045em] text-zinc-50">
                    <span className="col-start-1 row-start-1">
                        {PHRASE_A.map((w, i) => <React.Fragment key={i}><HeadlineWord word={w} i={i} progress={p} phrase="a" />{' '}</React.Fragment>)}
                    </span>
                    <span className="col-start-1 row-start-1">
                        {PHRASE_B.map((w, i) => <React.Fragment key={i}><HeadlineWord word={w} i={i} progress={p} phrase="b" />{' '}</React.Fragment>)}
                    </span>
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: EASE, delay: 0.45 }}
                    className="mt-5 max-w-lg text-center text-[16px] leading-relaxed text-zinc-400 sm:text-[17px]"
                >
                    Drop in an SVG and OnYourMark builds the brand deck you’d hand a client — ready to edit, present and export.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...SPRING, delay: 0.6 }}
                    className="mt-7 flex items-center gap-2"
                >
                    <Magnetic>
                        <Link
                            href="/studio"
                            className="group flex h-11 items-center gap-2 whitespace-nowrap rounded-full bg-zinc-100 pl-5 pr-4 text-[14px] font-medium text-zinc-900 sm:h-12 sm:pl-6 sm:pr-5 sm:text-[15px] transition-colors duration-200 hover:bg-white active:scale-95"
                        >
                            {studio === 'Open the studio' ? 'Start with your logo' : studio}
                            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                    </Magnetic>
                    <Magnetic>
                        <a href="#features" className="flex h-11 items-center whitespace-nowrap rounded-full px-5 text-[14px] text-zinc-300 sm:h-12 sm:px-6 sm:text-[15px] ring-1 ring-white/10 transition-colors duration-200 hover:bg-white/[0.04] hover:ring-white/25">
                            How it works
                        </a>
                    </Magnetic>
                </motion.div>

                {/* The stage */}
                <div className="relative mt-8 w-full flex-1 [perspective:1600px]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.35 }}
                        className="absolute left-1/2 top-[46%] aspect-video w-[min(92vw,calc((100svh-27rem)*16/9),1040px)] -translate-x-1/2 -translate-y-1/2"
                    >
                        <motion.div className="relative h-full w-full" style={{ rotateX: tiltX, rotateY: tiltY }}>
                            {around.map(({ cell, page }, order) => (
                                <DealtPage key={cell} progress={p} cell={cell} order={order}>
                                    <Slide page={page} brand={brand} index={cell} mode="thumb" />
                                </DealtPage>
                            ))}
                            <motion.div className="absolute inset-0 overflow-hidden" style={{ scale: coverScale, borderRadius: coverRadius }}>
                                <motion.div className="h-full w-full" style={{ clipPath }}>
                                    <Slide page={cover} brand={brand} index={0} mode="thumb" />
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </motion.div>

                    <motion.p style={{ opacity: footOpacity, y: footY }} className="absolute inset-x-0 bottom-[3%] text-center text-[13px] text-zinc-500">
                        Change a colour once — <span className="text-zinc-300">every page follows.</span>
                    </motion.p>

                    {/* Scroll cue */}
                    <motion.div aria-hidden style={{ opacity: cueOpacity }} className="absolute inset-x-0 bottom-[4%] flex flex-col items-center gap-2 text-[11px] text-zinc-600">
                        Scroll
                        <span className="relative h-8 w-px overflow-hidden bg-white/10">
                            <motion.span
                                className="absolute inset-x-0 top-0 h-3 bg-zinc-300"
                                animate={{ y: ['-100%', '280%'] }}
                                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        </span>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
