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
  const ctx = canvas.getContext('2d', { alpha: false });
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
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

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

    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // Preload all 300 images
  function startPreloading() {
    // 1. Immediately load frame 1
    const frameOne = new Image();
    frameOne.src = getFrameSrc(1);
    frameOne.onload = () => {
      images[1] = frameOne;
      loaded[1] = true;
      if (!isInitialFrameRendered) {
        isInitialFrameRendered = true;
        renderFrame(1);
      }
    };

    // 2. Load all remaining frames
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      if (i === 1) continue;
      const img = new Image();
      img.src = getFrameSrc(i);
      img.onload = () => {
        images[i] = img;
        loaded[i] = true;
        if (!isInitialFrameRendered && (i === 2 || i === 3)) {
          isInitialFrameRendered = true;
          renderFrame(i);
        }
      };
      img.onerror = () => {
        console.warn(`Failed to load frame ${i}`);
      };
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
    if (Math.abs(diff) > 0.005) {
      currentFrame += diff * 0.18;
      renderFrame(currentFrame);
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
