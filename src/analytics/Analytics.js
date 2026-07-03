import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FirebaseAnalytics from './FirebaseAnalytics';
import * as FacebookAnalytics from './FacebookAnalytics';

const LOGGED_TRIAL_STARTED_KEY = 'analytics_trial_started_logged_v1';

function trialDayKey(day, userId) {
  return `analytics_trial_day_${userId || 'anon'}_${day}_logged_v1`;
}

function trialExpiredKey(userId) {
  return `analytics_trial_expired_${userId || 'anon'}_logged_v1`;
}

export async function logTrialStarted(params = {}) {
  try {
    const alreadyLogged = await AsyncStorage.getItem(LOGGED_TRIAL_STARTED_KEY);

    if (alreadyLogged === 'true') return;

    await AsyncStorage.setItem(LOGGED_TRIAL_STARTED_KEY, 'true');

    await FirebaseAnalytics.logTrialStarted(params);
    FacebookAnalytics.logTrialStarted(params);
  } catch (e) {
    console.log('[Analytics] logTrialStarted error:', e?.message || e);
  }
}

export async function logTrialDay(day, params = {}) {
  try {
    const normalizedDay = Number(day);

    if (!Number.isFinite(normalizedDay)) return;

    const key = trialDayKey(normalizedDay, params.user_id);
    const alreadyLogged = await AsyncStorage.getItem(key);

    if (alreadyLogged === 'true') return;

    await AsyncStorage.setItem(key, 'true');

    await FirebaseAnalytics.logTrialDay(normalizedDay, params);
    FacebookAnalytics.logTrialDay(normalizedDay, params);
  } catch (e) {
    console.log('[Analytics] logTrialDay error:', e?.message || e);
  }
}

export async function logTrialExpired(params = {}) {
  try {
    const key = trialExpiredKey(params.user_id);
    const alreadyLogged = await AsyncStorage.getItem(key);

    if (alreadyLogged === 'true') return;

    await AsyncStorage.setItem(key, 'true');

    await FirebaseAnalytics.logTrialExpired(params);
  } catch (e) {
    console.log('[Analytics] logTrialExpired error:', e?.message || e);
  }
}

export async function logCompletedRegistration(params = {}) {
  try {
    await FirebaseAnalytics.logFirebaseEvent('completed_registration', params);
  } catch (e) {
    console.log('[Analytics] Firebase completed_registration error:', e?.message || e);
  }

  try {
    FacebookAnalytics.logCompletedRegistration(params);
  } catch (e) {
    console.log('[Analytics] Facebook completed_registration error:', e?.message || e);
  }
}

export async function logPaywallOpened(source = 'unknown', params = {}) {
  try {
    await FirebaseAnalytics.logPaywallOpened(source, params);
  } catch (e) {
    console.log('[Analytics] Firebase paywall_opened error:', e?.message || e);
  }

  try {
    FacebookAnalytics.logPaywallOpened(source, params);
  } catch (e) {
    console.log('[Analytics] Facebook paywall_opened error:', e?.message || e);
  }
}

export async function logSubscribeClicked(plan = 'unknown', params = {}) {
  try {
    await FirebaseAnalytics.logSubscribeClicked(plan, params);
  } catch (e) {
    console.log('[Analytics] Firebase subscribe_clicked error:', e?.message || e);
  }

  try {
    FacebookAnalytics.logSubscribeClicked(plan, params);
  } catch (e) {
    console.log('[Analytics] Facebook subscribe_clicked error:', e?.message || e);
  }
}

export async function logPurchaseSuccess(params = {}) {
  try {
    await FirebaseAnalytics.logPurchaseSuccess(params);
  } catch (e) {
    console.log('[Analytics] Firebase purchase_success error:', e?.message || e);
  }

  try {
    FacebookAnalytics.logPurchaseSuccess(params);
  } catch (e) {
    console.log('[Analytics] Facebook purchase_success error:', e?.message || e);
  }
}

export async function logExerciseStarted(exerciseId, params = {}) {
  try {
    await FirebaseAnalytics.logExerciseStarted(exerciseId, params);
  } catch (e) {
    console.log('[Analytics] logExerciseStarted error:', e?.message || e);
  }
}

export async function logExerciseCompleted(exerciseId, params = {}) {
  try {
    await FirebaseAnalytics.logExerciseCompleted(exerciseId, params);
  } catch (e) {
    console.log('[Analytics] logExerciseCompleted error:', e?.message || e);
  }
}