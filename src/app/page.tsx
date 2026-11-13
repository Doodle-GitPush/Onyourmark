"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { useDialKit, DialRoot } from "dialkit"
import { Download, Play, Undo2 } from "lucide-react"
import { Landing } from "@/components/Landing"
import { DeckEditor, Panel, scrollToPage } from "@/components/deck/DeckEditor"
import { Dock } from "@/components/deck/Dock"
import { PageRail } from "@/components/deck/PageRail"
import { PdfExporter } from "@/components/deck/PdfExporter"
import { Present } from "@/components/deck/Present"
import { SceneEnvContext } from "@/components/deck/Slide"
import { EASE, SPRING } from "@/components/deck/ui"
import { LogoInsight, LogoMaterial, primaryOf } from "@/lib/brand"
import { Page, PageTemplate, isPresentable, pageLabel } from "@/lib/deck"
import { SAMPLE_SVG, prepareSvg, rasterize } from "@/lib/svg"
import { useDeck } from "@/lib/useDeck"
import { cn } from "@/lib/utils"

const Logo3DViewer = dynamic(() => import("@/components/Logo3DViewer").then((m) => m.Logo3DViewer), { ssr: false })

const MATERIALS: LogoMaterial[] = ['chrome', 'glass', 'gold', 'matte', 'holo']

type View = 'deck' | 'studio'

interface Toast {
  id: number
  message: string
  action?: { label: string; run: () => void }
}

