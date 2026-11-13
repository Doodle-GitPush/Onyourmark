"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { ArrowDown, ArrowUp, Check, Copy, FileDown, Trash2 } from 'lucide-react'
import { BG_INK, BG_MOTION, BG_PAPER, MOTION_PRESETS, accentOf, primaryOf } from '@/lib/brand'
import { MOTION_LABELS } from '@/lib/shaders'
import { cn } from '@/lib/utils'
import { Slide } from '@/components/deck/Slide'
import { MotionSwatch } from '@/components/deck/ShaderCanvas'
import { EASE } from '@/components/deck/ui'
import { DECK_ORDER, PALETTES, demoBrand, demoPage, useCycle, useMedia } from './demo'

type StepId = 'draft' | 'edit' | 'system' | 'motion' | 'three' | 'share'

const STEPS: { id: StepId; kicker: string; title: string; body: string; points: string[] }[] = [
    {
        id: 'draft',
        kicker: 'Generate',
        title: 'A whole deck from one file',
        body: 'Drop in an SVG and nine pages appear — cover, logo, colourways, clear space, palette, typography, motion, 3D and story — already coloured from your artwork.',
        points: ['Colours read from the logo itself', 'Works with Illustrator, Figma and Affinity exports', 'Outlines stay outlines, gradients stay gradients'],
    },
    {
        id: 'edit',
        kicker: 'Edit',
        title: 'Edit it like a document',
        body: 'Click any line on a slide and rewrite it in place. Add, duplicate, reorder and remove pages, and give each one its own background.',
        points: ['Ten page templates', 'Drag thumbnails to reorder', 'Undo for anything you remove'],
    },
    {
        id: 'system',
        kicker: 'Brand system',
        title: 'Change it once. Every page follows.',
        body: 'Your palette and typefaces live in one place. Swap a colour or a pairing and the whole deck restyles with it — codes and specimens included.',
        points: ['Up to six colours, with HEX, RGB and CMYK', 'Six starter pairings from Google Fonts', 'Or bring a pairing from JustMyType'],
    },
    {
        id: 'motion',
        kicker: 'Motion',
        title: 'A brand that moves',
        body: 'Living shader backgrounds, tinted with your colours. Put one behind a cover, a logo or a story page and it plays when you present.',
        points: ['Five presets: flow, aurora, orb, waves, halftone', 'Adjustable speed', 'Captured as a still in the PDF'],
    },
    {
        id: 'three',
        kicker: '3D',
        title: 'Your mark, as an object',
        body: 'The logo extruded and lit like a product shot. Choose chrome, glass, gold, matte or holographic, and tune the light in the 3D studio.',
        points: ['Five materials', 'Studio lighting and reflections', 'Orbit it live in a presentation'],
    },
    {
        id: 'share',
        kicker: 'Present & export',
        title: 'Present it, or hand it over',
        body: 'Play the deck full screen with live motion, or export a 1920 × 1080 PDF that matches the screen — fonts, motion and 3D included.',
        points: ['Keyboard or click to advance', 'One PDF, every page', 'Nothing to install, no account'],
    },
]

// ── Stage visuals ──────────────────────────────────────────

function DraftVisual({ live }: { live: boolean }) {
    const { brand, pages } = useMemo(() => {
        const brand = demoBrand()
        return { brand, pages: DECK_ORDER.map((t) => demoPage(brand, t)) }
    }, [])
    return (
        <div className="grid grid-cols-3 gap-2.5">
            {pages.map((p, i) => (
                <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={live ? { opacity: 1, scale: 1, y: 0 } : undefined}
                    transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 260, damping: 22 }}
                    className="overflow-hidden rounded-md ring-1 ring-white/10"
                >
                    <Slide page={p} brand={brand} index={i} mode="thumb" />
                </motion.div>
            ))}
        </div>
    )
}

const TITLES = ['Our principles', 'Built to be seen', 'Clear, calm, direct']

/** Types, holds, and deletes a line — like someone rewriting the slide. */
function useTypewriter(lines: string[], running: boolean) {
    const [text, setText] = useState('')
    useEffect(() => {
        if (!running) return
        let line = 0, len = 0, deleting = false
        let timer = 0
        const tick = () => {
            const target = lines[line]
            if (!deleting) {
                len += 1
                if (len >= target.length) { deleting = true; timer = window.setTimeout(tick, 1600); setText(target); return }
            } else {
                len -= 1
                if (len <= 0) { deleting = false; line = (line + 1) % lines.length }
            }
            setText(target.slice(0, len))
            timer = window.setTimeout(tick, deleting ? 28 : 70)
        }
        timer = window.setTimeout(tick, 400)
        return () => clearTimeout(timer)
    }, [lines, running])
    return text
}

