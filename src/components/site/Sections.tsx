"use client"

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, MotionValue, motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { ArrowRight, ArrowUpRight, Briefcase, Building2, Plus, Sparkles, Upload, Users, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE } from '@/components/deck/ui'
import { RevealHeading } from './motion'

const H2 = 'text-[clamp(2rem,4.4vw,3.5rem)] font-medium leading-[1.04] tracking-[-0.035em] text-zinc-50'

const reveal = (i: number) => ({
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.9, ease: EASE, delay: i * 0.1 },
})

// ── How it works ───────────────────────────────────────────

const HOW = [
    { icon: Upload, title: 'Drop your SVG', body: 'Any export from Illustrator, Figma or Affinity. The deck is built in a second, coloured from your artwork.' },
    { icon: Wand2, title: 'Shape the deck', body: 'Set the palette and type once, rewrite any line in place, and keep only the pages this client needs.' },
    { icon: Sparkles, title: 'Present or export', body: 'Walk the client through it full screen, then send the PDF so they keep it.' },
]

/** A step that lights up once the drawing line reaches it. */
function HowStep({ step, index, line }: { step: (typeof HOW)[number]; index: number; line: MotionValue<number> }) {
    const [lit, setLit] = useState(false)
    // The line runs between the first and last icons; each step sits at 0, ½, 1.
    useMotionValueEvent(line, 'change', (v) => setLit(v >= Math.max(0.01, index / (HOW.length - 1) - 0.02)))
    return (
        <motion.div {...reveal(index)} className="group relative">
            <div
                className={cn(
                    'relative z-10 grid size-14 place-items-center rounded-2xl ring-1 transition-all duration-500',
                    lit ? 'bg-[#FF4800] text-white ring-[#FF4800]' : 'bg-[#0A0A0A] text-zinc-500 ring-white/10',
                    'group-hover:-rotate-6 group-hover:scale-105',
                )}
            >
                <step.icon size={22} strokeWidth={1.6} />
            </div>
            <h3 className={cn('mt-8 text-[22px] tracking-tight transition-colors duration-500', lit ? 'text-zinc-50' : 'text-zinc-500')}>{step.title}</h3>
            <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-zinc-400">{step.body}</p>
        </motion.div>
    )
}

export function HowItWorks() {
    const ref = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.75', 'end 0.45'] })
    const line = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), { stiffness: 120, damping: 30 })

    return (
        <section id="how" className="px-6 py-32">
            <div className="mx-auto max-w-6xl">
                <RevealHeading text="Three steps." muted="About five minutes." className={H2} />
                <div ref={ref} className="relative mt-20 grid gap-14 md:grid-cols-3 md:gap-10">
                    {/* The line that draws as you scroll, from the first icon's
                        centre to the last's: the third column starts at
                        ⅔ + ⅔·gap, and an icon's centre is 1.75rem in. */}
                    <div aria-hidden className="absolute left-7 right-[calc(33.333%-3.4167rem)] top-7 hidden h-px bg-white/10 md:block">
                        <motion.div style={{ scaleX: line }} className="h-full origin-left bg-[#FF4800]" />
                    </div>
                    {HOW.map((s, i) => <HowStep key={s.title} step={s} index={i} line={line} />)}
                </div>
            </div>
        </section>
    )
}

// ── Who it's for ───────────────────────────────────────────

const AUDIENCES = [
    {
        icon: Briefcase,
        who: 'Freelance designers',
        body: 'Present like a studio. Close an identity project with a deck that shows the logo working — not a zip file and an email.',
        points: ['A guidelines PDF to hand over', 'Live motion and 3D in the pitch', 'Minutes instead of an afternoon in layout'],
    },
    {
        icon: Building2,
        who: 'Studios and agencies',
        body: 'One standard for every project. Every identity your team ships gets the same structure and polish, so the time goes into the work.',
        points: ['A consistent first draft every time', 'Edit per client, keep the system', 'Show options by swapping palettes'],
    },
    {
        icon: Users,
        who: 'In-house brand teams',
        body: 'The brand, in one place. Give marketing, sales and partners a deck that shows the mark, the colours and the type the right way.',
        points: ['Colour codes for print and screen', 'Clear-space and minimum-size rules', 'Present it at the next all-hands'],
    },
]

