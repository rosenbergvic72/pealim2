import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

const UPGRADE_BANNER_TEST_MODE = true;

const PROMO_DISCOUNT = 30;

const PROMO_CODES = {
  android: {
    general: 'VERB30',
  },
  ios: {
    monthly: 'VERBMONTH30',
    annual: 'VERBYEAR30',
  },
};

const weekdays = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ru: ['воскресенья', 'понедельника', 'вторника', 'среды', 'четверга', 'пятницы', 'субботы'],
  fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  pt: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  am: ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'],
};

const texts = {
  ru: {
    defaultTitle: '🔓 ОТКРОЙТЕ ВСЕ УПРАЖНЕНИЯ',
    defaultSubtitleAndroid: 'Попробуйте полный доступ по подписке',
    defaultSubtitleIOS: 'Попробуйте полный доступ по подписке',
    defaultNote: 'Отменить можно в любой момент',

    installDayTitle: '🎁 ПОЛНЫЙ ДОСТУП ОТКРЫТ',
    installDaySubtitle:
      'Сегодня вы можете спокойно познакомиться с Verbify. А не считая сегодняшнего дня, у вас есть ещё 3 пробных дня полного доступа.',
    installDayNote:
      '✅ Упражнения 1 и 2 останутся бесплатными всегда.\n🔓 Упражнения 3–8 и AI-чат доступны во время пробного периода и по подписке.\n🎁 В конце пробного периода вас будет ждать специальная скидка на полный доступ.',

    trialDay1Title: '🎁 ПЕРВЫЙ ДЕНЬ ПОЛНОГО ДОСТУПА',
    trialDay1Subtitle:
      'Продолжайте знакомиться с Verbify: попробуйте разные упражнения и посмотрите, какие помогают именно вам.',
    trialDay1Note:
      '🚀 Упражнения 5 и 6 — главные упражнения Verbify. Тренируйте спряжения глаголов: именно автоматизм в формах помогает начать говорить на иврите быстрее, увереннее и естественнее.',

    trialDay2Title: '🚀 ВТОРОЙ ДЕНЬ ПОЛНОГО ДОСТУПА',
    trialDay2Subtitle:
      'Попробуйте упражнения на спряжения, императивы и биньяны — именно они помогают быстрее начать говорить на иврите.',
    trialDay2Note:
      '⏳ Пока полный доступ активен — используйте возможность попробовать все упражнения приложения.',

    trialDay3LastTitle: '⏳ ПОСЛЕДНИЙ ДЕНЬ ПОЛНОГО ДОСТУПА',
    trialDay3LastSubtitle:
      'Спасибо, что пробуете Verbify! Надеемся, приложение помогает вам увереннее использовать глаголы иврита.',
    trialDay3LastNote:
      '✅ Упражнения 1 и 2 останутся бесплатными всегда.\n🔓 Упражнения 3–8 и AI-чат доступны во время пробного периода и по подписке.\n🎁 В конце пробного периода вас будет ждать специальная скидка на полный доступ.',

    trialExpiredTitle: '🎁 ПОЛНЫЙ ДОСТУП КО ВСЕМ УПРАЖНЕНИЯМ СО СКИДКОЙ',
    trialExpiredSubtitle:
      'Пробный период закончился. Упражнения 1 и 2 остаются бесплатными, а упражнения 3–8 доступны по подписке.',
    trialExpiredNote:
      'Используйте промокод, чтобы продолжить тренировки со скидкой.',

    promoCodeLabel: 'Промокод',
    monthlyCodeLabel: 'Помесячная',
    annualCodeLabel: 'Годовая',

    copy: 'Скопировать',
    copied: 'Скопировано',
    subscribeWithDiscount: 'Продолжить со скидкой',
    pricesButton: 'Подписка и цены',

    accessUntilEndOf: 'Полный доступ до конца',
    accessUntilEndOfToday: 'Полный доступ до конца этого дня',

    more: 'Подробнее',
    collapse: 'Свернуть',

    compactInstallDay: '🎁 Полный доступ открыт',
    compactTrialDay1: '🎁 Первый день полного доступа',
    compactTrialDay2: '🔥 Второй день полного доступа',
    compactTrialDay3Last: '⏳ Последний день полного доступа',
    compactTrialExpired: '🔓 Получить полный доступ ко всем упражнениям',
  },

  en: {
    defaultTitle: '🔓 UNLOCK ALL EXERCISES',
    defaultSubtitleAndroid: 'Try full access with subscription',
    defaultSubtitleIOS: 'Try full access with subscription',
    defaultNote: 'You can cancel anytime',

    installDayTitle: '🎁 FULL ACCESS UNLOCKED',
    installDaySubtitle:
      'Today you can calmly explore Verbify. Besides today, you still have 3 more trial days of full access.',
    installDayNote:
      '✅ Exercises 1 and 2 will always stay free.\n🔓 Exercises 3–8 and the AI chat are available during the trial and with subscription.\n🎁 At the end of the trial, a special discount on full access will be waiting for you.',

    trialDay1Title: '🎁 FIRST DAY OF FULL ACCESS',
    trialDay1Subtitle:
      'Keep exploring Verbify: try different exercises and see what helps you most.',
    trialDay1Note:
      '🚀 Exercises 5 and 6 are the key exercises in Verbify. Train verb conjugations: automatic use of verb forms helps you start speaking Hebrew faster, more confidently and more naturally.',

    trialDay2Title: '🚀 SECOND DAY OF FULL ACCESS',
    trialDay2Subtitle:
      'Try exercises for conjugations, imperatives and binyanim — they help you start speaking Hebrew faster.',
    trialDay2Note:
      '⏳ While full access is active — use the opportunity to try all exercises in the app.',

    trialDay3LastTitle: '⏳ LAST DAY OF FULL ACCESS',
    trialDay3LastSubtitle:
      'Thank you for trying Verbify! We hope the app helps you use Hebrew verbs more confidently.',
    trialDay3LastNote:
      '✅ Exercises 1 and 2 will always stay free.\n🔓 Exercises 3–8 and the AI chat are available during the trial and with subscription.\n🎁 At the end of the trial, a special discount on full access will be waiting for you.',

    trialExpiredTitle: '🎁 FULL ACCESS TO ALL EXERCISES WITH DISCOUNT',
    trialExpiredSubtitle:
      'The trial period has ended. Exercises 1 and 2 remain free, while exercises 3–8 are available with subscription.',
    trialExpiredNote:
      'Use the promo code to continue training with a discount.',

    promoCodeLabel: 'Promo code',
    monthlyCodeLabel: 'Monthly',
    annualCodeLabel: 'Annual',

    copy: 'Copy',
    copied: 'Copied',
    subscribeWithDiscount: 'Continue with discount',
    pricesButton: 'Subscription & prices',

    accessUntilEndOf: 'Full access until the end of',
    accessUntilEndOfToday: 'Full access until the end of today',

    more: 'More',
    collapse: 'Collapse',

    compactInstallDay: '🎁 Full access unlocked',
    compactTrialDay1: '🎁 First day of full access',
    compactTrialDay2: '🔥 Second day of full access',
    compactTrialDay3Last: '⏳ Last day of full access',
    compactTrialExpired: '🔓 Get full access to all exercises',
  },

  fr: {
    defaultTitle: '🔓 DÉBLOQUEZ TOUS LES EXERCICES',
    defaultSubtitleAndroid: 'Essayez l’accès complet avec abonnement',
    defaultSubtitleIOS: 'Essayez l’accès complet avec abonnement',
    defaultNote: 'Vous pouvez annuler à tout moment',

    installDayTitle: '🎁 ACCÈS COMPLET OUVERT',
    installDaySubtitle:
      'Aujourd’hui, vous pouvez découvrir Verbify tranquillement. En plus d’aujourd’hui, il vous reste encore 3 jours d’essai avec accès complet.',
    installDayNote:
      '✅ Les exercices 1 et 2 resteront toujours gratuits.\n🔓 Les exercices 3–8 et le chat IA sont disponibles pendant la période d’essai et avec abonnement.\n🎁 À la fin de la période d’essai, une réduction spéciale sur l’accès complet vous attendra.',

    trialDay1Title: "🎁 PREMIER JOUR D'ACCÈS COMPLET",
    trialDay1Subtitle:
      'Continuez à découvrir Verbify : essayez différents exercices et voyez ce qui vous aide le plus.',
    trialDay1Note:
      '🚀 Les exercices 5 et 6 sont les exercices principaux de Verbify. Travaillez les conjugaisons : l’automatisation des formes verbales aide à parler hébreu plus vite, avec plus de confiance et plus naturellement.',

    trialDay2Title: "🚀 DEUXIÈME JOUR D'ACCÈS COMPLET",
    trialDay2Subtitle:
      'Essayez les exercices sur les conjugaisons, les impératifs et les binyanim — ils aident à commencer à parler hébreu plus rapidement.',
    trialDay2Note:
      '⏳ Tant que l’accès complet est actif, profitez-en pour essayer tous les exercices de l’application.',

    trialDay3LastTitle: "⏳ DERNIER JOUR D'ACCÈS COMPLET",
    trialDay3LastSubtitle:
      'Merci d’essayer Verbify ! Nous espérons que l’application vous aide à utiliser les verbes hébreux avec plus de confiance.',
    trialDay3LastNote:
      '✅ Les exercices 1 et 2 resteront toujours gratuits.\n🔓 Les exercices 3–8 et le chat IA sont disponibles pendant la période d’essai et avec abonnement.\n🎁 À la fin de la période d’essai, une réduction spéciale sur l’accès complet vous attendra.',

    trialExpiredTitle: '🎁 ACCÈS COMPLET À TOUS LES EXERCICES AVEC RÉDUCTION',
    trialExpiredSubtitle:
      'La période d’essai est terminée. Les exercices 1 et 2 restent gratuits, tandis que les exercices 3–8 sont disponibles avec abonnement.',
    trialExpiredNote:
      'Utilisez le code promo pour continuer l’entraînement avec une réduction.',

    promoCodeLabel: 'Code promo',
    monthlyCodeLabel: 'Mensuel',
    annualCodeLabel: 'Annuel',

    copy: 'Copier',
    copied: 'Copié',
    subscribeWithDiscount: 'Continuer avec réduction',
    pricesButton: 'Abonnement et prix',

    accessUntilEndOf: 'Accès complet jusqu’à la fin de',
    accessUntilEndOfToday: 'Accès complet jusqu’à la fin de la journée',

    more: 'Plus',
    collapse: 'Réduire',

    compactInstallDay: '🎁 Accès complet ouvert',
    compactTrialDay1: "🎁 Premier jour d'accès complet",
    compactTrialDay2: "🔥 Deuxième jour d'accès complet",
    compactTrialDay3Last: "⏳ Dernier jour d'accès complet",
    compactTrialExpired: '🔓 Obtenir l’accès complet à tous les exercices',
  },

  es: {
    defaultTitle: '🔓 DESBLOQUEA TODOS LOS EJERCICIOS',
    defaultSubtitleAndroid: 'Prueba el acceso completo con suscripción',
    defaultSubtitleIOS: 'Prueba el acceso completo con suscripción',
    defaultNote: 'Puedes cancelar en cualquier momento',

    installDayTitle: '🎁 ACCESO COMPLETO ACTIVADO',
    installDaySubtitle:
      'Hoy puedes conocer Verbify con calma. Además de hoy, todavía tienes 3 días más de prueba con acceso completo.',
    installDayNote:
      '✅ Los ejercicios 1 y 2 siempre serán gratuitos.\n🔓 Los ejercicios 3–8 y el chat IA están disponibles durante la prueba y con suscripción.\n🎁 Al final del período de prueba te estará esperando un descuento especial en el acceso completo.',

    trialDay1Title: '🎁 PRIMER DÍA DE ACCESO COMPLETO',
    trialDay1Subtitle:
      'Sigue explorando Verbify: prueba distintos ejercicios y descubre cuáles te ayudan más.',
    trialDay1Note:
      '🚀 Los ejercicios 5 y 6 son los ejercicios principales de Verbify. Entrena las conjugaciones: el automatismo en las formas verbales ayuda a empezar a hablar hebreo más rápido, con más confianza y de forma más natural.',

    trialDay2Title: '🚀 SEGUNDO DÍA DE ACCESO COMPLETO',
    trialDay2Subtitle:
      'Prueba ejercicios de conjugaciones, imperativos y binyanim — ayudan a empezar a hablar hebreo más rápido.',
    trialDay2Note:
      '⏳ Mientras el acceso completo esté activo, aprovecha para probar todos los ejercicios de la app.',

    trialDay3LastTitle: '⏳ ÚLTIMO DÍA DE ACCESO COMPLETO',
    trialDay3LastSubtitle:
      '¡Gracias por probar Verbify! Esperamos que la app te ayude a usar los verbos hebreos con más confianza.',
    trialDay3LastNote:
      '✅ Los ejercicios 1 y 2 siempre serán gratuitos.\n🔓 Los ejercicios 3–8 y el chat IA están disponibles durante la prueba y con suscripción.\n🎁 Al final del período de prueba te estará esperando un descuento especial en el acceso completo.',

    trialExpiredTitle: '🎁 ACCESO COMPLETO A TODOS LOS EJERCICIOS CON DESCUENTO',
    trialExpiredSubtitle:
      'El período de prueba ha terminado. Los ejercicios 1 y 2 siguen siendo gratuitos, y los ejercicios 3–8 están disponibles con suscripción.',
    trialExpiredNote:
      'Usa el código promocional para continuar entrenando con descuento.',

    promoCodeLabel: 'Código promo',
    monthlyCodeLabel: 'Mensual',
    annualCodeLabel: 'Anual',

    copy: 'Copiar',
    copied: 'Copiado',
    subscribeWithDiscount: 'Continuar con descuento',
    pricesButton: 'Suscripción y precios',

    accessUntilEndOf: 'Acceso completo hasta el final de',
    accessUntilEndOfToday: 'Acceso completo hasta el final del día',

    more: 'Más',
    collapse: 'Ocultar',

    compactInstallDay: '🎁 Acceso completo activado',
    compactTrialDay1: '🎁 Primer día de acceso completo',
    compactTrialDay2: '🔥 Segundo día de acceso completo',
    compactTrialDay3Last: '⏳ Último día de acceso completo',
    compactTrialExpired: '🔓 Obtener acceso completo a todos los ejercicios',
  },

  pt: {
    defaultTitle: '🔓 DESBLOQUEIE TODOS OS EXERCÍCIOS',
    defaultSubtitleAndroid: 'Experimente o acesso total com assinatura',
    defaultSubtitleIOS: 'Experimente o acesso total com assinatura',
    defaultNote: 'Você pode cancelar a qualquer momento',

    installDayTitle: '🎁 ACESSO TOTAL LIBERADO',
    installDaySubtitle:
      'Hoje você pode conhecer o Verbify com calma. Além de hoje, você ainda tem mais 3 dias de teste com acesso total.',
    installDayNote:
      '✅ Os exercícios 1 e 2 sempre serão gratuitos.\n🔓 Os exercícios 3–8 e o chat IA ficam disponíveis durante o teste e com assinatura.\n🎁 No final do período de teste, uma oferta especial com desconto no acesso total estará esperando por você.',

    trialDay1Title: '🎁 PRIMEIRO DIA DE ACESSO TOTAL',
    trialDay1Subtitle:
      'Continue explorando o Verbify: experimente diferentes exercícios e veja quais ajudam mais.',
    trialDay1Note:
      '🚀 Os exercícios 5 e 6 são os principais exercícios do Verbify. Treine as conjugações dos verbos: o automatismo nas formas verbais ajuda você a começar a falar hebraico mais rápido, com mais confiança e naturalidade.',

    trialDay2Title: '🚀 SEGUNDO DIA DE ACESSO TOTAL',
    trialDay2Subtitle:
      'Experimente exercícios de conjugações, imperativos e binyanim — eles ajudam você a começar a falar hebraico mais rapidamente.',
    trialDay2Note:
      '⏳ Enquanto o acesso total estiver ativo, aproveite para experimentar todos os exercícios do app.',

    trialDay3LastTitle: '⏳ ÚLTIMO DIA DE ACESSO TOTAL',
    trialDay3LastSubtitle:
      'Obrigado por experimentar o Verbify! Esperamos que o app ajude você a usar os verbos hebraicos com mais confiança.',
    trialDay3LastNote:
      '✅ Os exercícios 1 e 2 sempre serão gratuitos.\n🔓 Os exercícios 3–8 e o chat IA ficam disponíveis durante o teste e com assinatura.\n🎁 No final do período de teste, uma oferta especial com desconto no acesso total estará esperando por você.',

    trialExpiredTitle: '🎁 ACESSO TOTAL A TODOS OS EXERCÍCIOS COM DESCONTO',
    trialExpiredSubtitle:
      'O período de teste terminou. Os exercícios 1 e 2 continuam gratuitos, e os exercícios 3–8 ficam disponíveis com assinatura.',
    trialExpiredNote:
      'Use o código promocional para continuar treinando com desconto.',

    promoCodeLabel: 'Código promocional',
    monthlyCodeLabel: 'Mensal',
    annualCodeLabel: 'Anual',

    copy: 'Copiar',
    copied: 'Copiado',
    subscribeWithDiscount: 'Continuar com desconto',
    pricesButton: 'Assinatura e preços',

    accessUntilEndOf: 'Acesso total até o fim de',
    accessUntilEndOfToday: 'Acesso total até o fim de hoje',

    more: 'Mais',
    collapse: 'Recolher',

    compactInstallDay: '🎁 Acesso total liberado',
    compactTrialDay1: '🎁 Primeiro dia de acesso total',
    compactTrialDay2: '🔥 Segundo dia de acesso total',
    compactTrialDay3Last: '⏳ Último dia de acesso total',
    compactTrialExpired: '🔓 Obter acesso completo a todos os exercícios',
  },

  ar: {
    defaultTitle: '🔓 افتح جميع التمارين',
    defaultSubtitleAndroid: 'جرّب الوصول الكامل من خلال الاشتراك',
    defaultSubtitleIOS: 'جرّب الوصول الكامل من خلال الاشتراك',
    defaultNote: 'يمكنك الإلغاء في أي وقت',

    installDayTitle: '🎁 تم فتح الوصول الكامل',
    installDaySubtitle:
      'اليوم يمكنك التعرف على Verbify بهدوء. وبالإضافة إلى اليوم، لديك 3 أيام تجريبية أخرى من الوصول الكامل.',
    installDayNote:
      '✅ سيبقى التمرينان 1 و2 مجانيين دائمًا.\n🔓 التمارين 3–8 ودردشة الذكاء الاصطناعي متاحة أثناء الفترة التجريبية ومع الاشتراك.\n🎁 في نهاية الفترة التجريبية سيكون بانتظارك خصم خاص على الوصول الكامل.',

    trialDay1Title: '🎁 اليوم الأول من الوصول الكامل',
    trialDay1Subtitle:
      'واصل اكتشاف Verbify: جرّب تمارين مختلفة واكتشف ما يساعدك أكثر.',
    trialDay1Note:
      '🚀 التمرينان 5 و6 هما أهم تمارين Verbify. درّب تصريفات الأفعال: التلقائية في استخدام الصيغ تساعدك على البدء بالتحدث بالعبرية بسرعة وثقة وبشكل طبيعي.',

    trialDay2Title: '🚀 اليوم الثاني من الوصول الكامل',
    trialDay2Subtitle:
      'جرّب تمارين التصريفات وصيغة الأمر والبنيان — فهي تساعدك على البدء بالتحدث بالعبرية بسرعة أكبر.',
    trialDay2Note:
      '⏳ طالما أن الوصول الكامل نشط، استفد من الفرصة لتجربة جميع تمارين التطبيق.',

    trialDay3LastTitle: '⏳ اليوم الأخير من الوصول الكامل',
    trialDay3LastSubtitle:
      'شكرًا لتجربة Verbify! نأمل أن يساعدك التطبيق على استخدام الأفعال العبرية بثقة أكبر.',
    trialDay3LastNote:
      '✅ سيبقى التمرينان 1 و2 مجانيين دائمًا.\n🔓 التمارين 3–8 ودردشة الذكاء الاصطناعي متاحة أثناء الفترة التجريبية ومع الاشتراك.\n🎁 في نهاية الفترة التجريبية سيكون بانتظارك خصم خاص على الوصول الكامل.',

    trialExpiredTitle: '🎁 وصول كامل إلى جميع التمارين مع خصم',
    trialExpiredSubtitle:
      'انتهت الفترة التجريبية. سيبقى التمرينان 1 و2 مجانيين، أما التمارين 3–8 فهي متاحة مع الاشتراك.',
    trialExpiredNote:
      'استخدم الرمز الترويجي لمواصلة التدريب مع خصم.',

    promoCodeLabel: 'رمز ترويجي',
    monthlyCodeLabel: 'شهري',
    annualCodeLabel: 'سنوي',

    copy: 'نسخ',
    copied: 'تم النسخ',
    subscribeWithDiscount: 'المتابعة مع الخصم',
    pricesButton: 'الاشتراك والأسعار',

    accessUntilEndOf: 'الوصول الكامل حتى نهاية',
    accessUntilEndOfToday: 'الوصول الكامل حتى نهاية اليوم',

    more: 'المزيد',
    collapse: 'إخفاء',

    compactInstallDay: '🎁 تم فتح الوصول الكامل',
    compactTrialDay1: '🎁 اليوم الأول من الوصول الكامل',
    compactTrialDay2: '🔥 اليوم الثاني من الوصول الكامل',
    compactTrialDay3Last: '⏳ اليوم الأخير من الوصول الكامل',
    compactTrialExpired: '🔓 احصل على وصول كامل إلى جميع التمارين',
  },

  am: {
    defaultTitle: '🔓 ሁሉንም ልምምዶች ክፈት',
    defaultSubtitleAndroid: 'በምዝገባ ሙሉ መዳረሻን ይሞክሩ',
    defaultSubtitleIOS: 'በምዝገባ ሙሉ መዳረሻን ይሞክሩ',
    defaultNote: 'በማንኛውም ጊዜ መሰረዝ ይችላሉ',

    installDayTitle: '🎁 ሙሉ መዳረሻ ተከፍቷል',
    installDaySubtitle:
      'ዛሬ Verbifyን በሰላም መዳሰስ ይችላሉ። ከዛሬ በተጨማሪ ሌሎች 3 የሙከራ ቀናት የሙሉ መዳረሻ አሉዎት።',
    installDayNote:
      '✅ ልምምድ 1 እና 2 ሁልጊዜ ነፃ ይቆያሉ።\n🔓 ልምምድ 3–8 እና AI ቻት በሙከራው ጊዜ እና በምዝገባ ይገኛሉ።\n🎁 በሙከራው መጨረሻ ላይ ለሙሉ መዳረሻ ልዩ ቅናሽ ይጠብቅዎታል።',

    trialDay1Title: '🎁 የሙሉ መዳረሻ የመጀመሪያ ቀን',
    trialDay1Subtitle:
      'Verbifyን መጠቀም ይቀጥሉ፤ የተለያዩ ልምምዶችን ይሞክሩ እና ምን በጣም እንደሚረዳዎት ይመልከቱ።',
    trialDay1Note:
      '🚀 ልምምድ 5 እና 6 የVerbify ዋና ልምምዶች ናቸው። የግስ ቅጾችን ይለማመዱ፤ በቅጾች ላይ የሚፈጠር አውቶማቲክ ልምድ ዕብራይስጥን ፈጣን፣ በራስ መተማመን እና በተፈጥሮ እንዲናገሩ ይረዳል።',

    trialDay2Title: '🚀 የሙሉ መዳረሻ ሁለተኛ ቀን',
    trialDay2Subtitle:
      'የግስ ቅጾችን፣ ትዕዛዞችን እና binyanim ይሞክሩ — እነሱ በፍጥነት ዕብራይስጥ ለመናገር ይረዳሉ።',
    trialDay2Note:
      '⏳ ሙሉ መዳረሻ እያለ የመተግበሪያውን ሁሉንም ልምምዶች ለመሞከር እድሉን ይጠቀሙ።',

    trialDay3LastTitle: '⏳ የሙሉ መዳረሻ የመጨረሻ ቀን',
    trialDay3LastSubtitle:
      'Verbifyን ስለሞከሩ እናመሰግናለን! መተግበሪያው የዕብራይስጥ ግሶችን በበለጠ በራስ መተማመን እንዲጠቀሙ እንደሚረዳዎት ተስፋ እናደርጋለን።',
    trialDay3LastNote:
      '✅ ልምምድ 1 እና 2 ሁልጊዜ ነፃ ይቆያሉ።\n🔓 ልምምድ 3–8 እና AI ቻት በሙከራው ጊዜ እና በምዝገባ ይገኛሉ።\n🎁 በሙከራው መጨረሻ ላይ ለሙሉ መዳረሻ ልዩ ቅናሽ ይጠብቅዎታል።',

    trialExpiredTitle: '🎁 ለሁሉም ልምምዶች ሙሉ መዳረሻ በቅናሽ',
    trialExpiredSubtitle:
      'የሙከራው ጊዜ ተጠናቋል። ልምምድ 1 እና 2 ነፃ ይቆያሉ፣ ልምምድ 3–8 ግን በምዝገባ ይገኛሉ።',
    trialExpiredNote:
      'በቅናሽ ልምምድዎን ለመቀጠል የፕሮሞ ኮዱን ይጠቀሙ።',

    promoCodeLabel: 'የፕሮሞ ኮድ',
    monthlyCodeLabel: 'ወርሃዊ',
    annualCodeLabel: 'ዓመታዊ',

    copy: 'ቅዳ',
    copied: 'ተቀድቷል',
    subscribeWithDiscount: 'በቅናሽ ቀጥል',
    pricesButton: 'ምዝገባ እና ዋጋዎች',

    accessUntilEndOf: 'ሙሉ መዳረሻ እስከ መጨረሻ',
    accessUntilEndOfToday: 'ሙሉ መዳረሻ እስከ ዛሬ መጨረሻ',

    more: 'ተጨማሪ',
    collapse: 'ደብቅ',

    compactInstallDay: '🎁 ሙሉ መዳረሻ ተከፍቷል',
    compactTrialDay1: '🎁 የሙሉ መዳረሻ የመጀመሪያ ቀን',
    compactTrialDay2: '🔥 የሙሉ መዳረሻ ሁለተኛ ቀን',
    compactTrialDay3Last: '⏳ የሙሉ መዳረሻ የመጨረሻ ቀን',
    compactTrialExpired: '🔓 ለሁሉም ልምምዶች ሙሉ መዳረሻ ያግኙ',
  },
};

