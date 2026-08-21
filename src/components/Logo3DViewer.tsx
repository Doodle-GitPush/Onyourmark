"use client"

import React, { useMemo, useRef, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, Lightformer, MeshReflectorMaterial, Center } from "@react-three/drei"
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
        <meshPhysicalMaterial
            color={color}
            metalness={0}
            roughness={0.02}
            transmission={0.95}
            thickness={1.2}
            ior={1.5}
            envMapIntensity={1.6}
            clearcoat={1}
        />
    ),
    gold: (color) => (
        <meshPhysicalMaterial
            color={color}
            metalness={1}
            roughness={0.24}
            clearcoat={0.7}
            clearcoatRoughness={0.25}
            envMapIntensity={1.6}
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
