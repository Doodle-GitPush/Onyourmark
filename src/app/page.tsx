"use client"

import React, { useState, useRef, useCallback } from "react"
import { SVGDropzone } from "@/components/SVGDropzone"
import { PresentationGrid } from "@/components/PresentationGrid"
import { ImageMockup } from "@/components/mockups/ImageMockup"
import { ColorPickerDuo } from "@/components/ColorPicker"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { AIInsightSlide, LogoInsight } from "@/components/AIInsightSlide"
import { AIMockupGenerator } from "@/components/AIMockupGenerator"
import { Logo3DViewer, LogoMaterial } from "@/components/Logo3DViewer"
import { jsPDF } from "jspdf"
import { toJpeg } from "html-to-image"
import { RotateCw } from "lucide-react"

export default function Home() {
  const [svgContent, setSvgContent] = useState<string>("")
  const [primaryColor, setPrimaryColor] = useState<string>("#0066FF")
  const [secondaryColor, setSecondaryColor] = useState<string>("#FF4800")
  const [logoSize, setLogoSize] = useState<number>(30)
  const [mockupSize, setMockupSize] = useState<number>(30)
  const [activeTab, setActiveTab] = useState<"logo" | "mockups" | "3d">("logo")
  const [isExporting, setIsExporting] = useState(false)
  const [aiMockupImage, setAiMockupImage] = useState<string | null>(null)
  const [logoInsight, setLogoInsight] = useState<LogoInsight | null>(null)
  const [logoMaterial, setLogoMaterial] = useState<LogoMaterial>("chrome")
  const [autoRotate, setAutoRotate] = useState(true)

  const mainRef = useRef<HTMLDivElement>(null)
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

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(e)
      img.src = src
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

  const drawMockupSlide = useCallback(async (
    canvas: HTMLCanvasElement,
    mockupSrc: string,
    logoColor: string,
    logoScale: number,
    logoTopPct: number,
    logoLeftPct: number
  ) => {
    const ctx = canvas.getContext('2d')!
    const W = canvas.width
    const H = canvas.height

    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    // Draw mockup background image (object-fit: cover)
    try {
      const bgImg = await loadImage(mockupSrc)
      const imgRatio = bgImg.naturalWidth / bgImg.naturalHeight
      const canvasRatio = W / H
      let drawW, drawH, drawX, drawY
      if (imgRatio > canvasRatio) {
        // Image is wider — fit height, crop sides
        drawH = H
        drawW = H * imgRatio
        drawX = (W - drawW) / 2
        drawY = 0
      } else {
        // Image is taller — fit width, crop top/bottom
        drawW = W
        drawH = W / imgRatio
        drawX = 0
        drawY = (H - drawH) / 2
      }
      ctx.drawImage(bgImg, drawX, drawY, drawW, drawH)
    } catch (e) {
      console.warn('Could not load mockup image', e)
    }

    // Draw logo on top
    const colored = getColoredSvg(logoColor)
    if (!colored) return
    try {
      const logoImg = await loadSvgAsImage(colored)
      const scale = (logoScale / 100)
      const logoW = W * scale
      const logoH = logoW * (logoImg.naturalHeight / logoImg.naturalWidth)
      const x = (W * logoLeftPct / 100) - logoW / 2
      const y = (H * logoTopPct / 100) - logoH / 2
      ctx.drawImage(logoImg, x, y, logoW, logoH)
    } catch (e) {
      console.warn('Could not draw logo on mockup', e)
    }
  }, [getColoredSvg, loadSvgAsImage, loadImage])

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
            backgroundColor: '#FAFAFA',
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

      // ── Slides 6+: Capture actual visible mockup slides ──
      const prevTab = activeTab
      setActiveTab('mockups')
      // Wait for React to render the mockups tab and images to load
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (mainRef.current) {
        const mockupSlides = Array.from(
          mainRef.current.querySelectorAll('.aspect-\\[16\\/9\\]')
        ) as HTMLElement[]

        for (let i = 0; i < mockupSlides.length; i++) {
          // Scroll the slide into view to ensure it's rendered
          mockupSlides[i].scrollIntoView({ block: 'center' })
          await new Promise(resolve => setTimeout(resolve, 300))

          try {
            const imgData = await toJpeg(mockupSlides[i], {
              quality: 0.95,
              backgroundColor: '#ffffff',
              pixelRatio: 2,
              width: mockupSlides[i].offsetWidth,
              height: mockupSlides[i].offsetHeight,
            })
            pdf.addPage([W, H], 'landscape')
            pdf.addImage(imgData, 'JPEG', 0, 0, W, H)
          } catch (e) {
            console.warn(`Could not capture mockup slide ${i + 1}`, e)
            // Fallback: add a blank white page
            pdf.addPage([W, H], 'landscape')
          }
        }
      }

      // Restore original tab
      setActiveTab(prevTab)
      await new Promise(resolve => setTimeout(resolve, 100))

      // ── AI Mockup slide (if user generated one) ──
      if (aiMockupImage) {
        pdf.addPage([W, H], 'landscape')
        // Load image to get original dimensions and apply 'object-contain' fit
        await new Promise<void>((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            const imgR = img.naturalWidth / img.naturalHeight
            const canvasR = W / H
            let renderW = W
            let renderH = H
            let x = 0
            let y = 0

            if (imgR > canvasR) {
              renderH = W / imgR
              y = (H - renderH) / 2
            } else {
              renderW = H * imgR
              x = (W - renderW) / 2
            }
            
            pdf.addImage(img, 'JPEG', x, y, renderW, renderH)
            resolve()
          }
          img.onerror = reject
          img.src = aiMockupImage
        })
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
    <div className="h-screen bg-[#FAFAFA] text-slate-900 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-[88px] w-full flex items-center justify-between px-8 bg-[#FAFAFA] z-10 shrink-0">
        <div className="flex items-center">
          <img src="/logo.png" alt="OnYourMark" className="h-[30px] w-auto" />
        </div>
        <Button variant="outline" className="rounded-2xl px-8 h-10 text-[13px] font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 transition-colors shadow-sm bg-white" onClick={handleExport} disabled={!svgContent || isExporting}>
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 md:px-8 mt-0 h-[calc(100vh-88px)] overflow-hidden">

        {/* Sidebar */}
        <aside className="w-full lg:w-[320px] h-full flex flex-col flex-shrink-0 border border-slate-200 rounded-3xl bg-white overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto hidden-scrollbar p-6 pb-2">
            <div className="space-y-6">
              <div className="pt-2">
                <h2 className="text-[20px] font-bold mb-2 tracking-tight text-slate-800">Add Your Logo</h2>
                <p className="text-[11px] text-slate-500 leading-[1.4] pr-4">Upload your SVG to preview on different backgrounds and realistic mockups.</p>
              </div>

              <div className="mt-8">
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
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    Material
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['chrome', 'glass', 'gold', 'matte', 'holo'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setLogoMaterial(m)}
                        className={`py-2 rounded-lg text-[10px] font-bold tracking-wide capitalize transition-all border ${logoMaterial === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setAutoRotate((v) => !v)}
                    className={`mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-bold tracking-wide transition-all border ${autoRotate ? 'bg-orange-50 text-[#FF4800] border-orange-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Auto-Rotate {autoRotate ? 'On' : 'Off'}
                  </button>
                  <p className="text-[10px] text-slate-400 leading-[1.5] pt-1">Drag to orbit, scroll to zoom.</p>
                </div>
              ) : (
                <div className="space-y-3 pt-6 pb-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    {activeTab === 'logo' ? 'Logo Size' : 'Mockup Logo Size'}
                  </label>
                  <div className="px-1 pt-1">
                    <Slider
                      value={[activeTab === 'logo' ? logoSize : mockupSize]}
                      onValueChange={(v) => activeTab === 'logo' ? setLogoSize(v[0]) : setMockupSize(v[0])}
                      max={100}
                      min={10}
                      step={1}
                      className="[&>span:first-child]:bg-slate-200 [&>span:first-child]:h-1.5 [&_[role=slider]]:bg-[#FF4800] [&_[role=slider]]:border-[#FF4800] [&>span>span]:bg-[#FF4800] [&_[role=slider]]:w-4 [&_[role=slider]]:h-4"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sticky bottom tab switcher */}
          <div className="flex-shrink-0 p-4 pt-2 border-t border-slate-100 bg-white">
            <div className="bg-[#F1F3F5] p-1.5 flex rounded-xl border border-black/5 shadow-inner">
              <button
                onClick={() => setActiveTab('logo')}
                className={`flex-1 py-[10px] text-[11px] tracking-wide font-bold rounded-[8px] transition-all flex items-center justify-center ${activeTab === 'logo' ? 'bg-white text-[#FF4800] shadow-[0_2px_4px_rgba(0,0,0,0.04)] border border-black/5' : 'text-slate-400 hover:text-slate-600'}`}
              >
                LOGO
              </button>
              <button
                onClick={() => setActiveTab('3d')}
                className={`flex-1 py-[10px] text-[11px] tracking-wide font-bold rounded-[8px] transition-all flex items-center justify-center ${activeTab === '3d' ? 'bg-white text-[#FF4800] shadow-[0_2px_4px_rgba(0,0,0,0.04)] border border-black/5' : 'text-slate-400 hover:text-slate-600'}`}
              >
                3D
              </button>
              <button
                onClick={() => setActiveTab('mockups')}
                className={`flex-1 py-[10px] text-[11px] tracking-wide font-bold rounded-[8px] transition-all flex items-center justify-center ${activeTab === 'mockups' ? 'bg-white text-[#FF4800] shadow-[0_2px_4px_rgba(0,0,0,0.04)] border border-black/5' : 'text-slate-400 hover:text-slate-600'}`}
              >
                MOCKUPS
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 h-full w-full min-w-0 border border-slate-200 bg-white/50 rounded-3xl overflow-y-auto hidden-scrollbar relative" ref={mainRef}>
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
            ) : activeTab === '3d' ? (
              <div className="w-full bg-transparent">
                {svgContent ? (
                  <Logo3DViewer
                    svgContent={svgContent}
                    color={primaryColor}
                    material={logoMaterial}
                    autoRotate={autoRotate}
                  />
                ) : (
                  <div className="w-full h-[560px] flex items-center justify-center text-[13px] text-slate-400 font-medium">
                    Upload a logo to view it in 3D
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3 w-full h-auto bg-transparent">

                {/* AI Mockup Studio */}
                <AIMockupGenerator
                  svgContent={svgContent}
                  primaryColor={primaryColor}
                  onImageGenerated={setAiMockupImage}
                />

                {/* ── T-Shirt ──
                     multiply: white logo renders as ink on cotton fabric texture 
                     drop-shadow gives the logo a subtle fabric-pressed depth */}
                <div className="w-full aspect-[16/9] bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden relative border border-black/5">
                  <ImageMockup
                    label="T-Shirt"
                    imageUrl="/mockups/tshirt.png"
                    svgContent={svgContent}
                    logoColor={primaryColor}
                    size={mockupSize * 0.3}
                    svgStyles={{
                      container: {
                        mixBlendMode: 'multiply',
                        opacity: 0.88,
                      },
                      logo: {
                        top: '38%',
                        left: '50%',
                        filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.18))',
                      }
                    }}
                  />
                </div>

                {/* ── Business Card ──
                     Flat light card: multiply makes logo look foil-printed.
                     Slight opacity so card paper texture bleeds through */}
                <div className="w-full aspect-[16/9] bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden relative border border-black/5">
                  <ImageMockup
                    label="Business Card"
                    imageUrl="/mockups/business_card_flat.png"
                    svgContent={svgContent}
                    logoColor={primaryColor}
                    size={mockupSize * 0.35}
                    svgStyles={{
                      container: {
                        mixBlendMode: 'multiply',
                        opacity: 0.92,
                      },
                      logo: {
                        top: '50%',
                        left: '50%',
                        filter: 'drop-shadow(0px 0.5px 0.5px rgba(0,0,0,0.1))',
                      }
                    }}
                  />
                </div>

                {/* ── Concrete Wall ──
                     multiply blend makes the logo look applied / painted on the rough
                     concrete surface. Drop shadow gives wall mount depth */}
                <div className="w-full aspect-[16/9] bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden relative border border-black/5">
                  <ImageMockup
                    label="Wall"
                    imageUrl="/mockups/wall.png"
                    svgContent={svgContent}
                    logoColor={primaryColor}
                    size={mockupSize * 0.38}
                    svgStyles={{
                      container: {
                        mixBlendMode: 'multiply',
                        opacity: 0.82,
                      },
                      logo: {
                        top: '48%',
                        left: '65%',
                        filter: 'drop-shadow(0px 3px 6px rgba(0,0,0,0.22))',
                      }
                    }}
                  />
                </div>


              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
