import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  BackHandler,
  Animated,
} from 'react-native';
import VerbCard2Ru from './VerbCard2';
import VerbCard2En from './VerbCard2En';
import VerbCard2Fr from './VerbCard2Fr';
import VerbCard2Es from './VerbCard2Es';
import VerbCard2Pt from './VerbCard2Pt';
import VerbCard2Ar from './VerbCard2Ar';
import VerbCard2Am from './VerbCard2Am';
import verbsData from './verbs2.json';
import verbs1 from './verbs1.json';
import ProgressBar from './ProgressBar';
import CompletionMessageRu from './CompletionMessage';
import CompletionMessageEn from './CompletionMessageEn';
import CompletionMessageFr from './CompletionMessageFr';
import CompletionMessageEs from './CompletionMessageEs';
import CompletionMessagePt from './CompletionMessagePt';
import CompletionMessageAr from './CompletionMessageAr';
import CompletionMessageAm from './CompletionMessageAm';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import ExitConfirmationModalRu from './ExitConfirmationModal';
import ExitConfirmationModalEn from './ExitConfirmationModalEn';
import ExitConfirmationModalFr from './ExitConfirmationModalFr';
import ExitConfirmationModalEs from './ExitConfirmationModalEs';
import ExitConfirmationModalPt from './ExitConfirmationModalPt';
import ExitConfirmationModalAr from './ExitConfirmationModalAr';
import ExitConfirmationModalAm from './ExitConfirmationModalAm';
import { Audio } from 'expo-av';
import TaskDescriptionModal6 from './TaskDescriptionModal2';
import StatModal2Ru from './StatModal2';
import StatModal2En from './StatModal2En';
import StatModal2Fr from './StatModal2Fr';
import StatModal2Es from './StatModal2Es';
import StatModal2Pt from './StatModal2Pt';
import StatModal2Ar from './StatModal2Ar';
import StatModal2Am from './StatModal2Am';
import { updateStatistics, getStatistics } from './stat';
import LottieView from 'lottie-react-native';
import animation from './assets/Animation - 1723020554284.json';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VerbListModal from './VerbListModal';
import ExcludedVerbsModal2 from './ExcludedVerbsModal2';
import * as FirebaseAnalytics from './src/analytics/FirebaseAnalytics';
let verbs1RUCache = null;
let soundsCache = null;
let soundsConjCache = null;
const getVerbs1RU = () => {
  if (!verbs1RUCache) {
    const mod = require('./verbs11RU.json');
    verbs1RUCache = mod?.default || mod;
  }
  return Array.isArray(verbs1RUCache) ? verbs1RUCache : [];
};
const getSounds = () => {
  if (!soundsCache) {
    const mod = require('./Soundss');
    soundsCache = mod?.default || mod;
  }
  return soundsCache || {};
};
const getSoundsConj = () => {
  if (!soundsConjCache) {
    const mod = require('./soundconj');
    soundsConjCache = mod?.default || mod;
  }
  return soundsConjCache || {};
};
const LANGUAGE_ALIASES = {
  ru: 'ru', russian: 'ru', 'русский': 'ru',
  en: 'en', english: 'en',
  fr: 'fr', french: 'fr', 'français': 'fr', francais: 'fr',
  es: 'es', spanish: 'es', 'español': 'es', espanol: 'es',
  pt: 'pt', portuguese: 'pt', 'português': 'pt', portugues: 'pt', 'pt-pt': 'pt', 'pt-br': 'pt',
  ar: 'ar', arabic: 'ar', arab: 'ar', 'العربية': 'ar',
  am: 'am', amharic: 'am', 'አማርኛ': 'am',
};
const normalizeLanguage = value => {
  const key = String(value || '').trim().toLowerCase();
  return LANGUAGE_ALIASES[key] || 'ru';
};
const EXERCISE_TRANSLATION_FIELDS = {
  ru: ['verbRussian'],
  en: ['verbEnglish'],
  fr: ['verbFrench'],
  es: ['verbSpanish'],
  pt: ['verbPortuguese', 'verbPortu'],
  ar: ['verbArabic'],
  am: ['verbAmharic', 'verbamharic'],
};
const getExerciseVerbTranslation = (verb, lang, fallback = '') => {
  const fields = EXERCISE_TRANSLATION_FIELDS[normalizeLanguage(lang)] || EXERCISE_TRANSLATION_FIELDS.ru;
  for (const field of fields) {
    const value = verb?.[field];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return String(verb?.verbRussian || fallback || '');
};
const CONJ_TRANSLATION_FIELDS = {
  ru: ['russiantext', 'russian', 'ru'],
  en: ['entext', 'englishtext', 'englishText', 'english', 'en'],
  fr: ['frtext', 'frenchtext', 'frenchText', 'french', 'fr'],
  es: ['estext', 'spanishtext', 'spanishText', 'spanish', 'es'],
  pt: ['pttext', 'portuguesetext', 'portugueseText', 'portuguese', 'portu', 'pt'],
  ar: ['artext', 'arabictext', 'arabicText', 'arabic', 'ar'],
  am: ['amtext', 'amharictext', 'amharicText', 'amharic', 'am'],
};
const getConjugationTranslation = (row, lang, fallback = '') => {
  const fields = CONJ_TRANSLATION_FIELDS[normalizeLanguage(lang)] || CONJ_TRANSLATION_FIELDS.ru;
  for (const field of fields) {
    const value = row?.[field];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return fallback;
};
const UI_TEXT = {
  ru: { correct: 'ВЕРНО', wrong: 'НЕВЕРНО', choose: 'ВЫБЕРИ ПЕРЕВОД', next: 'СЛЕДУЮЩИЙ ГЛАГОЛ', notFound: 'Глагол не найден' },
  en: { correct: 'CORRECT', wrong: 'INCORRECT', choose: 'SELECT TRANSLATION', next: 'NEXT VERB', notFound: 'Verb not found' },
  fr: { correct: 'CORRECT', wrong: 'INCORRECT', choose: 'CHOISISSEZ LA TRADUCTION', next: 'VERBE SUIVANT', notFound: 'Verbe introuvable' },
  es: { correct: 'CORRECTO', wrong: 'INCORRECTO', choose: 'ELIGE LA TRADUCCIÓN', next: 'SIGUIENTE VERBO', notFound: 'Verbo no encontrado' },
  pt: { correct: 'CORRETO', wrong: 'INCORRETO', choose: 'ESCOLHA A TRADUÇÃO', next: 'PRÓXIMO VERBO', notFound: 'Verbo não encontrado' },
  ar: { correct: 'صحيح', wrong: 'غير صحيح', choose: 'اختر الترجمة', next: 'الفعل التالي', notFound: 'لم يتم العثور على الفعل' },
  am: { correct: 'ትክክል', wrong: 'ስህተት', choose: 'ይምረጡ ትርጉም', next: 'ቀጣዩ ግስ', notFound: 'ግስ አልተገኘም' },
};
const STAT_ID_BY_LANGUAGE = {
  ru: 'exercise2', en: 'exercise2En', fr: 'exercise2Fr', es: 'exercise2Es',
  pt: 'exercise2Pt', ar: 'exercise2Ar', am: 'exercise2Am',
};
const MENU_ROUTE_BY_LANGUAGE = {
  ru: 'Menu', en: 'MenuEn', fr: 'MenuFr', es: 'MenuEs', pt: 'MenuPt', ar: 'MenuAr', am: 'MenuAm',
};
const VERB_CARD_COMPONENTS = {
  ru: VerbCard2Ru, en: VerbCard2En, fr: VerbCard2Fr, es: VerbCard2Es,
  pt: VerbCard2Pt, ar: VerbCard2Ar, am: VerbCard2Am,
};
const COMPLETION_COMPONENTS = {
  ru: CompletionMessageRu, en: CompletionMessageEn, fr: CompletionMessageFr, es: CompletionMessageEs,
  pt: CompletionMessagePt, ar: CompletionMessageAr, am: CompletionMessageAm,
};
const EXIT_COMPONENTS = {
  ru: ExitConfirmationModalRu, en: ExitConfirmationModalEn, fr: ExitConfirmationModalFr, es: ExitConfirmationModalEs,
  pt: ExitConfirmationModalPt, ar: ExitConfirmationModalAr, am: ExitConfirmationModalAm,
};
const STAT_COMPONENTS = {
  ru: StatModal2Ru, en: StatModal2En, fr: StatModal2Fr, es: StatModal2Es,
  pt: StatModal2Pt, ar: StatModal2Ar, am: StatModal2Am,
};
const GRADE_TEXT = {
  ru: [[100, 'Исключительно! Безупречно! Ни одной ошибки!'], [90, 'Великолепно! Почти идеально!'], [80, 'Отлично! Очень хороший результат!'], [70, 'Хорошо! Материал усвоен неплохо.'], [60, 'Хороший прогресс — продолжай практиковаться.'], [0, 'Продолжай практиковаться — результат будет расти.']],
  en: [[100, 'Outstanding! Perfect — no mistakes!'], [90, 'Excellent! Almost perfect!'], [80, 'Great job! Very good result!'], [70, 'Good! You are learning the material well.'], [60, 'Good progress — keep practising.'], [0, 'Keep practising — your result will improve.']],
  fr: [[100, 'Exceptionnel ! Parfait, aucune erreur !'], [90, 'Excellent ! Presque parfait !'], [80, 'Très bien ! Excellent résultat !'], [70, 'Bien ! Vous maîtrisez déjà bien le contenu.'], [60, 'Bonne progression — continuez à vous entraîner.'], [0, 'Continuez à vous entraîner — le résultat progressera.']],
  es: [[100, '¡Excelente! Perfecto, sin errores.'], [90, '¡Excelente! Casi perfecto.'], [80, '¡Muy bien! Un resultado excelente.'], [70, '¡Bien! Estás aprendiendo bien el material.'], [60, 'Buen progreso — sigue practicando.'], [0, 'Sigue practicando — tu resultado mejorará.']],
  pt: [[100, 'Excelente! Perfeito, sem erros!'], [90, 'Excelente! Quase perfeito!'], [80, 'Muito bem! Ótimo resultado!'], [70, 'Bom! Você está aprendendo bem o conteúdo.'], [60, 'Bom progresso — continue praticando.'], [0, 'Continue praticando — o resultado vai melhorar.']],
  ar: [[100, 'ممتاز! نتيجة كاملة بلا أخطاء!'], [90, 'رائع! النتيجة شبه مثالية!'], [80, 'أحسنت! نتيجة ممتازة!'], [70, 'جيد! أنت تتقن المادة بشكل جيد.'], [60, 'تقدّم جيد — واصل التدريب.'], [0, 'واصل التدريب وستتحسن النتيجة.']],
  am: [[100, 'እጅግ በጣም ጥሩ! ምንም ስህተት የለም!'], [90, 'በጣም ጥሩ! ፍጹም ለመሆን ቀርቧል!'], [80, 'ጥሩ ሥራ! በጣም ጥሩ ውጤት!'], [70, 'ጥሩ! ትምህርቱን በደንብ እየተማሩ ነው።'], [60, 'ጥሩ እድገት — ልምምዱን ይቀጥሉ።'], [0, 'ልምምዱን ይቀጥሉ — ውጤቱ ይሻሻላል።']],
};
const getGrade = (percentage, lang = 'ru') => {
  const rows = GRADE_TEXT[normalizeLanguage(lang)] || GRADE_TEXT.ru;
  for (const [minimum, message] of rows) if (percentage >= minimum) return message;
  return rows[rows.length - 1][1];
};
const EXERCISE2_COUNT_KEY = 'exercise2_selected_count';
const DEFAULT_EXERCISE_COUNT = 12;
const ALLOWED_EXERCISE_COUNTS = [8, 12, 18, 24];
const EXCLUDED_KEY = 'exercise2_excluded_verbs';
const PINNED_KEY = 'exercise2_pinned_verbs';
const shuffleArray = (array) => {
  const shuffledArray = array.slice();
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray.slice(0, 18);
};
const shuffleAll = (array) => {
  const shuffledArray = array.slice();
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};
const normalize = (v) => String(v || '').trim().toLowerCase();
const normAudio = (v) => normalize(String(v || '').replace(/\.mp3$/i, ''));
const getHebrewIdEx2 = (verb) => {
  const correctOption = (verb?.verbHebrewOptions || []).find((opt) => opt?.isCorrect);
  return String(correctOption?.text || '').trim();
};
const getTranslitEx2 = (verb) => {
  const correctOption = (verb?.verbHebrewOptions || []).find((opt) => opt?.isCorrect);
  return String(correctOption?.transliteration || '').trim();
};
/* Ищем индекс соответствующей карточки именно в verbs1.json.
   Сначала инфинитив + перевод, затем аудио, затем fallback по инфинитиву. */
const findVerbDetailsIndex = (exerciseVerb) => {
  if (!exerciseVerb) return -1;
  const correctHebrew = getHebrewIdEx2(exerciseVerb);
  if (!correctHebrew) return -1;
  const targetTranslation = normalize(exerciseVerb.verbRussian);
  let candidates = verbs1
    .map((verb, index) => ({ verb, index }))
    .filter(({ verb }) => String(verb?.hebrewVerb || '').trim() === correctHebrew);
  if (!candidates.length) return -1;
  if (targetTranslation) {
    const exact = candidates.find(({ verb }) => {
      const correctIndex = Number.isInteger(verb?.correctTranslationIndex)
        ? verb.correctTranslationIndex
        : 0;
      const correctTranslation =
        verb?.translationOptions?.[correctIndex] ||
        verb?.translationOptions?.[0] ||
        '';
      return normalize(correctTranslation) === targetTranslation;
    });
    if (exact) return exact.index;
  }
  const targetAudio = normAudio(exerciseVerb.audioFile);
  if (targetAudio) {
    const byAudio = candidates.find(
      ({ verb }) => normAudio(verb?.audioFile) === targetAudio
    );
    if (byAudio) return byAudio.index;
  }
  return candidates[0].index;
};
const buildDeck = (
  allVerbs,
  excludedIds = [],
  pinnedIds = [],
  deckSize = DEFAULT_EXERCISE_COUNT
) => {
  const safeDeckSize = ALLOWED_EXERCISE_COUNTS.includes(deckSize)
    ? deckSize
    : DEFAULT_EXERCISE_COUNT;
  const excludedSet = new Set(
    (excludedIds || []).map((x) => String(x || '').trim()).filter(Boolean)
  );
  const pinnedSet = new Set(
    (pinnedIds || []).map((x) => String(x || '').trim()).filter(Boolean)
  );
  const idOf = (v) => getHebrewIdEx2(v);
  const pool = (allVerbs || []).filter((v) => {
    const id = idOf(v);
    return id && !excludedSet.has(id);
  });
  if (pool.length <= safeDeckSize) return shuffleAll(pool);
  const pinnedPool = pool.filter((v) => pinnedSet.has(idOf(v)));
  const restPool = pool.filter((v) => !pinnedSet.has(idOf(v)));
  let pinnedSoftCap = Math.floor(safeDeckSize / 2);
  pinnedSoftCap = Math.min(pinnedSoftCap, pinnedPool.length, safeDeckSize);
  const pinnedChosen = shuffleAll(pinnedPool).slice(0, pinnedSoftCap);
  const needFromRest = Math.max(0, safeDeckSize - pinnedChosen.length);
  const restChosen = shuffleAll(restPool).slice(0, needFromRest);
  const stillNeed = safeDeckSize - (pinnedChosen.length + restChosen.length);
  if (stillNeed > 0) {
    const chosenIds = new Set(pinnedChosen.map((v) => idOf(v)));
    const extraPinned = shuffleAll(pinnedPool).filter((v) => !chosenIds.has(idOf(v)));
    return shuffleAll([
      ...pinnedChosen,
      ...restChosen,
      ...extraPinned.slice(0, stillNeed),
    ]);
  }
  return shuffleAll([...pinnedChosen, ...restChosen]);
};
const findVerbMatchForExercise2 = (currentVerb) => {
  if (!currentVerb) return null;
  const baseAudio = normAudio(currentVerb.audioFile);
  const ruCurrent = normalize(currentVerb.verbRussian);
  let candidates = getVerbs1RU().filter(
    (v) => normAudio(v.audioFile) === baseAudio
  );
  if (candidates.length > 1 && ruCurrent) {
    const byRu = candidates.filter(
      (v) => normalize(v.russian) === ruCurrent
    );
    if (byRu.length) candidates = byRu;
  }
  if (!candidates.length && ruCurrent) {
    candidates = getVerbs1RU().filter(
      (v) => normalize(v.russian) === ruCurrent
    );
  }
  return candidates[0] || null;
};
const VerbDetailsContainer2 = ({
  verbDetails,
  handleSpeakerPress,
  currentIndex,
  animateRight,
  isAnswered,
  canShowSpeaker,
}) => {
  const leftFillAnim = useRef(new Animated.Value(0)).current;
  const rightFillAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);
  const [isTextVisible, setIsTextVisible] = useState(false);
  useEffect(() => {
    leftFillAnim.setValue(0);
    setIsTextVisible(false);
    Animated.timing(leftFillAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start(() => {
      setIsTextVisible(true);
    });
    if (animationRef.current) {
      animationRef.current.reset();
      animationRef.current.play();
    }
  }, [currentIndex, leftFillAnim]);
  useEffect(() => {
    rightFillAnim.setValue(0);
  }, [currentIndex, rightFillAnim]);
  useEffect(() => {
    if (isAnswered && animationRef.current) {
      animationRef.current.reset();
    }
    return () => {
      if (animationRef.current) {
        animationRef.current.reset();
      }
    };
  }, [isAnswered]);
  useEffect(() => {
    if (animateRight) {
      setTimeout(() => {
        Animated.timing(rightFillAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      }, 500);
    }
  }, [animateRight, rightFillAnim]);
  const leftWidth = leftFillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });
  const rightWidth = rightFillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '51%'],
  });
  return (
    <View style={styles.verbDetailsContainer}>
      <Animated.View
        style={[
          styles.verbDetailsHalf,
          styles.verbDetailsLeft,
          { width: leftWidth },
        ]}
      />
      <Animated.View
        style={[
          styles.verbDetailsHalf,
          styles.verbDetailsRight,
          { width: rightWidth },
        ]}
      />
      <View style={styles.verbDetailsContent}>
        <View style={styles.verbDetailsLeftContent}>
          <Text
            style={styles.verbDetailsRussian}
            maxFontSizeMultiplier={1.2}
          >
            {verbDetails.russiantext}
          </Text>
        </View>
        <View style={styles.verbDetailsRightContent}>
          {isAnswered ? (
            <>
              <Text
                style={styles.verbDetailsHebrew}
                maxFontSizeMultiplier={1.2}
              >
                {verbDetails.hebrewtext}
              </Text>
              {verbDetails.translit ? (
                <Text
                  style={styles.verbDetailsTranslit}
                  maxFontSizeMultiplier={1.2}
                >
                  {verbDetails.translit}
                </Text>
              ) : null}
              {isTextVisible && canShowSpeaker && verbDetails.mp3 ? (
                <TouchableOpacity
                  style={styles.speakerButton}
                  onPress={() => handleSpeakerPress(verbDetails.mp3)}
                >
                  <Image
                    source={require('./speaker1.png')}
                    style={styles.speakerIcon1}
                  />
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <LottieView
              ref={animationRef}
              source={animation}
              loop
              autoPlay
              style={styles.lottieAnimation}
            />
          )}
        </View>
      </View>
    </View>
  );
};
const Exercise2 = ({ route, forcedLanguage }) => {
const exercise2LoggedRef = useRef(false);
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [optionsOrder, setOptionsOrder] = useState([]);
  const [exitConfirmationVisible, setExitConfirmationVisible] = useState(false);
  const [shuffledVerbs, setShuffledVerbs] = useState([]);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showNextButton, setShowNextButton] = useState(false);
  const [correctSound, setCorrectSound] = useState();
  const [incorrectSound, setIncorrectSound] = useState();
  const backgroundColorAnim = useRef(new Animated.Value(0)).current;
  const optionsAnim = useRef(new Animated.Value(-500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [showTranslit, setShowTranslit] = useState(true);
  const handleTranslitToggle = () => setShowTranslit((prev) => !prev);
  const animationRef = useRef(null);
  const [isPlayingLottieOnSpeaker, setIsPlayingLottieOnSpeaker] =
    useState(false);
  const [verbDetails, setVerbDetails] = useState({
    hebrewtext: '',
    translit: '',
    russiantext: '',
    mp3: '',
  });
  const [isVerbListVisible, setIsVerbListVisible] = useState(true);
  // Согласуем цвет нижней Safe Area с экраном настроек/задания.
  useEffect(() => {
    navigation.setParams({ bottomSafeAreaStage: isVerbListVisible ? 'settings' : 'task' });
  }, [navigation, isVerbListVisible]);

  // Скрываем ИИ только на стартовом экране; в самом упражнении показываем.
  useEffect(() => {
    navigation.setOptions({ headerHideAI: isVerbListVisible });
  }, [navigation, isVerbListVisible]);

  const [verbListForModal, setVerbListForModal] = useState([]);
  const modalCloseReasonRef = useRef(null);
  const allowLeaveRef = useRef(false);
  const [isDescriptionModalVisible, setDescriptionModalVisible] =
    useState(false);
  const [dontShowAgain2, setDontShowAgain2] = useState(false);
  const [language, setLanguage] = useState(
    normalizeLanguage(forcedLanguage || route?.params?.language || 'ru')
  );
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const normalizedLanguage = normalizeLanguage(language);
  const ui = UI_TEXT[normalizedLanguage] || UI_TEXT.ru;
  const statisticsExerciseId = STAT_ID_BY_LANGUAGE[normalizedLanguage] || STAT_ID_BY_LANGUAGE.ru;
  const menuRoute = MENU_ROUTE_BY_LANGUAGE[normalizedLanguage] || MENU_ROUTE_BY_LANGUAGE.ru;
  const VerbCardComponent = VERB_CARD_COMPONENTS[normalizedLanguage] || VerbCard2Ru;
  const CompletionMessageComponent = COMPLETION_COMPONENTS[normalizedLanguage] || CompletionMessageRu;
  const ExitConfirmationModalComponent = EXIT_COMPONENTS[normalizedLanguage] || ExitConfirmationModalRu;
  const StatModalComponent = STAT_COMPONENTS[normalizedLanguage] || StatModal2Ru;
  useFocusEffect(
    useCallback(() => {
      if (!normalizedLanguage || exercise2LoggedRef.current) return;
      exercise2LoggedRef.current = true;
      const eventName = `exercise2${normalizedLanguage}`;
      FirebaseAnalytics.logFirebaseEvent(eventName, { screen: eventName });
      return () => { exercise2LoggedRef.current = false; };
    }, [normalizedLanguage])
  );
  const [isExcludedVerbsModalVisible, setExcludedVerbsModalVisible] =
    useState(false);
  const [excludedVerbs, setExcludedVerbs] = useState([]);
  const [pinnedVerbs, setPinnedVerbs] = useState([]);
  const excludedRef = useRef([]);
  const pinnedRef = useRef([]);
  const [isGenderMan, setIsGenderMan] = useState(true);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [animateRight, setAnimateRight] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isTextVisible, setIsTextVisible] = useState(false);
  const [isSecondSoundFinished, setIsSecondSoundFinished] = useState(false);
  const [canShowSpeaker, setCanShowSpeaker] = useState(false);
  const [soundObject2, setSoundObject2] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [isStatModalVisible, setIsStatModalVisible] = useState(false);
  const [statisticsUpdated, setStatisticsUpdated] = useState(false);
  const [selectedExerciseCount, setSelectedExerciseCount] =
    useState(DEFAULT_EXERCISE_COUNT);
  const uniqueVerbsData = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const v of verbsData || []) {
      const id = getHebrewIdEx2(v);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(v);
    }
    return out;
  }, []);
  const manageVerbsData = useMemo(() => {
    return (uniqueVerbsData || []).map((v) => ({
      hebrewVerb: getHebrewIdEx2(v),
      transliteration: getTranslitEx2(v),
      translation: getExerciseVerbTranslation(v, normalizedLanguage, ''),
      audioFile: v.audioFile || '',
    }));
  }, [uniqueVerbsData, normalizedLanguage]);
  const toggleExcludedVerbsModal = () => {
    setExcludedVerbsModalVisible((prev) => !prev);
  };
  const loadExcludedAndPinned = useCallback(async () => {
    try {
      const [exRaw, pinRaw] = await Promise.all([
        AsyncStorage.getItem(EXCLUDED_KEY),
        AsyncStorage.getItem(PINNED_KEY),
      ]);
      const ex = exRaw ? JSON.parse(exRaw) : [];
      const pin = pinRaw ? JSON.parse(pinRaw) : [];
      const exArr = Array.isArray(ex)
        ? ex.filter(Boolean).map(String)
        : [];
      const pinArr = Array.isArray(pin)
        ? pin.filter(Boolean).map(String)
        : [];
      setExcludedVerbs(exArr);
      setPinnedVerbs(pinArr);
      excludedRef.current = exArr;
      pinnedRef.current = pinArr;
    } catch (e) {
      console.log('[Exercise2] loadExcludedAndPinned error:', e);
      setExcludedVerbs([]);
      setPinnedVerbs([]);
      excludedRef.current = [];
      pinnedRef.current = [];
    }
  }, []);
  const loadExerciseCount = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(EXERCISE2_COUNT_KEY);
      const parsed = Number(raw);
      const safeCount = ALLOWED_EXERCISE_COUNTS.includes(parsed)
        ? parsed
        : DEFAULT_EXERCISE_COUNT;
      setSelectedExerciseCount(safeCount);
      return safeCount;
    } catch (e) {
      console.log('[Exercise2] loadExerciseCount error:', e);
      setSelectedExerciseCount(DEFAULT_EXERCISE_COUNT);
      return DEFAULT_EXERCISE_COUNT;
    }
  }, []);
  const persistExcludedAndPinned = useCallback(
    async (nextExcluded, nextPinned) => {
      try {
        await Promise.all([
          AsyncStorage.setItem(
            EXCLUDED_KEY,
            JSON.stringify(nextExcluded)
          ),
          AsyncStorage.setItem(
            PINNED_KEY,
            JSON.stringify(nextPinned)
          ),
        ]);
      } catch (e) {
        console.log(
          '[Exercise2] persistExcludedAndPinned error:',
          e
        );
      }
    },
    []
  );
  const saveExerciseCount = useCallback(async (count) => {
    const safeCount = ALLOWED_EXERCISE_COUNTS.includes(count)
      ? count
      : DEFAULT_EXERCISE_COUNT;
    setSelectedExerciseCount(safeCount);
    await AsyncStorage.setItem(
      EXERCISE2_COUNT_KEY,
      String(safeCount)
    );
  }, []);
  const handleToggleExcludedVerb = useCallback(
    async (hebrewVerb) => {
      const id = String(hebrewVerb || '').trim();
      if (!id) return;
      const prevExcluded = excludedRef.current || [];
      const prevPinned = pinnedRef.current || [];
      const isExcluded = prevExcluded.includes(id);
      const nextExcluded = isExcluded
        ? prevExcluded.filter((v) => v !== id)
        : [...prevExcluded, id];
      const nextPinned = isExcluded
        ? prevPinned
        : prevPinned.filter((v) => v !== id);
      setExcludedVerbs(nextExcluded);
      setPinnedVerbs(nextPinned);
      excludedRef.current = nextExcluded;
      pinnedRef.current = nextPinned;
      await persistExcludedAndPinned(
        nextExcluded,
        nextPinned
      );
    },
    [persistExcludedAndPinned]
  );
  const handleRestoreExcludedVerb = useCallback(
    async (hebrewVerb) => {
      const id = String(hebrewVerb || '').trim();
      if (!id) return;
      const prevExcluded = excludedRef.current || [];
      const prevPinned = pinnedRef.current || [];
      if (!prevExcluded.includes(id)) return;
      const nextExcluded = prevExcluded.filter(
        (v) => v !== id
      );
      setExcludedVerbs(nextExcluded);
      excludedRef.current = nextExcluded;
      await persistExcludedAndPinned(
        nextExcluded,
        prevPinned
      );
    },
    [persistExcludedAndPinned]
  );
  const handleTogglePinnedVerb = useCallback(
    async (hebrewVerb) => {
      const id = String(hebrewVerb || '').trim();
      if (!id) return;
      const prevExcluded = excludedRef.current || [];
      const prevPinned = pinnedRef.current || [];
      const isPinned = prevPinned.includes(id);
      const nextPinned = isPinned
        ? prevPinned.filter((v) => v !== id)
        : [...prevPinned, id];
      const nextExcluded = isPinned
        ? prevExcluded
        : prevExcluded.filter((v) => v !== id);
      setPinnedVerbs(nextPinned);
      setExcludedVerbs(nextExcluded);
      pinnedRef.current = nextPinned;
      excludedRef.current = nextExcluded;
      await persistExcludedAndPinned(
        nextExcluded,
        nextPinned
      );
    },
    [persistExcludedAndPinned]
  );
  const initializeVerbList = useCallback(
    (
      lang,
      setShuffledVerbsFn,
      setVerbListForModalFn,
      deckSize = selectedExerciseCount
    ) => {
      const safeDeckSize =
        ALLOWED_EXERCISE_COUNTS.includes(deckSize)
          ? deckSize
          : selectedExerciseCount ||
            DEFAULT_EXERCISE_COUNT;
      const selected = buildDeck(
        uniqueVerbsData,
        excludedRef.current,
        pinnedRef.current,
        safeDeckSize
      );
      setShuffledVerbsFn(selected);
      const sorted = selected
        .slice()
        .sort((a, b) =>
          getExerciseVerbTranslation(a, normalizedLanguage).localeCompare(
            getExerciseVerbTranslation(b, normalizedLanguage),
            normalizedLanguage
          )
        );
      const verbList = sorted.map((verb) => {
        const correctOption =
          (verb.verbHebrewOptions || []).find(
            (opt) => opt?.isCorrect
          );
        const match = findVerbMatchForExercise2(verb);
        const mp3Inf = String(
          verb.audioFile || ''
        )
          .replace(/\.mp3$/i, '')
          .trim();
        const mp3Conj = match
          ? String(match.mp3 || '')
              .replace(/\.mp3$/i, '')
              .trim()
          : '';
        return {
          hebrewtext: correctOption?.text || '—',
          translit: correctOption?.transliteration || '',
          entext: getExerciseVerbTranslation(verb, normalizedLanguage, '—'),
          mp3: mp3Inf,
          mp3Inf,
          mp3Conj,
          gender: match?.gender || undefined,
        };
      });
      setVerbListForModalFn(verbList);
    },
    [selectedExerciseCount, uniqueVerbsData, normalizedLanguage]
  );
  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const explicitLanguage = forcedLanguage || route?.params?.language;
        const [storedLanguage, hidden] = await Promise.all([
          explicitLanguage ? Promise.resolve(null) : AsyncStorage.getItem('language'),
          AsyncStorage.getItem('exercise2_description_hidden'),
        ]);
        if (!active) return;
        const lang = normalizeLanguage(explicitLanguage || storedLanguage || 'ru');
        setLanguage(lang);
        setDontShowAgain2(hidden === 'true');
        await loadExcludedAndPinned();
        const savedCount = await loadExerciseCount();
        if (!active) return;
        initializeVerbList(lang, setShuffledVerbs, setVerbListForModal, savedCount);
        setSettingsLoaded(true);
      } catch (e) {
        console.log('[Exercise2] initialize error:', e);
        if (active) setSettingsLoaded(true);
      }
    };
    initialize();
    return () => { active = false; };
  }, [
    forcedLanguage,
    route?.params?.language,
    initializeVerbList,
    loadExcludedAndPinned,
    loadExerciseCount,
  ]);
  useEffect(() => {
    if (!language) return;
    initializeVerbList(
      language,
      setShuffledVerbs,
      setVerbListForModal,
      selectedExerciseCount
    );
  }, [
    language,
    selectedExerciseCount,
    initializeVerbList,
  ]);
  const handleToggleDontShowAgain2 = async () => {
    const newValue = !dontShowAgain2;
    setDontShowAgain2(newValue);
    await AsyncStorage.setItem(
      'exercise2_description_hidden',
      newValue ? 'true' : ''
    );
  };
  const handleButton2Press = () => {
    setDescriptionModalVisible((prev) => !prev);
  };
  const toggleDescriptionModal = () => {
    setDescriptionModalVisible((prev) => !prev);
  };
  const handleGenderToggle = () => {
    setIsGenderMan((prev) => !prev);
  };
  useEffect(() => {
    if (
      soundEnabled &&
      correctSound &&
      incorrectSound
    ) {
      correctSound.setVolumeAsync(1);
      incorrectSound.setVolumeAsync(1);
    } else if (correctSound && incorrectSound) {
      correctSound.setVolumeAsync(0);
      incorrectSound.setVolumeAsync(0);
    }
  }, [soundEnabled, correctSound, incorrectSound]);
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);
  useEffect(() => {
    optionsAnim.setValue(-500);
    Animated.timing(optionsAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentIndex, optionsAnim]);
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
  const backgroundColor =
    backgroundColorAnim.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [
        '#83A3CD',
        '#AFFFCA',
        '#FFBCBC',
      ],
    });
  const goToMenu = () => {
    allowLeaveRef.current = true;
    setExitConfirmationVisible(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: menuRoute }],
      })
    );
  };
  const navigateToMenu = () => {
    goToMenu();
  };
  useFocusEffect(
    useCallback(() => {
      if (!isVerbListVisible) return;
      const onBackPress = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          goToMenu();
        }
        return true;
      };
      const bh = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );
      return () => bh.remove();
    }, [isVerbListVisible, navigation])
  );
  useFocusEffect(
    useCallback(() => {
      if (isVerbListVisible) return;
      const onBackPress = () => {
        setExitConfirmationVisible(true);
        return true;
      };
      const bh = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );
      const unsubscribe = navigation.addListener(
        'beforeRemove',
        (e) => {
          if (exitConfirmationVisible) return;
          if (allowLeaveRef.current) {
            allowLeaveRef.current = false;
            return;
          }
          e.preventDefault();
          setExitConfirmationVisible(true);
        }
      );
      return () => {
        bh.remove();
        unsubscribe();
      };
    }, [
      isVerbListVisible,
      exitConfirmationVisible,
      navigation,
    ])
  );
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
    });
  }, [navigation]);
  useEffect(() => {
    if (isVerbListVisible) {
      setCorrectSound(undefined);
      setIncorrectSound(undefined);
      return undefined;
    }
    let cancelled = false;
    const correctSoundObject = new Audio.Sound();
    const incorrectSoundObject = new Audio.Sound();
    const loadSounds = async () => {
      try {
        await correctSoundObject.loadAsync(require('./assets/sounds/success.mp3'));
        await incorrectSoundObject.loadAsync(require('./assets/sounds/failure.mp3'));
        if (cancelled) {
          await correctSoundObject.unloadAsync().catch(() => {});
          await incorrectSoundObject.unloadAsync().catch(() => {});
          return;
        }
        setCorrectSound(correctSoundObject);
        setIncorrectSound(incorrectSoundObject);
      } catch (error) {
        console.error('Failed to load sounds', error);
      }
    };
    loadSounds();
    return () => {
      cancelled = true;
      correctSoundObject.unloadAsync().catch(() => {});
      incorrectSoundObject.unloadAsync().catch(() => {});
    };
  }, [isVerbListVisible]);
  useEffect(() => {
    const updateVolume = async () => {
      const volume = soundEnabled ? 1 : 0;
      await correctSound?.setVolumeAsync(volume);
      await incorrectSound?.setVolumeAsync(volume);
    };
    if (correctSound && incorrectSound) {
      updateVolume();
    }
  }, [
    soundEnabled,
    correctSound,
    incorrectSound,
  ]);
  const updateVerbDetails2 = (
    currentVerb,
    showHebrewText = false
  ) => {
    if (!currentVerb) return;
    const baseMatch =
      findVerbMatchForExercise2(currentVerb);
    if (!baseMatch) {
      setVerbDetails({
        hebrewtext: '',
        translit: '',
        russiantext: ui.notFound,
        mp3: '',
      });
      return;
    }
    const baseAudio = normAudio(
      baseMatch.audioFile
    );
    const sameInfinitive = getVerbs1RU().filter(
      (v) =>
        normAudio(v.audioFile) === baseAudio
    );
    const genderWanted = isGenderMan
      ? 'man'
      : 'woman';
    const selectedVerb =
      sameInfinitive.find(
        (v) => v.gender === genderWanted
      ) || baseMatch;
    setVerbDetails({
      hebrewtext: showHebrewText
        ? selectedVerb.hebrewtext
        : '',
      translit: showHebrewText
        ? selectedVerb.translit
        : '',
      russiantext: getConjugationTranslation(
        selectedVerb,
        normalizedLanguage,
        getExerciseVerbTranslation(currentVerb, normalizedLanguage, '')
      ),
      mp3: selectedVerb.mp3,
    });
  };
  useEffect(() => {
    if (shuffledVerbs.length > 0) {
      updateVerbDetails2(
        shuffledVerbs[currentIndex],
        showNextButton
      );
    }
  }, [
    isGenderMan,
    currentIndex,
    shuffledVerbs,
    showNextButton,
  ]);
  const handleSpeakerPress = async (audioFile) => {
    if (!audioFile) {
      console.error(
        'Audio file is undefined.'
      );
      return;
    }
    const soundFile =
      getSoundsConj()[
        audioFile.replace('.mp3', '')
      ];
    if (!soundFile) {
      console.error(
        `Audio file ${audioFile} not found in soundsConj.`
      );
      return;
    }
    const soundObject = new Audio.Sound();
    try {
      if (animationRef.current) {
        animationRef.current.reset();
        animationRef.current.play();
      }
      await soundObject.loadAsync(soundFile);
      await soundObject.playAsync();
      soundObject.setOnPlaybackStatusUpdate(
        async (status) => {
          if (status.didJustFinish) {
            await soundObject.unloadAsync();
          }
        }
      );
    } catch (error) {
      console.log(
        'Error playing sound:',
        error
      );
      await soundObject.unloadAsync();
    }
  };
  const playSound = async (
    audioFileName,
    forcePlay = false
  ) => {
    if (!soundEnabled && !forcePlay) return;
    const audioFile =
      getSounds()[
        audioFileName.replace('.mp3', '')
      ];
    if (audioFile) {
      const soundObject = new Audio.Sound();
      try {
        setIsPlayingLottieOnSpeaker(true);
        await soundObject.loadAsync(audioFile);
        await soundObject.playAsync();
        setTimeout(() => {
          setIsPlayingLottieOnSpeaker(false);
        }, 800);
        soundObject.setOnPlaybackStatusUpdate(
          async (playbackStatus) => {
            if (
              playbackStatus.didJustFinish &&
              !playbackStatus.isLooping
            ) {
              await soundObject.unloadAsync();
            }
          }
        );
      } catch (error) {
        await soundObject.unloadAsync();
      }
    }
  };
  const playSecondSound = async () => {
    const audioFile = verbDetails.mp3;
    if (!audioFile) {
      console.error(
        'Audio file is undefined.'
      );
      return;
    }
    try {
      const secondSoundFile =
        getSoundsConj()[
          audioFile.replace('.mp3', '')
        ];
      if (!secondSoundFile) {
        console.error(
          `Second sound file not found for: ${audioFile}`
        );
        return;
      }
      const snd2 = new Audio.Sound();
      setSoundObject2(snd2);
      await snd2.loadAsync(
        secondSoundFile
      );
      if (!soundEnabled) {
        await snd2.stopAsync();
        await snd2.unloadAsync();
        return;
      }
      await snd2.playAsync();
      snd2.setOnPlaybackStatusUpdate(
        async (status) => {
          if (status.didJustFinish) {
            await snd2.unloadAsync();
          }
        }
      );
    } catch (error) {
      console.error(
        'Error during second sound playback:',
        error
      );
    }
  };
  const handleSoundToggle = () => {
    const newVolume = !soundEnabled ? 1 : 0;
    setSoundEnabled((prev) => !prev);
    setAutoPlayEnabled((prev) => !prev);
    if (correctSound && incorrectSound) {
      correctSound.setVolumeAsync(newVolume);
      incorrectSound.setVolumeAsync(newVolume);
    }
    if (soundObject2) {
      soundObject2.setVolumeAsync(newVolume);
    }
  };
  const generateOptions = (verbData) => {
    const correctAnswerIndex =
      verbData.verbHebrewOptions.findIndex(
        (option) => option.isCorrect
      );
    const correctTranslation =
      verbData.verbHebrewOptions[
        correctAnswerIndex
      ]?.text;
    const transliteration =
      verbData.verbHebrewOptions[
        correctAnswerIndex
      ]?.transliteration;
    const incorrectOptions =
      verbData.verbHebrewOptions.filter(
        (_, index) =>
          index !== correctAnswerIndex
      );
    const shuffledOptions = shuffleArray(
      incorrectOptions.map(
        (option, index) => ({
          text: option.text,
          transliteration:
            option.transliteration,
          isCorrect: false,
          isSelected: false,
          isHighlighted: false,
          index,
        })
      )
    );
    shuffledOptions.splice(
      Math.floor(
        Math.random() *
          (shuffledOptions.length + 1)
      ),
      0,
      {
        text: correctTranslation,
        transliteration,
        isCorrect: true,
        isSelected: false,
        isHighlighted: false,
        index: shuffledOptions.length,
      }
    );
    return shuffledOptions;
  };
  useEffect(() => {
    if (shuffledVerbs.length > 0) {
      setOptionsOrder(
        generateOptions(
          shuffledVerbs[currentIndex]
        ).map((option) => ({
          ...option,
          isSelected: false,
          disabled: false,
        }))
      );
    }
  }, [currentIndex, shuffledVerbs]);
  const handleAnswer = async (
    selectedOptionIdx
  ) => {
    setSelectedOptionIndex(
      selectedOptionIdx
    );
    setAnimateRight(false);
    setIsAnswered(true);
    setCanShowSpeaker(false);
    const selectedOption =
      optionsOrder[selectedOptionIdx];
    if (!selectedOption) return;
    const isCorrect =
      selectedOption.isCorrect;
    const updatedOptions =
      optionsOrder.map(
        (option, index) => ({
          ...option,
          isSelected:
            index === selectedOptionIdx,
          disabled: true,
        })
      );
    setOptionsOrder(updatedOptions);
    changeBackgroundColor(isCorrect);
    if (isCorrect) {
      setCorrectAnswers(
        (prev) => prev + 1
      );
      try {
        await correctSound?.replayAsync();
      } catch (error) {}
    } else {
      setIncorrectAnswers(
        (prev) => prev + 1
      );
      try {
        await incorrectSound?.replayAsync();
      } catch (error) {}
    }
    setProgress((prev) => prev + 1);
    try {
      const firstSoundFile =
        shuffledVerbs[
          currentIndex
        ].audioFile.replace('.mp3', '');
      await playSound(firstSoundFile);
      setAnimateRight(true);
      await new Promise((resolve) =>
        setTimeout(resolve, 700)
      );
      await playSecondSound();
      setIsSecondSoundFinished(true);
      setCanShowSpeaker(true);
    } catch (error) {}
    updateVerbDetails2(
      shuffledVerbs[currentIndex],
      true
    );
    setShowNextButton(true);
  };
  /* ОТКРЫТИЕ ПОЛНОЙ КАРТОЧКИ.
     Никакое состояние упражнения здесь не сбрасывается. */
  const openFullVerbCard = () => {
    if (!isAnswered) return;
    const currentVerb =
      shuffledVerbs[currentIndex];
    if (!currentVerb) return;
    const verbIndex =
      findVerbDetailsIndex(currentVerb);
    if (verbIndex < 0) {
      console.warn(
        '[Exercise2] VerbDetails: verb not found',
        currentVerb
      );
      return;
    }
    navigation.navigate(
      'VerbDetails',
      {
        index: verbIndex,
        language: normalizedLanguage,
        openedFromExercise: true,
      }
    );
  };
  const handleNextCard = () => {
    if (
      currentIndex + 1 >=
      shuffledVerbs.length
    ) {
      setExerciseCompleted(true);
      setShowNextButton(false);
      setOptionsOrder([]);
      return;
    }
    const next = currentIndex + 1;
    setCurrentIndex(next);
    setShowNextButton(false);
    setAnimateRight(false);
    /* ВАЖНО: при каждом новом задании кнопка снова неактивна */
    setIsAnswered(false);
    setSelectedOptionIndex(null);
    setIsSecondSoundFinished(false);
    setCanShowSpeaker(false);
    setIsTextVisible(false);
    const nextOptions =
      generateOptions(
        shuffledVerbs[next]
      ).map((o) => ({
        ...o,
        isSelected: false,
        disabled: false,
      }));
    setOptionsOrder(nextOptions);
    updateVerbDetails2(
      shuffledVerbs[next],
      false
    );
  };
  const calculateScore = () => {
    const totalAttempts =
      correctAnswers +
      incorrectAnswers;
    if (totalAttempts === 0) return 0;
    return Number(
      (
        (correctAnswers /
          totalAttempts) *
        100
      ).toFixed(2)
    );
  };
  const percent = calculateScore();
  const grade = getGrade(percent, normalizedLanguage);
  const handleExerciseCompletion =
    async () => {
      if (!statisticsUpdated) {
        setStatisticsUpdated(true);
        const currentScore =
          calculateScore();
        setTimeout(async () => {
          try {
            await updateStatistics(
              statisticsExerciseId,
              currentScore
            );
          } catch (error) {
            console.error(
              'Failed to update statistics:',
              error
            );
          }
        }, 500);
      }
    };
  useEffect(() => {
    if (exerciseCompleted) {
      handleExerciseCompletion();
    }
  }, [exerciseCompleted]);
  const handleConfirmExit = () => {
    goToMenu();
  };
  const handleCancelExit = () => {
    setExitConfirmationVisible(false);
  };
  const handleButton3Press = async () => {
    const exerciseId = statisticsExerciseId;
    try {
      const stats =
        await getStatistics(exerciseId);
      setStatistics(
        stats
          ? {
              currentScore:
                stats.averageScore,
            }
          : null
      );
      setIsStatModalVisible(true);
    } catch (error) {
      console.error(
        'Failed to fetch statistics:',
        error
      );
      setStatistics(null);
      setIsStatModalVisible(false);
    }
  };
  const handleSelectExerciseCount =
    async (count) => {
      if (
        !ALLOWED_EXERCISE_COUNTS.includes(
          count
        )
      )
        return;
      if (
        count === selectedExerciseCount
      )
        return;
      await saveExerciseCount(count);
      setCorrectAnswers(0);
      setIncorrectAnswers(0);
      setProgress(0);
      setShowNextButton(false);
      setExerciseCompleted(false);
      setStatisticsUpdated(false);
      setOptionsOrder([]);
      setSelectedOptionIndex(null);
      setIsAnswered(false);
      setAnimateRight(false);
      setIsSecondSoundFinished(false);
      setCanShowSpeaker(false);
      setIsTextVisible(false);
      setCurrentIndex(0);
      initializeVerbList(
        language,
        setShuffledVerbs,
        setVerbListForModal,
        count
      );
    };
  const resetExercise = async () => {
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setProgress(0);
    setShowNextButton(false);
    setExerciseCompleted(false);
    setStatisticsUpdated(false);
    setOptionsOrder([]);
    setSelectedOptionIndex(null);
    setIsAnswered(false);
    setAnimateRight(false);
    setIsSecondSoundFinished(false);
    setCanShowSpeaker(false);
    setIsTextVisible(false);
    setVerbDetails({
      hebrewtext: '',
      translit: '',
      russiantext: '',
      mp3: '',
    });
    setIsVerbListVisible(true);
    await loadExcludedAndPinned();
    initializeVerbList(
      language,
      setShuffledVerbs,
      setVerbListForModal,
      selectedExerciseCount
    );
    setCurrentIndex(0);
  };
  if (isVerbListVisible) {
    return (
      <VerbListModal
        visible
        language={normalizedLanguage}
        verbs={verbListForModal}
        pinnedIds={pinnedVerbs}
        selectedCount={selectedExerciseCount}
        ready={settingsLoaded}
        onSelectCount={handleSelectExerciseCount}
        onStartExercise={() => {
          modalCloseReasonRef.current = 'start';
          setSelectedOptionIndex(null);
          setShowNextButton(false);
          setIsAnswered(false);
          setAnimateRight(false);
          setIsSecondSoundFinished(false);
          setCanShowSpeaker(false);
          setIsTextVisible(false);
          setIsVerbListVisible(false);
          if (shuffledVerbs.length) {
            setCurrentIndex(0);
            setOptionsOrder(
              generateOptions(shuffledVerbs[0]).map(option => ({
                ...option, isSelected: false, disabled: false,
              }))
            );
            updateVerbDetails2(shuffledVerbs[0], false);
          }
        }}
        onClose={() => {
          modalCloseReasonRef.current = 'menu';
          goToMenu();
        }}
      />
    );
  }
  return (
    <>
      <ExcludedVerbsModal2
        visible={
          isExcludedVerbsModalVisible
        }
        onClose={
          toggleExcludedVerbsModal
        }
        excludedIds={excludedVerbs}
        pinnedIds={pinnedVerbs}
        verbsData={manageVerbsData}
        lang={normalizedLanguage}
        onRestoreVerb={
          handleRestoreExcludedVerb
        }
        onTogglePinnedVerb={
          handleTogglePinnedVerb
        }
      />
      {!isVerbListVisible && (
        <ScrollView
          contentContainerStyle={
            styles.scrollViewContent
          }
        >
          <View style={styles.container}>
            <View style={styles.topBar}>
              <Animated.Image
                source={require('./VERBIFY.png')}
                style={[
                  styles.logoImage,
                  { opacity: fadeAnim },
                ]}
              />
              <View
                style={
                  styles.buttonContainer
                }
              >
                <TouchableOpacity
                  onPress={
                    handleSoundToggle
                  }
                >
                  <Animated.Image
                    source={
                      soundEnabled
                        ? require('./SoundOn.png')
                        : require('./SoundOff.png')
                    }
                    style={[
                      styles.buttonImage,
                      {
                        opacity:
                          fadeAnim,
                      },
                    ]}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={
                    handleTranslitToggle
                  }
                >
                  <Animated.Image
                    source={
                      showTranslit
                        ? require('./translit1.png')
                        : require('./translit2.png')
                    }
                    style={[
                      styles.buttonImage,
                      {
                        opacity:
                          fadeAnim,
                      },
                    ]}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={
                    handleButton3Press
                  }
                >
                  <Animated.Image
                    source={require('./stat.png')}
                    style={[
                      styles.buttonImage,
                      {
                        opacity:
                          fadeAnim,
                      },
                    ]}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={
                    handleButton2Press
                  }
                >
                  <Animated.Image
                    source={require('./question.png')}
                    style={[
                      styles.buttonImage,
                      {
                        opacity:
                          fadeAnim,
                      },
                    ]}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={
                    handleGenderToggle
                  }
                >
                  <Animated.Image
                    source={
                      isGenderMan
                        ? require('./GenderMan.png')
                        : require('./GenderWoman.png')
                    }
                    style={[
                      styles.buttonImage,
                      {
                        opacity:
                          fadeAnim,
                      },
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <Animated.View
              style={[
                styles.progressContainer,
                { opacity: fadeAnim },
              ]}
            >
              <View
                style={styles.textContainer}
              >
                <Text
                  style={styles.prtext}
                  maxFontSizeMultiplier={
                    1.2
                  }
                >
                  {ui.correct}: {correctAnswers}
                </Text>
                <Text
                  style={styles.prtext}
                  maxFontSizeMultiplier={
                    1.2
                  }
                >
                  {ui.wrong}:{' '}
                  {incorrectAnswers}
                </Text>
              </View>
              <View
                style={
                  styles.remainingTasksContainer
                }
              >
                <Text
                  style={
                    styles.remainingTasksText
                  }
                  maxFontSizeMultiplier={
                    1.2
                  }
                >
                  {shuffledVerbs.length -
                    currentIndex}
                </Text>
              </View>
              <Animated.View
                style={[
                  styles.percentContainer,
                  {
                    backgroundColor,
                    borderRadius: 10,
                  },
                ]}
              >
                <Text
                  style={
                    styles.percentText
                  }
                  maxFontSizeMultiplier={
                    1.2
                  }
                >
                  {percent}%
                </Text>
              </Animated.View>
            </Animated.View>
            <Animated.View
              style={[
                styles.ProgressBarcontainer,
                { opacity: fadeAnim },
              ]}
            >
              <ProgressBar
                progress={progress}
                totalExercises={
                  shuffledVerbs.length
                }
              />
            </Animated.View>
            {!exerciseCompleted && (
              <>
                <Animated.Text
                  style={[
                    styles.title,
                    {
                      opacity:
                        fadeAnim,
                    },
                  ]}
                  maxFontSizeMultiplier={
                    1.2
                  }
                >
                  {ui.choose}
                </Animated.Text>
                {currentIndex <
                  shuffledVerbs.length && (
                  <VerbCardComponent
                    verbData={
                      shuffledVerbs[
                        currentIndex
                      ]
                    }
                    options={optionsOrder}
                    onAnswer={
                      handleAnswer
                    }
                    isExcluded={excludedVerbs.includes(
                      getHebrewIdEx2(
                        shuffledVerbs[
                          currentIndex
                        ]
                      )
                    )}
                    isPinned={pinnedVerbs.includes(
                      getHebrewIdEx2(
                        shuffledVerbs[
                          currentIndex
                        ]
                      )
                    )}
                    onExcludePress={() =>
                      handleToggleExcludedVerb(
                        getHebrewIdEx2(
                          shuffledVerbs[
                            currentIndex
                          ]
                        )
                      )
                    }
                    onPinTogglePress={() =>
                      handleTogglePinnedVerb(
                        getHebrewIdEx2(
                          shuffledVerbs[
                            currentIndex
                          ]
                        )
                      )
                    }
                    onOpenManageModal={() =>
                      setExcludedVerbsModalVisible(
                        true
                      )
                    }
                    fullCardEnabled={
                      isAnswered
                    }
                    onOpenFullCard={
                      openFullVerbCard
                    }
                  />
                )}
                <VerbDetailsContainer2
                  verbDetails={
                    verbDetails
                  }
                  handleSpeakerPress={
                    handleSpeakerPress
                  }
                  currentIndex={
                    currentIndex
                  }
                  animateRight={
                    animateRight
                  }
                  isAnswered={
                    isAnswered
                  }
                  canShowSpeaker={
                    canShowSpeaker
                  }
                  showTranslit={
                    showTranslit
                  }
                />
                <Animated.View
                  style={[
                    styles.optionsContainer,
                    {
                      transform: [
                        {
                          translateX:
                            optionsAnim,
                        },
                      ],
                    },
                  ]}
                >
                  {optionsOrder.map(
                    (option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.optionButton,
                          option.isSelected
                            ? option.isCorrect
                              ? styles.correctOption
                              : styles.incorrectOption
                            : selectedOptionIndex !==
                                  null &&
                                option.isCorrect
                            ? styles.correctOption
                            : null,
                        ]}
                        onPress={() =>
                          handleAnswer(
                            index
                          )
                        }
                        disabled={
                          showNextButton ||
                          option.disabled
                        }
                      >
                        <View
                          style={
                            styles.optionContent
                          }
                        >
                          <Text
                            style={
                              styles.optionText
                            }
                            maxFontSizeMultiplier={
                              1.2
                            }
                          >
                            {option.text}
                          </Text>
                          {showTranslit && (
                            <Text
                              style={
                                styles.transliterationText
                              }
                              maxFontSizeMultiplier={
                                1.2
                              }
                            >
                              {
                                option.transliteration
                              }
                            </Text>
                          )}
                          {option.isCorrect &&
                            isPlayingLottieOnSpeaker && (
                              <View
                                style={
                                  styles.lottieContainer
                                }
                              >
                                <LottieView
                                  ref={
                                    animationRef
                                  }
                                  source={require('./assets/Animation - 1718430107767.json')}
                                  autoPlay
                                  loop={
                                    false
                                  }
                                  style={
                                    styles.lottie
                                  }
                                />
                              </View>
                            )}
                          {showNextButton &&
                            option.isCorrect && (
                              <TouchableOpacity
                                style={
                                  styles.speakerIconContainer
                                }
                                onPress={() =>
                                  playSound(
                                    shuffledVerbs[
                                      currentIndex
                                    ]
                                      .audioFile,
                                    true
                                  )
                                }
                              >
                                <Image
                                  source={require('./speaker6.png')}
                                  style={
                                    styles.speakerIcon
                                  }
                                />
                              </TouchableOpacity>
                            )}
                        </View>
                      </TouchableOpacity>
                    )
                  )}
                </Animated.View>
                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    showNextButton
                      ? styles.activeButton
                      : styles.inactiveButton,
                  ]}
                  onPress={
                    handleNextCard
                  }
                  disabled={
                    !showNextButton
                  }
                >
                  <Text
                    style={
                      styles.nextButtonText
                    }
                    maxFontSizeMultiplier={
                      1.2
                    }
                  >
                    {ui.next}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {exerciseCompleted && (
              <CompletionMessageComponent
                correctAnswers={
                  correctAnswers
                }
                incorrectAnswers={
                  incorrectAnswers
                }
                handleOK={
                  handleExerciseCompletion
                }
                navigateToMenu={
                  navigateToMenu
                }
                correctAnswersPercentage={
                  percent
                }
                grade={grade}
                restartTask={
                  resetExercise
                }
              />
            )}
            {!exerciseCompleted && (
              <ExitConfirmationModalComponent
                visible={
                  exitConfirmationVisible
                }
                onCancel={
                  handleCancelExit
                }
                onConfirm={
                  handleConfirmExit
                }
              />
            )}
          </View>
        </ScrollView>
      )}
      <StatModalComponent
        visible={isStatModalVisible}
        onToggle={() =>
          setIsStatModalVisible(false)
        }
        statistics={statistics}
      />
      {isDescriptionModalVisible && (
        <TaskDescriptionModal6
          visible={true}
          onToggle={
            toggleDescriptionModal
          }
          language={language}
          dontShowAgain2={
            dontShowAgain2
          }
          onToggleDontShowAgain={
            handleToggleDontShowAgain2
          }
        />
      )}
    </>
  );
};
const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 10,
    paddingTop: 0,
    backgroundColor: '#AFC1D0',
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 0,
    marginTop: 0,
  },
