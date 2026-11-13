"use client"

import React, { useLayoutEffect, useRef } from 'react'

interface EditableProps {
    value: string | undefined
    /** Omit to render plain, non-editable text. */
    onChange?: (value: string) => void
    placeholder?: string
    /** Let Enter add a line instead of committing. */
    multiline?: boolean
    className?: string
    style?: React.CSSProperties
}

/**
 * Text you rewrite in place, on the slide itself. Commits on blur or
 * Enter; Escape puts the old text back. Uncontrolled while focused — the
 * DOM owns the text mid-edit, so a re-render can't fight the caret.
 */
export function Editable({ value, onChange, placeholder, multiline, className = '', style }: EditableProps) {
    const ref = useRef<HTMLDivElement>(null)

    useLayoutEffect(() => {
        const el = ref.current
        if (el && document.activeElement !== el && el.textContent !== (value ?? '')) el.textContent = value ?? ''
    }, [value])

    if (!onChange) {
        return value ? <div className={className} style={style}>{value}</div> : null
    }

    return (
        <div
            ref={ref}
            role="textbox"
            aria-label={placeholder}
            aria-multiline={multiline}
            tabIndex={0}
            contentEditable="plaintext-only"
            suppressContentEditableWarning
            spellCheck={false}
            data-placeholder={placeholder}
            className={`editable ${className}`}
            style={style}
            onKeyDown={(e) => {
                // Slides sit inside clickable, keyboard-navigable chrome.
                e.stopPropagation()
                if (e.key === 'Enter' && (!multiline || !e.shiftKey)) {
                    e.preventDefault()
                    e.currentTarget.blur()
                } else if (e.key === 'Escape') {
                    e.currentTarget.textContent = value ?? ''
                    e.currentTarget.blur()
                }
            }}
            onBlur={(e) => {
                const next = e.currentTarget.innerText.replace(/\s+$/g, '').replace(/^\s+/g, '')
                e.currentTarget.textContent = next
                if (next !== (value ?? '')) onChange(next)
            }}
        />
    )
}
