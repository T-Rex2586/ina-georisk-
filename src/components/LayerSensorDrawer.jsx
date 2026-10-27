import React from 'react';
import { X, Sliders, Key, Download, BarChart2, Eye, ShieldAlert } from 'lucide-react';

export default function LayerSensorDrawer({
  isOpen = false,
  onClose = () => {},
  filters = {},
  onChangeFilter = () => {},
  mapKey = '',
  onSaveMapKey = () => {},
  onOpenAnalytics = () => {},
  onOpenExport = () => {}
}) {
  if (!isOpen) return null;

  return (
    <div className="psn-drawer-backdrop" onClick={onClose}>
      <div className="psn-drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="psn-drawer-header">
          <div className="drawer-title-group">
            <Sliders size={18} color="#38bdf8" />
            <h3>Pengaturan Lapisan & Parameter Sensor Atmosfer</h3>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="psn-drawer-body">
          {/* Section 1: Konfigurasi NASA FIRMS */}
          <div className="drawer-section">
            <h4 className="drawer-section-title">
              <Key size={14} color="#f97316" />
              <span>Sensor Satelit NASA FIRMS (VIIRS & MODIS)</span>
            </h4>

            <div className="form-group">
              <label>NASA FIRMS MAP_KEY:</label>
              <div className="key-input-row">
                <input
                  type="text"
                  defaultValue={mapKey}
                  id="drawerMapKeyInput"
                  className="psn-input monospace"
                  placeholder="32 karakter MAP_KEY..."
                />
                <button
                  className="psn-btn-primary"
                  onClick={() => {
                    const el = document.getElementById('drawerMapKeyInput');
                    if (el) onSaveMapKey(el.value.trim());
                  }}
                >
                  Simpan
                </button>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Rentang Waktu Observasi:</label>
                <select
                  className="psn-select"
                  value={filters.timeRange}
                  onChange={e => onChangeFilter('timeRange', e.target.value)}
                >
                  <option value="24h">24 Jam Terakhir</option>
                  <option value="48h">48 Jam Terakhir</option>
                  <option value="7d">7 Hari Terakhir</option>
                </select>
              </div>

              <div className="form-group">
                <label>Sensor Satelit:</label>
                <select
                  className="psn-select"
                  value={filters.sensor}
                  onChange={e => onChangeFilter('sensor', e.target.value)}
                >
                  <option value="all">Semua (VIIRS & MODIS)</option>
                  <option value="VIIRS">VIIRS (375m NRT)</option>
                  <option value="MODIS">MODIS (1km Aqua/Terra)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <div className="slider-label-row">
                <label>Ambang Batas Radiatif (Min. FRP):</label>
                <span className="slider-val-tag">{filters.minFrp || 0} MW</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                className="range-slider"
                value={filters.minFrp || 0}
                onChange={e => onChangeFilter('minFrp', Number(e.target.value))}
              />
            </div>
          </div>

          {/* Section 2: Dinamika Angin & Awan */}
          <div className="drawer-section">
            <h4 className="drawer-section-title">
              <Eye size={14} color="#06b6d4" />
              <span>Dinamika Model Angin & Dispersi Polutan</span>
            </h4>
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
              Visualisasi angin menggunakan partikel streamline dinamis berbasis API Open-Meteo Weather. Arah angin menentukan vektor proyeksi kerucut sebaran abu vulkanik serta lintasan asap kebakaran hutan (karhutla).
            </p>
          </div>

          {/* Section 3: Alat & Akses Cepat */}
          <div className="drawer-section">
            <h4 className="drawer-section-title">
              <span>Alat Analisis & Ekspor Data</span>
            </h4>
            <div className="drawer-actions-grid">
              <button className="drawer-action-card" onClick={onOpenAnalytics}>
                <BarChart2 size={20} color="#38bdf8" />
                <div>
                  <strong>Studio Analitik & Grafik</strong>
                  <span>Tren AQI kota, status PVMBG & pulau</span>
                </div>
              </button>

              <button className="drawer-action-card" onClick={onOpenExport}>
                <Download size={20} color="#10b981" />
                <div>
                  <strong>Ekspor Dataset (FR-05)</strong>
                  <span>Unduh format CSV & JSON</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
