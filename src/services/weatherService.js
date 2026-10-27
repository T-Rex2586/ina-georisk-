/**
 * Layanan Prakiraan & Intelijen Cuaca (Weather Service)
 * Mengintegrasikan Open-Meteo Weather Forecast API
 * dengan Korelasi Risiko Bencana Vulkanik & Atmosfer Indonesia
 */

import { VOLCANO_DATABASE } from '../data/volcanoes';

export const WMO_WEATHER_CODES = {
  0: { label: 'Cerah', icon: 'Sun', color: '#facc15', desc: 'Langit cerah tanpa awan signifikan' },
  1: { label: 'Sebagian Cerah', icon: 'SunMedium', color: '#fde047', desc: 'Dominan cerah dengan awan tipis' },
  2: { label: 'Berawan Sebagian', icon: 'CloudSun', color: '#38bdf8', desc: 'Awan berselang-seling sinar matahari' },
  3: { label: 'Mendung', icon: 'Cloud', color: '#94a3b8', desc: 'Langit tertutup tutupan awan pekat' },
  45: { label: 'Kabut / Halimun', icon: 'CloudFog', color: '#cbd5e1', desc: 'Jarak pandang terbatas kabut atmosfer' },
  48: { label: 'Kabut Tebal', icon: 'CloudFog', color: '#94a3b8', desc: 'Kabut rime tebal dengan jarak pandang sangat rendah' },
  51: { label: 'Gerimis Ringan', icon: 'CloudDrizzle', color: '#67e8f9', desc: 'Hujan rintik-rintik berintensitas rendah' },
  53: { label: 'Gerimis Sedang', icon: 'CloudDrizzle', color: '#38bdf8', desc: 'Gerimis merata' },
  55: { label: 'Gerimis Lebat', icon: 'CloudDrizzle', color: '#0284c7', desc: 'Gerimis rapat berdurasi panjang' },
  61: { label: 'Hujan Ringan', icon: 'CloudRain', color: '#38bdf8', desc: 'Hujan intensitas ringan 1 - 5 mm/jam' },
  63: { label: 'Hujan Sedang', icon: 'CloudRain', color: '#0ea5e9', desc: 'Hujan intensitas sedang 5 - 10 mm/jam' },
  65: { label: 'Hujan Lebat', icon: 'CloudLightning', color: '#ef4444', desc: 'Hujan deras lebat >10 mm/jam' },
  80: { label: 'Hujan Guyur Ringan', icon: 'CloudRain', color: '#38bdf8', desc: 'Hujan mendadak lokal ringan' },
  81: { label: 'Hujan Guyur Sedang', icon: 'CloudRain', color: '#0ea5e9', desc: 'Hujan lebat sesaat' },
  82: { label: 'Hujan Guyur Sangat Lebat', icon: 'CloudLightning', color: '#dc2626', desc: 'Hujan monsun tropis lebat mendadak' },
  95: { label: 'Badai Petir', icon: 'Zap', color: '#f59e0b', desc: 'Hujan disertai petir dan konveksi kuat' },
  96: { label: 'Badai Petir & Es Ringan', icon: 'Zap', color: '#ea580c', desc: 'Awan cumulonimbus aktif dengan petir' },
  99: { label: 'Badai Petir Tropis Hebat', icon: 'Zap', color: '#b91c1c', desc: 'Cuaca ekstrem petir sambar-menyambar & angin kencang' }
};

