import React, { useState } from 'react';
import { X, Key, CheckCircle, RefreshCw } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  currentKey,
  onSaveKey
}) {
  const [mapKey, setMapKey] = useState(currentKey || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onSaveKey(mapKey.trim());
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h3>
            <Key size={18} color="#38bdf8" />
            <span>Pengaturan API NASA FIRMS</span>
          </h3>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body">
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            Kunci MAP_KEY digunakan untuk melakukan query data near-real-time langsung ke satelit NASA FIRMS (VIIRS & MODIS) di atas wilayah kepulauan Indonesia.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>
              NASA FIRMS MAP_KEY:
            </label>
            <input
              type="text"
              value={mapKey}
              onChange={e => setMapKey(e.target.value)}
              placeholder="Masukkan 32 karakter MAP_KEY..."
              style={{
                background: '#080d1a',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6,
                padding: '10px 12px',
                color: '#fff',
                fontSize: 13,
                fontFamily: 'monospace'
              }}
            />
            <span style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <CheckCircle size={13} /> Kunci API aktif telah dikonfigurasi pada sistem.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              className="btn-export"
              onClick={onClose}
              style={{ flex: 'none', padding: '8px 16px' }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary-block"
              style={{ width: 'auto', margin: 0, padding: '8px 18px', background: '#0284c7' }}
              disabled={isSaving}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan & Sinkronkan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
