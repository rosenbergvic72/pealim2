import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, BackHandler, Platform } from 'react-native';
import verbsData from './verbs6RU.json';
import verbs1Data from './verbs1.json';
import ProgressBar from './ProgressBar';
import { Animated } from 'react-native';
import { Audio } from 'expo-av';
import soundsconj from './soundconj';
import sounds from './Soundss';
import CompletionMessage from './CompletionMessage';
import ExitConfirmationModal from './ExitConfirmationModal';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import TaskDescriptionModal6 from './TaskDescriptionModal8';
import StatModal8 from './StatModal8';
import { updateStatistics, getStatistics } from './stat';
import TypewriterTextRTL from './TypewriterTextRTL';
import TypewriterTextLTR from './TypewriterTextLTR';
import LottieView from 'lottie-react-native';
import SearchModal from './SearchModal';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VerbListModal2 from './VerbListModal2';
import shuffleArray from './utils/shuffleArray';

const FONT_REG = 'mt-regular';
const FONT_MED = 'mt-medium';
const FONT_BOLD = 'mt-bold';
const FONT_SEMIBOLD = 'mt-semibold';

const HEBREW_FONT = Platform.OS === 'android' ? 'mt-semibold' : 'mt-bold';
const HEBREW_FS = Platform.OS === 'android' ? 34 : 34;
const HEBREW_LINE_H = Platform.OS === 'android' ? 38 : 34;
const HEBREW_LINES = 2;


/* ===================== ONLY: Hebrew parts highlighting ===================== */

// Split word into: prefix (yellow), middle (default), suffix (green)
const renderWithColorRules = (word, { prefix = '', suffix = '' } = {}) => {
  const text = String(word || '');

  const safePrefix = Math.min(String(prefix || '').length, text.length);
  const safeSuffix = Math.min(
    String(suffix || '').length,
    Math.max(0, text.length - safePrefix)
  );

  const p = safePrefix ? text.slice(0, safePrefix) : '';
  const s = safeSuffix ? text.slice(text.length - safeSuffix) : '';
  const m = text.slice(safePrefix, text.length - safeSuffix);

  if (!p && !s) return text;

  return (
    <>
      {p ? <Text style={styles.prefixYellow}>{p}</Text> : null}
      {m}
      {s ? <Text style={styles.suffixGreen}>{s}</Text> : null}
    </>
  );
};

// Present tense verb word highlighting (prefix מ/נ; suffixes: ות, ים, ה, ת)
const renderPresentVerbWord = (verb) => {
  if (!verb) return '';

  const PRESENT_SUFFIXES_LOCAL = ['ות', 'ים', 'ה', 'ת']; // longer first
  let prefix = '';
  let rest = String(verb || '');

  // prefix מ / נ (nifal)
  // prefix מ (нун нифаля обрабатывается выше!)
if (rest.startsWith('מ')) {
  prefix = 'מ';
  rest = rest.slice(1);
}


  let suffix = '';
  for (const suf of PRESENT_SUFFIXES_LOCAL) {
    if (rest.endsWith(suf)) {
      suffix = suf;
      break;
    }
  }

  const base = suffix ? rest.slice(0, rest.length - suffix.length) : rest;
  const full = prefix + base + suffix;

  return renderWithColorRules(full, { prefix, suffix });
};

// Past tense: if word starts with ה (hitpael), highlight first ה + suffix
const renderPastWithHitpaelPrefixAndSuffix = (word, suffix) => {
  const w = String(word || '');
  const prefix = w.startsWith('ה') ? 'ה' : '';
  return renderWithColorRules(w, { prefix, suffix: suffix || '' });
};

