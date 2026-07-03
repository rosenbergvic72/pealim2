// src/iap/IapProvider.js
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as RNIap from 'react-native-iap';
import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Analytics from '../analytics/Analytics';
import * as FirebaseAnalytics from '../analytics/FirebaseAnalytics';

const isSimulator = !Device.isDevice;

/* ===================== SKU / ENV ===================== */
const SKU_MONTHLY = Platform.select({
  android: 'monthly_ils_10',
  ios: 'monthly_ils_10',
});

const SKU_ANNUAL = Platform.select({
  android: 'monthly_ils_10',
  ios: 'annual_ils_80',
});

// Android still uses one subscription product with offers
const SKU = SKU_MONTHLY;

const VERIFY_BASE_URL =
  Constants?.expoConfig?.extra?.IAP_VERIFY_BASE_URL ||
  process.env.EXPO_PUBLIC_IAP_VERIFY_BASE_URL ||
  process.env.IAP_VERIFY_BASE_URL ||
  '';

const ENTITLEMENTS_URL =
  Constants?.expoConfig?.extra?.IAP_ENTITLEMENTS_URL ||
  process.env.EXPO_PUBLIC_IAP_ENTITLEMENTS_URL ||
  process.env.IAP_ENTITLEMENTS_URL ||
  (VERIFY_BASE_URL ? `${VERIFY_BASE_URL}/entitlements` : '');

 const ACCESS_PING_URL =
  Constants?.expoConfig?.extra?.IAP_ACCESS_PING_URL ||
  process.env.EXPO_PUBLIC_IAP_ACCESS_PING_URL ||
  process.env.IAP_ACCESS_PING_URL ||
  (VERIFY_BASE_URL ? `${VERIFY_BASE_URL}/access/ping` : '');

const IAP_VERIFY_TIMEOUT_MS = Number(
  process.env.EXPO_PUBLIC_IAP_VERIFY_TIMEOUT_MS || 5000
);

const CODE_ENTITLE_TIMEOUT_MS = 6000;

const RESTORE_ON_LAUNCH =
  String(process.env.EXPO_PUBLIC_IAP_RESTORE_ON_LAUNCH || '1') === '1';

const PKG =
  Constants?.expoConfig?.android?.package ||
  Constants?.manifest?.android?.package ||
  'com.rosenbergvictor72.pealim2';

const API_KEY_HEADER =
  Constants?.expoConfig?.extra?.IAP_API_KEY ||
  process.env.EXPO_PUBLIC_IAP_API_KEY ||
  '';

/* ===================== Storage keys ===================== */
const LAST_TOKEN_KEY = 'iap:lastPurchaseToken';
const LAST_PRODUCT_ID_KEY = 'iap:lastProductId';

const PROMO_ACTIVE_KEY = 'iap:promoActive';

const LAST_PURCHASE_AT_KEY = 'iap:lastPurchaseAt';
const POST_SHOWN_AT_KEY = 'iap:postShownAt';
const POST_STATE_KEY = 'iap:postState'; // none | pending | shown

const CODE_ACCESS_UNTIL_KEY = 'iap:codeAccessUntil';
const CODE_LAST_SYNC_AT_KEY = 'iap:codeEntSyncAt';

const IAP_LAST_VERIFY_JSON = 'iap:lastVerifyJson';
const IAP_LAST_VERIFY_AT = 'iap:lastVerifyAt';
const IAP_LAST_EXPIRES_AT = 'iap:lastExpiresAt';
const IAP_LAST_PRO = 'iap:lastPro';
const IAP_LAST_GOOD_PRO_AT = 'iap:lastGoodProAt';

const DEVICE_USER_ID_KEY = 'iap:deviceUserId';
const TRIAL_EVER_USED_KEY = 'iap:trialEverUsed';

/* ===================== Dev flags ===================== */
const devSessionAllowed =
  __DEV__ ||
  String(
    Constants?.expoConfig?.extra?.devUnlockAll ??
      process.env.EXPO_PUBLIC_DEV_UNLOCK_ALL ??
      '0'
  ) === '1';

const OPT_DEV_PRO =
  __DEV__ || String(process.env.EXPO_PUBLIC_PRO_BYPASS || '0') === '1';

/* ===================== Promo segments ===================== */
const PROMO_SEGMENT_BY_CODE = {
  ULPAN2025: 'ulpan',
  NATIV2025: 'nativ',
  PARTNER40: 'partner',
  PROMO30: 'promo',
  TEST90: 'test',
  TIKVA30: 'tikva',
  AUSLENDER30: 'auslender',
  GOLOSISRAEL30: 'golosisrael',
  VERB30: 'verb',
};

/* ===================== Context ===================== */
const IapContext = createContext({
  ready: false,
  available: true,
  hasPro: false,
  accessState: 'checking',
  userId: null,
  trialEverUsed: false,

  justPurchased: false,
  consumeJustPurchased: () => {},

  shouldShowPost: false,
  markPostShown: async () => {},

  promoActive: false,
  setSegment: () => {},
  applyPromoCode: async () => false,

  buyMonthly: async () => {},
  buyAnnual: async () => {},
  openRedeem: async () => {},
  applyCodeEntitlementLocal: async () => ({ ok: false }),
  restore: async () => false,

  probePostPurchase: async () => false,

  __devGrantPro: async () => {},
  __devRevokePro: async () => {},

  codeAccessUntil: null,

  displayPrices: {
    baseMonthly: undefined,
    baseAnnual: undefined,
    promoMonthly: undefined,
    promoAnnual: undefined,
  },

  _debug: {},
});

export const useIap = () => useContext(IapContext);

