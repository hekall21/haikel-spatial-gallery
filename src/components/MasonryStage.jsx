import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Film, Download, Sparkles, Heart, Eye, ArrowUpRight } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { downloadMediaDirect } from '../utils/downloader';

function MasonryCard({ item, index, onSelect }) {
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
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.02, 0.4) }}
      onMouseEnter={() => {
        setIsHovered(true);
        soundEngine.playHover();
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      className="group relative rounded-2xl overflow-hidden border border-white/10 bg-neutral-900/60 backdrop-blur-md shadow-xl hover:border-white/30 hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col mb-4"
    >
      {/* Media Box */}
      <div className={`relative w-full overflow-hidden bg-neutral-950 ${
        item.aspectRatio === '16/9' ? 'aspect-video' :
        item.aspectRatio === '9/16' ? 'aspect-[9/16]' :
        item.aspectRatio === '1/1' ? 'aspect-square' : 'aspect-[4/5]'
      }`}>
        {item.type === 'video' ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={item.mediaUrl}
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-106"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-black/70 backdrop-blur-md text-neutral-200 border border-white/10">
            {item.type === 'video' ? (
              <>
                <Film className="w-3 h-3 text-sky-400" />
                <span>4K Video</span>
              </>
            ) : (
              <>
                <Camera className="w-3 h-3 text-amber-400" />
                <span>HD Photo</span>
              </>
            )}
          </span>

          {item.featured && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-amber-500/20 backdrop-blur-md text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          )}
        </div>

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
          <div className="flex justify-end gap-2 no-open">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`p-2.5 rounded-xl backdrop-blur-md border text-white transition-all shadow-lg ${
                downloading 
                  ? 'bg-sky-500 border-sky-400 animate-pulse' 
                  : 'bg-black/60 border-white/20 hover:bg-sky-500 hover:border-sky-400'
              }`}
              title="Download 1-Click HD/4K"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-sky-300 mb-1">
              <span>{item.category}</span>
              <span>•</span>
              <span>{item.location}</span>
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight flex items-center justify-between">
              <span className="line-clamp-1">{item.title}</span>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
            </h3>
            <p className="text-xs text-neutral-400 font-mono mt-1">
              {item.camera} • {item.lens}
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

      {/* Bottom Info Bar */}
      <div className="p-3.5 bg-neutral-900/90 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400 font-mono">
        <span className="truncate max-w-[170px] text-neutral-300">{item.title}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {item.views}
          </span>
          <span className="flex items-center gap-1 group-hover:text-red-400 transition-colors">
            <Heart className="w-3.5 h-3.5" />
            {item.likes}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function MasonryStage({ items, onSelect }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {items.length === 0 ? (
        <div className="text-center py-20 text-neutral-500 font-mono">
          Tidak ada media yang cocok dengan filter atau pencarian Anda.
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:_balance]">
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <MasonryCard
                key={item.id}
                item={item}
                index={index}
                onSelect={onSelect}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
