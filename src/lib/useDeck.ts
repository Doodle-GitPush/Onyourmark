"use client"

import { useEffect, useMemo, useReducer } from 'react'
import { Brand, BrandColor, BrandType, LogoInsight, MAX_COLORS, colorName, createBrand, uid } from './brand'
import { Page, PageTemplate, createPage, defaultDeck } from './deck'
import { isHex, mix } from './color'
import { consumeHandoff } from './justmytype'
import { PreparedSvg, prepareSvg } from './svg'

interface State {
    hydrated: boolean
    brand: Brand | null
    pages: Page[]
    /** A pairing handed over from JustMyType before any logo exists. */
    pendingType: BrandType | null
}

type Action =
    | { type: 'hydrate'; brand: Brand | null; pages: Page[]; pendingType: BrandType | null }
    | { type: 'logo'; prepared: PreparedSvg; fileName: string }
    | { type: 'reset' }
    | { type: 'brand'; patch: Partial<Brand> }
    | { type: 'insight'; insight: LogoInsight }
    | { type: 'color'; id: string; patch: Partial<BrandColor> }
    | { type: 'addColor' }
    | { type: 'removeColor'; id: string }
    | { type: 'addPage'; template: PageTemplate; index: number; id: string }
    | { type: 'insertPage'; page: Page; index: number }
    | { type: 'removePage'; id: string }
    | { type: 'duplicatePage'; id: string; newId: string }
    | { type: 'movePage'; id: string; by: number }
    | { type: 'reorder'; ids: string[] }
    | { type: 'page'; id: string; patch: Partial<Page> }

function reducer(state: State, action: Action): State {
    if (action.type === 'hydrate') {
        return { hydrated: true, brand: action.brand, pages: action.pages, pendingType: action.pendingType }
    }
    if (action.type === 'reset') return { ...state, brand: null, pages: [] }

    if (action.type === 'logo') {
        const logo = { svg: action.prepared.svg, fileName: action.fileName }
        // Replacing the logo keeps the deck; only a first upload builds one.
        if (state.brand) return { ...state, brand: { ...state.brand, logo, insight: undefined } }
        const brand = createBrand(logo.svg, logo.fileName, action.prepared.colors)
        if (state.pendingType) brand.type = state.pendingType
        return { ...state, brand, pages: defaultDeck(brand), pendingType: null }
    }

    const { brand, pages } = state
    if (!brand) return state

    switch (action.type) {
        case 'brand':
            return { ...state, brand: { ...brand, ...action.patch } }
        case 'insight':
            return {
                ...state,
                brand: { ...brand, insight: action.insight },
                // Story pages nobody has edited yet take the new wording.
                pages: pages.map((p) => p.kind === 'story' && p.auto
                    ? { ...p, title: action.insight.tagline, body: action.insight.meaning, traits: action.insight.personality }
                    : p),
            }
        case 'color':
            return { ...state, brand: { ...brand, colors: brand.colors.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)) } }
        case 'addColor': {
            if (brand.colors.length >= MAX_COLORS) return state
            // Tints and shades of what's there, so a new colour arrives
            // already belonging to the palette.
            const primary = brand.colors[0].hex
            const accent = brand.colors[1]?.hex ?? primary
            const n = brand.colors.length
            const hex = n <= 2 ? mix(primary, '#FFFFFF', 0.82) : n === 3 ? mix(accent, '#FFFFFF', 0.7) : n === 4 ? mix(primary, '#0A0A0A', 0.6) : '#E7E5E4'
            return { ...state, brand: { ...brand, colors: [...brand.colors, { id: uid(), name: colorName(brand.colors.length), hex }] } }
        }
        case 'removeColor':
            if (brand.colors.length <= 1) return state
            return { ...state, brand: { ...brand, colors: brand.colors.filter((c) => c.id !== action.id) } }
        case 'addPage': {
            const page = { ...createPage(action.template, brand), id: action.id }
            return { ...state, pages: [...pages.slice(0, action.index), page, ...pages.slice(action.index)] }
        }
        case 'insertPage':
            return { ...state, pages: [...pages.slice(0, action.index), action.page, ...pages.slice(action.index)] }
        case 'removePage':
            return { ...state, pages: pages.filter((p) => p.id !== action.id) }
        case 'duplicatePage': {
            const i = pages.findIndex((p) => p.id === action.id)
            if (i === -1) return state
            return { ...state, pages: [...pages.slice(0, i + 1), { ...pages[i], id: action.newId }, ...pages.slice(i + 1)] }
        }
        case 'movePage': {
            const i = pages.findIndex((p) => p.id === action.id)
            const j = i + action.by
            if (i === -1 || j < 0 || j >= pages.length) return state
            const next = [...pages]
            next.splice(j, 0, next.splice(i, 1)[0])
            return { ...state, pages: next }
        }
        case 'reorder': {
            const byId = new Map(pages.map((p) => [p.id, p]))
            const next = action.ids.map((id) => byId.get(id)).filter((p): p is Page => !!p)
            return next.length === pages.length ? { ...state, pages: next } : state
        }
        case 'page':
            return { ...state, pages: pages.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)) }
    }
}

