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

/* ===================== Константы / настройки ===================== */
const SKU = Platform.select({ android: 'monthly_ils_10', ios: 'monthly_ils_10' });

/** URL серверной верификации */
const VERIFY_URL =
  Constants?.expoConfig?.extra?.IAP_VERIFY_URL ||
  process.env.EXPO_PUBLIC_IAP_VERIFY_URL ||
  process.env.IAP_VERIFY_URL ||
  '';

/** Таймаут запроса к верификатору (мс) */
const IAP_VERIFY_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_IAP_VERIFY_TIMEOUT_MS || 4000);

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

/** ★ added: грейс, если сервер «спит», даже без expiresAt */
const IAP_SERVER_GRACE_MS = Number(process.env.EXPO_PUBLIC_IAP_SERVER_GRACE_MS || 72 * 60 * 60 * 1000);

/* ===================== Ключи хранения ===================== */
const LAST_TOKEN_KEY          = 'iap:lastPurchaseToken';
const PROMO_ACTIVE_KEY        = 'iap:promoActive';
const LAST_PURCHASE_AT_KEY    = 'iap:lastPurchaseAt';
const POST_SHOWN_AT_KEY       = 'iap:postShownAt';
const POST_STATE_KEY          = 'iap:postState';        // 'none' | 'pending' | 'shown'

const IAP_LAST_VERIFY_JSON    = 'iap:lastVerifyJson';
const IAP_LAST_VERIFY_AT      = 'iap:lastVerifyAt';
const IAP_LAST_EXPIRES_AT     = 'iap:lastExpiresAt';
const IAP_LAST_PRO            = 'iap:lastPro';
/** ★ added: когда в последний раз pro было «хорошо подтверждено/получено» */
const IAP_LAST_GOOD_PRO_AT    = 'iap:lastGoodProAt';

/* ===== DEV флаги ===== */
const devSessionAllowed =
  __DEV__ ||
  String(
    (Constants?.expoConfig?.extra?.devUnlockAll ?? process.env.EXPO_PUBLIC_DEV_UNLOCK_ALL ?? '0')
  ) === '1';

// мгновенное включение Pro в DEV
const OPT_DEV_PRO =
  __DEV__ ||
  String(process.env.EXPO_PUBLIC_PRO_BYPASS || '0') === '1';

// «липкий» Pro в DEV (не понижать после ответа сервера)
const DEV_STICKY_PRO = String(process.env.EXPO_PUBLIC_DEV_STICKY_PRO || '0') === '1';

/** Теги офферов */
const TAG_MAP = {
  basic:   { monthly: ['basic', 'monthly'],   annual: ['basic', 'annual'] },
  promo:   { monthly: ['promo', 'monthly'],   annual: ['promo', 'annual'] },
  ulpan:   { monthly: ['ulpan', 'monthly'],   annual: ['ulpan', 'annual'] },
  nativ:   { monthly: ['nativ', 'monthly'],   annual: ['nativ', 'annual'] },
  partner: { monthly: ['partner', 'monthly'], annual: ['partner', 'annual'] },
  test:    { monthly: ['test', 'monthly'],    annual: ['test', 'annual'] },
  tikva:   { monthly: ['tikva', 'monthly'],   annual: ['tikva', 'annual'] },
  timur:   { monthly: ['timur', 'monthly'],   annual: ['timur', 'annual'] },
  kala:   { monthly: ['kala', 'monthly'],   annual: ['kala', 'annual'] },
  default: { monthly: null,                   annual: null },
};

