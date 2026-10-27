export class ExportService {
  static triggerDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static arrayToCsv(data) {
    if (!data || !data.length) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const values = headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\r\n');
  }

  static exportVolcanoes(volcanoes, format = 'csv') {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `ina_gunung_api_${dateStr}.${format}`;
    const flat = volcanoes.map(v => ({
      nama_gunung: v.name,
      provinsi: v.province,
      pulau: v.island,
      latitude: v.lat,
      longitude: v.lon,
      elevasi_mdpl: v.elevation,
      level_pvmbg: v.level,
      status: v.statusText,
      erupsi_terakhir: v.lastEruption,
      tinggi_kolom_abu_meter: v.ashColumnMeters,
      radius_bahaya_km: v.dangerRadiusKm,
      arah_sebaran_abu: v.currentAshDirection,
      rekomendasi: v.recommendation
    }));

    if (format === 'json') {
      this.triggerDownload(JSON.stringify(flat, null, 2), filename, 'application/json');
    } else {
      this.triggerDownload(this.arrayToCsv(flat), filename, 'text/csv;charset=utf-8;');
    }
  }

  static exportAirQuality(stations, format = 'csv') {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `ina_kualitas_udara_${dateStr}.${format}`;
    const flat = stations.map(s => ({
      kota: s.name,
      provinsi: s.province,
      latitude: s.lat,
      longitude: s.lon,
      waktu_pantau: s.timestamp,
      us_aqi: s.aqi,
      ispu_indonesia: s.ispu,
      kategori: s.category,
      pm2_5_ugm3: s.pollutants.pm2_5.value,
      pm10_ugm3: s.pollutants.pm10.value,
      co_ugm3: s.pollutants.co.value,
      no2_ugm3: s.pollutants.no2.value,
      so2_ugm3: s.pollutants.so2.value,
      o3_ugm3: s.pollutants.o3.value,
      sumber: s.source
    }));

    if (format === 'json') {
      this.triggerDownload(JSON.stringify(flat, null, 2), filename, 'application/json');
    } else {
      this.triggerDownload(this.arrayToCsv(flat), filename, 'text/csv;charset=utf-8;');
    }
  }

  static exportHotspots(hotspots, format = 'csv') {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `ina_hotspot_firms_${dateStr}.${format}`;
    const flat = hotspots.map(h => ({
      latitude: h.lat,
      longitude: h.lon,
      frp_megawatt: h.frp,
      brightness_kelvin: h.brightness,
      confidence: h.confidence,
      tanggal_akuisisi: h.acqDate,
      jam_akuisisi: h.acqTime,
      satelit: h.satellite,
      sensor: h.sensor,
      provinsi: h.province || '-',
      pulau: h.island,
      siang_malam: h.daynight || 'D'
    }));

    if (format === 'json') {
      this.triggerDownload(JSON.stringify(flat, null, 2), filename, 'application/json');
    } else {
      this.triggerDownload(this.arrayToCsv(flat), filename, 'text/csv;charset=utf-8;');
    }
  }

  static exportUnifiedReport({ volcanoes, airQuality, hotspots, alerts }) {
    const dateStr = new Date().toISOString();
    const payload = {
      title: 'Laporan Komprehensif Risiko Lingkungan-Atmosferik Indonesia',
      generatedAt: dateStr,
      version: '2.0-React',
      summary: {
        totalGunung: volcanoes.length,
        gunungSiagaAwas: volcanoes.filter(v => v.level >= 3).length,
        totalStasiunUdara: airQuality.length,
        udaraTidakSehat: airQuality.filter(a => a.aqi >= 150).length,
        totalHotspot: hotspots.length,
        hotspotTinggiFrp: hotspots.filter(h => h.frp >= 50).length,
        totalAlerts: alerts.length
      },
      peringatanAktif: alerts,
      dataGunungApi: volcanoes,
      dataKualitasUdara: airQuality,
      dataHotspot: hotspots
    };

    const filename = `ina_laporan_risiko_${dateStr.split('T')[0]}.json`;
    this.triggerDownload(JSON.stringify(payload, null, 2), filename, 'application/json');
  }
}
