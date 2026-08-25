import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { initialMediaCatalog } from './data/mediaCatalog';
import { soundEngine } from './utils/soundEngine';

import { IntroOverlay } from './components/IntroOverlay';
import { ScatteredCanvas } from './components/ScatteredCanvas';
import { BottomNav } from './components/BottomNav';
import { CinemaLightbox } from './components/CinemaLightbox';
import { SyncModal } from './components/SyncModal';

export function App() {
  // 1. Media State
  const [mediaList, setMediaList] = useState(initialMediaCatalog);

  // 2. App State
  const [hasEntered, setHasEntered] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // 3. User Likes Persistence
  const [userLikes, setUserLikes] = useState(() => {
    try {
      const raw = localStorage.getItem('haikel_gallery_likes');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const handleLike = (mediaId) => {
    soundEngine.playClick();
    setUserLikes((prev) => {
      const isAlreadyLiked = prev[mediaId];
      const updatedLikes = { ...prev, [mediaId]: !isAlreadyLiked };
      localStorage.setItem('haikel_gallery_likes', JSON.stringify(updatedLikes));
      return updatedLikes;
    });

    setMediaList((prevList) =>
      prevList.map((item) => {
        if (item.id === mediaId) {
          const delta = userLikes[mediaId] ? -1 : 1;
          return { ...item, likes: Math.max(0, (item.likes || 0) + delta) };
        }
        return item;
      })
    );
  };

  // 4. Filtered Media
  const filteredMedia = useMemo(() => {
    let result = [...mediaList];

    if (activeCategory === 'photos') {
      result = result.filter((m) => m.type === 'image');
    } else if (activeCategory === 'videos') {
      result = result.filter((m) => m.type === 'video');
    } else if (activeCategory === 'featured') {
      result = result.filter((m) => m.featured);
    }

    return result;
  }, [mediaList, activeCategory]);

  // 5. Lightbox Navigation
  const currentLightboxIndex = useMemo(() => {
    if (!selectedMedia) return -1;
    return filteredMedia.findIndex((m) => m.id === selectedMedia.id);
  }, [selectedMedia, filteredMedia]);

  const handlePrevMedia = () => {
    if (currentLightboxIndex > 0) {
      setSelectedMedia(filteredMedia[currentLightboxIndex - 1]);
    } else {
      setSelectedMedia(filteredMedia[filteredMedia.length - 1]);
    }
  };

  const handleNextMedia = () => {
    if (currentLightboxIndex < filteredMedia.length - 1) {
      setSelectedMedia(filteredMedia[currentLightboxIndex + 1]);
    } else {
      setSelectedMedia(filteredMedia[0]);
    }
  };

  // Sync Modal Shortcut: Ctrl+Shift+S
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setIsSyncModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full h-screen bg-[#050508] text-white/80 overflow-hidden select-none">
      
      {/* 1. Cinema Theater Opening Screen (Curtains + Dolby Bass Boom) */}
      <AnimatePresence>
        {!hasEntered && (
          <IntroOverlay 
            onEnter={() => setHasEntered(true)} 
            totalCount={mediaList.length}
          />
        )}
      </AnimatePresence>

      {/* 2. Main Cinema Gallery (Anti-Lag Virtualized Canvas & Mobile Feed) */}
      {hasEntered && (
        <>
          <ScatteredCanvas
            items={filteredMedia}
            onSelect={(item) => setSelectedMedia(item)}
          />

          {/* Bottom Floating Navigation */}
          <BottomNav
            activeCategory={activeCategory}
            onFilterCategory={(cat) => setActiveCategory(cat)}
            onOpenSync={() => setIsSyncModalOpen(true)}
            totalCount={filteredMedia.length}
          />
        </>
      )}

      {/* 3. Fullscreen Dolby Cinema Lightbox Player */}
      <AnimatePresence>
        {selectedMedia && (
          <CinemaLightbox
            item={selectedMedia}
            currentIndex={currentLightboxIndex}
            totalCount={filteredMedia.length}
            onClose={() => setSelectedMedia(null)}
            onPrev={handlePrevMedia}
            onNext={handleNextMedia}
            onLike={handleLike}
          />
        )}
      </AnimatePresence>

      {/* 4. Google Sheets Sync Modal */}
      <AnimatePresence>
        {isSyncModalOpen && (
          <SyncModal
            isOpen={isSyncModalOpen}
            onClose={() => setIsSyncModalOpen(false)}
            onSyncSuccess={(newData) => setMediaList(newData)}
            currentCount={mediaList.length}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
