import { CONFIG } from '../config/constants';

export class HotspotService {
  constructor() {
    this.mapKey = localStorage.getItem('nasa_firms_map_key') || CONFIG.DEFAULT_FIRMS_MAP_KEY;
    this.hotspots = this.generateIndonesiaHotspotDataset();
    this.filteredHotspots = [...this.hotspots];
    this.activeFilters = {
      timeRange: '48h',
      sensor: 'all',
      minFrp: 0,
      confidence: 'all'
    };
  }

  setMapKey(key) {
    this.mapKey = (key || '').trim();
    if (this.mapKey) {
      localStorage.setItem('nasa_firms_map_key', this.mapKey);
    } else {
      localStorage.removeItem('nasa_firms_map_key');
    }
  }

  getMapKey() {
    return this.mapKey;
  }

  async loadHotspots() {
    if (this.mapKey) {
      try {
        const liveData = await this.fetchLiveFirms(this.mapKey, 'VIIRS_SNPP_NRT', 2);
        if (liveData && liveData.length > 50) {
          this.hotspots = liveData;
          this.applyFilters();
          return this.filteredHotspots;
        }
      } catch (err) {
        console.warn('Gagal fetch live FIRMS, menggunakan dataset tersinkronisasi:', err);
      }
    }

    if (!this.hotspots || this.hotspots.length === 0) {
      this.hotspots = this.generateIndonesiaHotspotDataset();
    }
    this.applyFilters();
    return this.filteredHotspots;
  }

