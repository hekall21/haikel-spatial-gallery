import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Film, 
  Download, 
  Sparkles, 
  Eye, 
  Heart, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Sparkle
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { downloadMediaDirect } from '../utils/downloader';

// Clean, spacious coordinate calculation for floating cards without overlapping
function getSpaciousCoordinates(count, page = 0) {
  // Pre-calculated balanced coordinates (in px) with generous breathing room
  const positions = [
    { x: -420, y: -190, r: -5, speed: 5.2, scale: 0.96 },
    { x: -140, y: -240, r: 3, speed: 4.8, scale: 1.02 },
    { x: 160, y: -220, r: -3, speed: 5.5, scale: 0.98 },
    { x: 440, y: -180, r: 6, speed: 5.0, scale: 0.95 },
    
    { x: -480, y: 80, r: 4, speed: 4.6, scale: 1.0 },
    { x: -200, y: 120, r: -4, speed: 5.8, scale: 1.04 },
    { x: 210, y: 110, r: 3, speed: 5.1, scale: 1.02 },
    { x: 490, y: 70, r: -5, speed: 4.9, scale: 0.97 },

    { x: -330, y: 340, r: -3, speed: 5.4, scale: 0.95 },
    { x: 0, y: 350, r: 2, speed: 4.7, scale: 1.0 },
    { x: 340, y: 330, r: -4, speed: 5.3, scale: 0.96 },
  ];

  return positions;
}

