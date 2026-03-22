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

const PERSONALITY_COLORS = [
    'bg-violet-100 text-violet-700',
    'bg-sky-100 text-sky-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
]

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
        <div className="w-full rounded-2xl overflow-hidden border border-black/5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] mt-4">
            {/* Header bar */}
            <div
                className="flex items-center justify-between px-6 py-4 border-b border-black/5"
                style={{ background: `linear-gradient(135deg, ${primaryColor}12 0%, transparent 100%)` }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${primaryColor}20` }}>
                        <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    </div>
                    <span className="text-[11px] font-bold tracking-widest uppercase text-slate-500">AI Logo Insight</span>
                </div>
                {(insight || error) && !loading && (
                    <button
                        onClick={() => analyze(svgContent)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Regenerate
                    </button>
                )}
            </div>

            <div className="p-6">
                {/* Loading shimmer */}
                {loading && (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-7 bg-slate-100 rounded-lg w-3/5" />
                        <div className="h-4 bg-slate-100 rounded w-2/5" />
                        <div className="space-y-2 mt-4">
                            <div className="h-3 bg-slate-100 rounded w-full" />
                            <div className="h-3 bg-slate-100 rounded w-5/6" />
                            <div className="h-3 bg-slate-100 rounded w-4/5" />
                        </div>
                        <div className="flex gap-2 mt-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-6 bg-slate-100 rounded-full" style={{ width: `${50 + i * 10}px` }} />
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-4 h-4 rounded-full bg-slate-200" />
                            <div className="h-3 bg-slate-100 rounded w-2/3" />
                        </div>
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                        </div>
                        {error === 'no_key' ? (
                            <>
                                <p className="text-[13px] font-semibold text-slate-700">API Key Required</p>
                                <p className="text-[11px] text-slate-400 max-w-[240px] leading-relaxed">
                                    Add your <code className="bg-slate-100 px-1 rounded">GEMINI_API_KEY</code> to{' '}
                                    <code className="bg-slate-100 px-1 rounded">.env.local</code> and restart the server.
                                </p>
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] font-semibold underline text-blue-500"
                                >
                                    Get a free key →
                                </a>
                            </>
                        ) : (
                            <>
                                <p className="text-[13px] font-semibold text-slate-700">Analysis failed</p>
                                <p className="text-[11px] text-slate-400">{error}</p>
                            </>
                        )}
                    </div>
                )}

                {/* Insight result */}
                {insight && !loading && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Brand name + industry */}
                        <div>
                            <div className="flex items-baseline gap-3 flex-wrap">
                                <h3 className="text-[22px] font-black tracking-tight text-slate-900 leading-tight">
                                    {insight.brandName}
                                </h3>
                                <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                    {insight.industry}
                                </span>
                            </div>
                            <p className="text-[13px] text-slate-400 mt-0.5 italic">"{insight.tagline}"</p>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-slate-100" />

                        {/* Meaning */}
                        <div>
                            <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-2">What it says</p>
                            <p className="text-[13px] text-slate-600 leading-relaxed">{insight.meaning}</p>
                        </div>

                        {/* Personality tags */}
                        <div>
                            <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-2">Personality</p>
                            <div className="flex flex-wrap gap-2">
                                {insight.personality.map((tag, i) => (
                                    <span
                                        key={i}
                                        className={`text-[11px] font-semibold px-3 py-1 rounded-full ${PERSONALITY_COLORS[i % PERSONALITY_COLORS.length]}`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Color story */}
                        <div className="flex gap-3 items-start p-3 rounded-xl bg-slate-50">
                            <div
                                className="w-8 h-8 rounded-lg flex-shrink-0 mt-0.5 shadow-sm"
                                style={{ background: primaryColor }}
                            />
                            <div>
                                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">Color story</p>
                                <p className="text-[12px] text-slate-600 leading-relaxed">{insight.colorStory}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
