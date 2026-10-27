/**
 * Konfigurasi Sistem Pemantauan Risiko Lingkungan-Atmosferik Indonesia
 * Gunung Api, Kualitas Udara, Titik Panas (NASA FIRMS), dan Dinamika Angin
 */

export const CONFIG = {
  APP_NAME: 'INA-RISK MONITOR',
  APP_TITLE: 'Sistem Pemantauan Gunung Api, Kualitas Udara, dan Titik Panas Indonesia',

  // MAP KEY NASA FIRMS dari Pengguna
  DEFAULT_FIRMS_MAP_KEY: 'b116c8e8a24077ed97e3cdba2266f3e8',

  // Bounding box Indonesia (MinLon, MinLat, MaxLon, MaxLat)
  FIRMS_BBOX: '95.0,-11.0,141.0,6.0',

  // Peta Default
  MAP_DEFAULT: {
    lat: -2.5489,
    lon: 118.0149,
    zoom: 5,
    minZoom: 4,
    maxZoom: 18,
    bounds: [
      [-12.0, 94.0],
      [7.5, 142.0]
    ]
  },

  // Level PVMBG Status Gunung Api
  VOLCANO_LEVELS: {
    1: {
      id: 1,
      name: 'Level I (Normal)',
      short: 'Normal',
      color: '#10b981',
      bgLight: 'rgba(16, 185, 129, 0.15)',
      description: 'Aktivitas dasar visual dan seismik dalam batas normal. Tidak ada erupsi.',
      recommendation: 'Masyarakat dapat beraktivitas normal dengan tetap waspada.'
    },
    2: {
      id: 2,
      name: 'Level II (Waspada)',
      short: 'Waspada',
      color: '#facc15',
      bgLight: 'rgba(250, 204, 21, 0.15)',
      description: 'Terdapat peningkatan aktivitas seismik dan visual di atas level normal.',
      recommendation: 'Masyarakat/wisatawan diimbau tidak mendekati kawah radius 1.5 - 3 km.'
    },
    3: {
      id: 3,
      name: 'Level III (Siaga)',
      short: 'Siaga',
      color: '#f97316',
      bgLight: 'rgba(249, 115, 22, 0.2)',
      description: 'Peningkatan seismik intensif, letusan abu berpotensi mengancam kawasan sekitar.',
      recommendation: 'Zona bahaya diperluas (3 - 5 km). Siapkan evakuasi bila diperlukan.'
    },
    4: {
      id: 4,
      name: 'Level IV (Awas)',
      short: 'Awas',
      color: '#ef4444',
      bgLight: 'rgba(239, 68, 68, 0.25)',
      description: 'Erupsi besar sedang berlangsung atau kemungkinan besar segera terjadi.',
      recommendation: 'Evakuasi segera seluruh warga dalam radius bahaya (5 - 8+ km). Area terlarang.'
    }
  },

  // Kategori AQI & ISPU Indonesia
  AQI_CATEGORIES: [
    { min: 0, max: 50, label: 'Baik', color: '#10b981', textColor: '#ffffff', desc: 'Kualitas udara sangat sehat, risiko minimal bagi kesehatan.' },
    { min: 51, max: 100, label: 'Sedang', color: '#38bdf8', textColor: '#ffffff', desc: 'Kualitas udara dapat diterima bagi sebagian besar orang.' },
    { min: 101, max: 150, label: 'Tidak Sehat (Sensitif)', color: '#fbbf24', textColor: '#000000', desc: 'Kelompok rentan (anak, lansia, asma) kurangi aktivitas luar.' },
    { min: 151, max: 200, label: 'Tidak Sehat', color: '#f97316', textColor: '#ffffff', desc: 'Semua orang berisiko mengalami efek kesehatan, gunakan masker N95.' },
    { min: 201, max: 300, label: 'Sangat Tidak Sehat', color: '#ef4444', textColor: '#ffffff', desc: 'Peringatan bahaya kesehatan; hindari aktivitas di luar ruangan.' },
    { min: 301, max: 500, label: 'Berbahaya', color: '#881337', textColor: '#ffffff', desc: 'Kondisi darurat kesehatan lingkungan; seluruh populasi terdampak.' }
  ],

  // Daftar Stasiun Pemantau Kualitas Udara di Indonesia
  LOCATIONS: [
    { id: 'jkt', name: 'DKI Jakarta', province: 'DKI Jakarta', lat: -6.2088, lon: 106.8456, isCapital: true },
    { id: 'sby', name: 'Surabaya', province: 'Jawa Timur', lat: -7.2575, lon: 112.7521 },
    { id: 'bdg', name: 'Bandung', province: 'Jawa Barat', lat: -6.9175, lon: 107.6191 },
    { id: 'smg', name: 'Semarang', province: 'Jawa Tengah', lat: -7.0051, lon: 110.4381 },
    { id: 'ygy', name: 'Yogyakarta', province: 'DI Yogyakarta', lat: -7.7956, lon: 110.3695 },
    { id: 'mdn', name: 'Medan', province: 'Sumatera Utara', lat: 3.5952, lon: 98.6722 },
    { id: 'plb', name: 'Palembang', province: 'Sumatera Selatan', lat: -2.9909, lon: 104.7565 },
    { id: 'pku', name: 'Pekanbaru', province: 'Riau', lat: 0.5071, lon: 101.4478 },
    { id: 'pdg', name: 'Padang', province: 'Sumatera Barat', lat: -0.9471, lon: 100.4172 },
    { id: 'ptk', name: 'Pontianak', province: 'Kalimantan Barat', lat: -0.0263, lon: 109.3425 },
    { id: 'bjm', name: 'Banjarmasin', province: 'Kalimantan Selatan', lat: -3.3194, lon: 114.5908 },
    { id: 'smd', name: 'Samarinda', province: 'Kalimantan Timur', lat: -0.5022, lon: 117.1536 },
    { id: 'mks', name: 'Makassar', province: 'Sulawesi Selatan', lat: -5.1477, lon: 119.4327 },
    { id: 'mnd', name: 'Manado', province: 'Sulawesi Utara', lat: 1.4748, lon: 124.8421 },
    { id: 'dps', name: 'Denpasar', province: 'Bali', lat: -8.6705, lon: 115.2126 },
    { id: 'mtr', name: 'Mataram', province: 'Nusa Tenggara Barat', lat: -8.5769, lon: 116.0999 },
    { id: 'kpg', name: 'Kupang', province: 'Nusa Tenggara Timur', lat: -10.1772, lon: 123.6070 },
    { id: 'amb', name: 'Ambon', province: 'Maluku', lat: -3.6954, lon: 128.1814 },
    { id: 'jyp', name: 'Jayapura', province: 'Papua', lat: -2.5916, lon: 140.6690 }
  ]
};
