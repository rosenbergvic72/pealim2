// screens/PaywallIOS.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
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

// iOS links
const PRIVACY_URL = 'https://verbifyapp.netlify.app/privacy';
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

const GATE_SNOOZE_KEY = 'iap:gateSnoozeUntil';
const GATE_SNOOZE_MS = 5000;
const RESTORE_THROTTLE_MS = 60000;

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

    headerTrial:
      'Subscription. Choose a plan and continue in the App Store. If you have a promo code or an access code from a school or course, enter it before subscribing by tapping Enter App Store Promo Code. You can cancel your subscription at any time in the App Store.',
    headerTrialBadge: '7-DAY FREE TRIAL (for new subscribers).',
    headerNoTrial:
      'Subscription. Choose a plan and continue in the App Store. If you have a promo code or an access code from a school or course, enter it before subscribing by tapping Enter App Store Promo Code. You can cancel your subscription at any time in the App Store.',

    freePreview: 'CONTINUE FOR FREE',
    freePreviewSubtitle: 'Train 350 Hebrew verbs',
    limitedAccess: 'Limited access',
    exercises12: 'Exercises 1 & 2',
    trialFullAccess: 'Full access during the trial period',

    redeemUnderCta: 'Enter App Store promo code',
    restore: 'Restore access',

    privacy: 'Privacy Policy',
    terms: 'Terms of Use',

    subInfoTitle: 'Subscription information',
    subInfoName: 'Subscription',
    subInfoLength: 'Length',
    subInfoPrice: 'Price',
    planCol: 'Plan',

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
    subscribe: 'ПРОДОЛЖИТЬ В APP STORE',
    fullAccessAll: 'Полный доступ • Все упражнения',

    headerTrial:
      'Подписка. Выберите план и продолжите оформление в App Store. Если у вас есть промокод или код доступа от школы или курса — введите его перед оформлением, нажав Ввести промокод App Store. Подписку можно отменить в любой момент в App Store.',
    headerTrialBadge: '7 ДНЕЙ БЕСПЛАТНОГО ДОСТУПА (для новых подписчиков).',
    headerNoTrial:
      'Подписка. Выберите план и продолжите оформление в App Store. Если у вас есть промокод или код доступа от школы или курса — введите его перед оформлением, нажав Ввести промокод App Store. Подписку можно отменить в любой момент в App Store.',

    freePreview: 'ПРОДОЛЖИТЬ БЕСПЛАТНО',
    freePreviewSubtitle: 'Тренируйте 350 глаголов иврита',
    limitedAccess: 'Ограниченный доступ',
    exercises12: 'Упражнения 1 и 2',
    trialFullAccess: 'Полный доступ во время пробного периода',

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

  français: {
    choosePlan: 'Choisissez un abonnement',
    monthly: 'Mensuel',
    annual: 'Annuel',
    subscribe: "S'ABONNER",
    fullAccessAll: 'Accès complet • Tous les exercices',

    headerTrial:
      'Abonnement. Choisissez une formule et poursuivez dans l’App Store. Si vous avez un code promo ou un code d’accès fourni par une école ou un cours, saisissez-le avant l’abonnement en appuyant sur Saisir un code promo App Store. Vous pouvez annuler votre abonnement à tout moment dans l’App Store.',
    headerTrialBadge: '7 JOURS D’ESSAI GRATUIT (pour les nouveaux abonnés).',
    headerNoTrial:
      'Abonnement. Choisissez une formule et poursuivez dans l’App Store. Si vous avez un code promo ou un code d’accès fourni par une école ou un cours, saisissez-le avant l’abonnement en appuyant sur Saisir un code promo App Store. Vous pouvez annuler votre abonnement à tout moment dans l’App Store.',

    freePreview: 'CONTINUER GRATUITEMENT',
    freePreviewSubtitle: 'Entraînez 350 verbes hébreux',
    limitedAccess: 'Accès limité',
    exercises12: 'Exercices 1 et 2',
    trialFullAccess: 'Accès complet pendant la période d’essai',

    redeemUnderCta: 'Saisir un code promo App Store',
    restore: "Restaurer l’accès",

    privacy: 'Politique de confidentialité',
    terms: "Conditions d’utilisation",

    subInfoTitle: "Informations sur l’abonnement",
    subInfoName: 'Abonnement',
    subInfoLength: 'Durée',
    subInfoPrice: 'Prix',
    planCol: 'Formule',

    loadingPrices: 'Chargement des prix…',
    selectPlanTitle: 'Choisissez un abonnement',
    selectPlanBody: "Veuillez sélectionner une formule d’abonnement.",
    notReadyTitle: 'Pas encore prêt',
    notReadyBody: "La boutique n’est pas encore prête.",
    storeUnavailableTitle: 'Boutique indisponible',
    storeUnavailableBody:
      "Les abonnements ne sont pas chargés sur cet appareil. Réinstallez la build TestFlight et vérifiez que les achats intégrés sont attachés à la build dans App Store Connect.",

    iosLegalText:
      "Le paiement sera facturé à votre compte Apple ID lors de la confirmation de l’achat. L’abonnement se renouvelle automatiquement sauf si le renouvellement automatique est désactivé au moins 24 heures avant la fin de la période en cours. Vous pouvez gérer et annuler votre abonnement dans les réglages de votre compte App Store.",
  },

  español: {
    choosePlan: 'Elige un plan',
    monthly: 'Mensual',
    annual: 'Anual',
    subscribe: 'SUSCRIBIRSE',
    fullAccessAll: 'Acceso completo • Todos los ejercicios',

    headerTrial:
      'Suscripción. Elige un plan y continúa en el App Store. Si tienes un código promocional o un código de acceso de una escuela o curso, introdúcelo antes de suscribirte pulsando Introducir código promocional de App Store. Puedes cancelar tu suscripción en cualquier momento en el App Store.',
    headerTrialBadge: '7 DÍAS DE PRUEBA GRATIS (para nuevos suscriptores).',
    headerNoTrial:
      'Suscripción. Elige un plan y continúa en el App Store. Si tienes un código promocional o un código de acceso de una escuela o curso, introdúcelo antes de suscribirte pulsando Introducir código promocional de App Store. Puedes cancelar tu suscripción en cualquier momento en el App Store.',

    freePreview: 'CONTINUAR GRATIS',
    freePreviewSubtitle: 'Practica 350 verbos hebreos',
    limitedAccess: 'Acceso limitado',
    exercises12: 'Ejercicios 1 y 2',
    trialFullAccess: 'Acceso completo durante el período de prueba',

    redeemUnderCta: 'Introducir código promocional de App Store',
    restore: 'Restaurar acceso',

    privacy: 'Política de privacidad',
    terms: 'Términos de uso',

    subInfoTitle: 'Información de la suscripción',
    subInfoName: 'Suscripción',
    subInfoLength: 'Duración',
    subInfoPrice: 'Precio',
    planCol: 'Plan',

    loadingPrices: 'Cargando precios…',
    selectPlanTitle: 'Elige un plan',
    selectPlanBody: 'Selecciona un plan de suscripción.',
    notReadyTitle: 'Aún no está listo',
    notReadyBody: 'La tienda aún no está lista.',
    storeUnavailableTitle: 'Tienda no disponible',
    storeUnavailableBody:
      'Las suscripciones no se cargaron en este dispositivo. Reinstala la build de TestFlight y asegúrate de que las compras integradas estén asociadas a la build en App Store Connect.',

    iosLegalText:
      'El pago se cargará a tu cuenta de Apple ID al confirmar la compra. La suscripción se renueva automáticamente salvo que desactives la renovación automática al menos 24 horas antes del final del período actual. Puedes gestionar y cancelar tus suscripciones en los ajustes de tu cuenta del App Store.',
  },

  português: {
    choosePlan: 'Escolha um plano',
    monthly: 'Mensal',
    annual: 'Anual',
    subscribe: 'ASSINAR',
    fullAccessAll: 'Acesso completo • Todos os exercícios',

    headerTrial:
      'Assinatura. Escolha um plano e continue na App Store. Se você tiver um código promocional ou um código de acesso de uma escola ou curso, insira-o antes de assinar tocando em Inserir código promocional da App Store. Você pode cancelar sua assinatura a qualquer momento na App Store.',
    headerTrialBadge: '7 DIAS DE TESTE GRÁTIS (para novos assinantes).',
    headerNoTrial:
      'Assinatura. Escolha um plano e continue na App Store. Se você tiver um código promocional ou um código de acesso de uma escola ou curso, insira-o antes de assinar tocando em Inserir código promocional da App Store. Você pode cancelar sua assinatura a qualquer momento na App Store.',

    freePreview: 'CONTINUAR GRÁTIS',
    freePreviewSubtitle: 'Pratique 350 verbos em hebraico',
    limitedAccess: 'Acesso limitado',
    exercises12: 'Exercícios 1 e 2',
    trialFullAccess: 'Acesso completo durante o período de teste',

    redeemUnderCta: 'Inserir código promocional da App Store',
    restore: 'Restaurar acesso',

    privacy: 'Política de privacidade',
    terms: 'Termos de uso',

    subInfoTitle: 'Informações da assinatura',
    subInfoName: 'Assinatura',
    subInfoLength: 'Duração',
    subInfoPrice: 'Preço',
    planCol: 'Plano',

    loadingPrices: 'Carregando preços…',
    selectPlanTitle: 'Escolha um plano',
    selectPlanBody: 'Selecione um plano de assinatura.',
    notReadyTitle: 'Ainda não está pronto',
    notReadyBody: 'A loja ainda não está pronta.',
    storeUnavailableTitle: 'Loja indisponível',
    storeUnavailableBody:
      'As assinaturas não foram carregadas neste dispositivo. Reinstale a build do TestFlight e verifique se as compras no app estão vinculadas à build no App Store Connect.',

    iosLegalText:
      'O pagamento será cobrado da sua conta Apple ID na confirmação da compra. A assinatura é renovada automaticamente, a menos que a renovação automática seja desativada pelo menos 24 horas antes do fim do período atual. Você pode gerenciar e cancelar a assinatura nas configurações da sua conta da App Store.',
  },

  العربية: {
    choosePlan: 'اختر خطة',
    monthly: 'شهري',
    annual: 'سنوي',
    subscribe: 'اشترك',
    fullAccessAll: 'وصول كامل • جميع التمارين',

    headerTrial:
      'اشتراك. اختر خطة وتابع في App Store. إذا كان لديك رمز ترويجي أو رمز وصول من مدرسة أو دورة، فأدخله قبل الاشتراك بالضغط على إدخال رمز ترويجي من App Store. يمكنك إلغاء الاشتراك في أي وقت من خلال App Store.',
    headerTrialBadge: '7 أيام تجريبية مجانية (للمشتركين الجدد).',
    headerNoTrial:
      'اشتراك. اختر خطة وتابع في App Store. إذا كان لديك رمز ترويجي أو رمز وصول من مدرسة أو دورة، فأدخله قبل الاشتراك بالضغط على إدخال رمز ترويجي من App Store. يمكنك إلغاء الاشتراك في أي وقت من خلال App Store.',

    freePreview: 'المتابعة مجانًا',
    freePreviewSubtitle: 'تدرّب على 350 فعلًا عبريًا',
    limitedAccess: 'وصول محدود',
    exercises12: 'التمرينان 1 و2',
     trialFullAccess: 'وصول كامل خلال الفترة التجريبية',

    redeemUnderCta: 'إدخال رمز ترويجي من App Store',
    restore: 'استعادة الوصول',

    privacy: 'سياسة الخصوصية',
    terms: 'شروط الاستخدام',

    subInfoTitle: 'معلومات الاشتراك',
    subInfoName: 'الاشتراك',
    subInfoLength: 'المدة',
    subInfoPrice: 'السعر',
    planCol: 'الخطة',

    loadingPrices: 'جارٍ تحميل الأسعار…',
    selectPlanTitle: 'اختر خطة',
    selectPlanBody: 'يرجى اختيار خطة اشتراك.',
    notReadyTitle: 'ليس جاهزًا بعد',
    notReadyBody: 'المتجر ليس جاهزًا بعد.',
    storeUnavailableTitle: 'المتجر غير متاح',
    storeUnavailableBody:
      'لم يتم تحميل الاشتراكات على هذا الجهاز. أعد تثبيت نسخة TestFlight وتأكد من ربط المشتريات داخل التطبيق بالبناء في App Store Connect.',

    iosLegalText:
      'سيتم تحصيل الدفع من حساب Apple ID الخاص بك عند تأكيد الشراء. يتم تجديد الاشتراك تلقائيًا ما لم يتم إيقاف التجديد التلقائي قبل 24 ساعة على الأقل من نهاية الفترة الحالية. يمكنك إدارة اشتراكك وإلغاؤه من إعدادات حسابك في App Store.',
  },

  አማርኛ: {
    choosePlan: 'እቅድ ይምረጡ',
    monthly: 'ወርሃዊ',
    annual: 'ዓመታዊ',
    subscribe: 'ይመዝገቡ',
    fullAccessAll: 'ሙሉ መዳረሻ • ሁሉም ልምምዶች',

    headerTrial:
      'ምዝገባ። እቅድ ይምረጡ እና በApp Store ይቀጥሉ። ከትምህርት ቤት ወይም ኮርስ የተሰጠ ፕሮሞ ኮድ ወይም የመዳረሻ ኮድ ካለዎት፣ ይመዝገቡ ከማለትዎ በፊት የApp Store ፕሮሞ ኮድ ያስገቡን በመጫን ያስገቡት። ምዝገባዎን በApp Store ውስጥ በማንኛውም ጊዜ ማቋረጥ ይችላሉ።',
    headerTrialBadge: '7 ቀናት ነፃ ሙከራ (ለአዲስ ተመዝጋቢዎች).',
    headerNoTrial:
      'ምዝገባ። እቅድ ይምረጡ እና በApp Store ይቀጥሉ። ከትምህርት ቤት ወይም ኮርስ የተሰጠ ፕሮሞ ኮድ ወይም የመዳረሻ ኮድ ካለዎት፣ ይመዝገቡ ከማለትዎ በፊት የApp Store ፕሮሞ ኮድ ያስገቡን በመጫን ያስገቡት። ምዝገባዎን በApp Store ውስጥ በማንኛውም ጊዜ ማቋረጥ ይችላሉ።',

    freePreview: 'በነፃ ቀጥል',
    freePreviewSubtitle: '350 የዕብራይስጥ ግሶችን ይለማመዱ',
    limitedAccess: 'የተገደበ መዳረሻ',
    exercises12: 'ልምምዶች 1 እና 2',
     trialFullAccess: 'ሙሉ መዳረሻ በሙከራ ጊዜ ውስጥ',

    redeemUnderCta: 'የApp Store ፕሮሞ ኮድ ያስገቡ',
    restore: 'መዳረሻን መመለስ',

    privacy: 'የግላዊነት ፖሊሲ',
    terms: 'የአጠቃቀም ውሎች',

    subInfoTitle: 'የምዝገባ መረጃ',
    subInfoName: 'ምዝገባ',
    subInfoLength: 'ቆይታ',
    subInfoPrice: 'ዋጋ',
    planCol: 'እቅድ',

    loadingPrices: 'ዋጋዎች በመጫን ላይ…',
    selectPlanTitle: 'እቅድ ይምረጡ',
    selectPlanBody: 'እባክዎ የምዝገባ እቅድ ይምረጡ።',
    notReadyTitle: 'ገና ዝግጁ አይደለም',
    notReadyBody: 'ማከማቻው ገና ዝግጁ አይደለም።',
    storeUnavailableTitle: 'ማከማቻው አይገኝም',
    storeUnavailableBody:
      'ምዝገባዎች በዚህ መሣሪያ ላይ አልተጫኑም። የTestFlight build እንደገና ይጫኑ እና In-App Purchases በApp Store Connect ውስጥ ከbuild ጋር መያያዛቸውን ያረጋግጡ።',

    iosLegalText:
      'ክፍያው ግዢው ሲረጋገጥ ከApple ID መለያዎ ይቆረጣል። አውቶማቲክ እድሳት ከአሁኑ ጊዜ ወቅት መጨረሻ 24 ሰዓት በፊት ካልተጠፋ በስተቀር ምዝገባው በራስ-ሰር ይታደሳል። ምዝገባዎን በApp Store መለያ ቅንብሮች ውስጥ ማስተዳደር እና ማቋረጥ ይችላሉ።',
  },
};

