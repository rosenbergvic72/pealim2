import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, BackHandler } from 'react-native';
import verbsData from './verbs6RU.json';
import ProgressBar from './ProgressBar';
import { Animated } from 'react-native';
import { Audio } from 'expo-av';
import soundsconj from './soundconj';
import sounds from './Soundss';
import CompletionMessagePt from './CompletionMessagePt';
import ExitConfirmationModal from './ExitConfirmationModalPt';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import TaskDescriptionModal6 from './TaskDescriptionModal6';
import StatModal6Pt from './StatModal6Pt';
import { updateStatistics, getStatistics } from './stat';
import LottieView from 'lottie-react-native';
import SearchModalPt from './SearchModalPt';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import VerbListModal2 from './VerbListModal2';
import shuffleArray from './utils/shuffleArray';
import verbs1Data from './verbs1.json';


// import { PixelRatio } from 'react-native';

const FONT_REG = 'mt-regular';
const FONT_MED = 'mt-medium';
const FONT_BOLD = 'mt-bold';
const FONT_SEMIBOLD = 'mt-semibold';

const Exercise6Pt = () => {
  const [pairs, setPairs] = useState([]);
  const totalPairs = pairs.length; // Установите общее количество пар
  const [remainingPairs, setRemainingPairs] = useState(totalPairs);
  const [displayPairs, setDisplayPairs] = useState([]);
  const [selectedRussian, setSelectedRussian] = useState(null);
  const [selectedHebrew, setSelectedHebrew] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState(new Set());
  const [correctCount, setCorrectCount] = useState(0); // Количество правильных ответов
  const [incorrectCount, setIncorrectCount] = useState(0); // Количество неправильных ответов
  const [hebrewActive, setHebrewActive] = useState(true);
  const [page, setPage] = useState(0);
  const [resolvedPairsCount, setResolvedPairsCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);  // Инициализация с 0, а не с 36
  const navigation = useNavigation();
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [exitConfirmationVisible, setExitConfirmationVisible] = useState(false);
  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const toggleDescriptionModal = () => {
    setDescriptionModalVisible(prev => !prev);
  };

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);

  // ✅ 3-state translit:
// 0 — translit1: highlight ON + translit ON
// 1 — translit2: highlight ON + translit OFF
// 2 — translit3: highlight OFF + translit OFF
const [translitMode, setTranslitMode] = useState(0);

const handleTranslitToggle = () => {
  setTranslitMode(prev => (prev === 0 ? 1 : prev === 1 ? 2 : 0));
};

