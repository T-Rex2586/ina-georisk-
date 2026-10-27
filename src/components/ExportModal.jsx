import React from 'react';
import { X, Download, FileSpreadsheet, FileCode } from 'lucide-react';
import { ExportService } from '../services/exportService';

export default function ExportModal({
  isOpen,
  onClose,
  volcanoes = [],
  airQuality = [],
  hotspots = [],
  alerts = []
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <h3>
            <Download size={18} color="#38bdf8" />
            <span>Ekspor Dataset Geospasial & Mitigasi (FR-05)</span>
          </h3>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            Unduh data hasil pemantauan terpadu dalam format standar CSV (Excel/R/Python) atau format terstruktur JSON untuk analisis lanjutan.
          </p>

          <div className="export-grid">
            <div className="export-box">
              <h4>Gunung Api Indonesia</h4>
              <p>{volcanoes.length} gunung api dipantau status PVMBG</p>
              <div className="export-btn-row">
                <button
                  className="btn-export"
                  onClick={() => ExportService.exportVolcanoes(volcanoes, 'csv')}
                >
                  <FileSpreadsheet size={13} style={{ verticalAlign: -2 }} /> CSV
                </button>
                <button
                  className="btn-export"
                  onClick={() => ExportService.exportVolcanoes(volcanoes, 'json')}
                >
                  <FileCode size={13} style={{ verticalAlign: -2 }} /> JSON
                </button>
              </div>
            </div>

            <div className="export-box">
              <h4>Kualitas Udara & Polusi</h4>
              <p>{airQuality.length} stasiun kota & breakdown gas</p>
              <div className="export-btn-row">
                <button
                  className="btn-export"
                  onClick={() => ExportService.exportAirQuality(airQuality, 'csv')}
                >
                  <FileSpreadsheet size={13} style={{ verticalAlign: -2 }} /> CSV
                </button>
                <button
                  className="btn-export"
                  onClick={() => ExportService.exportAirQuality(airQuality, 'json')}
                >
                  <FileCode size={13} style={{ verticalAlign: -2 }} /> JSON
                </button>
              </div>
            </div>

            <div className="export-box">
              <h4>Titik Panas (Hotspot) FIRMS</h4>
              <p>{hotspots.length} deteksi satelit VIIRS/MODIS aktif</p>
              <div className="export-btn-row">
                <button
                  className="btn-export"
                  onClick={() => ExportService.exportHotspots(hotspots, 'csv')}
                >
                  <FileSpreadsheet size={13} style={{ verticalAlign: -2 }} /> CSV
                </button>
                <button
                  className="btn-export"
                  onClick={() => ExportService.exportHotspots(hotspots, 'json')}
                >
                  <FileCode size={13} style={{ verticalAlign: -2 }} /> JSON
                </button>
              </div>
            </div>

            <div className="export-box" style={{ background: 'rgba(56, 189, 248, 0.08)' }}>
              <h4>Laporan Situasi Terpadu</h4>
              <p>Ringkasan komprehensif seluruh layer & alert</p>
              <div className="export-btn-row">
                <button
                  className="btn-export"
                  style={{ background: '#0284c7', borderColor: '#38bdf8' }}
                  onClick={() => ExportService.exportUnifiedReport({ volcanoes, airQuality, hotspots, alerts })}
                >
                  <Download size={13} style={{ verticalAlign: -2 }} /> Unduh JSON Terpadu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
