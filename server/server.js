// server.js
// Push-notifications scheduler server (SQLite + Expo Push API)

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
    store TEXT,
    appId TEXT
  );

  CREATE TABLE IF NOT EXISTS schedules (
    userId TEXT PRIMARY KEY,
    hour INTEGER NOT NULL,
    minute INTEGER NOT NULL,
    daysOfWeek TEXT,
    lastSentKey TEXT,
    updatedAt TEXT,
    altHour INTEGER,
    altMinute INTEGER,
    altDaysOfWeek TEXT
  );

  CREATE TABLE IF NOT EXISTS activity (
    userId TEXT NOT NULL,
    ymd TEXT NOT NULL,
    updatedAt TEXT,
    PRIMARY KEY (userId, ymd)
  );
`);

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

/* ===================== Migration ===================== */
function migrateToAudienceIdSchema() {
  if (!tableExists('devices') || !tableExists('schedules') || !tableExists('activity')) {
    return;
  }

  if (hasColumn('devices', 'audienceId') && hasColumn('schedules', 'audienceId')) {
    if (!hasColumn('devices', 'userId')) db.exec(`ALTER TABLE devices ADD COLUMN userId TEXT`);
    if (!hasColumn('devices', 'deviceId')) db.exec(`ALTER TABLE devices ADD COLUMN deviceId TEXT`);
    return;
  }

  const devCols = tableColumns('devices');
  if (!devCols.includes('userId') || devCols.includes('audienceId')) {
    return;
  }

  console.log('[MIGRATE] legacy schema detected -> migrating to audienceId schema');

  const tx = db.transaction(() => {
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

    db.exec(`
      INSERT INTO devices_v2 (
        audienceId, expoPushToken, language, tz, utcOffsetMin, appVersion,
        updatedAt, store, appId, userId, deviceId
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
        audienceId, hour, minute, daysOfWeek, lastSentKey,
        updatedAt, altHour, altMinute, altDaysOfWeek
      )
      SELECT
        userId AS audienceId,
        hour, minute, daysOfWeek, lastSentKey,
        updatedAt, altHour, altMinute, altDaysOfWeek
      FROM schedules;
    `);

    db.exec(`DROP TABLE schedules;`);
    db.exec(`ALTER TABLE schedules_v2 RENAME TO schedules;`);

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

function ensureColumn(table, name, type) {
  const cols = tableColumns(table);
  if (!cols.includes(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
}

ensureColumn('schedules', 'altHour', 'INTEGER');
ensureColumn('schedules', 'altMinute', 'INTEGER');
ensureColumn('schedules', 'altDaysOfWeek', 'TEXT');
ensureColumn('devices', 'store', 'TEXT');
ensureColumn('devices', 'appId', 'TEXT');
ensureColumn('devices', 'userId', 'TEXT');
ensureColumn('devices', 'deviceId', 'TEXT');

if (!hasColumn('devices', 'audienceId')) {
  console.warn('[DB] WARNING: devices.audienceId missing; DB may still be legacy');
}
if (!hasColumn('schedules', 'audienceId')) {
  console.warn('[DB] WARNING: schedules.audienceId missing; DB may still be legacy');
}

/* ===================== Utils ===================== */
function inferStore(appId, explicitStore = null) {
  if (explicitStore === 'ios') return 'ios';
  if (!appId) return explicitStore || null;
  if (appId.endsWith('.ru')) return 'rustore';
  return explicitStore || 'gp';
}

/* ===================== Weekly messages ===================== */
// Порядок текстов:
// 0 — воскресенье
// 1 — понедельник
// 2 — вторник
// 3 — среда
// 4 — четверг
// 5 — пятница
// 6 — суббота

const WEEKLY_MESSAGES = {
  en: {
    title: 'This is Verbify!',
    bodies: [
      '💪 Start the week with Hebrew! Practice verbs and conjugations in Verbify.',
      '🎯 Which preposition goes with this verb? Practice combinations you can use in conversation!',
      '🧠 A familiar verb, a different form. Review conjugations and test yourself!',
      '🗣️ Talking about the past or making plans? Practice Hebrew verbs in different tenses!',
      '🚀 Verbs and prepositions work together. Practice using them with confidence!',
      '☀️ A little Hebrew before the weekend! Review verbs, conjugations and prepositions.',
      '📚 Reinforce what you learned this week! Choose an exercise and spend a few minutes on Hebrew.',
    ],
  },
  ru: {
    title: 'Это Verbify!',
    bodies: [
      '💪 Начни неделю с иврита! Потренируй глаголы и спряжения в Verbify.',
      '🎯 Какой предлог нужен после глагола? Потренируй сочетания, которые пригодятся в разговоре!',
      '🧠 Знакомый глагол, другая форма. Повтори спряжения и проверь себя!',
      '🗣️ Говоришь о прошлом или строишь планы? Потренируй глаголы в разных временах!',
      '🚀 Глаголы и предлоги работают вместе. Потренируйся использовать их уверенно!',
      '☀️ Немного иврита перед выходными! Повтори глаголы, спряжения и предлоги.',
      '📚 Закрепи изученное за неделю! Выбери упражнение и удели несколько минут ивриту.',
    ],
  },
  fr: {
    title: 'C’est Verbify !',
    bodies: [
      '💪 Commence la semaine avec l’hébreu ! Entraîne-toi aux verbes et aux conjugaisons avec Verbify.',
      '🎯 Quelle préposition utiliser après ce verbe ? Entraîne-toi aux associations utiles en conversation !',
      '🧠 Un verbe connu, une autre forme. Révise les conjugaisons et teste tes connaissances !',
      '🗣️ Tu parles du passé ou de tes projets ? Entraîne-toi à conjuguer les verbes à différents temps !',
      '🚀 Verbes et prépositions vont ensemble. Entraîne-toi à les utiliser avec assurance !',
      '☀️ Un peu d’hébreu avant le week-end ! Révise les verbes, les conjugaisons et les prépositions.',
      '📚 Consolide les acquis de la semaine ! Choisis un exercice et consacre quelques minutes à l’hébreu.',
    ],
  },
  es: {
    title: '¡Esto es Verbify!',
    bodies: [
      '💪 ¡Empieza la semana con hebreo! Practica verbos y conjugaciones en Verbify.',
      '🎯 ¿Qué preposición va con este verbo? ¡Practica combinaciones útiles para conversar!',
      '🧠 Un verbo conocido, una forma diferente. ¡Repasa las conjugaciones y ponte a prueba!',
      '🗣️ ¿Hablas del pasado o haces planes? ¡Practica los verbos en distintos tiempos!',
      '🚀 Los verbos y las preposiciones van de la mano. ¡Practica para usarlos con confianza!',
      '☀️ ¡Un poco de hebreo antes del fin de semana! Repasa verbos, conjugaciones y preposiciones.',
      '📚 ¡Afianza lo aprendido esta semana! Elige un ejercicio y dedica unos minutos al hebreo.',
    ],
  },
  pt: {
    title: 'Este é o Verbify!',
    bodies: [
      '💪 Comece a semana com hebraico! Pratique verbos e conjugações no Verbify.',
      '🎯 Qual preposição acompanha este verbo? Pratique combinações úteis para conversar!',
      '🧠 Um verbo conhecido, uma forma diferente. Revise as conjugações e teste seus conhecimentos!',
      '🗣️ Falando do passado ou fazendo planos? Pratique os verbos em diferentes tempos!',
      '🚀 Verbos e preposições andam juntos. Pratique para usá-los com confiança!',
      '☀️ Um pouco de hebraico antes do fim de semana! Revise verbos, conjugações e preposições.',
      '📚 Reforce o que aprendeu nesta semana! Escolha um exercício e dedique alguns minutos ao hebraico.',
    ],
  },
  ar: {
    title: 'هذا هو Verbify!',
    bodies: [
      '💪 ابدأ الأسبوع بالعبرية! تدرّب على الأفعال وتصريفاتها في Verbify.',
      '🎯 ما حرف الجر المناسب لهذا الفعل؟ تدرّب على تراكيب مفيدة في المحادثة!',
      '🧠 فعل تعرفه بصيغة مختلفة. راجع تصريفات الأفعال واختبر نفسك!',
      '🗣️ تتحدث عن الماضي أم تخطط للمستقبل؟ تدرّب على الأفعال في أزمنة مختلفة!',
      '🚀 الأفعال وحروف الجر تعمل معًا. تدرّب على استخدامها بثقة!',
      '☀️ قليل من العبرية قبل عطلة نهاية الأسبوع! راجع الأفعال وتصريفاتها وحروف الجر.',
      '📚 ثبّت ما تعلمته هذا الأسبوع! اختر تمرينًا وخصص بضع دقائق للعبرية.',
    ],
  },
  am: {
    title: 'ይህ Verbify ነው!',
    bodies: [
      '💪 ሳምንቱን በዕብራይስጥ ይጀምሩ! በVerbify ግሶችንና የግስ እርባታን ይለማመዱ።',
      '🎯 ከዚህ ግስ ጋር የትኛው መስተዋድድ ይሄዳል? በውይይት የሚጠቅሙ ጥምረቶችን ይለማመዱ!',
      '🧠 የሚያውቁት ግስ፣ የተለየ ቅርጽ። የግስ እርባታን ይከልሱና እራስዎን ይፈትኑ!',
      '🗣️ ስለ ትናንት ይናገራሉ ወይስ ለወደፊት ያቅዳሉ? ግሶችን በተለያዩ ጊዜያት ይለማመዱ!',
      '🚀 ግሶችና መስተዋድዶች አብረው ይሠራሉ። በልበ ሙሉነት ለመጠቀም ይለማመዱ!',
      '☀️ ከሳምንቱ መጨረሻ በፊት ትንሽ ዕብራይስጥ! ግሶችን፣ የግስ እርባታንና መስተዋድዶችን ይከልሱ።',
      '📚 በዚህ ሳምንት የተማሩትን ያጠናክሩ! ልምምድ ይምረጡና ለዕብራይስጥ ጥቂት ደቂቃዎችን ይመድቡ።',
    ],
  },
};

const MESSAGE_LANGUAGE_ALIASES = {
  english: 'en', en: 'en',
  'русский': 'ru', russian: 'ru', ru: 'ru',
  'français': 'fr', french: 'fr', fr: 'fr',
  'español': 'es', spanish: 'es', es: 'es',
  'português': 'pt', portuguese: 'pt', pt: 'pt',
  'العربية': 'ar', arabic: 'ar', ar: 'ar',
  'አማርኛ': 'am', amharic: 'am', am: 'am',
};

function buildMessage(language = 'english', dow06 = 0) {
  const normalized = String(language || '').trim().toLowerCase();
  const lang = MESSAGE_LANGUAGE_ALIASES[normalized] ||
    MESSAGE_LANGUAGE_ALIASES[normalized.split(/[-_]/)[0]] || 'en';
  const messages = WEEKLY_MESSAGES[lang];
  const day = Number.isInteger(dow06) && dow06 >= 0 && dow06 <= 6 ? dow06 : 0;
  return { title: messages.title, body: messages.bodies[day] };
}

function resolveAudienceId({ audienceId, userId, deviceId }) {
  const a = audienceId || userId || deviceId || null;
  return a ? String(a) : null;
}

function maskToken(token) {
  const s = String(token || '');
  if (s.length <= 10) return s;
  return `${s.slice(0, 6)}...${s.slice(-6)}`;
}

/* ===================== Prepared statements ===================== */
const upsertDevice = db.prepare(`
  INSERT INTO devices (
    audienceId, expoPushToken, language, tz, utcOffsetMin, appVersion,
    updatedAt, store, appId, userId, deviceId
  )
  VALUES (
    @audienceId, @expoPushToken, @language, @tz, @utcOffsetMin, @appVersion,
    @updatedAt, @store, @appId, @userId, @deviceId
  )
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

