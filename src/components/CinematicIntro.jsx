import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, Sparkles, ArrowRight, Camera, Film } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export function CinematicIntro({ onEnter, totalCount }) {
  const handleEnterWithSound = () => {
    soundEngine.playShutter();
    soundEngine.toggleAmbient();
    onEnter();
  };

  const handleEnterSilent = () => {
    soundEngine.playClick();
    onEnter();
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#070709] text-white p-6 sm:p-12 select-none overflow-hidden"
    >
      {/* Film Grain & Subtle Radial Vignette */}
      <div className="absolute inset-0 noise-overlay opacity-60 pointer-events-none" />
      <div className="absolute inset-0 cinematic-vignette pointer-events-none" />

      {/* Glowing Ambient Core */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-sky-500/10 blur-[160px] pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[150px] pointer-events-none -bottom-20" />

      {/* Top Tagline */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="flex items-center gap-3 text-[11px] font-mono tracking-[0.35em] uppercase text-neutral-400 z-10"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Online Spatial Archive • 2026</span>
      </motion.div>

      {/* Center Cinematic Title Block */}
      <div className="text-center z-10 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-3 flex items-center justify-center gap-2 text-xs font-mono tracking-[0.4em] uppercase text-sky-400"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Visual Experience</span>
          <Sparkles className="w-3.5 h-3.5" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
          className="text-6xl sm:text-8xl md:text-9xl font-bold tracking-tight text-white font-serif"
        >
          HAIKEL
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-xs sm:text-sm text-neutral-300 font-mono tracking-widest uppercase mt-4 max-w-md mx-auto leading-relaxed"
        >
          Cinematic Photography & Motion Reel Collection • {totalCount} Works
        </motion.p>
      </div>

      {/* Bottom CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.8 }}
        className="flex flex-col sm:flex-row items-center gap-3 z-10 w-full sm:w-auto"
      >
        {/* Main CTA: Enter with Sound */}
        <button
          onClick={handleEnterWithSound}
          className="w-full sm:w-auto group relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-neutral-100 to-white text-neutral-950 font-semibold text-xs font-mono uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-white/10"
        >
          <Volume2 className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
          <span>Enter Gallery • With Sound</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Secondary: Silent Enter */}
        <button
          onClick={handleEnterSilent}
          className="w-full sm:w-auto px-6 py-4 rounded-2xl glass-panel text-neutral-400 hover:text-white hover:border-white/20 text-xs font-mono uppercase tracking-widest transition-all duration-300"
        >
          Muted Mode
        </button>
      </motion.div>
    </motion.div>
  );
}
