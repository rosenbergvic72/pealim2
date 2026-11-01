import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useIap } from './src/iap/IapProvider';
import * as Analytics from './src/analytics/Analytics';
import { Platform } from 'react-native';
import { getTrialDeviceId } from './src/iap/trialDeviceId';

const FIRST_LAUNCH_KEY = 'verbify_first_launch_completed';
const LANGUAGE_KEY = 'language';
const INTERNAL_TRIAL_KEY = 'verbify_internal_trial_v1';

/*
  ================================
  SERVER TRIAL SWITCH
  ================================

  true  = использовать сервер /trial/start
  false = старая локальная схема без сервера
*/
const USE_SERVER_INTERNAL_TRIAL = true;

const VERIFY_BASE_URL =
  Constants?.expoConfig?.extra?.IAP_VERIFY_BASE_URL ||
  process.env.EXPO_PUBLIC_IAP_VERIFY_BASE_URL ||
  process.env.IAP_VERIFY_BASE_URL ||
  '';

const API_KEY_HEADER =
  Constants?.expoConfig?.extra?.IAP_API_KEY ||
  process.env.EXPO_PUBLIC_IAP_API_KEY ||
  '';

const TRIAL_START_URL = VERIFY_BASE_URL
  ? `${VERIFY_BASE_URL}/trial/start`
  : '';

const INTERNAL_TRIAL_TEST_MODE = false;
const INTERNAL_TRIAL_DAYS = INTERNAL_TRIAL_TEST_MODE ? 0.01 : 3;

// Только для теста. В боевом релизе ОБЯЗАТЕЛЬНО false.
const RESET_INTERNAL_TRIAL_ON_START = false;

function normalizeLanguage(value) {
  return String(value || '').trim().toLowerCase();
}

function getRoutesForLanguage(languageValue) {
  const normalized = normalizeLanguage(languageValue);

  switch (normalized) {
    case 'english':
    case 'en':
      return { welcome: 'WelcomeEn', menu: 'MenuEn' };
    case 'русский':
    case 'russian':
    case 'ru':
      return { welcome: 'Welcome', menu: 'Menu' };
    case 'français':
    case 'french':
    case 'fr':
      return { welcome: 'WelcomeFr', menu: 'MenuFr' };
    case 'español':
    case 'spanish':
    case 'es':
      return { welcome: 'WelcomeEs', menu: 'MenuEs' };
    case 'português':
    case 'portuguese':
    case 'pt':
      return { welcome: 'WelcomePt', menu: 'MenuPt' };
    case 'العربية':
    case 'arabic':
    case 'ar':
    case 'arab':
      return { welcome: 'WelcomeAr', menu: 'MenuAr' };
    case 'አማርኛ':
    case 'amharic':
    case 'am':
      return { welcome: 'WelcomeAm', menu: 'MenuAm' };
    default:
      console.log('[StartupGate] Unknown language:', languageValue);
      return { welcome: 'WelcomeEn', menu: 'MenuEn' };
  }
}

function calcLocalTrialEndsAt(now) {
  if (INTERNAL_TRIAL_TEST_MODE) {
    return now + INTERNAL_TRIAL_DAYS * 24 * 60 * 60 * 1000;
  }

  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + INTERNAL_TRIAL_DAYS);
  endDate.setHours(23, 59, 59, 999);
  return endDate.getTime();
}

async function requestServerTrial(userId, deviceId, legacyTrial) {
  if (!TRIAL_START_URL) return { ok: false, error: 'trial_url_missing' };
  if (!userId || !deviceId) return { ok: false, error: 'trial_identity_unavailable' };

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 6500);
  try {
    const resp = await fetch(TRIAL_START_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(API_KEY_HEADER ? { 'x-api-key': API_KEY_HEADER } : {}),
      },
      body: JSON.stringify({
        userId: String(userId),
        deviceId,
        platform: Platform.OS,
        utcOffsetMinutes: new Date().getTimezoneOffset(),
        ...(legacyTrial ? { legacyTrial } : {}),
      }),
      signal: ctrl.signal,
    });
    const raw = await resp.text();
    let json = null;
    try { json = JSON.parse(raw); } catch (_) {}
    if (!resp.ok) {
      return { ok: false, status: resp.status, error: json?.error || 'server_error' };
    }
    return json || { ok: false, error: 'bad_json' };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  } finally {
    clearTimeout(timeout);
  }
}

function readSavedTrial(raw) {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const startedAt = Number(data?.startedAt);
    const endsAt = Number(data?.endsAt);
    if (!Number.isFinite(startedAt) || !Number.isFinite(endsAt) ||
        startedAt <= 0 || endsAt < startedAt) return null;
    return { ...data, startedAt, endsAt };
  } catch (_) {
    return null;
  }
}

function savedTrialResult(saved) {
  if (!saved) return { active: false, startedAt: null, endsAt: null, justStarted: false };
  return {
    active: Date.now() < saved.endsAt,
    startedAt: saved.startedAt,
    endsAt: saved.endsAt,
    justStarted: false,
  };
}

