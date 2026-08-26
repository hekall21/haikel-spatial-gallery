/* ==========================================================================
   HAIKEL SPATIAL GALLERY — ENTERPRISE DATABASE ENGINE (IndexedDB + Cloud Sync)
   High-Performance Client-Side Relational Store • Instant Multi-Facet Querying
   ========================================================================== */

class HaikelMediaDatabase {
  constructor() {
    this.dbName = 'HaikelSpatialGalleryDB';
    this.dbVersion = 2;
    this.db = null;
    this.isReady = false;
    this.memoryCatalog = [];
    this.readyPromise = this.init();
  }

  async init() {
    return new Promise((resolve) => {
      // Fallback if IndexedDB is not supported in environment
      if (!window.indexedDB) {
        console.warn('[HaikelMediaDB] IndexedDB not available, using memory/localStorage fallback');
        this.initMemoryFallback();
        resolve(this);
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. Media Master Store
        if (!db.objectStoreNames.contains('media')) {
          const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
          mediaStore.createIndex('type', 'type', { unique: false });
          mediaStore.createIndex('category', 'category', { unique: false });
          mediaStore.createIndex('orientation', 'orientation', { unique: false });
          mediaStore.createIndex('aspectRatio', 'aspectRatio', { unique: false });
          mediaStore.createIndex('likes', 'likes', { unique: false });
          mediaStore.createIndex('views', 'views', { unique: false });
          mediaStore.createIndex('isFavorite', 'isFavorite', { unique: false });
        }

        // 2. Watch History & Playback Progress Store
        if (!db.objectStoreNames.contains('watch_progress')) {
          const progressStore = db.createObjectStore('watch_progress', { keyPath: 'id' });
          progressStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        // 3. Playlists & Collections Store
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }

        // 4. Key-Value Config / Analytics Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        this.isReady = true;
        await this.seedInitialCatalog();
        resolve(this);
      };

      request.onerror = (event) => {
        console.error('[HaikelMediaDB] Open DB error:', event.target.error);
        this.initMemoryFallback();
        resolve(this);
      };
    });
  }

