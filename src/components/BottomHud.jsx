import React from 'react';

export default function BottomHud({
  cursorCoords = { lat: -4.8231, lon: 134.8682 },
  telemetry = {
    avgWindSpeed: 12,
    hotspotsCount: 5062,
    volcanoCount: 12,
    pm25Avg: 37
  }
}) {
  const formatCoord = (val, isLat) => {
    const abs = Math.abs(val).toFixed(4);
    if (isLat) {
      return `${abs}° ${val >= 0 ? 'N' : 'S'}`;
    }
    return `${abs}° ${val >= 0 ? 'E' : 'W'}`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  return (
    <>
      {/* Floating Legend (Bottom Left) */}
      <div className="aero-legend-pill">
        <div className="legend-entry">
          <span className="dot dot-orange"></span>
          <span>Titik Panas FIRMS</span>
        </div>
        <div className="legend-entry">
          <span className="dot dot-red"></span>
          <span>Gunung Api & Arah Abu</span>
        </div>
        <div className="legend-entry">
          <span className="dot dot-cyan"></span>
          <span>Aliran Angin</span>
        </div>
        <div className="legend-entry">
          <span className="dot dot-green"></span>
          <span>Kualitas Udara</span>
        </div>
      </div>

      {/* Floating Coordinates Tracker (Bottom Center) */}
      <div className="aero-coords-pill">
        <span className="coord-text">{formatCoord(cursorCoords.lon, false)}</span>
        <span className="coord-sep">|</span>
        <span className="coord-text">{formatCoord(cursorCoords.lat, true)}</span>
      </div>

      {/* Bottom Telemetry Strip */}
      <div className="aero-telemetry-bar">
        <div className="telemetry-item">
          <span className="label">ALIRAN ANGIN:</span>
          <span className="val cyan">{telemetry.avgWindSpeed} km/j (Monsun)</span>
        </div>

        <div className="telemetry-item">
          <span className="label">HOTSPOT AKTIF:</span>
          <span className="val orange">{formatNumber(telemetry.hotspotsCount)} titik (NASA FIRMS)</span>
        </div>

        <div className="telemetry-item">
          <span className="label">STATUS VULKANIK:</span>
          <span className="val red">{telemetry.volcanoCount} Gunung Waspada/Siaga/Awas</span>
        </div>

        <div className="telemetry-item">
          <span className="label">RATA-RATA PM2.5:</span>
          <span className="val green">{telemetry.pm25Avg} µg/m³</span>
        </div>

        <div className="telemetry-item end-item">
          <span className="label">SINKRONISASI:</span>
          <span className="val white">Satelit Near Real-Time</span>
        </div>
      </div>
    </>
  );
}
