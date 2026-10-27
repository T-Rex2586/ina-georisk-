import React, { useState, useEffect } from 'react';
import { Flame, Bell, BarChart3, Download, Settings, Wind } from 'lucide-react';
import { CONFIG } from '../config/constants';

export default function Navbar({
  alertCount,
  criticalCount,
  onOpenAlerts,
  onOpenAnalytics,
  onOpenExport,
  onOpenSettings
}) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' WIB'
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="top-navbar">
      <div className="brand-section">
        <div className="brand-logo">
          <Flame size={22} color="#ffffff" />
        </div>
        <div>
          <div className="brand-title">
            {CONFIG.APP_NAME}
            <span className="badge-country">INDONESIA</span>
          </div>
          <div className="brand-subtitle">{CONFIG.APP_TITLE}</div>
        </div>
      </div>

      <div className="nav-actions">
        <div className="live-time-indicator" title="Sistem tersinkronisasi near real-time">
          <div className="pulse-dot-green"></div>
          <span>{currentTime}</span>
        </div>

        <button
          className="btn-nav"
          onClick={onOpenAlerts}
          title="Peringatan Dini Bencana"
        >
          <Bell size={15} />
          <span>Peringatan</span>
          <span className={`badge-pill ${criticalCount > 0 ? 'alert-critical' : 'alert-warning'}`}>
            {alertCount}
          </span>
        </button>

        <button
          className="btn-nav"
          onClick={onOpenAnalytics}
          title="Buka Visualisasi & Analitik Grafik"
        >
          <BarChart3 size={15} />
          <span>Analitik</span>
        </button>

        <button
          className="btn-nav"
          onClick={onOpenExport}
          title="Ekspor Data CSV / JSON (FR-05)"
        >
          <Download size={15} />
          <span>Ekspor</span>
        </button>

        <button
          className="btn-nav"
          onClick={onOpenSettings}
          title="Pengaturan NASA FIRMS API Key"
        >
          <Settings size={15} />
          <span>API Key</span>
        </button>
      </div>
    </header>
  );
}