async function checkInternalTrial(userId) {
  try {
    if (RESET_INTERNAL_TRIAL_ON_START) {
      await AsyncStorage.removeItem(INTERNAL_TRIAL_KEY);
      console.log('[INTERNAL_TRIAL][TEST] reset on start');
    }

    const saved = readSavedTrial(await AsyncStorage.getItem(INTERNAL_TRIAL_KEY));

    if (USE_SERVER_INTERNAL_TRIAL) {
      // Unlike the old implementation, always ask the server, even if local data exists.
      const deviceId = await getTrialDeviceId();
      const legacyTrial = saved && saved.source === 'local' && saved.testMode !== true
        ? { startedAt: saved.startedAt, endsAt: saved.endsAt, source: 'local' }
        : null;
      const server = await requestServerTrial(userId, deviceId, legacyTrial);

      if (server?.ok && typeof server.active === 'boolean') {
        const startedAt = Date.parse(server.startedAt || '');
        const endsAt = Date.parse(server.endsAt || '');
        if (Number.isFinite(startedAt) && Number.isFinite(endsAt)) {
          const trialData = {
            startedAt,
            endsAt,
            used: true,
            source: 'server',
            alreadyUsed: !!server.alreadyUsed,
            testMode: false,
          };
          await AsyncStorage.setItem(INTERNAL_TRIAL_KEY, JSON.stringify(trialData));
          console.log('[INTERNAL_TRIAL][SERVER]', {
            active: server.active,
            alreadyUsed: server.alreadyUsed,
            migrated: server.migrated === true,
            endsAt,
          });
          return {
            active: server.active && Date.now() < endsAt,
            startedAt,
            endsAt,
            // Do not count a local-to-server migration as a new activation.
            justStarted: !saved && !server.alreadyUsed && server.active,
          };
        }
      }

      // Server unavailable / identity failed: never mint a new local trial.
      // Respect previously saved expiry (offline support for existing users).
      console.warn('[INTERNAL_TRIAL] server unavailable:', server?.error || 'invalid_response');
      return savedTrialResult(saved);
    }

    // Explicit opt-out for local developer testing only; not for production releases.
    if (saved) return savedTrialResult(saved);
    const startedAt = Date.now();
    const endsAt = calcLocalTrialEndsAt(startedAt);
    await AsyncStorage.setItem(INTERNAL_TRIAL_KEY, JSON.stringify({
      startedAt, endsAt, used: true, source: 'local', testMode: INTERNAL_TRIAL_TEST_MODE,
    }));
    return { active: true, startedAt, endsAt, justStarted: true };
  } catch (e) {
    console.log('[INTERNAL_TRIAL] error:', e?.message || String(e));
    return { active: false, startedAt: null, endsAt: null, justStarted: false };
  }
}

export default function StartupGate() {
  const navigation = useNavigation();
  const hasNavigatedRef = useRef(false);

  const {
    ready,
    accessState,
    hasPro,
    userId,
  } = useIap();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!ready) return;
      if (accessState === 'checking') return;
      if (hasNavigatedRef.current) return;

      try {
        const [savedLanguage, firstLaunchCompleted] = await Promise.all([
          AsyncStorage.getItem(LANGUAGE_KEY),
          AsyncStorage.getItem(FIRST_LAUNCH_KEY),
        ]);

        const internalTrial = hasPro
          ? {
              active: false,
              startedAt: null,
              endsAt: null,
              justStarted: false,
            }
          : await checkInternalTrial(userId);

          if (
  !hasPro &&
  internalTrial.justStarted &&
  internalTrial.active
) {
  await Analytics.logTrialStarted({
    user_id: userId,
    started_at: internalTrial.startedAt,
    ends_at: internalTrial.endsAt,
    source: 'startup_gate',
  });
}

        console.log('[StartupGate] savedLanguage =', savedLanguage);
        console.log('[StartupGate] firstLaunchCompleted =', firstLaunchCompleted);
        console.log('[StartupGate] userId =', userId);
        console.log(
          '[StartupGate] ready =',
          ready,
          'accessState =',
          accessState,
          'hasPro =',
          hasPro
        );
        console.log('[StartupGate] internalTrial =', internalTrial);

        if (cancelled || hasNavigatedRef.current) return;

        hasNavigatedRef.current = true;

        if (!savedLanguage) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'LanguageSelectionPage' }],
            })
          );
          return;
        }

        const routes = getRoutesForLanguage(savedLanguage);

        const trialParams = {
          internalTrialActive: !hasPro && internalTrial.active,
          internalTrialEndsAt: internalTrial.endsAt,
          internalTrialJustStarted: internalTrial.justStarted,
        };

        if (!firstLaunchCompleted) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: routes.welcome,
                  params: {
                    language: savedLanguage,
                    ...trialParams,
                  },
                },
              ],
            })
          );
          return;
        }

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: routes.menu,
                params: trialParams,
              },
            ],
          })
        );
      } catch (error) {
        console.log('[StartupGate] error:', error?.message || error);

        if (cancelled || hasNavigatedRef.current) return;

        hasNavigatedRef.current = true;

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'LanguageSelectionPage' }],
          })
        );
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    navigation,
    ready,
    accessState,
    hasPro,
    userId,
  ]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2D4769" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});