# Spesifikasi Alert Telegram untuk Monitoring Karhutla

**Tanggal:** 2026-10-18
**Versi:** 1.0 (Draft)
**Status:** Perencanaan - Tidak ada pengiriman pesan sungguhan

---

## 1. Tujuan

Mengirimkan notifikasi otomatis ke Telegram untuk:
1. **Hotspot baru di lahan gambut** - Deteksi dini kebakaran gambut
2. **Kenaikan skor risiko** - Peringatan eskalasi risiko wilayah
3. **Alert kritikal** - Notifikasi darurat untuk penanganan segera

---

## 2. Arsitektur Alert System

```
┌─────────────────────────────────────────────────────────┐
│  Data Sources                                            │
│  - NASA FIRMS (hotspot)                                 │
│  - Risk Score Service                                   │
│  - Peat Service                                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Alert Engine (Backend)                                  │
│  - alertTriggerService.js                               │
│  - Check trigger conditions                             │
│  - Rate limiting                                        │
│  - Format message                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Telegram Bot API                                        │
│  - sendMessage endpoint                                 │
│  - Bot token (environment variable)                     │
│  - Chat ID (authorized users only)                      │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Pemicu Alert (Trigger Conditions)

### 3.1 Alert Type A: Hotspot Baru di Lahan Gambut

**Trigger:**
```javascript
function checkPeatHotspotAlert(newHotspot, peatData) {
  // Trigger jika:
  // 1. Hotspot baru terdeteksi (dalam 1 jam terakhir)
  // 2. Lokasi hotspot berada di area gambut
  // 3. Confidence >= "nominal"
  // 4. FRP >= threshold minimum
  
  const isRecent = (Date.now() - newHotspot.detectedAt) < 3600000; // 1 jam
  const isOnPeatland = peatData.isPeatland === true;
  const isValidConfidence = ['high', 'nominal', 'h', 'n'].includes(
    newHotspot.confidence?.toLowerCase()
  );
  const hasMinimumFRP = newHotspot.frp >= 10; // MW
  
  return isRecent && isOnPeatland && isValidConfidence && hasMinimumFRP;
}
```

**Threshold Variabel:**

| Kondisi | Threshold | Keterangan |
|---------|-----------|------------|
| Time window | 1 jam | Hotspot terdeteksi dalam 1 jam terakhir |
| Peatland | isPeatland = true | Lokasi di polygon gambut |
| Confidence | nominal, high | Buang confidence "low" |
| FRP minimum | 10 MW | Filter hotspot sangat kecil |
| Depth factor | ≥ Sedang (100+ cm) | Prioritas gambut dalam |

**Variasi Alert Level:**

| FRP Range | Depth | Alert Level | Prioritas |
|-----------|-------|-------------|-----------|
| 10-30 MW | Dangkal | WARNING | 3 |
| 30-50 MW | Sedang | WARNING | 3 |
| 50-100 MW | Dalam | CRITICAL | 2 |
| > 100 MW | Sangat Dalam | EMERGENCY | 1 |

---

### 3.2 Alert Type B: Kenaikan Skor Risiko

**Trigger:**
```javascript
function checkRiskScoreAlert(currentScore, previousScore, region) {
  // Trigger jika:
  // 1. Skor melewati threshold kritis (60, 80)
  // 2. Kenaikan signifikan (> 20 poin dalam 6 jam)
  // 3. Level berubah dari sebelumnya
  
  const crossedThreshold = 
    (currentScore >= 80 && previousScore < 80) ||  // Masuk level SANGAT TINGGI
    (currentScore >= 60 && previousScore < 60);    // Masuk level TINGGI
  
  const significantIncrease = 
    (currentScore - previousScore) >= 20;
  
  const levelChanged = 
    categorizeRiskLevel(currentScore).level !== 
    categorizeRiskLevel(previousScore).level;
  
  return {
    trigger: crossedThreshold || significantIncrease,
    crossedThreshold,
    significantIncrease,
    levelChanged
  };
}
```

**Threshold Skor Risiko:**

| Dari | Ke | Alert Type | Deskripsi |
|------|----|-----------:|-----------|
| < 60 | ≥ 60 | WARNING | Wilayah masuk kategori TINGGI |
| < 80 | ≥ 80 | CRITICAL | Wilayah masuk kategori SANGAT TINGGI |
| Naik ≥ 20 poin | - | ESCALATION | Kenaikan signifikan dalam 6 jam |
| Naik ≥ 30 poin | - | RAPID_ESCALATION | Kenaikan sangat cepat |

**Time Window untuk Perbandingan:**
- Immediate: Bandingkan dengan skor 1 jam lalu
- Short-term: Bandingkan dengan skor 6 jam lalu
- Daily: Bandingkan dengan skor 24 jam lalu

---

### 3.3 Alert Type C: Composite Critical Alert

**Trigger (kombinasi kondisi):**
```javascript
function checkCompositeAlert(regionData) {
  const { hotspots, riskScore, weather, peatInfo } = regionData;
  
  // Trigger jika SEMUA kondisi terpenuhi:
  const conditions = {
    highRiskScore: riskScore.total >= 70,
    multipleHotspots: hotspots.length >= 5,
    onPeatland: peatInfo.peat_hotspot_count >= 3,
    dryWeather: weather.humidity < 50 && weather.precipitation_24h < 1,
    windyConditions: weather.wind_speed > 15
  };
  
  const allConditionsMet = Object.values(conditions).every(v => v === true);
  const mostConditionsMet = Object.values(conditions).filter(v => v).length >= 4;
  
  return {
    trigger: allConditionsMet || mostConditionsMet,
    conditions,
    severity: allConditionsMet ? 'EMERGENCY' : 'CRITICAL'
  };
}
```

---

## 4. Ambang Batas (Thresholds)

### 4.1 Summary Table

| Alert Type | Trigger Condition | Threshold | Severity |
|------------|-------------------|-----------|----------|
| Peat Hotspot - Low | FRP 10-30 MW, depth < 200cm | Immediate | INFO |
| Peat Hotspot - Medium | FRP 30-50 MW, depth 200-300cm | Immediate | WARNING |
| Peat Hotspot - High | FRP 50-100 MW, depth 300-500cm | Immediate | CRITICAL |
| Peat Hotspot - Critical | FRP > 100 MW, depth > 500cm | Immediate | EMERGENCY |
| Risk Score Threshold | Score crosses 60 | 6-hour window | WARNING |
| Risk Score Threshold | Score crosses 80 | 6-hour window | CRITICAL |
| Risk Score Increase | Increase ≥ 20 points | 6-hour window | ESCALATION |
| Risk Score Spike | Increase ≥ 30 points | 1-hour window | RAPID_ESCALATION |
| Composite Critical | 4+ conditions met | Immediate | CRITICAL/EMERGENCY |

### 4.2 Severity Levels

| Level | Icon | Color | Action Required |
|-------|------|-------|-----------------|
| INFO | ℹ️ | Blue | Monitor only |
| WARNING | ⚠️ | Yellow | Increase monitoring frequency |
| CRITICAL | 🔴 | Orange | Prepare response team |
| EMERGENCY | 🚨 | Red | Immediate action required |

---

## 5. Format Pesan Telegram

### 5.1 Alert Type A: Hotspot di Gambut

**Format:**
```
🚨 HOTSPOT DI LAHAN GAMBUT

