/**
 * Aplikasi Utama: Dashboard Pemantauan Gunung Api, Kualitas Udara, Titik Panas, dan Angin Indonesia
 * Mengorkestrasi peta Leaflet, sinkronisasi layer data, UI panel, dan sistem peringatan
 */

class IndonesiaRiskDashboard {
  constructor() {
    this.map = null;
    this.baseLayers = {};
    this.layerGroups = {
      volcanoes: null,
      ashPlumes: null,
      dangerZones: null,
      airQuality: null,
      hotspots: null,
      windVectors: null
    };

    // Services
    this.airQualityService = new AirQualityService();
    this.hotspotService = new HotspotService();
    this.windService = new WindService();
    this.alertSystem = new AlertSystem();
    this.analyticsModule = new AnalyticsModule();

    // Data state
    this.data = {
      volcanoes: window.VOLCANO_DATABASE || [],
      airQualityStations: [],
      hotspots: [],
      windStations: [],
      alerts: []
    };

    // Active layer toggles
    this.layerVisibility = {
      volcanoes: true,
      ashPlumes: true,
      dangerZones: true,
      airQuality: true,
      hotspots: true,
      windVectors: true
    };
  }

  async init() {
    this.initClock();
    this.initMap();
    this.setupEventListeners();
    await this.loadAllData();
    this.renderAllLayers();
    this.updateMetricCards();
    this.setupAlertListeners();
    this.alertSystem.evaluateAlerts({
      volcanoes: this.data.volcanoes,
      airQualityStations: this.data.airQualityStations,
      hotspots: this.data.hotspots
    });
    this.analyticsModule.renderAllCharts(this.data);
    this.hideLoadingOverlay();
  }

  /**
   * Jam live format WIB / WITA / WIT
   */
  initClock() {
    const updateTime = () => {
      const now = new Date();
      const el = document.getElementById('liveClock');
      if (el) {
        el.textContent = now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' WIB';
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  /**
   * Inisialisasi Peta Leaflet dengan Base Map Dark & Satelit
   */
  initMap() {
    const defaultCfg = CONFIG.MAP_DEFAULT;
    this.map = L.map('map', {
      center: [defaultCfg.lat, defaultCfg.lon],
      zoom: defaultCfg.zoom,
      minZoom: defaultCfg.minZoom,
      maxZoom: defaultCfg.maxZoom,
      zoomControl: false
    });

    // Pindahkan zoom control ke kanan atas
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // Tile Layers
    const darkTile = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> | Data: PVMBG, Open-Meteo, NASA FIRMS',
      subdomains: 'abcd',
      maxZoom: 19
    });

    const satelliteTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, Maxar, Earthstar Geographics',
      maxZoom: 19
    });

    darkTile.addTo(this.map);
    this.baseLayers = { dark: darkTile, satellite: satelliteTile };

    // Inisialisasi layer groups
    this.layerGroups.volcanoes = L.layerGroup().addTo(this.map);
    this.layerGroups.ashPlumes = L.layerGroup().addTo(this.map);
    this.layerGroups.dangerZones = L.layerGroup().addTo(this.map);
    this.layerGroups.airQuality = L.layerGroup().addTo(this.map);
    this.layerGroups.hotspots = L.layerGroup().addTo(this.map);
    this.layerGroups.windVectors = L.layerGroup().addTo(this.map);

