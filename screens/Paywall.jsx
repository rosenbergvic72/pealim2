// screens/Paywall.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Platform, KeyboardAvoidingView, Alert, Modal, AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { useIap } from '../src/iap/IapProvider';
import * as FirebaseAnalytics from '../src/analytics/FirebaseAnalytics';

// ★ Ограничение автоскейла шрифтов
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.maxFontSizeMultiplier = 1.2;
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.maxFontSizeMultiplier = 1.2;


const LAST_GOOD_PRO_AT_KEY = 'iap:lastGoodProAt';
const TRIAL_EVER_USED_KEY = 'iap:trialEverUsed';
const SHOW_PLAY_REDEEM = false;
const DEV_SKIP = false; // автоскок в dev — отключён

/* ===== Коридор после пост-модалки (anti-restore loop) ===== */
const GATE_SNOOZE_KEY = 'iap:gateSnoozeUntil';
const GATE_SNOOZE_MS  = 5000;

/* ===== Автовосстановление покупок: защита от спама (особенно на Android) ===== */
const RESTORE_THROTTLE_MS = 60000; // не чаще 1 раза в минуту, чтобы не дергать Google Play логин

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
  VERB30: 'verb',
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
  return { ok: !!json?.ok, message: json?.message || '', accessUntil: json?.accessUntil || null };
}