const getDeviceByToken = db.prepare(`
  SELECT audienceId, userId, deviceId, expoPushToken, updatedAt
  FROM devices
  WHERE expoPushToken = ?
  LIMIT 1
`);

const upsertSchedule = db.prepare(`
  INSERT INTO schedules (
    audienceId, hour, minute, daysOfWeek, lastSentKey, updatedAt
  )
  VALUES (
    @audienceId, @hour, @minute, @daysOfWeek, @lastSentKey, @updatedAt
  )
  ON CONFLICT(audienceId) DO UPDATE SET
    hour=excluded.hour,
    minute=excluded.minute,
    daysOfWeek=excluded.daysOfWeek,
    updatedAt=excluded.updatedAt
`);

const updateAltSchedule = db.prepare(`
  UPDATE schedules SET
    altHour=@altHour,
    altMinute=@altMinute,
    altDaysOfWeek=@altDaysOfWeek,
    updatedAt=@updatedAt
  WHERE audienceId=@audienceId
`);

const getScheduleExists = db.prepare(
  `SELECT 1 FROM schedules WHERE audienceId=?`
);
const deleteSchedule = db.prepare(
  `DELETE FROM schedules WHERE audienceId=?`
);

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

const DEFAULT_BASE = { hour: 19, minute: 45, daysOfWeek: null };
const DEFAULT_ALT = { hour: 10, minute: 45, daysOfWeek: [5] };

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
  const seenTokens = new Set();

  for (const row of rows) {
    const tz = row.tz || 'UTC';
    let local = nowUtc.setZone(tz);
    if (!local.isValid) local = nowUtc;

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

    const ymd = local.toFormat('yyyy-LL-dd');
    if (hasActivityToday.get(row.audienceId, ymd)) continue;

    const target = local.set({
      hour: targetHour,
      minute: targetMinute,
      second: 0,
      millisecond: 0,
    });

    const diffMin = Math.abs(local.diff(target, 'minutes').minutes);
    if (diffMin > MINUTE_TOLERANCE) continue;

    const sentKey = makeSentKey(local, targetHour, targetMinute, useAlt);
    if (row.lastSentKey === sentKey) continue;

    const token = String(row.expoPushToken || '').trim();
    if (!token) continue;

    if (seenTokens.has(token)) {
      console.log(
        '[PUSH][DEDUP_TOKEN] skip duplicate token for audienceId=',
        row.audienceId,
        'token=',
        maskToken(token)
      );
      continue;
    }
    seenTokens.add(token);

    const msgText = buildMessage(row.language, dow06);
    messages.push({
      to: token,
      sound: 'default',
      title: msgText.title,
      body: msgText.body,
      data: { kind: 'daily-reminder', ts: nowUtc.toISO() },
      priority: 'high',
      channelId: 'default',
    });

    mapping.push({ audienceId: row.audienceId, sentKey, token });
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
          'token=',
          maskToken(m.token),
          'resp=',
          r
        );
      }
    }
  }

  return { matched, batches };
}

