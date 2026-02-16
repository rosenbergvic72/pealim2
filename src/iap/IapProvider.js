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
import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

/* ===================== Константы / настройки ===================== */
const SKU = Platform.select({ android: 'monthly_ils_10', ios: 'monthly_ils_10' });

/** URL серверной верификации */
const VERIFY_URL =
  Constants?.expoConfig?.extra?.IAP_VERIFY_URL ||
  process.env.EXPO_PUBLIC_IAP_VERIFY_URL ||
  process.env.IAP_VERIFY_URL ||
  '';

const ENTITLEMENTS_URL =
  (Constants?.expoConfig?.extra?.IAP_ENTITLEMENTS_URL ||
    process.env.EXPO_PUBLIC_IAP_ENTITLEMENTS_URL ||
    process.env.IAP_ENTITLEMENTS_URL ||
    (VERIFY_URL
      ? VERIFY_URL.replace(/\/iap\/google\/subscription\/verify\/?$/, '/entitlements')
      : '') ||
    '');

/** Таймаут запроса к верификатору (мс) */
const IAP_VERIFY_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_IAP_VERIFY_TIMEOUT_MS || 4000);
const CODE_ENTITLE_TIMEOUT_MS = 6000;

/** Разрешать офлайн-энтайтлмент до истечения срока, если сервер недоступен */
const ENTITLE_OFFLINE_WHILE_NOT_EXPIRED =
  String(process.env.EXPO_PUBLIC_IAP_ENTITLE_OFFLINE ?? '1') === '1';

const RESTORE_ON_LAUNCH = String(process.env.EXPO_PUBLIC_IAP_RESTORE_ON_LAUNCH || '1') === '1';

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

/** Грейс, если сервер “спит” */
const IAP_SERVER_GRACE_MS = Number(
  process.env.EXPO_PUBLIC_IAP_SERVER_GRACE_MS || 72 * 60 * 60 * 1000
);

/* ===================== Ключи хранения ===================== */
const LAST_TOKEN_KEY = 'iap:lastPurchaseToken';
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
    (Constants?.expoConfig?.extra?.devUnlockAll ?? process.env.EXPO_PUBLIC_DEV_UNLOCK_ALL ?? '0')
  ) === '1';

const OPT_DEV_PRO = __DEV__ || String(process.env.EXPO_PUBLIC_PRO_BYPASS || '0') === '1';
const DEV_STICKY_PRO = String(process.env.EXPO_PUBLIC_DEV_STICKY_PRO || '0') === '1';

/**
 * Теги офферов (Google Play Subscription Offers).
 * - segment: basic / test / ulpan / ...
 * - trial mode: trial5 | notrial
 * - cadence: monthly | annual
 */
function requiredTagsForSegment(segment, cadence /* 'monthly' | 'annual' */, preferNoTrial) {
  if (!segment || segment === 'default') return null;

  // basic: оффер только trial5; после trial — покупаем базовый план (без оффер-тегов)
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

function getPhases(offer) {
  return offer?.pricingPhases?.pricingPhaseList || [];
}

function firstPaidPhase(offer) {
  const phases = getPhases(offer);
  const paid = phases.find((p) => Number(p?.priceAmountMicros ?? 0) > 0);
  if (!paid) return { phase: null, formatted: undefined };
  const formatted =
    paid.formattedPrice || formatPriceFallback(paid.priceAmountMicros, paid.priceCurrencyCode);
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

/**
 * Выбор "базового" оффера:
 * - preferNoTrial=true → пытаемся найти оффер без триала (это и есть monthly_ils_10 / annual-ils-80)
 * - иначе → пытаемся найти оффер с триалом
 * - fallback → самый дешёвый по priceMicros
 */
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

    // если внезапно non-trial нет — берём самый дешёвый
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

function findSegmentOffer(product, requiredTags, kind /* monthly|annual */) {
  if (!requiredTags || !requiredTags.length) return null;
  const periodOffers = pickByPeriod(product, kind);
  const hit = periodOffers.find((o) => requiredTags.every((t) => (o.offerTags || []).includes(t)));
  return hit || null;
}

/* ===================== API helpers ===================== */
async function getSubsSafe() {
  try {
    return await RNIap.getSubscriptions({ skus: [SKU] });
  } catch (e) {
    console.log('[IAP] getSubscriptions error', e);
    return [];
  }
}

/** стабильный userId на устройство */
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
    const lastGood = json?.pro
      ? String(Date.now())
      : (await AsyncStorage.getItem(IAP_LAST_GOOD_PRO_AT)) || '';
    await AsyncStorage.multiSet([
      [IAP_LAST_VERIFY_JSON, JSON.stringify(json || {})],
      [IAP_LAST_VERIFY_AT, String(Date.now())],
      [IAP_LAST_EXPIRES_AT, expiresAt],
      [IAP_LAST_PRO, String(!!json?.pro)],
      [IAP_LAST_GOOD_PRO_AT, lastGood],
    ]);
  } catch {}
}

