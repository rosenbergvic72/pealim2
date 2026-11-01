// src/iap/trialDeviceId.js
// Dedicated identifier for internal trial eligibility; NOT a purchase/user identity.
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';

const IOS_TRIAL_DEVICE_KEY = 'verbify_trial_device_id_v2';

// A random, durable grouping identifier (not an authentication credential).
function createRandomId() {
  const random = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, '0')
  ).join('');
  return `v2-${Date.now().toString(36)}-${random}`;
}

export async function getTrialDeviceId() {
  if (Platform.OS === 'android') {
    // Stable across ordinary reinstall/clear-data, scoped to device + user + signing key.
    try {
      const androidId = Application.getAndroidId();
      if (androidId && /^[0-9a-f]+$/i.test(androidId)) {
        return `android:${androidId.toLowerCase()}`;
      }
    } catch (e) {
      console.warn('[TRIAL] Android ID unavailable:', e?.message || String(e));
    }
    return null; // Never generate a fresh trial identity on failure.
  }

  if (Platform.OS === 'ios') {
    try {
      let id = await SecureStore.getItemAsync(IOS_TRIAL_DEVICE_KEY);
      if (!id) {
        id = createRandomId();
        await SecureStore.setItemAsync(IOS_TRIAL_DEVICE_KEY, id, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        });
      }
      return `ios:${id}`;
    } catch (e) {
      console.warn('[TRIAL] iOS Keychain unavailable:', e?.message || String(e));
      return null;
    }
  }
  return null;
}
