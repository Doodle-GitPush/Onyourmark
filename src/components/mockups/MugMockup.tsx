'use client'

import React, { useEffect, useRef } from 'react'

interface MugMockupProps {
    svgContent: string
    logoColor: string
    size: number // 0-100, percentage of mockup width
}

/**
 * Applies a cylindrical warp to the logo so it looks like it wraps
 * around the curved surface of a mug.
 *
 * Algorithm: for each destination column x ∈ [0, W],
 *   normalize to t ∈ [-1, 1],
 *   source position = asin(t * bend) / asin(bend) → maps edges inward,
 *   simulating the compression of a flat image wrapping around a cylinder.
 */
function drawWarpedLogo(
    destCtx: CanvasRenderingContext2D,
    sourceCvs: HTMLCanvasElement,
    dx: number, dy: number,     // top-left placement on dest canvas
    dw: number, dh: number,     // size on dest canvas
    bend: number = 0.72         // 0 = flat, 1 = full hemisphere (0.7 is realistic mug)
) {
    const srcW = sourceCvs.width
    const srcH = sourceCvs.height

    // Work on an off-screen temp canvas at dest size
    const tmp = document.createElement('canvas')
    tmp.width = dw
    tmp.height = dh
    const tc = tmp.getContext('2d')!

    for (let col = 0; col < dw; col++) {
        // Normalize [-1, 1]
        const t = (col / dw) * 2 - 1
        // Cylindrical remap: compress edges
        const st = Math.asin(t * bend) / Math.asin(bend)
        const srcX = Math.round(((st + 1) / 2) * srcW)

        if (srcX < 0 || srcX >= srcW) continue

        // Draw 1-pixel-wide column from source → dest
        tc.drawImage(sourceCvs, srcX, 0, 1, srcH, col, 0, 1, dh)
    }

    // Apply a very subtle horizontal gradient to fake shading on the cylinder edges
    const shade = tc.createLinearGradient(0, 0, dw, 0)
    shade.addColorStop(0,    'rgba(0,0,0,0.18)')
    shade.addColorStop(0.18, 'rgba(0,0,0,0.04)')
    shade.addColorStop(0.5,  'rgba(0,0,0,0)')
    shade.addColorStop(0.82, 'rgba(0,0,0,0.04)')
    shade.addColorStop(1,    'rgba(0,0,0,0.18)')
    tc.fillStyle = shade
    tc.fillRect(0, 0, dw, dh)

    // Composite warped image onto destination
    destCtx.drawImage(tmp, dx, dy, dw, dh)
}

export function MugMockup({ svgContent, logoColor, size }: MugMockupProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !svgContent) return

        const ctx = canvas.getContext('2d')!
        const W = canvas.width
        const H = canvas.height

        // Color the SVG
        const coloredSvg = svgContent
            .replace(/fill="[^"]*"/g, `fill="${logoColor}"`)
            .replace(/stroke="[^"]*"/g, `stroke="${logoColor}"`)
            .replace(/style="[^"]*"/g, '')

        // Load mug background
        const mugImg = new Image()
        mugImg.onload = () => {
            // Draw mug (object-fit: cover)
            ctx.clearRect(0, 0, W, H)
            ctx.fillStyle = '#f8f8f8'
            ctx.fillRect(0, 0, W, H)

            const ir = mugImg.naturalWidth / mugImg.naturalHeight
            const cr = W / H
            let dw2: number, dh2: number, dx2: number, dy2: number
            if (ir > cr) {
                dh2 = H; dw2 = H * ir; dx2 = (W - dw2) / 2; dy2 = 0
            } else {
                dw2 = W; dh2 = W / ir; dx2 = 0; dy2 = (H - dh2) / 2
            }
            ctx.drawImage(mugImg, dx2, dy2, dw2, dh2)

            // Render SVG logo → offscreen canvas
            const blob = new Blob([coloredSvg], { type: 'image/svg+xml;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const logoImg = new Image()
            logoImg.onload = () => {
                // Logo target size on mug
                const logoW = Math.round(W * (size / 100))
                const logoH = Math.round(logoW * (logoImg.naturalHeight / logoImg.naturalWidth))

                // Center of mug face — place logo slightly above vertical center
                const logoX = (W - logoW) / 2
                const logoY = H * 0.42 - logoH / 2

                // Render logo to offscreen canvas (no warp yet)
                const src = document.createElement('canvas')
                src.width = logoW
                src.height = logoH
                const sc = src.getContext('2d')!
                sc.drawImage(logoImg, 0, 0, logoW, logoH)

                // Apply multiply blend before drawing warped logo
                ctx.save()
                ctx.globalCompositeOperation = 'multiply'
                ctx.globalAlpha = 0.88

                drawWarpedLogo(ctx, src, logoX, logoY, logoW, logoH, 0.68)

                ctx.restore()

                URL.revokeObjectURL(url)
            }
            logoImg.onerror = () => URL.revokeObjectURL(url)
            logoImg.src = url
        }
        mugImg.src = '/mockups/mug.png'
    }, [svgContent, logoColor, size])

    return (
        <div className="w-full h-full relative">
            <canvas
                ref={canvasRef}
                width={1600}
                height={900}
                className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-4 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase text-slate-400 bg-white/60 backdrop-blur-sm">
                Mug
            </div>
        </div>
    )
}