function periodLabel(langKey, which) {
  switch (langKey) {
    case 'русский':
      return which === 'monthly' ? 'в месяц' : 'в год';
    case 'français':
      return which === 'monthly' ? 'par mois' : 'par an';
    case 'español':
      return which === 'monthly' ? 'por mes' : 'por año';
    case 'português':
      return which === 'monthly' ? 'por mês' : 'por ano';
    case 'العربية':
      return which === 'monthly' ? 'شهريًا' : 'سنويًا';
    case 'አማርኛ':
      return which === 'monthly' ? 'በወር' : 'በዓመት';
    default:
      return which === 'monthly' ? 'per month' : 'per year';
  }
}

function lengthLabel(langKey, which) {
  switch (langKey) {
    case 'русский':
      return which === 'monthly' ? '1 месяц' : '1 год';
    case 'français':
      return which === 'monthly' ? '1 mois' : '1 an';
    case 'español':
      return which === 'monthly' ? '1 mes' : '1 año';
    case 'português':
      return which === 'monthly' ? '1 mês' : '1 ano';
    case 'العربية':
      return which === 'monthly' ? 'شهر واحد' : 'سنة واحدة';
    case 'አማርኛ':
      return which === 'monthly' ? '1 ወር' : '1 ዓመት';
    default:
      return which === 'monthly' ? '1 month' : '1 year';
  }
}

