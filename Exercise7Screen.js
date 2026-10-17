import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Image, BackHandler, Platform } from 'react-native';

import ProgressBar from './ProgressBar';

import { Animated } from 'react-native';

import { Audio } from 'expo-av';

import { useNavigation, useFocusEffect } from '@react-navigation/native';

import TaskDescriptionModal from './TaskDescriptionModal4';

import ExerciseCountStartScreen from './ExerciseCountStartScreen';

import { updateStatistics, getStatistics } from './stat';

import LottieView from 'lottie-react-native';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import AsyncStorage from '@react-native-async-storage/async-storage';

import * as FirebaseAnalytics from './src/analytics/FirebaseAnalytics';

const COUNTS = [6, 12, 18, 24];

const DEFAULT_COUNT = 18;

const LANGUAGE_ALIASES = {

  ru: 'ru', russian: 'ru', rus: 'ru', 'ru-ru': 'ru',

  en: 'en', english: 'en', eng: 'en', 'en-us': 'en', 'en-gb': 'en',

  fr: 'fr', french: 'fr', fra: 'fr', 'fr-fr': 'fr',

  es: 'es', spanish: 'es', spa: 'es', 'es-es': 'es',

  pt: 'pt', portuguese: 'pt', por: 'pt', 'pt-pt': 'pt', 'pt-br': 'pt',

  ar: 'ar', arabic: 'ar', arab: 'ar', ara: 'ar', 'ar-il': 'ar',

  am: 'am', amharic: 'am', amh: 'am', 'am-et': 'am',

};

const UI = {

  ru: { correct: 'ВЕРНО', wrong: 'НЕВЕРНО', title: 'СПРЯГАЕМ ГЛАГОЛЫ', showInfinitive: 'ПОКАЗАТЬ ИНФИНИТИВ', menu: 'Menu', stat: 'exercise4', analytics: 'exercise7ru' },

  en: { correct: 'CORRECT', wrong: 'INCORRECT', title: 'CONJUGATE VERBS', showInfinitive: 'SHOW INFINITIVE', menu: 'MenuEn', stat: 'exercise4En', analytics: 'exercise7en' },

  fr: { correct: 'CORRECT', wrong: 'INCORRECT', title: 'CONJUGUEZ LES VERBES', showInfinitive: "AFFICHER L’INFINITIF", menu: 'MenuFr', stat: 'exercise4Fr', analytics: 'exercise7fr' },

  es: { correct: 'CORRECTO', wrong: 'INCORRECTO', title: 'CONJUGA LOS VERBOS', showInfinitive: 'MOSTRAR INFINITIVO', menu: 'MenuEs', stat: 'exercise4Es', analytics: 'exercise7es' },

  pt: { correct: 'CORRETO', wrong: 'INCORRETO', title: 'CONJUGUE OS VERBOS', showInfinitive: 'MOSTRAR INFINITIVO', menu: 'MenuPt', stat: 'exercise4Pt', analytics: 'exercise7pt' },

  ar: { correct: 'صحيح', wrong: 'غير صحيح', title: 'تصريف الأفعال', showInfinitive: 'إظهار صيغة المصدر', menu: 'MenuAr', stat: 'exercise4Ar', analytics: 'exercise7ar' },

  am: { correct: 'ትክክል', wrong: 'ትክክል አይደለም', title: 'ግሶችን ይግለጹ', showInfinitive: 'ኢንፊኒቲቭ አሳይ', menu: 'MenuAm', stat: 'exercise4Am', analytics: 'exercise7am' },

};

const GRADES = {

  ru: [

    'Исключительно! Безупречно! Ты не сделал ни единой ошибки!',

    'Великолепно! Почти идеально, продолжай в том же духе!',

    'Отлично! Ты очень хорошо справляешься!',

    'Хорошо! Ты неплохо усвоил материал!',

    'Достаточно хорошо! Есть стабильный прогресс!',

    'Неплохо! Но есть куда стремиться.',

    'Удовлетворительно! Старайся и всё получится!',

    'Ты начинаешь улавливать главное, продолжай в том же духе!',

    'Попробуй изменить стратегию обучения, это может помочь!',

    'Тяжело, но не сдавайся! Продолжай практиковаться.',

    'Требуется серьезная работа! Важно не унывать и продолжать учиться.',

  ],

  en: [

    'Exceptional! Flawless! You didn’t make a single mistake!',

    'Excellent! Almost perfect, keep up the great work!',

    'Great! You are doing very well!',

    'Good! You’ve learned the material pretty well!',

    'Fairly good! There is steady progress!',

    'Not bad! But there’s room for improvement.',

    'Satisfactory! Keep working and you’ll succeed!',

    'You’re starting to get the hang of it, keep it up!',

    'Try changing your learning strategy, it might help!',

    'It’s tough, but don’t give up! Keep practicing.',

    'Serious work is needed! It’s important not to give up and keep learning.',

  ],

  fr: [

    "Exceptionnel ! Parfait ! Vous n'avez fait aucune erreur !",

    'Excellent ! Presque parfait, continuez comme ça !',

    'Très bien ! Vous vous débrouillez très bien !',

    'Bien ! Vous avez bien appris la matière !',

    'Assez bien ! Il y a un progrès constant !',

    "Pas mal ! Mais il y a encore de la place pour l'amélioration.",

    'Satisfaisant ! Continuez à travailler et vous réussirez !',

    'Vous commencez à comprendre, continuez comme ça !',

    "Essayez de changer votre stratégie d'apprentissage, cela pourrait aider !",

    "C'est difficile, mais ne vous découragez pas ! Continuez à pratiquer.",

    'Un travail sérieux est nécessaire ! Il est important de continuer à apprendre.',

  ],

  es: [

    '¡Excepcional! ¡Perfecto! ¡No cometiste ni un solo error!',

    '¡Excelente! Casi perfecto, ¡sigue así!',

    '¡Genial! ¡Lo estás haciendo muy bien!',

    '¡Bien! Has aprendido el material bastante bien.',

    '¡Bastante bien! Hay un progreso constante.',

    'No está mal, pero hay margen de mejora.',

    '¡Satisfactorio! Sigue trabajando y tendrás éxito.',

    '¡Estás empezando a entenderlo, sigue así!',

    'Intenta cambiar tu estrategia de aprendizaje, ¡podría ayudar!',

    'Es difícil, pero no te rindas. ¡Sigue practicando!',

    'Hace falta más trabajo. Lo importante es seguir aprendiendo.',

  ],

  pt: [

    'Excepcional! Perfeito! Você não cometeu um único erro!',

    'Excelente! Quase perfeito, continue com o ótimo trabalho!',

    'Ótimo! Você está indo muito bem!',

    'Bom! Você aprendeu o material muito bem!',

    'Razoável! Há um progresso constante!',

    'Nada mal! Mas há espaço para melhorar.',

    'Satisfatório! Continue trabalhando e você terá sucesso!',

    'Você está começando a entender, continue assim!',

    'Tente mudar sua estratégia de aprendizado, isso pode ajudar!',

    'Está difícil, mas não desista! Continue praticando.',

    'É necessário mais trabalho. Continue aprendendo.',

  ],

  ar: [

    'ممتاز جدًا! أداء بلا أخطاء!',

    'رائع! قريب جدًا من الكمال، استمر!',

    'ممتاز! أنت تؤدي بشكل رائع!',

    'جيد! لقد أتقنت المادة بشكل جيد!',

    'جيد إلى حد كبير! هناك تقدم ثابت!',

    'ليس سيئًا! لكن ما زال هناك مجال للتحسن.',

    'مُرضٍ! واصل التدريب وستنجح!',

    'بدأت تفهم الفكرة، استمر!',

    'جرّب تغيير أسلوب التعلّم، فقد يساعدك ذلك!',

    'الأمر صعب، لكن لا تستسلم! واصل التدريب.',

    'تحتاج إلى مزيد من العمل. المهم أن تواصل التعلّم.',

  ],

  am: [

    'እጅግ አስደናቂ! ፍጹም ስኬት! ስህተት አላደረጉም!',

    'በጣም ጥሩ! ፍጹም ለመሆን ቀርቧል — ይቀጥሉ!',

    'እጅግ ጥሩ! በጣም ጥሩ እየሰሩ ነው!',

    'ጥሩ! ትምህርቱን በጥሩ ሁኔታ ተምረዋል!',

    'መልካም! የተረጋጋ እድገት አለ!',

    'መጥፎ አይደለም! ግን ለማሻሻል ቦታ አለ።',

    'በመጠኑ ጥሩ! ልምምድዎን ይቀጥሉ!',

    'ዋናውን ሀሳብ መረዳት ጀምረዋል — ይቀጥሉ!',

    'የመማር ዘዴዎን ትንሽ መቀየር ሊረዳ ይችላል!',

    'ከባድ ነው፣ ግን አይተዉ! ልምምድዎን ይቀጥሉ!',

    'ተጨማሪ ልምምድ ያስፈልጋል። መማርዎን ይቀጥሉ።',

  ],

};