📍 Lokasi: {region_name}, {province}
🌲 Status Gambut: {peat_type}
📏 Kedalaman: {depth_min}-{depth_max} cm ({depth_category})
🔥 FRP: {frp_value} MW
📡 Satelit: {satellite} ({sensor})
⏰ Waktu: {acq_time} WIB
🎯 Confidence: {confidence}

⚠️ RISIKO:
• Gambut {depth_category} sulit dipadamkan
• Potensi emisi karbon tinggi
• Diperlukan pembasahan menyeluruh

🔗 Detail: {map_url}
```

**Contoh Pesan:**
```
🚨 HOTSPOT DI LAHAN GAMBUT

📍 Lokasi: Kecamatan Mantangai, Kabupaten Kapuas, Kalimantan Tengah
🌲 Status Gambut: Gambut Topogen Air Payau
📏 Kedalaman: 300-500 cm (Dalam)
🔥 FRP: 67.5 MW
📡 Satelit: Suomi-NPP (VIIRS)
⏰ Waktu: 18 Oct 2026, 14:30 WIB
🎯 Confidence: High

⚠️ RISIKO:
• Gambut Dalam sulit dipadamkan
• Potensi emisi karbon tinggi
• Diperlukan pembasahan menyeluruh

🔗 Detail: https://map.ina-risk.id/hotspot/firms_1234
```

---

### 5.2 Alert Type B: Kenaikan Skor Risiko

**Format:**
```
⚠️ KENAIKAN RISIKO KARHUTLA

