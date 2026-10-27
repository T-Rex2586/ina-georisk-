import React, { useEffect, useRef } from 'react';
import { X, BarChart3 } from 'lucide-react';
import Chart from 'chart.js/auto';

export default function AnalyticsModal({
  isOpen,
  onClose,
  volcanoes = [],
  airQuality = [],
  hotspots = []
}) {
  const chartAqiRef = useRef(null);
  const chartHotspotRef = useRef(null);
  const chartVolcanoRef = useRef(null);

  const aqiChartInstance = useRef(null);
  const hotspotChartInstance = useRef(null);
  const volcanoChartInstance = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Chart AQI
    if (chartAqiRef.current) {
      if (aqiChartInstance.current) aqiChartInstance.current.destroy();

      const sorted = [...airQuality].sort((a, b) => b.aqi - a.aqi).slice(0, 10);
      aqiChartInstance.current = new Chart(chartAqiRef.current, {
        type: 'bar',
        data: {
          labels: sorted.map(s => s.name),
          datasets: [{
            label: 'US AQI',
            data: sorted.map(s => s.aqi),
            backgroundColor: sorted.map(s => s.color),
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
            y: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.06)' } }
          }
        }
      });
    }

    // 2. Chart Hotspots per Island
    if (chartHotspotRef.current) {
      if (hotspotChartInstance.current) hotspotChartInstance.current.destroy();

      const islandMap = {};
      hotspots.forEach(h => {
        islandMap[h.island] = (islandMap[h.island] || 0) + 1;
      });

      const labels = Object.keys(islandMap);
      const counts = Object.values(islandMap);
      const islandColors = ['#f97316', '#ef4444', '#eab308', '#06b6d4', '#8b5cf6', '#10b981', '#64748b'];

      hotspotChartInstance.current = new Chart(chartHotspotRef.current, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: counts,
            backgroundColor: islandColors.slice(0, labels.length),
            borderColor: '#0f172a',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: '#cbd5e1', font: { size: 11 }, boxWidth: 12 } }
          },
          cutout: '65%'
        }
      });
    }

    // 3. Chart Volcano Level Status
    if (chartVolcanoRef.current) {
      if (volcanoChartInstance.current) volcanoChartInstance.current.destroy();

      const levelCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
      volcanoes.forEach(v => {
        levelCounts[v.level] = (levelCounts[v.level] || 0) + 1;
      });

      volcanoChartInstance.current = new Chart(chartVolcanoRef.current, {
        type: 'polarArea',
        data: {
          labels: ['Level I (Normal)', 'Level II (Waspada)', 'Level III (Siaga)', 'Level IV (Awas)'],
          datasets: [{
            data: [levelCounts[1], levelCounts[2], levelCounts[3], levelCounts[4]],
            backgroundColor: ['#10b98199', '#facc1599', '#f9731699', '#ef444499'],
            borderColor: ['#10b981', '#facc15', '#f97316', '#ef4444'],
            borderWidth: 1.5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { size: 11 }, boxWidth: 12 } }
          },
          scales: {
            r: { ticks: { display: false }, grid: { color: 'rgba(255, 255, 255, 0.08)' } }
          }
        }
      });
    }

    return () => {
      if (aqiChartInstance.current) aqiChartInstance.current.destroy();
      if (hotspotChartInstance.current) hotspotChartInstance.current.destroy();
      if (volcanoChartInstance.current) volcanoChartInstance.current.destroy();
    };
  }, [isOpen, volcanoes, airQuality, hotspots]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <BarChart3 size={18} color="#38bdf8" />
            <span>Visualisasi & Analitik Risiko Nasional</span>
          </h3>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="chart-grid">
            <div className="chart-container full-width">
              <h4>10 Kota dengan Indeks Polusi AQI Tertinggi</h4>
              <div className="chart-canvas-box">
                <canvas ref={chartAqiRef}></canvas>
              </div>
            </div>

            <div className="chart-container">
              <h4>Distribusi Titik Panas Karhutla per Pulau</h4>
              <div className="chart-canvas-box">
                <canvas ref={chartHotspotRef}></canvas>
              </div>
            </div>

            <div className="chart-container">
              <h4>Komposisi Level Aktivitas Gunung Api (PVMBG)</h4>
              <div className="chart-canvas-box">
                <canvas ref={chartVolcanoRef}></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
