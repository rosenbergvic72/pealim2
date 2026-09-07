import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LANGUAGE_ALIASES = {
  ru: 'ru',
  russian: 'ru',
  русский: 'ru',

  en: 'en',
  english: 'en',

  fr: 'fr',
  french: 'fr',
  français: 'fr',
  francais: 'fr',

  es: 'es',
  spanish: 'es',
  español: 'es',
  espanol: 'es',

  pt: 'pt',
  portuguese: 'pt',
  português: 'pt',
  portugues: 'pt',
  'pt-pt': 'pt',

  ar: 'ar',
  arabic: 'ar',
  arab: 'ar',
  العربية: 'ar',

  am: 'am',
  amharic: 'am',
  አማርኛ: 'am',

  he: 'he',
  iw: 'he',
  hebrew: 'he',
  עברית: 'he',
};

const normalizeLanguage = language => {
  const value = String(language || '')
    .trim()
    .toLowerCase();

  return LANGUAGE_ALIASES[value] || 'en';
};

const CONTENT = {
  ru: {
    title: 'ОБ УПРАЖНЕНИИ',

    introStart:
      'Это упражнение помогает запоминать, какие ',
    introHighlight:
      'предлоги употребляются после глаголов',
    introEnd:
      ', а также тренирует предлоги-приставки, которые присоединяются к следующему слову.',

    sectionHow:
      'КАК ВЫПОЛНЯТЬ УПРАЖНЕНИЕ',

    instructionStart:
      'Прочитайте перевод и предложение на иврите с пропущенным предлогом. Затем выберите ',
    instructionHighlight:
      'правильный предлог',
    instructionEnd:
      '. После ответа вы увидите полное предложение, транслитерацию и сможете прослушать произношение.',

    sectionTypes:
      'ДВА ТИПА ПРЕДЛОГОВ',

    separateTitle:
      '• Отдельные предлоги: ',
    separateText:
      'עם, על, אל пишутся отдельно от следующего слова.',

    prefixTitle:
      '• Предлоги-приставки: ',
    prefixText:
      'ל, ב, מ присоединяются к следующему слову: למורה, במחשב, מהבית.',

    sectionHints:
      'ПОДСКАЗКИ',

    hints:
      'В верхнем блоке показан инфинитив и перевод глагола. После ответа рядом с инфинитивом появляется правильный предлог, чтобы глагол запоминался вместе с управлением.',

    sectionExamples:
      'ПРИМЕРЫ',

    examples: [
      {
        type: 'separate',
        verb: 'לדבר עם',
        hebrew: 'אני מדבר עם חבר',
        translit: 'ani medaber im khaver',
        translation: 'Я разговариваю с другом',
      },
      {
        type: 'separate',
        verb: 'לחשוב על',
        hebrew: 'אנחנו חושבים על העתיד',
        translit: 'anakhnu khoshvim al haatid',
        translation: 'Мы думаем о будущем',
      },
      {
        type: 'separate',
        verb: 'לפנות אל',
        hebrew: 'אני פונה אל הרופא',
        translit: 'ani pone el harofe',
        translation: 'Я обращаюсь к врачу',
      },
      {
        type: 'prefix',
        verb: 'להשתמש ב-',
        hebrew: 'אני משתמש במחשב',
        translit: 'ani mishtamesh bamakhshev',
        translation: 'Я пользуюсь компьютером',
      },
      {
        type: 'prefix',
        verb: 'לענות ל-',
        hebrew: 'אני עונה למורה',
        translit: 'ani one lamore',
        translation: 'Я отвечаю учителю',
      },
    ],

    sectionLevels:
      'УРОВНИ СЛОЖНОСТИ',

    levels: [
      {
        title: '• Базовый уровень — ',
        text: 'самые распространённые сочетания глаголов и предлогов.',
      },
      {
        title: '• Средний уровень — ',
        text: 'более сложные сочетания, используемые в повседневной речи.',
      },
      {
        title: '• Продвинутый уровень — ',
        text: 'менее очевидные и более редкие варианты управления.',
      },
      {
        title: '• Все уровни — ',
        text: 'смешанная тренировка всех доступных сочетаний.',
      },
    ],

    sectionWhy:
      'ПОЧЕМУ ЭТО ВАЖНО',

    whyStart:
      'В иврите недостаточно знать только значение глагола. Важно также запомнить, ',
    whyHighlight:
      'какой предлог употребляется вместе с ним',
    whyEnd:
      '. Неправильный предлог может сделать фразу неестественной или изменить её смысл.',

    tipTitle:
      '• Совет: ',

    tip:
      'запоминайте глагол и предлог как единую конструкцию: לדבר עם, לחשוב על, לפנות אל, להשתמש ב־.',

    final:
      'Регулярная тренировка поможет быстрее строить правильные фразы и увереннее использовать глаголы в речи!',

    close: 'Закрыть',
  },

  en: {
    title: 'ABOUT THE EXERCISE',

    introStart:
      'This exercise helps you remember which ',
    introHighlight:
      'prepositions are used after Hebrew verbs',
    introEnd:
      ' and trains prefix prepositions that attach to the following word.',

    sectionHow:
      'HOW TO COMPLETE THE EXERCISE',

    instructionStart:
      'Read the translation and the incomplete Hebrew sentence. Then choose ',
    instructionHighlight:
      'the correct preposition',
    instructionEnd:
      '. After answering, you will see the complete sentence and transliteration and can listen to its pronunciation.',

    sectionTypes:
      'TWO TYPES OF PREPOSITIONS',

    separateTitle:
      '• Separate prepositions: ',
    separateText:
      'עם, על and אל are written separately from the following word.',

    prefixTitle:
      '• Prefix prepositions: ',
    prefixText:
      'ל, ב and מ attach to the following word: למורה, במחשב, מהבית.',

    sectionHints:
      'HINTS',

    hints:
      'The upper panel shows the infinitive and its translation. After answering, the correct preposition is added to the infinitive so that you learn the complete verb pattern.',

    sectionExamples:
      'EXAMPLES',

    examples: [
      {
        type: 'separate',
        verb: 'לדבר עם',
        hebrew: 'אני מדבר עם חבר',
        translit: 'ani medaber im khaver',
        translation: 'I am talking with a friend',
      },
      {
        type: 'separate',
        verb: 'לחשוב על',
        hebrew: 'אנחנו חושבים על העתיד',
        translit: 'anakhnu khoshvim al haatid',
        translation: 'We are thinking about the future',
      },
      {
        type: 'separate',
        verb: 'לפנות אל',
        hebrew: 'אני פונה אל הרופא',
        translit: 'ani pone el harofe',
        translation: 'I am addressing the doctor',
      },
      {
        type: 'prefix',
        verb: 'להשתמש ב-',
        hebrew: 'אני משתמש במחשב',
        translit: 'ani mishtamesh bamakhshev',
        translation: 'I use a computer',
      },
      {
        type: 'prefix',
        verb: 'לענות ל-',
        hebrew: 'אני עונה למורה',
        translit: 'ani one lamore',
        translation: 'I answer the teacher',
      },
    ],

    sectionLevels:
      'DIFFICULTY LEVELS',

    levels: [
      {
        title: '• Basic level — ',
        text: 'the most common combinations of verbs and prepositions.',
      },
      {
        title: '• Intermediate level — ',
        text: 'more complex combinations used in everyday speech.',
      },
      {
        title: '• Advanced level — ',
        text: 'less obvious and less frequent verb patterns.',
      },
      {
        title: '• All levels — ',
        text: 'mixed practice with all available combinations.',
      },
    ],

    sectionWhy:
      'WHY IT IS IMPORTANT',

    whyStart:
      'Knowing the meaning of a Hebrew verb is not enough. You also need to remember ',
    whyHighlight:
      'which preposition is used with it',
    whyEnd:
      '. Using the wrong preposition can make a sentence sound unnatural or change its meaning.',

    tipTitle:
      '• Tip: ',

    tip:
      'learn each verb and preposition as one pattern: לדבר עם, לחשוב על, לפנות אל, להשתמש ב־.',

    final:
      'Regular practice will help you build correct sentences faster and use Hebrew verbs more confidently!',

    close: 'Close',
  },

  fr: {
    title: 'À PROPOS DE L’EXERCICE',

    introStart:
      'Cet exercice aide à mémoriser les ',
    introHighlight:
      'prépositions utilisées après les verbes',
    introEnd:
      ' ainsi que les prépositions préfixées qui se joignent au mot suivant.',

    sectionHow:
      'COMMENT FAIRE L’EXERCICE',

    instructionStart:
      'Lisez la traduction et la phrase hébraïque incomplète, puis choisissez ',
    instructionHighlight:
      'la préposition correcte',
    instructionEnd:
      '. Après la réponse, la phrase complète, la translittération et la prononciation seront disponibles.',

    sectionTypes:
      'DEUX TYPES DE PRÉPOSITIONS',

    separateTitle:
      '• Prépositions séparées : ',
    separateText:
      'עם, על et אל s’écrivent séparément du mot suivant.',

    prefixTitle:
      '• Prépositions préfixées : ',
    prefixText:
      'ל, ב et מ se joignent au mot suivant : למורה, במחשב, מהבית.',

    sectionHints:
      'AIDES',

    hints:
      'Le bloc supérieur affiche l’infinitif et sa traduction. Après la réponse, la préposition correcte est ajoutée à l’infinitif afin de mémoriser la construction complète.',

    sectionExamples:
      'EXEMPLES',

    examples: [
      {
        type: 'separate',
        verb: 'לדבר עם',
        hebrew: 'אני מדבר עם חבר',
        translit: 'ani medaber im khaver',
        translation: 'Je parle avec un ami',
      },
      {
        type: 'separate',
        verb: 'לחשוב על',
        hebrew: 'אנחנו חושבים על העתיד',
        translit: 'anakhnu khoshvim al haatid',
        translation: 'Nous pensons à l’avenir',
      },
      {
        type: 'separate',
        verb: 'לפנות אל',
        hebrew: 'אני פונה אל הרופא',
        translit: 'ani pone el harofe',
        translation: 'Je m’adresse au médecin',
      },
      {
        type: 'prefix',
        verb: 'להשתמש ב-',
        hebrew: 'אני משתמש במחשב',
        translit: 'ani mishtamesh bamakhshev',
        translation: 'J’utilise un ordinateur',
      },
      {
        type: 'prefix',
        verb: 'לענות ל-',
        hebrew: 'אני עונה למורה',
        translit: 'ani one lamore',
        translation: 'Je réponds au professeur',
      },
    ],

    sectionLevels:
      'NIVEAUX DE DIFFICULTÉ',

    levels: [
      {
        title: '• Niveau de base — ',
        text: 'les combinaisons les plus fréquentes.',
      },
      {
        title: '• Niveau intermédiaire — ',
        text: 'des constructions plus complexes de la langue quotidienne.',
      },
      {
        title: '• Niveau avancé — ',
        text: 'des constructions moins évidentes et moins fréquentes.',
      },
      {
        title: '• Tous les niveaux — ',
        text: 'un entraînement combinant toutes les constructions.',
      },
    ],

    sectionWhy:
      'POURQUOI EST-CE IMPORTANT ?',

    whyStart:
      'Connaître le sens du verbe ne suffit pas. Il faut aussi mémoriser ',
    whyHighlight:
      'la préposition employée avec ce verbe',
    whyEnd:
      '. Une préposition incorrecte peut rendre la phrase peu naturelle ou en modifier le sens.',

    tipTitle:
      '• Conseil : ',

    tip:
      'mémorisez le verbe et sa préposition comme une seule construction : לדבר עם, לחשוב על, לפנות אל, להשתמש ב־.',

    final:
      'Une pratique régulière vous aidera à construire plus rapidement des phrases correctes en hébreu !',

    close: 'Fermer',
  },

  es: {
    title: 'SOBRE EL EJERCICIO',

    introStart:
      'Este ejercicio ayuda a memorizar las ',
    introHighlight:
      'preposiciones utilizadas después de los verbos',
    introEnd:
      ' y las preposiciones prefijadas que se unen a la palabra siguiente.',

    sectionHow:
      'CÓMO REALIZAR EL EJERCICIO',

    instructionStart:
      'Lee la traducción y la oración hebrea incompleta. Después elige ',
    instructionHighlight:
      'la preposición correcta',
    instructionEnd:
      '. Tras responder, aparecerán la oración completa, la transliteración y el audio.',

    sectionTypes:
      'DOS TIPOS DE PREPOSICIONES',

    separateTitle:
      '• Preposiciones separadas: ',
    separateText:
      'עם, על y אל se escriben separadas de la palabra siguiente.',

    prefixTitle:
      '• Preposiciones prefijadas: ',
    prefixText:
      'ל, ב y מ se unen a la palabra siguiente: למורה, במחשב, מהבית.',

    sectionHints:
      'PISTAS',

    hints:
      'El bloque superior muestra el infinitivo y su traducción. Después de responder, se añade la preposición correcta al infinitivo para memorizar la construcción completa.',

    sectionExamples:
      'EJEMPLOS',

    examples: [
      {
        type: 'separate',
        verb: 'לדבר עם',
        hebrew: 'אני מדבר עם חבר',
        translit: 'ani medaber im khaver',
        translation: 'Hablo con un amigo',
      },
      {
        type: 'separate',
        verb: 'לחשוב על',
        hebrew: 'אנחנו חושבים על העתיד',
        translit: 'anakhnu khoshvim al haatid',
        translation: 'Pensamos en el futuro',
      },
      {
        type: 'separate',
        verb: 'לפנות אל',
        hebrew: 'אני פונה אל הרופא',
        translit: 'ani pone el harofe',
        translation: 'Me dirijo al médico',
      },
      {
        type: 'prefix',
        verb: 'להשתמש ב-',
        hebrew: 'אני משתמש במחשב',
        translit: 'ani mishtamesh bamakhshev',
        translation: 'Uso una computadora',
      },
      {
        type: 'prefix',
        verb: 'לענות ל-',
        hebrew: 'אני עונה למורה',
        translit: 'ani one lamore',
        translation: 'Respondo al profesor',
      },
    ],

    sectionLevels:
      'NIVELES DE DIFICULTAD',

    levels: [
      {
        title: '• Nivel básico — ',
        text: 'las combinaciones más frecuentes.',
      },
      {
        title: '• Nivel intermedio — ',
        text: 'construcciones más complejas del habla cotidiana.',
      },
      {
        title: '• Nivel avanzado — ',
        text: 'construcciones menos frecuentes y menos evidentes.',
      },
      {
        title: '• Todos los niveles — ',
        text: 'práctica combinada con todas las construcciones.',
      },
    ],

    sectionWhy:
      'POR QUÉ ES IMPORTANTE',

    whyStart:
      'No basta con conocer el significado del verbo. También hay que recordar ',
    whyHighlight:
      'qué preposición se utiliza con él',
    whyEnd:
      '. Una preposición incorrecta puede hacer que la frase suene poco natural o cambiar su significado.',

    tipTitle:
      '• Consejo: ',

    tip:
      'memoriza el verbo y la preposición como una sola construcción: לדבר עם, לחשוב על, לפנות אל, להשתמש ב־.',

    final:
      'La práctica regular te ayudará a construir frases correctas con más rapidez y seguridad.',

    close: 'Cerrar',
  },

  pt: {
    title: 'SOBRE O EXERCÍCIO',

    introStart:
      'Este exercício ajuda a memorizar as ',
    introHighlight:
      'preposições usadas depois dos verbos',
    introEnd:
      ' e as preposições prefixadas que se ligam à palavra seguinte.',

    sectionHow:
      'COMO REALIZAR O EXERCÍCIO',

    instructionStart:
      'Leia a tradução e a frase incompleta em hebraico. Depois escolha ',
    instructionHighlight:
      'a preposição correta',
    instructionEnd:
      '. Após a resposta, verá a frase completa, a transliteração e poderá ouvir a pronúncia.',

    sectionTypes:
      'DOIS TIPOS DE PREPOSIÇÕES',

    separateTitle:
      '• Preposições separadas: ',
    separateText:
      'עם, על e אל são escritas separadamente da palavra seguinte.',

    prefixTitle:
      '• Preposições prefixadas: ',
    prefixText:
      'ל, ב e מ ligam-se à palavra seguinte: למורה, במחשב, מהבית.',

    sectionHints:
      'DICAS',

    hints:
      'O bloco superior mostra o infinitivo e a tradução. Após a resposta, a preposição correta é adicionada ao infinitivo para memorizar a construção completa.',

    sectionExamples:
      'EXEMPLOS',

    examples: [
      {
        type: 'separate',
        verb: 'לדבר עם',
        hebrew: 'אני מדבר עם חבר',
        translit: 'ani medaber im khaver',
        translation: 'Eu converso com um amigo',
      },
      {
        type: 'separate',
        verb: 'לחשוב על',
        hebrew: 'אנחנו חושבים על העתיד',
        translit: 'anakhnu khoshvim al haatid',
        translation: 'Pensamos no futuro',
      },
      {
        type: 'separate',
        verb: 'לפנות אל',
        hebrew: 'אני פונה אל הרופא',
        translit: 'ani pone el harofe',
        translation: 'Dirijo-me ao médico',
      },
      {
        type: 'prefix',
        verb: 'להשתמש ב-',
        hebrew: 'אני משתמש במחשב',
        translit: 'ani mishtamesh bamakhshev',
        translation: 'Eu uso um computador',
      },
      {
        type: 'prefix',
        verb: 'לענות ל-',
        hebrew: 'אני עונה למורה',
        translit: 'ani one lamore',
        translation: 'Eu respondo ao professor',
      },
    ],

    sectionLevels:
      'NÍVEIS DE DIFICULDADE',

    levels: [
      {
        title: '• Nível básico — ',
        text: 'as combinações mais frequentes.',
      },
      {
        title: '• Nível intermédio — ',
        text: 'construções mais complexas da linguagem quotidiana.',
      },
      {
        title: '• Nível avançado — ',
        text: 'construções menos evidentes e menos frequentes.',
      },
      {
        title: '• Todos os níveis — ',
        text: 'treino combinado de todas as construções.',
      },
    ],

    sectionWhy:
      'POR QUE É IMPORTANTE',

    whyStart:
      'Não basta conhecer o significado do verbo. Também é necessário recordar ',
    whyHighlight:
      'qual preposição é usada com ele',
    whyEnd:
      '. Uma preposição incorreta pode tornar a frase pouco natural ou alterar o significado.',

    tipTitle:
      '• Dica: ',

    tip:
      'memorize o verbo e a preposição como uma única construção: לדבר עם, לחשוב על, לפנות אל, להשתמש ב־.',

    final:
      'A prática regular ajudará a construir frases corretas com mais rapidez e confiança.',

    close: 'Fechar',
  },

  ar: {
    title: 'حول التمرين',

    introStart:
      'يساعد هذا التمرين على حفظ ',
    introHighlight:
      'حروف الجر التي تأتي بعد الأفعال',
    introEnd:
      ' وحروف الجر المتصلة التي تلتصق بالكلمة التالية.',

    sectionHow:
      'كيفية تنفيذ التمرين',

    instructionStart:
      'اقرأ الترجمة والجملة العبرية الناقصة، ثم اختر ',
    instructionHighlight:
      'حرف الجر الصحيح',
    instructionEnd:
      '. بعد الإجابة ستظهر الجملة الكاملة والكتابة الصوتية ويمكنك الاستماع إلى النطق.',

    sectionTypes:
      'نوعان من حروف الجر',

    separateTitle:
      '• حروف جر منفصلة: ',
    separateText:
      'עם و־על و־אל تُكتب منفصلة عن الكلمة التالية.',

    prefixTitle:
      '• حروف جر متصلة: ',
    prefixText:
      'ל و־ב و־מ تلتصق بالكلمة التالية: למורה، במחשב، מהבית.',

    sectionHints:
      'التلميحات',

    hints:
      'يعرض الجزء العلوي صيغة المصدر وترجمتها. بعد الإجابة يُضاف حرف الجر الصحيح إلى المصدر لتعلّم التركيب كاملًا.',

    sectionExamples:
      'أمثلة',

    examples: [
      {
        type: 'separate',
        verb: 'לדבר עם',
        hebrew: 'אני מדבר עם חבר',
        translit: 'ani medaber im khaver',
        translation: 'أنا أتحدث مع صديق',
      },
      {
        type: 'separate',
        verb: 'לחשוב על',
        hebrew: 'אנחנו חושבים על העתיד',
        translit: 'anakhnu khoshvim al haatid',
        translation: 'نحن نفكر في المستقبل',
      },
      {
        type: 'separate',
        verb: 'לפנות אל',
        hebrew: 'אני פונה אל הרופא',
        translit: 'ani pone el harofe',
        translation: 'أتوجه إلى الطبيب',
      },
      {
        type: 'prefix',
        verb: 'להשתמש ב-',
        hebrew: 'אני משתמש במחשב',
        translit: 'ani mishtamesh bamakhshev',
        translation: 'أنا أستخدم الحاسوب',
      },
      {
        type: 'prefix',
        verb: 'לענות ל-',
        hebrew: 'אני עונה למורה',
        translit: 'ani one lamore',
        translation: 'أنا أجيب المعلم',
      },
    ],

    sectionLevels:
      'مستويات الصعوبة',

    levels: [
      {
        title: '• المستوى الأساسي — ',
        text: 'أكثر تراكيب الأفعال وحروف الجر شيوعًا.',
      },
      {
        title: '• المستوى المتوسط — ',
        text: 'تراكيب أكثر تعقيدًا في الحديث اليومي.',
      },
      {
        title: '• المستوى المتقدم — ',
        text: 'تراكيب أقل وضوحًا وأقل شيوعًا.',
      },
      {
        title: '• جميع المستويات — ',
        text: 'تدريب مختلط على جميع التراكيب.',
      },
    ],

    sectionWhy:
      'لماذا هذا مهم؟',

    whyStart:
      'لا يكفي معرفة معنى الفعل، بل يجب أيضًا معرفة ',
    whyHighlight:
      'حرف الجر المستخدم معه',
    whyEnd:
      '. قد يجعل حرف الجر الخاطئ الجملة غير طبيعية أو يغيّر معناها.',

    tipTitle:
      '• نصيحة: ',

    tip:
      'احفظ الفعل وحرف الجر كتعبير واحد: לדבר עם، לחשוב על، לפנות אל، להשתמש ב־.',

    final:
      'يساعد التدريب المنتظم على بناء جمل صحيحة واستخدام الأفعال بثقة أكبر.',

    close: 'إغلاق',
  },

  am: {
    title: 'ስለ ልምምዱ',

    introStart:
      'ይህ ልምምድ ',
    introHighlight:
      'ከግሶች በኋላ የሚመጡ መስተዋድዶችን',
    introEnd:
      ' እና ከቀጣዩ ቃል ጋር የሚጣመሩ መስተዋድዶችን ለማስታወስ ይረዳል።',

    sectionHow:
      'ልምምዱን እንዴት ማከናወን እንደሚቻል',

    instructionStart:
      'ትርጉሙንና ያልተሟላውን የዕብራይስጥ ዓረፍተ ነገር ያንብቡ፣ ከዚያ ',
    instructionHighlight:
      'ትክክለኛውን መስተዋድድ',
    instructionEnd:
      ' ይምረጡ። ከመልሱ በኋላ ሙሉው ዓረፍተ ነገር፣ ትራንስሊተሬሽንና ድምፅ ይታያሉ።',

    sectionTypes:
      'ሁለት የመስተዋድድ ዓይነቶች',

    separateTitle:
      '• ተለይተው የሚጻፉ: ',
    separateText:
      'עם፣ על እና אל ከቀጣዩ ቃል ተለይተው ይጻፋሉ።',

    prefixTitle:
      '• ከቃሉ ጋር የሚጣመሩ: ',
    prefixText:
      'ל፣ ב እና מ ከቀጣዩ ቃል ጋር ይጣመራሉ፦ למורה፣ במחשב፣ מהבית።',

    sectionHints:
      'እገዛዎች',

    hints:
      'የላይኛው ክፍል የግሱን መነሻ ቅርጽና ትርጉም ያሳያል። ከመልሱ በኋላ ትክክለኛው መስተዋድድ ይጨመራል።',

    sectionExamples:
      'ምሳሌዎች',

    examples: [
      {
        type: 'separate',
        verb: 'לדבר עם',
        hebrew: 'אני מדבר עם חבר',
        translit: 'ani medaber im khaver',
        translation: 'ከጓደኛ ጋር እናገራለሁ',
      },
      {
        type: 'separate',
        verb: 'לחשוב על',
        hebrew: 'אנחנו חושבים על העתיד',
        translit: 'anakhnu khoshvim al haatid',
        translation: 'ስለ ወደፊቱ እናስባለን',
      },
      {
        type: 'separate',
        verb: 'לפנות אל',
        hebrew: 'אני פונה אל הרופא',
        translit: 'ani pone el harofe',
        translation: 'ወደ ሐኪሙ እጠይቃለሁ',
      },
      {
        type: 'prefix',
        verb: 'להשתמש ב-',
        hebrew: 'אני משתמש במחשב',
        translit: 'ani mishtamesh bamakhshev',
        translation: 'ኮምፒውተር እጠቀማለሁ',
      },
      {
        type: 'prefix',
        verb: 'לענות ל-',
        hebrew: 'אני עונה למורה',
        translit: 'ani one lamore',
        translation: 'ለአስተማሪው እመልሳለሁ',
      },
    ],

    sectionLevels:
      'የችግኝነት ደረጃዎች',

    levels: [
      {
        title: '• መሠረታዊ ደረጃ — ',
        text: 'በብዛት የሚጠቀሙባቸው የግስና መስተዋድድ ጥምረቶች።',
      },
      {
        title: '• መካከለኛ ደረጃ — ',
        text: 'በዕለታዊ ንግግር የሚገኙ ውስብስብ ጥምረቶች።',
      },
      {
        title: '• ከፍተኛ ደረጃ — ',
        text: 'ብዙም ያልተለመዱ ጥምረቶች።',
      },
      {
        title: '• ሁሉም ደረጃዎች — ',
        text: 'ሁሉንም ጥምረቶች ያካተተ ልምምድ።',
      },
    ],

    sectionWhy:
      'ይህ ለምን አስፈላጊ ነው?',

    whyStart:
      'የግሱን ትርጉም ብቻ ማወቅ በቂ አይደለም። ',
    whyHighlight:
      'ከግሱ ጋር የሚጠቀመውን መስተዋድድ',
    whyEnd:
      ' ማወቅም ያስፈልጋል።',

    tipTitle:
      '• ምክር፦ ',

    tip:
      'ግሱንና መስተዋድዱን እንደ አንድ ጥምረት ያስታውሱ፦ לדבר עם፣ לחשוב על፣ לפנות אל፣ להשתמש ב־።',

    final:
      'ተደጋጋሚ ልምምድ ትክክለኛ ዓረፍተ ነገሮችን በፍጥነት ለመገንባት ይረዳል።',

    close: 'ዝጋ',
  },

  he: {
    title: 'על התרגיל',

    introStart:
      'התרגיל עוזר לזכור ',
    introHighlight:
      'אילו מילות יחס באות אחרי פעלים',
    introEnd:
      ' וגם לתרגל מילות יחס צמודות המתחברות למילה הבאה.',

    sectionHow:
      'איך מבצעים את התרגיל',

    instructionStart:
      'קראו את התרגום ואת המשפט החסר בעברית ובחרו ',
    instructionHighlight:
      'את מילת היחס הנכונה',
    instructionEnd:
      '. לאחר התשובה יופיעו המשפט המלא, התעתיק וההקלטה.',

    sectionTypes:
      'שני סוגים של מילות יחס',

    separateTitle:
      '• מילות יחס נפרדות: ',
    separateText:
      'עם, על ואל נכתבות בנפרד מהמילה הבאה.',

    prefixTitle:
      '• מילות יחס צמודות: ',
    prefixText:
      'ל, ב ומ מתחברות למילה הבאה: למורה, במחשב, מהבית.',

    sectionHints:
      'עזרה',

    hints:
      'בחלק העליון מוצגים שם הפועל והתרגום שלו. לאחר התשובה נוספת מילת היחס הנכונה לשם הפועל כדי ללמוד את הצירוף המלא.',

    sectionExamples:
      'דוגמאות',

    examples: [
      {
        type: 'separate',
        verb: 'לדבר עם',
        hebrew: 'אני מדבר עם חבר',
        translit: 'ani medaber im khaver',
        translation: 'לדבר עם חבר',
      },
      {
        type: 'separate',
        verb: 'לחשוב על',
        hebrew: 'אנחנו חושבים על העתיד',
        translit: 'anakhnu khoshvim al haatid',
        translation: 'לחשוב על העתיד',
      },
      {
        type: 'separate',
        verb: 'לפנות אל',
        hebrew: 'אני פונה אל הרופא',
        translit: 'ani pone el harofe',
        translation: 'לפנות אל הרופא',
      },
      {
        type: 'prefix',
        verb: 'להשתמש ב-',
        hebrew: 'אני משתמש במחשב',
        translit: 'ani mishtamesh bamakhshev',
        translation: 'להשתמש במחשב',
      },
      {
        type: 'prefix',
        verb: 'לענות ל-',
        hebrew: 'אני עונה למורה',
        translit: 'ani one lamore',
        translation: 'לענות למורה',
      },
    ],

    sectionLevels:
      'רמות קושי',

    levels: [
      {
        title: '• רמה בסיסית — ',
        text: 'צירופי הפועל ומילת היחס הנפוצים ביותר.',
      },
      {
        title: '• רמה בינונית — ',
        text: 'צירופים מורכבים יותר מהשפה היומיומית.',
      },
      {
        title: '• רמה מתקדמת — ',
        text: 'צירופים פחות ברורים ופחות שכיחים.',
      },
      {
        title: '• כל הרמות — ',
        text: 'תרגול משולב של כל הצירופים.',
      },
    ],

    sectionWhy:
      'למה זה חשוב?',

    whyStart:
      'לא מספיק לדעת את משמעות הפועל. צריך לזכור גם ',
    whyHighlight:
      'איזו מילת יחס באה איתו',
    whyEnd:
      '. מילת יחס לא נכונה עלולה לגרום למשפט להישמע לא טבעי או לשנות את משמעותו.',

    tipTitle:
      '• עצה: ',

    tip:
      'למדו את הפועל ואת מילת היחס כצירוף אחד: לדבר עם, לחשוב על, לפנות אל, להשתמש ב־.',

    final:
      'תרגול קבוע יעזור לבנות משפטים נכונים מהר יותר ולהשתמש בפעלים בביטחון.',

    close: 'סגירה',
  },
};