📊 Wilayah: {region_name}, {province}
📈 Skor Risiko: {prev_score} → {current_score} (+{delta})
🔴 Level: {risk_level}

📋 KOMPONEN SKOR:
• Hotspot: {H_score}/100
• Gambut: {P_score}/100  
• Meteorologi: {M_score}/100

🔥 DETAIL:
• Hotspot aktif: {hotspot_count} titik
• FRP maksimum: {frp_max} MW
• Di area gambut: {peat_hotspot_count} titik

🌤️ KONDISI CUACA:
• Kelembapan: {humidity}%
• Angin: {wind_speed} km/h
• Hujan 24j: {precipitation} mm

⏰ Update: {timestamp} WIB
🔗 Peta Risiko: {risk_map_url}
```

**Contoh Pesan:**
```
⚠️ KENAIKAN RISIKO KARHUTLA

📊 Wilayah: Kabupaten Ogan Komering Ilir, Sumatera Selatan
📈 Skor Risiko: 52.3 → 78.6 (+26.3)
🔴 Level: TINGGI

📋 KOMPONEN SKOR:
• Hotspot: 85.2/100
• Gambut: 88.0/100
• Meteorologi: 62.5/100

🔥 DETAIL:
• Hotspot aktif: 23 titik
• FRP maksimum: 78.5 MW
• Di area gambut: 18 titik

🌤️ KONDISI CUACA:
• Kelembapan: 48%
• Angin: 16 km/h
• Hujan 24j: 0.2 mm

⏰ Update: 18 Oct 2026, 14:45 WIB
🔗 Peta Risiko: https://map.ina-risk.id/risk/6203
```

---

### 5.3 Alert Type C: Composite Critical

**Format:**
```
🚨 DARURAT: KONDISI KRITIS KARHUTLA

📍 Wilayah: {region_name}, {province}
🔴 Skor Risiko: {risk_score}/100
⏰ Waktu: {timestamp} WIB

⚠️ INDIKATOR KRITIS:
✅ Skor risiko tinggi (≥70): {risk_score}
✅ Multiple hotspot (≥5): {hotspot_count} titik
✅ Hotspot di gambut (≥3): {peat_hotspot_count} titik
✅ Cuaca kering (humidity <50%): {humidity}%
✅ Angin kencang (>15 km/h): {wind_speed} km/h

🔥 REKOMENDASI:
1. Aktifkan tim respons darurat
2. Koordinasi dengan BPBD setempat
3. Siagakan peralatan pemadaman gambut
4. Monitor perkembangan setiap 30 menit

📞 KONTAK DARURAT:
• BPBD: {bpbd_contact}
• Manggala Agni: {manggala_contact}
• Call Center: 119

🔗 Peta Live: {live_map_url}
```

---

### 5.4 Daily Summary (Scheduled)

**Format:**
```
📊 LAPORAN HARIAN KARHUTLA
Tanggal: {date}

🔴 WILAYAH RISIKO TINGGI ({high_risk_count}):
1. {region_1} - Skor: {score_1}
2. {region_2} - Skor: {score_2}
...

🔥 STATISTIK 24 JAM:
• Total hotspot: {total_hotspot}
• Hotspot di gambut: {peat_hotspot}
• Rata-rata FRP: {avg_frp} MW
• Wilayah terdampak: {affected_regions}

📈 PERUBAHAN RISIKO:
• Naik signifikan: {increased_count} wilayah
• Turun: {decreased_count} wilayah
• Stabil: {stable_count} wilayah

⚠️ ALERT TERKIRIM HARI INI:
• Emergency: {emergency_count}
• Critical: {critical_count}
• Warning: {warning_count}

⏰ Laporan berikutnya: {next_report_time} WIB
```

---

## 6. Frekuensi Maksimum (Rate Limiting)

### 6.1 Per-Region Rate Limit

```javascript
const RATE_LIMITS = {
  // Per-region cooldown periods (dalam menit)
  peat_hotspot_info: 60,        // Max 1 alert per jam untuk INFO level
  peat_hotspot_warning: 45,     // Max 1 alert per 45 menit
  peat_hotspot_critical: 30,    // Max 1 alert per 30 menit
  peat_hotspot_emergency: 15,   // Max 1 alert per 15 menit
  
  risk_score_threshold: 120,    // Max 1 alert per 2 jam untuk threshold crossing
  risk_score_escalation: 60,    // Max 1 alert per jam untuk escalation
  
  composite_critical: 30,       // Max 1 alert per 30 menit
  composite_emergency: 15       // Max 1 alert per 15 menit
};

