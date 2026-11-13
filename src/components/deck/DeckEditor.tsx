"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { ArrowDown, ArrowUp, Box, Contrast, Copy, Palette, Plus, Sparkles, Trash2, Type } from 'lucide-react'
import { BG_INK, BG_MOTION, BG_PAPER, Bg, Brand, accentOf, primaryOf } from '@/lib/brand'
import { INK, PAPER } from '@/lib/color'
import { Page, PageTemplate, allowsMotion, hasBg, isPresentable, pageLabel } from '@/lib/deck'
import type { DeckActions } from '@/lib/useDeck'
import { cn } from '@/lib/utils'
import { AddMenu } from './AddMenu'
import { Slide } from './Slide'
import { EASE, IconButton } from './ui'

export type Panel = 'logo' | 'colors' | 'type' | 'motion'

export const pageDomId = (id: string) => `page-${id}`

export function scrollToPage(id: string) {
    document.getElementById(pageDomId(id))?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

interface DeckEditorProps {
    brand: Brand
    pages: Page[]
    deck: DeckActions
    /** The page nearest the middle of the view. */
    activeId: string | null
    onActive: (id: string) => void
    onOpen: (target: Panel | 'studio') => void
    onRemove: (page: Page) => void
    onAdd: (template: PageTemplate, index: number) => void
    onRewrite: () => void
    rewriting: boolean
}

/** Background choices for a page: the palette, white, black, and — where
 *  it makes sense — the brand's moving background. */
function BgDots({ brand, page, onPick }: { brand: Brand; page: Page; onPick: (bg: Bg) => void }) {
    const options: { id: Bg; label: string; style: React.CSSProperties; motion?: boolean }[] = [
        ...brand.colors.map((c) => ({ id: c.id, label: c.name, style: { background: c.hex } })),
        { id: BG_PAPER, label: 'White', style: { background: PAPER } },
        { id: BG_INK, label: 'Black', style: { background: INK } },
    ]
    if (allowsMotion(page.kind)) {
        options.push({
            id: BG_MOTION,
            label: 'Motion',
            style: {},
            motion: true,
        })
    }
    // A reference to a since-removed colour renders as the primary.
    const current = options.some((o) => o.id === page.bg) ? page.bg : brand.colors[0]?.id
    return (
        <div className="flex items-center gap-1.5 px-1" role="radiogroup" aria-label="Background">
            {options.map((o) => (
                <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={o.id === current}
                    aria-label={`${o.label} background`}
                    title={o.label}
                    onClick={() => onPick(o.id)}
                    className={cn(
                        'size-4 rounded-full ring-1 ring-white/20 transition-transform duration-200 hover:scale-125 active:scale-95',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                        o.id === current && 'outline outline-[1.5px] outline-offset-2 outline-[#FF4800]',
                        o.motion && 'flex overflow-hidden animate-[spin_6s_linear_infinite]',
                    )}
                    style={o.style}
                >
                    {o.motion && (
                        <>
                            <span className="h-full w-1/2" style={{ background: primaryOf(brand) }} />
                            <span className="h-full w-1/2" style={{ background: accentOf(brand) }} />
                        </>
                    )}
                </button>
            ))}
        </div>
    )
}

const Divider = () => <span className="w-px h-4 bg-white/10 mx-1" />

const TextButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
        type="button"
        className="flex items-center gap-1.5 h-7 px-2 rounded-md text-[11px] text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.07] active:scale-95 transition-[color,background-color,transform] duration-150 disabled:opacity-40"
        {...props}
    >
        {children}
    </button>
)

interface BlockProps extends Omit<DeckEditorProps, 'pages' | 'activeId' | 'onActive' | 'onAdd'> {
    page: Page
    index: number
    count: number
    isActive: boolean
    scrollRoot: React.RefObject<HTMLDivElement | null>
}

