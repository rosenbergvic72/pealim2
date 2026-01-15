// server.js
// Push-notifications scheduler server (SQLite + Expo Push API)
// ✅ Supports BOTH userId and deviceId by introducing stable audienceId (PRIMARY KEY)
// ✅ Backward compatible: old clients can still send { userId, expoPushToken, ... }
// ✅ New clients should send { audienceId, userId?, deviceId?, expoPushToken, ... }
//
// Tables:
//   devices   (audienceId PK, stores token + lang/tz + userId/deviceId metadata)
//   schedules (audienceId PK)
//   activity  (audienceId + ymd PK)
//
// Endpoints:
//   GET  /health
//   POST /registerDevice
//   POST /schedule
//   POST /schedule/weekend
//   DELETE /schedule/:audienceId
//   POST /activity/mark
//   GET  /debug/all
//   GET  /debug/health
//   POST /cron

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import Database from 'better-sqlite3';
import { DateTime } from 'luxon';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

/* ===================== DB (SQLite) ===================== */
const DB_PATH =
  process.env.DB_PATH || path.join(process.cwd(), 'data', 'data.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
console.log('[DB] using', DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create initial legacy tables (will be migrated if needed)
db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    userId TEXT PRIMARY KEY,
    expoPushToken TEXT NOT NULL,
    language TEXT DEFAULT 'english',
    tz TEXT DEFAULT 'UTC',
    utcOffsetMin INTEGER DEFAULT 0,
    appVersion TEXT,
    updatedAt TEXT,
    store TEXT,     -- 'gp' | 'rustore'
    appId TEXT      -- com.rosenbergvictor72.verbify[.ru]
  );

  CREATE TABLE IF NOT EXISTS schedules (
    userId TEXT PRIMARY KEY,
    hour INTEGER NOT NULL,
    minute INTEGER NOT NULL,
    daysOfWeek TEXT,      -- JSON [0..6] or NULL (every day)
    lastSentKey TEXT,     -- 'YYYY-MM-DD@HH:mm[#alt]'
    updatedAt TEXT,
    altHour INTEGER,
    altMinute INTEGER,
    altDaysOfWeek TEXT
  );

  CREATE TABLE IF NOT EXISTS activity (
    userId TEXT NOT NULL,
    ymd TEXT NOT NULL,    -- YYYY-MM-DD in local TZ
    updatedAt TEXT,
    PRIMARY KEY (userId, ymd)
  );
`);

// Helper: check if column exists
function tableColumns(table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
}
function hasColumn(table, col) {
  return tableColumns(table).includes(col);
}
function tableExists(name) {
  const r = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`
    )
    .get(name);
  return !!r;
}

/**
 * MIGRATION:
 * If DB is legacy (devices.userId PK), migrate to audienceId-based schema.
 * This is safe and keeps existing data.
 */