// Global rate limit (semua wilayah)
const GLOBAL_RATE_LIMITS = {
  max_alerts_per_hour: 50,      // Max 50 alert per jam total
  max_emergency_per_hour: 10,   // Max 10 emergency alert per jam
  max_critical_per_hour: 20     // Max 20 critical alert per jam
};
```

### 6.2 Rate Limiting Logic

```javascript
class AlertRateLimiter {
  constructor() {
    this.regionAlerts = new Map();  // region_id -> { lastAlertTime, alertCount }
    this.globalAlerts = [];
  }
  
  canSendAlert(regionId, alertType, severity) {
    const now = Date.now();
    
    // Check per-region cooldown
    const regionKey = `${regionId}_${alertType}`;
    const lastAlert = this.regionAlerts.get(regionKey);
    const cooldown = RATE_LIMITS[`${alertType}_${severity.toLowerCase()}`] || 30;
    
    if (lastAlert && (now - lastAlert.timestamp) < cooldown * 60000) {
      return {
        allowed: false,
        reason: `Cooldown aktif, tunggu ${cooldown} menit`,
        remainingTime: cooldown * 60000 - (now - lastAlert.timestamp)
      };
    }
    
    // Check global rate limits
    const lastHourAlerts = this.globalAlerts.filter(
      t => now - t < 3600000
    ).length;
    
    if (lastHourAlerts >= GLOBAL_RATE_LIMITS.max_alerts_per_hour) {
      return {
        allowed: false,
        reason: 'Global rate limit tercapai',
        remainingTime: 3600000 - (now - this.globalAlerts[0])
      };
    }
    
    return { allowed: true };
  }
  
