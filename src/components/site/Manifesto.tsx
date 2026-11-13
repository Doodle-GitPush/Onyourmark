"use client"

import React, { useRef } from 'react'
import { MotionValue, motion, useScroll, useTransform } from 'motion/react'

const TEXT =
    'A logo usually leaves the studio as a zip of files and a hopeful email. OnYourMark turns it into a system your client can actually see — how the mark behaves, the colours it lives in, the type it speaks with, and how it moves.'

/** Words that carry the point, picked out in the brand colour once lit. */
const ACCENT = new Set(['system', 'see'])

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
    const opacity = useTransform(progress, range, [0.14, 1])
    const clean = word.replace(/[^a-z]/gi, '').toLowerCase()
    return (
        <motion.span style={{ opacity }} className={ACCENT.has(clean) ? 'text-[#FF4800]' : undefined}>
            {word}{' '}
        </motion.span>
    )
}

/** The why, read at the pace you scroll: each word lights up in turn. */
export function Manifesto() {
    const ref = useRef<HTMLParagraphElement>(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
    const words = TEXT.split(' ')

    return (
        <section className="px-6 py-32 sm:py-44">
            <p ref={ref} className="mx-auto max-w-4xl text-[clamp(1.6rem,3.6vw,2.75rem)] font-medium leading-[1.25] tracking-[-0.025em] text-zinc-100">
                {words.map((w, i) => (
                    <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
                ))}
            </p>
        </section>
    )
}
