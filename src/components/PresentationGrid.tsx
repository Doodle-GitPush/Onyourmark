import React from 'react'

interface PresentationGridProps {
    svgContent: string
    primaryColor: string
    secondaryColor: string
    size: number
}

export function PresentationGrid({ svgContent, primaryColor, secondaryColor, size }: PresentationGridProps) {

    // Helper to colorize the SVG
    const getColoredSvg = (color: string) => {
        if (!svgContent) return ''
        return svgContent
            .replace(/fill="[^"]*"/g, `fill="${color}"`)
            .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
            .replace(/style="[^"]*"/g, '') // strip inline styles to force attributes
    }

    const renderBlock = (bgColor: string, logoColor: string) => (
        <div
            className="w-full aspect-[16/9] flex flex-col items-center justify-center rounded-xl overflow-hidden relative border border-white/[0.08]"
            style={{ backgroundColor: bgColor }}
        >
            <div
                className="transition-all duration-300 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                style={{ width: `${size}%`, height: `${size}%` }}
                dangerouslySetInnerHTML={{ __html: getColoredSvg(logoColor) }}
            />
        </div>
    )

    return (
        <div className="flex flex-col gap-3 w-full h-auto">
            {renderBlock(primaryColor, '#ffffff')}
            {renderBlock(secondaryColor, '#ffffff')}
            {renderBlock('#ffffff', '#000000')}
            {renderBlock('#000000', '#ffffff')}
        </div>
    )
}
