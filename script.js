/**
 * SAPPHIRE CHAUFFEUR
 * Sticky Scroll Frame Animation & Interactive Sections
 */

(() => {
  // -------------------------------------------------------------
  // 1. SCROLL FRAME ANIMATION ENGINE
  // -------------------------------------------------------------
  const TOTAL_FRAMES = 300;
  const FRAME_DIR = 'ezgif-jpg';
  const FRAME_PREFIX = 'ezgif-frame-';
  const FRAME_EXT = '.jpg';

  const canvas = document.getElementById('flight-canvas');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: false });

  // Always use highest-quality image scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const scrollTrack = document.getElementById('scroll-track');
  const heroOverlay = document.getElementById('hero-overlay');

  const images = new Array(TOTAL_FRAMES + 1);
  const loaded = new Array(TOTAL_FRAMES + 1).fill(false);

  let targetFrame = 1;
  let currentFrame = 1;
  let isInitialFrameRendered = false;

  function pad(num, size) {
    let s = "000" + num;
    return s.substring(s.length - size);
  }

  function getFrameSrc(index) {
    return `${FRAME_DIR}/${FRAME_PREFIX}${pad(index, 3)}${FRAME_EXT}`;
  }

  // Get nearest neighbor if specific frame is still loading
  function getBestAvailableImage(idx) {
    const rounded = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(idx)));
    if (loaded[rounded] && images[rounded]) {
      return images[rounded];
    }
    for (let offset = 1; offset <= TOTAL_FRAMES; offset++) {
      const prev = rounded - offset;
      if (prev >= 1 && loaded[prev] && images[prev]) return images[prev];
      const next = rounded + offset;
      if (next <= TOTAL_FRAMES && loaded[next] && images[next]) return images[next];
    }
    return null;
  }

  // Resize canvas according to displayPixelRatio
  function resizeCanvas() {
    const dpr = Math.max(window.devicePixelRatio || 1, 2); // enforce minimum 2x for sharpness
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    // Re-apply quality settings after resize (canvas reset clears ctx state)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    renderFrame(currentFrame);
  }

  window.addEventListener('resize', resizeCanvas);

  // Render a specific frame onto the canvas (cover aspect ratio)
  function renderFrame(frameIndex) {
    const img = getBestAvailableImage(frameIndex);
    if (!img) return;

    const cw = canvas.width;
    const ch = canvas.height;
    if (cw === 0 || ch === 0) return;

    const imgWidth = img.naturalWidth || 1280;
    const imgHeight = img.naturalHeight || 720;
    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = cw / ch;

    let dw, dh, dx, dy;

    if (canvasRatio > imgRatio) {
      dw = cw;
      dh = cw / imgRatio;
      dx = 0;
      dy = (ch - dh) / 2;
    } else {
      dw = ch * imgRatio;
      dh = ch;
      dx = (cw - dw) / 2;
      dy = 0;
    }

    // Snap to integer pixels to prevent sub-pixel blurriness
    ctx.drawImage(img, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
  }

  // Preload all 300 images
  function startPreloading() {
    // 1. Immediately load frame 1 — wait for full decode before first draw
    const frameOne = new Image();
    frameOne.src = getFrameSrc(1);
    frameOne.decode().then(() => {
      images[1] = frameOne;
      loaded[1] = true;
      if (!isInitialFrameRendered) {
        isInitialFrameRendered = true;
        renderFrame(1);
      }
    }).catch(() => {
      // Fallback: use onload if decode() fails
      frameOne.onload = () => {
        images[1] = frameOne;
        loaded[1] = true;
        if (!isInitialFrameRendered) {
          isInitialFrameRendered = true;
          renderFrame(1);
        }
      };
    });

    // 2. Load all remaining frames
    for (let i = 2; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameSrc(i);
      const capturedIndex = i;
      img.decode().then(() => {
        images[capturedIndex] = img;
        loaded[capturedIndex] = true;
        if (!isInitialFrameRendered && (capturedIndex === 2 || capturedIndex === 3)) {
          isInitialFrameRendered = true;
          renderFrame(capturedIndex);
        }
      }).catch(() => {
        img.onload = () => {
          images[capturedIndex] = img;
          loaded[capturedIndex] = true;
          if (!isInitialFrameRendered && (capturedIndex === 2 || capturedIndex === 3)) {
            isInitialFrameRendered = true;
            renderFrame(capturedIndex);
          }
        };
        img.onerror = () => {
          console.warn(`Failed to load frame ${capturedIndex}`);
        };
      });
    }
  }

  // Calculate scroll progress within .scroll-track
  function getScrollProgress() {
    if (!scrollTrack) return 0;
    const rect = scrollTrack.getBoundingClientRect();
    const trackHeight = scrollTrack.offsetHeight - window.innerHeight;
    if (trackHeight <= 0) return 0;

    const progress = -rect.top / trackHeight;
    return Math.max(0, Math.min(1, progress));
  }

  function updateTargetFromScroll() {
    const progress = getScrollProgress();
    targetFrame = 1 + progress * (TOTAL_FRAMES - 1);

    // Fade away heading and subheading when person scrolls 20% of scroll animation section
    if (heroOverlay) {
      // 0.0 at top -> 1.0 at 20% scroll
      const fadeProgress = Math.min(1, Math.max(0, progress / 0.20));
      const opacity = Math.max(0, 1 - fadeProgress);
      heroOverlay.style.opacity = opacity.toFixed(3);
      heroOverlay.style.transform = `translateY(${-25 * fadeProgress}px)`;
      if (opacity <= 0.005) {
        heroOverlay.style.visibility = 'hidden';
      } else {
        heroOverlay.style.visibility = 'visible';
      }
    }
  }

  window.addEventListener('scroll', updateTargetFromScroll, { passive: true });

  // Smooth Lerp Render Loop
  function loop() {
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.5) {
      // Faster lerp (0.3 vs 0.18) = snaps to nearest frame quickly = no blurry mid-frame hold
      currentFrame += diff * 0.3;
      renderFrame(Math.round(currentFrame));
    } else if (Math.abs(diff) > 0.001) {
      currentFrame = targetFrame;
      renderFrame(Math.round(currentFrame));
    }
    requestAnimationFrame(loop);
  }

  // Initialize Canvas Animation
  resizeCanvas();
  startPreloading();
  updateTargetFromScroll();
  requestAnimationFrame(loop);
})();

