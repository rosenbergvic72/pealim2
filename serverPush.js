// serverPush.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ======= PUSH SERVER ======= */
const API_BASE = 'https://pealim-server.onrender.com';
const REGISTER_PATH = '/registerDevice';
const SCHEDULE_PATH = '/schedule'; // POST

/* ======= HELPERS ======= */

// Старый legacy userId (случайный) — оставляем для совместимости
async function getLegacyUserId() {
  let id = await AsyncStorage.getItem('userId');
  if (!id) {
    id = `u_${Platform.OS}_${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem('userId', id);
  }
  return id;
}

// Новый стабильный device id (как в IapProvider / code entitlements)
async function getDeviceAudienceId() {
  const id = await AsyncStorage.getItem('iap:deviceUserId');
  return id ? String(id) : null;
}

// ЕДИНЫЙ ключ для пуш-сервера
// 1) если есть iap:deviceUserId -> audienceId = он
// 2) иначе fallback на legacy userId
async function getAudienceId() {
  const deviceId = await getDeviceAudienceId();
  if (deviceId) return { audienceId: deviceId, deviceId, userId: null };

  const legacyUserId = await getLegacyUserId();
  return { audienceId: legacyUserId, deviceId: null, userId: legacyUserId };
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function todayLocalYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/* ======= PERMISSIONS + ANDROID CHANNEL ======= */
async function askNotifPermission() {
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (perm.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return !!req.granted;
  } catch {
    return false;
  }
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    bypassDnd: false,
    lightColor: '#FFFFFF',
  });
}

/* ======= EXPO PUSH TOKEN ======= */
export async function getExpoPushTokenAsync() {
  try {
    const allowed = await askNotifPermission();
    if (!allowed) {
      console.log('[push] permission denied');
      return null;
    }

    await ensureAndroidChannel();

    if (Constants.appOwnership === 'expo') {
      console.log('[push] Expo Go detected: remote push is not available');
      return null;
    }

    const configProjectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      null;

    const HARD_CODED_PROJECT_ID = '1c3fbe10-9608-4dd7-a477-f0ae7c294b5e';
    const projectId = configProjectId || HARD_CODED_PROJECT_ID;

    console.log('[push] using projectId:', projectId);

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });

    if (data) {
      await AsyncStorage.setItem('expoPushToken', data);
      console.log('[push] got expo token:', data);
      return data;
    }
    console.log('[push] token empty');
    return null;
  } catch (e) {
    console.warn('getExpoPushTokenAsync failed:', e);
    return null;
  }
}

/* ======= REGISTER DEVICE ON SERVER ======= */
export async function registerDeviceOnServer(language = 'english') {
  const cached = await AsyncStorage.getItem('expoPushToken');
  const token = cached || (await getExpoPushTokenAsync());
  if (!token) {
    console.log('[register] skip: no_expo_token');
    return { ok: false, error: 'no_expo_token' };
  }

  const { audienceId, deviceId, userId } = await getAudienceId();

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const utcOffsetMin = -new Date().getTimezoneOffset();

  const store = Constants?.expoConfig?.extra?.store ?? 'gp'; // gp | rustore
  const appId =
    Application.applicationId ??
    Constants?.expoConfig?.android?.package ??
    Constants?.expoConfig?.ios?.bundleIdentifier ??
    null;

  console.log('[register] audienceId/userId/deviceId:', audienceId, userId, deviceId);
  console.log('[register] store/appId:', store, appId);

  // ВАЖНО: шлём audienceId + (опционально) deviceId/userId
  const payload = {
    audienceId,
    deviceId, // метаданные
    userId,   // метаданные (legacy)

    expoPushToken: token,
    language,
    tz,
    utcOffsetMin,
    appVersion: Constants?.expoConfig?.version || 'unknown',
    store,
    appId,
  };

  try {
    const res = await fetch(API_BASE + REGISTER_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await safeJson(res);
    console.log('[register] status', res.status, 'resp', data);
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.log('registerDeviceOnServer error:', e);
    return { ok: false, error: String(e) };
  }
}

/* ======= SET BASE SCHEDULE ======= */
export async function setServerSchedule(hour = 20, minute = 0, daysOfWeek = null) {
  const { audienceId } = await getAudienceId();

  const body = { audienceId, hour, minute };
  if (Array.isArray(daysOfWeek) && daysOfWeek.length) {
    body.daysOfWeek = daysOfWeek;
  }

  try {
    const res = await fetch(API_BASE + SCHEDULE_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await safeJson(res);
    console.log('[schedule] set base time', { audienceId, hour, minute, daysOfWeek, status: res.status });
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.log('setServerSchedule error:', e);
    return { ok: false, error: String(e) };
  }
}

/* ======= CLEAR SCHEDULE ======= */
export async function clearServerSchedule() {
  const { audienceId } = await getAudienceId();
  try {
    const res = await fetch(`${API_BASE}/schedule/${encodeURIComponent(audienceId)}`, {
      method: 'DELETE',
    });
    const data = await safeJson(res);
    console.log('[schedule] cleared', { audienceId, status: res.status });
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.log('clearServerSchedule error:', e);
    return { ok: false, error: String(e) };
  }
}

/* ======= MARK ACTIVITY TODAY ======= */
export async function markActivityToday() {
  const { audienceId } = await getAudienceId();
  try {
    const res = await fetch(API_BASE + '/activity/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audienceId }),
    });
    console.log('[activity] mark today', { audienceId, status: res.status });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    console.warn('markActivityToday failed', e);
    return { ok: false, error: String(e) };
  }
}

export async function ensureMarkedToday() {
  const key = 'activityMarked:' + todayLocalYMD();
  const already = await AsyncStorage.getItem(key);
  if (already === '1') return { ok: true, cached: true };
  const res = await markActivityToday();
  if (res.ok) await AsyncStorage.setItem(key, '1');
  return res;
}

/* ======= ALT SCHEDULE (WEEKEND) ======= */
export async function setAltServerSchedule(hour, minute, daysOfWeek = [5]) {
  const { audienceId } = await getAudienceId();
  try {
    const res = await fetch(`${API_BASE}/schedule/weekend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audienceId, hour, minute, daysOfWeek }),
    });
    const data = await safeJson(res);
    console.log('[schedule] set ALT time', { audienceId, hour, minute, daysOfWeek, status: res.status });
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.log('setAltServerSchedule error:', e);
    return { ok: false, error: String(e) };
  }
}

/* ======= FORCE RE-REGISTER + RESCHEDULE ======= */
export async function forceReRegisterAndReschedule() {
  try {
    // ВАЖНО: НЕ удаляем iap:deviceUserId — это наша стабильная аудитория.
    await AsyncStorage.multiRemove([
      'userId', // legacy only
      'expoPushToken',
      'notificationScheduled',
      'notificationAltScheduled',
      'activityMarked:' + todayLocalYMD(),
    ]);

    const lang = (await AsyncStorage.getItem('language')) || 'english';
    const reg = await registerDeviceOnServer(lang);
    console.log('[reReg] result:', reg);

    await setServerSchedule(19, 45, null);
    await setAltServerSchedule(10, 45, [5]);

    console.log('[reReg] done');
    return true;
  } catch (e) {
    console.log('[reReg] failed:', e);
    return false;
  }
}
