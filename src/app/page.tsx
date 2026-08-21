"use client"

import React, { useState, useRef, useCallback } from "react"
import { SVGDropzone } from "@/components/SVGDropzone"
import { PresentationGrid } from "@/components/PresentationGrid"
import { ColorPickerDuo } from "@/components/ColorPicker"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { AIInsightSlide, LogoInsight } from "@/components/AIInsightSlide"
import { Logo3DViewer, LogoMaterial } from "@/components/Logo3DViewer"
import { jsPDF } from "jspdf"
import { toJpeg } from "html-to-image"
import { RotateCw } from "lucide-react"

export default function Home() {
  const [svgContent, setSvgContent] = useState<string>("")
  const [primaryColor, setPrimaryColor] = useState<string>("#0066FF")
  const [secondaryColor, setSecondaryColor] = useState<string>("#FF4800")
  const [logoSize, setLogoSize] = useState<number>(30)
  const [activeTab, setActiveTab] = useState<"logo" | "3d">("logo")
  const [isExporting, setIsExporting] = useState(false)
  const [logoInsight, setLogoInsight] = useState<LogoInsight | null>(null)
  const [logoMaterial, setLogoMaterial] = useState<LogoMaterial>("chrome")
  const [autoRotate, setAutoRotate] = useState(true)

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

    // Draw background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, W, H)

    // Draw logo centered
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

      // ── Slide 1: Primary bg + white logo ──
      await drawLogoSlide(canvas, primaryColor, '#ffffff')
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, W, H)

      // ── Slide 2: Secondary bg + white logo ──
      pdf.addPage([W, H], 'landscape')
      await drawLogoSlide(canvas, secondaryColor, '#ffffff')
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, W, H)

      // ── Slide 3: White bg + black logo ──
      pdf.addPage([W, H], 'landscape')
      await drawLogoSlide(canvas, '#ffffff', '#000000')
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, W, H)

      // ── Slide 4: Black bg + white logo ──
      pdf.addPage([W, H], 'landscape')
      await drawLogoSlide(canvas, '#000000', '#ffffff')
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, W, H)

      // ── Slide 5: AI Brand Insight snapshot ──
      setActiveTab('logo')
      await new Promise(resolve => setTimeout(resolve, 800))
      if (aiInsightRef.current) {
        aiInsightRef.current.scrollIntoView({ block: 'center' })
        await new Promise(resolve => setTimeout(resolve, 600))
        try {
          const insightImg = await toJpeg(aiInsightRef.current, {
            quality: 0.95,
            backgroundColor: '#09090B',
            pixelRatio: 2,
          })
          pdf.addPage([W, H], 'landscape')
          // Center the card on the slide
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
    <div className="h-screen bg-[#09090B] text-zinc-100 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-[64px] w-full flex items-center justify-between px-6 border-b border-white/[0.08] z-10 shrink-0">
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="" className="h-[22px] w-auto" />
          <span className="text-[14px] font-semibold tracking-tight text-zinc-100">OnYourMark</span>
        </div>
        <Button
          className="rounded-lg px-4 h-9 text-[13px] font-medium bg-[#FF4800] text-white hover:bg-[#FF5A17] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={handleExport}
          disabled={!svgContent || isExporting}
        >
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 lg:px-6 mt-0 h-[calc(100vh-64px)] overflow-hidden">

        {/* Sidebar */}
        <aside className="w-full lg:w-[300px] h-full flex flex-col flex-shrink-0 border border-white/[0.08] rounded-xl bg-[#111113] overflow-hidden">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto hidden-scrollbar p-5 pb-2">
            <div className="space-y-6">
              <div className="pt-1">
                <h2 className="text-[15px] font-semibold mb-1.5 tracking-tight text-zinc-100">Add Your Logo</h2>
                <p className="text-[11px] text-zinc-500 leading-[1.4]">Upload your SVG to preview it across brand colors and in 3D.</p>
              </div>

              <div>
                <SVGDropzone onSVGLoad={setSvgContent} />
              </div>

              <ColorPickerDuo
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                onPrimaryChange={setPrimaryColor}
                onSecondaryChange={setSecondaryColor}
              />

              {activeTab === '3d' ? (
                <div className="space-y-3 pt-6 pb-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                    Material
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['chrome', 'glass', 'gold', 'matte', 'holo'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setLogoMaterial(m)}
                        className={`py-2 rounded-lg text-[10px] font-bold tracking-wide capitalize transition-all border ${logoMaterial === m ? 'bg-[#FF4800] text-white border-[#FF4800]' : 'bg-white/[0.03] text-zinc-400 border-white/[0.08] hover:border-white/20'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setAutoRotate((v) => !v)}
                    className={`mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-bold tracking-wide transition-all border ${autoRotate ? 'bg-[#FF4800]/10 text-[#FF4800] border-[#FF4800]/30' : 'bg-white/[0.03] text-zinc-400 border-white/[0.08] hover:border-white/20'}`}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Auto-Rotate {autoRotate ? 'On' : 'Off'}
                  </button>
                  <p className="text-[10px] text-zinc-500 leading-[1.5] pt-1">Drag to orbit, scroll to zoom.</p>
                </div>
              ) : (
                <div className="space-y-3 pt-6 pb-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                    Logo Size
                  </label>
                  <div className="px-1 pt-1">
                    <Slider
                      value={[logoSize]}
                      onValueChange={(v) => setLogoSize(v[0])}
                      max={100}
                      min={10}
                      step={1}
                      className="[&>span:first-child]:bg-white/[0.08] [&>span:first-child]:h-1.5 [&_[role=slider]]:bg-[#FF4800] [&_[role=slider]]:border-[#FF4800] [&>span>span]:bg-[#FF4800] [&_[role=slider]]:w-4 [&_[role=slider]]:h-4"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sticky bottom tab switcher */}
          <div className="flex-shrink-0 p-3 pt-2 border-t border-white/[0.08]">
            <div className="bg-[#09090B] p-1 flex rounded-lg border border-white/[0.06]">
              <button
                onClick={() => setActiveTab('logo')}
                className={`flex-1 py-[9px] text-[11px] tracking-wide font-bold rounded-[6px] transition-all flex items-center justify-center ${activeTab === 'logo' ? 'bg-white/[0.08] text-[#FF4800]' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                LOGO
              </button>
              <button
                onClick={() => setActiveTab('3d')}
                className={`flex-1 py-[9px] text-[11px] tracking-wide font-bold rounded-[6px] transition-all flex items-center justify-center ${activeTab === '3d' ? 'bg-white/[0.08] text-[#FF4800]' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                3D
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 h-full w-full min-w-0 border border-white/[0.08] bg-[#0B0B0D] rounded-xl overflow-y-auto hidden-scrollbar relative">
          <div className="w-full relative p-4">
            {activeTab === 'logo' ? (
              <div className="w-full bg-transparent">
                <PresentationGrid svgContent={svgContent} primaryColor={primaryColor} secondaryColor={secondaryColor} size={logoSize} />
                <div ref={aiInsightRef}>
                  <AIInsightSlide
                    svgContent={svgContent}
                    primaryColor={primaryColor}
                    cachedInsight={logoInsight}
                    onInsightReady={setLogoInsight}
                  />
                </div>
              </div>
            ) : (
              <div className="w-full bg-transparent">
                {svgContent ? (
                  <Logo3DViewer
                    svgContent={svgContent}
                    color={primaryColor}
                    material={logoMaterial}
                    autoRotate={autoRotate}
                  />
                ) : (
                  <div className="w-full h-[560px] flex items-center justify-center text-[13px] text-zinc-500 font-medium">
                    Upload a logo to view it in 3D
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