function SlideBlock({ page, index, count, brand, deck, isActive, scrollRoot, onOpen, onRemove, onRewrite, rewriting }: BlockProps) {
    const ref = useRef<HTMLDivElement>(null)
    // Shaders and 3D run only while the slide is on screen; its entrance
    // plays the first time it arrives and then stays put.
    const inView = useInView(ref, { root: scrollRoot, amount: 0.25 })
    const seen = useInView(ref, { root: scrollRoot, amount: 0.25, once: true })
    const presentable = isPresentable(page, brand)
    const patch = useCallback((p: Partial<Page>) => deck.patchPage(page.id, p), [deck, page.id])

    return (
        <div id={pageDomId(page.id)} className="group/block scroll-mt-24">
            <div className="flex items-center justify-between gap-2 h-10 pl-1">
                <div className="flex items-center gap-2.5 shrink-0 text-[11px] tracking-wide">
                    <span className="tabular-nums text-zinc-600">{String(index + 1).padStart(2, '0')}</span>
                    <span className={cn('transition-colors duration-300', isActive ? 'text-zinc-200' : 'text-zinc-500')}>{pageLabel(page)}</span>
                    {!presentable && <span className="text-zinc-600">— left out of the deck until it has fonts</span>}
                </div>

                <div
                    className={cn(
                        // Scrolls sideways rather than clipping on a narrow screen.
                        'hidden-scrollbar flex items-center min-w-0 overflow-x-auto py-1 transition-opacity duration-200',
                        isActive ? 'opacity-100' : 'opacity-0 group-hover/block:opacity-100 focus-within:opacity-100',
                    )}
                >
                    {hasBg(page.kind) && <BgDots brand={brand} page={page} onPick={(bg) => patch({ bg })} />}

                    {(page.kind === 'logo' || page.kind === 'cover' || page.kind === 'clearspace') && (
                        <>
                            <Divider />
                            <IconButton
                                label={page.logoMode === 'original' ? 'Logo: original colours — switch to one colour' : 'Logo: one colour — switch to original colours'}
                                onClick={() => patch({ logoMode: page.logoMode === 'original' ? 'mono' : 'original' })}
                                className={page.logoMode === 'original' ? 'text-[#FF4800] hover:text-[#FF4800]' : undefined}
                            >
                                <Contrast size={14} />
                            </IconButton>
                        </>
                    )}
                    {page.kind === 'logo' && (
                        <input
                            type="range"
                            aria-label="Logo size"
                            title="Logo size"
                            min={10}
                            max={70}
                            value={page.logoSize ?? 30}
                            onChange={(e) => patch({ logoSize: Number(e.target.value) })}
                            className="thin-range w-16 mx-1.5 hidden sm:block"
                        />
                    )}
                    {page.kind === 'story' && (
                        <>
                            <Divider />
                            <TextButton onClick={onRewrite} disabled={rewriting}>
                                <Sparkles size={12} className={rewriting ? 'animate-pulse' : undefined} />
                                {rewriting ? 'Writing…' : 'Write with AI'}
                            </TextButton>
                        </>
                    )}
                    {page.kind === 'palette' && <TextButton onClick={() => onOpen('colors')}><Palette size={12} />Edit colours</TextButton>}
                    {page.kind === 'type' && <TextButton onClick={() => onOpen('type')}><Type size={12} />{brand.type ? 'Change fonts' : 'Choose fonts'}</TextButton>}
                    {page.kind === 'three' && <TextButton onClick={() => onOpen('studio')}><Box size={12} />Open 3D studio</TextButton>}
                    {page.bg === BG_MOTION && allowsMotion(page.kind) && <TextButton onClick={() => onOpen('motion')}>Motion</TextButton>}

                    <Divider />
                    <IconButton label="Move up" disabled={index === 0} onClick={() => deck.movePage(page.id, -1)}><ArrowUp size={14} /></IconButton>
                    <IconButton label="Move down" disabled={index === count - 1} onClick={() => deck.movePage(page.id, 1)}><ArrowDown size={14} /></IconButton>
                    <IconButton label="Duplicate page" onClick={() => deck.duplicatePage(page.id)}><Copy size={13} /></IconButton>
                    <IconButton label="Remove page" onClick={() => onRemove(page)} className="hover:text-red-400 hover:bg-red-500/10"><Trash2 size={13} /></IconButton>
                </div>
            </div>

            <div
                ref={ref}
                className={cn(
                    'rounded-xl overflow-hidden ring-1 transition-[--tw-ring-color] duration-500',
                    isActive ? 'ring-white/25' : 'ring-white/[0.06]',
                )}
            >
                <Slide
                    page={page}
                    brand={brand}
                    index={index}
                    mode="edit"
                    active={inView}
                    entered={seen}
                    busy={rewriting && page.kind === 'story' && !!page.auto}
                    onPage={patch}
                    onBrand={deck.patchBrand}
                    onOpen={onOpen}
                />
            </div>
        </div>
    )
}