/* ===================== Helpers ===================== */
function formatPriceFallback(micros, currency) {
  const n = Number(micros);
  if (!Number.isFinite(n) || n <= 0) return undefined;

  const amount = n / 1_000_000;

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency || ''}`.trim();
  }
}

function iosPriceOf(prod) {
  if (!prod) return undefined;

  if (prod?.localizedPrice) return prod.localizedPrice;

  const price = prod?.price;
  const currency = prod?.currency || prod?.currencyCode;

  if (price && currency) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
      }).format(Number(price));
    } catch {
      return `${price} ${currency}`.trim();
    }
  }

  return undefined;
}

function getPhases(offer) {
  return offer?.pricingPhases?.pricingPhaseList || [];
}

function firstPaidPhase(offer) {
  const phases = getPhases(offer);
  const paid = phases.find((p) => Number(p?.priceAmountMicros ?? 0) > 0);

  if (!paid) return { phase: null, formatted: undefined };

  const formatted =
    paid.formattedPrice ||
    formatPriceFallback(paid.priceAmountMicros, paid.priceCurrencyCode);

  return { phase: paid, formatted };
}

function hasMonthlyPeriod(offer) {
  const phases = getPhases(offer);
  const last = phases[phases.length - 1];
  const bp = last?.billingPeriod || '';
  return bp.includes('P1M') || phases.some((p) => p.billingPeriod?.includes('P1M'));
}

function hasAnnualPeriod(offer) {
  const phases = getPhases(offer);
  const last = phases[phases.length - 1];
  const bp = last?.billingPeriod || '';
  return bp.includes('P1Y') || phases.some((p) => p.billingPeriod?.includes('P1Y'));
}

function hasFreeTrial(offer) {
  return getPhases(offer).some((p) => Number(p?.priceAmountMicros ?? 0) === 0);
}

function priceMicrosOf(offer) {
  const { phase } = firstPaidPhase(offer);
  const m = Number(phase?.priceAmountMicros ?? 0);
  return Number.isFinite(m) ? m : 0;
}

function pickByPeriod(product, kind) {
  const offers = product?.subscriptionOfferDetails || [];
  const fits = kind === 'monthly' ? hasMonthlyPeriod : hasAnnualPeriod;
  return offers.filter(fits);
}

function pickPreferredBaseOffer(product, kind, preferNoTrial = false) {
  const periodOffers = pickByPeriod(product, kind);
  if (!periodOffers.length) return null;

  const isTrialById = (o) =>
    String(o.offerId || '').toLowerCase().includes('trial') ||
    String(o.basePlanId || '').toLowerCase().includes('trial');

  if (preferNoTrial) {
    const nonTrial = periodOffers
      .filter((o) => !hasFreeTrial(o) && !isTrialById(o))
      .sort((a, b) => priceMicrosOf(a) - priceMicrosOf(b))[0];

    if (nonTrial) return nonTrial;
  }

  const withTrial = periodOffers.find((o) => isTrialById(o) || hasFreeTrial(o));
  if (withTrial && !preferNoTrial) return withTrial;

  return periodOffers.sort((a, b) => priceMicrosOf(a) - priceMicrosOf(b))[0] || null;
}

function requiredTagsForSegment(segment, cadence) {
  if (!segment || segment === 'default' || segment === 'basic') {
    return null;
  }

  return [segment, 'notrial', cadence];
}

function findSegmentOffer(product, requiredTags, kind) {
  if (!requiredTags?.length) return null;
  const periodOffers = pickByPeriod(product, kind);
  return (
    periodOffers.find((o) =>
      requiredTags.every((t) => (o.offerTags || []).includes(t))
    ) || null
  );
}

async function getSubsSafe() {
  try {
    const skus = Platform.OS === 'ios' ? [SKU_MONTHLY, SKU_ANNUAL] : [SKU];
    return await RNIap.getSubscriptions({ skus });
  } catch (e) {
    console.log('[IAP] getSubscriptions error', e?.message || String(e));
    return [];
  }
}

async function getUserId() {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_USER_ID_KEY);
    if (existing) return existing;

    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

    await AsyncStorage.setItem(DEVICE_USER_ID_KEY, uuid);
    return uuid;
  } catch {
    return `device-${Date.now()}`;
  }
}

function notExpiredBy(expiresAt) {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  if (!Number.isFinite(t)) return false;
  return Date.now() < t;
}

async function saveVerifyCache(json) {
  try {
    const isPro = json?.pro === true;
    const expiresAt = json?.expiresAt ? String(json.expiresAt) : '';

    const pairs = [
      [IAP_LAST_VERIFY_JSON, JSON.stringify(json || {})],
      [IAP_LAST_VERIFY_AT, String(Date.now())],
      [IAP_LAST_EXPIRES_AT, expiresAt],
      [IAP_LAST_PRO, String(isPro)],
    ];

    if (isPro) {
      pairs.push([IAP_LAST_GOOD_PRO_AT, String(Date.now())]);
      await AsyncStorage.multiSet(pairs);
    } else {
      await AsyncStorage.multiSet(pairs);
      await AsyncStorage.removeItem(IAP_LAST_GOOD_PRO_AT);
    }
  } catch {}
}

async function readVerifyCache() {
  try {
    const pairs = await AsyncStorage.multiGet([
      IAP_LAST_VERIFY_JSON,
      IAP_LAST_VERIFY_AT,
      IAP_LAST_EXPIRES_AT,
      IAP_LAST_PRO,
    ]);

    const raw = pairs.find(([k]) => k === IAP_LAST_VERIFY_JSON)?.[1];
    const at = pairs.find(([k]) => k === IAP_LAST_VERIFY_AT)?.[1];
    const exp = pairs.find(([k]) => k === IAP_LAST_EXPIRES_AT)?.[1];
    const pro = pairs.find(([k]) => k === IAP_LAST_PRO)?.[1];

    const json = raw ? JSON.parse(raw) : null;

    return {
      json,
      when: Number(at || 0),
      expiresAt: exp || '',
      lastPro: String(pro || 'false') === 'true',
    };
  } catch {
    return { json: null, when: 0, expiresAt: '', lastPro: false };
  }
}

function extractTokenOrReceipt(purchase) {
  return (
    purchase?.purchaseToken ||
    purchase?.transactionReceipt ||
    purchase?.transactionId ||
    ''
  );
}

async function getIosReceiptSafe(purchase) {
  if (purchase?.transactionReceipt) return purchase.transactionReceipt;

  try {
    const receipt = await RNIap.getReceiptIOS({ forceRefresh: true });
    if (receipt) return receipt;
  } catch (e) {
    console.log('[IAP][iOS] getReceiptIOS failed=', e?.message || String(e));
  }

  return '';
}

function isBoolean(v) {
  return typeof v === 'boolean';
}

function getVerifyUrl() {
  if (!VERIFY_BASE_URL) return '';
  return Platform.OS === 'ios'
    ? `${VERIFY_BASE_URL}/iap/apple/subscription/verify`
    : `${VERIFY_BASE_URL}/iap/google/subscription/verify`;
}

function withTimeout(promise, ms, label = 'timeout') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(label)), ms)
    ),
  ]);
}

/* ===================== Provider ===================== */
export function IapProvider({ children, initialSegment = 'basic' }) {
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(true);
  const [hasPro, setHasPro] = useState(false);
  const [accessState, setAccessState] = useState('checking');
  const [trialEverUsed, setTrialEverUsed] = useState(false);

  const [codeAccessUntil, setCodeAccessUntil] = useState(null);
  const codeAccessUntilRef = useRef(null);
  const codeLoadedRef = useRef(false);

  const [userId, setUserId] = useState(null);

  const [justPurchased, setJustPurchased] = useState(false);
  const [shouldShowPost, setShouldShowPost] = useState(false);

  const [segment, setSegment] = useState(initialSegment);
  const [promoActive, setPromoActive] = useState(false);

  const [displayPrices, setDisplayPrices] = useState({
    baseMonthly: undefined,
    baseAnnual: undefined,
    promoMonthly: undefined,
    promoAnnual: undefined,
  });

  const [debug, setDebug] = useState({
    segment: initialSegment,
    promoActive: false,
    bootstrapSource: null,
    productIdMonthly: SKU_MONTHLY,
    productIdAnnual: SKU_ANNUAL,
  });

  const productRef = useRef(null);
  const productRefAnnual = useRef(null);
  const processed = useRef(new Set());
  const purchasingRef = useRef(false);
  const codeSyncInFlightRef = useRef(false);

  const iapConnectionReadyRef = useRef(false);
const iapConnectionPromiseRef = useRef(null);

const ensureIapConnection = useCallback(async () => {
  if (iapConnectionReadyRef.current) return true;
  if (iapConnectionPromiseRef.current) return iapConnectionPromiseRef.current;

  iapConnectionPromiseRef.current = (async () => {
    try {
      await RNIap.initConnection();

      if (Platform.OS === 'android') {
        try {
          await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
        } catch {}
      }

      iapConnectionReadyRef.current = true;
      return true;
    } catch (e) {
      console.log('[IAP] ensureIapConnection failed=', e?.message || String(e));
      return false;
    } finally {
      iapConnectionPromiseRef.current = null;
    }
  })();

  return iapConnectionPromiseRef.current;
}, []);

  const isIsoActiveNow = useCallback((iso) => {
    if (!iso) return false;
    const t = Date.parse(String(iso));
    if (!Number.isFinite(t)) return false;
    return t > Date.now();
  }, []);

  const syncAccessStateRespectingCode = useCallback(
    (next) => {
      const codeActive = isIsoActiveNow(codeAccessUntilRef.current);
      const finalPro = !!next || codeActive;
      setHasPro(finalPro);
      setAccessState(finalPro ? 'pro' : 'free');
      return finalPro;
    },
    [isIsoActiveNow]
  );

  const saveCodeAccessUntil = useCallback(async (untilOrNull) => {
    const v = untilOrNull ? String(untilOrNull) : null;
    codeAccessUntilRef.current = v;
    setCodeAccessUntil(v);

    try {
      if (v) await AsyncStorage.setItem(CODE_ACCESS_UNTIL_KEY, v);
      else await AsyncStorage.removeItem(CODE_ACCESS_UNTIL_KEY);
    } catch {}
  }, []);

  const applyCodeEntitlementLocal = useCallback(
    async (untilIso) => {
      const until = untilIso ? String(untilIso) : null;

      if (until && isIsoActiveNow(until)) {
        await saveCodeAccessUntil(until);
        syncAccessStateRespectingCode(true);
        setTrialEverUsed(true);
        AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
        return { ok: true, pro: true, accessUntil: until };
      }

      await saveCodeAccessUntil(null);
      syncAccessStateRespectingCode(false);
      return { ok: true, pro: false, accessUntil: null };
    },
    [isIsoActiveNow, saveCodeAccessUntil, syncAccessStateRespectingCode]
  );

  const ensureCodeLoaded = useCallback(async () => {
    if (codeLoadedRef.current) return;

    try {
      const until = await AsyncStorage.getItem(CODE_ACCESS_UNTIL_KEY);
      codeAccessUntilRef.current = until || null;
      setCodeAccessUntil(until || null);
    } catch {
      codeAccessUntilRef.current = null;
      setCodeAccessUntil(null);
    } finally {
      codeLoadedRef.current = true;
    }
  }, []);

  const fetchCodeEntitlement = useCallback(async (uid) => {
    if (!ENTITLEMENTS_URL) return null;

    const userIdStr = String(uid || '').trim();
    if (!userIdStr) return null;

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), CODE_ENTITLE_TIMEOUT_MS);

    try {
      const resp = await fetch(
        `${ENTITLEMENTS_URL}?userId=${encodeURIComponent(userIdStr)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(API_KEY_HEADER ? { 'x-api-key': API_KEY_HEADER } : {}),
          },
          signal: ctrl.signal,
        }
      );

      const text = await resp.text();
      let json = null;

      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (!resp.ok) return { ok: false, status: resp.status, json };
      return json || { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    } finally {
      clearTimeout(to);
    }
  }, []);

  const sendAccessPing = useCallback(async (uid) => {
  if (!ACCESS_PING_URL) return { ok: false, reason: 'no_url' };

  const userIdStr = String(uid || '').trim();
  if (!userIdStr) return { ok: false, reason: 'no_userId' };

  try {
    const resp = await fetch(ACCESS_PING_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(API_KEY_HEADER ? { 'x-api-key': API_KEY_HEADER } : {}),
      },
      body: JSON.stringify({
        userId: userIdStr,
        platform: Platform.OS,
        appVersion:
          Constants?.expoConfig?.version ||
          Constants?.manifest?.version ||
          null,
      }),
    });

    return { ok: resp.ok, status: resp.status };
  } catch (e) {
    console.log('[IAP] access ping failed=', e?.message || String(e));
    return { ok: false, error: e?.message || String(e) };
  }
}, []);

 const syncCodeEntitlementFromServer = useCallback(
  async (uid) => {
    const userIdStr = String(uid || '').trim();
    if (!userIdStr) return { ok: false, reason: 'no_userId' };

    // 🔒 Не допускаем параллельные одновременные запросы
    if (codeSyncInFlightRef.current) {
      return { ok: true, skipped: 'in_flight' };
    }

    codeSyncInFlightRef.current = true;

    try {
      // ⏱ Защита от слишком частых повторов
      try {
        const last = Number((await AsyncStorage.getItem(CODE_LAST_SYNC_AT_KEY)) || 0);
        if (Number.isFinite(last) && Date.now() - last < 15000) {
          return { ok: true, skipped: 'throttled' };
        }
        await AsyncStorage.setItem(CODE_LAST_SYNC_AT_KEY, String(Date.now()));
      } catch {}

      const ent = await fetchCodeEntitlement(userIdStr);
      if (!ent?.ok) return { ok: false, ent };

      if (ent?.pro && ent?.accessUntil) {
        await saveCodeAccessUntil(String(ent.accessUntil));
        syncAccessStateRespectingCode(true);
        return { ok: true, pro: true, accessUntil: String(ent.accessUntil) };
      }

      if (!isIsoActiveNow(codeAccessUntilRef.current)) {
        await saveCodeAccessUntil(null);
      }

      return { ok: true, pro: false, accessUntil: null };
    } finally {
      codeSyncInFlightRef.current = false;
    }
  },
  [fetchCodeEntitlement, isIsoActiveNow, saveCodeAccessUntil, syncAccessStateRespectingCode]
);

  const verifyOnServer = useCallback(async (purchaseTokenOrReceipt, productId) => {
    const url = getVerifyUrl();
    if (!url || !purchaseTokenOrReceipt) return null;

    const uid = await getUserId();

    const payload =
      Platform.OS === 'ios'
        ? {
            userId: uid,
            platform: Platform.OS,
            productId: productId || SKU,
            receipt: purchaseTokenOrReceipt,
          }
        : {
            userId: uid,
            deviceId: uid,
            platform: Platform.OS,
            productId: productId || SKU,
            packageName: PKG,
            purchaseToken: purchaseTokenOrReceipt,
          };

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), IAP_VERIFY_TIMEOUT_MS);

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(API_KEY_HEADER ? { 'x-api-key': API_KEY_HEADER } : {}),
        },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });

      const text = await resp.text();
      let json = null;

      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (!resp.ok) {
        const is5xx = resp.status >= 500 && resp.status <= 599;
        return is5xx ? { offline: true } : null;
      }

      if (json && isBoolean(json.pro)) {
        await saveVerifyCache(json);
        return json;
      }

      return json || null;
    } catch (e) {
      console.log('[IAP] verify network error=', e?.message || String(e));
      return { offline: true };
    } finally {
      clearTimeout(to);
    }
  }, []);

  const resolveVerifyResult = useCallback(async (v) => {
    if (v?.pro === true) return { decided: true, pro: true };
    if (v?.pro === false) return { decided: true, pro: false };
    return { decided: false, pro: null };
  }, []);

  const hasLocalVerifyEntitlement = useCallback(async () => {
    const { json, expiresAt } = await readVerifyCache();
    const effectiveExpiresAt = expiresAt || json?.expiresAt || '';
    return !!(json?.pro === true && effectiveExpiresAt && notExpiredBy(effectiveExpiresAt));
  }, []);

