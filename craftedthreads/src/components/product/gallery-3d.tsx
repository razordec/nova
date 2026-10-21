'use client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage } from '@react-three/drei'
import { Suspense } from 'react'

interface Gallery3DProps {
  modelUrl: string
}

export function Gallery3D({ modelUrl }: Gallery3DProps) {
  return (
    <div className="h-80 w-full rounded-lg bg-muted">
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5}>
            <model-loader src={modelUrl} />
          </Stage>
          <OrbitControls makeDefault />
        </Suspense>
      </Canvas>
    </div>
  )
}

// Simple loader component
function ModelLoader({ src }: { src: string }) {
  return null // Replace with GLTFLoader implementation
}