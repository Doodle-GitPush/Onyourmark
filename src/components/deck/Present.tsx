"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { Brand } from '@/lib/brand'
import type { Page } from '@/lib/deck'
import { Slide } from './Slide'
import { EASE, IconButton } from './ui'

interface PresentProps {
    brand: Brand
    pages: Page[]
    startIndex: number
    onClose: () => void
}

/** Full-screen playback: one slide at a time, arrow keys or a click to
 *  advance, Escape to leave. Shaders and the 3D mark run live here. */
export function Present({ brand, pages, startIndex, onClose }: PresentProps) {
    const [index, setIndex] = useState(() => Math.min(Math.max(startIndex, 0), pages.length - 1))
    const [dir, setDir] = useState(1)
    // Mounted a frame before it's marked active, so entrances play on every slide.
    const [entered, setEntered] = useState(-1)
    const rootRef = useRef<HTMLDivElement>(null)

    const go = useCallback((by: number) => {
        setDir(by)
        setIndex((i) => Math.min(pages.length - 1, Math.max(0, i + by)))
    }, [pages.length])

    useEffect(() => {
        const id = requestAnimationFrame(() => setEntered(index))
        return () => cancelAnimationFrame(id)
    }, [index])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
            else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(1) }
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); go(-1) }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [go, onClose])

    // Real fullscreen where the browser allows it; the overlay alone otherwise.
    useEffect(() => {
        const el = rootRef.current
        el?.requestFullscreen?.().catch(() => {})
        const onChange = () => { if (!document.fullscreenElement) onClose() }
        document.addEventListener('fullscreenchange', onChange)
        return () => {
            document.removeEventListener('fullscreenchange', onChange)
            if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
        }
    }, [onClose])

    const page = pages[index]

    return (
        <motion.div
            ref={rootRef}
            role="dialog"
            aria-label="Presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="group/present fixed inset-0 z-50 bg-black grid place-items-center overflow-hidden"
        >
            <div className="relative w-[min(100vw,calc(100vh*16/9))]">
                <AnimatePresence mode="popLayout" custom={dir} initial={false}>
                    <motion.div
                        key={page.id}
                        custom={dir}
                        variants={{
                            enter: (d: number) => ({ opacity: 0, x: d * 60, scale: 0.985 }),
                            center: { opacity: 1, x: 0, scale: 1 },
                            exit: (d: number) => ({ opacity: 0, x: d * -60, scale: 0.985 }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.45, ease: EASE }}
                    >
                        <Slide page={page} brand={brand} index={index} mode="present" active={entered === index} />
                    </motion.div>
                </AnimatePresence>

                {/* Click the right two-thirds to advance, the left third to go back
                    — except on the 3D page, where the pointer orbits the object. */}
                {page.kind !== 'three' && (
                    <>
                        <button type="button" aria-label="Previous slide" onClick={() => go(-1)} className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize focus:outline-none" />
                        <button type="button" aria-label="Next slide" onClick={() => go(1)} className="absolute inset-y-0 right-0 w-2/3 cursor-e-resize focus:outline-none" />
                    </>
                )}
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-[#141416] ring-1 ring-white/10 p-1 opacity-0 group-hover/present:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
                <IconButton label="Previous slide" disabled={index === 0} onClick={() => go(-1)} className="rounded-full text-zinc-300"><ChevronLeft size={16} /></IconButton>
                <span className="px-1 text-[11px] tabular-nums text-zinc-400">{index + 1} / {pages.length}</span>
                <IconButton label="Next slide" disabled={index === pages.length - 1} onClick={() => go(1)} className="rounded-full text-zinc-300"><ChevronRight size={16} /></IconButton>
                <IconButton label="Exit presentation" onClick={onClose} className="rounded-full text-zinc-300"><X size={15} /></IconButton>
            </div>

            <div className="absolute bottom-0 inset-x-0 h-[2px] bg-white/10">
                <motion.div
                    className="h-full origin-left bg-white/70"
                    animate={{ scaleX: (index + 1) / pages.length }}
                    transition={{ duration: 0.45, ease: EASE }}
                />
            </div>
        </motion.div>
    )
}
