# Spesifikasi Skor Risiko Karhutla Harian per Wilayah

**Tanggal:** 2026-10-18
**Versi:** 1.0 (Draft - Rumus Awal Sederhana)
**Status:** Perencanaan

---

## 1. Tujuan

Menghitung skor risiko kebakaran hutan dan lahan (karhutla) harian per wilayah (kabupaten/kota) berdasarkan:
- Data hotspot real-time (NASA FIRMS)
- Status lahan gambut
- Kondisi cuaca (angin, kelembapan, curah hujan)

Skor digunakan untuk:
1. Prioritas respons darurat (wilayah dengan skor tinggi ditangani lebih dulu)
2. Visualisasi peta risiko (color-coded per wilayah)
3. Notifikasi/alert otomatis untuk wilayah berisiko tinggi

---

## 2. Variabel Input

### 2.1 Variabel Hotspot (dari NASA FIRMS)

| Variabel | Sumber | Tipe | Satuan | Deskripsi |
|----------|--------|------|--------|-----------|
| `N_hotspot` | hotspotService.js | Integer | count | Jumlah hotspot aktif dalam wilayah (24 jam terakhir) |
| `FRP_max` | hotspotService.js | Float | MW | Fire Radiative Power maksimum dalam wilayah |
| `FRP_avg` | hotspotService.js | Float | MW | FRP rata-rata semua hotspot dalam wilayah |
| `FRP_total` | hotspotService.js | Float | MW | Total FRP (jumlah semua FRP) dalam wilayah |
| `confidence_high` | hotspotService.js | Integer | count | Jumlah hotspot dengan confidence="high" |
| `sensor_type` | hotspotService.js | String | - | "VIIRS" atau "MODIS" (VIIRS lebih sensitif) |

**Catatan:**
- FRP (Fire Radiative Power) mengindikasikan intensitas kebakaran
- VIIRS lebih sensitif (mendeteksi hotspot kecil), MODIS untuk hotspot besar
- Confidence: "high", "nominal", "low"

### 2.2 Variabel Lahan Gambut (dari BIG/Kementan - belum terintegrasi)

| Variabel | Sumber | Tipe | Satuan | Deskripsi |
|----------|--------|------|--------|-----------|
| `peat_area_pct` | peatService.js | Float | % | Persentase luas wilayah yang merupakan lahan gambut |
| `peat_depth_avg` | peatService.js | Float | cm | Kedalaman rata-rata gambut di wilayah (jika ada) |
| `peat_hotspot_count` | peatService.js | Integer | count | Jumlah hotspot yang berada di area gambut |

**Klasifikasi Kedalaman Gambut:**
| Kedalaman | Kategori | Risk Factor |
|-----------|----------|-------------|
| 50-100 cm | Dangkal | 1.2 |
| 100-200 cm | Sedang | 1.5 |
| 200-300 cm | Agak Dalam | 1.8 |
| 300-500 cm | Dalam | 2.2 |
| 500-700 cm | Sangat Dalam | 2.5 |

**Catatan:** Data gambut belum terintegrasi. Untuk fase awal, gunakan proxy berdasarkan pulau:
- Kalimantan Tengah, Sumatera Selatan, Riau → dianggap area gambut tinggi

### 2.3 Variabel Cuaca (dari Open-Meteo / BMKG)

| Variabel | Sumber | Tipe | Satuan | Deskripsi |
|----------|--------|------|--------|-----------|
| `humidity` | weatherService.js / BMKG | Float | % | Kelembapan relatif rata-rata harian |
| `wind_speed` | windService.js / BMKG | Float | km/h | Kecepatan angin rata-rata |
| `wind_gust` | windService.js / BMKG | Float | km/h | Kecepatan angin maksimum (gust) |
| `precipitation_24h` | weatherService.js / BMKG | Float | mm | Curah hujan 24 jam terakhir |
| `temperature` | weatherService.js / BMKG | Float | °C | Suhu udara rata-rata |

