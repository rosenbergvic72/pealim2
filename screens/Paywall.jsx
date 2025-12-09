// screens/Paywall.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Platform, KeyboardAvoidingView, Alert, Modal, AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { useIap } from '../src/iap/IapProvider';

// ★ Ограничение автоскейла шрифтов
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.maxFontSizeMultiplier = 1.2;
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.maxFontSizeMultiplier = 1.2;

const SHOW_PLAY_REDEEM = false;
const DEV_SKIP = false; // автоскок в dev — отключён

/* ===== Коридор после пост-модалки (anti-restore loop) ===== */
const GATE_SNOOZE_KEY = 'iap:gateSnoozeUntil';
const GATE_SNOOZE_MS  = 5000;

async function writeGateSnooze(ms = GATE_SNOOZE_MS) {
  try { await AsyncStorage.setItem(GATE_SNOOZE_KEY, String(Date.now() + ms)); } catch {}
}
async function isGateSnoozed() {
  try {
    const raw = await AsyncStorage.getItem(GATE_SNOOZE_KEY);
    const until = Number(raw || 0);
    const ok = Number.isFinite(until) && Date.now() < until;
    if (!ok) await AsyncStorage.removeItem(GATE_SNOOZE_KEY);
    return ok;
  } catch { return false; }
}

/* ===== Промокоды → сегменты ===== */
const CODE_SEGMENTS = {
  ULPAN2025: 'ulpan',
  NATIV2025: 'nativ',
  PARTNER40: 'partner',
  PROMO30:   'promo',
  TEST90:    'test',
  TIKVA30:   'tikva',
};
const resolveSegmentByCode = (code) =>
  CODE_SEGMENTS[String(code || '').trim().toUpperCase()] || null;

