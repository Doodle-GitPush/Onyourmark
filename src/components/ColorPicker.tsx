"use client"

import React, { useState, useRef, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'

interface ColorPickerProps {
    primaryColor: string
    secondaryColor: string
    onPrimaryChange: (color: string) => void
    onSecondaryChange: (color: string) => void
}

export function ColorPickerDuo({ primaryColor, secondaryColor, onPrimaryChange, onSecondaryChange }: ColorPickerProps) {
    const [activeColor, setActiveColor] = useState<'primary' | 'secondary' | null>(null)
    const [hexInput, setHexInput] = useState('')
    const panelRef = useRef<HTMLDivElement>(null)

    const currentColor = activeColor === 'primary' ? primaryColor : secondaryColor
    const currentOnChange = activeColor === 'primary' ? onPrimaryChange : onSecondaryChange

    useEffect(() => {
        if (activeColor) {
            setHexInput(currentColor.toUpperCase())
        }
    }, [activeColor, currentColor])

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setActiveColor(null)
            }
        }
        if (activeColor) document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [activeColor])

    const handleHexChange = (val: string) => {
        setHexInput(val.toUpperCase())
        if (/^#[0-9A-F]{6}$/i.test(val)) {
            currentOnChange(val)
        }
    }

    const handleToggle = (which: 'primary' | 'secondary') => {
        setActiveColor(prev => prev === which ? null : which)
    }

    const swatch = (which: 'primary' | 'secondary', label: string, color: string) => (
        <button
            onClick={() => handleToggle(which)}
            className="flex items-center gap-2.5 group"
        >
            <span
                className={`w-6 h-6 rounded-full flex-shrink-0 transition-transform group-hover:scale-110 ${activeColor === which ? 'ring-2 ring-offset-2 ring-offset-[#0A0A0A] ring-[#FF4800]' : ''}`}
                style={{ backgroundColor: color }}
            />
            <span className="text-left">
                <span className="block text-[9px] uppercase tracking-widest text-zinc-600">{label}</span>
                <span className="block text-[12px] font-mono text-zinc-300">{color.toUpperCase()}</span>
            </span>
        </button>
    )

    return (
        <div className="relative" ref={panelRef}>
            <div className="flex items-center gap-8">
                {swatch('primary', 'Primary', primaryColor)}
                {swatch('secondary', 'Secondary', secondaryColor)}
            </div>

            {activeColor && (
                <div className="absolute left-0 top-full mt-4 z-20 w-[220px] rounded-xl bg-[#151517] shadow-[0_16px_48px_rgba(0,0,0,0.55)] p-4">
                    <div className="color-picker-apple">
                        <HexColorPicker color={currentColor} onChange={currentOnChange} />
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <div
                            className="w-6 h-6 rounded-full flex-shrink-0 transition-colors duration-200"
                            style={{ backgroundColor: currentColor }}
                        />
                        <input
                            type="text"
                            value={hexInput}
                            onChange={(e) => handleHexChange(e.target.value)}
                            onBlur={() => {
                                if (!/^#[0-9A-F]{6}$/i.test(hexInput)) {
                                    setHexInput(currentColor.toUpperCase())
                                }
                            }}
                            maxLength={7}
                            className="flex-1 text-[12px] font-mono text-zinc-200 bg-transparent border-b border-zinc-700 px-0.5 py-1 focus:outline-none focus:border-[#FF4800] transition-colors"
                            placeholder="#000000"
                        />
                    </div>

                    <div className="mt-3 flex gap-1.5 flex-wrap">
                        {['#000000', '#FFFFFF', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55'].map((c) => (
                            <button
                                key={c}
                                onClick={() => currentOnChange(c)}
                                className={`w-4 h-4 rounded-full hover:scale-125 transition-transform ${c === '#FFFFFF' ? 'ring-1 ring-inset ring-white/20' : ''}`}
                                style={{ backgroundColor: c }}
                                title={c}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