const showTranslit = translitMode === 0;
const highlightEnabled = translitMode !== 2;


  const [shuffledVerbs, setShuffledVerbs] = useState([]);
  const correctPercent = totalExercises > 0 ? (correctCount / totalExercises) * 100 : 0;

  const totalAnswers = correctCount + incorrectCount;
  const incrementProgress = totalExercises > 0 ? 100 / totalExercises : 0;
  const [currentVerb, setCurrentVerb] = useState({
    infinitive: '',
    portu: '',
    transliteration: ''
  });

  const animationRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // const fontScale = PixelRatio.getFontScale(); // Получаем текущий масштаб шрифта

  const getGrade = (percentage) => {
    if (percentage === 100) {
      return 'Excepcional! Perfeito! Você não cometeu um único erro!';
    } else if (percentage >= 90) {
      return 'Excelente! Quase perfeito, continue com o ótimo trabalho!';
    } else if (percentage >= 80) {
      return 'Ótimo! Você está indo muito bem!';
    } else if (percentage >= 70) {
      return 'Bom! Você aprendeu o material muito bem!';
    } else if (percentage >= 60) {
      return 'Razoável! Há um progresso constante!';
    } else if (percentage >= 50) {
      return 'Nada mal! Mas há espaço para melhorar.';
    } else if (percentage >= 40) {
      return 'Satisfatório! Continue trabalhando e você terá sucesso!';
    } else if (percentage >= 30) {
      return 'Você está começando a entender, continue assim!';
    } else if (percentage >= 20) {
      return 'Tente mudar sua estratégia de aprendizado, isso pode ajudar!';
    } else if (percentage >= 10) {
      return 'Está difícil, mas não desista! Continue praticando.';
    } else {
      return 'É necessário um trabalho sério! É importante não desistir e continuar aprendendo.';
    }
  };

  const navigateToMenu = () => {
    console.log('Navigating to MenuEn, current state:', navigation.getState());
    navigation.reset({
      index: 0,
      routes: [{ name: 'MenuEn' }],
    });
  };

  const progressPercent = totalAnswers > 0 ? (correctCount / totalAnswers) * 100 : 0;

  const grade = getGrade(progressPercent);

  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
    if (soundEnabled && sound) {
      sound.setVolumeAsync(0);
    } else if (!soundEnabled && sound) {
      sound.setVolumeAsync(1);
    }
  };

  const [language, setLanguage] = useState('pt'); // по умолчанию

  const [mainVerb, setMainVerb] = useState(null);

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
    const langKey = langMap[lang] || 'portu';

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
    const hidden = await AsyncStorage.getItem('exercise6_description_hidden');

    setLanguage(lang || 'en');
    setDontShowAgain6(hidden === 'true');
    setLanguageLoaded(true);

    // ❌ больше НЕ показываем автоматически
  };

  initialize();
}, []);


  const [dontShowAgain6, setDontShowAgain6] = useState(false);

  const [languageLoaded, setLanguageLoaded] = useState(false);

useEffect(() => {
  const checkFlagAndLang = async () => {
    const hidden = await AsyncStorage.getItem('exercise6_description_hidden');
    const lang = await AsyncStorage.getItem('language');

    if (lang) {
      setLanguage(lang);
      setDontShowAgain6(hidden === 'true');
      setLanguageLoaded(true);

      if (hidden !== 'true') {
        setTimeout(() => setDescriptionModalVisible(true), 100);
      }
    }

    setDontShowAgain6(hidden === 'true');
  };

  checkFlagAndLang(); 
}, []);


  const handleToggleDontShowAgain6 = async () => {
    const newValue = !dontShowAgain6;
    setDontShowAgain6(newValue);
    await AsyncStorage.setItem('exercise6_description_hidden', newValue ? 'true' : '');
    console.log('📌 Клик по чекбоксу. Было:', dontShowAgain6, 'Станет:', !dontShowAgain6);
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();
  };

  useEffect(() => {
    if (currentVerb.infinitive) {
      fadeIn();
    }
  }, [currentVerb]);

  const blockAnimation = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (!exerciseCompleted && displayPairs.length > 0) {
      const startValue = 500;
      blockAnimation.setValue(startValue);

      Animated.timing(blockAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [displayPairs, exerciseCompleted]);

  const backgroundColorAnim = useRef(new Animated.Value(0)).current;

  const handleAnswer = (isCorrect) => {
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
    };

    setCurrentIndex(prevIndex => {
      const newIndex = prevIndex + 1;
      handleProgressUpdate();
      return newIndex;
    });
  };

  const handleProgressUpdate = () => {
    setProgress(currentIndex / totalExercises * 100);
  };

  useEffect(() => {
    if (currentIndex >= totalExercises && totalExercises > 0) {
      setExerciseCompleted(true);
      handleExerciseCompletion();
    }
  }, [currentIndex, totalExercises]);

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

  const shuffleArrayLocal = (array) => {
    let newArray = array.slice();
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };


  const normalize = (s) => String(s || '').trim().toLowerCase();
