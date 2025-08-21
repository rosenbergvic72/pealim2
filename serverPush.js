// serverPush.js
import * as Notifications from 'expo-notifications';
import { Platform, PermissionsAndroid } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ======= НАСТРОЙКИ СЕРВЕРА =======
const API_BASE = 'https://pealim-server.onrender.com';
const REGISTER_PATH = '/registerDevice';
const SCHEDULE_PATH = '/schedule';       // POST
const CLEAR_PATH = '/clearSchedule';     // POST

// ======= ВСПОМОГАТЕЛЬНОЕ =======
async function getUserId() {
  let id = await AsyncStorage.getItem('userId');
  if (!id) {
    id = `u_${Platform.OS}_${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem('userId', id);
  }
  return id;
}

async function ensureAndroidPermission() {
  if (Platform.OS !== 'android') return true;
  try {
    const res = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return res === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}

// ======= ТОКЕН EXPO PUSH =======
export async function getExpoPushTokenAsync() {
  // В Expo Go (SDK 53+) удалённых пушей нет
  if (Constants.appOwnership === 'expo') {
    console.log('Expo Go: remote push недоступен. Используй Development Build (expo-dev-client).');
    return null;
  }

  // Разрешения
  if (Platform.OS === 'ios') {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;
  } else {
    const ok = await ensureAndroidPermission();
    if (!ok) return null;
  }

  // Получение токена
  // При желании можно указать projectId:
  // const { data } = await Notifications.getExpoPushTokenAsync({ projectId: Constants?.expoConfig?.extra?.eas?.projectId });
  const { data } = await Notifications.getExpoPushTokenAsync();

  await AsyncStorage.setItem('expoPushToken', data);
  return data;
}

// ======= РЕГИСТРАЦИЯ ДЕВАЙСА НА СЕРВЕРЕ =======
export async function registerDeviceOnServer(language = 'english') {
  const cached = await AsyncStorage.getItem('expoPushToken');
  const token = cached || (await getExpoPushTokenAsync());
  if (!token) return { ok: false, error: 'no_expo_token' };

  const userId = await getUserId();

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const utcOffsetMin = -new Date().getTimezoneOffset(); // положительный для восточных TZ

  const payload = {
    userId,
    expoPushToken: token,
    language,
    tz,
    utcOffsetMin,
    appVersion: Constants?.expoConfig?.version || 'unknown',
  };

  try {
    const res = await fetch(API_BASE + REGISTER_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.log('registerDeviceOnServer error:', e);
    return { ok: false, error: String(e) };
  }
}

// ======= УСТАНОВКА РАСПИСАНИЯ =======
// daysOfWeek: null или массив чисел 0..6 (0=вс). Например, будни: [1,2,3,4,5]
export async function setServerSchedule(hour = 9, minute = 0, daysOfWeek = null) {
  const userId = await getUserId();
  // гарантируем, что токен получен
  const token = await AsyncStorage.getItem('expoPushToken');
  if (!token) {
    const t = await getExpoPushTokenAsync();
    if (!t) return { ok: false, error: 'no_expo_token' };
  }

  const body = { userId, hour, minute };
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
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.log('setServerSchedule error:', e);
    return { ok: false, error: String(e) };
  }
}

// ======= ОЧИСТКА РАСПИСАНИЯ =======
export async function clearServerSchedule() {
  const userId = await getUserId();
  try {
    const res = await fetch(API_BASE + CLEAR_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await safeJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.log('clearServerSchedule error:', e);
    return { ok: false, error: String(e) };
  }
}