// Main Hebrew rendering with rules by form index (1..36)
// - highlightEnabled=false -> raw text
// - isNifalForCurrentVerb=true -> optionally highlight initial נ for forms 1..24
const renderHebrewText = (
  hebrewtext,
  idxOrFormIndex,
  isBeVerb = false,
  highlightEnabled = true,
  isNifalForCurrentVerb = false
) => {
  const raw = String(hebrewtext || '');
  if (!highlightEnabled) return raw;

  const formIndex =
    typeof idxOrFormIndex === 'number' ? idxOrFormIndex : Number(idxOrFormIndex) || 0;

  // "להיות": no present (1–12) -> shift virtual positions
  const virtualPos = isBeVerb ? formIndex + 12 : formIndex;

 // ✅ применять "нун нифаля" только для форм 1..24
    const applyNifalNun = isNifalForCurrentVerb && virtualPos >= 1 && virtualPos <= 24;

    // ✅ надстройка: подсветить первую נ, НЕ ломая существующие правила
    const withOptionalNifalNun = (word, renderFn) => {
      const w = String(word || '');
      if (!w) return '';

      // Находим первую "реальную" букву иврита (игнорируя пробелы/RTL-маркеры/пунктуацию).
      const firstHebIdx = w.search(/[א-ת]/);

      if (applyNifalNun && firstHebIdx !== -1 && w[firstHebIdx] === 'נ') {
        const leading = w.slice(0, firstHebIdx);
        const rest = w.slice(firstHebIdx + 1);
        return (
          <>
            {leading}
            <Text style={styles.prefixYellow}>נ</Text>
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

  // 1–12 настоящее (только если не "быть")
    if (!isBeVerb && virtualPos >= 1 && virtualPos <= 12) {
      const parts = raw.split(' ').filter(Boolean);
      if (parts.length < 2) {
        return withOptionalNifalNun(parts[0] || '', (x) => renderPresentVerbWord(x));
      }
      const first = parts[0];
      const verb = parts[1];
      const tail = parts.slice(2).join(' ');
      return (
        <>
          {first}
          {' '}
          {withOptionalNifalNun(verb, (x) => renderPresentVerbWord(x))}
          {tail ? ` ${tail}` : ''}
        </>
      );
    }

    // 13–24 прошедшее: суффиксы + "ה" в начале (и теперь + optional נ)
    if (virtualPos === 13 || virtualPos === 14)
      return applyToVerbWord(raw, (w) =>
        withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'תי'))
      );

    if (virtualPos === 15 || virtualPos === 16)
      return applyToVerbWord(raw, (w) =>
        withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'ת'))
      );

      // ✅ 17: past 3ms (без суффикса) — важно, иначе нун не подсветится
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

    // 25–36: префиксы/суффиксы — ✅ только на слове-глаголе (последнем слове)
    if (virtualPos === 25 || virtualPos === 26)
      return applyToVerbWord(raw, (w) => renderWithColorRules(w, { prefix: 'א' }));

    if (virtualPos === 27)
      return applyToVerbWord(raw, (w) => renderWithColorRules(w, { prefix: 'ת' }));

    if (virtualPos === 28)
      return applyToVerbWord(raw, (w) => renderWithColorRules(w, { prefix: 'ת', suffix: 'י' }));

    if (virtualPos === 29)
      return applyToVerbWord(raw, (w) => renderWithColorRules(w, { prefix: 'י' }));

    if (virtualPos === 30)
      return applyToVerbWord(raw, (w) => renderWithColorRules(w, { prefix: 'ת' }));

    if (virtualPos === 31 || virtualPos === 32)
      return applyToVerbWord(raw, (w) => renderWithColorRules(w, { prefix: 'נ' }));

    if (virtualPos === 33 || virtualPos === 34)
      return applyToVerbWord(raw, (w) => renderWithColorRules(w, { prefix: 'ת', suffix: 'ו' }));

    if (virtualPos === 35 || virtualPos === 36)
      return applyToVerbWord(raw, (w) => renderWithColorRules(w, { prefix: 'י', suffix: 'ו' }));

    return raw;
  };

// Typewriter specifically for Hebrew (with highlighting)
const TypewriterHebrewHighlightedRTL = ({
  text,
  typingSpeed = 50,
  style,
  hebrewFormIndex,
  isBeVerb = false,
  highlightEnabled = true,
  isNifalForCurrentVerb = false,
  maxFontSizeMultiplier = 1.2,
}) => {
  const [displayed, setDisplayed] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    setDisplayed('');
    if (timerRef.current) clearTimeout(timerRef.current);

    const full = String(text || '');
    let i = 0;

    const tick = () => {
      i += 1;
      setDisplayed(full.slice(0, i));
      if (i < full.length) {
        timerRef.current = setTimeout(tick, typingSpeed);
      }
    };

    if (full.length > 0) timerRef.current = setTimeout(tick, typingSpeed);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, typingSpeed]);

  return (
    <Text style={style} maxFontSizeMultiplier={maxFontSizeMultiplier}>
      {renderHebrewText(displayed, hebrewFormIndex, isBeVerb, highlightEnabled, isNifalForCurrentVerb)}
    </Text>
  );
};

