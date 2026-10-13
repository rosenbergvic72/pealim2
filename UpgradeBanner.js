import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Analytics from './src/analytics/Analytics';
const UPGRADE_BANNER_TEST_MODE = false;
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
      'Вам открыт весь Verbify — попробуйте разные способы тренировки и найдите те, которые лучше всего помогают именно вам.',
    installDayNote:
      '✅ Упражнения 1 и 2 и «Предлоги 1» останутся бесплатными всегда.\n🔓 Полный пробный доступ также открывает упражнения 3–10, «Предлоги 2», «Корни и биньяны» и AI-чат.\n🎁 После триала вас будет ждать специальная скидка на полный доступ.',
    trialDay1Title: '🎁 ПЕРВЫЙ ДЕНЬ ПОЛНОГО ДОСТУПА',
    trialDay1Subtitle:
      'Хотите говорить увереннее? Тренируйте формы глаголов до автоматизма, а затем закрепляйте их в полезных сочетаниях и живых фразах.',
    trialDay1Note:
      '🚀 Начните со спряжений и попробуйте «Предлоги 1» для повседневного иврита — это упражнение останется бесплатным и после триала.',
    trialDay2Title: '🚀 ВТОРОЙ ДЕНЬ ПОЛНОГО ДОСТУПА',
    trialDay2Subtitle:
      'Попробуйте новые форматы: «Корни и биньяны» показывает связи между глаголами, «Предлоги 2» тренирует естественные сочетания, а «Глагол в предложении» и «Услышь и пойми» переносят практику в живые фразы и аудирование.',
    trialDay2Note:
      '⏳ Все эти упражнения открыты сейчас в полном пробном доступе; после триала они доступны по подписке.',
    trialDay3LastTitle: '⏳ ПОСЛЕДНИЙ ДЕНЬ ПОЛНОГО ДОСТУПА',
    trialDay3LastSubtitle:
      'Сегодня последний день полного доступа. Если ещё не успели, попробуйте «Предлоги 2», «Корни и биньяны», «Глагол в предложении» и «Услышь и пойми».',
    trialDay3LastNote:
      '✅ Упражнения 1 и 2 и «Предлоги 1» останутся бесплатными всегда.\n🔓 Полный доступ к упражнениям 3–10, «Предлогам 2», «Корням и биньянам» и AI-чату продолжается по подписке.\n🎁 После триала вас будет ждать специальная скидка на полный доступ.',
    trialExpiredTitle: '🎁 ПОЛНЫЙ ДОСТУП КО ВСЕМ УПРАЖНЕНИЯМ СО СКИДКОЙ',
    trialExpiredSubtitle:
      'Пробный период закончился, но заниматься можно продолжать бесплатно: упражнения 1 и 2 и «Предлоги 1» остаются открытыми.',
    trialExpiredNote:
      'Хотите вернуть полный доступ к упражнениям 3–10, «Предлогам 2», «Корням и биньянам» и AI-чату? Используйте промокод — для вас доступна специальная скидка.',
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
    promoHelp:
