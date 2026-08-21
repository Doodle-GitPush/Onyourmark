"use client"

import React, { useMemo, useRef, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, Lightformer, ContactShadows, Center } from "@react-three/drei"
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
            roughness={0.18}
            clearcoat={1}
            clearcoatRoughness={0.15}
            envMapIntensity={1.8}
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
            envMapIntensity={1.4}
            clearcoat={1}
        />
    ),
    gold: (color) => (
        <meshPhysicalMaterial
            color={color}
            metalness={1}
            roughness={0.28}
            clearcoat={0.6}
            clearcoatRoughness={0.3}
            envMapIntensity={1.3}
        />
    ),
    matte: (color) => (
        <meshStandardMaterial
            color={color}
            metalness={0}
            roughness={0.85}
        />
    ),
    holo: (color) => (
        <meshPhysicalMaterial
            color={color}
            metalness={0.7}
            roughness={0.15}
            iridescence={1}
            iridescenceIOR={1.4}
            iridescenceThicknessRange={[100, 500]}
            envMapIntensity={1.5}
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
                    bevelSegments: 3,
                    curveSegments: 24,
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

    useFrame((_, delta) => {
        // gentle idle bob handled by parent autorotate via OrbitControls
        void delta
    })

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

export function Logo3DViewer({ svgContent, color, material, autoRotate }: Logo3DViewerProps) {
    if (!svgContent) return null

    return (
        <div className="w-full h-[560px] rounded-xl overflow-hidden bg-gradient-to-b from-[#232328] via-[#18181c] to-[#0c0c0e] relative">
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ position: [0, 0, 55], fov: 35 }}
                gl={{ antialias: true, preserveDrawingBuffer: true }}
            >
                <ambientLight intensity={0.7} />
                <directionalLight
                    position={[30, 40, 30]}
                    intensity={1.6}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                <directionalLight position={[-30, 10, -20]} intensity={0.8} color="#a0c4ff" />

                <Suspense fallback={null}>
                    <Center>
                        <ExtrudedLogo svgContent={svgContent} color={color} material={material} />
                    </Center>
                </Suspense>

                {/* Procedural (network-free) environment for reflections — avoids
                    depending on a remote HDR fetch that can fail/be blocked. */}
                <Environment resolution={256}>
                    <group rotation={[-Math.PI / 3, 0, 1]}>
                        <Lightformer form="rect" intensity={6} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={8} />
                        <Lightformer form="circle" intensity={4} rotation-y={Math.PI / 2} position={[-8, 1, -1]} scale={4} />
                        <Lightformer form="circle" intensity={4} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={6} />
                        <Lightformer form="ring" color="#a78bfa" intensity={3} scale={6} position={[0, 6, -1]} />
                        <Lightformer form="rect" intensity={2.5} position={[0, -5, 8]} scale={6} rotation-x={-Math.PI / 2} />
                    </group>
                    {/* Front softbox facing the camera — chrome/metal reflects almost
                        nothing without a light source roughly opposite the viewer. */}
                    <Lightformer form="rect" intensity={3} position={[0, 0, 30]} scale={[24, 24, 1]} color="#ffffff" />
                </Environment>

                <ContactShadows position={[0, -14, 0]} opacity={0.5} scale={60} blur={2.5} far={20} />
                <Rig autoRotate={autoRotate} />
            </Canvas>
        </div>
    )
}
