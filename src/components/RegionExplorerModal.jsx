import React, { useState, useMemo } from 'react';
import {
  X,
  MapPin,
  Building2,
  Layers,
  Search,
  ChevronRight,
  ExternalLink,
  Compass,
  CloudSun,
  ShieldAlert,
  Info
} from 'lucide-react';
import { regionService } from '../services/regionService';

export default function RegionExplorerModal({
  isOpen,
  onClose = () => {},
  onSelectRegion = () => {},
  onOpenWeather = () => {}
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('all');
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('33'); // Default Jawa Tengah
  const [selectedRegencyCode, setSelectedRegencyCode] = useState('3303'); // Default Purbalingga
  const [kecamatanSearch, setKecamatanSearch] = useState('');

  const metadata = useMemo(() => regionService.getMetadata(), []);
  const provinces = useMemo(() => regionService.getAllProvinces(), []);
  const allRegencies = useMemo(() => regionService.getAllRegencies(), []);

  const ISLANDS = ['all', 'Jawa', 'Sumatera', 'Bali & Nusa Tenggara', 'Kalimantan', 'Sulawesi', 'Maluku', 'Papua'];

  // Filter provinsi berdasarkan pulau & pencarian
  const filteredProvinces = useMemo(() => {
    let list = provinces;
    if (selectedIsland !== 'all') {
      list = list.filter(p => p.island === selectedIsland);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [provinces, selectedIsland, searchQuery]);

  // Daftar kabupaten dalam provinsi terpilih
  const currentRegencies = useMemo(() => {
    return regionService.getRegenciesByProvinceCode(selectedProvinceCode);
  }, [selectedProvinceCode]);

  // Detail kabupaten yang sedang dipilih
  const activeRegency = useMemo(() => {
    return regionService.getRegencyByCode(selectedRegencyCode) || currentRegencies[0] || allRegencies[0];
  }, [selectedRegencyCode, currentRegencies, allRegencies]);

  // Filter daftar kecamatan dalam kabupaten aktif
  const filteredKecamatan = useMemo(() => {
    if (!activeRegency || !activeRegency.kecamatanDetail) return [];
    if (!kecamatanSearch.trim()) return activeRegency.kecamatanDetail;
    const q = kecamatanSearch.toLowerCase();
    return activeRegency.kecamatanDetail.filter(k => k.name.toLowerCase().includes(q));
  }, [activeRegency, kecamatanSearch]);

  if (!isOpen) return null;

  const handleFlyTo = (regency, districtName = null) => {
    onSelectRegion({
      ...regency,
      type: 'city',
      districtName: districtName || null
    });
    onClose();
  };

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div
        className="region-explorer-modal"
        onClick={e => e.stopPropagation()}
        style={{
          width: '94vw',
          maxWidth: '1100px',
          maxHeight: '90vh',
          background: 'rgba(11, 17, 33, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(56, 189, 248, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f1f5f9'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.8))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Compass size={20} color="#38bdf8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>
                  Jelajah Data Wilayah Indonesia
                </h3>
                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    fontWeight: 600
                  }}
                >
                  Basis Data Kemendagri / BPS 2012
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                Hirarki Administratif Lengkap: <strong>34 Provinsi</strong> • <strong>514 Kabupaten & Kota</strong> • <strong>7.093 Kecamatan</strong> • <strong>82.043 Desa</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              padding: 6,
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Tutup Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            padding: '10px 20px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap'
          }}
        >
          {/* Island Filter Pills */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {ISLANDS.map(isl => (
              <button
                key={isl}
                onClick={() => {
                  setSelectedIsland(isl);
                  const firstInIsland = provinces.find(p => isl === 'all' || p.island === isl);
                  if (firstInIsland) setSelectedProvinceCode(firstInIsland.code);
                }}
                style={{
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 12,
                  border: '1px solid',
                  borderColor: selectedIsland === isl ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
                  background: selectedIsland === isl ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: selectedIsland === isl ? '#38bdf8' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: selectedIsland === isl ? 600 : 400
                }}
              >
                {isl === 'all' ? 'Semua Pulau' : isl}
              </button>
            ))}
          </div>

          {/* Quick Search Input */}
          <div
            style={{
              position: 'relative',
              width: 260
            }}
          >
            <Search size={13} style={{ position: 'absolute', left: 10, top: 9, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Saring nama provinsi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 8,
                padding: '6px 10px 6px 30px',
                color: '#fff',
                fontSize: 12,
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* 3-Column Hierarchical Explorer */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '260px 320px 1fr',
            overflow: 'hidden',
            minHeight: 460
          }}
        >
          {/* Kolom 1: Daftar Provinsi */}
          <div
            style={{
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              overflowY: 'auto',
              background: 'rgba(15, 23, 42, 0.4)',
              padding: '8px'
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', padding: '6px 8px', textTransform: 'uppercase' }}>
              Provinsi ({filteredProvinces.length})
            </div>
            {filteredProvinces.map(prov => {
              const isSelected = prov.code === selectedProvinceCode;
              const regList = regionService.getRegenciesByProvinceCode(prov.code);
              return (
                <div
                  key={prov.code}
                  onClick={() => {
                    setSelectedProvinceCode(prov.code);
                    if (regList.length > 0) {
                      setSelectedRegencyCode(regList[0].code);
                    }
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    marginBottom: 4,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    border: '1px solid',
                    borderColor: isSelected ? 'rgba(56, 189, 248, 0.4)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: isSelected ? 600 : 500, color: isSelected ? '#38bdf8' : '#e2e8f0' }}>
                      {prov.name}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#64748b' }}>
                      {prov.island} • {regList.length} Kab/Kota
                    </div>
                  </div>
                  {isSelected && <ChevronRight size={14} color="#38bdf8" />}
                </div>
              );
            })}
          </div>

          {/* Kolom 2: Daftar Kabupaten & Kota */}
          <div
            style={{
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              overflowY: 'auto',
              background: 'rgba(15, 23, 42, 0.25)',
              padding: '8px'
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', padding: '6px 8px', textTransform: 'uppercase' }}>
              Kabupaten & Kota ({currentRegencies.length})
            </div>
            {currentRegencies.map(reg => {
              const isSelected = reg.code === activeRegency?.code;
              return (
                <div
                  key={reg.code}
                  onClick={() => setSelectedRegencyCode(reg.code)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    marginBottom: 4,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid',
                    borderColor: isSelected ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 9.5,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: reg.type === 'kota' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                          color: reg.type === 'kota' ? '#38bdf8' : '#c084fc',
                          fontWeight: 600
                        }}
                      >
                        {reg.type === 'kota' ? 'KOTA' : 'KAB'}
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: isSelected ? 600 : 500, color: isSelected ? '#fff' : '#cbd5e1' }}>
                        {reg.simpleName}
                      </span>
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                      Ibukota: {reg.capital} • {reg.kecamatanCount} Kec • {reg.desaCount} Desa
                    </div>
                  </div>
                  {isSelected && <ChevronRight size={14} color="#c084fc" />}
                </div>
              );
            })}
          </div>

          {/* Kolom 3: Detail Wilayah Terpilih & Daftar Kecamatan */}
          {activeRegency && (
            <div
              style={{
                overflowY: 'auto',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14
              }}
            >
              {/* Header Info Box */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: '14px 16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase' }}>
                      {activeRegency.province} • Pulau {activeRegency.island}
                    </div>
                    <h2 style={{ margin: '4px 0 2px 0', fontSize: 20, color: '#fff' }}>
                      {activeRegency.name}
                    </h2>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      Ibukota Administratif: <strong style={{ color: '#fff' }}>{activeRegency.capital}</strong> • Koordinat: {activeRegency.lat.toFixed(4)}°, {activeRegency.lon.toFixed(4)}°
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleFlyTo(activeRegency)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                        border: 'none',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
                      }}
                    >
                      <MapPin size={13} />
                      <span>Lihat di Peta</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenWeather(activeRegency);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        color: '#38bdf8',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <CloudSun size={13} />
                      <span>Studio Cuaca</span>
                    </button>
                  </div>
                </div>

                {/* Stat Badges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>Kode BPS</span>
                    <strong style={{ fontSize: 13, color: '#f1f5f9' }}>{activeRegency.code}</strong>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>Kode Kemendagri</span>
                    <strong style={{ fontSize: 13, color: '#f1f5f9' }}>{activeRegency.kemendagriCode}</strong>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>Total Kecamatan</span>
                    <strong style={{ fontSize: 13, color: '#c084fc' }}>{activeRegency.kecamatanCount} Kec</strong>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>Total Desa/Kel</span>
                    <strong style={{ fontSize: 13, color: '#34d399' }}>{activeRegency.desaCount} Desa</strong>
                  </div>
                </div>
              </div>

              {/* Daftar Kecamatan */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Layers size={14} color="#a855f7" />
                    <h4 style={{ margin: 0, fontSize: 13.5, color: '#fff', fontWeight: 600 }}>
                      Daftar Kecamatan di {activeRegency.name} ({activeRegency.kecamatanCount})
                    </h4>
                  </div>

                  <input
                    type="text"
                    placeholder="Saring kecamatan..."
                    value={kecamatanSearch}
                    onChange={e => setKecamatanSearch(e.target.value)}
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 6,
                      padding: '4px 8px',
                      color: '#fff',
                      fontSize: 11,
                      width: 160,
                      outline: 'none'
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 6,
                    maxHeight: 220,
                    overflowY: 'auto',
                    paddingRight: 4
                  }}
                >
                  {filteredKecamatan.map((kec, idx) => (
                    <div
                      key={kec.code || idx}
                      onClick={() => handleFlyTo(activeRegency, kec.name)}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                    >
                      <span style={{ fontSize: 11.5, color: '#e2e8f0' }}>{kec.name}</span>
                      <span style={{ fontSize: 9.5, color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', padding: '1px 5px', borderRadius: 4 }}>
                        {kec.desaCount} Desa
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
