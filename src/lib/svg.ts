import { cssColorToHex, isNeutral } from './color'

/**
 * Logo SVG handling. An upload is prepared once — sanitised, given a
 * viewBox and intrinsic size, and its painted shapes tagged — after which
 * recolouring is a pure string operation and every instance is drawn
 * through an <img>, so a logo's own <style> rules and ids can't leak into
 * the page or collide between copies.
 */

export interface PreparedSvg {
    svg: string
    /** Brand-looking colours found in the artwork, biggest shapes first. */
    colors: string[]
    /** width / height */
    aspect: number
}

const BLOCKED = 'script, foreignObject, iframe, object, embed, audio, video, link, meta'
const SHAPES = 'path, rect, circle, ellipse, polygon, polyline, line, text, tspan'

function sanitize(root: Element) {
    root.querySelectorAll(BLOCKED).forEach((el) => el.remove())
    for (const el of [root, ...root.querySelectorAll('*')]) {
        for (const attr of [...el.attributes]) {
            const name = attr.name.toLowerCase()
            const value = attr.value.trim().toLowerCase()
            if (name.startsWith('on')) el.removeAttribute(attr.name)
            // Only in-document references and embedded rasters survive.
            else if ((name === 'href' || name === 'xlink:href') && !value.startsWith('#') && !value.startsWith('data:image/')) {
                el.removeAttribute(attr.name)
            }
        }
    }
    root.querySelectorAll('style').forEach((el) => {
        el.textContent = (el.textContent ?? '').replace(/@import[^;]*;?/gi, '')
    })
}

/** Parses, cleans and annotates an uploaded SVG. Null if it isn't one.
 *  Browser-only: it measures the artwork with the real CSS cascade. */
export function prepareSvg(raw: string): PreparedSvg | null {
    const doc = new DOMParser().parseFromString(raw, 'image/svg+xml')
    const root = doc.documentElement
    if (!root || root.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) return null

    sanitize(root)

    // Measured inside a shadow root so the logo's own <style> rules resolve
    // (class-based fills from Illustrator exports) without touching the page.
    const host = document.createElement('div')
    host.style.cssText = 'position:absolute;left:-99999px;top:0;width:400px;height:400px;visibility:hidden;pointer-events:none'
    document.body.appendChild(host)
    const live = document.importNode(root, true) as unknown as SVGSVGElement
    host.attachShadow({ mode: 'open' }).appendChild(live)

    try {
        const weights = new Map<string, number>()
        const count = (css: string, weight: number) => {
            const hex = cssColorToHex(css)
            if (hex) weights.set(hex, (weights.get(hex) ?? 0) + weight)
        }

        live.querySelectorAll<SVGGraphicsElement>(SHAPES).forEach((el) => {
            // A mask's luminance is its meaning — recolouring one breaks it.
            if (el.closest('mask')) return
            const cs = getComputedStyle(el)
            let area = 1
            try {
                const box = el.getBBox()
                area = Math.max(1, box.width * box.height)
            } catch {
                // not rendered (inside <defs>) — still counts, just barely
            }
            if (cs.fill !== 'none') {
                el.setAttribute('data-f', '')
                count(cs.fill, area)
            }
            if (cs.stroke !== 'none') {
                el.setAttribute('data-s', '')
                count(cs.stroke, area * 0.2)
            }
        })
        live.querySelectorAll('stop').forEach((el) => count(getComputedStyle(el).stopColor, 1))

        let vb = live.viewBox?.baseVal
        if (!vb || !vb.width || !vb.height) {
            const w = parseFloat(live.getAttribute('width') ?? '')
            const h = parseFloat(live.getAttribute('height') ?? '')
            if (w > 0 && h > 0) {
                live.setAttribute('viewBox', `0 0 ${w} ${h}`)
            } else {
                const box = live.getBBox()
                if (!box.width || !box.height) return null
                live.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`)
            }
            vb = live.viewBox.baseVal
        }
        // An intrinsic size in every browser — rasterising an SVG that has
        // only a viewBox draws nothing in some of them.
        live.setAttribute('width', String(vb.width))
        live.setAttribute('height', String(vb.height))
        live.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

        const colors = [...weights.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([hex]) => hex)
            .filter((hex) => !isNeutral(hex))
            .slice(0, 6)

        return { svg: new XMLSerializer().serializeToString(live), colors, aspect: vb.width / vb.height }
    } catch {
        return null
    } finally {
        host.remove()
    }
}

/** The prepared logo in one flat colour. Shapes that paint were tagged by
 *  `prepareSvg`, so outlines stay outlines and unfilled shapes stay empty. */
export function monoSvg(svg: string, color: string) {
    const rule = `<style>[data-f]{fill:${color}!important}[data-s]{stroke:${color}!important}</style>`
    const end = svg.lastIndexOf('</svg>')
    return end === -1 ? svg : svg.slice(0, end) + rule + svg.slice(end)
}

export const svgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

const urlCache = new Map<string, string>()

/** Data URL for the logo, optionally flattened to one colour. Cached —
 *  a deck asks for the same handful of variants on every render. */
export function logoUrl(svg: string, mono?: string) {
    const key = `${mono ?? ''}|${svg}`
    let url = urlCache.get(key)
    if (!url) {
        if (urlCache.size > 64) urlCache.clear()
        url = svgDataUrl(mono ? monoSvg(svg, mono) : svg)
        urlCache.set(key, url)
    }
    return url
}

export function svgAspect(svg: string) {
    const m = svg.match(/viewBox="\s*[-\d.e]+[\s,]+[-\d.e]+[\s,]+([\d.e]+)[\s,]+([\d.e]+)\s*"/i)
    const w = m ? parseFloat(m[1]) : 0
    const h = m ? parseFloat(m[2]) : 0
    return w > 0 && h > 0 ? w / h : 1
}

/** PNG (base64, no prefix) of the logo on white, for the AI analysis. */
export function rasterize(svg: string, size = 512): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = canvas.height = size
            const ctx = canvas.getContext('2d')!
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, size, size)
            const box = size * 0.75
            const aspect = img.naturalWidth / img.naturalHeight || 1
            const w = aspect >= 1 ? box : box * aspect
            const h = aspect >= 1 ? box / aspect : box
            ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
            resolve(canvas.toDataURL('image/png').replace('data:image/png;base64,', ''))
        }
        img.onerror = reject
        img.src = svgDataUrl(svg)
    })
}

/** A small two-colour mark for trying the tool without a file to hand. */
export const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><path data-f="" d="M60 12a48 48 0 1 0 48 48H60Z" fill="#FF4800"/><circle data-f="" cx="86" cy="34" r="22" fill="#1B1B3A"/></svg>`
