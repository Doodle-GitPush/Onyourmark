"use client"

import React, { useMemo, useRef, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, Lightformer, MeshReflectorMaterial, MeshTransmissionMaterial, Center } from "@react-three/drei"
import { EffectComposer, Bloom, Vignette, N8AO } from "@react-three/postprocessing"
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js"
import * as THREE from "three"

export type LogoMaterial = "chrome" | "glass" | "gold" | "matte" | "holo"

interface Logo3DViewerProps {
    svgContent: string
    color: string
    material: LogoMaterial
    autoRotate: boolean
    extrudeDepth?: number
}

const MATERIAL_PRESETS: Record<LogoMaterial, (color: string) => React.ReactElement> = {
    chrome: (color) => (
        <meshPhysicalMaterial
            color={color}
            metalness={1}
            roughness={0.12}
            clearcoat={1}
            clearcoatRoughness={0.1}
            envMapIntensity={2}
        />
    ),
    glass: (color) => (
        // meshPhysicalMaterial's built-in `transmission` relies on the
        // renderer's implicit background-capture pass, which the
        // EffectComposer/N8AO pipeline below breaks — it renders as a flat,
        // still-opaque, still-colored block instead of transparent. drei's
        // MeshTransmissionMaterial does its own manual background capture
        // via an FBO each frame, independent of post-processing, so it
        // stays transparent regardless of what runs after it.
        // Color is applied via attenuation (how a real tinted glass picks up
        // hue over distance) rather than a flat multiply, so it reads as
        // tinted glass instead of solid colored plastic.
        <MeshTransmissionMaterial
            color="#ffffff"
            attenuationColor={color}
            attenuationDistance={2.5}
            transmission={0.94}
            thickness={1.5}
            roughness={0.1}
            ior={1.5}
            chromaticAberration={0.04}
            clearcoat={1}
            clearcoatRoughness={0.1}
            envMapIntensity={2.4}
            samples={6}
            resolution={512}
            backside
        />
    ),
    gold: () => (
        // Ignores the brand color on purpose — "Gold" implies its own hue,
        // same as real gold plating wouldn't turn blue because your logo is.
        // Yellow has roughly double blue's perceived luminance for the same
        // RGB "brightness" (Rec.709 luma weights green/red far above blue),
        // so a normal-looking gold hex blows out under Bloom across the
        // whole surface instead of just specular highlights. Using a deeper
        // antique-gold tone keeps its luma in the same range as the other
        // (bluer) presets that already look right under this lighting.
        <meshPhysicalMaterial
            color="#7A5F22"
            metalness={1}
            roughness={0.3}
            clearcoat={0.6}
            clearcoatRoughness={0.3}
            envMapIntensity={1.2}
        />
    ),
    matte: (color) => (
        <meshStandardMaterial
            color={color}
            metalness={0}
            roughness={0.8}
            envMapIntensity={0.6}
        />
    ),
    holo: (color) => (
        <meshPhysicalMaterial
            color={color}
            metalness={0.7}
            roughness={0.12}
            iridescence={1}
            iridescenceIOR={1.4}
            iridescenceThicknessRange={[100, 500]}
            envMapIntensity={1.8}
        />
    ),
}

function ExtrudedLogo({ svgContent, color, material, extrudeDepth = 6 }: Omit<Logo3DViewerProps, "autoRotate">) {
    const groupRef = useRef<THREE.Group>(null)

    const geometries = useMemo(() => {
        try {
            const loader = new SVGLoader()
            const data = loader.parse(svgContent)
            const shapes: { shape: THREE.Shape }[] = []

            data.paths.forEach((path) => {
                const pathShapes = SVGLoader.createShapes(path)
                pathShapes.forEach((shape) => shapes.push({ shape }))
            })

            if (shapes.length === 0) return []

            const geoms = shapes.map(({ shape }) => {
                const geom = new THREE.ExtrudeGeometry(shape, {
                    depth: extrudeDepth,
                    bevelEnabled: true,
                    bevelThickness: 1.2,
                    bevelSize: 0.8,
                    bevelSegments: 5,
                    curveSegments: 32,
                })
                geom.computeVertexNormals()
                return geom
            })

            return geoms
        } catch (e) {
            console.warn("Failed to parse SVG for 3D extrusion", e)
            return []
        }
    }, [svgContent, extrudeDepth])

    // Normalize scale/orientation: SVG y-axis is flipped vs three.js
    const { scale, offset } = useMemo(() => {
        if (geometries.length === 0) return { scale: 1, offset: [0, 0, 0] as [number, number, number] }
        const box = new THREE.Box3()
        geometries.forEach((g) => {
            g.computeBoundingBox()
            if (g.boundingBox) box.union(g.boundingBox)
        })
        const size = new THREE.Vector3()
        box.getSize(size)
        const maxDim = Math.max(size.x, size.y, 1)
        const s = 20 / maxDim
        const center = new THREE.Vector3()
        box.getCenter(center)
        return { scale: s, offset: [-center.x, -center.y, -center.z] as [number, number, number] }
    }, [geometries])

    if (geometries.length === 0) return null

    return (
        <group ref={groupRef} rotation={[Math.PI, 0, 0]} scale={scale}>
            <group position={offset}>
                {geometries.map((geom, i) => (
                    <mesh key={i} geometry={geom} castShadow receiveShadow>
                        {MATERIAL_PRESETS[material](color)}
                    </mesh>
                ))}
            </group>
        </group>
    )
}

