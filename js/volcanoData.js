/**
 * Database Gunung Api Aktif Indonesia (Sesuai Standar PVMBG / MAGMA Indonesia)
 * Dilengkapi fungsi pemodelan kerucut dispersi abu vulkanik berbasis arah angin
 */

const VOLCANO_DATABASE = [
  {
    id: 'merapi',
    name: 'Gunung Merapi',
    province: 'DI Yogyakarta / Jawa Tengah',
    island: 'Jawa',
    lat: -7.5407,
    lon: 110.4457,
    elevation: 2968,
    level: 3, // Siaga
    statusText: 'Level III (Siaga)',
    lastEruption: '2026-09-07 06:15 WIB',
    ashColumnMeters: 1800,
    dangerRadiusKm: 5.0,
    currentAshDirection: 'Barat Daya',
    currentAshDirectionDeg: 240,
    activitySummary: 'Guguran awan panas teramati meluncur sejauh 1.800 meter ke arah barat daya (K. Bebeng). Gempa guguran intensitas tinggi berlanjut.',
    recommendation: 'Masyarakat dilarang beraktivitas dalam zona bahaya radius 5 km dari puncak dan 7 km pada alur Sungai Bebeng dan Krasak.'
  },
  {
    id: 'semeru',
    name: 'Gunung Semeru',
    province: 'Jawa Timur',
    island: 'Jawa',
    lat: -8.1080,
    lon: 112.9220,
    elevation: 3676,
    level: 3, // Siaga
    statusText: 'Level III (Siaga)',
    lastEruption: '2026-09-08 14:30 WIB',
    ashColumnMeters: 2200,
    dangerRadiusKm: 5.0,
    currentAshDirection: 'Tenggara - Selatan',
    currentAshDirectionDeg: 160,
    activitySummary: 'Terjadi erupsi dengan tinggi kolom letusan teramati ± 1.000 m di atas puncak (± 4.676 m dpl). Kolom abu berwarna kelabu tebal ke arah tenggara.',
    recommendation: 'Tidak melakukan aktivitas apapun di sektor tenggara sepanjang Besuk Kobokan, sejauh 13 km dari puncak (pusat erupsi).'
  },
  {
    id: 'lewotobi',
    name: 'Gunung Lewotobi Laki-laki',
    province: 'Nusa Tenggara Timur',
    island: 'Nusa Tenggara',
    lat: -8.5389,
    lon: 122.7689,
    elevation: 1584,
    level: 4, // Awas
    statusText: 'Level IV (Awas)',
    lastEruption: '2026-09-09 02:40 WITA',
    ashColumnMeters: 3500,
    dangerRadiusKm: 7.0,
    currentAshDirection: 'Barat - Barat Laut',
    currentAshDirectionDeg: 290,
    activitySummary: 'Erupsi eksplosif terus berlangsung disertai lontaran material pijar hingga radius 3 km. Kolom abu tebal mencapai ketinggian 3.500 meter condong ke barat laut.',
    recommendation: 'Masyarakat dan pengunjung dilarang beraktivitas dalam radius 7 km dari pusat erupsi Lewotobi Laki-laki. Kenakan masker pelindung.'
  },
  {
    id: 'marapi',
    name: 'Gunung Marapi',
    province: 'Sumatera Barat',
    island: 'Sumatera',
    lat: -0.3811,
    lon: 100.4739,
    elevation: 2891,
    level: 3, // Siaga
    statusText: 'Level III (Siaga)',
    lastEruption: '2026-09-05 10:12 WIB',
    ashColumnMeters: 1500,
    dangerRadiusKm: 4.5,
    currentAshDirection: 'Timur Laut',
    currentAshDirectionDeg: 45,
    activitySummary: 'Tercatat gempa letusan dan hembusan vulkanik konstan. Kolom abu teramati berwarna kelabu tebal dengan intensitas sedang hingga tebal.',
    recommendation: 'Masyarakat di sekitar Gunung Marapi tidak diperbolehkan memasuki dan melakukan kegiatan di dalam wilayah radius 4.5 km dari kawah Verbeek.'
  },
  {
    id: 'ibu',
    name: 'Gunung Ibu',
    province: 'Maluku Utara',
    island: 'Maluku',
    lat: 1.4883,
    lon: 127.6300,
    elevation: 1325,
    level: 3, // Siaga
    statusText: 'Level III (Siaga)',
    lastEruption: '2026-09-08 21:05 WIT',
    ashColumnMeters: 2000,
    dangerRadiusKm: 4.0,
    currentAshDirection: 'Utara - Timur Laut',
    currentAshDirectionDeg: 30,
    activitySummary: 'Erupsi abu vulkanik berulang kali terekam dengan amplitudo seismograf maksimal 28 mm. Lontaran bara api teramati hingga 1 km dari bibir kawah.',
    recommendation: 'Masyarakat dan wisatawan agar tidak beraktivitas di dalam radius 4 km dan perluasan sektoral berjarak 5 km ke arah bukaan kawah bagian utara.'
  },
  {
    id: 'ruang',
    name: 'Gunung Ruang',
    province: 'Sulawesi Utara',
    island: 'Sulawesi',
    lat: 2.3000,
    lon: 125.3700,
    elevation: 725,
    level: 3, // Siaga
    statusText: 'Level III (Siaga)',
    lastEruption: '2026-08-28 17:15 WITA',
    ashColumnMeters: 1200,
    dangerRadiusKm: 4.0,
    currentAshDirection: 'Selatan',
    currentAshDirectionDeg: 180,
    activitySummary: 'Aktivitas hembusan gas solfatara putih tebal bertekanan sedang. Potensi tsunami lokal akibat runtuhan material vulkanik ke laut tetap dipantau.',
    recommendation: 'Radius bahaya 4 km dari kawah aktif. Seluruh warga Pulau Ruang berada di pos pengungsian daratan Pulau Tagulandang.'
  },
  {
    id: 'sinabung',
    name: 'Gunung Sinabung',
    province: 'Sumatera Utara',
    island: 'Sumatera',
    lat: 3.1700,
    lon: 98.3920,
    elevation: 2460,
    level: 2, // Waspada
    statusText: 'Level II (Waspada)',
    lastEruption: '2026-07-14 08:30 WIB',
    ashColumnMeters: 800,
    dangerRadiusKm: 3.0,
    currentAshDirection: 'Timur',
    currentAshDirectionDeg: 90,
    activitySummary: 'Kubah lava relatif stabil, hembusan asap putih tipis hingga sedang setinggi 100-300 m dari puncak. Tremor non-harmonik terekam berkala.',
    recommendation: 'Zona merah radius 3 km dari puncak dilarang dimasuki warga/wisatawan.'
  },
  {
    id: 'krakatau',
    name: 'Anak Krakatau',
    province: 'Lampung / Banten',
    island: 'Sumatera',
    lat: -6.1020,
    lon: 105.4230,
    elevation: 157,
    level: 3, // Siaga
    statusText: 'Level III (Siaga)',
    lastEruption: '2026-09-06 18:22 WIB',
    ashColumnMeters: 1500,
    dangerRadiusKm: 5.0,
    currentAshDirection: 'Barat Daya',
    currentAshDirectionDeg: 225,
    activitySummary: 'Terekam letusan beruntun dengan lontaran pijar dan abu vulkanik hitam tebal. Zona perairan Selat Sunda sekitar pulau kawah disterilkan.',
    recommendation: 'Masyarakat/nelayan/wisatawan dilarang mendekati pulau Anak Krakatau dalam radius 5 km.'
  },
  {
    id: 'dukono',
    name: 'Gunung Dukono',
    province: 'Maluku Utara',
    island: 'Maluku',
    lat: 1.6930,
    lon: 127.8940,
    elevation: 1229,
    level: 2, // Waspada
    statusText: 'Level II (Waspada)',
    lastEruption: '2026-09-08 11:45 WIT',
    ashColumnMeters: 1000,
    dangerRadiusKm: 3.0,
    currentAshDirection: 'Barat Laut',
    currentAshDirectionDeg: 315,
    activitySummary: 'Letusan abu vulkanik terus menerus terjadi, abu tebal mengarah ke barat laut Tobelo.',
    recommendation: 'Masyarakat dilarang beraktivitas, mendaki, dan mendekati Kawah Malupang Warirang dalam radius 3 km.'
  },
  {
    id: 'kerinci',
    name: 'Gunung Kerinci',
    province: 'Jambi / Sumatera Barat',
    island: 'Sumatera',
    lat: -1.6970,
    lon: 101.2640,
    elevation: 3805,
    level: 2, // Waspada
    statusText: 'Level II (Waspada)',
    lastEruption: '2026-08-19 09:10 WIB',
    ashColumnMeters: 600,
    dangerRadiusKm: 3.0,
    currentAshDirection: 'Timur Laut',
    currentAshDirectionDeg: 55,
    activitySummary: 'Hembusan asap kawah bertekanan sedang berwarna putih hingga kelabu tipis setinggi 300-600 meter.',
    recommendation: 'Jalur pendakian ditutup sebagian, batas aman pendakian hanya sampai radius 3 km dari kawah aktif.'
  },
  {
    id: 'bromo',
    name: 'Gunung Bromo',
    province: 'Jawa Timur',
    island: 'Jawa',
    lat: -7.9425,
    lon: 112.9530,
    elevation: 2329,
    level: 2, // Waspada
    statusText: 'Level II (Waspada)',
    lastEruption: '2026-08-05 07:20 WIB',
    ashColumnMeters: 400,
    dangerRadiusKm: 1.0,
    currentAshDirection: 'Barat Daya',
    currentAshDirectionDeg: 235,
    activitySummary: 'Bau belerang tercium sedang hingga kuat. Gempa tremor menerus amplitudo 0.5 - 3 mm. Wisatawan dibatasi hanya di bibir kaldera luar.',
    recommendation: 'Tidak memasuki kawasan kawah aktif Bromo dalam radius 1 km.'
  },
  {
    id: 'agung',
    name: 'Gunung Agung',
    province: 'Bali',
    island: 'Bali',
    lat: -8.3430,
    lon: 115.5080,
    elevation: 3142,
    level: 1, // Normal
    statusText: 'Level I (Normal)',
    lastEruption: '2019-06-13',
    ashColumnMeters: 0,
    dangerRadiusKm: 0,
    currentAshDirection: '-',
    currentAshDirectionDeg: null,
    activitySummary: 'Kondisi seismik stabil, visual kawah tenang, tidak teramati kolom abu letusan.',
    recommendation: 'Aktivitas masyarakat normal, pendakian diizinkan sesuai regulasi pemandu lokal.'
  },
  {
    id: 'ili_lewotolok',
    name: 'Gunung Ili Lewotolok',
    province: 'Nusa Tenggara Timur',
    island: 'Nusa Tenggara',
    lat: -8.2720,
    lon: 123.5050,
    elevation: 1423,
    level: 3, // Siaga
    statusText: 'Level III (Siaga)',
    lastEruption: '2026-09-07 19:18 WITA',
    ashColumnMeters: 1400,
    dangerRadiusKm: 3.0,
    currentAshDirection: 'Tenggara',
    currentAshDirectionDeg: 135,
    activitySummary: 'Erupsi disertai lontaran lava pijar di dalam kawah serta guguran ke arah sektor selatan dan tenggara sejauh 1.000 meter.',
    recommendation: 'Masyarakat tidak beraktivitas dalam radius 3 km dari kawah pusat dan 4 km sektoral selatan-tenggara.'
  },
  {
    id: 'soputan',
    name: 'Gunung Soputan',
    province: 'Sulawesi Utara',
    island: 'Sulawesi',
    lat: 1.1140,
    lon: 124.7260,
    elevation: 1785,
    level: 2, // Waspada
    statusText: 'Level II (Waspada)',
    lastEruption: '2026-05-11 12:00 WITA',
    ashColumnMeters: 500,
    dangerRadiusKm: 1.5,
    currentAshDirection: 'Barat',
    currentAshDirectionDeg: 270,
    activitySummary: 'Emisi gas fumarol putih tipis bertekanan lemah, seismisitas tektonik lokal dan vulkanik dangkal fluktuatif.',
    recommendation: 'Radius bahaya 1.5 km dari puncak.'
  },
  {
    id: 'karangetang',
    name: 'Gunung Karangetang',
    province: 'Sulawesi Utara',
    island: 'Sulawesi',
    lat: 2.7810,
    lon: 125.4070,
    elevation: 1784,
    level: 3, // Siaga
    statusText: 'Level III (Siaga)',
    lastEruption: '2026-09-04 22:30 WITA',
    ashColumnMeters: 1600,
    dangerRadiusKm: 2.5,
    currentAshDirection: 'Barat Daya',
    currentAshDirectionDeg: 220,
    activitySummary: 'Guguran lava pijar aktif mengarah ke Kali Batuawang dan Kahetang sejauh 1.500 m. Sinar api kawah puncak tampak jelas di malam hari.',
    recommendation: 'Masyarakat dilarang mendekati kawah utama dalam radius 2.5 km dan perluasan sektoral 3.5 km arah barat daya.'
  },
  {
    id: 'kelud',
    name: 'Gunung Kelud',
    province: 'Jawa Timur',
    island: 'Jawa',
    lat: -7.9300,
    lon: 112.3080,
    elevation: 1731,
    level: 1, // Normal
    statusText: 'Level I (Normal)',
    lastEruption: '2014-02-13',
    ashColumnMeters: 0,
    dangerRadiusKm: 0,
    currentAshDirection: '-',
    currentAshDirectionDeg: null,
    activitySummary: 'Danau kawah tenang, suhu air stabil, aktivitas vulkanik dalam batas normal.',
    recommendation: 'Kawasan wisata dan perkebunan beroperasi normal.'
  }
];

