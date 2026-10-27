import React from 'react';
import { X, Bell, AlertTriangle } from 'lucide-react';

export default function AlertModal({
  isOpen,
  onClose,
  alerts = [],
  onSelectAlert
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3>
            <Bell size={18} color="#ef4444" />
            <span>Pusat Peringatan Dini & Notifikasi Bencana ({alerts.length})</span>
          </h3>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
              Tidak ada peringatan kritis aktif saat ini.
            </div>
          ) : (
            <div className="alert-list">
              {alerts.map(a => {
                const borderCol = a.severity === 'critical' ? '#ef4444' : '#f97316';
                return (
                  <div
                    key={a.id}
                    className="alert-card-item"
                    style={{ borderLeft: `4px solid ${borderCol}` }}
                  >
                    <div className="alert-card-header">
                      <div>
                        <h4 style={{ margin: 0, color: '#f8fafc', fontSize: 14 }}>{a.title}</h4>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                          {a.location} • {a.timestamp}
                        </span>
                      </div>
                      <span className={`badge-status ${a.severity}`}>{a.severity.toUpperCase()}</span>
                    </div>
                    <p style={{ margin: '8px 0', fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                      {a.details}
                    </p>
                    <button
                      className="btn-sm-action"
                      onClick={() => {
                        onClose();
                        onSelectAlert(a);
                      }}
                    >
                      {a.actionText} di Peta &rarr;
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
