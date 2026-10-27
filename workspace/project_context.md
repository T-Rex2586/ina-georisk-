# Konteks Project: INA-RISK MONITOR
**Sistem Pemantauan Gunung Api, Kualitas Udara, dan Titik Panas Indonesia**

**Tanggal:** 2026-10-18
**Versi:** 1.0.0
**Stack:** React 18 + Vite + Leaflet

---

## 1. Struktur Folder

```
C:\iseng\
├── package.json              # Dependencies & scripts
├── vite.config.js            # Build config
├── index.html                # Entry point
├── src/
│   ├── main.jsx              # React entry
│   ├── App.jsx               # Root component, state orchestration
│   ├── index.css             # Global styles
│   │
│   ├── components/           # UI Layer (20 files)
│   │   ├── HeaderNav.jsx
│   │   ├── MapContainer.jsx
│   │   ├── TopRightControls.jsx
│   │   ├── BottomHud.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Navbar.jsx
│   │   ├── LayerSensorDrawer.jsx
│   │   ├── InspectorDrawer.jsx
│   │   ├── AlertTicker.jsx
│   │   ├── AlertModal.jsx
│   │   ├── WeatherModal.jsx
│   │   ├── RegionExplorerModal.jsx
│   │   ├── AnalyticsModal.jsx
│   │   ├── ExportModal.jsx
│   │   ├── SettingsModal.jsx
│   │   ├── CitySearchBar.jsx
│   │   ├── MapLegend.jsx
│   │   ├── WindParticleCanvas.js      # Animasi partikel angin
│   │   └── ThermalCanvasOverlay.js    # Overlay thermal hotspot
│   │
│   ├── services/             # Business Logic Layer (7 files)
│   │   ├── weatherService.js          # Prakiraan cuaca (Open-Meteo)
│   │   ├── airQualityService.js       # Kualitas udara (Open-Meteo)
│   │   ├── windService.js             # Data angin regional
│   │   ├── hotspotService.js          # Titik panas (NASA FIRMS)
│   │   ├── alertService.js            # Evaluasi & prioritas alert
│   │   ├── regionService.js           # Data wilayah administratif
│   │   └── exportService.js           # Export CSV/JSON
│   │
│   ├── data/                 # Static Data Layer (4 files)
│   │   ├── volcanoes.js               # Database 16 gunung api aktif
│   │   ├── cities.js                  # Re-export region modules
│   │   ├── indonesiaRegions.js        # Parser for region JSON
│   │   └── indonesiaRegions.json      # 53023 lines, 1.1 MB
│   │       # 34 Provinsi, 514 Kabupaten, 7093 Kecamatan, 82043 Desa
│   │
│   └── config/
│       └── constants.js               # App config, AQI categories, locations
│
└── workspace/                # Planning & documentation
    ├── project_context.md             # This file
    └── bmkg_integration_plan.md       # BMKG integration roadmap
```

---

## 2. Sumber Data API Live

### 2.1 Open-Meteo Weather API
**Endpoint:** `https://api.open-meteo.com/v1/forecast`

**Digunakan di:**
- `weatherService.js` - Prakiraan cuaca lengkap (current, hourly 24h, daily 7 hari)
- `windService.js` - Data angin untuk 20 stasiun regional

**Parameter:**
- `temperature_2m`, `relative_humidity_2m`, `apparent_temperature`
- `precipitation`, `rain`, `weather_code`
- `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m`
- `cloud_cover`, `pressure_msl`, `surface_pressure`
- `uv_index`, `visibility`

**Cache:**
- Key: `ina_weather_cache_v10_{lat}_{lon}`
- TTL: 30 menit
- Storage: localStorage

**Rate Limit:** Tidak ada (gratis, open-source)

---

### 2.2 Open-Meteo Air Quality API
**Endpoint:** `https://air-quality-api.open-meteo.com/v1/air-quality`

**Digunakan di:**
- `airQualityService.js` - Kualitas udara 19 kota Indonesia

**Parameter:**
- `pm2_5`, `pm10`, `carbon_monoxide`, `nitrogen_dioxide`
- `sulphur_dioxide`, `ozone`, `us_aqi`

