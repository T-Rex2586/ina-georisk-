/**
 * Wind Particle Canvas Overlay
 * Menggambar partikel angin dinamis (streamlines) yang mengalir di atas peta kepulauan Indonesia
 */

export class WindParticleEngine {
  constructor(canvas, map, getWindAtLocation) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.map = map;
    this.getWindAtLocation = getWindAtLocation;
    this.particles = [];
    this.maxParticles = 240;
    this.animationFrameId = null;
    this.isRunning = false;

    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.animate = this.animate.bind(this);

    this.initParticles();
  }

  resizeCanvas() {
    if (!this.map || !this.canvas) return;
    const size = this.map.getSize();
    this.canvas.width = size.x;
    this.canvas.height = size.y;
  }

  initParticles() {
    this.particles = [];
    const size = this.map ? this.map.getSize() : { x: window.innerWidth, y: window.innerHeight };
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle(size));
    }
  }

  createParticle(size) {
    return {
      x: Math.random() * size.x,
      y: Math.random() * size.y,
      age: Math.floor(Math.random() * 80),
      maxAge: 70 + Math.floor(Math.random() * 50),
      speedFactor: 0.6 + Math.random() * 0.8
    };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.resizeCanvas();
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  animate() {
    if (!this.isRunning || !this.map) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const size = { x: width, y: height };

    // Fading effect untuk membuat jejak ekor angin yang halus (streamline trails)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    this.ctx.globalCompositeOperation = 'destination-in';
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.globalCompositeOperation = 'lighter';

    const zoom = this.map.getZoom();
    const zoomScale = Math.pow(1.2, zoom - 5);

    // Cek apakah ada popup leaflet terbuka agar partikel tidak menggambar di atas popup
    const popupEl = document.querySelector('.leaflet-popup');
    let excludeBox = null;
    if (popupEl && this.canvas) {
      const pRect = popupEl.getBoundingClientRect();
      const cRect = this.canvas.getBoundingClientRect();
      excludeBox = {
        minX: pRect.left - cRect.left - 6,
        maxX: pRect.right - cRect.left + 6,
        minY: pRect.top - cRect.top - 6,
        maxY: pRect.bottom - cRect.top + 6
      };
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Lewati partikel jika berada di dalam area popup yang sedang terbuka
      if (excludeBox && p.x >= excludeBox.minX && p.x <= excludeBox.maxX && p.y >= excludeBox.minY && p.y <= excludeBox.maxY) {
        p.age++;
        if (p.age > p.maxAge) {
          this.particles[i] = this.createParticle(size);
        }
        continue;
      }

      // Konversi posisi pixel canvas ke koordinat geografis
      const latLng = this.map.containerPointToLatLng([p.x, p.y]);
      const wind = this.getWindAtLocation(latLng.lat, latLng.lng);

      // Kecepatan dan arah dalam radian (arah tiupan)
      const rad = ((wind.directionDeg + 180) * Math.PI) / 180;
      const speed = Math.min(25, Math.max(6, wind.speedKmH)) * 0.08 * p.speedFactor * zoomScale;

      const nextX = p.x + Math.sin(rad) * speed;
      const nextY = p.y - Math.cos(rad) * speed;

      // Gambarkan garis partikel
      const progress = p.age / p.maxAge;
      const alpha = Math.sin(progress * Math.PI) * 0.65;

      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(nextX, nextY);
      this.ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      this.ctx.lineWidth = 1.6;
      this.ctx.stroke();

      p.x = nextX;
      p.y = nextY;
      p.age++;

      // Reset partikel jika keluar layar atau sudah tua
      if (p.age > p.maxAge || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        this.particles[i] = this.createParticle(size);
      }
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  }
}
