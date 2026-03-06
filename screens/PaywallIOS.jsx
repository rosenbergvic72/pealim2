// screens/PaywallIOS.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as RNIap from 'react-native-iap';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  Linking,
  AppState,
  TextInput,
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

// iOS links (✅ должны быть рабочими и вести на конкретные страницы)
const PRIVACY_URL = 'https://verbifyapp.netlify.app/privacy';
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

const GATE_SNOOZE_KEY = 'iap:gateSnoozeUntil';
const GATE_SNOOZE_MS = 5000;
const RESTORE_THROTTLE_MS = 60000;

const FORCE_PAYWALL = String(process.env.EXPO_PUBLIC_FORCE_PAYWALL) === '1';

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

    // header
    headerTrial:
      'Pick a plan and tap SUBSCRIBE. Trial (if available) will be shown in the App Store sheet. You can cancel anytime in App Store, or tap CONTINUE FOR FREE.',
    headerTrialBadge: '7-DAY FREE TRIAL (for new subscribers).',
    headerNoTrial:
      'Subscription. Pick a plan and tap SUBSCRIBE. You can cancel anytime in App Store, or tap CONTINUE FOR FREE.',

    freePreview: 'CONTINUE FOR FREE',
    freePreviewSubtitle: 'Train 350 Hebrew verbs',
    limitedAccess: 'Limited access',
    exercises12: 'Exercises 1 & 2',

    redeemUnderCta: 'Enter App Store promo code',
    restore: 'Restore access',

    privacy: 'Privacy Policy',
    terms: 'Terms of Use',

    // Required subscription info block
    subInfoTitle: 'Subscription information',
    subInfoName: 'Subscription',
    subInfoLength: 'Length',
    subInfoPrice: 'Price',
    planCol: 'Plan',

    // Errors / states
    loadingPrices: 'Loading prices…',
    selectPlanTitle: 'Select plan',
    selectPlanBody: 'Please select a subscription plan.',
    notReadyTitle: 'Not ready',
    notReadyBody: 'Store is not ready yet.',
    storeUnavailableTitle: 'Store unavailable',
    storeUnavailableBody:
      'Subscriptions are not loaded on this device. Please reinstall TestFlight build and make sure In-App Purchases are attached to the build in App Store Connect.',

    iosLegalText:
      'Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. You can manage and cancel your subscription in your App Store account settings.',
  },

  русский: {
    choosePlan: 'Выберите план',
    monthly: 'Помесячно',
    annual: 'На год',
    subscribe: 'ОФОРМИТЬ ПОДПИСКУ',
    fullAccessAll: 'Полный доступ • Все упражнения',

    headerTrial:
      'Выберите план и нажмите ОФОРМИТЬ ПОДПИСКУ. Триал (если доступен) будет показан в системном окне App Store. Отменить можно в любой момент в App Store, или нажмите ПРОДОЛЖИТЬ БЕСПЛАТНО.',
    headerTrialBadge: '7 ДНЕЙ БЕСПЛАТНОГО ДОСТУПА (для новых подписчиков).',
    headerNoTrial:
      'Подписка. Выберите план и нажмите ОФОРМИТЬ ПОДПИСКУ. Отменить можно в любой момент в App Store, или нажмите ПРОДОЛЖИТЬ БЕСПЛАТНО.',

    freePreview: 'ПРОДОЛЖИТЬ БЕСПЛАТНО',
    freePreviewSubtitle: 'Тренируйте 350 глаголов иврита',
    limitedAccess: 'Ограниченный доступ',
    exercises12: 'Упражнения 1 и 2',

    redeemUnderCta: 'Ввести промокод App Store',
    restore: 'Восстановить доступ',

    privacy: 'Политика конфиденциальности',
    terms: 'Условия использования',

    subInfoTitle: 'Информация о подписке',
    subInfoName: 'Подписка',
    subInfoLength: 'Срок',
    subInfoPrice: 'Цена',
    planCol: 'План',

    loadingPrices: 'Загружаем цены…',
    selectPlanTitle: 'Выберите план',
    selectPlanBody: 'Пожалуйста, выберите план подписки.',
    notReadyTitle: 'Ещё не готово',
    notReadyBody: 'Магазин ещё не готов.',
    storeUnavailableTitle: 'Магазин недоступен',
    storeUnavailableBody:
      'Подписки не загрузились на этом устройстве. Переустановите TestFlight-сборку и убедитесь, что IAP привязаны к сборке в App Store Connect.',

    iosLegalText:
      'Оплата будет списана с вашего Apple ID после подтверждения покупки. Подписка продлевается автоматически, если автопродление не отключено минимум за 24 часа до конца текущего периода. Управлять подпиской и отменять её можно в настройках аккаунта App Store.',
  },
};

