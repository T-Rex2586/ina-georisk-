import React, { useState, useEffect } from 'react';
import { Flame, Mountain, Wind, CloudFog, Cloud, Activity, Sliders, CloudSun, Compass } from 'lucide-react';
import CitySearchBar from './CitySearchBar';

export default function HeaderNav({
  layers = {},
  onToggleLayer = () => {},
  hotspotCount = 5062,
  volcanoCount = 12,
  onOpenStudio = () => {},
  onOpenWeather = () => {},
  onOpenRegionExplorer = () => {},
  onOpenSensorDrawer = () => {},
  onSelectSearchResult = () => {}
}) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${h}.${m}.${s} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  return (
    <header className="aero-header">
      {/* Brand Identity */}
      <div className="aero-brand">
        <div className="aero-logo">
          <svg viewBox="0 0 28 28" width="24" height="24" fill="none">
            <path d="M14 3L25 24H3L14 3Z" stroke="#f97316" strokeWidth="2" strokeLinejoin="round" />
            <path d="M14 9L20 22H8L14 9Z" fill="#ef4444" opacity="0.6" />
            <circle cx="14" cy="9" r="2.5" fill="#facc15" />
            <path d="M14 3V0" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <path d="M11 1C12 2 16 2 17 1" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="aero-title-box">
          <div className="aero-title">
            <span className="brand-orange">AERO-VULCAN </span>
            <span className="brand-light">INDONESIA</span>
          </div>
          <div className="aero-sub">OBSERVASI VULKANIK & DINAMIKA ATMOSFER</div>
        </div>
      </div>

      {/* Integrated Search Bar by City & Volcano */}
      <CitySearchBar onSelectLocation={onSelectSearchResult} />

      {/* Layer Dock Controls */}
      <nav className="aero-dock">
        <button
          className={`aero-dock-pill ${layers.hotspots ? 'active-orange' : ''}`}
          onClick={() => onToggleLayer('hotspots', !layers.hotspots)}
          title="Deteksi Titik Panas NASA FIRMS"
        >
          <Flame size={13} className="icon-flame" />
          <span>Hotspot</span>
          <span className="pill-count">{formatNumber(hotspotCount)}</span>
        </button>

        <button
          className={`aero-dock-pill ${layers.volcanoes ? 'active-red' : ''}`}
          onClick={() => onToggleLayer('volcanoes', !layers.volcanoes)}
          title="Status Gunung Api Aktif PVMBG"
        >
          <Mountain size={13} className="icon-volc" />
          <span>Gunung</span>
          <span className="pill-count">{volcanoCount}</span>
        </button>

        <button
          className={`aero-dock-pill ${layers.windVectors ? 'active-cyan' : ''}`}
          onClick={() => onToggleLayer('windVectors', !layers.windVectors)}
          title="Streamline Aliran Angin Dinamis"
        >
          <Wind size={13} className="icon-wind" />
          <span>Angin</span>
        </button>

        <button
          className={`aero-dock-pill ${layers.airQuality ? 'active-green' : ''}`}
          onClick={() => onToggleLayer('airQuality', !layers.airQuality)}
          title="Kualitas Udara & Polutan ISPU"
        >
          <Activity size={13} className="icon-aqi" />
          <span>Udara</span>
        </button>

        <button
          className={`aero-dock-pill ${layers.so2 ? 'active-yellow' : ''}`}
          onClick={() => onToggleLayer('so2', !layers.so2)}
          title="Sebaran Gas Sulfur Dioksida"
        >
          <CloudFog size={13} className="icon-so2" />
          <span>SO2</span>
        </button>

        <div className={`aero-dock-pill-group ${layers.weather ? 'active-sky' : ''}`}>
          <button
            className="dock-pill-btn"
            onClick={() => onToggleLayer('weather', !layers.weather)}
            title="Toggle Layer Cuaca di Peta"
          >
            <CloudSun size={13} className="icon-weather" />
            <span>Cuaca</span>
          </button>
          <button
            className="dock-pill-action"
            onClick={(e) => {
              e.stopPropagation();
              onOpenWeather();
            }}
            title="Buka Studio Ramalan Cuaca 7 Hari"
          >
            7H
          </button>
        </div>
      </nav>

      {/* Right Telemetry & Actions */}
      <div className="aero-right-actions">
        <button
          className="aero-btn-analytics"
          onClick={onOpenRegionExplorer}
          title="Jelajah 514 Data Daerah Indonesia (Data Kemendagri 2012)"
          style={{
            background: 'rgba(56, 189, 248, 0.12)',
            borderColor: 'rgba(56, 189, 248, 0.35)',
            color: '#38bdf8'
          }}
        >
          <Compass size={13} />
          <span>514 Daerah</span>
        </button>

        <button
          className="aero-btn-analytics"
          onClick={onOpenStudio}
          title="Buka Analitik & Grafik Bencana"
        >
          <Activity size={13} />
          <span>Analitik</span>
        </button>

        <button
          className="aero-btn-sensor"
          onClick={onOpenSensorDrawer}
          title="Pengaturan Sensor Satelit"
        >
          <Sliders size={13} />
          <span>Sensor</span>
        </button>

        <div className="aero-live-clock">
          <span className="clock-pulse"></span>
          <span>{timeStr}</span>
        </div>
      </div>
    </header>
  );
}
