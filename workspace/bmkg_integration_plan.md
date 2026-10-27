# Rencana Integrasi BMKG sebagai Sumber Cuaca Alternatif

**Tanggal:** 2026-10-18
**Status:** Perencanaan (Tidak mengubah kode sumber)

---

## 1. Latar Belakang

Saat ini aplikasi mengandalkan Open-Meteo API untuk data cuaca:
- `weatherService.js` - prakiraan cuaca lengkap (current, hourly, daily)
- `windService.js` - data angin untuk stasiun regional
- `airQualityService.js` - kualitas udara

BMKG menyediakan API prakiraan cuaca resmi Indonesia dengan data lokal yang lebih akurat untuk wilayah Indonesia.

---

## 2. Endpoint BMKG

**URL:** `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode_wilayah}`

**Contoh Response (Gambir, Jakarta Pusat - adm4=31.71.01.1001):**
```json
{
  "lokasi": {
    "adm1": "31",
    "adm2": "31.71",
    "adm3": "31.71.01",
    "adm4": "31.71.01.1001",
    "provinsi": "DKI Jakarta",
    "kotkab": "Kota Adm. Jakarta Pusat",
    "kecamatan": "Gambir",
    "desa": "Gambir",
    "lon": 106.8267073562,
    "lat": -6.1763842693,
    "timezone": "Asia/Jakarta"
  },
  "data": [{
    "cuaca": [[
      {
        "datetime": "2026-10-18T15:00:00Z",
        "t": 27,
        "tcc": 78,
        "tp": 0.5,
        "weather": 2,
        "weather_desc": "Cerah Berawan",
        "weather_desc_en": "Partly Cloudy",
        "wd_deg": 270,
        "wd": "SW",
        "wd_to": "NE",
        "ws": 3.7,
        "hu": 83,
        "vs": null,
        "vs_text": null,
        "time_index": "1-2",
        "analysis_date": "2026-10-18T12:00:00",
        "image": "https://api-apps.bmkg.go.id/storage/icon/cuaca/cerah berawan-pm.svg",
        "utc_datetime": "2026-10-18 15:00:00",
        "local_datetime": "2026-10-18 22:00:00"
      }
    ]]
  }]
}
```

---

## 3. Mapping Kode adm4 dari indonesiaRegions.js

### Struktur Data Saat Ini
File `indonesiaRegions.json` berisi:
- 34 Provinsi (adm1)
- 514 Kabupaten/Kota (adm2)
- 7.093 Kecamatan (adm3)
- 82.043 Desa (adm4)

### Kode Kecamatan (adm3) di indonesiaRegions.json
```json
"kecamatanDetail": [
  {
    "code": "1101010",      // 7 digit → adm3
    "name": "Teupah Selatan",
    "desaCount": 19
  }
]
```

**Masalah:** BMKG membutuhkan kode adm4 (desa/kelurahan), sedangkan `indonesiaRegions.json` hanya menyimpan kode kecamatan (adm3) tanpa detail desa.

### Solusi Mapping

#### Opsi A: Tambah Data Desa ke JSON (Direkomendasikan)
1. Ekspor data desa dari sumber Kemendagri/BPS
2. Tambahkan array `desaDetail` di setiap kecamatan:
```json
"kecamatanDetail": [
  {
    "code": "1101010",
    "name": "Teupah Selatan",
    "desaCount": 19,
    "desaDetail": [
      { "code": "1101010001", "name": "Desa A" },
      { "code": "1101010002", "name": "Desa B" }
    ]
  }
]
```
3. Pilih desa pertama sebagai representatif untuk BMKG query

#### Opsi B: Gunakan Koordinat + Reverse Geocode
1. Gunakan lat/lon dari kabupaten/kota
2. Query BMKG dengan reverse geocoding (jika tersedia)
3. Atau gunakan endpoint alternatif berbasis koordinat

#### Opsi C: Hardcoded Mapping untuk Stasiun Regional
1. Buat mapping manual untuk 20 stasiun di `windService.js` dan 18 stasiun di `weatherService.js`
2. Contoh:
```javascript
const BMKG_ADM4_MAPPING = {
  'w_jkt': '31.71.01.1001',  // Gambir, Jakarta Pusat
  'w_sby': '35.78.01.1001',  // Surabaya
  'w_bdg': '32.73.01.1001',  // Bandung
  // ...
};
```

---

## 4. Struktur Response BMKG vs Open-Meteo

### Mapping Field

| Parameter | BMKG Field | Open-Meteo Field | Satuan |
|-----------|------------|------------------|--------|
| Suhu | `t` | `temperature_2m` | °C |
| Kelembapan | `hu` | `relative_humidity_2m` | % |
| Curah Hujan | `tp` | `precipitation` | mm |
| Kecepatan Angin | `ws` | `wind_speed_10m` | m/s (BMKG), km/h (Open-Meteo) |
| Arah Angin (derajat) | `wd_deg` | `wind_direction_10m` | derajat |
| Arah Angin (kardinal) | `wd` | - | string |
| Tutupan Awan | `tcc` | `cloud_cover` | % |
| Kode Cuaca | `weather` | `weather_code` | kode numerik |
| Deskripsi Cuaca | `weather_desc` | - | string (ID) |

### Konversi Satuan
- Kecepatan angin BMKG dalam m/s, Open-Meteo dalam km/h
- Konversi: `km/h = m/s × 3.6`

### Kode Cuaca BMKG vs WMO
BMKG menggunakan kode weather numerik (1, 2, 3, ...) berbeda dengan WMO weather code di Open-Meteo. Perlu mapping terpisah.

