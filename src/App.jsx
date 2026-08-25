import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { initialMediaCatalog, galleryCategories } from './data/mediaCatalog';
import { googleSheetsSync } from './utils/googleSheetsSync';
import { soundEngine } from './utils/soundEngine';

import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { SpatialStage } from './components/SpatialStage';
import { MasonryStage } from './components/MasonryStage';
import { CinemaLightbox } from './components/CinemaLightbox';
import { SyncModal } from './components/SyncModal';
import { StatsFooter } from './components/StatsFooter';

export function App() {
  // 1. Media State with Local Storage fallback and Initial Catalog
  const [mediaList, setMediaList] = useState(() => {
    const saved = googleSheetsSync.getLocalStoredData();
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    return initialMediaCatalog;
  });

  // 2. View & Filter State (Direct access - no blocking intro)
  const [viewMode, setViewMode] = useState('spatial'); // 'spatial' | 'masonry'
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
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

  // Update likes
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

  // 4. Filtered & Sorted Media
  const filteredMedia = useMemo(() => {
    let result = [...mediaList];

    // Category Filter
    if (activeCategory === 'photos') {
      result = result.filter((m) => m.type === 'image');
    } else if (activeCategory === 'videos') {
      result = result.filter((m) => m.type === 'video');
    } else if (activeCategory === 'featured') {
      result = result.filter((m) => m.featured);
    } else if (activeCategory === 'edits') {
      result = result.filter(
        (m) =>
          (m.category && (m.category.includes('Template') || m.category.includes('Motion'))) ||
          (m.tags && m.tags.some((t) => t.toLowerCase().includes('edit') || t.toLowerCase().includes('template')))
      );
    } else if (activeCategory === 'street') {
      result = result.filter(
        (m) =>
          (m.category && (m.category.includes('Street') || m.category.includes('Urban'))) ||
          (m.tags && m.tags.some((t) => t.toLowerCase().includes('street')))
      );
    } else if (activeCategory === 'portrait') {
      result = result.filter(
        (m) =>
          (m.category && m.category.includes('Portrait')) ||
          (m.tags && m.tags.some((t) => t.toLowerCase().includes('portrait')))
      );
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          (m.title && m.title.toLowerCase().includes(q)) ||
          (m.category && m.category.toLowerCase().includes(q)) ||
          (m.camera && m.camera.toLowerCase().includes(q)) ||
          (m.location && m.location.toLowerCase().includes(q)) ||
          (m.story && m.story.toLowerCase().includes(q)) ||
          (m.tags && m.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Sort
    if (sortBy === 'featured') {
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    } else if (sortBy === 'likes') {
      result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (sortBy === 'views') {
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    return result;
  }, [mediaList, activeCategory, searchQuery, sortBy]);

  // Lightbox Navigation
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

  const photoCount = useMemo(() => mediaList.filter((m) => m.type === 'image').length, [mediaList]);
  const videoCount = useMemo(() => mediaList.filter((m) => m.type === 'video').length, [mediaList]);

  return (
    <div className="min-h-screen bg-[#070709] text-[#e6e5e5] relative selection:bg-sky-500/30 selection:text-white flex flex-col justify-between overflow-x-hidden">
      
      {/* Top Navigation */}
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalCount={mediaList.length}
        photoCount={photoCount}
        videoCount={videoCount}
        onOpenSync={() => setIsSyncModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Container */}
      <main className="flex-1 pt-18">
        
        {/* Floating Filter Pills */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-1 pb-1">
          <FilterBar
            categories={galleryCategories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            filteredCount={filteredMedia.length}
          />
        </div>

        {/* Dynamic Display Mode */}
        {viewMode === 'spatial' ? (
          <SpatialStage
            items={filteredMedia}
            onSelect={(item) => setSelectedMedia(item)}
          />
        ) : (
          <MasonryStage
            items={filteredMedia}
            onSelect={(item) => setSelectedMedia(item)}
          />
        )}
      </main>

      {/* Footer & Metrics */}
      <StatsFooter
        totalCount={mediaList.length}
        photoCount={photoCount}
        videoCount={videoCount}
        viewMode={viewMode}
      />

      {/* Fullscreen Instant Cinema Lightbox */}
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

      {/* Google Sheets Sync Modal */}
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
