/**
 * The Brand record — the one source of truth every tool reads and writes.
 * OnYourMark owns the logo/colour/3D parts; typography comes from
 * JustMyType and motion will come from SkidLab. Each part is optional so a
 * brand can be built up one tool at a time.
 */

import type { LogoInsight } from '@/components/AIInsightSlide'

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

/** Placeholder until SkidLab ships — kept in the schema now so saved
 *  brands don't need migrating when it lands. */
export interface BrandMotion {
    shaders: { presetId: string; params: Record<string, number | string> }[]
}

export interface Brand {
    logo?: { svg: string; fileName: string }
    colors: { primary: string; secondary: string }
    type?: BrandType
    motion?: BrandMotion
    /** Saved so a refresh doesn't re-run (and re-word) the AI analysis. */
    insight?: LogoInsight
}

const STORAGE_KEY = 'onyourmark:brand:v1'

/** Reads the saved brand, or null when there is none or storage is blocked. */
export function loadBrand(): Brand | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object' || !parsed.colors) return null
        return parsed as Brand
    } catch {
        return null
    }
}

/** Best-effort save — a full quota or private window just means the brand
 *  won't survive a refresh, never that the app breaks. */
export function saveBrand(brand: Brand) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(brand))
    } catch {
        // ignore
    }
}

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