const STORAGE_KEY = 'onyourmark:deck:v2'
const V1_KEY = 'onyourmark:brand:v1'

function readSaved(): { brand: Brand | null; pages: Page[] } {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
            const saved = JSON.parse(raw)
            if (saved?.brand?.logo?.svg && Array.isArray(saved.brand.colors) && Array.isArray(saved.pages)) {
                return { brand: saved.brand, pages: saved.pages }
            }
        }

        // The pre-deck format: one logo, two colours, maybe a pairing.
        const v1 = JSON.parse(localStorage.getItem(V1_KEY) ?? 'null')
        const prepared = v1?.logo?.svg ? prepareSvg(v1.logo.svg) : null
        if (prepared) {
            const brand = createBrand(prepared.svg, v1.logo.fileName ?? 'logo.svg', [])
            const old = [v1.colors?.primary, v1.colors?.secondary]
            brand.colors = brand.colors.map((c, i) => (typeof old[i] === 'string' && isHex(old[i]) ? { ...c, hex: old[i] } : c))
            if (v1.type) brand.type = v1.type
            if (v1.insight) brand.insight = v1.insight
            return { brand, pages: defaultDeck(brand) }
        }
    } catch {
        // blocked storage or a corrupt save — start fresh
    }
    return { brand: null, pages: [] }
}

export function useDeck() {
    const [state, dispatch] = useReducer(reducer, { hydrated: false, brand: null, pages: [], pendingType: null })

    // Restore after mount (localStorage isn't there during SSR). A pairing
    // handed over from JustMyType wins over the saved one.
    useEffect(() => {
        const saved = readSaved()
        const handoff = consumeHandoff()
        if (handoff && saved.brand) saved.brand = { ...saved.brand, type: handoff }
        dispatch({ type: 'hydrate', ...saved, pendingType: saved.brand ? null : handoff })
    }, [])

    useEffect(() => {
        // Not before the restore above — the empty initial state would overwrite it.
        if (!state.hydrated) return
        try {
            if (state.brand) localStorage.setItem(STORAGE_KEY, JSON.stringify({ brand: state.brand, pages: state.pages }))
            else localStorage.removeItem(STORAGE_KEY)
            localStorage.removeItem(V1_KEY)
        } catch {
            // A full quota or private window just means no restore next time.
        }
    }, [state.hydrated, state.brand, state.pages])

    const actions = useMemo(() => ({
        setLogo: (prepared: PreparedSvg, fileName: string) => dispatch({ type: 'logo', prepared, fileName }),
        reset: () => dispatch({ type: 'reset' }),
        patchBrand: (patch: Partial<Brand>) => dispatch({ type: 'brand', patch }),
        setInsight: (insight: LogoInsight) => dispatch({ type: 'insight', insight }),
        patchColor: (id: string, patch: Partial<BrandColor>) => dispatch({ type: 'color', id, patch }),
        addColor: () => dispatch({ type: 'addColor' }),
        removeColor: (id: string) => dispatch({ type: 'removeColor', id }),
        /** Returns the new page's id so the caller can scroll to it. */
        addPage: (template: PageTemplate, index: number) => {
            const id = uid()
            dispatch({ type: 'addPage', template, index, id })
            return id
        },
        insertPage: (page: Page, index: number) => dispatch({ type: 'insertPage', page, index }),
        removePage: (id: string) => dispatch({ type: 'removePage', id }),
        duplicatePage: (id: string) => {
            const newId = uid()
            dispatch({ type: 'duplicatePage', id, newId })
            return newId
        },
        movePage: (id: string, by: number) => dispatch({ type: 'movePage', id, by }),
        reorder: (ids: string[]) => dispatch({ type: 'reorder', ids }),
        patchPage: (id: string, patch: Partial<Page>) => dispatch({ type: 'page', id, patch }),
    }), [])

    return { ...state, actions }
}

export type DeckActions = ReturnType<typeof useDeck>['actions']

/** The name of the deck saved in this browser, if there is one. */
export function savedDeckName(): string | null {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
        return typeof saved?.brand?.name === 'string' ? saved.brand.name : null
    } catch {
        return null
    }
}

/** Saves a fresh deck for a logo dropped outside the studio, so the studio
 *  opens straight onto it. False if the browser won't store it. */
export function startNewDeck(prepared: PreparedSvg, fileName: string): boolean {
    const brand = createBrand(prepared.svg, fileName, prepared.colors)
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ brand, pages: defaultDeck(brand) }))
        return true
    } catch {
        return false
    }
}
