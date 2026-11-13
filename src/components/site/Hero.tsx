"use client"

import React, { useMemo, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView, useScroll, useTransform } from 'motion/react'
import { ArrowRight, Download, Play } from 'lucide-react'
import { BG_MOTION, accentOf, primaryOf } from '@/lib/brand'
import { logoUrl } from '@/lib/svg'
import { Slide } from '@/components/deck/Slide'
import { motionGradient } from '@/components/deck/ShaderCanvas'
import { EASE, SPRING } from '@/components/deck/ui'
import { DECK_ORDER, demoBrand, demoPage } from './demo'
import { useStudioLabel } from './Nav'

const LINE_1 = ['Your', 'logo,']
const LINE_2 = ['presented', 'like', 'it', 'matters.']

function Words({ words, from, className }: { words: string[]; from: number; className?: string }) {
    return (
        <>
            {words.map((w, i) => (
                <React.Fragment key={i}>
                    <span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom">
                        <motion.span
                            className={`inline-block ${className ?? ''}`}
                            initial={{ y: '110%' }}
                            animate={{ y: 0 }}
                            transition={{ duration: 1, ease: EASE, delay: 0.15 + (from + i) * 0.07 }}
                        >
                            {w}
                        </motion.span>
                    </span>{' '}
                </React.Fragment>
            ))}
        </>
    )
}

/** A still of the studio, assembled from the real slide renderer: the
 *  page rail, the cover on its live motion background, and the dock. */
function StudioFrame({ live }: { live: boolean }) {
    const { brand, pages, cover } = useMemo(() => {
        const brand = demoBrand()
        return {
            brand,
            pages: DECK_ORDER.map((t) => demoPage(brand, t)),
            cover: demoPage(brand, 'cover', { bg: BG_MOTION }),
        }
    }, [])

    return (
        <div className="overflow-hidden rounded-2xl bg-[#0A0A0A] ring-1 ring-white/10 shadow-[0_60px_160px_-30px_rgba(255,72,0,0.25),0_40px_100px_-20px_rgba(0,0,0,0.9)]">
            {/* Window bar */}
            <div className="flex h-11 items-center justify-between border-b border-white/[0.06] px-4">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => <span key={i} className="size-2.5 rounded-full bg-white/10" />)}
                    </div>
                    <span className="hidden text-[11px] text-zinc-500 sm:inline">OnYourMark <span className="text-zinc-700">/</span> Northpoint</span>
                </div>
                <div className="flex rounded-full bg-white/[0.04] p-0.5 text-[10px]">
                    <span className="rounded-full bg-white/[0.09] px-2.5 py-1 text-zinc-100">Deck</span>
                    <span className="px-2.5 py-1 text-zinc-500">3D studio</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="hidden items-center gap-1 px-2 text-zinc-400 sm:flex"><Play size={9} /> Present</span>
                    <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-900"><Download size={9} /> Export</span>
                </div>
            </div>

            <div className="relative flex gap-4 p-4 sm:gap-6 sm:p-6">
                {/* Rail */}
                <div className="hidden w-[13%] shrink-0 flex-col gap-2 sm:flex">
                    {pages.slice(0, 7).map((p, i) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: i === 0 ? 1 : 0.5, x: 0 }}
                            transition={{ delay: 0.9 + i * 0.06, duration: 0.5, ease: EASE }}
                            className={`overflow-hidden rounded-[4px] ring-1 ${i === 0 ? 'ring-[#FF4800]' : 'ring-white/10'}`}
                        >
                            <Slide page={i === 0 ? cover : p} brand={brand} index={i} mode="thumb" />
                        </motion.div>
                    ))}
                </div>

                {/* Active page */}
                <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center justify-between text-[10px] text-zinc-500">
                        <span><span className="text-zinc-600">01</span> &nbsp;Cover</span>
                        <span className="flex items-center gap-1.5">
                            {[primaryOf(brand), accentOf(brand), '#FFFFFF', '#0A0A0A'].map((c) => (
                                <span key={c} className="size-2.5 rounded-full ring-1 ring-white/20" style={{ background: c }} />
                            ))}
                            <span className="size-2.5 rounded-full outline outline-1 outline-offset-1 outline-[#FF4800]" style={{ background: motionGradient(primaryOf(brand), accentOf(brand)) }} />
                        </span>
                    </div>
                    <div className="overflow-hidden rounded-lg ring-1 ring-white/10">
                        <Slide page={cover} brand={brand} index={0} mode="display" active={live} />
                    </div>
                </div>

                {/* Dock */}
                <div className="absolute bottom-3 left-1/2 hidden -translate-x-1/2 items-center gap-3 rounded-full bg-[#141416]/90 px-3 py-1.5 text-[10px] text-zinc-400 ring-1 ring-white/[0.08] backdrop-blur-md sm:flex">
                    <span className="flex items-center gap-1.5">
                        <span className="grid size-4 place-items-center rounded-full bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG data URL */}
                            <img src={logoUrl(brand.logo.svg)} alt="" className="size-2.5" />
                        </span>
                        Logo
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="flex -space-x-1">
                            {brand.colors.map((c) => <span key={c.id} className="size-3 rounded-full ring-1 ring-[#141416]" style={{ background: c.hex }} />)}
                        </span>
                        Colours
                    </span>
                    <span className="flex items-center gap-1.5"><span className="font-serif text-[11px] text-zinc-100">Aa</span>Type</span>
                    <span className="flex items-center gap-1.5"><span className="size-3 rounded-full" style={{ background: motionGradient(primaryOf(brand), accentOf(brand)) }} />Motion</span>
                </div>
            </div>
        </div>
    )
}

