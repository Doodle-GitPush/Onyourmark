"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, ArrowUpRight, Briefcase, Building2, Plus, Sparkles, Upload, Users, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE } from '@/components/deck/ui'

function SectionHead({ kicker, title, sub, center }: { kicker: string; title: React.ReactNode; sub?: string; center?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.8, ease: EASE }}
            className={cn('max-w-2xl', center && 'mx-auto text-center')}
        >
            <p className="text-[12px] uppercase tracking-[0.22em] text-[#FF4800]">{kicker}</p>
            <h2 className="mt-4 text-[clamp(2rem,4.4vw,3.5rem)] font-medium leading-[1.04] tracking-[-0.035em] text-zinc-50">{title}</h2>
            {sub && <p className="mt-4 text-[16px] leading-relaxed text-zinc-400">{sub}</p>}
        </motion.div>
    )
}

const reveal = (i: number) => ({
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.8, ease: EASE, delay: i * 0.1 },
})

// ── How it works ───────────────────────────────────────────

const HOW = [
    { icon: Upload, title: 'Drop your SVG', body: 'Any export from Illustrator, Figma or Affinity. The deck is built in a second, coloured from your artwork.' },
    { icon: Wand2, title: 'Shape the deck', body: 'Set the palette and type once, rewrite any line in place, and keep only the pages this client needs.' },
    { icon: Sparkles, title: 'Present or export', body: 'Walk the client through it full screen, then send the PDF so they keep it.' },
]

export function HowItWorks() {
    return (
        <section id="how" className="px-6 py-28">
            <div className="mx-auto max-w-6xl">
                <SectionHead kicker="How it works" title={<>Three steps. <span className="text-zinc-500">About five minutes.</span></>} />
                <div className="relative mt-16 grid gap-5 md:grid-cols-3">
                    {/* The thread joining the steps */}
                    <motion.div
                        aria-hidden
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 1.4, ease: EASE, delay: 0.3 }}
                        className="absolute left-[16%] right-[16%] top-[52px] hidden h-px origin-left bg-white/15 md:block"
                    />
                    {HOW.map((s, i) => (
                        <motion.div key={s.title} {...reveal(i)} className="group relative rounded-2xl bg-white/[0.02] p-7 ring-1 ring-white/[0.06] transition-colors duration-300 hover:bg-white/[0.035]">
                            <div className="relative z-10 grid size-12 place-items-center rounded-xl bg-[#141416] text-zinc-300 ring-1 ring-white/10 transition-all duration-500 group-hover:-rotate-6 group-hover:text-[#FF4800] group-hover:ring-[#FF4800]/40">
                                <s.icon size={20} strokeWidth={1.6} />
                            </div>
                            <div className="mt-8 text-[12px] tabular-nums text-zinc-600">Step 0{i + 1}</div>
                            <h3 className="mt-2 text-[20px] tracking-tight text-zinc-100">{s.title}</h3>
                            <p className="mt-3 text-[14px] leading-relaxed text-zinc-400">{s.body}</p>
                        </motion.div>
                    ))}
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
        line: 'Present like a studio.',
        body: 'Close an identity project with a deck that shows the logo working — not a zip file and an email.',
        points: ['A guidelines PDF to hand over', 'Live motion and 3D in the pitch', 'Minutes instead of an afternoon in layout'],
    },
    {
        icon: Building2,
        who: 'Studios and agencies',
        line: 'One standard for every project.',
        body: 'Every identity your team ships gets the same structure and polish, so the time goes into the work itself.',
        points: ['A consistent first draft every time', 'Edit per client, keep the system', 'Show options by swapping palettes'],
    },
    {
        icon: Users,
        who: 'In-house brand teams',
        line: 'The brand, in one place.',
        body: 'Give marketing, sales and partners a single deck that shows the mark, the colours and the type the right way.',
        points: ['Colour codes for print and screen', 'Clear-space and minimum-size rules', 'Present it at the next all-hands'],
    },
]