async function readVerifyCache() {
  try {
    const [raw, at, exp, pro] = await AsyncStorage.multiGet([
      IAP_LAST_VERIFY_JSON,
      IAP_LAST_VERIFY_AT,
      IAP_LAST_EXPIRES_AT,
      IAP_LAST_PRO,
    ]);
    const json = raw?.[1] ? JSON.parse(raw[1]) : null;
    const when = Number(at?.[1] || 0);
    const expiresAt = exp?.[1] || '';
    const lastPro = String(pro?.[1] || 'false') === 'true';
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

/* ===================== Provider ===================== */
export function IapProvider({ children, initialSegment = 'basic' }) {
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(true);
  const [hasPro, setHasPro] = useState(false);
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

  const [debug, setDebug] = useState({ productId: SKU, segment, promoActive });

  const productRef = useRef(null);
  const processed = useRef(new Set());
  const purchasingRef = useRef(false);

  const isIsoActiveNow = useCallback((iso) => {
    if (!iso) return false;
    const t = Date.parse(String(iso));
    if (!Number.isFinite(t)) return false;
    return t > Date.now();
  }, []);

  const setHasProRespectingCode = useCallback(
    (next) => {
      if (next) return setHasPro(true);
      const codeActive = isIsoActiveNow(codeAccessUntilRef.current);
      return setHasPro(codeActive ? true : false);
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
        setHasPro(true);
        setTrialEverUsed(true);
        AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
        return { ok: true, pro: true, accessUntil: until };
      }

      await saveCodeAccessUntil(null);
      setHasProRespectingCode(false);
      return { ok: true, pro: false, accessUntil: null };
    },
    [isIsoActiveNow, saveCodeAccessUntil, setHasProRespectingCode]
  );

  const ensureCodeLoaded = useCallback(async () => {
    if (codeLoadedRef.current) return;
    try {
      const until = await AsyncStorage.getItem(CODE_ACCESS_UNTIL_KEY);
      codeAccessUntilRef.current = until || null;
      setCodeAccessUntil(until || null);
      if (until && isIsoActiveNow(until)) {
        setHasPro(true);
      }
    } catch {} finally {
      codeLoadedRef.current = true;
    }
  }, [isIsoActiveNow]);

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
        setHasPro(true);
        setTrialEverUsed(true);
        AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
        return { ok: true, pro: true, accessUntil: until };
      }

      if (!isIsoActiveNow(codeAccessUntilRef.current)) {
        await saveCodeAccessUntil(null);
        setHasProRespectingCode(false);
      }
      return { ok: true, pro: false, accessUntil: null };
    },
    [fetchCodeEntitlement, isIsoActiveNow, saveCodeAccessUntil, setHasProRespectingCode]
  );

  // trialEverUsed = “на устройстве уже был Pro когда-то”
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

  // стартовый сброс промо на basic
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

  const verifyOnServer = useCallback(async (purchaseToken, productId) => {
    if (!VERIFY_URL || !purchaseToken) return null;

    const uid = await getUserId();
    const payload = {
      userId: uid,
      deviceId: uid,
      productId: productId || SKU,
      packageName: PKG,
      purchaseToken,
    };

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), IAP_VERIFY_TIMEOUT_MS);

    try {
      const resp = await fetch(VERIFY_URL, {
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

      if (!resp.ok) {
        const is5xx = resp.status >= 500 && resp.status <= 599;
        return is5xx ? { offline: true } : null;
      }

      if (json?.ok) {
        await saveVerifyCache(json);
        return json;
      }
      return null;
    } catch (e) {
      return { offline: true };
    } finally {
      clearTimeout(to);
    }
  }, []);

  const recalcPrices = useCallback(
    (reason = 'manual') => {
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

      // base = предпочтение non-trial если trialEverUsed=true
      const baseMonthlyOffer = pickPreferredBaseOffer(prod, 'monthly', trialEverUsed);
      const baseAnnualOffer = pickPreferredBaseOffer(prod, 'annual', trialEverUsed);

      let baseMonthly = firstPaidPhase(baseMonthlyOffer)?.formatted;
      let baseAnnual = firstPaidPhase(baseAnnualOffer)?.formatted;

      // fallback
      if (!baseMonthly) baseMonthly = firstPaidPhase(pickByPeriod(prod, 'monthly')[0])?.formatted;
      if (!baseAnnual) baseAnnual = firstPaidPhase(pickByPeriod(prod, 'annual')[0])?.formatted;

      let segMonthlyOffer = null;
      let segAnnualOffer = null;

      if (promoActive) {
        const segMonthlyTags = getSegmentOfferTags(segment, 'monthly', trialEverUsed);
        const segAnnualTags = getSegmentOfferTags(segment, 'annual', trialEverUsed);

        segMonthlyOffer = segMonthlyTags ? findSegmentOffer(prod, segMonthlyTags, 'monthly') : null;
        segAnnualOffer = segAnnualTags ? findSegmentOffer(prod, segAnnualTags, 'annual') : null;
      }

      const promoMonthly = firstPaidPhase(segMonthlyOffer)?.formatted || baseMonthly;
      const promoAnnual = firstPaidPhase(segAnnualOffer)?.formatted || baseAnnual;

      const newPrices = {
        baseMonthly: baseMonthly || '₪19,90',
        baseAnnual: baseAnnual || '₪159,90',
        promoMonthly: promoMonthly || baseMonthly || '₪13,90',
        promoAnnual: promoAnnual || baseAnnual || '₪111,90',
      };

      setDisplayPrices(newPrices);
      setDebug((d) => ({
        ...d,
        segment,
        promoActive,
        recalcReason: reason,
        displayPrices: newPrices,
      }));
    },
    [segment, promoActive, trialEverUsed]
  );

  const tryOfflineEntitlement = useCallback(async () => {
    if (!ENTITLE_OFFLINE_WHILE_NOT_EXPIRED) return false;
    const { json, when, expiresAt, lastPro } = await readVerifyCache();

    if (json && (expiresAt || json?.expiresAt) && notExpiredBy(expiresAt || json?.expiresAt)) {
      setHasPro(true);
      return true;
    }

    try {
      const lastGoodAt = Number((await AsyncStorage.getItem(IAP_LAST_GOOD_PRO_AT)) || when || 0);
      if ((lastPro || json?.pro) && lastGoodAt && Date.now() - lastGoodAt < IAP_SERVER_GRACE_MS) {
        setHasPro(true);
        setTrialEverUsed(true);
        AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
        return true;
      }
    } catch {}

    return false;
  }, []);

