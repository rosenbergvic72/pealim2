// src/paywall/trial.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIAL_TS_KEY = 'trialStartTs';
const TRIAL_DAYS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function startTrialIfNeeded(force = false) {
  const existing = await AsyncStorage.getItem(TRIAL_TS_KEY);
  if (existing && !force) return Number(existing);
  const now = Date.now();
  await AsyncStorage.setItem(TRIAL_TS_KEY, String(now));
  return now;
}

export async function getTrialState() {
  const tsStr = await AsyncStorage.getItem(TRIAL_TS_KEY);
  if (!tsStr) return { ts: null, endAt: null, daysLeft: 0, isActive: false };
  const ts = Number(tsStr);
  const endAt = ts + TRIAL_DAYS * DAY_MS;
  const now = Date.now();
  const msLeft = Math.max(0, endAt - now);
  const daysLeft = Math.ceil(msLeft / DAY_MS);
  const isActive = now < endAt;
  return { ts, endAt, daysLeft, isActive };
}

export async function isTrialActive() {
  const { isActive } = await getTrialState();
  return isActive;
}
