# Rencana Overlay Hotspot FIRMS dengan Peta Lahan Gambut Indonesia

**Tanggal:** 2026-10-18
**Status:** Perencanaan (Tidak mengubah kode sumber)

---

## 1. Latar Belakang

Hotspot (titik panas) dari NASA FIRMS menunjukkan lokasi kebakaran aktif. Overlay dengan peta lahan gambut memungkinkan:

1. Identifikasi hotspot yang berada di area gambut (risiko kebakaran gambut)
2. Estimasi potensi emisi karbon (gambut terbakar menghasilkan emisi CO2 tinggi)
3. Prioritas penanganan darurat (gambut dalam/tebal lebih sulit dipadamkan)
4. Informasi tambahan di popup peta untuk pengguna

---

## 2. Kandidat Sumber Data Gambut

### 2.1 Peta Lahan Gambut BIG (Indonesian Geospatial Portal)

**URL:** `https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/SUMBER_DAYA_ALAM_DAN_LINGKUNGAN/MapServer/6`

**Sumber:** Badan Informasi Geospasial (BIG) - Satu Peta Indonesia

**Format:**
- ArcGIS REST Feature Service
- Support query: JSON, GeoJSON
- Geometry: Polygon

**Extent (Kalimantan):**
```
XMin: 108.860173261
YMin: -3.4605813200000197
XMax: 118.57645895300001
YMax: 4.07009380800002
Spatial Reference: EPSG:4326
```

**Atribut Tersedia:**
- `landform` - Tipe gambut + ketebalan (contoh: "Gambut Topogen Air Payau (50 cm - < 100 cm)")
- `wadmpu` - Wilayah pengelolaan (Display Field)

**Klasifikasi Ketebalan:**
| Rentang Ketebalan | Contoh Label |
|-------------------|--------------|
| 50 cm - < 100 cm | Dangkal |
| 100 cm - < 200 cm | Sedang |
| 200 cm - < 300 cm | Agak Dalam |
| 300 cm - < 500 cm | Dalam |
| 500 cm - < 700 cm | Sangat Dalam |

**Tipe Gambut:**
- Gambut Topogen Air Payau
- Gambut Topogen Air Tawar

**Lisensi:** Perlu dicek (kemungkinan terbuka untuk penggunaan non-komersial)

**Cara Akses:**
```javascript
// Query GeoJSON dari ArcGIS REST API
const url = 'https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/SUMBER_DAYA_ALAM_DAN_LINGKUNGAN/MapServer/6/query';
const params = new URLSearchParams({
  where: '1=1',
  geometry: `${lonMin},${latMin},${lonMax},${latMax}`,
  geometryType: 'esriGeometryEnvelope',
  inSR: 4326,
  spatialRel: 'esriSpatialRelIntersects',
  outFields: 'landform,wadmpu',
  outSR: 4326,
  f: 'geojson'
});

const response = await fetch(`${url}?${params}`);
const geojson = await response.json();
```

**Kendala:**
- Hanya mencakup Kalimantan (perlu dicek ketersediaan layer untuk Sumatera, Papua)
- MaxRecordCount: 1000 (perlu pagination untuk area luas)

---

### 2.2 Peta Lahan Gambut Kementerian Pertanian (ArcGIS REST)

**URL:** `https://sig02.pertanian.go.id/server/rest/services/KSP/IGT_Lahan_Gambut/MapServer`

**Sumber:** Balai Besar Sumberdaya Lahan Pertanian (BBSDLP), Kementerian Pertanian

**Skala:** 1:50.000

**Layer Tersedia:**
- PETA_LAHAN_GAMBUT_PULAU_KALIMANTAN_SKALA_50K (ID: 0)
- Perlu dicek: layer untuk Sumatera, Papua, Sulawesi

**Format:**
- ArcGIS REST Feature Service
- Support query: JSON, AMF, GeoJSON

**Lisensi:** Perlu dicek

**Status Endpoint:** Error 500 saat diakses (perlu dicek ketersediaan aktual)

---

### 2.3 Trase Indonesia Peatland Area

**URL:** `https://trase.earth/open-data/datasets/spatial-metrics-indonesia-peat-area`

**Sumber:** Indonesia's official peat map (Ministry of Agriculture, 2019)

**Data Tersedia:**
- Indonesia - Peatland area (country)
- Indonesia - Peatland area (province)
- Indonesia - Peatland area (kabupaten)

**Years Available:** 2015-2024

**Format:** Perlu dicek (kemungkinan CSV/tabular, bukan GeoJSON)

**Lisensi:** Creative Commons CC BY 4.0

**Cara Akses:** Download manual dari website Trase

