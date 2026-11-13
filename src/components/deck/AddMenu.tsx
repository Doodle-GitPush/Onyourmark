"use client"

import React from 'react'
import { motion } from 'motion/react'
import { AlignLeft, Box, Hexagon, LayoutGrid, Palette, PanelTop, Scan, Sparkles, Type, Waves } from 'lucide-react'
import { PageTemplate, TEMPLATES } from '@/lib/deck'
import { cn } from '@/lib/utils'
import { SPRING, useDismiss } from './ui'

const ICONS: Record<PageTemplate, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
    cover: PanelTop,
    logo: Hexagon,
    variations: LayoutGrid,
    clearspace: Scan,
    palette: Palette,
    type: Type,
    motion: Waves,
    three: Box,
    story: Sparkles,
    text: AlignLeft,
}

interface AddMenuProps {
    onPick: (template: PageTemplate) => void
    onClose: () => void
    className?: string
}

/** The "what kind of page?" popover. */
export function AddMenu({ onPick, onClose, className }: AddMenuProps) {
    const ref = useDismiss<HTMLDivElement>(true, onClose)
    return (
        <motion.div
            ref={ref}
            role="menu"
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.12 } }}
            transition={SPRING}
            className={cn(
                'z-40 w-[340px] grid grid-cols-2 gap-0.5 p-1.5 rounded-2xl bg-[#141416]',
                'ring-1 ring-white/[0.1]',
                className,
            )}
        >
            {TEMPLATES.map((t, i) => {
                const Icon = ICONS[t.id]
                return (
                    <motion.button
                        key={t.id}
                        role="menuitem"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.02 * i, duration: 0.25 }}
                        onClick={() => onPick(t.id)}
                        className="group flex items-center gap-3 px-2.5 py-2 rounded-xl text-left hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none transition-colors"
                    >
                        <span className="grid place-items-center size-8 shrink-0 rounded-lg bg-white/[0.05] text-zinc-400 group-hover:text-[#FF4800] group-hover:bg-[#FF4800]/10 transition-colors">
                            <Icon size={15} strokeWidth={1.6} />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-[13px] text-zinc-200">{t.label}</span>
                            <span className="block text-[11px] text-zinc-600 truncate">{t.hint}</span>
                        </span>
                    </motion.button>
                )
            })}
        </motion.div>
    )
}