/** The gap between two pages — a "+" that appears when you reach for it. */
function Inserter({ onAdd, always }: { onAdd: (template: PageTemplate) => void; always?: boolean }) {
    const [open, setOpen] = useState(false)
    const close = useCallback(() => setOpen(false), [])
    return (
        <div className={cn('group/ins relative flex items-center justify-center', always ? 'h-24' : 'h-8')}>
            {!always && (
                <span className={cn('absolute inset-x-0 h-px transition-colors duration-200', open ? 'bg-white/15' : 'bg-transparent group-hover/ins:bg-white/10')} />
            )}
            <button
                type="button"
                aria-label="Add a page here"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    'relative flex items-center gap-2 rounded-full transition-all duration-200 active:scale-90',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:opacity-100',
                    always
                        ? 'h-10 px-5 text-[13px] text-zinc-400 ring-1 ring-white/10 hover:ring-white/25 hover:text-zinc-100'
                        : 'size-6 justify-center bg-[#0A0A0A] text-zinc-400 ring-1 ring-white/15 hover:text-zinc-100 hover:ring-white/30 hover:scale-110',
                    !always && !open && 'opacity-40 lg:opacity-0 group-hover/ins:opacity-100',
                )}
            >
                <Plus size={always ? 15 : 13} className={cn('transition-transform duration-300', open && 'rotate-45')} />
                {always && 'Add a page'}
            </button>
            <AnimatePresence>
                {open && (
                    <AddMenu
                        className={cn('absolute left-1/2 -translate-x-1/2 origin-top', always ? 'bottom-[calc(100%-1rem)] origin-bottom' : 'top-[calc(100%-0.25rem)]')}
                        onClose={close}
                        onPick={(t) => {
                            setOpen(false)
                            onAdd(t)
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

/** The deck itself: every page stacked in one scrolling column. */
export function DeckEditor({ brand, pages, deck, activeId, onActive, onAdd, ...rest }: DeckEditorProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    // The page nearest the middle of the viewport is the "active" one —
    // it gets the toolbar and lights up in the rail.
    const track = useCallback(() => {
        const root = scrollRef.current
        if (!root) return
        const rect = root.getBoundingClientRect()
        const mid = rect.top + rect.height * 0.45
        let best: string | null = null
        let bestDist = Infinity
        for (const el of root.querySelectorAll<HTMLElement>('[id^="page-"]')) {
            const r = el.getBoundingClientRect()
            const d = Math.abs(r.top + r.height / 2 - mid)
            if (d < bestDist) {
                bestDist = d
                best = el.id.slice(5)
            }
        }
        if (best) onActive(best)
    }, [onActive])

    useEffect(() => {
        const root = scrollRef.current
        if (!root) return
        let raf = 0
        const onScroll = () => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(track)
        }
        onScroll()
        root.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onScroll)
        return () => {
            cancelAnimationFrame(raf)
            root.removeEventListener('scroll', onScroll)
            window.removeEventListener('resize', onScroll)
        }
    }, [track, pages.length])

    return (
        <motion.div ref={scrollRef} layoutScroll className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <div className="mx-auto w-full max-w-[1200px] px-5 lg:px-40 pt-6 pb-56">
                <AnimatePresence initial={false}>
                    {pages.map((page, i) => (
                        <motion.div
                            key={page.id}
                            layout="position"
                            initial={{ opacity: 0, y: 40, scale: 0.97 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true, root: scrollRef, amount: 0.12 }}
                            exit={{ opacity: 0, height: 0, scale: 0.96, transition: { duration: 0.35, ease: EASE } }}
                            transition={{ duration: 0.7, ease: EASE, layout: { duration: 0.45, ease: EASE } }}
                            className="origin-top"
                        >
                            <Inserter onAdd={(t) => onAdd(t, i)} />
                            <SlideBlock
                                page={page}
                                index={i}
                                count={pages.length}
                                brand={brand}
                                deck={deck}
                                isActive={page.id === activeId}
                                scrollRoot={scrollRef}
                                {...rest}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
                <Inserter always onAdd={(t) => onAdd(t, pages.length)} />
            </div>
        </motion.div>
    )
}