function AudienceCard({ a, index }: { a: (typeof AUDIENCES)[number]; index: number }) {
    const ref = useRef<HTMLDivElement>(null)
    // The cards fan in from a slight rotation as the row arrives.
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.55'] })
    const rotate = useTransform(scrollYProgress, [0, 1], [(index - 1) * 6, 0])
    const y = useTransform(scrollYProgress, [0, 1], [80 + Math.abs(index - 1) * 40, 0])
    const opacity = useTransform(scrollYProgress, [0, 0.6], [0, 1])
    return (
        <motion.div ref={ref} style={{ rotate, y, opacity }}>
            <div className="group flex h-full flex-col rounded-2xl bg-white/[0.025] p-8 ring-1 ring-white/[0.07] transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/[0.04] hover:ring-white/20">
                <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-white/[0.04] text-zinc-400 ring-1 ring-white/10 transition-all duration-500 group-hover:rotate-[-8deg] group-hover:bg-[#FF4800] group-hover:text-white group-hover:ring-[#FF4800]">
                        <a.icon size={19} strokeWidth={1.6} />
                    </span>
                    <ArrowUpRight size={18} className="text-zinc-700 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-300" />
                </div>
                <h3 className="mt-10 text-[24px] tracking-tight text-zinc-50">{a.who}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">{a.body}</p>
                <ul className="mt-7 space-y-2.5 border-t border-white/[0.06] pt-6">
                    {a.points.map((p) => (
                        <li key={p} className="flex items-center gap-2.5 text-[14px] text-zinc-300">
                            <span className="size-1 rounded-full bg-[#FF4800] transition-transform duration-300 group-hover:scale-150" />
                            {p}
                        </li>
                    ))}
                </ul>
            </div>
        </motion.div>
    )
}

export function Audiences() {
    return (
        <section id="who" className="px-6 py-32">
            <div className="mx-auto max-w-6xl">
                <RevealHeading text="Made for the people" muted="who present brands." className={cn(H2, 'max-w-2xl')} />
                <div className="mt-16 grid gap-5 md:grid-cols-3">
                    {AUDIENCES.map((a, i) => <AudienceCard key={a.who} a={a} index={i} />)}
                </div>
            </div>
        </section>
    )
}

// ── Works with ─────────────────────────────────────────────

export function Ecosystem() {
    return (
        <section className="px-6 py-32">
            <div className="mx-auto max-w-6xl">
                <RevealHeading text="Part of a family of tools" muted="for designers." className={cn(H2, 'max-w-2xl')} />
                <div className="mt-14 grid gap-5 md:grid-cols-2">
                    <motion.a
                        {...reveal(0)}
                        href="https://github.com/Doodle-GitPush/justmytype"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative overflow-hidden rounded-2xl bg-white/[0.025] p-8 ring-1 ring-white/[0.07] transition-all duration-300 hover:bg-white/[0.04] hover:ring-white/20"
                    >
                        <div className="flex items-start justify-between">
                            {/* The specimen swaps faces on hover */}
                            <span className="relative block h-12 w-20 overflow-hidden text-[44px] leading-none text-zinc-100">
                                <span className="absolute inset-0 font-serif transition-transform duration-500 ease-out group-hover:-translate-y-full">Aa</span>
                                <span className="absolute inset-0 translate-y-full font-sans font-semibold text-[#FF4800] transition-transform duration-500 ease-out group-hover:translate-y-0">Aa</span>
                            </span>
                            <ArrowUpRight size={18} className="text-zinc-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-200" />
                        </div>
                        <h3 className="mt-8 text-[22px] tracking-tight text-zinc-50">JustMyType</h3>
                        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-zinc-400">
                            A font-pairing playground with ~1,900 Google Fonts. Find a pairing, hit Send, and it becomes your deck’s typography — axes and OpenType features included.
                        </p>
                    </motion.a>
                    <motion.div {...reveal(1)} className="group relative overflow-hidden rounded-2xl bg-white/[0.025] p-8 ring-1 ring-white/[0.07] transition-all duration-300 hover:ring-white/20">
                        <span className="flex -space-x-3" aria-hidden>
                            {['#FF4800', '#6D28D9', '#0369A1'].map((c, i) => (
                                <span
                                    key={c}
                                    className="size-8 rounded-full ring-2 ring-[#0D0D0E] transition-transform duration-500 ease-out group-hover:translate-x-[var(--dx)]"
                                    style={{ background: c, ['--dx' as string]: `${i * 6}px` }}
                                />
                            ))}
                        </span>
                        <h3 className="mt-8 text-[22px] tracking-tight text-zinc-50">SkidLab</h3>
                        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-zinc-400">
                            A lab of customisable shaders, coming soon. Its presets will plug straight into your deck’s motion backgrounds.
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

// ── FAQ ────────────────────────────────────────────────────

const FAQS = [
    { q: 'What file do I need?', a: 'An SVG of your logo — the vector export from Illustrator, Figma, Affinity or Inkscape. Multi-colour logos, gradients, outlines and class-based styles all work.' },
    { q: 'Where is my work saved?', a: 'In your browser, on this device. There’s no account and your deck isn’t stored on a server. The one thing that leaves your browser: to draft the Story page, a small image of your logo is sent to an AI model for analysis.' },
    { q: 'What do I get when I export?', a: 'A PDF with one 1920 × 1080 page per slide, rendered from the same components you see on screen — your fonts, a still of the motion background and the 3D render included.' },
    { q: 'Will it change my logo?', a: 'No. Pages set to “original colours” show your artwork untouched. One-colour pages recolour the shapes for contrast — the same way you’d show a mono version in guidelines.' },
    { q: 'Can I use my own fonts?', a: 'Choose from six starter pairings, or pick any Google Fonts pairing in JustMyType and send it across. Uploading your own font files isn’t supported yet.' },
    { q: 'Does it work on a phone?', a: 'You can view, edit and present on a phone, but the studio is designed for a laptop or desktop screen.' },
]

function FaqItem({ q, a, open, onToggle, index }: { q: string; a: string; open: boolean; onToggle: () => void; index: number }) {
    return (
        <motion.div {...reveal(index * 0.6)} className="border-b border-white/[0.07]">
            <button type="button" aria-expanded={open} onClick={onToggle} className="group flex w-full items-center justify-between gap-6 py-6 text-left">
                <span className={cn('text-[18px] tracking-tight transition-all duration-300', open ? 'text-zinc-50' : 'text-zinc-300 group-hover:translate-x-1.5 group-hover:text-zinc-50')}>{q}</span>
                <span className={cn('grid size-8 shrink-0 place-items-center rounded-full ring-1 transition-all duration-300', open ? 'rotate-45 bg-[#FF4800] text-white ring-[#FF4800]' : 'text-zinc-500 ring-white/10 group-hover:rotate-90 group-hover:ring-white/25')}>
                    <Plus size={14} />
                </span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
                        <motion.p initial={{ y: -8 }} animate={{ y: 0 }} transition={{ duration: 0.35, ease: EASE }} className="max-w-2xl pb-6 text-[15px] leading-relaxed text-zinc-400">{a}</motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export function Faq() {
    const [open, setOpen] = useState<number | null>(0)
    return (
        <section id="faq" className="px-6 py-32">
            <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <div className="lg:sticky lg:top-28 lg:self-start">
                    <RevealHeading text="Questions," muted="answered." className={H2} />
                </div>
                <div className="border-t border-white/[0.07]">
                    {FAQS.map((f, i) => <FaqItem key={f.q} {...f} index={i} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />)}
                </div>
            </div>
        </section>
    )
}

// ── Footer ─────────────────────────────────────────────────

const WORDMARK = 'OnYourMark'.split('')

/** A letter of the closing wordmark, rising as the page reaches its end. */
function WordmarkLetter({ ch, i, progress }: { ch: string; i: number; progress: MotionValue<number> }) {
    const start = i * 0.045
    const y = useTransform(progress, [start, start + 0.5], ['100%', '0%'])
    return (
        <span className="inline-block overflow-hidden align-bottom">
            <motion.span style={{ y }} className="inline-block">{ch}</motion.span>
        </span>
    )
}

export function Footer({ mark }: { mark: React.ReactNode }) {
    const ref = useRef<HTMLElement>(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
    return (
        <footer ref={ref} className="overflow-hidden border-t border-white/[0.06] px-6 pt-12">
            <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5 text-[14px] text-zinc-300">
                    {mark}
                    <span className="text-zinc-500">Brand decks from one SVG.</span>
                </div>
                <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-zinc-500">
                    {[['#features', 'Features'], ['#how', 'How it works'], ['#faq', 'FAQ']].map(([href, label]) => (
                        <a key={href} href={href} className="transition-colors hover:text-zinc-200">{label}</a>
                    ))}
                    <Link href="/studio" className="group flex items-center gap-1 text-zinc-300 transition-colors hover:text-white">
                        Studio <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Link>
                </nav>
            </div>
            <div aria-hidden className="mx-auto mt-16 max-w-6xl select-none whitespace-nowrap text-center text-[min(14vw,12.5rem)] font-semibold leading-[0.8] tracking-[-0.06em] text-zinc-100">
                {WORDMARK.map((ch, i) => <WordmarkLetter key={i} ch={ch} i={i} progress={scrollYProgress} />)}
            </div>
            <div className="mx-auto flex max-w-6xl justify-between py-6 text-[12px] text-zinc-700">
                <span>© {new Date().getFullYear()} OnYourMark</span>
                <span>Made for designers who present their work.</span>
            </div>
        </footer>
    )
}
