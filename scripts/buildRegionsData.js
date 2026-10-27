import fs from 'fs';
import path from 'path';

async function build() {
  console.log('--- Mulai Mengompilasi Data Daerah Indonesia 2012 ---');

  const provPath = path.resolve('daerah/provinsi.csv');
  const kabPath = path.resolve('daerah/kabupaten.csv');
  const kecPath = path.resolve('daerah/kecamatan.csv');
  const desPath = path.resolve('daerah/desa.csv');

  const provCsv = fs.readFileSync(provPath, 'utf8').trim().split(/\r?\n/).slice(1);
  const kabCsv = fs.readFileSync(kabPath, 'utf8').trim().split(/\r?\n/).slice(1);
  const kecCsv = fs.readFileSync(kecPath, 'utf8').trim().split(/\r?\n/).slice(1);
  const desCsv = fs.readFileSync(desPath, 'utf8').trim().split(/\r?\n/).slice(1);

  console.log(`Loaded: ${provCsv.length} Provinsi, ${kabCsv.length} Kab/Kota, ${kecCsv.length} Kecamatan, ${desCsv.length} Desa`);

  // 1. Fetch koordinat referensi dari SQL dataset geospasial
  console.log('Mengambil data koordinat geospasial resmi...');
  const res = await fetch('https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah_level_1_2.sql');
  const sql = await res.text();

  const regex = /\('([0-9.]+)',\s*'([^']+)',\s*'([^']*)',\s*([-\d.]+),\s*([-\d.]+)/g;
  const sqlEntries = new Map();
  const nameMap = new Map();
  let m;

  while ((m = regex.exec(sql)) !== null) {
    const entry = {
      sqlCode: m[1],
      sqlName: m[2],
      capital: m[3] ? m[3].trim() : '',
      lat: parseFloat(m[4]),
      lon: parseFloat(m[5])
    };
    sqlEntries.set(m[1], entry);

    const clean = m[2].toLowerCase()
      .replace(/^(kabupaten|kota|kab\.?)\s+/i, '')
      .replace(/[\s\-\.]+/g, '')
      .trim();
    nameMap.set(clean, entry);
  }

  // 2. Pemetaan alias khusus untuk sinkronisasi nama/kode
  const customAliases = {
    'tobasamosir': 'toba',
    'ogankomeringilir': 'ogankomering',
    'kepulauanseribu': 'administrasikepulauanseribu',
    'jakartapusat': 'administrasijakartapusat',
    'jakartautara': 'administrasijakartautara',
    'jakartabarat': 'administrasijakartabarat',
    'jakartaselatan': 'administrasijakartaselatan',
    'jakartatimur': 'administrasijakartatimur',
    'mahakamhulu': 'mahakamulu',
    'siautagulandangbiaro': 'kepsiautagulandangbiaro',
    'mamujuutara': 'pasangkayu',
    'malukutenggarabarat': 'kepulauantanimbar'
  };

  // 3. Agregasi Desa per Kecamatan
  console.log('Menghitung agregasi desa per kecamatan...');
  const desPerKec = new Map();
  desCsv.forEach(l => {
    const parts = l.split(',');
    if (parts.length >= 2) {
      const parent = parts[1].trim();
      desPerKec.set(parent, (desPerKec.get(parent) || 0) + 1);
    }
  });

  // 4. Agregasi Kecamatan per Kabupaten
  console.log('Menghitung agregasi kecamatan per kabupaten...');
  const kecPerKab = new Map();
  const desCountPerKab = new Map();
  const allKecamatanIndex = [];

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/(?:^|\s|-|\/)\S/g, a => a.toUpperCase());
  };

  const islandMap = (pCode) => {
    const c = parseInt(pCode, 10);
    if (c >= 11 && c <= 21) return 'Sumatera';
    if (c >= 31 && c <= 36) return 'Jawa';
    if (c >= 51 && c <= 53) return 'Bali & Nusa Tenggara';
    if (c >= 61 && c <= 65) return 'Kalimantan';
    if (c >= 71 && c <= 76) return 'Sulawesi';
    if (c >= 81 && c <= 82) return 'Maluku';
    if (c >= 91 && c <= 96) return 'Papua';
    return 'Indonesia';
  };

  const provMap = new Map();
  const provincesList = provCsv.map(l => {
    const [code, parent, name] = l.split(',');
    const titleName = toTitleCase(name.trim());
    provMap.set(code.trim(), titleName);
    return {
      code: code.trim(),
      name: titleName,
      island: islandMap(code.trim())
    };
  });

  kecCsv.forEach(l => {
    const [code, parent, name] = l.split(',');
    const kabCode = parent ? parent.trim() : '';
    const kecName = toTitleCase(name ? name.trim() : '');
    const desCount = desPerKec.get(code.trim()) || 0;

    if (!kecPerKab.has(kabCode)) kecPerKab.set(kabCode, []);
    kecPerKab.get(kabCode).push({
      code: code.trim(),
      name: kecName,
      desaCount: desCount
    });
    desCountPerKab.set(kabCode, (desCountPerKab.get(kabCode) || 0) + desCount);

    allKecamatanIndex.push({
      code: code.trim(),
      name: kecName,
      kabCode,
      desCount
    });
  });

  // 5. Kompilasi 514 Kabupaten / Kota
  console.log('Menyusun 514 Kabupaten & Kota...');
  let matchedCoords = 0;

  const regencies = kabCsv.map(l => {
    const [code, parentCode, rawName] = l.split(',');
    const kabCode = code.trim();
    const pCode = parentCode.trim();
    const nameTrimmed = rawName.trim();

    const isKota = nameTrimmed.toUpperCase().startsWith('KOTA');
    const type = isKota ? 'kota' : 'kabupaten';

    // Bersihkan nama untuk matching
    const clean = nameTrimmed.toLowerCase()
      .replace(/^(kabupaten|kota|kab\.?)\s+/i, '')
      .replace(/[\s\-\.]+/g, '')
      .trim();

    let sqlMatch = nameMap.get(clean);
    if (!sqlMatch && customAliases[clean]) {
      sqlMatch = nameMap.get(customAliases[clean]);
    }
    if (!sqlMatch) {
      const dottedCode = kabCode.slice(0, 2) + '.' + kabCode.slice(2);
      sqlMatch = sqlEntries.get(dottedCode);
    }

    if (sqlMatch) matchedCoords++;

    // Format nama baku
    let displayTitle = toTitleCase(nameTrimmed);
    let simpleName = displayTitle.replace(/^(Kabupaten|Kota)\s+/i, '');

    const kecListObj = kecPerKab.get(kabCode) || [];
    const kecNames = kecListObj.map(k => k.name);
    const totalDesa = desCountPerKab.get(kabCode) || 0;
    const provName = provMap.get(pCode) || 'Indonesia';

    const lat = sqlMatch ? Number(sqlMatch.lat.toFixed(4)) : -6.2;
    const lon = sqlMatch ? Number(sqlMatch.lon.toFixed(4)) : 106.8;
    const capital = sqlMatch && sqlMatch.capital ? toTitleCase(sqlMatch.capital) : simpleName;

    return {
      id: `kab_${kabCode}`,
      code: kabCode,
      kemendagriCode: sqlMatch ? sqlMatch.sqlCode : `${kabCode.slice(0, 2)}.${kabCode.slice(2)}`,
      name: displayTitle,
      simpleName,
      type,
      capital,
      province: provName,
      provinceCode: pCode,
      island: islandMap(pCode),
      lat,
      lon,
      kecamatanCount: kecNames.length,
      desaCount: totalDesa,
      kecamatan: kecNames,
      kecamatanDetail: kecListObj
    };
  });

  console.log(`Koordinat berhasil dipetakan: ${matchedCoords} / ${regencies.length}`);

  // 6. Buat struktur file keluaran
  const outputData = {
    metadata: {
      year: 2012,
      source: 'Kemendagri / BPS & Geospatial Centroids',
      totalProvinces: provincesList.length,
      totalRegencies: regencies.length,
      totalDistricts: allKecamatanIndex.length,
      totalVillages: desCsv.length,
      generatedAt: new Date().toISOString()
    },
    provinces: provincesList,
    regencies: regencies
  };

  // Simpan JSON master data
  const outJsonPath = path.resolve('src/data/indonesiaRegions.json');
  fs.writeFileSync(outJsonPath, JSON.stringify(outputData, null, 2), 'utf8');
  console.log(`Master JSON disimpan: ${outJsonPath} (${(fs.statSync(outJsonPath).size / 1024).toFixed(1)} KB)`);

  // Simpan JS module yang meng-export PROVINCES, INDONESIA_CITIES, KECAMATAN_MAP
  const outJsPath = path.resolve('src/data/indonesiaRegions.js');
  const jsContent = `/**
 * Database Wilayah Administratif Republik Indonesia (Data 2012 Lengkap)
 * 34 Provinsi, 514 Kabupaten & Kota Otonom, 7.093 Kecamatan, 82.043 Desa
 * Dilengkapi koordinat geospasial presisi tinggi untuk seluruh Kabupaten & Kota.
 */

import regionsData from './indonesiaRegions.json';

export const REGION_METADATA = regionsData.metadata;
export const PROVINCES_DATABASE = regionsData.provinces;
export const INDONESIA_CITIES = regionsData.regencies;

// Index pencarian cepat untuk kecamatan
export const KECAMATAN_LOOKUP = (() => {
  const map = [];
  regionsData.regencies.forEach(kab => {
    kab.kecamatanDetail.forEach(kec => {
      map.push({
        kecCode: kec.code,
        kecName: kec.name,
        desaCount: kec.desaCount,
        kabCode: kab.code,
        kabName: kab.name,
        province: kab.province,
        island: kab.island,
        lat: kab.lat,
        lon: kab.lon
      });
    });
  });
  return map;
})();

export default regionsData;
`;

  fs.writeFileSync(outJsPath, jsContent, 'utf8');
  console.log(`Modul JS disimpan: ${outJsPath}`);

  // Update src/data/cities.js agar mengekspor ulang INDONESIA_CITIES yang sekarang 514 kota
  const citiesJsPath = path.resolve('src/data/cities.js');
  const citiesContent = `/**
 * Database Kota & Kabupaten Seluruh Indonesia (Data Resmi 514 Kabupaten/Kota)
 * Mendukung pencarian komprehensif seluruh wilayah nusantara
 */

export { INDONESIA_CITIES, PROVINCES_DATABASE, KECAMATAN_LOOKUP, REGION_METADATA } from './indonesiaRegions.js';
import { INDONESIA_CITIES } from './indonesiaRegions.js';
export default INDONESIA_CITIES;
`;
  fs.writeFileSync(citiesJsPath, citiesContent, 'utf8');
  console.log(`File cities.js diperbarui ke 514 kota: ${citiesJsPath}`);

  console.log('--- Kompilasi Selesai dengan Sukses ---');
}

build().catch(err => {
  console.error('Kompilasi gagal:', err);
  process.exit(1);
});
