import { Platform } from 'react-native';
import analytics from '@react-native-firebase/analytics';

function cleanParams(params = {}) {
  const result = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  });

  return result;
}

export async function logFirebaseEvent(name, params = {}) {
  try {
    await analytics().logEvent(
      name,
      cleanParams({
        platform: Platform.OS,
        ...params,
      })
    );
  } catch (e) {
    console.log('[FirebaseAnalytics] error:', name, e?.message || e);
  }
}

export function logTrialStarted(params = {}) {
  return logFirebaseEvent('trial_started', params);
}

export function logTrialDay(day, params = {}) {
  return logFirebaseEvent('trial_day', {
    day,
    ...params,
  });
}

export function logTrialExpired(params = {}) {
  return logFirebaseEvent('trial_expired', params);
}

export function logPaywallOpened(source = 'unknown', params = {}) {
  return logFirebaseEvent('paywall_opened', {
    source,
    ...params,
  });
}

export function logSubscribeClicked(plan = 'unknown', params = {}) {
  return logFirebaseEvent('subscribe_clicked', {
    plan,
    ...params,
  });
}

export function logPurchaseSuccess(params = {}) {
  return logFirebaseEvent('purchase_success', params);
}

export function logExerciseStarted(exerciseId, params = {}) {
  return logFirebaseEvent('exercise_started', {
    exercise_id: String(exerciseId),
    ...params,
  });
}

export function logExerciseCompleted(exerciseId, params = {}) {
  return logFirebaseEvent('exercise_completed', {
    exercise_id: String(exerciseId),
    ...params,
  });
}