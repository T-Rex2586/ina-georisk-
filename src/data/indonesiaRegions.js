/**
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