**Threshold Meteorologi (berdasarkan Fire Weather Index):**
| Parameter | Kondisi Berisiko | Bobot |
|-----------|------------------|-------|
| Humidity < 40% | Sangat Kering | Tinggi |
| Humidity 40-60% | Kering | Sedang |
| Humidity > 60% | Lembab | Rendah |
| Wind speed > 20 km/h | Angin Kencang | Tinggi |
| Precipitation < 1 mm | Tidak Hujan | Tinggi |
| Temperature > 32°C | Panas | Sedang |

---

## 3. Rumus Awal (Sederhana)

### 3.1 Formula Risk Score

```
RISK_SCORE = (W_hotspot × H_score + W_peat × P_score + W_weather × M_score) / 3
```

Dimana:
- `W_hotspot` = Bobot hotspot = 0.5 (50%)
- `W_peat` = Bobot gambut = 0.3 (30%)
- `W_weather` = Bobot meteorologi = 0.2 (20%)

**Total bobot = 1.0**

---

### 3.2 Komponen H_score (Hotspot Score)

```javascript
function calculateHotspotScore(N_hotspot, FRP_max, FRP_avg, confidence_high) {
  // Normalisasi jumlah hotspot (max 100)
  const N_norm = Math.min(N_hotspot, 100) / 100;  // 0-1
  
  // Normalisasi FRP (max 200 MW)
  const FRP_norm = Math.min(FRP_max, 200) / 200;  // 0-1
  
  // Confidence factor (high confidence = lebih berisiko)
  const conf_factor = N_hotspot > 0 
    ? (confidence_high / N_hotspot) * 0.2 + 0.8  // 0.8-1.0
    : 1.0;
  
  // Composite score (skala 0-100)
  const H_score = (N_norm * 40 + FRP_norm * 60) * conf_factor * 100;
  
  return Math.min(H_score, 100);  // Cap at 100
}
```

**Penjelasan:**
- Jumlah hotspot (40%): Lebih banyak hotspot = risiko lebih tinggi
- FRP maksimum (60%): Hotspot dengan intensitas tinggi lebih berbahaya
- Confidence factor: Hotspot dengan confidence "high" diberi bobot lebih tinggi

**Contoh:**
- 10 hotspot, FRP_max = 50 MW, 8 high confidence
  - N_norm = 0.1, FRP_norm = 0.25, conf_factor = 0.96
  - H_score = (0.1 × 40 + 0.25 × 60) × 0.96 × 100 = 19 × 96 = 18.24

- 50 hotspot, FRP_max = 120 MW, 40 high confidence
  - N_norm = 0.5, FRP_norm = 0.6, conf_factor = 0.96
  - H_score = (0.5 × 40 + 0.6 × 60) × 0.96 × 100 = 56 × 96 = 53.76

---

### 3.3 Komponen P_score (Peat Score)

```javascript
function calculatePeatScore(peat_area_pct, peat_depth_category, peat_hotspot_count) {
  // Jika tidak ada data gambut, gunakan nilai netral
  if (!peat_area_pct || peat_area_pct === 0) {
    return 50;  // Neutral
  }
  
  // Faktor kedalaman gambut
  const depth_factor = {
    'Dangkal': 1.2,
    'Sedang': 1.5,
    'Agak Dalam': 1.8,
    'Dalam': 2.2,
    'Sangat Dalam': 2.5
  };
  
  const df = depth_factor[peat_depth_category] || 1.0;
  
  // Base score berdasarkan persentase area gambut
  const base_score = Math.min(peat_area_pct, 100);  // 0-100
  
  // Multiplier jika ada hotspot di area gambut
  const hotspot_multiplier = peat_hotspot_count > 0 ? 1.5 : 1.0;
  
  // Final score
  const P_score = Math.min(base_score * df * hotspot_multiplier, 100);
  
  return P_score;
}
```

**Contoh:**
- Wilayah dengan 30% area gambut dalam (depth factor = 2.2), 5 hotspot di gambut
  - P_score = 30 × 2.2 × 1.5 = 99

- Wilayah tanpa data gambut
  - P_score = 50 (netral)

---

### 3.4 Komponen M_score (Meteorology Score)

