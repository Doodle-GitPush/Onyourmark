"use client"

import React, { useMemo, useRef, useState } from 'react'
import { MotionValue, motion, useScroll, useTransform } from 'motion/react'
import { ArrowDown, Plus } from 'lucide-react'
import { BrandType, createBrand } from '@/lib/brand'
import { Page, createPage } from '@/lib/deck'
import { PAIRINGS } from '@/lib/fonts'
import { SAMPLE_SVG } from '@/lib/svg'
import { cn } from '@/lib/utils'
import { Slide } from '@/components/deck/Slide'
import { EASE, SPRING } from '@/components/deck/ui'

interface LandingProps {
    /** Resolves to an error message, or null once the logo is accepted. */
    onFile: (file: File) => Promise<string | null>
    onSample: () => void
    /** A pairing already handed over from JustMyType. */
    pendingType: BrandType | null
}

const HEADLINE = ['Drop', 'a', 'logo.', 'Leave', 'with', 'a', 'brand', 'deck.']

/** One card of the scroll-driven fan: stacked at first, dealt out across
 *  the screen as the section scrolls through. */
function FanCard({ progress, offset, children }: { progress: MotionValue<number>; offset: number; children: React.ReactNode }) {
    const x = useTransform(progress, [0, 1], [`${offset * 6}%`, `${offset * 74}%`])
    const y = useTransform(progress, [0, 1], [Math.abs(offset) * -6, Math.abs(offset) * 26])
    const rotate = useTransform(progress, [0, 1], [offset * -2.5, offset * 5])
    const scale = useTransform(progress, [0, 1], [0.86 - Math.abs(offset) * 0.03, 1 - Math.abs(offset) * 0.06])
    return (
        <motion.div
            style={{ x, y, rotate, scale, zIndex: 10 - Math.abs(offset) }}
            className="absolute w-[min(52vw,560px)] rounded-xl overflow-hidden ring-1 ring-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)]"
        >
            {children}
        </motion.div>
    )
}

const STEPS = [
    { title: 'A full first draft', body: 'Cover, logo system, clear space, colours, typography, motion and a 3D render — built from the one file, coloured from the artwork itself.' },
    { title: 'Edit it like a document', body: 'Add, remove and reorder pages. Click any text to rewrite it. Change a colour or a typeface once and every page follows.' },
    { title: 'Present or export', body: 'Play it full screen with live motion, or hand over a PDF that matches the screen exactly.' },
]

/** The first screen: one job (drop an SVG), then a short scroll that shows
 *  what comes out the other side using the real slide renderer. */