/* ===== Локализация (сокр.) ===== */
const STR = {
  english: {
  startTrial: 'CONTINUE IN GOOGLE PLAY',
  subscribe: 'CONTINUE IN GOOGLE PLAY',
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
  redeemHint:
    'Enter the access code you received from a school, course, or teacher.',
  redeemPlaceholder: 'ACCESS-CODE',
  redeemBtn: 'Activate',
  redeemCancel: 'Cancel',
  redeemWorking: 'Activating…',
  redeemInvalid: 'Please enter a valid code.',
  redeemSuccessTitle: 'Done 🎉',
  redeemSuccessBody:
    'Done! Pro access is active for the duration of the code.',
  redeemDataWarning:
    'Important: do not delete the app or clear its data — access codes are tied to this device ID. If you remove the app data, you may lose Pro access.',
  choosePlan: 'Choose a plan',
  headerTrialEmph: 'Full access to all exercises',
  headerTrialTail:
    '. Choose a plan and continue in Google Play. If you have a promo code — enter it before subscribing. If you have an access code from a school or course — tap “Activate code”. You can cancel anytime in Google Play.',
  headerNoTrialEmph: 'Full access to all exercises',
  headerNoTrialTail:
     '. Choose a plan and continue in Google Play. If you have a promo code — enter it before subscribing. If you have an access code from a school or course — tap “Activate code”. You can cancel anytime in Google Play.',
  freePreview: 'CONTINUE FOR FREE',
  freePreviewSubtitle: 'Trial period • Full access',
  fullAccess: 'Full access',
  limitedAccess: 'Train 350 Hebrew verbs',
  exercises12: 'Exercises 1 and 2 are always free',
  postTitle: 'Subscription activated 🎉',
  postBody:
    'Full access is unlocked. If you receive a Google Play email about “registering” the subscription — it’s standard; access is already granted.',
  postContinue: 'Continue',
  fullAccessAllExercises: 'Full access • All exercises',
},

  русский: {
    startTrial: 'ПРОДОЛЖИТЬ В GOOGLE PLAY',
    subscribe: 'ПРОДОЛЖИТЬ В GOOGLE PLAY',
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
    choosePlan: 'Выберите план',
    headerTrialEmph: 'Полный доступ ко всем упражнениям',
    headerTrialTail:
  '. Выберите план и продолжите оформление в Google Play. Если у вас есть промокод — введите его перед оформлением. Если у вас есть код доступа от школы или курса — нажмите «Активировать код». Подписку можно отменить в любой момент в Google Play.',
    headerNoTrialEmph: 'Полный доступ ко всем упражнениям',
    headerNoTrialTail:
      '. Выберите план и продолжите оформление в Google Play. Если у вас есть промокод — введите его перед оформлением. Если у вас есть код доступа от школы или курса — нажмите «Активировать код». Подписку можно отменить в любой момент в Google Play.',
    freePreview: 'ПРОДОЛЖИТЬ БЕСПЛАТНО',
     freePreviewSubtitle: 'Пробный период - полный доступ',

    // freePreviewSubtitle: 'Тренируйте 350 глаголов иврита',
    fullAccess: 'Полный доступ',
    limitedAccess: 'Тренируйте 350 глаголов иврита',
    exercises12: 'Упражнения 1 и 2 доступны всегда',
    postTitle: 'Подписка активирована 🎉',
    postBody:
      'Доступ ко всем функциям открыт. Если придёт письмо Google о «регистрации у разработчика» — это стандартное письмо, доступ уже предоставлен.',
    postContinue: 'Продолжить',
    fullAccessAllExercises: 'Полный доступ • Все упражнения',
  },

  français: {
  startTrial: 'CONTINUER DANS GOOGLE PLAY',
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
  redeemHint:
    'Saisissez le code d’accès que vous avez reçu d’une école, d’un cours ou d’un professeur.',
  redeemPlaceholder: 'CODE-ACCÈS',
  redeemBtn: 'Activer',
  redeemCancel: 'Annuler',
  redeemWorking: 'Activation…',
  redeemInvalid: 'Veuillez entrer un code valide.',
  redeemSuccessTitle: 'OK 🎉',
  redeemSuccessBody:
    'Code activé. L’accès Pro est activé pour la durée du code.',
  redeemDataWarning:
    "Important : ne supprimez pas l’application et n’effacez pas ses données — les codes d’accès sont liés à cet appareil. En cas de suppression des données, vous pouvez perdre l’accès Pro.",
  choosePlan: 'Choisissez une formule',
  headerTrialEmph: 'Accès complet à tous les exercices',
  headerTrialTail:
    '. Choisissez une formule et continuez dans Google Play. Si vous avez un code promo — saisissez-le avant l’abonnement. Si vous avez un code d’accès d’une école ou d’un cours — appuyez sur « Activer un code ». Résiliation possible à tout moment dans Google Play.',
  headerNoTrialEmph: 'Accès complet à tous les exercices',
  headerNoTrialTail:
    '. Choisissez une formule et continuez dans Google Play. Résiliation possible à tout moment.',
  freePreview: 'CONTINUER GRATUITEMENT',
  freePreviewSubtitle: 'Période d’essai • Accès complet',
  fullAccess: 'Accès complet',
  limitedAccess: 'Entraîne 350 verbes en hébreu',
  exercises12: 'Les exercices 1 et 2 restent toujours gratuits',
  postTitle: 'Abonnement activé 🎉',
  postBody:
    'Accès complet débloqué. L’e-mail Google Play sur « l’enregistrement » est standard ; l’accès est déjà accordé.',
  postContinue: 'Continuer',
  fullAccessAllExercises: 'Accès complet • Tous les exercices',
},

español: {
  startTrial: 'CONTINUAR EN GOOGLE PLAY',
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
  redeemHint:
    'Introduce el código de acceso que recibiste de una escuela, un curso o un profesor.',
  redeemPlaceholder: 'CÓDIGO-DE-ACCESO',
  redeemBtn: 'Activar',
  redeemCancel: 'Cancelar',
  redeemWorking: 'Activando…',
  redeemInvalid: 'Introduce un código válido.',
  redeemSuccessTitle: 'Listo 🎉',
  redeemSuccessBody:
    'Código activado. El acceso Pro está activo durante la vigencia del código.',
  redeemDataWarning:
    'Importante: no elimines la aplicación ni borres sus datos — los códigos de acceso están vinculados a este dispositivo. Si borras los datos, puedes perder el acceso Pro.',
  choosePlan: 'Elige un plan',
  headerTrialEmph: 'Acceso completo a todos los ejercicios',
  headerTrialTail:
    '. Elige un plan y continúa en Google Play. Si tienes un código promocional, introdúcelo antes de suscribirte. Si tienes un código de acceso de una escuela o curso, pulsa «Activar código». Puedes cancelar en cualquier momento en Google Play.',
  headerNoTrialEmph: 'Acceso completo a todos los ejercicios',
  headerNoTrialTail:
    '. Elige un plan y continúa en Google Play. Puedes cancelar en cualquier momento.',
  freePreview: 'CONTINUAR GRATIS',
  freePreviewSubtitle: 'Período de prueba • Acceso completo',
  fullAccess: 'Acceso completo',
  limitedAccess: 'Entrena 350 verbos en hebreo',
  exercises12: 'Los ejercicios 1 y 2 siempre son gratuitos',
  postTitle: 'Suscripción activada 🎉',
  postBody:
    'Acceso completo desbloqueado. El correo de Google Play sobre “registrar” es normal; el acceso ya está concedido.',
  postContinue: 'Continuar',
  fullAccessAllExercises: 'Acceso completo • Todos los ejercicios',
},

português: {
  startTrial: 'CONTINUAR NO GOOGLE PLAY',
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
  redeemHint:
    'Digite o código de acesso que você recebeu de uma escola, curso ou professor.',
  redeemPlaceholder: 'CÓDIGO-DE-ACESSO',
  redeemBtn: 'Ativar',
  redeemCancel: 'Cancelar',
  redeemWorking: 'Ativando…',
  redeemInvalid: 'Digite um código válido.',
  redeemSuccessTitle: 'Pronto 🎉',
  redeemSuccessBody:
    'Código ativado. O acesso Pro está ativo durante a validade do código.',
  redeemDataWarning:
    'Importante: não apague o aplicativo nem limpe seus dados — os códigos de acesso estão vinculados a este dispositivo. Ao remover os dados, você pode perder o acesso Pro.',
  choosePlan: 'Escolha um plano',
  headerTrialEmph: 'Acesso total a todos os exercícios',
  headerTrialTail:
    '. Escolha um plano e continue no Google Play. Se você tiver um código promocional, insira-o antes da assinatura. Se você tiver um código de acesso de uma escola ou curso, toque em «Ativar código». Você pode cancelar a qualquer momento no Google Play.',
  headerNoTrialEmph: 'Acesso total a todos os exercícios',
  headerNoTrialTail:
    '. Escolha um plano e continue no Google Play. Você pode cancelar a qualquer momento.',
  freePreview: 'CONTINUAR GRÁTIS',
  freePreviewSubtitle: 'Período de teste • Acesso total',
  fullAccess: 'Acesso total',
  limitedAccess: 'Treine 350 verbos em hebraico',
  exercises12: 'Os exercícios 1 e 2 continuam gratuitos',
  postTitle: 'Assinatura ativada 🎉',
  postBody:
    'Acesso completo liberado. O e-mail do Google Play sobre “registro” é padrão; o acesso já foi concedido.',
  postContinue: 'Continuar',
  fullAccessAllExercises: 'Acesso total • Todos os exercícios',
},

العربية: {
  startTrial: 'المتابعة في GOOGLE PLAY',
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
  redeemHint:
    'أدخل رمز الوصول الذي تلقيته من مدرسة أو دورة أو معلّم.',
  redeemPlaceholder: 'ACCESS-CODE',
  redeemBtn: 'تفعيل',
  redeemCancel: 'إلغاء',
  redeemWorking: 'جارٍ التفعيل…',
  redeemInvalid: 'يرجى إدخال رمز صالح.',
  redeemSuccessTitle: 'تم 🎉',
  redeemSuccessBody:
    'تم تفعيل الرمز. تم تفعيل وصول Pro طوال مدة صلاحية الرمز.',
  redeemDataWarning:
    'مهم: لا تقم بحذف التطبيق أو مسح بياناته — رموز الوصول مرتبطة بهذا الجهاز. عند حذف البيانات قد تفقد الوصول إلى Pro.',
  choosePlan: 'اختر خطة',
  headerTrialEmph: 'وصول كامل إلى جميع التمارين',
  headerTrialTail:
    '. اختر خطة وتابع عبر Google Play. إذا كان لديك رمز ترويجي، فأدخله قبل الاشتراك. وإذا كان لديك رمز وصول من مدرسة أو دورة، فاضغط على «تفعيل الرمز». يمكنك الإلغاء في أي وقت عبر Google Play.',
  headerNoTrialEmph: 'وصول كامل إلى جميع التمارين',
  headerNoTrialTail:
    '. اختر خطة وتابع عبر Google Play. يمكنك الإلغاء في أي وقت.',
  freePreview: 'المتابعة مجانًا',
  freePreviewSubtitle: 'فترة تجريبية • وصول كامل',
  fullAccess: 'وصول كامل',
  limitedAccess: 'تدرّب على 350 فعلًا عبريًا',
  exercises12: 'التمرينان 1 و2 متاحان دائمًا مجانًا',
  postTitle: 'تم تفعيل الاشتراك 🎉',
  postBody:
    'تم فتح الوصول الكامل. رسالة “التسجيل لدى المطوّر” من Google Play إجراء قياسي؛ تم منح الوصول.',
  postContinue: 'متابعة',
  fullAccessAllExercises: 'وصول كامل • جميع التمارين',
},

አማርኛ: {
  startTrial: 'በGOOGLE PLAY ቀጥል',
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
  redeemHint:
    'ከትምህርት ቤት፣ ከኮርስ ወይም ከመምህር ያገኙትን የመዳረሻ ኮድ ያስገቡ።',
  redeemPlaceholder: 'ACCESS-CODE',
  redeemBtn: 'አንቃ',
  redeemCancel: 'ሰርዝ',
  redeemWorking: 'በመንቃት ላይ…',
  redeemInvalid: 'ትክክለኛ ኮድ ያስገቡ።',
  redeemSuccessTitle: 'ተከናውኗል 🎉',
  redeemSuccessBody:
    'ኮድ ተነቅቷል። የPro መዳረሻ ለኮዱ የሚሰራበት ጊዜ ተነቅቷል።',
  redeemDataWarning:
    'አስፈላጊ፡ መተግበሪያውን አትሰርዙ እና ውሂቡን አታጥፉ — የመዳረሻ ኮዶች ከዚህ መሣሪያ ጋር ተያይዘዋል። ውሂቡን ካጠፉ የPro መዳረሻን ሊያጡ ይችላሉ።',
  choosePlan: 'እቅድ ይምረጡ',
  headerTrialEmph: 'ሙሉ መዳረሻ ለሁሉም ልምምዶች',
  headerTrialTail:
    '። እቅድ ይምረጡ እና በGoogle Play ይቀጥሉ። ፕሮሞ ኮድ ካለዎት ከመመዝገብዎ በፊት ያስገቡት። ከትምህርት ቤት ወይም ኮርስ የተሰጠዎት የመዳረሻ ኮድ ካለ «ኮድ አንቃ» የሚለውን ይጫኑ። በGoogle Play ውስጥ በማንኛውም ጊዜ ማቋረጥ ይቻላል።',
  headerNoTrialEmph: 'ሙሉ መዳረሻ ለሁሉም ልምምዶች',
  headerNoTrialTail:
    '። እቅድ ይምረጡ እና በGoogle Play ይቀጥሉ። በማንኛውም ጊዜ ማቋረጥ ይቻላል።',
  freePreview: 'በነፃ ቀጥል',
  freePreviewSubtitle: 'የሙከራ ጊዜ • ሙሉ መዳረሻ',
  fullAccess: 'ሙሉ መዳረሻ',
  limitedAccess: '350 የዕብራይስጥ ግሶችን ይለማመዱ',
  exercises12: 'ልምምድ 1 እና 2 ሁልጊዜ በነፃ ይገኛሉ',
  postTitle: 'መመዝገብ ተከናውኗል 🎉',
  postBody:
    'ሙሉ መዳረሻ ተከፍቷል። የ Google Play “ምዝገባ” ኢሜይል መደበኛ ነው፤ መዳረሻ አስቀድሞ ተሰጥቷል።',
  postContinue: 'ቀጥል',
  fullAccessAllExercises: 'ሙሉ መዳረሻ • ሁሉም ልምምዶች',
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

function welcomeRouteByLang(lang) {
  switch (lang) {
    case 'english':   return 'WelcomePageEn';
    case 'русский':   return 'WelcomePage';
    case 'français':  return 'WelcomePageFr';
    case 'español':   return 'WelcomePageEs';
    case 'português': return 'WelcomePagePt';
    case 'العربية':   return 'WelcomePageAr';
    case 'አማርኛ':    return 'WelcomePageAm';
    default:          return 'WelcomePageEn';
  }
}

function deepResetTo(nav, name, params) {
  nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name, params }] }));
}