function migrateToAudienceIdSchema() {
  if (!tableExists('devices') || !tableExists('schedules') || !tableExists('activity')) {
    return;
  }

  // Already migrated?
  if (hasColumn('devices', 'audienceId') && hasColumn('schedules', 'audienceId')) {
    // Ensure new columns exist
    if (!hasColumn('devices', 'userId')) db.exec(`ALTER TABLE devices ADD COLUMN userId TEXT`);
    if (!hasColumn('devices', 'deviceId')) db.exec(`ALTER TABLE devices ADD COLUMN deviceId TEXT`);
    return;
  }

  // Legacy expected: devices has userId, not audienceId
  const devCols = tableColumns('devices');
  if (!devCols.includes('userId') || devCols.includes('audienceId')) {
    return;
  }

  console.log('[MIGRATE] legacy schema detected -> migrating to audienceId schema');

  // Wrap in a transaction
  const tx = db.transaction(() => {
    // devices -> devices_v2
    db.exec(`
      CREATE TABLE IF NOT EXISTS devices_v2 (
        audienceId TEXT PRIMARY KEY,
        expoPushToken TEXT NOT NULL,
        language TEXT DEFAULT 'english',
        tz TEXT DEFAULT 'UTC',
        utcOffsetMin INTEGER DEFAULT 0,
        appVersion TEXT,
        updatedAt TEXT,
        store TEXT,
        appId TEXT,
        userId TEXT,
        deviceId TEXT
      );
    `);

    // Copy legacy data
    db.exec(`
      INSERT INTO devices_v2 (
        audienceId, expoPushToken, language, tz, utcOffsetMin, appVersion, updatedAt, store, appId, userId, deviceId
      )
      SELECT
        userId AS audienceId,
        expoPushToken,
        language,
        tz,
        utcOffsetMin,
        appVersion,
        updatedAt,
        store,
        appId,
        userId AS userId,
        NULL AS deviceId
      FROM devices;
    `);

    db.exec(`DROP TABLE devices;`);
    db.exec(`ALTER TABLE devices_v2 RENAME TO devices;`);

    // schedules -> schedules_v2
    db.exec(`
      CREATE TABLE IF NOT EXISTS schedules_v2 (
        audienceId TEXT PRIMARY KEY,
        hour INTEGER NOT NULL,
        minute INTEGER NOT NULL,
        daysOfWeek TEXT,
        lastSentKey TEXT,
        updatedAt TEXT,
        altHour INTEGER,
        altMinute INTEGER,
        altDaysOfWeek TEXT
      );
    `);

    db.exec(`
      INSERT INTO schedules_v2 (
        audienceId, hour, minute, daysOfWeek, lastSentKey, updatedAt, altHour, altMinute, altDaysOfWeek
      )
      SELECT
        userId AS audienceId,
        hour, minute, daysOfWeek, lastSentKey, updatedAt, altHour, altMinute, altDaysOfWeek
      FROM schedules;
    `);

    db.exec(`DROP TABLE schedules;`);
    db.exec(`ALTER TABLE schedules_v2 RENAME TO schedules;`);

    // activity -> activity_v2
    db.exec(`
      CREATE TABLE IF NOT EXISTS activity_v2 (
        audienceId TEXT NOT NULL,
        ymd TEXT NOT NULL,
        updatedAt TEXT,
        PRIMARY KEY (audienceId, ymd)
      );
    `);

    db.exec(`
      INSERT INTO activity_v2 (audienceId, ymd, updatedAt)
      SELECT userId AS audienceId, ymd, updatedAt
      FROM activity;
    `);

    db.exec(`DROP TABLE activity;`);
    db.exec(`ALTER TABLE activity_v2 RENAME TO activity;`);
  });

  tx();
  console.log('[MIGRATE] done');
}

migrateToAudienceIdSchema();

/**
 * Ensure any missing columns on already-migrated DB (soft migrations).
 */
