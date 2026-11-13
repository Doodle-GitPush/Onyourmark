"use client"

import { useEffect, useState } from 'react'
import { Brand, MotionPreset, createBrand } from '@/lib/brand'
import { Page, PageTemplate, createPage } from '@/lib/deck'
import { PAIRINGS } from '@/lib/fonts'
import { SAMPLE_SVG } from '@/lib/svg'

/** Palettes the site's demos cycle through — each a primary and an accent. */
export const PALETTES = [
    { name: 'Ember', colors: ['#FF4800', '#1B1B3A'] },
    { name: 'Grove', colors: ['#0B7A75', '#F2A900'] },
    { name: 'Iris', colors: ['#6D28D9', '#F472B6'] },
    { name: 'Tide', colors: ['#0369A1', '#F97316'] },
] as const

/** The sample brand every demo on the site is drawn from, rendered with the
 *  studio's own slide component — so what the site shows is the product. */
export function demoBrand({ palette = 0, pairing = 0, motion = 'flow' as MotionPreset } = {}): Brand {
    const brand = createBrand(SAMPLE_SVG, 'Northpoint.svg', [...PALETTES[palette].colors])
    brand.type = PAIRINGS[pairing].type
    brand.motion = { preset: motion, speed: 1 }
    brand.insight = {
        brandName: 'Northpoint',
        tagline: 'Find your bearing.',
        meaning: 'A circle that opens to the north-east — a compass rose reduced to two shapes. Steady, direct, and always pointing somewhere.',
        personality: ['Direct', 'Calm', 'Curious', 'Precise'],
        colorStory: '',
        industry: 'Travel',
    }
    return brand
}

/** A page for `brand`. Pages store colour *ids*, so a page made for one
 *  brand must be re-made, not reused, for another. */
export function demoPage(brand: Brand, template: PageTemplate, patch: Partial<Page> = {}): Page {
    return { ...createPage(template, brand), ...patch }
}

/** Every page the studio can make, in deck order. */
export const DECK_ORDER: PageTemplate[] = ['cover', 'logo', 'variations', 'clearspace', 'palette', 'type', 'motion', 'three', 'story']

/** Steps through `count` values every `ms` while `running`. */
export function useCycle(count: number, ms: number, running = true) {
    const [i, setI] = useState(0)
    useEffect(() => {
        if (!running || count < 2) return
        const id = setInterval(() => setI((v) => (v + 1) % count), ms)
        return () => clearInterval(id)
    }, [count, ms, running])
    return i
}

/** Matches a media query once mounted; null before (and during SSR). */
export function useMedia(query: string) {
    const [match, setMatch] = useState<boolean | null>(null)
    useEffect(() => {
        const mq = window.matchMedia(query)
        const update = () => setMatch(mq.matches)
        update()
        mq.addEventListener('change', update)
        return () => mq.removeEventListener('change', update)
    }, [query])
    return match
}
