import { BG_INK, BG_MOTION, BG_PAPER, Bg, Brand, uid } from './brand'

export type PageKind =
    | 'cover'
    | 'logo'
    | 'variations'
    | 'clearspace'
    | 'palette'
    | 'type'
    | 'three'
    | 'story'
    | 'text'

/** One page of a deck. Deliberately flat: every kind reads the few fields
 *  it cares about, so a patch never has to know which kind it's patching. */
export interface Page {
    id: string
    kind: PageKind
    bg?: Bg
    /** Logo pages: one flat contrasting colour, or the artwork's own. */
    logoMode?: 'mono' | 'original'
    /** Logo pages: width as a percentage of the page. */
    logoSize?: number
    title?: string
    subtitle?: string
    body?: string
    traits?: string[]
    /** Story pages: still mirroring the AI insight, not yet hand-edited. */
    auto?: boolean
}

/** What the "add page" menu offers. `motion` is a logo page on the brand's
 *  moving background rather than a kind of its own. */
export type PageTemplate = PageKind | 'motion'

export const TEMPLATES: { id: PageTemplate; label: string; hint: string }[] = [
    { id: 'cover', label: 'Cover', hint: 'Title page' },
    { id: 'logo', label: 'Logo', hint: 'The mark, large' },
    { id: 'variations', label: 'Variations', hint: 'Four colourways' },
    { id: 'clearspace', label: 'Clear space', hint: 'Margins and sizes' },
    { id: 'palette', label: 'Colours', hint: 'Palette with codes' },
    { id: 'type', label: 'Typography', hint: 'Heading and body' },
    { id: 'motion', label: 'Motion', hint: 'A live background' },
    { id: 'three', label: '3D', hint: 'As an object' },
    { id: 'story', label: 'Story', hint: 'Tagline and meaning' },
    { id: 'text', label: 'Text', hint: 'Title and paragraph' },
]

const STORY_DEFAULTS = {
    title: 'A line that says what you stand for.',
    body: 'Use this page for the idea behind the mark — what its shapes suggest, how it should feel, and why it looks the way it does.',
    traits: ['Confident', 'Clear', 'Human'],
}

export const CLEARSPACE_BODY =
    'Keep a margin of at least x — a quarter of the logo’s height — clear on every side. Nothing else sits inside it.'

export function createPage(template: PageTemplate, brand: Brand): Page {
    const id = uid()
    const primary = brand.colors[0]?.id
    switch (template) {
        case 'cover':
            return { id, kind: 'cover', bg: primary, logoMode: 'mono', subtitle: `Brand guidelines — ${new Date().getFullYear()}` }
        case 'logo':
            return { id, kind: 'logo', bg: BG_PAPER, logoMode: 'original', logoSize: 30, title: 'Primary mark' }
        case 'motion':
            return { id, kind: 'logo', bg: BG_MOTION, logoMode: 'mono', logoSize: 26, title: 'In motion' }
        case 'clearspace':
            return { id, kind: 'clearspace', bg: BG_PAPER, body: CLEARSPACE_BODY }
        case 'type':
            return { id, kind: 'type', bg: BG_PAPER }
        case 'story': {
            const insight = brand.insight
            return {
                id, kind: 'story', bg: BG_INK, auto: true,
                title: insight?.tagline ?? STORY_DEFAULTS.title,
                body: insight?.meaning ?? STORY_DEFAULTS.body,
                traits: insight?.personality?.length ? insight.personality : STORY_DEFAULTS.traits,
            }
        }
        case 'text':
            return { id, kind: 'text', bg: BG_INK, title: 'A new section', body: 'Click any text on a page to rewrite it.' }
        default:
            return { id, kind: template }
    }
}

/** The deck a fresh upload starts with — a complete first draft the user
 *  trims, rather than a blank they have to fill. */
export function defaultDeck(brand: Brand): Page[] {
    const order: PageTemplate[] = ['cover', 'logo', 'variations', 'clearspace', 'palette', 'type', 'motion', 'three', 'story']
    return order.map((t) => createPage(t, brand))
}

/** Short name for a page in the rail and above the slide. */
export function pageLabel(page: Page) {
    if (page.kind === 'logo' && page.bg === BG_MOTION) return 'Motion'
    return TEMPLATES.find((t) => t.id === page.kind)?.label ?? page.kind
}

/** Kinds whose background the user can choose. */
export const hasBg = (kind: PageKind) => kind !== 'variations' && kind !== 'palette' && kind !== 'three'

/** Kinds that can sit on the moving background. */
export const allowsMotion = (kind: PageKind) => kind === 'cover' || kind === 'logo' || kind === 'text' || kind === 'story'

/** A typography page with no pairing chosen has nothing to show an
 *  audience — it's left out of presentations and exports. */
export const isPresentable = (page: Page, brand: Brand) => page.kind !== 'type' || !!brand.type