**Cache:**
- Key: `ina_air_quality_cache_v2`
- TTL: 30 menit
- Storage: localStorage

**Konversi:** US AQI → ISPU Indonesia (metode `convertToISPU`)

---

### 2.3 Open-Meteo Geocoding API
**Endpoint:** `https://geocoding-api.open-meteo.com/v1/search`

**Digunakan di:**
- `CitySearchBar.jsx` - Autocomplete pencarian kota

**Parameter:**
- `name` (query string)
- `count=4`, `language=id`, `format=json`

---

### 2.4 NASA FIRMS (Fire Information for Resource Management System)
**Endpoint:** `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{mapKey}/{source}/{bbox}/{days}`

**Digunakan di:**
- `hotspotService.js` - Deteksi titik panas (hotspot) kebakaran hutan/lahan

**Parameter:**
- `mapKey`: API key (disimpan di localStorage `nasa_firms_map_key`)
- `source`: `VIIRS_SNPP_NRT` (utama), `MODIS` (fallback)
- `bbox`: `95.0,-11.0,141.0,6.0` (Indonesia bounding box)
- `days`: 2 (default), 1 (24h), 7 (7d)

**Response Fields:**
- `latitude`, `longitude`, `frp` (Fire Radiative Power in MW)
- `brightness`, `confidence`, `acq_date`, `acq_time`
- `satellite`, `daynight`

**Proxy:** 
- Primary: `/api/firms/...` (Vite proxy)
- Fallback: Direct URL

**Fallback Data:**
- Jika API gagal, gunakan `generateIndonesiaHotspotDataset()`
- 575 titik panas sintetis berbasis cluster geografis real
- Distribusi: Sumatera Selatan (85), Kalimantan Tengah (95), dll.

---

## 3. Data Statis Lokal

### 3.1 Database Gunung Api (volcanoes.js)
**Sumber:** PVMBG / MAGMA Indonesia

**Jumlah:** 16 gunung api aktif

**Struktur:**
```javascript
{
  id: 'merapi',
  name: 'Gunung Merapi',
  province: 'DI Yogyakarta / Jawa Tengah',
  island: 'Jawa',
  lat: -7.5407,
  lon: 110.4457,
  elevation: 2968,
  level: 3,  // 1=Normal, 2=Waspada, 3=Siaga, 4=Awas
  statusText: 'Level III (Siaga)',
  lastEruption: '2026-09-08 06:15 WIB',
  ashColumnMeters: 1800,
  dangerRadiusKm: 5.0,
  currentAshDirection: 'Barat Daya',
  currentAshDirectionDeg: 240,
  activitySummary: '...',
  recommendation: '...'
}
```

**Fungsi Utilitas:**
- `calculateAshPlumePolygon()` - Kalkulasi poligon sebaran abu vulkanik

---

### 3.2 Database Wilayah Administratif (indonesiaRegions.json)
**Sumber:** Kemendagri / BPS (Data 2012)

**Ukuran:** 1.1 MB, 53023 lines

**Struktur:**
```json
{
  "metadata": {
    "year": 2012,
    "totalProvinces": 34,
    "totalRegencies": 514,
    "totalDistricts": 7093,
    "totalVillages": 82043
  },
  "provinces": [...],
  "regencies": [
    {
      "code": "1101",
      "name": "Kabupaten Simeulue",
      "province": "Aceh",
      "provinceCode": "11",
      "island": "Sumatera",
      "lat": 2.6167,
      "lon": 96.0833,
      "kecamatanCount": 10,
      "desaCount": 133,
      "kecamatanDetail": [
        { "code": "1101010", "name": "Teupah Selatan", "desaCount": 19 }
      ]
    }
  ]
}
```

**Service:** `regionService.js`
- Pencarian multi-level (kabupaten, kecamatan, provinsi)
- Index O(1) dengan Map
- Statistik per pulau

---

### 3.3 Stasiun Pemantau (constants.js)
**Jumlah:** 19 kota (LOCATIONS array)

