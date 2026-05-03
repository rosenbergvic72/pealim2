// Exercise6Es.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, BackHandler, Platform } from 'react-native';
import verbsData from './verbs6RU.json';
import ProgressBar from './ProgressBar';
import { Animated } from 'react-native';
import { Audio } from 'expo-av';
import soundsconj from './soundconj';
import sounds from './Soundss';
import CompletionMessageEs from './CompletionMessageEs';
import ExitConfirmationModal from './ExitConfirmationModalEs';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import TaskDescriptionModal6 from './TaskDescriptionModal6';
import StatModal6Es from './StatModal6Es';
import { updateStatistics, getStatistics } from './stat';
import SearchModalEs from './SearchModalEs';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VerbListModal2 from './VerbListModal2';
import verbs1Data from './verbs1.json';

const FONT_REG = 'mt-regular';
const FONT_MED = 'mt-medium';
const FONT_BOLD = 'mt-bold';
const FONT_SEMIBOLD = 'mt-semibold';

const HEBREW_FONT = Platform.OS === 'android' ? 'mt-semibold' : 'mt-bold';
const HEBREW_FS = Platform.OS === 'android' ? 18 : 22;

const Exercise6Es = () => {
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
  const navigation = useNavigation();
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const allowExitRef = useRef(false);
  const completionTriggeredRef = useRef(false);

  const [exitConfirmationVisible, setExitConfirmationVisible] = useState(false);
  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const toggleDescriptionModal = () => setDescriptionModalVisible(prev => !prev);

  const [soundEnabled, setSoundEnabled] = useState(true);

  // 0 — translit1: highlight ON + translit ON
  // 1 — translit2: highlight ON + translit OFF
  // 2 — translit3: highlight OFF + translit OFF
  const [translitMode, setTranslitMode] = useState(0);

  const handleTranslitToggle = () => {
    setTranslitMode(prev => {
      if (prev === 0) return 1;
      if (prev === 1) return 2;
      return 0;
    });
  };

  const showTranslit = translitMode === 0;
  const highlightEnabled = translitMode !== 2;

  const totalAnswers = correctCount + incorrectCount;
  const [currentVerb, setCurrentVerb] = useState({
    infinitive: '',
    spanish: '',
    transliteration: ''
  });

  const [language, setLanguage] = useState('es');

  const [mainVerb, setMainVerb] = useState(null);
  const [verbListForModal, setVerbListForModal] = useState([]);
  const [isVerbListVisible, setIsVerbListVisible] = useState(true);
  const [selectedTenses, setSelectedTenses] = useState({
    present: true,
    past: true,
    future: true,
  });

  const [dontShowAgain6, setDontShowAgain6] = useState(false);
  const [languageLoaded, setLanguageLoaded] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const lang = await AsyncStorage.getItem('language');
      const hidden = await AsyncStorage.getItem('exercise6_description_hidden');

      setLanguage(lang || 'es');
      setDontShowAgain6(hidden === 'true');
      setLanguageLoaded(true);
    };

    initialize();
  }, []);

  useEffect(() => {
    const checkFlagAndLang = async () => {
      const hidden = await AsyncStorage.getItem('exercise6_description_hidden');
      const lang = await AsyncStorage.getItem('language');

      if (lang) {
        setLanguage(lang);
        setDontShowAgain6(hidden === 'true');
        setLanguageLoaded(true);
      }

      setDontShowAgain6(hidden === 'true');
    };

    checkFlagAndLang();
  }, []);

  const handleToggleDontShowAgain6 = async () => {
    const newValue = !dontShowAgain6;
    setDontShowAgain6(newValue);
    await AsyncStorage.setItem('exercise6_description_hidden', newValue ? 'true' : '');
  };

  const getGrade = (percentage) => {
    if (percentage === 100) return '¡Excepcional! ¡Perfecto! ¡No cometiste ni un solo error!';
    if (percentage >= 90) return '¡Excelente! Casi perfecto, ¡sigue así!';
    if (percentage >= 80) return '¡Genial! ¡Lo estás haciendo muy bien!';
    if (percentage >= 70) return '¡Bien! ¡Has aprendido el material bastante bien!';
    if (percentage >= 60) return '¡Bastante bien! ¡Hay un progreso constante!';
    if (percentage >= 50) return '¡No está mal! Pero hay margen para mejorar.';
    if (percentage >= 40) return '¡Satisfactorio! Sigue trabajando y lo lograrás.';
    if (percentage >= 30) return '¡Vas pillándole el truco! ¡Sigue practicando!';
    if (percentage >= 20) return 'Prueba a cambiar la estrategia de estudio, ¡puede ayudar!';
    if (percentage >= 10) return 'Es difícil, pero no te rindas. ¡Sigue practicando!';
    return 'Hace falta más trabajo. Lo importante es no rendirse y seguir aprendiendo.';
  };

  const progressPercent = totalAnswers > 0 ? (correctCount / totalAnswers) * 100 : 0;
  const grade = getGrade(progressPercent);

  const [failureSound, setFailureSound] = useState(null);
  const [sound, setSound] = useState(null);
  const [correctSound, setCorrectSound] = useState(null);

  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
    if (soundEnabled && sound) sound.setVolumeAsync(0);
    else if (!soundEnabled && sound) sound.setVolumeAsync(1);
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
    if (currentVerb.infinitive) fadeIn();
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
    if (isCorrect) setCorrectCount(prev => prev + 1);
    else setIncorrectCount(prev => prev + 1);

    setCurrentIndex(prevIndex => {
      const newIndex = prevIndex + 1;
      handleProgressUpdate(newIndex);
      return newIndex;
    });
  };

  const handleProgressUpdate = (nextIndex = currentIndex) => {
    setProgress(totalExercises > 0 ? nextIndex : 0);
  };

