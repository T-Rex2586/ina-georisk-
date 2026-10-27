import React, { useState, useEffect } from 'react';
import {
  X,
  Navigation,
  Wind,
  AlertTriangle,
  ShieldCheck,
  Flame,
  MapPin,
  Thermometer,
  Droplets,
  CloudSun,
  CloudRain,
  Sun,
  CloudLightning,
  Zap,
  Umbrella,
  ExternalLink,
  Building2,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CONFIG } from '../config/constants';

export default function InspectorDrawer({
  isOpen,
  onClose,
  selectedItem,
  onFocusMap,
  windService,
  weatherService,
  volcanoes = [],
  hotspots = [],
  onOpenWeatherModal = () => {}
}) {
  const [localWeather, setLocalWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [showKecList, setShowKecList] = useState(false);

  useEffect(() => {
    if (!isOpen || !selectedItem || !weatherService) {
      setLocalWeather(null);
      return;
    }

    const { data } = selectedItem;
    if (!data || data.lat === undefined || data.lon === undefined) return;

    let isMounted = true;
    setLoadingWeather(true);

    weatherService.getForecast(data.lat, data.lon, data.name)
      .then(res => {
        if (isMounted) {
          setLocalWeather(res);
          setLoadingWeather(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingWeather(false);
      });

    return () => { isMounted = false; };
  }, [isOpen, selectedItem, weatherService]);

  if (!isOpen || !selectedItem) return null;

  const { type, data } = selectedItem;

  // Hitung kedekatan gunung api aktif dari koordinat kota
  const getNearbyVolcanoes = (lat, lon, maxDistKm = 120) => {
    return volcanoes.map(v => {
      const dist = Math.hypot(v.lat - lat, (v.lon - lon) * Math.cos((lat * Math.PI) / 180)) * 111.32;
      return { ...v, distKm: Math.round(dist) };
    }).filter(v => v.distKm <= maxDistKm).sort((a, b) => a.distKm - b.distKm);
  };

  // Hitung jumlah hotspot di sekitar kota
  const getNearbyHotspots = (lat, lon, maxDistKm = 80) => {
    return hotspots.filter(h => {
      const dist = Math.hypot(h.lat - lat, (h.lon - lon) * Math.cos((lat * Math.PI) / 180)) * 111.32;
      return dist <= maxDistKm;
    });
  };

  return (
    <aside className={`inspector-drawer ${isOpen ? 'open' : ''}`}>
      <div className="inspector-header">
        <div className="inspector-header-title">
          <Navigation size={15} color="#38bdf8" />
          <h3>Intelijen Lingkungan & Risiko Wilayah</h3>
        </div>
        <button className="btn-close" onClick={onClose} title="Tutup">
          <X size={16} />
        </button>
      </div>

      <div className="inspector-content">
        {/* Tipe 1: KOTA (Hasil Pencarian Kota) */}
        {type === 'city' && (() => {
          const localWind = windService ? windService.getWindAtLocation(data.lat, data.lon) : { speedKmH: 12, directionDeg: 220, cardinalDirection: 'Barat Daya' };
          const nearbyVolc = getNearbyVolcanoes(data.lat, data.lon);
          const nearbyHot = getNearbyHotspots(data.lat, data.lon);
          const aqi = data.aqi || 68;
          const aqiCat = aqi <= 50 ? { label: 'Baik', color: '#10b981' } : aqi <= 100 ? { label: 'Sedang', color: '#38bdf8' } : aqi <= 150 ? { label: 'Sensitif', color: '#facc15' } : { label: 'Tidak Sehat', color: '#f97316' };

          return (
            <>
              <div className="inspector-section hero-section">
                <div className="badge-status" style={{ background: `${aqiCat.color}25`, color: aqiCat.color, border: `1px solid ${aqiCat.color}60` }}>
                  Kualitas Udara: {aqiCat.label} (AQI {aqi})
                </div>
                <h2 style={{ color: '#fff', margin: '8px 0 3px 0', fontSize: 20 }}>{data.name}</h2>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {data.province} ({data.island}) • {data.lat.toFixed(3)}°, {data.lon.toFixed(3)}°
                </div>
              </div>

              {/* Profil Wilayah Administratif 2012 */}
              {(data.code || data.kecamatanCount) && (
                <div className="inspector-section" style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div className="section-title-between">
                    <h4 className="section-title" style={{ margin: 0 }}>
                      <Building2 size={13} color="#38bdf8" />
                      <span>Data Wilayah Administratif</span>
                    </h4>
                    <span style={{ fontSize: 10, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                      BPS / Kemendagri 2012
                    </span>
                  </div>

                  <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>Kode BPS / Kemendagri</span>
                      <strong style={{ fontSize: 11.5, color: '#f1f5f9' }}>{data.code || '-'} {data.kemendagriCode ? `(${data.kemendagriCode})` : ''}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>Ibukota / Pusat</span>
                      <strong style={{ fontSize: 11.5, color: '#f1f5f9' }}>{data.capital || data.simpleName || '-'}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>Kecamatan</span>
                      <strong style={{ fontSize: 11.5, color: '#c084fc' }}>{data.kecamatanCount || (data.kecamatan ? data.kecamatan.length : 0)} Kecamatan</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>Desa / Kelurahan</span>
                      <strong style={{ fontSize: 11.5, color: '#34d399' }}>{data.desaCount || 0} Desa/Kel</strong>
                    </div>
                  </div>

                  {data.districtName && (
                    <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: 6, fontSize: 11, color: '#e9d5ff' }}>
                      📍 <strong>Fokus Pencarian:</strong> Kecamatan {data.districtName}
                    </div>
                  )}

                  {data.kecamatan && data.kecamatan.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        onClick={() => setShowKecList(!showKecList)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#94a3b8',
                          padding: '5px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        <span>Daftar {data.kecamatan.length} Kecamatan</span>
                        {showKecList ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {showKecList && (
                        <div style={{
                          marginTop: 6,
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 4,
                          maxHeight: 140,
                          overflowY: 'auto',
                          padding: 6,
                          background: 'rgba(0,0,0,0.25)',
                          borderRadius: 6,
                          border: '1px solid rgba(255,255,255,0.06)'
                        }}>
                          {data.kecamatan.map((kec, i) => {
                            const isMatch = data.districtName && data.districtName.toLowerCase() === kec.toLowerCase();
                            return (
                              <span
                                key={i}
                                style={{
                                  fontSize: 10,
                                  padding: '2px 7px',
                                  borderRadius: 10,
                                  background: isMatch ? 'rgba(168, 85, 247, 0.35)' : 'rgba(255,255,255,0.06)',
                                  color: isMatch ? '#f3e8ff' : '#cbd5e1',
                                  border: isMatch ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.08)'
                                }}
                              >
                                {kec}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Ramalan Cuaca Kota Terintegrasi */}
              <div className="inspector-section weather-quick-card">
                <div className="section-title-between">
                  <h4 className="section-title" style={{ margin: 0 }}>
                    <CloudSun size={13} color="#38bdf8" />
                    <span>Prakiraan Cuaca Terkini</span>
                  </h4>
                  <button
                    className="btn-text-link"
                    onClick={() => onOpenWeatherModal(data)}
                  >
                    Studio Cuaca 7 Hari <ExternalLink size={10} />
                  </button>
                </div>

                {loadingWeather ? (
                  <div style={{ fontSize: 11, color: '#94a3b8', padding: '8px 0' }}>Memuat data cuaca satelit...</div>
                ) : localWeather ? (
                  <div className="weather-inspector-body">
                    <div className="weather-row-summary">
                      <div className="w-temp-box">
                        <span className="w-val-big">{localWeather.current.temp}°C</span>
                        <span className="w-sub">Terasa {localWeather.current.feelsLike}°C</span>
                      </div>
                      <div className="w-condition-pill" style={{ color: localWeather.current.weatherColor, background: `${localWeather.current.weatherColor}18` }}>
                        {localWeather.current.weatherLabel}
                      </div>
                    </div>

                    <div className="weather-mini-metrics">
                      <div className="mini-metric">
                        <Droplets size={11} color="#38bdf8" />
                        <span>Lembap: {localWeather.current.humidity}%</span>
                      </div>
                      <div className="mini-metric">
                        <Wind size={11} color="#06b6d4" />
                        <span>Angin: {localWeather.current.windSpeed} km/j</span>
                      </div>
                      <div className="mini-metric">
                        <Umbrella size={11} color="#f59e0b" />
                        <span>Peluang Hujan: {localWeather.hourly[0]?.pop || 20}%</span>
                      </div>
                    </div>

                    {localWeather.hazards && localWeather.hazards.filter(h => !h.id.includes('lahar') || nearbyVolc.length > 0).length > 0 && (() => {
                      const activeHazard = localWeather.hazards.filter(h => !h.id.includes('lahar') || nearbyVolc.length > 0)[0];
                      return (
                        <div className="weather-mini-alert" style={{ borderLeftColor: activeHazard.color }}>
                          <strong>{activeHazard.badge}:</strong> {activeHazard.title}
                        </div>
                      );
                    })()}
                  </div>
                ) : null}
              </div>

              {/* Dinamika Cuaca & Angin Kota */}
              <div className="inspector-section">
                <h4 className="section-title">
                  <Wind size={13} color="#38bdf8" />
                  <span>Dinamika Angin & Atmosfer</span>
                </h4>
                <div className="info-grid">
                  <div className="info-box">
                    <span className="label">Arah Angin</span>
                    <span className="val" style={{ color: '#38bdf8' }}>{localWind.cardinalDirection} ({localWind.directionDeg}°)</span>
                  </div>
                  <div className="info-box">
                    <span className="label">Kecepatan Angin</span>
                    <span className="val">{localWind.speedKmH} km/jam</span>
                  </div>
                  <div className="info-box">
                    <span className="label">Konsentrasi PM2.5</span>
                    <span className="val" style={{ color: aqiCat.color }}>{data.pollutants?.pm2_5?.value || Math.round(aqi * 0.45)} µg/m³</span>
                  </div>
                  <div className="info-box">
                    <span className="label">ISPU Indonesia</span>
                    <span className="val">{data.ispu || Math.round(aqi * 0.9)}</span>
                  </div>
                </div>
              </div>

              {/* Pemantauan Ancaman Sekitar Kota */}
              <div className="inspector-section">
                <h4 className="section-title">
                  <AlertTriangle size={13} color="#f97316" />
                  <span>Analisis Paparan Risiko Sekitar</span>
                </h4>

                {nearbyVolc.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600 }}>Gunung Api Terdekat:</span>
                    {nearbyVolc.slice(0, 2).map(v => (
                      <div key={v.id} className="risk-proximity-item">
                        <div>
                          <strong>{v.name}</strong>
                          <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>Jarak ±{v.distKm} km • {v.statusText}</span>
                        </div>
                        <span className="proximity-badge" style={{ color: CONFIG.VOLCANO_LEVELS[v.level]?.color }}>
                          {v.level >= 3 ? 'Waspada Sebaran Abu' : 'Aman'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                    Tidak ada gunung api aktif dalam radius 120 km.
                  </div>
                )}

                <div className="hotspot-proximity-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Flame size={14} color="#f97316" />
                    <span style={{ fontSize: 11.5, color: '#fff', fontWeight: 600 }}>
                      Deteksi Titik Panas Hotspot Sekitar
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 4 }}>
                    Terdeteksi <strong>{nearbyHot.length} hotspot</strong> satelit aktif dalam radius 80 km kota ini.
                  </div>
                </div>
              </div>

              <button
                className="btn-primary-block"
                onClick={() => onFocusMap(data.lat, data.lon, 11)}
              >
                <MapPin size={15} />
                <span>Fokuskan Titik Kota di Peta</span>
              </button>
            </>
          );
        })()}

        {/* Tipe 2: GUNUNG API */}
        {type === 'volcano' && (() => {
          const level = CONFIG.VOLCANO_LEVELS[data.level];
          const localWind = windService ? windService.getWindAtLocation(data.lat, data.lon) : { speedKmH: 15, directionDeg: 120, cardinalDirection: 'Tenggara' };

          return (
            <>
              <div className="inspector-section hero-section">
                <div
                  className="badge-status"
                  style={{
                    background: level?.bgLight,
                    color: level?.color,
                    border: `1px solid ${level?.color}60`
                  }}
                >
                  {data.statusText}
                </div>
                <h2 style={{ color: '#fff', margin: '8px 0 3px 0', fontSize: 20 }}>{data.name}</h2>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {data.province} ({data.island}) • Elevasi {data.elevation} mdpl
                </div>
              </div>

              {/* Ramalan Cuaca Puncak & Lereng Gunung */}
              <div className="inspector-section weather-quick-card">
                <div className="section-title-between">
                  <h4 className="section-title" style={{ margin: 0 }}>
                    <CloudSun size={13} color="#38bdf8" />
                    <span>Cuaca Kawah & Puncak</span>
                  </h4>
                  <button
                    className="btn-text-link"
                    onClick={() => onOpenWeatherModal(data)}
                  >
                    Prakiraan 7 Hari <ExternalLink size={10} />
                  </button>
                </div>

                {loadingWeather ? (
                  <div style={{ fontSize: 11, color: '#94a3b8', padding: '8px 0' }}>Memuat kondisi atmosfer kawah...</div>
                ) : localWeather ? (
                  <div className="weather-inspector-body">
                    <div className="weather-row-summary">
                      <div className="w-temp-box">
                        <span className="w-val-big">{localWeather.current.temp}°C</span>
                        <span className="w-sub">Kawah Elevasi Tinggi</span>
                      </div>
                      <div className="w-condition-pill" style={{ color: localWeather.current.weatherColor, background: `${localWeather.current.weatherColor}18` }}>
                        {localWeather.current.weatherLabel}
                      </div>
                    </div>

                    {localWeather.hazards && localWeather.hazards.length > 0 && (
                      <div className="weather-mini-alert" style={{ borderLeftColor: localWeather.hazards[0].color, marginTop: 8 }}>
                        <strong>{localWeather.hazards[0].badge}:</strong> {localWeather.hazards[0].desc}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="inspector-section">
                <h4 className="section-title">
                  <Flame size={13} color="#f97316" />
                  <span>Aktivitas Letusan & Kolom Abu</span>
                </h4>
                <div className="info-grid">
                  <div className="info-box">
                    <span className="label">Erupsi Terakhir</span>
                    <span className="val">{data.lastEruption}</span>
                  </div>
                  <div className="info-box">
                    <span className="label">Tinggi Kolom Abu</span>
                    <span className="val" style={{ color: level?.color }}>{data.ashColumnMeters} m</span>
                  </div>
                  <div className="info-box">
                    <span className="label">Arah Sebaran Abu</span>
                    <span className="val">{data.currentAshDirection}</span>
                  </div>
                  <div className="info-box">
                    <span className="label">Radius Bahaya</span>
                    <span className="val" style={{ color: '#ef4444' }}>{data.dangerRadiusKm} km</span>
                  </div>
                </div>
                <p style={{ fontSize: 11.5, color: '#cbd5e1', lineHeight: 1.5, marginTop: 8 }}>
                  {data.activitySummary}
                </p>
              </div>

              <div className="inspector-section">
                <h4 className="section-title">
                  <Wind size={13} color="#38bdf8" />
                  <span>Korelasi Angin & Jalur Hujan Abu</span>
                </h4>
                <div className="wind-correlation-box">
                  <div><strong>Kecepatan Angin Puncak:</strong> {localWind.speedKmH} km/jam</div>
                  <div><strong>Arah Tiupan:</strong> {localWind.cardinalDirection} ({localWind.directionDeg}°)</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    Tiupan angin ini mendorong partikulat abu vulkanik condong ke sektor {data.currentAshDirection}. Kawasan permukiman di jalur ini diimbau bersiap menghadapi potensi hujan abu.
                  </div>
                </div>
              </div>

              <div className="inspector-section">
                <h4 className="section-title">
                  <ShieldCheck size={13} color="#10b981" />
                  <span>Rekomendasi PVMBG & BPBD</span>
                </h4>
                <div className="advisory-box" style={{ borderLeft: `3px solid ${level?.color}` }}>
                  {data.recommendation}
                </div>
              </div>

              <button
                className="btn-primary-block"
                onClick={() => onFocusMap(data.lat, data.lon, 10)}
              >
                <Flame size={15} />
                <span>Fokuskan Posisi Kawah di Peta</span>
              </button>
            </>
          );
        })()}

        {/* Tipe 3: CUACA REGIONAL (Klik Marker Cuaca) */}
        {type === 'weather' && (() => {
          const cur = data.current || {};
          return (
            <>
              <div className="inspector-section hero-section">
                <div
                  className="badge-status"
                  style={{
                    background: `${cur.weatherColor}25`,
                    color: cur.weatherColor,
                    border: `1px solid ${cur.weatherColor}60`
                  }}
                >
                  {cur.weatherLabel} • Suhu {cur.temp}°C
                </div>
                <h2 style={{ color: '#fff', margin: '8px 0 3px 0', fontSize: 20 }}>{data.name}</h2>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {data.province} • Stasiun Cuaca & Atmosfer
                </div>
              </div>

              <div className="inspector-section">
                <h4 className="section-title">Parameter Atmosfer Terkini</h4>
                <div className="info-grid">
                  <div className="info-box">
                    <span className="label">Suhu Udara</span>
                    <span className="val" style={{ color: '#facc15' }}>{cur.temp}°C</span>
                  </div>
                  <div className="info-box">
                    <span className="label">Suhu Terasa</span>
                    <span className="val">{cur.feelsLike}°C</span>
                  </div>
                  <div className="info-box">
                    <span className="label">Kelembaban</span>
                    <span className="val">{cur.humidity}%</span>
                  </div>
                  <div className="info-box">
                    <span className="label">Kecepatan Angin</span>
                    <span className="val">{cur.windSpeed} km/jam</span>
                  </div>
                </div>
              </div>

              {(() => {
                const nearbyVolc = getNearbyVolcanoes(data.lat, data.lon, 35);
                const isVolcano = (data.name || '').toLowerCase().includes('gunung') || (nearbyVolc.length > 0 && nearbyVolc[0].level >= 2);
                const validHazards = (data.hazards || []).filter(h => {
                  if (h.id.includes('lahar')) {
                    return isVolcano;
                  }
                  return true;
                });

                if (validHazards.length === 0) return null;

                return (
                  <div className="inspector-section">
                    <h4 className="section-title">
                      <AlertTriangle size={13} color="#f97316" />
                      <span>Korelasi Risiko Bencana Wilayah</span>
                    </h4>
                    {validHazards.map(h => (
                      <div
                        key={h.id}
                        className="advisory-box"
                        style={{
                          borderLeftColor: h.color,
                          background: h.level === 'info' || h.level === 'normal' ? 'rgba(16, 185, 129, 0.08)' : undefined,
                          marginBottom: 8
                        }}
                      >
                        <strong style={{ color: h.color }}>{h.title}</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#cbd5e1', lineHeight: 1.45 }}>{h.desc}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="inspector-actions-stack">
                <button
                  className="btn-primary-block"
                  onClick={() => onOpenWeatherModal(data)}
                >
                  <CloudSun size={15} />
                  <span>Buka Studio Cuaca 7 Hari Lengkap</span>
                </button>

                <button
                  className="btn-secondary-block"
                  onClick={() => onFocusMap(data.lat, data.lon, 10)}
                >
                  <Navigation size={14} />
                  <span>Fokuskan Titik Ini di Peta</span>
                </button>
              </div>
            </>
          );
        })()}

        {/* Tipe 4: KUALITAS UDARA STASIUN */}
        {type === 'airQuality' && (
          <>
            <div className="inspector-section hero-section">
              <div
                className="badge-status"
                style={{
                  background: `${data.color}25`,
                  color: data.color,
                  border: `1px solid ${data.color}60`
                }}
              >
                AQI {data.aqi} • {data.category}
              </div>
              <h2 style={{ color: '#fff', margin: '8px 0 3px 0', fontSize: 20 }}>{data.name}</h2>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {data.province} • {data.source}
              </div>
            </div>

            <div className="inspector-section">
              <h4 className="section-title">Parameter Polutan (Breakdown Gas)</h4>
              <div className="pollutant-list">
                {Object.entries(data.pollutants).map(([k, p]) => (
                  <div key={k} className="pollutant-item">
                    <div className="pollutant-header">
                      <span><strong>{p.label}</strong></span>
                      <span>{p.value} <small>{p.unit}</small></span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(100, (p.value / 150) * 100)}%`,
                          background: data.color
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="inspector-section">
              <h4 className="section-title">Mitigasi Kesehatan</h4>
              <p style={{ fontSize: 11.5, color: '#cbd5e1', lineHeight: 1.5 }}>
                {data.categoryDesc}
              </p>
            </div>

            <button
              className="btn-primary-block"
              onClick={() => onFocusMap(data.lat, data.lon, 11)}
            >
              <Navigation size={15} />
              <span>Fokuskan Stasiun di Peta</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
