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

const isSimulator = !Device.isDevice;

/* ===================== Константы / настройки ===================== */
// Android uses ONE subscription productId with base plans/offers.
// iOS uses SEPARATE productIds per duration (monthly/annual).
const SKU_MONTHLY = Platform.select({
  android: 'monthly_ils_10',
  ios: 'monthly_ils_10',
});

const SKU_ANNUAL = Platform.select({
  android: 'monthly_ils_10',
  ios: 'annual_ils_80',
});

// Back-compat
const SKU = SKU_MONTHLY;

/**
 * БАЗОВЫЙ URL сервера, без /iap/.../verify
 * Пример:
 * EXPO_PUBLIC_IAP_VERIFY_BASE_URL=https://your-server.onrender.com
 */
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

/** Таймаут запроса к верификатору (мс) */
const IAP_VERIFY_TIMEOUT_MS = Number(
  process.env.EXPO_PUBLIC_IAP_VERIFY_TIMEOUT_MS || 5000
);
const CODE_ENTITLE_TIMEOUT_MS = 6000;

/**
 * Офлайн-энтайтлмент разрешён только до неистёкшего expiresAt.
 * Никакого "держать PRO по lastGoodProAt после конца подписки".
 */
const ENTITLE_OFFLINE_WHILE_NOT_EXPIRED =
  String(process.env.EXPO_PUBLIC_IAP_ENTITLE_OFFLINE ?? '1') === '1';

const RESTORE_ON_LAUNCH =
  String(process.env.EXPO_PUBLIC_IAP_RESTORE_ON_LAUNCH || '1') === '1';

/** Определение packageName для сервера */
const PKG =
  Constants?.expoConfig?.android?.package ||
  Constants?.manifest?.android?.package ||
  'com.rosenbergvictor72.pealim2';

/** (опц.) x-api-key, если на сервере включена проверка */
const API_KEY_HEADER =
  Constants?.expoConfig?.extra?.IAP_API_KEY ||
  process.env.EXPO_PUBLIC_IAP_API_KEY ||
  '';

/**
 * Если хочешь ОДИН РАЗ сбросить старые IAP-ключи на устройстве,
 * поставь EXPO_PUBLIC_IAP_CLEAR_OLD_CACHE=1 и после одного теста верни в 0.
 */
const CLEAR_OLD_IAP_CACHE_ON_START =
  String(process.env.EXPO_PUBLIC_IAP_CLEAR_OLD_CACHE || '0') === '1';

/* ===================== Ключи хранения ===================== */
const LAST_TOKEN_KEY = 'iap:lastPurchaseToken';
const LAST_PRODUCT_ID_KEY = 'iap:lastProductId';
const PROMO_ACTIVE_KEY = 'iap:promoActive';
const LAST_PURCHASE_AT_KEY = 'iap:lastPurchaseAt';
const POST_SHOWN_AT_KEY = 'iap:postShownAt';
const POST_STATE_KEY = 'iap:postState'; // 'none' | 'pending' | 'shown'
const CODE_ACCESS_UNTIL_KEY = 'iap:codeAccessUntil'; // ISO string
const CODE_LAST_SYNC_AT_KEY = 'iap:codeEntSyncAt'; // ms since epoch (string)

const IAP_LAST_VERIFY_JSON = 'iap:lastVerifyJson';
const IAP_LAST_VERIFY_AT = 'iap:lastVerifyAt';
const IAP_LAST_EXPIRES_AT = 'iap:lastExpiresAt';
const IAP_LAST_PRO = 'iap:lastPro';
const IAP_LAST_GOOD_PRO_AT = 'iap:lastGoodProAt';

const DEVICE_USER_ID_KEY = 'iap:deviceUserId';
const TRIAL_EVER_USED_KEY = 'iap:trialEverUsed';