/**
 * Menghitung koordinat poligon sebaran abu vulkanik (kerucut dispersi)
 * berdasarkan posisi kawah, arah angin/sebaran (derajat), dan kecepatan/jarak jangkauan.
 * 
 * @param {number} lat - Latitude kawah
 * @param {number} lon - Longitude kawah
 * @param {number} windDirectionDeg - Arah tiupan abu (derajat mata angin 0-360)
 * @param {number} distanceKm - Jangkauan proyeksi abu (km)
 * @param {number} spreadAngleDeg - Sudut bukaan kerucut dispersi (default 40°)
 * @returns {Array<[number, number]>} Poligon koordinat [lat, lon]
 */
function calculateAshPlumePolygon(lat, lon, windDirectionDeg, distanceKm = 45, spreadAngleDeg = 40) {
  if (windDirectionDeg === null || windDirectionDeg === undefined) return null;

  const toRad = deg => (deg * Math.PI) / 180;
  const toDeg = rad => (rad * 180) / Math.PI;

  const R = 6371; // Radius bumi dalam km
  const points = [[lat, lon]]; // Titik awal kawah

  const startAngle = windDirectionDeg - spreadAngleDeg / 2;
  const endAngle = windDirectionDeg + spreadAngleDeg / 2;
  const steps = 9;

  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + (i / steps) * (endAngle - startAngle);
    const bearingRad = toRad(angle);

    // Hitung jarak dinamis (kerucut sedikit lonjong di tengah)
    const distFactor = Math.cos(toRad((i - steps / 2) * (spreadAngleDeg / steps)));
    const currentDist = distanceKm * (0.75 + 0.25 * distFactor);

    const latRad = toRad(lat);
    const lonRad = toRad(lon);
    const distRatio = currentDist / R;

    const destLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(distRatio) +
      Math.cos(latRad) * Math.sin(distRatio) * Math.cos(bearingRad)
    );

    const destLonRad = lonRad + Math.atan2(
      Math.sin(bearingRad) * Math.sin(distRatio) * Math.cos(latRad),
      Math.cos(distRatio) - Math.sin(latRad) * Math.sin(destLatRad)
    );

    points.push([toDeg(destLatRad), toDeg(destLonRad)]);
  }

  // Tutup kembali ke kawah
  points.push([lat, lon]);
  return points;
}

window.VOLCANO_DATABASE = VOLCANO_DATABASE;
window.calculateAshPlumePolygon = calculateAshPlumePolygon;
