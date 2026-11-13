"use client"

import React, { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropzoneProps {
    /** Resolves to an error message, or null once the file is accepted. */
    onFile: (file: File) => Promise<string | null>
    /** Shown under the zone while there's no error. */
    hint?: React.ReactNode
    className?: string
}

/** The SVG drop target: click to browse, or drag a file onto it. */
export function Dropzone({ onFile, hint, className }: DropzoneProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [over, setOver] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const accept = async (file: File | undefined) => {
        if (!file || busy) return
        setBusy(true)
        setError(await onFile(file))
        setBusy(false)
    }

    return (
        <div className={cn('w-full', className)}>
            <input
                ref={inputRef}
                type="file"
                accept=".svg,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                    accept(e.target.files?.[0])
                    e.target.value = ''
                }}
            />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setOver(true) }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => {
                    e.preventDefault()
                    setOver(false)
                    accept(e.dataTransfer.files?.[0])
                }}
                className={cn(
                    'group relative flex w-full flex-col items-center gap-4 rounded-3xl px-8 py-12 transition-all duration-300',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.985]',
                    over ? 'scale-[1.03] bg-[#FF4800]/[0.07]' : 'bg-white/[0.025] hover:bg-white/[0.045]',
                )}
            >
                {/* An SVG outline rather than a CSS border, so the dashes can march while a file hovers. */}
                <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                    <rect
                        x="0.5" y="0.5" rx="24" fill="none" strokeWidth="1" strokeDasharray="6 7"
                        style={{ width: 'calc(100% - 1px)', height: 'calc(100% - 1px)' }}
                        className={cn('transition-[stroke] duration-300', over ? 'stroke-[#FF4800] animate-[dash_0.6s_linear_infinite]' : 'stroke-white/15 group-hover:stroke-white/30')}
                    />
                </svg>
                <span
                    className={cn(
                        'grid size-12 place-items-center rounded-full ring-1 transition-all duration-500',
                        over ? 'rotate-90 scale-110 bg-[#FF4800] text-white ring-[#FF4800]' : 'text-zinc-400 ring-white/15 group-hover:rotate-90 group-hover:text-zinc-100 group-hover:ring-white/30',
                        busy && 'animate-pulse',
                    )}
                >
                    <Plus size={18} strokeWidth={1.5} />
                </span>
                <span className="text-[14px] text-zinc-300">{over ? 'Let go to build your deck' : 'Drop your SVG logo, or click to browse'}</span>
            </button>

            <div className="mt-4 min-h-5 text-center text-[12px]">
                {error ? (
                    <motion.span key={error} initial={{ opacity: 0 }} animate={{ opacity: 1, x: [0, -5, 5, -3, 3, 0] }} transition={{ duration: 0.4 }} className="inline-block text-[#FF4800]">
                        {error}
                    </motion.span>
                ) : hint}
            </div>
        </div>
    )
}

/** Reads a dropped file as SVG text, or explains why it can't be used. */
export async function readSvgFile(file: File): Promise<{ text: string } | { error: string }> {
    if (file.type !== 'image/svg+xml' && !/\.svg$/i.test(file.name)) {
        return { error: 'That’s not an SVG. Export your logo as .svg and drop it again.' }
    }
    return { text: await file.text() }
}