function menuRouteByLang(lang) {
  switch (lang) {
    case 'русский':
      return 'Menu';
    case 'français':
      return 'MenuFr';
    case 'español':
      return 'MenuEs';
    case 'português':
      return 'MenuPt';
    case 'العربية':
      return 'MenuAr';
    case 'አማርኛ':
      return 'MenuAm';
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
          <View style={styles.headerBox}>
            <Text style={styles.headerTitle}>
              {showTrialHeader ? S.headerTrial : S.headerNoTrial}
            </Text>

            {showTrialHeader && (
              <Text style={[styles.headerTitle, styles.headerEmph]}>{S.headerTrialBadge}</Text>
            )}
          </View>

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

          <TouchableOpacity
            style={[styles.btnBox, styles.btnSolid, (!ready || !plan) && styles.btnDisabled]}
            onPress={onSubscribe}
            disabled={!ready || !plan}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnText, styles.btnTextSolid]}>{S.subscribe}</Text>
            <Text style={[styles.btnSubText, styles.btnSubTextSolid]}>{S.fullAccessAll}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnBox, styles.btnOutline]}
            onPress={openAppStoreRedeem}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnText, styles.btnTextOutline]}>{S.redeemUnderCta}</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
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
          </TouchableOpacity> */}

          <TouchableOpacity
  style={[styles.btnBox, styles.btnOutline]}
  onPress={goMenuFreePreview}
  activeOpacity={0.85}
