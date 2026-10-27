import React, { useState } from 'react';
import { Layers, Flame, Wind, Eye, Search, Sliders, Mountain, Activity } from 'lucide-react';

export default function Sidebar({
  metrics,
  layers,
  onToggleLayer,
  baseMap,
  onChangeBaseMap,
  filters,
  onChangeFilter,
  onSearchLocation
}) {
  const [query, setQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearchLocation(query.trim());
    }
  };

  return (
    <aside className="sidebar-panel">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <Layers size={18} color="#38bdf8" />
          <span>Panel Pemantauan</span>
        </div>
      </div>

      <div className="sidebar-scrollable">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Cari gunung api atau kota (e.g. Merapi, Jakarta)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn-search" title="Cari">
            <Search size={15} />
          </button>
        </form>

        {/* Ringkasan Metrik Cepat */}
        <div className="metrics-grid">
          <div className="metric-card volcano">
            <span className="metric-label">Gunung Siaga / Awas</span>
            <span className="metric-value">{metrics.volcanoCount}</span>
            <span className="metric-sub">Level III & IV PVMBG</span>
          </div>

          <div className="metric-card aqi">
            <span className="metric-label">Rata-rata AQI</span>
            <span className="metric-value">{metrics.avgAqi}</span>
            <span className="metric-sub">{metrics.unhealthyCities} Kota Waspada Polusi</span>
          </div>

          <div className="metric-card hotspot">
            <span className="metric-label">Titik Panas (Hotspot)</span>
            <span className="metric-value">{metrics.hotspotCount}</span>
            <span className="metric-sub">{metrics.highFrpCount} FRP Daya Tinggi</span>
          </div>

          <div className="metric-card wind">
            <span className="metric-label">Kecepatan Angin</span>
            <span className="metric-value">{metrics.avgWindSpeed} <small style={{fontSize: 12}}>km/h</small></span>
            <span className="metric-sub">Pola Monsun Aktif</span>
          </div>
        </div>

        {/* Multi-Layer Toggles */}
        <div className="panel-section">
          <div className="section-header">
            <h4>
              <Eye size={15} color="#38bdf8" />
              <span>Layer Peta Interaktif</span>
            </h4>
          </div>

          <div className="layer-toggle-list">
            <div className="layer-toggle-item">
              <div className="layer-info">
                <span className="layer-color-indicator" style={{ background: '#ef4444' }}></span>
                <span>Gunung Api (PVMBG)</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={layers.volcanoes}
                  onChange={(e) => onToggleLayer('volcanoes', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="layer-toggle-item">
              <div className="layer-info">
                <span className="layer-color-indicator" style={{ background: '#94a3b8' }}></span>
                <span>Sebaran Abu Vulkanik (Plume)</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={layers.ashPlumes}
                  onChange={(e) => onToggleLayer('ashPlumes', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="layer-toggle-item">
              <div className="layer-info">
                <span className="layer-color-indicator" style={{ background: '#f97316' }}></span>
                <span>Radius Zona Bahaya (1-7 km)</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={layers.dangerZones}
                  onChange={(e) => onToggleLayer('dangerZones', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="layer-toggle-item">
              <div className="layer-info">
                <span className="layer-color-indicator" style={{ background: '#10b981' }}></span>
                <span>Kualitas Udara (AQI / ISPU)</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={layers.airQuality}
                  onChange={(e) => onToggleLayer('airQuality', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="layer-toggle-item">
              <div className="layer-info">
                <span className="layer-color-indicator" style={{ background: '#eab308' }}></span>
                <span>Titik Panas (NASA FIRMS)</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={layers.hotspots}
                  onChange={(e) => onToggleLayer('hotspots', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="layer-toggle-item">
              <div className="layer-info">
                <span className="layer-color-indicator" style={{ background: '#38bdf8' }}></span>
                <span>Vektor Aliran Angin</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={layers.windVectors}
                  onChange={(e) => onToggleLayer('windVectors', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Filter Satelit NASA FIRMS */}
        <div className="panel-section">
          <div className="section-header">
            <h4>
              <Sliders size={15} color="#f97316" />
              <span>Filter Titik Panas (FIRMS)</span>
            </h4>
          </div>

          <div className="filter-group">
            <div className="filter-row">
              <span>Rentang Waktu:</span>
              <select
                className="filter-select"
                value={filters.timeRange}
                onChange={(e) => onChangeFilter('timeRange', e.target.value)}
              >
                <option value="24h">24 Jam Terakhir</option>
                <option value="48h">48 Jam Terakhir</option>
                <option value="7d">7 Hari Terakhir</option>
              </select>
            </div>

            <div className="filter-row">
              <span>Sensor Satelit:</span>
              <select
                className="filter-select"
                value={filters.sensor}
                onChange={(e) => onChangeFilter('sensor', e.target.value)}
              >
                <option value="all">Semua (VIIRS & MODIS)</option>
                <option value="VIIRS">VIIRS (Suomi-NPP)</option>
                <option value="MODIS">MODIS (Aqua/Terra)</option>
              </select>
            </div>

            <div className="filter-row">
              <span>Min. FRP:</span>
              <span style={{ color: '#f97316', fontWeight: 600 }}>{filters.minFrp} MW</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              className="range-slider"
              value={filters.minFrp}
              onChange={(e) => onChangeFilter('minFrp', Number(e.target.value))}
            />
          </div>
        </div>

        {/* Tampilan Peta Dasar (Base Map) */}
        <div className="panel-section">
          <div className="filter-row">
            <span>Peta Dasar:</span>
            <select
              className="filter-select"
              value={baseMap}
              onChange={(e) => onChangeBaseMap(e.target.value)}
            >
              <option value="dark">Dark Matter (Geospatial High Contrast)</option>
              <option value="satellite">Esri World Imagery (Citra Satelit)</option>
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}