// -------------------------------------------------------------
// 2. INTERACTIVE SECTION SCRIPTS (from code.html)
// -------------------------------------------------------------

// DMV Regional Tabs Switcher
window.switchRegion = function(region) {
  const regions = ['dc', 'va', 'md'];
  regions.forEach(r => {
    const panel = document.getElementById(`panel-${r}`);
    const btn = document.getElementById(`btn-${r}`);
    if (panel && btn) {
      if (r === region) {
        panel.classList.remove('hidden');
        btn.classList.add('bg-midnight-blue', 'text-white');
        btn.classList.remove('text-slate-gray');
      } else {
        panel.classList.add('hidden');
        btn.classList.remove('bg-midnight-blue', 'text-white');
        btn.classList.add('text-slate-gray');
      }
    }
  });
};

// FAQ Accordion Toggle
window.toggleFaq = function(id) {
  const el = document.getElementById(id);
  const icon = document.getElementById(id + '-icon');
  if (el && icon) {
    if (el.classList.contains('hidden')) {
      el.classList.remove('hidden');
      icon.classList.add('rotate-180');
    } else {
      el.classList.add('hidden');
      icon.classList.remove('rotate-180');
    }
  }
};

// Instant Quote Demo Feedback
window.showQuoteFeedback = function() {
  const pickup = document.getElementById('pickupInput').value || 'Requested Pickup';
  const dropoff = document.getElementById('dropoffInput').value || 'Destination';
  const resultBox = document.getElementById('quoteResult');
  const feedbackText = document.getElementById('quoteFeedbackText');
  
  if (resultBox && feedbackText) {
    feedbackText.textContent = `Route Confirmed: ${pickup} → ${dropoff}. Sedan base starting at $85 | Escalade at $110. Concierge is standing by.`;
    resultBox.classList.remove('hidden');
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

// Booking Tab Switching
document.addEventListener('DOMContentLoaded', () => {
  const tabPoint = document.getElementById('tabPoint');
  const tabHourly = document.getElementById('tabHourly');
  const tabAirport = document.getElementById('tabAirport');
  const tabs = [tabPoint, tabHourly, tabAirport];

  tabs.forEach(tab => {
    if (!tab) return;
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach(t => {
        t.classList.remove('text-midnight-blue', 'font-bold', 'border-b-2', 'border-secondary');
        t.classList.add('text-slate-gray');
      });
      tab.classList.add('text-midnight-blue', 'font-bold', 'border-b-2', 'border-secondary');
      tab.classList.remove('text-slate-gray');
    });
  });
});