**Kendala:**
- Kemungkinan data tabular (luas area per provinsi/kabupaten), bukan polygon
- Tidak cocok untuk overlay spasial langsung

---

### 2.4 Global Peatland Database (GPD)

**URL:** 
- https://www.greifswaldmoor.de/global-peatland-database-en.html
- https://gee-community-catalog.org/projects/peatland/

**Sumber:** Global Peatlands Initiative, Greifswald Mire Centre

**Format:** GeoTIFF (raster 1 km x 1 km grid)

**Cakupan:** Global (268 negara), termasuk Indonesia

**Spatial Resolution:** 1 km x 1 km

**Klasifikasi:**
- 1 = Peat dominated
- 2 = Peat in soil mosaic

**Lisensi:** Creative Commons NonCommercial-ShareAlike 4.0 International

**Catatan dari Sumber:**
> "We are aware that this map overestimates peatland distribution in Indonesia and Malaysia, which we aim to adjust in our next update."

**Keuntungan:**
- Gratis, mudah diunduh
- Coverage global

**Kekurangan:**
- Resolusi rendah (1 km)
- Overestimate untuk Indonesia
- Tidak ada informasi ketebalan gambut

---

### 2.5 Harmonized Peatland Dataset for Indonesia (IIASA)

**URL:** https://pure.iiasa.ac.at/id/eprint/18393/

**Sumber:** International Institute for Applied Systems Analysis (IIASA)

**Format:** MS Excel (IND_PeatDataset_v01.xls)

**Struktur Data:**
- SimU_PeatType_Map - Pemetaan tipe gambut per SimU (simulation unit)
- PeatType_Def - Definisi tipe gambut
- PeatType_EstProf - Profil estimasi

**Linkage:** Perlu dikaitkan dengan polygon SimU dari dataset terpisah (IND_SimU_v01)

**Kendala:**
- Format Excel, bukan GeoJSON langsung
- Memerlukan preprocessing untuk overlay spasial
- Data perlu dicek untuk kelengkapan Indonesia

---

## 3. Rekomendasi Sumber Data

### Prioritas Utama: BIG Satu Peta (ArcGIS REST)

**Alasan:**
1. Data resmi pemerintah Indonesia
2. Format polygon siap pakai (GeoJSON)
3. Atribut ketebalan dan tipe gambut lengkap
4. Skala 1:50.000 (detail)

**Tindakan Perlu Dicek:**
1. Ketersediaan layer untuk Sumatera dan Papua
2. Status lisensi penggunaan
3. Rate limit dan kuota query
4. Pagination untuk area > 1000 features

### Fallback: Global Peatland Database (Raster)

**Alasan:**
1. Gratis, mudah diakses
2. Coverage seluruh Indonesia
3. Resolusi 1 km masih cukup untuk overview

**Kekurangan:**
1. Tidak ada data ketebalan
2. Overestimate untuk Indonesia
3. Perlu konversi raster → vector untuk overlay

---

## 4. Langkah Spatial Join Hotspot-Gambut

### 4.1 Arsitektur Teknis

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Browser)                     │
│                                                          │
│  1. User klik hotspot di peta                           │
│  2. Ambil koordinat hotspot (lat, lon)                  │
│  3. Query ke service gambut                             │
│  4. Tampilkan hasil di popup                            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Peat Service (New File)                     │
│  src/services/peatService.js                            │
│                                                          │
│  - loadPeatData(bbox) - Load polygon gambut             │
│  - queryPeatAtPoint(lat, lon) - Point-in-polygon        │
│  - cachePeatData() - Cache ke localStorage              │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│           External Data Sources                          │
│                                                          │
│  BIG ArcGIS REST API (Primary)                          │
│  Global Peatland Database (Fallback)                    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Strategi Implementasi

#### Opsi A: Client-Side Point-in-Polygon

