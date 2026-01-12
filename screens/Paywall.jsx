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
  TIMUR2026: 'timur',
  IVRITKALA2026: 'kala',
};
const resolveSegmentByCode = (code) =>
  CODE_SEGMENTS[String(code || '').trim().toUpperCase()] || null;

/* ===== Коды доступа (партнёрские) =====
   UI готов. Чтобы заработало “по-настоящему”, пропиши URL твоего сервера
   и верни { ok: true } при успешной активации.
*/
const PARTNER_REDEEM_URL = 'https://iap-server.onrender.com/redeem/code'; // ✅ твой боевой URL

function normalizeAccessCode(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^\w-]/g, ''); // оставляем A-Z 0-9 _ и -
}
function looksLikeAccessCode(code) {
  // мягкая валидация: 8..32 символа, латиница/цифры/_/-
  if (!code) return false;
  if (code.length < 8 || code.length > 32) return false;
  return /^[A-Z0-9_-]+$/.test(code);
}
async function redeemPartnerCodeOnServer({ code, userId }) {
  if (!PARTNER_REDEEM_URL) {
    return { ok: false, message: 'Redeem server URL is not configured.' };
  }
  const res = await fetch(PARTNER_REDEEM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // ✅ сервер требует code + userId
    body: JSON.stringify({ code, userId }),
  });
  let json = null;
  try { json = await res.json(); } catch {}
  if (!res.ok) {
    return {
      ok: false,
      message: (json && (json.message || json.error)) || `HTTP ${res.status}`,
    };
  }
  return { ok: !!json?.ok, message: json?.message || '' };
}

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
    activateCode: 'Activate code',
    redeemTitle: 'Activate access code',
    redeemHint: 'Enter the access code you received from a school, course, or teacher.',
    redeemPlaceholder: 'ACCESS-CODE',
    redeemBtn: 'Activate',
    redeemCancel: 'Cancel',
    redeemWorking: 'Activating…',
    redeemInvalid: 'Please enter a valid code.',
    redeemSuccessTitle: 'Done 🎉',
    redeemSuccessBody: 'Done! Pro access is active.',
    redeemDataWarning: 'Important: do not delete the app or clear its data — access codes are tied to this device ID. If you remove the app data, you may lose Pro access.',
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
    activateCode: 'Активировать код',
    redeemTitle: 'Активация кода доступа',
    redeemHint: 'Введите код доступа, который вы получили от школы, курса или преподавателя.',
    redeemPlaceholder: 'КОД-ДОСТУПА',
    redeemBtn: 'Активировать',
    redeemCancel: 'Отмена',
    redeemWorking: 'Активируем…',
    redeemInvalid: 'Введите корректный код.',
    redeemSuccessTitle: 'Готово 🎉',
    redeemSuccessBody: 'Код активирован. Доступ Pro включён на срок действия кода.',
    redeemDataWarning:
      'Важно: не удаляйте приложение и не очищайте его данные — коды доступа привязаны к этому устройству. При удалении данных вы можете потерять доступ к Pro.',
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
    activateCode: 'Activer un code',
    redeemTitle: "Activation d’un code d’accès",
    redeemHint: 'Saisissez le code d’accès que vous avez reçu d’une école, d’un cours ou d’un professeur.',
    redeemPlaceholder: 'CODE-ACCÈS',
    redeemBtn: 'Activer',
    redeemCancel: 'Annuler',
    redeemWorking: 'Activation…',
    redeemInvalid: 'Veuillez entrer un code valide.',
    redeemSuccessTitle: 'OK 🎉',
    redeemSuccessBody: 'Code activé. L’accès Pro est activé pour la durée du code.',
    redeemDataWarning:
      "Important : ne supprimez pas l’application et n’effacez pas ses données — les codes d’accès sont liés à cet appareil. En cas de suppression des données, vous pouvez perdre l’accès Pro.",
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
    activateCode: 'Activar código',
    redeemTitle: 'Activación de código',
    redeemHint: 'Introduce el código de acceso que recibiste de una escuela, un curso o un profesor.',
    redeemPlaceholder: 'CÓDIGO-DE-ACCESO',
    redeemBtn: 'Activar',
    redeemCancel: 'Cancelar',
    redeemWorking: 'Activando…',
    redeemInvalid: 'Introduce un código válido.',
    redeemSuccessTitle: 'Listo 🎉',
    redeemSuccessBody: 'Código activado. El acceso Pro está activo durante la vigencia del código.',
    redeemDataWarning:
      'Importante: no elimines la aplicación ni borres sus datos — los códigos de acceso están vinculados a este dispositivo. Si borras los datos, puedes perder el acceso Pro.',
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
    activateCode: 'Ativar código',
    redeemTitle: 'Ativar código de acesso',
    redeemHint: 'Digite o código de acesso que você recebeu de uma escola, curso ou professor.',
    redeemPlaceholder: 'CÓDIGO-DE-ACESSO',
    redeemBtn: 'Ativar',
    redeemCancel: 'Cancelar',
    redeemWorking: 'Ativando…',
    redeemInvalid: 'Digite um código válido.',
    redeemSuccessTitle: 'Pronto 🎉',
    redeemSuccessBody: 'Código ativado. O acesso Pro está ativo durante a validade do código.',
    redeemDataWarning:
      'Importante: não apague o aplicativo nem limpe seus dados — os códigos de acesso estão vinculados a este dispositivo. Ao remover os dados, você pode perder o acesso Pro.',
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
    activateCode: 'ኮድ አንቃ',
    redeemTitle: 'የመዳረሻ ኮድ አንቃ',
    redeemHint: 'ከት/ቤት፣ ከኮርስ ወይም ከመምህር ያገኙትን የመዳረሻ ኮድ ያስገቡ።',
    redeemPlaceholder: 'ACCESS-CODE',
    redeemBtn: 'አንቃ',
    redeemCancel: 'ሰርዝ',
    redeemWorking: 'በመንቃት ላይ…',
    redeemInvalid: 'ትክክለኛ ኮድ ያስገቡ።',
    redeemSuccessTitle: 'ተከናውኗል 🎉',
    redeemSuccessBody: 'ኮድ ተነቅቷል። የPro መዳረሻ ለኮዱ የሚሰራበት ጊዜ ተነቅቷል።',
    redeemDataWarning:
      'አስፈላጊ፡ መተግበሪያውን አትሰርዙ እና ውሂቡን አታጥፉ — የመዳረሻ ኮዶች ከዚህ መሣሪያ ጋር ተያይዘዋል። ውሂቡን ካጠፉ የPro መዳረሻን ሊያጡ ይችላሉ።',
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
    activateCode: 'تفعيل الرمز',
    redeemTitle: 'تفعيل رمز الوصول',
    redeemHint: 'أدخل رمز الوصول الذي تلقيته من مدرسة أو دورة أو معلّم.',
    redeemPlaceholder: 'ACCESS-CODE',
    redeemBtn: 'تفعيل',
    redeemCancel: 'إلغاء',
    redeemWorking: 'جارٍ التفعيل…',
    redeemInvalid: 'يرجى إدخال رمز صالح.',
    redeemSuccessTitle: 'تم 🎉',
    redeemSuccessBody: 'تم تفعيل الرمز. تم تفعيل وصول Pro طوال مدة صلاحية الرمز.',
    redeemDataWarning:
      'مهم: لا تقم بحذف التطبيق أو مسح بياناته — رموز الوصول مرتبطة بهذا الجهاز. عند حذف البيانات قد تفقد الوصول إلى Pro.',
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
    syncCodeEntitlementFromServer,
    __devGrantPro,
    // ✅ если в твоём IapProvider уже есть userId — отлично.
    // Если называется иначе — замени строку userIdForCodes ниже.
    userId,
  } = useIap();

  const [langKey, setLangKey] = useState('english');
  const [plan, setPlan] = useState(null); // без автоподстановки
  const [code, setCode] = useState('');
  const [promoMsg, setPromoMsg] = useState('');
  const [promoOK, setPromoOK] = useState(false);

  // ✅ Модалка “Активировать код”
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [redeemInput, setRedeemInput] = useState('');
  const [redeemMsg, setRedeemMsg] = useState('');
  const [redeemOK, setRedeemOK] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);

  const isRTL = RTL_LANGS.has(langKey);
  const S = STR[langKey] || STR.english;

  const navigatedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  // Если пользователь снова попал на Paywall (например, после повторной активации/навигации),
  // разрешаем повторный auto-redirect в Pro.
  useFocusEffect(
    React.useCallback(() => {
      if (!hasPro) navigatedRef.current = false;
      return () => {};
    }, [hasPro])
  );

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

