/**
 * The Brand record — the one source of truth every tool reads and writes.
 * OnYourMark owns the logo/colour/3D parts; typography comes from
 * JustMyType and motion will come from SkidLab. A deck is a list of pages
 * that all render from this record, so changing a colour or a typeface
 * here restyles every page at once.
 */

import { INK, PAPER, companion, contrastOn } from './color'

/** One face in a pairing. Mirrors JustMyType's per-font controls exactly
 *  (`size`/`weight`/`lh`/`ls`, with `ls` in em) so a pairing round-trips
 *  between the two tools without conversion. */
export interface FontSpec {
    family: string
    size: number
    weight: number
    lh: number
    ls: number
    /** Variable-axis values keyed by 4-letter tag, e.g. `{ opsz: 72 }`. */
    axes?: Record<string, number>
    /** OpenType features keyed by 4-letter tag, e.g. `{ smcp: true }`. */
    features?: Record<string, boolean>
}

export interface BrandType {
    heading: FontSpec
    body: FontSpec
    /** JustMyType drives body line height app-wide rather than per font. */
    bodyLineHeight: number
    /** The JustMyType link this came from, so it can be reopened there. */
    sourceUrl?: string
}

export interface BrandColor {
    id: string
    name: string
    hex: string
}

export const MOTION_PRESETS = ['flow', 'aurora', 'orb', 'waves', 'grid'] as const
export type MotionPreset = (typeof MOTION_PRESETS)[number]

/** The brand's moving background. Built-in presets for now — SkidLab
 *  shaders will join this list as further preset ids. */
export interface BrandMotion {
    preset: MotionPreset
    speed: number
}

export type LogoMaterial = 'chrome' | 'glass' | 'gold' | 'matte' | 'holo'

export interface LogoInsight {
    brandName: string
    tagline: string
    meaning: string
    personality: string[]
    colorStory: string
    industry: string
}

export interface Brand {
    name: string
    logo: { svg: string; fileName: string }
    /** The palette. The first colour is the primary, the second the accent. */
    colors: BrandColor[]
    type?: BrandType
    motion: BrandMotion
    material: LogoMaterial
    /** Saved so a refresh doesn't re-run (and re-word) the AI analysis. */
    insight?: LogoInsight
}

export const MAX_COLORS = 6

export const uid = () => Math.random().toString(36).slice(2, 10)

const DEFAULT_COLORS = ['#0066FF', '#FF4800']
const COLOR_NAMES = ['Primary', 'Accent', 'Support', 'Highlight', 'Tone', 'Tint']

export const colorName = (index: number) => COLOR_NAMES[index] ?? `Colour ${index + 1}`

/** "acme-logo_final.svg" → "Acme" */
export function nameFromFile(fileName: string) {
    const words = fileName
        .replace(/\.svg$/i, '')
        .split(/[\s_\-.]+/)
        .filter((w) => w && !/^(logo|logotype|wordmark|final|v\d+|\d+|copy|export|mark|icon|svg|rgb|cmyk)$/i.test(w))
    const name = words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
    return name || 'Your Brand'
}

/** A fresh brand for an uploaded logo, coloured from the artwork itself
 *  where it has colours to offer. */
export function createBrand(svg: string, fileName: string, logoColors: string[]): Brand {
    const hexes = logoColors.length >= 2
        ? logoColors.slice(0, 3)
        : logoColors.length === 1
            ? [logoColors[0], companion(logoColors[0])]
            : DEFAULT_COLORS
    return {
        name: nameFromFile(fileName),
        logo: { svg, fileName },
        colors: hexes.map((hex, i) => ({ id: uid(), name: colorName(i), hex })),
        motion: { preset: 'flow', speed: 1 },
        material: 'chrome',
    }
}

export const primaryOf = (brand: Brand) => brand.colors[0]?.hex ?? DEFAULT_COLORS[0]
export const accentOf = (brand: Brand) => brand.colors[1]?.hex ?? brand.colors[0]?.hex ?? DEFAULT_COLORS[1]

/** A page background: a palette colour id, or one of these. */
export type Bg = string
export const BG_PAPER = 'paper'
export const BG_INK = 'ink'
export const BG_MOTION = 'motion'

/** The flat colour behind a page. Motion pages sit on ink. A reference to
 *  a colour that has since been removed falls back to the primary. */
export function resolveBg(brand: Brand, bg: Bg | undefined): string {
    if (bg === BG_PAPER) return PAPER
    if (bg === BG_INK || bg === BG_MOTION) return INK
    return brand.colors.find((c) => c.id === bg)?.hex ?? primaryOf(brand)
}

/** Text/logo colour for a page background. */
export const fgFor = (brand: Brand, bg: Bg | undefined) =>
    bg === BG_MOTION ? PAPER : contrastOn(resolveBg(brand, bg))

/** `font-variation-settings` for a spec's axes. Weight stays on
 *  `font-weight`, as in JustMyType. */
export function variationSettings(spec: FontSpec): string | undefined {
    const parts = Object.entries(spec.axes ?? {})
        .filter(([tag]) => tag !== 'wght')
        .map(([tag, v]) => `'${tag}' ${v}`)
    return parts.length ? parts.join(', ') : undefined
}

/** `font-feature-settings` for a spec's OpenType features. */
export function featureSettings(spec: FontSpec): string | undefined {
    const parts = Object.entries(spec.features ?? {}).map(([tag, on]) => `'${tag}' ${on ? 1 : 0}`)
    return parts.length ? parts.join(', ') : undefined
}
