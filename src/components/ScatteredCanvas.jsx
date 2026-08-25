import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Film, Sparkles, Volume2, ChevronLeft, ChevronRight, Sliders } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

/**
 * High-performance virtual position generator
 */
function generateScatteredPositions(count) {
  const canvasWidth = 5200;
  const canvasHeight = 4200;
  const positions = [];
  
  const sizes = [160, 200, 240, 280, 320, 220, 260, 300, 180, 210];

  const seededRandom = (seed) => {
    const x = Math.sin(seed * 9301 + 49297) * 49297;
    return x - Math.floor(x);
  };

  for (let i = 0; i < count; i++) {
    const seed = i + 1;
    const r1 = seededRandom(seed);
    const r2 = seededRandom(seed * 2 + 7);
    const r3 = seededRandom(seed * 3 + 13);
    const r4 = seededRandom(seed * 4 + 19);

    positions.push({
      baseX: (r1 * canvasWidth) - (canvasWidth / 2),
      baseY: (r2 * canvasHeight) - (canvasHeight / 2),
      z: (r3 * 1.2) + 0.3, 
      width: sizes[i % sizes.length],
      rotation: (r4 - 0.5) * 10,
    });
  }

  return positions;
}

const DesktopCanvasItem = React.memo(({ item, position, onSelect, canvasOffset, mouseOffset, scale }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef(null);

  const parallaxFactor = position.z;
  const x = position.baseX + (canvasOffset.x * parallaxFactor) + (mouseOffset.x * parallaxFactor * 0.04);
  const y = position.baseY + (canvasOffset.y * parallaxFactor) + (mouseOffset.y * parallaxFactor * 0.04);

  // Anti-Lag Culling (Only render items inside or near the viewport)
  useEffect(() => {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    
    const visualX = (screenW / 2) + (x * scale);
    const visualY = (screenH / 2) + (y * scale);
    const visualWidth = position.width * scale;
    
    const buffer = 400;
    const inView = 
      visualX > -buffer - visualWidth && 
      visualX < screenW + buffer &&
      visualY > -buffer - visualWidth && 
      visualY < screenH + buffer;
      
    setIsVisible(inView);
  }, [x, y, scale, position.width]);

  // Video hover play on desktop
  useEffect(() => {
    if (item.type === 'video' && videoRef.current) {
      if (isHovered && isVisible) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isHovered, isVisible, item.type]);

  const handleClick = useCallback(() => {
    soundEngine.playShutter();
    onSelect(item);
  }, [item, onSelect]);

  const aspectMap = { '4/5': 1.25, '3/4': 1.33, '16/9': 0.5625, '1/1': 1 };
  const imgHeight = position.width * (aspectMap[item.aspectRatio] || 1.25);
  const baseOpacity = Math.min(0.5 + (position.z * 0.35), 0.95);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      onMouseEnter={() => {
        setIsHovered(true);
        soundEngine.playHover();
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      className="absolute cursor-pointer will-change-transform select-none"
      style={{
        left: '50%',
        top: '50%',
        width: position.width,
        height: imgHeight,
        zIndex: isHovered ? 100 : Math.floor(position.z * 10),
        opacity: isHovered ? 1 : baseOpacity,
        transform: `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0) scale(${isHovered ? 1.06 : 1}) rotate(${isHovered ? 0 : position.rotation}deg)`,
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div 
        className={`w-full h-full overflow-hidden rounded-xl border bg-[#0d0d10] transition-all duration-300 ${
          isHovered 
            ? 'border-sky-400/80 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(56,189,248,0.25)]' 
            : 'border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.7)]'
        }`}
      >
        {item.type === 'video' ? (
          <div className="relative w-full h-full bg-neutral-950">
            <video
              ref={videoRef}
              src={item.mediaUrl}
              muted
              loop
              playsInline
              preload="none"
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
              <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/20 text-sky-400 shadow-xl">
                <Film className="w-4 h-4 ml-0.5" />
              </div>
            </div>
          </div>
        ) : (
          <img
            src={item.mediaUrl}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover bg-neutral-900"
            draggable="false"
          />
        )}
      </div>

      {/* Hover Tooltip */}
      {isHovered && (
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-black/90 border border-white/20 text-[10px] font-mono tracking-widest text-white uppercase pointer-events-none shadow-xl z-50">
          {item.title}
        </div>
      )}
    </div>
  );
});

// Mobile-Optimized Ultra-Smooth Cinema Feed (Zero-Lag on Phones)
function MobileCinemaFeed({ items, onSelect }) {
  return (
    <div className="w-full h-full overflow-y-auto px-4 pt-20 pb-28 space-y-4 select-none touch-pan-y">
      
      {/* Mobile Top Header Banner */}
      <div className="text-center py-2 px-3 rounded-2xl bg-white/[0.03] border border-white/10 mb-4">
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400">
          ✦ Mobile Cinema Feed • {items.length} Works ✦
        </span>
        <p className="text-xs text-neutral-300 font-mono mt-0.5">Ketuk karya untuk membuka video/foto</p>
      </div>

      {/* Mobile Grid Cards */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            onClick={() => {
              soundEngine.playShutter();
              onSelect(item);
            }}
            className="group relative rounded-2xl overflow-hidden bg-neutral-900/90 border border-white/10 active:scale-95 transition-transform duration-150 cursor-pointer shadow-lg"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-950">
              {item.type === 'video' ? (
                <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-black">
                  {/* Lightweight placeholder with reel badge (No background video memory choke) */}
                  <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-xl">
                    <Film className="w-5 h-5 ml-0.5" />
                  </div>
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/80 text-[9px] font-mono text-sky-300 border border-sky-400/20">
                    4K REEL
                  </span>
                </div>
              ) : (
                <img
                  src={item.mediaUrl}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  draggable="false"
                />
              )}

              {item.featured && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-amber-500/80 text-[8px] font-mono text-neutral-950 font-bold">
                  ★
                </span>
              )}
            </div>

            <div className="p-2.5 bg-neutral-950 border-t border-white/5">
              <p className="text-[11px] font-serif text-white font-medium truncate">{item.title}</p>
              <p className="text-[9px] font-mono text-neutral-400 truncate mt-0.5">{item.category} • {item.location}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScatteredCanvas({ items, onSelect }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const canvasRef = useRef(null);
  
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [targetOffset, setTargetOffset] = useState({ x: 0, y: 0 });
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const basePositions = useMemo(() => generateScatteredPositions(items.length), [items.length]);

  // Window resize check
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Smooth Panning Loop on Desktop (Throttled to avoid state flood)
  useEffect(() => {
    if (isMobile) return;

    let animationFrameId;
    const loop = () => {
      setOffset((prev) => {
        const dx = targetOffset.x - prev.x;
        const dy = targetOffset.y - prev.y;
        if (Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) return prev;
        return {
          x: prev.x + dx * 0.1,
          y: prev.y + dy * 0.1
        };
      });
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetOffset, isMobile]);

  // Mouse drag handlers
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - targetOffset.x, y: e.clientY - targetOffset.y };
    document.body.style.cursor = 'grabbing';
  }, [targetOffset]);

  const handleMouseMove = useCallback((e) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    setMouseOffset({
      x: (centerX - e.clientX),
      y: (centerY - e.clientY)
    });

    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    setTargetOffset({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  }, []);

  // Zoom
  useEffect(() => {
    if (isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setScale((prev) => Math.max(0.4, Math.min(2.2, prev + delta)));
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [isMobile]);

  // If Mobile screen: Render the buttery-smooth anti-lag mobile feed
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-[#050508] overflow-hidden">
        <MobileCinemaFeed items={items} onSelect={onSelect} />
        <SoundToggle />
      </div>
    );
  }

  return (
    <div 
      ref={canvasRef}
      className="fixed inset-0 bg-[#050508] overflow-hidden select-none"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Scale Layer */}
      <div
        className="absolute w-full h-full origin-center will-change-transform"
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 0.25s ease-out'
        }}
      >
        {/* Background Monogram */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
          <h1
            className="font-serif text-white/[0.03] whitespace-nowrap tracking-widest"
            style={{ fontSize: 'clamp(100px, 20vw, 350px)' }}
          >
            HAIKEL
          </h1>
        </div>

        {/* Desktop Scattered Items */}
        {items.map((item, index) => {
          const pos = basePositions[index];
          if (!pos) return null;
          return (
            <DesktopCanvasItem
              key={item.id}
              item={item}
              position={pos}
              onSelect={onSelect}
              canvasOffset={offset}
              mouseOffset={mouseOffset}
              scale={scale}
            />
          );
        })}
      </div>

      <SoundToggle />

      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none opacity-50">
        <p className="text-white uppercase font-mono tracking-[0.35em] text-[10px] drop-shadow-md bg-black/60 px-4 py-1.5 rounded-full border border-white/10">
          drag to explore · scroll to zoom • click to play
        </p>
      </div>
    </div>
  );
}

function SoundToggle() {
  const [isAmbient, setIsAmbient] = useState(soundEngine.getIsAmbientPlaying());

  const handleToggle = () => {
    soundEngine.playClick();
    const newState = soundEngine.toggleAmbient((active) => {
      setIsAmbient(active);
    });
    setIsAmbient(newState);
  };

  return (
    <button
      onClick={handleToggle}
      className={`fixed top-5 right-5 sm:top-6 sm:right-8 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full border backdrop-blur-md transition-all duration-300 cursor-pointer shadow-xl ${
        isAmbient 
          ? 'bg-amber-500/20 border-amber-400/40 text-amber-300' 
          : 'bg-black/60 border-white/15 text-white/70 hover:text-white'
      }`}
      title="Toggle Dolby Cinema Soundscape"
    >
      <Volume2 className="w-3.5 h-3.5 animate-pulse" />
      <span className="uppercase tracking-[0.25em] font-mono text-[10px] font-semibold">
        {isAmbient ? 'CINEMA SOUND ON' : 'SOUND'}
      </span>
      {isAmbient && (
        <div className="flex items-end gap-[2px] h-3 w-3 ml-0.5">
          <span className="w-[2px] bg-amber-400 eq-bar-1 rounded-full" />
          <span className="w-[2px] bg-amber-400 eq-bar-2 rounded-full" />
          <span className="w-[2px] bg-amber-400 eq-bar-3 rounded-full" />
        </div>
      )}
    </button>
  );
}

export default ScatteredCanvas;
