import React from 'react'

interface LogoStyle extends React.CSSProperties {
    transform?: string
}

interface ImageMockupProps {
    svgContent: string
    logoColor: string
    size: number
    imageUrl: string
    svgStyles: {
        container?: React.CSSProperties
        logo?: LogoStyle
    }
    label?: string
}

export function ImageMockup({ svgContent, logoColor, size, imageUrl, svgStyles, label }: ImageMockupProps) {
    const getColoredSvg = (color: string) => {
        if (!svgContent) return ''
        return svgContent
            .replace(/fill="[^"]*"/g, `fill="${color}"`)
            .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
    }

    // Combine the mandatory centering translate with any extra transform from svgStyles
    const extraTransform = svgStyles.logo?.transform ?? ''
    const combinedTransform = `translate(-50%, -50%) ${extraTransform}`.trim()

    // Pull out transform from logo styles so we can override it cleanly
    const { transform: _ignored, ...restLogoStyles } = svgStyles.logo ?? {}

    return (
        <div className="w-full h-full relative rounded-lg overflow-hidden border shadow-sm">
            {/* Background photo fills the whole card */}
            <img
                src={imageUrl}
                alt="Mockup Background"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                crossOrigin="anonymous"
                draggable={false}
            />

            {/* Logo overlay — positioned absolutely, blended onto the surface */}
            {svgContent && (
                <div
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{
                        ...svgStyles.container,
                        opacity: svgContent ? (svgStyles.container?.opacity ?? 1) : 0,
                        transition: 'opacity 0.3s',
                    }}
                >
                    <div
                        className="absolute flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-full"
                        style={{
                            ...restLogoStyles,
                            width: `${size}%`,
                            transform: combinedTransform,
                        }}
                        dangerouslySetInnerHTML={{ __html: getColoredSvg(logoColor) }}
                    />
                </div>
            )}

            {/* Subtle surface label */}
            {label && (
                <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/20 backdrop-blur-sm text-white text-[10px] font-semibold tracking-widest uppercase select-none pointer-events-none">
                    {label}
                </div>
            )}
        </div>
    )
}
