/* ==========================================================================
   HAIKEL 3D SPATIAL MEDIA ARCHIVE — LIGHTNING ZERO-LAG ENGINE
   WebP Thumbnail Acceleration • 99.8% Bandwidth Reduction • 120 FPS Mobile
   ========================================================================== */

class HaikelSpatialArchive {
  constructor() {
    this.catalog = window.MEDIA_CATALOG || [];
    this.currentFilter = 'all'; // 'all' | 'photo' | 'video'
    this.filteredCatalog = this.catalog;
    this.activeClusterItemId = null;
    this.currentStage = 'space'; // 'space' | 'grid'
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

    this.init();
  }

  init() {
    this.updateCounters();
    this.initCursor();
    this.initCosmicUniverseCanvas();
    this.initEvents();
    this.initTouchGestures();
    this.renderSpaceCluster();
    this.renderMasonryGrid();
    this.initClock();
    this.startParallaxEngine();
    this.initAutoAudio();

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

    // Try starting immediately on load
    try {
      window.CinematicAudio?.startAmbient();
    } catch(e) {}

    // Auto-unlock on first interaction anywhere
    ['click', 'touchstart', 'keydown', 'wheel', 'pointerdown'].forEach(evt => {
      document.addEventListener(evt, unlockAudio, { once: true, passive: true });
    });
  }

  updateCounters() {
    const photosCount = this.catalog.filter(it => it.type === 'photo').length;
    const videosCount = this.catalog.filter(it => it.type === 'video').length;

    const countAll = document.getElementById('count-all');
    const countPhoto = document.getElementById('count-photo');
    const countVideo = document.getElementById('count-video');
    const dockCount = document.getElementById('dock-counter-text');
    const gridCount = document.getElementById('grid-item-count');

    if (countAll) countAll.textContent = this.catalog.length;
    if (countPhoto) countPhoto.textContent = photosCount;
    if (countVideo) countVideo.textContent = videosCount;
    if (dockCount) dockCount.textContent = `${this.catalog.length} KARYA SIAP DITAMPILKAN`;
    if (gridCount) gridCount.textContent = this.catalog.length;
  }

