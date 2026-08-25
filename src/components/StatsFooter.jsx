import React from 'react';
import { Sparkles, Terminal, HardDrive, Cpu } from 'lucide-react';

export function StatsFooter({ totalCount, photoCount, videoCount, viewMode }) {
  return (
    <footer className="w-full py-8 border-t border-white/5 bg-[#0a0a0c]/90 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-400">
        
        {/* Left: Brand info */}
        <div className="flex items-center gap-3">
          <span className="text-white font-serif font-semibold">Haikel Spatial Gallery</span>
          <span>•</span>
          <span>Cinematic Spatial Noir</span>
          <span>•</span>
          <span className="text-amber-400/90">2026 Archive Edition</span>
        </div>

        {/* Center: System metrics */}
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-neutral-400">
            <HardDrive className="w-3.5 h-3.5 text-sky-400" />
            <span>Google Drive Direct Stream</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-neutral-400">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>2.5D Inertia Physics</span>
          </span>
        </div>

        {/* Right: Keyboard Shortcuts */}
        <div className="hidden lg:flex items-center gap-2 text-[10px] text-neutral-400">
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">ESC</span> Close
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">← →</span> Navigate
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">SPACE</span> Play/Pause
        </div>

      </div>
    </footer>
  );
}
