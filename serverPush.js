// serverPush.js
import * as Notifications from 'expo-notifications';
import { Platform, PermissionsAndroid } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// === Настройки ===
const API_BASE = 'https://<твое-имя-сервиса>.onrender.com'; // ← твой Render URL
const REGISTER_PATH = '/registerDevice';
const SCHEDULE_PATH = '/schedule';
const DELETE_PATH = '/schedule'; // DELETE /schedule/:userId

// — необязательно, но удобно, если у тебя есть внутренний userId:
async function getUserId() {
  let id = await AsyncStorage.getItem('userId');
  if (!id) {
    id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await AsyncStorage.setItem('userId', id);
  }
  return id;
}

// Android 13+ POST_NOTIFICATIONS
async function ensureAndroidPermission() {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

// Получение Expo push token
export async function getExpoPushTokenAsync() {
  // iOS: спросим разрешение через expo-notifications
  if (Platform.OS === 'ios') {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;
  } else {
    const ok = await ensureAndroidPermission();
    if (!ok) return null;
  }

  // Для bare/dev клиентов нужен projectId; в Managed достаточно:
  const tokenResp = await Notifications.getExpoPushTokenAsync();
  const token = tokenResp.data;
  await AsyncStorage.setItem('expoPushToken', token);
  return token;
}

// Регистрация девайса на сервере
export async function registerDeviceOnServer(language = 'english') {
  const token = (await AsyncStorage.getItem('expoPushToken')) || (await getExpoPushTokenAsync());
  if (!token) return { ok: false, error: 'No token' };

  const userId = await getUserId();

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const utcOffsetMin = -new Date().getTimezoneOffset(); // например, +180 для Израиля летом

  const payload = {
    userId,
    expoPushToken: token,
    language,
    tz,
    utcOffsetMin,
    appVersion: Constants.expoConfig?.version || 'unknown',
  };

  const res = await fetch(API_BASE + REGISTER_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return { ok: res.ok, status: res.status, data: await safeJson(res) };
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}

// Создание/обновление расписания на сервере
// daysOfWeek: массив номеров 0..6 (вс),1..6 — или передай null для «каждый день»
export async function setServerSchedule(hour = 9, minute = 0, daysOfWeek = null) {
  const userId = await getUserId();
  const token = await AsyncStorage.getItem('expoPushToken');
  if (!token) await getExpoPushTokenAsync();

  const res = await fetch(API_BASE + SCHEDULE_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      hour,
      minute,
      daysOfWeek, // например [1,2,3,4,5] — будни
    }),
  });
  return { ok: res.ok, status: res.status, data: await safeJson(res) };
}

// Удаление расписания
export async function clearServerSchedule() {
  const userId = await getUserId();
  const res = await fetch(`${API_BASE + DELETE_PATH}/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  return { ok: res.ok, status: res.status, data: await safeJson(res) };
}
