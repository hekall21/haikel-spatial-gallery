import React from 'react';
import { motion } from 'framer-motion';
import { Film, Image, Sparkles, LayoutGrid } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export function BottomNav({ onFilterCategory, onOpenSync, totalCount, activeCategory }) {
  const categories = [
    { id: 'all', label: 'All Works' },
    { id: 'photos', label: 'Photos (190)' },
    { id: 'videos', label: 'Videos (45)' },
    { id: 'featured', label: 'Featured ✦' }
  ];

  const handleCatClick = (catId) => {
    soundEngine.playClick();
    onFilterCategory(catId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="fixed bottom-0 left-0 right-0 z-30 flex flex-col items-center justify-center pb-4 sm:pb-6 pointer-events-none"
    >
      <div className="flex flex-col items-center pointer-events-auto bg-black/70 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.8)] max-w-[95vw] sm:max-w-auto">
        
        {/* Navigation buttons */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCatClick(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-neutral-950 font-bold shadow-md scale-105'
                    : 'text-neutral-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Count Label */}
        <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-neutral-500 mt-1">
          {totalCount} Media Curated • Haikel Spatial Gallery
        </span>
      </div>
    </motion.div>
  );
}

export default BottomNav;
