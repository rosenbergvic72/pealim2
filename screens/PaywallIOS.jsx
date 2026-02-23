// screens/PaywallIOS.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as RNIap from 'react-native-iap';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { useIap } from '../src/iap/IapProvider';

// ★ Ограничение автоскейла шрифтов
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.maxFontSizeMultiplier = 1.2;
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.maxFontSizeMultiplier = 1.2;

/* ===================== iOS константы ===================== */
const IOS_TRIAL_DAYS = 7;

// iOS links
const PRIVACY_URL = 'https://verbifyapp.netlify.app/';
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

// codes
const PARTNER_REDEEM_URL = 'https://iap-server.onrender.com/redeem/code';
const GATE_SNOOZE_KEY = 'iap:gateSnoozeUntil';
const GATE_SNOOZE_MS = 5000;
const RESTORE_THROTTLE_MS = 60000;

function normalizeAccessCode(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^\w-]/g, '');
}
function looksLikeAccessCode(code) {
  if (!code) return false;
  if (code.length < 8 || code.length > 32) return false;
  return /^[A-Z0-9_-]+$/.test(code);
}
async function redeemPartnerCodeOnServer({ code, userId }) {
  const res = await fetch(PARTNER_REDEEM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, userId }),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  if (!res.ok) {
    return {
      ok: false,
      message: (json && (json.message || json.error)) || `HTTP ${res.status}`,
    };
  }
  return {
    ok: !!json?.ok,
    message: json?.message || '',
    accessUntil: json?.accessUntil || null,
  };
}

async function writeGateSnooze(ms = GATE_SNOOZE_MS) {
  try {
    await AsyncStorage.setItem(GATE_SNOOZE_KEY, String(Date.now() + ms));
  } catch {}
}
async function isGateSnoozed() {
  try {
    const raw = await AsyncStorage.getItem(GATE_SNOOZE_KEY);
    const until = Number(raw || 0);
    const ok = Number.isFinite(until) && Date.now() < until;
    if (!ok) await AsyncStorage.removeItem(GATE_SNOOZE_KEY);
    return ok;
  } catch {
    return false;
  }
}

