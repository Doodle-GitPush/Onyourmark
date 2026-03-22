import React from 'react'

interface WebMockupProps {
    svgContent: string
    logoColor: string
    size: number
}

// Custom Website Placeholder Mockup
export function WebMockup({ svgContent, logoColor, size }: WebMockupProps) {
    const getColoredSvg = (color: string) => {
        if (!svgContent) return ''
        return svgContent
            .replace(/fill="[^"]*"/g, `fill="${color}"`)
            .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
    }

    return (
        <div className="w-full h-full bg-[#f8fafc] rounded-lg overflow-hidden border shadow-sm flex flex-col relative">
            {/* Browser Bar */}
            <div className="h-10 bg-white border-b flex items-center px-4 gap-2 w-full z-10">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto w-1/2 h-5 bg-slate-100 rounded-md" />
            </div>

            {/* Hero Section */}
            <div className="flex-1 bg-white relative">
                <header className="h-16 px-8 flex justify-between items-center border-b border-slate-100">
                    {/* Logo Placement */}
                    <div
                        className="flex items-center transition-all duration-300 [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                        style={{ width: `${Math.max(20, size / 2)}px`, height: `${Math.max(20, size / 2)}px` }}
                        dangerouslySetInnerHTML={{ __html: getColoredSvg(logoColor) }}
                    />
                    <nav className="flex gap-6">
                        <div className="w-16 h-2 bg-slate-200 rounded" />
                        <div className="w-16 h-2 bg-slate-200 rounded" />
                        <div className="w-16 h-2 bg-slate-200 rounded" />
                    </nav>
                </header>

                {/* Fake Content */}
                <div className="p-12 w-[60%] flex flex-col gap-6">
                    <div className="w-3/4 h-8 bg-slate-800 rounded-lg" />
                    <div className="w-full h-4 bg-slate-200 rounded" />
                    <div className="w-5/6 h-4 bg-slate-200 rounded" />
                    <div className="w-32 h-10 mt-4 bg-blue-600 rounded-lg transition-transform hover:scale-105" />
                </div>

                {/* Floating Logo Appending */}
                <div
                    className="absolute right-12 top-32 opacity-10 pointer-events-none"
                    style={{ width: '400px', height: '400px' }}
                    dangerouslySetInnerHTML={{ __html: getColoredSvg(logoColor) }}
                />
            </div>
        </div>
    )
}