const getPaywallRoute = () => {
  return Platform.OS === 'ios' ? 'PaywallIOS' : 'Paywall';
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getTrialDaysLeft(internalTrialEndsAt) {
  if (!internalTrialEndsAt) return null;

  const diff = Number(internalTrialEndsAt) - Date.now();
  if (diff <= 0) return 0;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getTrialEndDayText(language, internalTrialEndsAt, t, stage) {
  if (!internalTrialEndsAt) return null;

  if (stage === 'trial_day_3_last') {
    return t.accessUntilEndOfToday || t.accessUntilEndOf;
  }

  const date = new Date(Number(internalTrialEndsAt));
  const dayIndex = date.getDay();

  const langDays = weekdays[language] || weekdays.en;
  const dayName = langDays[dayIndex];

  return `${t.accessUntilEndOf} ${dayName}`;
}

function getBannerContent(t, internalTrialActive, internalTrialEndsAt) {
  if (!internalTrialActive) {
    return {
      stage: 'default',
      title: t.defaultTitle,
      subtitle:
        Platform.OS === 'ios'
          ? t.defaultSubtitleIOS
          : t.defaultSubtitleAndroid,
      note: t.defaultNote,
    };
  }

  const diffMs = Number(internalTrialEndsAt) - Date.now();
  const diffMinutes = diffMs / (1000 * 60);

  if (UPGRADE_BANNER_TEST_MODE) {
    if (diffMinutes <= 4) {
      return {
        stage: 'trial_day_3_last',
        title: t.trialDay3LastTitle,
        subtitle: t.trialDay3LastSubtitle,
        note: t.trialDay3LastNote,
      };
    }

    if (diffMinutes <= 9) {
      return {
        stage: 'trial_day_2',
        title: t.trialDay2Title,
        subtitle: t.trialDay2Subtitle,
        note: t.trialDay2Note,
      };
    }

    if (diffMinutes <= 12) {
      return {
        stage: 'trial_day_1',
        title: t.trialDay1Title,
        subtitle: t.trialDay1Subtitle,
        note: t.trialDay1Note,
      };
    }

    return {
      stage: 'install_day',
      title: t.installDayTitle,
      subtitle: t.installDaySubtitle,
      note: t.installDayNote,
    };
  }

  const daysLeft = getTrialDaysLeft(internalTrialEndsAt);

  if (daysLeft >= 4) {
    return {
      stage: 'install_day',
      title: t.installDayTitle,
      subtitle: t.installDaySubtitle,
      note: t.installDayNote,
    };
  }

  if (daysLeft === 3) {
    return {
      stage: 'trial_day_1',
      title: t.trialDay1Title,
      subtitle: t.trialDay1Subtitle,
      note: t.trialDay1Note,
    };
  }

  if (daysLeft === 2) {
    return {
      stage: 'trial_day_2',
      title: t.trialDay2Title,
      subtitle: t.trialDay2Subtitle,
      note: t.trialDay2Note,
    };
  }

  return {
    stage: 'trial_day_3_last',
    title: t.trialDay3LastTitle,
    subtitle: t.trialDay3LastSubtitle,
    note: t.trialDay3LastNote,
  };
}

function isTrialExpired(hasPro, internalTrialActive, internalTrialEndsAt) {
  if (hasPro) return false;
  if (internalTrialActive) return false;
  if (!internalTrialEndsAt) return false;

  return Date.now() >= Number(internalTrialEndsAt);
}

function PromoCodeBox({ label, code, copiedCode, onCopy, t }) {
  const copied = copiedCode === code;

  return (
    <View style={styles.promoItem}>
      <View style={styles.promoBox}>
        <Text style={styles.promoLabel} maxFontSizeMultiplier={1.2}>
          {label}
        </Text>

        <Text style={styles.promoCode} maxFontSizeMultiplier={1.2}>
          {code}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.copyButton}
        onPress={() => onCopy(code)}
      >
        <Text style={styles.copyText} maxFontSizeMultiplier={1.2}>
          {copied ? t.copied : t.copy}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function UpgradeBanner({
  hasPro,
  navigation,
  language = 'en',
  animatedStyle = {},
  internalTrialActive = false,
  internalTrialEndsAt = null,
}) {
  const [expanded, setExpanded] = useState(false);
  const [loadedBannerKey, setLoadedBannerKey] = useState(null);
  const [tick, setTick] = useState(0);
  const [copiedCode, setCopiedCode] = useState(null);

  const t = texts[language] || texts.en;

  const trialExpired = isTrialExpired(
    hasPro,
    internalTrialActive,
    internalTrialEndsAt
  );

  useEffect(() => {
    if (!internalTrialActive && !trialExpired) return;

    const interval = setInterval(() => {
      setTick(v => v + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [internalTrialActive, trialExpired]);

  const content = getBannerContent(
    t,
    internalTrialActive,
    internalTrialEndsAt,
    tick
  );

  const currentBannerStage = trialExpired
    ? 'trial_expired'
    : content.stage || 'default';

  const trialInstanceKey = internalTrialEndsAt
    ? String(internalTrialEndsAt)
    : 'no_trial';

  const bannerSeenKey =
    `upgrade_banner_seen_${language}_${currentBannerStage}_${trialInstanceKey}`;

  const endDayText = internalTrialActive
    ? getTrialEndDayText(language, internalTrialEndsAt, t, content.stage)
    : null;

  useEffect(() => {
    let mounted = true;

    const loadSeenState = async () => {
      try {
        const today = getTodayKey();
        const storedDate = await AsyncStorage.getItem(bannerSeenKey);

        if (!mounted) return;

        if (storedDate === today) {
          setExpanded(false);
        } else {
          setExpanded(true);
          await AsyncStorage.setItem(bannerSeenKey, today);
        }

        setLoadedBannerKey(bannerSeenKey);
      } catch (e) {
        console.log('[UpgradeBanner] seen state error:', e);

        if (mounted) {
          setExpanded(true);
          setLoadedBannerKey(bannerSeenKey);
        }
      }
    };

    loadSeenState();

    return () => {
      mounted = false;
    };
  }, [bannerSeenKey]);

  if (hasPro) return null;
  if (loadedBannerKey !== bannerSeenKey) return null;

  const showFull = expanded;

  const compactTitle = internalTrialActive
    ? content.stage === 'install_day'
      ? t.compactInstallDay
      : content.stage === 'trial_day_3_last'
        ? t.compactTrialDay3Last
        : content.stage === 'trial_day_2'
          ? t.compactTrialDay2
          : t.compactTrialDay1
    : trialExpired
      ? t.compactTrialExpired
      : content.title;

  const handleCopy = async code => {
    await Clipboard.setStringAsync(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  if (trialExpired) {
    return (
      <Animated.View
        style={[
          styles.container,
          styles.expiredContainer,
          !showFull && styles.compactContainer,
          animatedStyle,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setExpanded(v => !v)}
          style={styles.touch}
        >
          <View style={[styles.inner, !showFull && styles.compactInner]}>
            <Text
              style={[styles.title, !showFull && styles.compactTitle]}
              maxFontSizeMultiplier={1.2}
            >
              {showFull
                ? `${t.trialExpiredTitle} ${PROMO_DISCOUNT}%`
                : compactTitle}
            </Text>

            {showFull && (
              <>
                <Text style={styles.subtitle} maxFontSizeMultiplier={1.2}>
                  {t.trialExpiredSubtitle}
                </Text>

                <Text style={styles.note} maxFontSizeMultiplier={1.2}>
                  {t.trialExpiredNote}
                </Text>

                <View style={styles.promoList}>
                  {Platform.OS === 'ios' ? (
                    <>
                      <PromoCodeBox
                        label={t.monthlyCodeLabel}
                        code={PROMO_CODES.ios.monthly}
                        copiedCode={copiedCode}
                        onCopy={handleCopy}
                        t={t}
                      />

                      <PromoCodeBox
                        label={t.annualCodeLabel}
                        code={PROMO_CODES.ios.annual}
                        copiedCode={copiedCode}
                        onCopy={handleCopy}
                        t={t}
                      />
                    </>
                  ) : (
                    <PromoCodeBox
                      label={t.promoCodeLabel}
                      code={PROMO_CODES.android.general}
                      copiedCode={copiedCode}
                      onCopy={handleCopy}
                      t={t}
                    />
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate(getPaywallRoute(), {
                      promoDiscount: PROMO_DISCOUNT,
                      promoCodes: PROMO_CODES,
                      from: 'trial_expired_banner',
                    })
                  }
                  style={styles.discountButton}
                >
                  <Text
                    style={styles.discountButtonText}
                    maxFontSizeMultiplier={1.2}
                  >
                    {t.subscribeWithDiscount}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setExpanded(v => !v)}
              style={styles.moreButton}
            >
              <Text style={styles.moreText} maxFontSizeMultiplier={1.2}>
                {showFull ? t.collapse : t.more}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        internalTrialActive && styles.trialContainer,
        !showFull && styles.compactContainer,
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          if (internalTrialActive) {
            setExpanded(v => !v);
          } else {
            navigation.navigate(getPaywallRoute());
          }
        }}
        style={styles.touch}
      >
        <View style={[styles.inner, !showFull && styles.compactInner]}>
          <Text
            style={[styles.title, !showFull && styles.compactTitle]}
            maxFontSizeMultiplier={1.2}
          >
            {showFull ? content.title : compactTitle}
          </Text>

          {endDayText && (
            <View style={[styles.daysBadge, !showFull && styles.compactBadge]}>
              <Text style={styles.daysText} maxFontSizeMultiplier={1.2}>
                {endDayText}
              </Text>
            </View>
          )}

          {showFull && (
            <>
              <Text style={styles.subtitle} maxFontSizeMultiplier={1.2}>
                {content.subtitle}
              </Text>

              <Text style={styles.note} maxFontSizeMultiplier={1.2}>
                {content.note}
              </Text>
            </>
          )}

       {internalTrialActive && (
  <View style={styles.trialButtonsColumn}>
    {showFull && (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate(getPaywallRoute(), {
            from: 'trial_banner',
          })
        }
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText} maxFontSizeMultiplier={1.2}>
          {t.pricesButton}
        </Text>
      </TouchableOpacity>
    )}

    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded(v => !v)}
      style={styles.moreButton}
    >
      <Text style={styles.moreText} maxFontSizeMultiplier={1.2}>
        {showFull ? t.collapse : t.more}
      </Text>
    </TouchableOpacity>
  </View>
)}

          {!internalTrialActive && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate(getPaywallRoute())}
              style={styles.payButton}
            >
              <Text style={styles.payButtonText} maxFontSizeMultiplier={1.2}>
                {t.defaultTitle}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#bd462a',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#2D4769',
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  compactContainer: {
    borderWidth: 2,
  },

  trialContainer: {
    backgroundColor: '#367088',
    borderColor: '#bd462a',
  },

  expiredContainer: {
    backgroundColor: '#bd462a',
    borderColor: '#2D4769',
  },

  touch: {
    width: '100%',
  },

  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  compactInner: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  title: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
    lineHeight: 18,
  },

  compactTitle: {
    fontSize: 13,
  },

  daysBadge: {
    marginTop: 7,
    backgroundColor: 'white',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  compactBadge: {
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  daysText: {
    color: '#2D4769',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  subtitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 7,
    textAlign: 'center',
  },

  note: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 6,
    textAlign: 'center',
  },

trialButtonsColumn: {
  marginTop: 8,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
},

  moreButton: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
     marginTop: 10,
  },

  moreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  secondaryButton: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
  },

  secondaryButtonText: {
    color: '#2D4769',
    fontSize: 12,
    fontWeight: 'bold',
  },

  payButton: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
  },

  payButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  promoList: {
    width: '100%',
    marginTop: 10,
    gap: 8,
  },

  promoItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

promoBox: {
  flex: 1,
  backgroundColor: 'white',
  borderRadius: 10,
  paddingVertical: 4,
  paddingHorizontal: 10,
  minHeight: 50,
  justifyContent: 'center',
},

  promoLabel: {
    color: '#2D4769',
    fontSize: 10,
    fontWeight: '700',
  },

promoCode: {
  // color: '#bd462a',
  color: 'black',
  fontSize: 15,
  fontWeight: '900',
  letterSpacing: 0.5,
  marginTop: 1,
},

  copyButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  copyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  discountButton: {
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  discountButtonText: {
    color: '#bd462a',
    fontSize: 13,
    fontWeight: '900',
  },
});