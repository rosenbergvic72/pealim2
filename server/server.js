// server.js
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

// ====== БД (SQLite) ======
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'data.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
console.log('[DB] using', DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Базовые таблицы
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
    daysOfWeek TEXT,      -- JSON [0..6] или NULL (каждый день)
    lastSentKey TEXT,     -- 'YYYY-MM-DDTHH:mm' в локальной TZ пользователя
    updatedAt TEXT,
    altHour INTEGER,
    altMinute INTEGER,
    altDaysOfWeek TEXT    -- JSON-массив, напр. [0,6]
  );

  -- факты активности (день засчитан)
  CREATE TABLE IF NOT EXISTS activity (
    userId TEXT NOT NULL,
    ymd TEXT NOT NULL,    -- YYYY-MM-DD в локальной TZ пользователя
    updatedAt TEXT,
    PRIMARY KEY (userId, ymd)
  );
`);

// Мягкая миграция (на случай старой БД)
function ensureColumn(table, name, type) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!cols.includes(name)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
  }
}
ensureColumn('schedules', 'altHour', 'INTEGER');
ensureColumn('schedules', 'altMinute', 'INTEGER');
ensureColumn('schedules', 'altDaysOfWeek', 'TEXT');
ensureColumn('devices', 'store', 'TEXT');
ensureColumn('devices', 'appId', 'TEXT');

// ====== prepared statements ======
const upsertDevice = db.prepare(`
  INSERT INTO devices (userId, expoPushToken, language, tz, utcOffsetMin, appVersion, updatedAt, store, appId)
  VALUES (@userId, @expoPushToken, @language, @tz, @utcOffsetMin, @appVersion, @updatedAt, @store, @appId)
  ON CONFLICT(userId) DO UPDATE SET
    expoPushToken=excluded.expoPushToken,
    language=excluded.language,
    tz=excluded.tz,
    utcOffsetMin=excluded.utcOffsetMin,
    appVersion=excluded.appVersion,
    updatedAt=excluded.updatedAt,
    store=excluded.store,
    appId=excluded.appId
`);

const upsertSchedule = db.prepare(`
  INSERT INTO schedules (userId, hour, minute, daysOfWeek, lastSentKey, updatedAt)
  VALUES (@userId, @hour, @minute, @daysOfWeek, @lastSentKey, @updatedAt)
  ON CONFLICT(userId) DO UPDATE SET
    hour=excluded.hour,
    minute=excluded.minute,
    daysOfWeek=excluded.daysOfWeek,
    updatedAt=excluded.updatedAt
`);

const updateAltSchedule = db.prepare(`
  UPDATE schedules SET
    altHour=@altHour, altMinute=@altMinute, altDaysOfWeek=@altDaysOfWeek, updatedAt=@updatedAt
  WHERE userId=@userId
`);

const deleteSchedule = db.prepare(`DELETE FROM schedules WHERE userId=?`);

const getAllDueJoin = db.prepare(`
  SELECT s.userId, s.hour, s.minute, s.daysOfWeek, s.lastSentKey,
         s.altHour, s.altMinute, s.altDaysOfWeek,
         d.expoPushToken, d.language, d.tz
  FROM schedules s
  JOIN devices d ON d.userId = s.userId
`);

const setLastSentKey = db.prepare(`
  UPDATE schedules SET lastSentKey=?, updatedAt=? WHERE userId=?
`);

const markActivity = db.prepare(`
  INSERT OR REPLACE INTO activity (userId, ymd, updatedAt)
  VALUES (@userId, @ymd, @updatedAt)
`);

const hasActivityToday = db.prepare(`
  SELECT 1 FROM activity WHERE userId=? AND ymd=?
