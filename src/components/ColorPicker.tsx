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
    const contentRef = useRef<HTMLDivElement>(null)
    const [panelHeight, setPanelHeight] = useState(0)

    const currentColor = activeColor === 'primary' ? primaryColor : secondaryColor
    const currentOnChange = activeColor === 'primary' ? onPrimaryChange : onSecondaryChange

    useEffect(() => {
        if (activeColor) {
            setHexInput(currentColor.toUpperCase())
        }
    }, [activeColor, currentColor])

    // Measure content height for smooth animation
    useEffect(() => {
        if (activeColor && contentRef.current) {
            // Small delay to let the content render
            requestAnimationFrame(() => {
                setPanelHeight(contentRef.current?.scrollHeight || 0)
            })
        } else {
            setPanelHeight(0)
        }
    }, [activeColor])

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

    return (
        <div className="mt-8" ref={panelRef}>
            {/* Color swatches row */}
            <div className="grid grid-cols-2 gap-3">
                {/* Primary */}
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Primary Color</label>
                    <button
                        onClick={() => handleToggle('primary')}
                        className={`flex items-center gap-2.5 w-full border rounded-xl p-2 bg-white hover:border-slate-300 hover:shadow-sm transition-all group ${activeColor === 'primary' ? 'border-blue-400 ring-2 ring-blue-500/15 shadow-sm' : 'border-slate-200'}`}
                    >
                        <div
                            className="w-7 h-7 rounded-lg shadow-inner border border-black/10 flex-shrink-0 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: primaryColor }}
                        />
                        <span className="text-[11px] font-semibold text-slate-700 tracking-wide font-mono">
                            {primaryColor.toUpperCase()}
                        </span>
                    </button>
                </div>

                {/* Secondary */}
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Secondary Color</label>
                    <button
                        onClick={() => handleToggle('secondary')}
                        className={`flex items-center gap-2.5 w-full border rounded-xl p-2 bg-white hover:border-slate-300 hover:shadow-sm transition-all group ${activeColor === 'secondary' ? 'border-blue-400 ring-2 ring-blue-500/15 shadow-sm' : 'border-slate-200'}`}
                    >
                        <div
                            className="w-7 h-7 rounded-lg shadow-inner border border-black/10 flex-shrink-0 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: secondaryColor }}
                        />
                        <span className="text-[11px] font-semibold text-slate-700 tracking-wide font-mono">
                            {secondaryColor.toUpperCase()}
                        </span>
                    </button>
                </div>
            </div>

            {/* Animated expanding panel */}
            <div
                className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                style={{ maxHeight: activeColor ? `${panelHeight}px` : '0px', opacity: activeColor ? 1 : 0 }}
            >
                <div ref={contentRef} className="pt-3">
                    <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] border border-black/5 p-4">
                        {/* Picker */}
                        <div className="color-picker-apple">
                            <HexColorPicker color={currentColor} onChange={currentOnChange} />
                        </div>

                        {/* Hex input + swatch preview */}
                        <div className="mt-3 flex items-center gap-2">
                            <div
                                className="w-7 h-7 rounded-lg border border-black/10 shadow-inner flex-shrink-0 transition-colors duration-200"
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
                                className="flex-1 text-[12px] font-mono font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                placeholder="#000000"
                            />
                        </div>

                        {/* Quick presets */}
                        <div className="mt-3 flex gap-1.5 justify-center flex-wrap">
                            {['#000000', '#FFFFFF', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55'].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => currentOnChange(c)}
                                    className={`w-5 h-5 rounded-full border shadow-sm hover:scale-125 transition-transform ${c === '#FFFFFF' ? 'border-slate-300' : 'border-black/10'}`}
                                    style={{ backgroundColor: c }}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
