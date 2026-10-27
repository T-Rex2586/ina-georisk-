import React, { useState, useEffect } from 'react';
import {
  X,
  CloudSun,
  Sun,
  SunMedium,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Zap,
  CloudFog,
  Droplets,
  Wind,
  Gauge,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  Flame,
  MapPin,
  RefreshCw,
  Calendar,
  Clock,
  Umbrella,
  ShieldCheck,
  Map,
  Compass
} from 'lucide-react';
import { INDONESIA_CITIES } from '../data/cities';
import { VOLCANO_DATABASE } from '../data/volcanoes';

// Helper pemetaan icon dinamis
function renderWeatherIcon(iconName, size = 20, color = '#38bdf8') {
  switch (iconName) {
    case 'Sun': return <Sun size={size} color={color || '#facc15'} />;
    case 'SunMedium': return <SunMedium size={size} color={color || '#fde047'} />;
    case 'CloudSun': return <CloudSun size={size} color={color || '#38bdf8'} />;
    case 'Cloud': return <Cloud size={size} color={color || '#94a3b8'} />;
    case 'CloudFog': return <CloudFog size={size} color={color || '#cbd5e1'} />;
    case 'CloudDrizzle': return <CloudDrizzle size={size} color={color || '#67e8f9'} />;
    case 'CloudRain': return <CloudRain size={size} color={color || '#0ea5e9'} />;
    case 'CloudLightning': return <CloudLightning size={size} color={color || '#ef4444'} />;
    case 'Zap': return <Zap size={size} color={color || '#f59e0b'} />;
    default: return <CloudSun size={size} color={color || '#38bdf8'} />;
  }
}

function renderHazardIcon(iconName, color = '#f97316') {
  switch (iconName) {
    case 'ShieldCheck': return <ShieldCheck size={16} color={color} />;
    case 'AlertOctagon': return <AlertOctagon size={16} color={color} />;
    case 'AlertTriangle': return <AlertTriangle size={16} color={color} />;
    case 'Sparkles': return <Sparkles size={16} color={color} />;
    case 'Flame': return <Flame size={16} color={color} />;
    case 'CloudFog': return <CloudFog size={16} color={color} />;
    default: return <AlertTriangle size={16} color={color} />;
  }
}

