"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { HexColorPicker } from 'react-colorful'
import { ArrowUpRight, Check, Plus, Upload, X } from 'lucide-react'
import { Brand, BrandType, MAX_COLORS, MOTION_PRESETS, accentOf, primaryOf } from '@/lib/brand'
import { isHex } from '@/lib/color'
import { PAIRINGS, loadFont } from '@/lib/fonts'
import { parseJustMyTypeLink } from '@/lib/justmytype'
import { MOTION_LABELS } from '@/lib/shaders'
import { logoUrl } from '@/lib/svg'
import type { DeckActions } from '@/lib/useDeck'
import { cn } from '@/lib/utils'
import type { Panel } from './DeckEditor'
import { ShaderCanvas, motionGradient } from './ShaderCanvas'
import { EASE, IconButton, SPRING, useDismiss } from './ui'

interface DockProps {
    brand: Brand
    deck: DeckActions
    panel: Panel | null
    onPanel: (panel: Panel | null) => void
    onLogoFile: (file: File) => void
    onAddMotionPage: () => void
}

const Heading = ({ children }: { children: React.ReactNode }) => (
    <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{children}</div>
)

// ── Colours ───────────────────────────────────────────────

function ColorsPanel({ brand, deck }: Pick<DockProps, 'brand' | 'deck'>) {
    const [openId, setOpenId] = useState<string | null>(null)
    // What's being typed in the hex field, until it parses as a colour.
    const [draft, setDraft] = useState<{ id: string; text: string } | null>(null)

    return (
        <div>
            <Heading>Colours</Heading>
            <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-600">The first is your primary. Every page updates as you change them.</p>
            <div className="mt-3 flex flex-col">
                {brand.colors.map((c) => {
                    const open = openId === c.id
                    return (
                        <div key={c.id}>
                            <div className="group/row flex items-center gap-2.5 h-10">
                                <button
                                    type="button"
                                    aria-label={`Edit ${c.name}`}
                                    aria-expanded={open}
                                    onClick={() => setOpenId(open ? null : c.id)}
                                    className={cn(
                                        'size-6 shrink-0 rounded-full ring-1 ring-white/15 transition-transform duration-200 hover:scale-110 active:scale-90',
                                        open && 'outline outline-[1.5px] outline-offset-2 outline-[#FF4800]',
                                    )}
                                    style={{ background: c.hex }}
                                />
                                <input
                                    aria-label="Colour name"
                                    value={c.name}
                                    onChange={(e) => deck.patchColor(c.id, { name: e.target.value })}
                                    className="flex-1 min-w-0 bg-transparent text-[13px] text-zinc-200 focus:outline-none"
                                />
                                <input
                                    aria-label={`${c.name} hex code`}
                                    value={draft?.id === c.id ? draft.text : c.hex.toUpperCase()}
                                    maxLength={7}
                                    spellCheck={false}
                                    onChange={(e) => {
                                        const text = e.target.value.toUpperCase()
                                        setDraft({ id: c.id, text })
                                        if (isHex(text)) deck.patchColor(c.id, { hex: text })
                                    }}
                                    onBlur={() => setDraft(null)}
                                    className="w-[68px] bg-transparent text-[12px] font-mono text-zinc-500 focus:text-zinc-200 focus:outline-none transition-colors"
                                />
                                <IconButton
                                    label={`Remove ${c.name}`}
                                    disabled={brand.colors.length <= 1}
                                    onClick={() => deck.removeColor(c.id)}
                                    className="size-6 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
                                >
                                    <X size={12} />
                                </IconButton>
                            </div>
                            <AnimatePresence initial={false}>
                                {open && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: EASE }}
                                        className="overflow-hidden"
                                    >
                                        <div className="color-picker-apple pt-1 pb-3">
                                            <HexColorPicker color={c.hex} onChange={(hex) => deck.patchColor(c.id, { hex: hex.toUpperCase() })} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )
                })}
            </div>
            {brand.colors.length < MAX_COLORS && (
                <button
                    type="button"
                    onClick={deck.addColor}
                    className="mt-1 flex items-center gap-2.5 h-10 text-[13px] text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                    <span className="grid place-items-center size-6 rounded-full ring-1 ring-dashed ring-white/20"><Plus size={12} /></span>
                    Add a colour
                </button>
            )}
        </div>
    )
}