/* ===================== Локализация (iOS-only) ===================== */
const STR = {
  english: {
    choosePlan: 'Choose a plan',
    monthly: 'Monthly',
    annual: 'Annual',
    subscribe: 'SUBSCRIBE',
    fullAccessAll: 'Full access • All exercises',

    // header (trial показываем только если available=true и trial разрешён)
    headerTrial: '7-DAY FREE TRIAL (for new subscribers).',
    headerNoTrial:
      'Subscription. Pick a plan and tap SUBSCRIBE. You can cancel anytime in App Store, or tap CONTINUE FOR FREE.',
    headerTrialTail:
      ' Pick a plan and tap SUBSCRIBE. Trial (if available) will be shown in the App Store sheet. You can cancel anytime in App Store, or tap CONTINUE FOR FREE.',

    freePreview: 'CONTINUE FOR FREE',
    freePreviewSubtitle: 'Train 350 Hebrew verbs',
    limitedAccess: 'Limited access',
    exercises12: 'Exercises 1 & 2',

    redeemUnderCta: 'Activate code',
    restore: 'Restore access',

    accessCodeLink: 'Enter access code (school/course)',
    redeemTitle: 'Activate access code',
    redeemHint: 'Enter the access code you received from a school, course, or teacher.',
    redeemPlaceholder: 'ACCESS-CODE',
    redeemBtn: 'Activate',
    redeemCancel: 'Cancel',
    redeemWorking: 'Activating…',
    redeemInvalid: 'Please enter a valid code.',
    redeemSuccessBody: 'Done! Pro access is active.',

    privacy: 'Privacy Policy',
    terms: 'Terms of Use',

    iosLegalText:
      'Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. You can manage and cancel your subscription in your App Store account settings.',

    storeUnavailableTitle: 'Store unavailable',
    storeUnavailableBody:
      'Subscriptions are not loaded on this device. Please reinstall TestFlight build and make sure In-App Purchases are attached to the build in App Store Connect.',
  },

  русский: {
    choosePlan: 'Выберите план',
    monthly: 'Помесячно',
    annual: 'На год',
    subscribe: 'ОФОРМИТЬ ПОДПИСКУ',
    fullAccessAll: 'Полный доступ • Все упражнения',

    headerTrial: '7 ДНЕЙ БЕСПЛАТНОГО ДОСТУПА (для новых подписчиков).',
    headerNoTrial:
      'Подписка. Выберите план и нажмите ОФОРМИТЬ ПОДПИСКУ. Отменить можно в любой момент в App Store, или нажмите ПРОДОЛЖИТЬ БЕСПЛАТНО.',
    headerTrialTail:
      ' Выберите план и нажмите ОФОРМИТЬ ПОДПИСКУ. Триал (если доступен) будет показан в системном окне App Store. Отменить можно в любой момент в App Store, или нажмите ПРОДОЛЖИТЬ БЕСПЛАТНО.',

    freePreview: 'ПРОДОЛЖИТЬ БЕСПЛАТНО',
    freePreviewSubtitle: 'Тренируйте 350 глаголов иврита',
    limitedAccess: 'Ограниченный доступ',
    exercises12: 'Упражнения 1 и 2',

    redeemUnderCta: 'Активировать код',
    restore: 'Восстановить доступ',

    accessCodeLink: 'Ввести код доступа (школа/курс)',
    redeemTitle: 'Активация кода доступа',
    redeemHint: 'Введите код доступа, который вы получили от школы, курса или преподавателя.',
    redeemPlaceholder: 'КОД-ДОСТУПА',
    redeemBtn: 'Активировать',
    redeemCancel: 'Отмена',
    redeemWorking: 'Активируем…',
    redeemInvalid: 'Введите корректный код.',
    redeemSuccessBody: 'Готово! Доступ Pro активен.',

    privacy: 'Политика конфиденциальности',
    terms: 'Условия использования',

    iosLegalText:
      'Оплата будет списана с вашего Apple ID после подтверждения покупки. Подписка продлевается автоматически, если автопродление не отключено минимум за 24 часа до конца текущего периода. Управлять подпиской и отменять её можно в настройках аккаунта App Store.',

    storeUnavailableTitle: 'Магазин недоступен',
    storeUnavailableBody:
      'Подписки не загрузились на этом устройстве. Переустановите TestFlight-сборку и убедитесь, что IAP привязаны к сборке в App Store Connect.',
  },
};

function periodLabel(langKey, which) {
  if (langKey === 'русский') return which === 'monthly' ? 'в месяц' : 'в год';
  return which === 'monthly' ? 'per month' : 'per year';
}
function menuRouteByLang(lang) {
  switch (lang) {
    case 'русский':
      return 'Menu';
    default:
      return 'MenuEn';
  }
}
function deepResetTo(nav, name, params) {
  nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name, params }] }));
}

