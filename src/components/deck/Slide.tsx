"use client"

import React, { createContext, useContext, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
    BG_MOTION, Brand, FontSpec, accentOf, featureSettings, fgFor, primaryOf, resolveBg, variationSettings,
} from '@/lib/brand'
import { INK, PAPER, alpha, cmykLabel, contrastOn, luminance, rgbLabel } from '@/lib/color'
import { Page, pageLabel } from '@/lib/deck'
import { loadFont } from '@/lib/fonts'
import { logoUrl, svgAspect } from '@/lib/svg'
import { DEFAULT_SCENE_ENV, SceneEnv } from '@/components/Logo3DViewer'
import { Editable } from './Editable'
import { ShaderCanvas, motionGradient } from './ShaderCanvas'

// three.js is most of the bundle — only fetched once a 3D page is on screen.
const Logo3DViewer = dynamic(() => import('@/components/Logo3DViewer').then((m) => m.Logo3DViewer), { ssr: false })

/** The 3D studio's live settings, so a deck's 3D page matches it. */
export const SceneEnvContext = createContext<SceneEnv>(DEFAULT_SCENE_ENV)

/**
 * - `edit`: in the deck editor — text is editable, entrances play.
 * - `present`: full screen — live, not editable; the 3D mark can be orbited.
 * - `display`: a showcase on the website — live, but hands-off, so it
 *   never captures the page's scroll.
 * - `thumb`: tiny and static — no WebGL, no transitions.
 * - `export`: static at full resolution, with one real shader/3D frame.
 */
export type SlideMode = 'edit' | 'present' | 'display' | 'thumb' | 'export'

/** Shaders and the 3D mark run in an export, and on screen in any mode but
 *  a thumbnail. */
const isLive = (mode: SlideMode, active: boolean) => mode === 'export' || (mode !== 'thumb' && active)

export interface SlideProps {
    page: Page
    brand: Brand
    /** Position in the deck, for the page number. */
    index: number
    mode: SlideMode
    /** On screen: run anything live (shaders, 3D). */
    active?: boolean
    /** Has been on screen: play the entrance. Defaults to `active`. */
    entered?: boolean
    /** The story is being rewritten by the AI. */
    busy?: boolean
    onPage?: (patch: Partial<Page>) => void
    onBrand?: (patch: Partial<Brand>) => void
    /** Jump to the control that edits what was clicked. */
    onOpen?: (panel: 'colors' | 'type' | 'studio') => void
    /** Export only: the page's WebGL content has finished drawing. */
    onReady?: () => void
}

/** Everything on a slide is sized in `cqw` — percent of the slide's own
 *  width — so the same markup is a thumbnail, an editor page, a
 *  full-screen slide and a 1920px export without any scaling maths. */
const u = (n: number) => `${n}cqw`

const SLIDE_H = 56.25

const UI_FONT = 'var(--font-geist-sans), system-ui, sans-serif'

function face(spec: FontSpec | undefined, fallbackWeight: number): React.CSSProperties {
    if (!spec) return { fontFamily: UI_FONT, fontWeight: fallbackWeight }
    return {
        fontFamily: `"${spec.family}", ${UI_FONT}`,
        fontWeight: spec.weight,
        fontVariationSettings: variationSettings(spec),
        fontFeatureSettings: featureSettings(spec),
    }
}

const rise = (i: number): React.CSSProperties => ({ ['--i' as string]: i })

/** Width/height (in cqw) for the logo fitted inside a box. */
function fitLogo(aspect: number, maxW: number, maxH: number) {
    const w = Math.min(maxW, maxH * aspect)
    return { width: u(w), height: u(w / aspect), w, h: w / aspect }
}

function Logo({ svg, mono, style, className }: { svg: string; mono?: string; style?: React.CSSProperties; className?: string }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element -- an inline SVG data URL; nothing for next/image to optimise
        <img src={logoUrl(svg, mono)} alt="" draggable={false} className={className} style={{ objectFit: 'contain', display: 'block', ...style }} />
    )
}

