import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, BackHandler } from 'react-native';
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
import TaskDescriptionModal6 from './TaskDescriptionModal7';
import StatModal7Fr from './StatModal7Fr';
import { updateStatistics, getStatistics } from './stat';
import TypewriterTextRTL from './TypewriterTextRTL';
import TypewriterTextLTR from './TypewriterTextLTR';
import LottieView from 'lottie-react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';


/* ===================== HEBREW HIGHLIGHTING (Exercise7) ===================== */

// суффиксы настоящего (длинные — раньше)
const PRESENT_SUFFIXES = ['ות', 'ים', 'ה', 'ת'];

const norm = (s) => String(s || '').trim();

const normKey = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

// В verbs6RU у некоторых инфинитивов есть разные значения (например לקרוא).
// Чтобы не мешать разные "смыслы", группируем по infinitive + russian(значение инфинитива).
const getSenseKeyFromV6 = (v) => normKey(v?.russian || v?.english || v?.french || v?.spanish || v?.portu || '');

const makeV6GroupKey = (v) => `${normKey(v?.infinitive)}__${getSenseKeyFromV6(v)}`;

// build once, сохраняем порядок как в JSON
const V6_GROUPS = (() => {
  const map = new Map();
  verbsData.forEach((v, i) => {
    const key = makeV6GroupKey(v);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ v, i });
  });

  for (const [k, arr] of map) {
    arr.sort((a, b) => a.i - b.i);
    map.set(k, arr.map((x) => x.v));
  }
  return map;
})();

const getIdxInOwnForms = (currentV6) => {
  if (!currentV6) return { idx: 0, count: 0 };

  const key = makeV6GroupKey(currentV6);
  const forms = V6_GROUPS.get(key) || [];

  const idxByMp3 = forms.findIndex((x) => String(x?.mp3 || '') === String(currentV6?.mp3 || ''));
  if (idxByMp3 !== -1) return { idx: idxByMp3, count: forms.length };

  const idxByText = forms.findIndex(
    (x) =>
      norm(x?.hebrewtext) === norm(currentV6?.hebrewtext) &&
      norm(x?.gender) === norm(currentV6?.gender) &&
      (!currentV6?.russiantext || norm(x?.russiantext) === norm(currentV6?.russiantext))
  );

  return { idx: idxByText === -1 ? 0 : idxByText, count: forms.length };
};

const getBinyanFromV1 = (currentV6) => {
  try {
    const inf = normKey(currentV6?.infinitive);
    const meaningRu = normKey(currentV6?.russian);

    if (!inf) return '';
    const candidates = (Array.isArray(verbs1Data) ? verbs1Data : []).filter((x) => normKey(x?.hebrewVerb) === inf);

    for (const c of candidates) {
      const correctIdx = Number(c?.correctTranslationIndex);
      const correctRu = normKey(c?.translationOptions?.[correctIdx]);
      if (correctRu && meaningRu && correctRu === meaningRu) {
        return String(c?.binyan || '');
      }
    }

    // fallback: если по какой-то причине смысл не совпал — берём первый биньян по инфинитиву
    return candidates[0]?.binyan ? String(candidates[0].binyan) : '';
  } catch (e) {
    return '';
  }
};

const isNifalFromBinyan = (binyan) => {
  const b = String(binyan || '').toUpperCase().replace(/[^A-Z]/g, '');
  return b.includes('NIFAL');
};

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

// отделяем пунктуацию в конце, чтобы подсветка не пропадала на "ות,"
const splitTrailingNonHebrew = (str) => {
  const s = String(str || '');
  const m = s.match(/^(.*?)([^א-ת]+)$/);
  if (!m) return { core: s, tail: '' };
  return { core: m[1], tail: m[2] };
};

const renderWithColorRules = (word, { prefix = '', suffix = '' }) => {
  const w0 = String(word || '');
  if (!w0) return '';

  const { core: w, tail } = splitTrailingNonHebrew(w0);

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
      {tail}
    </>
  );
};

const renderPresentVerbWord = (verbWord) => {
  const verb0 = String(verbWord || '');
  if (!verb0) return '';

  const { core: verb, tail } = splitTrailingNonHebrew(verb0);

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
        {tail}
      </>
    );
  }

  const base = restWord.slice(0, restWord.length - matchedSuffix.length);
  return (
    <>
      {prefixNode}
      {base}
      {green(matchedSuffix, 'suf')}
      {tail}
    </>
  );
};