**Contoh:**
```javascript
{ id: 'jkt', name: 'DKI Jakarta', province: 'DKI Jakarta', 
  lat: -6.2088, lon: 106.8456, isCapital: true }
```

---

## 4. Mekanisme Cache

### 4.1 Strategi Cache-First dengan Fallback
```
1. Cek localStorage cache
2. Jika valid (belum expire) → return cache
3. Jika expired atau force refresh → fetch API
4. Jika fetch gagal → gunakan fallback data
5. Simpan hasil ke cache
```

### 4.2 Cache Keys & TTL

| Service | Cache Key | TTL | Fallback |
|---------|-----------|-----|----------|
| Weather | `ina_weather_cache_v10_{lat}_{lon}` | 30 menit | `generateFallbackForecast()` |
| Air Quality | `ina_air_quality_cache_v2` | 30 menit | `generateFallbackData()` |
| Wind | `ina_wind_cache_v2` | 45 menit | `generateFallbackWind()` |
| Hotspot | Tidak ada (real-time) | - | `generateIndonesiaHotspotDataset()` |

### 4.3 Eviction Policy
- Manual: Hapus cache dengan versi lama saat service di-update
- Contoh: `ina_weather_cache_v9_` dihapus saat migrasi ke `v10`

```javascript
// Auto-evict old cache versions (weatherService.js)
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('ina_weather_cache_') && !key.startsWith(this.cachePrefix)) {
    localStorage.removeItem(key);
  }
});
```

---

## 5. Alur Data Utama

### 5.1 Initial Load (App.jsx)
```javascript
useEffect(() => {
  const [aq, hot, wind, weather] = await Promise.all([
    airQualityService.fetchAllStations(),
    hotspotService.loadHotspots(),
    windService.fetchAllWindStations(),
    weatherService.getRegionalWeatherStations()
  ]);
  
  const alerts = AlertService.evaluateAlerts({
    volcanoes: VOLCANO_DATABASE,
    airQualityStations: aq,
    hotspots: hot
  });
}, []);
```

### 5.2 Alert Evaluation (alertService.js)
**Kriteria:**

1. **Gunung Api (Critical/Warning)**
   - Level 4 (Awas) → Critical
   - Level 3 (Siaga) → Warning

2. **Kualitas Udara (Critical/Warning)**
   - AQI >= 200 → Critical (Sangat Tidak Sehat)
   - AQI >= 150 → Warning (Tidak Sehat)

3. **Titik Panas (Critical/Warning)**
   - FRP >= 50 MW + count >= 3 → Critical
   - FRP >= 50 MW → Warning

**Prioritas:** Critical → Warning

---

## 6. Layer Peta

### 6.1 Layer Toggles (App.jsx state)
```javascript
layers: {
  hotspots: true,      // Titik panas (NASA FIRMS)
  volcanoes: true,     // Marker gunung api
  ashPlumes: true,     // Poligon sebaran abu
  windVectors: true,   // Animasi partikel angin
  airQuality: true,    // Marker AQI kota
  so2: true,           // Overlay SO2 (tidak aktif)
  clouds: true,        // Overlay awan (tidak aktif)
  weather: true        // Marker cuaca regional
}
```

### 6.2 Base Map Options
- `satellite` - Esri World Imagery
- `terrain` - OpenTopoMap
- `street` - OpenStreetMap

---

## 7. Fitur Export

### 7.1 Format yang Didukung
- CSV (comma-separated, quoted)
- JSON (pretty-printed)

### 7.2 Export Targets (exportService.js)
- `exportVolcanoes()` - Data gunung api
- `exportAirQuality()` - Data kualitas udara
- `exportHotspots()` - Data titik panas
- `exportUnifiedReport()` - Laporan komprehensif (JSON only)

---

## 8. Dependencies (package.json)

```json
{
  "dependencies": {
    "chart.js": "^4.4.4",           // Grafik di AnalyticsModal
    "hls.js": "^1.7.2",             // Video streaming (tidak aktif)
    "leaflet": "^1.9.4",            // Peta interaktif
    "leaflet.heat": "^0.2.0",       // Heatmap hotspot
    "lucide-react": "^0.453.0",     // Icon library
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.3",
    "vite": "^5.4.9"
  }
}
```

