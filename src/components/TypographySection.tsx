"use client"

import React, { useEffect, useState } from 'react'
import { BrandType, FontSpec, featureSettings, variationSettings } from '@/lib/brand'
import { parseJustMyTypeLink } from '@/lib/justmytype'
import { loadFont } from '@/lib/fonts'
import { TYPE_SLIDE as L, TYPE_SLIDE_COLORS as C, fontMeta } from '@/lib/typeSlide'

interface TypographySectionProps {
    type: BrandType | null
    accent: string
    headline: string
    body: string
    onChange: (type: BrandType | null) => void
}

const faceStyle = (spec: FontSpec): React.CSSProperties => ({
    fontFamily: `"${spec.family}", sans-serif`,
    fontWeight: spec.weight,
    fontVariationSettings: variationSettings(spec),
    fontFeatureSettings: featureSettings(spec),
})

export function TypographySection({ type, accent, headline, body, onChange }: TypographySectionProps) {
    const [link, setLink] = useState('')
    const [error, setError] = useState(false)
    const [replacing, setReplacing] = useState(false)

    useEffect(() => {
        if (!type) return
        loadFont(type.heading)
        loadFont(type.body)
    }, [type])

    const handleImport = () => {
        const parsed = parseJustMyTypeLink(link)
        if (!parsed) {
            setError(true)
            return
        }
        onChange(parsed)
        setLink('')
        setError(false)
        setReplacing(false)
    }

    const label = <label className="text-[10px] uppercase tracking-widest text-zinc-600 block">Typography</label>

    if (!type || replacing) {
        return (
            <div>
                {label}
                <form
                    className="mt-3 flex items-center gap-3"
                    onSubmit={(e) => { e.preventDefault(); handleImport() }}
                >
                    <input
                        type="url"
                        value={link}
                        onChange={(e) => { setLink(e.target.value); setError(false) }}
                        placeholder="Paste a JustMyType share link"
                        className="flex-1 text-[13px] text-zinc-200 bg-transparent border-b border-zinc-700 px-0.5 py-1.5 placeholder:text-zinc-600 focus:outline-none focus:border-[#FF4800] transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!link.trim()}
                        className="text-[13px] text-zinc-300 hover:text-zinc-100 disabled:opacity-30 transition-colors"
                    >
                        Import
                    </button>
                    {replacing && (
                        <button
                            type="button"
                            onClick={() => { setReplacing(false); setError(false) }}
                            className="text-[13px] text-zinc-600 hover:text-zinc-300 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </form>
                <p className={`mt-2 text-[11px] ${error ? 'text-[#FF4800]' : 'text-zinc-600'}`}>
                    {error
                        ? "That doesn't look like a JustMyType share link — use Share there to copy one."
                        : 'Pick a pairing in JustMyType, hit Share, and paste the link here.'}
                </p>
            </div>
        )
    }

    const columns: [string, FontSpec, number, string][] = [
        ['Heading', type.heading, type.heading.lh, accent],
        ['Body', type.body, type.bodyLineHeight, C.ink],
    ]

    return (
        <div>
            {label}

            {/* Sized in cqw against the card's own width so it matches the
                PDF slide at any size — see TYPE_SLIDE. */}
            <div
                className="mt-5 w-full aspect-[16/9] rounded-2xl overflow-hidden relative [container-type:inline-size]"
                style={{ backgroundColor: C.bg }}
            >
                <div className="absolute grid grid-cols-2" style={{ inset: `${L.pad}cqw`, columnGap: `${L.gap}cqw`, bottom: 'auto' }}>
                    {columns.map(([name, spec, lh, color]) => (
                        <div key={name} className="min-w-0">
                            <div className="uppercase font-medium" style={{ fontSize: `${L.label}cqw`, color: C.muted }}>{name}</div>
                            <div className="leading-none" style={{ ...faceStyle(spec), fontSize: `${L.specimen}cqw`, color, marginTop: `${L.specimen * 0.15}cqw` }}>Aa</div>
                            <div className="truncate" style={{ ...faceStyle(spec), fontSize: `${L.name}cqw`, color: C.ink, marginTop: `${L.name * 0.5}cqw` }}>{spec.family}</div>
                            <div style={{ fontSize: `${L.meta}cqw`, color: C.muted, marginTop: `${L.meta * 0.6}cqw` }}>{fontMeta(spec, lh)}</div>
                        </div>
                    ))}
                </div>

                <div className="absolute" style={{ left: `${L.pad}cqw`, bottom: `${L.pad}cqw`, maxWidth: `${L.bodyMaxWidth}cqw` }}>
                    <p style={{ ...faceStyle(type.heading), fontSize: `${L.headline}cqw`, lineHeight: type.heading.lh, letterSpacing: `${type.heading.ls}em`, color: accent }}>
                        {headline}
                    </p>
                    <p style={{ ...faceStyle(type.body), fontSize: `${L.body}cqw`, lineHeight: type.bodyLineHeight, letterSpacing: `${type.body.ls}em`, color: C.ink, marginTop: `${L.gap * 0.5}cqw` }}>
                        {body}
                    </p>
                </div>
            </div>

            <div className="mt-5 flex items-center gap-5 text-[11px] tracking-wide">
                {type.sourceUrl && (
                    <a href={type.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-300 transition-colors">
                        Open in JustMyType
                    </a>
                )}
                <button onClick={() => setReplacing(true)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                    Replace
                </button>
                <button onClick={() => onChange(null)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                    Remove
                </button>
            </div>
        </div>
    )
}
