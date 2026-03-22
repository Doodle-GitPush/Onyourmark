'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Sparkles, Image as ImageIcon, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react'

const SCENE_SUGGESTIONS = [
    'Coffee shop counter',
    'Dark city billboard',
    'Luxury business card on marble',
    'Storefront glass door',
    'Branded tote bag on a street',
    'Hotel lobby signage',
]

interface AIMockupGeneratorProps {
    svgContent: string
    primaryColor: string
    onImageGenerated?: (imageBase64: string | null) => void
}

/** Rasterize SVG → PNG base64 (for sending to API) */
function svgToPngBase64(svgText: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = 512
            canvas.height = 512
            const ctx = canvas.getContext('2d')!
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, 512, 512)
            const pad = 80
            ctx.drawImage(img, pad, pad, 512 - pad * 2, 512 - pad * 2)
            URL.revokeObjectURL(url)
            resolve(canvas.toDataURL('image/png').replace('data:image/png;base64,', ''))
        }
        img.onerror = reject
        img.src = url
    })
}

/** Composite: draw AI background + overlay the actual logo SVG on top */
function compositeLogoOntoBackground(
    bgBase64: string,
    svgText: string
): Promise<string> {
    return new Promise((resolve, reject) => {
        // Load the AI-generated background
        const bg = new Image()
        bg.onload = () => {
            const W = bg.naturalWidth || 1600
            const H = bg.naturalHeight || 900
            const canvas = document.createElement('canvas')
            canvas.width = W
            canvas.height = H
            const ctx = canvas.getContext('2d')!

            // Draw the AI background
            ctx.drawImage(bg, 0, 0, W, H)

            // Load the SVG logo
            const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
            const svgUrl = URL.createObjectURL(svgBlob)
            const logo = new Image()

            logo.onload = () => {
                // Logo placement: bottom-left corner, ~20% of image width
                const logoSize = Math.round(W * 0.20)
                const margin = Math.round(W * 0.04)
                const x = margin
                const y = H - logoSize - margin

                // White rounded card backdrop with subtle shadow
                const pad = Math.round(logoSize * 0.14)
                const cardW = logoSize + pad * 2
                const cardH = logoSize + pad * 2
                const radius = Math.round(logoSize * 0.12)

                // Shadow
                ctx.save()
                ctx.shadowColor = 'rgba(0,0,0,0.35)'
                ctx.shadowBlur = Math.round(logoSize * 0.18)
                ctx.shadowOffsetX = 0
                ctx.shadowOffsetY = Math.round(logoSize * 0.06)

                // White card
                ctx.fillStyle = 'rgba(255,255,255,0.92)'
                ctx.beginPath()
                ctx.roundRect(x - pad, y - pad, cardW, cardH, radius)
                ctx.fill()
                ctx.restore()

                // Draw the actual logo on top of the card
                ctx.drawImage(logo, x, y, logoSize, logoSize)

                URL.revokeObjectURL(svgUrl)
                resolve(canvas.toDataURL('image/jpeg', 0.93))
            }

            logo.onerror = () => {
                // If logo fails, just resolve with plain background
                URL.revokeObjectURL(svgUrl)
                resolve(canvas.toDataURL('image/jpeg', 0.93))
            }

            logo.src = svgUrl
        }
        bg.onerror = reject
        bg.src = bgBase64
    })
}