function Rig({ autoRotate }: { autoRotate: boolean }) {
    const { camera } = useThree()
    useFrame(() => {
        camera.lookAt(0, 0, 0)
    })
    return (
        <OrbitControls
            makeDefault
            autoRotate={autoRotate}
            autoRotateSpeed={2.2}
            enablePan={false}
            minDistance={20}
            maxDistance={90}
            enableDamping
            dampingFactor={0.08}
        />
    )
}

/** A real, camera-visible lit panel behind the object. `Environment`'s
 *  lightformers below are baked into a cubemap for reflections only — they
 *  aren't geometry the camera can actually see, so `MeshTransmissionMaterial`
 *  (which renders what's really behind the object each frame, not the
 *  reflection cubemap) sees nothing but the fog-faded void through it. This
 *  panel gives glass something bright to show — the same reason product
 *  photographers light glass from a card behind the subject rather than
 *  shooting it against a bare black backdrop.
 *
 *  Only rendered for the glass preset: every other material is opaque, so
 *  it doesn't need anything to show "through" it — it would just show up
 *  as an unwanted visible rectangle behind them, breaking the void the
 *  rest of the UI is built around. */
function Backdrop() {
    return (
        <mesh position={[0, 4, -22]}>
            <planeGeometry args={[50, 40]} />
            <meshStandardMaterial color="#4a4a52" roughness={0.9} />
        </mesh>
    )
}

/** Glossy studio floor — grounds the object with a soft reflection instead
 *  of a flat contact shadow, without needing a real environment capture. */
function Floor() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -13, 0]} receiveShadow>
            <planeGeometry args={[200, 200]} />
            <MeshReflectorMaterial
                blur={[400, 100]}
                resolution={512}
                mixBlur={1}
                mixStrength={12}
                roughness={1}
                depthScale={1}
                minDepthThreshold={0.85}
                color="#050505"
                metalness={0.2}
                mirror={0}
            />
        </mesh>
    )
}

export function Logo3DViewer({ svgContent, color, material, autoRotate }: Logo3DViewerProps) {
    if (!svgContent) return null

    return (
        <div className="w-full h-[60vh] min-h-[420px] relative">
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ position: [0, 0, 55], fov: 35 }}
                gl={{ antialias: true, preserveDrawingBuffer: true }}
            >
                {/* Fades the floor into the page's own void instead of showing a
                    hard horizon line — keeps the studio floor from reading as a
                    visible "backdrop" against the ultra-minimal page background. */}
                <fog attach="fog" args={['#0A0A0A', 60, 100]} />
                <ambientLight intensity={0.5} />
                {/* Key light */}
                <directionalLight
                    position={[30, 40, 30]}
                    intensity={1.6}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                {/* Cool fill, opposite the key */}
                <directionalLight position={[-30, 10, -20]} intensity={0.6} color="#a0c4ff" />
                {/* Brand-tinted rim light for edge definition */}
                <directionalLight position={[0, 10, -35]} intensity={0.8} color="#FF4800" />

                <Suspense fallback={null}>
                    <Center>
                        <ExtrudedLogo svgContent={svgContent} color={color} material={material} />
                    </Center>
                    {material === 'glass' && <Backdrop />}
                    <Floor />
                </Suspense>

                {/* Procedural (network-free) studio softbox rig — avoids depending on
                    a remote HDR fetch that can fail/be blocked. Three softboxes plus
                    a front fill facing the camera, since metal/chrome reflects almost
                    nothing without a light source roughly opposite the viewer. */}
                <Environment resolution={256}>
                    <Lightformer form="rect" intensity={5} rotation-x={Math.PI / 2} position={[0, 12, -6]} scale={[10, 10, 1]} />
                    <Lightformer form="rect" intensity={2.5} rotation-y={Math.PI / 2} position={[-14, 2, 0]} scale={[10, 6, 1]} />
                    <Lightformer form="rect" intensity={2.5} rotation-y={-Math.PI / 2} position={[14, 2, 0]} scale={[10, 6, 1]} />
                    <Lightformer form="rect" intensity={3} position={[0, 0, 30]} scale={[24, 24, 1]} color="#ffffff" />
                    <Lightformer form="ring" color="#FF4800" intensity={2.5} scale={5} position={[0, -6, 6]} rotation-x={Math.PI / 3} />
                </Environment>

                <EffectComposer enableNormalPass multisampling={0}>
                    <N8AO aoRadius={4} intensity={1.5} distanceFalloff={1} />
                    <Bloom mipmapBlur luminanceThreshold={1.05} intensity={0.5} />
                    <Vignette eskil={false} offset={0.15} darkness={0.6} />
                </EffectComposer>

                <Rig autoRotate={autoRotate} />
            </Canvas>
        </div>
    )
}
