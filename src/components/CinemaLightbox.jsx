import React, { useState, useEffect, useRef } from 'react';
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
  Maximize, 
  RotateCw,
  Info,
  CheckCircle2,
  Sliders,
  ZoomIn,
  ZoomOut
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
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showExifHud, setShowExifHud] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const videoRef = useRef(null);

  // Keyboard navigation
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, isPlaying]);

  // Video time tracking
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (videoRef.current && duration) {
      videoRef.current.currentTime = pos * duration;
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    soundEngine.playClick();
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    soundEngine.playClick();
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
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
    if (isNaN(secs)) return '0:00';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#070709]/95 backdrop-blur-2xl"
    >
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 sm:p-6 flex items-center justify-between pointer-events-auto">
        {/* Left: Index & Category */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full glass-panel text-xs font-mono text-neutral-300 flex items-center gap-2">
            <span className="text-white font-semibold">{currentIndex + 1}</span>
            <span className="text-neutral-500">/</span>
            <span className="text-neutral-400">{totalCount}</span>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-xs font-mono text-sky-400">
            {item.type === 'video' ? <Film className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5 text-amber-400" />}
            <span className="uppercase tracking-wider">{item.category}</span>
          </div>
        </div>

        {/* Right: Actions & Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExifHud(!showExifHud)}
            className={`p-2.5 rounded-xl border transition-all text-xs ${
              showExifHud 
                ? 'bg-neutral-800 border-white/20 text-white' 
                : 'bg-neutral-900/80 border-white/10 text-neutral-400 hover:text-white'
            }`}
            title="Toggle EXIF HUD Specs"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={handleShare}
            className="p-2.5 rounded-xl bg-neutral-900/80 border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 transition-all text-xs flex items-center gap-1.5"
            title="Share Work"
          >
            {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2.5 rounded-xl bg-neutral-900/80 border border-white/10 text-neutral-400 hover:text-white hover:border-red-500/40 hover:bg-red-950/40 transition-all"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => {
          soundEngine.playWhoosh();
          onPrev();
        }}
        className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-2xl glass-panel text-neutral-400 hover:text-white hover:border-white/30 hover:scale-110 active:scale-95 transition-all"
        title="Previous (Left Arrow)"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => {
          soundEngine.playWhoosh();
          onNext();
        }}
        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-2xl glass-panel text-neutral-400 hover:text-white hover:border-white/30 hover:scale-110 active:scale-95 transition-all"
        title="Next (Right Arrow)"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Main Content Area */}
      <div className="w-full h-full max-w-7xl mx-auto px-4 sm:px-16 pt-16 pb-20 flex flex-col lg:flex-row items-center justify-center gap-6 z-20 overflow-y-auto lg:overflow-visible">
        
        {/* Media Frame */}
        <div className="relative flex-1 flex items-center justify-center max-h-[78vh] w-full">
          {item.type === 'video' ? (
            <div className="relative max-h-[75vh] w-full flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-black/90 border border-white/10 shadow-2xl group">
              <video
                ref={videoRef}
                src={item.mediaUrl}
                autoPlay
                playsInline
                loop={isLooping}
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={togglePlayPause}
                className="max-h-[70vh] w-auto max-w-full object-contain cursor-pointer"
              />

              {/* Video Player Controls Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                {/* Timeline Scrubber */}
                <div 
                  onClick={handleSeek}
                  className="w-full h-1.5 bg-white/20 hover:h-2.5 rounded-full overflow-hidden cursor-pointer transition-all relative"
                >
                  <div 
                    className="h-full bg-gradient-to-r from-sky-400 to-amber-400"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-300 font-mono">
                  <div className="flex items-center gap-3">
                    <button onClick={togglePlayPause} className="hover:text-white p-1">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>
                    <button onClick={toggleMute} className="hover:text-white p-1">
                      {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsLooping(!isLooping)} 
                      className={`p-1 text-[10px] uppercase tracking-wider rounded ${isLooping ? 'text-sky-400' : 'text-neutral-500'}`}
                      title="Loop playback"
                    >
                      Loop
                    </button>
                    <button onClick={toggleFullscreen} className="hover:text-white p-1">
                      <Maximize className="w-3.5 h-3.5" />
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
                animate={{ scale: isZoomed ? 1.4 : 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                src={item.mediaUrl}
                alt={item.title}
                onClick={() => setIsZoomed(!isZoomed)}
                className={`max-h-[75vh] w-auto max-w-full object-contain rounded-2xl border border-white/10 shadow-2xl cursor-${isZoomed ? 'zoom-out' : 'zoom-in'}`}
              />

              {/* Zoom control toggle */}
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="absolute bottom-4 right-4 p-2.5 rounded-xl glass-panel text-white/80 hover:text-white transition-all shadow-lg"
                title={isZoomed ? "Zoom Out" : "Zoom In HD"}
              >
                {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Right / Side HUD Panel (EXIF & Metadata) */}
        {showExifHud && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full lg:w-96 glass-panel-elevated rounded-3xl p-5 sm:p-6 flex flex-col justify-between max-h-[75vh] overflow-y-auto"
          >
            <div>
              {/* Header Title */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {item.category}
                </span>
                {item.featured && (
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Featured
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-serif">
                {item.title}
              </h2>

              <p className="text-xs text-neutral-300 leading-relaxed mt-2.5">
                {item.story}
              </p>

              {/* EXIF Camera Specs Grid */}
              <div className="mt-5 p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-neutral-400" /> Device
                  </span>
                  <span className="text-white font-medium text-right">{item.camera}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-neutral-400" /> Optics & Lens
                  </span>
                  <span className="text-white font-medium text-right">{item.lens}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Exposure
                  </span>
                  <span className="text-amber-300 font-medium text-right">{item.settings}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Location
                  </span>
                  <span className="text-neutral-200 text-right">{item.location}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" /> Date
                  </span>
                  <span className="text-neutral-300 text-right">{item.date}</span>
                </div>
              </div>

              {/* Engagement Stats */}
              <div className="mt-4 flex items-center justify-between px-2 text-xs font-mono text-neutral-400">
                <button
                  onClick={() => onLike && onLike(item.id)}
                  className="flex items-center gap-1.5 hover:text-red-400 transition-colors cursor-pointer py-1"
                >
                  <Heart className="w-4 h-4 text-red-500 fill-red-500/20" />
                  <span>{item.likes} Likes</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>{item.views} Views</span>
                </div>
              </div>
            </div>

            {/* ONE-CLICK DIRECT DOWNLOAD ENGINE BUTTON */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className={`w-full relative overflow-hidden py-3.5 px-5 rounded-2xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl ${
                  downloadSuccess
                    ? 'bg-emerald-500 text-white font-semibold'
                    : downloading
                    ? 'bg-sky-600 text-white cursor-wait'
                    : 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.02] active:scale-[0.98]'
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
                      <Download className="w-5 h-5" />
                      <span className="font-semibold tracking-wide">
                        {item.type === 'video' ? 'DOWNLOAD 4K VIDEO' : 'DOWNLOAD HD PHOTO'}
                      </span>
                    </>
                  )}
                </div>
              </button>

              <p className="text-[10px] text-neutral-400 text-center font-mono mt-2">
                ⚡ Direct 1-Click Blob Engine • File Asli Google Drive
              </p>
            </div>

          </motion.div>
        )}

      </div>
    </motion.div>
  );
}