// Navbar scroll background toggle
const navbar = document.getElementById('main-navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// -------------------------------------------------------------
// 3. PREMIUM 3D ANIMATION & INTERACTION ENGINE
// -------------------------------------------------------------
(() => {
  // 1. Dynamic 3D Card Tilt with Specular Glare Tracking
  function init3DTiltCards() {
    const cards = document.querySelectorAll(`
      #booking > div,
      #services .grid > div,
      #fleet .grid > div,
      #why-choose .grid > div,
      #why-choose .lg\\:col-span-5 > div,
      #service-area .rounded-xl,
      #pricing .grid > div,
      #about .rounded-lg,
      #reviews .grid > div,
      .tilt-3d
    `);

    cards.forEach(card => {
      if (!card || card.dataset.tiltInit === 'true') return;
      card.dataset.tiltInit = 'true';
      card.classList.add('tilt-3d');

      // Create dynamic 3D glare layer if not present
      if (!card.querySelector('.tilt-glare')) {
        const glare = document.createElement('div');
        glare.className = 'tilt-glare';
        card.appendChild(glare);
      }

      const glare = card.querySelector('.tilt-glare');
      let rafId = null;

      card.addEventListener('mousemove', (e) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;

          // Compute 3D rotation angles (-7deg to +7deg)
          const rx = ((0.5 - y) * 14).toFixed(2);
          const ry = ((x - 0.5) * 14).toFixed(2);

          card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(12px) scale3d(1.018, 1.018, 1.018)`;
          if (glare) {
            glare.style.background = `radial-gradient(circle at ${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%, rgba(255, 255, 255, 0.32) 0%, rgba(235, 192, 119, 0.12) 40%, transparent 72%)`;
            glare.style.opacity = '1';
          }
        });
      });

      card.addEventListener('mouseleave', () => {
        if (rafId) cancelAnimationFrame(rafId);
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)';
        if (glare) {
          glare.style.opacity = '0';
        }
      });
    });
  }

  // 2. 3D Perspective Scroll Reveal Animation (Intersection Observer)
  function init3DScrollReveal() {
    const revealTargets = document.querySelectorAll(`
      #services .text-center,
      #services .grid > div,
      #fleet .text-center,
      #fleet .grid > div,
      #fleet .grid + div,
      #why-choose .space-y-8,
      #why-choose .lg\\:col-span-5,
      #service-area .text-center,
      #service-area .rounded-xl,
      #pricing .text-center,
      #pricing .grid > div,
      #about .space-y-6,
      #about .relative,
      #reviews .text-center,
      #reviews .grid > div,
      #faq .text-center,
      #faq .space-y-4,
      #cta .space-y-8
    `);

    revealTargets.forEach((el, index) => {
      el.classList.add('reveal-3d');
      // Stagger siblings slightly
      const delay = (index % 4) * 0.1;
      el.style.transitionDelay = `${delay}s`;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealTargets.forEach(el => observer.observe(el));
  }

  // 3. Add 3D Button Depth to all Primary Action Buttons
  function init3DButtons() {
    const buttons = document.querySelectorAll(`
      a[href="#booking"],
      a[href^="tel:"],
      button[type="submit"],
      #quoteForm a,
      #cta a,
      #service-area button,
      .nav-item-link
    `);

    buttons.forEach(btn => {
      btn.classList.add('btn-3d');
    });
  }

  // 4. Subtle Ambient 3D Parallax on Scroll
  function init3DParallax() {
    const parallaxImages = document.querySelectorAll(`
      #services img,
      #fleet img,
      #about img,
      #service-area img
    `);

    parallaxImages.forEach(img => {
      img.classList.add('card-image-3d');
    });

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const orbs = document.querySelectorAll('.ambient-orb');
          orbs.forEach((orb, i) => {
            const factor = (i + 1) * 0.05;
            orb.style.transform = `translate3d(0, ${scrollY * factor}px, 0)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // Initialize 3D Engine
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init3DTiltCards();
      init3DScrollReveal();
      init3DButtons();
      init3DParallax();
    });
  } else {
    init3DTiltCards();
    init3DScrollReveal();
    init3DButtons();
    init3DParallax();
  }
})();