/* ===== DEV флаги ===== */
const devSessionAllowed =
  __DEV__ ||
  String(
    Constants?.expoConfig?.extra?.devUnlockAll ??
      process.env.EXPO_PUBLIC_DEV_UNLOCK_ALL ??
      '0'
  ) === '1';

const OPT_DEV_PRO =
  __DEV__ || String(process.env.EXPO_PUBLIC_PRO_BYPASS || '0') === '1';

/**
 * Теги офферов (Google Play Subscription Offers).
 * - segment: basic / test / ulpan / ...
 * - trial mode: trial5 | notrial
 * - cadence: monthly | annual
 */
function requiredTagsForSegment(segment, cadence, preferNoTrial) {
  if (!segment || segment === 'default') return null;

  if (segment === 'basic') {
    return preferNoTrial ? null : ['basic', 'trial5', cadence];
  }

  const trialTag = preferNoTrial ? 'notrial' : 'trial5';
  return [segment, trialTag, cadence];
}

/* ===================== Контекст ===================== */
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
  setSegment: (_seg) => {},
  applyPromoCode: async (_code) => false,

  buyMonthly: async () => {},
  buyAnnual: async () => {},
  openRedeem: async () => {},
  applyCodeEntitlementLocal: async (_untilIso) => ({ ok: false }),
  restore: async () => false,

  probePostPurchase: async () => false,

  __devGrantPro: async () => {},
  __devRevokePro: async () => {},

  displayPrices: {
    baseMonthly: undefined,
    baseAnnual: undefined,
    promoMonthly: undefined,
    promoAnnual: undefined,
  },

  _debug: {},
});

export const useIap = () => useContext(IapContext);

/* ===================== Helpers: цены/периоды ===================== */
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
  const lp = prod?.localizedPrice;
  if (lp) return lp;

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
    return periodOffers.sort((a, b) => priceMicrosOf(a) - priceMicrosOf(b))[0] || null;
  }

  const withTrial = periodOffers.find((o) => isTrialById(o) || hasFreeTrial(o));
  if (withTrial) return withTrial;

  return periodOffers.sort((a, b) => priceMicrosOf(a) - priceMicrosOf(b))[0] || null;
}

/* ===================== OFFERS by tags ===================== */
function getSegmentOfferTags(segment, kind, preferNoTrial) {
  return requiredTagsForSegment(segment, kind, preferNoTrial);
}

function findSegmentOffer(product, requiredTags, kind) {
  if (!requiredTags || !requiredTags.length) return null;
  const periodOffers = pickByPeriod(product, kind);
  const hit = periodOffers.find((o) =>
    requiredTags.every((t) => (o.offerTags || []).includes(t))
  );
  return hit || null;
}

