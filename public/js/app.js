/* ==========================================================================
   HAIKEL 3D SPATIAL MEDIA ARCHIVE — ENTERPRISE DATABASE-DRIVEN ENGINE
   IndexedDB Fast Querying • Video Duration HUD • Like/Favorite Sync • Resume Watch
   ========================================================================== */

class HaikelSpatialArchive {
  constructor() {
    this.catalog = [];
    this.filteredCatalog = [];
    this.activeClusterItemId = null;
    this.currentStage = 'space'; // 'space' | 'grid'

    // Multi-Facet Database Filters
    this.currentFilter = 'all'; // 'all' | 'photo' | 'video'
    this.currentVideoSubFilter = 'all'; // 'all' | 'reels' | 'cinema' | 'edits' | 'favorites' | 'history'
    this.currentSort = 'default';
    this.searchTerm = '';

    // Camera & Orbit State
    this.cameraPreset = 'default';
    this.isAutopilot = false;
    this.autopilotAngle = 0;

    // Stages
    this.stageSpace = document.getElementById('stage-space');
    this.stageGrid = document.getElementById('stage-grid');
    this.spaceCluster = document.getElementById('space-cluster');
    this.masonryGrid = document.getElementById('masonry-grid');
    this.videoSubDock = document.getElementById('video-sub-dock');

    // 3D Parallax & Touch Tracking
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.pan = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    // Mobile swipe tracking for Lightbox
    this.touchStartX = 0;
    this.touchStartY = 0;

    // Active Modal Item
    this.currentModalItem = null;
    this.progressSaveThrottleTimer = null;

    this.init();
  }