const normalizeLanguage = value => {

  const key = String(value || 'ru').trim().toLowerCase();

  return LANGUAGE_ALIASES[key] || 'ru';

};

const getGrade = (language, percentage) => {

  const thresholds = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];

  const grades = GRADES[language] || GRADES.ru;

  const index = thresholds.findIndex(value => percentage >= value);

  return grades[index < 0 ? grades.length - 1 : index];

};

const getFormText = (item, language) => {

  if (!item) return '';

  switch (language) {

    case 'en': return item.entext || item.engtext || '';

    case 'fr': return item.frtext || '';

    case 'es': return item.estext || '';

    case 'pt': return item.pttext || '';

    case 'ar': return item.artext || '';

    case 'am': return item.amtext || '';

    default: return item.russiantext || '';

  }

};

const getInfinitiveTranslation = (item, language) => {

  if (!item) return '';

  switch (language) {

    case 'en': return item.english || '';

    case 'fr': return item.french || '';

    case 'es': return item.spanish || '';

    case 'pt': return item.portu || '';

    case 'ar': return item.arabic || '';

    case 'am': return item.amharic || '';

    default: return item.russian || '';

  }

};

const moduleDefault = mod => mod?.default || mod;

const getLanguageComponents = language => {

  switch (language) {

    case 'en': return { Completion: moduleDefault(require('./CompletionMessageEn')), Exit: moduleDefault(require('./ExitConfirmationModalEn')), Stat: moduleDefault(require('./StatModal4En')) };

    case 'fr': return { Completion: moduleDefault(require('./CompletionMessageFr')), Exit: moduleDefault(require('./ExitConfirmationModalFr')), Stat: moduleDefault(require('./StatModal4Fr')) };

    case 'es': return { Completion: moduleDefault(require('./CompletionMessageEs')), Exit: moduleDefault(require('./ExitConfirmationModalEs')), Stat: moduleDefault(require('./StatModal4Es')) };

    case 'pt': return { Completion: moduleDefault(require('./CompletionMessagePt')), Exit: moduleDefault(require('./ExitConfirmationModalPt')), Stat: moduleDefault(require('./StatModal4Pt')) };

    case 'ar': return { Completion: moduleDefault(require('./CompletionMessageAr')), Exit: moduleDefault(require('./ExitConfirmationModalAr')), Stat: moduleDefault(require('./StatModal4Ar')) };

    case 'am': return { Completion: moduleDefault(require('./CompletionMessageAm')), Exit: moduleDefault(require('./ExitConfirmationModalAm')), Stat: moduleDefault(require('./StatModal4Am')) };

    default: return { Completion: moduleDefault(require('./CompletionMessage')), Exit: moduleDefault(require('./ExitConfirmationModal')), Stat: moduleDefault(require('./StatModal4')) };

  }

};

let verbsDataCache = null;

let verbs1DataCache = null;

let soundsConjCache = null;

let soundsCache = null;

const getVerbsData = () => {

  if (!verbsDataCache) {

    const mod = require('./verbs6RU.json');

    verbsDataCache = mod?.default || mod;

  }

  return Array.isArray(verbsDataCache) ? verbsDataCache : [];

};

const getVerbs1Data = () => {

  if (!verbs1DataCache) {

    const mod = require('./verbs1.json');

    verbs1DataCache = mod?.default || mod;

  }

  return Array.isArray(verbs1DataCache) ? verbs1DataCache : [];

};

const getSoundsConj = () => {

  if (!soundsConjCache) soundsConjCache = moduleDefault(require('./soundconj'));

  return soundsConjCache || {};

};

const getSounds = () => {

  if (!soundsCache) soundsCache = moduleDefault(require('./Soundss'));

  return soundsCache || {};

};