const Exercise8 = () => {
  const [verbs, setVerbs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayPairs, setDisplayPairs] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState(new Set());
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [exitConfirmationVisible, setExitConfirmationVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  // 0 — translit1: подсветка ВКЛ + транслит ВКЛ
  // 1 — translit2: подсветка ВКЛ + транслит ВЫКЛ
  // 2 — translit3: подсветка ВЫКЛ + транслит ВЫКЛ
  const [translitMode, setTranslitMode] = useState(0);
  // const [isDescriptionModalVisible, setIsDescriptionModalVisible] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [isStatModalVisible, setIsStatModalVisible] = useState(false);
  const [failureSound, setFailureSound] = useState(null);
  const [sound, setSound] = useState(null);
  const [correctSound, setCorrectSound] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [completionMessageVisible, setCompletionMessageVisible] = useState(false);
  const [blockAnimation] = useState(new Animated.Value(-100));
  const [backgroundColorAnim] = useState(new Animated.Value(0));
  const [isCorrectAnswerSelected, setIsCorrectAnswerSelected] = useState(false);
  const [inactiveButtons, setInactiveButtons] = useState(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [nextButtonEnabled, setNextButtonEnabled] = useState(false);
  const [completionMessageOpacity] = useState(new Animated.Value(0));
  const [showInfinitive, setShowInfinitive] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [isAnimationVisible, setIsAnimationVisible] = useState(false);
  const [currentAudioFile, setCurrentAudioFile] = useState(null); // Новый стейт для хранения текущего аудиофайла
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const navigation = useNavigation();
  const [progress, setProgress] = useState(0);
  const [totalConjugations, setTotalConjugations] = useState(36);
  const AnimatedText = Animated.createAnimatedComponent(Text);
  const modalCloseReasonRef = useRef(null); // 'start' | 'menu' | null


  const navigateToMenu = () => {
    console.log('Navigating to MenuEn, current state:', navigation.getState());
    navigation.reset({
      index: 0,
      routes: [{ name: 'Menu' }],
    });
  };

  const showCompletionMessageWithAnimation = () => {
    setCompletionMessageVisible(true);
    Animated.timing(completionMessageOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

   const getGrade = (percentage) => {
    if (percentage === 100) {
      return 'Исключительно! Безупречно! Ты не сделал ни единой ошибки!';
    } else if (percentage >= 90) {
      return 'Великолепно! Почти идеально, продолжай в том же духе!';
    } else if (percentage >= 80) {
      return 'Отлично! Ты очень хорошо справляешься!';
    } else if (percentage >= 70) {
      return 'Хорошо! Ты неплохо усвоил материал!';
    } else if (percentage >= 60) {
      return 'Достаточно хорошо! Есть стабильный прогресс!';
    } else if (percentage >= 50) {
      return 'Неплохо! Но есть куда стремиться.';
    } else if (percentage >= 40) {
      return 'Удовлетворительно! Старайся и всё получится!';
    } else if (percentage >= 30) {
      return 'Ты начинаешь улавливать главное, продолжай в том же духе!';
    } else if (percentage >= 20) {
      return 'Попробуй изменить стратегию обучения, это может помочь!';
    } else if (percentage >= 10) {
      return 'Тяжело, но не сдавайся! Продолжай практиковаться.';
    } else {
      return 'Требуется серьезная работа! Важно не унывать и продолжать учиться.';
    }
  };

  const shuffleArray = (array) => {
    let newArray = array.slice();
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

useEffect(() => {
  if (verbsData && verbsData.length > 0) {
    const uniqueVerbs = [...new Set(verbsData.map(item => item.infinitive))];
    const selectedInfinitive = uniqueVerbs[Math.floor(Math.random() * uniqueVerbs.length)];
    const allForms = verbsData.filter(verb => verb.infinitive === selectedInfinitive);

    setMainVerb(allForms[0]);
    setVerbListForModal(allForms);
    setIsVerbListVisible(true); // ОТКРЫВАЕМ только на старте
    setPendingVerb(null);
  }
}, []); // Только при монтировании, без зависимостей!




  const [language, setLanguage] = useState('ru'); // по умолчанию

  // 1. Функция выбора инфинитива
const getRandomInfinitive = () => {
  const uniqueVerbs = [...new Set(verbsData.map(item => item.infinitive))];
  return uniqueVerbs[Math.floor(Math.random() * uniqueVerbs.length)];
};

const [startInfinitive, setStartInfinitive] = useState(null);

useEffect(() => {
  if (verbsData && verbsData.length > 0) {
    const inf = getRandomInfinitive();
    setStartInfinitive(inf);
  }
}, [verbsData]);

useEffect(() => {
  if (!startInfinitive) return;
  const allForms = verbsData.filter(verb => verb.infinitive === startInfinitive);

  setMainVerb(allForms[0]);
  setVerbListForModal(allForms);
  setIsVerbListVisible(true);

  initializeExercise(allForms[0]);
  setPendingVerb(null);
}, [startInfinitive]);

  const [mainVerb, setMainVerb] = useState(null);
  

  const normalize = (s) => String(s || '').trim().toLowerCase();
  const normalizeBinyan = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    // убираем пробелы + обычный апостроф ' + типографский ’
    .replace(/[\s'’]/g, '');


  const isNifalBinyan = (b) => {
    const nb = normalizeBinyan(b);
    // English transliteration
    if (nb === 'nifal' || nb === 'nifaal') return true;
    // Hebrew spellings (with/without niqqud already stripped above)
    if (nb === 'נפעל' || nb === 'ניפעל' || nb === 'נפאל') return true;
    // Sometimes stored like 'נִפְעַל' etc.
    if (nb.includes('נפעל')) return true;
    return false;
  };


 // ✅ выкидываем никуд/таамим, чтобы "לִכְתּוֹב" и "לכתוב" матчились
const stripHebrewMarks = (s) =>
  String(s || '').replace(/[\u0591-\u05C7]/g, ''); // Hebrew diacritics

const normalizeHebrew = (s) =>
  stripHebrewMarks(s).replace(/\s+/g, ' ').trim(); // пробелы оставляем, но нормализуем

const isNifalForCurrentVerb = useMemo(() => {
  if (!mainVerb?.infinitive || !Array.isArray(verbs1Data)) return false;

  const inf = normalizeHebrew(mainVerb.infinitive);
  const tr = normalize(mainVerb.transliteration);
  const af = normalize(mainVerb.audioFile);

  let found =
    verbs1Data.find(v => normalizeHebrew(v?.hebrewVerb) === inf) || null;

  if (!found && tr) {
    found = verbs1Data.find(v => normalize(v?.transliteration) === tr) || null;
  }
  if (!found && af) {
    found = verbs1Data.find(v => normalize(v?.audioFile) === af) || null;
  }

    return isNifalBinyan(found?.binyan);

}, [mainVerb?.infinitive, mainVerb?.transliteration, mainVerb?.audioFile, verbs1Data]);

  const [verbListForModal, setVerbListForModal] = useState([]);
  const [isVerbListVisible, setIsVerbListVisible] = useState(true); // модалка в начале
  
  const initializeVerbList = (lang, mainVerb, setVerbListForModal) => {
    const langMap = {
      ru: 'russian',
      en: 'english',
      fr: 'french',
      es: 'spanish',
      pt: 'portu',
      ar: 'arabic',
      am: 'amharic',
    };
    const langKey = langMap[lang] || 'russian';
  
    if (!mainVerb) {
      console.warn('⚠️ mainVerb is undefined');
      return;
    }
  
    console.log('🎯 Используем mainVerb:', mainVerb.infinitive, mainVerb[langKey]);
  
    const allForms = verbsData.filter((v) => {
    const sameInf = v.infinitive === mainVerb.infinitive;
    const sameTranslation = v[langKey]?.toLowerCase().trim() === mainVerb[langKey]?.toLowerCase().trim();
    return sameInf && (sameTranslation || !mainVerb[langKey]);
  });
  
  
    console.log('📦 Найдено форм:', allForms.length);
    setVerbListForModal(allForms);
  };
  
  
   
  useEffect(() => {
    const initialize = async () => {
      const lang = await AsyncStorage.getItem('language');
      const hidden = await AsyncStorage.getItem('exercise8_description_hidden');
      setLanguage(lang || 'ru');
      setDontShowAgain8(hidden === 'true');
      setLanguageLoaded(true);
  
    
    };
    initialize();
  }, []); // Только при самом первом монтировании


  
  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);
  
    const [dontShowAgain8, setDontShowAgain8] = useState(false);
  
    
  
    const [languageLoaded, setLanguageLoaded] = useState(false);

  
  
  
  
  const handleToggleDontShowAgain8 = async () => {
    const newValue = !dontShowAgain8;
    setDontShowAgain8(newValue);
    await AsyncStorage.setItem('exercise8_description_hidden', newValue ? 'true' : '');
    console.log('📌 Клик по чекбоксу. Было:', dontShowAgain8, 'Станет:', !dontShowAgain8);
  };

  const initializeExercise = (selectedVerb) => {
    let selectedVerbs;
 if (selectedVerb) {
  const base = verbsData
    .filter(verb => verb.infinitive === selectedVerb.infinitive)
    .map((v, i) => ({ ...v, hebrewFormIndex: i + 1 })); // ✅ индекс ДО shuffle

  selectedVerbs = shuffleArray(base);
} else {
  if (verbsData && verbsData.length > 0) {
    const groupedByInfinitive = verbsData.reduce((acc, verb) => {
      const { infinitive } = verb;
      if (!acc[infinitive]) acc[infinitive] = [];
      acc[infinitive].push(verb);
      return acc;
    }, {});

    const infinitives = Object.keys(groupedByInfinitive);
    const randomInfinitive = infinitives[Math.floor(Math.random() * infinitives.length)];

    const base = (groupedByInfinitive[randomInfinitive] || [])
      .map((v, i) => ({ ...v, hebrewFormIndex: i + 1 })); // ✅ индекс ДО shuffle

    selectedVerbs = shuffleArray(base);
  }
}

  
    setTotalConjugations(selectedVerbs[0].infinitive === 'להיות' ? 24 : 36);
    setVerbs(selectedVerbs);
    setProgress(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setCorrectAnswers(new Set());
    setInactiveButtons(new Set());
    setSelectedAnswer(null);
    setIsCorrectAnswerSelected(false);
    setNextButtonEnabled(false);
    setCompletionMessageVisible(false);
    setExerciseCompleted(false);
    setCurrentIndex(0);
    setShowInfinitive(false);
    setShowTranslation(false);
    setCurrentAudioFile(null);
  };

  // useEffect(() => {
  //   initializeExercise();
  // }, []);

useEffect(() => {
  if (!verbs || verbs.length === 0) return;

  const currentVerb = verbs[currentIndex];
  if (!currentVerb) return;

  const currentGender = currentVerb.gender;
  const MAX_INCORRECT = 5;           // как и было: 1 правильный + 5 неправильных = 6 кнопок
  const MIN_SAME_GENDER_TOTAL = 3;   // минимум 3 варианта с тем же gender, включая правильный

  // Берём варианты только для текущего инфинитива
  const sameInfinitiveVerbs = verbs.filter(
    v => v.infinitive === currentVerb.infinitive
  );

  // 1) Пул кандидатов для неправильных:
  //    - есть russiantext
  //    - отличается от правильного (по русскому тексту)
  //    - отличается по hebrewtext (убираем совпадающие формы типа 3 ж. / 2 м. будущего)
  //    - уникальные по russiantext
  const poolMap = new Map(); // key = russiantext.trim()

  for (const v of sameInfinitiveVerbs) {
    if (!v.russiantext) continue;

    if (v.russiantext === currentVerb.russiantext) continue;
    if (v.hebrewtext === currentVerb.hebrewtext) continue;

    const key = v.russiantext.trim();
    if (!poolMap.has(key)) {
      poolMap.set(key, v); // первый встретившийся вариант этой фразы
    }
  }

  const uniquePool = Array.from(poolMap.values());

  // 2) Разделяем кандидатов по gender
  const sameGenderPool   = uniquePool.filter(v => v.gender === currentGender);
  const otherGenderPool  = uniquePool.filter(v => v.gender !== currentGender);

  // Сколько НУЖНО неправильных с тем же gender (минимум 2, если есть столько)
  const needSameGenderIncorrect = Math.max(0, MIN_SAME_GENDER_TOTAL - 1); // 3 всего - 1 правильный = 2

  const shuffledSameGender  = shuffleArray(sameGenderPool);
  const sameGenderIncorrect = shuffledSameGender.slice(
    0,
    Math.min(needSameGenderIncorrect, MAX_INCORRECT, sameGenderPool.length)
  );

  const remainingSlots = MAX_INCORRECT - sameGenderIncorrect.length;

  const shuffledOtherGender = shuffleArray(otherGenderPool);
  const otherGenderIncorrect = shuffledOtherGender.slice(0, remainingSlots);

  const incorrectAnswersVerbs = [
    ...sameGenderIncorrect,
    ...otherGenderIncorrect,
  ];

  const incorrectAnswers = incorrectAnswersVerbs.map(v => ({
    russiantext: v.russiantext,
    gender: v.gender,
  }));

  // 3) Правильный + неправильные и защита от дублей по russiantext
  const allCandidates = [
    { russiantext: currentVerb.russiantext, gender: currentVerb.gender },
    ...incorrectAnswers,
  ];

  const answersMap = new Map();
  const dedupedAnswers = [];
  for (const a of allCandidates) {
    const key = (a.russiantext || '').trim();
    if (!key) continue;
    if (!answersMap.has(key)) {
      answersMap.set(key, true);
      dedupedAnswers.push(a);
    }
  }

  const answers = shuffleArray(dedupedAnswers);

  // Пары для рендера
  setDisplayPairs(
    answers.map(answer => ({
      ...answer,
      hebrewtext: currentVerb.hebrewtext,
      translit: currentVerb.translit,
    }))
  );

  setShowInfinitive(false);
  setCurrentAudioFile(currentVerb.mp3);

  // Автозвук только если модалка закрыта ради старта упражнения (а не при уходе в меню)
  if (!isVerbListVisible && modalCloseReasonRef.current !== 'menu') {
    playAudio(currentVerb.mp3);
    if (modalCloseReasonRef.current === 'start') {
      modalCloseReasonRef.current = null;
    }
  }
}, [currentIndex, verbs, isVerbListVisible]);








  useEffect(() => {
    setShowTranslation(false);
  }, [currentIndex]);

  const handleAnswer = (index) => {
    if (exerciseCompleted) return;

    const selectedAnswer = displayPairs[index];
    if (selectedAnswer.russiantext === verbs[currentIndex].russiantext) {
      handleCorrectAnswer(index, verbs[currentIndex].mp3);
    } else {
      handleIncorrectAnswer(index);
    }
  };

  const handleCorrectAnswer = (index, audioFile) => {
    setCorrectCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= totalConjugations) {
        handleExerciseCompletion();
        setExerciseCompleted(true);
        setCompletionMessageVisible(true);
        Animated.timing(completionMessageOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
      setProgress((newCount / totalConjugations) * 100);
      return newCount;
    });

    setCorrectAnswers((prev) => new Set(prev).add(selectedAnswer));
    setIsCorrectAnswerSelected(true);
    setSelectedAnswer(index);
    playCorrectAnswerSound(audioFile).then(() => {
      if (soundEnabled) {
        setIsAnimationVisible(true);
      }
    });
    changeBackgroundColor(true);

    const pauseDuration = soundEnabled ? 1000 : 200;
    setTimeout(() => {
      setNextButtonEnabled(true);
    }, pauseDuration);
  };

  const handleIncorrectAnswer = (index) => {
    if (exerciseCompleted) return;

    setIncorrectCount((prev) => prev + 1);
    setSelectedAnswer(index);
    setInactiveButtons((prev) => new Set(prev).add(index));
    playFailureSound();
    changeBackgroundColor(false);
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
    if (verbs[currentIndex]) {
      fadeIn();
    }
  }, [verbs[currentIndex]]);

  useEffect(() => {
    if (!completionMessageVisible && displayPairs.length > 0) {
      blockAnimation.setValue(500);
      Animated.timing(blockAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [displayPairs, completionMessageVisible]);

  useEffect(() => {
    loadFailureSound();
    return () => {
      failureSound?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    return () => {
      correctSound?.unloadAsync();
    };
  }, [correctSound]);

  const playCorrectAnswerSound = async (audioKey) => {
    if (!soundEnabled) return;

    try {
      if (correctSound) {
        await correctSound.unloadAsync();
      }

      const audioFile = soundsconj[audioKey];
      if (!audioFile) {
        console.error(`Audio file for key ${audioKey} not found.`);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
      setCorrectSound(newSound);

      await newSound.playAsync();
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  };

  const loadFailureSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('./assets/sounds/failure.mp3'));
      setFailureSound(sound);
    } catch (error) {
      console.error("Couldn't load failure sound:", error);
    }
  };

  const playAudio = async (audioFileName) => {
    if (!soundEnabled) return;
    const audioFile = soundsconj[audioFileName];
    if (!audioFile) {
      console.error(`Audio file ${audioFileName} not found.`);
      return;
    }
    try {
      if (sound && typeof sound.unloadAsync === 'function') {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
      setSound(newSound);
      setIsAnimationVisible(true);

      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isPlaying) {
          setIsAnimationVisible(false);
        }
      });
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  };

  const playAudioAlways = async (audioFileName) => {
    const audioFile = soundsconj[audioFileName];
    if (!audioFile) {
      console.error(`Audio file ${audioFileName} not found.`);
      return;
    }
    try {
      if (sound && typeof sound.unloadAsync === 'function') {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
      setSound(newSound);
      setIsAnimationVisible(true);

      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isPlaying) {
          setIsAnimationVisible(false);
        }
      });
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

  const playInfinitiveAudio = async (audioFileName) => {
    try {
      const fileNameKey = audioFileName.replace('.mp3', '');
      const audioFile = sounds[fileNameKey];

      if (!audioFile) {
        console.error(`Audio file ${audioFileName} not found.`);
        return;
      }

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

  const playCurrentAudio = async () => {
    if (!currentAudioFile) return;
    await playAudioAlways(currentAudioFile);
  };

  const getButtonStyle = (index) => {
    let style = [styles.button];
    if (inactiveButtons.has(index)) {
      style.push(styles.deactivatedButton);
    }
    if (selectedAnswer === index) {
      if (displayPairs[index].russiantext === verbs[currentIndex].russiantext) {
        style.push(styles.correctButton);
      } else {
        style.push(styles.wrongButton);
      }
    }
    return style;
  };

  const getImageForGender = (gender) => {
    switch (gender) {
      case 'man':
        return require('./man1.png');
      case 'woman':
        return require('./woman1.png');
      case 'men':
        return require('./men1.png');
      case 'women':
        return require('./women1.png');
      default:
        return null;
    }
  };

  const toggleDescriptionModal = () => {
    setDescriptionModalVisible((prev) => !prev);
  };

  const handleButton3Press = async () => {
    const exerciseId = 'exercise8';
    try {
      const stats = await getStatistics(exerciseId);
      setStatistics(stats);
      setIsStatModalVisible(true);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      setStatistics(null);
      setIsStatModalVisible(false);
    }
  };

  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
    if (soundEnabled && sound) {
      sound.setVolumeAsync(0);
    } else if (!soundEnabled && sound) {
      sound.setVolumeAsync(1);
    }
  };

  const handleTranslitToggle = () => {
    setTranslitMode((m) => (m + 1) % 3);
  };

  const showTranslit = translitMode === 0;
  const highlightEnabled = translitMode !== 2;


  const handleBackButtonPress = () => {
    setExitConfirmationVisible(true);
    return true;
  };

// 1) Пока открыт список форм — «Назад» уходит в меню/назад, ничего не блокируем
useFocusEffect(
  useCallback(() => {
    if (!isVerbListVisible) return; // активируем только при открытой модалке

    const onBackPress = () => {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate('Menu');
      return true;
    };

    const bh = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    // Ничего не вешаем на beforeRemove, чтобы не мешать выходу
    return () => {
      bh.remove();
    };
  }, [isVerbListVisible, navigation])
);

// 2) Когда модалка закрыта (идёт упражнение) — блокируем «Назад» и показываем модалку подтверждения
useFocusEffect(
  useCallback(() => {
    if (isVerbListVisible) return; // активируем только во время упражнения

    const onBackPress = () => {
      if (exitConfirmationVisible) return false;
      setExitConfirmationVisible(true);
      return true; // блокируем pop
    };

    const bh = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (exitConfirmationVisible) return;
      e.preventDefault();
      setExitConfirmationVisible(true);
    });

    return () => {
      bh.remove();
      unsubscribe();
    };
  }, [isVerbListVisible, exitConfirmationVisible, navigation])
);
      
        useEffect(() => {
            navigation.setOptions({
              headerLeft: () => null, // Убирает кнопку "Назад" в заголовке
            });
          }, [navigation]);
    
          const handleConfirmExit = () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Menu' }],
            });
          };
    
      const handleCancelExit = () => {
        setExitConfirmationVisible(false);
      };

  const handleExerciseCompletion = async () => {
    const exerciseId = 'exercise8';
    const currentScore = parseFloat(progressPercent.toFixed(2));
    await updateStatistics(exerciseId, currentScore);

    setExerciseCompleted(true);
    setTimeout(() => {
      setCompletionMessageVisible(true);
      Animated.timing(completionMessageOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 600);
  };

const resetExercise = () => {
  setCorrectCount(0);
  setIncorrectCount(0);
  setProgress(0);
  setExerciseCompleted(false);
  setCurrentIndex(0);
  setCorrectAnswers(new Set());

  // Новый запуск — открываем выбор глагола заново
  const uniqueVerbs = [...new Set(verbsData.map(item => item.infinitive))];
  const selectedInfinitive = uniqueVerbs[Math.floor(Math.random() * uniqueVerbs.length)];
  const allForms = verbsData.filter(verb => verb.infinitive === selectedInfinitive);

  setMainVerb(allForms[0]);
  setVerbListForModal(allForms);
  setIsVerbListVisible(true);
  setPendingVerb(null);
};

  // const [SearchModalVisible, setSearchModalVisible] = useState(false);

  const handleSearchButtonPress = () => {
  setIsSearchModalVisible(true);
};


  const progressPercent = (correctCount / (correctCount + incorrectCount)) * 100 || 0;

  const handleNextPress = () => {
    if (!exerciseCompleted) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % verbs.length);
      setNextButtonEnabled(false);
      setInactiveButtons(new Set());
      setSelectedAnswer(null);
      setIsCorrectAnswerSelected(false);
      setShowInfinitive(false);
      setShowTranslation(false);
    }
  };

  const handleContinue = async () => {
    if (!exerciseCompleted) {
      await handleExerciseCompletion();
    }
    setCompletionMessageVisible(false);
    resetExercise();
  };

  const handleSearchToggle = () => {
    setIsSearchModalVisible((prev) => !prev);
  };

 const [pendingVerb, setPendingVerb] = useState(null);

const [initializedBySearch, setInitializedBySearch] = useState(false);

const handleSelectVerb = (verb) => {
  setPendingVerb(verb);
  const allForms = verbsData.filter(item => item.infinitive === verb.infinitive);
  // важно: обновляем mainVerb, иначе isNifalForCurrentVerb останется от прошлого глагола
  setMainVerb(allForms[0] || verb);
  setVerbListForModal(allForms);
  setIsVerbListVisible(true);
  setIsSearchModalVisible(false); // <-- главное
};



const handleStartExercise = () => {
  const chosenVerb = pendingVerb || mainVerb;
  if (!chosenVerb) return;
  // важно: фиксируем текущий глагол для вычисления isNifalForCurrentVerb
  setMainVerb(chosenVerb);
  modalCloseReasonRef.current = 'start'; // ← хотим звук
  initializeExercise(chosenVerb);
  setIsVerbListVisible(false);
  setPendingVerb(null);
};





const [currentVerb, setCurrentVerb] = useState({
    infinitive: '',
    russian: '',
    transliteration: ''
  });

   return (
  <>
    {isVerbListVisible && (
<VerbListModal2
  visible={isVerbListVisible}
  language={language}
  verbs={verbListForModal}
  onStartExercise={handleStartExercise}
  onClose={() => {
    modalCloseReasonRef.current = 'menu'; // ← звука НЕ хотим
    // дальше ваш переход:
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Menu');
  }}
/>



      
    )}

    {!isVerbListVisible && (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.container}>
      <View style={styles.topBar}>
        <Animated.Image source={require('./VERBIFY.png')} style={[styles.logoImage, { opacity: fadeAnim }]} />
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleSoundToggle}>
            <Animated.Image
              source={soundEnabled ? require('./SoundOn.png') : require('./SoundOff.png')}
              style={[styles.buttonImage, { opacity: fadeAnim }]}
            />
          </TouchableOpacity>
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

          {/* <TouchableOpacity onPress={handleButton3Press}>
            <Animated.Image source={require('./stat.png')} style={[styles.buttonImage, { opacity: fadeAnim }]} />
            <StatModal8 visible={isStatModalVisible} onToggle={() => setIsStatModalVisible(false)} statistics={statistics} />
          </TouchableOpacity> */}

<TouchableOpacity onPress={handleButton3Press}>
  <Animated.Image
    source={require('./stat.png')}
    style={[styles.buttonImage, { opacity: fadeAnim }]}
  />
</TouchableOpacity>


          <TouchableOpacity onPress={toggleDescriptionModal}>
            <Animated.Image source={require('./question.png')} style={[styles.buttonImage, { opacity: fadeAnim }]} />
            <TaskDescriptionModal6
              visible={isDescriptionModalVisible}
  onToggle={toggleDescriptionModal}
  language={language}
  dontShowAgain8={dontShowAgain8}
  onToggleDontShowAgain={handleToggleDontShowAgain8}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSearchToggle}>
            <Animated.Image source={require('./search1.png')} style={[styles.buttonImage, { opacity: fadeAnim }]} />
          </TouchableOpacity>
        </View>
      </View>
      <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
        <View style={styles.textContainer}>
          <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>ВЕРНО: {correctCount}</Text>
                    <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>НЕВЕРНО: {incorrectCount}</Text>
        </View>
        <View style={styles.remainingTasksContainer}>
          <Text style={styles.remainingTasksText} maxFontSizeMultiplier={1.2}>{totalConjugations - currentIndex}</Text>
        </View>
        <Animated.View style={[styles.percentContainer, { backgroundColor, borderRadius: 10 }]}>
          <Text style={styles.percentText} maxFontSizeMultiplier={1.2}>{progressPercent.toFixed(2)}%</Text>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}>
        <ProgressBar progress={progress} totalExercises={100} />
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>СПРЯГАЕМ ГЛАГОЛ</Animated.Text>

      <View style={styles.verbContainerWrapper}>
        <Animated.View style={[styles.verbContainer, { opacity: fadeAnim }]}>
          {verbs[currentIndex] && (
            <>
              <Text style={styles.verbText} maxFontSizeMultiplier={1.2}>{verbs[currentIndex].infinitive}</Text>
              {/* transliteration row (keeps height) */}
              <Text style={styles.verbTextTr} maxFontSizeMultiplier={1.2}>
                {verbs[currentIndex].transliteration || ''}
              </Text>
              <Text style={styles.verbTextRu} maxFontSizeMultiplier={1.2}>{verbs[currentIndex].russian}</Text>
              <TouchableOpacity onPress={() => playInfinitiveAudio(verbs[currentIndex].audioFile)} style={styles.audioButton1}>
                <Image source={require('./speaker3.png')} style={styles.audioIcon1} />
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>

      <View style={styles.hebrewCardContainer}>
        {verbs[currentIndex] && (
          <View style={styles.hebrewCard}>
            {isAnimationVisible && (
              <LottieView
                source={require('./assets/Animation - 1718430107767.json')}
                autoPlay
                loop={false}
                style={styles.lottie}
                onAnimationFinish={() => setIsAnimationVisible(false)}
              />
            )}
       <View style={styles.hebrewTextBox}>
  <TypewriterHebrewHighlightedRTL
    text={verbs[currentIndex].hebrewtext}
    typingSpeed={50}
    style={[
      styles.hebrewText,
      !showTranslit && { transform: [{ translateY: 14 }] },
    ]}
    hebrewFormIndex={verbs[currentIndex].hebrewFormIndex}
    isBeVerb={String(mainVerb?.infinitive || '') === 'להיות'}
    highlightEnabled={highlightEnabled}
    isNifalForCurrentVerb={isNifalForCurrentVerb}
  />
</View>



{/* translit row (keeps height + no typing animation) */}
              <View style={styles.translitRow}>
                <Text style={[styles.translitText, !showTranslit && styles.hiddenRow]} maxFontSizeMultiplier={1.2}>
                  {verbs[currentIndex].translit || ''}
                </Text>
              </View>
            <TouchableOpacity onPress={playCurrentAudio} style={styles.audioButton}>
              <Image source={require('./speaker3.png')} style={styles.audioIcon} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Animated.View style={{ transform: [{ translateY: blockAnimation }] }}>
        <View style={styles.answerContainer}>
          {displayPairs.map((pair, index) => (
            <TouchableOpacity
              key={index}
              style={getButtonStyle(index)}
              onPress={() => handleAnswer(index)}
              disabled={inactiveButtons.has(index) || isCorrectAnswerSelected}
            >
              <Text
                style={[
                  styles.text,
                  styles.russianText,
                  inactiveButtons.has(index) ? styles.deactivatedButtonText : {},
                ]} maxFontSizeMultiplier={1.2}
              >
                {pair.russiantext}
              </Text>
              {pair.gender && <Image source={getImageForGender(pair.gender)} style={styles.iconStyle} />}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <TouchableOpacity
        style={[styles.nextButton, nextButtonEnabled ? styles.nextButtonActive : styles.nextButtonInactive]}
        onPress={handleNextPress}
        disabled={!nextButtonEnabled}
      >
        <Text style={styles.nextButtonText} maxFontSizeMultiplier={1.2}>СЛЕДУЮЩИЙ</Text>
      </TouchableOpacity>

      {completionMessageVisible && (
        <Animated.View style={[styles.completionMessageContainer, { opacity: completionMessageOpacity }]}>
          <CompletionMessage
            handleOK={handleContinue}
            navigateToMenu={() => {
              setCompletionMessageVisible(false);
              navigation.navigate('Menu');
            }}
            correctAnswers={correctCount}
            incorrectAnswers={incorrectCount}
            correctAnswersPercentage={progressPercent.toFixed(2)}
            grade={getGrade(progressPercent)}
            restartTask={resetExercise}
          />
        </Animated.View>
      )}

      <ExitConfirmationModal visible={exitConfirmationVisible} onCancel={handleCancelExit} onConfirm={handleConfirmExit} />
      <SearchModal visible={isSearchModalVisible} onToggle={handleSearchToggle} onSelectVerb={handleSelectVerb} />
      </View>
    </ScrollView>
   )}

    {/* Модалки должны быть вне ScrollView/TouchableOpacity */}
    <StatModal8
      visible={isStatModalVisible}
      onToggle={() => setIsStatModalVisible(false)}
      statistics={statistics}
    />

    <TaskDescriptionModal6
      visible={isDescriptionModalVisible}
      onToggle={toggleDescriptionModal}
      language={language}
      dontShowAgain8={dontShowAgain8}
      onToggleDontShowAgain={handleToggleDontShowAgain8}
    />
  </>
);
};

const styles = StyleSheet.create({

  scrollViewContent: {
  flexGrow: 1,
  justifyContent: 'flex-start',
  alignItems: 'center',
  paddingTop: 0, // можно 0..6
},


  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#AFC1D0',
    height: '100%',
    width: '100%',
    

  },

  // containerbox: {
  //   flex: 1,
  //   backgroundColor: "#AFC1D0",
  //   justifyContent: 'center',
  //   padding: 10,
  // },

  completionMessageContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 5,
    
  },
  logoImage: {
    width: 90,
    height: 90,
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginRight: 10,
  },
  buttonImage: {
    width: 44,
    height: 44,
    marginLeft: 10,
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
  ProgressBarcontainer: {
    width: '100%',
    marginBottom: 5
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 5,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: 40,
    width: '100%',
  },
  verbText: {
    fontSize: 15,
    color: '#FF5757',
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 10,
  },
  verbTextTr: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  verbTextRu: {
    fontSize: 14,
    color: '#003882',
    textAlign: 'center',
  },
  verbTextActive: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
  },
  translationButton: {
    backgroundColor: '#6C8EBB',
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 5,
    width: 120,
    alignItems: 'center',
  },
  audioIcon: {
    width: 26,
    height: 26,
  },
  audioIcon1: {
    width: 22,
    height: 22,
    marginRight: 5,
  },
  audioButton: {
    position: 'absolute',
    bottom: 10,
    right: 14,
  },
  hebrewCardContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  hebrewCard: {
    
    backgroundColor: '#FFFDEF',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
hebrewTextBox: {
  height: HEBREW_LINE_H * HEBREW_LINES,
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
},
    hebrewText: {
  fontSize: HEBREW_FS,
  fontFamily: HEBREW_FONT,
  color: '#152039',
  textAlign: 'center',
  lineHeight: HEBREW_LINE_H,
  ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
},
  translitText: {
    fontSize: 20,
    color: '#FF5757',
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  translitRow: {
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  hiddenRow: {
    opacity: 0,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
    width: '100%',
  },
  answerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    width: '48%',
    marginVertical: 5,
    padding: 5,
    backgroundColor: '#D1E3F1',
    borderRadius: 10,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexWrap: 'wrap',
  },
  russianButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  russianText: {
    textAlign: 'left',
    flex: 1,
    marginLeft: 3,
    color: '#152039',
  },
  iconStyle: {
    width: 45,
    height: 45,
  },
  selectedButton: {
    backgroundColor: '#AFFFCA',
  },
  correctButton: {
    backgroundColor: '#AFFFCA',
  },
  wrongButton: {
    backgroundColor: '#FFBCBC',
  },
  deactivatedButton: {
    backgroundColor: '#E0E0E0',
  },
  deactivatedButtonText: {
    color: '#A0A0A0',
  },
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
  nextButton: {
    width: '80%',
    // height: 40,
    padding: hp('1.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nextButtonActive: {
    backgroundColor: '#6C8EBB',
  },
  nextButtonInactive: {
    backgroundColor: '#E0E0E0',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lottie: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
  },

  // подсветка частей слова (иврит)
 prefixYellow: { color: '#00a2ffff', fontFamily: HEBREW_FONT },
suffixGreen: { color: '#ff3ab3ff', fontFamily: HEBREW_FONT },
});

export default Exercise8;