```javascript
// src/services/peatService.js

export class PeatService {
  constructor() {
    this.peatPolygons = [];
    this.cacheKey = 'ina_peat_cache_v1';
    this.cacheExpiryMs = 7 * 24 * 60 * 60 * 1000; // 7 hari
  }

  async loadPeatDataForBbox(bbox) {
    // Cek cache dulu
    const cached = this.loadFromCache();
    if (cached) {
      this.peatPolygons = cached;
      return cached;
    }

    // Query dari BIG ArcGIS REST
    const url = 'https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/SUMBER_DAYA_ALAM_DAN_LINGKUNGAN/MapServer/6/query';
    
    const params = new URLSearchParams({
      where: '1=1',
      geometry: `${bbox.lonMin},${bbox.latMin},${bbox.lonMax},${bbox.latMax}`,
      geometryType: 'esriGeometryEnvelope',
      inSR: 4326,
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'landform,wadmpu,objectid',
      outSR: 4326,
      f: 'geojson'
    });

    const response = await fetch(`${url}?${params}`);
    const geojson = await response.json();
    
    this.peatPolygons = geojson.features || [];
    this.saveToCache(this.peatPolygons);
    
    return this.peatPolygons;
  }

  queryPeatAtPoint(lat, lon) {
    // Point-in-polygon check
    for (const feature of this.peatPolygons) {
      if (this.pointInPolygon(lat, lon, feature.geometry)) {
        return {
          isPeatland: true,
          landform: feature.properties.landform,
          peatType: this.extractPeatType(feature.properties.landform),
          depth: this.extractDepth(feature.properties.landform),
          depthCategory: this.categorizeDepth(feature.properties.landform)
        };
      }
    }
    
    return { isPeatland: false };
  }

  extractPeatType(landform) {
    if (!landform) return null;
    if (landform.includes('Air Payau')) return 'Air Payau';
    if (landform.includes('Air Tawar')) return 'Air Tawar';
    return 'Tidak Diketahui';
  }

  extractDepth(landform) {
    if (!landform) return null;
    const match = landform.match(/(\d+)\s*cm\s*-\s*<\s*(\d+)\s*cm/);
    if (match) {
      return { min: parseInt(match[1]), max: parseInt(match[2]), unit: 'cm' };
    }
    return null;
  }

  categorizeDepth(landform) {
    if (!landform) return null;
    if (landform.includes('50 cm - < 100 cm')) return 'Dangkal';
    if (landform.includes('100 cm - < 200 cm')) return 'Sedang';
    if (landform.includes('200 cm - < 300 cm')) return 'Agak Dalam';
    if (landform.includes('300 cm - < 500 cm')) return 'Dalam';
    if (landform.includes('500 cm - < 700 cm')) return 'Sangat Dalam';
    return null;
  }

  pointInPolygon(lat, lon, geometry) {
    if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') {
      return false;
    }

    // Turf.js atau implementasi manual ray casting
    // Untuk MultiPolygon, cek setiap polygon
    const polygons = geometry.type === 'MultiPolygon' 
      ? geometry.coordinates 
      : [geometry.coordinates];

    for (const polygon of polygons) {
      if (this.rayCast(lat, lon, polygon[0])) {
        return true;
      }
    }
    return false;
  }

  rayCast(lat, lon, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][1], yi = ring[i][0];
      const xj = ring[j][1], yj = ring[j][0];

      if (((yi > lat) !== (yj > lat)) &&
          (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  saveToCache(data) {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
    } catch (e) {
      console.warn('Gagal simpan cache gambut:', e);
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
```

#### Opsi B: Server-Side Spatial Query

**Keuntungan:**
- Tidak perlu load semua polygon ke client
- Query langsung di server (point-in-polygon di database)

**Kekurangan:**
- Memerlukan backend server
- Dependensi tambahan

**Implementasi:** Tidak direkomendasikan untuk project ini (frontend-only)

---

## 5. Atribut yang Dipakai

### 5.1 Dari Data Gambut (BIG)

| Field | Tipe | Contoh | Deskripsi |
|-------|------|--------|-----------|
| `landform` | String | "Gambut Topogen Air Payau (50 cm - < 100 cm)" | Tipe dan kedalaman gabut |
| `wadmpu` | String | - | Wilayah pengelolaan (perlu dicek) |

### 5.2 Atribut Turunan (Dikalkulasi)

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `isPeatland` | Boolean | Apakah titik berada di area gambut |
| `peatType` | String | "Air Payau" atau "Air Tawar" |
| `depth.min` | Number | Kedalaman minimum (cm) |
| `depth.max` | Number | Kedalaman maksimum (cm) |
| `depthCategory` | String | "Dangkal", "Sedang", "Agak Dalam", "Dalam", "Sangat Dalam" |
| `carbonRisk` | String | "Rendah", "Sedang", "Tinggi", "Sangat Tinggi" (berdasarkan kedalaman) |

### 5.3 Risk Assessment

**Karbon Risk berdasarkan Kedalaman:**

| Kedalaman | Risk | Alasan |
|-----------|------|--------|
| 50-100 cm (Dangkal) | Rendah | Sedikit cadangan karbon |
| 100-200 cm (Sedang) | Sedang | Cadangan karbon moderat |
| 200-300 cm (Agak Dalam) | Tinggi | Cadangan karbon tinggi |
| 300-500 cm (Dalam) | Tinggi | Cadangan karbon sangat tinggi |
| 500-700 cm (Sangat Dalam) | Sangat Tinggi | Cadangan karbon ekstrem |

