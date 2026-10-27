import React from 'react';

export default function TopRightControls({
  baseMap = 'satellite',
  onChangeBaseMap = () => {}
}) {
  return (
    <div className="aero-basemap-dock">
      <button
        className={`aero-basemap-tab ${baseMap === 'satellite' ? 'active' : ''}`}
        onClick={() => onChangeBaseMap('satellite')}
        title="Citra Satelit Beresolusi Tinggi Esri"
      >
        <span>🛰️</span>
        <span>Satelit Esri</span>
      </button>

      <button
        className={`aero-basemap-tab ${baseMap === 'dark' ? 'active' : ''}`}
        onClick={() => onChangeBaseMap('dark')}
        title="Peta Gelap Kartografi Geospasial"
      >
        <span>🟣</span>
        <span>Dark Matter</span>
      </button>

      <button
        className={`aero-basemap-tab ${baseMap === 'topo' ? 'active' : ''}`}
        onClick={() => onChangeBaseMap('topo')}
        title="Peta Topografi Relief Ketinggian"
      >
        <span>🗺️</span>
        <span>Topografi</span>
      </button>
    </div>
  );
}