const hasRecentGoodPro = useCallback(async () => {
  try {
    const [lastGoodRaw, expiresAtRaw] = await Promise.all([
      AsyncStorage.getItem(IAP_LAST_GOOD_PRO_AT),
      AsyncStorage.getItem(IAP_LAST_EXPIRES_AT),
    ]);

    const lastGood = Number(lastGoodRaw || 0);
    if (!Number.isFinite(lastGood) || lastGood <= 0) return false;

    if (!expiresAtRaw || !notExpiredBy(expiresAtRaw)) {
      return false;
    }

    const GRACE_MS = 1000 * 60 * 60 * 24 * 7;
    return Date.now() - lastGood < GRACE_MS;
  } catch {
    return false;
  }
}, []);

const getLocalStoreEntitlement = useCallback(async () => {
  try {
    if (Platform.OS === 'ios') {
      const receipt = await getIosReceiptSafe(null);
      if (receipt) {
        return { pro: true, source: 'ios_receipt_local', receipt };
      }
      return { pro: false, source: null };
    }

  // 🔥 Важно для Android: локальные покупки читаем только после initConnection
try {
  await withTimeout(ensureIapConnection(), 4000, 'ensureIapConnection timeout');
} catch (e) {
  console.log('[IAP] local initConnection timeout/fail=', e?.message || String(e));
}

let purchases = [];
try {
  purchases = await withTimeout(
    RNIap.getAvailablePurchases(),
    5000,
    'getAvailablePurchases timeout'
  );
} catch (e) {
  console.log('[IAP] local Android purchases timeout/fail=', e?.message || String(e));
  purchases = [];
}

const relevant = (purchases || []).filter((p) => p.productId === SKU);

 if (relevant.length > 0) {
  const chosen = relevant[0];
  const tokenOrReceipt = extractTokenOrReceipt(chosen);

  if (tokenOrReceipt) {
    try {
      await AsyncStorage.multiSet([
        [LAST_TOKEN_KEY, tokenOrReceipt],
        [LAST_PRODUCT_ID_KEY, String(chosen.productId || '')],
      ]);
    } catch {}

    // 🔥 Очень важно: пытаемся тихо обновить verify-cache
    try {
      await verifyOnServer(tokenOrReceipt, chosen.productId);
    } catch (e) {
      console.log('[IAP] background verify after local purchase failed=', e?.message || String(e));
    }
  }

  return {
    pro: true,
    source: 'android_purchase_local',
    purchase: chosen,
  };
}

    return { pro: false, source: null };
  } catch (e) {
    console.log('[IAP] local store entitlement read failed=', e?.message || String(e));
    return { pro: false, source: null };
  }
}, [ensureIapConnection, verifyOnServer]);

  const resolveOfflineAccess = useCallback(async () => {
  await ensureCodeLoaded();

  if (isIsoActiveNow(codeAccessUntilRef.current)) {
    syncAccessStateRespectingCode(true);
    return { pro: true, source: 'code_local' };
  }

  const localVerify = await hasLocalVerifyEntitlement();
  if (localVerify) {
    syncAccessStateRespectingCode(true);
    return { pro: true, source: 'verify_cache' };
  }

  const recentGoodPro = await hasRecentGoodPro();
  if (recentGoodPro) {
    syncAccessStateRespectingCode(true);
    return { pro: true, source: 'recent_good_pro_grace' };
  }

  syncAccessStateRespectingCode(false);
  return { pro: false, source: null };
}, [
  ensureCodeLoaded,
  hasLocalVerifyEntitlement,
  hasRecentGoodPro,
  isIsoActiveNow,
  syncAccessStateRespectingCode,
]);

  const restoreFromNetwork = useCallback(async () => {
    await ensureCodeLoaded();

    if (isIsoActiveNow(codeAccessUntilRef.current)) {
      syncAccessStateRespectingCode(true);
      return { ok: true, pro: true, source: 'code_local' };
    }

    const uid = userId || (await getUserId());

    if (uid) {
      const codeSync = await syncCodeEntitlementFromServer(uid);
      if (codeSync?.pro && isIsoActiveNow(codeAccessUntilRef.current)) {
        syncAccessStateRespectingCode(true);
        return { ok: true, pro: true, source: 'code_server' };
      }
    }

    if (Platform.OS === 'ios') {
      const receipt = await getIosReceiptSafe(null);
      if (!receipt) return { ok: true, pro: false, source: null };

      try {
        await AsyncStorage.multiSet([
          [LAST_TOKEN_KEY, receipt],
          [LAST_PRODUCT_ID_KEY, 'ios_receipt'],
        ]);
      } catch {}

      let verified = await verifyOnServer(receipt, SKU_ANNUAL);
      let decision = await resolveVerifyResult(verified);

      if (!(decision.decided && decision.pro === true)) {
        verified = await verifyOnServer(receipt, SKU_MONTHLY);
        decision = await resolveVerifyResult(verified);
      }

      if (decision.decided) {
        syncAccessStateRespectingCode(decision.pro === true);
        if (decision.pro === true) {
          setTrialEverUsed(true);
          AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
        }
        return { ok: true, pro: decision.pro === true, source: 'ios_verify' };
      }

      return { ok: false, pro: false, source: null };
    }

try {
  await withTimeout(ensureIapConnection(), 4000, 'ensureIapConnection timeout');
} catch (e) {
  console.log('[IAP] restore initConnection timeout/fail=', e?.message || String(e));
}

let purchases = [];
try {
  purchases = await withTimeout(
    RNIap.getAvailablePurchases(),
    5000,
    'getAvailablePurchases timeout'
  );
} catch (e) {
  console.log('[IAP] restore Android purchases timeout/fail=', e?.message || String(e));
  purchases = [];
}

const relevant = (purchases || []).filter((p) => p.productId === SKU);

    for (const match of relevant) {
      const tokenOrReceipt = extractTokenOrReceipt(match);
      if (!tokenOrReceipt) continue;

      try {
        await AsyncStorage.multiSet([
          [LAST_TOKEN_KEY, tokenOrReceipt],
          [LAST_PRODUCT_ID_KEY, String(match.productId || '')],
        ]);
      } catch {}

      const verified = await verifyOnServer(tokenOrReceipt, match.productId);
      const decision = await resolveVerifyResult(verified);

      if (decision.decided) {
        syncAccessStateRespectingCode(decision.pro === true);
        if (decision.pro === true) {
          setTrialEverUsed(true);
          AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
        }
        return { ok: true, pro: decision.pro === true, source: 'android_verify' };
      }
    }

    return { ok: false, pro: false, source: null };
  }, [
    ensureCodeLoaded,
  ensureIapConnection,
  isIsoActiveNow,
  resolveVerifyResult,
  syncCodeEntitlementFromServer,
  syncAccessStateRespectingCode,
  userId,
  verifyOnServer,
  ]);

  const recalcPrices = useCallback(
    (reason = 'manual') => {
      if (Platform.OS === 'ios') {
        const monthlyProd = productRef.current;
        const annualProd = productRefAnnual.current;

        const baseMonthly = iosPriceOf(monthlyProd);
        const baseAnnual = iosPriceOf(annualProd);

        setDisplayPrices({
          baseMonthly,
          baseAnnual,
          promoMonthly: baseMonthly,
          promoAnnual: baseAnnual,
        });

        setDebug((d) => ({
          ...d,
          recalcReason: reason,
          ios: true,
          displayPrices: {
            baseMonthly,
            baseAnnual,
            promoMonthly: baseMonthly,
            promoAnnual: baseAnnual,
          },
        }));
        return;
      }

      const prod = productRef.current;
      if (!prod?.subscriptionOfferDetails?.length) {
        setDisplayPrices({
          baseMonthly: undefined,
          baseAnnual: undefined,
          promoMonthly: undefined,
          promoAnnual: undefined,
        });
        return;
      }

      const preferNoTrial = true;

      const baseMonthlyOffer = pickPreferredBaseOffer(prod, 'monthly', preferNoTrial);
      const baseAnnualOffer = pickPreferredBaseOffer(prod, 'annual', preferNoTrial);

      const baseMonthly = firstPaidPhase(baseMonthlyOffer)?.formatted;
      const baseAnnual = firstPaidPhase(baseAnnualOffer)?.formatted;

      let promoMonthly = baseMonthly;
      let promoAnnual = baseAnnual;

      if (promoActive) {
        const tagsMonthly = requiredTagsForSegment(segment, 'monthly');
        const tagsAnnual = requiredTagsForSegment(segment, 'annual');

        const offerMonthly = findSegmentOffer(prod, tagsMonthly, 'monthly');
        const offerAnnual = findSegmentOffer(prod, tagsAnnual, 'annual');

        promoMonthly = firstPaidPhase(offerMonthly)?.formatted || baseMonthly;
        promoAnnual = firstPaidPhase(offerAnnual)?.formatted || baseAnnual;
      }

      setDisplayPrices({
        baseMonthly,
        baseAnnual,
        promoMonthly,
        promoAnnual,
      });
    },
    [promoActive, segment]
  );

  const findOfferToken = useCallback(
    (kind) => {
      const prod = productRef.current;
      if (!prod?.subscriptionOfferDetails?.length) return null;

      const preferNoTrial = true;

      if (!promoActive) {
        const basePref = pickPreferredBaseOffer(prod, kind, preferNoTrial);
        return basePref?.offerToken || null;
      }

      const required = requiredTagsForSegment(segment, kind);
      const segOffer = findSegmentOffer(prod, required, kind);
      if (segOffer?.offerToken) return segOffer.offerToken;

      const fallback = pickPreferredBaseOffer(prod, kind, preferNoTrial);
      return fallback?.offerToken || null;
    },
    [promoActive, segment]
  );