**Fire Persistence Risk:**
- Gambut dalam > 300 cm: Api bisa menyala berbulan-bulan di bawah permukaan
- Gambut dangkal < 100 cm: Lebih mudah dipadamkan

---

## 6. Dampak ke Popup Peta

### 6.1 Struktur Popup Saat Ini

**Lokasi:** `MapContainer.jsx` atau `InspectorDrawer.jsx`

**Data yang ditampilkan:**
- Koordinat (lat, lon)
- FRP (Fire Radiative Power)
- Brightness
- Confidence
- Tanggal/waktu akuisisi
- Satelit/sensor

### 6.2 Data Tambahan dari Overlay Gambut

```
┌─────────────────────────────────────────────────────────┐
│  HOTSPOT DETAIL                                          │
├─────────────────────────────────────────────────────────┤
│  Koordinat: -2.4567, 113.8901                           │
│  FRP: 45.2 MW                                            │
│  Brightness: 325 K                                       │
│  Confidence: nominal                                     │
│  Akuisisi: 2026-10-18 14:30 WIB                         │
│  Satelit: Suomi-NPP (VIIRS)                              │
├─────────────────────────────────────────────────────────┤
│  🟢 STATUS LAHAN GAMBUT                                  │
│  Tipe: Gambut Topogen Air Payau                         │
│  Kedalaman: 300-500 cm (Dalam)                          │
│  Risiko Karbon: TINGGI                                   │
│  Risiko Kebakaran Persisten: TINGGI                     │
│                                                          │
│  ⚠️ PERINGATAN:                                         │
│  Kebakaran gambut dalam sulit dipadamkan.               │
│  Berpotensi emisi CO2 tinggi dan asap pekat.            │
│  Diperlukan pembasahan menyeluruh hingga kedalaman      │
│  3-5 meter.                                              │
└─────────────────────────────────────────────────────────┘
```

### 6.3 Kode Integrasi (Konsep)

```javascript
// Di MapContainer.jsx atau komponen popup

import { PeatService } from '../services/peatService';

const peatService = new PeatService();

async function handleHotspotClick(hotspot) {
  // Query gambut di lokasi hotspot
  const peatInfo = await peatService.queryPeatAtPoint(hotspot.lat, hotspot.lon);
  
  // Merge data
  const enrichedHotspot = {
    ...hotspot,
    peat: peatInfo
  };
  
  // Tampilkan di popup
  setSelectedItem(enrichedHotspot);
}

// Render popup
function renderPeatInfo(peat) {
  if (!peat.isPeatland) {
    return <span className="text-gray-500">Bukan area gambut</span>;
  }
  
  return (
    <div className="peat-info">
      <div className="font-semibold">Status Lahan Gambut</div>
      <div>Tipe: {peat.peatType}</div>
      <div>Kedalaman: {peat.depth?.min}-{peat.depth?.max} cm ({peat.depthCategory})</div>
      <div className="text-orange-600 font-semibold">
        Risiko Karbon: {peat.carbonRisk}
      </div>
    </div>
  );
}
```

---

## 7. File yang Perlu Diubah

### 7.1 File Baru

#### `src/services/peatService.js`
- Class `PeatService`
- Method: `loadPeatDataForBbox()`, `queryPeatAtPoint()`, `pointInPolygon()`
- Cache mechanism

#### `src/data/peatColors.js` (opsional)
- Warna styling untuk layer gambut di peta
- Mapping depth → color

### 7.2 File yang Dimodifikasi

#### `src/App.jsx`
- Import `PeatService`
- Initialize di `useEffect` (load data gambut saat startup atau on-demand)
- State baru: `peatData`, `isPeatLoaded`

#### `src/components/MapContainer.jsx`
- Tambah layer toggle untuk gambut: `layers.peatland`
- Render polygon gambut sebagai Leaflet layer
- Event handler untuk klik hotspot → query gambut

#### `src/components/InspectorDrawer.jsx` atau popup hotspot
- Tampilkan informasi gambut di section baru
- Warning message jika hotspot di area gambut dalam

#### `src/config/constants.js`
- Tambah konfigurasi:
  ```javascript
  PEAT: {
    ARCGIS_URL: 'https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/SUMBER_DAYA_ALAM_DAN_LINGKUNGAN/MapServer/6',
    CACHE_KEY: 'ina_peat_cache_v1',
    CACHE_TTL_DAYS: 7
  }
  ```

---

## 8. Strategi Cache