export class WeatherService {
  constructor() {
    this.cachePrefix = 'ina_weather_cache_v10_';
    this.cacheTtlMs = 30 * 60 * 1000; // 30 Menit

    // Evict any older cache keys to prevent stale hazard warnings
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('ina_weather_cache_') && !key.startsWith(this.cachePrefix)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (e) {}

    // Stasiun cuaca representatif untuk layer peta
    this.regionalStations = [
      { id: 'w_jkt', name: 'Jakarta', province: 'DKI Jakarta', lat: -6.2088, lon: 106.8456, type: 'city' },
      { id: 'w_sby', name: 'Surabaya', province: 'Jawa Timur', lat: -7.2575, lon: 112.7521, type: 'city' },
      { id: 'w_bdg', name: 'Bandung', province: 'Jawa Barat', lat: -6.9175, lon: 107.6191, type: 'city' },
      { id: 'w_smg', name: 'Semarang', province: 'Jawa Tengah', lat: -7.0051, lon: 110.4381, type: 'city' },
      { id: 'w_mdn', name: 'Medan', province: 'Sumatera Utara', lat: 3.5952, lon: 98.6722, type: 'city' },
      { id: 'w_plb', name: 'Palembang', province: 'Sumatera Selatan', lat: -2.9909, lon: 104.7565, type: 'city' },
      { id: 'w_pku', name: 'Pekanbaru', province: 'Riau', lat: 0.5071, lon: 101.4478, type: 'city' },
      { id: 'w_dps', name: 'Denpasar', province: 'Bali', lat: -8.6705, lon: 115.2126, type: 'city' },
      { id: 'w_mks', name: 'Makassar', province: 'Sulawesi Selatan', lat: -5.1477, lon: 119.4327, type: 'city' },
      { id: 'w_mnd', name: 'Manado', province: 'Sulawesi Utara', lat: 1.4748, lon: 124.8421, type: 'city' },
      { id: 'w_ptk', name: 'Pontianak', province: 'Kalimantan Barat', lat: -0.0263, lon: 109.3425, type: 'city' },
      { id: 'w_bpn', name: 'Balikpapan', province: 'Kalimantan Timur', lat: -1.2379, lon: 116.8289, type: 'city' },
      { id: 'w_amb', name: 'Ambon', province: 'Maluku', lat: -3.6954, lon: 128.1814, type: 'city' },
      { id: 'w_jyp', name: 'Jayapura', province: 'Papua', lat: -2.5916, lon: 140.6690, type: 'city' },
      { id: 'w_kpg', name: 'Kupang', province: 'NTT', lat: -10.1772, lon: 123.6070, type: 'city' },
      // Gunung Api Strategis
      { id: 'w_v_merapi', name: 'Gunung Merapi', province: 'DIY / Jawa Tengah', lat: -7.5407, lon: 110.4457, type: 'volcano' },
      { id: 'w_v_semeru', name: 'Gunung Semeru', province: 'Jawa Timur', lat: -8.1080, lon: 112.9220, type: 'volcano' },
      { id: 'w_v_marapi', name: 'Gunung Marapi', province: 'Sumatera Barat', lat: -0.3810, lon: 100.4730, type: 'volcano' },
      { id: 'w_v_lewotobi', name: 'Gunung Lewotobi Laki-laki', province: 'NTT', lat: -8.5389, lon: 122.7689, type: 'volcano' }
    ];
  }

  getWeatherInfo(code) {
    return WMO_WEATHER_CODES[code] || {
      label: 'Berawan',
      icon: 'Cloud',
      color: '#94a3b8',
      desc: 'Kondisi cuaca berawan'
    };
  }

