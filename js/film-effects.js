/**
 * film-effects.js
 * Advanced Silent Film Cinema Engine with High-Fidelity Canvas Simulation.
 * Integrates procedural organic specks, jittering vertical emulsion lines,
 * lens gate hair wiggle modeling, frame jumps, and changeover cues,
 * plus solid viewport curtain frames to shield outside the widescreen aperture.
 */

class FilmTheme {
  constructor() {
    this.overlay = null;
    this.scratchContainer = null;
    this.currentTheme = 'dark';
    
    // Timer handles for simulations
    this.flickerInterval = null;
    this.animationFrameId = null;
    this.state = {
      isLight: false
    };

    // Canvas resources
    this.canvas = null;
    this.ctx = null;
    this._resizeHandler = null;

    // Procedural entities
    this.scratches = [];          // Emulsion vertical scratch fibers
    this.hairs = [];              // Floating air hairs
    this.feathers = [];           // Transient frame specks
    this.gateHair = null;         // Stuck projector gate hair
    this.lastGateHairSpawn = Date.now();
    this.lastCigaretteBurn = Date.now();
    this.cigaretteBurnActive = false;
    this.cigaretteBurnFrames = 0;
  }

  /**
   * Initializes the 1920s film environment
   * Generates viewport boundaries, overlays, solid curtains, and launches the Canvas engine.
   */
  init() {
    // 1. Mark body
    document.body.classList.add('film-themed-body');

    // 2. Set current palette class
    this.setTheme(this.currentTheme);

    // 3. Create core overlays
    if (!document.querySelector('.film-overlay')) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'film-overlay';

      // Vignette effect shadow
      const vignette = document.createElement('div');
      vignette.className = 'film-vignette';
      this.overlay.appendChild(vignette);

      // CSS Grain layer
      const grain = document.createElement('div');
      grain.className = 'film-grain';
      this.overlay.appendChild(grain);

      // Light flicker lens
      const flicker = document.createElement('div');
      flicker.className = 'film-flicker';
      this.overlay.appendChild(flicker);

      // Scratches spacer
      this.scratchContainer = document.createElement('div');
      this.scratchContainer.className = 'film-scratches-layer';
      this.overlay.appendChild(this.scratchContainer);

      document.body.appendChild(this.overlay);
    } else {
      this.overlay = document.querySelector('.film-overlay');
      this.scratchContainer = this.overlay.querySelector('.film-scratches-layer');
    }

    // 4. Create film perforations (side edges)
    if (!document.querySelector('.film-perforation-leftBy')) {
      const perfLeft = document.createElement('div');
      perfLeft.className = 'film-perforation-leftBy';
      document.body.appendChild(perfLeft);

      const perfRight = document.createElement('div');
      perfRight.className = 'film-perforation-rightBy';
      document.body.appendChild(perfRight);
    }

    // 5. Create ornamental layout frames
    if (!document.querySelector('.film-aesthetic-frame')) {
      const frame = document.createElement('div');
      frame.className = 'film-aesthetic-frame';

      const corners = ['tl', 'tr', 'bl', 'br'];
      corners.forEach(corner => {
        const c = document.createElement('div');
        c.className = `film-corner-accent film-corner-${corner}`;
        frame.appendChild(c);
      });

      document.body.appendChild(frame);
    }

    // 6. Create solid theater viewport curtains to cleanly swallow/clip content leakage
    if (!document.querySelector('.film-curtain')) {
      const directions = ['top', 'bottom', 'left', 'right'];
      directions.forEach(dir => {
        const curtain = document.createElement('div');
        curtain.className = `film-curtain film-curtain-${dir}`;
        document.body.appendChild(curtain);
      });
    }

    // 6.5. Create professional organic lens defocus blur (4 edges) + soft edge wear aperture vignette overlay
    if (!document.querySelector('.film-inner-aperture-vignette')) {
      const apertureVignette = document.createElement('div');
      apertureVignette.className = 'film-inner-aperture-vignette';
      document.body.appendChild(apertureVignette);
    }

    const blurDirs = ['top', 'bottom', 'left', 'right'];
    blurDirs.forEach(dir => {
      const className = `film-edge-blur-${dir}`;
      if (!document.querySelector(`.${className}`)) {
        const edgeBlur = document.createElement('div');
        edgeBlur.className = `film-edge-blur ${className}`;
        document.body.appendChild(edgeBlur);
      }
    });