const renderHebrewText = (hebrewtext, idx, { isNifal = false, mainVerb, showHighlight = true } = {}) => {
  const pos = Number(idx || 0) + 1; // 1..36
  const raw = String(hebrewtext || '');
  if (!showHighlight) return raw;

  const isBeVerb = String(mainVerb?.infinitive || '') === 'להיות';
  const virtualPos = isBeVerb ? pos + 12 : pos;

  // ✅ применять правило нифаля только для 1..24
  const applyNifalNun = isNifal && virtualPos >= 1 && virtualPos <= 24;

  // ✅ "добавка" для нифаля: подсветить первую נ, НЕ ломая остальную подсветку
  const withOptionalNifalNun = (word, renderFn) => {
    const w = String(word || '');
    if (!w) return '';

    const { core, tail } = splitTrailingNonHebrew(w);

    if (applyNifalNun && core.startsWith('נ')) {
      const rest = core.slice(1);
      const renderedRest = renderFn ? renderFn(rest) : rest;
      return (
        <>
          {yellow('נ', 'nifal-nun')}
          {renderedRest}
          {tail}
        </>
      );
    }

    const rendered = renderFn ? renderFn(core) : core;
    return (
      <>
        {rendered}
        {tail}
      </>
    );
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

  const renderPastWithHitpaelPrefixAndSuffix = (word, suffix) => {
    const w = String(word || '');
    const { core, tail } = splitTrailingNonHebrew(w);
    const prefix = core.startsWith('ה') ? 'ה' : '';
    return (
      <>
        {renderWithColorRules(core, { prefix, suffix: suffix || '' })}
        {tail}
      </>
    );
  };

  // ====== 1..12 (настоящее): "אני + глагол" ======
  if (!isBeVerb && virtualPos >= 1 && virtualPos <= 12) {
    const parts = raw.split(' ');
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

  // ====== 13..24 (прошедшее): глагол обычно последний ======
  if (virtualPos === 13 || virtualPos === 14)
    return applyToVerbWord(raw, (w) =>
      withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'תי'))
    );

  if (virtualPos === 15 || virtualPos === 16)
    return applyToVerbWord(raw, (w) =>
      withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'ת'))
    );

  if (virtualPos === 17 || virtualPos === 18)
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

  // ====== 25..36 (будущее) ======
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

