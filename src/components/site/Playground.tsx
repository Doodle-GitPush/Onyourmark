"use client"

import React, { useMemo, useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { BG_INK, BG_MOTION, BG_PAPER, MOTION_PRESETS, MotionPreset } from '@/lib/brand'
import { PAIRINGS } from '@/lib/fonts'
import { MOTION_LABELS } from '@/lib/shaders'
import { cn } from '@/lib/utils'
import { Slide } from '@/components/deck/Slide'
import { MotionSwatch } from '@/components/deck/ShaderCanvas'
import { EASE, SPRING } from '@/components/deck/ui'
import { PALETTES, demoBrand, demoPage } from './demo'
import { RevealHeading } from './motion'

const BACKGROUNDS = [
    { id: 'primary', label: 'Colour' },
    { id: BG_PAPER, label: 'White' },
    { id: BG_INK, label: 'Black' },
    { id: BG_MOTION, label: 'Motion' },
] as const

function Group({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="mb-2.5 text-[13px] text-zinc-500">{label}</div>
            <div className="flex flex-wrap gap-1.5">{children}</div>
        </div>
    )
}

/** One option in a group; the highlight glides between a group's chips. */
function Chip({ group, selected, onClick, children }: { group: string; selected: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className={cn(
                'relative flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] transition-colors duration-200 active:scale-95',
                selected ? 'text-zinc-50' : 'text-zinc-500 hover:text-zinc-200',
            )}
        >
            {selected && <motion.span layoutId={`chip-${group}`} transition={SPRING} className="absolute inset-0 rounded-full bg-white/[0.08] ring-1 ring-white/15" />}
            <span className="relative flex items-center gap-2">{children}</span>
        </button>
    )
}

/** Try the brand system: pick a palette, a pairing, a cover background and
 *  a motion preset, and watch three pages restyle together. */
export function Playground() {
    const [palette, setPalette] = useState(0)
    const [pairing, setPairing] = useState(0)
    const [bg, setBg] = useState<(typeof BACKGROUNDS)[number]['id']>(BG_MOTION)
    const [motionPreset, setMotionPreset] = useState<MotionPreset>('flow')
    const ref = useRef<HTMLDivElement>(null)
    const live = useInView(ref, { amount: 0.25 })

    const brand = useMemo(() => demoBrand({ palette, pairing, motion: motionPreset }), [palette, pairing, motionPreset])
    const pages = useMemo(() => ({
        cover: demoPage(brand, 'cover', { bg: bg === 'primary' ? brand.colors[0].id : bg }),
        palette: demoPage(brand, 'palette'),
        type: demoPage(brand, 'type'),
    }), [brand, bg])

    return (
        <section className="px-6 py-28">
            <div className="mx-auto max-w-6xl">
                <div className="mx-auto max-w-2xl text-center">
                    <RevealHeading text="One brand." muted="Every page." className="text-[clamp(2rem,4.4vw,3.5rem)] font-medium leading-[1.04] tracking-[-0.035em] text-zinc-50" />
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.8 }}
                        transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
                        className="mt-4 text-[16px] leading-relaxed text-zinc-400"
                    >
                        Pick a palette, a type pairing and a background. This is the same renderer the studio uses.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.9, ease: EASE }}
                    className="mt-14 rounded-3xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06] sm:p-8"
                >
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <Group label="Palette">
                            {PALETTES.map((p, i) => (
                                <Chip key={p.name} group="palette" selected={palette === i} onClick={() => setPalette(i)}>
                                    <span className="flex -space-x-1">{p.colors.map((c) => <span key={c} className="size-3.5 rounded-full ring-1 ring-black/40" style={{ background: c }} />)}</span>
                                    {p.name}
                                </Chip>
                            ))}
                        </Group>
                        <Group label="Typography">
                            {PAIRINGS.slice(0, 4).map((p, i) => (
                                <Chip key={p.mood} group="type" selected={pairing === i} onClick={() => setPairing(i)}>
                                    <span style={{ fontFamily: `"${p.type.heading.family}", serif`, fontWeight: p.type.heading.weight }} className="text-[15px] leading-none">Aa</span>
                                    {p.mood}
                                </Chip>
                            ))}
                        </Group>
                        <Group label="Cover background">
                            {BACKGROUNDS.map((b) => (
                                <Chip key={b.id} group="bg" selected={bg === b.id} onClick={() => setBg(b.id)}>{b.label}</Chip>
                            ))}
                        </Group>
                        <Group label="Motion">
                            {MOTION_PRESETS.slice(0, 4).map((m) => (
                                <Chip key={m} group="motion" selected={motionPreset === m} onClick={() => { setMotionPreset(m); setBg(BG_MOTION) }}>
                                    <MotionSwatch a={PALETTES[palette].colors[0]} b={PALETTES[palette].colors[1]} className="size-3" />
                                    {MOTION_LABELS[m]}
                                </Chip>
                            ))}
                        </Group>
                    </div>

                    <div ref={ref} className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                        <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
                            <Slide page={pages.cover} brand={brand} index={0} mode="display" active={live} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                            <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
                                <Slide page={pages.palette} brand={brand} index={4} mode="display" active={live} />
                            </div>
                            <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
                                <Slide page={pages.type} brand={brand} index={5} mode="display" active={live} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