const PrepositionVerbDescriptionModal = ({
  visible,
  onToggle,
  onClose,
  language,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const normalizedLanguage = normalizeLanguage(language);
  const content =
    CONTENT[normalizedLanguage] || CONTENT.en;

  const isRTL =
    normalizedLanguage === 'ar' ||
    normalizedLanguage === 'he';

  const closeModal = onToggle || onClose;

  const directionStyles = useMemo(
    () => ({
      textAlign: isRTL ? 'right' : 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    }),
    [isRTL]
  );

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();

      return;
    }

    fadeAnim.setValue(0);
    slideAnim.setValue(30);
  }, [visible, fadeAnim, slideAnim]);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={closeModal}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalView,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim,
                },
              ],
            },
          ]}
        >
          <View style={styles.contentWrapper}>
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={
                styles.scrollViewContent
              }
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require('./VERBIFY.png')}
                  style={styles.logo}
                />
              </View>

              <Text style={styles.modalTitle}>
                {content.title}
              </Text>

              <Text
                style={[
                  styles.modalText,
                  directionStyles,
                ]}
              >
                {content.introStart}

                <Text
                  style={[
                    styles.bold,
                    styles.highlightMain,
                  ]}
                >
                  {content.introHighlight}
                </Text>

                {content.introEnd}
              </Text>

              <Text style={styles.sectionTitle}>
                {content.sectionHow}
              </Text>

              <Text
                style={[
                  styles.modalText,
                  directionStyles,
                ]}
              >
                {content.instructionStart}

                <Text
                  style={[
                    styles.bold,
                    styles.highlightMain,
                  ]}
                >
                  {content.instructionHighlight}
                </Text>

                {content.instructionEnd}
              </Text>

              <Text style={styles.sectionTitle}>
                {content.sectionTypes}
              </Text>

              <Text
                style={[
                  styles.listItem,
                  directionStyles,
                ]}
              >
                <Text
                  style={[
                    styles.bold,
                    styles.highlightExercise,
                  ]}
                >
                  {content.separateTitle}
                </Text>

                {content.separateText}
              </Text>

              <Text
                style={[
                  styles.listItem,
                  directionStyles,
                ]}
              >
                <Text
                  style={[
                    styles.bold,
                    styles.highlightExercise,
                  ]}
                >
                  {content.prefixTitle}
                </Text>

                {content.prefixText}
              </Text>

              <Text style={styles.sectionTitle}>
                {content.sectionHints}
              </Text>

              <Text
                style={[
                  styles.modalText,
                  directionStyles,
                ]}
              >
                {content.hints}
              </Text>

              <Text style={styles.sectionTitle}>
                {content.sectionExamples}
              </Text>

              <View style={styles.examplesContainer}>
                {content.examples.map(
                  (example, index) => (
                    <View
                      key={`${example.verb}-${index}`}
                      style={[
                        styles.exampleCard,
                        index ===
                          content.examples.length - 1 &&
                          styles.exampleCardLast,
                      ]}
                    >
                      <View style={styles.exampleTopRow}>
                        <View
                          style={[
                            styles.typeMarker,
                            example.type === 'prefix'
                              ? styles.typeMarkerPrefix
                              : styles.typeMarkerSeparate,
                          ]}
                        />

                        <Text
                          style={styles.exampleVerb}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.78}
                          maxFontSizeMultiplier={1}
                        >
                          {example.verb}
                        </Text>
                      </View>

                      <Text
                        style={styles.exampleHebrew}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.78}
                        maxFontSizeMultiplier={1}
                      >
                        {example.hebrew}
                      </Text>

                      <Text
                        style={styles.exampleTranslit}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.82}
                        maxFontSizeMultiplier={1}
                      >
                        {example.translit}
                      </Text>

                      <Text
                        style={[
                          styles.exampleTranslation,
                          directionStyles,
                        ]}
                        numberOfLines={2}
                      >
                        {example.translation}
                      </Text>
                    </View>
                  )
                )}
              </View>

              <Text style={styles.sectionTitle}>
                {content.sectionLevels}
              </Text>

              {content.levels.map((level, index) => (
                <Text
                  key={`${level.title}-${index}`}
                  style={[
                    styles.listItem,
                    directionStyles,
                  ]}
                >
                  <Text
                    style={[
                      styles.bold,
                      styles.highlightExercise,
                    ]}
                  >
                    {level.title}
                  </Text>

                  {level.text}
                </Text>
              ))}

              <Text style={styles.sectionTitle}>
                {content.sectionWhy}
              </Text>

              <Text
                style={[
                  styles.modalText,
                  directionStyles,
                ]}
              >
                {content.whyStart}

                <Text
                  style={[
                    styles.bold,
                    styles.highlightAccent,
                  ]}
                >
                  {content.whyHighlight}
                </Text>

                {content.whyEnd}
              </Text>

              <Text
                style={[
                  styles.tipText,
                  directionStyles,
                ]}
              >
                <Text
                  style={[
                    styles.bold,
                    styles.highlightTip,
                  ]}
                >
                  {content.tipTitle}
                </Text>

                {content.tip}
              </Text>

              <Text style={styles.finalText}>
                <Text
                  style={[
                    styles.bold,
                    styles.highlightFinal,
                  ]}
                >
                  {content.final}
                </Text>
              </Text>
            </ScrollView>

            <View style={styles.buttonWrapper}>
              <TouchableOpacity
                style={styles.button}
                onPress={closeModal}
                activeOpacity={0.75}
              >
                <Text style={styles.textStyle}>
                  {content.close}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalView: {
    width: '90%',
    height: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#FFFDEF',
    borderRadius: 12,
    overflow: 'hidden',
  },

  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },

  scrollArea: {
    flex: 1,
    marginTop: 12,
  },

  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 30,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 2,
  },

  logo: {
    width: 110,
    height: 90,
    resizeMode: 'contain',
  },

  modalTitle: {
    color: '#1C3F60',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    color: '#1C3F60',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 10,
  },

  modalText: {
    color: '#333652',
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'left',
    marginBottom: 10,
  },

  listItem: {
    color: '#333652',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'left',
    marginBottom: 8,
  },

  examplesContainer: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: 'rgba(131,163,205,0.13)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },

  exampleCard: {
    width: '100%',
    minHeight: 118,
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51,54,82,0.12)',
  },

  exampleCardLast: {
    borderBottomWidth: 0,
  },

  exampleTopRow: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 7,
    marginBottom: 4,
  },

  typeMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  typeMarkerSeparate: {
    backgroundColor: '#C96F90',
  },

  typeMarkerPrefix: {
    backgroundColor: '#D0A545',
  },

  exampleVerb: {
    color: '#A84F70',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  /*
   * Ивритская фраза занимает всю ширину.
   * Нет фиксированной узкой колонки,
   * поэтому длинный текст не переносится
   * при наличии свободного места.
   */
  exampleHebrew: {
    width: '100%',
    color: '#1C3F60',
    fontSize: 22,
    lineHeight: 29,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  exampleTranslit: {
    width: '100%',
    marginTop: 1,
    color: '#6B708A',
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  exampleTranslation: {
    width: '100%',
    marginTop: 4,
    color: '#333652',
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },

  tipText: {
    color: '#333652',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'left',
    marginTop: 8,
    marginBottom: 10,
  },

  finalText: {
    color: '#333652',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
  },

  bold: {
    fontWeight: 'bold',
  },

  highlightMain: {
    color: '#0F4C81',
  },

  highlightExercise: {
    color: '#C8502D',
  },

  highlightTip: {
    color: '#00796B',
  },

  highlightAccent: {
    color: '#8E24AA',
  },

  highlightFinal: {
    color: '#D81B60',
  },

  buttonWrapper: {
    alignItems: 'center',
    backgroundColor: '#FFFDEF',
  },

  button: {
    width: '44%',
    minHeight: 48,
    marginTop: 10,
    marginBottom: 22,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2D4769',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textStyle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PrepositionVerbDescriptionModal;