---

## 5. File yang Perlu Diubah

### 5.1 File Baru (Direkomendasikan)

#### `src/services/bmkgService.js`
- Class `BmkgService` untuk fetch dan transform data BMKG
- Mapping kode cuaca BMKG → label Indonesia
- Error handling dengan fallback ke Open-Meteo
- Cache strategy serupa dengan service lain

#### `src/data/bmkgAdm4Mapping.js`
- Mapping ID stasiun → kode adm4
- Di-generate dari data Kemendagri atau hardcoded untuk stasiun regional

### 5.2 File yang Dimodifikasi

#### `src/services/weatherService.js`
- Tambah method `getForecastWithBMKG(lat, lon, adm4, locationName)`
- Prioritas: BMKG (jika adm4 tersedia) → Open-Meteo (fallback)
- Normalisasi output agar konsisten dengan struktur existing

#### `src/services/windService.js`
- Tambah method `fetchWindFromBMKG(adm4)`
- Integrasi di `fetchAllWindStations()` sebagai sumber alternatif

#### `src/data/indonesiaRegions.json` (opsional)
- Tambah field `adm4Representative` di setiap kecamatan/kabupaten
- Atau tambah array `desaDetail` lengkap

---

## 6. Strategi Cache

### 6.1 Cache Key
```javascript
const cacheKey = `bmkg_weather_${adm4}`;
```

### 6.2 Cache TTL
- BMKG update setiap 3 jam (sesuai `analysis_date` di response)
- Rekomendasi TTL: 45 menit (sama dengan windService)
- Atau gunakan `analysis_date` dari response untuk cache invalidation

### 6.3 Cache Strategy
```javascript
async getBmkgForecast(adm4, forceRefresh = false) {
  const cacheKey = `bmkg_weather_${adm4}`;
  
  // 1. Cek cache localStorage
  if (!forceRefresh) {
    const cached = this.loadFromCache(cacheKey);
    if (cached) {
      // 2. Validasi berdasarkan analysis_date
      const analysisTime = new Date(cached.analysis_date);
      const now = new Date();
      const hoursSinceUpdate = (now - analysisTime) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate < 3) {
        return cached;
      }
    }
  }
  
  // 3. Fetch dari BMKG
  const data = await fetch(`https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${adm4}`);
  
  // 4. Simpan ke cache dengan analysis_date
  this.saveToCache(cacheKey, data);
  
  return data;
}
```

### 6.4 Cache Invalidation
- Otomatis berdasarkan `analysis_date` dari BMKG
- Force refresh via parameter `forceRefresh=true`
- Evict cache lama saat versi service berubah

---

## 7. Arsitektur Integrasi

```
┌─────────────────────────────────────────────────────────┐
│                     UI Components                        │
│         (CitySearchBar, WeatherPanel, WindMap)          │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Weather Service (Orchestrator)              │
│  - getForecast(lat, lon, locationName)                  │
│  - getForecastWithBMKG(lat, lon, adm4, locationName)    │
└─────────────┬───────────────────────┬───────────────────┘
              │                       │
              ▼                       ▼
┌──────────────────────┐    ┌──────────────────────┐
│   BMKG Service        │    │   Open-Meteo API     │
│ (Primary - Indonesia) │    │   (Fallback Global)  │
│                      │    │                      │
│ - Prakiraan Cuaca    │    │ - Weather Forecast   │
│ - Data Lokal ID      │    │ - Air Quality        │
│ - Kode Wilayah adm4  │    │ - Koordinat lat/lon  │
└──────────────────────┘    └──────────────────────┘
```

---

## 8. Rencana Implementasi

### Fase 1: Persiapan Data
1. [ ] Buat mapping adm4 untuk stasiun regional (hardcoded)
2. [ ] Definisikan mapping kode cuaca BMKG → label/icon
3. [ ] Tambah unit test untuk konversi satuan

### Fase 2: Service Layer
1. [ ] Buat `src/services/bmkgService.js`
2. [ ] Implementasi fetch dan transform data
3. [ ] Implementasi cache dengan analysis_date validation
4. [ ] Error handling dan fallback

### Fase 3: Integrasi
1. [ ] Update `weatherService.js` dengan method integrasi
2. [ ] Update `windService.js` untuk stasiun regional
3. [ ] Tambah toggle sumber data di UI (opsional)

### Fase 4: Testing
1. [ ] Unit test untuk setiap service
2. [ ] Integration test dengan BMKG API
3. [ ] Performance test untuk cache strategy

---

## 9. Catatan Teknis

### Rate Limiting
- BMKG API belum terdokumentasi rate limit-nya
- Rekomendasi: batasi request dengan cache agresif

### CORS
- BMKG API mendukung CORS (berdasarkan test curl)
- Tidak perlu proxy server

### Error Handling
- BMKG mungkin tidak memiliki data untuk semua desa
- Fallback ke Open-Meteo jika adm4 tidak ditemukan
- Log error untuk monitoring

### Data Freshness
- BMKG update 3 jam sekali (00:00, 03:00, 06:00, ... WIB)
- Gunakan `analysis_date` untuk validasi keaktualan data

---

## 10. Kesimpulan

Integrasi BMKG sebagai sumber alternatif membutuhkan:
1. Mapping kode adm4 untuk setiap lokasi yang didukung
2. Service baru untuk fetch dan transform data BMKG
3. Cache strategy berbasis `analysis_date`
4. Fallback ke Open-Meteo jika BMKG tidak tersedia

**Estimasi effort:** 2-3 hari kerja untuk implementasi lengkap dengan testing.