### 8.1 Cache Key
```javascript
const cacheKey = 'ina_peat_cache_v1';
```

### 8.2 Cache TTL
- **7 hari** - Data gambut tidak berubah sering (statis)
- Bisa lebih lama (30 hari) karena data lahan gambut relatif permanen

### 8.3 Cache Scope
- Per-region (bbox) atau per-pulau
- Contoh: `ina_peat_cache_v1_kalimantan`, `ina_peat_cache_v1_sumatera`

### 8.4 Invalidation
- Manual refresh via force refresh button
- Version bump saat ada update data

---

## 9. Tantangan & Mitigasi

### 9.1 Data Tidak Lengkap

**Masalah:** Layer BIG mungkin hanya mencakup Kalimantan

**Mitigasi:**
1. Cek layer lain di Satu Peta untuk Sumatera, Papua
2. Gunakan Global Peatland Database sebagai fallback untuk area tanpa data lokal
3. Tampilkan indikator "Data tidak tersedia" untuk area tanpa coverage

### 9.2 Performa

**Masalah:** Polygon gambut sangat besar (ribuan vertex)

**Mitigasi:**
1. Load per-region (hanya area viewport peta)
2. Simplifikasi polygon (topojons simplification)
3. Vector tiles jika memungkinkan
4. Limit query ke bbox yang wajar

### 9.3 Rate Limiting

**Masalah:** ArcGIS REST API mungkin memiliki rate limit

**Mitigasi:**
1. Cache agresif (7 hari)
2. Prefetch data untuk area hotspot-prone (Sumatera, Kalimantan)
3. Fallback ke Global Peatland Database jika rate limit tercapai

### 9.4 Accuracy

**Masalah:** Resolusi data mungkin tidak cocok dengan skala hotspot

**Mitigasi:**
1. Gunakan data skala 1:50.000 jika tersedia (BIG)
2. Tampilkan disclaimer di popup
3. Gunakan buffering kecil (100-200m) untuk account GPS error

---

## 10. Rencana Implementasi

### Fase 1: Eksplorasi Data (1-2 hari)
1. [ ] Verifikasi ketersediaan layer BIG untuk semua pulau
2. [ ] Cek lisensi dan terms of use
3. [ ] Test query API untuk bbox sample
4. [ ] Ukur size dan performa response

### Fase 2: Service Layer (2-3 hari)
1. [ ] Buat `peatService.js`
2. [ ] Implementasi load, query, cache
3. [ ] Unit test untuk point-in-polygon
4. [ ] Handle error dan edge cases

### Fase 3: UI Integration (2-3 hari)
1. [ ] Tambah layer toggle di MapContainer
2. [ ] Render polygon gambut di peta
3. [ ] Integrate dengan popup hotspot
4. [ ] Styling dan warna berdasarkan kedalaman

### Fase 4: Testing & Optimization (1-2 hari)
1. [ ] Performance testing (load time, query time)
2. [ ] Cross-browser testing
3. [ ] Mobile responsiveness
4. [ ] Optimasi cache strategy

---

## 11. Informasi yang Perlu Dicek

### Data & Akses
- [ ] Ketersediaan layer BIG untuk Sumatera dan Papua
- [ ] Status lisensi data BIG (komersial vs non-komersial)
- [ ] Rate limit ArcGIS REST API BIG
- [ ] MaxRecordCount aktual dan pagination strategy
- [ ] Format download Trase (apakah GeoJSON atau tabular)

### Teknis
- [ ] Performa point-in-polygon untuk ribuan polygon di browser
- [ ] Ukuran file GeoJSON untuk satu pulau (Kalimantan)
- [ ] Apakah perlu library turf.js atau bisa manual ray cast
- [ ] Dukungan CORS dari server BIG

### Data Lain
- [ ] Ketersediaan data KHG (Kesatuan Hidrologis Gambut) dari KLHK
- [ ] Data peta restorasi gambut dari BRG (Badan Restorasi Gambut)
- [ ] Layer tambahan dari geoportal.menlhk.go.id

---

## 12. Kesimpulan

Overlay hotspot dengan peta gambut memungkinkan identifikasi risiko kebakaran gambut dan estimasi emisi karbon. Sumber data utama yang direkomendasikan adalah BIG Satu Peta (ArcGIS REST API) karena data resmi, detail, dan memiliki atribut ketebalan. Fallback ke Global Peatland Database untuk area tanpa coverage.

**Estimasi effort:** 6-10 hari kerja untuk implementasi lengkap dengan testing.

**Prioritas:** Sedang - fitur tambahan yang meningkatkan nilai informasi untuk pengguna, bukan core functionality.