export default function WeatherModal({
  isOpen,
  onClose,
  weatherService,
  initialLocation = null,
  onFocusMap = () => {}
}) {
  const [selectedTarget, setSelectedTarget] = useState(initialLocation || {
    name: 'Jakarta',
    province: 'DKI Jakarta',
    lat: -6.2088,
    lon: 106.8456,
    type: 'city'
  });

  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('cities'); // 'cities' | 'volcanoes'

  // Update target jika initialLocation berubah dari luar
  useEffect(() => {
    if (initialLocation) {
      setSelectedTarget(initialLocation);
    }
  }, [initialLocation]);

  // Load forecast saat target berubah
  useEffect(() => {
    if (!isOpen || !selectedTarget || !weatherService) return;

    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await weatherService.getForecast(
          selectedTarget.lat,
          selectedTarget.lon,
          selectedTarget.name
        );
        if (isMounted) setForecastData(data);
      } catch (err) {
        console.error('Error fetching weather:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => { isMounted = false; };
  }, [isOpen, selectedTarget, weatherService]);

  if (!isOpen) return null;

  const [selectedIsland, setSelectedIsland] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('all');

  // Daftar pulau untuk pemfilteran
  const ISLANDS = ['all', 'Jawa', 'Sumatera', 'Bali & Nusa Tenggara', 'Kalimantan', 'Sulawesi', 'Maluku', 'Papua'];

  // Filter daftar lokasi untuk pemilih cepat
  const filteredCities = useMemo(() => {
    let list = INDONESIA_CITIES;
    if (selectedIsland !== 'all') {
      list = list.filter(c => c.island === selectedIsland);
    }
    if (selectedProvince !== 'all') {
      list = list.filter(c => c.provinceCode === selectedProvince || c.province === selectedProvince);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.capital && c.capital.toLowerCase().includes(q)) ||
        c.province.toLowerCase().includes(q)
      );
    }
    return list.slice(0, 24);
  }, [selectedIsland, selectedProvince, searchQuery]);

  const filteredVolcanoes = useMemo(() => {
    let list = VOLCANO_DATABASE;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.province.toLowerCase().includes(q)
      );
    }
    return list.slice(0, 16);
  }, [searchQuery]);

  const handleRefresh = async () => {
    if (!selectedTarget || !weatherService) return;
    setLoading(true);
    const refreshed = await weatherService.getForecast(
      selectedTarget.lat,
      selectedTarget.lon,
      selectedTarget.name,
      true
    );
    setForecastData(refreshed);
    setLoading(false);
  };

  const handleSelectLocation = (item, type) => {
    setSelectedTarget({
      ...item,
      type
    });
    setSearchQuery('');
  };

  const cur = forecastData?.current || {};

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div className="weather-modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-box">
            <div className="modal-icon-badge weather">
              <CloudSun size={18} color="#38bdf8" />
            </div>
            <div>
              <div className="modal-badge-label">STUDIO ATMOSFER & CUACA</div>
              <h3>Prakiraan Meteorologi & Multi-Hazard Terpadu</h3>
            </div>
          </div>
          <div className="modal-header-actions">
            {onFocusMap && (
              <button
                className="btn-modal-action"
                onClick={() => {
                  onFocusMap(selectedTarget.lat, selectedTarget.lon, 11);
                  onClose();
                }}
                title="Pusatkan Peta ke Lokasi Ini"
              >
                <Map size={13} />
                <span>Peta</span>
              </button>
            )}
            <button
              className={`btn-icon-reload ${loading ? 'spinning' : ''}`}
              onClick={handleRefresh}
              title="Perbarui Data Cuaca"
            >
              <RefreshCw size={14} />
            </button>
            <button className="btn-close" onClick={onClose} title="Tutup">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="weather-modal-body">
          {/* Quick Location Switcher */}
          <div className="weather-location-bar">
            <div className="location-bar-top">
              <div className="location-tabs">
                <button
                  className={`loc-tab ${activeTab === 'cities' ? 'active' : ''}`}
                  onClick={() => setActiveTab('cities')}
                >
                  🏙️ Kota & Wilayah
                </button>
                <button
                  className={`loc-tab ${activeTab === 'volcanoes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('volcanoes')}
                >
                  🌋 Gunung Api Aktif
                </button>
              </div>

              <div className="location-search-mini">
                <input
                  type="text"
                  placeholder={`Cari ${activeTab === 'cities' ? 'kota/kabupaten...' : 'gunung api...'}`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="btn-clear-mini" onClick={() => setSearchQuery('')}>×</button>
                )}
              </div>
            </div>

            {activeTab === 'cities' && (
              <div className="location-filter-islands" style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px 0 8px', scrollbarWidth: 'none' }}>
                {ISLANDS.map(isl => (
                  <button
                    key={isl}
                    className={`island-filter-pill ${selectedIsland === isl ? 'active' : ''}`}
                    onClick={() => setSelectedIsland(isl)}
                    style={{
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: selectedIsland === isl ? '#38bdf8' : 'rgba(255,255,255,0.12)',
                      background: selectedIsland === isl ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                      color: selectedIsland === isl ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isl === 'all' ? '🗺️ Semua Pulau' : isl}
                  </button>
                ))}
              </div>
            )}

            <div className="location-pill-carousel">
              {(activeTab === 'cities' ? filteredCities : filteredVolcanoes).map(item => {
                const isSelected = selectedTarget.name.toLowerCase() === item.name.toLowerCase();
                return (
                  <button
                    key={item.id || item.name}
                    className={`loc-pill ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectLocation(item, activeTab === 'cities' ? 'city' : 'volcano')}
                    title={item.province ? `${item.name} (${item.province})` : item.name}
                  >
                    {item.simpleName || item.name}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="weather-loading-box">
              <RefreshCw size={26} className="spinning" color="#38bdf8" />
              <span>Menghubungkan model atmosfer & telemetry satelit...</span>
            </div>
          ) : forecastData ? (
            <div className="weather-content-scroll">
              {/* Hero Weather Card */}
              <div className="weather-hero-card">
                <div className="hero-left">
                  <div className="hero-location-badge">
                    <MapPin size={12} color="#38bdf8" />
                    <span>{selectedTarget.province || 'Indonesia'}</span>
                    <span className="dot-sep">•</span>
                    <span>Elevasi ~{forecastData.location.elevation} mdpl</span>
                  </div>
                  <h1 className="hero-location-name">{selectedTarget.name}</h1>
                  <div className="hero-condition-row">
                    <span
                      className="hero-condition-pill"
                      style={{
                        background: `${cur.weatherColor}20`,
                        color: cur.weatherColor,
                        border: `1px solid ${cur.weatherColor}50`
                      }}
                    >
                      {cur.weatherLabel}
                    </span>
                    <span className="hero-desc">{cur.weatherDesc}</span>
                  </div>
                </div>

                <div className="hero-center">
                  <div className="hero-icon-large">
                    {renderWeatherIcon(cur.weatherIcon, 56, cur.weatherColor)}
                  </div>
                  <div className="hero-temp-box">
                    <div className="temp-wrapper">
                      <span className="temp-main">{cur.temp}°</span>
                      <span className="temp-unit">C</span>
                    </div>
                    <div className="temp-feels">Terasa {cur.feelsLike}°C</div>
                  </div>
                </div>

                <div className="hero-right-metrics">
                  <div className="metric-tile">
                    <div className="tile-icon"><Droplets size={14} color="#38bdf8" /></div>
                    <div className="tile-text">
                      <span className="tile-label">Kelembaban</span>
                      <span className="tile-val">{cur.humidity}%</span>
                    </div>
                  </div>

                  <div className="metric-tile">
                    <div className="tile-icon"><Wind size={14} color="#06b6d4" /></div>
                    <div className="tile-text">
                      <span className="tile-label">Kecepatan Angin</span>
                      <span className="tile-val">{cur.windSpeed} <small>km/j</small></span>
                    </div>
                  </div>

                  <div className="metric-tile">
                    <div className="tile-icon"><Gauge size={14} color="#a855f7" /></div>
                    <div className="tile-text">
                      <span className="tile-label">Tekanan Udara</span>
                      <span className="tile-val">{cur.pressure} <small>hPa</small></span>
                    </div>
                  </div>

                  <div className="metric-tile">
                    <div className="tile-icon"><Umbrella size={14} color="#f59e0b" /></div>
                    <div className="tile-text">
                      <span className="tile-label">Presipitasi</span>
                      <span className="tile-val">{cur.precipitation} <small>mm</small></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Hazard & Disaster Correlation Section */}
              {forecastData.hazards && forecastData.hazards.length > 0 && (
                <div className="weather-hazards-container">
                  <div className="hazards-section-header">
                    <AlertTriangle size={14} color="#f59e0b" />
                    <span>Intelijen Risiko Bencana & Sinergi Atmosfer</span>
                  </div>
                  <div className="hazards-list">
                    {forecastData.hazards.map((hz) => (
                      <div
                        key={hz.id}
                        className={`hazard-card ${hz.level || 'info'}`}
                        style={{ borderLeftColor: hz.color }}
                      >
                        <div className="hazard-top">
                          <div className="hazard-title-wrap">
                            {renderHazardIcon(hz.icon, hz.color)}
                            <span className="hazard-title">{hz.title}</span>
                          </div>
                          <span
                            className="hazard-badge"
                            style={{ background: `${hz.color}20`, color: hz.color, borderColor: `${hz.color}50` }}
                          >
                            {hz.badge}
                          </span>
                        </div>
                        <p className="hazard-desc">{hz.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 24-Hour Hourly Timeline */}
              <div className="weather-section-block">
                <div className="block-header">
                  <div className="block-title">
                    <Clock size={14} color="#38bdf8" />
                    <h4>Prakiraan Tiap Jam (24 Jam ke Depan)</h4>
                  </div>
                  <span className="block-sub">Suhu, Kondisi & Peluang Hujan</span>
                </div>

                <div className="hourly-slider-container">
                  <div className="hourly-slider">
                    {forecastData.hourly.map((h, idx) => (
                      <div key={idx} className={`hourly-card ${idx === 0 ? 'current' : ''}`}>
                        <span className="h-time">{idx === 0 ? 'Sekarang' : h.time}</span>
                        <div className="h-icon">
                          {renderWeatherIcon(h.weatherIcon, 22, h.weatherColor)}
                        </div>
                        <span className="h-temp">{h.temp}°</span>
                        <div className="h-pop-badge" title={`Peluang Hujan: ${h.pop}%`}>
                          <Droplets size={10} color={h.pop > 30 ? '#38bdf8' : '#64748b'} />
                          <span>{h.pop}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 7-Day Extended Outlook */}
              <div className="weather-section-block">
                <div className="block-header">
                  <div className="block-title">
                    <Calendar size={14} color="#38bdf8" />
                    <h4>Prakiraan Cuaca 7 Hari ke Depan</h4>
                  </div>
                  <span className="block-sub">Rentang Suhu Ekstrem & Akumulasi Hujan</span>
                </div>

                <div className="daily-forecast-grid">
                  {forecastData.daily.map((d, idx) => (
                    <div key={idx} className="daily-card">
                      <div className="d-date-col">
                        <span className="d-day">{d.day}</span>
                        <span className="d-date">{d.date}</span>
                      </div>

                      <div className="d-condition-col">
                        <div className="d-icon">
                          {renderWeatherIcon(d.weatherIcon, 18, d.weatherColor)}
                        </div>
                        <span className="d-label">{d.weatherLabel}</span>
                      </div>

                      <div className="d-pop-col">
                        <Umbrella size={12} color="#38bdf8" />
                        <span>{d.pop}%</span>
                        {d.rainSum > 0 && <small className="d-rain-sum">{d.rainSum} mm</small>}
                      </div>

                      <div className="d-temp-range-col">
                        <span className="d-min">{d.minTemp}°</span>
                        <div className="temp-range-bar">
                          <div
                            className="temp-bar-fill"
                            style={{
                              left: `${Math.max(0, Math.min(60, ((d.minTemp - 15) / 25) * 100))}%`,
                              right: `${Math.max(0, Math.min(60, 100 - ((d.maxTemp - 15) / 25) * 100))}%`
                            }}
                          ></div>
                        </div>
                        <span className="d-max">{d.maxTemp}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="weather-empty-box">
              <p>Gagal memuat data prakiraan. Silakan klik tombol perbarui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