  // Seed database from window.MEDIA_CATALOG and sync saved user state
  async seedInitialCatalog() {
    const rawCatalog = window.MEDIA_CATALOG || [];
    if (!rawCatalog.length) return;

    // Load saved favorites/likes from localStorage for persistence migration
    let savedLikes = {};
    let savedFavorites = {};
    try {
      savedLikes = JSON.parse(localStorage.getItem('haikel_gallery_likes') || '{}');
      savedFavorites = JSON.parse(localStorage.getItem('haikel_gallery_favorites') || '{}');
    } catch (e) {}

    const tx = this.db.transaction(['media', 'watch_progress'], 'readwrite');
    const store = tx.objectStore('media');

    // Get existing records to merge user interactions
    const existingMap = new Map();
    await new Promise((res) => {
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          existingMap.set(cursor.value.id, cursor.value);
          cursor.continue();
        } else {
          res();
        }
      };
      cursorReq.onerror = () => res();
    });

    for (const item of rawCatalog) {
      const existing = existingMap.get(item.id) || {};
      const isLiked = savedLikes[item.id] !== undefined ? savedLikes[item.id] : (existing.isLiked || false);
      const isFav = savedFavorites[item.id] !== undefined ? savedFavorites[item.id] : (existing.isFavorite || false);
      const baseLikes = item.likes !== undefined ? item.likes : (item.type === 'video' ? 45 : 28);
      const likesCount = isLiked ? (baseLikes + 1) : (existing.likes !== undefined ? existing.likes : baseLikes);
      const viewsCount = existing.views !== undefined ? existing.views : (item.views || Math.floor(Math.random() * 200 + 100));

      const record = {
        ...item,
        likes: likesCount,
        views: viewsCount,
        isLiked: isLiked,
        isFavorite: isFav,
        watchProgress: existing.watchProgress || 0,
        lastWatchedAt: existing.lastWatchedAt || null,
        tags: item.tags || [item.type, item.category, item.aspectRatio || '4K'],
        updatedAt: Date.now()
      };

      store.put(record);
    }

    return new Promise((res) => {
      tx.oncomplete = () => {
        this.cacheCatalogInMemory().then(res);
      };
      tx.onerror = () => res();
    });
  }

  async cacheCatalogInMemory() {
    if (!this.db) return;
    const tx = this.db.transaction('media', 'readonly');
    const store = tx.objectStore('media');
    const req = store.getAll();
    return new Promise((res) => {
      req.onsuccess = () => {
        this.memoryCatalog = req.result || [];
        res(this.memoryCatalog);
      };
      req.onerror = () => res([]);
    });
  }

  initMemoryFallback() {
    this.memoryCatalog = (window.MEDIA_CATALOG || []).map(it => ({
      ...it,
      likes: it.likes || (it.type === 'video' ? 45 : 28),
      views: it.views || 150,
      isLiked: false,
      isFavorite: false,
      watchProgress: 0
    }));
    this.isReady = true;
  }

  // =========================================================================
  // QUERY & SEARCH API
  // =========================================================================

  /**
   * Fast multi-facet query engine
   * @param {Object} options - { type, category, orientation, search, sortBy, isFavorite, onlyWatched }
   */
  async queryMedia(options = {}) {
    await this.readyPromise;
    let items = [...this.memoryCatalog];

    // 1. Type Filter (all | photo | video)
    if (options.type && options.type !== 'all') {
      items = items.filter(it => it.type === options.type);
    }

    // 2. Video Orientation / Sub-Category Filter (vertical | horizontal | square | portrait)
    if (options.orientation && options.orientation !== 'all') {
      items = items.filter(it => it.orientation === options.orientation);
    }

    // 3. Category Filter
    if (options.category && options.category !== 'all') {
      if (options.category === 'reels') {
        items = items.filter(it => it.orientation === 'vertical' || it.aspectRatio === '9:16');
      } else if (options.category === 'cinema') {
        items = items.filter(it => it.orientation === 'horizontal' || it.aspectRatio === '16:9');
      } else if (options.category === 'edits') {
        items = items.filter(it => (it.title && it.title.includes('TEMPLATE')) || (it.category && it.category.includes('Motion')));
      } else {
        items = items.filter(it => it.category?.toLowerCase() === options.category.toLowerCase());
      }
    }

    // 4. Favorites Only Filter
    if (options.isFavorite) {
      items = items.filter(it => it.isFavorite || it.isLiked);
    }

    // 5. Watch History Only Filter
    if (options.onlyWatched) {
      items = items.filter(it => (it.watchProgress && it.watchProgress > 0) || it.lastWatchedAt);
      items.sort((a, b) => (b.lastWatchedAt || 0) - (a.lastWatchedAt || 0));
    }

    // 6. Full-Text Search Query
    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      items = items.filter(it =>
        it.title?.toLowerCase().includes(q) ||
        it.id?.toLowerCase().includes(q) ||
        it.category?.toLowerCase().includes(q) ||
        it.aspectRatio?.toLowerCase().includes(q) ||
        it.resolution?.toLowerCase().includes(q) ||
        it.date?.includes(q) ||
        (it.tags && it.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // 7. Sorting Engine
    const sort = options.sortBy || 'default';
    if (sort === 'likes' || sort === 'popular') {
      items.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (sort === 'views') {
      items.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sort === 'duration_desc') {
      items.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    } else if (sort === 'duration_asc') {
      items.sort((a, b) => (a.duration || 0) - (b.duration || 0));
    } else if (sort === 'newest') {
      items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }

    return items;
  }

  // =========================================================================
  // MUTATION API (Likes, Favorites, Views, Watch Progress)
  // =========================================================================

  /**
   * Toggle Like for a media item
   */
  async toggleLike(id) {
    await this.readyPromise;
    const item = this.memoryCatalog.find(it => it.id === id);
    if (!item) return null;

    const newLiked = !item.isLiked;
    item.isLiked = newLiked;
    item.likes = Math.max(0, (item.likes || 0) + (newLiked ? 1 : -1));

    // Save to localStorage for quick sync
    try {
      const likesMap = JSON.parse(localStorage.getItem('haikel_gallery_likes') || '{}');
      if (newLiked) likesMap[id] = true;
      else delete likesMap[id];
      localStorage.setItem('haikel_gallery_likes', JSON.stringify(likesMap));
    } catch (e) {}

    // Save to IndexedDB
    if (this.db) {
      try {
        const tx = this.db.transaction('media', 'readwrite');
        tx.objectStore('media').put(item);
      } catch (e) {
        console.warn('DB like update error:', e);
      }
    }

    // Sync to backend DB API (optimistic background dispatch)
    this.dispatchBackendSync('/@api/likes', { id, action: newLiked ? 'like' : 'unlike' });

    return { id, isLiked: newLiked, likes: item.likes };
  }

  /**
   * Toggle Favorite flag
   */
  async toggleFavorite(id) {
    await this.readyPromise;
    const item = this.memoryCatalog.find(it => it.id === id);
    if (!item) return null;

    const newFav = !item.isFavorite;
    item.isFavorite = newFav;

    try {
      const favMap = JSON.parse(localStorage.getItem('haikel_gallery_favorites') || '{}');
      if (newFav) favMap[id] = true;
      else delete favMap[id];
      localStorage.setItem('haikel_gallery_favorites', JSON.stringify(favMap));
    } catch (e) {}

    if (this.db) {
      try {
        const tx = this.db.transaction('media', 'readwrite');
        tx.objectStore('media').put(item);
      } catch (e) {}
    }

    return { id, isFavorite: newFav };
  }

  /**
   * Increment view count when video/photo is opened
   */
  async incrementViewCount(id) {
    await this.readyPromise;
    const item = this.memoryCatalog.find(it => it.id === id);
    if (!item) return;

    item.views = (item.views || 0) + 1;

    if (this.db) {
      try {
        const tx = this.db.transaction('media', 'readwrite');
        tx.objectStore('media').put(item);
      } catch (e) {}
    }

    // Background sync to backend API
    this.dispatchBackendSync('/@api/views', { id });
  }

  /**
   * Save real-time video watch progress for Resume Playback feature
   */
  async saveWatchProgress(id, currentTime, duration) {
    if (!id || isNaN(currentTime) || !duration) return;
    await this.readyPromise;

    const item = this.memoryCatalog.find(it => it.id === id);
    const pct = Math.min(100, Math.round((currentTime / duration) * 100));
    const now = Date.now();

    if (item) {
      item.watchProgress = pct;
      item.lastWatchedAt = now;
      item.lastCurrentTime = currentTime;
    }

    const progressRecord = {
      id,
      currentTime: Math.round(currentTime * 10) / 10,
      duration: Math.round(duration * 10) / 10,
      percentage: pct,
      lastUpdated: now
    };

    // Store in IndexedDB
    if (this.db) {
      try {
        const tx = this.db.transaction(['media', 'watch_progress'], 'readwrite');
        if (item) tx.objectStore('media').put(item);
        tx.objectStore('watch_progress').put(progressRecord);
      } catch (e) {}
    }
  }

  /**
   * Get saved watch progress for resuming playback
   */
  async getWatchProgress(id) {
    await this.readyPromise;
    if (!this.db) {
      const item = this.memoryCatalog.find(it => it.id === id);
      return item?.lastCurrentTime ? { currentTime: item.lastCurrentTime } : null;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction('watch_progress', 'readonly');
        const req = tx.objectStore('watch_progress').get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  /**
   * Compute comprehensive live analytics from Database
   */
  async getDatabaseStats() {
    await this.readyPromise;
    const all = this.memoryCatalog;
    const videos = all.filter(it => it.type === 'video');
    const photos = all.filter(it => it.type === 'photo');

    const totalDurationSecs = videos.reduce((acc, v) => acc + (v.duration || 0), 0);
    const totalLikes = all.reduce((acc, it) => acc + (it.likes || 0), 0);
    const totalViews = all.reduce((acc, it) => acc + (it.views || 0), 0);
    const verticalReelsCount = videos.filter(v => v.orientation === 'vertical' || v.aspectRatio === '9:16').length;
    const widescreenCount = videos.filter(v => v.orientation === 'horizontal' || v.aspectRatio === '16:9').length;
    const squareCount = videos.filter(v => v.orientation === 'square' || v.aspectRatio === '1:1').length;

    const topLiked = [...videos].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0] || null;
    const topViewed = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0))[0] || null;

    return {
      totalMedia: all.length,
      totalVideos: videos.length,
      totalPhotos: photos.length,
      totalDurationMinutes: Math.round(totalDurationSecs / 60 * 10) / 10,
      totalLikes,
      totalViews,
      verticalReelsCount,
      widescreenCount,
      squareCount,
      topLiked,
      topViewed
    };
  }

  // Background non-blocking network dispatch to backend API
  dispatchBackendSync(endpoint, payload) {
    try {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {
        // Silently pass in offline or static environments
      });
    } catch (e) {}
  }
}

// Global Singleton Instance
window.HaikelMediaDB = new HaikelMediaDatabase();