```javascript
function calculateMeteorologyScore(humidity, wind_speed, precipitation_24h, temperature) {
  let score = 0;
  
  // 1. Humidity factor (40% dari M_score)
  let hum_score = 0;
  if (humidity < 40) {
    hum_score = 100;  // Sangat kering - risiko tinggi
  } else if (humidity < 50) {
    hum_score = 80;
  } else if (humidity < 60) {
    hum_score = 50;
  } else if (humidity < 70) {
    hum_score = 30;
  } else {
    hum_score = 10;   // Lembab - risiko rendah
  }
  
  // 2. Wind factor (30% dari M_score)
  let wind_score = 0;
  if (wind_speed > 25) {
    wind_score = 100;  // Angin sangat kencang
  } else if (wind_speed > 20) {
    wind_score = 80;
  } else if (wind_speed > 15) {
    wind_score = 50;
  } else if (wind_speed > 10) {
    wind_score = 30;
  } else {
    wind_score = 10;   // Angin lemah
  }
  
  // 3. Precipitation factor (30% dari M_score)
  let precip_score = 0;
  if (precipitation_24h < 0.5) {
    precip_score = 100;  // Tidak hujan - sangat kering
  } else if (precipitation_24h < 2) {
    precip_score = 70;
  } else if (precipitation_24h < 5) {
    precip_score = 40;
  } else if (precipitation_24h < 10) {
    precip_score = 20;
  } else {
    precip_score = 0;    // Hujan lebat - risiko rendah
  }
  
  // Weighted average
  const M_score = hum_score * 0.4 + wind_score * 0.3 + precip_score * 0.3;
  
  return M_score;
}
```

**Contoh:**
- Humidity 45%, Wind 18 km/h, Precipitation 0.2 mm
  - hum_score = 80, wind_score = 50, precip_score = 100
  - M_score = 80×0.4 + 50×0.3 + 100×0.3 = 32 + 15 + 30 = 77

- Humidity 75%, Wind 8 km/h, Precipitation 15 mm
  - hum_score = 10, wind_score = 10, precip_score = 0
  - M_score = 10×0.4 + 10×0.3 + 0×0.3 = 7

---

### 3.5 Final Risk Score Calculation

```javascript
function calculateDailyRiskScore(regionData) {
  const {
    hotspots,      // Array of hotspot objects
    peatInfo,      // Peat data for region
    weather        // Weather data
  } = regionData;
  
  // Calculate hotspot metrics
  const N_hotspot = hotspots.length;
  const FRP_max = N_hotspot > 0 
    ? Math.max(...hotspots.map(h => h.frp)) 
    : 0;
  const FRP_avg = N_hotspot > 0 
    ? hotspots.reduce((sum, h) => sum + h.frp, 0) / N_hotspot 
    : 0;
  const confidence_high = hotspots.filter(h => 
    h.confidence === 'high' || h.confidence === 'h'
  ).length;
  
  // Calculate component scores
  const H_score = calculateHotspotScore(N_hotspot, FRP_max, FRP_avg, confidence_high);
  const P_score = calculatePeatScore(
    peatInfo?.peat_area_pct || 0,
    peatInfo?.depth_category || null,
    peatInfo?.peat_hotspot_count || 0
  );
  const M_score = calculateMeteorologyScore(
    weather?.humidity || 60,
    weather?.wind_speed || 10,
    weather?.precipitation_24h || 0,
    weather?.temperature || 28
  );
  
  // Weighted final score
  const W_hotspot = 0.5;
  const W_peat = 0.3;
  const W_weather = 0.2;
  
  const RISK_SCORE = (
    W_hotspot * H_score + 
    W_peat * P_score + 
    W_weather * M_score
  ) / (W_hotspot + W_peat + W_weather);
  
  return {
    score: Math.round(RISK_SCORE * 10) / 10,  // 1 decimal
    components: {
      H_score: Math.round(H_score * 10) / 10,
      P_score: Math.round(P_score * 10) / 10,
      M_score: Math.round(M_score * 10) / 10
    },
    level: categorizeRiskLevel(RISK_SCORE)
  };
}

function categorizeRiskLevel(score) {
  if (score >= 80) return { level: 'SANGAT TINGGI', color: '#dc2626', priority: 1 };
  if (score >= 60) return { level: 'TINGGI', color: '#ea580c', priority: 2 };
  if (score >= 40) return { level: 'SEDANG', color: '#facc15', priority: 3 };
  if (score >= 20) return { level: 'RENDAH', color: '#38bdf8', priority: 4 };
  return { level: 'SANGAT RENDAH', color: '#10b981', priority: 5 };
}
```

