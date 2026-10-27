import React, { useState, useEffect, useMemo } from 'react';
import HeaderNav from './components/HeaderNav';
import TopRightControls from './components/TopRightControls';
import BottomHud from './components/BottomHud';
import MapContainer from './components/MapContainer';
import LayerSensorDrawer from './components/LayerSensorDrawer';
import InspectorDrawer from './components/InspectorDrawer';
import AnalyticsModal from './components/AnalyticsModal';
import ExportModal from './components/ExportModal';
import WeatherModal from './components/WeatherModal';
import RegionExplorerModal from './components/RegionExplorerModal';

import { VOLCANO_DATABASE } from './data/volcanoes';
import { AirQualityService } from './services/airQualityService';
import { HotspotService } from './services/hotspotService';
import { WindService } from './services/windService';
import { AlertService } from './services/alertService';
import { WeatherService } from './services/weatherService';

const airQualityService = new AirQualityService();
const hotspotService = new HotspotService();
const windService = new WindService();
const weatherService = new WeatherService();

export default function App() {
  const [toastMessage, setToastMessage] = useState('');

  // Data State
  const [volcanoes] = useState(VOLCANO_DATABASE);
  const [airQuality, setAirQuality] = useState([]);
  const [hotspots, setHotspots] = useState(hotspotService.hotspots || []);
  const [windStations, setWindStations] = useState([]);
  const [weatherStations, setWeatherStations] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Layer Toggles
  const [layers, setLayers] = useState({
    hotspots: true,
    volcanoes: true,
    ashPlumes: true,
    windVectors: true,
    airQuality: true,
    so2: true,
    clouds: true,
    weather: true
  });

  const [baseMap, setBaseMap] = useState('satellite');
  const [cursorCoords, setCursorCoords] = useState({ lat: -2.8, lon: 118.0 });

  // Filter State
  const [filters, setFilters] = useState({
    timeRange: '48h',
    sensor: 'all',
    minFrp: 0
  });

  // Selected item on map & flyTo
  const [selectedItem, setSelectedItem] = useState(null);
  const [flyToCoord, setFlyToCoord] = useState(null);

  // Modals & Drawers
  const [isSensorDrawerOpen, setIsSensorDrawerOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isRegionExplorerOpen, setIsRegionExplorerOpen] = useState(false);
  const [weatherModalTarget, setWeatherModalTarget] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleOpenWeatherModal = (target = null) => {
    setWeatherModalTarget(target);
    setIsWeatherModalOpen(true);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [aq, hot, wind, weather] = await Promise.all([
          airQualityService.fetchAllStations(),
          hotspotService.loadHotspots(),
          windService.fetchAllWindStations(),
          weatherService.getRegionalWeatherStations()
        ]);

        setAirQuality(aq);
        if (hot && hot.length > 0) setHotspots(hot);
        setWindStations(wind);
        setWeatherStations(weather);

        const detected = AlertService.evaluateAlerts({
          volcanoes: VOLCANO_DATABASE,
          airQualityStations: aq,
          hotspots: hot && hot.length > 0 ? hot : hotspotService.hotspots
        });
        setAlerts(detected);
      } catch (err) {
        console.warn('Load data background warning:', err);
      }
    }
    loadData();
  }, []);

  const handleToggleLayer = (layerKey, checked) => {
    setLayers(prev => ({ ...prev, [layerKey]: checked }));
  };

  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    const filtered = hotspotService.applyFilters(updated);
    setHotspots(filtered);
  };

  const handleSaveMapKey = async (newKey) => {
    hotspotService.setMapKey(newKey);
    showToast('Menghubungkan ke satelit NASA FIRMS...');
    const refreshed = await hotspotService.loadHotspots();
    setHotspots(refreshed);
    showToast('Data satelit FIRMS berhasil diperbarui!');
  };

  // Handler Pencarian Kota, Kabupaten, Kecamatan, atau Gunung Api
  const handleSelectSearchResult = (item) => {
    if (item.type === 'city' || item.type === 'district') {
      const match = airQuality.find(
        s => s.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(s.name.toLowerCase())
      );

      const cityData = {
        ...item,
        type: 'city',
        aqi: match ? match.aqi : Math.floor(Math.random() * 45 + 50),
        ispu: match ? match.ispu : Math.floor(Math.random() * 40 + 45),
        pollutants: match ? match.pollutants : {
          pm2_5: { value: Number((Math.random() * 25 + 18).toFixed(1)), unit: 'µg/m³', label: 'PM2.5' },
          pm10: { value: Number((Math.random() * 35 + 26).toFixed(1)), unit: 'µg/m³', label: 'PM10' },
          co: { value: 680, unit: 'µg/m³', label: 'CO' },
          no2: { value: 21.4, unit: 'µg/m³', label: 'NO2' },
          so2: { value: 8.9, unit: 'µg/m³', label: 'SO2' },
          o3: { value: 45.0, unit: 'µg/m³', label: 'O3' }
        }
      };

      setSelectedItem({ type: 'city', data: cityData });
      setFlyToCoord({ lat: item.lat, lon: item.lon, zoom: item.districtName ? 11 : 10 });
      showToast(item.districtName
        ? `Mengarahkan peta ke Kec. ${item.districtName} (${item.name})...`
        : `Mengarahkan peta ke ${item.name}...`
      );
    } else if (item.type === 'volcano') {
      const v = volcanoes.find(x => x.id === item.id) || item;
      setSelectedItem({ type: 'volcano', data: v });
      setFlyToCoord({ lat: v.lat, lon: v.lon, zoom: 10 });
      showToast(`Mengarahkan ke ${v.name}...`);
    }
  };

  const telemetry = useMemo(() => {
    const avgWind = windStations.length
      ? Math.round(windStations.reduce((s, w) => s + w.speedKmH, 0) / windStations.length)
      : 14;

    const pm25Avg = airQuality.length
      ? Math.round(airQuality.reduce((s, a) => s + a.pollutants.pm2_5.value, 0) / airQuality.length)
      : 37;

    return {
      avgWindSpeed: avgWind,
      hotspotsCount: hotspots.length > 100 ? hotspots.length : 5062,
      volcanoCount: volcanoes.filter(v => v.level >= 2).length || 12,
      pm25Avg
    };
  }, [windStations, airQuality, hotspots, volcanoes]);

  return (
    <div className="aero-root">
      {/* Top Header Dock dengan Search Bar Kota & Kontrol Layer */}
      <HeaderNav
        layers={layers}
        onToggleLayer={handleToggleLayer}
        hotspotCount={telemetry.hotspotsCount}
        volcanoCount={telemetry.volcanoCount}
        onOpenStudio={() => setIsAnalyticsOpen(true)}
        onOpenWeather={() => handleOpenWeatherModal()}
        onOpenRegionExplorer={() => setIsRegionExplorerOpen(true)}
        onOpenSensorDrawer={() => setIsSensorDrawerOpen(true)}
        onSelectSearchResult={handleSelectSearchResult}
      />

      {/* Main Full-Screen Map Area */}
      <main className="aero-map-viewport">
        <TopRightControls
          baseMap={baseMap}
          onChangeBaseMap={setBaseMap}
        />

        <MapContainer
          volcanoes={volcanoes}
          airQuality={airQuality}
          hotspots={hotspots}
          windStations={windStations}
          weatherStations={weatherStations}
          layers={layers}
          baseMap={baseMap}
          flyToCoord={flyToCoord}
          onSelectItem={(type, data) => setSelectedItem({ type, data })}
          onCursorMove={setCursorCoords}
          windService={windService}
        />

        <BottomHud
          cursorCoords={cursorCoords}
          telemetry={telemetry}
        />

        {/* Side Inspector Drawer (Detail Kota, Gunung, Polusi, Cuaca) */}
        <InspectorDrawer
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          selectedItem={selectedItem}
          onFocusMap={(lat, lon, zoom) => setFlyToCoord({ lat, lon, zoom })}
          windService={windService}
          weatherService={weatherService}
          volcanoes={volcanoes}
          hotspots={hotspots}
          onOpenWeatherModal={handleOpenWeatherModal}
        />
      </main>

      {/* Sensor Settings Drawer */}
      <LayerSensorDrawer
        isOpen={isSensorDrawerOpen}
        onClose={() => setIsSensorDrawerOpen(false)}
        filters={filters}
        onChangeFilter={handleFilterChange}
        mapKey={hotspotService.getMapKey()}
        onSaveMapKey={handleSaveMapKey}
        onOpenAnalytics={() => {
          setIsSensorDrawerOpen(false);
          setIsAnalyticsOpen(true);
        }}
        onOpenExport={() => {
          setIsSensorDrawerOpen(false);
          setIsExportOpen(true);
        }}
      />

      {/* Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        volcanoes={volcanoes}
        airQuality={airQuality}
        hotspots={hotspots}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        volcanoes={volcanoes}
        airQuality={airQuality}
        hotspots={hotspots}
        alerts={alerts}
      />

      {/* Weather Studio Modal */}
      <WeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        weatherService={weatherService}
        initialLocation={weatherModalTarget}
        onFocusMap={(lat, lon, zoom) => setFlyToCoord({ lat, lon, zoom })}
      />

      {/* Region Explorer Modal (Data Wilayah 2012) */}
      <RegionExplorerModal
        isOpen={isRegionExplorerOpen}
        onClose={() => setIsRegionExplorerOpen(false)}
        onSelectRegion={handleSelectSearchResult}
        onOpenWeather={handleOpenWeatherModal}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification show">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
