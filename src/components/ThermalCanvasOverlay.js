/**
 * Thermal Glow Canvas Overlay for NASA FIRMS Hotspots
 * Menggambar gumpalan panas bercahaya (thermal blooms) menggunakan HTML5 Canvas performa tinggi
 * Tanpa ketergantungan pada plugin eksternal yang rentan error di Vite/ES Modules
 */

export class ThermalHeatEngine {
  constructor(canvas, map) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.map = map;
    this.hotspots = [];
    this.isVisible = true;

    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);

    this.resize();
  }

  resize() {
    if (!this.map || !this.canvas) return;
    const size = this.map.getSize();
    this.canvas.width = size.x;
    this.canvas.height = size.y;
    this.render();
  }

  setHotspots(data) {
    this.hotspots = data || [];
    this.render();
  }

  setVisible(visible) {
    this.isVisible = visible;
    if (!visible) {
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    } else {
      this.render();
    }
  }

  render() {
    if (!this.isVisible || !this.map || !this.ctx || !this.canvas) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);
    if (!this.hotspots || this.hotspots.length === 0) return;

    // Gunakan composite operation screen untuk efek gumpalan panas bercahaya (luminous thermal bloom)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const zoom = this.map.getZoom();
    // Skala radius berdasarkan level zoom peta
    const baseRadius = Math.max(14, Math.min(48, 12 * Math.pow(1.22, zoom - 5)));

    for (let i = 0; i < this.hotspots.length; i++) {
      const h = this.hotspots[i];
      if (!h || h.lat === undefined || h.lon === undefined) continue;

      const point = this.map.latLngToContainerPoint([h.lat, h.lon]);

      // Abaikan titik yang berada jauh di luar batas viewport canvas
      if (point.x < -baseRadius || point.x > width + baseRadius || point.y < -baseRadius || point.y > height + baseRadius) {
        continue;
      }

      // Intensitas dan ukuran berdasarkan Fire Radiative Power (FRP)
      const frp = h.frp || 10;
      const frpFactor = Math.min(2.0, Math.max(0.7, Math.sqrt(frp) * 0.25));
      const radius = baseRadius * frpFactor;

      // Radial Gradient: Inti putih-kuning panas -> oranye pijar -> merah pudar
      const grad = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
      grad.addColorStop(0, 'rgba(255, 255, 220, 0.95)');
      grad.addColorStop(0.2, 'rgba(254, 215, 60, 0.80)');
      grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.50)');
      grad.addColorStop(0.8, 'rgba(239, 68, 68, 0.22)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.restore();
  }
}
