"use client"

import React, { useState, useRef, useCallback } from "react"
import { SVGDropzone } from "@/components/SVGDropzone"
import { PresentationGrid } from "@/components/PresentationGrid"
import { ColorPickerDuo } from "@/components/ColorPicker"
import { AIInsightSlide, LogoInsight } from "@/components/AIInsightSlide"
import { Logo3DViewer, LogoMaterial } from "@/components/Logo3DViewer"
import { useDialKit, DialRoot } from "dialkit"
import { jsPDF } from "jspdf"
import { toJpeg } from "html-to-image"

const MATERIALS = ['chrome', 'glass', 'gold', 'matte', 'holo'] as const

export default function Home() {
  const [svgContent, setSvgContent] = useState<string>("")
  const [fileName, setFileName] = useState<string>("")
  const [primaryColor, setPrimaryColor] = useState<string>("#0066FF")
  const [secondaryColor, setSecondaryColor] = useState<string>("#FF4800")
  const [logoSize, setLogoSize] = useState<number>(30)
  const [activeTab, setActiveTab] = useState<"logo" | "3d">("logo")
  const [isExporting, setIsExporting] = useState(false)
  const [logoInsight, setLogoInsight] = useState<LogoInsight | null>(null)
  const [logoMaterial, setLogoMaterial] = useState<LogoMaterial>("chrome")

  // 3D scene controls — a DialKit panel instead of hand-rolled sliders,
  // shown inline in the 3D tab's sidebar (see `mode="inline"` below).
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

  const handleFileLoad = (text: string, name: string) => {
    setSvgContent(text)
    setFileName(name)
  }

  const aiInsightRef = useRef<HTMLDivElement>(null)

  // ── Canvas-based slide renderer ──────────────────────────────────
  const getColoredSvg = useCallback((color: string) => {
    if (!svgContent) return ''
    return svgContent
      .replace(/fill="[^"]*"/g, `fill="${color}"`)
      .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
      .replace(/style="[^"]*"/g, '')
  }, [svgContent])

  const loadSvgAsImage = useCallback((svgStr: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => { resolve(img); URL.revokeObjectURL(url) }
      img.onerror = (e) => { reject(e); URL.revokeObjectURL(url) }
      img.src = url
    })
  }, [])

  const drawLogoSlide = useCallback(async (
    canvas: HTMLCanvasElement,
    bgColor: string,
    logoColor: string
  ) => {
    const ctx = canvas.getContext('2d')!
    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, W, H)

    const colored = getColoredSvg(logoColor)
    if (!colored) return

    try {
      const img = await loadSvgAsImage(colored)
      const scale = (logoSize / 100)
      const logoW = W * scale
      const logoH = logoW * (img.naturalHeight / img.naturalWidth)
      const x = (W - logoW) / 2
      const y = (H - logoH) / 2
      ctx.drawImage(img, x, y, logoW, logoH)
    } catch (e) {
      console.warn('Could not draw SVG logo on canvas', e)
    }
  }, [getColoredSvg, loadSvgAsImage, logoSize])

  const handleExport = async () => {
    if (!svgContent) return
    setIsExporting(true)

    try {
      const W = 1920
      const H = 1080
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [W, H]
      })

      await drawLogoSlide(canvas, primaryColor, '#ffffff')
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, W, H)

      pdf.addPage([W, H], 'landscape')
      await drawLogoSlide(canvas, secondaryColor, '#ffffff')
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, W, H)

      pdf.addPage([W, H], 'landscape')
      await drawLogoSlide(canvas, '#ffffff', '#000000')
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, W, H)

      pdf.addPage([W, H], 'landscape')
      await drawLogoSlide(canvas, '#000000', '#ffffff')
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, W, H)

      setActiveTab('logo')
      await new Promise(resolve => setTimeout(resolve, 800))
      if (aiInsightRef.current) {
        aiInsightRef.current.scrollIntoView({ block: 'center' })
        await new Promise(resolve => setTimeout(resolve, 600))
        try {
          const insightImg = await toJpeg(aiInsightRef.current, {
            quality: 0.95,
            backgroundColor: '#0A0A0A',
            pixelRatio: 2,
          })
          pdf.addPage([W, H], 'landscape')
          const cardW = W * 0.72
          const cardH = cardW * (aiInsightRef.current.offsetHeight / aiInsightRef.current.offsetWidth)
          const cardX = (W - cardW) / 2
          const cardY = (H - cardH) / 2
          pdf.addImage(insightImg, 'JPEG', cardX, cardY, cardW, cardH)
        } catch (e) {
          console.warn('Could not capture AI insight slide', e)
        }
      }

      pdf.save('onyourmark-presentation.pdf')
    } catch (err) {
      console.error("Export failed", err)
      alert("Failed to export PDF.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#0A0A0A] text-zinc-200 font-sans overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-6 h-16">
        <span className="text-[13px] tracking-tight text-zinc-100">OnYourMark</span>
        <nav className="flex items-center gap-6 text-[13px]">
          <button
            onClick={() => setActiveTab('logo')}
            className={`transition-colors ${activeTab === 'logo' ? 'text-zinc-100' : 'text-zinc-600 hover:text-zinc-300'}`}
          >
            Logo
          </button>
          <button
            onClick={() => setActiveTab('3d')}
            className={`transition-colors ${activeTab === '3d' ? 'text-zinc-100' : 'text-zinc-600 hover:text-zinc-300'}`}
          >
            3D
          </button>
          <button
            onClick={handleExport}
            disabled={!svgContent || isExporting}
            className="text-zinc-600 hover:text-zinc-300 disabled:opacity-30 disabled:hover:text-zinc-600 transition-colors"
          >
            {isExporting ? "Exporting…" : "Export"}
          </button>
        </nav>
      </header>

      {!svgContent ? (
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6">
            <SVGDropzone svgContent={svgContent} fileName={fileName} onFileLoad={handleFileLoad} />
          </div>
        </main>
      ) : activeTab === 'logo' ? (
        /* Logo tab — single centered column, page-style scroll. */
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 pb-32">
            <SVGDropzone svgContent={svgContent} fileName={fileName} onFileLoad={handleFileLoad} />

            <div className="mt-20 space-y-20">
              <ColorPickerDuo
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                onPrimaryChange={setPrimaryColor}
                onSecondaryChange={setSecondaryColor}
              />

              {/* Preview */}
              <div>
                <PresentationGrid svgContent={svgContent} primaryColor={primaryColor} secondaryColor={secondaryColor} size={logoSize} />
                <div className="mt-5 flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600 w-10">Size</span>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={1}
                    value={logoSize}
                    onChange={(e) => setLogoSize(Number(e.target.value))}
                    className="flex-1 h-px bg-zinc-700 accent-[#FF4800] cursor-pointer"
                  />
                </div>
              </div>

              {/* AI Insight */}
              <div ref={aiInsightRef} className="pt-4 border-t border-white/[0.06]">
                <AIInsightSlide
                  svgContent={svgContent}
                  primaryColor={primaryColor}
                  cachedInsight={logoInsight}
                  onInsightReady={setLogoInsight}
                />
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* 3D tab — full-bleed viewport on the left, controls on the right. */
        <main className="flex-1 min-h-0 flex">
          <div className="flex-1 min-w-0 relative">
            <Logo3DViewer
              svgContent={svgContent}
              color={primaryColor}
              material={logoMaterial}
              env={env}
            />
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-zinc-600">
              Drag to orbit · scroll to zoom
            </p>
          </div>

          <aside className="w-[280px] shrink-0 border-l border-white/[0.06] overflow-y-auto px-6 py-10 space-y-12">
            <SVGDropzone svgContent={svgContent} fileName={fileName} onFileLoad={handleFileLoad} />

            <ColorPickerDuo
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              onPrimaryChange={setPrimaryColor}
              onSecondaryChange={setSecondaryColor}
            />

            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-600 block">Material</label>
              <div className="mt-3 flex flex-col items-start gap-2.5">
                {MATERIALS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setLogoMaterial(m)}
                    className={`text-[13px] capitalize tracking-wide transition-colors ${logoMaterial === m ? 'text-zinc-100 underline underline-offset-4 decoration-[#FF4800]' : 'text-zinc-600 hover:text-zinc-300'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
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
        </main>
      )}
    </div>
  )
}