const restoreActiveSubscription = useCallback(async () => {
  try {
    await ensureCodeLoaded();

    if (isIsoActiveNow(codeAccessUntilRef.current)) {
      setHasPro(true);
      setTrialEverUsed(true);
      AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
      return true;
    }

    const uidForCode = userId || (await getUserId());
    if (uidForCode) {
      const synced = await syncCodeEntitlementFromServer(uidForCode);
      if (synced?.pro && isIsoActiveNow(codeAccessUntilRef.current)) {
        return true;
      }
    }

    // === RESTORE FROM STORE (важно: finishTransaction тут тоже) ===
    const purchases = await RNIap.getAvailablePurchases();
    const sub = purchases?.find((p) => p.productId === SKU);

    if (sub?.purchaseToken) {
      // 1) Пытаемся "подтвердить" покупку на клиенте (acknowledge), если она ещё не подтверждена
      //    Это как раз и закрывает кейс "open the app to confirm plan"
      try {
        await RNIap.finishTransaction(sub, false); // подписка => false
      } catch (e) {
        // если уже подтверждено — часто тут просто будет ошибка/ничего страшного
      }

      // 2) Сохраняем токен и верифицируем на сервере
      await AsyncStorage.setItem(LAST_TOKEN_KEY, sub.purchaseToken);

      const v = await verifyOnServer(sub.purchaseToken, sub.productId);
      if (v?.offline) {
        const ok = await tryOfflineEntitlement();
        setHasProRespectingCode(ok);
        return ok;
      }

      if (v?.pro === true) {
        setHasPro(true);
        setTrialEverUsed(true);
        AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
        return true;
      } else if (v !== null) {
        setHasProRespectingCode(false);
        return false;
      }
    }

    // остальная твоя логика (history / saved token / offline) — оставь как есть
    const history = await RNIap.getPurchaseHistory?.();
    if (history) {
      const histSub = history?.find((p) => p.productId === SKU);
      if (histSub?.purchaseToken) {
        await AsyncStorage.setItem(LAST_TOKEN_KEY, histSub.purchaseToken);
        const v = await verifyOnServer(histSub.purchaseToken, histSub.productId);
        if (v?.offline) {
          const ok = await tryOfflineEntitlement();
          setHasProRespectingCode(ok);
          return ok;
        }
        if (v?.pro) {
          setHasPro(true);
          setTrialEverUsed(true);
          AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
          return true;
        } else if (v !== null) {
          setHasProRespectingCode(false);
          return false;
        }
      }
    }

    const saved = await AsyncStorage.getItem(LAST_TOKEN_KEY);
    if (saved) {
      const v = await verifyOnServer(saved, SKU);
      if (v?.offline) {
        const ok = await tryOfflineEntitlement();
        setHasProRespectingCode(ok);
        return ok;
      }
      if (v?.pro) {
        setHasPro(true);
        setTrialEverUsed(true);
        AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
        return true;
      } else if (v !== null) {
        setHasProRespectingCode(false);
        return false;
      }
    }

    const offlineOk = await tryOfflineEntitlement();
    setHasProRespectingCode(offlineOk);
    return offlineOk;
  } catch (e) {
    const offlineOk = await tryOfflineEntitlement();
    setHasProRespectingCode(offlineOk);
    return offlineOk;
  }
}, [
  ensureCodeLoaded,
  isIsoActiveNow,
  syncCodeEntitlementFromServer,
  userId,
  verifyOnServer,
  tryOfflineEntitlement,
  setHasProRespectingCode,
]);


  useEffect(() => {
    let subUpdated, subError;

    (async () => {
      const isIosSim = Platform.OS === 'ios' && !Device.isDevice;
      if (isIosSim) {
        setAvailable(false);
        setReady(true);
        return;
      }

      try {
        await RNIap.initConnection();
        if (Platform.OS === 'android') {
          try {
            await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
          } catch {}
        }

        const subs = await getSubsSafe();
        const prod = subs?.find((p) => p.productId === SKU) || subs?.[0] || null;
        productRef.current = prod;
        setAvailable(!!prod);

        if (prod) recalcPrices('product-loaded');

        if (RESTORE_ON_LAUNCH) {
          await restoreActiveSubscription();
        }

        function isPurchaseCompleted(p) {
          if (Platform.OS === 'android') {
            const state = Number(p?.purchaseStateAndroid ?? 0);
            return state === 1 && !!p?.purchaseToken;
          }
          return !!(p?.transactionId || p?.transactionReceipt);
        }

        subUpdated = RNIap.purchaseUpdatedListener(async (purchase) => {
          try {
            if (!purchase) return;

            const { productId, transactionId, purchaseToken } = purchase;
            if (productId !== SKU) return;
            if (!isPurchaseCompleted(purchase)) return;

            const dedupeKey = purchaseToken || transactionId;
            if (!dedupeKey) return;
            if (processed.current.has(dedupeKey)) return;
            processed.current.add(dedupeKey);

            try {
              await RNIap.finishTransaction(purchase, false);
            } catch {}

            try {
              if (purchaseToken) await AsyncStorage.setItem(LAST_TOKEN_KEY, purchaseToken);
              await AsyncStorage.multiSet([
                [IAP_LAST_PRO, 'true'],
                [IAP_LAST_GOOD_PRO_AT, String(Date.now())],
                [TRIAL_EVER_USED_KEY, 'true'],
              ]);
            } catch {}

            if (OPT_DEV_PRO) {
              setHasPro(true);
              setTrialEverUsed(true);
              setJustPurchased(true);
              setShouldShowPost(true);
              try {
                await AsyncStorage.multiSet([
                  [POST_STATE_KEY, 'pending'],
                  [LAST_PURCHASE_AT_KEY, String(Date.now())],
                ]);
              } catch {}
            }

            let verified = null;
            if (VERIFY_URL && purchaseToken) {
              verified = await verifyOnServer(purchaseToken, productId);
            }

            if (verified?.offline) {
              const ok = await tryOfflineEntitlement();
              setHasProRespectingCode(ok);
              setJustPurchased(ok);
              setShouldShowPost(ok);
            } else if (!OPT_DEV_PRO) {
              const ok = !!verified?.pro;
              if (ok) {
                setTrialEverUsed(true);
                AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
              }
              setHasProRespectingCode(ok);
              setJustPurchased(ok);
              setShouldShowPost(ok);
            } else {
              if (!DEV_STICKY_PRO) {
                const ok = !!verified?.pro;
                setHasProRespectingCode(ok);
                setJustPurchased(ok);
                setShouldShowPost(ok);
              }
            }
          } finally {
            purchasingRef.current = false;
          }
        });

        subError = RNIap.purchaseErrorListener(() => {
          purchasingRef.current = false;
        });

        setReady(true);
      } catch (e) {
        setAvailable(false);
        setReady(true);
      }
    })();

    return () => {
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
  }, [recalcPrices, restoreActiveSubscription, verifyOnServer, tryOfflineEntitlement]);

  useEffect(() => {
    if (productRef.current) recalcPrices('segment-or-promo-changed');
  }, [segment, promoActive, recalcPrices]);

  const findOfferToken = useCallback(
    (kind) => {
      const prod = productRef.current;
      if (!prod?.subscriptionOfferDetails?.length) return null;

      // 1) Без промо: берём базовый preferred (после trial → non-trial base plan)
      if (!promoActive) {
        const basePref = pickPreferredBaseOffer(prod, kind, !!trialEverUsed);
        if (basePref?.offerToken) return basePref.offerToken;
      }

      // 2) Промо: по тегам
      const required = promoActive ? getSegmentOfferTags(segment, kind, !!trialEverUsed) : null;
      const segOffer = findSegmentOffer(prod, required, kind);
      if (segOffer?.offerToken) return segOffer.offerToken;

      // 3) Fallback: любой по периоду
      const byPeriod = pickByPeriod(prod, kind)[0];
      if (byPeriod?.offerToken) return byPeriod.offerToken;

      // 4) Последний шанс
      const baseFallback = pickPreferredBaseOffer(prod, kind, !!trialEverUsed);
      if (baseFallback?.offerToken) return baseFallback.offerToken;

      return null;
    },
    [segment, promoActive, trialEverUsed]
  );

  const requestBuy = useCallback(
    async (kind) => {
      try {
        const prod = productRef.current;
        if (!prod) {
          Alert.alert('Store unavailable', 'Subscription details are not loaded yet.');
          return;
        }
        const offerToken = findOfferToken(kind);
        if (!offerToken) {
          Alert.alert('Plan not available', 'Selected plan is currently unavailable.');
          return;
        }

        purchasingRef.current = true;

        const baseParams = {
          sku: SKU,
          andDangerouslyFinishTransactionAutomatically: false,
        };

        if (Platform.OS === 'android') {
          await RNIap.requestSubscription({
            ...baseParams,
            subscriptionOffers: [{ sku: SKU, offerToken }],
          });
        } else {
          await RNIap.requestSubscription(baseParams);
        }
      } catch (e) {
        Alert.alert('Purchase Error', e?.message || 'Failed to start purchase process');
        purchasingRef.current = false;
      }
    },
    [findOfferToken]
  );

  const buyMonthly = useCallback(async () => requestBuy('monthly'), [requestBuy]);
  const buyAnnual = useCallback(async () => requestBuy('annual'), [requestBuy]);

  /* ---- Промокоды → сегменты ---- */
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
      return await restoreActiveSubscription();
    } catch {
      const offlineOk = await tryOfflineEntitlement();
      setHasProRespectingCode(offlineOk);
      return offlineOk;
    }
  }, [restoreActiveSubscription, tryOfflineEntitlement, setHasProRespectingCode]);

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
    setHasPro(true);
    setTrialEverUsed(true);
    AsyncStorage.setItem(TRIAL_EVER_USED_KEY, 'true').catch(() => {});
    setJustPurchased(false);
    setShouldShowPost(false);
  }, []);

  const __devRevokePro = useCallback(async () => {
    if (!devSessionAllowed) return;
    setHasProRespectingCode(false);
  }, [devSessionAllowed, setHasProRespectingCode]);

  const value = useMemo(
    () => ({
      ready,
      available,
      hasPro,
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
      (Constants?.expoConfig?.extra?.devUnlockAll ?? process.env.EXPO_PUBLIC_DEV_UNLOCK_ALL ?? '0')
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