const FONT_REG = 'mt-regular';

const FONT_MED = 'mt-medium';

const FONT_BOLD = 'mt-bold';

const FONT_SEMIBOLD = 'mt-semibold';

const HEBREW_FONT = Platform.OS === 'android' ? 'mt-semibold' : 'mt-bold';

const HEBREW_FS = Platform.OS === 'android' ? 18 : 22;

const Exercise7Screen = ({ route }) => {

  const navigation = useNavigation();

  const language = normalizeLanguage(route?.params?.language);

  const copy = UI[language];

  const rtl = language === 'ar';

  const [startVisible, setStartVisible] = useState(true);
  // Согласуем цвет нижней Safe Area с экраном настроек/задания.
  useEffect(() => {
    navigation.setParams({ bottomSafeAreaStage: startVisible ? 'settings' : 'task' });
  }, [navigation, startVisible]);

  // Скрываем ИИ только на стартовом экране; в самом упражнении показываем.
  useEffect(() => {
    navigation.setOptions({ headerHideAI: startVisible });
  }, [navigation, startVisible]);


  const [exerciseCount, setExerciseCount] = useState(DEFAULT_COUNT);

  const [verbsData, setVerbsData] = useState([]);

  const [verbs1Data, setVerbs1Data] = useState([]);

  const localizedComponents = useMemo(

    () => (startVisible ? null : getLanguageComponents(language)),

    [startVisible, language]

  );

  const Completion = localizedComponents?.Completion;

  const Exit = localizedComponents?.Exit;

  const Stat = localizedComponents?.Stat;

  const allowLeaveRef = useRef(false);

  const exercise4LoggedRef=useRef(false);

useFocusEffect(

useCallback(()=>{

if(exercise4LoggedRef.current)return;

exercise4LoggedRef.current=true;

FirebaseAnalytics.logFirebaseEvent(copy.analytics,{

screen:copy.analytics

});

return()=>{

exercise4LoggedRef.current=false;

};

},[copy.analytics])

);

  const [pairs, setPairs] = useState([]);

  const totalPairs = pairs.length;

  const [remainingPairs, setRemainingPairs] = useState(totalPairs);

  const [displayPairs, setDisplayPairs] = useState([]);

  const [selectedRussian, setSelectedRussian] = useState(null);

  const [selectedHebrew, setSelectedHebrew] = useState(null);

  const [correctAnswers, setCorrectAnswers] = useState(new Set());

  const [correctCount, setCorrectCount] = useState(0);

  const [incorrectCount, setIncorrectCount] = useState(0);

  const [hebrewActive, setHebrewActive] = useState(true);

  const [page, setPage] = useState(0);

  const [resolvedPairsCount, setResolvedPairsCount] = useState(0);

  const [progress, setProgress] = useState(0);

  const [totalExercises, setTotalExercises] = useState(0);

  const [exerciseCompleted, setExerciseCompleted] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [exitConfirmationVisible, setExitConfirmationVisible] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);

  /* ===================== ✅ 3-state translit ===================== */

  // 0 — translit1: highlight ON + translit ON

  // 1 — translit2: highlight ON + translit OFF

  // 2 — translit3: highlight OFF + translit OFF

  const [translitMode, setTranslitMode] = useState(0);

  const handleTranslitToggle = () => {

    setTranslitMode(prev => (prev === 0 ? 1 : prev === 1 ? 2 : 0));

  };

  const showTranslit = translitMode === 0;

  const highlightEnabled = translitMode !== 2;

  const [statistics, setStatistics] = useState(null);

  const [isStatModalVisible, setIsStatModalVisible] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);

  const [failureSound, setFailureSound] = useState(null);

  const [sound, setSound] = useState(null);

  const [correctSound, setCorrectSound] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const blockAnimation = useRef(new Animated.Value(-100)).current;

  const backgroundColorAnim = useRef(new Animated.Value(0)).current;

  const [isButtonActive, setIsButtonActive] = useState(false);

  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  const [completionMessageOpacity] = useState(new Animated.Value(0));

  const animationRef = useRef(null);

  const [isAnimationVisible, setIsAnimationVisible] = useState(false);

  const [currentVerb, setCurrentVerb] = useState({

    infinitive: '',

    russian: '',

    transliteration: ''

  });

  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);

  const [dontShowAgain4, setDontShowAgain4] = useState(false);

