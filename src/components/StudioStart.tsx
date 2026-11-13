"use client"

import React from 'react'
import { motion } from 'motion/react'
import type { BrandType } from '@/lib/brand'
import { Dropzone } from '@/components/Dropzone'
import { EASE } from '@/components/deck/ui'

interface StudioStartProps {
    onFile: (file: File) => Promise<string | null>
    onSample: () => void
    /** A pairing already handed over from JustMyType. */
    pendingType: BrandType | null
}

/** The studio with no deck yet: one job — bring a logo. */
export function StudioStart({ onFile, onSample, pendingType }: StudioStartProps) {
    return (
        <main className="flex-1 min-h-0 overflow-y-auto">
            <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-6 pb-24 text-center">
                <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: EASE }}
                    className="text-[28px] font-medium tracking-[-0.02em] text-zinc-100"
                >
                    Start with your logo
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
                    className="mt-3 text-[14px] leading-relaxed text-zinc-500"
                >
                    Any SVG export from Illustrator, Figma or Affinity. Your deck is built in a second and saved in this browser.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, ease: EASE, delay: 0.16 }}
                    className="mt-10 w-full"
                >
                    <Dropzone
                        onFile={onFile}
                        hint={pendingType ? (
                            <span className="text-zinc-400">{pendingType.heading.family} + {pendingType.body.family} is ready — add your logo to continue.</span>
                        ) : (
                            <button type="button" onClick={onSample} className="text-zinc-600 underline decoration-zinc-800 underline-offset-4 transition-colors hover:text-zinc-300 hover:decoration-zinc-600">
                                No file to hand? Try it with a sample logo
                            </button>
                        )}
                    />
                </motion.div>
            </div>
        </main>
    )
}