/* ===================== API ===================== */
app.get('/health', (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

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

    const inferred = inferStore(appId, store);
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

    const existingByToken = getDeviceByToken.get(expoPushToken);
    let finalAudienceId = resolvedAudienceId;

    if (
      existingByToken &&
      existingByToken.audienceId &&
      existingByToken.audienceId !== resolvedAudienceId
    ) {
      console.warn('[registerDevice] token already exists for another audienceId, reusing old audienceId', {
        incomingAudienceId: resolvedAudienceId,
        existingAudienceId: existingByToken.audienceId,
        token: maskToken(expoPushToken),
      });
      finalAudienceId = existingByToken.audienceId;
    }

    upsertDevice.run({
      audienceId: finalAudienceId,
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

    console.log('[registerDevice]', {
      incomingAudienceId: resolvedAudienceId,
      finalAudienceId,
      userId: userId ? String(userId) : null,
      deviceId: deviceId ? String(deviceId) : null,
      token: maskToken(expoPushToken),
      store: store || null,
      appId: appId || null,
    });

    const exists = getScheduleExists.get(finalAudienceId);

    if (!exists && AUTOSCHEDULE_BASE) {
      upsertSchedule.run({
        audienceId: finalAudienceId,
        hour: Math.max(0, Math.min(23, Number(DEFAULT_BASE.hour))),
        minute: Math.max(0, Math.min(59, Number(DEFAULT_BASE.minute))),
        daysOfWeek: DEFAULT_BASE.daysOfWeek
          ? JSON.stringify(DEFAULT_BASE.daysOfWeek)
          : null,
        lastSentKey: null,
        updatedAt: new Date().toISOString(),
      });

      console.log('[registerDevice] default base schedule created', {
        audienceId: finalAudienceId,
        ...DEFAULT_BASE,
      });

      if (AUTOSCHEDULE_ALT && Number.isFinite(DEFAULT_ALT.hour) && Number.isFinite(DEFAULT_ALT.minute)) {
        updateAltSchedule.run({
          audienceId: finalAudienceId,
          altHour: Math.max(0, Math.min(23, Number(DEFAULT_ALT.hour))),
          altMinute: Math.max(0, Math.min(59, Number(DEFAULT_ALT.minute))),
          altDaysOfWeek: JSON.stringify(DEFAULT_ALT.daysOfWeek ?? [5]),
          updatedAt: new Date().toISOString(),
        });

        console.log('[registerDevice] default ALT schedule created', {
          audienceId: finalAudienceId,
          ...DEFAULT_ALT,
        });
      }
    }

    res.json({ ok: true, audienceId: finalAudienceId });
  } catch (e) {
    console.error('[registerDevice] error:', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Create/update base schedule
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

// Set weekend/alt schedule
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

// Delete schedule
app.delete('/schedule/:audienceId', (req, res) => {
  deleteSchedule.run(String(req.params.audienceId));
  res.json({ ok: true });
});

// Mark activity "studied today"
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

// Debug dump
app.get('/debug/all', (_req, res) => {
  const devs = db.prepare('SELECT * FROM devices').all();
  const sch = db.prepare('SELECT * FROM schedules').all();
  const act = db
    .prepare('SELECT * FROM activity ORDER BY updatedAt DESC LIMIT 200')
    .all();

  res.json({ devices: devs, schedules: sch, activity: act });
});

// Debug health counters
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

// Cron trigger - call every minute
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