export function Landing({ onFile, onSample, pendingType }: LandingProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const fanRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const [over, setOver] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { scrollYProgress } = useScroll({ container: scrollRef, target: fanRef, offset: ['start end', 'end start'] })
    const fan = useTransform(scrollYProgress, [0.12, 0.55], [0, 1], { clamp: true })

    // A sample brand, drawn with the same component the editor uses.
    const demo = useMemo(() => {
        const brand = createBrand(SAMPLE_SVG, 'Northpoint.svg', ['#FF4800', '#1B1B3A'])
        brand.type = PAIRINGS[0].type
        const pages: Page[] = [
            createPage('palette', brand),
            createPage('type', brand),
            createPage('cover', brand),
            createPage('motion', brand),
            createPage('variations', brand),
        ]
        return { brand, pages }
    }, [])

    const accept = async (file: File | undefined) => {
        if (!file) return
        setError(await onFile(file))
    }

    return (
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            {/* ── Hero ── */}
            <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center px-6 pb-24 text-center">
                <h1 className="text-[clamp(2.4rem,6.4vw,4.6rem)] font-medium leading-[1.02] tracking-[-0.035em] text-zinc-100">
                    {HEADLINE.map((word, i) => (
                        <React.Fragment key={i}>
                            <span className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
                                <motion.span
                                    className={cn('inline-block', i > 2 && 'text-zinc-500')}
                                    initial={{ y: '110%' }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 0.9, ease: EASE, delay: 0.08 + i * 0.06 }}
                                >
                                    {word}
                                </motion.span>
                            </span>
                            {i === 2 ? <br /> : ' '}
                        </React.Fragment>
                    ))}
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: EASE, delay: 0.65 }}
                    className="mt-6 max-w-md text-[15px] leading-relaxed text-zinc-500"
                >
                    Upload an SVG and get a client-ready deck — logo system, colours, typography and motion — that you edit page by page.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...SPRING, delay: 0.8 }}
                    className="mt-10 w-full max-w-md"
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".svg,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                            accept(e.target.files?.[0])
                            e.target.value = ''
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
                        onDragLeave={() => setOver(false)}
                        onDrop={(e) => {
                            e.preventDefault()
                            setOver(false)
                            accept(e.dataTransfer.files?.[0])
                        }}
                        className={cn(
                            'group relative flex w-full flex-col items-center gap-4 rounded-3xl px-8 py-12 transition-all duration-300',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.985]',
                            over ? 'scale-[1.03] bg-[#FF4800]/[0.07]' : 'bg-white/[0.025] hover:bg-white/[0.045]',
                        )}
                    >
                        {/* An SVG outline rather than a CSS border, so the dashes can march while a file hovers. */}
                        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                            <rect
                                x="0.5" y="0.5" rx="24" fill="none" strokeWidth="1" strokeDasharray="6 7"
                                style={{ width: 'calc(100% - 1px)', height: 'calc(100% - 1px)' }}
                                className={cn('transition-[stroke] duration-300', over ? 'stroke-[#FF4800] animate-[dash_0.6s_linear_infinite]' : 'stroke-white/15 group-hover:stroke-white/30')}
                            />
                        </svg>
                        <span
                            className={cn(
                                'grid size-12 place-items-center rounded-full ring-1 transition-all duration-500',
                                over ? 'rotate-90 scale-110 bg-[#FF4800] text-white ring-[#FF4800]' : 'text-zinc-400 ring-white/15 group-hover:rotate-90 group-hover:text-zinc-100 group-hover:ring-white/30',
                            )}
                        >
                            <Plus size={18} strokeWidth={1.5} />
                        </span>
                        <span className="text-[14px] text-zinc-300">{over ? 'Let go to build your deck' : 'Drop your SVG logo, or click to browse'}</span>
                    </button>

                    <div className="mt-4 min-h-5 text-[12px]">
                        {error ? (
                            <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: [0, -5, 5, -3, 3, 0] }} transition={{ duration: 0.4 }} className="inline-block text-[#FF4800]">
                                {error}
                            </motion.span>
                        ) : pendingType ? (
                            <span className="text-zinc-400">{pendingType.heading.family} + {pendingType.body.family} is ready — add your logo to continue.</span>
                        ) : (
                            <button type="button" onClick={onSample} className="text-zinc-600 underline decoration-zinc-800 underline-offset-4 transition-colors hover:text-zinc-300 hover:decoration-zinc-600">
                                No file to hand? Try it with a sample logo
                            </button>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    aria-hidden
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, y: [0, 6, 0] }}
                    transition={{ opacity: { delay: 1.6, duration: 0.6 }, y: { delay: 1.6, duration: 2.2, repeat: Infinity, ease: 'easeInOut' } }}
                    className="absolute bottom-8 text-zinc-700"
                >
                    <ArrowDown size={16} strokeWidth={1.5} />
                </motion.div>
            </section>

            {/* ── What comes out: a hand of real slides, dealt out by the scroll ── */}
            <section ref={fanRef} className="relative h-[170vh]">
                <div className="sticky top-0 flex h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden">
                    <div className="relative grid w-full flex-1 place-items-center">
                        {demo.pages.map((page, i) => (
                            <FanCard key={page.id} progress={fan} offset={i - 2}>
                                <Slide page={page} brand={demo.brand} index={i} mode="thumb" />
                            </FanCard>
                        ))}
                    </div>
                    <p className="pb-14 text-[12px] uppercase tracking-[0.2em] text-zinc-600">One file in. A whole deck out.</p>
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="mx-auto grid max-w-4xl gap-12 px-6 py-28 md:grid-cols-3 md:gap-10">
                {STEPS.map((step, i) => (
                    <motion.div
                        key={step.title}
                        initial={{ opacity: 0, y: 28 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ root: scrollRef, once: true, amount: 0.6 }}
                        transition={{ duration: 0.8, ease: EASE, delay: i * 0.1 }}
                    >
                        <div className="text-[11px] tabular-nums text-[#FF4800]">0{i + 1}</div>
                        <h2 className="mt-3 text-[17px] tracking-tight text-zinc-100">{step.title}</h2>
                        <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">{step.body}</p>
                    </motion.div>
                ))}
            </section>

            <section className="flex flex-col items-center px-6 pb-32">
                <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.94 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ root: scrollRef, once: true }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING}
                    onClick={() => inputRef.current?.click()}
                    className="h-12 rounded-full bg-zinc-100 px-7 text-[14px] font-medium text-zinc-900"
                >
                    Upload your logo
                </motion.button>
            </section>
        </div>
    )
}