useEffect(() => {

  AsyncStorage.getItem('exercise4_description_hidden')

    .then(hidden => setDontShowAgain4(hidden === 'true'))

    .catch(() => {});

}, []);

  const handleToggleDontShowAgain4 = async () => {

    const newValue = !dontShowAgain4;

    setDontShowAgain4(newValue);

    await AsyncStorage.setItem('exercise4_description_hidden', newValue ? 'true' : '');

  };

  const shuffleArray = (array) => {

    let newArray = array.slice();

    for (let i = newArray.length - 1; i > 0; i--) {

      const j = Math.floor(Math.random() * (i + 1));

      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];

    }

    return newArray;

  };

  /* ===================== ✅ NIF'AL lookup cache (per infinitive) ===================== */

  const normalize = (s) => String(s || '').trim().toLowerCase();

  const normalizeBinyan = (s) => normalize(s).replace(/[\s’']/g, ''); // NIF'AL -> nifal

  const nifalByInfinitive = useMemo(() => {

    const map = new Map();

    if (!Array.isArray(verbs1Data)) return map;

    for (const v of verbs1Data) {

      const inf = String(v?.hebrewVerb || '').trim();

      if (!inf) continue;

      const b = normalizeBinyan(v?.binyan);

      map.set(inf, b === 'nifal');

    }

    return map;

  }, [verbs1Data]);

  const isNifalInfinitive = useCallback((inf) => {

    const key = String(inf || '').trim();

    return nifalByInfinitive.get(key) === true;

  }, [nifalByInfinitive]);

  /* ===================== ✅ Highlight helpers (как в Exercise6) ===================== */

  const PRESENT_SUFFIXES = ['ות', 'ים', 'ה', 'ת'];

  const yellow = (txt, key) => (

    <Text key={key} style={styles.prefixYellow}>

      {txt}

    </Text>

  );

  const green = (txt, key) => (

    <Text key={key} style={styles.suffixGreen}>

      {txt}

    </Text>

  );

  const renderWithColorRules = (word, { prefix = '', suffix = '' }) => {

    const w = String(word || '');

    if (!w) return '';

    let middle = w;

    let prefixPart = '';

    let suffixPart = '';

    if (prefix && middle.startsWith(prefix)) {

      prefixPart = prefix;

      middle = middle.slice(prefix.length);

    }

    if (suffix && middle.endsWith(suffix)) {

      suffixPart = suffix;

      middle = middle.slice(0, middle.length - suffix.length);

    }

    return (

      <>

        {prefixPart ? yellow(prefixPart, 'p') : null}

        {middle}

        {suffixPart ? green(suffixPart, 's') : null}

      </>

    );

  };

  const renderPresentVerbWord = (verbWord) => {

    const verb = String(verbWord || '');

    if (!verb) return '';

    let prefixNode = null;

    let restWord = verb;

    if (restWord.startsWith('מ')) {

      prefixNode = yellow('מ', 'm');

      restWord = restWord.slice(1);

    }

    let matchedSuffix = '';

    for (const suf of PRESENT_SUFFIXES) {

      if (restWord.endsWith(suf)) {

        matchedSuffix = suf;

        break;

      }

    }

    if (!matchedSuffix) {

      return (

        <>

          {prefixNode}

          {restWord}

        </>

      );

    }

    const base = restWord.slice(0, restWord.length - matchedSuffix.length);

    return (

      <>

        {prefixNode}

        {base}

        {green(matchedSuffix, 'suf')}

      </>

    );

  };

  const renderPastWithHitpaelPrefixAndSuffix = (word, suffix) => {

    const w = String(word || '');

    const prefix = w.startsWith('ה') ? 'ה' : '';

    return renderWithColorRules(w, { prefix, suffix: suffix || '' });

  };

  // ✅ per-row render: needs infinitive + formIndex

  const renderHebrewText = (hebrewtext, formIndex, infinitive) => {

    const raw = String(hebrewtext || '');

    if (!highlightEnabled) return raw;

    const pos = Number(formIndex || 0);

    if (!pos) return raw;

    const isBeVerb = String(infinitive || '') === 'להיות';

    const virtualPos = isBeVerb ? pos + 12 : pos;

    const applyNifalNun = isNifalInfinitive(infinitive) && virtualPos >= 1 && virtualPos <= 24;

    const withOptionalNifalNun = (word, renderFn) => {

      const w = String(word || '');

      if (!w) return '';

      if (applyNifalNun && w.startsWith('נ')) {

        const rest = w.slice(1);

        return (

          <>

            {yellow('נ', 'nifal-nun')}

            {renderFn ? renderFn(rest) : rest}

          </>

        );

      }

      return renderFn ? renderFn(w) : w;

    };

    const applyToVerbWord = (text, renderWordFn) => {

      const parts = String(text || '').split(' ').filter(Boolean);

      if (parts.length <= 1) return renderWordFn(parts[0] || '');

      const verb = parts[parts.length - 1];

      const before = parts.slice(0, -1).join(' ');

      return (

        <>

          {before}

          {' '}

          {renderWordFn(verb)}

        </>

      );

    };

    // 1–12 настоящее

    if (!isBeVerb && virtualPos >= 1 && virtualPos <= 12) {

      const parts = raw.split(' ');

      if (parts.length < 2) {

        return withOptionalNifalNun(parts[0] || '', (rest) => renderPresentVerbWord(rest));

      }

      const first = parts[0];

      const verb = parts[1];

      const tail = parts.slice(2).join(' ');

      return (

        <>

          {first}

          {' '}

          {withOptionalNifalNun(verb, (rest) => renderPresentVerbWord(rest))}

          {tail ? ` ${tail}` : ''}

        </>

      );

    }

    // 13–24 прошедшее + ✅ позиция 17

    if (virtualPos === 13 || virtualPos === 14)

      return applyToVerbWord(raw, (w) =>

        withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'תי'))

      );

    if (virtualPos === 15 || virtualPos === 16)

      return applyToVerbWord(raw, (w) =>

        withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'ת'))

      );

    // ✅ 17: без суффикса (иначе נ выпадет)

    if (virtualPos === 17)

      return applyToVerbWord(raw, (w) =>

        withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, ''))

      );

    if (virtualPos === 18)

      return applyToVerbWord(raw, (w) =>

        withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'ה'))

      );

    if (virtualPos === 19 || virtualPos === 20)

      return applyToVerbWord(raw, (w) =>

        withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'נו'))

      );

    if (virtualPos === 21)

      return applyToVerbWord(raw, (w) =>

        withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'תם'))

      );

    if (virtualPos === 22)

      return applyToVerbWord(raw, (w) =>

        withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'תן'))

      );

    if (virtualPos === 23 || virtualPos === 24)

      return applyToVerbWord(raw, (w) =>

        withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'ו'))

      );

    // будущее 25–36

    if (virtualPos === 25 || virtualPos === 26)

      return applyToVerbWord(raw, w => renderWithColorRules(w, { prefix: 'א' }));

    if (virtualPos === 27)

      return applyToVerbWord(raw, w => renderWithColorRules(w, { prefix: 'ת' }));

    if (virtualPos === 28)

      return applyToVerbWord(raw, w => renderWithColorRules(w, { prefix: 'ת', suffix: 'י' }));

    if (virtualPos === 29)

      return applyToVerbWord(raw, w => renderWithColorRules(w, { prefix: 'י' }));

    if (virtualPos === 30)

      return applyToVerbWord(raw, w => renderWithColorRules(w, { prefix: 'ת' }));

    if (virtualPos === 31 || virtualPos === 32)

      return applyToVerbWord(raw, w => renderWithColorRules(w, { prefix: 'נ' }));

    if (virtualPos === 33 || virtualPos === 34)

      return applyToVerbWord(raw, w => renderWithColorRules(w, { prefix: 'ת', suffix: 'ו' }));

    if (virtualPos === 35 || virtualPos === 36)

      return applyToVerbWord(raw, w => renderWithColorRules(w, { prefix: 'י', suffix: 'ו' }));

    return raw;

  };

  /* ===================== Mix hebrew side (keep formIndex with hebrewtext) ===================== */

  useEffect(() => {

    const start = page * 6;

    const end = start + 6;

    const currentPairs = pairs.slice(start, end);

    const hebrewTexts = shuffleArray(

      currentPairs.map(pair => ({

        text: pair.hebrewtext,

        translit: pair.translit,

        formIndex: pair.formIndex,

        infinitive: pair.infinitive,

      }))

    );

    const mixedPairs = currentPairs.map((pair, index) => ({

      ...pair,

      russiantext: pair.russiantext,

      hebrewtext: hebrewTexts[index].text,

      translit: hebrewTexts[index].translit,

      hebrewFormIndex: hebrewTexts[index].formIndex,

      hebrewInfinitive: hebrewTexts[index].infinitive,

      correct: pair.hebrewtext

    }));

    setDisplayPairs(mixedPairs);

    setHebrewActive(false);

    setSelectedRussian(null);

    setSelectedHebrew(null);

  }, [page, pairs]);

  useEffect(() => {

    if (resolvedPairsCount === 6 && !isUpdating && !exerciseCompleted) {

      setIsUpdating(true);

      setTimeout(() => {

        if ((page + 1) * 6 < pairs.length) setPage(prev => prev + 1);

        setCorrectAnswers(new Set());

        setSelectedRussian(null);

        setSelectedHebrew(null);

        setHebrewActive(false);

        setResolvedPairsCount(0);

        setIsUpdating(false);

        setIsButtonActive(false);

        setSelectedPair(null);

        setShowVerb(false);

      }, 1200);

    }

  }, [resolvedPairsCount, page, pairs.length, isUpdating, exerciseCompleted]);

  useEffect(() => {

    if (page === 0) setResolvedPairsCount(0);

  }, [page]);

  const [prevCorrectCount, setPrevCorrectCount] = useState(0);

  useEffect(() => {

    if (correctCount !== prevCorrectCount) {

      const progressPercentage = correctCount > 0 ? (correctCount / totalExercises) * 100 : 0;

      setProgress(progressPercentage);

      setPrevCorrectCount(correctCount);

    }

  }, [correctCount, prevCorrectCount, totalExercises]);

  useEffect(() => {

    if (currentIndex >= totalExercises && totalExercises > 0 && !exerciseCompleted) {

      setExerciseCompleted(true);

      handleExerciseCompletion();

    }

  }, [currentIndex, totalExercises, exerciseCompleted]);

  const handleAnswer = (isCorrect) => {

    if (isCorrect) setCorrectCount(prev => prev + 1);

    else setIncorrectCount(prev => prev + 1);

    setCurrentIndex(prevIndex => prevIndex + 1);

  };

  const changeBackgroundColor = (isCorrect) => {

    backgroundColorAnim.setValue(isCorrect ? 1 : 2);

    Animated.timing(backgroundColorAnim, {

      toValue: isCorrect ? 1 : 2,

      duration: 300,

      useNativeDriver: false,

    }).start(() => {

      setTimeout(() => {

        Animated.timing(backgroundColorAnim, {

          toValue: 0,

          duration: 100,

          useNativeDriver: false,

        }).start();

      }, 100);

    });

  };

  const backgroundColor = backgroundColorAnim.interpolate({

    inputRange: [0, 1, 2],

    outputRange: ['#83A3CD', '#AFFFCA', '#FFBCBC'],

  });

  const fadeIn = () => {

    Animated.timing(fadeAnim, {

      toValue: 1,

      duration: 800,

      useNativeDriver: true,

    }).start();

  };

  useEffect(() => {

    if (currentVerb.infinitive) fadeIn();

  }, [currentVerb]);

  useEffect(() => {

    if (!exerciseCompleted && displayPairs.length > 0) {

      blockAnimation.setValue(500);

      Animated.timing(blockAnimation, {

        toValue: 0,

        duration: 300,

        useNativeDriver: true,

      }).start();

    }

  }, [displayPairs, exerciseCompleted]);

  useEffect(() => {

    if (startVisible) return undefined;

    loadFailureSound();

    return () => {

      failureSound?.unloadAsync();

    };

  }, [startVisible]);

  useEffect(() => {

    return () => {

      correctSound?.unloadAsync();

    };

  }, [correctSound]);

  const playCorrectAnswerSound = async (audioKey) => {

    if (!soundEnabled) return;

    try {

      const audioFile = getSoundsConj()[audioKey];

      if (!audioFile) return;

      if (correctSound) await correctSound.unloadAsync();

      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);

      setCorrectSound(newSound);

      await newSound.playAsync();

      setIsAnimationVisible(true);

      animationRef.current?.play();

      setTimeout(() => {

        setIsAnimationVisible(false);

        animationRef.current?.reset();

      }, 1000);

    } catch (error) {

      console.error('Error loading sound:', error);

    }

  };

  const loadFailureSound = async () => {

    try {

      const { sound } = await Audio.Sound.createAsync(

        require('./assets/sounds/failure.mp3')

      );

      setFailureSound(sound);

    } catch (error) {

      console.error("Couldn't load failure sound:", error);

    }

  };

  const playAudio = async (audioFileName) => {

    try {

      const fileNameKey = audioFileName.replace('.mp3', '');

      const audioFile = getSounds()[fileNameKey];

      if (!audioFile) return;

      if (sound && typeof sound.unloadAsync === 'function') {

        await sound.unloadAsync();

      }

      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);

      setSound(newSound);

      await newSound.playAsync();

    } catch (error) {

      console.error('Error loading sound:', error);

    }

  };

  const playFailureSound = async () => {

    if (!soundEnabled) return;

    try {

      await failureSound.replayAsync();

    } catch (error) {

      console.error('Error playing the failure sound', error);

    }

  };

  const [selectedPair, setSelectedPair] = useState(null);

  const [showVerb, setShowVerb] = useState(false);

  const handleSelectRussian = (index) => {

    setSelectedRussian(index);

    setSelectedHebrew(null);

    setHebrewActive(true);

    setSelectedPair(displayPairs[index]);

    setShowVerb(false);

    setIsButtonActive(true);

  };

  const handleShowVerb = () => {

    setShowVerb(true);

    setIsButtonActive(true);

  };

  const handleSelectHebrew = (index) => {

    setSelectedHebrew(index);

    const selectedPairHeb = displayPairs[index];

    const isCorrect =

      selectedRussian !== null &&

      selectedPairHeb.hebrewtext === displayPairs[selectedRussian].correct;

    if (isCorrect) {

      handleAnswer(true);

      setCorrectAnswers(prev => new Set(prev).add(selectedRussian));

      setResolvedPairsCount(prev => prev + 1);

      setRemainingPairs(prev => prev - 1);

      playCorrectAnswerSound(displayPairs[selectedRussian].mp3);

      changeBackgroundColor(true);

    } else {

      setIncorrectCount(prev => prev + 1);

      playFailureSound();

      changeBackgroundColor(false);

    }

  };

  const getButtonStyle = (index, type) => {

    let style = [styles.button, type === 'hebrew' ? styles.hebrewButton : {}];

    if (correctAnswers.has(index) && type === 'russian') style.push(styles.deactivatedButton);

    if (type === 'russian' && index === selectedRussian) style.push(styles.selectedButton);

    if (type === 'hebrew' && index === selectedHebrew) {

      style.push(

        displayPairs[selectedRussian]?.correct === displayPairs[index].hebrewtext

          ? styles.correctButton

          : styles.wrongButton

      );

    }

    return style;

  };

  const getImageForGender = (gender) => {

    switch (gender) {

      case 'man': return require('./man1.png');

      case 'woman': return require('./woman1.png');

      case 'men': return require('./men1.png');

      case 'women': return require('./women1.png');

      default: return null;

    }

  };

  const toggleDescriptionModal = () => setDescriptionModalVisible(prev => !prev);

  const handleButton3Press = async () => {

    const exerciseId = copy.stat;

    try {

      const stats = await getStatistics(exerciseId);

      setStatistics(stats);

      setIsStatModalVisible(true);

    } catch (error) {

      console.error("Failed to fetch statistics:", error);

      setStatistics(null);

      setIsStatModalVisible(false);

    }

  };

  const handleSoundToggle = () => {

    setSoundEnabled(!soundEnabled);

    if (soundEnabled && sound) sound.setVolumeAsync(0);

    else if (!soundEnabled && sound) sound.setVolumeAsync(1);

  };

  const goToMenu = useCallback(() => {

    allowLeaveRef.current = true;

    navigation.reset({ index: 0, routes: [{ name: copy.menu }] });

  }, [navigation, copy.menu]);

  useFocusEffect(

    useCallback(() => {

      const onBackPress = () => {

        if (startVisible) {

          goToMenu();

          return true;

        }

        if (exitConfirmationVisible) return false;

        setExitConfirmationVisible(true);

        return true;

      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      const unsubscribe = navigation.addListener('beforeRemove', e => {

        if (allowLeaveRef.current) return;

        e.preventDefault();

        if (startVisible) {

          goToMenu();

          return;

        }

        if (!exitConfirmationVisible) setExitConfirmationVisible(true);

      });

      return () => {

        backHandler.remove();

        unsubscribe();

      };

    }, [exitConfirmationVisible, navigation, startVisible, goToMenu])

  );

  useEffect(() => {

    navigation.setOptions({ headerLeft: () => null });

  }, [navigation]);

  const handleCancelExit = () => setExitConfirmationVisible(false);

  const handleConfirmExit = goToMenu;

  const handleExerciseCompletion = async () => {

    const exerciseId = copy.stat;

    const progressPercent = (correctCount / (correctCount + incorrectCount)) * 100 || 0;

    const currentScore = parseFloat(progressPercent.toFixed(2));

    await updateStatistics(exerciseId, currentScore);

    setTimeout(() => {

      setShowCompletionMessage(true);

      Animated.timing(completionMessageOpacity, {

        toValue: 1,

        duration: 500,

        useNativeDriver: true,

      }).start();

    }, 1500);

  };

  const preparePairs = (source, count) => {

    const shuffledData = shuffleArray(source).slice(0, count);

    const withIndex = shuffledData.map(item => {

      const inf = item.infinitive;

      const allForms = source.filter(v => v.infinitive === inf);

      let idx = allForms.findIndex(v => String(v.mp3 || '') === String(item.mp3 || ''));

      if (idx < 0) {

        idx = allForms.findIndex(v =>

          String(v.hebrewtext || '').trim() === String(item.hebrewtext || '').trim() &&

          String(v.translit || '').trim() === String(item.translit || '').trim()

        );

      }

      return { ...item, formIndex: idx >= 0 ? idx + 1 : 0 };

    });

    setPage(0);

    setPairs(withIndex);

    setTotalExercises(withIndex.length);

    setRemainingPairs(withIndex.length);

    setCurrentVerb(withIndex[0] || { infinitive: '', transliteration: '' });

    setSelectedRussian(null);

    setSelectedHebrew(null);

    setSelectedPair(null);

    setShowVerb(false);

    setIsButtonActive(false);

  };

  const resetExercise = () => {

    setCorrectCount(0);

    setIncorrectCount(0);

    setProgress(0);

    setExerciseCompleted(false);

    setShowCompletionMessage(false);

    completionMessageOpacity.setValue(0);

    setCurrentIndex(0);

    setResolvedPairsCount(0);

    setCorrectAnswers(new Set());

    preparePairs(verbsData, exerciseCount);

  };

  const startExercise = count => {

    const source = getVerbsData();

    const v1 = getVerbs1Data();

    const selected = COUNTS.includes(Number(count)) ? Number(count) : DEFAULT_COUNT;

    setExerciseCount(selected);

    setVerbsData(source);

    setVerbs1Data(v1);

    setCorrectCount(0);

    setIncorrectCount(0);

    setProgress(0);

    setExerciseCompleted(false);

    setShowCompletionMessage(false);

    completionMessageOpacity.setValue(0);

    setCurrentIndex(0);

    setResolvedPairsCount(0);

    setCorrectAnswers(new Set());

    preparePairs(source, selected);

    setStartVisible(false);

  };

  const progressPercent = (correctCount / (correctCount + incorrectCount)) * 100 || 0;

  if (startVisible) {

    return (

      <ExerciseCountStartScreen

        exerciseNumber={7}

        language={language}

        defaultCount={DEFAULT_COUNT}

        allowedCounts={COUNTS}

        onCountChange={setExerciseCount}

        onStart={startExercise}

        onClose={goToMenu}

      />

    );

  }

  return (

    <ScrollView contentContainerStyle={styles.scrollViewContent}>

      <View style={styles.container}>

        <View style={styles.topBar}>

          <Animated.Image

            source={require('./VERBIFY.png')}

            style={[styles.logoImage, { opacity: fadeAnim }]}

          />

          <View style={styles.buttonContainer}>

            {isAnimationVisible && (

              <LottieView

                ref={animationRef}

                source={require('./assets/Animation - 1718430107767.json')}

                loop={false}

                style={styles.lottie}

              />

            )}

            <TouchableOpacity onPress={handleSoundToggle}>

              <Animated.Image

                source={soundEnabled ? require('./SoundOn.png') : require('./SoundOff.png')}

                style={[styles.buttonImage, { opacity: fadeAnim }]}

              />

            </TouchableOpacity>

            {/* ✅ translit 3-state */}

            <TouchableOpacity onPress={handleTranslitToggle}>

              <Animated.Image

                source={

                  translitMode === 0

                    ? require('./translit1.png')

                    : translitMode === 1

                    ? require('./translit2.png')

                    : require('./translit3.png')

                }

                style={[styles.buttonImage, { opacity: fadeAnim }]}

              />

            </TouchableOpacity>

            <TouchableOpacity onPress={handleButton3Press}>

              <Animated.Image

                source={require('./stat.png')}

                style={[styles.buttonImage, { opacity: fadeAnim }]}

              />

              <Stat

                visible={isStatModalVisible}

                onToggle={() => setIsStatModalVisible(false)}

                statistics={statistics}

              />

            </TouchableOpacity>

            <TouchableOpacity onPress={toggleDescriptionModal}>

              <Animated.Image

                source={require('./question.png')}

                style={[styles.buttonImage, { opacity: fadeAnim }]}

              />

              <TaskDescriptionModal

                visible={isDescriptionModalVisible}

                onToggle={toggleDescriptionModal}

                language={language}

                dontShowAgain4={dontShowAgain4}

                onToggleDontShowAgain={handleToggleDontShowAgain4}

              />

            </TouchableOpacity>

          </View>

        </View>

        <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>

          <View style={styles.textContainer}>

            <Text style={[styles.prtext, rtl && styles.rtlText]} maxFontSizeMultiplier={1.2}>{copy.correct}: {correctCount}</Text>

            <Text style={[styles.prtext, rtl && styles.rtlText]} maxFontSizeMultiplier={1.2}>{copy.wrong}: {incorrectCount}</Text>

          </View>

          <View style={styles.remainingTasksContainer}>

            <Text style={styles.remainingTasksText} maxFontSizeMultiplier={1.2}>

              {remainingPairs}

            </Text>

          </View>

          <Animated.View style={[styles.percentContainer, { backgroundColor, borderRadius: 10 }]}>

            <Text style={styles.percentText} maxFontSizeMultiplier={1.2}>

              {progressPercent.toFixed(2)}%

            </Text>

          </Animated.View>

        </Animated.View>

        <Animated.View style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}>

          <ProgressBar progress={progress} totalExercises={100} />

        </Animated.View>

        <Animated.Text style={[styles.title, rtl && styles.rtlText, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>

          {copy.title}

        </Animated.Text>

        <View style={styles.verbContainerWrapper}>

          {!isButtonActive ? (

            <View style={[styles.verbContainer, styles.inactiveButton]}>

              <Text style={styles.verbTextInactive} maxFontSizeMultiplier={1.2}>{copy.showInfinitive}</Text>

            </View>

          ) : (

            !showVerb ? (

              <TouchableOpacity

                style={[styles.verbContainer, styles.activeButton]}

                onPress={handleShowVerb}

                disabled={!isButtonActive}

              >

                <Text style={styles.verbTextActive} maxFontSizeMultiplier={1.2}>{copy.showInfinitive}</Text>

              </TouchableOpacity>

            ) : (

              <Animated.View style={[styles.verbContainer, { opacity: fadeAnim }]}>

                <Text style={styles.verbText} maxFontSizeMultiplier={1.2}> {selectedPair.infinitive}</Text>

                <Text style={styles.verbTextTr} maxFontSizeMultiplier={1.2}> {selectedPair.transliteration}</Text>

                <Text style={[styles.verbTextRu, rtl && styles.rtlText]} maxFontSizeMultiplier={1.2}> {getInfinitiveTranslation(selectedPair, language)}</Text>

                <TouchableOpacity onPress={() => playAudio(selectedPair.audioFile)} style={styles.audioButton}>

                  <Image source={require('./speaker3.png')} style={styles.audioIcon} />

                </TouchableOpacity>

              </Animated.View>

            )

          )}

        </View>

        <Animated.View style={{ transform: [{ translateY: blockAnimation }] }}>

          {displayPairs.map((pair, index) => (

            <View key={index} style={styles.row}>

              <TouchableOpacity

                style={getButtonStyle(index, 'russian')}

                onPress={() => handleSelectRussian(index)}

                disabled={correctAnswers.has(index)}

              >

                <Text

                  style={[

                    styles.text,

                    styles.russianText,

                    rtl && styles.rtlText,

                    correctAnswers.has(index) ? styles.deactivatedButtonText : {}

                  ]}

                  maxFontSizeMultiplier={1.2}

                >

                  {getFormText(pair, language)}

                </Text>

                {pair.gender && (

                  <Image source={getImageForGender(pair.gender)} style={styles.iconStyle} />

                )}

              </TouchableOpacity>

              <TouchableOpacity

                style={getButtonStyle(index, 'hebrew')}

                onPress={() => handleSelectHebrew(index)}

                disabled={!hebrewActive || correctAnswers.has(selectedRussian)}

              >

                <Text

                  style={[

                    // styles.text,

                    styles.hebrewText,

                    !showTranslit && styles.hebrewCenterWhenNoTranslit,

                  ]}

                  maxFontSizeMultiplier={1.2}

                >

                  {renderHebrewText(pair.hebrewtext, pair.hebrewFormIndex, pair.hebrewInfinitive)}

                </Text>

                <Text

                  style={[styles.translitText, !showTranslit && styles.translitHidden]}

                  maxFontSizeMultiplier={1.2}

                >

                  {pair.translit}

                </Text>

              </TouchableOpacity>

            </View>

          ))}

        </Animated.View>

        {exerciseCompleted && showCompletionMessage && (

          <Animated.View style={[styles.completionMessageContainer, { opacity: completionMessageOpacity }]}>

            <Completion

              handleOK={handleExerciseCompletion}

              navigateToMenu={goToMenu}

              correctAnswers={correctCount}

              incorrectAnswers={incorrectCount}

              correctAnswersPercentage={progressPercent.toFixed(2)}

              grade={getGrade(language, progressPercent)}

              restartTask={resetExercise}

            />

          </Animated.View>

        )}

        <Exit

          visible={exitConfirmationVisible}

          onCancel={handleCancelExit}

          onConfirm={handleConfirmExit}

        />

      </View>

    </ScrollView>

  );

};

const styles = StyleSheet.create({

  scrollViewContent: {

    flexGrow: 1,

    justifyContent: 'center',

    alignItems: 'center',

  },

container: { flex: 1, justifyContent: 'center', alignItems: 'center',

paddingHorizontal: 10,

paddingBottom: 5,

paddingTop: 0,   // ← важно

backgroundColor: '#AFC1D0', height: '100%', width: '100%' },

  completionMessageContainer: {

    position: 'absolute',

    top: 0, bottom: 0, left: 0, right: 0,

    justifyContent: 'center',

    alignItems: 'center',

  },

  topBar: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    width: '100%',

    paddingTop: wp('1%'),

  },

  logoImage:{

  width:74,

  height:74,

  marginLeft:8

},

  lottie: { width: 36, height: 36 },

  buttonContainer: { flexDirection: 'row', marginRight: 10, justifyContent: 'center' },

  buttonImage:{

  width:38,

  height:38,

  marginLeft:8

},

  progressContainer: {

    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',

    width: '100%',

    height: 50,

    backgroundColor: '#6C8EBB',

    borderRadius: 10,

    marginBottom: 10,

    shadowColor: "#000",

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.25,

    shadowRadius: 3.84,

    elevation: 5

  },

  textContainer: { flex: 1, justifyContent: 'center', width: '50%' },

  prtext: { fontSize: 12, color: 'white', textAlign: 'left', marginLeft: 15 },

  percentContainer: { alignItems: 'center', marginRight: 10 },

  percentText: {

    fontSize: 20,

    color: 'white',

    fontWeight: 'bold',

    textAlign: 'center',

    borderRadius: 10,

    alignItems: 'center',

    paddingLeft: 10,

    paddingRight: 10,

  },

  remainingTasksContainer: { alignItems: 'center', marginRight: 10 },

  remainingTasksText: {

    fontSize: 20,

    color: 'white',

    fontWeight: 'bold',

    textAlign: 'center',

    backgroundColor: '#83A3CD',

    borderRadius: 10,

    alignItems: 'center',

    paddingLeft: 10,

    paddingRight: 10,

  },

  ProgressBarcontainer: { width: "100%" },

  title: {

    fontSize: 18,

    fontWeight: 'bold',

    marginTop: 10,

    marginBottom: wp('1%'),

    color: '#2F4766',

    textAlign: 'center',

  },

  verbContainer: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    padding: 5,

    marginBottom: 10,

    backgroundColor: '#FFFDEF',

    borderRadius: 10,

    marginLeft: 5,

    marginRight: 5,

    shadowColor: "#000",

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.25,

    shadowRadius: 3.84,

    elevation: 5,

    height: 40,

    width: '100%',

  },

  verbText: { fontSize: 15, color: '#FF5757', fontWeight: 'bold', marginLeft: 5 },

  verbTextTr: { fontSize: 15, color: '#333', fontWeight: 'bold' },

  verbTextRu: { fontSize: 15, color: '#003882', fontWeight: 'bold' },

  audioButton: { padding: 2 },

  audioIcon: { width: 22, height: 22, marginRight: 5 },

  row: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    marginVertical: 5,

    width: "100%",

  },

  button: {

    width: '48.5%',

    marginHorizontal: 5,

    padding: 4,

    backgroundColor: '#D1E3F1',

    borderRadius: 10,

    justifyContent: 'center',

    flexDirection: 'row',

    alignItems: 'center',

    shadowColor: "#000",

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.25,

    shadowRadius: 3.84,

    elevation: 5

  },

  hebrewButton: {

    flexDirection: 'column',

    alignItems: 'center',

    justifyContent: 'center',

  },

  text: { fontSize: 15, fontWeight: 'bold' },

  russianText: { textAlign: 'left', flex: 1, marginLeft: 3, color: '#152039' },