const finishExerciseWithDelay = useCallback((finalScore) => {
  if (completionTriggeredRef.current) return;
  completionTriggeredRef.current = true;

  setTimeout(async () => {
    setExerciseCompleted(true);
    await updateStatistics('exercise6Es', Number(finalScore));
  }, 1400);
}, []);

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

  const buildVerbForms = useCallback((infinitive) => {
    return verbsData
      .filter(verb => verb.infinitive === infinitive)
      .map((v, i) => ({ ...v, formIndex: i + 1 }));
  }, []);

  const chooseRandomVerb = useCallback(() => {
    if (!verbsData || verbsData.length === 0) return null;
    const uniqueVerbs = [...new Set(verbsData.map(item => item.infinitive))];
    const selectedVerb = uniqueVerbs[Math.floor(Math.random() * uniqueVerbs.length)];
    return selectedVerb;
  }, []);

  useEffect(() => {
    if (verbsData && verbsData.length > 0) {
      const selectedVerb = chooseRandomVerb();
      if (!selectedVerb) return;

      const allForms = buildVerbForms(selectedVerb);

      setMainVerb(allForms[0] || null);
      setVerbListForModal(allForms);

      const shuffledForms = shuffleArrayLocal([...allForms]);
      setPairs(shuffledForms);
      setRemainingPairs(allForms.length);
      setTotalExercises(allForms.length);

      setIsVerbListVisible(true);
      setPendingVerb(null);

      setCurrentVerb({
        infinitive: allForms[0]?.infinitive || '',
        transliteration: allForms[0]?.transliteration || '',
        spanish: allForms[0]?.spanish || '',
        audioFile: allForms[0]?.audioFile || '',
      });
    }
  }, [buildVerbForms, chooseRandomVerb]);

  useEffect(() => {
    const start = page * 6;
    const end = start + 6;
    const currentPairs = pairs.slice(start, end);

    const hebrewItems = shuffleArrayLocal(
      currentPairs.map(pair => ({
        text: pair.hebrewtext,
        translit: pair.translit,
        formIndex: pair.formIndex,
      }))
    );

    const mixedPairs = currentPairs.map((pair, index) => ({
      ...pair,
      estext: pair.estext,
      hebrewtext: hebrewItems[index].text,
      translit: hebrewItems[index].translit,
      hebrewFormIndex: hebrewItems[index].formIndex,
      correct: pair.hebrewtext,
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
        if ((page + 1) * 6 < pairs.length) setPage(prev => prev + 1);
        else setPage(0);

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
    if (page === 0) setResolvedPairsCount(0);
  }, [page]);

  const handleSelectRussian = (index) => {
    setSelectedRussian(index);
    setSelectedHebrew(null);
    setHebrewActive(true);
  };

  const handleSelectHebrew = (index) => {
    setSelectedHebrew(index);
    const selectedPair = displayPairs[index];
    const isCorrect =
      selectedRussian !== null &&
      selectedPair.hebrewtext === displayPairs[selectedRussian].correct;

    if (isCorrect) {
      handleAnswer(isCorrect);
      setCorrectAnswers(prev => new Set(prev).add(selectedRussian));
      setResolvedPairsCount(prev => prev + 1);

      setRemainingPairs(prev => {
        const nextRemaining = prev - 1;

     if (nextRemaining === 0) {
  const nextCorrect = correctCount + 1;
  const nextIncorrect = incorrectCount;
  const nextTotal = nextCorrect + nextIncorrect;
  const finalScore = nextTotal > 0 ? ((nextCorrect / nextTotal) * 100).toFixed(2) : '0';

  finishExerciseWithDelay(finalScore);
}

        return nextRemaining;
      });

      playCorrectAnswerSound(displayPairs[selectedRussian].mp3);
      changeBackgroundColor(isCorrect);
    } else {
      setIncorrectCount(prev => prev + 1);
      playFailureSound();
      changeBackgroundColor(isCorrect);
    }
  };

  const getButtonStyle = (index, type) => {
    let style = [styles.button, type === 'hebrew' ? styles.hebrewButton : {}];
    if (correctAnswers.has(index) && type === 'spanish') style.push(styles.deactivatedButton);
    if (type === 'spanish' && index === selectedRussian) style.push(styles.selectedButton);
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
      if (correctSound) await correctSound.unloadAsync();
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

  const [statistics, setStatistics] = useState(null);
  const [isStatModalVisible, setIsStatModalVisible] = useState(false);

  const handleButton3Press = async () => {
    const exerciseId = "exercise6Es";
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

  useFocusEffect(
    useCallback(() => {
      if (!isVerbListVisible) return;

      const onBackPress = () => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('MenuEs');
        return true;
      };

      const bh = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => bh.remove();
    }, [isVerbListVisible, navigation])
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
    }, [isVerbListVisible, exitConfirmationVisible, navigation])
  );

  useEffect(() => {
    navigation.setOptions({ headerLeft: () => null });
  }, [navigation]);

  const handleConfirmExit = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MenuEs' }],
    });
  };

  const handleCancelExit = () => {
    setExitConfirmationVisible(false);
  };

  const handleExerciseCompletion = async () => {
    const exerciseId = 'exercise6Es';
    const currentScore = parseFloat(progressPercent.toFixed(2));
    await updateStatistics(exerciseId, currentScore);
  };

  const resetExercise = () => {
    completionTriggeredRef.current = false;
    setCorrectCount(0);
    setIncorrectCount(0);
    setProgress(0);
    setExerciseCompleted(false);
    setCurrentIndex(0);
    setResolvedPairsCount(0);
    setCorrectAnswers(new Set());
    setSelectedRussian(null);
    setSelectedHebrew(null);
    setHebrewActive(true);
    setPage(0);

    const selectedVerb = chooseRandomVerb();
    if (!selectedVerb) return;

    const verbConjugations = buildVerbForms(selectedVerb);

    setCurrentVerb({
      infinitive: verbConjugations[0]?.infinitive || '',
      transliteration: verbConjugations[0]?.transliteration || '',
      spanish: verbConjugations[0]?.spanish || '',
      audioFile: verbConjugations[0]?.audioFile || '',
    });

    setMainVerb(verbConjugations[0] || null);
    setPairs([]);
    setTotalExercises(verbConjugations.length);
    setRemainingPairs(verbConjugations.length);
    setPendingVerb(null);
    setVerbListForModal(verbConjugations);

    setTimeout(() => {
      setIsVerbListVisible(true);
    }, 10);
  };

  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const handleSearchButtonPress = () => setSearchModalVisible(true);

  const [pendingVerb, setPendingVerb] = useState(null);

  const handleSelectVerb = (verb) => {
    setPendingVerb(verb);
    const allForms = buildVerbForms(verb.infinitive);

    setVerbListForModal(allForms);
    setIsVerbListVisible(true);
    setSearchModalVisible(false);

    setCurrentVerb({
      infinitive: allForms[0]?.infinitive || '',
      transliteration: allForms[0]?.transliteration || '',
      spanish: allForms[0]?.spanish || '',
      audioFile: allForms[0]?.audioFile || '',
    });
  };

  const handleStartExercise = ({ selectedTenses: nextSelectedTenses, forms, totalForms } = {}) => {
    const chosenVerb = pendingVerb || mainVerb;
    if (!chosenVerb) return;

    const chosenForms = Array.isArray(forms) && forms.length > 0
      ? forms.map((v, i) => ({
          ...v,
          formIndex: Number(v.formIndex) || (i + 1),
        }))
      : buildVerbForms(chosenVerb.infinitive);

    const verbConjugations = shuffleArrayLocal([...chosenForms]);

    if (verbConjugations.length > 0) {
      completionTriggeredRef.current = false;
      setSelectedTenses(nextSelectedTenses || { present: true, past: true, future: true });

      setCurrentVerb({
        infinitive: verbConjugations[0]?.infinitive || '',
        transliteration: verbConjugations[0]?.transliteration || '',
        spanish: verbConjugations[0]?.spanish || '',
        audioFile: verbConjugations[0]?.audioFile || '',
      });

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
      setIsVerbListVisible(false);
      setPendingVerb(null);
      setSelectedRussian(null);
      setSelectedHebrew(null);
      setHebrewActive(true);
    }
  };

  const { width: screenWidth } = Dimensions.get('screen');
  console.log('Physical Screen Width:', screenWidth);

  const normalize = (s) => String(s || '').trim().toLowerCase();
  const normalizeBinyan = (s) => normalize(s).replace(/[\s’']/g, '');

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

  const renderHebrewText = (hebrewtext, formIndex) => {
    const pos = Number(formIndex || 0);
    const raw = String(hebrewtext || '');
    if (!pos) return raw;

    const isBeVerb = String(mainVerb?.infinitive || '') === 'להיות';
    const virtualPos = isBeVerb ? pos + 12 : pos;

    const applyNifalNun = isNifalForCurrentVerb && virtualPos >= 1 && virtualPos <= 24;

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

    if (!isBeVerb && virtualPos >= 1 && virtualPos <= 12) {
      const parts = raw.split(' ');
      if (parts.length < 2) return withOptionalNifalNun(parts[0] || '', (x) => renderPresentVerbWord(x));

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

    if (virtualPos === 13 || virtualPos === 14)
      return applyToVerbWord(raw, (w) =>
        withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'תי'))
      );

    if (virtualPos === 15 || virtualPos === 16)
      return applyToVerbWord(raw, (w) =>
        withOptionalNifalNun(w, (rest) => renderPastWithHitpaelPrefixAndSuffix(rest, 'ת'))
      );

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
            else navigation.navigate('MenuEs');
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
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSearchButtonPress}>
                  <Animated.Image
                    source={require('./search1.png')}
                    style={[styles.buttonImage, { opacity: fadeAnim }]}
                  />
                  <SearchModalEs
                    visible={isSearchModalVisible}
                    onToggle={() => setSearchModalVisible(false)}
                    onSelectVerb={handleSelectVerb}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
              <View style={styles.textContainer}>
                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>CORRECTAS: {correctCount}</Text>
                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>INCORRECTAS: {incorrectCount}</Text>
              </View>
              <View style={styles.remainingTasksContainer}>
                <Text style={styles.remainingTasksText} maxFontSizeMultiplier={1.2}>
                  {remainingPairs}ы
                </Text>
              </View>
              <Animated.View style={[styles.percentContainer, { backgroundColor, borderRadius: 10 }]}>
                <Text style={styles.percentText} maxFontSizeMultiplier={1.2}>
                  {progressPercent.toFixed(2)}%
                </Text>
              </Animated.View>
            </Animated.View>

            <Animated.View style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}>
              <ProgressBar progress={progress} totalExercises={totalExercises} />
            </Animated.View>

            <Animated.Text style={[styles.title, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>
              CONJUGA EL VERBO
            </Animated.Text>

            {currentVerb && (
              <Animated.View style={[styles.verbContainer, { opacity: fadeAnim }]}>
                <Text style={styles.verbText} maxFontSizeMultiplier={1.2}> {currentVerb.infinitive}</Text>
                <Text style={styles.verbTextTr} maxFontSizeMultiplier={1.2}> {currentVerb.transliteration}</Text>
                <Text style={styles.verbTextRu} maxFontSizeMultiplier={1.2}> {currentVerb.spanish}</Text>

                <TouchableOpacity onPress={() => playAudio(currentVerb.audioFile)} style={styles.audioButton}>
                  <Image source={require('./speaker3.png')} style={styles.audioIcon} />
                </TouchableOpacity>
              </Animated.View>
            )}

            <Animated.View style={{ transform: [{ translateY: blockAnimation }] }}>
              {displayPairs.map((pair, index) => (
                <View key={index} style={styles.row}>
                  <TouchableOpacity
                    style={getButtonStyle(index, 'spanish')}
                    onPress={() => handleSelectRussian(index)}
                    disabled={correctAnswers.has(index)}
                  >
                    <Text style={[
                      styles.text,
                      styles.russianText,
                      correctAnswers.has(index) ? styles.deactivatedButtonText : {}
                    ]} maxFontSizeMultiplier={1.2}>
                      {pair.estext}
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
                        styles.hebrewText,
                        !showTranslit && styles.hebrewCenterWhenNoTranslit,
                      ]}
                      maxFontSizeMultiplier={1.2}
                    >
                      {translitMode === 2
                        ? pair.hebrewtext
                        : renderHebrewText(pair.hebrewtext, pair.hebrewFormIndex)
                      }
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

            {exerciseCompleted && (
              <CompletionMessageEs
                handleOK={handleExerciseCompletion}
                navigateToMenu={() => navigation.navigate('MenuEs')}
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

      <StatModal6Es
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
  scrollViewContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 5,
    paddingTop: 0,
    backgroundColor: '#AFC1D0',
    height: '100%',
    width: '100%'
  },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  logoImage: { width: 90, height: 90, marginLeft: 10 },
  buttonContainer: { flexDirection: 'row', marginRight: 10, justifyContent: 'center' },
  buttonImage: { width: 44, height: 44, marginLeft: 10, marginTop: -5 },

  progressContainer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    width: '100%', height: 50, backgroundColor: '#6C8EBB', borderRadius: 10, marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5
  },

  textContainer: { flex: 1, justifyContent: 'center', width: '50%' },
  prtext: { fontSize: 12, color: 'white', textAlign: 'left', marginLeft: 15 },

  percentContainer: { alignItems: 'center', marginRight: 10 },
  percentText: { fontSize: 22, color: 'white', fontWeight: 'bold', textAlign: 'center', borderRadius: 10, alignItems: 'center', paddingLeft: 10, paddingRight: 10 },

  remainingTasksContainer: { alignItems: 'center', marginRight: 10 },
  remainingTasksText: { fontSize: 20, color: 'white', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#83A3CD', borderRadius: 10, alignItems: 'center', paddingLeft: 10, paddingRight: 10 },

  ProgressBarcontainer: { width: "100%", marginBottom: 5 },

  title: { fontSize: 18, fontWeight: 'bold', marginTop: wp('1%'), marginBottom: 10, color: '#2F4766', textAlign: 'center' },

  verbContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 5, marginBottom: 10, backgroundColor: '#FFFDEF', borderRadius: 10,
    marginLeft: 5, marginRight: 5,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
    height: 40, width: '100%',
  },

  verbText: { fontSize: 15, color: '#FF5757', fontWeight: 'bold', marginLeft: 5 },
  verbTextTr: { fontSize: 15, color: '#333', fontWeight: 'bold' },
  verbTextRu: { fontSize: 15, color: '#003882', fontWeight: 'bold' },

  audioButton: { padding: 2 },
  audioIcon: { width: 22, height: 22, marginRight: 5 },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5, width: "100%" },

  button: {
    width: '48.5%', marginHorizontal: 5, padding: 4, backgroundColor: '#D1E3F1',
    borderRadius: 10, justifyContent: 'center', flexDirection: 'row', alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5
  },

  hebrewButton: { flexDirection: 'column', alignItems: 'center' },

  text: { fontSize: 15, fontWeight: 'bold' },

  russianText: { textAlign: 'left', flex: 1, marginLeft: 3, color: '#152039' },

  hebrewText: {
    fontSize: HEBREW_FS,
    lineHeight: HEBREW_FS + 2,
    textAlign: 'center',
    color: '#152039',
    fontFamily: HEBREW_FONT,
    marginTop: 2,
    paddingTop: 2,
  },

  hebrewCenterWhenNoTranslit: {
    transform: [{ translateY: 12 }],
  },

  translitText: {
    fontSize: 15,
    lineHeight: 16,
    textAlign: 'center',
    color: '#FF5757',
    fontWeight: 'bold',
    marginTop: 2,
    paddingTop: 2,
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

  prefixYellow: { color: '#00a2ffff', fontFamily: HEBREW_FONT },
  suffixGreen: { color: '#ff3ab3ff', fontFamily: HEBREW_FONT },
});

export default Exercise6Es;