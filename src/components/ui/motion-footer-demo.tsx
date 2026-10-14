"use client";

import React from "react";
import { CinematicFooter } from "@/components/ui/motion-footer";

export default function MotionFooterDemo() {
  return (
    <div className="relative w-full bg-[#070709] min-h-screen font-sans selection:bg-white/20 overflow-x-hidden">
      {/* 
        MAIN CONTENT AREA 
        We use a high z-index and minimum height to allow the user 
        to scroll down and reveal the footer securely underneath.
      */}
      <main className="relative z-10 w-full min-h-[120vh] bg-[#070709] flex flex-col items-center justify-center text-white border-b border-white/10 shadow-md rounded-b-3xl px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(56,189,248,0.06)_0%,transparent_60%)] pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sky-400 text-xs font-mono mb-6">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span>GSAP SCROLLTRIGGER CURTAIN REVEAL</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-light tracking-[0.2em] text-neutral-300 mb-6 uppercase text-center max-w-3xl">
          Scroll down to reveal
        </h1>
        
        <p className="text-neutral-500 text-sm max-w-md text-center mb-10">
          The cinematic footer sits fixed to the viewport behind this layer, dynamically uncloaked as you reach the bottom.
        </p>
        
        <div className="w-[1px] h-32 bg-gradient-to-b from-sky-400/80 via-purple-400/50 to-transparent" />
      </main>

      {/* The Cinematic Footer is injected here */}
      <CinematicFooter />
    </div>
  );
}