  recordAlert(regionId, alertType) {
    const now = Date.now();
    const regionKey = `${regionId}_${alertType}`;
    this.regionAlerts.set(regionKey, { timestamp: now });
    this.globalAlerts.push(now);
    
    // Cleanup old entries (keep last 2 hours)
    this.globalAlerts = this.globalAlerts.filter(t => now - t < 7200000);
  }
}
```

### 6.3 Aggregation untuk Multiple Hotspots

```javascript
function aggregateHotspotAlerts(hotspots, regionId) {
  // Jika banyak hotspot dalam 1 wilayah, kirim 1 aggregated alert
  // bukan multiple alerts per hotspot
  
  const recentHotspots = hotspots.filter(h => 
    Date.now() - h.detectedAt < 3600000  // 1 jam terakhir
  );
  
  if (recentHotspots.length === 0) {
    return null;
  }
  
  if (recentHotspots.length === 1) {
    return formatSingleHotspotAlert(recentHotspots[0]);
  }
  
  // Multiple hotspots - aggregate
  return formatAggregatedAlert({
    count: recentHotspots.length,
    maxFRP: Math.max(...recentHotspots.map(h => h.frp)),
    avgFRP: recentHotspots.reduce((sum, h) => sum + h.frp, 0) / recentHotspots.length,
    peatHotspots: recentHotspots.filter(h => h.isOnPeatland).length,
    regionId
  });
}
```

---

## 7. Pembatasan Akses Agent

### 7.1 Database Access Policy

```javascript
// Agent HANYA memiliki akses READ-ONLY ke database
const AGENT_PERMISSIONS = {
  database: {
    read: ['hotspots', 'risk_scores', 'peat_data', 'weather_data', 'regions'],
    write: [],  // TIDAK ADA write access
    delete: []  // TIDAK ADA delete access
  },
  actions: {
    sendTelegramMessage: true,  // Boleh kirim pesan
    updateRiskScore: false,     // TIDAK boleh update skor
    modifyHotspotData: false,   // TIDAK boleh modifikasi data
    deleteAlerts: false         // TIDAK boleh hapus alert
  },
  endpoints: {
    telegram: {
      sendMessage: 'POST https://api.telegram.org/bot{token}/sendMessage',
      allowedChatIds: process.env.ALLOWED_CHAT_IDS?.split(',') || []
    }
  }
};
```

### 7.2 Telegram Bot Configuration

```javascript
// Environment variables (disimpan aman, tidak di codebase)
const TELEGRAM_CONFIG = {
  botToken: process.env.TELEGRAM_BOT_TOKEN,  // Wajib via env var
  allowedChatIds: (process.env.ALLOWED_CHAT_IDS || '')
    .split(',')
    .map(id => parseInt(id.trim()))
    .filter(id => !isNaN(id)),
  
  // Rate limiting per chat
  maxMessagesPerChatPerHour: 50,
  
  // Message options
  parseMode: 'HTML',
  disableWebPagePreview: false,
  disableNotification: false  // true untuk silent messages
};
```

### 7.3 Validation sebelum Kirim

```javascript
async function sendTelegramAlert(message, chatId) {
  // 1. Validate chat ID is authorized
  if (!TELEGRAM_CONFIG.allowedChatIds.includes(chatId)) {
    throw new Error(`Unauthorized chat ID: ${chatId}`);
  }
  
  // 2. Check rate limit
  const rateCheck = rateLimiter.canSendAlert(chatId, 'telegram', 'alert');
  if (!rateCheck.allowed) {
    console.warn(`Rate limit exceeded: ${rateCheck.reason}`);
    return { sent: false, reason: rateCheck.reason };
  }
  
  // 3. Validate message content
  if (!message || message.length > 4096) {
    throw new Error('Message invalid or too long (max 4096 chars)');
  }
  
  // 4. Send to Telegram API (simulation - tidak ada pengiriman sungguhan)
  console.log('[SIMULATION] Would send Telegram message:');
  console.log(`  Chat ID: ${chatId}`);
  console.log(`  Message length: ${message.length} chars`);
  console.log(`  Message preview: ${message.substring(0, 100)}...`);
  
  // Dalam implementasi sungguhan:
  // const response = await fetch(
  //   `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`,
  //   {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       chat_id: chatId,
  //       text: message,
  //       parse_mode: TELEGRAM_CONFIG.parseMode
  //     })
  //   }
  // );
  
  return { 
    sent: true, 
    simulated: true,
    timestamp: new Date().toISOString() 
  };
}
```

---

## 8. File yang Perlu Dibuat

### 8.1 Backend Services (New Files)

```
src/services/
├── alertTriggerService.js      # Logic trigger alert
├── alertRateLimiter.js         # Rate limiting logic
├── alertFormatter.js           # Format pesan Telegram
└── telegramService.js          # Telegram API client (read-only + send)

src/config/
└── alertConfig.js              # Thresholds, rate limits, chat IDs
```

### 8.2 Database Schema (Read-Only Access)

```sql
-- Tables yang diakses agent (READ-ONLY)

-- Hotspot data
SELECT * FROM hotspots 
WHERE acq_date >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY acq_date DESC, acq_time DESC;

-- Risk scores
SELECT * FROM risk_scores 
WHERE calculated_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY calculated_at DESC;

-- Peat data (static)
SELECT * FROM peatland_polygons;

-- Weather data
SELECT * FROM weather_observations 
WHERE observed_at >= CURRENT_DATE - INTERVAL '1 day';

-- Alert history (for rate limiting - READ access only)
SELECT * FROM alert_log 
WHERE sent_at >= CURRENT_DATE - INTERVAL '1 day';
```

---

## 9. Monitoring & Logging

### 9.1 Alert Log Structure

```javascript
const alertLogSchema = {
  id: 'uuid',
  alert_type: 'peat_hotspot | risk_score | composite',
  severity: 'info | warning | critical | emergency',
  region_id: 'string',
  region_name: 'string',
  trigger_conditions: 'object',  // JSON
  message_sent: 'string',        // Truncated message
  chat_id: 'number',
  sent_at: 'timestamp',
  response_status: 'number',     // HTTP status from Telegram
  response_body: 'object'        // JSON response
};
```

### 9.2 Metrics to Track

| Metric | Deskripsi | Target |
|--------|-----------|--------|
| Alert Delivery Rate | Persentase alert berhasil terkirim | > 99% |
| Alert Latency | Waktu dari trigger ke pengiriman | < 30 detik |
| False Positive Rate | Alert yang tidak relevan | < 10% |
| User Acknowledgment | Alert yang direspons user | > 50% |
| Rate Limit Hits | Frekuensi rate limit aktif | < 5% dari total trigger |

---

## 10. Testing Strategy

### 10.1 Unit Tests

```javascript
describe('AlertTriggerService', () => {
  test('should trigger peat hotspot alert for valid conditions', () => {
    const hotspot = { frp: 50, confidence: 'high', detectedAt: Date.now() };
    const peatData = { isPeatland: true, depth_category: 'Dalam' };
    
    const result = checkPeatHotspotAlert(hotspot, peatData);
    expect(result).toBe(true);
  });
  
  test('should NOT trigger for low confidence hotspot', () => {
    const hotspot = { frp: 50, confidence: 'low', detectedAt: Date.now() };
    const peatData = { isPeatland: true, depth_category: 'Dalam' };
    
    const result = checkPeatHotspotAlert(hotspot, peatData);
    expect(result).toBe(false);
  });
  
  test('should trigger risk score alert on threshold crossing', () => {
    const result = checkRiskScoreAlert(82, 58, 'region_123');
    expect(result.trigger).toBe(true);
    expect(result.crossedThreshold).toBe(true);
  });
});

