import React from 'react';
import { AlertOctagon } from 'lucide-react';

export default function AlertTicker({ alerts = [], onSelectAlert }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="alert-ticker-bar">
        <div className="ticker-label">
          <AlertOctagon size={14} />
          <span>STATUS</span>
        </div>
        <div className="ticker-marquee-wrapper">
          <span className="ticker-item green">
            Kondisi Terkendali: Tidak terdeteksi erupsi Level IV atau indeks polusi berbahaya di stasiun utama.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="alert-ticker-bar">
      <div className="ticker-label">
        <AlertOctagon size={14} />
        <span>EARLY WARNING</span>
      </div>
      <div className="ticker-marquee-wrapper">
        <div className="ticker-marquee-content">
          {alerts.map((a, idx) => (
            <React.Fragment key={a.id || idx}>
              <span
                className={`ticker-item ${a.severity === 'critical' ? 'critical' : 'warning'}`}
                onClick={() => onSelectAlert(a)}
                title="Klik untuk melompat ke lokasi di peta"
              >
                <strong>[{a.title}]</strong> {a.details}
              </span>
              {idx < alerts.length - 1 && <span> &nbsp;•&nbsp; </span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
