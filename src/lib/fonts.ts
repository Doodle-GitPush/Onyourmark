import type { FontSpec } from './brand'

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
    link.href = cssUrl(spec.family, `:wght@${spec.weight}`)
    link.onerror = () => {
        link.onerror = null
        link.href = cssUrl(spec.family, '')
    }
    document.head.appendChild(link)
}

/** CSS font shorthand for canvas drawing. */
export const canvasFont = (spec: FontSpec, sizePx: number) =>
    `${spec.weight} ${sizePx}px "${spec.family}", sans-serif`

/** Resolves once the spec's face has loaded (or after `timeout` ms), so
 *  canvas exports don't silently draw in the fallback font. */
export function whenFontReady(spec: FontSpec, timeout = 4000): Promise<void> {
    loadFont(spec)
    if (!document.fonts) return Promise.resolve()
    return Promise.race([
        document.fonts.load(canvasFont(spec, 32)).then(() => undefined),
        new Promise<void>((resolve) => setTimeout(resolve, timeout)),
    ])
}