export default function Home() {
  const { hydrated, brand, pages, pendingType, actions } = useDeck()
  const [view, setView] = useState<View>('deck')
  const [panel, setPanel] = useState<Panel | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [presenting, setPresenting] = useState(false)
  const [exporting, setExporting] = useState<{ done: number; total: number } | null>(null)
  const [rewriting, setRewriting] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  // 3D scene controls — a DialKit panel instead of hand-rolled sliders,
  // shown inline in the 3D studio's sidebar (see `mode="inline"` below).
  // Nested objects become collapsible folders in the panel.
  const env = useDialKit('Environment', {
    autoRotate: true,
    rotateSpeed: [2.2, 0.5, 6, 0.1],
    camera: {
      fov: [35, 20, 60, 1],
    },
    lighting: {
      key: [1.6, 0, 4, 0.1],
      fill: [0.6, 0, 4, 0.1],
      rim: [0.8, 0, 4, 0.1],
      rimColor: '#FF4800',
      ambient: [0.5, 0, 2, 0.05],
    },
    floor: {
      visible: true,
      color: '#050505',
      reflectivity: [12, 0, 40, 1],
      roughness: [1, 0, 1, 0.05],
    },
    object: {
      depth: [6, 2, 14, 0.5],
      bevel: [0.8, 0, 2, 0.1],
    },
    postfx: {
      bloom: [0.5, 0, 2, 0.05],
      ao: [1.5, 0, 4, 0.1],
      vignette: [0.6, 0, 1, 0.05],
    },
  })

  const notify = useCallback((message: string, action?: Toast['action']) => {
    setToast({ id: Date.now(), message, action })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), toast.action ? 6000 : 3500)
    return () => clearTimeout(timer)
  }, [toast])

  // ── Logo in ─────────────────────────────────────────────
  const loadSvg = useCallback((text: string, fileName: string) => {
    const prepared = prepareSvg(text)
    if (!prepared) return 'That file couldn’t be read as an SVG — try exporting it again.'
    actions.setLogo(prepared, fileName)
    return null
  }, [actions])

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'image/svg+xml' && !/\.svg$/i.test(file.name)) return 'That’s not an SVG. Export your logo as .svg and drop it again.'
    return loadSvg(await file.text(), file.name)
  }, [loadSvg])

  const replaceLogo = useCallback(async (file: File) => {
    const error = await handleFile(file)
    notify(error ?? 'Logo replaced')
  }, [handleFile, notify])

  // ── AI insight ──────────────────────────────────────────
  // Runs once per logo on its own; the Story page's button runs it again.
  const analyze = useCallback(async (svg: string, manual: boolean) => {
    setRewriting(true)
    try {
      const res = await fetch('/api/analyze-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: await rasterize(svg) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      actions.setInsight(data as LogoInsight)
    } catch (err) {
      // Unprompted, a failure is silent — the Story page keeps its starter
      // copy. Asked for, it's explained.
      if (manual) {
        notify(err instanceof Error && err.message === 'no_key'
          ? 'AI writing isn’t set up — add a GEMINI_API_KEY to enable it.'
          : 'The AI couldn’t write that just now. Try again in a moment.')
      }
    } finally {
      setRewriting(false)
    }
  }, [actions, notify])

  const analyzed = useRef<string | null>(null)
  const logoSvg = brand?.logo.svg
  const hasInsight = !!brand?.insight
  useEffect(() => {
    if (!logoSvg || hasInsight || analyzed.current === logoSvg) return
    analyzed.current = logoSvg
    analyze(logoSvg, false)
  }, [logoSvg, hasInsight, analyze])

  const rewrite = useCallback(() => {
    if (!brand) return
    // Asking for a rewrite hands every story page back to the AI.
    pages.filter((p) => p.kind === 'story').forEach((p) => actions.patchPage(p.id, { auto: true }))
    analyze(brand.logo.svg, true)
  }, [brand, pages, actions, analyze])

  // ── Pages ───────────────────────────────────────────────
  const addPage = useCallback((template: PageTemplate, index: number) => {
    const id = actions.addPage(template, index)
    setView('deck')
    // After the new page has been laid out.
    setTimeout(() => scrollToPage(id), 80)
  }, [actions])

  const removePage = useCallback((page: Page) => {
    const index = pages.findIndex((p) => p.id === page.id)
    actions.removePage(page.id)
    notify(`${pageLabel(page)} page removed`, { label: 'Undo', run: () => actions.insertPage(page, index) })
  }, [pages, actions, notify])

  const openPanel = useCallback((target: Panel | 'studio') => {
    if (target === 'studio') {
      setPanel(null)
      setView('studio')
    } else {
      setPanel(target)
    }
  }, [])

  const activeIndex = Math.max(0, pages.findIndex((p) => p.id === activeId))
  const playable = brand ? pages.filter((p) => isPresentable(p, brand)) : []

  const present = () => {
    if (!playable.length) return
    setPanel(null)
    setPresenting(true)
  }

  const exportPdf = () => {
    if (!playable.length || exporting) return
    setPanel(null)
    setExporting({ done: 0, total: playable.length })
  }

  return (
    <SceneEnvContext.Provider value={env}>
      {/* Honour the OS "reduce motion" setting across every animation. */}
      <MotionConfig reducedMotion="user">
      <div className="h-screen flex flex-col bg-[#0A0A0A] text-zinc-200 font-sans overflow-hidden">
        {/* Header */}
        <header className="relative z-40 shrink-0 flex items-center justify-between gap-4 px-6 h-16">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[13px] tracking-tight text-zinc-100 shrink-0">OnYourMark</span>
            {brand && (
              <>
                <span className="hidden md:inline text-zinc-700">/</span>
                <input
                  aria-label="Brand name"
                  value={brand.name}
                  onChange={(e) => actions.patchBrand({ name: e.target.value })}
                  placeholder="Brand name"
                  spellCheck={false}
                  style={{ width: `${Math.max(brand.name.length, 6) + 2}ch` }}
                  className="hidden md:block min-w-0 max-w-[24vw] bg-transparent text-[13px] text-zinc-400 rounded px-1 -mx-1 py-0.5 hover:text-zinc-200 hover:bg-white/[0.04] focus:text-zinc-100 focus:bg-white/[0.06] focus:outline-none transition-colors"
                />
              </>
            )}
          </div>

          {brand && (
            <>
              <nav className="absolute left-1/2 -translate-x-1/2 flex items-center p-0.5 rounded-full bg-white/[0.04] text-[12px]">
                {(['deck', 'studio'] as View[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    aria-pressed={view === v}
                    className={cn('relative h-7 px-3.5 rounded-full transition-colors duration-200', view === v ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}
                  >
                    {view === v && <motion.span layoutId="view-pill" transition={SPRING} className="absolute inset-0 rounded-full bg-white/[0.09]" />}
                    <span className="relative">{v === 'deck' ? 'Deck' : <>3D<span className="hidden sm:inline"> studio</span></>}</span>
                  </button>
                ))}
              </nav>

              <div className="flex items-center gap-1.5 text-[12px]">
                <button
                  onClick={present}
                  disabled={!playable.length}
                  className="group flex items-center gap-1.5 h-8 px-3 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] active:scale-95 disabled:opacity-30 transition-all duration-200"
                >
                  <Play size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  <span className="hidden sm:inline">Present</span>
                </button>
                <button
                  onClick={exportPdf}
                  disabled={!playable.length || !!exporting}
                  className="group flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-zinc-100 text-zinc-900 font-medium hover:bg-white active:scale-95 disabled:opacity-40 transition-all duration-200"
                >
                  <Download size={12} className="transition-transform duration-300 group-hover:translate-y-0.5" />
                  Export
                </button>
              </div>
            </>
          )}
        </header>

        {!hydrated ? (
          <main className="flex-1" />
        ) : !brand ? (
          <Landing onFile={handleFile} onSample={() => loadSvg(SAMPLE_SVG, 'Northpoint.svg')} pendingType={pendingType} />
        ) : view === 'deck' ? (
          <motion.main
            key="deck"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative flex-1 min-h-0 flex flex-col"
          >
            <PageRail
              brand={brand}
              pages={pages}
              activeId={activeId}
              onSelect={scrollToPage}
              onReorder={actions.reorder}
              onAdd={(t) => addPage(t, activeIndex + 1)}
            />
            <DeckEditor
              brand={brand}
              pages={pages}
              deck={actions}
              activeId={activeId}
              onActive={setActiveId}
              onOpen={openPanel}
              onRemove={removePage}
              onAdd={addPage}
              onRewrite={rewrite}
              rewriting={rewriting}
            />
            <Dock
              brand={brand}
              deck={actions}
              panel={panel}
              onPanel={setPanel}
              onLogoFile={replaceLogo}
              onAddMotionPage={() => addPage('motion', activeIndex + 1)}
            />
          </motion.main>
        ) : (
          /* 3D studio — full-bleed viewport on the left, controls on the right. */
          <motion.main
            key="studio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="flex-1 min-h-0 flex"
          >
            <div className="flex-1 min-w-0 relative">
              <Logo3DViewer svgContent={brand.logo.svg} color={primaryOf(brand)} material={brand.material} env={env} />
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-zinc-600">
                Drag to orbit · scroll to zoom
              </p>
            </div>

            <aside className="w-[280px] shrink-0 border-l border-white/[0.06] overflow-y-auto px-6 py-8 space-y-10">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 block">Material</label>
                <div className="mt-3 flex flex-col items-start gap-2.5">
                  {MATERIALS.map((m) => (
                    <button
                      key={m}
                      onClick={() => actions.patchBrand({ material: m })}
                      className={`text-[13px] capitalize tracking-wide transition-colors ${brand.material === m ? 'text-zinc-100 underline underline-offset-4 decoration-[#FF4800]' : 'text-zinc-600 hover:text-zinc-300'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
                  Takes your primary colour. What you set here is what the deck’s 3D page shows.
                </p>
              </div>

              <div className="rounded-lg overflow-hidden border border-white/[0.06] h-[560px]">
                {/* DialKit hides itself in production builds by default (it's
                    meant as a dev-time tweaking tool) — these are real
                    user-facing controls, so it needs to stay visible. Tall
                    enough for the folders below to be visible without opening
                    each one; it scrolls internally past that. */}
                <DialRoot mode="inline" theme="dark" productionEnabled />
              </div>
            </aside>
          </motion.main>
        )}

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              role="status"
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15 } }}
              transition={SPRING}
              className="fixed top-[4.5rem] left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 h-10 pl-4 pr-1.5 rounded-full bg-[#1A1A1D] text-[12px] text-zinc-200 ring-1 ring-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
            >
              <span className="pr-2.5">{toast.message}</span>
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.run()
                    setToast(null)
                  }}
                  className="flex items-center gap-1.5 h-7 px-3 rounded-full bg-white/[0.08] text-zinc-100 hover:bg-white/[0.14] active:scale-95 transition-all duration-150"
                >
                  <Undo2 size={12} /> {toast.action.label}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Present */}
        <AnimatePresence>
          {presenting && brand && playable.length > 0 && (
            <Present
              brand={brand}
              pages={playable}
              startIndex={Math.max(0, playable.findIndex((p) => p.id === activeId))}
              onClose={() => setPresenting(false)}
            />
          )}
        </AnimatePresence>

        {/* Export */}
        <AnimatePresence>
          {exporting && (
            <motion.div
              role="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 grid place-items-center bg-[#0A0A0A]/80 backdrop-blur-md"
            >
              <div className="w-56 text-center">
                <div className="text-[13px] text-zinc-200">Exporting your deck</div>
                <div className="mt-1 text-[11px] tabular-nums text-zinc-500">
                  Page {Math.min(exporting.done + 1, exporting.total)} of {exporting.total}
                </div>
                <div className="mt-5 h-[2px] rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full origin-left bg-[#FF4800]"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: exporting.done / exporting.total }}
                    transition={{ duration: 0.4, ease: EASE }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {exporting && brand && (
          <PdfExporter
            brand={brand}
            pages={playable}
            onProgress={(done, total) => setExporting({ done, total })}
            onDone={(error) => {
              setExporting(null)
              if (error) {
                console.error('Export failed', error)
                notify('The export didn’t finish. Try again.')
              } else {
                notify('Deck exported')
              }
            }}
          />
        )}
      </div>
      </MotionConfig>
    </SceneEnvContext.Provider>
  )
}
