export class AlertService {
  static evaluateAlerts({ volcanoes = [], airQualityStations = [], hotspots = [] }) {
    const list = [];

    // 1. Evaluasi Gunung Api
    volcanoes.forEach(v => {
      if (v.level === 4) {
        list.push({
          id: `alert_volc_${v.id}`,
          type: 'volcano',
          severity: 'critical',
          title: `BAHAYA ERUPSI: ${v.name} (${v.statusText})`,
          location: `${v.province}`,
          lat: v.lat,
          lon: v.lon,
          details: `Kolom letusan ${v.ashColumnMeters} m arah ${v.currentAshDirection}. Zona bahaya radius ${v.dangerRadiusKm} km wajib disterilkan.`,
          actionText: 'Lihat Gunung Api',
          timestamp: v.lastEruption
        });
      } else if (v.level === 3) {
        list.push({
          id: `alert_volc_${v.id}`,
          type: 'volcano',
          severity: 'warning',
          title: `PERINGATAN SIAGA: ${v.name} (${v.statusText})`,
          location: `${v.province}`,
          lat: v.lat,
          lon: v.lon,
          details: `Aktivitas vulkanik meningkat. Kolom hembusan ${v.ashColumnMeters} m arah ${v.currentAshDirection}. Hindari radius ${v.dangerRadiusKm} km.`,
          actionText: 'Lihat Gunung Api',
          timestamp: v.lastEruption
        });
      }
    });

    // 2. Evaluasi Polusi Udara
    airQualityStations.forEach(st => {
      if (st.aqi >= 200) {
        list.push({
          id: `alert_aqi_${st.id}`,
          type: 'airQuality',
          severity: 'critical',
          title: `KUALITAS UDARA SANGAT TIDAK SEHAT: ${st.name}`,
          location: `${st.province}`,
          lat: st.lat,
          lon: st.lon,
          details: `AQI ${st.aqi} (${st.category}). PM2.5: ${st.pollutants.pm2_5.value} μg/m³. Hindari aktivitas luar ruangan.`,
          actionText: 'Lihat Stasiun',
          timestamp: 'Real-time'
        });
      } else if (st.aqi >= 150) {
        list.push({
          id: `alert_aqi_${st.id}`,
          type: 'airQuality',
          severity: 'warning',
          title: `KUALITAS UDARA TIDAK SEHAT: ${st.name}`,
          location: `${st.province}`,
          lat: st.lat,
          lon: st.lon,
          details: `AQI ${st.aqi} (${st.category}), PM2.5: ${st.pollutants.pm2_5.value} μg/m³. Gunakan masker N95.`,
          actionText: 'Lihat Stasiun',
          timestamp: 'Real-time'
        });
      }
    });

    // 3. Evaluasi Titik Panas Karhutla Berdaya Tinggi
    const severeHotspots = hotspots.filter(h => h.frp >= 50);
    if (severeHotspots.length > 0) {
      const provMap = {};
      severeHotspots.forEach(h => {
        const key = h.province || h.island;
        provMap[key] = provMap[key] || [];
        provMap[key].push(h);
      });

      Object.keys(provMap).forEach(key => {
        const items = provMap[key];
        const maxFrp = Math.max(...items.map(x => x.frp));
        const sample = items[0];

        list.push({
          id: `alert_hotspot_${key.replace(/\s+/g, '_')}`,
          type: 'hotspot',
          severity: items.length >= 3 ? 'critical' : 'warning',
          title: `INDIKASI KARHUTLA TINGGI: ${key}`,
          location: `${key} (${sample.island})`,
          lat: sample.lat,
          lon: sample.lon,
          details: `Terdeteksi ${items.length} titik panas daya tinggi (FRP puncak: ${maxFrp} MW) satelit ${sample.sensor}. Potensi kabut asap pekat.`,
          actionText: 'Lihat Titik Panas',
          timestamp: `${sample.acqDate} ${sample.acqTime}`
        });
      });
    }

    // Sort: critical first, then warning
    list.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      return 0;
    });

    return list;
  }
}