export function Hero() {
    const studio = useStudioLabel()
    const frameRef = useRef<HTMLDivElement>(null)
    const live = useInView(frameRef, { amount: 0.15 })
    // The product shot starts tipped back and settles flat as you scroll to it.
    const { scrollYProgress } = useScroll({ target: frameRef, offset: ['start end', 'center center'] })
    const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0])
    const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1])
    const y = useTransform(scrollYProgress, [0, 1], [60, 0])

    return (
        <section className="relative overflow-hidden px-4 pt-36 sm:pt-44">
            {/* Ambient glow in the brand orange */}
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[720px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,72,0,0.16),transparent)] blur-2xl" />

            <div className="relative mx-auto max-w-4xl text-center">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: EASE }}
                    className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-1.5 text-[12px] text-zinc-400 ring-1 ring-white/[0.08]"
                >
                    <span className="size-1.5 rounded-full bg-[#FF4800] shadow-[0_0_10px_#FF4800]" />
                    Brand decks from one SVG
                </motion.div>

                <h1 className="mt-7 text-[clamp(2.6rem,7.4vw,5.6rem)] font-medium leading-[0.98] tracking-[-0.045em] text-zinc-50">
                    <Words words={LINE_1} from={0} />
                    <br />
                    <Words words={LINE_2} from={LINE_1.length} className="bg-gradient-to-b from-zinc-300 to-zinc-500 bg-clip-text text-transparent" />
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}
                    className="mx-auto mt-7 max-w-xl text-[17px] leading-relaxed text-zinc-400"
                >
                    Drop in a logo and OnYourMark builds the deck you’d hand a client — logo system, colour, typography, motion and 3D — ready to edit, present and export.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...SPRING, delay: 0.75 }}
                    className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
                >
                    <Link
                        href="/studio"
                        className="group flex h-12 items-center gap-2 rounded-full bg-zinc-100 pl-6 pr-5 text-[15px] font-medium text-zinc-900 shadow-[0_8px_30px_rgba(255,255,255,0.12)] transition-all duration-200 hover:bg-white hover:shadow-[0_8px_40px_rgba(255,255,255,0.2)] active:scale-95"
                    >
                        {studio === 'Open the studio' ? 'Start with your logo' : studio}
                        <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                    <a href="#features" className="flex h-12 items-center rounded-full px-6 text-[15px] text-zinc-300 ring-1 ring-white/10 transition-all duration-200 hover:bg-white/[0.04] hover:ring-white/20 active:scale-95">
                        See what it makes
                    </a>
                </motion.div>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.8 }}
                    className="mt-5 text-[12px] text-zinc-600"
                >
                    No account. Your work stays in your browser.
                </motion.p>
            </div>

            <div className="relative mx-auto mt-20 max-w-6xl [perspective:1800px]">
                <motion.div
                    ref={frameRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.2, ease: EASE, delay: 0.7 }}
                    style={{ rotateX, scale, y, transformOrigin: 'center top' }}
                >
                    <StudioFrame live={live} />
                </motion.div>
                {/* Fades the frame's lower edge into the page */}
                <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
            </div>
        </section>
    )
}