  async init() {
    // Wait for Database Engine to be ready
    if (window.HaikelMediaDB) {
      await window.HaikelMediaDB.readyPromise;
    }

    this.initCursor();
    this.initCosmicUniverseCanvas();
    this.initEvents();
    this.initTouchGestures();
    this.initClock();
    this.startParallaxEngine();
    this.initAutoAudio();

    await this.refreshFromDatabase();

    // Debounced resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.renderSpaceCluster(), 150);
    });
  }

  initAutoAudio() {
    const unlockAudio = () => {
      if (window.CinematicAudio) {
        window.CinematicAudio.startAmbient();
      }
    };

    ['click', 'touchstart', 'keydown', 'wheel', 'pointerdown'].forEach(evt => {
      document.addEventListener(evt, unlockAudio, { once: true, passive: true });
    });
  }

  // =========================================================================
  // DATABASE QUERY & FILTER ENGINE
  // =========================================================================

  async refreshFromDatabase() {
    if (!window.HaikelMediaDB) {
      this.catalog = window.MEDIA_CATALOG || [];
      this.filteredCatalog = this.catalog;
      this.updateCounters();
      this.renderSpaceCluster();
      this.renderMasonryGrid();
      return;
    }

    // Determine query parameters based on active filters
    const isVideo = this.currentFilter === 'video';
    const subF = isVideo ? this.currentVideoSubFilter : 'all';

    const queryOpts = {
      type: this.currentFilter,
      search: this.searchTerm,
      sortBy: this.currentSort
    };

    if (isVideo && subF !== 'all') {
      if (subF === 'favorites') {
        queryOpts.isFavorite = true;
      } else if (subF === 'history') {
        queryOpts.onlyWatched = true;
      } else {
        queryOpts.category = subF;
      }
    }

    this.filteredCatalog = await window.HaikelMediaDB.queryMedia(queryOpts);
    this.catalog = window.HaikelMediaDB.memoryCatalog || this.filteredCatalog;

    this.updateCounters();
    this.renderSpaceCluster();
    this.renderMasonryGrid();
  }

  updateCounters() {
    const totalCount = this.catalog.length;
    const photosCount = this.catalog.filter(it => it.type === 'photo').length;
    const videosCount = this.catalog.filter(it => it.type === 'video').length;

    const countAll = document.getElementById('count-all');
    const countPhoto = document.getElementById('count-photo');
    const countVideo = document.getElementById('count-video');
    const dockCount = document.getElementById('dock-counter-text');
    const gridCount = document.getElementById('grid-item-count');

    if (countAll) countAll.textContent = totalCount;
    if (countPhoto) countPhoto.textContent = photosCount;
    if (countVideo) countVideo.textContent = videosCount;
    if (dockCount) dockCount.textContent = `${this.filteredCatalog.length} KARYA SIAP DITAMPILKAN`;
    if (gridCount) gridCount.textContent = this.filteredCatalog.length;
  }

  // =========================================================================
  // EVENTS & UI CONTROLLERS
  // =========================================================================

  initEvents() {
    // Stage Mode Switcher (3D SPACE vs GRID VIEW)
    const btnSpace = document.getElementById('btn-view-space');
    const btnGrid = document.getElementById('btn-view-grid');

    btnSpace?.addEventListener('click', () => this.switchStage('space'));
    btnGrid?.addEventListener('click', () => this.switchStage('grid'));

    // Autopilot Auto-Orbit Toggle
    const btnAutopilot = document.getElementById('btn-autopilot');
    btnAutopilot?.addEventListener('click', () => {
      this.isAutopilot = !this.isAutopilot;
      btnAutopilot.classList.toggle('active', this.isAutopilot);
      window.CinematicAudio?.playWarp();
    });

    // Camera Preset Buttons
    document.querySelectorAll('.preset-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        window.CinematicAudio?.playUiClick();
        document.querySelectorAll('.preset-pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        this.cameraPreset = btn.getAttribute('data-cam');
      });
    });

    // Master Filter Buttons (ALL / PHOTOS / VIDEOS)
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        window.CinematicAudio?.playUiClick();
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.getAttribute('data-filter');

        // Toggle Video Sub-Filter Dock with smooth transition
        if (this.videoSubDock) {
          if (this.currentFilter === 'video') {
            this.videoSubDock.style.display = 'flex';
          } else {
            this.videoSubDock.style.display = 'none';
          }
        }

        await this.refreshFromDatabase();
      });
    });

    // Video Sub-Filter Pills (REELS / 16:9 CINEMA / EDITS / FAVORITES / HISTORY)
    document.querySelectorAll('.sub-filter-pill').forEach(btn => {
      btn.addEventListener('click', async () => {
        window.CinematicAudio?.playUiClick();
        document.querySelectorAll('.sub-filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentVideoSubFilter = btn.getAttribute('data-vfilter');
        await this.refreshFromDatabase();
      });
    });

    // Grid Sort Dropdown
    const sortSelect = document.getElementById('grid-sort-select');
    sortSelect?.addEventListener('change', async (e) => {
      window.CinematicAudio?.playUiClick();
      this.currentSort = e.target.value;
      await this.refreshFromDatabase();
    });

    // 3D Space Focus Lightbox Action
    document.getElementById('btn-open-active-lightbox')?.addEventListener('click', () => {
      const activeItem = this.catalog.find(it => it.id === this.activeClusterItemId) || this.filteredCatalog[0];
      if (activeItem) this.openCinemaModal(activeItem);
    });

    document.getElementById('btn-shuffle-space')?.addEventListener('click', () => {
      window.CinematicAudio?.playWarp();
      this.shuffleSpaceCluster();
    });

    // Debounced Grid Search Input
    const searchInput = document.getElementById('grid-search-input');
    let searchDebounce;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(async () => {
        this.searchTerm = e.target.value.toLowerCase().trim();
        await this.refreshFromDatabase();
      }, 120);
    });

    // Cinema Lightbox Modal Controls
    const modal = document.getElementById('cinema-modal');
    const backdrop = document.getElementById('modal-backdrop');
    const closeBtn = document.getElementById('modal-close-btn');
    const prevBtn = document.getElementById('modal-prev-btn');
    const nextBtn = document.getElementById('modal-next-btn');

    closeBtn?.addEventListener('click', () => this.closeCinemaModal());
    backdrop?.addEventListener('click', () => this.closeCinemaModal());
    prevBtn?.addEventListener('click', () => this.navigateCinemaModal(-1));
    nextBtn?.addEventListener('click', () => this.navigateCinemaModal(1));

    // Keyboard Navigation & Shortcuts
    window.addEventListener('keydown', (e) => {
      if (modal?.classList.contains('active')) {
        if (e.key === 'Escape') {
          this.closeCinemaModal();
        } else if (e.key === 'ArrowLeft') {
          this.navigateCinemaModal(-1);
        } else if (e.key === 'ArrowRight') {
          this.navigateCinemaModal(1);
        } else if (e.key === ' ' && this.currentModalItem?.type === 'video') {
          e.preventDefault();
          const vid = document.getElementById('modal-active-video');
          const playBtn = document.getElementById('hud-play-btn');
          if (playBtn) playBtn.click();
          else if (vid) vid.paused ? vid.play() : vid.pause();
        } else if (e.key.toLowerCase() === 'm' && this.currentModalItem?.type === 'video') {
          const muteBtn = document.getElementById('hud-mute-btn');
          if (muteBtn) muteBtn.click();
        } else if (e.key.toLowerCase() === 'f') {
          const fsBtn = document.getElementById('hud-fullscreen-btn');
          if (fsBtn) fsBtn.click();
        } else if (e.key.toLowerCase() === 'l' && this.currentModalItem) {
          const likeBtn = document.getElementById('modal-like-btn');
          if (likeBtn) likeBtn.click();
        }
      }
    });

    // Ambient Sound Toggle
    const audioToggle = document.getElementById('audio-hud-toggle');
    audioToggle?.addEventListener('click', () => {
      const isPlaying = window.CinematicAudio?.toggleGlobalAudio();
      audioToggle.classList.toggle('playing', isPlaying);
    });

    // Mouse Tracking in 3D Space
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      this.mouse.targetY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    }, { passive: true });

    this.stageSpace?.addEventListener('mousedown', (e) => {
      if (e.target.closest('.space-center-hud, .hud-top-bar, .hud-bottom-dock, .camera-presets-dock, button, select, input')) return;
      this.isDragging = true;
      this.isAutopilot = false;
      document.getElementById('btn-autopilot')?.classList.remove('active');
      this.dragStart.x = e.clientX - this.pan.targetX;
      this.dragStart.y = e.clientY - this.pan.targetY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.pan.targetX = e.clientX - this.dragStart.x;
      this.pan.targetY = e.clientY - this.dragStart.y;
    }, { passive: true });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  initTouchGestures() {
    const stageSpace = document.getElementById('stage-space');
    const modalStage = document.querySelector('.modal-media-stage');

    // Touch drag on 3D Space Viewport
    stageSpace?.addEventListener('touchstart', (e) => {
      if (e.target.closest('.space-center-hud, .hud-top-bar, .hud-bottom-dock, .camera-presets-dock, button, select, input')) return;
      const touch = e.touches[0];
      this.isDragging = true;
      this.isAutopilot = false;
      this.dragStart.x = touch.clientX - this.pan.targetX;
      this.dragStart.y = touch.clientY - this.pan.targetY;
    }, { passive: true });

    stageSpace?.addEventListener('touchmove', (e) => {
      if (!this.isDragging) return;
      const touch = e.touches[0];
      this.pan.targetX = touch.clientX - this.dragStart.x;
      this.pan.targetY = touch.clientY - this.dragStart.y;
      this.mouse.targetX = (touch.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      this.mouse.targetY = (touch.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    }, { passive: true });

    stageSpace?.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Touch swipe on Cinema Lightbox
    modalStage?.addEventListener('touchstart', (e) => {
      if (e.target.closest('video, audio, button, a, input, select, .video-hud-bar, .video-center-overlay')) return;
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    modalStage?.addEventListener('touchend', (e) => {
      if (e.target.closest('video, audio, button, a, input, select, .video-hud-bar, .video-center-overlay')) return;
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const dx = touchEndX - this.touchStartX;
      const dy = touchEndY - this.touchStartY;

      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) {
          this.navigateCinemaModal(1);
        } else {
          this.navigateCinemaModal(-1);
        }
      }
    }, { passive: true });
  }

  switchStage(stage) {
    window.CinematicAudio?.playUiClick();
    this.currentStage = stage;

    const btnSpace = document.getElementById('btn-view-space');
    const btnGrid = document.getElementById('btn-view-grid');

    if (stage === 'space') {
      this.stageSpace?.classList.add('active');
      this.stageGrid?.classList.remove('active');
      btnSpace?.classList.add('active');
      btnGrid?.classList.remove('active');
    } else {
      this.stageSpace?.classList.remove('active');
      this.stageGrid?.classList.add('active');
      btnSpace?.classList.remove('active');
      btnGrid?.classList.add('active');
      this.renderMasonryGrid();
    }
  }

  // =========================================================================
  // 1. RENDER 3D SPATIAL GALAXY CLUSTER
  // =========================================================================

  renderSpaceCluster() {
    if (!this.spaceCluster) return;

    const isMobile = window.innerWidth <= 768;
    const scale = isMobile ? 0.55 : 1.0;
    const cardW = isMobile ? 145 : 230;
    const cardH = isMobile ? 95 : 145;

    const maxCards = isMobile ? 9 : 15;
    const clusterItems = this.filteredCatalog.slice(0, maxCards);

    const baseCoords = [
      { x: -390, y: -160, z: 40, r: -5 },
      { x: -130, y: -230, z: -20, r: 3 },
      { x: 150, y: -200, z: 20, r: -3 },
      { x: 430, y: -150, z: -40, r: 6 },

      { x: -450, y: 70, z: -30, r: 4 },
      { x: -230, y: 150, z: 30, r: -4 },
      { x: 230, y: 140, z: 50, r: 3 },
      { x: 470, y: 90, z: -10, r: -5 },

      { x: -330, y: 320, z: 20, r: -3 },
      { x: 0, y: 340, z: -50, r: 2 },
      { x: 340, y: 310, z: 10, r: -4 },

      { x: -550, y: -60, z: -60, r: 5 },
      { x: 560, y: -40, z: -50, r: -4 },
      { x: 0, y: -310, z: -30, r: 2 },
      { x: -280, y: -280, z: 10, r: -2 }
    ];

    this.spaceCluster.innerHTML = clusterItems.map((item, idx) => {
      const c = baseCoords[idx % baseCoords.length];
      const scaledX = Math.round(c.x * scale);
      const scaledY = Math.round(c.y * scale);
      const scaledZ = Math.round(c.z * scale);
      const isActive = idx === 0;

      const thumbUrl = item.thumb || item.url;
      const durationBadge = item.type === 'video' ? `<span class="card-duration-badge">▶ ${Math.round(item.duration || 15)}s</span>` : '';

      return `
        <div class="floating-card ${isActive ? 'active-card' : ''} clickable"
             id="space-card-${item.id}"
             data-id="${item.id}"
             style="width: ${cardW}px; height: ${cardH}px; transform: translate3d(calc(-50% + ${scaledX}px), calc(-50% + ${scaledY}px), ${scaledZ}px) rotate(${c.r}deg); z-index: ${20 + idx};">
          <div class="card-inner">
            <span class="card-badge-type">${item.type === 'video' ? `▶ ${item.aspectRatio || '4K'}` : '📷 PHOTO'}</span>
            ${durationBadge}
            <img src="${thumbUrl}" alt="${item.title}" loading="lazy" decoding="async" />
            ${item.type === 'video' ? '<div class="card-center-play">▶</div>' : ''}
            ${item.watchProgress > 0 ? `<div class="card-progress-bar"><div class="card-progress-fill" style="width: ${item.watchProgress}%"></div></div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Attach card click listeners
    this.spaceCluster.querySelectorAll('.floating-card').forEach(card => {
      const id = card.getAttribute('data-id');
      const item = this.catalog.find(it => it.id === id);
      if (!item) return;

      card.addEventListener('mouseenter', () => {
        this.selectActiveClusterItem(item);
        window.CinematicAudio?.playUiClick();
      });

      card.addEventListener('click', (e) => {
        e.preventDefault();
        this.openCinemaModal(item);
      });
    });

    if (clusterItems.length > 0) {
      this.selectActiveClusterItem(clusterItems[0]);
    }
  }

  selectActiveClusterItem(item) {
    if (!item) return;
    this.activeClusterItemId = item.id;

    this.spaceCluster?.querySelectorAll('.floating-card').forEach(c => {
      c.classList.toggle('active-card', c.getAttribute('data-id') === item.id);
    });

    const badgeEl = document.getElementById('focus-badge');
    const titleEl = document.getElementById('focus-title');
    const descEl = document.getElementById('focus-desc');

    const durationText = item.duration ? ` • ${Math.round(item.duration)}s` : '';
    const likesText = item.likes ? ` • ❤️ ${item.likes}` : '';

    if (badgeEl) badgeEl.textContent = `${item.type === 'video' ? `▶ ${item.aspectRatio || '4K'} VIDEO` : '📷 PHOTO'}${durationText}${likesText}`;
    if (titleEl) titleEl.textContent = item.title;
    if (descEl) descEl.textContent = `DATABASE MASTER // ${item.category.toUpperCase()} // RESOLUSI: ${item.resolution || item.size} // KLIK UNTUK MEMUTAR.`;
  }

  shuffleSpaceCluster() {
    this.filteredCatalog = [...this.filteredCatalog].sort(() => Math.random() - 0.5);
    this.renderSpaceCluster();
  }

  startParallaxEngine() {
    const animate = () => {
      if (this.isAutopilot && this.currentStage === 'space') {
        this.autopilotAngle += 0.006;
        this.mouse.targetX = Math.sin(this.autopilotAngle) * 0.75;
        this.mouse.targetY = Math.cos(this.autopilotAngle * 0.7) * 0.45;
      }

      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;
      this.pan.x += (this.pan.targetX - this.pan.x) * 0.1;
      this.pan.y += (this.pan.targetY - this.pan.y) * 0.1;

      if (this.spaceCluster && this.currentStage === 'space') {
        const isMobile = window.innerWidth <= 768;
        let rotMultiplier = isMobile ? 7 : 14;
        let transMultiplier = isMobile ? 18 : 35;
        let extraRotX = 0;
        let extraScale = 1;

        if (this.cameraPreset === 'wide') {
          extraScale = 0.82;
          rotMultiplier *= 1.4;
        } else if (this.cameraPreset === 'top') {
          extraRotX = -32;
          extraScale = 0.88;
        }

        const rotX = -this.mouse.y * rotMultiplier + extraRotX;
        const rotY = this.mouse.x * rotMultiplier;
        const transX = this.pan.x - this.mouse.x * transMultiplier;
        const transY = this.pan.y - this.mouse.y * transMultiplier;

        this.spaceCluster.style.transform = `translate3d(${transX}px, ${transY}px, 0px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${extraScale}, ${extraScale}, ${extraScale})`;
      }

      requestAnimationFrame(animate);
    };
    animate();
  }

  // =========================================================================
  // 2. RENDER DATABASE-POWERED MASONRY GRID VIEW
  // =========================================================================

  renderMasonryGrid() {
    if (!this.masonryGrid) return;
    const items = this.filteredCatalog;

    const countEl = document.getElementById('grid-item-count');
    if (countEl) countEl.textContent = items.length;

    if (items.length === 0) {
      this.masonryGrid.innerHTML = `
        <div class="grid-empty-state" style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; color: var(--text-muted); font-family: var(--font-mono);">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
          <h3 style="color: #fff; font-size: 1.2rem; margin-bottom: 6px;">Tidak ada media ditemukan</h3>
          <p style="font-size: 0.85rem;">Coba sesuaikan kata kunci pencarian atau filter database Anda.</p>
        </div>
      `;
      return;
    }

    this.masonryGrid.innerHTML = items.map((item) => {
      const thumbUrl = item.thumb || item.url;
      const isVideo = item.type === 'video';
      const durationBadge = isVideo ? `<span class="card-duration-badge">▶ ${Math.round(item.duration || 15)}s • ${item.aspectRatio || '9:16'}</span>` : '';
      const progressBar = item.watchProgress > 0 ? `<div class="card-progress-bar"><div class="card-progress-fill" style="width: ${item.watchProgress}%"></div></div>` : '';

      return `
        <div class="grid-item-card clickable ${item.isLiked ? 'is-liked' : ''}" data-id="${item.id}">
          <span class="card-badge-type">${isVideo ? `▶ ${item.aspectRatio || '4K'}` : '📷 PHOTO'}</span>
          ${durationBadge}
          <img src="${thumbUrl}" alt="${item.title}" loading="lazy" decoding="async" />
          ${progressBar}
          
          <div class="grid-item-overlay">
            <div class="grid-overlay-top">
              <button class="card-like-btn ${item.isLiked ? 'liked' : ''} clickable" data-like-id="${item.id}" title="Sukai Media">
                <span class="heart-icon">${item.isLiked ? '❤️' : '🤍'}</span>
                <span class="like-num">${item.likes || 0}</span>
              </button>
            </div>
            <div class="grid-overlay-bottom">
              <h4 class="grid-item-title">${item.title}</h4>
              <span class="grid-item-meta">${item.category} • ${item.resolution || item.size}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click events
    this.masonryGrid.querySelectorAll('.grid-item-card').forEach(card => {
      const id = card.getAttribute('data-id');
      const item = this.catalog.find(it => it.id === id);
      if (!item) return;

      // Card click opens cinema lightbox
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-like-btn')) return;
        this.openCinemaModal(item);
      });

      // Like button click toggles Database like
      const likeBtn = card.querySelector('.card-like-btn');
      likeBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        window.CinematicAudio?.playUiClick();
        if (window.HaikelMediaDB) {
          const res = await window.HaikelMediaDB.toggleLike(item.id);
          if (res) {
            likeBtn.classList.toggle('liked', res.isLiked);
            card.classList.toggle('is-liked', res.isLiked);
            const heartIcon = likeBtn.querySelector('.heart-icon');
            const likeNum = likeBtn.querySelector('.like-num');
            if (heartIcon) heartIcon.textContent = res.isLiked ? '❤️' : '🤍';
            if (likeNum) likeNum.textContent = res.likes;
          }
        }
      });
    });
  }

  // =========================================================================
  // 3. ULTRA CINEMA LIGHTBOX (Adaptive Playback + Database Stats & Resume)
  // =========================================================================

  async openCinemaModal(item) {
    if (!item) return;
    this.currentModalItem = item;

    // Increment Database View Count
    if (window.HaikelMediaDB) {
      window.HaikelMediaDB.incrementViewCount(item.id);
    }

    const modal = document.getElementById('cinema-modal');
    const tag = document.getElementById('modal-type-tag');
    const title = document.getElementById('modal-title');
    const counter = document.getElementById('modal-counter-tag');
    const sizeVal = document.getElementById('modal-size-val');
    const yearVal = document.getElementById('modal-year-val');
    const formatVal = document.getElementById('modal-format-val');
    const downloadBtn = document.getElementById('modal-download-btn');
    const mediaContainer = document.getElementById('modal-media-container');
    const likeBtn = document.getElementById('modal-like-btn');
    const likeIcon = document.getElementById('modal-like-icon');
    const likeCounter = document.getElementById('modal-like-counter');

    const globalIdx = this.filteredCatalog.findIndex(it => it.id === item.id);
    const currentIndex = globalIdx >= 0 ? globalIdx : 0;

    if (tag) tag.textContent = item.type === 'video' ? `▶ ${item.aspectRatio || '4K'} CINEMATIC VIDEO` : '📷 HIGH-RES PHOTO';
    if (title) title.textContent = item.title;
    if (counter) counter.textContent = `${currentIndex + 1} / ${this.filteredCatalog.length}`;
    if (sizeVal) sizeVal.textContent = item.size;
    if (yearVal) yearVal.textContent = item.date;
    if (formatVal) formatVal.textContent = item.type === 'video' ? `Master 4K MP4 (${item.resolution || item.aspectRatio || 'Ultra HD'})` : 'Full-Frame Master JPG';

    // Update Modal Like Button
    if (likeBtn && likeIcon && likeCounter) {
      likeBtn.classList.toggle('liked', !!item.isLiked);
      likeIcon.textContent = item.isLiked ? '❤️' : '🤍';
      likeCounter.textContent = item.likes || 0;

      // Unbind previous onclick
      likeBtn.onclick = async (e) => {
        e.stopPropagation();
        window.CinematicAudio?.playUiClick();
        if (window.HaikelMediaDB) {
          const res = await window.HaikelMediaDB.toggleLike(item.id);
          if (res) {
            likeBtn.classList.toggle('liked', res.isLiked);
            likeIcon.textContent = res.isLiked ? '❤️' : '🤍';
            likeCounter.textContent = res.likes;
            this.renderMasonryGrid();
          }
        }
      };
    }

    const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname) ||
                    window.location.hostname.startsWith('192.168.') ||
                    window.location.protocol === 'file:';
    
    // Direct stream: local stream url takes priority, fallback to API proxy or direct usercontent stream
    const primaryVideoUrl = isLocal ? item.url : (item.gdriveId ? `/api/video?id=${item.gdriveId}` : (item.gdriveStream || item.url));
    const downloadUrl = item.gdriveStream || item.url;

    if (downloadBtn) {
      downloadBtn.href = downloadUrl;
      downloadBtn.download = item.title + (item.type === 'video' ? '.mp4' : '.jpg');
      downloadBtn.target = '_blank';
    }

    if (mediaContainer) {
      // Clean up previous video immediately
      const oldVid = mediaContainer.querySelector('video');
      if (oldVid) {
        try {
          oldVid.pause();
          oldVid.removeAttribute('src');
          oldVid.load();
        } catch (e) {}
      }
      const oldIframe = mediaContainer.querySelector('iframe');
      if (oldIframe) {
        oldIframe.src = 'about:blank';
      }
      mediaContainer.innerHTML = '';

      const fallbackUrl = item.thumb || item.url;
      const orientationClass = `orientation-${item.orientation || 'vertical'}`;

      if (item.type === 'video') {
        window.CinematicAudio?.playSubDrop();
        window.CinematicAudio?.duckAmbient(true);

        mediaContainer.innerHTML = `
          <div class="video-cinema-wrapper ${orientationClass}" id="video-cinema-wrapper">
            <div class="video-ambient-glow"></div>
            
            <div class="video-cinema-frame" id="video-cinema-frame">
              <!-- Direct High-Performance HTML5 Video Player -->
              <video id="modal-active-video"
                     src="${primaryVideoUrl}"
                     poster="${fallbackUrl}"
                     playsinline
                     webkit-playsinline
                     loop
                     preload="auto"
              >
                <source src="${primaryVideoUrl}" type="video/mp4">
                ${item.url !== primaryVideoUrl ? `<source src="${item.url}" type="video/mp4">` : ''}
                Browser Anda tidak mendukung pemutar video HTML5.
              </video>

              <!-- In-Modal Direct Embed Player Fallback (Plays 100% directly inside modal without opening Drive) -->
              <div class="modal-embed-player" id="modal-embed-player" style="display: none; position: absolute; inset: 0; width: 100%; height: 100%; z-index: 18; background: #000; border-radius: inherit; overflow: hidden;">
                <iframe id="modal-active-iframe"
                        style="width: 100%; height: 100%; border: none;"
                        allow="autoplay; fullscreen"
                        allowfullscreen
                ></iframe>
              </div>

              <!-- Center Play/Pause Ripple Overlay -->
              <div class="video-center-overlay" id="video-center-overlay">
                <div class="center-play-button" id="center-play-btn">
                  <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                </div>
                <span class="center-play-hint" id="center-play-hint">KLIK UNTUK MEMUTAR</span>
              </div>

              <!-- Floating Pulsing Unmute Pill -->
              <button class="unmute-floating-pill" id="btn-unmute-video" style="display: none;">
                <span>🔊</span>
                <span>AKTIFKAN SUARA</span>
                <div class="unmute-soundwaves">
                  <span></span><span></span><span></span>
                </div>
              </button>

              <!-- Resume Playback Toast Notification -->
              <div class="cinema-resume-toast" id="cinema-resume-toast" style="display: none;">
                <span>▶ Melanjutkan dari posisi terakhir</span>
              </div>

              <!-- Loading Spinner -->
              <div class="video-loading-spinner" id="video-loading-spinner" style="display: none;">
                <div class="spinner-ring"></div>
                <span class="spinner-text">MEMUAT VIDEO 4K...</span>
              </div>

              <!-- Sleek Cinema Controls Bar HUD -->
              <div class="video-hud-bar" id="video-hud-bar">
                <div class="hud-timeline-track" id="hud-timeline-track">
                  <div class="hud-timeline-buffer" id="hud-timeline-buffer"></div>
                  <div class="hud-timeline-progress" id="hud-timeline-progress"></div>
                  <div class="hud-timeline-handle" id="hud-timeline-handle"></div>
                  <div class="hud-timeline-tooltip" id="hud-timeline-tooltip">0:00</div>
                </div>

                <div class="hud-controls-row">
                  <div class="hud-left-group">
                    <button class="hud-ctrl-btn" id="hud-play-btn" title="Putar / Jeda (Space)">
                      <svg class="ctrl-icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      <svg class="ctrl-icon-pause" viewBox="0 0 24 24" fill="currentColor" style="display: none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    </button>

                    <div class="hud-volume-group">
                      <button class="hud-ctrl-btn" id="hud-mute-btn" title="Suara (M)">
                        <svg class="ctrl-icon-vol" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                        <svg class="ctrl-icon-mute" viewBox="0 0 24 24" fill="currentColor" style="display: none;"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                      </button>
                      <input type="range" class="hud-volume-slider" id="hud-volume-slider" min="0" max="1" step="0.05" value="0.9" title="Volume">
                    </div>

                    <span class="hud-timestamp" id="hud-timestamp">0:00 / 0:00</span>
                  </div>

                  <div class="hud-center-group">
                    <span class="hud-badge-quality">${item.aspectRatio || '9:16'} • ${item.resolution || '4K'}</span>
                  </div>

                  <div class="hud-right-group">
                    <button class="hud-ctrl-btn active" id="hud-loop-btn" title="Ulangi Otomatis (Loop)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                    </button>
                    <button class="hud-ctrl-btn" id="hud-fullscreen-btn" title="Layar Penuh (F)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        `;

        const vid = mediaContainer.querySelector('video');
        const frame = mediaContainer.querySelector('#video-cinema-frame');
        const embedPlayer = mediaContainer.querySelector('#modal-embed-player');
        const iframe = mediaContainer.querySelector('#modal-active-iframe');
        const centerOverlay = mediaContainer.querySelector('#video-center-overlay');
        const centerPlayIcon = mediaContainer.querySelector('.play-icon');
        const centerPauseIcon = mediaContainer.querySelector('.pause-icon');
        const centerPlayHint = mediaContainer.querySelector('#center-play-hint');
        const unmuteBtn = mediaContainer.querySelector('#btn-unmute-video');
        const spinner = mediaContainer.querySelector('#video-loading-spinner');
        const resumeToast = mediaContainer.querySelector('#cinema-resume-toast');

        const hudPlayBtn = mediaContainer.querySelector('#hud-play-btn');
        const hudPlayIcon = mediaContainer.querySelector('.ctrl-icon-play');
        const hudPauseIcon = mediaContainer.querySelector('.ctrl-icon-pause');
        const hudMuteBtn = mediaContainer.querySelector('#hud-mute-btn');
        const hudVolIcon = mediaContainer.querySelector('.ctrl-icon-vol');
        const hudMuteIcon = mediaContainer.querySelector('.ctrl-icon-mute');
        const hudVolSlider = mediaContainer.querySelector('#hud-volume-slider');
        const hudTimestamp = mediaContainer.querySelector('#hud-timestamp');
        const hudLoopBtn = mediaContainer.querySelector('#hud-loop-btn');
        const hudFullscreenBtn = mediaContainer.querySelector('#hud-fullscreen-btn');
        const hudBar = mediaContainer.querySelector('#video-hud-bar');

        const timelineTrack = mediaContainer.querySelector('#hud-timeline-track');
        const timelineProgress = mediaContainer.querySelector('#hud-timeline-progress');
        const timelineBuffer = mediaContainer.querySelector('#hud-timeline-buffer');
        const timelineHandle = mediaContainer.querySelector('#hud-timeline-handle');
        const timelineTooltip = mediaContainer.querySelector('#hud-timeline-tooltip');

        const switchToSeamlessEmbed = () => {
          if (spinner) spinner.style.display = 'none';
          if (embedPlayer && iframe && item.gdrivePreview) {
            if (vid) vid.style.display = 'none';
            if (centerOverlay) centerOverlay.style.display = 'none';
            if (hudBar) hudBar.style.display = 'none';
            embedPlayer.style.display = 'block';
            if (!iframe.src || iframe.src === 'about:blank' || iframe.src === window.location.href) {
              iframe.src = item.gdrivePreview;
            }
          }
        };

        const formatTime = (secs) => {
          if (isNaN(secs) || secs < 0) return '0:00';
          const m = Math.floor(secs / 60);
          const s = Math.floor(secs % 60);
          return `${m}:${s.toString().padStart(2, '0')}`;
        };

        const updatePlayState = (playing) => {
          if (centerPlayIcon) centerPlayIcon.style.display = playing ? 'none' : 'block';
          if (centerPauseIcon) centerPauseIcon.style.display = playing ? 'block' : 'none';
          if (centerPlayHint) centerPlayHint.textContent = playing ? 'JEDA' : 'KLIK UNTUK MEMUTAR';
          if (hudPlayIcon) hudPlayIcon.style.display = playing ? 'none' : 'block';
          if (hudPauseIcon) hudPauseIcon.style.display = playing ? 'block' : 'none';
          if (centerOverlay) centerOverlay.classList.toggle('hidden', playing);
        };

        const togglePlay = () => {
          if (!vid || vid.style.display === 'none') return;
          window.CinematicAudio?.playUiClick();
          if (vid.paused) {
            vid.play().then(() => updatePlayState(true)).catch(() => {
              vid.muted = true;
              vid.play().then(() => {
                updatePlayState(true);
                if (unmuteBtn) unmuteBtn.style.display = 'flex';
              });
            });
          } else {
            vid.pause();
            updatePlayState(false);
          }
        };

        centerOverlay?.addEventListener('click', togglePlay);
        vid?.addEventListener('click', togglePlay);
        hudPlayBtn?.addEventListener('click', togglePlay);

        // Unmute button
        unmuteBtn?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (vid) {
            vid.muted = false;
            vid.volume = 0.9;
          }
          if (unmuteBtn) unmuteBtn.style.display = 'none';
          if (hudVolIcon) hudVolIcon.style.display = 'block';
          if (hudMuteIcon) hudMuteIcon.style.display = 'none';
          if (hudVolSlider) hudVolSlider.value = '0.9';
        });

        // Volume
        const toggleMute = () => {
          if (!vid) return;
          vid.muted = !vid.muted;
          const isM = vid.muted;
          if (hudVolIcon) hudVolIcon.style.display = isM ? 'none' : 'block';
          if (hudMuteIcon) hudMuteIcon.style.display = isM ? 'block' : 'none';
          if (hudVolSlider) hudVolSlider.value = isM ? 0 : vid.volume;
          if (!isM && unmuteBtn) unmuteBtn.style.display = 'none';
        };

        hudMuteBtn?.addEventListener('click', toggleMute);
        hudVolSlider?.addEventListener('input', (e) => {
          if (!vid) return;
          const v = parseFloat(e.target.value);
          vid.volume = v;
          vid.muted = v === 0;
          if (hudVolIcon) hudVolIcon.style.display = v === 0 ? 'none' : 'block';
          if (hudMuteIcon) hudMuteIcon.style.display = v === 0 ? 'block' : 'none';
          if (v > 0 && unmuteBtn) unmuteBtn.style.display = 'none';
        });

        // Loop
        hudLoopBtn?.addEventListener('click', () => {
          if (!vid) return;
          vid.loop = !vid.loop;
          hudLoopBtn.classList.toggle('active', vid.loop);
        });

        // Fullscreen
        hudFullscreenBtn?.addEventListener('click', () => {
          const targetEl = frame || vid;
          if (!document.fullscreenElement) {
            if (targetEl.requestFullscreen) targetEl.requestFullscreen();
            else if (targetEl.webkitRequestFullscreen) targetEl.webkitRequestFullscreen();
          } else {
            if (document.exitFullscreen) document.exitFullscreen();
          }
        });

        // Timeline Scrubbing
        const seek = (e) => {
          if (!vid || !vid.duration) return;
          const rect = timelineTrack.getBoundingClientRect();
          const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          vid.currentTime = pos * vid.duration;
          if (timelineProgress) timelineProgress.style.width = `${pos * 100}%`;
          if (timelineHandle) timelineHandle.style.left = `${pos * 100}%`;
        };

        timelineTrack?.addEventListener('click', seek);
        timelineTrack?.addEventListener('mousemove', (e) => {
          if (!vid || !vid.duration || !timelineTooltip) return;
          const rect = timelineTrack.getBoundingClientRect();
          const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          timelineTooltip.style.left = `${pos * 100}%`;
          timelineTooltip.style.opacity = '1';
          timelineTooltip.textContent = formatTime(pos * vid.duration);
        });
        timelineTrack?.addEventListener('mouseleave', () => {
          if (timelineTooltip) timelineTooltip.style.opacity = '0';
        });

        // Resume Playback Check from Database
        if (window.HaikelMediaDB) {
          window.HaikelMediaDB.getWatchProgress(item.id).then((prog) => {
            if (prog && prog.currentTime > 2 && prog.currentTime < (item.duration || 100) - 2) {
              vid.currentTime = prog.currentTime;
              if (resumeToast) {
                resumeToast.style.display = 'block';
                resumeToast.querySelector('span').textContent = `▶ Melanjutkan dari ${formatTime(prog.currentTime)}`;
                setTimeout(() => {
                  resumeToast.style.display = 'none';
                }, 3200);
              }
            }
          });
        }

        // Video Events
        vid.addEventListener('loadedmetadata', () => {
          if (spinner) spinner.style.display = 'none';
          if (hudTimestamp) hudTimestamp.textContent = `0:00 / ${formatTime(vid.duration)}`;
          
          if (vid.videoWidth && vid.videoHeight) {
            const ratio = vid.videoWidth / vid.videoHeight;
            const wrapper = mediaContainer.querySelector('#video-cinema-wrapper');
            if (wrapper) {
              wrapper.className = 'video-cinema-wrapper';
              if (ratio < 0.85) wrapper.classList.add('orientation-vertical');
              else if (ratio > 1.25) wrapper.classList.add('orientation-horizontal');
              else if (ratio >= 0.85 && ratio <= 1.05) wrapper.classList.add('orientation-square');
              else wrapper.classList.add('orientation-portrait');
            }
          }
        });

        vid.addEventListener('timeupdate', () => {
          if (!vid.duration) return;
          const pct = (vid.currentTime / vid.duration) * 100;
          if (timelineProgress) timelineProgress.style.width = `${pct}%`;
          if (timelineHandle) timelineHandle.style.left = `${pct}%`;
          if (hudTimestamp) hudTimestamp.textContent = `${formatTime(vid.currentTime)} / ${formatTime(vid.duration)}`;

          // Buffer calculation
          if (vid.buffered.length > 0 && timelineBuffer) {
            const bufferedEnd = vid.buffered.end(vid.buffered.length - 1);
            const bufPct = (bufferedEnd / vid.duration) * 100;
            timelineBuffer.style.width = `${bufPct}%`;
          }

          // Throttle save watch progress to Database every 3 seconds
          if (!this.progressSaveThrottleTimer && window.HaikelMediaDB) {
            this.progressSaveThrottleTimer = setTimeout(() => {
              window.HaikelMediaDB.saveWatchProgress(item.id, vid.currentTime, vid.duration);
              this.progressSaveThrottleTimer = null;
            }, 2500);
          }
        });

        vid.addEventListener('waiting', () => {
          if (spinner) spinner.style.display = 'flex';
        });

        vid.addEventListener('playing', () => {
          if (spinner) spinner.style.display = 'none';
          updatePlayState(true);
          if (vid.muted && unmuteBtn) unmuteBtn.style.display = 'flex';
        });

        vid.addEventListener('pause', () => {
          updatePlayState(false);
          // Immediate progress save on pause
          if (window.HaikelMediaDB) {
            window.HaikelMediaDB.saveWatchProgress(item.id, vid.currentTime, vid.duration);
          }
        });

        vid.addEventListener('error', () => {
          // If primary local/proxy fails, seamlessly switch to in-modal embedded player
          switchToSeamlessEmbed();
        });

        // Autoplay attempt
        vid.load();
        const playProm = vid.play();
        if (playProm !== undefined) {
          playProm.then(() => {
            updatePlayState(true);
            if (!vid.muted && unmuteBtn) unmuteBtn.style.display = 'none';
          }).catch(() => {
            vid.muted = true;
            vid.play().then(() => {
              updatePlayState(true);
              if (unmuteBtn) unmuteBtn.style.display = 'flex';
            }).catch(() => {
              // Fallback to seamless in-modal embed player
              switchToSeamlessEmbed();
            });
          });
        }
      } else {
        window.CinematicAudio?.duckAmbient(false);
        window.CinematicAudio?.playShutter();
        mediaContainer.innerHTML = `
          <img src="${item.url}" alt="${item.title}" decoding="async" style="transform: translateZ(0); will-change: transform;" onerror="this.src='${fallbackUrl}'" />
        `;
      }
    }

    modal?.classList.add('active');
  }

  closeCinemaModal() {
    const modal = document.getElementById('cinema-modal');
    const mediaContainer = document.getElementById('modal-media-container');
    if (mediaContainer) {
      const vid = mediaContainer.querySelector('video');
      if (vid && this.currentModalItem && window.HaikelMediaDB) {
        window.HaikelMediaDB.saveWatchProgress(this.currentModalItem.id, vid.currentTime, vid.duration);
        try {
          vid.pause();
          vid.removeAttribute('src');
          vid.load();
        } catch (e) {}
      }
      mediaContainer.innerHTML = '';
    }
    window.CinematicAudio?.duckAmbient(false);
    modal?.classList.remove('active');
    window.CinematicAudio?.playUiClick();
    this.renderMasonryGrid();
  }

  navigateCinemaModal(direction) {
    if (!this.filteredCatalog.length || !this.currentModalItem) return;
    const curIdx = this.filteredCatalog.findIndex(it => it.id === this.currentModalItem.id);
    let nextIdx = (curIdx + direction + this.filteredCatalog.length) % this.filteredCatalog.length;
    this.openCinemaModal(this.filteredCatalog[nextIdx]);
  }

  // =========================================================================
  // 4. CURSOR & CANVAS
  // =========================================================================

  initCursor() {
    const cursor = document.getElementById('custom-cursor');
    const follower = document.getElementById('custom-cursor-follower');
    if (!cursor || !follower) return;

    let mx = window.innerWidth / 2, my = window.innerHeight / 2, fx = mx, fy = my;
    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursor.style.transform = `translate(${mx - 6}px, ${my - 4}px)`;
    });

    const loop = () => {
      fx += (mx - fx) * 0.18;
      fy += (my - fy) * 0.18;
      follower.style.transform = `translate(${fx}px, ${fy}px)`;
      requestAnimationFrame(loop);
    };
    loop();

    document.addEventListener('mouseover', e => {
      const isInteractive = !!e.target.closest('a, button, select, input, .clickable, .floating-card, .grid-item-card');
      follower.classList.toggle('active', isInteractive);
    });
  }

  initCosmicUniverseCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth, h = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }, { passive: true });

    const starCount = window.innerWidth < 768 ? 30 : 65;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 1.5 + 0.4,
      alpha: Math.random() * 0.7 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      sx: (Math.random() - 0.5) * 0.12,
      sy: (Math.random() - 0.5) * 0.12
    }));

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      stars.forEach(s => {
        s.alpha += Math.sin(Date.now() * s.twinkleSpeed) * 0.01;
        s.x = (s.x + s.sx + w) % w;
        s.y = (s.y + s.sy + h) % h;

        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(1, s.alpha))})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(render);
    };
    render();
  }

  initClock() {
    const clock = document.getElementById('studio-clock');
    if (!clock) return;
    const update = () => {
      const str = new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
      clock.textContent = `${str} WIB`;
    };
    update();
    setInterval(update, 1000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.haikelArchive = new HaikelSpatialArchive();
});
