import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  LayoutGrid, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Database, 
  Camera, 
  Film,
  Music,
  SlidersHorizontal,
  Download
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export function Navbar({ 
  viewMode, 
  setViewMode, 
  totalCount, 
  photoCount, 
  videoCount,
  onOpenSync,
  onResetCanvas,
  searchQuery,
  setSearchQuery
}) {
  const [isAmbient, setIsAmbient] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleAmbient = () => {
    soundEngine.playClick();
    const newState = soundEngine.toggleAmbient((active) => {
      setIsAmbient(active);
    });
    setIsAmbient(newState);
  };

  const handleToggleSfx = () => {
    const next = !isSfxMuted;
    setIsSfxMuted(next);
    soundEngine.setSfxMuted(next);
    if (!next) {
      soundEngine.playClick();
    }
  };

  const handleModeChange = (mode) => {
    soundEngine.playWhoosh();
    setViewMode(mode);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      scrolled ? 'bg-[#0a0a0c]/85 backdrop-blur-xl border-b border-white/10 shadow-2xl py-3' : 'bg-gradient-to-b from-[#0a0a0c]/90 via-[#0a0a0c]/50 to-transparent py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        
        {/* Brand & Monogram */}
        <div className="flex items-center gap-3.5">
          <div className="relative group cursor-pointer" onClick={() => handleModeChange('spatial')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-950 border border-white/15 flex items-center justify-center shadow-lg group-hover:border-sky-400/50 transition-all">
              <span className="text-base font-bold tracking-tighter text-white group-hover:text-sky-400 transition-colors">
                H<span className="text-amber-400">✦</span>
              </span>
            </div>
            <div className="absolute -inset-0.5 rounded-xl bg-sky-500/20 blur opacity-0 group-hover:opacity-100 transition duration-500" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-white font-serif">
                Haikel
              </h1>
              <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 border border-white/10 uppercase">
                Spatial Noir
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono tracking-wide hidden sm:flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {totalCount} Media Works Online • 190 Photos & 45 Videos
            </p>
          </div>
        </div>

        {/* Center: Mode Switcher (Spatial 2.5D vs Masonry Grid) */}
        <div className="flex items-center glass-pill p-1 rounded-full border border-white/10 shadow-inner">
          <button
            onClick={() => handleModeChange('spatial')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              viewMode === 'spatial'
                ? 'bg-white text-black shadow-md font-semibold'
                : 'text-neutral-300 hover:text-white hover:bg-white/5'
            }`}
            title="Spatial Canvas (Free Floating 2.5D Drag)"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Spatial Canvas</span>
            <span className="md:hidden">Spatial</span>
          </button>

          <button
            onClick={() => handleModeChange('masonry')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              viewMode === 'masonry'
                ? 'bg-white text-black shadow-md font-semibold'
                : 'text-neutral-300 hover:text-white hover:bg-white/5'
            }`}
            title="Curated Masonry Editorial Grid"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Editorial Grid</span>
            <span className="md:hidden">Grid</span>
          </button>
        </div>

        {/* Right Controls: Ambient Sound, SFX, Reset, Sync */}
        <div className="flex items-center gap-2">
          
          {/* Ambient Soundscape Button */}
          <button
            onClick={handleToggleAmbient}
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all duration-200 ${
              isAmbient
                ? 'bg-sky-950/60 border-sky-500/40 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                : 'bg-neutral-900/60 border-white/10 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
            title={isAmbient ? "Pause Ambient Soundscape" : "Play Ambient Soundscape"}
          >
            <Music className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px] uppercase tracking-wider">
              {isAmbient ? "Ambient On" : "Soundscape"}
            </span>

            {/* 3-Bar Equalizer visualizer */}
            {isAmbient && (
              <div className="flex items-end gap-0.5 h-3.5 w-3 ml-0.5">
                <span className="w-0.5 bg-sky-400 eq-bar-1 rounded-full" />
                <span className="w-0.5 bg-sky-400 eq-bar-2 rounded-full" />
                <span className="w-0.5 bg-sky-400 eq-bar-3 rounded-full" />
              </div>
            )}
          </button>

          {/* Shutter SFX Mute/Unmute */}
          <button
            onClick={handleToggleSfx}
            className={`p-2 rounded-xl border text-xs transition-all ${
              isSfxMuted
                ? 'bg-red-950/40 border-red-500/30 text-red-400'
                : 'bg-neutral-900/60 border-white/10 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
            title={isSfxMuted ? "Unmute Shutter SFX" : "Mute Shutter SFX"}
          >
            {isSfxMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Google Sheets Sync Button */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenSync();
            }}
            className="p-2 rounded-xl border border-white/10 bg-neutral-900/60 text-neutral-400 hover:text-amber-400 hover:border-amber-400/40 hover:bg-amber-950/30 transition-all"
            title="Google Sheets Database Sync"
          >
            <Database className="w-4 h-4" />
          </button>

        </div>
      </div>
    </header>
  );
}
