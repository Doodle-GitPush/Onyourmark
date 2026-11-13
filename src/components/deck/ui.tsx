"use client"

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/** Small square icon button used across the deck chrome. */
export function IconButton({ label, className, children, ...props }: { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className={cn(
                'grid place-items-center size-7 rounded-md text-zinc-500 transition-[color,background-color,transform] duration-150',
                'hover:text-zinc-100 hover:bg-white/[0.07] active:scale-90 disabled:opacity-25 disabled:pointer-events-none',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40',
                className,
            )}
            {...props}
        >
            {children}
        </button>
    )
}

/** Calls `onDismiss` on Escape or a press outside the returned ref. */
export function useDismiss<T extends HTMLElement>(open: boolean, onDismiss: () => void) {
    const ref = useRef<T>(null)
    useEffect(() => {
        if (!open) return
        const onDown = (e: PointerEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onDismiss()
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onDismiss()
        }
        document.addEventListener('pointerdown', onDown)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('pointerdown', onDown)
            document.removeEventListener('keydown', onKey)
        }
    }, [open, onDismiss])
    return ref
}

/** The house spring — quick, with just enough overshoot to feel alive. */
export const SPRING = { type: 'spring', stiffness: 420, damping: 32, mass: 0.8 } as const
export const EASE = [0.2, 0.7, 0.2, 1] as const