---

## 4. Filter False Positive

### 4.1 Sumber False Positive

| Penyebab | Karakteristik | Cara Deteksi |
|----------|---------------|--------------|
| Gas flare (migas) | Hotspot persisten di lokasi yang sama setiap hari | Historical persistence check |
| Pabrik/asap industri | FRP rendah, lokasi tetap | Proximity to industrial zone |
| Gunung api aktif | Lokasi di kawah gunung berapi | Proximity to volcano database |
| Kesalahan deteksi sensor | Confidence rendah, FRP anomali | Filter berdasarkan confidence |
| Hotspot di laut | Koordinat di badan air | Land/water mask check |

### 4.2 Filter Rules

```javascript
function filterFalsePositives(hotspots, options = {}) {
  const {
    volcanoBuffer = 3000,      // 3 km dari kawah
    industrialZones = [],      // Array of polygon industrial zones
    persistentThreshold = 14,  // Hari kemunculan berturut-turut
    minConfidence = 'nominal'  // Minimum confidence level
  } = options;
  
  return hotspots.filter(hotspot => {
    // 1. Filter berdasarkan confidence
    if (hotspot.confidence === 'low') {
      return false;  // Buang confidence rendah
    }
    
    // 2. Filter di sekitar gunung api aktif
    const nearVolcano = VOLCANO_DATABASE.some(v => {
      const dist = calculateDistance(hotspot.lat, hotspot.lon, v.lat, v.lon);
      return dist < volcanoBuffer && v.level >= 2;
    });
    
    if (nearVolcano) {
      // Tandai sebagai vulkanik, bukan karhutla
      hotspot.potential_cause = 'volcanic';
      return false;  // Atau true dengan flag khusus
    }
    
    // 3. Filter hotspot di laut (perlu land/water mask)
    // Untuk fase awal, gunakan threshold jarak dari pantai
    // atau koordinat yang jelas di laut
    
    // 4. Filter gas flare (persistent hotspot di lokasi sama)
    // Perlu historical data - cek apakah hotspot muncul di koordinat yang sama
    // dalam > 14 hari berturut-turut
    // Implementasi: perlu database historical hotspot
    
    return true;  // Lolos filter
  });
}
```

### 4.3 Klasifikasi Penyebab (Untuk False Positive)

```javascript
function classifyHotspotCause(hotspot, historicalData) {
  // Cek proximity ke gunung api
  const nearestVolcano = findNearestVolcano(hotspot.lat, hotspot.lon);
  if (nearestVolcano.dist < 3000 && nearestVolcano.level >= 2) {
    return { type: 'volcanic', confidence: 0.9 };
  }
  
  // Cek persistence (gas flare indicator)
  const persistence = calculatePersistence(hotspot, historicalData);
  if (persistence.days_consecutive >= 14) {
    return { type: 'gas_flare', confidence: 0.8 };
  }
  
  // Cek lokasi industri
  // ...
  
  // Default: karhutla
  return { type: 'wildfire', confidence: 0.7 };
}
```

---

## 5. Rencana Evaluasi

### 5.1 Metrik Evaluasi

| Metrik | Rumus | Target | Deskripsi |
|--------|-------|--------|-----------|
| Precision | TP / (TP + FP) | > 80% | Dari wilayah yang diprediksi berisiko tinggi, berapa yang benar-benar terjadi kebakaran |
| Recall | TP / (TP + FN) | > 70% | Dari wilayah yang benar-benar terjadi kebakaran, berapa yang terdeteksi |
| F1-Score | 2 × (P × R) / (P + R) | > 75% | Harmonic mean precision dan recall |
| Lead Time | Waktu prediksi - waktu kejadian | > 24 jam | Seberapa jauh sebelumnya skor naik sebelum kebakaran besar |
| False Alarm Rate | FP / (FP + TN) | < 20% | Persentase false positive dari total prediksi |

