import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, BackHandler, Platform  } from 'react-native';
import verbsData from './verbs6RU.json';
import verbs1Data from './verbs1.json';
import ProgressBar from './ProgressBar';
import { Animated } from 'react-native';
import { Audio } from 'expo-av';
import soundsconj from './soundconj';
import sounds from './Soundss';
import CompletionMessageFr from './CompletionMessageFr';
import ExitConfirmationModal from './ExitConfirmationModalFr';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import TaskDescriptionModal6 from './TaskDescriptionModal8';
import StatModal8Fr from './StatModal8Fr';
import { updateStatistics, getStatistics } from './stat';
import TypewriterTextLTR from './TypewriterTextLTR';
import LottieView from 'lottie-react-native';
import SearchModalFr from './SearchModalFr';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
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

// Remove niqqud + cantillation marks, keep only letters
const stripHebrewMarks = (s) => String(s || '').replace(/[\u0591-\u05C7]/g, '');
const normHeb = (s) => stripHebrewMarks(s).replace(/\s+/g, ' ').trim();

const normalizeBinyan = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    // remove spaces + apostrophes (straight and curly)
    .replace(/[\s'’]/g, '');

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

// ✅ Past: if word starts with ה — highlight first ה; suffix highlighted too
const renderPastWithHitpaelPrefixAndSuffix = (word, suffix) => {
  const w = String(word || '');
  const prefix = w.startsWith('ה') ? 'ה' : '';
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


/* ===================================================================== */

const Exercise8Fr = () => {
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
  const [showTranslation, setShowTranslation] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [isAnimationVisible, setIsAnimationVisible] = useState(false);
  const [currentAudioFile, setCurrentAudioFile] = useState(null);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const navigation = useNavigation();
  const [progress, setProgress] = useState(0);
  const [totalConjugations, setTotalConjugations] = useState(36);
  const modalCloseReasonRef = useRef(null); // 'start' | 'menu' | null
  const [showInfinitive, setShowInfinitive] = useState(false);

  const [language, setLanguage] = useState('fr');

  const [mainVerb, setMainVerb] = useState(null);

  // ---- NIF'AL detection (from verbs1.json) ----
  const getBinyanFromV1 = useCallback((currentV6) => {
    const inf = normKey(currentV6?.infinitive);
    if (!inf) return '';

    const meaningFr = normKey(currentV6?.french || currentV6?.frtext || '');

    const candidates = Array.isArray(verbs1Data)
      ? verbs1Data.filter((v) => normKey(v?.hebrewVerb) === inf)
      : [];

    if (!candidates.length) return '';

    // 1) try exact meaning match (translationOptionsFr at correct index)
    for (const c of candidates) {
      const idx = Number(c?.correctTranslationIndex);
      const opt = normKey(
        (Array.isArray(c?.translationOptionsFr) ? c.translationOptionsFr[idx] : '') ||
          (Array.isArray(c?.translationOptions) ? c.translationOptions[idx] : '')
      );
      if (opt && meaningFr && opt === meaningFr) return String(c?.binyan || '');
    }

    // 2) meaning mismatch fallback: if any candidate is NIF'AL — return it
    const nifalCandidate = candidates.find((c) => isNifalFromBinyan(c?.binyan));
    if (nifalCandidate?.binyan) return String(nifalCandidate.binyan || '');

    // 3) otherwise — first candidate
    return String(candidates[0]?.binyan || '');
  }, []);

  const inferNifalFromHebrewText = useCallback((hebrewtext, formIndex, isBeVerb) => {
    const raw = String(hebrewtext || '');
    if (!raw) return false;

    const idx = Number(formIndex) || 0;
    const virtualPos = isBeVerb ? idx + 12 : idx;

    // We highlight nif'al nun only in 1..24 range (present + past),
    // and only if the verb word actually starts with נ (first Hebrew letter).
    if (virtualPos < 1 || virtualPos > 24) return false;

    const cleaned = raw.replace(/[\u0591-\u05C7]/g, '').trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (!parts.length) return false;

    const verbWord = parts.length >= 2 ? parts[1] : parts[0];
    const mm = verbWord.match(/[א-ת]/);
    if (!mm || typeof mm.index !== 'number') return false;

    return verbWord[mm.index] === 'נ';
  }, []);

  const isNifalForCurrentVerb =
    isNifalFromBinyan(getBinyanFromV1(mainVerb || verbs?.[currentIndex])) ||
    inferNifalFromHebrewText(
      (verbs?.[currentIndex] || mainVerb)?.hebrewtext,
      (verbs?.[currentIndex] || mainVerb)?.hebrewFormIndex || (verbs?.[currentIndex] || mainVerb)?.formIndex,
      String((mainVerb || verbs?.[currentIndex])?.infinitive || '') === 'להיות'
    );

const [verbListForModal, setVerbListForModal] = useState([]);
  const [isVerbListVisible, setIsVerbListVisible] = useState(true);

  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [dontShowAgain8, setDontShowAgain8] = useState(false);
 

  const [pendingVerb, setPendingVerb] = useState(null);
  const [startInfinitive, setStartInfinitive] = useState(null);

  const getGrade = (percentage) => {
    if (percentage === 100) return "Exceptionnel ! Parfait ! Vous n'avez fait aucune erreur !";
    if (percentage >= 90) return "Excellent ! Presque parfait, continuez comme ça !";
    if (percentage >= 80) return "Très bien ! Vous vous débrouillez très bien !";
    if (percentage >= 70) return "Bien ! Vous avez bien appris la matière !";
    if (percentage >= 60) return "Assez bien ! Il y a un progrès constant !";
    if (percentage >= 50) return "Pas mal ! Mais il y a encore de la place pour l'amélioration.";
    if (percentage >= 40) return "Satisfaisant ! Continuez à travailler et vous réussirez !";
    if (percentage >= 30) return "Vous commencez à comprendre, continuez comme ça !";
    if (percentage >= 20) return "Essayez de changer votre stratégie d'apprentissage, cela pourrait aider !";
    if (percentage >= 10) return "C'est difficile, mais ne vous découragez pas ! Continuez à pratiquer.";
    return "Un travail sérieux est nécessaire ! Il est important de ne pas abandonner et de continuer à apprendre.";
  };

  // init lang + flag
useEffect(() => {
  const initialize = async () => {
    const lang = await AsyncStorage.getItem('language');
    const hidden = await AsyncStorage.getItem('exercise8_description_hidden');

    setLanguage(lang || 'en');
    setDontShowAgain8(hidden === 'true');
    setLanguageLoaded(true);

    // ❌ больше НЕ показываем автоматически
  };

  initialize();
}, []);


  const handleToggleDontShowAgain8 = async () => {
    const newValue = !dontShowAgain8;
    setDontShowAgain8(newValue);
    await AsyncStorage.setItem('exercise8_description_hidden', newValue ? 'true' : '');
  };

  const getRandomInfinitive = () => {
    const uniqueVerbs = [...new Set(verbsData.map((item) => item.infinitive))];
    return uniqueVerbs[Math.floor(Math.random() * uniqueVerbs.length)];
  };

  useEffect(() => {
    if (verbsData && verbsData.length > 0) {
      setStartInfinitive(getRandomInfinitive());
    }
  }, []);

  useEffect(() => {
    if (!startInfinitive) return;
    const allForms = verbsData.filter((v) => v.infinitive === startInfinitive);

    setMainVerb(allForms[0]);
    setVerbListForModal(allForms);
    setIsVerbListVisible(true);

    initializeExercise(allForms[0]);
    setPendingVerb(null);
  }, [startInfinitive]);

  // IMPORTANT: keep hebrewFormIndex BEFORE shuffle (same as RU)
const initializeExercise = ({ selectedVerb = null, forms = null, totalForms = null } = {}) => {
  let selectedVerbs = [];

  if (Array.isArray(forms) && forms.length > 0) {
    // Берём уже отфильтрованные формы из VerbListModal2
    // и СОХРАНЯЕМ их исходную позицию в полной таблице
    selectedVerbs = shuffleArray(
      forms.map((v, i) => ({
        ...v,
        hebrewFormIndex:
          typeof v._originalIndex === 'number'
            ? v._originalIndex + 1
            : typeof v.hebrewFormIndex === 'number'
            ? v.hebrewFormIndex
            : i + 1,
      }))
    );
  } else if (selectedVerb) {
    selectedVerbs = shuffleArray(
      verbsData
        .filter((verb) => verb.infinitive === selectedVerb.infinitive)
        .map((v, i) => ({
          ...v,
          hebrewFormIndex: i + 1,
        }))
    );
  } else if (verbsData && verbsData.length > 0) {
    const groupedByInfinitive = verbsData.reduce((acc, verb) => {
      const { infinitive } = verb;
      if (!acc[infinitive]) {
        acc[infinitive] = [];
      }
      acc[infinitive].push(verb);
      return acc;
    }, {});

    const infinitives = Object.keys(groupedByInfinitive);
    const randomInfinitive =
      infinitives[Math.floor(Math.random() * infinitives.length)];

    selectedVerbs = shuffleArray(
      groupedByInfinitive[randomInfinitive].map((v, i) => ({
        ...v,
        hebrewFormIndex: i + 1,
      }))
    );
  }

  if (!selectedVerbs.length) return;

  setTotalConjugations(totalForms || selectedVerbs.length);
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

  // build answer options
  useEffect(() => {
    if (!verbs || verbs.length === 0) return;

    const currentVerb = verbs[currentIndex];
    if (!currentVerb) return;

    const currentGender = currentVerb.gender;
    const MAX_INCORRECT = 5;
    const MIN_SAME_GENDER_TOTAL = 3;

    const sameInfinitiveVerbs = verbs.filter((v) => v.infinitive === currentVerb.infinitive);

    const poolMap = new Map();
    for (const v of sameInfinitiveVerbs) {
      if (!v.frtext) continue;
      if (v.frtext === currentVerb.frtext) continue;
      if (v.hebrewtext === currentVerb.hebrewtext) continue;

      const key = v.frtext.trim();
      if (!poolMap.has(key)) poolMap.set(key, v);
    }
    const uniquePool = Array.from(poolMap.values());

    const sameGenderPool = uniquePool.filter((v) => v.gender === currentGender);
    const otherGenderPool = uniquePool.filter((v) => v.gender !== currentGender);

    const needSameGenderIncorrect = Math.max(0, MIN_SAME_GENDER_TOTAL - 1);

    const sameGenderIncorrect = shuffleArray(sameGenderPool).slice(
      0,
      Math.min(needSameGenderIncorrect, MAX_INCORRECT, sameGenderPool.length),
    );
    const remainingSlots = MAX_INCORRECT - sameGenderIncorrect.length;
    const otherGenderIncorrect = shuffleArray(otherGenderPool).slice(0, remainingSlots);

    const allCandidates = [
      { frtext: currentVerb.frtext, gender: currentVerb.gender },
      ...[...sameGenderIncorrect, ...otherGenderIncorrect].map((v) => ({ frtext: v.frtext, gender: v.gender })),
    ];

    const answersMap = new Map();
    const dedupedAnswers = [];
    for (const a of allCandidates) {
      const key = (a.frtext || '').trim();
      if (!key) continue;
      if (!answersMap.has(key)) {
        answersMap.set(key, true);
        dedupedAnswers.push(a);
      }
    }

    const answers = shuffleArray(dedupedAnswers);

    setDisplayPairs(
      answers.map((answer) => ({
        ...answer,
        hebrewtext: currentVerb.hebrewtext,
        translit: currentVerb.translit,
      })),
    );

    setCurrentAudioFile(currentVerb.mp3);

    // auto-sound only when exercise started (not when leaving to menu)
    if (!isVerbListVisible && modalCloseReasonRef.current !== 'menu') {
      playAudio(currentVerb.mp3);
      if (modalCloseReasonRef.current === 'start') modalCloseReasonRef.current = null;
    }
  }, [currentIndex, verbs, isVerbListVisible]);

  useEffect(() => {
    setShowTranslation(false);
  }, [currentIndex]);

  const handleAnswer = (index) => {
    if (exerciseCompleted) return;

    const selected = displayPairs[index];
    if (selected.frtext === verbs[currentIndex].frtext) {
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

    setCorrectAnswers((prev) => new Set(prev).add(index));
    setIsCorrectAnswerSelected(true);
    setSelectedAnswer(index);

    playCorrectAnswerSound(audioFile).then(() => {
      if (soundEnabled) setIsAnimationVisible(true);
    });

    changeBackgroundColor(true);

    const pauseDuration = soundEnabled ? 1000 : 200;
    setTimeout(() => setNextButtonEnabled(true), pauseDuration);
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
    if (verbs[currentIndex]) fadeIn();
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

  // sounds
  useEffect(() => {
    loadFailureSound();
    return () => {
      failureSound?.unloadAsync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      correctSound?.unloadAsync();
    };
  }, [correctSound]);

  const playCorrectAnswerSound = async (audioKey) => {
    if (!soundEnabled) return;

    try {
      if (correctSound) await correctSound.unloadAsync();

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
      if (sound && typeof sound.unloadAsync === 'function') await sound.unloadAsync();

      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
      setSound(newSound);
      setIsAnimationVisible(true);

      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isPlaying) setIsAnimationVisible(false);
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
      if (sound && typeof sound.unloadAsync === 'function') await sound.unloadAsync();

      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
      setSound(newSound);
      setIsAnimationVisible(true);

      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isPlaying) setIsAnimationVisible(false);
      });
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  };

  const playFailureSound = async () => {
    if (!soundEnabled) return;
    try {
      await failureSound?.replayAsync();
    } catch (error) {
      console.error('Error playing the failure sound', error);
    }
  };

  const playInfinitiveAudio = async (audioFileName) => {
    try {
      const fileNameKey = String(audioFileName || '').replace('.mp3', '');
      const audioFile = sounds[fileNameKey];

      if (!audioFile) {
        console.error(`Audio file ${audioFileName} not found.`);
        return;
      }

      if (sound && typeof sound.unloadAsync === 'function') await sound.unloadAsync();

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
    if (inactiveButtons.has(index)) style.push(styles.deactivatedButton);
    if (selectedAnswer === index) {
      if (displayPairs[index].frtext === verbs[currentIndex].frtext) style.push(styles.correctButton);
      else style.push(styles.wrongButton);
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

  const toggleDescriptionModal = () => setDescriptionModalVisible((prev) => !prev);

  const handleButton3Press = async () => {
    const exerciseId = 'exercise8Fr';
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
    if (soundEnabled && sound) sound.setVolumeAsync(0);
    else if (!soundEnabled && sound) sound.setVolumeAsync(1);
  };

  // Back handling (same logic as RU)
  useFocusEffect(
    useCallback(() => {
      if (!isVerbListVisible) return;

      const onBackPress = () => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('MenuFr');
        return true;
      };

      const bh = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => bh.remove();
    }, [isVerbListVisible, navigation]),
  );

  useFocusEffect(
    useCallback(() => {
      if (isVerbListVisible) return;

      const onBackPress = () => {
        if (exitConfirmationVisible) return false;
        setExitConfirmationVisible(true);
        return true;
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
    }, [isVerbListVisible, exitConfirmationVisible, navigation]),
  );

  useEffect(() => {
    navigation.setOptions({ headerLeft: () => null });
  }, [navigation]);

  const handleConfirmExit = () => {
    navigation.reset({ index: 0, routes: [{ name: 'MenuFr' }] });
  };

  const handleCancelExit = () => setExitConfirmationVisible(false);

  const progressPercent = (correctCount / (correctCount + incorrectCount)) * 100 || 0;

  const handleExerciseCompletion = async () => {
    const exerciseId = 'exercise8Fr';
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

    const inf = getRandomInfinitive();
    const allForms = verbsData.filter((verb) => verb.infinitive === inf);

    setMainVerb(allForms[0]);
    setVerbListForModal(allForms);
    setIsVerbListVisible(true);
    setPendingVerb(null);
  };

  const handleNextPress = () => {
    if (!exerciseCompleted) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % verbs.length);
      setNextButtonEnabled(false);
      setInactiveButtons(new Set());
      setSelectedAnswer(null);
      setIsCorrectAnswerSelected(false);
      setShowTranslation(false);
    }
  };

  const handleContinue = async () => {
    if (!exerciseCompleted) await handleExerciseCompletion();
    setCompletionMessageVisible(false);
    resetExercise();
  };

  const handleSearchToggle = () => setIsSearchModalVisible((prev) => !prev);

  const handleSelectVerb = (verb) => {
    setPendingVerb(verb);
    const allForms = verbsData.filter((item) => item.infinitive === verb.infinitive);
    setVerbListForModal(allForms);
    setIsVerbListVisible(true);
    setIsSearchModalVisible(false);
  };

const handleStartExercise = (payload = {}) => {
  const chosenVerb = pendingVerb || mainVerb;
  if (!chosenVerb) return;

  const selectedForms = Array.isArray(payload.forms) ? payload.forms : null;
  const totalForms =
    typeof payload.totalForms === 'number' ? payload.totalForms : null;

  setMainVerb(chosenVerb);
  modalCloseReasonRef.current = 'start';

  initializeExercise({
    selectedVerb: chosenVerb,
    forms: selectedForms,
    totalForms,
  });

  setIsVerbListVisible(false);
  setPendingVerb(null);
};

  return (
    <>
      {isVerbListVisible && (
        <VerbListModal2
          visible={isVerbListVisible}
          language={language}
          verbs={verbListForModal}
          onStartExercise={handleStartExercise}
          onClose={() => {
            modalCloseReasonRef.current = 'menu';
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('MenuFr');
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
                <TouchableOpacity onPress={handleButton3Press}>
                  <Animated.Image source={require('./stat.png')} style={[styles.buttonImage, { opacity: fadeAnim }]} />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleDescriptionModal}>
                  <Animated.Image source={require('./question.png')} style={[styles.buttonImage, { opacity: fadeAnim }]} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSearchToggle}>
                  <Animated.Image source={require('./search1.png')} style={[styles.buttonImage, { opacity: fadeAnim }]} />
                </TouchableOpacity>
              </View>
            </View>

            <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
              <View style={styles.textContainer}>
                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>CORRECT : {correctCount}</Text>
                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>INCORRECT : {incorrectCount}</Text>
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

            <Animated.Text style={[styles.title, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>
              CONJUGUER LE VERBE
            </Animated.Text>

            <View style={styles.verbContainerWrapper}>
              <Animated.View style={[styles.verbContainer, { opacity: fadeAnim }]}>
                {verbs[currentIndex] && (
                  <>
                    <Text style={styles.verbText}maxFontSizeMultiplier={1.2}>{verbs[currentIndex].infinitive}</Text>
                    <Text style={styles.verbTextTr}maxFontSizeMultiplier={1.2}>{verbs[currentIndex].transliteration}</Text>
                    <Text style={styles.verbTextRu}maxFontSizeMultiplier={1.2}>{verbs[currentIndex].french}</Text>
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
                      formIndex={verbs[currentIndex].hebrewFormIndex}
                      isBeVerb={String(mainVerb?.infinitive || '') === 'להיות'}
                      highlightEnabled={highlightEnabled}
                      isNifalForCurrentVerb={isNifalForCurrentVerb}
                    />
                  </View>

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
                      ]}
                      maxFontSizeMultiplier={1.2}
                    >
                      {pair.frtext}
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
              <Text style={styles.nextButtonText} maxFontSizeMultiplier={1.2}>SUIVANT</Text>
            </TouchableOpacity>

            {completionMessageVisible && (
              <Animated.View style={[styles.completionMessageContainer, { opacity: completionMessageOpacity }]}>
                <CompletionMessageFr
                  handleOK={handleContinue}
                  navigateToMenu={() => {
                    setCompletionMessageVisible(false);
                    navigation.navigate('MenuFr');
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
            <SearchModalFr visible={isSearchModalVisible} onToggle={handleSearchToggle} onSelectVerb={handleSelectVerb} />
          </View>
        </ScrollView>
      )}

      {/* Modals outside ScrollView */}
      <StatModal8Fr visible={isStatModalVisible} onToggle={() => setIsStatModalVisible(false)} statistics={statistics} />

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
    shadowOffset: { width: 0, height: 2 },
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
    marginBottom: 5,
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
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexWrap: 'wrap',
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

  nextButton: {
    width: '80%',
    padding: hp('1.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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

  // Hebrew highlighting
 prefixYellow: { color: '#00a2ffff', fontFamily: HEBREW_FONT },
suffixGreen: { color: '#ff3ab3ff', fontFamily: HEBREW_FONT },
});

export default Exercise8Fr;