    // Batasi panning hanya di sekitar Indonesia
    this.map.setMaxBounds([
      [-15.0, 90.0],
      [10.0, 145.0]
    ]);
  }

  /**
   * Memuat data dari semua service secara paralel
   */
  async loadAllData() {
    try {
      const [aqData, windData, hotData] = await Promise.all([
        this.airQualityService.fetchAllStations(),
        this.windService.fetchAllWindStations(),
        this.hotspotService.loadHotspots()
      ]);

      this.data.airQualityStations = aqData;
      this.data.windStations = windData;
      this.data.hotspots = hotData;
    } catch (err) {
      console.error('Error saat memuat data integrasi:', err);
    }
  }

  /**
   * Render seluruh layer ke peta
   */
  renderAllLayers() {
    if (this.layerVisibility.volcanoes) this.renderVolcanoLayer();
    if (this.layerVisibility.airQuality) this.renderAirQualityLayer();
    if (this.layerVisibility.hotspots) this.renderHotspotLayer();
    if (this.layerVisibility.windVectors) this.renderWindLayer();
  }

  /**
   * 1. Layer Gunung Api & Sebaran Abu Vulkanik (PVMBG)
   */
  renderVolcanoLayer() {
    this.layerGroups.volcanoes.clearLayers();
    this.layerGroups.ashPlumes.clearLayers();
    this.layerGroups.dangerZones.clearLayers();

    this.data.volcanoes.forEach(v => {
      const levelInfo = CONFIG.VOLCANO_LEVELS[v.level] || CONFIG.VOLCANO_LEVELS[1];
      const isCritical = v.level >= 3;

      // Custom HTML Marker Icon
      const pulseHtml = isCritical ? `<div class="marker-pulse-ring" style="border-color: ${levelInfo.color}"></div>` : '';
      const iconHtml = `
        <div class="volcano-custom-marker level-${v.level}">
          ${pulseHtml}
          <div class="volcano-badge" style="background: ${levelInfo.color}; box-shadow: 0 0 12px ${levelInfo.color}88">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 20h20L13 4l-2 5-2-3-7 14z"/>
            </svg>
          </div>
          <span class="marker-label">${v.name.replace('Gunung ', '')}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([v.lat, v.lon], { icon: customIcon });

      // Popup ringkas
      marker.bindPopup(this.createVolcanoPopup(v, levelInfo));
      marker.on('click', () => this.openInspector('volcano', v));
      this.layerGroups.volcanoes.addLayer(marker);

      // Zona Bahaya (Radius Circle)
      if (v.dangerRadiusKm > 0 && this.layerVisibility.dangerZones) {
        const circle = L.circle([v.lat, v.lon], {
          radius: v.dangerRadiusKm * 1000,
          color: levelInfo.color,
          weight: 1.5,
          dashArray: '4, 4',
          fillColor: levelInfo.color,
          fillOpacity: 0.12
        });
        circle.bindTooltip(`Zona Bahaya: ${v.dangerRadiusKm} km`, { sticky: true });
        this.layerGroups.dangerZones.addLayer(circle);
      }

      // Kerucut Sebaran Abu Vulkanik (Plume Cone)
      if (v.level >= 2 && v.currentAshDirectionDeg !== null && this.layerVisibility.ashPlumes) {
        // Arah abu mengikuti angin lokal di sekitar gunung
        const localWind = this.windService.getWindAtLocation(v.lat, v.lon);
        const plumeDirectionDeg = v.currentAshDirectionDeg || localWind.directionDeg;
        const plumeDistanceKm = Math.min(80, Math.max(25, (v.ashColumnMeters / 40) + (localWind.speedKmH * 1.5)));

        const plumeCoords = window.calculateAshPlumePolygon(v.lat, v.lon, plumeDirectionDeg, plumeDistanceKm, 42);
        if (plumeCoords) {
          const plumePolygon = L.polygon(plumeCoords, {
            color: levelInfo.color,
            weight: 1.2,
            dashArray: '3, 5',
            fillColor: '#64748b',
            fillOpacity: 0.35
          });

          plumePolygon.bindTooltip(`Sebaran Abu ${v.name}<br>Arah: ${v.currentAshDirection} (${plumeDirectionDeg}°)<br>Jangkauan: ±${Math.round(plumeDistanceKm)} km`, { sticky: true });
          this.layerGroups.ashPlumes.addLayer(plumePolygon);
        }
      }
    });
  }

  createVolcanoPopup(v, levelInfo) {
    return `
      <div class="popup-container">
        <div class="popup-header" style="border-left: 4px solid ${levelInfo.color}; padding-left: 8px;">
          <h4 style="margin: 0; color: #f8fafc; font-size: 14px;">${v.name}</h4>
          <span class="popup-badge" style="background: ${levelInfo.bgLight}; color: ${levelInfo.color}; border: 1px solid ${levelInfo.color}66;">
            ${v.statusText}
          </span>
        </div>
        <div class="popup-body" style="margin-top: 8px; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
          <div><strong>Elevasi:</strong> ${v.elevation} mdpl</div>
          <div><strong>Provinsi:</strong> ${v.province}</div>
          <div><strong>Erupsi Terakhir:</strong> ${v.lastEruption}</div>
          <div><strong>Kolom Abu:</strong> ${v.ashColumnMeters} m (${v.currentAshDirection})</div>
          <div><strong>Zona Bahaya:</strong> Radius ${v.dangerRadiusKm} km</div>
        </div>
        <button class="btn-popup-inspect" onclick="window.dashboard.openInspector('volcano', '${v.id}')">Detail Aktivitas & Evakuasi</button>
      </div>
    `;
  }

  /**
   * 2. Layer Kualitas Udara (Open-Meteo AQI / ISPU)
   */
  renderAirQualityLayer() {
    this.layerGroups.airQuality.clearLayers();

    this.data.airQualityStations.forEach(st => {
      const iconHtml = `
        <div class="aqi-custom-marker" style="background: ${st.color}; box-shadow: 0 0 10px ${st.color}99;">
          <span class="aqi-val">${st.aqi}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([st.lat, st.lon], { icon: customIcon });

      marker.bindPopup(`
        <div class="popup-container">
          <div class="popup-header" style="border-left: 4px solid ${st.color}; padding-left: 8px;">
            <h4 style="margin: 0; color: #f8fafc; font-size: 14px;">${st.name}</h4>
            <span class="popup-badge" style="background: ${st.color}22; color: ${st.color}; border: 1px solid ${st.color};">
              AQI ${st.aqi} - ${st.category}
            </span>
          </div>
          <div class="popup-body" style="margin-top: 8px; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
            <div><strong>ISPU Indonesia:</strong> ${st.ispu}</div>
            <div><strong>PM2.5:</strong> ${st.pollutants.pm2_5.value} μg/m³</div>
            <div><strong>PM10:</strong> ${st.pollutants.pm10.value} μg/m³</div>
            <div><strong>CO:</strong> ${st.pollutants.co.value} μg/m³ | <strong>SO2:</strong> ${st.pollutants.so2.value} μg/m³</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">${st.categoryDesc}</div>
          </div>
          <button class="btn-popup-inspect" onclick="window.dashboard.openInspector('airQuality', '${st.id}')">Breakdown Polutan Lengkap</button>
        </div>
      `);

      marker.on('click', () => this.openInspector('airQuality', st));
      this.layerGroups.airQuality.addLayer(marker);
    });
  }

  /**
   * 3. Layer Titik Panas / Hotspot (NASA FIRMS)
   */
  renderHotspotLayer() {
    this.layerGroups.hotspots.clearLayers();

    this.data.hotspots.forEach(h => {
      // Skala radius & warna berdasarkan Fire Radiative Power (FRP)
      const radius = Math.min(14, Math.max(5, 4 + Math.sqrt(h.frp) * 1.1));
      let color = '#facc15'; // Kuning (< 20 MW)
      if (h.frp >= 20 && h.frp < 50) color = '#f97316'; // Oranye
      else if (h.frp >= 50) color = '#ef4444'; // Merah tinggi

      const circle = L.circleMarker([h.lat, h.lon], {
        radius: radius,
        fillColor: color,
        color: '#ffffff',
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.75
      });

      circle.bindPopup(`
        <div class="popup-container">
          <div class="popup-header" style="border-left: 4px solid ${color}; padding-left: 8px;">
            <h4 style="margin: 0; color: #f8fafc; font-size: 14px;">Titik Panas (Hotspot) Karhutla</h4>
            <span class="popup-badge" style="background: ${color}22; color: ${color}; border: 1px solid ${color};">
              FRP ${h.frp} MW (${h.sensor})
            </span>
          </div>
          <div class="popup-body" style="margin-top: 8px; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
            <div><strong>Wilayah:</strong> ${h.province || h.island}</div>
            <div><strong>Koordinat:</strong> ${h.lat}, ${h.lon}</div>
            <div><strong>Tingkat Keyakinan:</strong> ${h.confidence}</div>
            <div><strong>Temperatur Kecerahan:</strong> ${h.brightness} K</div>
            <div><strong>Satelit:</strong> ${h.satellite} (${h.acqDate} ${h.acqTime})</div>
          </div>
          <button class="btn-popup-inspect" onclick="window.dashboard.openInspector('hotspot', '${h.id}')">Inspeksi Analisis Karhutla</button>
        </div>
      `);

      circle.on('click', () => this.openInspector('hotspot', h));
      this.layerGroups.hotspots.addLayer(circle);
    });
  }

  /**
   * 4. Layer Vektor Arah & Kecepatan Angin (Open-Meteo Weather)
   */
  renderWindLayer() {
    this.layerGroups.windVectors.clearLayers();

    this.data.windStations.forEach(w => {
      // Rotasi panah sesuai derajat tiupan angin
      const arrowHtml = `
        <div class="wind-arrow-container" title="Angin: ${w.speedKmH} km/h (${w.cardinalDirection})">
          <div class="wind-arrow" style="transform: rotate(${w.directionDeg}deg);">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </div>
          <span class="wind-speed-badge">${w.speedKmH} <small>km/h</small></span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: arrowHtml,
        className: 'custom-div-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([w.lat, w.lon], { icon: customIcon });

      marker.bindPopup(`
        <div class="popup-container">
          <div class="popup-header" style="border-left: 4px solid #38bdf8; padding-left: 8px;">
            <h4 style="margin: 0; color: #f8fafc; font-size: 14px;">Dinamika Aliran Angin: ${w.name}</h4>
            <span class="popup-badge" style="background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid #38bdf8;">
              ${w.speedKmH} km/h (${w.cardinalDirection})
            </span>
          </div>
          <div class="popup-body" style="margin-top: 8px; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
            <div><strong>Arah Mata Angin:</strong> ${w.cardinalDirection} (${w.directionDeg}°)</div>
            <div><strong>Temperatur:</strong> ${w.temperatureC} °C</div>
            <div><strong>Kelembapan Udara:</strong> ${w.humidityPct}%</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
              Digunakan memprediksi lintasan asap karhutla dan dispersi abu vulkanik.
            </div>
          </div>
        </div>
      `);

      this.layerGroups.windVectors.addLayer(marker);
    });
  }

  /**
   * Mengatur listener event UI (toggles, filters, modals)
   */
  setupEventListeners() {
    // 1. Layer Toggles
    const toggles = [
      { id: 'toggleVolcanoes', prop: 'volcanoes', group: this.layerGroups.volcanoes },
      { id: 'toggleAshPlumes', prop: 'ashPlumes', group: this.layerGroups.ashPlumes },
      { id: 'toggleDangerZones', prop: 'dangerZones', group: this.layerGroups.dangerZones },
      { id: 'toggleAirQuality', prop: 'airQuality', group: this.layerGroups.airQuality },
      { id: 'toggleHotspots', prop: 'hotspots', group: this.layerGroups.hotspots },
      { id: 'toggleWindVectors', prop: 'windVectors', group: this.layerGroups.windVectors }
    ];

    toggles.forEach(t => {
      const el = document.getElementById(t.id);
      if (el) {
        el.checked = this.layerVisibility[t.prop];
        el.addEventListener('change', (e) => {
          this.layerVisibility[t.prop] = e.target.checked;
          if (e.target.checked) {
            if (!this.map.hasLayer(t.group)) this.map.addLayer(t.group);
            // Refresh bila perlu
            if (t.prop === 'volcanoes' || t.prop === 'ashPlumes' || t.prop === 'dangerZones') this.renderVolcanoLayer();
          } else {
            if (this.map.hasLayer(t.group)) this.map.removeLayer(t.group);
          }
        });
      }
    });

    // 2. Base map toggle (Dark vs Satellite)
    const baseMapSelect = document.getElementById('baseMapSelect');
    if (baseMapSelect) {
      baseMapSelect.addEventListener('change', (e) => {
        if (e.target.value === 'satellite') {
          this.map.removeLayer(this.baseLayers.dark);
          this.map.addLayer(this.baseLayers.satellite);
        } else {
          this.map.removeLayer(this.baseLayers.satellite);
          this.map.addLayer(this.baseLayers.dark);
        }
      });
    }

    // 3. Hotspot Filters (Rentang Waktu & Sensor)
    const timeFilter = document.getElementById('hotspotTimeFilter');
    if (timeFilter) {
      timeFilter.addEventListener('change', (e) => {
        this.data.hotspots = this.hotspotService.applyFilters({ timeRange: e.target.value });
        this.renderHotspotLayer();
        this.updateMetricCards();
        this.analyticsModule.renderHotspotIslandChart(this.data.hotspots);
      });
    }

    const sensorFilter = document.getElementById('hotspotSensorFilter');
    if (sensorFilter) {
      sensorFilter.addEventListener('change', (e) => {
        this.data.hotspots = this.hotspotService.applyFilters({ sensor: e.target.value });
        this.renderHotspotLayer();
        this.updateMetricCards();
        this.analyticsModule.renderHotspotIslandChart(this.data.hotspots);
      });
    }

    const frpSlider = document.getElementById('hotspotFrpSlider');
    const frpValLabel = document.getElementById('hotspotFrpVal');
    if (frpSlider && frpValLabel) {
      frpSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        frpValLabel.textContent = `${val} MW`;
        this.data.hotspots = this.hotspotService.applyFilters({ minFrp: val });
        this.renderHotspotLayer();
        this.updateMetricCards();
      });
    }

    // 4. Quick Search
    const searchInput = document.getElementById('searchQuery');
    const searchBtn = document.getElementById('btnSearch');
    if (searchInput) {
      const handleSearch = () => {
        const q = searchInput.value.trim().toLowerCase();
        if (!q) return;

        // Cari di gunung api
        const foundVolcano = this.data.volcanoes.find(v => v.name.toLowerCase().includes(q) || v.province.toLowerCase().includes(q));
        if (foundVolcano) {
          this.map.flyTo([foundVolcano.lat, foundVolcano.lon], 9, { duration: 1.5 });
          this.openInspector('volcano', foundVolcano);
          return;
        }

        // Cari di stasiun kualitas udara
        const foundAqi = this.data.airQualityStations.find(s => s.name.toLowerCase().includes(q) || s.province.toLowerCase().includes(q));
        if (foundAqi) {
          this.map.flyTo([foundAqi.lat, foundAqi.lon], 9, { duration: 1.5 });
          this.openInspector('airQuality', foundAqi);
          return;
        }

        alert(`Lokasi "${searchInput.value}" tidak ditemukan dalam daftar pemantauan.`);
      };

      if (searchBtn) searchBtn.addEventListener('click', handleSearch);
      searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSearch(); });
    }

    // 5. Drawer Close Buttons
    const btnCloseInspector = document.getElementById('btnCloseInspector');
    if (btnCloseInspector) {
      btnCloseInspector.addEventListener('click', () => {
        document.getElementById('inspectorDrawer').classList.remove('open');
      });
    }

    // 6. Header Action Buttons (Analytics, Alerts, Export, Settings)
    const btnOpenAnalytics = document.getElementById('btnOpenAnalytics');
    const analyticsModal = document.getElementById('analyticsModal');
    const btnCloseAnalytics = document.getElementById('btnCloseAnalytics');

    if (btnOpenAnalytics && analyticsModal) {
      btnOpenAnalytics.addEventListener('click', () => {
        analyticsModal.classList.add('active');
        this.analyticsModule.renderAllCharts(this.data);
      });
    }
    if (btnCloseAnalytics && analyticsModal) {
      btnCloseAnalytics.addEventListener('click', () => analyticsModal.classList.remove('active'));
    }

    // Alert Modal
    const btnOpenAlerts = document.getElementById('btnOpenAlerts');
    const alertModal = document.getElementById('alertModal');
    const btnCloseAlerts = document.getElementById('btnCloseAlerts');
    if (btnOpenAlerts && alertModal) {
      btnOpenAlerts.addEventListener('click', () => {
        this.renderAlertModalList();
        alertModal.classList.add('active');
      });
    }
    if (btnCloseAlerts && alertModal) {
      btnCloseAlerts.addEventListener('click', () => alertModal.classList.remove('active'));
    }

    // Export Modal
    const btnOpenExport = document.getElementById('btnOpenExport');
    const exportModal = document.getElementById('exportModal');
    const btnCloseExport = document.getElementById('btnCloseExport');
    if (btnOpenExport && exportModal) {
      btnOpenExport.addEventListener('click', () => exportModal.classList.add('active'));
    }
    if (btnCloseExport && exportModal) {
      btnCloseExport.addEventListener('click', () => exportModal.classList.remove('active'));
    }

    // Settings Modal (NASA FIRMS KEY)
    const btnOpenSettings = document.getElementById('btnOpenSettings');
    const settingsModal = document.getElementById('settingsModal');
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    const btnSaveSettings = document.getElementById('btnSaveSettings');
    const inputFirmsKey = document.getElementById('inputFirmsKey');

    if (btnOpenSettings && settingsModal) {
      btnOpenSettings.addEventListener('click', () => {
        if (inputFirmsKey) inputFirmsKey.value = this.hotspotService.getMapKey();
        settingsModal.classList.add('active');
      });
    }
    if (btnCloseSettings && settingsModal) {
      btnCloseSettings.addEventListener('click', () => settingsModal.classList.remove('active'));
    }
    if (btnSaveSettings && inputFirmsKey) {
      btnSaveSettings.addEventListener('click', async () => {
        this.hotspotService.setMapKey(inputFirmsKey.value);
        settingsModal.classList.remove('active');
        this.showToast('Memperbarui data NASA FIRMS...');
        this.data.hotspots = await this.hotspotService.loadHotspots();
        this.renderHotspotLayer();
        this.updateMetricCards();
        this.showToast('Data satelit FIRMS berhasil diperbarui!');
      });
    }

    // Setup Export Action Buttons (CSV / JSON)
    this.setupExportActions();
  }

  /**
   * Menyiapkan tombol trigger ekspor data CSV & JSON
   */
  setupExportActions() {
    const bindClick = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };

    bindClick('btnExportVolcanoCsv', () => DataExporter.exportVolcanoes(this.data.volcanoes, 'csv'));
    bindClick('btnExportVolcanoJson', () => DataExporter.exportVolcanoes(this.data.volcanoes, 'json'));

    bindClick('btnExportAqiCsv', () => DataExporter.exportAirQuality(this.data.airQualityStations, 'csv'));
    bindClick('btnExportAqiJson', () => DataExporter.exportAirQuality(this.data.airQualityStations, 'json'));

    bindClick('btnExportHotspotCsv', () => DataExporter.exportHotspots(this.data.hotspots, 'csv'));
    bindClick('btnExportHotspotJson', () => DataExporter.exportHotspots(this.data.hotspots, 'json'));

    bindClick('btnExportUnifiedJson', () => {
      DataExporter.exportUnifiedRiskReport({
        volcanoes: this.data.volcanoes,
        airQuality: this.data.airQualityStations,
        hotspots: this.data.hotspots,
        alerts: this.alertSystem.getAlerts()
      });
    });
  }

  /**
   * Memperbarui kartu metrik overview di panel kiri
   */
  updateMetricCards() {
    // 1. Gunung Siaga/Awas
    const highVolcanoes = this.data.volcanoes.filter(v => v.level >= 3).length;
    const elVolc = document.getElementById('metricVolcanoCount');
    if (elVolc) elVolc.textContent = highVolcanoes;

    // 2. Kualitas Udara Rata-rata & Kritis
    if (this.data.airQualityStations.length > 0) {
      const avgAqi = Math.round(
        this.data.airQualityStations.reduce((sum, s) => sum + s.aqi, 0) / this.data.airQualityStations.length
      );
      const unhealthyCount = this.data.airQualityStations.filter(s => s.aqi >= 150).length;
      const elAqi = document.getElementById('metricAqiAvg');
      const elAqiSub = document.getElementById('metricAqiSub');
      if (elAqi) elAqi.textContent = avgAqi;
      if (elAqiSub) elAqiSub.textContent = `${unhealthyCount} kota Tidak Sehat`;
    }

    // 3. Hotspot Aktif
    const elHotspot = document.getElementById('metricHotspotCount');
    const elHotspotSub = document.getElementById('metricHotspotSub');
    if (elHotspot) elHotspot.textContent = this.data.hotspots.length;
    if (elHotspotSub) {
      const highFrp = this.hotspotService.getHighFrpCount();
      elHotspotSub.textContent = `${highFrp} titik FRP > 50 MW`;
    }

    // 4. Alert Badge
    const criticalAlerts = this.alertSystem.getCriticalCount();
    const totalAlerts = this.alertSystem.getAlerts().length;
    const elAlertBadge = document.getElementById('headerAlertCount');
    if (elAlertBadge) {
      elAlertBadge.textContent = totalAlerts;
      elAlertBadge.className = criticalAlerts > 0 ? 'badge-pill alert-critical' : 'badge-pill alert-warning';
    }
  }

  /**
   * Listener Sistem Peringatan Dini untuk Ticker Banner & Modal
   */
  setupAlertListeners() {
    this.alertSystem.onAlertsUpdated((alerts) => {
      this.updateTicker(alerts);
      this.updateMetricCards();
    });
  }

  updateTicker(alerts) {
    const tickerEl = document.getElementById('alertTickerContent');
    if (!tickerEl) return;

    if (!alerts || alerts.length === 0) {
      tickerEl.innerHTML = '<span class="ticker-item green">Kondisi Terkendali: Tidak terdeteksi anomali kritis lingkungan.</span>';
      return;
    }

    const itemsHtml = alerts.map(a => {
      const colorCls = a.severity === 'critical' ? 'critical' : 'warning';
      return `
        <span class="ticker-item ${colorCls}" onclick="window.dashboard.flyToAlert('${a.id}')">
          <strong>[${a.title}]</strong> ${a.details}
        </span>
      `;
    }).join(' &nbsp;•&nbsp; ');

    tickerEl.innerHTML = itemsHtml;
  }

  flyToAlert(alertId) {
    const alertItem = this.alertSystem.getAlerts().find(a => a.id === alertId);
    if (!alertItem) return;

    this.map.flyTo([alertItem.lat, alertItem.lon], 9, { duration: 1.5 });
    
    // Buka detail sesuai tipe
    if (alertItem.type === 'volcano') {
      const v = this.data.volcanoes.find(item => item.lat === alertItem.lat && item.lon === alertItem.lon);
      if (v) this.openInspector('volcano', v);
    } else if (alertItem.type === 'airQuality') {
      const st = this.data.airQualityStations.find(item => item.lat === alertItem.lat && item.lon === alertItem.lon);
      if (st) this.openInspector('airQuality', st);
    }
  }

  renderAlertModalList() {
    const listEl = document.getElementById('alertModalList');
    if (!listEl) return;

    const alerts = this.alertSystem.getAlerts();
    if (!alerts || alerts.length === 0) {
      listEl.innerHTML = '<div style="padding: 24px; text-align: center; color: #94a3b8;">Tidak ada peringatan aktif saat ini.</div>';
      return;
    }

    listEl.innerHTML = alerts.map(a => {
      const borderCol = a.severity === 'critical' ? '#ef4444' : '#f97316';
      return `
        <div class="alert-card-item" style="border-left: 4px solid ${borderCol};">
          <div class="alert-card-header">
            <div>
              <h4 style="margin: 0; color: #f8fafc; font-size: 14px;">${a.title}</h4>
              <span style="font-size: 11px; color: #94a3b8;">${a.location} • ${a.timestamp}</span>
            </div>
            <span class="badge-status ${a.severity}">${a.severity.toUpperCase()}</span>
          </div>
          <p style="margin: 8px 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">${a.details}</p>
          <button class="btn-sm-action" onclick="document.getElementById('alertModal').classList.remove('active'); window.dashboard.flyToAlert('${a.id}')">
            ${a.actionText} di Peta &rarr;
          </button>
        </div>
      `;
    }).join('');
  }

  /**
   * Membuka Drawer Inspeksi Samping (Side Inspector)
   */
  openInspector(type, dataOrId) {
    const drawer = document.getElementById('inspectorDrawer');
    const content = document.getElementById('inspectorContent');
    if (!drawer || !content) return;

    let item = dataOrId;
    if (typeof dataOrId === 'string') {
      if (type === 'volcano') item = this.data.volcanoes.find(x => x.id === dataOrId);
      if (type === 'airQuality') item = this.data.airQualityStations.find(x => x.id === dataOrId);
      if (type === 'hotspot') item = this.data.hotspots.find(x => x.id === dataOrId);
    }

    if (!item) return;

    if (type === 'volcano') {
      const level = CONFIG.VOLCANO_LEVELS[item.level];
      const localWind = this.windService.getWindAtLocation(item.lat, item.lon);
      content.innerHTML = `
        <div class="inspector-section">
          <div class="badge-status" style="background: ${level.bgLight}; color: ${level.color}; border: 1px solid ${level.color}; display: inline-block;">
            ${item.statusText}
          </div>
          <h2 style="color: #f8fafc; margin: 8px 0 4px 0;">${item.name}</h2>
          <div style="font-size: 13px; color: #94a3b8;">${item.province} (${item.island}) • ${item.elevation} mdpl</div>
        </div>

        <div class="inspector-section">
          <h4 class="section-title">Aktivitas Letusan Terkini</h4>
          <div class="info-grid">
            <div class="info-box">
              <span class="label">Waktu Erupsi</span>
              <span class="val">${item.lastEruption}</span>
            </div>
            <div class="info-box">
              <span class="label">Tinggi Kolom Abu</span>
              <span class="val" style="color: ${level.color};">${item.ashColumnMeters} m</span>
            </div>
            <div class="info-box">
              <span class="label">Arah Sebaran Abu</span>
              <span class="val">${item.currentAshDirection}</span>
            </div>
            <div class="info-box">
              <span class="label">Radius Zona Bahaya</span>
              <span class="val" style="color: #ef4444;">${item.dangerRadiusKm} km</span>
            </div>
          </div>
          <p style="font-size: 12px; color: #cbd5e1; line-height: 1.6; margin-top: 10px;">
            ${item.activitySummary}
          </p>
        </div>

        <div class="inspector-section">
          <h4 class="section-title">Korelasi Arah Angin Lokal</h4>
          <div class="wind-correlation-box">
            <div><strong>Kecepatan Angin:</strong> ${localWind.speedKmH} km/h</div>
            <div><strong>Arah Tiupan:</strong> ${localWind.cardinalDirection} (${localWind.directionDeg}°)</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
              Arah angin ini mendorong sebaran partikel abu vulkanik ke sektor ${item.currentAshDirection}. Pemukiman di jalur ini diimbau bersiap menghadapi hujan abu.
            </div>
          </div>
        </div>

        <div class="inspector-section">
          <h4 class="section-title">Rekomendasi PVMBG & BPBD</h4>
          <div class="advisory-box" style="border-left: 3px solid ${level.color};">
            ${item.recommendation}
          </div>
        </div>

        <button class="btn-primary-block" onclick="window.dashboard.map.flyTo([${item.lat}, ${item.lon}], 10, { duration: 1 })">
          Fokuskan pada Peta
        </button>
      `;
    } else if (type === 'airQuality') {
      content.innerHTML = `
        <div class="inspector-section">
          <div class="badge-status" style="background: ${item.color}22; color: ${item.color}; border: 1px solid ${item.color}; display: inline-block;">
            AQI ${item.aqi} • ${item.category}
          </div>
          <h2 style="color: #f8fafc; margin: 8px 0 4px 0;">${item.name}</h2>
          <div style="font-size: 13px; color: #94a3b8;">${item.province} • Pemantauan Terkini</div>
        </div>

        <div class="inspector-section">
          <h4 class="section-title">Parameter Polutan (Breakdown)</h4>
          <div class="pollutant-list">
            ${Object.entries(item.pollutants).map(([k, p]) => `
              <div class="pollutant-item">
                <div class="pollutant-header">
                  <span><strong>${p.label}</strong></span>
                  <span>${p.value} <small>${p.unit}</small></span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${Math.min(100, (p.value / 150) * 100)}%; background: ${item.color};"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="inspector-section">
          <h4 class="section-title">Dampak Kesehatan & Tindakan</h4>
          <p style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">
            ${item.categoryDesc}
          </p>
          <div class="advisory-box" style="margin-top: 8px; border-left: 3px solid ${item.color};">
            <strong>Saran Mitigasi:</strong> ${item.aqi > 100 ? 'Gunakan masker N95 bila beraktivitas di luar, tutup ventilasi udara, dan nyalakan air purifier bila tersedia.' : 'Kualitas udara aman untuk olahraga dan aktivitas luar ruangan.'}
          </div>
        </div>
      `;
    } else if (type === 'hotspot') {
      content.innerHTML = `
        <div class="inspector-section">
          <div class="badge-status" style="background: rgba(249,115,22,0.2); color: #f97316; border: 1px solid #f97316; display: inline-block;">
            FRP ${item.frp} MW • ${item.sensor}
          </div>
          <h2 style="color: #f8fafc; margin: 8px 0 4px 0;">Titik Panas (Hotspot)</h2>
          <div style="font-size: 13px; color: #94a3b8;">${item.province || item.island} (${item.island})</div>
        </div>

        <div class="inspector-section">
          <h4 class="section-title">Detail Pengamatan Satelit (NASA FIRMS)</h4>
          <div class="info-grid">
            <div class="info-box">
              <span class="label">Satelit</span>
              <span class="val">${item.satellite}</span>
            </div>
            <div class="info-box">
              <span class="label">Sensor</span>
              <span class="val">${item.sensor}</span>
            </div>
            <div class="info-box">
              <span class="label">Tingkat Keyakinan</span>
              <span class="val">${item.confidence}</span>
            </div>
            <div class="info-box">
              <span class="label">Brightness</span>
              <span class="val">${item.brightness} K</span>
            </div>
            <div class="info-box">
              <span class="label">Waktu Akuisisi</span>
              <span class="val">${item.acqDate} ${item.acqTime}</span>
            </div>
            <div class="info-box">
              <span class="label">Koordinat</span>
              <span class="val">${item.lat}, ${item.lon}</span>
            </div>
          </div>
        </div>

        <div class="inspector-section">
          <h4 class="section-title">Analisis Risiko Asap Karhutla</h4>
          <div class="advisory-box" style="border-left: 3px solid #f97316;">
            Titik panas dengan Fire Radiative Power <strong>${item.frp} MW</strong> mengindikasikan pelepasan energi termal signifikan dari pembakaran biomassa/gambut. Potensi menghasilkan partikulat PM2.5 tebal yang terbawa angin ke permukiman terdekat.
          </div>
        </div>
      `;
    }

    drawer.classList.add('open');
  }

  showToast(message) {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastNotification';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.style.display = 'none', 400);
    }
  }
}

// Inisialisasi saat window dimuat
window.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new IndonesiaRiskDashboard();
  window.dashboard.init();
});
