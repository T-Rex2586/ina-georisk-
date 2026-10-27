/**
 * Sistem Peringatan Dini (Early Warning Alert Engine)
 * Mendeteksi anomali erupsi gunung api, polusi udara kritis, dan kluster hotspot berdaya tinggi
 */

class AlertSystem {
  constructor() {
    this.alerts = [];
    this.listeners = [];
  }

  onAlertsUpdated(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb(this.alerts));
  }

  /**
   * Pindai seluruh data aktif untuk menemukan anomali dan risiko bencana
   */
  evaluateAlerts({ volcanoes = [], airQualityStations = [], hotspots = [] }) {
    const list = [];

    // 1. Evaluasi Gunung Api Level IV (Awas) dan Level III (Siaga)
    volcanoes.forEach(v => {
      if (v.level === 4) {
        list.push({
          id: `alert_volc_${v.id}`,
          type: 'volcano',
          severity: 'critical',
          icon: 'flame',
          title: `BAHAYA ERUPSI: ${v.name} (${v.statusText})`,
          location: `${v.province}`,
          lat: v.lat,
          lon: v.lon,
          details: `Tinggi kolom abu ${v.ashColumnMeters} m, arah sebaran ke ${v.currentAshDirection}. Radius zona bahaya ${v.dangerRadiusKm} km wajib steril.`,
          actionText: 'Lihat Gunung Api',
          timestamp: v.lastEruption
        });
      } else if (v.level === 3) {
        list.push({
          id: `alert_volc_${v.id}`,
          type: 'volcano',
          severity: 'warning',
          icon: 'alert-triangle',
          title: `PERINGATAN SIAGA: ${v.name} (${v.statusText})`,
          location: `${v.province}`,
          lat: v.lat,
          lon: v.lon,
          details: `Aktivitas vulkanik meningkat. Kolom hembusan ${v.ashColumnMeters} m ke arah ${v.currentAshDirection}. Hindari radius ${v.dangerRadiusKm} km.`,
          actionText: 'Lihat Gunung Api',
          timestamp: v.lastEruption
        });
      }
    });

    // 2. Evaluasi Kualitas Udara Tidak Sehat / Sangat Tidak Sehat
    airQualityStations.forEach(st => {
      if (st.aqi >= 200) {
        list.push({
          id: `alert_aqi_${st.id}`,
          type: 'air_quality',
          severity: 'critical',
          icon: 'wind',
          title: `KUALITAS UDARA SANGAT TIDAK SEHAT: ${st.name}`,
          location: `${st.province}`,
          lat: st.lat,
          lon: st.lon,
          details: `Indeks AQI mencapai ${st.aqi} (${st.category}). Konsentrasi PM2.5: ${st.pollutants.pm2_5.value} μg/m³. Hindari aktivitas luar ruangan.`,
          actionText: 'Lihat Stasiun',
          timestamp: 'Real-time'
        });
      } else if (st.aqi >= 150) {
        list.push({
          id: `alert_aqi_${st.id}`,
          type: 'air_quality',
          severity: 'warning',
          icon: 'alert-circle',
          title: `KUALITAS UDARA TIDAK SEHAT: ${st.name}`,
          location: `${st.province}`,
          lat: st.lat,
          lon: st.lon,
          details: `AQI ${st.aqi} (${st.category}), PM2.5: ${st.pollutants.pm2_5.value} μg/m³. Disarankan memakai masker pelindung pernapasan.`,
          actionText: 'Lihat Stasiun',
          timestamp: 'Real-time'
        });
      }
    });

    // 3. Evaluasi Titik Panas Intensitas Tinggi (FRP >= 50 MW)
    const severeHotspots = hotspots.filter(h => h.frp >= 60);
    if (severeHotspots.length > 0) {
      // Kelompokkan per provinsi
      const provMap = {};
      severeHotspots.forEach(h => {
        provMap[h.province] = provMap[h.province] || [];
        provMap[h.province].push(h);
      });

      Object.keys(provMap).forEach(prov => {
        const items = provMap[prov];
        const maxFrp = Math.max(...items.map(x => x.frp));
        const sample = items[0];

        list.push({
          id: `alert_hotspot_${prov.replace(/\s+/g, '_')}`,
          type: 'hotspot',
          severity: items.length >= 3 ? 'critical' : 'warning',
          icon: 'fire',
          title: `INDIKASI KARHUTLA TINGGI: ${prov}`,
          location: `${prov} (${sample.island})`,
          lat: sample.lat,
          lon: sample.lon,
          details: `Terdeteksi ${items.length} titik panas daya tinggi (FRP puncak: ${maxFrp} MW) satelit ${sample.sensor}. Potensi kabut asap pekat.`,
          actionText: 'Lihat Titik Panas',
          timestamp: `${sample.acqDate} ${sample.acqTime}`
        });
      });
    }

    // Urutkan: Critical terlebih dahulu, lalu Warning
    list.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      return 0;
    });

    this.alerts = list;
    this.notifyListeners();
    return this.alerts;
  }

  getAlerts() {
    return this.alerts;
  }

  getCriticalCount() {
    return this.alerts.filter(a => a.severity === 'critical').length;
  }

  getWarningCount() {
    return this.alerts.filter(a => a.severity === 'warning').length;
  }
}

window.AlertSystem = AlertSystem;
