'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react'

export interface LogoInsight {
    brandName: string
    tagline: string
    meaning: string
    personality: string[]
    colorStory: string
    industry: string
}

interface AIInsightSlideProps {
    svgContent: string
    primaryColor: string
    cachedInsight?: LogoInsight | null
    onInsightReady?: (insight: LogoInsight) => void
}

// Rasterize SVG to PNG base64 via a canvas
function svgToBase64(svgText: string): Promise<string> {
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
            // Draw logo centered with padding
            const pad = 64
            ctx.drawImage(img, pad, pad, 512 - pad * 2, 512 - pad * 2)
            URL.revokeObjectURL(url)
            resolve(canvas.toDataURL('image/png').replace('data:image/png;base64,', ''))
        }
        img.onerror = reject
        img.src = url
    })
}


export function AIInsightSlide({ svgContent, primaryColor, cachedInsight, onInsightReady }: AIInsightSlideProps) {
    const [insight, setInsight] = useState<LogoInsight | null>(cachedInsight ?? null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const prevSvgRef = useRef<string>('')

    const analyze = useCallback(async (svg: string) => {
        setLoading(true)
        setError(null)
        setInsight(null)
        try {
            const imageBase64 = await svgToBase64(svg)
            const res = await fetch('/api/analyze-logo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64 }),
            })
            const data = await res.json()
            if (!res.ok) {
                if (data.error === 'no_key') {
                    setError('no_key')
                } else {
                    setError(data.error || 'Analysis failed')
                }
                return
            }
            setInsight(data)
            onInsightReady?.(data)
        } catch {
            setError('Could not connect to AI service')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        // Skip if we already have cached data for this SVG
        if (!svgContent) return
        if (cachedInsight && svgContent === prevSvgRef.current) return
        if (svgContent === prevSvgRef.current) return
        prevSvgRef.current = svgContent
        // Don't re-fetch if parent already has cached data
        if (cachedInsight) {
            setInsight(cachedInsight)
            return
        }
        analyze(svgContent)
    }, [svgContent, cachedInsight, analyze])

    if (!svgContent) return null

    return (
        <div>
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-500">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    <span className="text-[11px] uppercase tracking-widest">AI Insight</span>
                </div>
                {(insight || error) && !loading && (
                    <button
                        onClick={() => analyze(svgContent)}
                        className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Regenerate
                    </button>
                )}
            </div>

            <div className="mt-5">
                {/* Loading shimmer */}
                {loading && (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-6 bg-white/[0.05] rounded w-2/5" />
                        <div className="h-3 bg-white/[0.05] rounded w-1/4" />
                        <div className="space-y-2 mt-5">
                            <div className="h-3 bg-white/[0.05] rounded w-full" />
                            <div className="h-3 bg-white/[0.05] rounded w-5/6" />
                        </div>
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div className="flex flex-col gap-2 text-left">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <AlertCircle className="w-4 h-4" />
                            <p className="text-[13px]">{error === 'no_key' ? 'API key required' : 'Analysis failed'}</p>
                        </div>
                        {error === 'no_key' ? (
                            <p className="text-[12px] text-zinc-600 leading-relaxed max-w-md">
                                Add <code className="text-zinc-400">GEMINI_API_KEY</code> to <code className="text-zinc-400">.env.local</code> and restart the server, or{' '}
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#FF4800] underline underline-offset-4"
                                >
                                    get a free key
                                </a>.
                            </p>
                        ) : (
                            <p className="text-[12px] text-zinc-600">{error}</p>
                        )}
                    </div>
                )}

                {/* Insight result */}
                {insight && !loading && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Brand name + industry */}
                        <div>
                            <div className="flex items-baseline gap-3 flex-wrap">
                                <h3 className="text-[26px] font-medium tracking-tight text-zinc-50 leading-tight">
                                    {insight.brandName}
                                </h3>
                                <span className="text-[10px] uppercase tracking-widest text-zinc-600">
                                    {insight.industry}
                                </span>
                            </div>
                            <p className="text-[13px] text-zinc-500 mt-1 italic">&ldquo;{insight.tagline}&rdquo;</p>
                        </div>

                        {/* Meaning */}
                        <p className="text-[14px] text-zinc-300 leading-relaxed max-w-xl">{insight.meaning}</p>

                        {/* Personality tags */}
                        <p className="text-[13px] text-zinc-500">
                            {insight.personality.join('  ·  ')}
                        </p>

                        {/* Color story */}
                        <div className="flex gap-3 items-start">
                            <div
                                className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                                style={{ background: primaryColor }}
                            />
                            <p className="text-[13px] text-zinc-400 leading-relaxed max-w-xl">{insight.colorStory}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