// ✅ Реальная активация кода (UI готов, сервер подключён)
const submitRedeemCode = async () => {
  if (redeemLoading) return;

  const normalized = normalizeAccessCode(redeemInput);
  if (!looksLikeAccessCode(normalized)) {
    setRedeemOK(false);
    setRedeemMsg(S.redeemInvalid);
    return;
  }

  // ✅ userId обязателен для /redeem/code
  const userIdForCodes =
    userId ||
    (await AsyncStorage.getItem('iap:deviceUserId')) ||
    null;

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
      setRedeemMsg(r.message || S.invalid);
      return;
    }

    // ✅ Успех
    setRedeemOK(true);
    setRedeemMsg(
      S.redeemSuccessBody +
        (S.redeemDataWarning ? '\n\n⚠️ ' + S.redeemDataWarning : '')
    );

    // ✅ 1) Убираем "режим 2 упражнений", если пользователь заходил через free-preview
    try {
      await AsyncStorage.removeItem('freePreview');
    } catch {}

    // ✅ 2) Сразу синхронизируем entitlements по коду (это выставит hasPro в IapProvider)
    try {
      await syncCodeEntitlementFromServer(String(userIdForCodes));
    } catch (e2) {
      console.warn(
        '[PAYWALL] syncCodeEntitlementFromServer failed:',
        e2?.message || e2
      );
    }

    // ✅ (микротик, чтобы стейт успел примениться до навигации)
    await new Promise((res) => setTimeout(res, 0));

    // ✅ 3) Закрываем модалку и уходим в Pro-меню
    setRedeemModalVisible(false);

    // try {
    //   const savedLang = (await AsyncStorage.getItem('language')) || 'english';
    //   deepResetTo(navigation, menuRouteByLang(savedLang), { freePreview: false });
    // } catch (_) {}

    // ✅ на всякий случай (если внутри probePostPurchase есть доп. логика)
    try {
      probePostPurchase?.();
    } catch {}
  } catch (e) {
    setRedeemOK(false);
    setRedeemMsg(e?.message || 'Failed');
  } finally {
    setRedeemLoading(false);
  }
};


