# Product Requirements Document (PRD)
## Sistem Pemantauan Gunung Api, Kualitas Udara, dan Titik Panas (Hotspot) Indonesia

**Versi:** 0.1 (Draft)
**Tanggal:** 9 September 2026
**Pemilik Produk:** Theodosius Rexy Mahardika

---

## 1. Ringkasan Produk

Sistem berbasis web yang mengintegrasikan data satelit dan sensor untuk memantau empat aspek risiko lingkungan-atmosferik di Indonesia secara near real-time: aktivitas gunung api & sebaran abu vulkanik, kualitas udara & polusi, titik panas (hotspot) kebakaran hutan/lahan, dan dinamika arah angin. Tujuannya menyediakan dashboard informasi terpadu bagi masyarakat, peneliti, maupun instansi terkait mitigasi bencana.

## 2. Latar Belakang & Masalah

- Indonesia memiliki >120 gunung api aktif, rawan erupsi dengan dampak sebaran abu vulkanik lintas wilayah.
- Kualitas udara di banyak kota besar Indonesia sering berada di level tidak sehat, namun informasi masih tersebar di berbagai sumber terpisah (BMKG, PurpleAir, dsb).
- Kebakaran hutan dan lahan (karhutla) sulit dideteksi dini tanpa citra satelit; NASA FIRMS menyediakan data hotspot tapi belum banyak dimanfaatkan dalam bentuk dashboard yang mudah diakses publik Indonesia.
- Arah dan kecepatan angin memengaruhi sebaran abu vulkanik, asap karhutla, dan polusi udara — sehingga perlu ditampilkan bersamaan agar dapat dibaca sebagai satu kesatuan risiko.

## 3. Tujuan Produk

1. Menyediakan satu dashboard terpadu untuk memantau 4 fenomena di atas secara near real-time.
2. Memudahkan identifikasi korelasi antar-fenomena (mis. arah angin memengaruhi sebaran abu/asap/polusi).
3. Memberi peringatan dini (alert) saat terdeteksi anomali (erupsi, hotspot baru, kualitas udara memburuk).
4. Menjadi bahan referensi/portofolio teknis yang menunjukkan kemampuan integrasi data multi-sumber (data engineering + visualisasi).

## 4. Target Pengguna

| Segmen | Kebutuhan |
|---|---|
| Masyarakat umum (area rawan bencana) | Info sederhana & cepat dipahami, notifikasi bahaya |
| Peneliti/mahasiswa | Data historis, ekspor data, detail teknis (AOD, FRP, dsb.) |
| Instansi terkait (BPBD, dsb.) | Peta situasional, kombinasi multi-layer data |

## 5. Ruang Lingkup Fitur

### 5.1 Pemantauan Gunung Api & Sebaran Abu Vulkanik
- Peta lokasi gunung api aktif di Indonesia dengan status level (Normal/Waspada/Siaga/Awas — mengikuti skala PVMBG).
- Visualisasi arah & jangkauan sebaran abu vulkanik saat erupsi (berbasis data VAAC/BMKG bila tersedia, atau estimasi dari data angin).
- Riwayat aktivitas per gunung.

### 5.2 Kualitas Udara & Polusi
- Peta sebaran indeks kualitas udara (AQI/ISPU) per kota/wilayah.
- Breakdown parameter: PM2.5, PM10, CO, NO2, O3, SO2 (sesuai ketersediaan sumber data).
- Kategori kualitas udara (Baik/Sedang/Tidak Sehat/dst.) dengan kode warna.

### 5.3 Deteksi Titik Panas / Hotspot (NASA FIRMS)
- Integrasi data VIIRS/MODIS dari NASA FIRMS API untuk area Indonesia.
- Tampilan titik hotspot pada peta dengan info confidence level & Fire Radiative Power (FRP).
- Filter berdasarkan rentang waktu (24 jam / 48 jam / 7 hari) dan sensor (MODIS/VIIRS).

### 5.4 Dinamika Aliran Arah Angin
- Visualisasi arah & kecepatan angin (wind streamlines/vector) per wilayah.
- Digunakan sebagai layer pendukung untuk memprediksi arah sebaran abu vulkanik, asap karhutla, dan polusi.

## 6. Functional Requirements (Ringkas)

| ID | Requirement | Fitur Terkait | Prioritas |
|---|---|---|---|
| FR-01 | Sistem menarik data hotspot dari NASA FIRMS API secara terjadwal | 5.3 | Must |
| FR-02 | Sistem menampilkan peta interaktif dengan layer yang bisa di-toggle (gunung api, AQI, hotspot, angin) | Semua | Must |
| FR-03 | Sistem menyimpan data historis untuk keperluan analisis tren | Semua | Should |
| FR-04 | Sistem mengirim notifikasi/alert saat ada anomali signifikan | 5.1, 5.2, 5.3 | Should |
| FR-05 | Sistem menyediakan endpoint/API untuk ekspor data (CSV/JSON) | Semua | Could |
| FR-06 | Sistem menampilkan detail popup saat titik pada peta diklik | Semua | Must |