/** The brand's moving background, at whatever fidelity the mode calls for. */
function MotionLayer({ brand, mode, active }: { brand: Brand; mode: SlideMode; active: boolean }) {
    const a = primaryOf(brand)
    const b = accentOf(brand)
    if (!isLive(mode, active)) return <div className="absolute inset-0" style={{ background: motionGradient(a, b) }} />
    return <ShaderCanvas className="absolute inset-0" preset={brand.motion.preset} a={a} b={b} speed={brand.motion.speed} still={mode === 'export'} />
}

/** The quiet header most content pages share: section name, page number. */
function Label({ children, index, color }: { children: React.ReactNode; index: number; color: string }) {
    return (
        <div
            className="absolute flex justify-between uppercase rise"
            style={{ left: u(5), right: u(5), top: u(4), fontSize: u(0.85), letterSpacing: '0.14em', color: alpha(color, 0.5), fontFamily: UI_FONT, fontWeight: 500, ...rise(0) }}
        >
            <span>{children}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{String(index + 1).padStart(2, '0')}</span>
        </div>
    )
}

type Ctx = SlideProps & { fg: string; bgHex: string; heading: React.CSSProperties; body: React.CSSProperties; editable: boolean; active: boolean }

function Cover({ page, brand, fg, heading, onBrand, onPage, editable }: Ctx) {
    const svg = brand.logo.svg
    const size = fitLogo(svgAspect(svg), 26, SLIDE_H * 0.4)
    return (
        <>
            <div className="absolute inset-0 grid place-items-center">
                <Logo svg={svg} mono={page.logoMode === 'original' ? undefined : fg} className="rise" style={{ width: size.width, height: size.height, ...rise(0) }} />
            </div>
            <div className="absolute flex items-end justify-between" style={{ left: u(5), right: u(5), bottom: u(4.2), gap: u(4) }}>
                <Editable
                    value={brand.name}
                    onChange={editable ? (name) => onBrand?.({ name }) : undefined}
                    placeholder="Brand name"
                    className="rise"
                    style={{ ...heading, fontSize: u(2.4), lineHeight: 1.1, letterSpacing: '-0.01em', ...rise(2) }}
                />
                <Editable
                    value={page.subtitle}
                    onChange={editable ? (subtitle) => onPage?.({ subtitle }) : undefined}
                    placeholder="Subtitle"
                    className="rise text-right"
                    style={{ fontSize: u(1.05), opacity: 0.7, ...rise(3) }}
                />
            </div>
        </>
    )
}

function LogoPage({ page, brand, fg, index, onPage, editable }: Ctx) {
    const svg = brand.logo.svg
    const size = fitLogo(svgAspect(svg), page.logoSize ?? 30, SLIDE_H * 0.62)
    return (
        <>
            <div className="absolute inset-0 grid place-items-center">
                <Logo
                    svg={svg}
                    mono={page.logoMode === 'original' ? undefined : fg}
                    className="rise"
                    style={{ width: size.width, height: size.height, transition: 'width .35s cubic-bezier(.2,.8,.2,1), height .35s cubic-bezier(.2,.8,.2,1), opacity .7s, transform .9s', ...rise(0) }}
                />
            </div>
            <div
                className="absolute flex justify-between uppercase rise"
                style={{ left: u(5), right: u(5), bottom: u(4), fontSize: u(0.85), letterSpacing: '0.14em', color: alpha(fg, 0.55), fontFamily: UI_FONT, fontWeight: 500, ...rise(2) }}
            >
                <Editable value={page.title} onChange={editable ? (title) => onPage?.({ title }) : undefined} placeholder="Caption" />
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{String(index + 1).padStart(2, '0')}</span>
            </div>
        </>
    )
}