export default function PaywallIOS({ navigation }) {
  const {
    available,
    ready,
    buyMonthly,
    buyAnnual,
    hasPro,
    restore,
    displayPrices,
    applyCodeEntitlementLocal,
    syncCodeEntitlementFromServer,
    userId,
    probePostPurchase,
  } = useIap();

  const [langKey, setLangKey] = useState('english');
  const S = STR[langKey] || STR.english;

  const [plan, setPlan] = useState(null);

  // redeem modal
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [redeemInput, setRedeemInput] = useState('');
  const [redeemMsg, setRedeemMsg] = useState('');
  const [redeemOK, setRedeemOK] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);

  const restoreFnRef = useRef(restore);
  const restoreLockRef = useRef({ inFlight: false, lastAt: 0 });
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    restoreFnRef.current = restore;
  }, [restore]);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('language');
      // у тебя бывают 'english' / 'русский'
      if (saved && STR[saved]) setLangKey(saved);
      else if (saved === 'en' || saved === 'en-US') setLangKey('english');
    })();
  }, []);

  const maybeRestoreSafe = useCallback(async (reason) => {
    try {
      if (redeemModalVisible) return;
      if (await isGateSnoozed()) return;

      const now = Date.now();
      const lock = restoreLockRef.current;
      if (lock.inFlight) return;
      if (lock.lastAt && now - lock.lastAt < RESTORE_THROTTLE_MS) return;

      lock.inFlight = true;
      lock.lastAt = now;
      await restoreFnRef.current?.();
    } catch (e) {
      console.warn('[PAYWALL_IOS] restore skipped/failed:', reason, e?.message || e);
    } finally {
      restoreLockRef.current.inFlight = false;
    }
  }, [redeemModalVisible]);

  useFocusEffect(
    useCallback(() => {
      let canceled = false;
      (async () => {
        if (canceled) return;
        await maybeRestoreSafe('focus');
      })();
      return () => {
        canceled = true;
      };
    }, [maybeRestoreSafe])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      const prev = appStateRef.current;
      appStateRef.current = state;
      if ((prev === 'background' || prev === 'inactive') && state === 'active') {
        await maybeRestoreSafe('resume');
      }
    });
    return () => sub.remove();
  }, [maybeRestoreSafe]);

  // Если pro — выходим сразу (или можешь оставить пост-модалку отдельно)
  useEffect(() => {
    if (!hasPro) return;
    (async () => {
      try {
        await writeGateSnooze(1200);
      } catch {}
      const saved = (await AsyncStorage.getItem('language')) || 'english';
      deepResetTo(navigation, menuRouteByLang(saved), {});
    })();
  }, [hasPro, navigation]);

  const openUrlSafe = async (url) => {
    try {
      if (!url) return;
      const can = await Linking.canOpenURL(url);
      if (!can) return;
      await Linking.openURL(url);
    } catch {}
  };

  const openAppStoreRedeem = async () => {
    try {
      if (typeof RNIap.presentCodeRedemptionSheetIOS === 'function') {
        await RNIap.presentCodeRedemptionSheetIOS();
        return;
      }
      if (typeof RNIap.presentCodeRedemptionSheet === 'function') {
        await RNIap.presentCodeRedemptionSheet();
        return;
      }
      await Linking.openURL('https://apps.apple.com/redeem');
    } catch (e) {
      try {
        await Linking.openURL('https://apps.apple.com/redeem');
      } catch {}
    }
  };

  const goMenuFreePreview = async () => {
    await AsyncStorage.setItem('freePreview', '1');
    const saved = (await AsyncStorage.getItem('language')) || 'english';
    deepResetTo(navigation, menuRouteByLang(saved), { freePreview: true });
  };

  const onSubscribe = async () => {
    try {
      if (!ready) return Alert.alert('Not ready', 'Store is not ready yet.');
      if (!plan) return Alert.alert('Select plan', 'Please select a subscription plan.');

      // ✅ ключевой момент: если продукты не загрузились (TF баг/attach), мы НЕ показываем trial UI и НЕ пытаемся купить
      if (!available) {
        Alert.alert(S.storeUnavailableTitle, S.storeUnavailableBody);
        return;
      }

      if (plan === 'annual') await buyAnnual();
      else await buyMonthly();

      try {
        await probePostPurchase?.();
      } catch {}
    } catch (e) {
      Alert.alert('Error', e?.message || String(e));
    }
  };

  const openRedeemModal = () => {
    setRedeemInput('');
    setRedeemMsg('');
    setRedeemOK(false);
    setRedeemLoading(false);
    setRedeemModalVisible(true);
  };

  const submitRedeemCode = async () => {
    if (redeemLoading) return;

    const normalized = normalizeAccessCode(redeemInput);
    if (!looksLikeAccessCode(normalized)) {
      setRedeemOK(false);
      setRedeemMsg(S.redeemInvalid);
      return;
    }

    const userIdForCodes =
      userId || (await AsyncStorage.getItem('iap:deviceUserId')) || null;

    if (!userIdForCodes) {
      setRedeemOK(false);
      setRedeemMsg('userId is missing on device.');
      return;
    }

    setRedeemLoading(true);
    setRedeemMsg('');
    setRedeemOK(false);

    try {
      const r = await redeemPartnerCodeOnServer({
        code: normalized,
        userId: String(userIdForCodes),
      });

      if (!r.ok) {
        setRedeemOK(false);
        setRedeemMsg(r.message || 'Failed');
        return;
      }

      setRedeemOK(true);
      setRedeemMsg(S.redeemSuccessBody);

      try {
        await AsyncStorage.removeItem('freePreview');
      } catch {}

      if (r?.accessUntil) {
        try {
          await applyCodeEntitlementLocal(String(r.accessUntil));
        } catch (e0) {
          console.warn('[PAYWALL_IOS] applyCodeEntitlementLocal failed:', e0?.message || e0);
        }
      }

      try {
        await syncCodeEntitlementFromServer(String(userIdForCodes));
      } catch (e1) {
        console.warn('[PAYWALL_IOS] syncCodeEntitlementFromServer failed:', e1?.message || e1);
      }

      try {
        await writeGateSnooze();
      } catch {}
      try {
        restoreLockRef.current.lastAt = Date.now();
      } catch {}

      setRedeemModalVisible(false);

      // после активации — на меню
      const saved = (await AsyncStorage.getItem('language')) || 'english';
      deepResetTo(navigation, menuRouteByLang(saved), {});
    } catch (e) {
      setRedeemOK(false);
      setRedeemMsg(e?.message || 'Failed');
    } finally {
      setRedeemLoading(false);
    }
  };

  const baseMonthlyAmt = displayPrices.baseMonthly;
  const baseAnnualAmt = displayPrices.baseAnnual;

  // trial текст на iOS показываем только когда Store реально готов (available=true)
  const showTrialHeader = !!available && IOS_TRIAL_DAYS > 0;

  const PlanCard = ({ which, title, amount, period }) => {
    const selected = plan === which;
    return (
      <TouchableOpacity
        style={[
          styles.planButtonBox,
          selected ? styles.planSelectedBox : styles.planIdleBox,
        ]}
        onPress={() => setPlan(which)}
        activeOpacity={0.85}
      >
        <Text style={[styles.planTitle, selected ? styles.planSelectedText : styles.planIdleText]}>
          {title}
        </Text>

        <Text
          style={[styles.planPriceBig, selected ? styles.planSelectedText : styles.planIdleText]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {amount || '…'}
        </Text>

        <Text style={[styles.planPeriod, selected ? styles.planSelectedText : styles.planIdleText]}>
          {period}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.headerBox}>
            <Text style={styles.headerTitle}>
              <Text style={styles.headerEmph}>
                {showTrialHeader ? S.headerTrial : S.headerNoTrial}
              </Text>
              {showTrialHeader ? <Text>{S.headerTrialTail}</Text> : null}
            </Text>
          </View>

          {/* Plan */}
          <Text style={styles.choosePlan}>{S.choosePlan}</Text>

          <View style={styles.planRow}>
            <PlanCard
              which="monthly"
              title={S.monthly}
              amount={baseMonthlyAmt}
              period={periodLabel(langKey, 'monthly')}
            />
            <View style={{ width: 12 }} />
            <PlanCard
              which="annual"
              title={S.annual}
              amount={baseAnnualAmt}
              period={periodLabel(langKey, 'annual')}
            />
          </View>

          {/* Subscribe */}
          <TouchableOpacity
            style={[styles.btnBox, styles.btnSolid, (!ready || !plan) && styles.btnDisabled]}
            onPress={onSubscribe}
            disabled={!ready || !plan}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnText, styles.btnTextSolid]}>{S.subscribe}</Text>
            <Text style={[styles.btnSubText, styles.btnSubTextSolid]}>{S.fullAccessAll}</Text>
          </TouchableOpacity>

          {/* Redeem (App Store) under CTA */}
          <TouchableOpacity
            style={[styles.btnBox, styles.btnOutline, !plan && styles.btnDisabled]}
            onPress={openAppStoreRedeem}
            disabled={!plan}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnText, styles.btnTextOutline]}>{S.redeemUnderCta}</Text>
          </TouchableOpacity>

          {/* Continue for free */}
          <TouchableOpacity
            style={[styles.btnBox, styles.btnOutline]}
            onPress={goMenuFreePreview}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnText, styles.btnTextOutline]}>{S.freePreview}</Text>
            <Text style={[styles.btnSubText, styles.btnSubTextOutline, styles.subAccent]}>
              {S.freePreviewSubtitle}
            </Text>
            <Text style={[styles.btnSubText2, styles.btnSubTextOutline]}>
              {S.limitedAccess} • {S.exercises12}
            </Text>
          </TouchableOpacity>

          {/* iOS legal text */}
          <Text style={styles.iosLegal}>{S.iosLegalText}</Text>

          <View style={{ height: 90 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom links */}
      <View style={styles.bottomArea}>
        <TouchableOpacity onPress={() => openUrlSafe(PRIVACY_URL)} activeOpacity={0.8}>
          <Text style={styles.footerLink}>{S.privacy}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => openUrlSafe(TERMS_URL)} activeOpacity={0.8}>
          <Text style={styles.footerLink}>{S.terms}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={restore} activeOpacity={0.8}>
          <Text style={styles.footerLink}>{S.restore}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={openRedeemModal} activeOpacity={0.8} style={{ marginTop: 6 }}>
          <Text style={styles.footerLinkSmall}>{S.accessCodeLink}</Text>
        </TouchableOpacity>
      </View>

      {/* Redeem modal: access code (school/course) */}
      <Modal
        visible={redeemModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRedeemModalVisible(false)}
      >
        <View style={styles.redeemOverlay}>
          <View style={styles.redeemCard}>
            <Text style={styles.redeemTitle}>{S.redeemTitle}</Text>
            <Text style={styles.redeemHint}>{S.redeemHint}</Text>

            <View style={[styles.redeemInputWrap, redeemOK && styles.redeemInputWrapOK]}>
              <TextInput
                style={[styles.redeemInput, redeemOK && styles.redeemInputOK]}
                value={redeemInput}
                onChangeText={(t) => {
                  setRedeemInput(t);
                  if (redeemMsg) setRedeemMsg('');
                  if (redeemOK) setRedeemOK(false);
                }}
                placeholder={S.redeemPlaceholder}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!redeemLoading}
                maxLength={32}
                returnKeyType="done"
                onSubmitEditing={submitRedeemCode}
              />
              {redeemOK && <Text style={styles.redeemCheck}>✓</Text>}
            </View>

            {!!redeemMsg && (
              <Text style={[styles.redeemMsg, redeemOK ? styles.redeemMsgOK : styles.redeemMsgErr]}>
                {redeemMsg}
              </Text>
            )}

            <View style={styles.redeemBtnsRow}>
              <TouchableOpacity
                style={[styles.redeemBtn, styles.redeemBtnOutline]}
                onPress={() => setRedeemModalVisible(false)}
                disabled={redeemLoading}
                activeOpacity={0.85}
              >
                <Text style={[styles.redeemBtnText, styles.redeemBtnTextOutline]}>
                  {S.redeemCancel}
                </Text>
              </TouchableOpacity>

              <View style={{ width: 10 }} />

              <TouchableOpacity
                style={[
                  styles.redeemBtn,
                  styles.redeemBtnSolid,
                  (!looksLikeAccessCode(normalizeAccessCode(redeemInput)) || redeemLoading) &&
                    styles.btnDisabled,
                ]}
                onPress={submitRedeemCode}
                disabled={!looksLikeAccessCode(normalizeAccessCode(redeemInput)) || redeemLoading}
                activeOpacity={0.85}
              >
                <Text style={[styles.redeemBtnText, styles.redeemBtnTextSolid]}>
                  {redeemLoading ? S.redeemWorking : S.redeemBtn}
                </Text>
              </TouchableOpacity>
            </View>

            {redeemOK && (
              <TouchableOpacity
                style={styles.redeemRestoreQuick}
                onPress={async () => {
                  setRedeemModalVisible(false);
                  await restore();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.redeemRestoreQuickText}>{S.restore}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ===================== styles ===================== */
const BRAND = '#2D4769';
const BRAND_BG = '#2D4769';
const BRAND_TEXT = '#ffffff';
const ACCENT = '#bd462a';

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  scrollContent: { paddingBottom: 12 },

  headerBox: {
    padding: 12,
    backgroundColor: '#F7FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6EEF7',
    marginBottom: 10,
    alignItems: 'center',
  },
  headerTitle: { color: BRAND, fontWeight: '400', fontSize: 13.5, lineHeight: 18, textAlign: 'center' },
  headerEmph: { fontWeight: '900', color: ACCENT },

  choosePlan: { fontWeight: '800', color: ACCENT, textAlign: 'center', marginBottom: 8 },

  planRow: { flexDirection: 'row', marginBottom: 14 },
  planButtonBox: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
  },
  planIdleBox: { borderColor: BRAND, backgroundColor: 'transparent' },
  planSelectedBox: { borderColor: BRAND, backgroundColor: BRAND_BG },
  planTitle: { fontWeight: '800', fontSize: 16, marginBottom: 4 },
  planPriceBig: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  planPeriod: { fontSize: 12, opacity: 0.9 },
  planIdleText: { color: BRAND },
  planSelectedText: { color: BRAND_TEXT },

  btnBox: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  btnOutline: { borderColor: BRAND, backgroundColor: 'transparent' },
  btnSolid: { borderColor: BRAND, backgroundColor: BRAND_BG },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontWeight: '800', fontSize: 16 },
  btnTextOutline: { color: BRAND },
  btnTextSolid: { color: BRAND_TEXT },
  btnSubText: { marginTop: 2, fontSize: 12, opacity: 0.9, fontWeight: '600' },
  btnSubText2: { marginTop: 1, fontSize: 12, opacity: 0.8, fontWeight: '600' },
  btnSubTextOutline: { color: BRAND },
  btnSubTextSolid: { color: BRAND_TEXT },
  subAccent: { color: ACCENT, fontWeight: '900', opacity: 1 },

  iosLegal: {
    fontSize: 11.5,
    lineHeight: 16,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 6,
    marginTop: 4,
  },

  bottomArea: { paddingVertical: 8, alignItems: 'center' },
  footerLink: { fontSize: 14, textDecorationLine: 'underline', color: BRAND, opacity: 0.9 },
  footerLinkSmall: { fontSize: 12.5, textDecorationLine: 'underline', color: BRAND, opacity: 0.85 },

  // redeem modal
  redeemOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: 'white',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6EEF7',
  },
  redeemTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center', color: BRAND, marginBottom: 6 },
  redeemHint: { fontSize: 12, opacity: 0.85, textAlign: 'center', marginBottom: 12 },

  redeemInputWrap: { position: 'relative' },
  redeemInputWrapOK: {},
  redeemInput: {
    borderWidth: 2,
    borderColor: '#9aa6b2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontWeight: '800',
    backgroundColor: 'white',
    letterSpacing: 0.5,
  },
  redeemInputOK: { borderColor: '#2e7d32', color: '#2e7d32', backgroundColor: '#e8f5e9' },
  redeemCheck: { position: 'absolute', right: 10, top: 10, fontSize: 18, color: '#2e7d32', fontWeight: '900' },

  redeemMsg: { marginTop: 10, fontSize: 12, textAlign: 'center' },
  redeemMsgOK: { color: '#2e7d32' },
  redeemMsgErr: { color: '#b00020' },

  redeemBtnsRow: { flexDirection: 'row', marginTop: 12 },
  redeemBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemBtnOutline: { borderColor: BRAND, backgroundColor: 'transparent' },
  redeemBtnSolid: { borderColor: BRAND, backgroundColor: BRAND_BG },
  redeemBtnText: { fontWeight: '900', fontSize: 14 },
  redeemBtnTextOutline: { color: BRAND },
  redeemBtnTextSolid: { color: BRAND_TEXT },

  redeemRestoreQuick: { marginTop: 12, alignItems: 'center' },
  redeemRestoreQuickText: { color: BRAND, textDecorationLine: 'underline', fontSize: 14, fontWeight: '800' },
});