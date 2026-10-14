"use client"

import * as React from "react"
import GlassFolder, { type FolderFile } from "@/components/ui/glass-folder-cards"

/**
 * Spatial Glass Folders Showcase
 * Real interactive 3D frosted glass folders for gallery albums.
 */
export default function GlassFolderCardsDemo({ onFileSelect }: { onFileSelect?: (file: FolderFile) => void }) {
  return (
    <div
      className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-transparent px-6 py-12"
      style={{ minHeight: "85vh" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 text-white opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1.1px, transparent 1.4px)",
          backgroundSize: "24px 24px",
        }}
      />
      
      <div className="relative mb-12 text-center max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sky-400 text-xs font-mono mb-4">
          <span>SPATIAL ALBUMS & ARCHIVES</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
          Frosted Glass Portfolios
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400">
          Domain-warped procedural liquid art panels, physics spring hinge, and interactive sheet layers.
        </p>
      </div>

      <div className="relative grid max-w-[1180px] grid-cols-1 items-end justify-items-center gap-x-14 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
        {/* Folder 1: Cinematic Urban Stills */}
        <GlassFolder
          label="Urban Stills"
          art="aurora"
          seed={3}
          appearDelay={0}
          onFileSelect={(file) => onFileSelect?.(file)}
          files={[
            {
              name: "Night In Shinjuku",
              meta: "Sony A7IV • 50mm",
              image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80",
            },
            {
              name: "Neon Crosswalk",
              meta: "Fujifilm X-T5",
              image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80",
            },
            {
              name: "Metropolis Grid",
              meta: "RAW • 42 MB",
              art: "ember",
            },
          ]}
        />

        {/* Folder 2: Creative Film Edits */}
        <GlassFolder
          label="Cinematic Edits"
          art="ember"
          action="more"
          labelPlacement="top-left"
          appearDelay={140}
          onFileSelect={(file) => onFileSelect?.(file)}
          files={[
            {
              name: "Cyberpunk Alley",
              meta: "Color Grade v4",
              image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&q=80",
            },
            {
              name: "Moody Rainscape",
              meta: "ProRes 422",
              art: "dusk",
            },
            {
              name: "Tokyo Midnight",
              meta: "LUT 33-point",
              image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
            },
            {
              name: "Project Timeline.fcp",
              meta: "XML • 4.2 MB",
            },
          ]}
          menu={[
            { label: "Share Album" },
            { label: "Download Archive" },
            { label: "Clear Cache", danger: true },
          ]}
        />

        {/* Folder 3: Editorial Portraits */}
        <GlassFolder
          label="Studio Vault"
          meta="Archive 2026"
          tone="dark"
          art="glacier"
          seed={11}
          action="add"
          labelPlacement="top-right"
          appearDelay={280}
          onFileSelect={(file) => onFileSelect?.(file)}
          files={[
            {
              name: "Minimalist Horizon",
              meta: "Hasselblad 907X",
              image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
            },
            {
              name: "Abstract Waves",
              meta: "Procedural",
              art: "verdant",
            },
            {
              name: "Studio Editorial #04",
              meta: "Leica SL2",
              art: "aurora",
            },
          ]}
        />
      </div>

      <p className="relative mt-14 font-mono text-[11px] tracking-[0.2em] text-neutral-500 uppercase">
        Hover to lean • Click to fan open • + to add sheet
      </p>
    </div>
  )
}
