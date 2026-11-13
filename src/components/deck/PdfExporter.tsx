"use client"

import React, { useEffect, useRef, useState } from 'react'
import { getFontEmbedCSS, toJpeg } from 'html-to-image'
import { jsPDF } from 'jspdf'
import type { Brand } from '@/lib/brand'
import type { Page } from '@/lib/deck'
import { whenFontReady } from '@/lib/fonts'
import { Slide } from './Slide'

const W = 1920
const H = 1080

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

/** How long a page needs before its picture is taken: a shader has to
 *  compile and draw; the rest only have to lay out. (The 3D page reports
 *  for itself when it has drawn — see `ready` below.) */
const settleTime = (page: Page) => (page.kind === 'three' ? 300 : page.bg === 'motion' ? 500 : 60)

/** The longest a 3D page gets to load three.js and render before the
 *  export moves on without it. */
const THREE_TIMEOUT = 20000

const fileName = (brand: Brand) =>
    `${brand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'brand'}-deck.pdf`

interface PdfExporterProps {
    brand: Brand
    pages: Page[]
    onProgress: (done: number, total: number) => void
    onDone: (error?: unknown) => void
}

/**
 * Renders each page off screen at 1920×1080 with the very component the
 * editor uses, photographs it, and assembles the PDF — so the export is
 * the deck you see: real fonts with their axes and features, the live
 * shader frame, the 3D render.
 */
export function PdfExporter({ onProgress, onDone, ...props }: PdfExporterProps) {
    // The deck as it was when Export was pressed — a re-render upstream
    // mustn't restart or reshuffle a capture that's under way.
    const [{ brand, pages }] = useState(props)
    const [index, setIndex] = useState(0)
    const nodeRef = useRef<HTMLDivElement>(null)
    const job = useRef<{ pdf: jsPDF; fontCss?: string } | null>(null)
    // Which page's 3D scene has drawn, and who is waiting to hear about it.
    const ready = useRef<{ id: string | null; notify: (() => void) | null }>({ id: null, notify: null })
    // The callbacks' identities change as the parent re-renders with
    // progress; the capture loop must only advance with `index`.
    const callbacks = useRef({ onProgress, onDone })
    useEffect(() => {
        callbacks.current = { onProgress, onDone }
    })

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            const node = nodeRef.current
            const page = pages[index]
            if (!node || !page) return

            if (!job.current) job.current = { pdf: new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H], compress: true }) }
            const state = job.current

            if (brand.type) await Promise.all([whenFontReady(brand.type.heading), whenFontReady(brand.type.body)])
            await document.fonts?.ready
            await nextFrame()
            if (page.kind === 'three' && ready.current.id !== page.id) {
                await Promise.race([new Promise<void>((resolve) => { ready.current.notify = resolve }), wait(THREE_TIMEOUT)])
            }
            await wait(settleTime(page))
            if (cancelled) return

            // Fonts are inlined once, from the hidden specimen below that
            // uses every face, then reused for each page.
            state.fontCss ??= await getFontEmbedCSS(node.parentElement!)
            const image = await toJpeg(node, { width: W, height: H, pixelRatio: 1, quality: 0.94, fontEmbedCSS: state.fontCss, backgroundColor: '#000000' })
            if (cancelled) return

            if (index > 0) state.pdf.addPage([W, H], 'landscape')
            state.pdf.addImage(image, 'JPEG', 0, 0, W, H, undefined, 'FAST')
            callbacks.current.onProgress(index + 1, pages.length)

            if (index + 1 < pages.length) {
                setIndex(index + 1)
            } else {
                state.pdf.save(fileName(brand))
                callbacks.current.onDone()
            }
        }
        run().catch((err) => {
            if (!cancelled) callbacks.current.onDone(err)
        })
        return () => {
            cancelled = true
        }
    }, [index, pages, brand])

    const page = pages[index]
    if (!page) return null

    return (
        // Laid out for real (so WebGL draws at full size) but out of sight.
        <div aria-hidden className="fixed left-0 top-0 -z-10 opacity-0 pointer-events-none overflow-hidden" style={{ width: W, height: H }}>
            <div ref={nodeRef} style={{ width: W, height: H }}>
                <Slide
                    key={page.id}
                    page={page}
                    brand={brand}
                    index={index}
                    mode="export"
                    onReady={() => {
                        ready.current.id = page.id
                        ready.current.notify?.()
                    }}
                />
            </div>
            {brand.type && (
                <div>
                    <span style={{ fontFamily: `"${brand.type.heading.family}"`, fontWeight: brand.type.heading.weight }}>Aa</span>
                    <span style={{ fontFamily: `"${brand.type.body.family}"`, fontWeight: brand.type.body.weight }}>Aa</span>
                </div>
            )}
            <span className="font-sans">Aa</span>
            <span className="font-mono">Aa</span>
        </div>
    )
}
