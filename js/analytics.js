/**
 * Modul Visualisasi Analitik & Statistik (Chart.js)
 * Menyajikan grafik tren kualitas udara, sebaran hotspot per pulau, dan status gunung api
 */

class AnalyticsModule {
  constructor() {
    this.charts = {
      aqiComparison: null,
      hotspotIsland: null,
      volcanoStatus: null
    };
  }

  /**
   * Inisialisasi atau pembaruan seluruh grafik
   */
  renderAllCharts({ airQualityStations = [], hotspots = [], volcanoes = [] }) {
    this.renderAqiChart(airQualityStations);
    this.renderHotspotIslandChart(hotspots);
    this.renderVolcanoStatusChart(volcanoes);
  }

  /**
   * Grafik 1: Perbandingan AQI dan PM2.5 antar kota
   */
  renderAqiChart(stations) {
    const ctx = document.getElementById('chartAqiComparison');
    if (!ctx) return;

    // Urutkan dari AQI tertinggi ke terendah
    const sorted = [...stations].sort((a, b) => b.aqi - a.aqi).slice(0, 10);
    const labels = sorted.map(s => s.name);
    const aqiValues = sorted.map(s => s.aqi);
    const colors = sorted.map(s => s.color);

    if (this.charts.aqiComparison) {
      this.charts.aqiComparison.destroy();
    }

    this.charts.aqiComparison = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'US AQI',
          data: aqiValues,
          backgroundColor: colors,
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const item = sorted[context.dataIndex];
                return `Kategori: ${item.category}\nPM2.5: ${item.pollutants.pm2_5.value} μg/m³\nISPU: ${item.ispu}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8', font: { size: 11 } },
            grid: { display: false }
          },
          y: {
            ticks: { color: '#94a3b8', font: { size: 11 } },
            grid: { color: 'rgba(255, 255, 255, 0.07)' },
            title: { display: true, text: 'Indeks AQI', color: '#64748b' }
          }
        }
      }
    });
  }

  /**
   * Grafik 2: Sebaran Hotspot NASA FIRMS per Pulau
   */
  renderHotspotIslandChart(hotspots) {
    const ctx = document.getElementById('chartHotspotIsland');
    if (!ctx) return;

    const islandMap = {};
    hotspots.forEach(h => {
      islandMap[h.island] = (islandMap[h.island] || 0) + 1;
    });

    const labels = Object.keys(islandMap);
    const counts = Object.values(islandMap);

    const islandColors = [
      '#f97316', '#ef4444', '#eab308', '#06b6d4', '#8b5cf6', '#10b981', '#64748b'
    ];

    if (this.charts.hotspotIsland) {
      this.charts.hotspotIsland.destroy();
    }

    this.charts.hotspotIsland = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: counts,
          backgroundColor: islandColors.slice(0, labels.length),
          borderColor: '#111827',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#cbd5e1', font: { size: 11 }, boxWidth: 12 }
          }
        },
        cutout: '65%'
      }
    });
  }

  /**
   * Grafik 3: Komposisi Status Level Aktivitas Gunung Api PVMBG
   */
  renderVolcanoStatusChart(volcanoes) {
    const ctx = document.getElementById('chartVolcanoStatus');
    if (!ctx) return;

    const levelCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    volcanoes.forEach(v => {
      levelCounts[v.level] = (levelCounts[v.level] || 0) + 1;
    });

    const labels = ['Level I (Normal)', 'Level II (Waspada)', 'Level III (Siaga)', 'Level IV (Awas)'];
    const data = [levelCounts[1], levelCounts[2], levelCounts[3], levelCounts[4]];
    const colors = ['#10b981', '#facc15', '#f97316', '#ef4444'];

    if (this.charts.volcanoStatus) {
      this.charts.volcanoStatus.destroy();
    }

    this.charts.volcanoStatus = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.map(c => c + 'aa'),
          borderColor: colors,
          borderWidth: 1.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#cbd5e1', font: { size: 11 }, boxWidth: 12 }
          }
        },
        scales: {
          r: {
            ticks: { display: false, color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.08)' }
          }
        }
      }
    });
  }
}

window.AnalyticsModule = AnalyticsModule;
