import React, {
  useEffect,
  useMemo,
  useRef,
} from 'react';

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

const {
  height: SCREEN_HEIGHT,
} = Dimensions.get('window');

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
};

const normalizeLanguage = language => {
  const normalized =
    String(language || '')
      .trim()
      .toLowerCase();

  return (
    LANGUAGE_ALIASES[normalized] ||
    'en'
  );
};

const CONTENT = {
  ru: {
    title: 'ОБ УПРАЖНЕНИИ',

    introStart:
      'Это упражнение дополняет изучение глаголов и помогает освоить ',

    introHighlight:
      'предлоги с местоименными суффиксами',

    introEnd:
      ' — особые формы предлогов, которые постоянно используются вместе с глаголами и заменяют сочетания вроде «со мной», «для тебя», «у него» или «как мы».',

    sectionHow:
      'КАК ВЫПОЛНЯТЬ УПРАЖНЕНИЕ',

    instructionStart:
      'Выберите направление перевода, затем найдите ',

    instructionHighlight:
      'правильную форму предлога',

    instructionEnd:
      '. В направлении «иврит → перевод» произношение воспроизводится автоматически. После ответа правильный вариант можно прослушать повторно.',

    sectionHints:
      'ПОДСКАЗКИ',

    hints:
      'Кнопка вверху экрана переключает три режима: транслитерация и подсветка местоименных окончаний, только подсветка окончаний или полное отключение подсказок.',

    sectionExamples:
      'ПРИМЕРЫ',

    examples: [
      {
        hebrew: 'איתי',
        translit: 'iti',
        translation: 'со мной',
      },
      {
        hebrew: 'בשבילה',
        translit: 'bishvila',
        translation: 'для неё',
      },
      {
        hebrew: 'אצלו',
        translit: 'etslo',
        translation: 'у него',
      },
      {
        hebrew: 'כמונו',
        translit: 'kamonu',
        translation: 'как мы',
      },
    ],

    sectionLevels:
      'УРОВНИ СЛОЖНОСТИ',

    levels: [
      {
        title: '• Базовый уровень — ',
        text:
          'самые употребительные предлоги и их формы.',
      },
      {
        title: '• Средний уровень — ',
        text:
          'более сложные предлоги, часто встречающиеся в повседневной речи.',
      },
      {
        title: '• Продвинутый уровень — ',
        text:
          'редкие и более сложные формы.',
      },
      {
        title: '• Все уровни — ',
        text:
          'смешанная тренировка всех доступных предлогов.',
      },
    ],

    sectionWhy:
      'ПОЧЕМУ ЭТО ВАЖНО',

    whyStart:
      'Многие глаголы в иврите употребляются с определёнными предлогами. Чтобы говорить естественно, важно знать не только сам глагол, но и ',

    whyHighlight:
      'правильную форму предлога с местоименным суффиксом',

    whyEnd:
      '. Регулярная тренировка помогает быстрее понимать речь, правильно строить фразы и увереннее использовать глаголы в реальном общении.',

    tipTitle:
      '• Совет: ',

    tip:
      'начните с базового уровня и используйте подсветку окончаний. Когда формы начнут легко узнаваться, отключите транслитерацию, а затем и подсветку.',

    final:
      'Регулярная практика поможет вам правильно сочетать глаголы с предлогами и увереннее говорить на иврите!',

    close:
      'Закрыть',
  },

  en: {
    title: 'ABOUT THE EXERCISE',

    introStart:
      'This exercise complements your verb practice and helps you master ',

    introHighlight:
      'prepositions with pronominal suffixes',

    introEnd:
      ' — special forms frequently used with verbs that replace phrases such as “with me,” “for you,” “at his place,” or “like us.”',

    sectionHow:
      'HOW TO COMPLETE THE EXERCISE',

    instructionStart:
      'Choose the translation direction, then select ',

    instructionHighlight:
      'the correct preposition form',

    instructionEnd:
      '. In Hebrew → translation mode, the pronunciation is played automatically. After answering, you can play the correct form again.',

    sectionHints:
      'HINTS',

    hints:
      'The button at the top switches between three modes: transliteration with highlighted pronominal suffixes, highlighted suffixes only, or no hints.',

    sectionExamples:
      'EXAMPLES',

    examples: [
      {
        hebrew: 'איתי',
        translit: 'iti',
        translation: 'with me',
      },
      {
        hebrew: 'בשבילה',
        translit: 'bishvila',
        translation: 'for her',
      },
      {
        hebrew: 'אצלו',
        translit: 'etslo',
        translation: 'at his place / with him',
      },
      {
        hebrew: 'כמונו',
        translit: 'kamonu',
        translation: 'like us',
      },
    ],

    sectionLevels:
      'DIFFICULTY LEVELS',

    levels: [
      {
        title: '• Basic level — ',
        text:
          'the most common prepositions and their forms.',
      },
      {
        title: '• Intermediate level — ',
        text:
          'more complex prepositions frequently used in everyday speech.',
      },
      {
        title: '• Advanced level — ',
        text:
          'less common and more difficult forms.',
      },
      {
        title: '• All levels — ',
        text:
          'mixed practice with all available prepositions.',
      },
    ],

    sectionWhy:
      'WHY IT IS IMPORTANT',

    whyStart:
      'Many Hebrew verbs are used with specific prepositions. To speak naturally, you need to know not only the verb itself but also ',

    whyHighlight:
      'the correct preposition form with a pronominal suffix',

    whyEnd:
      '. Regular practice helps you understand spoken Hebrew faster, build correct phrases, and use verbs more confidently in real communication.',

    tipTitle:
      '• Tip: ',

    tip:
      'start with the basic level and use the highlighted suffixes. Once the forms become familiar, hide the transliteration and then turn off the highlighting.',

    final:
      'Regular practice will help you combine Hebrew verbs and prepositions correctly and speak with greater confidence!',

    close:
      'Close',
  },

  fr: {
    title: 'À PROPOS DE L’EXERCICE',

    introStart:
      'Cet exercice complète l’apprentissage des verbes et vous aide à maîtriser ',

    introHighlight:
      'les prépositions avec des suffixes pronominaux',

    introEnd:
      ' — des formes souvent utilisées avec les verbes qui remplacent des expressions comme « avec moi », « pour toi », « chez lui » ou « comme nous ».',

    sectionHow:
      'COMMENT FAIRE L’EXERCICE',

    instructionStart:
      'Choisissez le sens de la traduction, puis sélectionnez ',

    instructionHighlight:
      'la forme correcte de la préposition',

    instructionEnd:
      '. Dans le sens hébreu → traduction, la prononciation est lancée automatiquement. Après votre réponse, vous pouvez réécouter la forme correcte.',

    sectionHints:
      'AIDES',

    hints:
      'Le bouton situé en haut permet de choisir entre trois modes : translittération et suffixes pronominaux colorés, suffixes colorés uniquement ou aucune aide.',

    sectionExamples:
      'EXEMPLES',

    examples: [
      {
        hebrew: 'איתי',
        translit: 'iti',
        translation: 'avec moi',
      },
      {
        hebrew: 'בשבילה',
        translit: 'bishvila',
        translation: 'pour elle',
      },
      {
        hebrew: 'אצלו',
        translit: 'etslo',
        translation: 'chez lui',
      },
      {
        hebrew: 'כמונו',
        translit: 'kamonu',
        translation: 'comme nous',
      },
    ],

    sectionLevels:
      'NIVEAUX DE DIFFICULTÉ',

    levels: [
      {
        title: '• Niveau de base — ',
        text:
          'les prépositions les plus courantes et leurs formes.',
      },
      {
        title: '• Niveau intermédiaire — ',
        text:
          'des prépositions plus complexes, fréquentes dans la langue quotidienne.',
      },
      {
        title: '• Niveau avancé — ',
        text:
          'des formes plus rares et plus difficiles.',
      },
      {
        title: '• Tous les niveaux — ',
        text:
          'un entraînement mixte avec toutes les prépositions disponibles.',
      },
    ],

    sectionWhy:
      'POURQUOI EST-CE IMPORTANT ?',

    whyStart:
      'De nombreux verbes hébreux s’emploient avec des prépositions précises. Pour parler naturellement, il faut connaître non seulement le verbe, mais aussi ',

    whyHighlight:
      'la forme correcte de la préposition avec son suffixe pronominal',

    whyEnd:
      '. Une pratique régulière aide à comprendre plus rapidement l’hébreu parlé, à construire des phrases correctes et à mieux utiliser les verbes.',

    tipTitle:
      '• Conseil : ',

    tip:
      'commencez par le niveau de base avec les suffixes colorés. Lorsque les formes deviennent familières, masquez la translittération, puis désactivez la coloration.',

    final:
      'Une pratique régulière vous aidera à associer correctement les verbes et les prépositions en hébreu !',

    close:
      'Fermer',
  },

  es: {
    title: 'SOBRE EL EJERCICIO',

    introStart:
      'Este ejercicio complementa el estudio de los verbos y ayuda a dominar ',

    introHighlight:
      'las preposiciones con sufijos pronominales',

    introEnd:
      ' — formas utilizadas frecuentemente con los verbos que sustituyen expresiones como «conmigo», «para ti», «en su casa» o «como nosotros».',

    sectionHow:
      'CÓMO REALIZAR EL EJERCICIO',

    instructionStart:
      'Elige la dirección de traducción y selecciona ',

    instructionHighlight:
      'la forma correcta de la preposición',

    instructionEnd:
      '. En la dirección hebreo → traducción, la pronunciación se reproduce automáticamente. Después de responder, puedes volver a escuchar la forma correcta.',

    sectionHints:
      'PISTAS',

    hints:
      'El botón de la parte superior permite alternar entre tres modos: transliteración con sufijos pronominales resaltados, solo sufijos resaltados o ninguna ayuda.',

    sectionExamples:
      'EJEMPLOS',

    examples: [
      {
        hebrew: 'איתי',
        translit: 'iti',
        translation: 'conmigo',
      },
      {
        hebrew: 'בשבילה',
        translit: 'bishvila',
        translation: 'para ella',
      },
      {
        hebrew: 'אצלו',
        translit: 'etslo',
        translation: 'en su casa / con él',
      },
      {
        hebrew: 'כמונו',
        translit: 'kamonu',
        translation: 'como nosotros',
      },
    ],

    sectionLevels:
      'NIVELES DE DIFICULTAD',

    levels: [
      {
        title: '• Nivel básico — ',
        text:
          'las preposiciones más frecuentes y sus formas.',
      },
      {
        title: '• Nivel intermedio — ',
        text:
          'preposiciones más complejas usadas habitualmente en el habla cotidiana.',
      },
      {
        title: '• Nivel avanzado — ',
        text:
          'formas menos frecuentes y más difíciles.',
      },
      {
        title: '• Todos los niveles — ',
        text:
          'práctica combinada con todas las preposiciones disponibles.',
      },
    ],

    sectionWhy:
      'POR QUÉ ES IMPORTANTE',

    whyStart:
      'Muchos verbos hebreos se usan con preposiciones específicas. Para hablar con naturalidad, es importante conocer no solo el verbo, sino también ',

    whyHighlight:
      'la forma correcta de la preposición con sufijo pronominal',

    whyEnd:
      '. La práctica regular ayuda a comprender el habla, construir frases correctas y utilizar los verbos con mayor seguridad.',

    tipTitle:
      '• Consejo: ',

    tip:
      'empieza con el nivel básico y utiliza los sufijos resaltados. Cuando reconozcas fácilmente las formas, oculta la transliteración y después desactiva el resaltado.',

    final:
      '¡La práctica regular te ayudará a combinar correctamente los verbos y las preposiciones en hebreo!',

    close:
      'Cerrar',
  },

  pt: {
    title: 'SOBRE O EXERCÍCIO',

    introStart:
      'Este exercício complementa o estudo dos verbos e ajuda a dominar ',

    introHighlight:
      'as preposições com sufixos pronominais',

    introEnd:
      ' — formas frequentemente usadas com os verbos que substituem expressões como “comigo”, “para ti”, “na casa dele” ou “como nós”.',

    sectionHow:
      'COMO REALIZAR O EXERCÍCIO',

    instructionStart:
      'Escolha a direção da tradução e selecione ',

    instructionHighlight:
      'a forma correta da preposição',

    instructionEnd:
      '. Na direção hebraico → tradução, a pronúncia é reproduzida automaticamente. Depois da resposta, pode ouvir novamente a forma correta.',

    sectionHints:
      'DICAS',

    hints:
      'O botão na parte superior permite alternar entre três modos: transliteração com sufixos pronominais destacados, apenas sufixos destacados ou nenhuma ajuda.',

    sectionExamples:
      'EXEMPLOS',

    examples: [
      {
        hebrew: 'איתי',
        translit: 'iti',
        translation: 'comigo',
      },
      {
        hebrew: 'בשבילה',
        translit: 'bishvila',
        translation: 'para ela',
      },
      {
        hebrew: 'אצלו',
        translit: 'etslo',
        translation: 'na casa dele / com ele',
      },
      {
        hebrew: 'כמונו',
        translit: 'kamonu',
        translation: 'como nós',
      },
    ],

    sectionLevels:
      'NÍVEIS DE DIFICULDADE',

    levels: [
      {
        title: '• Nível básico — ',
        text:
          'as preposições mais frequentes e as suas formas.',
      },
      {
        title: '• Nível intermédio — ',
        text:
          'preposições mais complexas usadas frequentemente na fala quotidiana.',
      },
      {
        title: '• Nível avançado — ',
        text:
          'formas menos frequentes e mais difíceis.',
      },
      {
        title: '• Todos os níveis — ',
        text:
          'prática combinada com todas as preposições disponíveis.',
      },
    ],

    sectionWhy:
      'POR QUE É IMPORTANTE',

    whyStart:
      'Muitos verbos hebraicos são usados com preposições específicas. Para falar naturalmente, é importante conhecer não apenas o verbo, mas também ',

    whyHighlight:
      'a forma correta da preposição com sufixo pronominal',

    whyEnd:
      '. A prática regular ajuda a compreender a fala, construir frases corretas e utilizar os verbos com mais confiança.',

    tipTitle:
      '• Dica: ',

    tip:
      'comece pelo nível básico e utilize os sufixos destacados. Quando reconhecer facilmente as formas, oculte a transliteração e depois desative o destaque.',

    final:
      'A prática regular ajudará a combinar corretamente os verbos e as preposições em hebraico!',

    close:
      'Fechar',
  },

  ar: {
    title: 'حول التمرين',

    introStart:
      'يكمل هذا التمرين دراسة الأفعال ويساعدك على إتقان ',

    introHighlight:
      'حروف الجر المتصلة بلواحق ضميرية',

    introEnd:
      '، وهي صيغ تُستخدم كثيرًا مع الأفعال وتستبدل تعبيرات مثل «معي» و«من أجلك» و«عنده» و«مثلنا».',

    sectionHow:
      'كيفية تنفيذ التمرين',

    instructionStart:
      'اختر اتجاه الترجمة، ثم حدد ',

    instructionHighlight:
      'الصيغة الصحيحة لحرف الجر',

    instructionEnd:
      '. في اتجاه العبرية ← الترجمة، يتم تشغيل النطق تلقائيًا. وبعد الإجابة يمكنك الاستماع إلى الصيغة الصحيحة مرة أخرى.',

    sectionHints:
      'التلميحات',

    hints:
      'يتيح الزر الموجود أعلى الشاشة التبديل بين ثلاثة أوضاع: الكتابة الصوتية مع تمييز اللواحق الضميرية، أو تمييز اللواحق فقط، أو إخفاء جميع التلميحات.',

    sectionExamples:
      'أمثلة',

    examples: [
      {
        hebrew: 'איתי',
        translit: 'iti',
        translation: 'معي',
      },
      {
        hebrew: 'בשבילה',
        translit: 'bishvila',
        translation: 'من أجلها',
      },
      {
        hebrew: 'אצלו',
        translit: 'etslo',
        translation: 'عنده',
      },
      {
        hebrew: 'כמונו',
        translit: 'kamonu',
        translation: 'مثلنا',
      },
    ],

    sectionLevels:
      'مستويات الصعوبة',

    levels: [
      {
        title: '• المستوى الأساسي — ',
        text:
          'حروف الجر الأكثر استخدامًا وصيغها.',
      },
      {
        title: '• المستوى المتوسط — ',
        text:
          'حروف جر أكثر تعقيدًا تستخدم كثيرًا في الحديث اليومي.',
      },
      {
        title: '• المستوى المتقدم — ',
        text:
          'صيغ أقل شيوعًا وأكثر صعوبة.',
      },
      {
        title: '• جميع المستويات — ',
        text:
          'تدريب مختلط على جميع حروف الجر المتاحة.',
      },
    ],

    sectionWhy:
      'لماذا هذا مهم؟',

    whyStart:
      'تُستخدم أفعال عبرية كثيرة مع حروف جر محددة. وللتحدث بصورة طبيعية، من المهم معرفة الفعل وكذلك ',

    whyHighlight:
      'الصيغة الصحيحة لحرف الجر مع اللاحقة الضميرية',

    whyEnd:
      '. يساعد التدريب المنتظم على فهم الكلام، وبناء عبارات صحيحة، واستخدام الأفعال بثقة أكبر.',

    tipTitle:
      '• نصيحة: ',

    tip:
      'ابدأ بالمستوى الأساسي واستخدم تمييز اللواحق. وعندما تصبح الصيغ مألوفة، أخفِ الكتابة الصوتية ثم أوقف التمييز.',

    final:
      'سيساعدك التدريب المنتظم على الجمع الصحيح بين الأفعال وحروف الجر في العبرية!',

    close:
      'إغلاق',
  },

  am: {
    title:
      'ስለ ልምምዱ',

    introStart:
      'ይህ ልምምድ የግሶችን ትምህርት ያጠናክራል እና ',

    introHighlight:
      'ከተውላጠ ስም ቅጥያዎች ጋር የሚጣመሩ መስተዋድዶችን',

    introEnd:
      ' ለመማር ይረዳል። እነዚህ ቅርጾች ከግሶች ጋር ብዙ ጊዜ ይጠቀማሉ፣ እንደ “ከእኔ ጋር”፣ “ለአንተ”፣ “እሱ ዘንድ” ወይም “እንደ እኛ” ያሉ አገላለጾችንም ይተካሉ።',

    sectionHow:
      'ልምምዱን እንዴት ማከናወን እንደሚቻል',

    instructionStart:
      'የትርጉም አቅጣጫውን ይምረጡ፣ ከዚያም ',

    instructionHighlight:
      'ትክክለኛውን የመስተዋድድ ቅርጽ',

    instructionEnd:
      ' ይምረጡ። ከዕብራይስጥ ወደ ትርጉም በሚለው አቅጣጫ ድምፁ በራስ-ሰር ይጫወታል። ከመልሱ በኋላ ትክክለኛውን ቅርጽ እንደገና ማዳመጥ ይችላሉ።',

    sectionHints:
      'እገዛዎች',

    hints:
      'ከላይ ያለው ቁልፍ ሦስት የማሳያ ሁኔታዎችን ይቀያይራል፦ ትራንስሊተሬሽን ከተለዩ ቅጥያዎች ጋር፣ ቅጥያዎች ብቻ ወይም ያለ እገዛ።',

    sectionExamples:
      'ምሳሌዎች',

    examples: [
      {
        hebrew: 'איתי',
        translit: 'iti',
        translation: 'ከእኔ ጋር',
      },
      {
        hebrew: 'בשבילה',
        translit: 'bishvila',
        translation: 'ለእሷ',
      },
      {
        hebrew: 'אצלו',
        translit: 'etslo',
        translation: 'እሱ ዘንድ',
      },
      {
        hebrew: 'כמונו',
        translit: 'kamonu',
        translation: 'እንደ እኛ',
      },
    ],

    sectionLevels:
      'የችግኝነት ደረጃዎች',

    levels: [
      {
        title: '• መሠረታዊ ደረጃ — ',
        text:
          'ብዙ ጊዜ የሚጠቀሙባቸው መስተዋድዶችና ቅርጾቻቸው።',
      },
      {
        title: '• መካከለኛ ደረጃ — ',
        text:
          'በዕለታዊ ንግግር ውስጥ የሚጠቀሙባቸው ውስብስብ መስተዋድዶች።',
      },
      {
        title: '• ከፍተኛ ደረጃ — ',
        text:
          'ብዙም ያልተለመዱና የበለጠ አስቸጋሪ ቅርጾች።',
      },
      {
        title: '• ሁሉም ደረጃዎች — ',
        text:
          'ሁሉንም የሚገኙ መስተዋድዶች ያካተተ የተቀላቀለ ልምምድ።',
      },
    ],

    sectionWhy:
      'ይህ ለምን አስፈላጊ ነው?',

    whyStart:
      'ብዙ የዕብራይስጥ ግሶች ከተወሰኑ መስተዋድዶች ጋር ይጠቀማሉ። በተፈጥሯዊ ሁኔታ ለመናገር ግሱን ብቻ ሳይሆን ',

    whyHighlight:
      'ትክክለኛውን የመስተዋድድ ቅርጽ ከተውላጠ ስም ቅጥያ ጋር',

    whyEnd:
      ' ማወቅ ያስፈልጋል። ተደጋጋሚ ልምምድ ንግግርን ለመረዳት፣ ትክክለኛ ሐረጎችን ለመገንባትና ግሶችን በድፍረት ለመጠቀም ይረዳል።',

    tipTitle:
      '• ምክር፦ ',

    tip:
      'ከመሠረታዊው ደረጃ ይጀምሩና የቅጥያዎችን ማድመቂያ ይጠቀሙ። ቅርጾቹን በቀላሉ ማወቅ ሲጀምሩ ትራንስሊተሬሽኑን፣ ከዚያም ማድመቂያውን ያጥፉ።',

    final:
      'ተደጋጋሚ ልምምድ ግሶችንና መስተዋድዶችን በትክክል ለማጣመር ይረዳዎታል!',

    close:
      'ዝጋ',
  },
};