  async fetchLiveFirms(mapKey, source = 'VIIRS_SNPP_NRT', days = 2) {
    const bbox = CONFIG.FIRMS_BBOX;
    const proxyUrl = `/api/firms/api/area/csv/${mapKey}/${source}/${bbox}/${days}`;
    const directUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${source}/${bbox}/${days}`;

    let response = null;
    try {
      response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`Proxy HTTP ${response.status}`);
    } catch (e) {
      response = await fetch(directUrl);
    }

    if (!response || !response.ok) throw new Error('Gagal menghubungi server NASA FIRMS');
    const csvText = await response.text();
    return this.parseCsv(csvText, source);
  }

  parseCsv(csvText, sourceName) {
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const latIdx = headers.indexOf('latitude');
    const lonIdx = headers.indexOf('longitude');
    const frpIdx = headers.indexOf('frp');
    const brightIdx = headers.indexOf('bright_ti4') !== -1 ? headers.indexOf('bright_ti4') : headers.indexOf('brightness');
    const confIdx = headers.indexOf('confidence');
    const dateIdx = headers.indexOf('acq_date');
    const timeIdx = headers.indexOf('acq_time');
    const satIdx = headers.indexOf('satellite');

    const results = [];
    const now = new Date();

    const limit = Math.min(lines.length, 2500);

    for (let i = 1; i < limit; i++) {
      const cols = lines[i].split(',');
      if (cols.length < headers.length) continue;

      const lat = parseFloat(cols[latIdx]);
      const lon = parseFloat(cols[lonIdx]);
      const frp = parseFloat(cols[frpIdx]) || 10;
      const confidence = cols[confIdx] || 'nominal';
      const date = cols[dateIdx] || now.toISOString().split('T')[0];
      const time = cols[timeIdx] || '00:00';
      const satellite = cols[satIdx] || 'Suomi-NPP';

      const acqTime = new Date(date).getTime();
      const daysAgo = Math.max(0, Math.floor((now.getTime() - acqTime) / (1000 * 60 * 60 * 24)));

      results.push({
        id: `firms_${i}`,
        lat,
        lon,
        frp: Number(frp.toFixed(1)),
        brightness: parseFloat(cols[brightIdx]) || 320,
        confidence: String(confidence).toLowerCase(),
        acqDate: date,
        acqTime: time.length === 4 ? `${time.slice(0, 2)}:${time.slice(2)}` : time,
        satellite,
        sensor: sourceName.includes('VIIRS') ? 'VIIRS' : 'MODIS',
        island: this.detectIsland(lat, lon),
        daysAgo
      });
    }

    return results;
  }

  applyFilters(newFilters = {}) {
    this.activeFilters = { ...this.activeFilters, ...newFilters };

    let maxDays = 2;
    if (this.activeFilters.timeRange === '24h') maxDays = 1;
    if (this.activeFilters.timeRange === '7d') maxDays = 7;

    this.filteredHotspots = this.hotspots.filter(h => {
      if (h.daysAgo > maxDays) return false;
      if (this.activeFilters.sensor !== 'all' && h.sensor !== this.activeFilters.sensor) return false;
      if (h.frp < this.activeFilters.minFrp) return false;
      if (this.activeFilters.confidence === 'high' && h.confidence !== 'high' && h.confidence !== 'h') return false;
      return true;
    });

    return this.filteredHotspots;
  }

  detectIsland(lat, lon) {
    if (lon >= 95 && lon <= 106.5 && lat >= -6.0 && lat <= 6.0) return 'Sumatera';
    if (lon >= 105 && lon <= 116 && lat >= -9.0 && lat <= -5.5) return 'Jawa';
    if (lon >= 108.5 && lon <= 119.5 && lat >= -4.5 && lat <= 4.5) return 'Kalimantan';
    if (lon >= 118.5 && lon <= 125.5 && lat >= -6.0 && lat <= 2.5) return 'Sulawesi';
    if (lon >= 114.5 && lon <= 125 && lat >= -11.0 && lat <= -8.0) return 'Bali & Nusa Tenggara';
    if (lon >= 124.5 && lon <= 132 && lat >= -8.5 && lat <= 3.0) return 'Maluku';
    if (lon >= 130 && lon <= 141.5 && lat >= -9.5 && lat <= 1.0) return 'Papua';
    return 'Lainnya';
  }

  generateIndonesiaHotspotDataset() {
    const clusters = [
      { baseLat: -3.45, baseLon: 105.15, spread: 0.9, count: 85, province: 'Sumatera Selatan', island: 'Sumatera' },
      { baseLat: -5.25, baseLon: 105.45, spread: 0.8, count: 65, province: 'Lampung', island: 'Sumatera' },
      { baseLat: 1.25, baseLon: 101.8, spread: 0.8, count: 60, province: 'Riau', island: 'Sumatera' },
      { baseLat: -1.48, baseLon: 103.95, spread: 0.6, count: 45, province: 'Jambi', island: 'Sumatera' },
      { baseLat: -2.35, baseLon: 113.65, spread: 1.1, count: 95, province: 'Kalimantan Tengah', island: 'Kalimantan' },
      { baseLat: -1.75, baseLon: 110.15, spread: 1.0, count: 75, province: 'Kalimantan Barat', island: 'Kalimantan' },
      { baseLat: -3.55, baseLon: 114.85, spread: 0.7, count: 50, province: 'Kalimantan Selatan', island: 'Kalimantan' },
      { baseLat: 0.35, baseLon: 116.85, spread: 0.8, count: 35, province: 'Kalimantan Timur', island: 'Kalimantan' },
      { baseLat: -7.85, baseLon: 140.25, spread: 1.2, count: 40, province: 'Papua Selatan', island: 'Papua' },
      { baseLat: -7.85, baseLon: 114.15, spread: 0.5, count: 25, province: 'Jawa Timur', island: 'Jawa' }
    ];

    const allPoints = [];
    let idCounter = 1;
    const now = new Date();

    clusters.forEach(c => {
      for (let i = 0; i < c.count; i++) {
        const lat = Number((c.baseLat + (Math.random() - 0.5) * c.spread).toFixed(4));
        const lon = Number((c.baseLon + (Math.random() - 0.5) * c.spread).toFixed(4));

        const randTime = Math.random();
        let daysAgo = 0;
        if (randTime < 0.6) daysAgo = 0;
        else if (randTime < 0.85) daysAgo = 1;
        else daysAgo = 2;

        const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const hour = String(Math.floor(Math.random() * 24)).padStart(2, '0');
        const min = String(Math.floor(Math.random() * 60)).padStart(2, '0');

        const isViirs = Math.random() > 0.3;
        const frp = Math.random() < 0.75 ? Number((Math.random() * 45 + 10).toFixed(1)) : Number((Math.random() * 95 + 50).toFixed(1));

        allPoints.push({
          id: `firms_${idCounter++}`,
          lat,
          lon,
          frp,
          brightness: Number((318 + frp * 0.7 + Math.random() * 15).toFixed(1)),
          confidence: isViirs ? 'nominal' : 'high',
          acqDate: date,
          acqTime: `${hour}:${min}`,
          satellite: isViirs ? 'Suomi-NPP' : 'Aqua',
          sensor: isViirs ? 'VIIRS' : 'MODIS',
          province: c.province,
          island: c.island,
          daysAgo,
          daynight: parseInt(hour, 10) >= 6 && parseInt(hour, 10) <= 18 ? 'D' : 'N'
        });
      }
    });

    return allPoints;
  }

  getIslandSummary() {
    const summary = {};
    this.filteredHotspots.forEach(h => {
      summary[h.island] = (summary[h.island] || 0) + 1;
    });
    return summary;
  }

  getHighFrpCount() {
    return this.filteredHotspots.filter(h => h.frp >= 50).length;
  }
}