/* ===== Локализация (сокр.) ===== */
const STR = {
  english: {
    startTrial: 'START FREE TRIAL',
    subscribe: 'SUBSCRIBE',
    monthly: 'Monthly',
    annual: 'Annual',
    promoLabel: 'Promo code',
    promoPlaceholder: 'promocode',
    apply: 'Apply',
    applied: () => 'Promo code applied',
    invalid: 'Code is invalid',
    playRedeem: 'Google Play code',
    restore: 'Restore access',
    choosePlan: 'Choose a plan',
    headerTrialEmph: '5-DAY FREE TRIAL (for new subscribers)',
    headerTrialTail:
      '. Pick a plan and tap START FREE TRIAL. After the trial, full access continues automatically at the plan price—you can cancel anytime in Google Play / App Store, or tap CONTINUE FOR FREE.',
    freePreview: 'CONTINUE FOR FREE',
    fullAccess: 'Full access',
    limitedAccess: 'Limited access',
    exercises12: 'Exercises 1 & 2',
    postTitle: 'Subscription activated 🎉',
    postBody:
      'Full access is unlocked. If you receive a Google Play email about “registering” the subscription — it’s standard; access is already granted.',
    postContinue: 'Continue',
  },
  русский: {
    startTrial: 'НАЧАТЬ ПРОБНЫЙ ПЕРИОД',
    subscribe: 'ПОДПИСАТЬСЯ',
    monthly: 'Помесячно',
    annual: 'На год',
    promoLabel: 'Промокод',
    promoPlaceholder: 'promocode',
    apply: 'Применить',
    applied: () => 'Промокод применён',
    invalid: 'Промокод недействителен',
    playRedeem: 'Код Google Play',
    restore: 'Восстановить доступ',
    choosePlan: 'Выбери план',
    headerTrialEmph: '5 ДНЕЙ БЕСПЛАТНОГО ДОСТУПА (для новых подписчиков)',
    headerTrialTail:
      '. Выберите план и нажмите НАЧАТЬ ПРОБНЫЙ ПЕРИОД. После триала полный доступ продлится автоматически по цене выбранного плана — отменить можно в любой момент в Google Play / App Store, или нажмите ПРОДОЛЖИТЬ БЕСПЛАТНО.',
    freePreview: 'ПРОДОЛЖИТЬ БЕСПЛАТНО',
    fullAccess: 'Полный доступ',
    limitedAccess: 'Ограниченный доступ',
    exercises12: 'Упражнения 1 и 2',
    postTitle: 'Подписка активирована 🎉',
    postBody:
      'Доступ ко всем функциям открыт. Если придёт письмо Google о «регистрации у разработчика» — это стандартное письмо, доступ уже предоставлен.',
    postContinue: 'Продолжить',
  },
  français: {
    startTrial: 'DÉMARRER L’ESSAI GRATUIT',
    subscribe: "S'ABONNER",
    monthly: 'Mensuel',
    annual: 'Annuel',
    promoLabel: 'Code promo',
    promoPlaceholder: 'promocode',
    apply: 'Appliquer',
    applied: () => 'Code promo appliqué',
    invalid: 'Code invalide',
    playRedeem: 'Code Google Play',
    restore: "Restaurer l’accès",
    choosePlan: 'Choisissez une formule',
    headerTrialEmph: 'ESSAI GRATUIT DE 5 JOURS (pour les nouveaux abonnés)',
    headerTrialTail:
      '. Choisissez une formule et touchez DÉMARRER L’ESSAI GRATUIT. À la fin de l’essai, l’accès se prolonge automatiquement au prix de la formule — résiliation possible à tout moment (Google Play / App Store), ou touchez CONTINUER GRATUITEMENT.',
    freePreview: 'CONTINUER GRATUITEMENT',
    fullAccess: 'Accès complet',
    limitedAccess: 'Accès limité',
    exercises12: 'Exercices 1 et 2',
    postTitle: 'Abonnement activé 🎉',
    postBody:
      'Accès complet débloqué. L’e-mail Google Play sur « l’enregistrement » est standard ; l’accès est déjà accordé.',
    postContinue: 'Continuer',
  },
  español: {
    startTrial: 'INICIAR PRUEBA GRATUITA',
    subscribe: 'SUSCRIBIRSE',
    monthly: 'Mensual',
    annual: 'Anual',
    promoLabel: 'Código promocional',
    promoPlaceholder: 'promocode',
    apply: 'Aplicar',
    applied: () => 'Código promocional aplicado',
    invalid: 'Código no válido',
    playRedeem: 'Código de Google Play',
    restore: 'Restaurar acceso',
    choosePlan: 'Elige un plan',
    headerTrialEmph: 'PRUEBA GRATUITA DE 5 DÍAS (para nuevos suscriptores)',
    headerTrialTail:
      '. Elige un plan y pulsa INICIAR PRUEBA GRATUITA. Tras la prueba, el acceso completo continúa automáticamente al precio del plan — puedes cancelar en cualquier momento en Google Play / App Store, o pulsa CONTINUAR GRATIS.',
    freePreview: 'CONTINUAR GRATIS',
    fullAccess: 'Acceso completo',
    limitedAccess: 'Acceso limitado',
    exercises12: 'Ejercicios 1 y 2',
    postTitle: 'Suscripción activada 🎉',
    postBody:
      'Acceso completo desbloqueado. El correo de Google Play sobre “registrar” es normal; el acceso ya está concedido.',
    postContinue: 'Continuar',
  },
  português: {
    startTrial: 'INICIAR AVALIAÇÃO GRÁTIS',
    subscribe: 'ASSINAR',
    monthly: 'Mensal',
    annual: 'Anual',
    promoLabel: 'Código promocional',
    promoPlaceholder: 'promocode',
    apply: 'Aplicar',
    applied: () => 'Código promocional aplicado',
    invalid: 'Código inválido',
    playRedeem: 'Código do Google Play',
    restore: 'Restaurar acesso',
    choosePlan: 'Escolha um plano',
    headerTrialEmph: '5 DIAS DE AVALIAÇÃO GRÁTIS (para novos assinantes)',
    headerTrialTail:
      '. Escolha um plano e toque em INICIAR AVALIAÇÃO GRÁTIS. Após a avaliação, o acesso completo continua automaticamente pelo preço do plano — você pode cancelar a qualquer momento no Google Play / App Store, ou toque em CONTINUAR GRÁTIS.',
    freePreview: 'CONTINUAR GRÁTIS',
    fullAccess: 'Acesso total',
    limitedAccess: 'Acesso limitado',
    exercises12: 'Exercícios 1 e 2',
    postTitle: 'Assinatura ativada 🎉',
    postBody:
      'Acesso completo liberado. O e-mail do Google Play sobre “registro” é padrão; o acesso já foi concedido.',
    postContinue: 'Continuar',
  },
  'አማርኛ': {
    startTrial: 'ነጻ ሙከራ ጀምር',
    subscribe: 'መመዝገብ',
    monthly: 'ወርሃዊ',
    annual: 'ዓመታዊ',
    promoLabel: 'ፕሮሞ ኮድ',
    promoPlaceholder: 'promocode',
    apply: 'አፕሊ',
    applied: () => 'ፕሮሞ ኮድ ተፈጻሚ ሆነ',
    invalid: 'ኮድ ልክ አይደለም',
    playRedeem: 'የGoogle Play ኮድ',
    restore: 'መዳረሻ መመለስ',
    choosePlan: 'እቅድ ይምረጡ',
    headerTrialEmph: '5 ቀን ነጻ ሙከራ (ለአዲስ ተመዝጋቢዎች)',
    headerTrialTail:
      '። እቅድ ይምረጡ እና «ነጻ ሙከራ ጀምር» ይጫኑ። ከሙከራው በኋላ ሙሉ መዳረሻ በእቅዱ ዋጋ በራሱ ይቀጥላል — በGoogle Play / App Store ማቋረጥ በማንኛውም ጊዜ ይቻላል፣ ወይም «ነፃ መቀጠል» ይጫኑ።',
    freePreview: 'ነፃ መቀጠል',
    fullAccess: 'ሙሉ መዳረሻ',
    limitedAccess: 'የተገደበ መዳረሻ',
    exercises12: 'ልምምዶች 1 እና 2',
    postTitle: 'መመዝገብ ተከናውኗል 🎉',
    postBody:
      'ሙሉ መዳረሻ ተከፍቷል። የ Google Play “ምዝገባ” ኢሜይል መደበኛ ነው፤ መዳረሻ አስቀድሞ ተሰጥቷል።',
    postContinue: 'ቀጥል',
  },
  العربية: {
    startTrial: 'بدء الفترة التجريبية',
    subscribe: 'اشْتَرِك',
    monthly: 'شهري',
    annual: 'سنوي',
    promoLabel: 'رمز ترويجي',
    promoPlaceholder: 'promocode',
    apply: 'تطبيق',
    applied: () => 'تم تطبيق الرمز الترويجي',
    invalid: 'الرمز غير صالح',
    playRedeem: 'رمز Google Play',
    restore: 'استعادة الوصول',
    choosePlan: 'اختر خطة',
    headerTrialEmph: 'فترة تجريبية مجانية لمدة 5 أيام (للمشتركين الجدد)',
    headerTrialTail:
      '. اختر خطة واضغط «بدء الفترة التجريبية». بعد الفترة التجريبية، يستمر الوصول الكامل تلقائيًا بسعر الخطة — ويمكنك الإلغاء في أي وقت عبر Google Play / App Store، أو اضغط «المتابعة مجانًا».',
    freePreview: 'المتابعة مجانًا',
    fullAccess: 'وصول كامل',
    limitedAccess: 'وصول محدود',
    exercises12: 'تمارين 1 و2',
    postTitle: 'تم تفعيل الاشتراك 🎉',
    postBody:
      'تم فتح الوصول الكامل. رسالة “التسجيل لدى المطوّر” من Google Play إجراء قياسي؛ تم منح الوصول.',
    postContinue: 'متابعة',
  },
};