**Legend:**
- TP (True Positive): Wilayah diprediksi berisiko, terjadi kebakaran
- FP (False Positive): Wilayah diprediksi berisiko, tidak terjadi kebakaran
- TN (True Negative): Wilayah diprediksi aman, tidak terjadi kebakaran
- FN (False Negative): Wilayah diprediksi aman, terjadi kebakaran

### 5.2 Data Pembanding (Ground Truth)

| Sumber | Tipe | Coverage | Cara Akses |
|--------|------|----------|------------|
| LAPAN Hotspot | Historical data | Seluruh Indonesia | Perlu permohonan |
| MODIS Fire Archive | Historical hotspot | Global | Gratis dari NASA |
| BMKG Fire Weather Index | Index risiko | Indonesia | Perlu dicek ketersediaan |
| Berita/Laporan Resmi | Ground truth | Tidak lengkap | Manual scraping |
| BMKG BMG (Burned Area) | Area terbakar | Indonesia | Perlu dicek |

**Rekomendasi untuk evaluasi awal:**
1. Gunakan data historis MODIS Fire Archive (download gratis)
2. Ambil sample 3-6 bulan data (musim kemarau 2024/2025)
3. Bandingkan skor harian dengan aktual kejadian kebakaran

### 5.3 Metodologi Evaluasi

**Langkah 1: Data Collection**
```javascript
// Collect historical data
const historicalData = await collectHistoricalData({
  startDate: '2025-06-01',
  endDate: '2025-10-31',
  regions: ['Kalimantan Tengah', 'Sumatera Selatan', 'Riau', 'Papua']
});
```

**Langkah 2: Backtesting**
```javascript
// Calculate risk scores for historical dates
for (const date of dateRange) {
  const dailyHotspots = await getHotspotsForDate(date);
  const dailyWeather = await getWeatherForDate(date);
  
  for (const region of regions) {
    const score = calculateDailyRiskScore({
      hotspots: filterByRegion(dailyHotspots, region),
      peatInfo: getPeatInfo(region),
      weather: getWeatherByRegion(dailyWeather, region)
    });
    
    // Store for comparison
    predictions.push({ date, region, score });
  }
}
```

**Langkah 3: Ground Truth Comparison**
```javascript
// Compare with actual fire incidents
const groundTruth = await loadGroundTruthData();

const comparison = predictions.map(pred => ({
  ...pred,
  actual_fire: checkIfFireOccurred(pred.region, pred.date, groundTruth),
  actual_severity: getFireSeverity(pred.region, pred.date, groundTruth)
}));
```

**Langkah 4: Calculate Metrics**
```javascript
// Calculate confusion matrix
const TP = comparison.filter(c => c.score >= 60 && c.actual_fire).length;
const FP = comparison.filter(c => c.score >= 60 && !c.actual_fire).length;
const TN = comparison.filter(c => c.score < 60 && !c.actual_fire).length;
const FN = comparison.filter(c => c.score < 60 && c.actual_fire).length;

const precision = TP / (TP + FP);
const recall = TP / (TP + FN);
const f1Score = 2 * (precision * recall) / (precision + recall);
```

### 5.4 Threshold Optimization

**Cari threshold optimal untuk skor risiko:**

```javascript
function optimizeThreshold(comparison) {
  const thresholds = [40, 50, 60, 70, 80];
  const results = [];
  
  for (const threshold of thresholds) {
    const TP = comparison.filter(c => c.score >= threshold && c.actual_fire).length;
    const FP = comparison.filter(c => c.score >= threshold && !c.actual_fire).length;
    const TN = comparison.filter(c => c.score < threshold && !c.actual_fire).length;
    const FN = comparison.filter(c => c.score < threshold && c.actual_fire).length;
    
    const precision = TP / (TP + FP);
    const recall = TP / (TP + FN);
    const f1 = 2 * (precision * recall) / (precision + recall);
    
    results.push({ threshold, precision, recall, f1 });
  }
  
  // Find threshold with best F1-score
  return results.sort((a, b) => b.f1 - a.f1)[0];
}
```

