import { Platform } from 'react-native';
import { AppEventsLogger } from 'react-native-fbsdk-next';

function cleanParams(params = {}) {
  const result = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  });

  return result;
}

function logFacebookEvent(name, params = {}) {
  try {
    AppEventsLogger.logEvent(
      name,
      cleanParams({
        platform: Platform.OS,
        ...params,
      })
    );
  } catch (e) {
    console.log('[FacebookAnalytics] error:', name, e?.message || e);
  }
}

export function logCompletedRegistration(params = {}) {
  logFacebookEvent('CompletedRegistration', params);
}

export function logTrialStarted(params = {}) {
  logFacebookEvent('StartTrial', params);
}

export function logTrialDay(day, params = {}) {
  logFacebookEvent('TrialDay', {
    day,
    ...params,
  });
}

export function logPaywallOpened(source = 'unknown', params = {}) {
  logFacebookEvent('InitiateCheckout', {
    source,
    ...params,
  });
}

export function logSubscribeClicked(plan = 'unknown', params = {}) {
  logFacebookEvent('Subscribe', {
    plan,
    source: 'subscribe_button',
    ...params,
  });
}

export function logPurchaseSuccess(params = {}) {
  const value = Number(params.value || params.price || 0);
  const currency = String(params.currency || 'ILS');

  try {
    AppEventsLogger.logPurchase(
      Number.isFinite(value) ? value : 0,
      currency,
      cleanParams({
        platform: Platform.OS,
        ...params,
      })
    );
  } catch (e) {
    console.log('[FacebookAnalytics] purchase error:', e?.message || e);
  }
}