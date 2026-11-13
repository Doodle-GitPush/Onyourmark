import type { BrandType, FontSpec } from './brand'

/**
 * Reads JustMyType share links into a BrandType. The payload format is
 * JustMyType's own (`src/lib/shareLink.js` there): base64url JSON in the
 * `s` query param, with `pf`/`sf` families, `pc`/`sc` as
 * `[size, weight, lh, ls]`, `pa`/`sa` axes, `pft`/`sft` features and `blh`.
 * Validation mirrors theirs — anything malformed is dropped, never thrown.
 */

const fromBase64Url = (str: string) => {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/')
    const withPadding = padded + '='.repeat((4 - (padded.length % 4)) % 4)
    const bytes = Uint8Array.from(atob(withPadding), (c) => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function pickTags<T extends 'number' | 'boolean'>(obj: unknown, type: T) {
    if (!obj || typeof obj !== 'object') return undefined
    const out: Record<string, T extends 'number' ? number : boolean> = {}
    for (const [tag, v] of Object.entries(obj)) {
        if (/^[A-Za-z0-9]{4}$/.test(tag) && typeof v === type) out[tag] = v as never
    }
    return Object.keys(out).length ? out : undefined
}

function toSpec(family: unknown, controls: unknown, axes: unknown, features: unknown): FontSpec | null {
    if (typeof family !== 'string' || !family.trim()) return null
    if (!Array.isArray(controls) || controls.length !== 4 || !controls.every(isNum)) return null
    const [size, weight, lh, ls] = controls
    const spec: FontSpec = { family, size, weight, lh, ls }
    const a = pickTags(axes, 'number')
    const f = pickTags(features, 'boolean')
    if (a) spec.axes = a
    if (f) spec.features = f
    return spec
}

/** Parses a pasted JustMyType share link. Returns null for anything that
 *  isn't one — including a JustMyType link with no pairing in it. */
export function parseJustMyTypeLink(input: string): BrandType | null {
    let url: URL
    try {
        url = new URL(input.trim())
    } catch {
        return null
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

    const encoded = url.searchParams.get('s')
    if (!encoded) return null

    try {
        const p = JSON.parse(fromBase64Url(encoded))
        const heading = toSpec(p.pf, p.pc, p.pa, p.pft)
        const body = toSpec(p.sf, p.sc, p.sa, p.sft)
        if (!heading || !body) return null
        return {
            heading,
            body,
            bodyLineHeight: isNum(p.blh) ? p.blh : body.lh,
            sourceUrl: url.toString(),
        }
    } catch {
        return null
    }
}

/** Query param JustMyType's "Send to OnYourMark" button opens us with: the
 *  full share link, URI-encoded. */
export const HANDOFF_PARAM = 'jmt'

/** Picks up a pairing handed over from JustMyType, then strips the param so
 *  a refresh or a copied URL doesn't re-import it over later edits. */
export function consumeHandoff(): BrandType | null {
    const params = new URLSearchParams(window.location.search)
    const link = params.get(HANDOFF_PARAM)
    if (!link) return null

    params.delete(HANDOFF_PARAM)
    const qs = params.toString()
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash)

    return parseJustMyTypeLink(link)
}