---

## 9. Sumber Data Belum Terpasang

### 9.1 BMKG Prakiraan Cuaca (Terencana)
**Status:** Perencanaan (lihat `bmkg_integration_plan.md`)

**Endpoint:** `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode_wilayah}`

**Kebutuhan:**
- Mapping kode adm4 (desa/kelurahan) untuk 20 stasiun regional
- Service baru: `bmkgService.js`
- Transform data BMKG → format internal

**Keuntungan:**
- Data lokal Indonesia lebih akurat
- Deskripsi cuaca dalam Bahasa Indonesia
- Update setiap 3 jam

**Kendala:**
- `indonesiaRegions.json` hanya memiliki kode kecamatan (adm3), bukan desa (adm4)
- Perlu mapping manual atau penambahan data desa

---

### 9.2 Peta Gambut Indonesia
**Status:** Belum ada rencana implementasi

**Sumber Potensial:**
- Kementerian Lingkungan Hidup dan Kehutanan (KLHK)
- CIFOR (Center for International Forestry Research)
- Global Peatlands Database

**Format yang Dibutuhkan:**
- GeoJSON polygon layer
- Attribut: tipe gambut, kedalaman, status lahan

**Use Case:**
- Overlay dengan layer hotspot
- Identifikasi risiko kebakaran gambut
- Analisis korelasi hotspot-gambut

**Kendala:**
- Belum ditemukan API publik gratis
- Data KLHK memerlukan proses permohonan resmi
- File GeoJSON besar (> 50 MB) perlu optimasi

---

### 9.3 Data SO2 dan Cloud Overlay
**Status:** Ada di toggle layer, tapi tidak aktif

**Sumber Potensial:**
- NASA GIOVANNI (SO2 satellite data)
- Open-Meteo tidak menyediakan SO2 surface data

---

## 10. Environment & Configuration

### 10.1 Environment Variables
Tidak menggunakan `.env`. Semua konfigurasi hardcoded di `constants.js`.

### 10.2 API Keys
- **NASA FIRMS Map Key:** Disimpan di localStorage `nasa_firms_map_key`
- **Default Key:** `b116c8e8a24077ed97e3cdba2266f3e8` (constants.js)

### 10.3 Build Commands
```bash
npm run dev      # Development server (localhost:5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

---

## 11. Known Issues & Technical Debt

### 11.1 CORS
- NASA FIRMS mendukung CORS, tapi proxy tetap disiapkan untuk edge cases

### 11.2 Rate Limiting
- Open-Meteo: Tidak ada rate limit, tapi disarankan cache agresif
- NASA FIRMS: Tidak terdokumentasi, asumsi reasonable use

### 11.3 Data Freshness
- Gunung api: Manual update di `volcanoes.js`
- Wilayah administratif: Data 2012, tidak ter-update

### 11.4 Missing Features
- Notifikasi push untuk alert kritis
- Histori data (time-series analysis)
- PWA support (offline capability)

---

## 12. Session Context for Future Work

### 12.1 Last Working Session (2026-10-18)
- Membuat rencana integrasi BMKG (`bmkg_integration_plan.md`)
- Menulis dokumentasi konteks project (`project_context.md`)

### 12.2 Next Steps
1. Implementasi BMKG integration (est. 2-3 hari)
2. Eksplorasi sumber data peta gambut
3. Optimasi bundle size (indonesiaRegions.json 1.1 MB)

### 12.3 Key Files to Remember
- `src/App.jsx:80-100` - Initial data loading
- `src/services/weatherService.js:101` - Open-Meteo URL builder
- `src/services/hotspotService.js:50-66` - FIRMS fetch logic
- `src/data/volcanoes.js` - Manual update untuk status gunung api
- `src/config/constants.js` - Semua konfigurasi terpusat

---

**Dokumen ini dibuat untuk konteks sesi berikutnya. Update jika ada perubahan signifikan.**