hebrewText: {

  fontSize: HEBREW_FS,

  lineHeight: HEBREW_FS + 2,   // важно!

  textAlign: 'center',

  color: '#152039',

  fontFamily: HEBREW_FONT,

  marginTop: 2,                // убрать

  paddingTop: 2,

},

  hebrewCenterWhenNoTranslit: {

    transform: [{ translateY: 12 }],

  },

translitText: {

  fontSize: 15,

  lineHeight: 16,              // важно!

  textAlign: 'center',

  color: '#FF5757',

  fontWeight: 'bold',

  marginTop: 2,                // убрать

  paddingTop: 2,               // убрать

  marginBottom: 2,

  paddingBottom: 2,

},

  translitHidden: { opacity: 0 },

  iconStyle: { width: 45, height: 45 },

  selectedButton: { backgroundColor: '#AFFFCA' },

  correctButton: { backgroundColor: '#AFFFCA' },

  wrongButton: { backgroundColor: '#FFBCBC' },

  deactivatedButton: { backgroundColor: '#E0E0E0' },

  deactivatedButtonText: { color: '#A0A0A0' },

  verbContainerWrapper: {

    width: '100%',

    alignItems: 'center',

    marginVertical: 5,

    height: 40,

  },

  inactiveButton: {

    backgroundColor: '#E0E0E0',

    justifyContent: 'center',

    height: '100%',

    alignItems: 'center',

    width: '100%',

    marginLeft: 5,

    marginRight: 5,

  },

  activeButton: {

    backgroundColor: '#6C8EBB',

    justifyContent: 'center',

    height: '100%',

    alignItems: 'center',

    width: '100%',

    marginLeft: 5,

    marginRight: 5,

  },

  verbTextInactive: {

    fontSize: 14,

    color: '#A0A0A0',

    textAlign: 'center',

    fontWeight: 'bold',

  },

  verbTextActive: {

    fontSize: 14,

    color: 'white',

    textAlign: 'center',

    fontWeight: 'bold',

  },

  // ✅ colors (как у тебя было в других упражнениях)

 prefixYellow: { color: '#00a2ffff', fontFamily: HEBREW_FONT },

suffixGreen: { color: '#ff3ab3ff', fontFamily: HEBREW_FONT },

  rtlText: { textAlign: 'right', writingDirection: 'rtl' },

});

export default Exercise7Screen;