const TypewriterHebrewHighlightedRTL = ({
  text,
  idx = 0,
  isNifal = false,
  mainVerb,
  showHighlight = true,
  runKey,
  typingSpeed = 50,
  style,
  maxFontSizeMultiplier = 1.2,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    const fullText = String(text || '');
    setDisplayedText('');

    if (timerRef.current) clearInterval(timerRef.current);
    if (!fullText) return;

    let i = 0;
    timerRef.current = setInterval(() => {
      i += 1;
      setDisplayedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, Math.max(10, Number(typingSpeed) || 50));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [runKey]);

  return (
    <Text style={style} maxFontSizeMultiplier={maxFontSizeMultiplier}>
      {renderHebrewText(displayedText, idx, { isNifal, mainVerb, showHighlight })}
    </Text>
  );
};


const Exercise7Fr = () => {
  const [verbs, setVerbs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayPairs, setDisplayPairs] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState(new Set());
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [exitConfirmationVisible, setExitConfirmationVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  // translit toggle: 0=translit+highlight, 1=no translit+highlight, 2=no translit+no highlight
  const [translitMode, setTranslitMode] = useState(0);
  const showTranslit = translitMode === 0;
  const showHighlight = translitMode !== 2;

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
  const navigation = useNavigation();
  const [progress, setProgress] = useState(0);

  const navigateToMenu = () => {
    console.log('Navigating to MenuFr, current state:', navigation.getState());
    navigation.reset({
      index: 0,
      routes: [{ name: 'MenuFr' }],
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
      return 'Exceptionnel ! Parfait ! Vous n\'avez fait aucune erreur !';
    } else if (percentage >= 90) {
      return 'Excellent ! Presque parfait, continuez comme ça !';
    } else if (percentage >= 80) {
      return 'Très bien ! Vous vous débrouillez très bien !';
    } else if (percentage >= 70) {
      return 'Bien ! Vous avez bien appris la matière !';
    } else if (percentage >= 60) {
      return 'Assez bien ! Il y a un progrès constant !';
    } else if (percentage >= 50) {
      return 'Pas mal ! Mais il y a encore de la place pour l\'amélioration.';
    } else if (percentage >= 40) {
      return 'Satisfaisant ! Continuez à travailler et vous réussirez !';
    } else if (percentage >= 30) {
      return 'Vous commencez à comprendre, continuez comme ça !';
    } else if (percentage >= 20) {
      return 'Essayez de changer votre stratégie d\'apprentissage, cela pourrait aider !';
    } else if (percentage >= 10) {
      return 'C\'est difficile, mais ne vous découragez pas ! Continuez à pratiquer.';
    } else {
      return 'Un travail sérieux est nécessaire ! Il est important de ne pas abandonner et de continuer à apprendre.';
    }
  };

const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);
  
    const [dontShowAgain7, setDontShowAgain7] = useState(false);
  
    const [language, setLanguage] = useState('fr'); // ← по умолчанию ru
  
    const [languageLoaded, setLanguageLoaded] = useState(false);
  
    useEffect(() => {
    const checkFlagAndLang = async () => {
      const hidden = await AsyncStorage.getItem('exercise7_description_hidden');
      const lang = await AsyncStorage.getItem('language');
  
      console.log('🌍 Language:', lang);
      console.log('🧪 Hide flag:', hidden);
  
      if (lang) {
        setLanguage(lang);
  
        setDontShowAgain7(hidden === 'true');
      setLanguageLoaded(true);
  
        if (hidden !== 'true') {
          setTimeout(() => {
            console.log('📢 Показываем модалку после загрузки языка');
            setDescriptionModalVisible(true);
          }, 100); // чуть больше времени
        }
      }
  
      setDontShowAgain7(hidden === 'true');
    };
  
    checkFlagAndLang();
  }, []);
  
  
  
  
  const handleToggleDontShowAgain7 = async () => {
    const newValue = !dontShowAgain7;
    setDontShowAgain7(newValue);
    await AsyncStorage.setItem('exercise7_description_hidden', newValue ? 'true' : '');
    console.log('📌 Клик по чекбоксу. Было:', dontShowAgain7, 'Станет:', !dontShowAgain7);
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
      const shuffledData = shuffleArray(verbsData).slice(0, 18);
      setVerbs(shuffledData);
    }
  }, []);

  // useEffect(() => {
  //   if (verbs.length > 0) {
  //     const currentVerb = verbs[currentIndex];

  //     const incorrectAnswers = shuffleArray(
  //       verbs
  //         .filter((verb) => verb.frtext !== currentVerb.frtext)
  //         .map((verb) => ({
  //           frtext: verb.frtext,
  //           gender: verb.gender,
  //         }))
  //     ).slice(0, 5);
  //     const answers = shuffleArray([{ frtext: currentVerb.frtext, gender: currentVerb.gender }, ...incorrectAnswers]);

  //     setDisplayPairs(
  //       answers.map((answer) => ({
  //         ...currentVerb,
  //         frtext: answer.frtext,
  //         gender: answer.gender,
  //       }))
  //     );
  //     playAudio(currentVerb.mp3);
  //     setShowInfinitive(false); // Сброс состояния
  //     setCurrentAudioFile(currentVerb.mp3); // Сохранение текущего аудиофайла
  //   }
  // }, [currentIndex, verbs]);

useEffect(() => {
  if (verbs.length > 0) {
    const currentVerb = verbs[currentIndex];

    // 1) Определяем "совместимые" гендеры (man<->men, woman<->women)
    const getAllowedGenders = (gender) => {
      if (gender === 'man' || gender === 'men') return ['man', 'men'];
      if (gender === 'woman' || gender === 'women') return ['woman', 'women'];
      return gender ? [gender] : [];
    };

    const allowedGenders = getAllowedGenders(currentVerb.gender);

    // Уникальность по artext+gender
    const makeKey = (v) => `${String(v?.frtext || '').trim()}__${String(v?.gender || '').trim()}`;
    const uniqByKey = (arr) => {
      const seen = new Set();
      const out = [];
      for (const v of arr) {
        const k = makeKey(v);
        if (!seen.has(k)) {
          seen.add(k);
          out.push(v);
        }
      }
      return out;
    };

    // 2) Пул неверных ответов из всей базы
    const basePoolAll = uniqByKey(
      verbsData.filter((v) => v.frtext !== currentVerb.frtext)
    );

    // 3) Сначала по gender
    const poolGender = allowedGenders.length
      ? basePoolAll.filter((v) => allowedGenders.includes(v.gender))
      : basePoolAll;

    let picked = shuffleArray(poolGender).slice(0, 5);

    // 4) Если не хватило — добираем из общего пула
    if (picked.length < 5) {
      const pickedKeys = new Set(picked.map(makeKey));
      const filler = basePoolAll.filter((v) => !pickedKeys.has(makeKey(v)));
      const need = 5 - picked.length;
      picked = picked.concat(shuffleArray(filler).slice(0, need));
    }

    // 5) 6 вариантов
    const answers = shuffleArray([
      { frtext: currentVerb.frtext, gender: currentVerb.gender },
      ...picked.map((v) => ({ frtext: v.frtext, gender: v.gender })),
    ]);

    setDisplayPairs(
      answers.map((answer) => ({
        ...currentVerb,
        frtext: answer.frtext,
        gender: answer.gender,
      }))
    );

    // как и было
    playAudio(currentVerb.mp3);
    setShowInfinitive(false);
    setCurrentAudioFile(currentVerb.mp3);
  }
}, [currentIndex, verbs]);



  useEffect(() => {
    setShowTranslation(false); // Сброс состояния перевода при смене карточки
  }, [currentIndex]);

  const handleAnswer = (index) => {
    if (exerciseCompleted) return;

    const selectedAnswer = displayPairs[index];
    if (selectedAnswer.frtext === verbs[currentIndex].frtext) {
      handleCorrectAnswer(index, selectedAnswer.mp3);
    } else {
      handleIncorrectAnswer(index);
    }
  };

  const handleCorrectAnswer = (index, audioFile) => {
    setCorrectCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= 18) {
        handleExerciseCompletion(); // Вызываем при завершении упражнения
        setExerciseCompleted(true);
        setCompletionMessageVisible(true);
        Animated.timing(completionMessageOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
      setProgress((newCount / 18) * 100); // Обновление состояния прогресса
      return newCount;
    });

    setCorrectAnswers((prev) => new Set(prev).add(selectedAnswer));
    setIsCorrectAnswerSelected(true);
    setSelectedAnswer(index);
    playCorrectAnswerSound(audioFile);
    changeBackgroundColor(true);

    const pauseDuration = soundEnabled ? 1000 : 200; // Пауза в зависимости от состояния звука
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
      const audioFile = soundsconj[audioKey];
      if (!audioFile) {
        console.error(`Audio file for key ${audioKey} not found.`);
        return;
      }
      if (correctSound) {
        await correctSound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
      setCorrectSound(newSound);
      setIsAnimationVisible(true); // Показываем анимацию
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isPlaying) {
          setIsAnimationVisible(false); // Скрываем анимацию после окончания воспроизведения
        }
      });
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
    if (!soundEnabled) return; // Добавлена проверка на включение звука
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
      setIsAnimationVisible(true); // Показываем анимацию
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isPlaying) {
          setIsAnimationVisible(false); // Скрываем анимацию после окончания воспроизведения
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
      // setIsAnimationVisible(true); // Показываем анимацию
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isPlaying) {
          setIsAnimationVisible(false); // Скрываем анимацию после окончания воспроизведения
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
      setIsAnimationVisible(true); // Показываем анимацию
  
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isPlaying) {
          setIsAnimationVisible(false); // Скрываем анимацию после окончания воспроизведения
        }
      });
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
      if (displayPairs[index].frtext === verbs[currentIndex].frtext) {
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
    const exerciseId = 'exercise7Fr';
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

  useFocusEffect(
                useCallback(() => {
                  const onBackPress = () => {
                    if (exitConfirmationVisible) {
                      return false;
                    }
                    setExitConfirmationVisible(true);
                    return true;
                  };
              
                  const backHandler = BackHandler.addEventListener(
                    'hardwareBackPress',
                    onBackPress
                  );
              
                  const unsubscribe = navigation.addListener('beforeRemove', (e) => {
                    if (!exitConfirmationVisible) {
                      e.preventDefault(); // Блокируем навигацию назад
                      setExitConfirmationVisible(true); // Показываем модалку
                    }
                  });
              
                  return () => {
                    backHandler.remove();
                    unsubscribe();
                  };
                }, [exitConfirmationVisible, navigation])
              );
    
      useEffect(() => {
          navigation.setOptions({
            headerLeft: () => null, // Убирает кнопку "Назад" в заголовке
          });
        }, [navigation]);
  
        const handleConfirmExit = () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MenuFr' }],
          });
        };
  
    const handleCancelExit = () => {
      setExitConfirmationVisible(false);
    };

  const handleExerciseCompletion = async () => {
    const exerciseId = 'exercise7Fr';
    const currentScore = parseFloat(progressPercent.toFixed(2));
    console.log(`Exercise completed. Saving stats for ID ${exerciseId} with score ${currentScore}`);
    await updateStatistics(exerciseId, currentScore);

    console.log('Statistics updated successfully');
    setExerciseCompleted(true);
    setTimeout(() => {
      setCompletionMessageVisible(true);
      Animated.timing(completionMessageOpacity, {
        toValue: 1,
        duration: 500, // Длительность анимации 0.5 секунды
        useNativeDriver: true,
      }).start();
    }, 700); // Пауза в 1 секунду
  };

  const resetExercise = () => {
    console.log('Resetting exercise...');
    setCorrectCount(0);
    setIncorrectCount(0);
    setCurrentIndex(0);
    setCorrectAnswers(new Set());
    setInactiveButtons(new Set());
    setSelectedAnswer(null);
    setIsCorrectAnswerSelected(false);
    setNextButtonEnabled(false);
    setCompletionMessageVisible(false);
    setExerciseCompleted(false); // Сброс состояния завершенного упражнения
    setVerbs(shuffleArray(verbsData).slice(0, 18));
    setProgress(0); // Сброс прогресса
    console.log('Exercise reset complete.');
  };

  const progressPercent = (correctCount / (correctCount + incorrectCount)) * 100 || 0;

  const handleNextPress = () => {
    if (!exerciseCompleted) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % verbs.length);
      setNextButtonEnabled(false);
      setInactiveButtons(new Set());
      setSelectedAnswer(null);
      setIsCorrectAnswerSelected(false);
      setShowInfinitive(false); // Сброс состояния
      setShowTranslation(false); // Сброс состояния
    }
  };

  const handleContinue = async () => {
    console.log('handleContinue called');
    if (!exerciseCompleted) {
      await handleExerciseCompletion();
    }
    setCompletionMessageVisible(false);
    resetExercise(); // Сброс упражнения
    console.log('Exercise reset');
  };

  return (
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
            <StatModal7Fr visible={isStatModalVisible} onToggle={() => setIsStatModalVisible(false)} statistics={statistics} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleDescriptionModal}>
            <Animated.Image source={require('./question.png')} style={[styles.buttonImage, { opacity: fadeAnim }]} />
            <TaskDescriptionModal6
              visible={isDescriptionModalVisible}
  onToggle={toggleDescriptionModal}
  language={language}
  dontShowAgain7={dontShowAgain7}
  onToggleDontShowAgain={handleToggleDontShowAgain7}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
        <View style={styles.textContainer}>
          <Text style={styles.prtext}maxFontSizeMultiplier={1.2}>CORRECT: {correctCount}</Text>
          <Text style={styles.prtext}maxFontSizeMultiplier={1.2}>INCORRECT: {incorrectCount}</Text>
        </View>
        <View style={styles.remainingTasksContainer}>
          <Text style={styles.remainingTasksText}maxFontSizeMultiplier={1.2}>{verbs.length - currentIndex}</Text>
        </View>
        <Animated.View style={[styles.percentContainer, { backgroundColor, borderRadius: 10 }]}>
          <Text style={styles.percentText}maxFontSizeMultiplier={1.2}>{progressPercent.toFixed(2)}%</Text>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}>
        <ProgressBar progress={progress} totalExercises={100} />
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}maxFontSizeMultiplier={1.2}>VERBES CONJUGUES</Animated.Text>

      <View style={styles.verbContainerWrapper}>
  {!showInfinitive ? (
    <TouchableOpacity style={[styles.verbContainer, styles.activeButton]} onPress={() => setShowInfinitive(true)}>
      <Text style={styles.verbTextActive}maxFontSizeMultiplier={1.2}>MONTRER L'INFINITIVE</Text>
    </TouchableOpacity>
  ) : (
    <Animated.View style={[styles.verbContainer, { opacity: fadeAnim }]}>
      {verbs[currentIndex] && (
        <>
          <Text style={styles.verbText}maxFontSizeMultiplier={1.2}>{verbs[currentIndex].infinitive}</Text>
          <Text style={styles.verbTextTr}maxFontSizeMultiplier={1.2}>{verbs[currentIndex].transliteration}</Text>
          {!showTranslation ? (
            <TouchableOpacity style={styles.translationButton} onPress={() => setShowTranslation(true)}>
              <Text style={styles.verbTextActive}maxFontSizeMultiplier={1.2}>TRADUCTION</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.verbTextRu}maxFontSizeMultiplier={1.2}>{verbs[currentIndex].french}</Text>
          )}
          <TouchableOpacity onPress={() => playInfinitiveAudio(verbs[currentIndex].audioFile)} style={styles.audioButton1}>
            <Image source={require('./speaker3.png')} style={styles.audioIcon1} />
          </TouchableOpacity>
        </>
      )}
    </Animated.View>
  )}
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
    onAnimationFinish={() => setIsAnimationVisible(false)} // Скрывать анимацию после завершения
  />
)}
            {(() => {
                          const cv = verbs[currentIndex];
                          const { idx } = getIdxInOwnForms(cv);
                          const binyan = getBinyanFromV1(cv);
                          const nifal = isNifalFromBinyan(binyan);
                          const runKey = `${cv?.mp3 || ''}_${currentIndex}`;
                          const TRANSLIT_ROW_H = 30;
            
                          return (
                            <View
                              style={{
                                width: '100%',
                                minHeight: 110,
                                position: 'relative',
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingHorizontal: 12,
                                // резерв под строку транслита, чтобы высота НЕ прыгала
                                paddingBottom: TRANSLIT_ROW_H,
                              }}
                            >
                              {/* Hebrew (центруем, а при скрытом translit немного опускаем вниз) */}
                              <View
                                style={{
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  transform: [{ translateY: showTranslit ? 0 : TRANSLIT_ROW_H / 2 }],
                                }}
                              >
                                <TypewriterHebrewHighlightedRTL
                                  text={cv.hebrewtext}
                                  idx={idx}
                                  isNifal={nifal}
                                  mainVerb={cv}
                                  showHighlight={showHighlight}
                                  runKey={runKey}
                                  typingSpeed={50}
                                  style={styles.hebrewText}
                                  maxFontSizeMultiplier={1.2}
                                />
                              </View>
            
                              {/* Transliteration row: скрываем opacity, но место всегда есть */}
                              <View
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  height: TRANSLIT_ROW_H,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  opacity: showTranslit ? 1 : 0,
                                }}
                              >
                                <Text style={styles.translitText} maxFontSizeMultiplier={1.2}>
                                  {cv.translit}
                                </Text>
                              </View>
                            </View>
                          );})()}

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
            handleOK={handleContinue} // Теперь вызывает handleContinue
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
    paddingTop: 10,
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
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  verbTextRu: {
    fontSize: 15,
    color: '#003882',
    textAlign: 'center',
    width: 120, // Set a fixed width
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
    width: 120, // Set the same fixed width as verbTextRu
    alignItems: 'center',
  },
  audioIcon: {
    width: 26,
    height: 26,
    // marginRight: 20,
  },

  audioIcon1: {
    width: 22,
    height: 22,
    marginRight: 5,
  },

  audioButton: {
    position: 'absolute', // Абсолютное позиционирование
    bottom: 10, // Отступ снизу
    right: 14, // Отступ справа
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
  translitText: {
    fontSize: 20,
    lineHeight: 30, 
    color: '#FF5757',
    fontWeight: 'bold',
    marginTop: 1,
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
    fontSize: 14,
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
     // подсветка частей глагола
  prefixYellow: {
    color: '#00a2ffff',
    fontWeight: 'bold',
  },
  suffixGreen: {
    color: '#ff3ab3ff',
    fontWeight: 'bold',
  },
});


export default Exercise7Fr;