export function Audiences() {
    return (
        <section id="who" className="px-6 py-28">
            <div className="mx-auto max-w-6xl">
                <SectionHead kicker="Who it’s for" title={<>Made for the people <span className="text-zinc-500">who present brands.</span></>} />
                <div className="mt-16 grid gap-5 md:grid-cols-3">
                    {AUDIENCES.map((a, i) => (
                        <motion.div
                            key={a.who}
                            {...reveal(i)}
                            whileHover={{ y: -6 }}
                            className="group flex flex-col rounded-2xl bg-white/[0.025] p-7 ring-1 ring-white/[0.07] transition-colors duration-300 hover:bg-white/[0.04] hover:ring-white/[0.14]"
                        >
                            <a.icon size={20} strokeWidth={1.6} className="text-zinc-500 transition-colors duration-300 group-hover:text-[#FF4800]" />
                            <div className="mt-8 text-[13px] text-zinc-500">{a.who}</div>
                            <h3 className="mt-1.5 text-[22px] tracking-tight text-zinc-50">{a.line}</h3>
                            <p className="mt-3 text-[14px] leading-relaxed text-zinc-400">{a.body}</p>
                            <ul className="mt-6 space-y-2 border-t border-white/[0.06] pt-5">
                                {a.points.map((p) => (
                                    <li key={p} className="flex items-center gap-2.5 text-[13px] text-zinc-300">
                                        <span className="size-1 rounded-full bg-[#FF4800]" />
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ── Works with ─────────────────────────────────────────────

export function Ecosystem() {
    return (
        <section className="px-6 py-28">
            <div className="mx-auto max-w-6xl">
                <SectionHead kicker="Works with" title={<>Part of a family of tools <span className="text-zinc-500">for designers.</span></>} />
                <div className="mt-14 grid gap-5 md:grid-cols-2">
                    <motion.a
                        {...reveal(0)}
                        href="https://github.com/Doodle-GitPush/justmytype"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative overflow-hidden rounded-2xl bg-white/[0.02] p-8 ring-1 ring-white/[0.07] transition-colors duration-300 hover:bg-white/[0.04]"
                    >
                        <div className="flex items-start justify-between">
                            <span className="font-serif text-[44px] leading-none text-zinc-100">Aa</span>
                            <ArrowUpRight size={18} className="text-zinc-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-200" />
                        </div>
                        <h3 className="mt-8 text-[20px] tracking-tight text-zinc-50">JustMyType</h3>
                        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-zinc-400">
                            A font-pairing playground with ~1,900 Google Fonts. Find a pairing, hit Send, and it becomes your deck’s typography — axes and OpenType features included.
                        </p>
                    </motion.a>
                    <motion.div {...reveal(1)} className="relative overflow-hidden rounded-2xl bg-white/[0.02] p-8 ring-1 ring-white/[0.07]">
                        <div className="flex items-start justify-between">
                            <span className="flex -space-x-3" aria-hidden>
                                {['#FF4800', '#6D28D9', '#0369A1'].map((c) => <span key={c} className="size-8 rounded-full ring-2 ring-[#0D0D0E]" style={{ background: c }} />)}
                            </span>
                            <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-zinc-400 ring-1 ring-white/10">Coming soon</span>
                        </div>
                        <h3 className="mt-8 text-[20px] tracking-tight text-zinc-50">SkidLab</h3>
                        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-zinc-400">
                            A lab of customisable shaders. Its presets will plug straight into your deck’s motion backgrounds.
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

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
    return (
        <div className="border-b border-white/[0.07]">
            <button type="button" aria-expanded={open} onClick={onToggle} className="group flex w-full items-center justify-between gap-6 py-6 text-left">
                <span className={cn('text-[17px] tracking-tight transition-colors', open ? 'text-zinc-50' : 'text-zinc-300 group-hover:text-zinc-50')}>{q}</span>
                <span className={cn('grid size-8 shrink-0 place-items-center rounded-full ring-1 transition-all duration-300', open ? 'rotate-45 bg-[#FF4800] text-white ring-[#FF4800]' : 'text-zinc-500 ring-white/10 group-hover:ring-white/25')}>
                    <Plus size={14} />
                </span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
                        <p className="max-w-2xl pb-6 text-[15px] leading-relaxed text-zinc-400">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export function Faq() {
    const [open, setOpen] = useState<number | null>(0)
    return (
        <section id="faq" className="px-6 py-28">
            <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <SectionHead kicker="FAQ" title="Questions, answered." />
                <motion.div {...reveal(1)} className="border-t border-white/[0.07]">
                    {FAQS.map((f, i) => <FaqItem key={f.q} {...f} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />)}
                </motion.div>
            </div>
        </section>
    )
}

// ── Footer ─────────────────────────────────────────────────

export function Footer({ mark }: { mark: React.ReactNode }) {
    return (
        <footer className="border-t border-white/[0.06] px-6 py-12">
            <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5 text-[14px] text-zinc-300">
                    {mark}
                    OnYourMark
                    <span className="ml-2 text-[12px] text-zinc-600">Brand decks from one SVG.</span>
                </div>
                <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-zinc-500">
                    <a href="#features" className="hover:text-zinc-200 transition-colors">Features</a>
                    <a href="#how" className="hover:text-zinc-200 transition-colors">How it works</a>
                    <a href="#faq" className="hover:text-zinc-200 transition-colors">FAQ</a>
                    <Link href="/studio" className="flex items-center gap-1 text-zinc-300 hover:text-white transition-colors">Studio <ArrowRight size={12} /></Link>
                </nav>
            </div>
            <div className="mx-auto mt-8 max-w-6xl text-[12px] text-zinc-700">© {new Date().getFullYear()} OnYourMark</div>
        </footer>
    )
}