function EditVisual({ live }: { live: boolean }) {
    const brand = useMemo(() => demoBrand(), [])
    const title = useTypewriter(TITLES, live)
    const page = useMemo(() => demoPage(brand, 'text', { bg: BG_INK, body: 'Click any text on a page to rewrite it — it saves as you go.' }), [brand])
    return (
        <div>
            <div className="mb-2.5 flex items-center justify-between text-[11px] text-zinc-500">
                <span><span className="text-zinc-600">02</span> &nbsp;Text</span>
                <span className="flex items-center gap-2">
                    {[primaryOf(brand), accentOf(brand), '#FFFFFF'].map((c) => <span key={c} className="size-3 rounded-full ring-1 ring-white/20" style={{ background: c }} />)}
                    <span className="size-3 rounded-full outline outline-[1.5px] outline-offset-2 outline-[#FF4800]" style={{ background: '#0A0A0A' }} />
                    <span className="mx-1 h-3 w-px bg-white/10" />
                    <ArrowUp size={12} /><ArrowDown size={12} /><Copy size={11} /><Trash2 size={11} />
                </span>
            </div>
            <div className="relative overflow-hidden rounded-lg ring-1 ring-white/[0.14]">
                <Slide page={{ ...page, title }} brand={brand} index={1} mode="display" active={live} />
                {/* The caret and the focus ring an edit shows in the studio */}
                <div className="pointer-events-none absolute left-[5%] top-[38%] h-[13%] w-[62%] rounded-sm outline outline-1 outline-white/40" />
            </div>
        </div>
    )
}

function SystemVisual({ live }: { live: boolean }) {
    const i = useCycle(PALETTES.length, 2200, live)
    const brand = useMemo(() => demoBrand({ palette: i, pairing: [0, 2, 4, 5][i] }), [i])
    const pages = useMemo(() => ({ palette: demoPage(brand, 'palette'), cover: demoPage(brand, 'cover'), type: demoPage(brand, 'type') }), [brand])
    return (
        <div className="relative pb-[14%]">
            <div className="overflow-hidden rounded-lg ring-1 ring-white/10">
                <Slide page={pages.palette} brand={brand} index={4} mode="display" active={live} entered />
            </div>
            <div className="absolute -bottom-2 -left-4 w-[46%] overflow-hidden rounded-lg ring-4 ring-[#0A0A0A]">
                <Slide page={pages.cover} brand={brand} index={0} mode="display" active={live} entered />
            </div>
            <div className="absolute -bottom-6 -right-3 w-[46%] overflow-hidden rounded-lg ring-4 ring-[#0A0A0A]">
                <Slide page={pages.type} brand={brand} index={5} mode="display" active={live} entered />
            </div>
            <div className="absolute -top-4 right-3 flex items-center gap-2 rounded-full bg-[#141416] px-3 py-1.5 text-[11px] text-zinc-300 ring-1 ring-white/10">
                <span className="flex -space-x-1">{PALETTES[i].colors.map((c) => <span key={c} className="size-3 rounded-full ring-1 ring-[#141416] transition-colors duration-500" style={{ background: c }} />)}</span>
                {PALETTES[i].name} · {brand.type?.heading.family}
            </div>
        </div>
    )
}

function MotionVisual({ live }: { live: boolean }) {
    const i = useCycle(MOTION_PRESETS.length, 3200, live)
    const preset = MOTION_PRESETS[i]
    const brand = useMemo(() => demoBrand({ palette: 2, motion: preset }), [preset])
    const page = useMemo(() => demoPage(brand, 'motion', { bg: BG_MOTION, title: MOTION_LABELS[preset] }), [brand, preset])
    return (
        <div>
            <div className="overflow-hidden rounded-lg ring-1 ring-white/10">
                <Slide page={page} brand={brand} index={6} mode="display" active={live} entered />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                {MOTION_PRESETS.map((p) => (
                    <span key={p} className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] ring-1 transition-all duration-500', p === preset ? 'text-zinc-100 ring-[#FF4800]/70 bg-white/[0.05]' : 'text-zinc-600 ring-white/[0.08]')}>
                        <MotionSwatch a={primaryOf(brand)} b={accentOf(brand)} className="size-2.5" />
                        {MOTION_LABELS[p]}
                    </span>
                ))}
            </div>
        </div>
    )
}

function ThreeVisual({ live }: { live: boolean }) {
    const brand = useMemo(() => demoBrand(), [])
    const page = useMemo(() => demoPage(brand, 'three'), [brand])
    return (
        <div className="overflow-hidden rounded-lg ring-1 ring-white/10">
            <Slide page={page} brand={brand} index={7} mode="display" active={live} />
        </div>
    )
}