const normalizeBinyan = (s) => normalize(s).replace(/[\s’']/g, ''); // NIF'AL -> nifal

const isNifalForCurrentVerb = useMemo(() => {
  if (!mainVerb?.infinitive) return false;

  const inf = String(mainVerb.infinitive || '').trim();
  const tr = normalize(mainVerb.transliteration);
  const af = normalize(mainVerb.audioFile);

  let found = Array.isArray(verbs1Data)
    ? verbs1Data.find(v => String(v?.hebrewVerb || '').trim() === inf)
    : null;

  if (!found && tr) found = verbs1Data.find(v => normalize(v?.transliteration) === tr);
  if (!found && af) found = verbs1Data.find(v => normalize(v?.audioFile) === af);

  const b = normalizeBinyan(found?.binyan);
  return b === 'nifal';
}, [mainVerb?.infinitive, mainVerb?.transliteration, mainVerb?.audioFile]);


  /* ====================================================================== */
  /* ✅ Подсветка частей глагола на иврите — ДО МИКСА (как EN/FR/ES/AM)     */
  /* ====================================================================== */

  const PRESENT_SUFFIXES = ['ים', 'ות', 'ת', 'ה', 'ים'];

  const yellow = (txt, key) => (
    <Text key={key} style={styles.prefixYellow}>{txt}</Text>
  );

  const green = (txt, key) => (
    <Text key={key} style={styles.suffixGreen}>{txt}</Text>
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

  const renderHebrewText = (hebrewtext, formIndex) => {
  const raw = String(hebrewtext || '');   // ✅ сначала объявляем
  if (!highlightEnabled) return raw;      // ✅ в translit3 показываем без подсветки

  const pos = Number(formIndex || 0);
  if (!pos) return raw;

  const isBeVerb = String(mainVerb?.infinitive || '') === 'להיות';
  const virtualPos = isBeVerb ? pos + 12 : pos;

    const applyNifalNun = isNifalForCurrentVerb && virtualPos >= 1 && virtualPos <= 24;

const withOptionalNifalNun = (word, renderFn) => {
  const w = String(word || '');
  if (!w) return '';

  // если nifal и слово начинается с נ — подсвечиваем первую букву
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

  // 1–12 настоящее (если не "быть")  ✅ + NIFAL נ
if (!isBeVerb && virtualPos >= 1 && virtualPos <= 12) {
  const parts = raw.split(' ');

  // если строка вдруг без пробела — это само слово-глагол
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


    // 13–24 прошедшее (подсветка первой ה если есть)
   // 13–24 прошедшее (подсветка первой ה если есть) + ✅ NIFAL נ + ✅ позиция 17
if (virtualPos === 13 || virtualPos === 14)
  return applyToVerbWord(raw, (w) =>
    withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'תי'))
  );

if (virtualPos === 15 || virtualPos === 16)
  return applyToVerbWord(raw, (w) =>
    withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'ת'))
  );

// ✅ 17: past 3ms — без суффикса (иначе нун не подсветится)
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


    // 25–36 будущее
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

  /* ====================================================================== */

  useEffect(() => {
    if (verbsData && verbsData.length > 0) {
      const uniqueVerbs = [...new Set(verbsData.map(item => item.infinitive))];
      const selectedVerb = uniqueVerbs[Math.floor(Math.random() * uniqueVerbs.length)];
      const allForms = verbsData.filter(verb => verb.infinitive === selectedVerb);

      setMainVerb(allForms[0]);
      setVerbListForModal(allForms); // Модалка — логичный порядок

      // ✅ formIndex ДО перемешивания массива
      const allFormsWithIndex = allForms.map((v, i) => ({ ...v, formIndex: i + 1 }));

      // Для упражнения — если хочешь перемешать, то только тут:
      const shuffledForms = shuffleArrayLocal([...allFormsWithIndex]);
      setPairs(shuffledForms);
      setRemainingPairs(allForms.length);
      setTotalExercises(allForms.length);

      setIsVerbListVisible(true);
      setPendingVerb(null);
    }
  }, [verbsData]);

  useEffect(() => {
    const start = page * 6;
    const end = start + 6;
    const currentPairs = pairs.slice(start, end);

    // ✅ микс: переносим индекс формы
    const hebrewItems = shuffleArrayLocal(
      currentPairs.map(pair => ({
        text: pair.hebrewtext,
        translit: pair.translit,
        hebrewFormIndex: pair.formIndex,
      }))
    );

    const mixedPairs = currentPairs.map((pair, index) => ({
      ...pair,
      pttext: pair.pttext,
      hebrewtext: hebrewItems[index].text,
      translit: hebrewItems[index].translit,
      hebrewFormIndex: hebrewItems[index].hebrewFormIndex,
      correct: pair.hebrewtext
    }));

    setDisplayPairs(mixedPairs);
    setHebrewActive(false);
    setSelectedRussian(null);
    setSelectedHebrew(null);
  }, [page, pairs]);

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (resolvedPairsCount === 6 && !isUpdating) {
      setIsUpdating(true);
      setTimeout(() => {
        if ((page + 1) * 6 < pairs.length) {
          setPage(prev => prev + 1);
        } else {
          setPage(0);
        }
        setCorrectAnswers(new Set());
        setSelectedRussian(null);
        setSelectedHebrew(null);
        setHebrewActive(false);
        setResolvedPairsCount(0);
        setIsUpdating(false);
      }, 1200);
    }
  }, [resolvedPairsCount, page, pairs.length, isUpdating]);

  useEffect(() => {
    if (page === 0) {
      setResolvedPairsCount(0);
    }
  }, [page]);

  const handleSelectRussian = (index) => {
    setSelectedRussian(index);
    setSelectedHebrew(null);
    setHebrewActive(true);
  };

  const handleSelectHebrew = (index) => {
    setSelectedHebrew(index);
    const selectedPair = displayPairs[index];
    const isCorrect = selectedRussian !== null && selectedPair.hebrewtext === displayPairs[selectedRussian].correct;

    if (isCorrect) {
      handleAnswer(isCorrect);
      setCorrectAnswers(prev => new Set(prev).add(selectedRussian));
      setResolvedPairsCount(prev => prev + 1);
      setRemainingPairs(prev => prev - 1);
      setCorrectCount(prev => prev + 1);
      playCorrectAnswerSound(displayPairs[selectedRussian].mp3);
      changeBackgroundColor(isCorrect);

      setIsPlaying(true);
      animationRef.current?.play();
      setTimeout(() => {
        setIsPlaying(false);
        animationRef.current?.reset();
      }, 1500);
    } else {
      setIncorrectCount(prev => prev + 1);
      playFailureSound();
      changeBackgroundColor(isCorrect);
    }
  };

  const getButtonStyle = (index, type) => {
    let style = [styles.button, type === 'hebrew' ? styles.hebrewButton : {}];
    if (correctAnswers.has(index) && type === 'portu') {
      style.push(styles.deactivatedButton);
    }
    if (type === 'portu' && index === selectedRussian) {
      style.push(styles.selectedButton);
    }
    if (type === 'hebrew' && index === selectedHebrew) {
      style.push(displayPairs[selectedRussian]?.correct === displayPairs[index].hebrewtext ? styles.correctButton : styles.wrongButton);
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

  const [resizeMode, setResizeMode] = useState('contain');
  const handleResizeModeChange = (resizeMode) => {
    setResizeMode(resizeMode);
  };

  const [failureSound, setFailureSound] = useState(null);
  const [sound, setSound] = useState(null);
  const [correctSound, setCorrectSound] = useState(null);

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
      await newSound.playAsync();
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
      console.error('Error loading sound', error);
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

  const [statistics, setStatistics] = useState(null);
  const [isStatModalVisible, setIsStatModalVisible] = useState(false);

  const handleButton3Press = async () => {
    const exerciseId = "exercise6Pt";
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

  useEffect(() => {
    if (currentIndex > 0 && currentIndex >= totalExercises) {
      setExerciseCompleted(true);
    }
  }, [currentIndex, totalExercises]);

  useEffect(() => {
    if (totalExercises > 0) {
      const newProgress = (correctCount / totalExercises) * 100;
      setProgress(newProgress);
    }
  }, [correctCount, totalExercises]);

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
        else navigation.navigate('MenuPt');
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
      routes: [{ name: 'MenuPt' }],
    });
  };

  const handleCancelExit = () => {
    setExitConfirmationVisible(false);
  };

  const handleExerciseCompletion = async () => {
    const exerciseId = 'exercise6Pt';
    const currentScore = parseFloat(progressPercent.toFixed(2));

    await updateStatistics(exerciseId, currentScore);
  };

  const resetExercise = () => {
    setCorrectCount(0);
    setIncorrectCount(0);
    setProgress(0);
    setExerciseCompleted(false);
    setCurrentIndex(0);
    setResolvedPairsCount(0);
    setCorrectAnswers(new Set());

    // Выбрать новый глагол
    const shuffledData = shuffleArray(verbsData);
    const uniqueVerbs = [...new Set(shuffledData.map(item => item.infinitive))];
    const selectedVerb = uniqueVerbs[Math.floor(Math.random() * uniqueVerbs.length)];
    const verbConjugationsRaw = shuffledData.filter(verb => verb.infinitive === selectedVerb);

    // ✅ formIndex ДО перемешивания массива
    const verbConjugationsWithIndex = verbConjugationsRaw.map((v, i) => ({ ...v, formIndex: i + 1 }));
    const verbConjugations = shuffleArrayLocal(verbConjugationsWithIndex);

    setCurrentVerb(verbConjugations[0]);
    setMainVerb(verbConjugations[0]);
    setPairs(verbConjugations);
    setTotalExercises(verbConjugations.length);
    setRemainingPairs(verbConjugations.length);
    setPendingVerb(null);
    setVerbListForModal(verbConjugations);

    // Открыть модалку только когда verbListForModal не пуст
    setTimeout(() => {
      setIsVerbListVisible(true);
    }, 10);
  };

  const [isSearchModalVisible, setSearchModalVisible] = useState(false);

  const handleSearchButtonPress = () => {
    setSearchModalVisible(true);
  };

  const [pendingVerb, setPendingVerb] = useState(null);

  const handleSelectVerb = (verb) => {
    setPendingVerb(verb); // временно сохраняем выбранный глагол
    const allFormsRaw = verbsData.filter(item => item.infinitive === verb.infinitive);

    // ✅ formIndex ДО передачи/микса
    const allForms = allFormsRaw.map((v, i) => ({ ...v, formIndex: i + 1 }));

    setVerbListForModal(allForms); // показываем формы этого глагола в модалке
    setIsVerbListVisible(true);    // открываем модалку
    setSearchModalVisible(false);
  };

  const handleStartExercise = () => {
    // Используем pendingVerb, если он есть, иначе mainVerb
    const chosenVerb = pendingVerb || mainVerb;
    if (!chosenVerb) return;

    const verbConjugationsRaw = verbsData.filter(item => item.infinitive === chosenVerb.infinitive);

    // ✅ formIndex ДО перемешивания массива
    const verbConjugationsWithIndex = verbConjugationsRaw.map((v, i) => ({ ...v, formIndex: i + 1 }));
    const verbConjugations = shuffleArray(verbConjugationsWithIndex);

    if (verbConjugations.length > 0) {
      setCurrentVerb(verbConjugations[0]);
      setMainVerb(verbConjugations[0]);
      setPairs(verbConjugations);
      setRemainingPairs(verbConjugations.length);
      setTotalExercises(verbConjugations.length);
      setCurrentIndex(0);
      setCorrectCount(0);
      setIncorrectCount(0);
      setProgress(0);
      setCorrectAnswers(new Set());
      setResolvedPairsCount(0);
      setPage(0);
      setExerciseCompleted(false);
      setIsVerbListVisible(false); // закрываем модалку
      setPendingVerb(null); // сбрасываем временный глагол
    }
  };

  const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');
  console.log('Physical Screen Width:', screenWidth); // Ширина экрана в физических пикселях

  return (
    <>
      {isVerbListVisible && (
        <VerbListModal2
          visible={isVerbListVisible}
          language={language}
          verbs={verbListForModal}
          onStartExercise={handleStartExercise}
          onClose={() => {
            setIsVerbListVisible(false);
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Menu');
          }}
        />
      )}

      {!isVerbListVisible && (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.container}>

            <View style={styles.topBar}>
              <Animated.Image
                source={require('./VERBIFY.png')}
                style={[styles.logoImage, { opacity: fadeAnim }]}
              />
              <View style={styles.buttonContainer}>
                {isPlaying && (
                  <LottieView
                    ref={animationRef}
                    source={require('./assets/Animation - 1718430107767.json')}
                    autoPlay={true}
                    loop={true}
                    style={styles.lottieAnimation}
                  />
                )}

                <TouchableOpacity onPress={handleSoundToggle}>
                  <Animated.Image
                    source={soundEnabled ? require('./SoundOn.png') : require('./SoundOff.png')}
                    style={[styles.buttonImage, { opacity: fadeAnim }]}
                  />
                </TouchableOpacity>

                {/* ✅ translit toggle: картинки поменяны местами */}
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
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleDescriptionModal}>
                  <Animated.Image
                    source={require('./question.png')}
                    style={[styles.buttonImage, { opacity: fadeAnim }]}
                  />
                  <TaskDescriptionModal6
                    visible={isDescriptionModalVisible}
                    onToggle={toggleDescriptionModal}
                    language={language}
                    dontShowAgain6={dontShowAgain6}
                    onToggleDontShowAgain={handleToggleDontShowAgain6}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSearchButtonPress}>
                  <Animated.Image
                    source={require('./search1.png')}
                    style={[styles.buttonImage, { opacity: fadeAnim }]}
                  />
                  <SearchModalPt
                    visible={isSearchModalVisible}
                    onToggle={() => setSearchModalVisible(false)}
                    onSelectVerb={handleSelectVerb} // Передаем обработчик
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
              <View style={styles.textContainer}>
                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>CORRETO: {correctCount / 2}</Text>
                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>INCORRETO: {incorrectCount}</Text>
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
              <ProgressBar progress={progress / 2} totalExercises={100} />
            </Animated.View>

            <Animated.Text style={[styles.title, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>
              CONJUGAR O VERBO
            </Animated.Text>

            {currentVerb && (
              <Animated.View style={[styles.verbContainer, { opacity: fadeAnim }]}>
                <Text style={styles.verbText} maxFontSizeMultiplier={1.2}> {currentVerb.infinitive}</Text>
                <Text style={styles.verbTextTr} maxFontSizeMultiplier={1.2}> {currentVerb.transliteration}</Text>
                <Text style={styles.verbTextRu} maxFontSizeMultiplier={1.2}> {currentVerb.portu}</Text>
                <TouchableOpacity onPress={() => playAudio(currentVerb.audioFile)} style={styles.audioButton}>
                  <Image source={require('./speaker3.png')} style={styles.audioIcon} />
                </TouchableOpacity>
              </Animated.View>
            )}

            <Animated.View style={{ transform: [{ translateY: blockAnimation }] }}>
              {displayPairs.map((pair, index) => (
                <View key={index} style={styles.row}>
                  <TouchableOpacity
                    style={getButtonStyle(index, 'portu')}
                    onPress={() => handleSelectRussian(index)}
                    disabled={correctAnswers.has(index)}
                  >
                    <Text style={[
                      styles.text,
                      styles.russianText,
                      correctAnswers.has(index) ? styles.deactivatedButtonText : {}
                    ]} maxFontSizeMultiplier={1.2}>
                      {pair.pttext}
                    </Text>
                    {pair.gender && (
                      <Image
                        source={getImageForGender(pair.gender)}
                        style={styles.iconStyle}
                      />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={getButtonStyle(index, 'hebrew')}
                    onPress={() => handleSelectHebrew(index)}
                    disabled={!hebrewActive || correctAnswers.has(selectedRussian)}
                  >
                    <Text
                      style={[
                        styles.text,
                        styles.hebrewText,
                        !showTranslit && styles.hebrewCenterWhenNoTranslit,
                      ]}
                      maxFontSizeMultiplier={1.2}
                    >
                      {/* ✅ подсветка как в EN/FR/ES */}
                      {renderHebrewText(pair.hebrewtext, pair.hebrewFormIndex)}
                    </Text>

                    {/* ✅ место сохраняем (высота кнопки не меняется) */}
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

            {exerciseCompleted && (
              <CompletionMessagePt
                handleOK={handleExerciseCompletion}
                navigateToMenu={() => navigation.navigate('MenuPt')}
                correctAnswers={correctCount}
                incorrectAnswers={incorrectCount}
                correctAnswersPercentage={progressPercent.toFixed(2)}
                grade={grade}
                restartTask={resetExercise}
              />
            )}
            <ExitConfirmationModal
              visible={exitConfirmationVisible}
              onCancel={handleCancelExit}
              onConfirm={handleConfirmExit}
            />
          </View>
        </ScrollView>
      )}

      {/* Модалки должны быть вне ScrollView/TouchableOpacity */}
      <StatModal6Pt
        visible={isStatModalVisible}
        onToggle={() => setIsStatModalVisible(false)}
        statistics={statistics}
      />

      <TaskDescriptionModal6
        visible={isDescriptionModalVisible}
        onToggle={toggleDescriptionModal}
        language={language}
        dontShowAgain6={dontShowAgain6}
        onToggleDontShowAgain={handleToggleDontShowAgain6}
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
    // paddingTop:  5,
  },
  logoImage: {
    width: 90,
    height: 90,
    marginLeft: 10,
  },
  lottie: {
    width: 36,
    height: 36,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginRight: 10,
    justifyContent: 'center', // Выровнять по центру по горизонтали
  },
  buttonImage: {
    width: 44,
    height: 44,
    marginLeft: 10,
    marginTop: -5,
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
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
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
    fontSize: 22,
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
    width: "100%",
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: wp('1%'),
    marginBottom: 10,
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
    shadowOffset: {
      width: 0,
      height: 2
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
    marginLeft: 5,
  },
  verbTextTr: {
    fontSize: 15,
    color: '#333',
    fontWeight: 'bold',
  },
  verbTextRu: {
    fontSize: 15,
    color: '#003882',
    fontWeight: 'bold',
  },
  audioIcon: {
    width: 22,
    height: 22,
    marginRight: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
    width: "100%",
  },
  button: {
    // flex: 1.05,
    width: '48.5%',
    marginHorizontal: 5,
    padding: 5,
    backgroundColor: '#D1E3F1',
    borderRadius: 10,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  russianButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hebrewButton: {
    flexDirection: 'column',
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
hebrewText: { fontSize: 22, textAlign: 'center', color: '#152039', fontFamily: FONT_SEMIBOLD },
  // ✅ когда транслит скрыт — визуально центрируем иврит, высоту не меняем
  hebrewCenterWhenNoTranslit: {
    transform: [{ translateY: 12 }],
  },

  translitText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 2,
    color: '#FF5757',
    fontWeight: 'bold',
  },

  // ✅ место сохраняем, только прячем
  translitHidden: {
    opacity: 0,
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

  // ✅ стили подсветки частей иврита
  prefixYellow: {
    color: '#00a2ff',
    fontWeight: 'bold',
  },
  suffixGreen: {
    color: '#ff3ab3',
    fontWeight: 'bold',
  },
  translitHidden: { opacity: 0 },

});

export default Exercise6Pt;