// ── Typography ────────────────────────────────────────────

const samePairing = (a: BrandType | undefined, b: BrandType) =>
    !!a && a.heading.family === b.heading.family && a.body.family === b.body.family

function TypePanel({ brand, deck }: Pick<DockProps, 'brand' | 'deck'>) {
    const [link, setLink] = useState('')
    const [error, setError] = useState(false)

    useEffect(() => {
        PAIRINGS.forEach((p) => loadFont(p.type.heading))
    }, [])

    const importLink = () => {
        const parsed = parseJustMyTypeLink(link)
        if (!parsed) return setError(true)
        deck.patchBrand({ type: parsed })
        setLink('')
        setError(false)
    }

    const custom = brand.type && !PAIRINGS.some((p) => samePairing(brand.type, p.type))

    return (
        <div>
            <div className="flex items-center justify-between">
                <Heading>Typography</Heading>
                {brand.type && (
                    <button type="button" onClick={() => deck.patchBrand({ type: undefined })} className="text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors">
                        Remove
                    </button>
                )}
            </div>

            {custom && brand.type && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] ring-1 ring-[#FF4800]/50 px-3 py-2.5">
                    <div className="min-w-0">
                        <div className="text-[13px] text-zinc-100 truncate">{brand.type.heading.family} + {brand.type.body.family}</div>
                        <div className="text-[11px] text-zinc-500">From JustMyType</div>
                    </div>
                    {brand.type.sourceUrl && (
                        <a href={brand.type.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-100 transition-colors shrink-0">
                            Open <ArrowUpRight size={12} />
                        </a>
                    )}
                </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-1.5">
                {PAIRINGS.map((p) => {
                    const selected = samePairing(brand.type, p.type)
                    return (
                        <button
                            key={p.mood}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => deck.patchBrand({ type: p.type })}
                            className={cn(
                                'relative text-left rounded-xl px-3 pt-2.5 pb-2 ring-1 transition-all duration-200 active:scale-[0.97]',
                                selected ? 'bg-white/[0.07] ring-[#FF4800]/70' : 'bg-white/[0.03] ring-white/[0.06] hover:bg-white/[0.06] hover:ring-white/15',
                            )}
                        >
                            <span className="block text-[26px] leading-none text-zinc-100" style={{ fontFamily: `"${p.type.heading.family}", serif`, fontWeight: p.type.heading.weight }}>Aa</span>
                            <span className="mt-2 block text-[11px] text-zinc-300">{p.mood}</span>
                            <span className="block text-[10px] text-zinc-600 truncate">{p.type.heading.family} + {p.type.body.family}</span>
                            <AnimatePresence>
                                {selected && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        transition={SPRING}
                                        className="absolute top-2.5 right-2.5 grid place-items-center size-4 rounded-full bg-[#FF4800] text-white"
                                    >
                                        <Check size={10} strokeWidth={3} />
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                    )
                })}
            </div>

            <form className="mt-4 flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); importLink() }}>
                <input
                    type="url"
                    value={link}
                    onChange={(e) => { setLink(e.target.value); setError(false) }}
                    placeholder="…or paste a JustMyType link"
                    className="flex-1 min-w-0 bg-transparent text-[12px] text-zinc-200 border-b border-white/10 py-1.5 placeholder:text-zinc-600 focus:outline-none focus:border-[#FF4800] transition-colors"
                />
                <button type="submit" disabled={!link.trim()} className="text-[12px] text-zinc-300 hover:text-zinc-100 disabled:opacity-30 transition-colors">Import</button>
            </form>
            {error && <p className="mt-2 text-[11px] text-[#FF4800]">That isn’t a JustMyType share link — use Share there to copy one.</p>}
        </div>
    )
}

// ── Motion ────────────────────────────────────────────────

function MotionPanel({ brand, deck, onAddMotionPage }: Pick<DockProps, 'brand' | 'deck' | 'onAddMotionPage'>) {
    const a = primaryOf(brand)
    const b = accentOf(brand)
    return (
        <div>
            <Heading>Motion</Heading>
            <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-600">A living background in your colours. Use it on any page from that page’s background dots.</p>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
                {MOTION_PRESETS.map((preset) => {
                    const selected = brand.motion.preset === preset
                    return (
                        <button
                            key={preset}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => deck.patchBrand({ motion: { ...brand.motion, preset } })}
                            className="group/preset text-left active:scale-[0.97] transition-transform duration-200"
                        >
                            <span className={cn('block aspect-video rounded-lg overflow-hidden ring-1 transition-all duration-200', selected ? 'ring-[1.5px] ring-[#FF4800]' : 'ring-white/10 group-hover/preset:ring-white/30')}>
                                <ShaderCanvas className="w-full h-full" preset={preset} a={a} b={b} speed={brand.motion.speed} />
                            </span>
                            <span className={cn('mt-1.5 block text-[11px] transition-colors', selected ? 'text-zinc-100' : 'text-zinc-500')}>{MOTION_LABELS[preset]}</span>
                        </button>
                    )
                })}
            </div>
            <label className="mt-4 flex items-center gap-3 text-[11px] text-zinc-500">
                Speed
                <input
                    type="range"
                    min={0.2}
                    max={3}
                    step={0.1}
                    value={brand.motion.speed}
                    onChange={(e) => deck.patchBrand({ motion: { ...brand.motion, speed: Number(e.target.value) } })}
                    className="thin-range flex-1"
                />
                <span className="w-8 text-right tabular-nums text-zinc-400">{brand.motion.speed.toFixed(1)}×</span>
            </label>
            <button
                type="button"
                onClick={onAddMotionPage}
                className="mt-4 w-full h-9 rounded-lg text-[12px] text-zinc-200 bg-white/[0.06] hover:bg-white/[0.1] active:scale-[0.98] transition-all duration-200"
            >
                Add a motion page
            </button>
        </div>
    )
}

// ── Logo ──────────────────────────────────────────────────

function LogoPanel({ brand, deck, onLogoFile }: Pick<DockProps, 'brand' | 'deck' | 'onLogoFile'>) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [confirming, setConfirming] = useState(false)
    return (
        <div>
            <Heading>Logo</Heading>
            <div className="mt-3 grid place-items-center h-32 rounded-xl bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG data URL */}
                <img src={logoUrl(brand.logo.svg)} alt="Your logo" className="max-w-[60%] max-h-20 object-contain" />
            </div>
            <div className="mt-2 text-[11px] text-zinc-600 truncate">{brand.logo.fileName}</div>
            <input
                ref={inputRef}
                type="file"
                accept=".svg,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onLogoFile(file)
                    e.target.value = ''
                }}
            />
            <div className="mt-3 flex gap-1.5">
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-[12px] text-zinc-200 bg-white/[0.06] hover:bg-white/[0.1] active:scale-[0.98] transition-all duration-200"
                >
                    <Upload size={13} /> Replace SVG
                </button>
                <button
                    type="button"
                    onClick={() => (confirming ? deck.reset() : setConfirming(true))}
                    onBlur={() => setConfirming(false)}
                    className={cn(
                        'h-9 px-3 rounded-lg text-[12px] active:scale-[0.98] transition-all duration-200',
                        confirming ? 'bg-red-500/15 text-red-300' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06]',
                    )}
                >
                    {confirming ? 'Clear everything?' : 'Start over'}
                </button>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">Replacing the logo keeps your pages, colours and fonts.</p>
        </div>
    )
}