const RTL_LANGS = new Set(['العربية']);

function periodLabel(langKey, which) {
  switch (langKey) {
    case 'русский':   return which === 'monthly' ? 'в месяц'   : 'в год';
    case 'français':  return which === 'monthly' ? 'par mois'  : 'par an';
    case 'español':   return which === 'monthly' ? 'al mes'    : 'al año';
    case 'português': return which === 'monthly' ? 'por mês'   : 'por ano';
    case 'العربية':   return which === 'monthly' ? 'شهريًا'    : 'سنويًا';
    case 'አማርኛ':    return which === 'monthly' ? 'በወር'      : 'በዓመት';
    default:          return which === 'monthly' ? 'per month' : 'per year';
  }
}
function samePrice(a, b) {
  if (!a || !b) return false;
  return String(a).replace(/\s+/g, '') === String(b).replace(/\s+/g, '');
}
function menuRouteByLang(lang) {
  switch (lang) {
    case 'english': return 'MenuEn';
    case 'русский': return 'Menu';
    case 'français': return 'MenuFr';
    case 'español': return 'MenuEs';
    case 'português': return 'MenuPt';
    case 'العربية': return 'MenuAr';
    case 'አማርኛ': return 'MenuAm';
    default: return 'Menu';
  }
}
function deepResetTo(nav, name, params) {
  nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name, params }] }));
}