const openRedeemModal = () => {
  setRedeemInput('');
  setRedeemMsg('');
  setRedeemOK(false);
  setRedeemLoading(false);
  setRedeemModalVisible(true);
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

        <TouchableOpacity onPress={openRedeemModal} activeOpacity={0.8}>
          <Text style={styles.footerLink} maxFontSizeMultiplier={1.2}>
            {STR[langKey]?.activateCode}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={restore} activeOpacity={0.8}>
          <Text style={styles.footerLink} maxFontSizeMultiplier={1.2}>
            {STR[langKey]?.restore}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Модалка “Активировать код” — боевой UI */}
      <Modal
        visible={redeemModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRedeemModalVisible(false)}
      >
        <View style={styles.redeemOverlay}>
          <View style={styles.redeemCard}>
            <Text style={styles.redeemTitle} maxFontSizeMultiplier={1.2}>
              {S.redeemTitle}
            </Text>

            <Text style={styles.redeemHint} maxFontSizeMultiplier={1.2}>
              {S.redeemHint}
            </Text>

            <View style={[styles.redeemInputWrap, redeemOK ? styles.redeemInputWrapOK : null]}>
              <TextInput
                style={[styles.redeemInput, redeemOK ? styles.redeemInputOK : null]}
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
              {redeemOK && (
                <Text style={styles.redeemCheck} maxFontSizeMultiplier={1.2}>
                  ✓
                </Text>
              )}
            </View>

            {!!redeemMsg && (
              <Text
                style={[
                  styles.redeemMsg,
                  redeemOK ? styles.redeemMsgOK : styles.redeemMsgErr,
                ]}
                maxFontSizeMultiplier={1.2}
              >
                {redeemMsg}
              </Text>
            )}
            <Text style={styles.redeemWarn} maxFontSizeMultiplier={1.2}>
              {S.redeemDataWarning}
            </Text>


            <View style={styles.redeemBtnsRow}>
              <TouchableOpacity
                style={[styles.redeemBtn, styles.redeemBtnOutline]}
                onPress={() => setRedeemModalVisible(false)}
                disabled={redeemLoading}
                activeOpacity={0.85}
              >
                <Text style={[styles.redeemBtnText, styles.redeemBtnTextOutline]} maxFontSizeMultiplier={1.2}>
                  {S.redeemCancel}
                </Text>
              </TouchableOpacity>

              <View style={{ width: 10 }} />

              <TouchableOpacity
                style={[
                  styles.redeemBtn,
                  styles.redeemBtnSolid,
                  (!looksLikeAccessCode(normalizeAccessCode(redeemInput)) || redeemLoading) && styles.btnDisabled,
                ]}
                onPress={submitRedeemCode}
                disabled={!looksLikeAccessCode(normalizeAccessCode(redeemInput)) || redeemLoading}
                activeOpacity={0.85}
              >
                <Text style={[styles.redeemBtnText, styles.redeemBtnTextSolid]} maxFontSizeMultiplier={1.2}>
                  {redeemLoading ? S.redeemWorking : S.redeemBtn}
                </Text>
              </TouchableOpacity>
            </View>

            {redeemOK && (
              <TouchableOpacity
                style={[styles.redeemRestoreQuick]}
                onPress={async () => {
                  setRedeemModalVisible(false);
                  await restore();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.redeemRestoreQuickText} maxFontSizeMultiplier={1.2}>
                  {STR[langKey]?.restore}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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

  // ✅ Redeem modal styles
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
  redeemWarn: { marginTop: 10, fontSize: 11, textAlign: 'center', opacity: 0.8 },
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