function Variations({ brand }: Ctx) {
    const svg = brand.logo.svg
    const size = fitLogo(svgAspect(svg), 16, SLIDE_H * 0.26)
    const primary = brand.colors[0]
    const accent = brand.colors[1] ?? primary
    const cells = [
        { name: primary.name, bg: primary.hex, mono: contrastOn(primary.hex) as string | undefined },
        { name: accent.name, bg: accent.hex, mono: contrastOn(accent.hex) as string | undefined },
        { name: 'On white', bg: PAPER, mono: undefined },
        { name: 'On black', bg: INK, mono: PAPER },
    ]
    return (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            {cells.map((c, i) => (
                <div key={i} className="relative grid place-items-center" style={{ background: c.bg, color: contrastOn(c.bg) }}>
                    <Logo svg={svg} mono={c.mono} className="rise" style={{ width: size.width, height: size.height, ...rise(i) }} />
                    <div
                        className="absolute flex justify-between uppercase"
                        style={{ left: u(2.2), right: u(2.2), bottom: u(1.8), fontSize: u(0.75), letterSpacing: '0.14em', opacity: 0.55, fontFamily: UI_FONT, fontWeight: 500 }}
                    >
                        <span>{c.name}</span>
                        <span>{c.bg.toUpperCase()}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

function ClearSpace({ page, brand, fg, bgHex, index, heading, onPage, editable }: Ctx) {
    const svg = brand.logo.svg
    const logo = fitLogo(svgAspect(svg), 30, 17)
    const pad = logo.h / 4
    // Guides in the brand colour where it shows up against the page.
    const primary = primaryOf(brand)
    const guide = Math.abs(luminance(primary) - luminance(bgHex)) > 0.15 ? primary : fg
    const line = `${u(0.09)} dashed ${alpha(guide, 0.55)}`
    const mono = page.logoMode === 'mono' || bgHex !== PAPER ? fg : undefined
    const corner = (pos: React.CSSProperties) => (
        <div className="absolute grid place-items-center" style={{ width: u(pad), height: u(pad), background: alpha(guide, 0.12), color: guide, fontSize: u(0.85), fontFamily: UI_FONT, ...pos }}>
            x
        </div>
    )
    return (
        <>
            <Label index={index} color={fg}>Clear space</Label>
            <div className="absolute grid place-items-center" style={{ left: 0, top: 0, bottom: 0, width: '58%' }}>
                <div className="relative rise" style={{ padding: u(pad), border: line, ...rise(1) }}>
                    {corner({ left: 0, top: 0 })}
                    {corner({ right: 0, top: 0 })}
                    {corner({ left: 0, bottom: 0 })}
                    {corner({ right: 0, bottom: 0 })}
                    <div style={{ outline: line }}>
                        <Logo svg={svg} mono={mono} style={{ width: logo.width, height: logo.height }} />
                    </div>
                </div>
            </div>
            <div className="absolute flex flex-col justify-center" style={{ right: u(5), top: 0, bottom: 0, width: '32%', gap: u(1.4) }}>
                <div className="rise" style={{ ...heading, fontSize: u(2.6), lineHeight: 1.1, letterSpacing: '-0.01em', ...rise(2) }}>Give it room.</div>
                <Editable
                    value={page.body}
                    onChange={editable ? (body) => onPage?.({ body }) : undefined}
                    placeholder="Describe the clear-space rule"
                    multiline
                    className="rise"
                    style={{ fontSize: u(1.2), lineHeight: 1.6, color: alpha(fg, 0.7), ...rise(3) }}
                />
                <div className="flex items-end rise" style={{ gap: u(2.4), marginTop: u(1.6), ...rise(4) }}>
                    {[{ h: 3.4, label: 'Print · 10 mm min' }, { h: 1.9, label: 'Screen · 24 px min' }].map((m) => (
                        <div key={m.label} className="flex flex-col" style={{ gap: u(0.8) }}>
                            <Logo svg={svg} mono={mono} style={{ height: u(m.h), width: u(m.h * svgAspect(svg)), objectPosition: 'left bottom' }} />
                            <span className="uppercase" style={{ fontSize: u(0.7), letterSpacing: '0.12em', color: alpha(fg, 0.5), fontFamily: UI_FONT }}>{m.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

function Palette({ brand, index, heading, editable, onOpen }: Ctx) {
    return (
        <>
            <Label index={index} color={INK}>Colour</Label>
            <div className="absolute flex" style={{ left: u(5), right: u(5), top: u(8.5), bottom: u(5), gap: u(0.9) }}>
                {brand.colors.map((c, i) => {
                    const on = contrastOn(c.hex)
                    const codes = [['HEX', c.hex.toUpperCase()], ['RGB', rgbLabel(c.hex)], ['CMYK', cmykLabel(c.hex)]]
                    return (
                        <div
                            key={c.id}
                            role={editable ? 'button' : undefined}
                            tabIndex={editable ? 0 : undefined}
                            onClick={editable ? () => onOpen?.('colors') : undefined}
                            onKeyDown={editable ? (e) => { if (e.key === 'Enter') onOpen?.('colors') } : undefined}
                            className={`rise flex flex-col justify-end min-w-0 ${editable ? 'cursor-pointer swatch' : ''}`}
                            style={{
                                flex: i === 0 ? 1.7 : 1,
                                background: c.hex,
                                color: on,
                                borderRadius: u(1.3),
                                padding: u(1.5),
                                boxShadow: luminance(c.hex) > 0.85 ? `inset 0 0 0 ${u(0.08)} ${alpha(INK, 0.1)}` : undefined,
                                ...rise(i + 1),
                            }}
                        >
                            <div className="truncate" style={{ ...heading, fontSize: u(1.7), lineHeight: 1.2, marginBottom: u(0.9) }}>{c.name}</div>
                            {codes.map(([k, v]) => (
                                <div key={k} className="flex whitespace-nowrap" style={{ fontSize: u(0.78), lineHeight: 1.7, fontFamily: 'var(--font-geist-mono), monospace', gap: u(0.8) }}>
                                    <span style={{ opacity: 0.55, width: u(2.9), flexShrink: 0 }}>{k}</span>
                                    <span className="truncate">{v}</span>
                                </div>
                            ))}
                        </div>
                    )
                })}
            </div>
        </>
    )
}

const SAMPLE_HEADLINE = 'The quick brown fox jumps over the lazy dog.'
const SAMPLE_BODY = 'Good typography is the invisible thread that holds a design together. It carries the brand’s voice and guides the reader through meaning.'

function Typography({ brand, fg, bgHex, index, editable, onOpen }: Ctx) {
    const type = brand.type
    if (!type) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ gap: u(1.6) }}>
                <div style={{ fontSize: u(9), lineHeight: 1, color: alpha(fg, 0.12), fontFamily: UI_FONT, fontWeight: 600 }}>Aa</div>
                <div style={{ fontSize: u(1.25), color: alpha(fg, 0.55), fontFamily: UI_FONT }}>No typography yet</div>
                {editable && (
                    <button
                        onClick={() => onOpen?.('type')}
                        className="rounded-full transition-transform duration-200 hover:scale-[1.04] active:scale-95"
                        style={{ fontSize: u(1.1), padding: `${u(0.7)} ${u(1.6)}`, background: fg, color: bgHex, fontFamily: UI_FONT, fontWeight: 500 }}
                    >
                        Choose a pairing
                    </button>
                )}
            </div>
        )
    }

    // The brand colour as the accent on neutral pages; on a coloured page
    // the type simply takes the page's contrast colour.
    const neutral = bgHex === PAPER || bgHex === INK
    const accent = neutral && Math.abs(luminance(primaryOf(brand)) - luminance(bgHex)) > 0.15 ? primaryOf(brand) : fg
    const headline = brand.insight?.tagline || SAMPLE_HEADLINE
    const body = brand.insight?.meaning || SAMPLE_BODY
    const columns: [string, FontSpec, number, string][] = [
        ['Heading', type.heading, type.heading.lh, accent],
        ['Body', type.body, type.bodyLineHeight, fg],
    ]
    return (
        <>
            <Label index={index} color={fg}>Typography</Label>
            <div className="absolute grid grid-cols-2" style={{ left: u(5), right: u(5), top: u(8.5), columnGap: u(4) }}>
                {columns.map(([name, spec, lh, color], i) => (
                    <div key={name} className="min-w-0 rise" style={rise(i + 1)}>
                        <div style={{ ...face(spec, 600), fontSize: u(10), lineHeight: 1, color }}>Aa</div>
                        <div className="truncate" style={{ ...face(spec, 600), fontSize: u(1.8), marginTop: u(1.2) }}>{spec.family}</div>
                        <div style={{ fontSize: u(0.85), color: alpha(fg, 0.5), marginTop: u(0.5), fontFamily: UI_FONT }}>
                            {name} · {spec.weight} · {lh} leading · {spec.ls}em tracking
                        </div>
                    </div>
                ))}
            </div>
            <div className="absolute" style={{ left: u(5), bottom: u(5), maxWidth: u(62) }}>
                <p className="rise" style={{ ...face(type.heading, 600), fontSize: u(3.4), lineHeight: type.heading.lh, letterSpacing: `${type.heading.ls}em`, color: accent, ...rise(3) }}>
                    {headline}
                </p>
                <p className="rise" style={{ ...face(type.body, 400), fontSize: u(1.35), lineHeight: type.bodyLineHeight, letterSpacing: `${type.body.ls}em`, marginTop: u(1.6), color: alpha(fg, 0.8), ...rise(4) }}>
                    {body}
                </p>
            </div>
        </>
    )
}

function ThreeD({ brand, mode, active, index, onReady }: Ctx) {
    const env = useContext(SceneEnvContext)
    const live = isLive(mode, active)
    return (
        <>
            {live ? (
                <div className="absolute inset-0">
                    <Logo3DViewer
                        svgContent={brand.logo.svg}
                        color={primaryOf(brand)}
                        material={brand.material}
                        env={env}
                        interactive={mode === 'present'}
                        maxDpr={mode === 'export' ? 1 : 2}
                        still={mode === 'export'}
                        onReady={mode === 'export' ? onReady : undefined}
                    />
                </div>
            ) : (
                // Off screen or a thumbnail: no WebGL, just the mark.
                <div className="absolute inset-0 grid place-items-center">
                    <Logo svg={brand.logo.svg} mono={primaryOf(brand)} style={{ ...fitLogo(svgAspect(brand.logo.svg), 22, SLIDE_H * 0.4), opacity: 0.9 }} />
                </div>
            )}
            <div
                className="absolute flex justify-between uppercase pointer-events-none"
                style={{ left: u(5), right: u(5), bottom: u(4), fontSize: u(0.85), letterSpacing: '0.14em', color: alpha(PAPER, 0.5), fontFamily: UI_FONT, fontWeight: 500 }}
            >
                <span>In three dimensions · {brand.material}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{String(index + 1).padStart(2, '0')}</span>
            </div>
        </>
    )
}

function Story({ page, fg, index, heading, onPage, editable, busy }: Ctx) {
    // Any hand edit detaches the page from the AI insight.
    const patch = (p: Partial<Page>) => onPage?.({ ...p, auto: false })
    return (
        <>
            <Label index={index} color={fg}>Story</Label>
            <div className={`absolute flex flex-col justify-center ${busy ? 'animate-pulse' : ''}`} style={{ left: u(5), right: u(5), top: u(7), bottom: u(9), gap: u(2) }}>
                <Editable
                    value={page.title}
                    onChange={editable ? (title) => patch({ title }) : undefined}
                    placeholder="Tagline"
                    multiline
                    className="rise"
                    style={{ ...heading, fontSize: u(4.6), lineHeight: 1.06, letterSpacing: '-0.02em', maxWidth: u(72), ...rise(1) }}
                />
                <Editable
                    value={page.body}
                    onChange={editable ? (body) => patch({ body }) : undefined}
                    placeholder="What the mark means"
                    multiline
                    className="rise"
                    style={{ fontSize: u(1.4), lineHeight: 1.6, maxWidth: u(52), color: alpha(fg, 0.72), ...rise(2) }}
                />
            </div>
            <div className="absolute flex flex-wrap" style={{ left: u(5), right: u(5), bottom: u(4.2), gap: u(0.7) }}>
                {(page.traits ?? []).map((t, i) => (
                    <span
                        key={`${t}-${i}`}
                        className="rise rounded-full"
                        style={{ fontSize: u(0.9), padding: `${u(0.45)} ${u(1.2)}`, boxShadow: `inset 0 0 0 ${u(0.08)} ${alpha(fg, 0.28)}`, color: alpha(fg, 0.85), ...rise(i + 3) }}
                    >
                        {t}
                    </span>
                ))}
            </div>
        </>
    )
}

function TextPage({ page, brand, fg, index, heading, onPage, editable }: Ctx) {
    return (
        <>
            <Label index={index} color={fg}>{brand.name}</Label>
            <div className="absolute flex flex-col justify-center" style={{ left: u(5), right: u(5), top: u(7), bottom: u(6), gap: u(2) }}>
                <Editable
                    value={page.title}
                    onChange={editable ? (title) => onPage?.({ title }) : undefined}
                    placeholder="Title"
                    multiline
                    className="rise"
                    style={{ ...heading, fontSize: u(4.6), lineHeight: 1.06, letterSpacing: '-0.02em', maxWidth: u(72), ...rise(1) }}
                />
                <Editable
                    value={page.body}
                    onChange={editable ? (body) => onPage?.({ body }) : undefined}
                    placeholder="Write something"
                    multiline
                    className="rise"
                    style={{ fontSize: u(1.5), lineHeight: 1.6, maxWidth: u(54), color: alpha(fg, 0.72), ...rise(2) }}
                />
            </div>
        </>
    )
}

const RENDERERS: Record<Page['kind'], (ctx: Ctx) => React.ReactElement> = {
    cover: Cover,
    logo: LogoPage,
    variations: Variations,
    clearspace: ClearSpace,
    palette: Palette,
    type: Typography,
    three: ThreeD,
    story: Story,
    text: TextPage,
}

/** One page of the deck, drawn from the brand. */
export function Slide(props: SlideProps) {
    const { page, brand, mode } = props
    const active = props.active ?? true

    useEffect(() => {
        if (brand.type) {
            loadFont(brand.type.heading)
            loadFont(brand.type.body)
        }
    }, [brand.type])

    // Pages with a fixed look ignore whatever background they once had.
    const bgHex = page.kind === 'palette' ? PAPER : page.kind === 'three' || page.kind === 'variations' ? INK : resolveBg(brand, page.bg)
    const fg = page.kind === 'palette' ? INK : page.kind === 'three' ? PAPER : fgFor(brand, page.bg)
    const Body = RENDERERS[page.kind]
    const fixed = mode === 'thumb' || mode === 'export'

    return (
        <div
            className="slide relative w-full aspect-video overflow-hidden select-none"
            data-in={(props.entered ?? active) || fixed}
            data-static={fixed || undefined}
            aria-label={pageLabel(page)}
            style={{ containerType: 'inline-size', background: bgHex, color: fg, transition: 'background-color .4s, color .4s', ...face(brand.type?.body, 400) }}
        >
            {page.bg === BG_MOTION && page.kind !== 'palette' && page.kind !== 'three' && page.kind !== 'variations' && (
                <MotionLayer brand={brand} mode={mode} active={active} />
            )}
            <Body
                {...props}
                active={active}
                fg={fg}
                bgHex={bgHex}
                heading={face(brand.type?.heading, 600)}
                body={face(brand.type?.body, 400)}
                editable={mode === 'edit'}
            />
        </div>
    )
}
