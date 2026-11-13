import type { BrandType, FontSpec } from './brand'
import { canvasFont, whenFontReady } from './fonts'

/**
 * The typography slide's layout, in percent of slide width, shared by the
 * on-screen preview (as `cqw`) and the PDF renderer (as px of canvas
 * width) so the two can't drift apart.
 */
export const TYPE_SLIDE = {
    pad: 6,
    gap: 4,
    label: 1.0,
    specimen: 11,
    name: 1.9,
    meta: 1.0,
    headline: 3.6,
    body: 1.45,
    bodyMaxWidth: 62,
}

export const TYPE_SLIDE_COLORS = {
    bg: '#FFFFFF',
    ink: '#111111',
    muted: '#8A8A8F',
}

export const fontMeta = (spec: FontSpec, lh: number) =>
    `${spec.weight} · ${lh} leading · ${spec.ls}em tracking`

/** Greedy word wrap. Canvas has no layout engine, so the export breaks
 *  lines itself — measured with the real webfont, since the caller waits
 *  for it first. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const lines: string[] = []
    let line = ''
    for (const word of text.split(/\s+/).filter(Boolean)) {
        const next = line ? `${line} ${word}` : word
        if (line && ctx.measureText(next).width > maxWidth) {
            lines.push(line)
            line = word
        } else {
            line = next
        }
    }
    if (line) lines.push(line)
    return lines
}

function setTracking(ctx: CanvasRenderingContext2D, em: number, sizePx: number) {
    // Not in every browser yet — without it the export is just untracked.
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${em * sizePx}px`
}

/** Draws the typography slide onto `canvas`. Canvas text can't take
 *  variable-axis or OpenType settings, so those only show on screen —
 *  same limitation as JustMyType's own exports. */
export async function drawTypeSlide(
    canvas: HTMLCanvasElement,
    type: BrandType,
    accent: string,
    text: { headline: string; body: string },
) {
    await Promise.all([whenFontReady(type.heading), whenFontReady(type.body)])

    const ctx = canvas.getContext('2d')!
    const W = canvas.width
    const H = canvas.height
    const u = W / 100
    const L = TYPE_SLIDE

    ctx.fillStyle = TYPE_SLIDE_COLORS.bg
    ctx.fillRect(0, 0, W, H)
    ctx.textBaseline = 'alphabetic'

    // Two specimen columns: heading face, then body face.
    const colW = (W - L.pad * 2 * u - L.gap * u) / 2
    const columns: [string, FontSpec, number, string][] = [
        ['Heading', type.heading, type.heading.lh, accent],
        ['Body', type.body, type.bodyLineHeight, TYPE_SLIDE_COLORS.ink],
    ]
    columns.forEach(([label, spec, lh, color], i) => {
        const x = L.pad * u + i * (colW + L.gap * u)
        let y = L.pad * u + L.label * u

        setTracking(ctx, 0, 0)
        ctx.font = `500 ${L.label * u}px sans-serif`
        ctx.fillStyle = TYPE_SLIDE_COLORS.muted
        ctx.fillText(label.toUpperCase(), x, y)

        y += L.specimen * u
        ctx.font = canvasFont(spec, L.specimen * u)
        ctx.fillStyle = color
        ctx.fillText('Aa', x, y)

        y += L.name * u * 1.6
        ctx.font = canvasFont(spec, L.name * u)
        ctx.fillStyle = TYPE_SLIDE_COLORS.ink
        ctx.fillText(spec.family, x, y)

        y += L.meta * u * 2
        ctx.font = `400 ${L.meta * u}px sans-serif`
        ctx.fillStyle = TYPE_SLIDE_COLORS.muted
        ctx.fillText(fontMeta(spec, lh), x, y)
    })

    // In use: headline + paragraph, bottom-aligned.
    const maxW = L.bodyMaxWidth * u
    const headPx = L.headline * u
    const bodyPx = L.body * u

    ctx.font = canvasFont(type.body, bodyPx)
    setTracking(ctx, type.body.ls, bodyPx)
    const bodyLines = wrapLines(ctx, text.body, maxW)
    ctx.font = canvasFont(type.heading, headPx)
    setTracking(ctx, type.heading.ls, headPx)
    const headLines = wrapLines(ctx, text.headline, maxW)

    const headLead = headPx * type.heading.lh
    const bodyLead = bodyPx * type.bodyLineHeight
    let y = H - L.pad * u - bodyLines.length * bodyLead - L.gap * u * 0.5 - headLines.length * headLead

    ctx.fillStyle = accent
    for (const line of headLines) {
        y += headLead
        ctx.fillText(line, L.pad * u, y - (headLead - headPx) / 2)
    }
    y += L.gap * u * 0.5

    ctx.font = canvasFont(type.body, bodyPx)
    setTracking(ctx, type.body.ls, bodyPx)
    ctx.fillStyle = TYPE_SLIDE_COLORS.ink
    for (const line of bodyLines) {
        y += bodyLead
        ctx.fillText(line, L.pad * u, y - (bodyLead - bodyPx) / 2)
    }

    setTracking(ctx, 0, 0)
}