const requestBuy = useCallback(
  async (kind) => {
    try {
      const selectedSku =
        Platform.OS === 'ios'
          ? kind === 'annual'
            ? SKU_ANNUAL
            : SKU_MONTHLY
          : SKU;

      const baseParams = {
        sku: selectedSku,
        andDangerouslyFinishTransactionAutomatically: false,
      };

      if (Platform.OS === 'ios') {
        const targetProd =
          kind === 'annual' ? productRefAnnual.current : productRef.current;

        if (!targetProd) {
          console.log('[IAP] product not loaded', kind);
          return;
        }

        await Analytics.logSubscribeClicked(kind, {
          platform: Platform.OS,
          product_id: selectedSku,
          segment,
          promo_active: promoActive,
        });

        purchasingRef.current = true;
        await RNIap.requestSubscription(baseParams);
        return;
      }

      const offerToken = findOfferToken(kind);
      if (!offerToken) {
        console.log('[IAP] no offerToken for', kind);
        return;
      }

      await Analytics.logSubscribeClicked(kind, {
        platform: Platform.OS,
        product_id: selectedSku,
        segment,
        promo_active: promoActive,
      });

      purchasingRef.current = true;

      await RNIap.requestSubscription({
        ...baseParams,
        subscriptionOffers: [{ sku: selectedSku, offerToken }],
      });
    } catch (e) {
      console.log('[IAP][BUY ERROR]', {
        code: e?.code || null,
        message: e?.message || null,
        debugMessage: e?.debugMessage || null,
      });
      purchasingRef.current = false;
    }
  },
  [findOfferToken, promoActive, segment]
);

  const buyMonthly = useCallback(async () => requestBuy('monthly'), [requestBuy]);
  const buyAnnual = useCallback(async () => requestBuy('annual'), [requestBuy]);

  const applyPromoCode = useCallback(
    async (code) => {
      const key = String(code || '').trim().toUpperCase();
      const seg = PROMO_SEGMENT_BY_CODE[key];
      if (!seg) return false;

      setSegment(seg);
      setPromoActive(true);
      await AsyncStorage.setItem(PROMO_ACTIVE_KEY, '1');
      recalcPrices('promo-applied');
      return true;
    },
    [recalcPrices]
  );

  const openRedeem = useCallback(async () => {
    try {
      if (Platform.OS === 'ios' && RNIap.presentCodeRedemptionSheet) {
        await RNIap.presentCodeRedemptionSheet();
      } else {
        await Linking.openURL('https://play.google.com/redeem');
      }
    } catch {}
  }, []);

  const restore = useCallback(async () => {
    try {
      const offline = await resolveOfflineAccess();
      if (offline.pro) return true;

      const online = await restoreFromNetwork();
      if (online.ok && online.pro) return true;

      return false;
    } catch (e) {
      console.log('[IAP] restore failed=', e?.message || String(e));
      const offline = await resolveOfflineAccess();
      return !!offline.pro;
    }
  }, [resolveOfflineAccess, restoreFromNetwork]);

  const markPostShown = useCallback(async () => {
    try {
      await AsyncStorage.multiSet([
        [POST_STATE_KEY, 'shown'],
        [POST_SHOWN_AT_KEY, String(Date.now())],
        [LAST_PURCHASE_AT_KEY, '0'],
      ]);
    } catch {}
    setShouldShowPost(false);
  }, []);

  const probePostPurchase = useCallback(async () => {
    if (purchasingRef.current) return false;

    try {
      const st = (await AsyncStorage.getItem(POST_STATE_KEY)) || 'none';
      const want = st === 'pending';
      setShouldShowPost(want);
      return want;
    } catch {
      return false;
    }
  }, []);

  const consumeJustPurchased = useCallback(() => setJustPurchased(false), []);

  const __devGrantPro = useCallback(async () => {
    if (!devSessionAllowed) return;
    syncAccessStateRespectingCode(true);
    setTrialEverUsed(true);
    AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
    setJustPurchased(false);
    setShouldShowPost(false);
  }, [syncAccessStateRespectingCode]);

  const __devRevokePro = useCallback(async () => {
    if (!devSessionAllowed) return;
    syncAccessStateRespectingCode(false);
  }, [syncAccessStateRespectingCode]);

  /* ===================== bootstrap: single owner of access ===================== */