---

## 6. Implementasi

### 6.1 File Baru

```
src/services/
  ├── riskScoreService.js     # Logic perhitungan skor
  └── falsePositiveFilter.js  # Filter hotspot

src/components/
  └── RiskMap.jsx             # Peta risiko visualisasi

src/data/
  └── riskThresholds.js       # Konfigurasi threshold dan bobot
```

### 6.2 Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  Data Sources                                            │
│  - NASA FIRMS (hotspot)                                 │
│  - Open-Meteo / BMKG (weather)                          │
│  - BIG (peat - belum terintegrasi)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  falsePositiveFilter.js                                  │
│  - Filter volcano proximity                             │
│  - Filter confidence rendah                              │
│  - Classify hotspot cause                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  riskScoreService.js                                     │
│  - calculateDailyRiskScore()                            │
│  - calculateHotspotScore()                              │
│  - calculatePeatScore()                                 │
│  - calculateMeteorologyScore()                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Output                                                  │
│  - Risk score per kabupaten (0-100)                     │
│  - Risk level (Sangat Rendah - Sangat Tinggi)           │
│  - Component scores breakdown                           │
└─────────────────────────────────────────────────────────┘
```

### 6.3 API Response Example

```json
{
  "region": {
    "code": "6203",
    "name": "Kabupaten Kapuas",
    "province": "Kalimantan Tengah",
    "island": "Kalimantan"
  },
  "date": "2026-10-18",
  "risk_score": {
    "total": 72.5,
    "level": "TINGGI",
    "color": "#ea580c",
    "priority": 2
  },
  "components": {
    "hotspot_score": 85.3,
    "peat_score": 88.2,
    "meteorology_score": 43.9
  },
  "details": {
    "hotspot_count": 23,
    "frp_max": 78.5,
    "peat_area_pct": 45,
    "peat_depth_category": "Dalam",
    "humidity": 52,
    "wind_speed": 15,
    "precipitation_24h": 0.3
  },
  "recommendation": "Waspada kebakaran gambut dalam. Siagakan pemadaman."
}
```

---

## 7. Catatan dan Limitasi

### 7.1 Limitasi Fase Awal

1. **Data gambut belum terintegrasi** - Gunakan proxy berdasarkan pulau/kabupaten
2. **Tidak ada historical persistence check** - Filter gas flare belum bisa diimplementasikan
3. **Bobot subyektif** - Perlu calibration dengan data historis
4. **Tidak mempertimbangkan human factor** - Aktivitas manusia (land clearing, dll.) tidak dihitung
5. **Tidak ada data vegetasi/tutupan lahan** - Risiko di hutan vs kebun berbeda

### 7.2 Peningkatan Future Version

1. **Machine Learning Model** - Ganti rumus sederhana dengan model ML
2. **Time Series Analysis** - Trend skor risiko dari waktu ke waktu
3. **Spatial Autocorrelation** - Risiko wilayah tetangga mempengaruhi
4. **Human Activity Data** - Integrasikan data aktivitas pertanian, logging
5. **Satellite Imagery** - Analisis NDVI, burn scar

### 7.3 Parameter yang Perlu Dicek

- [ ] Validasi threshold humidity/wind/precipitation dengan literatur Fire Weather Index
- [ ] Cek ketersediaan data ground truth untuk evaluasi
- [ ] Konfirmasi bobot awal (50-30-20) dengan expert domain
- [ ] Test formula dengan data historis untuk calibration

---

## 8. Referensi

1. Fire Weather Index (FWI) System - Canadian Forest Service
2. Keetch-Byram Drought Index (KBDI)
3. NBR (Normalized Burn Ratio) for burn severity
4. BMKG Fire Weather Information
5. Global Fire WEather Database (GFWED)

---

**Dokumen ini adalah draft awal. Rumus dan parameter perlu divalidasi dengan data historis dan expert review.**