export function AIMockupGenerator({ svgContent, primaryColor, onImageGenerated }: AIMockupGeneratorProps) {
    const [scene, setScene] = useState('')
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [generatingStep, setGeneratingStep] = useState<'prompt' | 'image' | 'compositing' | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const generate = useCallback(async (sceneText: string) => {
        if (!svgContent || !sceneText.trim()) return
        setLoading(true)
        setError(null)
        setGeneratedImage(null)
        setGeneratingStep('prompt')

        try {
            // Rasterize SVG for the API vision step
            const logoBase64 = await svgToPngBase64(svgContent)

            setGeneratingStep('image')

            const res = await fetch('/api/generate-mockup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logoBase64, scene: sceneText }),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error === 'no_key' ? 'no_key' : (data.error || 'Generation failed'))
                return
            }

            // If the model used the logo as reference input, logo is already in the scene — skip canvas overlay.
            // Only composite for text-only / Pollinations fallback where the logo isn't embedded.
            const needsCompositing = data.model !== 'gemini-2.5-flash-image-ref'

            if (needsCompositing) {
                setGeneratingStep('compositing')
                const composited = await compositeLogoOntoBackground(data.imageBase64, svgContent)
                setGeneratedImage(composited)
                onImageGenerated?.(composited)
            } else {
                setGeneratedImage(data.imageBase64)
                onImageGenerated?.(data.imageBase64)
            }

        } catch {
            setError('Could not connect to AI service')
        } finally {
            setLoading(false)
            setGeneratingStep(null)
        }
    }, [svgContent])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        generate(scene)
    }

    const handleDownload = () => {
        if (!generatedImage) return
        const a = document.createElement('a')
        a.href = generatedImage
        a.download = `mockup-${scene.replace(/\s+/g, '-')}.jpg`
        a.click()
    }

    const stepLabel =
        generatingStep === 'prompt' ? 'Crafting your scene prompt…' :
        generatingStep === 'image' ? 'Generating AI scene — ~15–30s…' :
        generatingStep === 'compositing' ? 'Compositing your logo…' :
        'Generating…'

    return (
        <div className="w-full rounded-[20px] overflow-hidden border border-black/5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] mb-3">
            {/* Header */}
            <div
                className="flex items-center justify-between px-6 py-4 border-b border-black/5"
                style={{ background: `linear-gradient(135deg, ${primaryColor}12 0%, transparent 100%)` }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${primaryColor}20` }}>
                        <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    </div>
                    <span className="text-[11px] font-bold tracking-widest uppercase text-slate-500">AI Mockup Studio</span>
                </div>
                <div className="flex items-center gap-2">
                    {generatedImage && !loading && (
                        <button
                            onClick={() => generate(scene)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Regenerate
                        </button>
                    )}
                </div>
            </div>

            <div className="p-5">
                {/* Input form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                        <input
                            type="text"
                            value={scene}
                            onChange={e => setScene(e.target.value)}
                            placeholder="Describe a scene… e.g. 'coffee shop counter'"
                            className="w-full text-[13px] px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all"
                            style={{ '--tw-ring-color': `${primaryColor}40` } as React.CSSProperties}
                            disabled={loading || !svgContent}
                        />
                        <button
                            type="submit"
                            disabled={loading || !scene.trim() || !svgContent}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                            style={{ background: primaryColor }}
                        >
                            <ArrowRight className="w-3.5 h-3.5 text-white" />
                        </button>
                    </div>

                    {/* Scene suggestion chips */}
                    <div className="flex flex-wrap gap-1.5">
                        {SCENE_SUGGESTIONS.map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setScene(s)}
                                disabled={loading}
                                className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-40"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </form>

                {/* No logo uploaded state */}
                {!svgContent && (
                    <div className="mt-4 flex items-center justify-center py-8 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                        <p className="text-[12px] text-slate-400">Upload a logo first to generate AI mockups</p>
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="mt-4 aspect-video w-full rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-3">
                        <div className="relative w-12 h-12">
                            <div
                                className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                                style={{ borderTopColor: primaryColor }}
                            />
                            <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ background: `${primaryColor}15` }}>
                                <ImageIcon className="w-4 h-4" style={{ color: primaryColor }} />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[12px] font-semibold text-slate-600">{stepLabel}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Your logo will be composited onto the scene</p>
                        </div>
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div className="mt-4 flex flex-col items-center justify-center py-6 gap-3 text-center rounded-xl bg-red-50/50">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                        {error === 'no_key' ? (
                            <>
                                <p className="text-[12px] font-semibold text-slate-700">API Key Required</p>
                                <p className="text-[11px] text-slate-400">
                                    Add <code className="bg-white px-1 rounded">GEMINI_API_KEY</code> to{' '}
                                    <code className="bg-white px-1 rounded">.env.local</code>
                                </p>
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] font-semibold text-blue-500 underline"
                                >
                                    Get a free key →
                                </a>
                            </>
                        ) : (
                            <>
                                <p className="text-[12px] font-semibold text-slate-700">Generation failed</p>
                                <p className="text-[11px] text-slate-400 max-w-[240px]">{error}</p>
                            </>
                        )}
                    </div>
                )}

                {/* Generated image with composited logo */}
                {generatedImage && !loading && (
                    <div className="mt-4 space-y-2">
                        <div className="w-full aspect-video relative rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-black/5 bg-slate-950">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={generatedImage}
                                alt={`AI Mockup: ${scene}`}
                                className="w-full h-full object-contain"
                            />
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/30 backdrop-blur-sm text-white text-[10px] font-semibold tracking-widest uppercase">
                                AI GENERATED
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center italic">"{scene}" — logo composited in scene</p>
                    </div>
                )}
            </div>

            {/* Hidden canvas for compositing */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    )
}