function ensureColumn(table, name, type) {
  const cols = tableColumns(table);
  if (!cols.includes(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
}

// schedules legacy soft columns
ensureColumn('schedules', 'altHour', 'INTEGER');
ensureColumn('schedules', 'altMinute', 'INTEGER');
ensureColumn('schedules', 'altDaysOfWeek', 'TEXT');

// devices extra metadata columns in new schema
ensureColumn('devices', 'store', 'TEXT');
ensureColumn('devices', 'appId', 'TEXT');
ensureColumn('devices', 'userId', 'TEXT');
ensureColumn('devices', 'deviceId', 'TEXT');

// If after migration some columns missing, make sure audienceId exists (guard)
if (!hasColumn('devices', 'audienceId')) {
  // If still legacy and migration didn't run for some reason, this is a hard mismatch.
  console.warn('[DB] WARNING: devices.audienceId missing; DB may still be legacy');
}
if (!hasColumn('schedules', 'audienceId')) {
  console.warn('[DB] WARNING: schedules.audienceId missing; DB may still be legacy');
}

/* ===================== Utils ===================== */

// infer store from applicationId
function inferStore(appId) {
  if (!appId) return null;
  return appId.endsWith('.ru') ? 'rustore' : 'gp';
}

// localization
function buildMessage(language = 'english') {
  switch ((language || '').toLowerCase()) {
    case 'русский':
    case 'ru':
      return {
        title: 'Это Verbify!',
        body:
          'Не забудь потренироваться!\nСегодня практика — завтра уверенность в общении! 💪',
      };
    case 'français':
    case 'fr':
      return {
        title: 'C’est Verbify !',
        body:
          'N’oublie pas de t’entraîner !\nAujourd’hui, pratique — demain, confiance dans la communication ! 💪',
      };
    case 'español':
    case 'es':
      return {
        title: '¡Esto es Verbify!',
        body:
          '¡No olvides practicar!\n¡Hoy práctica — mañana confianza en la comunicación! 💪',
      };
    case 'português':
    case 'pt':
      return {
        title: 'Este é o Verbify!',
        body:
          'Não se esqueça de praticar!\nHoje prática — amanhã confiança na comunicação! 💪',
      };
    case 'العربية':
    case 'ar':
      return {
        title: 'هذا هو Verbify!',
        body:
          'لا تَنْسَ التدريب!\nتمرَّن اليوم — ثقة في التواصل غدًا! 💪',
      };
    case 'አማርኛ':
    case 'am':
      return {
        title: 'ይህ Verbify ነው!',
        body:
          'ልምምድን አትርሳ!\nዛሬ ልምምድ — ነገ በመገናኘት እርግጠኝነት! 💪',
      };
    default:
      return {
        title: 'This is Verbify!',
        body:
          'Don’t forget to practice!\nPractice today — confidence in conversation tomorrow! 💪',
      };
  }
}

// audienceId rules:
// - Prefer explicit audienceId
// - Else fallback to userId (legacy)
// - Else fallback to deviceId (if you decide to use deviceId as audienceId in new clients)
function resolveAudienceId({ audienceId, userId, deviceId }) {
  const a = deviceId || audienceId || userId || null;
  return a ? String(a) : null;
}


/* ===================== Prepared statements ===================== */

// devices: upsert by audienceId
const upsertDevice = db.prepare(`
  INSERT INTO devices (audienceId, expoPushToken, language, tz, utcOffsetMin, appVersion, updatedAt, store, appId, userId, deviceId)
  VALUES (@audienceId, @expoPushToken, @language, @tz, @utcOffsetMin, @appVersion, @updatedAt, @store, @appId, @userId, @deviceId)
  ON CONFLICT(audienceId) DO UPDATE SET
    expoPushToken=excluded.expoPushToken,
    language=excluded.language,
    tz=excluded.tz,
    utcOffsetMin=excluded.utcOffsetMin,
    appVersion=excluded.appVersion,
    updatedAt=excluded.updatedAt,
    store=excluded.store,
    appId=excluded.appId,
    userId=COALESCE(excluded.userId, devices.userId),
    deviceId=COALESCE(excluded.deviceId, devices.deviceId)
`);

// schedules: upsert by audienceId
const upsertSchedule = db.prepare(`
  INSERT INTO schedules (audienceId, hour, minute, daysOfWeek, lastSentKey, updatedAt)
  VALUES (@audienceId, @hour, @minute, @daysOfWeek, @lastSentKey, @updatedAt)
  ON CONFLICT(audienceId) DO UPDATE SET
    hour=excluded.hour,
    minute=excluded.minute,
    daysOfWeek=excluded.daysOfWeek,
    updatedAt=excluded.updatedAt
`);

const updateAltSchedule = db.prepare(`
  UPDATE schedules SET
    altHour=@altHour, altMinute=@altMinute, altDaysOfWeek=@altDaysOfWeek, updatedAt=@updatedAt
  WHERE audienceId=@audienceId
`);

const getScheduleExists = db.prepare(`SELECT 1 FROM schedules WHERE audienceId=?`);
const deleteSchedule = db.prepare(`DELETE FROM schedules WHERE audienceId=?`);

const getAllDueJoin = db.prepare(`
  SELECT s.audienceId, s.hour, s.minute, s.daysOfWeek, s.lastSentKey,
         s.altHour, s.altMinute, s.altDaysOfWeek,
         d.expoPushToken, d.language, d.tz
  FROM schedules s
  JOIN devices d ON d.audienceId = s.audienceId
`);

const setLastSentKey = db.prepare(
  `UPDATE schedules SET lastSentKey=?, updatedAt=? WHERE audienceId=?`
);

// activity by audienceId
const markActivity = db.prepare(`
  INSERT OR REPLACE INTO activity (audienceId, ymd, updatedAt)
  VALUES (@audienceId, @ymd, @updatedAt)
`);

const hasActivityToday = db.prepare(
  `SELECT 1 FROM activity WHERE audienceId=? AND ymd=?`
);

/* ===================== Defaults / autoschedule ===================== */
const AUTOSCHEDULE_BASE = (process.env.AUTOSCHEDULE_BASE ?? 'true') === 'true';
const AUTOSCHEDULE_ALT = (process.env.AUTOSCHEDULE_ALT ?? 'true') === 'true';

const DEFAULT_BASE = { hour: 19, minute: 45, daysOfWeek: null }; // every day
const DEFAULT_ALT = { hour: 10, minute: 45, daysOfWeek: [5] }; // friday (0..6, sun=0)

/* ===================== Expo push ===================== */
const EXPO_PUSH_ENDPOINT =
  process.env.EXPO_PUSH_ENDPOINT || 'https://exp.host/--/api/v2/push/send';

async function sendExpoBatch(messages) {
  if (!messages.length) {
    return { ok: true, status: 200, data: { data: [] }, sent: 0 };
  }

  const resp = await fetch(EXPO_PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-encoding': 'gzip, deflate',
      Accept: 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const data = await resp.json().catch(() => ({}));
  console.log('[PUSH] status=', resp.status, 'resp=', JSON.stringify(data));
  return { ok: resp.ok, status: resp.status, data, sent: messages.length };
}

/* ===================== Scheduler ===================== */
// window tolerance in minutes
const MINUTE_TOLERANCE = Number(process.env.MINUTE_TOLERANCE ?? '1.5');

function makeSentKey(local, targetHour, targetMinute, useAlt) {
  return `${local.toFormat('yyyy-LL-dd')}@${String(targetHour).padStart(
    2,
    '0'
  )}:${String(targetMinute).padStart(2, '0')}${useAlt ? '#alt' : ''}`;
}

async function processDueNow() {
  const nowUtc = DateTime.utc();
  const rows = getAllDueJoin.all();

  const messages = [];
  const mapping = [];

  for (const row of rows) {
    const tz = row.tz || 'UTC';
    let local = nowUtc.setZone(tz);
    if (!local.isValid) local = nowUtc;

    // 0..6 (sun=0)
    const dow06 = local.weekday % 7;

    let baseDays = null;
    let altDays = null;
    if (row.daysOfWeek) {
      try {
        baseDays = JSON.parse(row.daysOfWeek);
      } catch {}
    }
    if (row.altDaysOfWeek) {
      try {
        altDays = JSON.parse(row.altDaysOfWeek);
      } catch {}
    }

    let targetHour = Number(row.hour);
    let targetMinute = Number(row.minute);
    let useAlt = false;

    const hasAltWindow =
      Array.isArray(altDays) &&
      altDays.includes(dow06) &&
      row.altHour != null &&
      row.altMinute != null;

    if (hasAltWindow) {
      targetHour = Number(row.altHour);
      targetMinute = Number(row.altMinute);
      useAlt = true;
    } else if (Array.isArray(baseDays) && baseDays.length && !baseDays.includes(dow06)) {
      continue;
    }

    // skip if already active today
    const ymd = local.toFormat('yyyy-LL-dd');
    if (hasActivityToday.get(row.audienceId, ymd)) continue;

    // time window check
    const target = local.set({
      hour: targetHour,
      minute: targetMinute,
      second: 0,
      millisecond: 0,
    });
    const diffMin = Math.abs(local.diff(target, 'minutes').minutes);
    if (diffMin > MINUTE_TOLERANCE) continue;

    // prevent duplicates for same slot
    const sentKey = makeSentKey(local, targetHour, targetMinute, useAlt);
    if (row.lastSentKey === sentKey) continue;

    const msgText = buildMessage(row.language);
    messages.push({
      to: row.expoPushToken,
      sound: 'default',
      title: msgText.title,
      body: msgText.body,
      data: { kind: 'daily-reminder', ts: nowUtc.toISO() },
      priority: 'high',
      channelId: 'default',
    });
    mapping.push({ audienceId: row.audienceId, sentKey });
  }

  const CHUNK = 100;
  const batches = [];
  const matched = messages.length;

  for (let i = 0; i < messages.length; i += CHUNK) {
    const batch = messages.slice(i, i + CHUNK);
    const map = mapping.slice(i, i + CHUNK);

    const res = await sendExpoBatch(batch);
    console.log(`[PUSH] batch size=${batch.length} status=${res.status}`);
    batches.push({ ok: res.ok, status: res.status, expo: res.data });

    if (!res.ok || !res.data || !Array.isArray(res.data.data)) {
      console.error('[PUSH] expo send failed or unexpected response format');
      continue;
    }

    const results = res.data.data;
    const nowIso = new Date().toISOString();

    for (let k = 0; k < results.length; k++) {
      const r = results[k];
      const m = map[k];
      if (!m) continue;

      if (r && r.status === 'ok') {
        setLastSentKey.run(m.sentKey, nowIso, m.audienceId);
      } else {
        console.warn(
          '[PUSH] send error for audienceId=',
          m.audienceId,
          'resp=',
          r
        );
        // NOTE: do NOT set lastSentKey on error, so we can retry later
      }
    }
  }

  return { matched, batches };
}

/* ===================== API ===================== */

app.get('/health', (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

// Unified register endpoint (backward compatible)
app.post('/registerDevice', (req, res) => {
  try {
    let {
      audienceId,
      userId,
      deviceId,
      expoPushToken,
      language,
      tz,
      utcOffsetMin,
      appVersion,
      store,
      appId,
    } = req.body || {};

    const resolvedAudienceId = resolveAudienceId({ audienceId, userId, deviceId });

    if (!resolvedAudienceId || !expoPushToken) {
      return res
        .status(400)
        .json({ error: 'audienceId (or userId/deviceId) and expoPushToken are required' });
    }

    // infer store by appId
    const inferred = inferStore(appId);
    if (!store || (inferred && store !== inferred)) {
      if (store && inferred && store !== inferred) {
        console.warn('[registerDevice] store/appId mismatch -> override', {
          store,
          appId,
          inferred,
        });
      }
      store = inferred;
    }

    upsertDevice.run({
      audienceId: resolvedAudienceId,
      expoPushToken,
      language: language || 'english',
      tz: tz || 'UTC',
      utcOffsetMin: Number.isFinite(utcOffsetMin) ? utcOffsetMin : 0,
      appVersion: appVersion || 'unknown',
      updatedAt: new Date().toISOString(),
      store: store || null,
      appId: appId || null,
      userId: userId ? String(userId) : null,
      deviceId: deviceId ? String(deviceId) : null,
    });

    // create default schedules on first registration for this audienceId
    const exists = getScheduleExists.get(resolvedAudienceId);
    if (!exists && AUTOSCHEDULE_BASE) {
      upsertSchedule.run({
        audienceId: resolvedAudienceId,
        hour: Math.max(0, Math.min(23, Number(DEFAULT_BASE.hour))),
        minute: Math.max(0, Math.min(59, Number(DEFAULT_BASE.minute))),
        daysOfWeek: DEFAULT_BASE.daysOfWeek
          ? JSON.stringify(DEFAULT_BASE.daysOfWeek)
          : null,
        lastSentKey: null,
        updatedAt: new Date().toISOString(),
      });
      console.log('[registerDevice] default base schedule created', DEFAULT_BASE);

      if (AUTOSCHEDULE_ALT && Number.isFinite(DEFAULT_ALT.hour) && Number.isFinite(DEFAULT_ALT.minute)) {
        updateAltSchedule.run({
          audienceId: resolvedAudienceId,
          altHour: Math.max(0, Math.min(23, Number(DEFAULT_ALT.hour))),
          altMinute: Math.max(0, Math.min(59, Number(DEFAULT_ALT.minute))),
          altDaysOfWeek: JSON.stringify(DEFAULT_ALT.daysOfWeek ?? [5]),
          updatedAt: new Date().toISOString(),
        });
        console.log('[registerDevice] default ALT schedule created', DEFAULT_ALT);
      }
    }

    res.json({ ok: true, audienceId: resolvedAudienceId });
  } catch (e) {
    console.error('[registerDevice] error:', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// create/update base schedule
app.post('/schedule', (req, res) => {
  const { audienceId, userId, deviceId, hour, minute, daysOfWeek } = req.body || {};
  const resolvedAudienceId = resolveAudienceId({ audienceId, userId, deviceId });

  if (!resolvedAudienceId || hour == null || minute == null) {
    return res
      .status(400)
      .json({ error: 'audienceId (or userId/deviceId), hour, minute required' });
  }

  upsertSchedule.run({
    audienceId: resolvedAudienceId,
    hour: Math.max(0, Math.min(23, Number(hour))),
    minute: Math.max(0, Math.min(59, Number(minute))),
    daysOfWeek: daysOfWeek ? JSON.stringify(daysOfWeek) : null,
    lastSentKey: null,
    updatedAt: new Date().toISOString(),
  });

  res.json({ ok: true });
});

// set weekend/alt schedule
app.post('/schedule/weekend', (req, res) => {
  const { audienceId, userId, deviceId, hour, minute, daysOfWeek } = req.body || {};
  const resolvedAudienceId = resolveAudienceId({ audienceId, userId, deviceId });

  if (!resolvedAudienceId || hour == null || minute == null) {
    return res
      .status(400)
      .json({ error: 'audienceId (or userId/deviceId), hour, minute required' });
  }

  const exists = getScheduleExists.get(resolvedAudienceId);
  if (!exists) return res.status(404).json({ error: 'base schedule not found' });

  updateAltSchedule.run({
    audienceId: resolvedAudienceId,
    altHour: Math.max(0, Math.min(23, Number(hour))),
    altMinute: Math.max(0, Math.min(59, Number(minute))),
    altDaysOfWeek: JSON.stringify(daysOfWeek ?? [0, 6]),
    updatedAt: new Date().toISOString(),
  });

  res.json({ ok: true });
});

// delete schedule (and only schedule)
app.delete('/schedule/:audienceId', (req, res) => {
  deleteSchedule.run(String(req.params.audienceId));
  res.json({ ok: true });
});

// mark activity "studied today"
app.post('/activity/mark', (req, res) => {
  const { audienceId, userId, deviceId } = req.body || {};
  const resolvedAudienceId = resolveAudienceId({ audienceId, userId, deviceId });

  if (!resolvedAudienceId) {
    return res.status(400).json({ error: 'audienceId (or userId/deviceId) required' });
  }

  const dev = db
    .prepare('SELECT tz FROM devices WHERE audienceId=?')
    .get(resolvedAudienceId);

  const tz = dev?.tz || 'UTC';
  let now = DateTime.utc().setZone(tz);
  if (!now.isValid) now = DateTime.utc();
  const ymd = now.toFormat('yyyy-LL-dd');

  markActivity.run({
    audienceId: resolvedAudienceId,
    ymd,
    updatedAt: new Date().toISOString(),
  });

  res.json({ ok: true, ymd, audienceId: resolvedAudienceId });
});

// debug dump
app.get('/debug/all', (_req, res) => {
  const devs = db.prepare('SELECT * FROM devices').all();
  const sch = db.prepare('SELECT * FROM schedules').all();
  const act = db
    .prepare('SELECT * FROM activity ORDER BY updatedAt DESC LIMIT 200')
    .all();
  res.json({ devices: devs, schedules: sch, activity: act });
});

// debug health counters
app.get('/debug/health', (_req, res) => {
  try {
    const d = db.prepare('SELECT COUNT(*) c FROM devices').get().c;
    const s = db.prepare('SELECT COUNT(*) c FROM schedules').get().c;
    const a = db.prepare('SELECT COUNT(*) c FROM activity').get().c;
    res.json({
      ok: true,
      dbPath: DB_PATH,
      devices: d,
      schedules: s,
      activity: a,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// cron trigger - call every minute
app.post('/cron', async (_req, res) => {
  try {
    const out = await processDueNow();
    res.json({ ok: true, ...out });
  } catch (e) {
    console.error('cron error:', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

/* ===================== Start ===================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server up on :' + PORT));