/* ===================== API helpers ===================== */
async function getSubsSafe() {
  try {
    const skus = Platform.OS === 'ios' ? [SKU_MONTHLY, SKU_ANNUAL] : [SKU];
    return await RNIap.getSubscriptions({ skus });
  } catch (e) {
    console.log('[IAP] getSubscriptions error', e);
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

/* ===================== Offline cache ===================== */
async function saveVerifyCache(json) {
  try {
    const expiresAt = json?.expiresAt ? String(json.expiresAt) : '';
    const lastGood =
      json?.pro === true
        ? String(Date.now())
        : (await AsyncStorage.getItem(IAP_LAST_GOOD_PRO_AT)) || '';

    await AsyncStorage.multiSet([
      [IAP_LAST_VERIFY_JSON, JSON.stringify(json || {})],
      [IAP_LAST_VERIFY_AT, String(Date.now())],
      [IAP_LAST_EXPIRES_AT, expiresAt],
      [IAP_LAST_PRO, String(json?.pro === true)],
      [IAP_LAST_GOOD_PRO_AT, lastGood],
    ]);
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
    const when = Number(at || 0);
    const expiresAt = exp || '';
    const lastPro = String(pro || 'false') === 'true';

    return { json, when, expiresAt, lastPro };
  } catch {
    return { json: null, when: 0, expiresAt: '', lastPro: false };
  }
}

function notExpiredBy(expiresAt) {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  if (!Number.isFinite(t)) return false;
  return Date.now() < t;
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
    segment,
    promoActive,
    productIdMonthly: SKU_MONTHLY,
    productIdAnnual: SKU_ANNUAL,
  });

  const productRef = useRef(null);
  const productRefAnnual = useRef(null);
  const processed = useRef(new Set());
  const purchasingRef = useRef(false);

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
      if (until && isIsoActiveNow(until)) {
        syncAccessStateRespectingCode(true);
      }
    } catch {
    } finally {
      codeLoadedRef.current = true;
    }
  }, [isIsoActiveNow, syncAccessStateRespectingCode]);

  const clearOldIapCacheIfRequested = useCallback(async () => {
    if (!CLEAR_OLD_IAP_CACHE_ON_START) return;
    try {
      await AsyncStorage.multiRemove([
        LAST_TOKEN_KEY,
        LAST_PRODUCT_ID_KEY,
        IAP_LAST_VERIFY_JSON,
        IAP_LAST_VERIFY_AT,
        IAP_LAST_EXPIRES_AT,
        IAP_LAST_PRO,
        IAP_LAST_GOOD_PRO_AT,
        TRIAL_EVER_USED_KEY,
        CODE_ACCESS_UNTIL_KEY,
        CODE_LAST_SYNC_AT_KEY,
        POST_STATE_KEY,
        LAST_PURCHASE_AT_KEY,
        DEVICE_USER_ID_KEY,
      ]);
      console.log('[IAP] cleared old IAP cache by env flag');
    } catch (e) {
      console.log('[IAP] clear old cache failed=', e?.message || String(e));
    }
  }, []);

  const fetchCodeEntitlement = useCallback(async (uid) => {
    if (!ENTITLEMENTS_URL) return null;
    const userIdStr = String(uid || '').trim();
    if (!userIdStr) return null;

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), CODE_ENTITLE_TIMEOUT_MS);

    try {
      const url = `${ENTITLEMENTS_URL}?userId=${encodeURIComponent(userIdStr)}`;
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(API_KEY_HEADER ? { 'x-api-key': API_KEY_HEADER } : {}),
        },
        signal: ctrl.signal,
      });

      const bodyText = await resp.text();
      let json;
      try {
        json = JSON.parse(bodyText);
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

  const syncCodeEntitlementFromServer = useCallback(
    async (uid) => {
      const userIdStr = String(uid || '').trim();
      if (!userIdStr) return { ok: false, reason: 'no_userId' };

      try {
        const last = Number((await AsyncStorage.getItem(CODE_LAST_SYNC_AT_KEY)) || 0);
        if (Number.isFinite(last) && Date.now() - last < 15000) {
          return { ok: true, skipped: true };
        }
        await AsyncStorage.setItem(CODE_LAST_SYNC_AT_KEY, String(Date.now()));
      } catch {}

      const ent = await fetchCodeEntitlement(userIdStr);
      if (!ent?.ok) return { ok: false, ent };

      const pro = !!ent?.pro;
      const until = ent?.accessUntil || null;

      if (pro && until) {
        await saveCodeAccessUntil(until);
        syncAccessStateRespectingCode(true);
        setTrialEverUsed(true);
        AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
        return { ok: true, pro: true, accessUntil: until };
      }

      if (!isIsoActiveNow(codeAccessUntilRef.current)) {
        await saveCodeAccessUntil(null);
      }

      return { ok: true, pro: false, accessUntil: null };
    },
    [
      fetchCodeEntitlement,
      isIsoActiveNow,
      saveCodeAccessUntil,
      syncAccessStateRespectingCode,
    ]
  );

  useEffect(() => {
    (async () => {
      try {
        const lastGood = await AsyncStorage.getItem(IAP_LAST_GOOD_PRO_AT);
        const explicit = await AsyncStorage.getItem(TRIAL_EVER_USED_KEY);
        const ever = (!!lastGood && Number(lastGood) > 0) || explicit === 'true';
        setTrialEverUsed(ever);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setSegment('basic');
      setPromoActive(false);
      AsyncStorage.setItem(PROMO_ACTIVE_KEY, '0').catch(() => {});
      try {
        const st = (await AsyncStorage.getItem(POST_STATE_KEY)) || 'none';
        setShouldShowPost(st === 'pending');
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const uid = await getUserId();
      setUserId(uid);
      console.log('[IAP] device userId =', uid);
    })();
  }, []);

  useEffect(() => {
    ensureCodeLoaded();
  }, [ensureCodeLoaded]);

  const verifyOnServer = useCallback(async (purchaseTokenOrReceipt, productId) => {
    const url = getVerifyUrl();
    if (!url || !purchaseTokenOrReceipt) return null;

    const uid = await getUserId();

    let payload;
    if (Platform.OS === 'ios') {
      payload = {
        userId: uid,
        platform: Platform.OS,
        productId: productId || SKU,
        receipt: purchaseTokenOrReceipt,
      };
    } else {
      payload = {
        userId: uid,
        deviceId: uid,
        platform: Platform.OS,
        productId: productId || SKU,
        packageName: PKG,
        purchaseToken: purchaseTokenOrReceipt,
      };
    }

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
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      console.log(
        '[IAP] verify response status=',
        resp.status,
        'url=',
        url,
        'productId=',
        productId,
        'json=',
        json
      );

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

  const recalcPrices = useCallback(
    (reason = 'manual') => {
      if (Platform.OS === 'ios') {
        const monthlyProd = productRef.current;
        const annualProd = productRefAnnual.current;

        const baseMonthly = iosPriceOf(monthlyProd);
        const baseAnnual = iosPriceOf(annualProd);

        const newPrices = {
          baseMonthly,
          baseAnnual,
          promoMonthly: baseMonthly,
          promoAnnual: baseAnnual,
        };

        setDisplayPrices(newPrices);
        setDebug((d) => ({
          ...d,
          segment,
          promoActive,
          recalcReason: reason,
          ios: true,
          gotMonthly: !!monthlyProd,
          gotAnnual: !!annualProd,
          monthlyTitle: monthlyProd?.title,
          annualTitle: annualProd?.title,
          displayPrices: newPrices,
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
        setDebug((d) => ({
          ...d,
          segment,
          promoActive,
          recalcReason: reason,
          android: true,
          noOffers: true,
        }));
        return;
      }

      const baseMonthlyOffer = pickPreferredBaseOffer(prod, 'monthly', trialEverUsed);
      const baseAnnualOffer = pickPreferredBaseOffer(prod, 'annual', trialEverUsed);

      let baseMonthly = firstPaidPhase(baseMonthlyOffer)?.formatted;
      let baseAnnual = firstPaidPhase(baseAnnualOffer)?.formatted;

      if (!baseMonthly) {
        baseMonthly = firstPaidPhase(pickByPeriod(prod, 'monthly')[0])?.formatted;
      }
      if (!baseAnnual) {
        baseAnnual = firstPaidPhase(pickByPeriod(prod, 'annual')[0])?.formatted;
      }

      let segMonthlyOffer = null;
      let segAnnualOffer = null;

      if (promoActive) {
        const segMonthlyTags = getSegmentOfferTags(segment, 'monthly', trialEverUsed);
        const segAnnualTags = getSegmentOfferTags(segment, 'annual', trialEverUsed);
        segMonthlyOffer = segMonthlyTags
          ? findSegmentOffer(prod, segMonthlyTags, 'monthly')
          : null;
        segAnnualOffer = segAnnualTags
          ? findSegmentOffer(prod, segAnnualTags, 'annual')
          : null;
      }

      const promoMonthly = firstPaidPhase(segMonthlyOffer)?.formatted || baseMonthly;
      const promoAnnual = firstPaidPhase(segAnnualOffer)?.formatted || baseAnnual;

      const newPrices = {
        baseMonthly,
        baseAnnual,
        promoMonthly: promoMonthly || baseMonthly,
        promoAnnual: promoAnnual || baseAnnual,
      };

      setDisplayPrices(newPrices);
      setDebug((d) => ({
        ...d,
        segment,
        promoActive,
        recalcReason: reason,
        android: true,
        trialEverUsed,
        displayPrices: newPrices,
      }));
    },
    [segment, promoActive, trialEverUsed]
  );

  const hasLocalActiveEntitlement = useCallback(async () => {
    const { json, expiresAt } = await readVerifyCache();
    const effectiveExpiresAt = expiresAt || json?.expiresAt || '';
    return !!(json?.pro === true && effectiveExpiresAt && notExpiredBy(effectiveExpiresAt));
  }, []);

  const tryOfflineEntitlement = useCallback(async () => {
    if (!ENTITLE_OFFLINE_WHILE_NOT_EXPIRED) return false;

    const { json, expiresAt } = await readVerifyCache();
    const effectiveExpiresAt = expiresAt || json?.expiresAt || '';

    if (json?.pro === true && effectiveExpiresAt && notExpiredBy(effectiveExpiresAt)) {
      syncAccessStateRespectingCode(true);
      return true;
    }

    return false;
  }, [syncAccessStateRespectingCode]);

  const resolveVerifyResult = useCallback(async (v) => {
    if (v?.pro === true) {
      return { decided: true, pro: true };
    }

    if (v?.pro === false) {
      return { decided: true, pro: false };
    }

    return { decided: false, pro: null };
  }, []);

  const restoreActiveSubscription = useCallback(async () => {
    try {
      await ensureCodeLoaded();

      if (isIsoActiveNow(codeAccessUntilRef.current)) {
        syncAccessStateRespectingCode(true);
        setTrialEverUsed(true);
        AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
        return true;
      }

      const uidForCode = userId || (await getUserId());
      if (uidForCode) {
        const synced = await syncCodeEntitlementFromServer(uidForCode);
        if (synced?.pro && isIsoActiveNow(codeAccessUntilRef.current)) {
          syncAccessStateRespectingCode(true);
          return true;
        }
      }

      if (Platform.OS === 'ios') {
        const receipt = await getIosReceiptSafe(null);

        if (receipt) {
          try {
            await AsyncStorage.multiSet([
              [LAST_TOKEN_KEY, receipt],
              [LAST_PRODUCT_ID_KEY, 'ios_receipt'],
            ]);
          } catch {}

          let v = await verifyOnServer(receipt, SKU_ANNUAL);
          let decision = await resolveVerifyResult(v);

          if (!(decision.decided && decision.pro === true)) {
            v = await verifyOnServer(receipt, SKU_MONTHLY);
            decision = await resolveVerifyResult(v);
          }

          if (decision.decided && decision.pro === true) {
            syncAccessStateRespectingCode(true);
            setTrialEverUsed(true);
            AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
            return true;
          }
        }

        const offlineOk = await tryOfflineEntitlement();
        if (offlineOk) return true;

        syncAccessStateRespectingCode(false);
        return false;
      }

      const purchases = await RNIap.getAvailablePurchases();

      const relevantPurchases = (purchases || []).filter((p) => p.productId === SKU);

      for (const match of relevantPurchases) {
        try {
          await RNIap.finishTransaction(match, false);
        } catch {}

        const tokenOrReceipt = extractTokenOrReceipt(match);
        if (!tokenOrReceipt) continue;

        await AsyncStorage.multiSet([
          [LAST_TOKEN_KEY, tokenOrReceipt],
          [LAST_PRODUCT_ID_KEY, String(match.productId || '')],
        ]);

        const v = await verifyOnServer(tokenOrReceipt, match.productId);
        const decision = await resolveVerifyResult(v);

        if (decision.decided && decision.pro === true) {
          syncAccessStateRespectingCode(true);
          setTrialEverUsed(true);
          AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
          return true;
        }
      }

      const offlineOk = await tryOfflineEntitlement();
      if (offlineOk) return true;

      syncAccessStateRespectingCode(false);
      return false;
    } catch (e) {
      console.log('[IAP] restoreActiveSubscription error=', e?.message || String(e));
      const offlineOk = await tryOfflineEntitlement();
      if (offlineOk) return true;
      syncAccessStateRespectingCode(false);
      return false;
    }
  }, [
    ensureCodeLoaded,
    isIsoActiveNow,
    syncCodeEntitlementFromServer,
    userId,
    verifyOnServer,
    tryOfflineEntitlement,
    syncAccessStateRespectingCode,
    resolveVerifyResult,
  ]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setAccessState('checking');

        await ensureCodeLoaded();

        if (isIsoActiveNow(codeAccessUntilRef.current)) {
          if (!cancelled) {
            syncAccessStateRespectingCode(true);
            setReady(true);
          }
          return;
        }

        const localActive = await hasLocalActiveEntitlement();
        if (localActive && !cancelled) {
          syncAccessStateRespectingCode(true);
        }

        const restored = RESTORE_ON_LAUNCH ? await restoreActiveSubscription() : false;
        if (restored) {
          if (!cancelled) {
            syncAccessStateRespectingCode(true);
            setReady(true);
          }
          return;
        }

        const offlineOk = await tryOfflineEntitlement();
        if (offlineOk) {
          if (!cancelled) {
            syncAccessStateRespectingCode(true);
            setReady(true);
          }
          return;
        }

        if (!cancelled) {
          syncAccessStateRespectingCode(false);
          setReady(true);
        }
      } catch (e) {
        console.log('[IAP] bootstrap access error=', e?.message || String(e));
        const offlineOk = await tryOfflineEntitlement();
        if (!cancelled) {
          syncAccessStateRespectingCode(offlineOk);
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    ensureCodeLoaded,
    hasLocalActiveEntitlement,
    isIsoActiveNow,
    restoreActiveSubscription,
    syncAccessStateRespectingCode,
    tryOfflineEntitlement,
  ]);

  useEffect(() => {
    let subUpdated;
    let subError;
    let cancelled = false;

    (async () => {
      const isIosSim = Platform.OS === 'ios' && !Device.isDevice;
      if (isIosSim) {
        const mock = {
          baseMonthly: '₪19.90',
          baseAnnual: '₪159.90',
          promoMonthly: '₪19.90',
          promoAnnual: '₪159.90',
        };
        if (cancelled) return;
        setDisplayPrices(mock);
        setAvailable(true);
        if (accessState !== 'pro') setAccessState('free');
        setReady(true);
        return;
      }

      try {
        await clearOldIapCacheIfRequested();
        await RNIap.initConnection();

        if (Platform.OS === 'android') {
          try {
            await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
          } catch {}
        }

        const subs = await getSubsSafe();

        const prodMonthly = subs?.find((p) => p.productId === SKU_MONTHLY) || null;
        const prodAnnual = subs?.find((p) => p.productId === SKU_ANNUAL) || null;
        const prodAndroid = Platform.OS === 'android' ? subs?.[0] || null : null;

        productRef.current = Platform.OS === 'android' ? prodAndroid : prodMonthly;
        productRefAnnual.current = Platform.OS === 'ios' ? prodAnnual : null;

        const okAvailable =
          Platform.OS === 'ios' ? !!prodMonthly || !!prodAnnual : !!prodAndroid;

        if (cancelled) return;

        setAvailable(okAvailable);
        if (okAvailable) recalcPrices('product-loaded');

        function isPurchaseCompleted(p) {
          if (Platform.OS === 'android') {
            const state = Number(p?.purchaseStateAndroid ?? 0);
            return state === 1 && !!p?.purchaseToken;
          }
          return !!(p?.transactionReceipt || p?.transactionId);
        }

        subUpdated = RNIap.purchaseUpdatedListener(async (purchase) => {
          console.log('🔥 [IAP][PURCHASE UPDATED]', {
            productId: purchase?.productId,
            transactionId: purchase?.transactionId,
            hasReceipt: !!purchase?.transactionReceipt,
            receiptLength: purchase?.transactionReceipt?.length || 0,
          });

          console.log('🔥 [IAP][FULL PURCHASE]', purchase);

          try {
            if (!purchase) return;

            const { productId, transactionId } = purchase;

            if (Platform.OS === 'ios') {
              if (productId !== SKU_MONTHLY && productId !== SKU_ANNUAL) return;
            } else {
              if (productId !== SKU) return;
            }

            if (!isPurchaseCompleted(purchase)) return;

            if (Platform.OS === 'ios') {
              const receipt = await getIosReceiptSafe(purchase);
              const dedupeKey = receipt || transactionId;
              if (!dedupeKey) return;
              if (processed.current.has(dedupeKey)) return;
              processed.current.add(dedupeKey);

              if (receipt) {
                try {
                  await AsyncStorage.multiSet([
                    [LAST_TOKEN_KEY, receipt],
                    [LAST_PRODUCT_ID_KEY, String(productId || '')],
                  ]);
                } catch {}
              }

              const applySuccessState = async () => {
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
                const offlineOk = await tryOfflineEntitlement();
                syncAccessStateRespectingCode(offlineOk);
                setJustPurchased(false);
                setShouldShowPost(false);

                try {
                  await AsyncStorage.setItem(IAP_LAST_PRO, String(offlineOk));
                } catch {}
              };

              if (OPT_DEV_PRO) {
                try {
                  await RNIap.finishTransaction(purchase, false);
                } catch {}
                await applySuccessState();
                return;
              }

              let verified = null;
              if (receipt) {
                verified = await verifyOnServer(receipt, productId);
              }

              const decision = await resolveVerifyResult(verified);

              if (decision.decided) {
                if (decision.pro === true) {
                  try {
                    await RNIap.finishTransaction(purchase, false);
                  } catch {}
                  await applySuccessState();
                  return;
                }
                if (decision.pro === false) {
                  await applyFailState();
                  return;
                }
              }

              if (verified?.offline) {
                const ok = await tryOfflineEntitlement();
                syncAccessStateRespectingCode(ok);
                return;
              }

              console.log('[IAP][iOS] verify undecided → keep current state');
              return;
            }

            const tokenOrReceipt = extractTokenOrReceipt(purchase);
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
              const offlineOk = await tryOfflineEntitlement();
              syncAccessStateRespectingCode(offlineOk);
              setJustPurchased(false);
              setShouldShowPost(false);

              try {
                await AsyncStorage.setItem(IAP_LAST_PRO, String(offlineOk));
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

            if (verified?.offline) {
              const ok = await tryOfflineEntitlement();
              syncAccessStateRespectingCode(ok);
              return;
            }

            console.log('[IAP] verify undecided → keep current state');
            return;
          } finally {
            purchasingRef.current = false;
          }
        });

        subError = RNIap.purchaseErrorListener((err) => {
          console.log('[IAP][ERROR]', {
            code: err?.code || null,
            message: err?.message || null,
            debugMessage: err?.debugMessage || null,
            productId: err?.productId || null,
          });

          purchasingRef.current = false;
        });
      } catch (e) {
        console.log('[IAP] init error=', e);
        if (cancelled) return;
        setAvailable(false);

        const offlineOk = await tryOfflineEntitlement();
        syncAccessStateRespectingCode(offlineOk);
        setReady(true);
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
      try {
        RNIap.endConnection();
      } catch {}
    };
  }, [
    accessState,
    clearOldIapCacheIfRequested,
    recalcPrices,
    resolveVerifyResult,
    syncAccessStateRespectingCode,
    tryOfflineEntitlement,
    verifyOnServer,
  ]);

  useEffect(() => {
    if (productRef.current || productRefAnnual.current) {
      recalcPrices('segment-or-promo-changed');
    }
  }, [segment, promoActive, recalcPrices]);

  const findOfferToken = useCallback(
    (kind) => {
      const prod = productRef.current;
      if (!prod?.subscriptionOfferDetails?.length) return null;

      if (!promoActive) {
        const basePref = pickPreferredBaseOffer(prod, kind, !!trialEverUsed);
        if (basePref?.offerToken) return basePref.offerToken;
      }

      const required = promoActive
        ? getSegmentOfferTags(segment, kind, !!trialEverUsed)
        : null;

      const segOffer = findSegmentOffer(prod, required, kind);
      if (segOffer?.offerToken) return segOffer.offerToken;

      const byPeriod = pickByPeriod(prod, kind)[0];
      if (byPeriod?.offerToken) return byPeriod.offerToken;

      const baseFallback = pickPreferredBaseOffer(prod, kind, !!trialEverUsed);
      if (baseFallback?.offerToken) return baseFallback.offerToken;

      return null;
    },
    [segment, promoActive, trialEverUsed]
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

          purchasingRef.current = true;

          await RNIap.requestSubscription(baseParams);
          return;
        }

        const prod = productRef.current;

        if (!prod) {
          console.log('[IAP] product not loaded Android');
          return;
        }

        const offerToken = findOfferToken(kind);
        if (!offerToken) {
          console.log('[IAP] no offerToken for', kind);
          return;
        }

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
    [findOfferToken]
  );

  const buyMonthly = useCallback(async () => requestBuy('monthly'), [requestBuy]);
  const buyAnnual = useCallback(async () => requestBuy('annual'), [requestBuy]);

  const PROMO_SEGMENT_BY_CODE = {
    ULPAN2025: 'ulpan',
    NATIV2025: 'nativ',
    PARTNER40: 'partner',
    PROMO30: 'promo',
    TEST90: 'test',
    TIKVA30: 'tikva',
    AUSLENDER30: 'auslender',
    GOLOSISRAEL30: 'golosisrael',
  };

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
      await ensureCodeLoaded();

      if (isIsoActiveNow(codeAccessUntilRef.current)) {
        syncAccessStateRespectingCode(true);
        return true;
      }

      const offlineOk = await tryOfflineEntitlement();
      if (offlineOk) {
        syncAccessStateRespectingCode(true);
      }

      const restored = await restoreActiveSubscription();
      if (restored) {
        syncAccessStateRespectingCode(true);
        return true;
      }

      const offlineAgain = await tryOfflineEntitlement();
      if (offlineAgain) {
        syncAccessStateRespectingCode(true);
        return true;
      }

      syncAccessStateRespectingCode(false);
      return false;
    } catch (e) {
      console.log('[IAP] restore failed=', e?.message || String(e));

      const offlineOk = await tryOfflineEntitlement();
      if (offlineOk) {
        syncAccessStateRespectingCode(true);
        return true;
      }

      syncAccessStateRespectingCode(false);
      return false;
    }
  }, [
    ensureCodeLoaded,
    isIsoActiveNow,
    restoreActiveSubscription,
    syncAccessStateRespectingCode,
    tryOfflineEntitlement,
  ]);

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

/* ===================== Заглушка для сборок без IAP ===================== */
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
      restore: async () => false,

      probePostPurchase: async () => false,

      __devGrantPro,
      __devRevokePro,

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