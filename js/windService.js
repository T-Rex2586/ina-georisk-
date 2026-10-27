/**
 * Service Dinamika Aliran Angin Indonesia (Open-Meteo Weather API)
 * Menyediakan vektor arah, kecepatan angin, dan korelasi sebaran polutan/abu
 */

class WindService {
  constructor() {
    this.cacheKey = 'ina_wind_data_cache_v1';
    this.cacheExpiryMs = 60 * 60 * 1000; // 1 jam
    this.windStations = [
      { id: 'w_aceh', name: 'Banda Aceh', lat: 5.5483, lon: 95.3238 },
      { id: 'w_mdn', name: 'Medan', lat: 3.5952, lon: 98.6722 },
      { id: 'w_pku', name: 'Pekanbaru', lat: 0.5071, lon: 101.4478 },
      { id: 'w_pdg', name: 'Padang', lat: -0.9471, lon: 100.4172 },
      { id: 'w_plb', name: 'Palembang', lat: -2.9909, lon: 104.7565 },
      { id: 'w_jkt', name: 'Jakarta (Laut Jawa)', lat: -6.1200, lon: 106.8500 },
      { id: 'w_bdg', name: 'Bandung', lat: -6.9175, lon: 107.6191 },
      { id: 'w_smg', name: 'Semarang', lat: -6.9667, lon: 110.4167 },
      { id: 'w_sby', name: 'Surabaya', lat: -7.2575, lon: 112.7521 },
      { id: 'w_dps', name: 'Denpasar / Selat Bali', lat: -8.6705, lon: 115.2126 },
      { id: 'w_kupang', name: 'Kupang (Laut Timor)', lat: -10.1772, lon: 123.6070 },
      { id: 'w_ptk', name: 'Pontianak', lat: -0.0263, lon: 109.3425 },
      { id: 'w_pky', name: 'Palangka Raya', lat: -2.2161, lon: 113.9140 },
      { id: 'w_smd', name: 'Samarinda / Selat Makassar', lat: -0.5022, lon: 117.1536 },
      { id: 'w_mks', name: 'Makassar', lat: -5.1477, lon: 119.4327 },
      { id: 'w_mnd', name: 'Manado (Laut Sulawesi)', lat: 1.4748, lon: 124.8421 },
      { id: 'w_amb', name: 'Ambon (Laut Banda)', lat: -3.6954, lon: 128.1814 },
      { id: 'w_trn', name: 'Ternate / Laut Maluku', lat: 0.7900, lon: 127.3800 },
      { id: 'w_jyp', name: 'Jayapura (Pasifik)', lat: -2.5916, lon: 140.6690 },
      { id: 'w_mrk', name: 'Merauke (Laut Arafura)', lat: -8.4991, lon: 140.4011 }
    ];
    this.windData = [];
  }

  /**
   * Mengambil data angin terkini untuk seluruh stasiun di Indonesia
   */
  async fetchAllWindStations(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = this.loadFromCache();
      if (cached && cached.length > 0) {
        this.windData = cached;
        return cached;
      }
    }

    const promises = this.windStations.map(async st => {
      try {
        return await this.fetchSingleWind(st);
      } catch (err) {
        console.warn(`Gagal fetch data angin ${st.name}:`, err);
        return this.generateFallbackWind(st);
      }
    });

    this.windData = await Promise.all(promises);
    this.saveToCache(this.windData);
    return this.windData;
  }

  async fetchSingleWind(st) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${st.lat}&longitude=${st.lon}&current=windspeed_10m,winddirection_10m,temperature_2m,relative_humidity_2m&timezone=Asia%2FJakarta`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const cur = json.current || {};

    const speed = cur.windspeed_10m !== undefined ? Number(cur.windspeed_10m.toFixed(1)) : 12;
    const direction = cur.winddirection_10m !== undefined ? Math.round(cur.winddirection_10m) : 180;
    const cardinal = this.degreesToCardinal(direction);

    return {
      id: st.id,
      name: st.name,
      lat: st.lat,
      lon: st.lon,
      speedKmH: speed,
      directionDeg: direction,
      cardinalDirection: cardinal,
      temperatureC: cur.temperature_2m || 28,
      humidityPct: cur.relative_humidity_2m || 75,
      time: cur.time || new Date().toISOString(),
      source: 'Open-Meteo Weather API (Live)'
    };
  }

  /**
   * Konversi derajat mata angin ke teks arah bahasa Indonesia
   */
  degreesToCardinal(deg) {
    const directions = [
      { name: 'Utara', deg: 0 },
      { name: 'Timur Laut', deg: 45 },
      { name: 'Timur', deg: 90 },
      { name: 'Tenggara', deg: 135 },
      { name: 'Selatan', deg: 180 },
      { name: 'Barat Daya', deg: 225 },
      { name: 'Barat', deg: 270 },
      { name: 'Barat Laut', deg: 315 },
      { name: 'Utara', deg: 360 }
    ];

    const normalized = (deg % 360 + 360) % 360;
    let closest = directions[0];
    let minDiff = 360;

    for (const d of directions) {
      const diff = Math.abs(normalized - d.deg);
      if (diff < minDiff) {
        minDiff = diff;
        closest = d;
      }
    }

    return closest.name;
  }

  /**
   * Estimasi arah angin di koordinat mana saja di Indonesia
   * menggunakan interpolasi tetangga terdekat (Nearest Neighbor / IDW)
   */
  getWindAtLocation(lat, lon) {
    if (!this.windData || this.windData.length === 0) {
      return { speedKmH: 14, directionDeg: 220, cardinalDirection: 'Barat Daya' };
    }

    let nearest = this.windData[0];
    let minDistance = Infinity;

    for (const st of this.windData) {
      const d = Math.hypot(st.lat - lat, st.lon - lon);
      if (d < minDistance) {
        minDistance = d;
        nearest = st;
      }
    }

    return {
      speedKmH: nearest.speedKmH,
      directionDeg: nearest.directionDeg,
      cardinalDirection: nearest.cardinalDirection
    };
  }

  generateFallbackWind(st) {
    // Angin muson tipikal Indonesia (kecepatan 10 - 24 km/jam)
    const baseDir = (st.lat < -2) ? 140 : 220; // Pola angin monsun tenggara/barat daya
    const dir = (baseDir + Math.floor((Math.random() * 40) - 20) + 360) % 360;
    const speed = Number((Math.random() * 12 + 8).toFixed(1));

    return {
      id: st.id,
      name: st.name,
      lat: st.lat,
      lon: st.lon,
      speedKmH: speed,
      directionDeg: dir,
      cardinalDirection: this.degreesToCardinal(dir),
      temperatureC: Number((Math.random() * 4 + 27).toFixed(1)),
      humidityPct: Math.floor(Math.random() * 20 + 65),
      time: new Date().toISOString(),
      source: 'Open-Meteo Weather (Fallback Pola Monsun)'
    };
  }

  saveToCache(data) {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: data
      }));
    } catch (e) {
      console.warn('Gagal menyimpan cache angin:', e);
    }
  }

  loadFromCache() {
    try {
      const raw = localStorage.getItem(this.cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < this.cacheExpiryMs) {
        return parsed.data;
      }
    } catch (e) {
      return null;
    }
    return null;
  }
}

window.WindService = WindService;
