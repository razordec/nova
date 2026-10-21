'use client'
import '@google/model-viewer'

interface ARViewerProps {
  modelUrl: string
}

export function ARViewer({ modelUrl }: ARViewerProps) {
  return (
    <model-viewer
      src={modelUrl}
      ar
      ar-modes="webxr scene-viewer quick-look"
      camera-controls
      auto-rotate
      shadow-intensity="1"
      style={{ width: '100%', height: '300px', backgroundColor: '#f0f0f0' }}
    >
      <button slot="ar-button" className="absolute bottom-4 right-4 rounded bg-white px-4 py-2 shadow">
        View in your space
      </button>
    </model-viewer>
  )
}