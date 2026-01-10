import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, BackHandler } from 'react-native';
import verbsData from './verbs6RU.json';
import verbs1Data from './verbs1.json';
import ProgressBar from './ProgressBar';
import { Animated } from 'react-native';
import { Audio } from 'expo-av';
import soundsconj from './soundconj';
import sounds from './Soundss';
import CompletionMessageAr from './CompletionMessageAr';
import ExitConfirmationModal from './ExitConfirmationModalAr';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import TaskDescriptionModal6 from './TaskDescriptionModal8';
import StatModal8Ar from './StatModal8Ar';
import { updateStatistics, getStatistics } from './stat';
import TypewriterTextRTL from './TypewriterTextRTL';
import TypewriterTextLTR from './TypewriterTextLTR';
import LottieView from 'lottie-react-native';
import SearchModalAr from './SearchModalAr';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VerbListModal2 from './VerbListModal2';
import shuffleArray from './utils/shuffleArray';
/* ===================== ONLY: Hebrew parts highlighting ===================== */

// Remove niqqud + cantillation marks, keep only letters
const stripHebrewMarks = (s) => String(s || '').replace(/[\u0591-\u05C7]/g, '');
const normHeb = (s) => stripHebrewMarks(s).replace(/\s+/g, ' ').trim();

const normalizeBinyan = (s) =>
  stripHebrewMarks(String(s || ''))
    .trim()
    .toLowerCase()
    // remove spaces + apostrophes + dashes (straight and curly)
    .replace(/[\s'’\-–—]/g, '');

const isNifalFromBinyan = (b) => {
  const nb = normalizeBinyan(b);
  // English transliterations
  if (nb === 'nifal' || nb === 'nifaal') return true;
  // Hebrew spellings
  if (nb.includes('נפעל') || nb.includes('ניפעל') || nb.includes('נפאל')) return true;
  return false;
};

const normKey = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

// Find first Hebrew letter in a word; if it is 'נ', paint it with prefixYellow
const renderOptionalNifalNun = (word, enabled) => {
  const w0 = String(word || '');
  if (!enabled) return w0;

  // If there are RTL/LTR marks or spaces, keep them as "leading"
  const cleanedLeading = w0.replace(/^[\s\u200E\u200F\u202A-\u202E\u2066-\u2069]+/, '');
  const leading = w0.slice(0, w0.length - cleanedLeading.length);
  const w = cleanedLeading;

  // find first real Hebrew letter in the remaining string
  const m = w.match(/[א-ת]/);
  if (!m || typeof m.index !== 'number') return w0;

  const i = m.index;
  const firstHeb = w[i];
  if (firstHeb !== 'נ') return w0;

  const before = w.slice(0, i);
  const after = w.slice(i + 1);

  return (
    <>
      {leading}
      {!!before && <Text>{before}</Text>}
      <Text style={styles.prefixYellow}>נ</Text>
      {!!after && <Text>{after}</Text>}
    </>
  );
};

// Safe segment highlighter: prefix (yellow) + middle + suffix (green)
const renderWithColorRules = (word, { prefix = '', suffix = '' } = {}) => {
  const text = String(word || '');
  if (!text) return '';

  const safePrefix = Math.min(String(prefix || '').length, text.length);
  const safeSuffix = Math.min(
    String(suffix || '').length,
    Math.max(0, text.length - safePrefix)
  );

  const realPrefix = safePrefix > 0 ? text.slice(0, safePrefix) : '';
  const middle = text.slice(safePrefix, text.length - safeSuffix);
  const realSuffix = safeSuffix > 0 ? text.slice(text.length - safeSuffix) : '';

  return (
    <>
      {!!realPrefix && <Text style={styles.prefixYellow}>{realPrefix}</Text>}
      {!!middle && <Text>{middle}</Text>}
      {!!realSuffix && <Text style={styles.suffixGreen}>{realSuffix}</Text>}
    </>
  );
};

// ✅ Present: apply highlighting ONLY to the verb word (2nd word in 2-word phrases)
// Rules: prefix מ (single letter) + suffixes (ות/ים/ה/ת)
const renderPresentVerbWord = (verbWord) => {
  const verb = String(verbWord || '');
  if (!verb) return '';

  const PRESENT_SUFFIXES_LOCAL = ['ות', 'ים', 'ה', 'ת'];

  let prefix = '';
  let rest = verb;

  if (rest.startsWith('מ') || rest.startsWith('נ')) {
    prefix = rest[0];
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

// ✅ Past: if word starts with ה — highlight first ה; suffix highlighted too
const renderPastWithHitpaelPrefixAndSuffix = (word, suffix) => {
  const w = String(word || '');
  // For hitpa'el (ה...) and nif'al (נ...) highlight first letter as prefix
  const prefix = w.startsWith('ה') ? 'ה' : (w.startsWith('נ') ? 'נ' : '');
  return renderWithColorRules(w, { prefix, suffix: suffix || '' });
};

// Main dispatcher by form index 1..36 (or 1..24 for להיות with virtual shift)
const renderHebrewText = (
  hebrewtext,
  formIndex,
  isBeVerb = false,
  highlightEnabled = true,
  isNifalForCurrentVerb = false
) => {
  const raw = String(hebrewtext || '');
  if (!highlightEnabled) return raw;

  const idx = Number(formIndex) || 0;
  const virtualPos = isBeVerb ? idx + 12 : idx;

  // apply "nifal nun" only for 1..24
  const applyNifalNun = !!isNifalForCurrentVerb && virtualPos >= 1 && virtualPos <= 24;

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

  // ✅ Apply NIF'AL nun highlighting to the VERB word itself:
  // If the first Hebrew letter is נ, paint it, then pass the remaining string to renderFn.
  const withOptionalNifalNunWord = (word, renderFn) => {
    const w0 = String(word || '');
    if (!w0) return renderFn ? renderFn('') : '';
    if (!applyNifalNun) return renderFn ? renderFn(w0) : w0;

    // strip leading spaces + bidi marks for detection (keep them for output)
    const cleaned = w0.replace(/^[\s\u200E\u200F\u202A-\u202E\u2066-\u2069]+/, '');
    const leading = w0.slice(0, w0.length - cleaned.length);

    const mm = cleaned.match(/[א-ת]/);
    if (!mm || typeof mm.index !== 'number') return renderFn ? renderFn(w0) : w0;

    const i = mm.index;
    const firstHeb = cleaned[i];
    if (firstHeb !== 'נ') return renderFn ? renderFn(w0) : w0;

    const before = cleaned.slice(0, i);
    const rest = cleaned.slice(i + 1);

    return (
      <>
        {leading}
        {!!before && <Text>{before}</Text>}
        <Text style={styles.prefixYellow}>נ</Text>
        {renderFn ? renderFn(rest) : rest}
      </>
    );
  };

  // Helper: for NIF'AL present forms that start with נ — paint first נ,
  // then apply suffix highlighting to the rest (without trying to infer prefix rules).
  const renderPresentNifalWord = (verbWord) => {
    const v = String(verbWord || '');
    if (!v) return '';
    if (!applyNifalNun) return renderPresentVerbWord(v);

    // only if the FIRST Hebrew letter is נ
    const vNorm = v.replace(/^[\s\u200E\u200F\u202A-\u202E\u2066-\u2069]+/, '');
    const firstHeb = (vNorm.match(/[א-ת]/) || [])[0];
    if (firstHeb !== 'נ') return renderPresentVerbWord(v);

    // find position of that first Hebrew letter
    const m = vNorm.match(/[א-ת]/);
    const i = m && typeof m.index === 'number' ? m.index : 0;

    const leading = v.slice(0, v.length - vNorm.length);
    const before = vNorm.slice(0, i);
    const afterNun = vNorm.slice(i + 1);

    const PRESENT_SUFFIXES_LOCAL = ['ות', 'ים', 'ה', 'ת'];
    let suffix = '';
    for (const suf of PRESENT_SUFFIXES_LOCAL) {
      if (afterNun.endsWith(suf)) {
        suffix = suf;
        break;
      }
    }
    const base = suffix ? afterNun.slice(0, afterNun.length - suffix.length) : afterNun;

    return (
      <>
        {leading}
        {!!before && <Text>{before}</Text>}
        <Text style={styles.prefixYellow}>נ</Text>
        {!!base && <Text>{base}</Text>}
        {!!suffix && <Text style={styles.suffixGreen}>{suffix}</Text>}
      </>
    );
  };

  // 1–12: present — highlight ONLY the 2nd word (the verb)
  if (!isBeVerb && virtualPos >= 1 && virtualPos <= 12) {
    const parts = raw.split(' ').filter(Boolean);
    if (parts.length < 2) return renderPresentNifalWord(parts[0] || '');

    const first = parts[0];
    const verb = parts[1];
    const tail = parts.slice(2).join(' ');

    return (
      <>
        {first}
        {' '}
        {renderPresentNifalWord(verb)}
        {tail ? ` ${tail}` : ''}
      </>
    );
  }

  // 13–24: past — suffixes + optional leading ה
  if (virtualPos === 13 || virtualPos === 14)
    return applyToVerbWord(raw, (w) =>
      withOptionalNifalNunWord(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'תי'))
    );
  if (virtualPos === 15 || virtualPos === 16)
    return applyToVerbWord(raw, (w) =>
      withOptionalNifalNunWord(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'ת'))
    );
  if (virtualPos === 17)
    return applyToVerbWord(raw, (w) =>
      withOptionalNifalNunWord(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, ''))
    );
  if (virtualPos === 18)
    return applyToVerbWord(raw, (w) =>
      withOptionalNifalNunWord(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'ה'))
    );
  if (virtualPos === 19 || virtualPos === 20)
    return applyToVerbWord(raw, (w) =>
      withOptionalNifalNunWord(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'נו'))
    );
  if (virtualPos === 21)
    return applyToVerbWord(raw, (w) =>
      withOptionalNifalNunWord(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'תם'))
    );
  if (virtualPos === 22)
    return applyToVerbWord(raw, (w) =>
      withOptionalNifalNunWord(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'תן'))
    );
  if (virtualPos === 23 || virtualPos === 24)
    return applyToVerbWord(raw, (w) =>
      withOptionalNifalNunWord(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'ו'))
    );

  // 25–36: future/imperative/etc
  if (virtualPos === 25) return renderWithColorRules(raw, { prefix: 'א' });
  if (virtualPos === 26) return renderWithColorRules(raw, { prefix: 'א' });
  if (virtualPos === 27) return renderWithColorRules(raw, { prefix: 'ת' });
  if (virtualPos === 28) return renderWithColorRules(raw, { prefix: 'ת', suffix: 'י' });
  if (virtualPos === 29) return renderWithColorRules(raw, { prefix: 'י' });
  if (virtualPos === 30) return renderWithColorRules(raw, { prefix: 'ת' });
  if (virtualPos === 31 || virtualPos === 32) return renderWithColorRules(raw, { prefix: 'נ' });
  if (virtualPos === 33 || virtualPos === 34) return renderWithColorRules(raw, { prefix: 'ת', suffix: 'ו' });
  if (virtualPos === 35 || virtualPos === 36) return renderWithColorRules(raw, { prefix: 'י', suffix: 'ו' });

  return raw;
};

