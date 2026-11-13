"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, Reorder } from 'motion/react'
import { Plus } from 'lucide-react'
import type { Brand } from '@/lib/brand'
import { Page, PageTemplate, pageLabel } from '@/lib/deck'
import { cn } from '@/lib/utils'
import { AddMenu } from './AddMenu'
import { Slide } from './Slide'

interface PageRailProps {
    brand: Brand
    pages: Page[]
    activeId: string | null
    onSelect: (id: string) => void
    onReorder: (ids: string[]) => void
    onAdd: (template: PageTemplate) => void
}

/** The deck at a glance: live thumbnails you click to jump to and drag to
 *  reorder. Hidden on narrow screens, where the deck itself is the list. */
export function PageRail({ brand, pages, activeId, onSelect, onReorder, onAdd }: PageRailProps) {
    const [adding, setAdding] = useState(false)
    const closeAdd = useCallback(() => setAdding(false), [])
    const listRef = useRef<HTMLDivElement>(null)
    // A drag ends with a click on the same element — don't treat it as one.
    const dragged = useRef(false)

    // Keep the active thumbnail in sight as the deck scrolls.
    useEffect(() => {
        if (!activeId) return
        listRef.current?.querySelector(`[data-thumb="${activeId}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, [activeId])

    return (
        <nav aria-label="Pages" className="hidden lg:flex flex-col absolute left-0 top-0 bottom-0 w-36 z-20 pointer-events-none">
            <div ref={listRef} className="hidden-scrollbar flex-1 min-h-0 overflow-y-auto pl-6 pr-3 pt-8 pb-40 pointer-events-auto">
                <Reorder.Group axis="y" values={pages.map((p) => p.id)} onReorder={onReorder} layoutScroll className="flex flex-col gap-2.5">
                    {pages.map((page, i) => {
                        const active = page.id === activeId
                        return (
                            <Reorder.Item
                                key={page.id}
                                value={page.id}
                                data-thumb={page.id}
                                onDragStart={() => { dragged.current = true }}
                                onDragEnd={() => { requestAnimationFrame(() => { dragged.current = false }) }}
                                whileDrag={{ scale: 1.06, zIndex: 10, cursor: 'grabbing' }}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                className="group/thumb relative flex items-center gap-2 cursor-grab"
                            >
                                <span className={cn('w-4 text-right text-[10px] tabular-nums transition-colors duration-300', active ? 'text-zinc-200' : 'text-zinc-700')}>
                                    {i + 1}
                                </span>
                                <button
                                    type="button"
                                    aria-label={`Go to page ${i + 1}, ${pageLabel(page)}`}
                                    aria-current={active || undefined}
                                    onClick={() => { if (!dragged.current) onSelect(page.id) }}
                                    className={cn(
                                        'block w-[84px] rounded-[5px] overflow-hidden ring-1 transition-all duration-300 pointer-events-auto',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                                        active
                                            ? 'ring-[1.5px] ring-[#FF4800] opacity-100 scale-100'
                                            : 'ring-white/10 opacity-55 scale-[0.94] group-hover/thumb:opacity-100 group-hover/thumb:scale-100',
                                    )}
                                >
                                    <span className="block pointer-events-none">
                                        <Slide page={page} brand={brand} index={i} mode="thumb" />
                                    </span>
                                </button>
                            </Reorder.Item>
                        )
                    })}
                </Reorder.Group>

                <div className="relative mt-3 ml-6">
                    <button
                        type="button"
                        aria-label="Add a page"
                        aria-expanded={adding}
                        onClick={() => setAdding((v) => !v)}
                        className="grid place-items-center w-[84px] aspect-video rounded-[5px] text-zinc-600 ring-1 ring-dashed ring-white/10 hover:text-zinc-200 hover:ring-white/25 active:scale-95 transition-all duration-200"
                    >
                        <Plus size={14} className={cn('transition-transform duration-300', adding && 'rotate-45')} />
                    </button>
                </div>
            </div>
            <AnimatePresence>
                {adding && (
                    <AddMenu
                        className="absolute left-32 bottom-36 origin-bottom-left pointer-events-auto"
                        onClose={closeAdd}
                        onPick={(t) => {
                            setAdding(false)
                            onAdd(t)
                        }}
                    />
                )}
            </AnimatePresence>
        </nav>
    )
}