/* ===================== Контекст ===================== */
const IapContext = createContext({
  ready: false,
  available: true,
  hasPro: false,

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
    paid.formattedPrice ||
    formatPriceFallback(paid.priceAmountMicros, paid.priceCurrencyCode);
  return { phase: paid, formatted };
}
function hasMonthlyPeriod(offer) {
  const phases = getPhases(offer);
  const last = phases[phases.length - 1];
  const bp = last?.billingPeriod || '';
  return (
    bp.includes('P1M') ||
    (last?.billingCycleCount === 1 && bp.includes('P1M')) ||
    phases.some((p) => p.billingPeriod?.includes('P1M'))
  );
}
function hasAnnualPeriod(offer) {
  const phases = getPhases(offer);
  const last = phases[phases.length - 1];
  const bp = last?.billingPeriod || '';
  return (
    bp.includes('P1Y') ||
    (last?.billingCycleCount === 1 && bp.includes('P1Y')) ||
    phases.some((p) => p.billingPeriod?.includes('P1Y'))
  );
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
function pickPreferredBaseOffer(product, kind) {
  const periodOffers = pickByPeriod(product, kind);
  if (!periodOffers.length) return null;
  const tags = kind === 'monthly' ? ['basic', 'monthly'] : ['basic', 'annual'];
  const strict = periodOffers.find(
    (o) => (o.offerTags || []).length && tags.every((t) => o.offerTags.includes(t)),
  );
  if (strict) return strict;
  const byId = periodOffers.find(
    (o) =>
      String(o.offerId || '').toLowerCase().includes('trial') ||
      String(o.basePlanId || '').toLowerCase().includes('trial'),
  );
  if (byId) return byId;
  const withTrial = periodOffers.filter(hasFreeTrial);
  if (withTrial.length) {
    return (
      withTrial
        .map((o) => ({ o, m: priceMicrosOf(o) }))
        .filter((x) => x.m > 0)
        .sort((a, b) => a.m - b.m)[0]?.o || withTrial[0]
    );
  }
  return (
    periodOffers
      .map((o) => ({ o, m: priceMicrosOf(o) })).
      filter((x) => x.m > 0).
      sort((a, b) => a.m - b.m)[0]?.o || periodOffers[0]
  );
}
function findSegmentOffer(product, requiredTags, kind, segment) {
  const periodOffers = pickByPeriod(product, kind);
  if (!periodOffers.length) return null;
  if (requiredTags?.length) {
    const strict = periodOffers.find(
      (o) => (o.offerTags || []).length && requiredTags.every((t) => o.offerTags.includes(t)),
    );
    if (strict) return strict;
  }
  const needle = String(segment || '').toLowerCase();
  if (needle) {
    const byId = periodOffers.find(
      (o) =>
        String(o.offerId || '').toLowerCase().includes(needle) ||
        String(o.basePlanId || '').toLowerCase().includes(needle),
    );
    if (byId) return byId;
  }
  if (segment && segment !== 'basic') {
    return (
      periodOffers
        .map((o) => ({ o, m: priceMicrosOf(o) }))
        .filter((x) => x.m > 0)
        .sort((a, b) => a.m - b.m)[0]?.o || periodOffers[0]
    );
  }
  return periodOffers[0];
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
async function getUserId() {
  // подставьте свой userId, если есть аккаунтинг
  return 'test-user-1';
}

/* ===================== Вспомогательные: офлайн-кеш ===================== */
/** ★ changed: сохраняем ещё и "lastGoodProAt" */
async function saveVerifyCache(json) {
  try {
    const expiresAt = json?.expiresAt ? String(json.expiresAt) : '';
    const lastGood  = json?.pro
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

/* ===================== Провайдер ===================== */
export function IapProvider({ children, initialSegment = 'basic' }) {
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(true);
  const [hasPro, setHasPro] = useState(false);

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

  const [debug, setDebug] = useState({ productId: SKU, offers: [], segment, promoActive });

  const productRef = useRef(null);
  const processed = useRef(new Set());
  const purchasingRef = useRef(false);

  /* ---- стартовые сбросы ---- */
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

  /* ---- verify: с таймаутом и кешированием ---- */
  const verifyOnServer = useCallback(async (purchaseToken, productId) => {
    if (!VERIFY_URL || !purchaseToken) return null;

    const payload = {
      userId: await getUserId(),
      productId: productId || SKU,
      packageName: PKG,
      purchaseToken,
    };

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), IAP_VERIFY_TIMEOUT_MS);

    try {
      console.log('[IAP] remote verify request ->', {
        url: VERIFY_URL,
        pkg: PKG,
        hasToken: !!purchaseToken,
        productId: productId || SKU,
        timeoutMs: IAP_VERIFY_TIMEOUT_MS,
      });

      const resp = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(API_KEY_HEADER ? { 'x-api-key': API_KEY_HEADER } : {}),
        },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });

      const text = await resp.text();
      let json;
      try { json = JSON.parse(text); } catch { json = null; }

      if (!resp.ok) {
        const is5xx = resp.status >= 500 && resp.status <= 599;
        console.log('[IAP] verify non-2xx', { status: resp.status, treatAsOffline: is5xx });
        return is5xx ? { offline: true } : null;
      }

      console.log('[IAP] remote verify response <-', { status: resp.status, json: json ?? text });
      if (json?.ok) {
        await saveVerifyCache(json);            // ★ keep cache fresh
        return json;
      }
      return null;
    } catch (e) {
      console.log('[IAP] remote verify failed (offline/timeout?):', e?.message || e);
      return { offline: true };                 // ★ offline mode
    } finally {
      clearTimeout(to);
    }
  }, []);

  /* ---- перерасчёт цен ---- */
  const recalcPrices = useCallback(
    (reason = 'manual') => {
      const prod = productRef.current;

      if (!prod?.subscriptionOfferDetails?.length) {
        console.log('[IAP] Prices recalc skip (no offers), reason:', reason);
        setDisplayPrices({
          baseMonthly: undefined,
          baseAnnual: undefined,
          promoMonthly: undefined,
          promoAnnual: undefined,
        });
        return;
      }

      const baseMonthlyOffer = pickPreferredBaseOffer(prod, 'monthly');
      const baseAnnualOffer  = pickPreferredBaseOffer(prod, 'annual');

      let baseMonthly = firstPaidPhase(baseMonthlyOffer)?.formatted;
      let baseAnnual  = firstPaidPhase(baseAnnualOffer)?.formatted;

      if (!baseMonthly) {
        const anyM = pickByPeriod(prod, 'monthly')[0];
        baseMonthly = firstPaidPhase(anyM)?.formatted || baseMonthly;
      }
      if (!baseAnnual) {
        const anyY = pickByPeriod(prod, 'annual')[0];
        baseAnnual = firstPaidPhase(anyY)?.formatted || baseAnnual;
      }

      let segMonthlyOffer = null;
      let segAnnualOffer  = null;
      if (promoActive) {
        const segTags = TAG_MAP[segment];
        segMonthlyOffer = segTags
          ? findSegmentOffer(prod, segTags.monthly, 'monthly', segment)
          : null;
        segAnnualOffer  = segTags
          ? findSegmentOffer(prod, segTags.annual, 'annual', segment)
          : null;
      }

      const promoMonthly = firstPaidPhase(segMonthlyOffer)?.formatted || baseMonthly;
      const promoAnnual  = firstPaidPhase(segAnnualOffer )?.formatted || baseAnnual;

      const newPrices = {
        baseMonthly: baseMonthly || '₪19,90',
        baseAnnual:  baseAnnual  || '₪159,90',
        promoMonthly: promoMonthly || baseMonthly || '₪13,90',
        promoAnnual:  promoAnnual  || baseAnnual  || '₪111,90',
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
    [segment, promoActive],
  );

  /* ---- офлайн-энтайтлмент из кеша ---- */
  const tryOfflineEntitlement = useCallback(async () => {
    if (!ENTITLE_OFFLINE_WHILE_NOT_EXPIRED) return false;
    const { json, when, expiresAt, lastPro } = await readVerifyCache();

    // 1) если есть валидный expiresAt — пускаем
    if (json && (expiresAt || json?.expiresAt) && notExpiredBy(expiresAt || json?.expiresAt)) {
      console.log('[IAP] OFFLINE ENTITLEMENT by expiresAt until', expiresAt || json?.expiresAt);
      setHasPro(true);
      return true;
    }

    // 2) нет expiresAt, но pro уже было и это было недавно → грейс
    try {
      const lastGoodAt = Number((await AsyncStorage.getItem(IAP_LAST_GOOD_PRO_AT)) || when || 0);
      if ((lastPro || json?.pro) && lastGoodAt && Date.now() - lastGoodAt < IAP_SERVER_GRACE_MS) {
        console.log('[IAP] OFFLINE GRACE by lastGoodProAt', { lastGoodAt, graceMs: IAP_SERVER_GRACE_MS });
        setHasPro(true);
        return true;
      }
    } catch {}

    return false;
  }, []);

  /* ---- восстановление/проверка активной подписки ---- */
  const restoreActiveSubscription = useCallback(async () => {
    try {
      // 1) прямые доступные покупки
      const purchases = await RNIap.getAvailablePurchases();
      const sub = purchases?.find((p) => p.productId === SKU);

      if (sub?.purchaseToken) {
        await AsyncStorage.setItem(LAST_TOKEN_KEY, sub.purchaseToken);
        const v = await verifyOnServer(sub.purchaseToken, sub.productId);
        if (v?.offline) {
          const ok = await tryOfflineEntitlement();
          setHasPro(ok);
          return ok;
        }
        if (v?.pro === true) {
          setHasPro(true);
          return true;
        } else if (v !== null) {
          setHasPro(false);
          return false;
        }
      }

      // 2) история покупок
      const history = await RNIap.getPurchaseHistory?.();
      if (history) {
        const histSub = history?.find((p) => p.productId === SKU);
        if (histSub?.purchaseToken) {
          await AsyncStorage.setItem(LAST_TOKEN_KEY, histSub.purchaseToken);
          const v = await verifyOnServer(histSub.purchaseToken, histSub.productId);
          if (v?.offline) {
            const ok = await tryOfflineEntitlement();
            setHasPro(ok);
            return ok;
          }
          if (v?.pro) {
            setHasPro(true);
            return true;
          } else if (v !== null) {
            setHasPro(false);
            return false;
          }
        }
      }

      // 3) сохранённый токен
      const saved = await AsyncStorage.getItem(LAST_TOKEN_KEY);
      if (saved) {
        const v = await verifyOnServer(saved, SKU);
        if (v?.offline) {
          const ok = await tryOfflineEntitlement();
          setHasPro(ok);
          return ok;
        }
        if (v?.pro) {
          setHasPro(true);
          return true;
        } else if (v !== null) {
          setHasPro(false);
          return false;
        }
      }

      // 4) полностью офлайн без токена — пробуем кеш как последний шанс
      const offlineOk = await tryOfflineEntitlement();
      setHasPro(offlineOk);
      return offlineOk;
    } catch (e) {
      console.log('[IAP] restoreActiveSubscription error', e);
      const offlineOk = await tryOfflineEntitlement();
      setHasPro(offlineOk);
      return offlineOk;
    }
  }, [verifyOnServer, tryOfflineEntitlement]);

  /* ---- init IAP + загрузка продукта + listeners ---- */
  useEffect(() => {
    let subUpdated, subError;

    (async () => {
      try {
        await RNIap.initConnection();
        if (Platform.OS === 'android') {
          try { await RNIap.flushFailedPurchasesCachedAsPendingAndroid(); } catch {}
        }

        const subs = await getSubsSafe();
        const prod = subs?.find((p) => p.productId === SKU) || subs?.[0] || null;
        productRef.current = prod;
        setAvailable(!!prod);

        if (prod) {
          console.log('[IAP] Product loaded:', {
            productId: prod?.productId,
            offersCount: prod?.subscriptionOfferDetails?.length || 0,
            offers: (prod?.subscriptionOfferDetails || []).map((o) => ({
              offerId: o.offerId,
              basePlanId: o.basePlanId,
              tags: o.offerTags,
              token: (o.offerToken || '').slice(0, 10) + (o.offerToken ? '…' : ''),
              firstPhase: getPhases(o)?.[0]?.billingPeriod,
              fp: getPhases(o)?.[0]?.formattedPrice,
              micros: getPhases(o)?.[0]?.priceAmountMicros,
              cur: getPhases(o)?.[0]?.priceCurrencyCode,
              lastPhaseBilling: getPhases(o).at(-1)?.billingPeriod,
              hasTrial: hasFreeTrial(o),
            })),
          });

          recalcPrices('product-loaded');
        } else {
          console.log('[IAP] Product not found for SKU', SKU);
        }

        if (RESTORE_ON_LAUNCH) {
          await restoreActiveSubscription();
        }

        // purchase listeners
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

            const {
              productId,
              transactionId,
              purchaseToken,
              purchaseStateAndroid,
            } = purchase;

            console.log('[IAP] purchaseUpdated', {
              productId,
              hasTxId: !!transactionId,
              hasToken: !!purchaseToken,
              stateAndroid: purchaseStateAndroid,
            });

            if (productId !== SKU) return;

            if (!isPurchaseCompleted(purchase)) {
              console.log('[IAP] purchase not completed yet (pending). Waiting for next update…');
              return;
            }

            const dedupeKey = purchaseToken || transactionId;
            if (!dedupeKey) return;
            if (processed.current.has(dedupeKey)) return;
            processed.current.add(dedupeKey);

            try { await RNIap.finishTransaction(purchase, true); } catch (e) {
              console.log('[IAP] finishTransaction error (non-fatal):', e?.message || e);
            }

            try {
              if (purchaseToken) {
                await AsyncStorage.setItem(LAST_TOKEN_KEY, purchaseToken);
              }
            } catch {}

            /** ★ added: отметим местный «last good pro», даже если сервер спит */
            try {
              await AsyncStorage.multiSet([
                [IAP_LAST_PRO, 'true'],
                [IAP_LAST_GOOD_PRO_AT, String(Date.now())],
              ]);
            } catch {}

            // DEV: можно включить Pro сразу (опционально)
            if (OPT_DEV_PRO) {
              setHasPro(true);
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
            try {
              if (VERIFY_URL) {
                verified = await verifyOnServer(purchaseToken, productId);
              }
            } catch {}

            if (verified?.offline) {
              /** ★ added: сервер не доступен — усиливаем шанс офлайн-грейса */
              try {
                await AsyncStorage.setItem(IAP_LAST_GOOD_PRO_AT, String(Date.now()));
                await AsyncStorage.setItem(IAP_LAST_PRO, 'true');
              } catch {}
              const ok = await tryOfflineEntitlement();
              setHasPro(ok);
              setJustPurchased(ok);
              setShouldShowPost(ok);
            } else if (!OPT_DEV_PRO) {
              const ok = !!verified?.pro;
              setHasPro(ok);
              setJustPurchased(ok);
              setShouldShowPost(ok);
            } else {
              if (!DEV_STICKY_PRO) {
                const ok = !!verified?.pro;
                setHasPro(ok);
                setJustPurchased(ok);
                setShouldShowPost(ok);
              }
            }

            console.log('[IAP] purchase completed — Pro', OPT_DEV_PRO ? '(dev)' : '(prod)', '→', hasPro);
          } catch (e) {
            console.error('[IAP] purchaseUpdated handler error:', e);
          } finally {
            purchasingRef.current = false;
          }
        });

        subError = RNIap.purchaseErrorListener((e) => {
          console.log('[IAP] purchase error', e);
          purchasingRef.current = false;
        });

        setReady(true);
      } catch (e) {
        console.log('[IAP] init error', e);
        setAvailable(false);
        setReady(true);
      }
    })();

    return () => {
      try { subUpdated?.remove(); } catch {}
      try { subError?.remove(); } catch {}
      try { RNIap.endConnection(); } catch {}
    };
  }, [recalcPrices, restoreActiveSubscription, verifyOnServer, tryOfflineEntitlement]);

  /* ---- пересчёт при смене сегмента/флага промо ---- */
  useEffect(() => {
    if (productRef.current) recalcPrices('segment-or-promo-changed');
  }, [segment, promoActive, recalcPrices]);

  /* ---- выбор токена оффера ---- */
  const findOfferToken = useCallback(
    (kind) => {
      const prod = productRef.current;
      if (!prod?.subscriptionOfferDetails?.length) {
        console.log('[IAP] No offers available for purchase');
        return null;
      }
      if (!promoActive) {
        const basePref = pickPreferredBaseOffer(prod, kind);
        if (basePref?.offerToken) {
          console.log('[IAP] Using BASIC preferred offer (trial-first)');
          return basePref.offerToken;
        }
      }
      const required = TAG_MAP[segment]?.[kind] ?? null;
      const segOffer = findSegmentOffer(prod, required, kind, segment);
      if (segOffer?.offerToken) {
        console.log('[IAP] Found segment offer token:', {
          token: segOffer.offerToken.slice(0, 10) + '…',
          tags: segOffer.offerTags,
        });
        return segOffer.offerToken;
      }
      const byPeriod = pickByPeriod(prod, kind)[0];
      if (byPeriod?.offerToken) {
        console.log('[IAP] Using period fallback token');
        return byPeriod.offerToken;
      }
      const baseFallback = pickPreferredBaseOffer(prod, kind);
      if (baseFallback?.offerToken) {
        console.log('[IAP] Using basic fallback offer');
        return baseFallback.offerToken;
      }
      console.log('[IAP] No suitable offer found');
      return null;
    },
    [segment, promoActive],
  );

  /* ---- покупка ---- */
  const requestBuy = useCallback(
    async (kind) => {
      try {
        const prod = productRef.current;
        if (!prod) {
          Alert.alert('Store unavailable', 'Subscription details are not loaded yet.');
          return;
        }
        const offerToken = findOfferToken(kind);
        console.log('[IAP] Starting purchase:', { kind, segment, promoActive, hasOfferToken: !!offerToken });
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
        console.log('[IAP] Purchase flow started');
      } catch (e) {
        console.error('[IAP] Purchase failed:', e);
        Alert.alert('Purchase Error', e?.message || 'Failed to start purchase process');
        purchasingRef.current = false;
      }
    },
    [findOfferToken, segment, promoActive],
  );

  const buyMonthly = useCallback(async () => { await requestBuy('monthly'); }, [requestBuy]);
  const buyAnnual  = useCallback(async () => { await requestBuy('annual');  }, [requestBuy]);

  /* ---- Промокоды → сегменты ---- */
  const PROMO_SEGMENT_BY_CODE = {
    ULPAN2025: 'ulpan',
    NATIV2025: 'nativ',
    PARTNER40: 'partner',
    PROMO30:   'promo',
    TEST90:    'test',
    TIKVA30:   'tikva',
  };

  const applyPromoCode = useCallback(async (code) => {
    const key = String(code || '').trim().toUpperCase();
    const seg = PROMO_SEGMENT_BY_CODE[key];
    if (!seg) {
      console.log('[IAP] Promo code not found:', key);
      return false;
    }
    console.log('[IAP] Applying promo code:', { code: key, segment: seg });
    setSegment(seg);
    setPromoActive(true);
    await AsyncStorage.setItem(PROMO_ACTIVE_KEY, '1');
    recalcPrices('promo-applied');
    return true;
  }, [recalcPrices]);

  /* ---- Редемпшен / восстановление ---- */
  const openRedeem = useCallback(async () => {
    try {
      if (Platform.OS === 'ios' && RNIap.presentCodeRedemptionSheet) {
        await RNIap.presentCodeRedemptionSheet();
      } else {
        await Linking.openURL('https://play.google.com/redeem');
      }
    } catch (e) {
      console.log('[IAP] redeem open error', e);
    }
  }, []);

  const restore = useCallback(async () => {
    try {
      console.log('[IAP] Starting restore process');
      const ok = await restoreActiveSubscription();
      if (!ok) console.log('[IAP] No active purchases found (or verification failed)');
      return ok;
    } catch (e) {
      console.error('[IAP] restore error:', e);
      const offlineOk = await tryOfflineEntitlement();
      setHasPro(offlineOk);
      return offlineOk;
    }
  }, [restoreActiveSubscription, tryOfflineEntitlement]);

  /* ---- пост-экран после покупки ---- */
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

  /* ---- публичный «геттер» пост-модалки ---- */
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

  /* ---- DEV helpers ---- */
  const __devGrantPro = useCallback(async () => {
    if (!devSessionAllowed) return;
    setHasPro(true);
    setJustPurchased(false);
    setShouldShowPost(false);
  }, [devSessionAllowed]);
  const __devRevokePro = useCallback(async () => {
    if (!devSessionAllowed) return;
    setHasPro(false);
  }, [devSessionAllowed]);

  /* ---- value ---- */
  const value = useMemo(
    () => ({
      ready,
      available,
      hasPro,

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
      restore,
      probePostPurchase,
      __devGrantPro,
      __devRevokePro,
      displayPrices,
      debug,
    ],
  );

  return <IapContext.Provider value={value}>{children}</IapContext.Provider>;
}

/* ===================== Заглушка для сборок без IAP (Expo) ===================== */
export function NoIapProvider({ children }) {
  const [mockPro, setMockPro] = useState(false);

  const devAllowed =
    __DEV__ ||
    String(
      (Constants?.expoConfig?.extra?.devUnlockAll ??
        process.env.EXPO_PUBLIC_DEV_UNLOCK_ALL ??
        '0')
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
        baseAnnual:  undefined,
        promoMonthly: undefined,
        promoAnnual:  undefined,
      },

      _debug: { mock: true },
    }),
    [mockPro, __devGrantPro, __devRevokePro],
  );

  return <IapContext.Provider value={value}>{children}</IapContext.Provider>;
}