'📋 Скопируйте и запомните промокод.\n\nЕсли пункт «Вставить» не появится, введите промокод вручную.',
  },
  en: {
    defaultTitle: '🔓 UNLOCK ALL EXERCISES',
    defaultSubtitleAndroid: 'Try full access with subscription',
    defaultSubtitleIOS: 'Try full access with subscription',
    defaultNote: 'You can cancel anytime',
    installDayTitle: '🎁 FULL ACCESS UNLOCKED',
    installDaySubtitle:
      'All of Verbify is open to you right now — try different ways to practise and find what helps you most.',
    installDayNote:
      '✅ Exercises 1 and 2 and “Prepositions 1” will always stay free.\n🔓 Full trial access also unlocks Exercises 3–10, “Prepositions 2”, “Roots and Binyanim”, and the AI chat.\n🎁 After the trial, a special discount on full access will be waiting for you.',
    trialDay1Title: '🎁 FIRST DAY OF FULL ACCESS',
    trialDay1Subtitle:
      'Want to speak more confidently? Train verb forms until they become automatic, then reinforce them in useful combinations and real phrases.',
    trialDay1Note:
      '🚀 Start with conjugation practice and try “Prepositions 1” for everyday Hebrew — this exercise will remain free even after the trial.',
    trialDay2Title: '🚀 SECOND DAY OF FULL ACCESS',
    trialDay2Subtitle:
      'Try the newer formats: “Roots and Binyanim” reveals connections between verbs, “Prepositions 2” trains natural combinations, while “Verb in a sentence” and “Listen and understand” move practice into real sentences and listening.',
    trialDay2Note:
      '⏳ All of these exercises are open during your full trial; after the trial they are available with a subscription.',
    trialDay3LastTitle: '⏳ LAST DAY OF FULL ACCESS',
    trialDay3LastSubtitle:
      'Today is your last day of full access. If you haven’t yet, try “Prepositions 2”, “Roots and Binyanim”, “Verb in a sentence”, and “Listen and understand”.',
    trialDay3LastNote:
      '✅ Exercises 1 and 2 and “Prepositions 1” will always stay free.\n🔓 Full access to Exercises 3–10, “Prepositions 2”, “Roots and Binyanim”, and the AI chat continues with a subscription.\n🎁 After the trial, a special discount on full access will be waiting for you.',
    trialExpiredTitle: '🎁 FULL ACCESS TO ALL EXERCISES WITH DISCOUNT',
    trialExpiredSubtitle:
      'The trial has ended, but you can keep practising for free: Exercises 1 and 2 and “Prepositions 1” remain open.',
    trialExpiredNote:
      'Want full access back to Exercises 3–10, “Prepositions 2”, “Roots and Binyanim”, and the AI chat? Use the promo code — a special discount is available for you.',
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
    promoHelp:
  '📋 Copy and remember the promo code before opening the App Store.\n\nIf the Paste option does not appear when entering the code, enter the promo code manually.',
  },
  fr: {
    defaultTitle: '🔓 DÉBLOQUEZ TOUS LES EXERCICES',
    defaultSubtitleAndroid: 'Essayez l’accès complet avec abonnement',
    defaultSubtitleIOS: 'Essayez l’accès complet avec abonnement',
    defaultNote: 'Vous pouvez annuler à tout moment',
    installDayTitle: '🎁 ACCÈS COMPLET OUVERT',
    installDaySubtitle:
      'Tout Verbify est ouvert pour vous dès maintenant — essayez différentes façons de vous entraîner et trouvez celles qui vous aident le plus.',
    installDayNote:
      '✅ Les exercices 1 et 2 et « Prépositions 1 » resteront toujours gratuits.\n🔓 L’accès d’essai complet ouvre aussi les exercices 3–10, « Prépositions 2 », « Racines et binyanim » et le chat IA.\n🎁 Après l’essai, une réduction spéciale sur l’accès complet vous attendra.',
    trialDay1Title: "🎁 PREMIER JOUR D'ACCÈS COMPLET",
    trialDay1Subtitle:
      'Vous voulez parler avec plus d’assurance ? Entraînez les formes verbales jusqu’à ce qu’elles deviennent automatiques, puis consolidez-les dans des combinaisons utiles et des phrases réelles.',
    trialDay1Note:
      '🚀 Commencez par les conjugaisons et essayez « Prépositions 1 » pour l’hébreu du quotidien — cet exercice restera gratuit après l’essai.',
    trialDay2Title: "🚀 DEUXIÈME JOUR D'ACCÈS COMPLET",
    trialDay2Subtitle:
      'Essayez les formats récents : « Racines et binyanim » montre les liens entre les verbes, « Prépositions 2 » entraîne les combinaisons naturelles, tandis que « Le verbe dans la phrase » et « Écouter et comprendre » placent la pratique dans des phrases réelles et la compréhension orale.',
    trialDay2Note:
      '⏳ Tous ces exercices sont ouverts pendant votre essai complet ; après l’essai, ils sont disponibles avec un abonnement.',
    trialDay3LastTitle: "⏳ DERNIER JOUR D'ACCÈS COMPLET",
    trialDay3LastSubtitle:
      'Aujourd’hui est votre dernier jour d’accès complet. Si ce n’est pas encore fait, essayez « Prépositions 2 », « Racines et binyanim », « Le verbe dans la phrase » et « Écouter et comprendre ».',
    trialDay3LastNote:
      '✅ Les exercices 1 et 2 et « Prépositions 1 » resteront toujours gratuits.\n🔓 L’accès complet aux exercices 3–10, à « Prépositions 2 », à « Racines et binyanim » et au chat IA continue avec un abonnement.\n🎁 Après l’essai, une réduction spéciale sur l’accès complet vous attendra.',
    trialExpiredTitle: '🎁 ACCÈS COMPLET À TOUS LES EXERCICES AVEC RÉDUCTION',
    trialExpiredSubtitle:
      'La période d’essai est terminée, mais vous pouvez continuer à vous entraîner gratuitement : les exercices 1 et 2 et « Prépositions 1 » restent ouverts.',
    trialExpiredNote:
      'Vous voulez retrouver l’accès complet aux exercices 3–10, à « Prépositions 2 », à « Racines et binyanim » et au chat IA ? Utilisez le code promo — une réduction spéciale vous est réservée.',
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
    promoHelp:
'📋 Copiez et mémorisez le code promo avant d’ouvrir l’App Store.\n\nSi l’option « Coller » n’apparaît pas lors de la saisie du code, saisissez le code promo manuellement.',
  },
  es: {
    defaultTitle: '🔓 DESBLOQUEA TODOS LOS EJERCICIOS',
    defaultSubtitleAndroid: 'Prueba el acceso completo con suscripción',
    defaultSubtitleIOS: 'Prueba el acceso completo con suscripción',
    defaultNote: 'Puedes cancelar en cualquier momento',
    installDayTitle: '🎁 ACCESO COMPLETO ACTIVADO',
    installDaySubtitle:
      'Ahora tienes todo Verbify abierto — prueba distintas formas de entrenar y descubre cuáles te ayudan más.',
    installDayNote:
      '✅ Los ejercicios 1 y 2 y «Preposiciones 1» siempre serán gratuitos.\n🔓 El acceso completo de prueba también abre los ejercicios 3–10, «Preposiciones 2», «Raíces y binyanim» y el chat IA.\n🎁 Después de la prueba te estará esperando un descuento especial en el acceso completo.',
    trialDay1Title: '🎁 PRIMER DÍA DE ACCESO COMPLETO',
    trialDay1Subtitle:
      '¿Quieres hablar con más confianza? Practica las formas verbales hasta automatizarlas y después refuérzalas en combinaciones útiles y frases reales.',
    trialDay1Note:
      '🚀 Empieza con las conjugaciones y prueba «Preposiciones 1» para el hebreo cotidiano — este ejercicio seguirá siendo gratuito después de la prueba.',
    trialDay2Title: '🚀 SEGUNDO DÍA DE ACCESO COMPLETO',
    trialDay2Subtitle:
      'Prueba los formatos más nuevos: «Raíces y binyanim» muestra conexiones entre verbos, «Preposiciones 2» entrena combinaciones naturales, y «El verbo en la oración» y «Escucha y comprende» llevan la práctica a frases reales y comprensión auditiva.',
    trialDay2Note:
      '⏳ Todos estos ejercicios están abiertos durante tu prueba completa; después de la prueba estarán disponibles con suscripción.',
    trialDay3LastTitle: '⏳ ÚLTIMO DÍA DE ACCESO COMPLETO',
    trialDay3LastSubtitle:
      'Hoy es tu último día de acceso completo. Si aún no lo has hecho, prueba «Preposiciones 2», «Raíces y binyanim», «El verbo en la oración» y «Escucha y comprende».',
    trialDay3LastNote:
      '✅ Los ejercicios 1 y 2 y «Preposiciones 1» siempre serán gratuitos.\n🔓 El acceso completo a los ejercicios 3–10, «Preposiciones 2», «Raíces y binyanim» y el chat IA continúa con suscripción.\n🎁 Después de la prueba te estará esperando un descuento especial en el acceso completo.',
    trialExpiredTitle: '🎁 ACCESO COMPLETO A TODOS LOS EJERCICIOS CON DESCUENTO',
    trialExpiredSubtitle:
      'La prueba ha terminado, pero puedes seguir practicando gratis: los ejercicios 1 y 2 y «Preposiciones 1» siguen abiertos.',
    trialExpiredNote:
      '¿Quieres recuperar el acceso completo a los ejercicios 3–10, «Preposiciones 2», «Raíces y binyanim» y el chat IA? Usa el código promocional — tienes disponible un descuento especial.',
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
    promoHelp:
'📋 Copia y recuerda el código promocional antes de abrir App Store.\n\nSi la opción « Pegar » no aparece al introducir el código, introduce el código promocional manualmente.',
  },
  pt: {
    defaultTitle: '🔓 DESBLOQUEIE TODOS OS EXERCÍCIOS',
    defaultSubtitleAndroid: 'Experimente o acesso total com assinatura',
    defaultSubtitleIOS: 'Experimente o acesso total com assinatura',
    defaultNote: 'Você pode cancelar a qualquer momento',
    installDayTitle: '🎁 ACESSO TOTAL LIBERADO',
    installDaySubtitle:
      'Agora todo o Verbify está aberto para você — experimente diferentes formas de treinar e descubra quais ajudam mais.',
    installDayNote:
      '✅ Os exercícios 1 e 2 e «Preposições 1» continuarão sempre gratuitos.\n🔓 O acesso completo de teste também libera os exercícios 3–10, «Preposições 2», «Raízes e binyanim» e o chat de IA.\n🎁 Depois do teste, uma oferta especial com desconto no acesso total estará esperando por você.',
    trialDay1Title: '🎁 PRIMEIRO DIA DE ACESSO TOTAL',
    trialDay1Subtitle:
      'Quer falar com mais confiança? Treine as formas verbais até que se tornem automáticas e depois reforce-as em combinações úteis e frases reais.',
    trialDay1Note:
      '🚀 Comece pelas conjugações e experimente «Preposições 1» para o hebraico do dia a dia — este exercício continuará gratuito depois do teste.',
    trialDay2Title: '🚀 SEGUNDO DIA DE ACESSO TOTAL',
    trialDay2Subtitle:
      'Experimente os formatos mais novos: «Raízes e binyanim» mostra as conexões entre os verbos, «Preposições 2» treina combinações naturais, e «O verbo na frase» e «Ouça e compreenda» levam a prática para frases reais e compreensão auditiva.',
    trialDay2Note:
      '⏳ Todos esses exercícios estão liberados durante o seu teste completo; depois do teste, ficam disponíveis com assinatura.',
    trialDay3LastTitle: '⏳ ÚLTIMO DIA DE ACESSO TOTAL',
    trialDay3LastSubtitle:
      'Hoje é o seu último dia de acesso total. Se ainda não experimentou, teste «Preposições 2», «Raízes e binyanim», «O verbo na frase» e «Ouça e compreenda».',
    trialDay3LastNote:
      '✅ Os exercícios 1 e 2 e «Preposições 1» continuarão sempre gratuitos.\n🔓 O acesso total aos exercícios 3–10, «Preposições 2», «Raízes e binyanim» e ao chat de IA continua com assinatura.\n🎁 Depois do teste, uma oferta especial com desconto no acesso total estará esperando por você.',
    trialExpiredTitle: '🎁 ACESSO TOTAL A TODOS OS EXERCÍCIOS COM DESCONTO',
    trialExpiredSubtitle:
      'O período de teste terminou, mas você pode continuar praticando de graça: os exercícios 1 e 2 e «Preposições 1» continuam abertos.',
    trialExpiredNote:
      'Quer recuperar o acesso total aos exercícios 3–10, «Preposições 2», «Raízes e binyanim» e ao chat de IA? Use o código promocional — há um desconto especial disponível para você.',
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
    promoHelp:
'📋 Copie e memorize o código promocional antes de abrir a App Store.\n\nSe a opção « Colar » não aparecer ao inserir o código, digite o código promocional manualmente.',
  },
  ar: {
    defaultTitle: '🔓 افتح جميع التمارين',
    defaultSubtitleAndroid: 'جرّب الوصول الكامل من خلال الاشتراك',
    defaultSubtitleIOS: 'جرّب الوصول الكامل من خلال الاشتراك',
    defaultNote: 'يمكنك الإلغاء في أي وقت',
    installDayTitle: '🎁 تم فتح الوصول الكامل',
    installDaySubtitle:
      'الآن Verbify كامل مفتوح لك — جرّب طرقًا مختلفة للتدريب واكتشف ما يساعدك أكثر.',
    installDayNote:
      '✅ سيبقى التمرينان 1 و2 و«حروف الجر 1» مجانيين دائمًا.\n🔓 يفتح لك الوصول التجريبي الكامل أيضًا التمارين 3–10، و«حروف الجر 2»، و«الجذور والأوزان»، ودردشة الذكاء الاصطناعي.\n🎁 بعد انتهاء الفترة التجريبية سيكون بانتظارك خصم خاص على الوصول الكامل.',
    trialDay1Title: '🎁 اليوم الأول من الوصول الكامل',
    trialDay1Subtitle:
      'هل تريد التحدث بثقة أكبر؟ درّب صيغ الأفعال حتى تصبح تلقائية، ثم ثبّتها في تراكيب مفيدة وجمل حقيقية.',
    trialDay1Note:
      '🚀 ابدأ بتدريب التصريفات وجرّب «حروف الجر 1» للعبرية اليومية — وسيبقى هذا التمرين مجانيًا حتى بعد انتهاء التجربة.',
    trialDay2Title: '🚀 اليوم الثاني من الوصول الكامل',
    trialDay2Subtitle:
      'جرّب الأنماط الأحدث: في «الجذور والأوزان» ستلاحظ الروابط بين الأفعال، و«حروف الجر 2» يدرّبك على التراكيب الطبيعية، أما «الفعل في الجملة» و«استمع وافهم» فينقلان التدريب إلى جمل حقيقية وفهم المسموع.',
    trialDay2Note:
      '⏳ كل هذه التمارين مفتوحة خلال فترة الوصول التجريبي الكامل؛ وبعد انتهاء التجربة تصبح متاحة مع الاشتراك.',
    trialDay3LastTitle: '⏳ اليوم الأخير من الوصول الكامل',
    trialDay3LastSubtitle:
      'اليوم هو آخر يوم من الوصول الكامل. إذا لم تجرّبها بعد، جرّب «حروف الجر 2» و«الجذور والأوزان» و«الفعل في الجملة» و«استمع وافهم».',
    trialDay3LastNote:
      '✅ سيبقى التمرينان 1 و2 و«حروف الجر 1» مجانيين دائمًا.\n🔓 يستمر الوصول الكامل إلى التمارين 3–10 و«حروف الجر 2» و«الجذور والأوزان» ودردشة الذكاء الاصطناعي مع الاشتراك.\n🎁 بعد انتهاء التجربة سيكون بانتظارك خصم خاص على الوصول الكامل.',
    trialExpiredTitle: '🎁 وصول كامل إلى جميع التمارين مع خصم',
    trialExpiredSubtitle:
      'انتهت الفترة التجريبية، لكن يمكنك متابعة التدريب مجانًا: سيبقى التمرينان 1 و2 و«حروف الجر 1» مفتوحين.',
    trialExpiredNote:
      'هل تريد استعادة الوصول الكامل إلى التمارين 3–10 و«حروف الجر 2» و«الجذور والأوزان» ودردشة الذكاء الاصطناعي؟ استخدم الرمز الترويجي — لديك خصم خاص متاح.',
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
    promoHelp:
'📋 انسخ واحفظ الرمز الترويجي قبل فتح App Store.\n\nإذا لم يظهر خيار « لصق » عند إدخال الرمز، فأدخل الرمز الترويجي يدويًا.',
  },
  am: {
    defaultTitle: '🔓 ሁሉንም ልምምዶች ክፈት',
    defaultSubtitleAndroid: 'በምዝገባ ሙሉ መዳረሻን ይሞክሩ',
    defaultSubtitleIOS: 'በምዝገባ ሙሉ መዳረሻን ይሞክሩ',
    defaultNote: 'በማንኛውም ጊዜ መሰረዝ ይችላሉ',
    installDayTitle: '🎁 ሙሉ መዳረሻ ተከፍቷል',
    installDaySubtitle:
      'አሁን ሙሉ Verbify ተከፍቶልዎታል — የተለያዩ የልምምድ መንገዶችን ይሞክሩ እና በጣም የሚረዳዎትን ያግኙ።',
    installDayNote:
      '✅ ልምምድ 1 እና 2 እና «መስተዋድዶች 1» ሁልጊዜ ነፃ ይቆያሉ።\n🔓 ሙሉ የሙከራ መዳረሻ ልምምዶች 3–10፣ «መስተዋድዶች 2»፣ «ሥሮች እና ቢንያኖች» እና AI ቻትን ይከፍታል።\n🎁 ሙከራው ካበቃ በኋላ ለሙሉ መዳረሻ ልዩ ቅናሽ ይጠብቅዎታል።',
    trialDay1Title: '🎁 የሙሉ መዳረሻ የመጀመሪያ ቀን',
    trialDay1Subtitle:
      'በዕብራይስጥ በራስ መተማመን መናገር ይፈልጋሉ? የግስ ቅጾችን እስኪለመዱ ይለማመዱ፣ ከዚያም በጠቃሚ ጥምረቶች እና በእውነተኛ አረፍተ ነገሮች ያጠናክሩ።',
    trialDay1Note:
      '🚀 በግስ ማጣመር ልምምዶች ይጀምሩ እና ለዕለታዊ ዕብራይስጥ «መስተዋድዶች 1»ን ይሞክሩ — ይህ ልምምድ ከሙከራው በኋላም ነፃ ይቆያል።',
    trialDay2Title: '🚀 የሙሉ መዳረሻ ሁለተኛ ቀን',
    trialDay2Subtitle:
      'አዲሶቹን ቅርጾች ይሞክሩ፤ «ሥሮች እና ቢንያኖች» በግሶች መካከል ያሉ ግንኙነቶችን ያሳያል፣ «መስተዋድዶች 2» ተፈጥሯዊ ጥምረቶችን ያለማምዳል፣ «በዓረፍተ ነገር ውስጥ ያለ ግስ» እና «አዳምጥ እና ተረዳ» ደግሞ ልምምዱን ወደ እውነተኛ አረፍተ ነገሮች እና ማዳመጥ ያመጣሉ።',
    trialDay2Note:
      '⏳ እነዚህ ሁሉ ልምምዶች በሙሉ የሙከራ መዳረሻዎ ውስጥ አሁን ተከፍተዋል፤ ሙከራው ካበቃ በኋላ በምዝገባ ይገኛሉ።',
    trialDay3LastTitle: '⏳ የሙሉ መዳረሻ የመጨረሻ ቀን',
    trialDay3LastSubtitle:
      'ዛሬ የሙሉ መዳረሻዎ የመጨረሻ ቀን ነው። ገና ካልሞከሩ «መስተዋድዶች 2»፣ «ሥሮች እና ቢንያኖች»፣ «በዓረፍተ ነገር ውስጥ ያለ ግስ» እና «አዳምጥ እና ተረዳ»ን ይሞክሩ።',
    trialDay3LastNote:
      '✅ ልምምድ 1 እና 2 እና «መስተዋድዶች 1» ሁልጊዜ ነፃ ይቆያሉ።\n🔓 ለልምምዶች 3–10፣ «መስተዋድዶች 2»፣ «ሥሮች እና ቢንያኖች» እና AI ቻት ሙሉ መዳረሻ በምዝገባ ይቀጥላል።\n🎁 ከሙከራው በኋላ ለሙሉ መዳረሻ ልዩ ቅናሽ ይጠብቅዎታል።',
    trialExpiredTitle: '🎁 ለሁሉም ልምምዶች ሙሉ መዳረሻ በቅናሽ',
    trialExpiredSubtitle:
      'የሙከራው ጊዜ ተጠናቋል፣ ግን በነፃ ልምምድዎን መቀጠል ይችላሉ፤ ልምምድ 1 እና 2 እና «መስተዋድዶች 1» ክፍት ይቆያሉ።',
    trialExpiredNote:
      'ለልምምዶች 3–10፣ «መስተዋድዶች 2»፣ «ሥሮች እና ቢንያኖች» እና AI ቻት ሙሉ መዳረሻን መመለስ ይፈልጋሉ? የፕሮሞ ኮዱን ይጠቀሙ — ልዩ ቅናሽ አለዎት።',
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
    promoHelp:
'📋 ወደ App Store ከመሄድዎ በፊት የፕሮሞ ኮዱን ይቅዱ እና ያስታውሱት።\n\nኮዱን ሲያስገቡ « Paste » የሚለው አማራጭ ካልታየ፣ የፕሮሞ ኮዱን በእጅ ያስገቡ።',
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
  // Берём день недели по UTC, чтобы 23:59:59Z
  // не превращался в следующий день в Израиле/Европе/Азии.
  const dayIndex = date.getUTCDay();
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
    useEffect(() => {
  if (hasPro) return;
  const baseParams = {
    language,
    source: 'upgrade_banner',
    banner_stage: currentBannerStage,
    trial_ends_at: internalTrialEndsAt,
    platform: Platform.OS,
  };
  if (trialExpired) {
    Analytics.logTrialExpired(baseParams);
    return;
  }
  if (!internalTrialActive) return;
  const dayByStage = {
    install_day: 0,
    trial_day_1: 1,
    trial_day_2: 2,
    trial_day_3_last: 3,
  };
  const day = dayByStage[currentBannerStage];
  if (day !== undefined) {
    Analytics.logTrialDay(day, baseParams);
  }
}, [
  hasPro,
  language,
  currentBannerStage,
  internalTrialActive,
  internalTrialEndsAt,
  trialExpired,
]);
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
                <ScrollView
                  style={styles.textScroll}
                  contentContainerStyle={styles.textScrollContent}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  <Text style={styles.subtitle} maxFontSizeMultiplier={1.2}>
                    {t.trialExpiredSubtitle}
                  </Text>
                  <Text style={styles.note} maxFontSizeMultiplier={1.2}>
                    {t.trialExpiredNote}
                  </Text>
                </ScrollView>
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
                {Platform.OS === 'ios' && (
  <Text
    style={styles.promoHelp}
    maxFontSizeMultiplier={1.2}
  >
    {t.promoHelp}
  </Text>
)}
                <TouchableOpacity
                  activeOpacity={0.85}
               onPress={() => {
  Analytics.logPaywallOpened('trial_expired_banner', {
    language,
    banner_stage: currentBannerStage,
    trial_expired: true,
    promo_discount: PROMO_DISCOUNT,
    trial_stage: currentBannerStage,
  });
  navigation.navigate(getPaywallRoute(), {
    promoDiscount: PROMO_DISCOUNT,
    promoCodes: PROMO_CODES,
    from: 'trial_expired_banner',
  });
}}
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
    const source = trialExpired
      ? 'expired_banner_container'
      : 'default_banner_container';
    Analytics.logPaywallOpened(source, {
      language,
      banner_stage: currentBannerStage,
      trial_expired: trialExpired,
      trial_active: internalTrialActive,
      trial_stage: currentBannerStage,
    });
    navigation.navigate(getPaywallRoute(), {
      from: source,
    });
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
            <ScrollView
              style={styles.textScroll}
              contentContainerStyle={styles.textScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <Text style={styles.subtitle} maxFontSizeMultiplier={1.2}>
                {content.subtitle}
              </Text>
              <Text style={styles.note} maxFontSizeMultiplier={1.2}>
                {content.note}
              </Text>
            </ScrollView>
          )}
       {internalTrialActive && (
  <View style={styles.trialButtonsColumn}>
    {showFull && (
      <TouchableOpacity
        activeOpacity={0.85}
     onPress={() => {
  Analytics.logPaywallOpened('trial_banner', {
    language,
    banner_stage: currentBannerStage,
    trial_active: true,
    trial_ends_at: internalTrialEndsAt,
    trial_stage: currentBannerStage,
  });
  navigation.navigate(getPaywallRoute(), {
    from: 'trial_banner',
  });
}}
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
  onPress={() => {
    const source = 'expired_banner_compact';
    Analytics.logPaywallOpened(source, {
      language,
      banner_stage: currentBannerStage,
      trial_expired: trialExpired,
      trial_stage: currentBannerStage,
    });
    navigation.navigate(getPaywallRoute(), {
      from: source,
    });
  }}
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
  textScroll: {
    width: '100%',
    maxHeight: 155,
    marginTop: 2,
  },
  textScrollContent: {
    flexGrow: 0,
    paddingHorizontal: 2,
    paddingBottom: 2,
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
  promoHelp: {
  color: 'rgba(255,255,255,0.92)',
  fontSize: 11,
  lineHeight: 15,
  textAlign: 'center',
  marginTop: 8,
  marginBottom: 4,
},
});