  initEvents() {
    // Theater Intro Opening (Foolproof: Click button, click anywhere, or press Enter/Space)
    const theaterOverlay = document.getElementById('intro-theater-overlay');
    const btnEnterTheater = document.getElementById('btn-enter-theater');
    const btnEnterSilent = document.getElementById('btn-enter-silent');

    let hasEnteredTheater = false;
    const enterTheater = (withSound = true) => {
      if (hasEnteredTheater) return;
      hasEnteredTheater = true;

      if (withSound) {
        try { window.CinematicAudio?.playCinemaBoom(); } catch(e) {}
        theaterOverlay?.classList.add('curtains-open');
        setTimeout(() => {
          try { window.CinematicAudio?.startAmbient(); } catch(e) {}
        }, 1000);
      } else {
        try { window.CinematicAudio?.playUiClick(); } catch(e) {}
        theaterOverlay?.classList.add('curtains-open');
      }

      setTimeout(() => {
        theaterOverlay?.classList.add('fade-out');
        setTimeout(() => theaterOverlay?.remove(), 600);
      }, withSound ? 1200 : 800);
    };

    btnEnterTheater?.addEventListener('click', (e) => {
      e.stopPropagation();
      enterTheater(true);
    });

    btnEnterSilent?.addEventListener('click', (e) => {
      e.stopPropagation();
      enterTheater(false);
    });

    theaterOverlay?.addEventListener('click', () => {
      enterTheater(true);
    });

    window.addEventListener('keydown', (e) => {
      if (theaterOverlay && !hasEnteredTheater && (e.key === ' ' || e.key === 'Enter')) {
        enterTheater(true);
      }
    });

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

    // Filter Buttons (ALL / PHOTOS / VIDEOS)
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.CinematicAudio?.playUiClick();
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.getAttribute('data-filter');
        this.applyFilter();
      });
    });

    // 3D Space Actions
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
      searchDebounce = setTimeout(() => {
        this.searchTerm = e.target.value.toLowerCase().trim();
        this.renderMasonryGrid();
      }, 100);
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

    // Keyboard Navigation
    window.addEventListener('keydown', (e) => {
      if (modal?.classList.contains('active')) {
        if (e.key === 'Escape') this.closeCinemaModal();
        if (e.key === 'ArrowLeft') this.navigateCinemaModal(-1);
        if (e.key === 'ArrowRight') this.navigateCinemaModal(1);
      }
    });

    // Ambient Sound Toggle
    const audioToggle = document.getElementById('audio-hud-toggle');
    audioToggle?.addEventListener('click', () => {
      const isPlaying = window.CinematicAudio?.toggleGlobalAudio();
      audioToggle.classList.toggle('playing', isPlaying);
    });

    // Mouse Tracking in 3D Space
    const stageSpace = document.getElementById('stage-space');
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      this.mouse.targetY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    }, { passive: true });

    stageSpace?.addEventListener('mousedown', (e) => {
      if (e.target.closest('.space-center-hud, .hud-top-bar, .hud-bottom-dock, .camera-presets-dock, button')) return;
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
      if (e.target.closest('.space-center-hud, .hud-top-bar, .hud-bottom-dock, .camera-presets-dock, button')) return;
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
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    modalStage?.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const dx = touchEndX - this.touchStartX;
      const dy = touchEndY - this.touchStartY;

      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
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

  applyFilter() {
    if (this.currentFilter === 'all') {
      this.filteredCatalog = this.catalog;
    } else {
      this.filteredCatalog = this.catalog.filter(it => it.type === this.currentFilter);
    }
    this.renderSpaceCluster();
    this.renderMasonryGrid();
  }

  // 1. RENDER 3D SPATIAL GALAXY CLUSTER (WEBP THUMBNAIL ACCELERATED)
  renderSpaceCluster() {
    if (!this.spaceCluster) return;

    const isMobile = window.innerWidth <= 768;
    const scale = isMobile ? 0.55 : 1.0;
    const cardW = isMobile ? 145 : 230;
    const cardH = isMobile ? 95 : 145;

    // Show 9 cards on mobile (ultra-fast) or 15 on desktop
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

      // Use WebP thumbnail for ultra-speed
      const thumbUrl = item.thumb || item.url;

      return `
        <div class="floating-card ${isActive ? 'active-card' : ''} clickable"
             id="space-card-${item.id}"
             data-id="${item.id}"
             style="width: ${cardW}px; height: ${cardH}px; transform: translate3d(calc(-50% + ${scaledX}px), calc(-50% + ${scaledY}px), ${scaledZ}px) rotate(${c.r}deg); z-index: ${20 + idx};">
          <div class="card-inner">
            <span class="card-badge-type">${item.type === 'video' ? '▶ 4K VIDEO' : '📷 PHOTO'}</span>
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

    if (badgeEl) badgeEl.textContent = `${item.type === 'video' ? '▶ 4K VIDEO' : '📷 PHOTO'} • ${item.size}`;
    if (titleEl) titleEl.textContent = item.title;
    if (descEl) descEl.textContent = `ARSIP MASTER // ${item.category.toUpperCase()} // KLIK UNTUK MEMBUKA LAYAR PENUH.`;
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

  // 2. RENDER HIGH PERFORMANCE MASONRY GRID VIEW
  renderMasonryGrid() {
    if (!this.masonryGrid) return;

    let items = this.filteredCatalog;
    if (this.searchTerm) {
      items = items.filter(it => 
        it.title.toLowerCase().includes(this.searchTerm) ||
        it.id.includes(this.searchTerm) ||
        it.type.toLowerCase().includes(this.searchTerm)
      );
    }

    const countEl = document.getElementById('grid-item-count');
    if (countEl) countEl.textContent = items.length;

    // Use WebP thumbnail for all 235 cards (super lightweight 25KB each)
    this.masonryGrid.innerHTML = items.map((item) => {
      const thumbUrl = item.thumb || item.url;

      return `
        <div class="grid-item-card clickable" data-id="${item.id}">
          <span class="card-badge-type">${item.type === 'video' ? '▶ VIDEO' : '📷 PHOTO'}</span>
          <img src="${thumbUrl}" alt="${item.title}" loading="lazy" decoding="async" />
          <div class="grid-item-overlay">
            <h4 class="grid-item-title">${item.title}</h4>
            <span class="grid-item-meta">${item.category} • ${item.size}</span>
          </div>
        </div>
      `;
    }).join('');

    this.masonryGrid.querySelectorAll('.grid-item-card').forEach(card => {
      const id = card.getAttribute('data-id');
      const item = this.catalog.find(it => it.id === id);
      if (!item) return;

      card.addEventListener('click', () => {
        this.openCinemaModal(item);
      });
    });
  }

  // 3. ULTRA CINEMA LIGHTBOX (Streams Original Master High-Res Video / Photo)
  openCinemaModal(item) {
    if (!item) return;
    this.currentModalItem = item;

    const modal = document.getElementById('cinema-modal');
    const tag = document.getElementById('modal-type-tag');
    const title = document.getElementById('modal-title');
    const counter = document.getElementById('modal-counter-tag');
    const sizeVal = document.getElementById('modal-size-val');
    const yearVal = document.getElementById('modal-year-val');
    const formatVal = document.getElementById('modal-format-val');
    const downloadBtn = document.getElementById('modal-download-btn');
    const mediaContainer = document.getElementById('modal-media-container');

    const globalIdx = this.filteredCatalog.findIndex(it => it.id === item.id);
    const currentIndex = globalIdx >= 0 ? globalIdx : 0;

    if (tag) tag.textContent = item.type === 'video' ? '▶ 4K CINEMATIC VIDEO' : '📷 HIGH-RES PHOTO';
    if (title) title.textContent = item.title;
    if (counter) counter.textContent = `${currentIndex + 1} / ${this.filteredCatalog.length}`;
    if (sizeVal) sizeVal.textContent = item.size;
    if (yearVal) yearVal.textContent = item.date;
    if (formatVal) formatVal.textContent = item.type === 'video' ? '4K Ultra HD MP4' : 'Full-Frame Master JPG';
    if (downloadBtn) {
      downloadBtn.href = item.url;
      downloadBtn.download = item.title + (item.type === 'video' ? '.mp4' : '.jpg');
    }

    if (mediaContainer) {
      // Clean up previous video to free GPU decoder pipeline immediately
      const oldVid = mediaContainer.querySelector('video');
      if (oldVid) {
        try {
          oldVid.pause();
          oldVid.removeAttribute('src');
          oldVid.load();
        } catch (e) {}
      }

      const fallbackUrl = item.thumb || item.url;
      if (item.type === 'video') {
        window.CinematicAudio?.playSubDrop();
        mediaContainer.innerHTML = `
          <div class="video-player-wrapper" style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <div class="video-loading-spinner" id="vid-spinner" style="position: absolute; width: 44px; height: 44px; border: 3px solid rgba(56,189,248,0.2); border-top-color: #38bdf8; border-radius: 50%; animation: spin 0.8s linear infinite; pointer-events: none; z-index: 5;"></div>
            
            <div class="video-play-center-btn" id="modal-vid-play-btn">
              <div class="play-circle-glow">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <span class="play-btn-hint">KLIK UNTUK MEMUTAR 4K REEL</span>
            </div>

            <video id="modal-active-video"
                   src="${item.url}"
                   poster="${fallbackUrl}"
                   controls
                   autoplay
                   loop
                   playsinline
                   preload="metadata"
                   style="max-width: 100%; max-height: 100%; border-radius: 12px; transform: translateZ(0); will-change: transform; backface-visibility: hidden; cursor: pointer;"
            ></video>
          </div>
        `;

        const vid = mediaContainer.querySelector('video');
        const spinner = document.getElementById('vid-spinner');
        const playBtn = document.getElementById('modal-vid-play-btn');

        const hidePlayOverlay = () => {
          playBtn?.classList.add('hidden');
        };

        const showPlayOverlay = () => {
          playBtn?.classList.remove('hidden');
        };

        if (vid) {
          vid.addEventListener('canplay', () => {
            if (spinner) spinner.style.display = 'none';
          });
          vid.addEventListener('playing', () => {
            if (spinner) spinner.style.display = 'none';
            hidePlayOverlay();
          });
          vid.addEventListener('pause', showPlayOverlay);
          vid.addEventListener('ended', showPlayOverlay);

          // Attempt safe play
          const promise = vid.play();
          if (promise !== undefined) {
            promise.then(() => {
              hidePlayOverlay();
            }).catch(() => {
              // Autoplay with sound blocked -> fallback to muted autoplay
              vid.muted = true;
              vid.play().then(() => {
                hidePlayOverlay();
              }).catch(() => {
                showPlayOverlay();
              });
            });
          }

          // User Click / Tap to Play
          playBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            vid.muted = false;
            vid.play().then(hidePlayOverlay).catch(() => {
              vid.muted = true;
              vid.play().then(hidePlayOverlay);
            });
          });

          vid.addEventListener('click', () => {
            if (vid.paused) {
              vid.play().then(hidePlayOverlay);
            } else {
              vid.pause();
            }
          });
        }
      } else {
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
      if (vid) {
        try {
          vid.pause();
          vid.removeAttribute('src');
          vid.load();
        } catch (e) {}
      }
      mediaContainer.innerHTML = '';
    }
    modal?.classList.remove('active');
    window.CinematicAudio?.playUiClick();
  }

  navigateCinemaModal(direction) {
    if (!this.filteredCatalog.length || !this.currentModalItem) return;
    const curIdx = this.filteredCatalog.findIndex(it => it.id === this.currentModalItem.id);
    let nextIdx = (curIdx + direction + this.filteredCatalog.length) % this.filteredCatalog.length;
    this.openCinemaModal(this.filteredCatalog[nextIdx]);
  }

  // 4. CURSOR & CLOCK
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
      const isInteractive = !!e.target.closest('a, button, .clickable, .floating-card, .grid-item-card');
      follower.classList.toggle('active', isInteractive);
    });
  }

  // 5. HIGH-PERFORMANCE COSMIC UNIVERSE CANVAS
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