describe('AlertRateLimiter', () => {
  test('should enforce cooldown period', () => {
    const limiter = new AlertRateLimiter();
    limiter.recordAlert('region_123', 'peat_hotspot');
    
    const check = limiter.canSendAlert('region_123', 'peat_hotspot', 'warning');
    expect(check.allowed).toBe(false);
  });
});
```

### 10.2 Integration Test (Simulated)

```javascript
describe('Telegram Alert Integration (Simulated)', () => {
  test('should format and simulate sending peat hotspot alert', async () => {
    const alertData = {
      region_name: 'Kabupaten Kapuas',
      peat_type: 'Gambut Topogen Air Payau',
      depth_min: 300,
      depth_max: 500,
      frp_value: 67.5,
      satellite: 'Suomi-NPP',
      acq_time: '2026-10-18T14:30:00Z'
    };
    
    const message = formatPeatHotspotAlert(alertData);
    const result = await sendTelegramAlert(message, 123456789);
    
    expect(result.sent).toBe(true);
    expect(result.simulated).toBe(true);
    expect(message).toContain('HOTSPOT DI LAHAN GAMBUT');
  });
});
```

---

## 11. Security Considerations

### 11.1 Bot Token Security

```javascript
// GOOD: Read from environment variable
const botToken = process.env.TELEGRAM_BOT_TOKEN;

// BAD: Hardcoded in code
// const botToken = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';  // NEVER DO THIS
```

### 11.2 Chat ID Whitelist

```javascript
// Hanya kirim ke chat ID yang sudah di-whitelist
const ALLOWED_CHAT_IDS = [
  parseInt(process.env.TELEGRAM_CHAT_ID_ADMIN),
  parseInt(process.env.TELEGRAM_CHAT_ID_BPB),
  parseInt(process.env.TELEGRAM_CHAT_ID_MANGGALA_AGNI)
].filter(id => !isNaN(id));

function validateChatId(chatId) {
  if (!ALLOWED_CHAT_IDS.includes(chatId)) {
    throw new SecurityError(`Unauthorized chat ID attempted: ${chatId}`);
  }
  return true;
}
```

### 11.3 Message Sanitization

```javascript
function sanitizeMessage(message) {
  // Hapus potensi HTML injection
  return message
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;');
}
```

---

## 12. Deployment Checklist

- [ ] Set TELEGRAM_BOT_TOKEN in environment variables
- [ ] Set ALLOWED_CHAT_IDS in environment variables
- [ ] Configure rate limit thresholds
- [ ] Set up alert log database table
- [ ] Test message formatting
- [ ] Verify rate limiting works
- [ ] Confirm read-only database access
- [ ] Set up monitoring for alert delivery
- [ ] Document escalation procedures
- [ ] Train users on alert meanings

---

## 13. Catatan Penting

**Tidak ada pengiriman pesan sungguhan dalam fase ini.** 

Semua fungsi `sendTelegramAlert()` hanya melakukan simulasi dengan console.log. Implementasi pengiriman sungguhan memerlukan:

1. Persetujuan user untuk setup Telegram bot
2. Environment variables yang dikonfigurasi
3. Testing dengan bot token yang valid
4. Koordinasi dengan penerima alert (BPBD, Manggala Agni, dll.)

---

**Dokumen ini adalah spesifikasi. Implementasi aktual memerlukan konfigurasi environment dan persetujuan user.**