    // 7. Initiate the high-fidelity Canvas Simulation Engine
    this.startVintageDamageSimulation();
  }

  /**
   * Sets the active visual color scheme
   * @param {'light'|'dark'} themeName 
   */
  setTheme(themeName) {
    this.currentTheme = themeName;
    this.state.isLight = (themeName === 'light');
    if (themeName === 'light') {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
    }
  }

  /**
   * Starts the canvas loop and background projector jump tickers
   */
  startVintageDamageSimulation() {
    this.stopVintageDamageSimulation();

    // 1. Create canvas element inside film overlay
    if (!this.canvas && this.overlay) {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'film-effects-canvas';
      this.canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9986;
      `;
      this.overlay.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
    }

    // 2. Set Canvas sizes on screen adjustments
    const resizeCanvas = () => {
      if (this.canvas) {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', resizeCanvas);
    this._resizeHandler = resizeCanvas;
    resizeCanvas();

    // 3. Projector frame shift / jumps (random mechanics)
    this.flickerInterval = setInterval(() => {
      if (Math.random() < 0.28) {
        this.triggerProjectorJump();
      }
    }, 4500);

    // 4. RequestAnimationFrame rendering ticker
    const tick = () => {
      this.renderCanvasEffects();
      this.animationFrameId = requestAnimationFrame(tick);
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  /**
   * Renders the hand-crafted organic vector simulations on the Canvas element.
   * Handles specks, hairline scratches, bezier dust strands, wiggly gate gate hairs, and movie changes.
   */
  renderCanvasEffects() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    const isLight = this.state.isLight;
    // Adapt dust colors so they contrast beautifully on both aged sepia brown and parchment white
    const primaryColor = isLight ? 'rgba(30, 16, 12, ' : 'rgba(245, 230, 200, ';
    const shadowColor = isLight ? 'rgba(230, 215, 175, ' : 'rgba(10, 7, 4, ';

    // -------------------------------------------------------------
    // A. PROJECTOR LIGHT FLUCTUATION HOTSPOT
    // -------------------------------------------------------------
    // Draw a fullscreen radial gradient hotspot to mimic a high-power burning carbon arc bulb
    const hotspotRadial = ctx.createRadialGradient(
      w / 2 + (Math.random() * 26 - 13), 
      h / 2 + (Math.random() * 26 - 13), 
      w * 0.12, 
      w / 2, 
      h / 2, 
      w * 0.82
    );
    const pulseAlpha = isLight ? (0.01 + Math.random() * 0.03) : (0.02 + Math.random() * 0.05);
    hotspotRadial.addColorStop(0, `rgba(255, 252, 220, ${pulseAlpha})`);
    hotspotRadial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = hotspotRadial;
    ctx.fillRect(0, 0, w, h);

    // -------------------------------------------------------------
    // B. DUST ASH & FLUID SPLOTCHES
    // -------------------------------------------------------------
    // Inject translucent dots with organic parameters every few frames
    if (Math.random() < 0.85 && this.feathers.length < 8) {
      const isSplotch = Math.random() < 0.06;
      this.feathers.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: isSplotch ? (Math.random() * 3.8 + 2.2) : (Math.random() * 1.4 + 0.4),
        alpha: Math.random() * 0.45 + 0.25,
        life: Math.floor(Math.random() * 3) + 1, // brief flash
        shape: Math.random() < 0.28 ? 'long' : 'round',
        angle: Math.random() * Math.PI
      });
    }

    this.feathers = this.feathers.filter(f => {
      f.life--;
      if (f.life <= 0) return false;

      ctx.save();
      ctx.fillStyle = primaryColor + `${f.alpha})`;
      ctx.beginPath();

      if (f.shape === 'long') {
        const length = f.radius * 3.4;
        ctx.translate(f.x, f.y);
        ctx.rotate(f.angle);
        ctx.rect(-f.radius / 2, -length / 2, f.radius, length);
        ctx.fill();
      } else {
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();

        // 3D paper shadow to give real physical substance
        ctx.fillStyle = shadowColor + '0.3)';
        ctx.beginPath();
        ctx.arc(f.x + 1.2, f.y + 1.2, f.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return true;
    });

    // -------------------------------------------------------------
    // C. EMULSION VERTICAL TRACK LINES (SCRATCHES)
    // -------------------------------------------------------------
    // Draw fine hair-line scratches moving slightly horizontally to trace mechanics
    if (Math.random() < 0.16 && this.scratches.length < 4) {
      this.scratches.push({
        x: Math.random() * w,
        width: Math.random() < 0.15 ? 1.6 : 0.75,
        speedX: -1.5 + Math.random() * 3,
        alpha: Math.random() * 0.24 + 0.08,
        life: Math.floor(Math.random() * 15) + 8, // lives across frames
        drift: 0
      });
    }

    this.scratches = this.scratches.filter(s => {
      s.life--;
      if (s.life <= 0) return false;

      // Track gate wobbling
      s.x += s.speedX + (Math.random() * 0.7 - 0.35);
      s.drift += Math.random() * 0.16 - 0.08;

      ctx.save();
      ctx.strokeStyle = primaryColor + `${s.alpha})`;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(s.x, 0);
      ctx.bezierCurveTo(s.x + s.drift * 12, h * 0.3, s.x - s.drift * 12, h * 0.7, s.x, h);
      ctx.stroke();
      ctx.restore();
      return true;
    });

    // -------------------------------------------------------------
    // D. RANDOM COIL DUST HAIRS
    // -------------------------------------------------------------
    if (Math.random() < 0.05 && this.hairs.length < 2) {
      this.hairs.push({
        x1: Math.random() * w,
        y1: Math.random() * h,
        cpX: Math.random() * w,
        cpY: Math.random() * h,
        x2: Math.random() * w,
        y2: Math.random() * h,
        alpha: Math.random() * 0.35 + 0.15,
        life: Math.floor(Math.random() * 4) + 1
      });
    }

    this.hairs = this.hairs.filter(h => {
      h.life--;
      if (h.life <= 0) return false;

      ctx.save();
      ctx.strokeStyle = primaryColor + `${h.alpha})`;
      ctx.lineWidth = 0.95;
      ctx.beginPath();
      ctx.moveTo(h.x1, h.y1);
      ctx.quadraticCurveTo(h.cpX, h.cpY, h.x2, h.y2);
      ctx.stroke();
      ctx.restore();
      return true;
    });

    // -------------------------------------------------------------
    // E. THE LENS GATE HAIR (Modeling spring-suspended fibers)
    // -------------------------------------------------------------
    // Spawns a curly biological hair that gets physically caught on framing gates
    const now = Date.now();
    if (!this.gateHair && (now - this.lastGateHairSpawn > 11500) && Math.random() < 0.45) {
      const side = Math.floor(Math.random() * 4); // 0=Top, 1=Bottom, 2=Left, 3=Right
      let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
      const computedStyle = window.getComputedStyle(document.documentElement);
      const insetX = parseFloat(computedStyle.getPropertyValue('--film-frame-inset-x')) || 44;
      const insetY = parseFloat(computedStyle.getPropertyValue('--film-frame-inset-y')) || 0;

      if (side === 0) { // Top border
        x1 = insetX + Math.random() * (w - insetX * 2);
        y1 = insetY;
        x2 = x1 + (Math.random() * 130 - 65);
        y2 = insetY + (Math.random() * 95 + 45);
      } else if (side === 1) { // Bottom border
        x1 = insetX + Math.random() * (w - insetX * 2);
        y1 = h - insetY;
        x2 = x1 + (Math.random() * 130 - 65);
        y2 = h - insetY - (Math.random() * 95 + 45);
      } else if (side === 2) { // Left border
        x1 = insetX;
        y1 = insetY + Math.random() * (h - insetY * 2);
        x2 = insetX + (Math.random() * 95 + 45);
        y2 = y1 + (Math.random() * 130 - 65);
      } else { // Right border
        x1 = w - insetX;
        y1 = insetY + Math.random() * (h - insetY * 2);
        x2 = w - insetX - (Math.random() * 95 + 45);
        y2 = y1 + (Math.random() * 130 - 65);
      }

      this.gateHair = {
        x1, y1, x2, y2,
        cpX: (x1 + x2) / 2 + (Math.random() * 64 - 32),
        cpY: (y1 + y2) / 2 + (Math.random() * 64 - 32),
        alpha: 0.72,
        ticks: 0,
        lifeDuration: 95 + Math.floor(Math.random() * 90) // ~4-6 seconds life
      };
      this.lastGateHairSpawn = now;
    }

    if (this.gateHair) {
      this.gateHair.ticks++;
      if (this.gateHair.ticks > this.gateHair.lifeDuration) {
        this.gateHair.alpha -= 0.15;
        if (this.gateHair.alpha <= 0) {
          this.gateHair = null;
        }
      }

      if (this.gateHair) {
        // Model real friction tension wiggles using sin math of gate variables
        const wobbleAmp = Math.sin(this.gateHair.ticks * 0.26) * 4.2;
        const wobbleAmp2 = Math.cos(this.gateHair.ticks * 0.12) * 2.8;

        ctx.save();
        ctx.strokeStyle = `rgba(${isLight ? '22,12,8' : '235,215,185'}, ${this.gateHair.alpha})`;
        ctx.lineWidth = 1.35;
        ctx.shadowColor = shadowColor + '0.45)';
        ctx.shadowBlur = 1.5;

        ctx.beginPath();
        ctx.moveTo(this.gateHair.x1, this.gateHair.y1);
        ctx.quadraticCurveTo(
          this.gateHair.cpX + wobbleAmp,
          this.gateHair.cpY + wobbleAmp2,
          this.gateHair.x2 + wobbleAmp * 1.6,
          this.gateHair.y2 + wobbleAmp2 * 0.8
        );
        ctx.stroke();
        ctx.restore();
      }
    }

    // -------------------------------------------------------------
    // F. THE CIGARETTE BURN (Reel changeover mark)
    // -------------------------------------------------------------
    // A punched burn splot splotches in the upper-right corner once in a while
    if (!this.cigaretteBurnActive && (now - this.lastCigaretteBurn > 11000) && Math.random() < 0.28) {
      this.cigaretteBurnActive = true;
      this.cigaretteBurnFrames = 3; // precisely 3 projection slides
      this.lastCigaretteBurn = now;
    }

    if (this.cigaretteBurnActive) {
      this.cigaretteBurnFrames--;
      if (this.cigaretteBurnFrames <= 0) {
        this.cigaretteBurnActive = false;
      } else {
        const burnX = w - 105;
        const burnY = 80;
        ctx.save();
        ctx.fillStyle = 'rgba(12, 8, 4, 0.86)';
        ctx.strokeStyle = `rgba(${isLight ? '210,170,110' : '255,232,192'}, 0.5)`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();

        const points = 8;
        const radius = 13.5 + (Math.random() * 3.5 - 1.75);
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const offsetRadius = radius + (Math.random() * 2.6 - 1.3);
          const px = burnX + Math.cos(angle) * offsetRadius;
          const py = burnY + Math.sin(angle) * offsetRadius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cinema bulb hot center inside the burnhole
        ctx.fillStyle = isLight ? '#fefcf8' : '#eff4e7';
        ctx.beginPath();
        ctx.arc(burnX - 1.5, burnY + 1, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  /**
   * Resets and cleans all background tasks
   */
  stopVintageDamageSimulation() {
    if (this.flickerInterval) {
      clearInterval(this.flickerInterval);
      this.flickerInterval = null;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
  }

  /**
   * Simulates a projector mechanical gate bounce / friction jump
   */
  triggerProjectorJump() {
    const originalTransform = document.body.style.transform;
    const jumpOffset = -2.5 + Math.random() * 5; // offset vertical frame
    
    document.body.style.transform = `translateY(${jumpOffset}px)`;
    document.body.style.filter = 'brightness(1.14) contrast(1.08)';

    setTimeout(() => {
      document.body.style.transform = originalTransform;
      document.body.style.filter = '';
    }, 65);
  }

  /**
   * Full screen Intertitle notification overlay.
   * Emulates dialogue/note screens in classic silent cinema on event triggers.
   */
  showIntertitle(text, duration = 2500, useIrisWipe = false) {
    const existing = document.querySelectorAll('.film-intertitle-overlay');
    existing.forEach(el => el.remove());

    // Lock scrolling on background body
    document.body.classList.add('film-lock-scroll');

    const intertitle = document.createElement('div');
    intertitle.className = `film-intertitle-overlay ${useIrisWipe ? 'iris-wipe-in' : ''}`;

    const container = document.createElement('div');
    container.className = 'film-intertitle-container';

    const corners = ['tl', 'tr', 'bl', 'br'];
    corners.forEach(corner => {
      const c = document.createElement('div');
      c.className = `film-intertitle-corner intertitle-${corner}`;
      container.appendChild(c);
    });

    const p = document.createElement('p');
    p.className = 'film-intertitle-text';
    p.innerText = text;
    container.appendChild(p);

    intertitle.appendChild(container);
    document.body.appendChild(intertitle);

    const removeIntertitle = () => {
      intertitle.remove();
      // Unlock body scroll only if there are no remaining overlays living in theDOM
      if (!document.querySelector('.film-intertitle-overlay')) {
        document.body.classList.remove('film-lock-scroll');
      }
    };

    // Hard projection switch or wipe
    setTimeout(() => {
      if (useIrisWipe) {
        intertitle.classList.remove('iris-wipe-in');
        intertitle.classList.add('iris-wipe-out');
        setTimeout(removeIntertitle, 550);
      } else {
        removeIntertitle();
      }
    }, duration);
  }
}

// Bind to window sandbox
window.FilmTheme = FilmTheme;
window.filmThemeInstance = new FilmTheme();