function ShareVisual({ live }: { live: boolean }) {
    const { brand, pages } = useMemo(() => {
        const brand = demoBrand({ palette: 3, pairing: 1 })
        return { brand, pages: [demoPage(brand, 'cover'), demoPage(brand, 'variations'), demoPage(brand, 'palette'), demoPage(brand, 'story', { bg: BG_PAPER })] }
    }, [])
    const i = useCycle(pages.length, 2400, live)
    return (
        <div className="relative">
            <div className="relative overflow-hidden rounded-lg bg-black ring-1 ring-white/10">
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div key={i} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.5, ease: EASE }}>
                        <Slide page={pages[i]} brand={brand} index={i} mode="display" active={live} entered />
                    </motion.div>
                </AnimatePresence>
                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/10">
                    <motion.div className="h-full origin-left bg-white/80" animate={{ scaleX: (i + 1) / pages.length }} transition={{ duration: 0.5, ease: EASE }} />
                </div>
            </div>
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={live ? { opacity: 1, y: 0 } : undefined}
                transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
                className="absolute -bottom-7 -right-3 flex items-center gap-3 rounded-xl bg-[#141416] py-2.5 pl-3 pr-4 ring-1 ring-white/10"
            >
                <span className="grid size-9 place-items-center rounded-lg bg-[#FF4800]/15 text-[#FF4800]"><FileDown size={17} /></span>
                <span>
                    <span className="block text-[12px] text-zinc-100">northpoint-deck.pdf</span>
                    <span className="flex items-center gap-1 text-[11px] text-zinc-500"><Check size={11} className="text-emerald-400" /> 9 pages · 1920 × 1080</span>
                </span>
            </motion.div>
        </div>
    )
}

const VISUALS: Record<StepId, (p: { live: boolean }) => React.ReactElement> = {
    draft: DraftVisual,
    edit: EditVisual,
    system: SystemVisual,
    motion: MotionVisual,
    three: ThreeVisual,
    share: ShareVisual,
}

// ── Layout ─────────────────────────────────────────────────

function StepText({ step, index, active }: { step: (typeof STEPS)[number]; index: number; active: boolean }) {
    return (
        <div className={cn('transition-opacity duration-500', active ? 'opacity-100' : 'lg:opacity-30')}>
            <div className="flex items-center gap-3 text-[12px]">
                <span className="tabular-nums text-[#FF4800]">0{index + 1}</span>
                <span className="uppercase tracking-[0.18em] text-zinc-500">{step.kicker}</span>
            </div>
            <h3 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-[1.08] tracking-[-0.03em] text-zinc-50">{step.title}</h3>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-zinc-400">{step.body}</p>
            <ul className="mt-6 space-y-2.5">
                {step.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-[14px] text-zinc-300">
                        <Check size={15} className="mt-0.5 shrink-0 text-[#FF4800]" />
                        {p}
                    </li>
                ))}
            </ul>
        </div>
    )
}

/** A step on a narrow screen: the text, then its visual right under it. */
function MobileStep({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
    const ref = useRef<HTMLDivElement>(null)
    const live = useInView(ref, { amount: 0.4 })
    const Visual = VISUALS[step.id]
    return (
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease: EASE }}>
            <StepText step={step} index={index} active />
            <div ref={ref} className="mt-10"><Visual live={live} /></div>
        </motion.div>
    )
}

/** The desktop story: steps scroll by on the left while the stage on the
 *  right stays put and changes to show the step nearest the middle. */
function DesktopStory() {
    const [active, setActive] = useState(0)
    const stageRef = useRef<HTMLDivElement>(null)
    const stageInView = useInView(stageRef, { amount: 0.3 })
    const stepRefs = useRef<(HTMLDivElement | null)[]>([])

    useEffect(() => {
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step))
            },
            // A thin band across the middle of the viewport.
            { rootMargin: '-48% 0px -48% 0px' },
        )
        stepRefs.current.forEach((el) => el && io.observe(el))
        return () => io.disconnect()
    }, [])

    const step = STEPS[active]
    const Visual = VISUALS[step.id]

    return (
        <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-16">
            <div>
                {STEPS.map((s, i) => (
                    <div key={s.id} ref={(el) => { stepRefs.current[i] = el }} data-step={i} className="flex min-h-[78vh] items-center">
                        <StepText step={s} index={i} active={i === active} />
                    </div>
                ))}
            </div>
            <div>
                <div ref={stageRef} className="sticky top-0 flex h-screen items-center">
                    <div className="relative w-full">
                        {/* Progress through the steps */}
                        <div className="absolute -left-8 top-1/2 flex -translate-y-1/2 flex-col gap-2">
                            {STEPS.map((s, i) => (
                                <span key={s.id} className={cn('w-[3px] rounded-full transition-all duration-500', i === active ? 'h-8 bg-[#FF4800]' : 'h-3 bg-white/15')} />
                            ))}
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -16, scale: 0.98, transition: { duration: 0.25 } }}
                                transition={{ duration: 0.6, ease: EASE }}
                            >
                                <Visual live={stageInView} />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function Features() {
    const wide = useMedia('(min-width: 1024px)')
    return (
        <section id="features" className="relative px-6 py-24">
            <div className="mx-auto max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.8, ease: EASE }}
                    className="max-w-2xl"
                >
                    <p className="text-[12px] uppercase tracking-[0.22em] text-[#FF4800]">What it does</p>
                    <h2 className="mt-4 text-[clamp(2rem,4.4vw,3.5rem)] font-medium leading-[1.04] tracking-[-0.035em] text-zinc-50">
                        Everything a brand presentation needs, <span className="text-zinc-500">without the layout work.</span>
                    </h2>
                </motion.div>

                <div className="mt-16 lg:mt-4">
                    {wide === null ? null : wide ? (
                        <DesktopStory />
                    ) : (
                        <div className="space-y-28">
                            {STEPS.map((s, i) => <MobileStep key={s.id} step={s} index={i} />)}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

