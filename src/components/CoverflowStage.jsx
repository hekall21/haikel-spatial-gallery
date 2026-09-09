import React, { useState, useMemo } from 'react';
import { CoverflowCarousel } from '@/components/ui/coverflow-carousel';
import { Sparkles, Sliders, Layers, Eye, RotateCw } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export function CoverflowStage({ items, onSelect }) {
  const [depth, setDepth] = useState(0.6);
  const [rotate, setRotate] = useState(44);
  const [perspective, setPerspective] = useState(3);
  const [showMeta, setShowMeta] = useState(true);

  // Adapt media items to Coverflow slides
  const slides = useMemo(() => {
    if (!items || items.length === 0) return [];
    
    // Take up to 24 items for buttery smooth 60fps 3D performance
    return items.slice(0, 24).map((item, idx) => ({
      src: item.thumbnailUrl || item.mediaUrl || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=640&h=640&fit=crop&q=70',
      alt: item.title || `Visual Capture #${idx + 1}`,
      title: item.title || `Visual Frame #${idx + 1}`,
      subtitle: `${item.category || 'Curated'} • ${item.location || 'Creative Archive'}`,
      meta: [
        { label: 'Camera', value: item.camera || 'Sony Alpha FX3' },
        { label: 'Settings', value: item.settings || '1/250s • f/1.8 • ISO 200' },
        { label: 'Type', value: item.type === 'video' ? '4K Cinema Video' : 'High-Res Still' },
      ],
      rawItem: item
    }));
  }, [items]);

  const handleCardSelect = (index) => {
    soundEngine.playClick();
    if (slides[index] && slides[index].rawItem && onSelect) {
      onSelect(slides[index].rawItem);
    }
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-140px)] flex flex-col justify-center items-center py-6 px-4 select-none">
      {/* Stage Header & Controller HUD */}
      <div className="z-10 flex flex-wrap items-center justify-between gap-4 w-full max-w-5xl mb-4 px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white tracking-wide uppercase text-[11px]">3D Coverflow Mode</span>
          <span className="text-zinc-500 font-mono">({slides.length} cards in ring)</span>
        </div>

        {/* Quick Tuning Knobs */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-zinc-400">Tilt:</span>
            <input 
              type="range" 
              min="20" 
              max="70" 
              value={rotate} 
              onChange={(e) => setRotate(Number(e.target.value))}
              className="w-20 h-1.5 bg-zinc-800 rounded-lg accent-sky-400 cursor-pointer" 
            />
            <span className="font-mono text-[10px] text-zinc-400">{rotate}°</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-zinc-400">Depth:</span>
            <input 
              type="range" 
              min="0.2" 
              max="1.2" 
              step="0.1" 
              value={depth} 
              onChange={(e) => setDepth(Number(e.target.value))}
              className="w-20 h-1.5 bg-zinc-800 rounded-lg accent-sky-400 cursor-pointer" 
            />
            <span className="font-mono text-[10px] text-zinc-400">{depth}x</span>
          </label>

          <button
            onClick={() => setShowMeta(!showMeta)}
            className={`px-2.5 py-1 rounded-lg border transition-all text-[11px] ${
              showMeta 
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' 
                : 'bg-zinc-900 text-zinc-400 border-zinc-700'
            }`}
          >
            Metadata {showMeta ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* 3D Carousel Viewport */}
      <div className="w-full max-w-6xl relative my-auto">
        {slides.length > 0 ? (
          <CoverflowCarousel
            slides={slides}
            rotate={rotate}
            depth={depth}
            perspective={perspective}
            cardWidth="clamp(220px, 26vw, 340px)"
            showCaption={showMeta}
            showNavigation={true}
            showPagination={true}
            gap={0.06}
            loop={true}
          />
        ) : (
          <div className="text-center py-20 text-zinc-500">
            No media found matching current filter.
          </div>
        )}
      </div>

      {/* Interaction Hint */}
      <p className="mt-4 text-center text-xs text-zinc-500 font-mono tracking-wider">
        DRAG HORIZONTALLY OR USE ARROW KEYS [← / →] TO GLIDE
      </p>
    </div>
  );
}