// Typewriter that keeps the original typing effect, but renders highlighted hebrew
const TypewriterHebrewHighlightedRTL = ({
  text,
  typingSpeed = 50,
  style,
  formIndex,
  isBeVerb,
  highlightEnabled = true,
  isNifalForCurrentVerb = false,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    const full = String(text || '');
    let i = 0;

    setDisplayedText('');
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      i += 1;
      setDisplayedText(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, Math.max(10, Number(typingSpeed) || 50));

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [text, typingSpeed]);

  return (
    <Text style={style}>
      {renderHebrewText(displayedText, formIndex, isBeVerb, highlightEnabled, isNifalForCurrentVerb)}
    </Text>
  );
};

/* =============================================================== */


const Exercise8Ar = () => {
  const [verbs, setVerbs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayPairs, setDisplayPairs] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState(new Set());
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [exitConfirmationVisible, setExitConfirmationVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

// translit button: 3 states
// 0: translit ON + highlight ON (translit1.png)
// 1: translit OFF + highlight ON (translit2.png)
// 2: translit OFF + highlight OFF (translit3.png)
const TRANSLIT_ROW_H = 36;
const [translitMode, setTranslitMode] = useState(0);
const showTranslit = translitMode === 0;
const highlightEnabled = translitMode !== 2;

const handleTranslitToggle = () => {
  setTranslitMode((m) => (m + 1) % 3);
};


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
    console.log('Navigating to MenuAr, current state:', navigation.getState());
    navigation.reset({
      index: 0,
      routes: [{ name: 'MenuAr' }],
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
      return 'استثنائي! لا تشوبه شائبة! لم ترتكب أي خطأ!';
    } else if (percentage >= 90) {
      return 'ممتاز! تقريبا مثالي، واصل العمل الرائع!';
    } else if (percentage >= 80) {
      return 'رائع! أنت تقوم بعمل جيد جدًا!';
    } else if (percentage >= 70) {
      return 'جيد! لقد تعلمت المادة بشكل جيد!';
    } else if (percentage >= 60) {
      return 'جيد إلى حد ما! هناك تقدم مستمر!';
    } else if (percentage >= 50) {
      return 'ليس سيئًا! ولكن هناك مجال للتحسن.';
    } else if (percentage >= 40) {
      return 'مرضٍ! استمر في العمل وستنجح!';
    } else if (percentage >= 30) {
      return 'لقد بدأت تفهم الموضوع، واصل العمل!';
    } else if (percentage >= 20) {
      return 'حاول تغيير استراتيجية التعلم، قد يساعد ذلك!';
    } else if (percentage >= 10) {
      return 'إنه صعب، ولكن لا تستسلم! استمر في الممارسة.';
    } else {
      return 'هناك حاجة إلى عمل جاد! من المهم ألا تستسلم وتستمر في التعلم.';
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




  const [language, setLanguage] = useState('en'); // по умолчанию

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
  
  
const getBinyanFromV1 = useCallback((currentV6) => {
  try {
    const inf = String(currentV6?.infinitive || currentV6?.hebrewVerb || currentV6?.hebrewverb || '').trim();
    const heb = String(currentV6?.hebrewVerb || currentV6?.hebrewverb || currentV6?.infinitive || '').trim();
    const key = normHeb(inf || heb);

    if (!key) return '';

    const candidates = (verbs1Data || []).filter((x) => {
      const xKey = normHeb(String(x?.hebrewVerb || x?.infinitive || '').trim());
      return xKey && xKey === key;
    });

    if (!candidates.length) return String(currentV6?.binyan || '');

    // 1) try exact meaning match (Arabic option at correct index)
    const meaningAr = normKey(
      currentV6?.arabic ||
        currentV6?.artext ||
        currentV6?.arText ||
        currentV6?.ar ||
        ''
    );

    for (const c of candidates) {
      const idx = Number(c?.correctTranslationIndex);
      const opt = normKey(
        (Array.isArray(c?.translationOptionsAr) ? c.translationOptionsAr[idx] : '') ||
          (Array.isArray(c?.translationOptionsAR) ? c.translationOptionsAR[idx] : '') ||
          (Array.isArray(c?.translationOptionsArabic) ? c.translationOptionsArabic[idx] : '') ||
          (Array.isArray(c?.translationOptions) ? c.translationOptions[idx] : '')
      );

      if (opt && meaningAr && opt === meaningAr) return String(c?.binyan || '');
    }

    // 2) meaning mismatch fallback: if any candidate is NIF'AL — return it
    const nifalCandidate = candidates.find((c) => isNifalFromBinyan(c?.binyan));
    if (nifalCandidate?.binyan) return String(nifalCandidate.binyan || '');

    // 3) otherwise — first candidate
    return String(candidates[0]?.binyan || currentV6?.binyan || '');
  } catch (e) {
    return String(currentV6?.binyan || '');
  }
}, []);

const isNifalForCurrentVerb = isNifalFromBinyan(
  getBinyanFromV1(mainVerb || verbs?.[currentIndex])
);

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
    const langKey = langMap[lang] || 'arabic';
  
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
  
  
  
  const [showDescriptionOnce, setShowDescriptionOnce] = useState(true);
  
  useEffect(() => {
    const initialize = async () => {
      const lang = await AsyncStorage.getItem('language');
      const hidden = await AsyncStorage.getItem('exercise8_description_hidden');
      setLanguage(lang || 'ar');
      setDontShowAgain8(hidden === 'true');
      setLanguageLoaded(true);
  
      // Показываем модалку только если showDescriptionOnce и нет скрывающего флага
      if (hidden !== 'true' && showDescriptionOnce) {
        setTimeout(() => {
          setDescriptionModalVisible(true);
          setShowDescriptionOnce(false); // После показа сбрасываем флаг
        }, 300);
      }
    };
    initialize();
  }, []); // Только при самом первом монтировании


  
  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);
  
    const [dontShowAgain8, setDontShowAgain8] = useState(false);
  
    
  
    const [languageLoaded, setLanguageLoaded] = useState(false);
  
    useEffect(() => {
    const checkFlagAndLang = async () => {
      const hidden = await AsyncStorage.getItem('exercise8_description_hidden');
      const lang = await AsyncStorage.getItem('language');
  
      console.log('🌍 Language:', lang);
      console.log('🧪 Hide flag:', hidden);
  
      if (lang) {
        setLanguage(lang);
  
        setDontShowAgain8(hidden === 'true');
      setLanguageLoaded(true);
  
        if (hidden !== 'true') {
          setTimeout(() => {
            console.log('📢 Показываем модалку после загрузки языка');
            setDescriptionModalVisible(true);
          }, 100); // чуть больше времени
        }
      }
  
      setDontShowAgain8(hidden === 'true');
    };
  
    checkFlagAndLang();
  }, []);
  
  
  
  
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
          if (!acc[infinitive]) {
            acc[infinitive] = [];
          }
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
  const MAX_INCORRECT = 5;          // до 5 неправильных
  const MIN_SAME_GENDER_TOTAL = 3;  // минимум 3 варианта с тем же gender (включая правильный)

  // Берём варианты только для текущего инфинитива
  const sameInfinitiveVerbs = verbs.filter(
    v => v.infinitive === currentVerb.infinitive
  );

  // 1) Пул кандидатов:
  //    - есть artext
  //    - отличается от правильного
  //    - отличается по hebrewtext (убираем совпадающие формы 3 ж. / 2 м. и т.п.)
  //    - уникальные по artext
  const poolMap = new Map(); // key = artext.trim()

  for (const v of sameInfinitiveVerbs) {
    if (!v.artext) continue;

    if (v.artext === currentVerb.artext) continue;         // тот же арабский текст
    if (v.hebrewtext === currentVerb.hebrewtext) continue; // та же форма на иврите

    const key = v.artext.trim();
    if (!poolMap.has(key)) {
      poolMap.set(key, v); // первый встретившийся вариант
    }
  }

  const uniquePool = Array.from(poolMap.values());

  // 2) Разделяем по gender
  const sameGenderPool  = uniquePool.filter(v => v.gender === currentGender);
  const otherGenderPool = uniquePool.filter(v => v.gender !== currentGender);

  // Сколько нужно неправильных с тем же gender:
  // всего хотим MIN_SAME_GENDER_TOTAL, один уже даёт правильный ответ
  const needSameGenderIncorrect = Math.max(0, MIN_SAME_GENDER_TOTAL - 1);

  const shuffledSameGender  = shuffleArray(sameGenderPool);
  const sameGenderIncorrect = shuffledSameGender.slice(
    0,
    Math.min(needSameGenderIncorrect, MAX_INCORRECT, sameGenderPool.length)
  );

  const remainingSlots = MAX_INCORRECT - sameGenderIncorrect.length;

  const shuffledOtherGender  = shuffleArray(otherGenderPool);
  const otherGenderIncorrect = shuffledOtherGender.slice(0, remainingSlots);

  const incorrectAnswersVerbs = [
    ...sameGenderIncorrect,
    ...otherGenderIncorrect,
  ];

  const incorrectAnswers = incorrectAnswersVerbs.map(v => ({
    artext: v.artext,
    gender: v.gender,
  }));

  // 3) Правильный + неправильные и финальная защита от дублей по artext
  const allCandidates = [
    { artext: currentVerb.artext, gender: currentVerb.gender },
    ...incorrectAnswers,
  ];

  const answersMap = new Map();
  const dedupedAnswers = [];
  for (const a of allCandidates) {
    const key = (a.artext || '').trim();
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
    if (selectedAnswer.artext === verbs[currentIndex].artext) {
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
      if (displayPairs[index].artext === verbs[currentIndex].artext) {
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
    const exerciseId = 'exercise8Ar';
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
      else navigation.navigate('MenuAr');
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
              routes: [{ name: 'MenuAr' }],
            });
          };
    
      const handleCancelExit = () => {
        setExitConfirmationVisible(false);
      };

  const handleExerciseCompletion = async () => {
    const exerciseId = 'exercise8Ar';
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
  setVerbListForModal(allForms);
  setIsVerbListVisible(true);
  setIsSearchModalVisible(false); // <-- главное
};



const handleStartExercise = () => {
  const chosenVerb = pendingVerb || mainVerb;
  if (!chosenVerb) return;
  modalCloseReasonRef.current = 'start'; // ← хотим звук
  initializeExercise(chosenVerb);
  setIsVerbListVisible(false);
  setPendingVerb(null);
};





const [currentVerb, setCurrentVerb] = useState({
    infinitive: '',
    arabic: '',
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
    else navigation.navigate('MenuAr');
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
            <StatModal8Ar visible={isStatModalVisible} onToggle={() => setIsStatModalVisible(false)} statistics={statistics} />
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
          <Text style={styles.prtext}maxFontSizeMultiplier={1.2}>صحيح: {correctCount}</Text>
                    <Text style={styles.prtext}maxFontSizeMultiplier={1.2}>خطأ: {incorrectCount}</Text>
        </View>
        <View style={styles.remainingTasksContainer}>
          <Text style={styles.remainingTasksText}maxFontSizeMultiplier={1.2}>{totalConjugations - currentIndex}</Text>
        </View>
        <Animated.View style={[styles.percentContainer, { backgroundColor, borderRadius: 10 }]}>
          <Text style={styles.percentText}maxFontSizeMultiplier={1.2}>{progressPercent.toFixed(2)}%</Text>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}>
        <ProgressBar progress={progress} totalExercises={100} />
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}maxFontSizeMultiplier={1.2}>تصريف الفعل</Animated.Text>

      <View style={styles.verbContainerWrapper}>
        <Animated.View style={[styles.verbContainer, { opacity: fadeAnim }]}>
          {verbs[currentIndex] && (
            <>
              <Text style={styles.verbText}maxFontSizeMultiplier={1.2}>{verbs[currentIndex].infinitive}</Text>
              <Text style={styles.verbTextTr}maxFontSizeMultiplier={1.2}>{verbs[currentIndex].transliteration}</Text>
              <Text style={styles.verbTextRu}maxFontSizeMultiplier={1.2}>{verbs[currentIndex].arabic}</Text>
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
            <TypewriterHebrewHighlightedRTL
              text={verbs[currentIndex].hebrewtext}
              typingSpeed={50}
              style={[styles.hebrewText, !showTranslit && { transform: [{ translateY: 14 }], textAlign: 'center', alignSelf: 'center' }]}
              formIndex={verbs[currentIndex].hebrewFormIndex}
              highlightEnabled={highlightEnabled}
              isNifalForCurrentVerb={isNifalForCurrentVerb}
              isBeVerb={String(mainVerb?.infinitive || '') === 'להיות'}
              maxFontSizeMultiplier={1.2}
            />

            <View style={styles.translitRow}>
              <Text
                style={[styles.translitText, !showTranslit && styles.hiddenRow]}
                maxFontSizeMultiplier={1.2}
              >
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
                {pair.artext}
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
        <Text style={styles.nextButtonText}maxFontSizeMultiplier={1.2}>التالي</Text>
      </TouchableOpacity>

      {completionMessageVisible && (
        <Animated.View style={[styles.completionMessageContainer, { opacity: completionMessageOpacity }]}>
          <CompletionMessageAr
            handleOK={handleContinue}
            navigateToMenu={() => {
              setCompletionMessageVisible(false);
              navigation.navigate('MenuAr');
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
      <SearchModalAr visible={isSearchModalVisible} onToggle={handleSearchToggle} onSelectVerb={handleSelectVerb} />
      </View>
    </ScrollView>
   )}

    {/* Модалки должны быть вне ScrollView/TouchableOpacity */}
    <StatModal8Ar
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
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 10,
  },
  prtext: {
    fontSize: 13,
    color: 'white',
    textAlign: 'left',
    marginLeft: 15,
    marginLeft: 15,
     lineHeight: 20,
    fontWeight: 'bold',
    includeFontPadding: false,
    textAlignVertical: 'center',
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

 hebrewText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#152039',
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

  translitText: {
    fontSize: 20,
    color: '#FF5757',
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
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
    fontSize: 15,
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
  prefixYellow: {
    color: '#00a2ffff',
    fontWeight: 'bold',
  },
  suffixGreen: {
    color: '#ff3ab3ff',
    fontWeight: 'bold',
  },
});

export default Exercise8Ar; 