const PrepositionDescriptionModal = ({
  visible,
  onToggle,
  onClose,
  language,
}) => {
  const fadeAnim =
    useRef(
      new Animated.Value(0)
    ).current;

  const slideAnim =
    useRef(
      new Animated.Value(30)
    ).current;

  const normalizedLanguage =
    normalizeLanguage(language);

  const content =
    CONTENT[normalizedLanguage] ||
    CONTENT.en;

  const isRTL =
    normalizedLanguage === 'ar';

  const closeModal =
    onToggle || onClose;

  const directionStyles =
    useMemo(
      () => ({
        textAlign:
          isRTL ? 'right' : 'left',

        writingDirection:
          isRTL ? 'rtl' : 'ltr',
      }),
      [isRTL]
    );

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);

      Animated.parallel([
        Animated.timing(
          fadeAnim,
          {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }
        ),

        Animated.timing(
          slideAnim,
          {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }
        ),
      ]).start();

      return;
    }

    fadeAnim.setValue(0);
    slideAnim.setValue(30);
  }, [
    visible,
    fadeAnim,
    slideAnim,
  ]);

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
                  translateY:
                    slideAnim,
                },
              ],
            },
          ]}
        >
          <View
            style={
              styles.contentWrapper
            }
          >
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={
                styles.scrollViewContent
              }
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={
                  styles.logoContainer
                }
              >
                <Image
                  source={require('./VERBIFY.png')}
                  style={styles.logo}
                />
              </View>

              <Text
                style={
                  styles.modalTitle
                }
              >
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
                  {
                    content.introHighlight
                  }
                </Text>

                {content.introEnd}
              </Text>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                {content.sectionHow}
              </Text>

              <Text
                style={[
                  styles.modalText,
                  directionStyles,
                ]}
              >
                {
                  content.instructionStart
                }

                <Text
                  style={[
                    styles.bold,
                    styles.highlightMain,
                  ]}
                >
                  {
                    content.instructionHighlight
                  }
                </Text>

                {
                  content.instructionEnd
                }
              </Text>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                {
                  content.sectionExamples
                }
              </Text>

              <View
                style={
                  styles.examplesContainer
                }
              >
                {content.examples.map(
                  (
                    example,
                    index
                  ) => (
                    <View
                      key={
                        `${example.hebrew}-${index}`
                      }
                      style={
                        styles.exampleRow
                      }
                    >
                      <View
                        style={
                          styles.exampleHebrewBlock
                        }
                      >
                        <Text
                          style={
                            styles.exampleHebrew
                          }
                        >
                          {
                            example.hebrew
                          }
                        </Text>

                        <Text
                          style={
                            styles.exampleTranslit
                          }
                        >
                          {
                            example.translit
                          }
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.exampleArrow,
                          isRTL &&
                            styles.exampleArrowRTL,
                        ]}
                      >
                        ←
                      </Text>

                      <Text
                        style={[
                          styles.exampleTranslation,
                          directionStyles,
                        ]}
                      >
                        {
                          example.translation
                        }
                      </Text>
                    </View>
                  )
                )}
              </View>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                {
                  content.sectionLevels
                }
              </Text>

              {content.levels.map(
                (
                  level,
                  index
                ) => (
                  <Text
                    key={index}
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
                )
              )}

              <Text
                style={
                  styles.sectionTitle
                }
              >
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
                  {
                    content.whyHighlight
                  }
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

              <Text
                style={
                  styles.finalText
                }
              >
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

            <View
              style={
                styles.buttonWrapper
              }
            >
              <TouchableOpacity
                style={styles.button}
                onPress={closeModal}
                activeOpacity={0.75}
              >
                <Text
                  style={
                    styles.textStyle
                  }
                >
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

