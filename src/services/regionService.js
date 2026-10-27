/**
 * Layanan Informasi Wilayah Administratif Indonesia (Region Service)
 * Mengelola data hirarkis 34 Provinsi, 514 Kabupaten/Kota, 7.093 Kecamatan, 82.043 Desa (Data 2012)
 */

import {
  PROVINCES_DATABASE,
  INDONESIA_CITIES,
  KECAMATAN_LOOKUP,
  REGION_METADATA
} from '../data/cities.js';

export class RegionService {
  constructor() {
    this.provinces = PROVINCES_DATABASE || [];
    this.regencies = INDONESIA_CITIES || [];
    this.kecamatanLookup = KECAMATAN_LOOKUP || [];
    this.metadata = REGION_METADATA || {};

    // Map untuk akses instan O(1)
    this.regencyByCode = new Map();
    this.regenciesByProvince = new Map();

    this.regencies.forEach(r => {
      this.regencyByCode.set(r.code, r);
      if (!this.regenciesByProvince.has(r.provinceCode)) {
        this.regenciesByProvince.set(r.provinceCode, []);
      }
      this.regenciesByProvince.get(r.provinceCode).push(r);
    });
  }

  /**
   * Mengambil metadata ringkasan dataset
   */
  getMetadata() {
    return {
      ...this.metadata,
      provincesCount: this.provinces.length,
      regenciesCount: this.regencies.length,
      districtsCount: this.kecamatanLookup.length
    };
  }

  /**
   * Mengambil seluruh 34 provinsi
   */
  getAllProvinces() {
    return this.provinces;
  }

  /**
   * Mengambil seluruh 514 kabupaten & kota
   */
  getAllRegencies() {
    return this.regencies;
  }

  /**
   * Mengambil daftar kabupaten/kota dalam suatu provinsi
   */
  getRegenciesByProvinceCode(provCode) {
    return this.regenciesByProvince.get(String(provCode)) || [];
  }

  /**
   * Mengambil detail kabupaten/kota berdasarkan kode BPS (misal '1101') atau ID
   */
  getRegencyByCode(codeOrId) {
    if (!codeOrId) return null;
    const clean = String(codeOrId).replace(/^kab_/, '');
    return this.regencyByCode.get(clean) || this.regencies.find(r => r.id === codeOrId) || null;
  }

  /**
   * Mengambil kelompok pulau beserta statistik wilayahnya
   */
  getIslandSummary() {
    const islands = {};
    this.regencies.forEach(r => {
      const isl = r.island || 'Indonesia';
      if (!islands[isl]) {
        islands[isl] = {
          name: isl,
          regencyCount: 0,
          kecamatanCount: 0,
          desaCount: 0,
          regencies: []
        };
      }
      islands[isl].regencyCount++;
      islands[isl].kecamatanCount += (r.kecamatanCount || 0);
      islands[isl].desaCount += (r.desaCount || 0);
      islands[isl].regencies.push(r);
    });
    return Object.values(islands);
  }

  /**
   * Pencarian terpadu multi-level (Kabupaten/Kota, Kecamatan, dan Provinsi)
   * Mendukung autocomplete di header dan modal navigasi
   */
  search(query, { maxRegencies = 8, maxKecamatan = 6 } = {}) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return { regencies: [], kecamatan: [] };

    // 1. Cari di level Kabupaten & Kota
    const matchedRegencies = this.regencies.filter(r => {
      return (
        r.name.toLowerCase().includes(q) ||
        (r.simpleName && r.simpleName.toLowerCase().includes(q)) ||
        (r.capital && r.capital.toLowerCase().includes(q)) ||
        r.province.toLowerCase().includes(q)
      );
    }).slice(0, maxRegencies);

    // 2. Cari di level Kecamatan (7.093 kecamatan)
    let matchedKecamatan = [];
    if (q.length >= 2) {
      const hits = [];
      for (const k of this.kecamatanLookup) {
        if (k.kecName.toLowerCase().includes(q)) {
          hits.push(k);
          if (hits.length >= maxKecamatan) break;
        }
      }
      matchedKecamatan = hits;
    }

    return {
      regencies: matchedRegencies,
      kecamatan: matchedKecamatan
    };
  }
}

export const regionService = new RegionService();
export default regionService;
