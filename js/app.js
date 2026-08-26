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

    const likesText = item.likes ? ` • ❤️ ${item.likes}` : '';

    if (badgeEl) badgeEl.textContent = `📷 4K MASTER PHOTO${likesText}`;
    if (titleEl) titleEl.textContent = item.title;
    if (descEl) descEl.textContent = `KLIK KARTU UNTUK MEMBUKA FOTO RESOLUSI PENUH`;
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

      return `
        <div class="grid-item-card clickable ${item.isLiked ? 'is-liked' : ''}" data-id="${item.id}">
          <span class="card-badge-type">📷 PHOTO</span>
          <img src="${thumbUrl}" alt="${item.title}" loading="lazy" decoding="async" />
          
          <div class="grid-item-overlay">
            <div class="grid-overlay-top">
              <button class="card-like-btn ${item.isLiked ? 'liked' : ''} clickable" data-like-id="${item.id}" title="Sukai Foto">
                <span class="heart-icon">${item.isLiked ? '❤️' : '🤍'}</span>
                <span class="like-num">${item.likes || 0}</span>
              </button>
            </div>
            <div class="grid-overlay-bottom">
              <h4 class="grid-item-title">${item.title}</h4>
              <span class="grid-item-meta">4K Master Ultra HD</span>
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
  // 3. ULTRA LIGHTBOX MODAL (Instant Photo Viewer)
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

    if (tag) tag.textContent = '📷 HIGH-RES MASTER PHOTO';
    if (title) title.textContent = item.title;
    if (counter) counter.textContent = `${currentIndex + 1} / ${this.filteredCatalog.length}`;
    if (sizeVal) sizeVal.textContent = item.size || '2.4 MB';
    if (yearVal) yearVal.textContent = item.date || '2026';
    if (formatVal) formatVal.textContent = '4K Master Ultra HD';

    // Update Modal Like Button
    if (likeBtn && likeIcon && likeCounter) {
      likeBtn.classList.toggle('liked', !!item.isLiked);
      likeIcon.textContent = item.isLiked ? '❤️' : '🤍';
      likeCounter.textContent = item.likes || 0;

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
            this.updateHeroStats();
            this.updateCounters();
          }
        }
      };
    }

    if (downloadBtn) {
      downloadBtn.href = item.url;
      downloadBtn.download = item.title + '.jpg';
      downloadBtn.target = '_blank';
    }

    if (mediaContainer) {
      mediaContainer.innerHTML = '';
      window.CinematicAudio?.playShutter();

      const fallbackUrl = item.thumb || item.url;
      mediaContainer.innerHTML = `
        <div class="photo-lightbox-stage" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative;">
          <img src="${item.url}"
               alt="${item.title}"
               decoding="async"
               class="lightbox-main-img"
               style="max-width: 90vw; max-height: calc(86vh - 100px); object-fit: contain; border-radius: 16px; box-shadow: 0 25px 80px rgba(0,0,0,0.95), 0 0 40px rgba(56,189,248,0.18); transition: transform 0.3s ease;"
               onerror="this.src='${fallbackUrl}'" />
        </div>
      `;
    }

    modal?.classList.add('active');
  }

  closeCinemaModal() {
    const modal = document.getElementById('cinema-modal');
    const mediaContainer = document.getElementById('modal-media-container');
    if (mediaContainer) {
      mediaContainer.innerHTML = '';
    }
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