// ── Dock ──────────────────────────────────────────────────

function DockButton({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={active}
            onClick={onClick}
            className={cn(
                'group/dock relative flex items-center gap-2.5 h-10 pl-2.5 pr-3.5 rounded-full text-[12px] transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40',
                active ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-100',
            )}
        >
            {active && <motion.span layoutId="dock-pill" transition={SPRING} className="absolute inset-0 rounded-full bg-white/[0.09]" />}
            <span className="relative grid place-items-center h-6 min-w-6 transition-transform duration-300 group-hover/dock:scale-110 group-active/dock:scale-90">{children}</span>
            <span className="relative hidden sm:block">{label}</span>
        </button>
    )
}

/** The brand controls, floating over the deck: logo, colours, type, motion.
 *  Whatever changes here changes on every page. */
export function Dock({ brand, deck, panel, onPanel, onLogoFile, onAddMotionPage }: DockProps) {
    const close = useCallback(() => onPanel(null), [onPanel])
    const ref = useDismiss<HTMLDivElement>(panel !== null, close)
    const toggle = (p: Panel) => onPanel(panel === p ? null : p)
    const heading = brand.type?.heading

    return (
        <div ref={ref} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2.5 pointer-events-none">
            <AnimatePresence mode="wait">
                {panel && (
                    <motion.div
                        key={panel}
                        initial={{ opacity: 0, y: 14, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.12 } }}
                        transition={SPRING}
                        className="hidden-scrollbar pointer-events-auto origin-bottom w-[340px] max-w-[calc(100vw-2rem)] max-h-[min(560px,calc(100vh-11rem))] overflow-y-auto rounded-2xl bg-[#141416]/95 backdrop-blur-xl p-5 ring-1 ring-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
                    >
                        {panel === 'logo' && <LogoPanel brand={brand} deck={deck} onLogoFile={onLogoFile} />}
                        {panel === 'colors' && <ColorsPanel brand={brand} deck={deck} />}
                        {panel === 'type' && <TypePanel brand={brand} deck={deck} />}
                        {panel === 'motion' && <MotionPanel brand={brand} deck={deck} onAddMotionPage={onAddMotionPage} />}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: 0.25 }}
                className="pointer-events-auto flex items-center gap-0.5 p-1 rounded-full bg-[#141416]/90 backdrop-blur-xl ring-1 ring-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.55)]"
            >
                <DockButton label="Logo" active={panel === 'logo'} onClick={() => toggle('logo')}>
                    <span className="grid place-items-center size-6 rounded-full bg-white overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG data URL */}
                        <img src={logoUrl(brand.logo.svg)} alt="" className="size-3.5 object-contain" />
                    </span>
                </DockButton>
                <DockButton label="Colours" active={panel === 'colors'} onClick={() => toggle('colors')}>
                    <span className="flex -space-x-1.5">
                        {brand.colors.slice(0, 3).map((c) => (
                            <span key={c.id} className="size-[18px] rounded-full ring-[1.5px] ring-[#141416] transition-colors duration-300" style={{ background: c.hex }} />
                        ))}
                    </span>
                </DockButton>
                <DockButton label="Type" active={panel === 'type'} onClick={() => toggle('type')}>
                    <span className="text-[15px] leading-none text-zinc-100" style={heading ? { fontFamily: `"${heading.family}", serif`, fontWeight: heading.weight } : { fontWeight: 600 }}>Aa</span>
                </DockButton>
                <DockButton label="Motion" active={panel === 'motion'} onClick={() => toggle('motion')}>
                    <span className="size-[18px] rounded-full ring-1 ring-white/15" style={{ background: motionGradient(primaryOf(brand), accentOf(brand)) }} />
                </DockButton>
            </motion.div>
        </div>
    )
}