useEffect(() => {
  let cancelled = false;

  const finishBootstrap = () => {
    clearTimeout(hardTimeout);
    setReady(true);
  };

  const hardTimeout = setTimeout(() => {
    if (cancelled) return;
    console.log('[IAP] bootstrap hard-timeout fallback');
    syncAccessStateRespectingCode(false);
    setReady(true);
  }, 8000);

  (async () => {
      try {
        setAccessState('checking');

        const uid = await getUserId();
        if (!cancelled) {
          setUserId(uid);
          console.log('[IAP] device userId =', uid);
        }

        sendAccessPing(uid).catch(() => {});

        try {
          const lastGood = await AsyncStorage.getItem(IAP_LAST_GOOD_PRO_AT);
          const explicit = await AsyncStorage.getItem(TRIAL_EVER_USED_KEY);
          const ever = (!!lastGood && Number(lastGood) > 0) || explicit === 'true';
          if (!cancelled) setTrialEverUsed(ever);
        } catch {}

        try {
          const st = (await AsyncStorage.getItem(POST_STATE_KEY)) || 'none';
          if (!cancelled) setShouldShowPost(st === 'pending');
        } catch {}

        try {
          const promoStored = (await AsyncStorage.getItem(PROMO_ACTIVE_KEY)) === '1';
          if (!cancelled) setPromoActive(promoStored);
        } catch {}

      const offline = await resolveOfflineAccess();

if (
  !offline.pro &&
  RESTORE_ON_LAUNCH &&
  !isSimulator &&
  Device.isDevice
) {
  const online = await restoreFromNetwork();

  if (!cancelled && online.ok) {
  setDebug((d) => ({ ...d, bootstrapSource: online.source || offline.source }));
  finishBootstrap();
  return;
}
}

if (!cancelled) {
  setDebug((d) => ({ ...d, bootstrapSource: offline.source }));
  finishBootstrap();
}
      } catch (e) {
        console.log('[IAP] bootstrap access error=', e?.message || String(e));

       if (!cancelled) {
  syncAccessStateRespectingCode(false);
  finishBootstrap();
}
      }
    })();

  return () => {
  cancelled = true;
  clearTimeout(hardTimeout);
};
  }, [resolveOfflineAccess, restoreFromNetwork, sendAccessPing, syncAccessStateRespectingCode]);


 useEffect(() => {
  let cancelled = false;

  if (!ready) return;
  if (RESTORE_ON_LAUNCH) return;
  if (isSimulator || !Device.isDevice) return;
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const runBackgroundRestore = async () => {
    try {
      // Первая попытка: после старта, но не мешаем UI и ценам
      await sleep(2500);
      if (cancelled) return;

      let online = await restoreFromNetwork();
      if (cancelled) return;

      if (online?.ok) {
        setDebug((d) => ({
          ...d,
          backgroundRestoreSource: online.source || null,
        }));
      }

      console.log('[IAP] background restore pass1=', {
        ok: !!online?.ok,
        pro: !!online?.pro,
        source: online?.source || null,
      });

      // Если уже восстановили PRO — выходим
      if (online?.ok && online?.pro) return;

      // Для Android даём вторую попытку после прогрева Play Services / Billing
      if (Platform.OS === 'android') {
        await sleep(9000);
        if (cancelled) return;

        online = await restoreFromNetwork();
        if (cancelled) return;

        if (online?.ok) {
          setDebug((d) => ({
            ...d,
            backgroundRestoreSource:
              online.source || d.backgroundRestoreSource || null,
          }));
        }

        console.log('[IAP] background restore pass2=', {
          ok: !!online?.ok,
          pro: !!online?.pro,
          source: online?.source || null,
        });
      }
    } catch (e) {
      console.log('[IAP] background restore failed=', e?.message || String(e));
    }
  };

  runBackgroundRestore();

  return () => {
    cancelled = true;
  };
}, [ready, restoreFromNetwork]);

  /* ===================== store init: prices + listeners only ===================== */
  useEffect(() => {
    let cancelled = false;
    let subUpdated;
    let subError;

    (async () => {
      const isIosSim = Platform.OS === 'ios' && !Device.isDevice;

      if (isIosSim) {
        if (cancelled) return;

        setDisplayPrices({
          baseMonthly: '₪29.90',
          baseAnnual: '₪239.90',
          promoMonthly: '₪29.90',
          promoAnnual: '₪239.90',
        });
        setAvailable(true);
        return;
      }

      try {
        const connected = await ensureIapConnection();
if (!connected) {
  throw new Error('ensureIapConnection failed');
}

let subs = await getSubsSafe();

if ((!subs || subs.length === 0) && Platform.OS === 'android') {
  await new Promise((r) => setTimeout(r, 1200));
  subs = await getSubsSafe();
}

if ((!subs || subs.length === 0) && Platform.OS === 'android') {
  await new Promise((r) => setTimeout(r, 1500));
  subs = await getSubsSafe();
}

        const prodMonthly = subs?.find((p) => p.productId === SKU_MONTHLY) || null;
        const prodAnnual = subs?.find((p) => p.productId === SKU_ANNUAL) || null;
        const prodAndroid = Platform.OS === 'android' ? subs?.[0] || null : null;

        productRef.current = Platform.OS === 'android' ? prodAndroid : prodMonthly;
        productRefAnnual.current = Platform.OS === 'ios' ? prodAnnual : null;

        const okAvailable =
  Platform.OS === 'ios' ? !!prodMonthly || !!prodAnnual : !!prodAndroid;

setAvailable(true);

if (okAvailable) {
  recalcPrices('product-loaded');
} else {
  console.log('[IAP] subscriptions loaded empty, keeping store available');
}

        function isPurchaseCompleted(purchase) {
          if (Platform.OS === 'android') {
            const state = Number(purchase?.purchaseStateAndroid ?? 0);
            return state === 1 && !!purchase?.purchaseToken;
          }
          return !!(purchase?.transactionReceipt || purchase?.transactionId);
        }

        subUpdated = RNIap.purchaseUpdatedListener(async (purchase) => {
          try {
            if (!purchase || !isPurchaseCompleted(purchase)) return;

            const { productId, transactionId } = purchase;

            if (Platform.OS === 'ios') {
              if (productId !== SKU_MONTHLY && productId !== SKU_ANNUAL) return;
            } else {
              if (productId !== SKU) return;
            }

            const tokenOrReceipt =
              Platform.OS === 'ios'
                ? await getIosReceiptSafe(purchase)
                : extractTokenOrReceipt(purchase);

            const dedupeKey = tokenOrReceipt || transactionId;
            if (!dedupeKey) return;
            if (processed.current.has(dedupeKey)) return;
            processed.current.add(dedupeKey);

            try {
              await RNIap.finishTransaction(purchase, false);
            } catch {}

            if (tokenOrReceipt) {
              try {
                await AsyncStorage.multiSet([
                  [LAST_TOKEN_KEY, tokenOrReceipt],
                  [LAST_PRODUCT_ID_KEY, String(productId || '')],
                ]);
              } catch {}
            }

            const applySuccessState = async () => {

await Analytics.logPurchaseSuccess({
  platform: Platform.OS,
  product_id: productId,
  segment,
  promo_active: promoActive,
});

              syncAccessStateRespectingCode(true);
              setTrialEverUsed(true);
              setJustPurchased(true);
              setShouldShowPost(true);

              try {
                await AsyncStorage.multiSet([
                  [IAP_LAST_PRO, 'true'],
                  [IAP_LAST_GOOD_PRO_AT, String(Date.now())],
                  [TRIAL_EVER_USED_KEY, 'true'],
                  [POST_STATE_KEY, 'pending'],
                  [LAST_PURCHASE_AT_KEY, String(Date.now())],
                ]);
              } catch {}
            };

            const applyFailState = async () => {
              const offline = await resolveOfflineAccess();
              syncAccessStateRespectingCode(offline.pro);
              setJustPurchased(false);
              setShouldShowPost(false);

              try {
                await AsyncStorage.setItem(IAP_LAST_PRO, String(offline.pro));
              } catch {}
            };

            if (OPT_DEV_PRO) {
              await applySuccessState();
              return;
            }

            let verified = null;
            if (tokenOrReceipt) {
              verified = await verifyOnServer(tokenOrReceipt, productId);
            }

            const decision = await resolveVerifyResult(verified);

            if (decision.decided) {
              if (decision.pro === true) {
                await applySuccessState();
                return;
              }
              if (decision.pro === false) {
                await applyFailState();
                return;
              }
            }

            const offline = await resolveOfflineAccess();
            syncAccessStateRespectingCode(offline.pro);
          } finally {
            purchasingRef.current = false;
          }
        });

        subError = RNIap.purchaseErrorListener(async (err) => {

 if (err?.code === 'E_USER_CANCELLED') {

        await FirebaseAnalytics.logFirebaseEvent('purchase_cancelled', {
            platform: Platform.OS,
        });

    } else {

        await FirebaseAnalytics.logFirebaseEvent('purchase_failed', {
            platform: Platform.OS,
            code: err?.code,
            message: err?.message,
        });

    }

          console.log('[IAP][ERROR]', {
            code: err?.code || null,
            message: err?.message || null,
            debugMessage: err?.debugMessage || null,
            productId: err?.productId || null,
          });

          purchasingRef.current = false;
        });
      } catch (e) {
        console.log('[IAP] init error=', e?.message || String(e));
        if (cancelled) return;
        setAvailable(false);
      }
    })();

    return () => {
      cancelled = true;

      try {
        subUpdated?.remove();
      } catch {}

      try {
        subError?.remove();
      } catch {}

     };
  }, [ensureIapConnection, recalcPrices, resolveOfflineAccess, resolveVerifyResult, syncAccessStateRespectingCode, verifyOnServer]);

  useEffect(() => {
    if (productRef.current || productRefAnnual.current) {
      recalcPrices('segment-or-promo-changed');
    }
  }, [promoActive, segment, recalcPrices]);

  const value = useMemo(
    () => ({
      ready,
      available,
      hasPro,
      accessState,
      trialEverUsed,
      userId,

      justPurchased,
      consumeJustPurchased,

      shouldShowPost,
      markPostShown,

      promoActive,
      setSegment,
      applyPromoCode,

      buyMonthly,
      buyAnnual,
      openRedeem,

      codeAccessUntil,
      refreshCodeEntitlement: async () => {
        const uid = userId || (await getUserId());
        if (!uid) return { ok: false, reason: 'no_userId' };
        return syncCodeEntitlementFromServer(uid);
      },
      syncCodeEntitlementFromServer,
      applyCodeEntitlementLocal,

      restore,
      probePostPurchase,

      __devGrantPro,
      __devRevokePro,

      displayPrices,
      _debug: debug,
    }),
    [
      ready,
      available,
      hasPro,
      accessState,
      trialEverUsed,
      userId,
      justPurchased,
      consumeJustPurchased,
      shouldShowPost,
      markPostShown,
      promoActive,
      setSegment,
      applyPromoCode,
      buyMonthly,
      buyAnnual,
      openRedeem,
      codeAccessUntil,
      syncCodeEntitlementFromServer,
      applyCodeEntitlementLocal,
      restore,
      probePostPurchase,
      __devGrantPro,
      __devRevokePro,
      displayPrices,
      debug,
    ]
  );

  return <IapContext.Provider value={value}>{children}</IapContext.Provider>;
}