  /**
   * Mengambil prakiraan cuaca lengkap (Current, 24h Hourly, 7d Daily)
   */
  async getForecast(lat, lon, locationName = '', forceRefresh = false) {
    const cacheKey = `${this.cachePrefix}${lat.toFixed(2)}_${lon.toFixed(2)}`;

    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < this.cacheTtlMs) {
            return parsed.data;
          }
        }
      } catch (e) {
        // Abaikan error cache
      }
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,rain,weather_code,surface_pressure,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,rain_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant&timezone=Asia%2FJakarta`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const raw = await res.json();

      const processed = this.formatForecastData(raw, locationName, lat, lon);

      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: processed
        }));
      } catch (e) {
        // Quota exceed ignore
      }

      return processed;
    } catch (err) {
      console.warn(`Gagal memuat cuaca dari Open-Meteo (${locationName}):`, err);
      return this.generateFallbackForecast(lat, lon, locationName);
    }
  }

  /**
   * Format data dari payload Open-Meteo ke struktur yang siap konsumsi UI
   */
  formatForecastData(raw, locationName, lat, lon) {
    const cur = raw.current || {};
    const curCode = cur.weather_code || 0;
    const curMeta = this.getWeatherInfo(curCode);

    // Format 24 Jam ke depan dari Hourly
    const hourlyList = [];
    const hourly = raw.hourly || {};
    const nowIso = new Date().toISOString().slice(0, 13); // format YYYY-MM-DDTHH
    let startIndex = 0;

    if (hourly.time && hourly.time.length > 0) {
      const idx = hourly.time.findIndex(t => t.startsWith(nowIso));
      startIndex = idx >= 0 ? idx : 0;

      for (let i = startIndex; i < Math.min(startIndex + 24, hourly.time.length); i++) {
        const timeStr = hourly.time[i];
        const dateObj = new Date(timeStr);
        const code = hourly.weather_code[i] || 0;
        const meta = this.getWeatherInfo(code);

        hourlyList.push({
          time: dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          rawTime: timeStr,
          temp: Math.round(hourly.temperature_2m[i]),
          feelsLike: Math.round(hourly.apparent_temperature[i]),
          humidity: Math.round(hourly.relative_humidity_2m[i]),
          pop: hourly.precipitation_probability ? hourly.precipitation_probability[i] : 20,
          precipMm: hourly.precipitation ? hourly.precipitation[i] : 0,
          windSpeed: Math.round(hourly.wind_speed_10m[i]),
          uvIndex: hourly.uv_index ? Number(hourly.uv_index[i].toFixed(1)) : 0,
          weatherCode: code,
          weatherLabel: meta.label,
          weatherColor: meta.color,
          weatherIcon: meta.icon
        });
      }
    }

    // Format 7 Hari ke depan dari Daily
    const dailyList = [];
    const daily = raw.daily || {};
    if (daily.time && daily.time.length > 0) {
      for (let i = 0; i < Math.min(7, daily.time.length); i++) {
        const dateObj = new Date(daily.time[i]);
        const dayName = i === 0 ? 'Hari Ini' : i === 1 ? 'Besok' : dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
        const dateFormatted = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        const code = daily.weather_code[i] || 0;
        const meta = this.getWeatherInfo(code);

        dailyList.push({
          day: dayName,
          date: dateFormatted,
          rawDate: daily.time[i],
          maxTemp: Math.round(daily.temperature_2m_max[i]),
          minTemp: Math.round(daily.temperature_2m_min[i]),
          pop: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 30,
          rainSum: daily.rain_sum ? Number(daily.rain_sum[i].toFixed(1)) : 0,
          uvMax: daily.uv_index_max ? Number(daily.uv_index_max[i].toFixed(1)) : 5,
          windMax: Math.round(daily.wind_speed_10m_max[i]),
          weatherCode: code,
          weatherLabel: meta.label,
          weatherColor: meta.color,
          weatherIcon: meta.icon
        });
      }
    }

    // Korelasi Bahaya Bencana dengan verifikasi lokasi vulkanik nyata
    const hazards = this.analyzeWeatherHazards(cur, dailyList, hourlyList, lat, lon, locationName);

    return {
      location: {
        name: locationName || 'Wilayah Terpilih',
        lat,
        lon,
        elevation: raw.elevation || 15
      },
      current: {
        temp: Math.round(cur.temperature_2m !== undefined ? cur.temperature_2m : 29),
        feelsLike: Math.round(cur.apparent_temperature !== undefined ? cur.apparent_temperature : 31),
        humidity: Math.round(cur.relative_humidity_2m !== undefined ? cur.relative_humidity_2m : 75),
        pressure: Math.round(cur.surface_pressure || cur.pressure_msl || 1011),
        cloudCover: Math.round(cur.cloud_cover || 40),
        windSpeed: Math.round(cur.wind_speed_10m !== undefined ? cur.wind_speed_10m : 12),
        windGusts: Math.round(cur.wind_gusts_10m || 16),
        windDirection: cur.wind_direction_10m || 180,
        precipitation: cur.precipitation || 0,
        weatherCode: curCode,
        weatherLabel: curMeta.label,
        weatherDesc: curMeta.desc,
        weatherColor: curMeta.color,
        weatherIcon: curMeta.icon,
        isDay: cur.is_day === 1
      },
      hourly: hourlyList,
      daily: dailyList,
      hazards,
      source: 'Open-Meteo High-Resolution Atmospheric Model'
    };
  }

  /**
   * Analisis Cerdas Korelasi Cuaca dengan Bencana Alam (Multi-Hazard Assessment)
   * Hanya memicu Peringatan Lahar jika BENAR-BENAR ada gunung api aktif (Level >= 2) di dekat lokasi (<= 40 km)
   */
  analyzeWeatherHazards(current, daily, hourly, lat, lon, locationName = '') {
    const hazards = [];

    // 1. Cek keberadaan gunung api aktif nyata di sekitar koordinat lokasi (radius 35 km)
    const nearbyActiveVolcanoes = (lat !== undefined && lon !== undefined)
      ? VOLCANO_DATABASE.filter(v => v.level >= 2).map(v => {
          const dist = Math.hypot(v.lat - lat, (v.lon - lon) * Math.cos((lat * Math.PI) / 180)) * 111.32;
          return { ...v, distKm: Math.round(dist) };
        }).filter(v => v.distKm <= 35).sort((a, b) => a.distKm - b.distKm)
      : [];

    const isDirectVolcano = locationName.toLowerCase().includes('gunung') || locationName.toLowerCase().includes('kawah');
    const nearestVolcano = isDirectVolcano
      ? VOLCANO_DATABASE.find(v => locationName.toLowerCase().includes(v.name.toLowerCase()) || v.name.toLowerCase().includes(locationName.toLowerCase())) || null
      : (nearbyActiveVolcanoes.length > 0 ? nearbyActiveVolcanoes[0] : null);

    const isVolcanoSlope = isDirectVolcano || (nearestVolcano !== null && nearestVolcano.level >= 2);

    // Presipitasi 24 jam ke depan
    const next24hRain = hourly.slice(0, 24).reduce((sum, h) => sum + (h.precipMm || 0), 0);
    const maxHourlyRain = Math.max(...hourly.slice(0, 24).map(h => h.precipMm || 0), 0);

    // HANYA JIKA ADA GUNUNG API AKTIF & HUJAN INTENSITAS TINGGI / LEBAT:
    // (Curah hujan ringan/gerimis TIDAK memicu bahaya lahar dingin)
    if (isVolcanoSlope && (maxHourlyRain >= 8 || next24hRain >= 20)) {
      const volcName = nearestVolcano ? nearestVolcano.name : locationName;
      const distInfo = nearestVolcano && !isDirectVolcano ? ` (~${nearestVolcano.distKm} km dari puncak)` : '';

      if (maxHourlyRain >= 16 || next24hRain >= 35) {
        hazards.push({
          id: 'lahar_danger',
          level: 'critical',
          title: `Peringatan Kritis: Ancaman Banjir Lahar Hujan (${volcName})`,
          badge: 'BAHAYA LAHAR HUJAN',
          color: '#ef4444',
          icon: 'AlertOctagon',
          desc: `Prakiraan curah hujan lebat intensitas tinggi (${next24hRain.toFixed(1)} mm akumulatif) di kawasan ${volcName}${distInfo}. Sangat berpotensi memobilisasi endapan material abu & batu piroklastik ke Daerah Aliran Sungai (DAS) di hilir.`
        });
      } else {
        hazards.push({
          id: 'lahar_watch',
          level: 'warning',
          title: `Waspada Aliran Lahar di Alur Sungai Berhulu di ${volcName}`,
          badge: 'WASPADA LAHAR',
          color: '#f59e0b',
          icon: 'AlertTriangle',
          desc: `Prakiraan curah hujan sedang (${next24hRain.toFixed(1)} mm) di kawasan lereng ${volcName}${distInfo}. Warga di sempadan alur sungai yang berhulu di puncak diimbau siaga terhadap kenaikan volume air bercampur pasir.`
        });
      }
    } else if (!isVolcanoSlope && (maxHourlyRain >= 15 || next24hRain >= 35)) {
      // JIKA BUKAN KAWASAN GUNUNG API: Hujan lebat hanya memicu risiko genangan perkotaan
      hazards.push({
        id: 'urban_flood_warning',
        level: 'warning',
        title: 'Waspada Potensi Genangan Air & Cuaca Basah',
        badge: 'POTENSI GENANGAN',
        color: '#0284c7',
        icon: 'CloudRain',
        desc: `Prakiraan curah hujan lebat mencapai ${next24hRain.toFixed(1)} mm dalam 24 jam. Waspadai potensi genangan air di kawasan dataran rendah dan jarak pandang berkurang saat berkendara.`
      });
    }

    // 2. Efek Pencucian Polusi (Rain Wash-out Effect)
    if (next24hRain >= 8) {
      hazards.push({
        id: 'washout_positive',
        level: 'info',
        title: 'Efek Pembersihan Polutan (Rain Wash-Out)',
        badge: 'PENURUNAN PM2.5',
        color: '#10b981',
        icon: 'Sparkles',
        desc: `Guyuran air hujan yang diprediksi turun akan bertindak sebagai *wet scavenging agent*, mengendapkan partikulat debu vulkanik dan partikel polusi udara PM2.5 ke permukaan tanah, sehingga kualitas udara akan membaik secara signifikan.`
      });
    } else if (current.relative_humidity_2m > 85 && (current.wind_speed_10m || 10) < 6) {
      hazards.push({
        id: 'smog_inversion',
        level: 'warning',
        title: 'Potensi Inversi Suhu & Penumpukan Asap/Kabut',
        badge: 'KABUT FUMEROLE / SMOG',
        color: '#eab308',
        icon: 'CloudFog',
        desc: 'Kelembaban udara sangat tinggi disertai angin lemah berpotensi menahan partikulat polusi dan gas belerang SO2 tetap terkonsentrasi di lapisan bawah atmosfer dekat permukaan.'
      });
    }

    // 3. Potensi Eskalasi Kebakaran Hutan / Lahan (Fire Weather Risk)
    const temp = current.temperature_2m || 29;
    const humidity = current.relative_humidity_2m || 75;
    const wind = current.wind_speed_10m || 12;

    if (temp >= 33 && humidity <= 50 && wind >= 16) {
      hazards.push({
        id: 'fire_weather_high',
        level: 'critical',
        title: 'Indeks Cuaca Karhutla Kritis (Fire Weather Index Tinggi)',
        badge: 'ESKALASI HOTSPOT',
        color: '#f97316',
        icon: 'Flame',
        desc: `Kombinasi suhu terik (${temp}°C), kelembaban rendah (${humidity}%), dan angin kencang (${wind} km/j) mempercepat pengeringan bahan bakar gambut/vegetasi serta mempermudah percikan titik panas hotspot meluas.`
      });
    }

    if (hazards.length === 0) {
      hazards.push({
        id: 'safe_weather',
        level: 'info',
        title: 'Status Hidrometeorologi Aman & Terkendali',
        badge: 'STATUS KONDUSIF',
        color: '#10b981',
        icon: 'ShieldCheck',
        desc: `Tidak terdeteksi ancaman cuaca ekstrem, banjir bandang, maupun aliran lahar vulkanik di kawasan ${locationName || 'ini'}. Parameter hidrologi terpantau dalam kondisi aman dan stabil.`
      });
    }

    return hazards;
  }

  /**
   * Mengambil batch cuaca untuk stasiun regional yang ditampilkan di peta
   */
  async getRegionalWeatherStations(forceRefresh = false) {
    const promises = this.regionalStations.map(async st => {
      try {
        const forecast = await this.getForecast(st.lat, st.lon, st.name, forceRefresh);
        return {
          ...st,
          current: forecast.current,
          hazards: forecast.hazards,
          forecastSummary: forecast
        };
      } catch (err) {
        return {
          ...st,
          current: {
            temp: 29,
            feelsLike: 31,
            humidity: 78,
            windSpeed: 10,
            weatherCode: 2,
            weatherLabel: 'Berawan',
            weatherColor: '#38bdf8',
            weatherIcon: 'CloudSun'
          },
          hazards: []
        };
      }
    });

    return await Promise.all(promises);
  }

  /**
   * Fallback cerdas jika API offline
   */
  generateFallbackForecast(lat, lon, locationName) {
    const now = new Date();
    const isVolcano = locationName.toLowerCase().includes('gunung') || locationName.toLowerCase().includes('merapi');
    const baseTemp = isVolcano ? 21 : 30;

    const hourlyList = [];
    for (let i = 0; i < 24; i++) {
      const hDate = new Date(now.getTime() + i * 3600000);
      const hour = hDate.getHours();
      const isDay = hour >= 6 && hour <= 18;
      const code = isVolcano ? (hour >= 13 && hour <= 17 ? 63 : 2) : (hour >= 14 && hour <= 16 ? 61 : 1);
      const meta = this.getWeatherInfo(code);

      hourlyList.push({
        time: hDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        rawTime: hDate.toISOString(),
        temp: Math.round(baseTemp + Math.sin((hour - 8) / 4) * 4),
        feelsLike: Math.round(baseTemp + Math.sin((hour - 8) / 4) * 4 + 2),
        humidity: Math.round(75 + Math.cos(hour / 3) * 15),
        pop: isVolcano ? 70 : 35,
        precipMm: code === 63 ? 14.5 : code === 61 ? 3.2 : 0,
        windSpeed: Math.round(10 + Math.random() * 8),
        uvIndex: isDay ? (hour >= 11 && hour <= 14 ? 8.5 : 4.0) : 0,
        weatherCode: code,
        weatherLabel: meta.label,
        weatherColor: meta.color,
        weatherIcon: meta.icon
      });
    }

    const dailyList = [];
    for (let i = 0; i < 7; i++) {
      const dDate = new Date(now.getTime() + i * 86400000);
      const code = i % 2 === 0 ? 61 : 2;
      const meta = this.getWeatherInfo(code);

      dailyList.push({
        day: i === 0 ? 'Hari Ini' : i === 1 ? 'Besok' : dDate.toLocaleDateString('id-ID', { weekday: 'short' }),
        date: dDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        rawDate: dDate.toISOString(),
        maxTemp: baseTemp + 3,
        minTemp: baseTemp - 5,
        pop: isVolcano ? 65 : 40,
        rainSum: code === 61 ? 8.4 : 1.2,
        uvMax: 8.5,
        windMax: 18,
        weatherCode: code,
        weatherLabel: meta.label,
        weatherColor: meta.color,
        weatherIcon: meta.icon
      });
    }

    const mockCurrent = {
      temperature_2m: baseTemp,
      apparent_temperature: baseTemp + 2,
      relative_humidity_2m: 78,
      surface_pressure: 1010,
      cloud_cover: 55,
      wind_speed_10m: 14,
      wind_gusts_10m: 20,
      wind_direction_10m: 210,
      precipitation: isVolcano ? 4.5 : 0,
      weather_code: isVolcano ? 63 : 2,
      is_day: 1
    };

    const hazards = this.analyzeWeatherHazards(mockCurrent, dailyList, hourlyList, lat, lon, locationName);

    return {
      location: {
        name: locationName || 'Wilayah Terpilih',
        lat,
        lon,
        elevation: isVolcano ? 1800 : 25
      },
      current: {
        temp: baseTemp,
        feelsLike: baseTemp + 2,
        humidity: 78,
        pressure: 1010,
        cloudCover: 55,
        windSpeed: 14,
        windGusts: 20,
        windDirection: 210,
        precipitation: isVolcano ? 4.5 : 0,
        weatherCode: isVolcano ? 63 : 2,
        weatherLabel: this.getWeatherInfo(isVolcano ? 63 : 2).label,
        weatherDesc: this.getWeatherInfo(isVolcano ? 63 : 2).desc,
        weatherColor: this.getWeatherInfo(isVolcano ? 63 : 2).color,
        weatherIcon: this.getWeatherInfo(isVolcano ? 63 : 2).icon,
        isDay: true
      },
      hourly: hourlyList,
      daily: dailyList,
      hazards,
      source: 'Open-Meteo High-Resolution Atmospheric Model (Simulasi)'
    };
  }
}
