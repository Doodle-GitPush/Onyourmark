import type { BrandType, FontSpec } from './brand'

const requested = new Set<string>()

const cssUrl = (family: string, axis: string) =>
    `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}${axis}&display=swap`

/** Requests the one weight a spec uses from Google Fonts. JustMyType only
 *  offers weights a family actually ships, so asking for exactly that one
 *  is safe — but if the API rejects it anyway (or the family is one
 *  JustMyType self-hosts), fall back to the family's default style rather
 *  than nothing. */
export function loadFont(spec: FontSpec) {
    const key = `${spec.family}:${spec.weight}`
    if (requested.has(key)) return
    requested.add(key)

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    // html-to-image reads the rules back out for the PDF export.
    link.crossOrigin = 'anonymous'
    link.href = cssUrl(spec.family, `:wght@${spec.weight}`)
    link.onerror = () => {
        link.onerror = null
        link.href = cssUrl(spec.family, '')
    }
    document.head.appendChild(link)
}

const fontShorthand = (spec: FontSpec, sizePx: number) =>
    `${spec.weight} ${sizePx}px "${spec.family}"`

/** Resolves once the spec's face has loaded (or after `timeout` ms), so an
 *  export doesn't silently render in the fallback font. */
export function whenFontReady(spec: FontSpec, timeout = 4000): Promise<void> {
    loadFont(spec)
    if (!document.fonts) return Promise.resolve()
    return Promise.race([
        document.fonts.load(fontShorthand(spec, 32)).then(() => undefined),
        new Promise<void>((resolve) => setTimeout(resolve, timeout)),
    ])
}

const face = (family: string, size: number, weight: number, lh: number, ls: number): FontSpec =>
    ({ family, size, weight, lh, ls })

/** Starting points for a brand without a pairing yet — each a heading and
 *  body face that Google Fonts serves at these weights. */
export const PAIRINGS: { mood: string; type: BrandType }[] = [
    { mood: 'Editorial', type: { heading: face('Fraunces', 48, 600, 1.1, -0.02), body: face('Inter', 16, 400, 1.6, 0), bodyLineHeight: 1.6 } },
    { mood: 'Modern', type: { heading: face('Space Grotesk', 48, 600, 1.1, -0.03), body: face('Inter', 16, 400, 1.6, 0), bodyLineHeight: 1.6 } },
    { mood: 'Luxury', type: { heading: face('Playfair Display', 48, 600, 1.1, -0.01), body: face('Source Sans 3', 16, 400, 1.65, 0), bodyLineHeight: 1.65 } },
    { mood: 'Warm', type: { heading: face('DM Serif Display', 48, 400, 1.1, -0.01), body: face('DM Sans', 16, 400, 1.6, 0), bodyLineHeight: 1.6 } },
    { mood: 'Bold', type: { heading: face('Syne', 48, 700, 1.05, -0.03), body: face('Manrope', 16, 400, 1.65, 0), bodyLineHeight: 1.65 } },
    { mood: 'Refined', type: { heading: face('Instrument Serif', 48, 400, 1.05, -0.01), body: face('Instrument Sans', 16, 400, 1.6, 0), bodyLineHeight: 1.6 } },
]
