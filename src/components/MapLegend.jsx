import React from 'react';

export default function MapLegend() {
  return (
    <div className="map-legend-overlay">
      <div className="legend-title">
        <span>Legenda Tingkat Risiko</span>
        <span style={{ fontSize: 9, color: '#38bdf8' }}>PVMBG & ISPU</span>
      </div>

      {/* Skala Kualitas Udara */}
      <div style={{ margin: '4px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 10 }}>
          <span>Kualitas Udara (AQI)</span>
        </div>
        <div className="legend-scale">
          <div className="legend-color-chip" style={{ background: '#10b981' }} title="Baik (0-50)"></div>
          <div className="legend-color-chip" style={{ background: '#38bdf8' }} title="Sedang (51-100)"></div>
          <div className="legend-color-chip" style={{ background: '#fbbf24' }} title="Sensitif (101-150)"></div>
          <div className="legend-color-chip" style={{ background: '#f97316' }} title="Tidak Sehat (151-200)"></div>
          <div className="legend-color-chip" style={{ background: '#ef4444' }} title="Sangat Tidak Sehat (201-300)"></div>
          <div className="legend-color-chip" style={{ background: '#881337' }} title="Berbahaya (>300)"></div>
        </div>
        <div className="legend-labels">
          <span>Baik</span>
          <span>Sedang</span>
          <span>Buruk</span>
          <span>Berbahaya</span>
        </div>
      </div>

      {/* Skala Status Gunung Api */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 10 }}>
          <span>Status Gunung Api (PVMBG)</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
            <span style={{ fontSize: 9, color: '#cbd5e1' }}>Normal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#facc15' }}></span>
            <span style={{ fontSize: 9, color: '#cbd5e1' }}>Waspada</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }}></span>
            <span style={{ fontSize: 9, color: '#cbd5e1' }}>Siaga</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></span>
            <span style={{ fontSize: 9, color: '#cbd5e1' }}>Awas</span>
          </div>
        </div>
      </div>

      {/* Hotspot FRP */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 10 }}>
          <span>Hotspot FIRMS (FRP)</span>
          <span style={{ fontSize: 9, color: '#f97316' }}>&gt;50 MW Tinggi</span>
        </div>
      </div>
    </div>
  );
}
