export const PAPER = '#FFFFFF'
export const INK = '#0A0A0A'

export type RGB = [number, number, number]

const clamp = (v: number, lo = 0, hi = 255) => Math.min(hi, Math.max(lo, v))

export const isHex = (v: string) => /^#[0-9A-F]{6}$/i.test(v)

export function hexToRgb(hex: string): RGB {
    const h = isHex(hex) ? hex.slice(1) : '000000'
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export const rgbToHex = ([r, g, b]: RGB) =>
    '#' + [r, g, b].map((v) => clamp(Math.round(v)).toString(16).padStart(2, '0')).join('').toUpperCase()

/** `rgb(…)`/`rgba(…)` as getComputedStyle reports it → hex, or null for
 *  anything transparent or unparseable. */
export function cssColorToHex(css: string): string | null {
    const m = css.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/)
    if (!m) return null
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return null
    return rgbToHex([+m[1], +m[2], +m[3]])
}

/** WCAG relative luminance, 0 (black) – 1 (white). */
export function luminance(hex: string) {
    const [r, g, b] = hexToRgb(hex).map((v) => {
        const c = v / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** White or ink — whichever reads better on `bg`. */
export const contrastOn = (bg: string) => (luminance(bg) > 0.42 ? INK : PAPER)

export function mix(a: string, b: string, t: number) {
    const [r1, g1, b1] = hexToRgb(a)
    const [r2, g2, b2] = hexToRgb(b)
    return rgbToHex([r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t])
}

/** Hex with alpha, for tints of a slide's foreground colour. */
export function alpha(hex: string, a: number) {
    const [r, g, b] = hexToRgb(hex)
    return `rgba(${r}, ${g}, ${b}, ${a})`
}

export const rgbLabel = (hex: string) => hexToRgb(hex).join(' ')

/** Naive device CMYK — fine as a starting point for a guidelines page, not
 *  a substitute for a profiled conversion. */
export function cmykLabel(hex: string) {
    const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
    const k = 1 - Math.max(r, g, b)
    if (k >= 1) return '0 0 0 100'
    const c = (1 - r - k) / (1 - k)
    const m = (1 - g - k) / (1 - k)
    const y = (1 - b - k) / (1 - k)
    return [c, m, y, k].map((v) => Math.round(v * 100)).join(' ')
}

function rgbToHsl([r, g, b]: RGB): [number, number, number] {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const l = (max + min) / 2
    if (max === min) return [0, 0, l]
    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    return [h * 60, s, l]
}

function hslToRgb(h: number, s: number, l: number): RGB {
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = l - c / 2
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

/** A neutral (near-black, near-white or grey) carries no brand hue. */
export function isNeutral(hex: string) {
    const [, s, l] = rgbToHsl(hexToRgb(hex))
    return s < 0.12 || l < 0.06 || l > 0.95
}

/** A partner colour for a brand with only one: same family, shifted far
 *  enough in hue and depth to work as an accent beside it. */
export function companion(hex: string) {
    const [h, s, l] = rgbToHsl(hexToRgb(hex))
    return rgbToHex(hslToRgb((h + 32) % 360, Math.min(1, s * 0.9 + 0.05), l > 0.5 ? l - 0.28 : l + 0.24))
}
