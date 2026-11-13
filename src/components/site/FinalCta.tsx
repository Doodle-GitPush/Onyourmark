"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Dropzone, readSvgFile } from '@/components/Dropzone'
import { EASE } from '@/components/deck/ui'
import { PreparedSvg, prepareSvg } from '@/lib/svg'
import { savedDeckName, startNewDeck } from '@/lib/useDeck'

/** The close: drop a logo here and land in the studio with the deck built.
 *  A deck already saved in this browser is never replaced without asking. */
export function FinalCta() {
    const router = useRouter()
    const [confirm, setConfirm] = useState<{ prepared: PreparedSvg; fileName: string; existing: string } | null>(null)

    const begin = (prepared: PreparedSvg, fileName: string) => {
        // Even if the browser won't store it, the studio is where to go next.
        startNewDeck(prepared, fileName)
        router.push('/studio')
    }

    const onFile = async (file: File) => {
        const read = await readSvgFile(file)
        if ('error' in read) return read.error
        const prepared = prepareSvg(read.text)
        if (!prepared) return 'That file couldn’t be read as an SVG — try exporting it again.'
        const existing = savedDeckName()
        if (existing) {
            setConfirm({ prepared, fileName: file.name, existing })
            return null
        }
        begin(prepared, file.name)
        return null
    }

    return (
        <section className="relative overflow-hidden px-6 py-32 sm:py-40">
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,72,0,0.14),transparent)] blur-2xl" />
            <div className="relative mx-auto max-w-2xl text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.8, ease: EASE }}
                    className="text-[clamp(2.2rem,5.4vw,4.25rem)] font-medium leading-[1.02] tracking-[-0.04em] text-zinc-50"
                >
                    Your next presentation starts with one file.
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
                    className="mt-5 text-[16px] text-zinc-400"
                >
                    Drop your logo here and you’ll land in the studio with the deck already built.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
                    className="mx-auto mt-12 max-w-md"
                >
                    <AnimatePresence mode="wait" initial={false}>
                        {confirm ? (
                            <motion.div
                                key="confirm"
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                transition={{ duration: 0.3, ease: EASE }}
                                className="rounded-3xl bg-white/[0.03] px-8 py-10 ring-1 ring-white/10"
                            >
                                <p className="text-[15px] text-zinc-200">You already have a deck for <span className="text-zinc-50">{confirm.existing}</span>.</p>
                                <p className="mt-1.5 text-[13px] text-zinc-500">Starting a new one replaces it.</p>
                                <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => begin(confirm.prepared, confirm.fileName)}
                                        className="h-10 rounded-full bg-zinc-100 px-5 text-[13px] font-medium text-zinc-900 transition-all hover:bg-white active:scale-95"
                                    >
                                        Replace it with {confirm.fileName.replace(/\.svg$/i, '')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/studio')}
                                        className="h-10 rounded-full px-5 text-[13px] text-zinc-300 ring-1 ring-white/10 transition-all hover:bg-white/[0.04] active:scale-95"
                                    >
                                        Keep {confirm.existing}
                                    </button>
                                </div>
                                <button type="button" onClick={() => setConfirm(null)} className="mt-5 text-[12px] text-zinc-600 transition-colors hover:text-zinc-300">Cancel</button>
                            </motion.div>
                        ) : (
                            <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <Dropzone onFile={onFile} hint={<span className="text-zinc-600">SVG only · saved in your browser · no account</span>} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    )
}