>
  <Text style={[styles.btnText, styles.btnTextOutline]}>
    {S.freePreview}
  </Text>

  <Text
    style={[
      styles.btnSubText,
      styles.btnSubTextOutline,
      styles.subAccent,
    ]}
  >
    {S.freePreviewSubtitle}
  </Text>

  <Text style={[styles.btnSubText2, styles.btnSubTextOutline]}>
    {S.limitedAccess} • {S.exercises12}
  </Text>

  <Text
    style={[
      styles.btnSubText2,
      styles.btnSubTextOutline,
      {
        marginTop: 6,
        fontSize: 11,
        opacity: 0.75,
      },
    ]}
  >
    {S.trialFullAccess}
  </Text>
</TouchableOpacity>

          <Text style={styles.iosLegal}>{S.iosLegalText}</Text>

          <View style={{ height: 90 }} />
        </ScrollView>
      </KeyboardAvoidingView>

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

  subInfoBox: {
    padding: 10,
    backgroundColor: '#F7FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6EEF7',
    marginBottom: 12,
  },
  subInfoTitle: {
    fontWeight: '900',
    color: BRAND,
    marginBottom: 6,
    textAlign: 'center',
    fontSize: 13.5,
  },
  subInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subInfoLabel: { fontSize: 12, color: BRAND, opacity: 0.8, fontWeight: '700' },
  subInfoValue: {
    fontSize: 12,
    color: BRAND,
    fontWeight: '900',
    textAlign: 'right',
    maxWidth: '62%',
  },

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