## 7. Non-Functional Requirements

- **Performa:** Peta harus tetap responsif dengan ratusan titik data (hotspot bisa ratusan/ribuan per hari).
- **Update data:** Idealnya near real-time, minimal update tiap 1–3 jam mengikuti siklus update NASA FIRMS.
- **Ketersediaan:** Uptime dashboard minimal 95% (mengingat sifatnya bisa untuk mitigasi bencana).
- **Skalabilitas:** Arsitektur data harus mudah menambah sumber data baru di masa depan.
- **Aksesibilitas:** Bisa diakses dari perangkat mobile (responsive design).

## 8. Sumber Data & API

| Data | Sumber Utama | Endpoint | Auth | Catatan |
|---|---|---|---|---|
| Titik panas/hotspot | **NASA FIRMS API** (VIIRS/MODIS) | `https://firms.modaps.eosdis.nasa.gov/api/area/csv/[MAP_KEY]/[SOURCE]/[BBOX]/[HARI]` | MAP_KEY gratis | Limit 5000 req/10 menit; larger transaction (mis. request 7 hari) bisa dihitung multiple request |
| Status gunung api | **MAGMA Indonesia** (PVMBG/ESDM) | `magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas`, `.../informasi-letusan` | Tidak perlu key | Tidak ada API resmi terbuka — perlu scraping HTML. Referensi implementasi: [Magma-Indonesia-API](https://github.com/Gabrielbjb/Magma-Indonesia-API) (Python + BeautifulSoup) |
| Kualitas udara | **Open-Meteo Air Quality API** | `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=..&longitude=..&hourly=pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,us_aqi` | Tidak perlu key | Gratis untuk non-komersial, forecast s.d. 5 hari, cakupan global termasuk Indonesia |
| Kualitas udara (alternatif/pembanding) | IQAir (AirVisual) / OpenWeatherMap Air Pollution API | `api.airvisual.com/v2/...` / `api.openweathermap.org/data/2.5/air_pollution` | API key gratis (limit harian) | Bisa untuk validasi silang data Open-Meteo di kota-kota besar |
| Data angin | **Open-Meteo Weather API** | `https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&hourly=windspeed_10m,winddirection_10m` | Tidak perlu key | Satu ekosistem dengan API kualitas udara di atas, memudahkan integrasi |
| Data angin (alternatif/lokal) | BMKG API resmi | `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode_wilayah}` | Tidak perlu key | Field `ws` (kecepatan, km/j) & `wd` (arah), granularitas kelurahan/desa, update tiap 3 jam — lebih lokal tapi butuh mapping kode wilayah adm4 |

## 9. Gambaran Arsitektur Teknis (Draft)

- **Ingestion layer:** Scheduler (mis. cron/Airflow) menarik data dari masing-masing API secara berkala.
- **Storage:** Database untuk data terstruktur (PostgreSQL/PostGIS untuk data geospasial) + object storage untuk data mentah/arsip.
- **Processing:** Layer transformasi untuk normalisasi format data dari berbagai sumber ke skema terpadu.
- **API layer:** Backend menyediakan REST API untuk frontend.
- **Frontend:** Dashboard peta interaktif (mis. Leaflet/Mapbox) dengan multi-layer toggle.

## 10. Metrik Keberhasilan

- Latency update data hotspot < 3 jam dari waktu observasi satelit.
- Akurasi lokasi & status gunung api sesuai rilis resmi PVMBG.
- Waktu muat dashboard < 3 detik pada koneksi standar.

## 11. Batasan & Asumsi

- Ketersediaan API kualitas udara & angin untuk cakupan penuh Indonesia perlu divalidasi lebih lanjut (belum dipastikan sumber final).
- Data sebaran abu vulkanik kemungkinan berupa estimasi (dari arah angin) jika tidak ada API VAAC yang bisa diakses publik.
- MAP_KEY NASA FIRMS punya limit request, perlu strategi caching di sisi backend.

## 12. Roadmap Bertahap

| Fase | Cakupan |
|---|---|
| MVP | Layer hotspot (NASA FIRMS) + layer kualitas udara dasar |
| Fase 2 | Tambah layer gunung api & status PVMBG |
| Fase 3 | Tambah layer angin + korelasi antar-layer |
| Fase 4 | Sistem alert/notifikasi otomatis |

---

*Dokumen ini adalah draft awal dan dapat disesuaikan setelah validasi ketersediaan sumber data final.*