const styles =
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    modalView: {
      width: '90%',
      height:
        SCREEN_HEIGHT * 0.85,
      backgroundColor: '#FFFDEF',
      borderRadius: 12,
      overflow: 'hidden',
    },

    contentWrapper: {
      flex: 1,
      justifyContent:
        'space-between',
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
      fontSize: 19,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 16,
      color: '#1C3F60',
    },

    sectionTitle: {
      fontSize: 17,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 14,
      marginBottom: 10,
      color: '#1C3F60',
    },

    modalText: {
      fontSize: 16,
      lineHeight: 23,
      textAlign: 'left',
      marginBottom: 10,
      color: '#333652',
    },

    listItem: {
      fontSize: 16,
      lineHeight: 22,
      textAlign: 'left',
      marginBottom: 8,
      color: '#333652',
    },

    examplesContainer: {
      width: '100%',
      borderRadius: 10,
      backgroundColor:
        'rgba(131,163,205,0.13)',
      paddingVertical: 7,
      paddingHorizontal: 10,
      marginBottom: 4,
    },

    exampleRow: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor:
        'rgba(51,54,82,0.12)',
    },

    exampleHebrewBlock: {
      width: 130,
      alignItems: 'center',
      justifyContent: 'center',
    },

    exampleHebrew: {
      color: '#1C3F60',
      fontSize: 23,
      fontWeight: 'bold',
      textAlign: 'center',
      writingDirection: 'rtl',
    },

    exampleTranslit: {
      marginTop: 1,
      color: '#C8502D',
      fontSize: 14,
      fontWeight: 'bold',
      fontStyle: 'italic',
      textAlign: 'center',
    },

    exampleArrow: {
      width: 26,
      color: '#C8502D',
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },

    exampleArrowRTL: {
      transform: [
        {
          scaleX: -1,
        },
      ],
    },

    exampleTranslation: {
      flex: 1,
      color: '#333652',
      fontSize: 17,
      lineHeight: 20,
      marginLeft: 20,
    },

    tipText: {
      fontSize: 16,
      lineHeight: 22,
      textAlign: 'left',
      marginTop: 8,
      marginBottom: 10,
      color: '#333652',
    },

    finalText: {
      fontSize: 16,
      lineHeight: 23,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 15,
      color: '#333652',
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
      backgroundColor: '#2D4769',
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      width: '44%',
      minHeight: 48,
      borderRadius: 8,
      marginTop: 10,
      marginBottom: 22,
    },

    textStyle: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
  });

export default PrepositionDescriptionModal;