function FloatingCardItem({ item, coord, index, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    if (item.type === 'video' && videoRef.current) {
      if (isHovered) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered, item.type]);

  const handleCardClick = (e) => {
    if (e.target.closest('.no-open')) return;
    soundEngine.playShutter();
    onSelect(item);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadMediaDirect(item, ({ progress }) => {
        setDownloadProgress(progress);
      });
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setDownloading(false);
        setDownloadProgress(0);
      }, 1200);
    }
  };

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `calc(50% + ${coord.x}px)`,
        top: `calc(50% + ${coord.y}px)`,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{
        opacity: 1,
        scale: coord.scale,
        y: ['-10px', '12px', '-10px'],
        rotate: [coord.r - 1.5, coord.r + 1.5, coord.r - 1.5],
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        opacity: { duration: 0.4, delay: index * 0.04 },
        scale: { duration: 0.4 },
        y: { duration: coord.speed, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: coord.speed * 1.2, repeat: Infinity, ease: 'easeInOut' },
      }}
      whileHover={{
        scale: 1.14,
        rotate: 0,
        zIndex: 80,
        transition: { duration: 0.25, ease: 'easeOut' },
      }}
      whileTap={{ scale: 0.97 }}
      onMouseEnter={() => {
        setIsHovered(true);
        soundEngine.playHover();
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      className="cursor-pointer select-none group w-56 sm:w-64"
    >
      <div
        className={`relative rounded-2xl overflow-hidden border transition-all duration-300 ${
          item.featured
            ? 'border-amber-400/50 shadow-[0_15px_40px_rgba(245,158,11,0.2)] bg-[#121216]/95'
            : 'border-white/10 shadow-[0_20px_45px_rgba(0,0,0,0.85)] bg-[#101014]/90'
        } backdrop-blur-xl group-hover:border-sky-400/60 group-hover:shadow-[0_25px_60px_rgba(56,189,248,0.3)]`}
      >
        {/* Media Frame */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-950">
          {item.type === 'video' ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={item.mediaUrl}
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-106"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
                <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-sky-400 shadow-xl">
                  <Film className="w-4 h-4 ml-0.5" />
                </div>
              </div>
            </div>
          ) : (
            <img
              src={item.mediaUrl}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
            />
          )}

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-black/75 backdrop-blur-md text-neutral-200 border border-white/10">
              {item.type === 'video' ? (
                <>
                  <Film className="w-2.5 h-2.5 text-sky-400" />
                  <span>4K Reel</span>
                </>
              ) : (
                <>
                  <Camera className="w-2.5 h-2.5 text-amber-400" />
                  <span>HD Photo</span>
                </>
              )}
            </span>

            {item.featured && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-amber-500/20 backdrop-blur-md text-amber-300 border border-amber-500/30">
                <Sparkles className="w-2.5 h-2.5" />
                Featured
              </span>
            )}
          </div>

          {/* Hover Quick Action Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5">
            <div className="flex justify-end gap-1.5 no-open">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className={`p-2 rounded-xl backdrop-blur-md border text-white transition-all shadow-lg ${
                  downloading
                    ? 'bg-sky-500 border-sky-400 animate-pulse'
                    : 'bg-black/60 border-white/20 hover:bg-sky-500 hover:border-sky-400 hover:text-white'
                }`}
                title="Download 1-Click HD/4K"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-sky-300 mb-0.5">
                {item.category} • {item.location}
              </p>
              <h4 className="text-sm font-semibold text-white tracking-tight line-clamp-1 font-serif">
                {item.title}
              </h4>
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5 flex items-center justify-between">
                <span>{item.camera.split(' ')[0]}</span>
                <span className="text-amber-400 font-medium">Buka Lightbox ↗</span>
              </p>
            </div>
          </div>

          {/* Download Progress Bar */}
          {downloading && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-150"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Card Footer Bar */}
        <div className="px-3 py-2 bg-neutral-950/95 border-t border-white/5 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
          <span className="truncate max-w-[120px] text-neutral-300">{item.title}</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-neutral-400">
              <Eye className="w-3 h-3 text-sky-400" />
              {item.views}
            </span>
            <span className="flex items-center gap-1 group-hover:text-red-400 transition-colors">
              <Heart className="w-3 h-3" />
              {item.likes}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function SpatialStage({ items, onSelect }) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 11;
  const totalPages = Math.ceil(items.length / itemsPerPage);

  const coords = useMemo(() => getSpaciousCoordinates(itemsPerPage), []);

  const currentItems = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  const handleNextPage = () => {
    soundEngine.playWhoosh();
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrevPage = () => {
    soundEngine.playWhoosh();
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <div className="relative w-full h-[84vh] min-h-[640px] overflow-hidden flex items-center justify-center select-none">
      
      {/* Deep Noir Atmosphere */}
      <div className="absolute inset-0 bg-[#08080a] noise-overlay opacity-50 pointer-events-none" />
      <div className="absolute inset-0 cinematic-vignette pointer-events-none" />

      {/* Subtle Background Glows */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-sky-500/5 blur-[160px] pointer-events-none animate-pulse" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[140px] pointer-events-none -top-10 -right-10" />

      {/* Centerpiece Hero Title */}
      <div className="absolute pointer-events-none flex flex-col items-center justify-center text-center z-0 px-4">
        <span className="text-[11px] font-mono tracking-[0.35em] uppercase text-sky-400/80 mb-2">
          ✦ Spatial Noir Collection ✦
        </span>
        <h2 className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tighter text-white font-serif opacity-90">
          HAIKEL
        </h2>
        <p className="text-xs font-mono text-neutral-400 tracking-widest uppercase mt-3">
          Cinematic Photo & Video Gallery • {items.length} Masterworks
        </p>
      </div>

      {/* Floating Constellation Cards */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <div key={currentPage} className="relative w-full h-full">
            {currentItems.map((item, index) => {
              const coord = coords[index % coords.length];
              return (
                <FloatingCardItem
                  key={item.id}
                  item={item}
                  coord={coord}
                  index={index}
                  onSelect={onSelect}
                />
              );
            })}
          </div>
        </AnimatePresence>
      </div>

      {/* Bottom Floating Navigation Controls */}
      <div className="absolute bottom-6 inset-x-0 z-30 flex items-center justify-between px-6 sm:px-12 pointer-events-none">
        
        {/* Left: Constellation info */}
        <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl glass-panel text-xs font-mono text-neutral-400 pointer-events-auto shadow-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Set {currentPage + 1} dari {totalPages}</span>
          <span>•</span>
          <span className="text-neutral-300">{currentItems.length} Karya Melayang</span>
        </div>

        {/* Center / Right: Pagination Arrows */}
        <div className="flex items-center gap-2 pointer-events-auto ml-auto sm:ml-0">
          <button
            onClick={handlePrevPage}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl glass-panel-elevated text-xs font-mono text-neutral-300 hover:text-white hover:border-white/30 transition-all shadow-xl active:scale-95"
            title="Set Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <button
            onClick={handleNextPage}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-neutral-100 text-neutral-950 hover:bg-white transition-all text-xs font-mono font-semibold shadow-xl active:scale-95"
            title="Set Berikutnya"
          >
            <span className="hidden sm:inline">Set Berikutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