/* ===================== No-IAP provider ===================== */
export function NoIapProvider({ children }) {
  const [mockPro, setMockPro] = useState(false);

  const devAllowed =
    __DEV__ ||
    String(
      Constants?.expoConfig?.extra?.devUnlockAll ??
        process.env.EXPO_PUBLIC_DEV_UNLOCK_ALL ??
        '0'
    ) === '1';

  const __devGrantPro = useCallback(async () => {
    if (!devAllowed) return;
    setMockPro(true);
  }, [devAllowed]);

  const __devRevokePro = useCallback(async () => {
    if (!devAllowed) return;
    setMockPro(false);
  }, [devAllowed]);

  const value = useMemo(
    () => ({
      available: false,
      ready: true,
      hasPro: mockPro,
      accessState: mockPro ? 'pro' : 'free',

      userId: null,
      trialEverUsed: false,

      justPurchased: false,
      consumeJustPurchased: () => {},

      shouldShowPost: false,
      markPostShown: async () => {},

      promoActive: false,
      setSegment: () => {},
      applyPromoCode: async () => false,

      buyMonthly: async () => {},
      buyAnnual: async () => {},
      openRedeem: async () => {},
      applyCodeEntitlementLocal: async () => ({ ok: false }),
      restore: async () => false,
      probePostPurchase: async () => false,

      __devGrantPro,
      __devRevokePro,

      codeAccessUntil: null,

      displayPrices: {
        baseMonthly: undefined,
        baseAnnual: undefined,
        promoMonthly: undefined,
        promoAnnual: undefined,
      },

      _debug: { mock: true },
    }),
    [mockPro, __devGrantPro, __devRevokePro]
  );

  return <IapContext.Provider value={value}>{children}</IapContext.Provider>;
} 