export default function Paywall({ navigation, route }) {
  const {
    available, ready, buyMonthly, buyAnnual,
    hasPro, restore, displayPrices,
    shouldShowPost, markPostShown,
    applyPromoCode, probePostPurchase,
    syncCodeEntitlementFromServer,
    applyCodeEntitlementLocal,
    __devGrantPro,
    // ✅ если в твоём IapProvider уже есть userId — отлично.
    // Если называется иначе — замени строку userIdForCodes ниже.
    userId,
  } = useIap();

  const [langKey, setLangKey] = useState('english');
  const [languageLoaded, setLanguageLoaded] = useState(false);
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
const [trialEverUsed, setTrialEverUsed] = useState(false);
const [trialFlagReady, setTrialFlagReady] = useState(false);

  const isRTL = RTL_LANGS.has(langKey);
  const S = STR[langKey] || STR.english;
  const showTrial = !trialFlagReady ? true : !trialEverUsed;

  const paywallLoggedRef = useRef(false);

useEffect(() => {
  if (paywallLoggedRef.current) return;
  if (!trialFlagReady) return;
if (!languageLoaded) return;

  paywallLoggedRef.current = true;

  FirebaseAnalytics.logFirebaseEvent('paywall_screen_opened', {
    language: langKey,
    from: route?.params?.from || 'unknown',
    promo_discount: route?.params?.promoDiscount || null,
    show_trial_text: showTrial,
    has_pro: hasPro,
    ready,
    user_id: userId || null,
  });
}, [
  trialFlagReady,
    languageLoaded,
  langKey,
  showTrial,
  hasPro,
  ready,
  userId,
  route?.params?.from,
  route?.params?.promoDiscount,
]);


  const navigatedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  // ✅ Защита: restore() может вызывать системный запрос аккаунта/пароля на Android.
  // Поэтому делаем троттлинг + блокировку повторных вызовов (даже если restore пересоздается в провайдере).
  const restoreFnRef = useRef(restore);
  const showPostRef = useRef(false);
  const redeemVisibleRef = useRef(false);
  const restoreLockRef = useRef({ inFlight: false, lastAt: 0 });

  useEffect(() => { restoreFnRef.current = restore; }, [restore]);
  useEffect(() => { showPostRef.current = !!(hasPro && !!shouldShowPost); }, [hasPro, shouldShowPost]);
  useEffect(() => { redeemVisibleRef.current = !!redeemModalVisible; }, [redeemModalVisible]);

  const maybeRestoreSafe = useCallback(async (reason) => {
    try {
      if (redeemVisibleRef.current) return;
      if (showPostRef.current) return;
      if (await isGateSnoozed()) return;

      const now = Date.now();
      const lock = restoreLockRef.current;
      if (lock.inFlight) return;
      if (lock.lastAt && now - lock.lastAt < RESTORE_THROTTLE_MS) return;

      lock.inFlight = true;
      lock.lastAt = now;
      await restoreFnRef.current?.();
    } catch (e) {
      console.warn('[PAYWALL] restore skipped/failed:', reason, e?.message || e);
    } finally {
      restoreLockRef.current.inFlight = false;
    }
  }, []);

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
    try {
      const saved = await AsyncStorage.getItem('language');
      if (saved && STR[saved]) setLangKey(saved);
    } finally {
      setLanguageLoaded(true);
    }
  })();
}, []);

  /* trial flag (hide free-trial messaging after any previous Pro on this device) */
  useEffect(() => {
    (async () => {
      try {
        const lastGood = await AsyncStorage.getItem(LAST_GOOD_PRO_AT_KEY);
        const explicit = await AsyncStorage.getItem(TRIAL_EVER_USED_KEY);
        const ever = (!!lastGood && Number(lastGood) > 0) || explicit === 'true';
        setTrialEverUsed(ever);
      } catch (_) {
        // ignore
      } finally {
        setTrialFlagReady(true);
      }
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

  /* при фокусе — мягко попробуем восстановить доступ (с троттлингом) */
useFocusEffect(
  useCallback(() => {
    let canceled = false;
    (async () => {
      if (canceled) return;
      await maybeRestoreSafe('focus');
    })();
    return () => { canceled = true; };
  }, [maybeRestoreSafe]),
);

  /* AppState → active: мягко попробуем восстановить доступ (с троттлингом) */
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
    // ✅ после DEV-анлока не дергаем restore какое-то время — иначе может сбросить hasPro обратно
    try { await writeGateSnooze(60000); } catch {}
    try { restoreLockRef.current.lastAt = Date.now(); } catch {}
    const saved = (await AsyncStorage.getItem('language')) || 'english';
    deepResetTo(navigation, menuRouteByLang(saved), {});
  };

// ✅ Реальная активация кода (UI готов, сервер подключён)
// После успеха: reset на Welcome (если язык выбран) или на SelectLanguage (если нет)
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
    setRedeemMsg(S.redeemSuccessBody);

    // ✅ 1) Убираем "режим 2 упражнений", если пользователь заходил через free-preview
    try {
      await AsyncStorage.removeItem('freePreview');
    } catch {}

    // ✅ 1.5) МГНОВЕННО включаем Pro локально по accessUntil (без ожидания /entitlements и без 15s anti-spam)
    if (r?.accessUntil) {
      try {
        await applyCodeEntitlementLocal(String(r.accessUntil));
      } catch (e0) {
        console.warn('[PAYWALL] applyCodeEntitlementLocal failed:', e0?.message || e0);
      }
    }

    // ✅ 2) Сразу синхронизируем entitlements по коду (это выставит hasPro в IapProvider)
    try {
      await syncCodeEntitlementFromServer(String(userIdForCodes));
    } catch (e2) {
      console.warn(
        '[PAYWALL] syncCodeEntitlementFromServer failed:',
        e2?.message || e2
      );
    }

    // ✅ 2.5) Коридор, чтобы restore не закинул обратно на Paywall (anti-loop)
    try {
      await writeGateSnooze();
    } catch {}
    try { restoreLockRef.current.lastAt = Date.now(); } catch {}

    // ✅ (микротик, чтобы стейт успел примениться до навигации)
    await new Promise((res) => setTimeout(res, 0));

    // ✅ 3) Закрываем модалку
    setRedeemModalVisible(false);

    // ✅ 4) Reset на Welcome или SelectLanguage
    try {
      const savedLang = await AsyncStorage.getItem('language');

      if (!savedLang) {
        // язык ещё не выбран
        deepResetTo(navigation, 'SelectLanguage', { from: 'redeem' });
      } else {
        // язык выбран — ведём на Welcome по языку
        deepResetTo(navigation, welcomeRouteByLang(savedLang), { language: savedLang, from: 'redeem' });
      }
    } catch (e3) {
      console.warn('[PAYWALL] redirect after redeem failed:', e3?.message || e3);
    }

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

  const UIButton = ({ label, subLabel, subLabel2, subLabelStyle, subLabel2Style, subLabelAccent = false, onPress, disabled, kind = 'outline', big = false, style }) => (
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
        subLabelStyle,
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
          style={[
            styles.btnSubText,
            kind === 'solid' ? styles.btnSubTextSolid : styles.btnSubTextOutline,
            subLabelAccent && styles.btnSubTextAccent,
            subLabelStyle,
          ]}
          maxFontSizeMultiplier={1.2}
        >
          {subLabel}
        </Text>
      )}
      {!!subLabel2 && (
        <Text
          style={[styles.btnSubText2, kind === 'solid' ? styles.btnSubTextSolid : styles.btnSubTextOutline, subLabel2Style,]}
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
      style={[
        styles.planButtonBox,
        selected ? styles.planSelectedBox : styles.planIdleBox,
      ]}
      onPress={() => {
  setPlan(which);

 FirebaseAnalytics.logFirebaseEvent('plan_selected', {
  plan: which,
  language: langKey,
  from: route?.params?.from || 'unknown',
  promo_applied: promoOK,
  base_price: baseAmt || null,
  promo_price: segAmt || null,
  price: segAmt || baseAmt || null,
  user_id: userId || null,
});
}}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.planTitle,
          selected ? styles.planSelectedText : styles.planIdleText,
        ]}
        maxFontSizeMultiplier={1.2}
      >
        {title}
      </Text>

      <View style={styles.priceColumn}>
        {useStrike && (
          <Text
            style={styles.planPriceOld}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            maxFontSizeMultiplier={1.2}
          >
            {baseAmt}
          </Text>
        )}

        <Text
          style={[
            useStrike ? styles.planPriceNew : styles.planPriceBig,
            selected ? styles.planSelectedText : styles.planIdleText,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          maxFontSizeMultiplier={1.2}
        >
          {segAmt || baseAmt || '…'}
        </Text>
      </View>

      <Text
        style={[
          styles.planPeriod,
          selected ? styles.planSelectedText : styles.planIdleText,
        ]}
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
                {showTrial ? S.headerTrialEmph : S.headerNoTrialEmph}
              </Text>
              {!!STR[langKey]?.headerTrialTail && (
                <Text maxFontSizeMultiplier={1.2}> {showTrial ? S.headerTrialTail : S.headerNoTrialTail}</Text>
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
            label={showTrial ? S.startTrial : S.subscribe}
            subLabel={S.fullAccessAllExercises}
            onPress={onPrimaryCta}
            disabled={!ready || !plan}    // активна только после ручного выбора плана
            kind="solid"
            big
          />

          {/* Бесплатно */}
          <View style={styles.spacerSm} />
      <UIButton
  label={STR[langKey]?.freePreview}
  subLabel={STR[langKey]?.freePreviewSubtitle}
  subLabelAccent
  subLabel2={`${S.limitedAccess}\n${S.exercises12}`}
  onPress={goMenuFreePreview}
  kind="outline"
  subLabelStyle={{ fontSize: 16 }}   // ✅ больше только тут
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
  priceColumn: {
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  marginBottom: 2,
},

planPriceOld: {
  fontSize: 16,
  textDecorationLine: 'line-through',
  color: '#9aa6b2',
  marginBottom: 2,
  textAlign: 'center',
},

planPriceBig: {
  fontSize: 22,
  fontWeight: '900',
  textAlign: 'center',
},

planPriceNew: {
  fontSize: 22,
  fontWeight: '900',
  textAlign: 'center',
},
  // planPriceBig: { fontSize: 22, fontWeight: '900' },
  // planPriceOld: { fontSize: 16, textDecorationLine: 'line-through', color: '#9aa6b2' },
  // planPriceNew: { fontSize: 22, fontWeight: '900' },
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
  btnSubText: { marginTop: 2, fontSize: 13, opacity: 0.9, fontWeight: '600',textAlign: 'center' },
  btnSubText2: { marginTop: 1, fontSize: 14, opacity: 0.8, fontWeight: '600', textAlign: 'center' },
  btnSubTextOutline: { color: BRAND },
  btnSubTextSolid: { color: BRAND_TEXT },
  btnSubTextAccent: { color: ACCENT, fontWeight: '900', opacity: 1 },

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