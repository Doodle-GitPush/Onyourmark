"use client"

import React, { useEffect, useRef, useState } from 'react'
import type { MotionPreset } from '@/lib/brand'
import { INK, hexToRgb, mix } from '@/lib/color'
import { VERTEX, fragmentFor } from '@/lib/shaders'

interface ShaderCanvasProps {
    preset: MotionPreset
    /** The brand's two lead colours. */
    a: string
    b: string
    speed?: number
    /** Draw one frame and stop — thumbnails, exports, reduced motion. */
    still?: boolean
    className?: string
}

const vec = (hex: string) => hexToRgb(hex).map((v) => v / 255)

/** The base every preset paints over: ink with a breath of the primary. */
export const motionBase = (a: string) => mix(INK, a, 0.1)

/** A CSS stand-in for the shader — shown underneath it while WebGL spins
 *  up, and on its own wherever a live canvas would be wasteful. */
export const motionGradient = (a: string, b: string) =>
    `radial-gradient(60% 80% at 28% 38%, ${a} 0%, transparent 70%), radial-gradient(55% 75% at 76% 68%, ${b} 0%, transparent 70%), ${motionBase(a)}`

function compile(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return shader
}

export function ShaderCanvas({ preset, a, b, speed = 1, still = false, className }: ShaderCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [ready, setReady] = useState(false)
    // Read by the frame loop — colour and speed changes shouldn't rebuild
    // the GL program, only the next frame.
    const live = useRef({ a, b, speed, still })
    useEffect(() => {
        live.current = { a, b, speed, still }
    }, [a, b, speed, still])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        // preserveDrawingBuffer so a PDF export can read the frame back.
        const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: true, powerPreference: 'low-power' })
        if (!gl) return

        const program = gl.createProgram()!
        gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
        gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentFor(preset)))
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
        gl.useProgram(program)

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const loc = gl.getAttribLocation(program, 'p')
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

        const u = (name: string) => gl.getUniformLocation(program, name)
        const uRes = u('u_res'), uTime = u('u_time'), uA = u('u_a'), uB = u('u_b'), uBg = u('u_bg')

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        // Shader time, advanced by speed each frame so a speed change
        // bends the motion instead of jumping it. Starts mid-flow so even a
        // single still frame shows the preset developed.
        let time = 40
        let last = performance.now()
        let raf = 0
        let timer = 0
        let stopped = false

        const draw = () => {
            // Soft backgrounds don't need retina pixels — capping the
            // resolution keeps a full-screen shader cheap.
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
            const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
            const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
            }
            gl.viewport(0, 0, w, h)
            const s = live.current
            gl.uniform2f(uRes, w, h)
            gl.uniform1f(uTime, time)
            gl.uniform3fv(uA, vec(s.a))
            gl.uniform3fv(uB, vec(s.b))
            gl.uniform3fv(uBg, vec(motionBase(s.a)))
            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }

        const frame = (now: number) => {
            if (stopped) return
            const s = live.current
            const frozen = s.still || reduced
            if (!frozen) time += Math.min(0.1, (now - last) / 1000) * s.speed
            last = now
            draw()
            // A frozen canvas still repaints, slowly, so colour edits show.
            if (frozen) timer = window.setTimeout(() => { raf = requestAnimationFrame(frame) }, 250)
            else raf = requestAnimationFrame(frame)
        }
        raf = requestAnimationFrame((now) => {
            frame(now)
            setReady(true)
        })

        return () => {
            stopped = true
            cancelAnimationFrame(raf)
            clearTimeout(timer)
            // Browsers cap live WebGL contexts; hand this one back now
            // rather than waiting for garbage collection.
            gl.getExtension('WEBGL_lose_context')?.loseContext()
        }
    }, [preset])

    return (
        <div className={className} style={{ background: motionGradient(a, b) }}>
            {/* Keyed by preset: a context that's been handed back can't be
                reused, so each preset gets a fresh canvas. */}
            <canvas
                key={preset}
                ref={canvasRef}
                className="w-full h-full block transition-opacity duration-700"
                style={{ opacity: ready ? 1 : 0 }}
            />
        </div>
    )
}
