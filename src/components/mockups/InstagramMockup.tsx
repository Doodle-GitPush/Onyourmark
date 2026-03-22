// Re-writing InstagramMockup correctly closed
import React from 'react'

interface InstagramMockupProps {
    svgContent: string
    logoColor: string
    size: number
}

export function InstagramMockup({ svgContent, logoColor, size }: InstagramMockupProps) {
    const getColoredSvg = (color: string) => {
        if (!svgContent) return ''
        return svgContent
            .replace(/fill="[^"]*"/g, `fill="${color}"`)
            .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
    }

    return (
        <div className="w-full h-full bg-white rounded-lg overflow-hidden border shadow-sm flex flex-col items-center pt-12 relative max-w-sm mx-auto">
            {/* IG Header */}
            <div className="w-full px-6 flex items-center justify-between mb-8">
                <div className="w-6 h-6 rounded-full bg-slate-200" />
                <div className="font-semibold text-sm">@brand_identity</div>
                <div className="w-6 h-6 rounded-full bg-slate-200" />
            </div>

            {/* Profile Info */}
            <div className="flex px-6 w-full items-center gap-6 mb-6">
                {/* The Avatar */}
                <div className="relative w-24 h-24 rounded-full bg-slate-50 border p-1 shadow-inner flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <div
                        className="flex items-center justify-center transition-all duration-300 z-10 [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                        style={{ width: `${Math.max(40, size)}%`, height: `${Math.max(40, size)}%` }}
                        dangerouslySetInnerHTML={{ __html: getColoredSvg(logoColor) }}
                    />
                    {/* Gradient ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 [background-origin:border-box] [background-clip:content-box,border-box] p-[2px]" style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
                </div>

                {/* Stats */}
                <div className="flex flex-1 justify-between text-center">
                    <div>
                        <div className="font-bold text-lg">1,204</div>
                        <div className="text-xs text-slate-500">Posts</div>
                    </div>
                    <div>
                        <div className="font-bold text-lg">89.2K</div>
                        <div className="text-xs text-slate-500">Followers</div>
                    </div>
                    <div>
                        <div className="font-bold text-lg">432</div>
                        <div className="text-xs text-slate-500">Following</div>
                    </div>
                </div>
            </div>

            <div className="w-full px-6 mb-6 mt-4">
                <div className="font-bold text-sm mb-1">Brand Identity Studio</div>
                <div className="text-sm text-slate-600 mb-4">Designing the future of your brand.<br />#logo #design</div>
                <div className="w-full py-1.5 bg-slate-100 rounded-md text-center text-sm font-semibold cursor-pointer hover:bg-slate-200 transition-colors">Follow</div>
            </div>

            {/* Grid */}
            <div className="w-full flex border-t">
                <div className="flex-1 py-3 flex justify-center border-b-2 border-black">
                    <div className="w-4 h-4 bg-black rounded-sm" />
                </div>
                <div className="flex-1 py-3 flex justify-center text-slate-300">
                    <div className="w-4 h-4 rounded-full border-2 border-current" />
                </div>
            </div>

            <div className="w-full flex-1 grid grid-cols-3 gap-0.5 bg-slate-100">
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="aspect-square bg-slate-200" />
                ))}
            </div>
        </div>
    )
}
