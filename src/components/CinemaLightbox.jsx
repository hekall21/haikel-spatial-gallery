import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  Film, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Heart, 
  Eye, 
  Share2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Volume1,
  Maximize, 
  RotateCw,
  Info,
  CheckCircle2,
  Sliders,
  ZoomIn,
  ZoomOut,
  AlertCircle
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { downloadMediaDirect } from '../utils/downloader';

export function CinemaLightbox({ 
  item, 
  onClose, 
  onPrev, 
  onNext, 
  currentIndex, 
  totalCount,
  onLike
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [showCenterPlayIndicator, setShowCenterPlayIndicator] = useState(false);

  // Photo state
  const [isZoomed, setIsZoomed] = useState(false);
  const [showExifHud, setShowExifHud] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);

  // Safe Video Play Function
  const attemptPlay = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      setVideoError(false);
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      await videoRef.current.play();
      setIsPlaying(true);
      setIsVideoLoading(false);
    } catch (err) {
      console.warn('[CinemaLightbox] Autoplay blocked, attempting muted fallback...', err);
      // Browser autoplay policy blocked unmuted sound -> fallback to muted
      if (videoRef.current) {
        videoRef.current.muted = true;
        setIsMuted(true);
        try {
          await videoRef.current.play();
          setIsPlaying(true);
          setIsVideoLoading(false);
        } catch (fallbackErr) {
          console.warn('[CinemaLightbox] Fallback play also blocked, user tap needed', fallbackErr);
          setIsPlaying(false);
          setIsVideoLoading(false);
        }
      }
    }
  }, [volume, isMuted]);

  // When item changes: reset state & trigger play
  useEffect(() => {
    setIsVideoLoading(true);
    setVideoError(false);
    setCurrentTime(0);
    setDuration(0);
    setIsZoomed(false);

    if (item.type === 'video') {
      const timer = setTimeout(() => {
        attemptPlay();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [item.id, item.type, attemptPlay]);

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        soundEngine.playClick();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        soundEngine.playWhoosh();
        onPrev();
      } else if (e.key === 'ArrowRight') {
        soundEngine.playWhoosh();
        onNext();
      } else if (e.key === ' ' && item.type === 'video') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key.toLowerCase() === 'm' && item.type === 'video') {
        toggleMute();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, isPlaying, isMuted, onClose, onPrev, onNext]);

  // Video time tracking
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      setIsVideoLoading(false);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (videoRef.current && duration) {
      videoRef.current.currentTime = pos * duration;
      setCurrentTime(pos * duration);
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    soundEngine.playClick();

    if (videoRef.current.paused) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          flashCenterIndicator();
        })
        .catch((err) => {
          console.warn('Play attempt failed, forcing muted play:', err);
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().then(() => setIsPlaying(true));
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      flashCenterIndicator();
    }
  };

  const flashCenterIndicator = () => {
    setShowCenterPlayIndicator(true);
    setTimeout(() => setShowCenterPlayIndicator(false), 600);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    soundEngine.playClick();
    const newMute = !videoRef.current.muted;
    videoRef.current.muted = newMute;
    setIsMuted(newMute);
    if (!newMute && videoRef.current.volume === 0) {
      videoRef.current.volume = 0.8;
      setVolume(0.8);
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      if (newVol > 0 && videoRef.current.muted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      } else if (newVol === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = () => {
    const el = playerContainerRef.current || videoRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadSuccess(false);
    try {
      await downloadMediaDirect(item, ({ progress }) => {
        setDownloadProgress(progress);
      });
      soundEngine.playDownloadSuccess();
      setDownloadSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setDownloading(false);
        setDownloadProgress(0);
      }, 2500);
    }
  };

  const handleShare = () => {
    soundEngine.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050508]/95 backdrop-blur-2xl overflow-hidden select-none"
    >
      {/* 1. TOP CINEMA HEADER BAR */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-6 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/80 to-transparent">
        
        {/* Left: Index & Category */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1 rounded-full glass-panel text-xs font-mono text-neutral-300 flex items-center gap-2">
            <span className="text-white font-bold">{currentIndex + 1}</span>
            <span className="text-neutral-500">/</span>
            <span className="text-neutral-400">{totalCount}</span>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel text-xs font-mono text-sky-400">
            {item.type === 'video' ? (
              <>
                <Film className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span className="uppercase tracking-wider font-semibold">4K Cinema Reel</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span className="uppercase tracking-wider font-semibold">HD Photo</span>
              </>
            )}
          </div>
        </div>

        {/* Right: EXIF HUD Toggle, Share & Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExifHud(!showExifHud)}
            className={`p-2.5 rounded-xl border transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
              showExifHud 
                ? 'bg-neutral-800 border-white/30 text-white shadow-lg' 
                : 'bg-neutral-900/80 border-white/10 text-neutral-400 hover:text-white'
            }`}
            title="Toggle EXIF Metadata Panel"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline font-mono text-[11px]">Specs</span>
          </button>

          <button
            onClick={handleShare}
            className="p-2.5 rounded-xl bg-neutral-900/80 border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 transition-all text-xs flex items-center gap-1.5 cursor-pointer"
            title="Share Link"
          >
            {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline font-mono text-[11px]">{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2.5 rounded-xl bg-neutral-900/80 border border-white/10 text-neutral-400 hover:text-white hover:border-red-500/40 hover:bg-red-950/40 transition-all cursor-pointer"
            title="Tutup (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. SIDE NAVIGATION ARROWS (Next / Prev) */}
      <button
        onClick={() => {
          soundEngine.playWhoosh();
          onPrev();
        }}
        className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-2xl glass-panel text-neutral-300 hover:text-white hover:border-white/40 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-2xl"
        title="Sebelumnya (Arrow Left)"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => {
          soundEngine.playWhoosh();
          onNext();
        }}
        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-2xl glass-panel text-neutral-300 hover:text-white hover:border-white/40 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-2xl"
        title="Berikutnya (Arrow Right)"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* 3. MAIN CINEMA STAGE & VIEWPORT */}
      <div className="w-full h-full max-w-7xl mx-auto px-4 sm:px-16 pt-16 pb-16 flex flex-col lg:flex-row items-center justify-center gap-6 z-20 overflow-y-auto lg:overflow-hidden">
        
        {/* Media Player Frame */}
        <div 
          ref={playerContainerRef}
          className="relative flex-1 flex items-center justify-center max-h-[78vh] w-full"
        >
          {item.type === 'video' ? (
            <div className="relative max-h-[75vh] w-full flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-black border border-white/15 shadow-[0_0_80px_rgba(0,0,0,0.9)] group">
              
              {/* Actual Video Tag */}
              <video
                key={item.id}
                ref={videoRef}
                src={item.mediaUrl}
                autoPlay
                playsInline
                loop={isLooping}
                muted={isMuted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onWaiting={() => setIsVideoLoading(true)}
                onPlaying={() => setIsVideoLoading(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onError={(e) => {
                  console.error("Video load error", e);
                  setVideoError(true);
                  setIsVideoLoading(false);
                }}
                onClick={togglePlayPause}
                className="max-h-[70vh] w-auto max-w-full object-contain cursor-pointer"
              />

              {/* Large Centered Floating Play / Pause Overlay */}
              {(!isPlaying || showCenterPlayIndicator) && (
                <div 
                  onClick={togglePlayPause}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer transition-all duration-300 z-10"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-neutral-950 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.6)] hover:scale-110 active:scale-95 transition-transform"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 fill-neutral-950" />
                    ) : (
                      <Play className="w-9 h-9 fill-neutral-950 ml-1" />
                    )}
                  </motion.div>

                  {!isPlaying && (
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3.5 px-4 py-1 rounded-full bg-black/80 border border-white/20 text-xs font-mono tracking-widest text-white uppercase"
                    >
                      Klik Untuk Memutar 4K Reel
                    </motion.span>
                  )}
                </div>
              )}

              {/* Video Loading Spinner */}
              {isVideoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none z-10">
                  <div className="flex flex-col items-center gap-2">
                    <RotateCw className="w-8 h-8 text-sky-400 animate-spin" />
                    <span className="text-[11px] font-mono text-neutral-300 tracking-wider">Memuat Video 4K...</span>
                  </div>
                </div>
              )}

              {/* Video Error Message */}
              {videoError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center z-20">
                  <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
                  <p className="text-sm font-mono text-neutral-200">Gagal memuat video secara langsung.</p>
                  <button
                    onClick={() => attemptPlay()}
                    className="mt-3 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-mono text-white transition-all"
                  >
                    Coba Muat Ulang
                  </button>
                </div>
              )}

              {/* Professional Cinema Video Controls Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col gap-2.5 opacity-90 group-hover:opacity-100 transition-opacity z-20">
                
                {/* Timeline Scrubber */}
                <div 
                  onClick={handleSeek}
                  className="w-full h-2 bg-white/20 hover:h-3 rounded-full overflow-hidden cursor-pointer transition-all relative group/bar"
                >
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 via-sky-400 to-indigo-500 rounded-full relative"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  >
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Control Buttons row */}
                <div className="flex items-center justify-between text-xs text-neutral-300 font-mono">
                  
                  {/* Left: Play/Pause, Volume, Time */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={togglePlayPause} 
                      className="hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>

                    {/* Volume Control */}
                    <div className="flex items-center gap-1.5 group/vol">
                      <button 
                        onClick={toggleMute} 
                        className="hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        title={isMuted ? "Unmute (M)" : "Mute (M)"}
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 text-red-400" />
                        ) : volume > 0.5 ? (
                          <Volume2 className="w-4 h-4 text-sky-400" />
                        ) : (
                          <Volume1 className="w-4 h-4 text-sky-400" />
                        )}
                      </button>

                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 accent-sky-400 bg-white/20 rounded-lg cursor-pointer"
                        title="Atur Volume Suara Cinema"
                      />
                    </div>

                    <span className="text-[11px] text-neutral-300">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* Right: Loop, Fullscreen */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsLooping(!isLooping)} 
                      className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded border transition-all cursor-pointer ${
                        isLooping 
                          ? 'border-sky-400/50 bg-sky-500/10 text-sky-400 font-semibold' 
                          : 'border-white/10 text-neutral-500'
                      }`}
                      title="Loop playback"
                    >
                      Loop
                    </button>

                    <button 
                      onClick={toggleFullscreen} 
                      className="hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      title="Fullscreen (F)"
                    >
                      <Maximize className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            <div className="relative max-h-[75vh] flex items-center justify-center">
              <motion.img
                key={item.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: isZoomed ? 1.35 : 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                src={item.mediaUrl}
                alt={item.title}
                onClick={() => setIsZoomed(!isZoomed)}
                className={`max-h-[75vh] w-auto max-w-full object-contain rounded-2xl border border-white/15 shadow-[0_0_60px_rgba(0,0,0,0.8)] cursor-${isZoomed ? 'zoom-out' : 'zoom-in'}`}
              />

              {/* Zoom control toggle */}
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="absolute bottom-4 right-4 p-2.5 rounded-xl glass-panel text-white/80 hover:text-white transition-all shadow-lg cursor-pointer"
                title={isZoomed ? "Zoom Out" : "Zoom In HD"}
              >
                {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* 4. SIDE HUD PANEL (EXIF & Metadata) */}
        {showExifHud && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full lg:w-96 glass-panel-elevated rounded-3xl p-5 sm:p-6 flex flex-col justify-between max-h-[75vh] overflow-y-auto"
          >
            <div>
              {/* Category & Featured Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  {item.category}
                </span>
                {item.featured && (
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Featured
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-serif leading-tight">
                {item.title}
              </h2>

              <p className="text-xs text-neutral-300 leading-relaxed mt-2.5">
                {item.story || "Tangkap momen otentik dan pencahayaan sinematik dengan tone kontras khas kurasi Haikel."}
              </p>

              {/* EXIF Camera Specs Grid */}
              <div className="mt-4 p-4 rounded-2xl bg-black/50 border border-white/5 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-neutral-400" /> Device
                  </span>
                  <span className="text-white font-medium text-right truncate max-w-[170px]">{item.camera}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-neutral-400" /> Optics
                  </span>
                  <span className="text-white font-medium text-right truncate max-w-[170px]">{item.lens}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Settings
                  </span>
                  <span className="text-amber-300 font-medium text-right">{item.settings}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Location
                  </span>
                  <span className="text-neutral-200 text-right truncate max-w-[170px]">{item.location}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" /> Date
                  </span>
                  <span className="text-neutral-300 text-right">{item.date}</span>
                </div>
              </div>

              {/* Engagement Likes & Views */}
              <div className="mt-4 flex items-center justify-between px-2 text-xs font-mono text-neutral-400">
                <button
                  onClick={() => onLike && onLike(item.id)}
                  className="flex items-center gap-1.5 hover:text-red-400 transition-colors cursor-pointer py-1"
                >
                  <Heart className="w-4 h-4 text-red-500 fill-red-500/20" />
                  <span className="text-neutral-300 font-medium">{item.likes} Likes</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span className="text-neutral-300 font-medium">{item.views} Views</span>
                </div>
              </div>
            </div>

            {/* 1-Click Direct Download Engine */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className={`w-full relative overflow-hidden py-3.5 px-5 rounded-2xl font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl cursor-pointer ${
                  downloadSuccess
                    ? 'bg-emerald-500 text-white'
                    : downloading
                    ? 'bg-sky-600 text-white cursor-wait'
                    : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-neutral-950 hover:scale-[1.02] active:scale-[0.98] shadow-amber-500/20'
                }`}
              >
                {/* Live Progress Fill */}
                {downloading && (
                  <div
                    className="absolute inset-0 bg-white/20 transition-all duration-150"
                    style={{ width: `${downloadProgress}%` }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-2">
                  {downloadSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Download Selesai! (Saved)</span>
                    </>
                  ) : downloading ? (
                    <>
                      <RotateCw className="w-5 h-5 animate-spin" />
                      <span>Mengunduh... {downloadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 text-neutral-950" />
                      <span className="tracking-wide">
                        {item.type === 'video' ? 'DOWNLOAD 4K VIDEO' : 'DOWNLOAD HD PHOTO'}
                      </span>
                    </>
                  )}
                </div>
              </button>

              <p className="text-[9px] text-neutral-400 text-center font-mono mt-2">
                ⚡ Direct 1-Click Blob Engine • Kualitas Asli Google Drive
              </p>
            </div>

          </motion.div>
        )}

      </div>
    </motion.div>
  );
}

export default CinemaLightbox;