logoImage:{
  width:74,
  height:74,
  marginLeft:8
},
  buttonContainer: {
    flexDirection: 'row',
    marginRight: 10,
  },
buttonImage:{
  width:38,
  height:38,
  marginLeft:8
},
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 30,
    color: '#2F4766',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  optionButton: {
    width: '49%',
    height: 80,
    padding: 15,
    backgroundColor: '#FFFDEF',
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  optionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 21,
    textAlign: 'center',
    color: '#152039',
    fontWeight: 'bold',
  },
  transliterationText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#CE6857',
    fontWeight: 'bold',
  },
  nextButton: {
    width: '80%',
    padding: hp('1.5%'),
    backgroundColor: '#2B3270',
    borderRadius: 10,
    textAlign: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nextButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeButton: {
    backgroundColor: '#1C3F60',
    textAlign: 'center',
  },
  inactiveButton: {
    backgroundColor: '#D9D9D9',
    textAlign: 'center',
  },
  correctOption: {
    backgroundColor: '#AFFFCA',
  },
  incorrectOption: {
    backgroundColor: '#FFBCBC',
  },
  ProgressBarcontainer: {
    width: '100%',
    marginBottom: 10,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '50%',
  },
  prtext: {
    fontSize: 12,
    color: 'white',
    textAlign: 'left',
    marginLeft: 15,
  },
  percentContainer: {
    alignItems: 'center',
    marginRight: 10,
  },
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
  remainingTasksContainer: {
    alignItems: 'center',
    marginRight: 10,
  },
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
  speakerIconContainer: {
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
  speakerIcon1: {
    width: 40,
    height: 40,
  },
  lottieContainer: {
    position: 'absolute',
    top: -10,
    left: -7,
    width: 32,
    height: 32,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  verbDetailsContainer: {
    height: 66,
    backgroundColor: '#83A3CD',
    marginBottom: 20,
    width: '100%',
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  verbDetailsHalf: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#6C8EBB',
    height: '100%',
  },
  verbDetailsLeft: {
    left: 0,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  verbDetailsRight: {
    left: '49%',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  verbDetailsContent: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    position: 'absolute',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  verbDetailsLeftContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verbDetailsRightContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 5,
  },
  verbDetailsHebrew: {
    fontSize: 18,
    color: '#FFFDEF',
    fontWeight: 'bold',
    marginBottom: -3,
  },
  verbDetailsTranslit: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#CE6857',
    backgroundColor: '#FFFDEF',
    borderRadius: 10,
    padding: 1,
    paddingLeft: 8,
    paddingRight: 8,
    marginTop: 5,
    marginBottom: 5,
  },
  verbDetailsRussian: {
    fontSize: 14,
    color: '#333652',
    fontWeight: 'bold',
    backgroundColor: '#FFFDEF',
    borderRadius: 10,
    padding: 5,
    paddingLeft: 8,
    paddingRight: 8,
  },
  lottieAnimation: {
    position: 'absolute',
    width: wp('90%'),
    height: hp('18%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerButton: {
    position: 'absolute',
    bottom: -5,
    right: -10,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
});
export default Exercise2;
