import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CONFIG } from '../config/constants';
import { calculateAshPlumePolygon } from '../data/volcanoes';
import { WindParticleEngine } from './WindParticleCanvas';
import { ThermalHeatEngine } from './ThermalCanvasOverlay';

export default function MapContainer({
  volcanoes = [],
  airQuality = [],
  hotspots = [],
  windStations = [],
  weatherStations = [],
  layers = {},
  baseMap = 'satellite',
  flyToCoord = null,
  onSelectItem = () => {},
  onCursorMove = () => {},
  windService = null
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const windCanvasRef = useRef(null);
  const thermalCanvasRef = useRef(null);

  const windEngineRef = useRef(null);
  const thermalEngineRef = useRef(null);

  const baseLayersRef = useRef({});
  const layerGroupsRef = useRef({
    volcanoes: null,
    ashPlumes: null,
    airQuality: null,
    windVectors: null,
    clouds: null,
    so2: null,
    weather: null
  });

  // 1. Inisialisasi Peta Leaflet & Mesin Canvas
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    const defaultCfg = CONFIG.MAP_DEFAULT;
    const map = L.map(mapRef.current, {
      center: [-2.8, 118.0],
      zoom: 5.2,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false
    });

    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Tile Layers
    const satelliteTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri World Imagery, Earthstar Geographics',
      maxZoom: 19
    });

    const darkTile = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO Dark Matter',
      subdomains: 'abcd',
      maxZoom: 19
    });

    const topoTile = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenTopoMap',
      maxZoom: 17
    });

    satelliteTile.addTo(map);
    baseLayersRef.current = {
      satellite: satelliteTile,
      dark: darkTile,
      topo: topoTile
    };

    // Layer Groups
    layerGroupsRef.current.volcanoes = L.layerGroup().addTo(map);
    layerGroupsRef.current.ashPlumes = L.layerGroup().addTo(map);
    layerGroupsRef.current.airQuality = L.layerGroup().addTo(map);
    layerGroupsRef.current.windVectors = L.layerGroup().addTo(map);
    layerGroupsRef.current.clouds = L.layerGroup().addTo(map);
    layerGroupsRef.current.so2 = L.layerGroup().addTo(map);
    layerGroupsRef.current.weather = L.layerGroup().addTo(map);

    map.setMaxBounds([
      [-16.0, 90.0],
      [12.0, 145.0]
    ]);

    // Live Cursor Tracker
    map.on('mousemove', (e) => {
      onCursorMove({ lat: e.latlng.lat, lon: e.latlng.lng });
    });

    mapInstanceRef.current = map;

    // Inisialisasi Thermal Canvas Engine
    if (thermalCanvasRef.current) {
      thermalEngineRef.current = new ThermalHeatEngine(thermalCanvasRef.current, map);
      map.on('move', () => thermalEngineRef.current && thermalEngineRef.current.resize());
      map.on('zoom', () => thermalEngineRef.current && thermalEngineRef.current.resize());
      map.on('resize', () => thermalEngineRef.current && thermalEngineRef.current.resize());
    }

    // Inisialisasi Wind Particle Engine
    if (windCanvasRef.current && windService) {
      windEngineRef.current = new WindParticleEngine(
        windCanvasRef.current,
        map,
        (lat, lon) => windService.getWindAtLocation(lat, lon)
      );

      map.on('move', () => windEngineRef.current && windEngineRef.current.resizeCanvas());
      map.on('zoom', () => windEngineRef.current && windEngineRef.current.resizeCanvas());
      map.on('resize', () => windEngineRef.current && windEngineRef.current.resizeCanvas());

      windEngineRef.current.start();
    }

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    const t1 = setTimeout(handleResize, 150);
    const t2 = setTimeout(handleResize, 600);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t1);
      clearTimeout(t2);
      if (windEngineRef.current) windEngineRef.current.stop();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Switch Basemap
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(baseLayersRef.current).forEach(tile => {
      if (map.hasLayer(tile)) map.removeLayer(tile);
    });

    const activeTile = baseLayersRef.current[baseMap] || baseLayersRef.current.satellite;
    map.addLayer(activeTile);
  }, [baseMap]);

  // 3. Update Hotspot Thermal Blooms
  useEffect(() => {
    if (!thermalEngineRef.current) return;
    thermalEngineRef.current.setVisible(Boolean(layers.hotspots));
    thermalEngineRef.current.setHotspots(hotspots);
  }, [hotspots, layers.hotspots]);

  // 4. Toggle Wind Particles Engine
  useEffect(() => {
    if (!windEngineRef.current) return;
    if (layers.windVectors) {
      windEngineRef.current.start();
    } else {
      windEngineRef.current.stop();
    }
  }, [layers.windVectors]);

  // 5. Render Gunung Api & Vektor Arah Abu Vulkanik
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const vGroup = layerGroupsRef.current.volcanoes;
    const pGroup = layerGroupsRef.current.ashPlumes;
    if (!vGroup || !pGroup) return;

    vGroup.clearLayers();
    pGroup.clearLayers();

    if (!layers.volcanoes) return;

    volcanoes.forEach(v => {
      const levelInfo = CONFIG.VOLCANO_LEVELS[v.level] || CONFIG.VOLCANO_LEVELS[1];
      const localWind = windService ? windService.getWindAtLocation(v.lat, v.lon) : { directionDeg: 220, speedKmH: 12 };
      const ashDirDeg = v.currentAshDirectionDeg !== null ? v.currentAshDirectionDeg : localWind.directionDeg;

      // Directional Ash Barb (garis vektor arah sebaran abu dinamis)
      const barbSvgHtml = `
        <div class="psn-volcano-barb" style="transform: rotate(${ashDirDeg}deg);">
          <div class="barb-crater" style="background: ${levelInfo.color}; box-shadow: 0 0 8px ${levelInfo.color};"></div>
          <div class="barb-stem" style="background: linear-gradient(to top, ${levelInfo.color}, transparent);"></div>
          <div class="barb-head" style="border-bottom-color: ${levelInfo.color};"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: barbSvgHtml,
        className: 'custom-div-icon',
        iconSize: [28, 48],
        iconAnchor: [14, 24]
      });

      const marker = L.marker([v.lat, v.lon], { icon: customIcon });

      marker.bindPopup(`
        <div class="popup-container">
          <div class="popup-header" style="border-left: 4px solid ${levelInfo.color};">
            <h4>${v.name}</h4>
            <span class="popup-badge" style="background: ${levelInfo.color}25; color: ${levelInfo.color}; border: 1px solid ${levelInfo.color};">
              ${v.statusText}
            </span>
          </div>
          <div class="popup-body">
            <div class="popup-row"><span>Elevasi:</span> <strong>${v.elevation} mdpl</strong></div>
            <div class="popup-row"><span>Provinsi:</span> <strong>${v.province}</strong></div>
            <div class="popup-row"><span>Erupsi Terakhir:</span> <strong>${v.lastEruption}</strong></div>
            <div class="popup-row"><span>Kolom Abu:</span> <strong>${v.ashColumnMeters} m (${v.currentAshDirection})</strong></div>
            <div class="popup-row"><span>Zona Bahaya:</span> <strong style="color: #ef4444;">Radius ${v.dangerRadiusKm} km</strong></div>
          </div>
        </div>
      `, { className: 'dark-leaflet-popup' });

      marker.on('click', () => onSelectItem('volcano', v));
      vGroup.addLayer(marker);

      // Kerucut sebaran abu vulkanik
      if (v.level >= 2 && layers.ashPlumes) {
        const plumeDist = Math.min(80, Math.max(25, (v.ashColumnMeters / 45) + 20));
        const plumeCoords = calculateAshPlumePolygon(v.lat, v.lon, ashDirDeg, plumeDist, 35);
        if (plumeCoords) {
          const plumePolygon = L.polygon(plumeCoords, {
            color: levelInfo.color,
            weight: 1.2,
            dashArray: '3, 4',
            fillColor: levelInfo.color,
            fillOpacity: 0.18
          });
          plumePolygon.bindTooltip(`Sebaran Abu ${v.name}: ${v.currentAshDirection} (${ashDirDeg}°)`, { sticky: true });
          pGroup.addLayer(plumePolygon);
        }
      }
    });
  }, [volcanoes, layers.volcanoes, layers.ashPlumes, windService]);

  // 6. Render Kualitas Udara
  useEffect(() => {
    const aqiGroup = layerGroupsRef.current.airQuality;
    if (!aqiGroup) return;
    aqiGroup.clearLayers();

    if (!layers.airQuality) return;

    airQuality.forEach(st => {
      const iconHtml = `
        <div class="psn-aqi-bubble" style="background: ${st.color}cc; border: 1.5px solid #fff; box-shadow: 0 0 10px ${st.color};">
          <span>${st.aqi}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([st.lat, st.lon], { icon: customIcon });
      marker.bindPopup(`
        <div class="popup-container">
          <div class="popup-header" style="border-left: 4px solid ${st.color};">
            <h4>${st.name}</h4>
            <span class="popup-badge" style="background: ${st.color}25; color: ${st.color}; border: 1px solid ${st.color};">
              AQI ${st.aqi} • ${st.category}
            </span>
          </div>
          <div class="popup-body">
            <div class="popup-row"><span>ISPU Indonesia:</span> <strong>${st.ispu}</strong></div>
            <div class="popup-row"><span>PM2.5:</span> <strong>${st.pollutants.pm2_5.value} μg/m³</strong></div>
            <div class="popup-row"><span>PM10:</span> <strong>${st.pollutants.pm10.value} μg/m³</strong></div>
          </div>
        </div>
      `, { className: 'dark-leaflet-popup' });

      marker.on('click', () => onSelectItem('airQuality', st));
      aqiGroup.addLayer(marker);
    });
  }, [airQuality, layers.airQuality]);

  // 7. Render SO2 & Clouds
  useEffect(() => {
    const so2Group = layerGroupsRef.current.so2;
    const cloudGroup = layerGroupsRef.current.clouds;
    if (!so2Group || !cloudGroup) return;

    so2Group.clearLayers();
    cloudGroup.clearLayers();

    if (layers.so2) {
      const activeCraters = [
        [-7.5407, 110.4457], // Merapi
        [-8.5389, 122.7689], // Lewotobi
        [2.3000, 125.3700]   // Ruang
      ];
      activeCraters.forEach(pos => {
        const circle = L.circle(pos, {
          radius: 35000,
          color: '#eab308',
          weight: 1,
          dashArray: '2, 6',
          fillColor: '#facc15',
          fillOpacity: 0.18
        });
        circle.bindTooltip('Konsentrasi Emisi SO2 Vulkanik Tinggi', { sticky: true });
        so2Group.addLayer(circle);
      });
    }

    if (layers.clouds) {
      const cloudPuffs = [
        [-1.5, 115.0, 120000],
        [-6.5, 107.5, 90000],
        [1.0, 102.0, 110000],
        [-4.5, 138.0, 150000]
      ];
      cloudPuffs.forEach(([lat, lon, rad]) => {
        const c = L.circle([lat, lon], {
          radius: rad,
          stroke: false,
          fillColor: '#ffffff',
          fillOpacity: 0.12
        });
        cloudGroup.addLayer(c);
      });
    }
  }, [layers.so2, layers.clouds]);

  // 8. Render Weather Layer Markers
  useEffect(() => {
    const weatherGroup = layerGroupsRef.current.weather;
    if (!weatherGroup) return;

    weatherGroup.clearLayers();
    if (!layers.weather || !weatherStations || weatherStations.length === 0) return;

    weatherStations.forEach(st => {
      const cur = st.current || {};
      const hasLaharRisk = st.hazards && st.hazards.some(h => h.id.includes('lahar'));

      // Icon emoji / symbol
      const iconEmoji = cur.weatherIcon === 'Sun' ? '☀️'
        : cur.weatherIcon === 'SunMedium' ? '🌤️'
        : cur.weatherIcon === 'CloudSun' ? '⛅'
        : cur.weatherIcon === 'Cloud' ? '☁️'
        : cur.weatherIcon === 'CloudFog' ? '🌫️'
        : cur.weatherIcon === 'CloudDrizzle' ? '🌦️'
        : cur.weatherIcon === 'CloudRain' ? '🌧️'
        : cur.weatherIcon === 'CloudLightning' ? '⛈️'
        : cur.weatherIcon === 'Zap' ? '⚡'
        : '⛅';

      const iconHtml = `
        <div class="weather-map-badge ${hasLaharRisk ? 'lahar-alert-pulse' : ''}" style="border-color: ${cur.weatherColor || '#38bdf8'};">
          <span class="w-emoji">${iconEmoji}</span>
          <span class="w-temp">${cur.temp !== undefined ? cur.temp : '--'}°</span>
          ${hasLaharRisk ? '<span class="w-dot-danger" title="Waspada Lahar Dingin"></span>' : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-weather-icon',
        iconSize: [56, 24],
        iconAnchor: [28, 12]
      });

      const marker = L.marker([st.lat, st.lon], { icon: customIcon });
      marker.bindPopup(`
        <div class="popup-container">
          <div class="popup-header" style="border-left: 4px solid ${cur.weatherColor || '#38bdf8'};">
            <h4>${st.name}</h4>
            <span class="popup-badge" style="background: ${cur.weatherColor || '#38bdf8'}25; color: ${cur.weatherColor || '#38bdf8'}; border: 1px solid ${cur.weatherColor || '#38bdf8'};">
              ${cur.weatherLabel || 'Cuaca'} • ${cur.temp}°C
            </span>
          </div>
          <div class="popup-body">
            <div class="popup-row"><span>Suhu Terasa:</span> <strong>${cur.feelsLike}°C</strong></div>
            <div class="popup-row"><span>Kelembaban:</span> <strong>${cur.humidity}%</strong></div>
            <div class="popup-row"><span>Kecepatan Angin:</span> <strong>${cur.windSpeed} km/jam</strong></div>
            ${hasLaharRisk ? '<div class="popup-alert-row" style="color: #f59e0b; margin-top: 6px;">⚠️ Waspada Aliran Lahar di Alur Sungai</div>' : ''}
          </div>
        </div>
      `, { className: 'dark-leaflet-popup' });

      marker.on('click', () => onSelectItem('weather', st));
      weatherGroup.addLayer(marker);
    });
  }, [weatherStations, layers.weather]);

  // 9. Fly to Coordinates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToCoord) return;
    map.flyTo([flyToCoord.lat, flyToCoord.lon], flyToCoord.zoom || 8, { duration: 1.6 });
  }, [flyToCoord]);

  return (
    <div className="psn-map-wrapper">
      <div id="map" ref={mapRef} className="psn-map-canvas"></div>
      <canvas ref={thermalCanvasRef} className="psn-thermal-canvas-layer"></canvas>
      <canvas ref={windCanvasRef} className="psn-wind-canvas-layer"></canvas>
    </div>
  );
}
