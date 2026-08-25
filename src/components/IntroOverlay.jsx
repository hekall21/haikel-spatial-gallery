import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Volume2, Sparkles, Play, Eye } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export function IntroOverlay({ onEnter, totalCount = 235 }) {
  const [isOpening, setIsOpening] = useState(false);
  const [showCurtains, setShowCurtains] = useState(true);

  const handleEnterCinema = useCallback(() => {
    if (isOpening) return;
    setIsOpening(true);

    // 1. Play Iconic Dolby Cinema Boom Bass Swell
    soundEngine.playCinemaBoom();

    // 2. Start Warm Cinema Ambience
    setTimeout(() => {
      soundEngine.toggleAmbient();
    }, 1200);

    // 3. Complete Curtain opening and enter
    setTimeout(() => {
      setShowCurtains(false);
      onEnter();
    }, 1800);
  }, [isOpening, onEnter]);

  const handleEnterSilent = useCallback((e) => {
    e.stopPropagation();
    if (isOpening) return;
    setIsOpening(true);
    soundEngine.playClick();

    setTimeout(() => {
      setShowCurtains(false);
      onEnter();
    }, 1200);
  }, [isOpening, onEnter]);

  if (!showCurtains) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050507] text-white flex items-center justify-center overflow-hidden select-none">
      
      {/* 1. PROJECTOR LIGHT BEAM EFFECT (Top to Center Screen) */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] max-w-4xl h-[85vh] pointer-events-none opacity-40 mix-blend-screen transition-opacity duration-1000"
        style={{
          background: 'conic-gradient(from 180deg at 50% 0%, rgba(56,189,248,0.25) 0deg, rgba(245,158,11,0.15) 15deg, transparent 35deg, transparent 325deg, rgba(245,158,11,0.15) 345deg, rgba(56,189,248,0.25) 360deg)',
          filter: 'blur(30px)'
        }}
      />

      {/* Floating Dust / Motes in Projector Ray */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute w-2 h-2 rounded-full bg-sky-200/60 blur-[1px] top-1/4 left-1/3 animate-ping" style={{ animationDuration: '4s' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/70 blur-[1px] top-1/3 right-1/3 animate-ping" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute w-2.5 h-2.5 rounded-full bg-white/40 blur-[1px] top-1/2 left-2/5 animate-pulse" style={{ animationDuration: '3s' }} />
      </div>

      {/* 2. THEATER VELVET CURTAINS (Left & Right Split) */}
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2 z-40 bg-gradient-to-r from-[#120608] via-[#200a0e] to-[#2a0b12] border-r border-amber-500/20 shadow-[15px_0_50px_rgba(0,0,0,0.95)] flex items-center justify-end overflow-hidden origin-left"
        initial={{ x: 0, scaleX: 1 }}
        animate={isOpening ? { x: '-100%', scaleX: 0.85, opacity: 0.1 } : { x: 0, scaleX: 1 }}
        transition={{ duration: 1.6, ease: [0.76, 0, 0.24, 1] }}
      >
        {/* Realistic Vertical Curtain Folds */}
        <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.8)_0px,rgba(0,0,0,0.8)_20px,rgba(255,255,255,0.06)_40px,rgba(0,0,0,0.8)_60px)]" />
        <div className="h-full w-4 bg-gradient-to-r from-amber-600/30 to-amber-400/40 blur-[1px]" />
      </motion.div>

      <motion.div
        className="absolute inset-y-0 right-0 w-1/2 z-40 bg-gradient-to-l from-[#120608] via-[#200a0e] to-[#2a0b12] border-l border-amber-500/20 shadow-[-15px_0_50px_rgba(0,0,0,0.95)] flex items-center justify-start overflow-hidden origin-right"
        initial={{ x: 0, scaleX: 1 }}
        animate={isOpening ? { x: '100%', scaleX: 0.85, opacity: 0.1 } : { x: 0, scaleX: 1 }}
        transition={{ duration: 1.6, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.8)_0px,rgba(0,0,0,0.8)_20px,rgba(255,255,255,0.06)_40px,rgba(0,0,0,0.8)_60px)]" />
        <div className="h-full w-4 bg-gradient-to-l from-amber-600/30 to-amber-400/40 blur-[1px]" />
      </motion.div>

      {/* 3. CINEMA SCREEN CENTERPIECE (The Movie Premiere Hall) */}
      <div className="relative z-50 flex flex-col items-center justify-center max-w-xl mx-4 text-center px-6 py-8 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
        
        {/* Dolby / Spatial Badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-amber-500/10 border border-amber-400/30 text-[10px] font-mono tracking-[0.35em] text-amber-300 uppercase mb-4 shadow-lg"
        >
          <Sparkles className="w-3 h-3 text-amber-400 animate-spin-slow" />
          <span>DOLBY CINEMA • SPATIAL 4K THEATER</span>
          <Sparkles className="w-3 h-3 text-amber-400 animate-spin-slow" />
        </motion.div>

        {/* Studio Branding */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.8 }}
          className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white font-serif"
          style={{ textShadow: '0 0 35px rgba(255,255,255,0.3), 0 0 70px rgba(56,189,248,0.2)' }}
        >
          HAIKEL
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="text-xs sm:text-sm text-neutral-300 font-mono tracking-[0.25em] uppercase mt-3 mb-6 leading-relaxed max-w-md"
        >
          Cinematic Photography & 4K Video Gallery
          <span className="block text-[11px] text-sky-400 mt-1 font-normal tracking-widest">
            {totalCount} Curated Masterworks • Dolby Atmos Soundscape
          </span>
        </motion.p>

        {/* Big Interactive "MASUK BIOSKOP / ENTER THEATER" Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.7 }}
          className="w-full flex flex-col items-center gap-3.5"
        >
          <button
            onClick={handleEnterCinema}
            disabled={isOpening}
            className="w-full sm:w-auto min-w-[280px] group relative overflow-hidden px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-neutral-950 font-bold text-xs sm:text-sm font-mono tracking-widest uppercase shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:shadow-[0_0_60px_rgba(245,158,11,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center gap-3"
          >
            {/* Animated Shine Sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000" />

            <Play className="w-5 h-5 fill-neutral-950 text-neutral-950 group-hover:scale-110 transition-transform" />
            <span className="relative z-10">MASUK BIOSKOP (SOUND ON)</span>
            <Volume2 className="w-4 h-4 text-neutral-900 animate-pulse" />
          </button>

          {/* Secondary Silent Enter */}
          <button
            onClick={handleEnterSilent}
            disabled={isOpening}
            className="text-[11px] font-mono tracking-[0.25em] uppercase text-neutral-400 hover:text-white transition-colors cursor-pointer py-1 flex items-center gap-1.5"
          >
            <span>Masuk Mode Hening (Silent)</span>
            <span>→</span>
          </button>
        </motion.div>

        {/* Ambient Footer Notice */}
        <div className="mt-6 pt-4 border-t border-white/5 w-full flex items-center justify-between text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
          <span>Dolby Spatial Audio</span>
          <span>•</span>
          <span>4K Ultra HD Visuals</span>
          <span>•</span>
          <span>Jakarta, 2026</span>
        </div>

      </div>

    </div>
  );
}

export default IntroOverlay;