function periodLabel(langKey, which) {
  if (langKey === 'русский') return which === 'monthly' ? 'в месяц' : 'в год';
  return which === 'monthly' ? 'per month' : 'per year';
}
function lengthLabel(langKey, which) {
  if (langKey === 'русский') return which === 'monthly' ? '1 месяц' : '1 год';
  return which === 'monthly' ? '1 month' : '1 year';
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
    probePostPurchase,
  } = useIap();

  const [langKey, setLangKey] = useState('english');
  const S = STR[langKey] || STR.english;

  const [plan, setPlan] = useState(null);

  const restoreFnRef = useRef(restore);
  const restoreLockRef = useRef({ inFlight: false, lastAt: 0 });
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    restoreFnRef.current = restore;
  }, [restore]);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('language');
      if (saved && STR[saved]) setLangKey(saved);
      else if (saved === 'en' || saved === 'en-US') setLangKey('english');
    })();
  }, []);

  const maybeRestoreSafe = useCallback(
    async (reason) => {
      try {
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
    },
    []
  );

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

  // Если pro — выходим сразу (как было)
  useEffect(() => {
  if (!hasPro) return;

  // ✅ В TestFlight (preview-ios) оставляем paywall открытым,
  // чтобы можно было видеть цены/верстку даже при Pro
  if (FORCE_PAYWALL) return;

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
    } catch {
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
      if (!ready) return Alert.alert(S.notReadyTitle, S.notReadyBody);
      if (!plan) return Alert.alert(S.selectPlanTitle, S.selectPlanBody);

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

  const baseMonthlyAmt = displayPrices?.baseMonthly || '';
  const baseAnnualAmt = displayPrices?.baseAnnual || '';

  // ✅ Trial текст показываем только когда store реально доступен
  const showTrialHeader = available && IOS_TRIAL_DAYS > 0;

  const PlanCard = ({ which, title, amount, period }) => {
    const selected = plan === which;
    const amountText = amount || (available ? '…' : S.loadingPrices);

    return (
      <TouchableOpacity
        style={[styles.planButtonBox, selected ? styles.planSelectedBox : styles.planIdleBox]}
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
          {amountText}
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
            <Text style={styles.headerTitle}>{showTrialHeader ? S.headerTrial : S.headerNoTrial}</Text>

            {showTrialHeader && (
              <Text style={[styles.headerTitle, styles.headerEmph]}>{S.headerTrialBadge}</Text>
            )}
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

          {/* ✅ REQUIRED subscription info block (compact) */}
          <View style={styles.subInfoBox}>
            <Text style={styles.subInfoTitle}>{S.subInfoTitle}</Text>

            <View style={styles.subInfoRow}>
              <Text style={styles.subInfoLabel}>{S.subInfoName}</Text>
              <Text style={styles.subInfoValue}>Verbify Pro</Text>
            </View>

            <View style={styles.subTable}>
              <View style={[styles.subTableRow, styles.subTableHeaderRow]}>
                <Text style={[styles.subTableCell, styles.subTableHeader]}>{S.planCol}</Text>
                <Text
                  style={[
                    styles.subTableCell,
                    styles.subTableHeader,
                    styles.subTableCellCenter,
                  ]}
                >
                  {S.subInfoLength}
                </Text>
                <Text
                  style={[
                    styles.subTableCell,
                    styles.subTableHeader,
                    styles.subTableCellRight,
                  ]}
                >
                  {S.subInfoPrice}
                </Text>
              </View>

              <View style={styles.subTableRow}>
                <Text style={[styles.subTableCell, styles.subTablePlan]}>{S.monthly}</Text>
                <Text style={[styles.subTableCell, styles.subTableCellCenter]}>
                  {lengthLabel(langKey, 'monthly')}
                </Text>
                <Text style={[styles.subTableCell, styles.subTableCellRight]}>
                  {baseMonthlyAmt
                    ? `${baseMonthlyAmt} / ${periodLabel(langKey, 'monthly')}`
                    : S.loadingPrices}
                </Text>
              </View>

              <View style={styles.subTableRow}>
                <Text style={[styles.subTableCell, styles.subTablePlan]}>{S.annual}</Text>
                <Text style={[styles.subTableCell, styles.subTableCellCenter]}>
                  {lengthLabel(langKey, 'annual')}
                </Text>
                <Text style={[styles.subTableCell, styles.subTableCellRight]}>
                  {baseAnnualAmt
                    ? `${baseAnnualAmt} / ${periodLabel(langKey, 'annual')}`
                    : S.loadingPrices}
                </Text>
              </View>
            </View>
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
          <TouchableOpacity style={[styles.btnBox, styles.btnOutline]} onPress={openAppStoreRedeem} activeOpacity={0.85}>
            <Text style={[styles.btnText, styles.btnTextOutline]}>{S.redeemUnderCta}</Text>
          </TouchableOpacity>

          {/* Continue for free */}
          <TouchableOpacity style={[styles.btnBox, styles.btnOutline]} onPress={goMenuFreePreview} activeOpacity={0.85}>
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
      </View>
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
  headerTitle: {
    color: BRAND,
    fontWeight: '400',
    fontSize: 13.5,
    lineHeight: 18,
    textAlign: 'center',
  },
  headerEmph: { fontWeight: '900', color: BRAND },

  choosePlan: { fontWeight: '800', color: ACCENT, textAlign: 'center', marginBottom: 8 },

  planRow: { flexDirection: 'row', marginBottom: 12 },
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
  planPriceBig: { fontSize: 22, fontWeight: '900', marginBottom: 2, paddingHorizontal: 6 },
  planPeriod: { fontSize: 12, opacity: 0.9 },
  planIdleText: { color: BRAND },
  planSelectedText: { color: BRAND_TEXT },

  // ✅ compact subscription info
  subInfoBox: {
    padding: 10,
    backgroundColor: '#F7FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6EEF7',
    marginBottom: 12,
  },
  subInfoTitle: { fontWeight: '900', color: BRAND, marginBottom: 6, textAlign: 'center', fontSize: 13.5 },
  subInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subInfoLabel: { fontSize: 12, color: BRAND, opacity: 0.8, fontWeight: '700' },
  subInfoValue: { fontSize: 12, color: BRAND, fontWeight: '900', textAlign: 'right', maxWidth: '62%' },

  subTable: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E6EEF7',
    paddingTop: 6,
  },
  subTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  subTableHeaderRow: {
    paddingVertical: 3,
  },
  subTableCell: {
    flex: 1,
    fontSize: 11.5,
    color: BRAND,
  },
  subTableHeader: {
    fontWeight: '900',
    opacity: 0.75,
  },
  subTablePlan: {
    fontWeight: '900',
  },
  subTableCellCenter: {
    textAlign: 'center',
  },
  subTableCellRight: {
    textAlign: 'right',
  },

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
});