`);

// ====== локализация текста уведомления ======
function buildMessage(language = 'english') {
  switch ((language || '').toLowerCase()) {
    case 'русский':
    case 'ru':
      return { title: 'Это Verbify!', body: 'Не забудь потренироваться!\nСегодня практика — завтра уверенность! 💪' };
    case 'français':
    case 'fr':
      return { title: 'C’est Verbify !', body: 'N’oublie pas de t’entraîner !\nAujourd’hui entraînement — demain confiance ! 💪' };
    case 'español':
    case 'es':
      return { title: '¡Esto es Verbify!', body: '¡No olvides practicar!\n¡Hoy práctica — mañana confianza! 💪' };
    case 'português':
    case 'pt':
      return { title: 'Este é o Verbify!', body: 'Não se esqueça de praticar!\nHoje prática — amanhã confiança! 💪' };
    case 'العربية':
    case 'ar':
      return { title: 'هذا هو Verbify!', body: 'لا تنسَ التدرّب!\nتمرّن اليوم — ثقة غدًا! 💪' };
    case 'አማርኛ':
    case 'am':
      return { title: 'ይህ Verbify ነው!', body: 'ማስተማርን አትርሳ!\nዛሬ ማስተማር — ነገ እምነት! 💪' };
    default:
      return { title: 'This is Verbify!', body: 'Don’t forget to practice!\nPractice today — confidence tomorrow! 💪' };
  }
}

// ====== отправка пачки в Expo Push ======
async function sendExpoBatch(messages) {
  if (!messages.length) return { ok: true, status: 200, sent: 0 };

  const resp = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Accept': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const data = await resp.json().catch(() => ({}));
  console.log('[PUSH] status=', resp.status, 'resp=', JSON.stringify(data));

  return { ok: resp.ok, status: resp.status, data, sent: messages.length };
}

// ====== проверка «к кому пора» и отправка ======
async function processDueNow() {
  const nowUtc = DateTime.utc();
  const rows = getAllDueJoin.all();

  const toSend = [];
  for (const row of rows) {
    // локальное время пользователя
    const tz = row.tz || 'UTC';
    let local = nowUtc.setZone(tz);
    if (!local.isValid) local = nowUtc;

    // день недели 0..6 (вс=0 .. сб=6)
    const dow06 = local.weekday % 7; // Luxon: Mon..Sun = 1..7 → 1..6,0

    // базовые и альтернативные дни
    let baseDays = null, altDays = null;
    if (row.daysOfWeek)    { try { baseDays = JSON.parse(row.daysOfWeek); }    catch {} }
    if (row.altDaysOfWeek) { try { altDays  = JSON.parse(row.altDaysOfWeek); } catch {} }

    // выбираем целевое окно (alt приоритетнее, если сегодня его день)
    let targetHour = row.hour;
    let targetMinute = row.minute;

    const hasAltWindow = Array.isArray(altDays) && altDays.includes(dow06)
      && row.altHour != null && row.altMinute != null;

    if (hasAltWindow) {
      targetHour = Number(row.altHour);
      targetMinute = Number(row.altMinute);
    } else if (Array.isArray(baseDays) && baseDays.length && !baseDays.includes(dow06)) {
      // базовое окно не "каждый день" и сегодня не входит
      continue;
    }

    // если пользователь уже занимался сегодня — пропускаем
    const ymd = local.toFormat('yyyy-LL-dd');
    if (hasActivityToday.get(row.userId, ymd)) continue;

    // совпала ли минута
    if (local.hour !== targetHour || local.minute !== targetMinute) continue;

    // защита от дублей
    const sentKey = local.toFormat("yyyy-LL-dd'T'HH:mm");
    if (row.lastSentKey === sentKey) continue;

    const msg = buildMessage(row.language);
    toSend.push({
      to: row.expoPushToken,
      sound: 'default',
      title: msg.title,
      body: msg.body,
      data: { kind: 'daily-reminder', ts: nowUtc.toISO() },
      priority: 'high',
      channelId: 'default',
    });

    setLastSentKey.run(sentKey, new Date().toISOString(), row.userId);
  }

  // отправляем батчами по 100
  const CHUNK = 100;
  for (let i = 0; i < toSend.length; i += CHUNK) {
    const batch = toSend.slice(i, i + CHUNK);
    const res = await sendExpoBatch(batch);
    console.log(`[PUSH] batch sent=${res.sent} status=${res.status}`);
    if (!res.ok) console.error('[PUSH] error payload:', res.data);
  }

  return { matched: toSend.length };
}

// ====== API ======

// healthcheck
app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// регистрация девайса/токена
app.post('/registerDevice', (req, res) => {
  try {
    const {
      userId, expoPushToken, language, tz, utcOffsetMin, appVersion,
      store, appId
    } = req.body || {};
    if (!userId || !expoPushToken) {
      return res.status(400).json({ error: 'userId and expoPushToken are required' });
    }

    upsertDevice.run({
      userId,
      expoPushToken,
      language: language || 'english',
      tz: tz || 'UTC',
      utcOffsetMin: Number.isFinite(utcOffsetMin) ? utcOffsetMin : 0,
      appVersion: appVersion || 'unknown',
      updatedAt: new Date().toISOString(),
      store: store || null,
      appId: appId || null,
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('[registerDevice] error:', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// создать/обновить базовое расписание
app.post('/schedule', (req, res) => {
  const { userId, hour, minute, daysOfWeek } = req.body || {};
  if (!userId || hour == null || minute == null) {
    return res.status(400).json({ error: 'userId, hour, minute required' });
  }

  const payload = {
    userId,
    hour: Math.max(0, Math.min(23, Number(hour))),
    minute: Math.max(0, Math.min(59, Number(minute))),
    daysOfWeek: daysOfWeek ? JSON.stringify(daysOfWeek) : null,
    lastSentKey: null,
    updatedAt: new Date().toISOString(),
  };
  upsertSchedule.run(payload);
  res.json({ ok: true });
});

// задать альтернативное окно (например, выходные или пятница)
app.post('/schedule/weekend', (req, res) => {
  const { userId, hour, minute, daysOfWeek } = req.body || {};
  if (!userId || hour == null || minute == null) {
    return res.status(400).json({ error: 'userId, hour, minute required' });
  }

  const exists = db.prepare('SELECT 1 FROM schedules WHERE userId=?').get(userId);
  if (!exists) return res.status(404).json({ error: 'base schedule not found' });

  updateAltSchedule.run({
    userId,
    altHour: Math.max(0, Math.min(23, Number(hour))),
    altMinute: Math.max(0, Math.min(59, Number(minute))),
    altDaysOfWeek: JSON.stringify(daysOfWeek ?? [0, 6]),
    updatedAt: new Date().toISOString(),
  });

  res.json({ ok: true });
});

// удалить расписание
app.delete('/schedule/:userId', (req, res) => {
  deleteSchedule.run(req.params.userId);
  res.json({ ok: true });
});

// отметить, что "сегодня занимался"
app.post('/activity/mark', (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const dev = db.prepare('SELECT tz FROM devices WHERE userId=?').get(userId);
  const tz = dev?.tz || 'UTC';
  let now = DateTime.utc().setZone(tz);
  if (!now.isValid) now = DateTime.utc();
  const ymd = now.toFormat('yyyy-LL-dd');

  markActivity.run({ userId, ymd, updatedAt: new Date().toISOString() });
  res.json({ ok: true, ymd });
});

// отладка
app.get('/debug/all', (_req, res) => {
  const devs = db.prepare('SELECT * FROM devices').all();
  const sch = db.prepare('SELECT * FROM schedules').all();
  const act = db.prepare('SELECT * FROM activity ORDER BY updatedAt DESC LIMIT 200').all();
  res.json({ devices: devs, schedules: sch, activity: act });
});

// быстрый health со счетчиками
app.get('/debug/health', (_req, res) => {
  try {
    const d = db.prepare('SELECT COUNT(*) c FROM devices').get().c;
    const s = db.prepare('SELECT COUNT(*) c FROM schedules').get().c;
    const a = db.prepare('SELECT COUNT(*) c FROM activity').get().c;
    res.json({ ok: true, dbPath: DB_PATH, devices: d, schedules: s, activity: a, ts: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// крон-триггер
app.post('/cron', async (_req, res) => {
  try {
    const out = await processDueNow();
    res.json({ ok: true, ...out });
  } catch (e) {
    console.error('cron error:', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// ====== старт ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server up on :' + PORT));
