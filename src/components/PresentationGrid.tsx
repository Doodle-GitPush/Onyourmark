import React, { useState } from 'react'

interface PresentationGridProps {
    svgContent: string
    primaryColor: string
    secondaryColor: string
    size: number
}

type Variant = 'primary' | 'secondary' | 'white' | 'black'

export function PresentationGrid({ svgContent, primaryColor, secondaryColor, size }: PresentationGridProps) {
    const [variant, setVariant] = useState<Variant>('primary')

    const variants: { key: Variant; label: string; bg: string; logo: string }[] = [
        { key: 'primary', label: 'Primary', bg: primaryColor, logo: '#ffffff' },
        { key: 'secondary', label: 'Secondary', bg: secondaryColor, logo: '#ffffff' },
        { key: 'white', label: 'White', bg: '#ffffff', logo: '#000000' },
        { key: 'black', label: 'Black', bg: '#000000', logo: '#ffffff' },
    ]

    const active = variants.find(v => v.key === variant)!

    const getColoredSvg = (color: string) => {
        if (!svgContent) return ''
        return svgContent
            .replace(/fill="[^"]*"/g, `fill="${color}"`)
            .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
            .replace(/style="[^"]*"/g, '')
    }

    return (
        <div>
            <div className="flex items-center gap-5">
                {variants.map(v => (
                    <button
                        key={v.key}
                        onClick={() => setVariant(v.key)}
                        className={`text-[11px] tracking-wide transition-colors ${variant === v.key ? 'text-zinc-100 underline underline-offset-8 decoration-[#FF4800]' : 'text-zinc-600 hover:text-zinc-300'}`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            <div
                className="mt-5 w-full aspect-[16/9] flex items-center justify-center rounded-2xl overflow-hidden transition-colors duration-300"
                style={{ backgroundColor: active.bg }}
            >
                <div
                    className="transition-all duration-300 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                    style={{ width: `${size}%`, height: `${size}%` }}
                    dangerouslySetInnerHTML={{ __html: getColoredSvg(active.logo) }}
                />
            </div>
        </div>
    )
}