export default function Paywall({ navigation }) {
  const {
    available, ready, buyMonthly, buyAnnual,
    hasPro, restore, displayPrices,
    shouldShowPost, markPostShown,
    applyPromoCode, probePostPurchase,
    __devGrantPro,
  } = useIap();

  const [langKey, setLangKey] = useState('english');
  const [plan, setPlan] = useState(null); // без автоподстановки
  const [code, setCode] = useState('');
  const [promoMsg, setPromoMsg] = useState('');
  const [promoOK, setPromoOK] = useState(false);

  const isRTL = RTL_LANGS.has(langKey);
  const S = STR[langKey] || STR.english;

  const navigatedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const firstHasProAt = useRef(null);

  const [postChecked, setPostChecked] = useState(false);
  const showPost = hasPro && !!shouldShowPost;

  /* language load */
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('language');
      if (saved && STR[saved]) setLangKey(saved);
    })();
  }, []);

  /* dev autoskip — выключен */
  useEffect(() => { if (DEV_SKIP) {/* noop */} }, []);

  /* отметим момент первого hasPro */
  useEffect(() => {
    if (!ready) return;
    if (hasPro && firstHasProAt.current == null) firstHasProAt.current = Date.now();
  }, [ready, hasPro]);

  /* при появлении hasPro — подтянем пост-состояние */
  useEffect(() => {
    if (!hasPro) return;
    (async () => { try { await probePostPurchase(); } catch {} })();
  }, [hasPro, probePostPurchase]);

  /* первый запуск: проверим pending и проставим флаг */
  useEffect(() => {
    (async () => {
      try { await probePostPurchase(); } catch {}
      setPostChecked(true);
    })();
  }, [probePostPurchase]);

  /* при фокусе — восстановим доступ, если нет коридора и не показываем пост-модалку */
  useFocusEffect(
    useCallback(() => {
      let canceled = false;
      (async () => {
        if (canceled) return;
        if (!(await isGateSnoozed()) && !showPost) {
          await restore();
        }
      })();
      return () => { canceled = true; };
    }, [restore, showPost]),
  );

  /* AppState → active: обновим доступ */
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      const prev = appStateRef.current;
      appStateRef.current = state;
      if ((prev === 'background' || prev === 'inactive') && state === 'active') {
        if (!(await isGateSnoozed()) && !showPost) {
          await restore();
        }
      }
    });
    return () => sub.remove();
  }, [restore, showPost]);

  /* бесплатный превью-режим */
  const goMenuFreePreview = async () => {
    await AsyncStorage.setItem('freePreview', '1');
    const saved = (await AsyncStorage.getItem('language')) || 'english';
    deepResetTo(navigation, menuRouteByLang(saved), { freePreview: true });
  };

  /* промокод → сегментные цены */
  const applyCodeLocal = async () => {
    const seg = resolveSegmentByCode(code);
    if (!seg) {
      setPromoOK(false);
      setPromoMsg(S.invalid);
      return;
    }
    const ok = await applyPromoCode(code);
    if (ok) {
      setPromoOK(true);
      setPromoMsg(S.applied());
      setCode(String(code).trim().toUpperCase());
      setPlan(null);
    } else {
      setPromoOK(false);
      setPromoMsg(S.invalid);
    }
  };

  /* старт покупки */
  const onPrimaryCta = async () => {
    try {
      if (!ready) return Alert.alert('Not Ready', 'Store is not ready yet.');
      if (!plan)  return Alert.alert('Select Plan', 'Please select a subscription plan.');
      if (plan === 'annual') await buyAnnual(); else await buyMonthly();
    } catch (e) {
      Alert.alert('Error', 'Failed to start purchase: ' + (e?.message || String(e)));
    }
  };

  /* DEV: локальный анлок всех упражнений */
  const devUnlockAll = async () => {
    if (!__DEV__ || !__devGrantPro) return;
    try { await AsyncStorage.removeItem('freePreview'); } catch {}
    await __devGrantPro();
    const saved = (await AsyncStorage.getItem('language')) || 'english';
    deepResetTo(navigation, menuRouteByLang(saved), {});
  };

  // Цены
  const baseMonthlyAmt = displayPrices.baseMonthly;
  const baseAnnualAmt  = displayPrices.baseAnnual;
  const segMonthlyAmt  = displayPrices.promoMonthly;
  const segAnnualAmt   = displayPrices.promoAnnual;

  const monthlyPeriodLabel = periodLabel(langKey, 'monthly');
  const annualPeriodLabel  = periodLabel(langKey, 'annual');

  const useStrikeMonthly =
    promoOK && segMonthlyAmt && baseMonthlyAmt && !samePrice(segMonthlyAmt, baseMonthlyAmt);
  const useStrikeAnnual  =
    promoOK && segAnnualAmt  && baseAnnualAmt  && !samePrice(segAnnualAmt,  baseAnnualAmt);

  // Автонавигация после покупки (когда нет пост-модалки)
  useEffect(() => {
    if (!ready || !postChecked || !hasPro || showPost || navigatedRef.current) return;
    (async () => {
      const now = Date.now();
      const born = firstHasProAt.current || now;
      const remain = Math.max(0, 1200 - (now - born)); // ~1.2s окно
      if (remain > 0) await new Promise(r => setTimeout(r, remain));
      try { await probePostPurchase(); } catch {}
      if (!showPost && !navigatedRef.current) {
        navigatedRef.current = true;
        const saved = (await AsyncStorage.getItem('language')) || 'english';
        deepResetTo(navigation, menuRouteByLang(saved), {});
      }
    })();
  }, [ready, postChecked, hasPro, showPost, navigation, probePostPurchase]);

  const UIButton = ({ label, subLabel, subLabel2, onPress, disabled, kind = 'outline', big = false, style }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btnBox,
        kind === 'solid' ? styles.btnSolid : styles.btnOutline,
        big && styles.btnBig,
        disabled && styles.btnDisabled,
        style,
      ]}
    >
      <Text maxFontSizeMultiplier={1.2}>
        <Text
          style={[styles.btnText, kind === 'solid' ? styles.btnTextSolid : styles.btnTextOutline]}
          maxFontSizeMultiplier={1.2}
        >
          {label}
        </Text>
      </Text>
      {!!subLabel && (
        <Text
          style={[styles.btnSubText, kind === 'solid' ? styles.btnSubTextSolid : styles.btnSubTextOutline]}
          maxFontSizeMultiplier={1.2}
        >
          {subLabel}
        </Text>
      )}
      {!!subLabel2 && (
        <Text
          style={[styles.btnSubText2, kind === 'solid' ? styles.btnSubTextSolid : styles.btnSubTextOutline]}
          maxFontSizeMultiplier={1.2}
        >
          {subLabel2}
        </Text>
      )}
    </TouchableOpacity>
  );

  const planBtn = (which, title, { baseAmt, segAmt, periodText, useStrike }) => {
    const selected = plan === which;
    return (
      <TouchableOpacity
        key={which}
        style={[styles.planButtonBox, selected ? styles.planSelectedBox : styles.planIdleBox]}
        onPress={() => setPlan(which)}
        activeOpacity={0.8}
      >
        <Text
          style={[styles.planTitle, selected ? styles.planSelectedText : styles.planIdleText]}
          maxFontSizeMultiplier={1.2}
        >
          {title}
        </Text>

        <View style={styles.priceRow}>
          {useStrike ? (
            <>
              <Text
                style={[styles.planPriceOld]}
                numberOfLines={1}
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1.2}
              >
                {baseAmt}
              </Text>
              <Text
                style={[styles.planPriceNew, selected ? styles.planSelectedText : styles.planIdleText]}
                numberOfLines={1}
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1.2}
              >
                {segAmt}
              </Text>
            </>
          ) : (
            <Text
              style={[styles.planPriceBig, selected ? styles.planSelectedText : styles.planIdleText]}
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.2}
            >
              {segAmt || baseAmt || '…'}
            </Text>
          )}
        </View>

        <Text
          style={[styles.planPeriod, selected ? styles.planSelectedText : styles.planIdleText]}
          maxFontSizeMultiplier={1.2}
        >
          {periodText}
        </Text>
      </TouchableOpacity>
    );
  };

  // Если есть pro и пост-модалка не нужна — экран скрываем
  if (hasPro && !showPost) return null;

  return (
    <View style={[styles.screen, isRTL && { direction: 'rtl' }]}>
      {/* Пост-модалка после покупки */}
      <Modal visible={!!showPost} transparent={false} animationType="fade" presentationStyle="fullScreen">
        <View style={styles.modalWrap}>
          <Text style={styles.modalTitle} maxFontSizeMultiplier={1.2}>
            {S.postTitle}
          </Text>
          <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
            {S.postBody}
          </Text>
          <TouchableOpacity
            style={[styles.btnBox, styles.btnSolid, { marginTop: 16, minWidth: 200 }]}
            onPress={async () => {
              await markPostShown();
              await writeGateSnooze(); // коридор 5с, чтобы restore не перекинул назад
              const saved = (await AsyncStorage.getItem('language')) || 'english';
              if (!hasPro) {
                await AsyncStorage.setItem('freePreview', '1');
                deepResetTo(navigation, menuRouteByLang(saved), { freePreview: true });
                return;
              }
              deepResetTo(navigation, menuRouteByLang(saved), {});
            }}
            activeOpacity={0.85}
          >
            <Text
              style={[styles.btnText, styles.btnTextSolid]}
              maxFontSizeMultiplier={1.2}
            >
              {S.postContinue}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" bounces>
          {/* Верхний блок */}
          <View style={styles.headerBox}>
            <Text style={styles.headerTitle} maxFontSizeMultiplier={1.2}>
              <Text style={styles.headerEmph} maxFontSizeMultiplier={1.2}>
                {STR[langKey]?.headerTrialEmph}
              </Text>
              {!!STR[langKey]?.headerTrialTail && (
                <Text maxFontSizeMultiplier={1.2}> {STR[langKey]?.headerTrialTail}</Text>
              )}
            </Text>
          </View>

          {/* Промокод */}
          <View style={styles.spacer} />
          <Text style={styles.label} maxFontSizeMultiplier={1.2}>
            {STR[langKey]?.promoLabel}
          </Text>
          <View style={styles.promoRow}>
            <View style={[styles.inputWrap, styles.promoInputNarrow, promoOK ? styles.inputWrapOK : null]}>
              <TextInput
                style={[styles.input, promoOK ? styles.inputOK : null]}
                placeholder={STR[langKey]?.promoPlaceholder}
                value={code}
                onChangeText={(t) => { if (!promoOK) { setCode(t); if (!t) setPromoMsg(''); } }}
                editable={!promoOK}
                selectTextOnFocus={!promoOK}
                underlineColorAndroid="transparent"
                maxLength={32}
              />
              {promoOK && (
                <Text style={styles.checkMark} maxFontSizeMultiplier={1.2}>
                  ✓
                </Text>
              )}
            </View>
            <View style={{ width: 8 }} />
            <UIButton
              label={STR[langKey]?.apply}
              onPress={applyCodeLocal}
              disabled={promoOK || code.trim().length < 4}
              kind="solid"
              style={styles.applyButtonWide}
            />
          </View>

          {!!promoMsg && (
            <>
              <View style={styles.spacerXs} />
              <Text
                style={[styles.helper, promoOK ? styles.helperOK : styles.helperErr]}
                maxFontSizeMultiplier={1.2}
              >
                {promoMsg}
              </Text>
            </>
          )}

          {/* Выбор плана */}
          <View style={styles.spacer} />
          <Text style={styles.choosePlan} maxFontSizeMultiplier={1.2}>
            {STR[langKey]?.choosePlan}
          </Text>
          <View style={styles.spacerSm} />
          <View style={styles.planRow}>
            {planBtn('monthly', STR[langKey]?.monthly, {
              baseAmt: baseMonthlyAmt,
              segAmt: segMonthlyAmt,
              periodText: monthlyPeriodLabel,
              useStrike: useStrikeMonthly,
            })}
            <View style={{ width: 12 }} />
            {planBtn('annual', STR[langKey]?.annual, {
              baseAmt: baseAnnualAmt,
              segAmt: segAnnualAmt,
              periodText: annualPeriodLabel,
              useStrike: useStrikeAnnual,
            })}
          </View>

          <View style={styles.spacer} />
          {/* CTA: полный доступ */}
          <UIButton
            label={STR[langKey]?.startTrial}
            subLabel={S.fullAccess}
            onPress={onPrimaryCta}
            disabled={!ready || !plan}    // активна только после ручного выбора плана
            kind="solid"
            big
          />

          {/* Бесплатно */}
          <View style={styles.spacerSm} />
          <UIButton
            label={STR[langKey]?.freePreview}
            subLabel={S.limitedAccess}
            subLabel2={S.exercises12}
            onPress={goMenuFreePreview}
            kind="outline"
          />

          {/* DEV: локальный анлок */}
          {__DEV__ && __devGrantPro && !hasPro && (
            <>
              <View style={styles.spacerSm} />
              <UIButton
                label="DEV: Unlock ALL exercises"
                subLabel="Skip paywall (local only)"
                onPress={devUnlockAll}
                kind="outline"
              />
            </>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomArea}>
        {SHOW_PLAY_REDEEM && (
          <TouchableOpacity onPress={() => {}} activeOpacity={0.8}>
            <Text style={styles.footerLink} maxFontSizeMultiplier={1.2}>
              {STR[langKey]?.playRedeem}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={restore} activeOpacity={0.8}>
          <Text style={styles.footerLink} maxFontSizeMultiplier={1.2}>
            {STR[langKey]?.restore}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const BRAND = '#2D4769';
const BRAND_BG = '#2D4769';
const BRAND_TEXT = '#ffffff';
const ACCENT = '#bd462a';

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  scrollContent: { paddingBottom: 12 },
  spacer: { height: 14 }, spacerSm: { height: 8 }, spacerXs: { height: 6 },

  headerBox: {
    padding: 12, backgroundColor: '#F7FAFD', borderRadius: 12,
    borderWidth: 1, borderColor: '#E6EEF7', marginBottom: 8,
    alignItems: 'center',
  },
  headerTitle: { color: BRAND, fontWeight: '400', fontSize: 13.5, lineHeight: 18, textAlign: 'center' },
  headerEmph: { fontWeight: '900', color: ACCENT },

  label: { fontWeight: '600', marginBottom: 6 },
  promoRow: { flexDirection: 'row', alignItems: 'center' },
  inputWrap: { position: 'relative', flex: 1 },
  promoInputNarrow: { flex: 0.55 },
  inputWrapOK: {},
  input: {
    borderWidth: 2, borderColor: '#9aa6b2', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 14, fontWeight: '600', backgroundColor: 'white',
  },
  inputOK: { borderColor: '#2e7d32', color: '#2e7d32', fontWeight: '800', backgroundColor: '#e8f5e9' },
  checkMark: { position: 'absolute', right: 10, top: 10, fontSize: 18, color: '#2e7d32', fontWeight: '900' },
  applyButtonWide: { flex: 0.45 },
  helper: { fontSize: 12, opacity: 0.95 }, helperOK: { color: '#2e7d32' }, helperErr: { color: '#b00020' },

  planRow: { flexDirection: 'row' },
  planButtonBox: {
    flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', minHeight: 96,
  },
  planIdleBox: { borderColor: BRAND, backgroundColor: 'transparent' },
  planSelectedBox: { borderColor: BRAND, backgroundColor: BRAND_BG },
  planTitle: { fontWeight: '800', fontSize: 16, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 2 },
  planPriceBig: { fontSize: 22, fontWeight: '900' },
  planPriceOld: { fontSize: 16, textDecorationLine: 'line-through', color: '#9aa6b2' },
  planPriceNew: { fontSize: 22, fontWeight: '900' },
  planPeriod: { fontSize: 12, opacity: 0.9 },
  planIdleText: { color: BRAND },
  planSelectedText: { color: BRAND_TEXT },

  btnBox: {
    paddingVertical: 14, borderRadius: 12, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  btnBig: { paddingVertical: 18 },
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

  bottomArea: { paddingVertical: 8, alignItems: 'center' },
  footerLink: { fontSize: 14, textDecorationLine: 'underline', color: BRAND, opacity: 0.9 },

  choosePlan: { fontWeight: '800', color: ACCENT, textAlign: 'center' },

  modalWrap: {
    flex: 1, paddingHorizontal: 20, paddingTop: 32,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  modalText: { fontSize: 12, opacity: 0.9, textAlign: 'center' },
});
