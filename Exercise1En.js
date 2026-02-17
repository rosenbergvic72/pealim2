import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, BackHandler, Image, Animated } from 'react-native';
import VerbCard1 from './VerbCard1En';
import verbsData from './verbs1.json';
// import verbsData from './verbs1copy.json';
import verbs1RU from './verbs11RU.json';
// import verbs1RU from './verbs11RUcopy.json';
import ProgressBar from './ProgressBar';
import { useFocusEffect } from '@react-navigation/native';
import CompletionMessageEn from './CompletionMessageEn';
import ExitConfirmationModal from './ExitConfirmationModalEn';
import { Audio } from 'expo-av';
import TaskDescriptionModal6 from './TaskDescriptionModal1';
import StatModal1En from './StatModal1En';
import { updateStatistics, getStatistics } from './stat';
import sounds from './Soundss';
import soundsConj from './soundconj'; // Импорт дополнительных звуков
import LottieView from 'lottie-react-native';
import animation from './assets/Animation - 1723020554284.json';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VerbListModal from './VerbListModal'; // импорт модалки
import ExcludedVerbsModal1 from './ExcludedVerbsModal1';

// Нормализация строк для сравнения переводов
const normalize = (s = '') =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');

// ВАЖНО: тут shuffleArray уже ограничивает до 24 в исходнике.
// Мы НЕ используем его для колоды, только для перемешивания опций (как раньше).
const shuffleArray = (array) => {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 24);
};

// NEW: тасовка без slice (для колоды с excluded/pinned)
const shuffleAll = (array) => {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ✅ NEW: сбор колоды с учётом excluded + pinned (24)
// - excluded выкидываем
// - pinned берём максимум 8 (если их больше — случайно)
// - итоговую колоду перемешиваем, чтобы pinned НЕ шли первыми
const buildDeck = (
  allVerbs,
  excluded = [],
  pinned = [],
  deckSize = 24
) => {
  const excludedSet = new Set((excluded || []).map(String));
  const pinnedSet = new Set((pinned || []).map(String));

  // 1️⃣ общий пул без исключённых
  const pool = (allVerbs || []).filter((v) => v && !excludedSet.has(String(v.hebrewVerb)));

  // если пула меньше размера упражнения — просто перемешиваем
  if (pool.length <= deckSize) {
    return shuffleAll(pool);
  }

  // 2️⃣ pinned и обычные
  const pinnedAll = pool.filter((v) => pinnedSet.has(String(v.hebrewVerb)));
  const othersAll = pool.filter((v) => !pinnedSet.has(String(v.hebrewVerb)));

  // 3️⃣ динамический лимит pinned
  const pinnedCount = pinnedAll.length;
  let pinnedSoftCap = 8;

    if (pinnedCount >= 96) pinnedSoftCap = 12;
  else if (pinnedCount >= 72) pinnedSoftCap = 11;
  else if (pinnedCount >= 48) pinnedSoftCap = 10;
  else if (pinnedCount >= 24)  pinnedSoftCap = 9;


  pinnedSoftCap = Math.min(pinnedSoftCap, deckSize);

  // 4️⃣ случайно берём pinned до softCap (НО с подстраховкой ниже)
  const pinnedShuffled = shuffleAll(pinnedAll);
  let pinnedPicked = pinnedShuffled.slice(0, Math.min(pinnedSoftCap, pinnedShuffled.length));

  // 5️⃣ добираем обычные
  const needFromOthers = deckSize - pinnedPicked.length;
  let othersPicked = shuffleAll(othersAll).slice(0, Math.min(needFromOthers, othersAll.length));

  // 6️⃣ если обычных не хватило — разрешаем взять pinned больше pinnedSoftCap
  const stillNeed = deckSize - (pinnedPicked.length + othersPicked.length);

  if (stillNeed > 0) {
    const alreadyPinned = new Set(pinnedPicked.map((v) => String(v.hebrewVerb)));
    const extraPinned = pinnedShuffled.filter((v) => !alreadyPinned.has(String(v.hebrewVerb)));
    pinnedPicked = pinnedPicked.concat(extraPinned.slice(0, stillNeed));
  }

  // 7️⃣ финальное перемешивание — pinned НЕ идут первыми
  return shuffleAll([...pinnedPicked, ...othersPicked]);
};
const getGrade = (percentage) => {
  if (percentage === 100) return 'Excellent! Perfect score with no mistakes!';
  if (percentage >= 90) return 'Amazing! Almost perfect, keep it up!';
  if (percentage >= 80) return 'Great job! You are doing very well!';
  if (percentage >= 70) return 'Good! You have learned the material well!';
  if (percentage >= 60) return 'Pretty good! There is steady progress!';
  if (percentage >= 50) return 'Not bad, but there is room for improvement.';
  if (percentage >= 40) return 'Satisfactory! Keep trying and you will succeed!';
  if (percentage >= 30) return 'You are catching on, keep practicing!';
  if (percentage >= 20) return 'Try changing your learning strategy, it may help!';
  if (percentage >= 10) return 'Tough, but don’t give up! Keep practicing.';
  return 'Serious work is needed! Stay motivated and keep learning.';
};

// Компонент деталей
const VerbDetailsContainer = ({ verbDetails, showRussianText, handleSpeakerPress }) => {
  const leftFillAnim = useRef(new Animated.Value(0)).current;
  const rightFillAnim = useRef(new Animated.Value(0)).current;
  const [prevVerbDetails, setPrevVerbDetails] = useState(verbDetails);

  const animationRef = useRef(null);

  useEffect(() => {
    if (prevVerbDetails.hebrewtext !== verbDetails.hebrewtext) {
      leftFillAnim.setValue(0);
      Animated.timing(leftFillAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }).start(() => {
        setPrevVerbDetails(verbDetails);
      });

      rightFillAnim.setValue(0);
    }

    if (showRussianText) {
      Animated.timing(rightFillAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, [verbDetails, showRussianText]);

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
      <Animated.View style={[styles.verbDetailsHalf, styles.verbDetailsLeft, { width: leftWidth }]} />
      <Animated.View style={[styles.verbDetailsHalf, styles.verbDetailsRight, { width: rightWidth }]} />

      <View style={styles.verbDetailsContent}>
        <View style={styles.verbDetailsLeftContent}>
          <Text style={styles.verbDetailsHebrew} maxFontSizeMultiplier={1.2}>
            {verbDetails.hebrewtext}
          </Text>
          <Text style={styles.verbDetailsTranslit} maxFontSizeMultiplier={1.2}>
            {verbDetails.translit}
          </Text>
        </View>

        <View style={styles.verbDetailsRightContent}>
          {showRussianText ? (
            <Text style={styles.verbDetailsRussian} maxFontSizeMultiplier={1.2}>
              {verbDetails.entext}
            </Text>
          ) : (
         <LottieView
                     pointerEvents="none"
                     ref={animationRef}
                     source={animation}
                     autoPlay
                     loop
                     style={styles.lottieAnimation}
                   />
          )}
        </View>

        {showRussianText && !!verbDetails.mp3 && (
          <TouchableOpacity style={styles.speakerButton} onPress={() => handleSpeakerPress(verbDetails.mp3)}>
            <Image source={require('./speaker1.png')} style={styles.speakerIcon} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const cachedSounds = {};

const handleSpeakerPress = async (audioFile) => {
  if (!audioFile) {
    console.error('Audio file is undefined.');
    return;
  }

  let soundObject;
  if (cachedSounds[audioFile]) {
    soundObject = cachedSounds[audioFile];
  } else {
    const soundFile = soundsConj[audioFile.replace('.mp3', '')];
    if (!soundFile) {
      console.error(`Audio file ${audioFile} not found in soundsConj.`);
      return;
    }

    soundObject = new Audio.Sound();
    await soundObject.loadAsync(soundFile);
    cachedSounds[audioFile] = soundObject;
  }

  try {
    await soundObject.playAsync();
    soundObject.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        soundObject.unloadAsync();
        delete cachedSounds[audioFile];
      }
    });
  } catch (error) {
    console.log('Error playing sound:', error);
    soundObject.unloadAsync();
    delete cachedSounds[audioFile];
  }
};

const Exercise1En = ({ navigation }) => {
  // keys только для Exercise1 (общие для RU/EN, чтобы списки совпадали)
  const EXCLUDED_KEY = 'exercise1_excluded_verbs';
  const PINNED_KEY = 'exercise1_pinned_verbs';

  const [excludedIds, setExcludedIds] = useState([]);
  const [pinnedIds, setPinnedIds] = useState([]);
  const excludedRef = useRef([]);
  const pinnedRef = useRef([]);
  const [isExcludedModalVisible, setIsExcludedModalVisible] = useState(false);

  const loadLists = useCallback(async () => {
    try {
      const excludedRaw = await AsyncStorage.getItem(EXCLUDED_KEY);
      const pinnedRaw = await AsyncStorage.getItem(PINNED_KEY);

      const excluded = excludedRaw ? JSON.parse(excludedRaw) : [];
      const pinned = pinnedRaw ? JSON.parse(pinnedRaw) : [];

      const safeExcluded = Array.isArray(excluded) ? excluded : [];
      const safePinned = Array.isArray(pinned) ? pinned : [];

      setExcludedIds(safeExcluded);
      setPinnedIds(safePinned);
      excludedRef.current = safeExcluded;
      pinnedRef.current = safePinned;
    } catch (e) {
      console.warn('Failed to load excluded/pinned lists', e);
      setExcludedIds([]);
      setPinnedIds([]);
      excludedRef.current = [];
      pinnedRef.current = [];
    }
  }, []);

  const saveExcluded = useCallback(async (next) => {
    const arr = Array.from(new Set(next));
    setExcludedIds(arr);
    excludedRef.current = arr;
    await AsyncStorage.setItem(EXCLUDED_KEY, JSON.stringify(arr));
  }, []);

  const savePinned = useCallback(async (next) => {
    const arr = Array.from(new Set(next));
    setPinnedIds(arr);
    pinnedRef.current = arr;
    await AsyncStorage.setItem(PINNED_KEY, JSON.stringify(arr));
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const [correctSound, setCorrectSound] = useState();
  const [incorrectSound, setIncorrectSound] = useState();
  const [exitConfirmationVisible, setExitConfirmationVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNextButton, setShowNextButton] = useState(false);
  const [optionsOrder, setOptionsOrder] = useState([]);
  const [shuffledVerbs, setShuffledVerbs] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [progress, setProgress] = useState(0);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const grade = getGrade((correctAnswers / (correctAnswers + incorrectAnswers)) * 100);

  const backgroundColorAnim = useRef(new Animated.Value(0)).current;
  const optionsContainerAnim = useRef(new Animated.Value(-500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [autoPlaySounds, setAutoPlaySounds] = useState(true);
  const [isVerbListVisible, setIsVerbListVisible] = useState(true); // состояние для управления видимостью модалки
  const [verbListForModal, setVerbListForModal] = useState([]); // список для модалки

  const modalCloseReasonRef = useRef(null);
  const skipExitConfirmRef = useRef(false);
 
  const toggleDescriptionModal = () => setDescriptionModalVisible((prev) => !prev);

  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [dontShowAgain1, setDontShowAgain1] = useState(false);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const checkFlagAndLang = async () => {
      const hidden = await AsyncStorage.getItem('exercise1_description_hidden');
      const lang = await AsyncStorage.getItem('language');

    if (lang) {
  setLanguage(lang);
  setDontShowAgain1(hidden === 'true');
} else {
  setDontShowAgain1(hidden === 'true');
}

    };
    checkFlagAndLang();
  }, []);

  const handleToggleDontShowAgain1 = async () => {
    const newValue = !dontShowAgain1;
    setDontShowAgain1(newValue);
    await AsyncStorage.setItem('exercise1_description_hidden', newValue ? 'true' : '');
  };

  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
    setAutoPlaySounds(!autoPlaySounds);
  };

  useEffect(() => {
    if (soundEnabled && correctSound && incorrectSound) {
      correctSound.setVolumeAsync(1);
      incorrectSound.setVolumeAsync(1);
    } else if (correctSound && incorrectSound) {
      correctSound.setVolumeAsync(0);
      incorrectSound.setVolumeAsync(0);
    }
  }, [soundEnabled, correctSound, incorrectSound]);

  const fadeIn = () => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
  };
  useEffect(() => fadeIn(), []);

  const changeBackgroundColor = (isCorrect) => {
    backgroundColorAnim.setValue(isCorrect ? 1 : 2);
    Animated.timing(backgroundColorAnim, { toValue: isCorrect ? 1 : 2, duration: 300, useNativeDriver: false }).start(
      () => {
        setTimeout(() => {
          Animated.timing(backgroundColorAnim, { toValue: 0, duration: 100, useNativeDriver: false }).start();
        }, 100);
      }
    );
  };

  const backgroundColor = backgroundColorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['#83A3CD', '#AFFFCA', '#FFBCBC'],
  });

  useFocusEffect(
    useCallback(() => {
      if (isVerbListVisible || exerciseCompleted) return;

      const onBackPress = () => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('MenuEn');
        return true;
      };

      const bh = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => bh.remove();
    }, [isVerbListVisible, exerciseCompleted, navigation])
  );

  useFocusEffect(
    useCallback(() => {
      if (isVerbListVisible || exerciseCompleted) return;

      const onBackPress = () => {
        if (exitConfirmationVisible) return false;
        setExitConfirmationVisible(true);
        return true;
      };

      const bh = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (skipExitConfirmRef.current) return;
        if (exitConfirmationVisible) return;
        e.preventDefault();
        setExitConfirmationVisible(true);
      });

      return () => {
        bh.remove();
        unsubscribe();
      };
    }, [isVerbListVisible, exerciseCompleted, exitConfirmationVisible, navigation])
  );

  useEffect(() => {
    navigation.setOptions({ headerLeft: () => null });
  }, [navigation]);

  const initializeExercise = async (lang) => {
    if (!Array.isArray(excludedRef.current) || !Array.isArray(pinnedRef.current)) {
      await loadLists();
    }

    const newShuffled = buildDeck(verbsData, excludedRef.current || [], pinnedRef.current || []);
    setShuffledVerbs(newShuffled);

    // Создаём verbListForModal
    const langMap = {
      ru: 'translationOptions',
      en: 'translationOptionsEn',
      fr: 'translationOptionsFr',
      es: 'translationOptionsEs',
      pt: 'translationOptionsPt',
      ar: 'translationOptionsAr',
      am: 'translationOptionsAm',
    };
    const langKey = langMap[lang] || 'translationOptionsEn';

    const sorted = [...newShuffled].sort((a, b) => a.hebrewVerb.localeCompare(b.hebrewVerb, 'he'));

    const verbList = sorted.map((verb) => {
      const translations = verb[langKey] || [];
      const correctIndex = verb.correctTranslationIndex ?? 0;

      // берём РУ значение правильного варианта, чтобы точно матчить mp3/translit в verbs1RU (как в RU-версии)
      const ruOptions = verb.translationOptions || [];
      const ruCorrect = ruOptions[correctIndex] || '';

      let ruMatch = verbs1RU.find(
        (v) =>
          v.infinitive === verb.hebrewVerb && normalize(v.russian) === normalize(ruCorrect) && v.gender === 'man'
      );

      if (!ruMatch) {
        ruMatch = verbs1RU.find((v) => v.infinitive === verb.hebrewVerb && normalize(v.russian) === normalize(ruCorrect));
      }

      if (!ruMatch) {
        ruMatch =
          verbs1RU.find((v) => v.infinitive === verb.hebrewVerb && v.gender === 'man') ||
          verbs1RU.find((v) => v.infinitive === verb.hebrewVerb);
      }

   const ruMeaningKey = normalize(ruCorrect || '');
const mp3Key = String(ruMatch?.mp3 || verb.audioFile || '').replace(/\.mp3$/i, '').trim();

return {
  // ✅ уникальный ключ даже для омонимов типа לקרוא
  key: `${verb.hebrewVerb}__${ruMeaningKey || 'nom'}__${mp3Key || 'nom'}__${correctIndex}`,

  hebrewtext: verb.hebrewVerb,
  translit: verb.transliteration || ruMatch?.translit || '',
  entext: translations[correctIndex] || '—',
  mp3: mp3Key,
  mp3Inf: String(verb.audioFile || '').replace(/\.mp3$/i, '').trim(),
  mp3Conj: String(ruMatch?.mp3 || '').replace(/\.mp3$/i, '').trim(),
};

    });

    setVerbListForModal(verbList);

    setCurrentIndex(0);
    setProgress(0);
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setExerciseCompleted(false);
    setShowNextButton(false);

    // const currentVerb = newShuffled[0];
    // const options = generateOptions(currentVerb);
    // setOptionsOrder(options);
    // updateVerbDetails(currentVerb, isGenderMan, false);
  };

  useEffect(() => {
    if (language) initializeExercise(language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

useEffect(() => {
  if (!isVerbListVisible && shuffledVerbs.length > 0 && !exerciseCompleted) {
    if (modalCloseReasonRef.current === 'menu') return;

    const currentVerb = shuffledVerbs[currentIndex];
    const opts = generateOptions(currentVerb);
    setOptionsOrder(opts);

    // ✅ звук и verbDetails только после закрытия модалки
    updateVerbDetails(currentVerb, isGenderMan, false);

    optionsContainerAnim.setValue(-500);
    Animated.timing(optionsContainerAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (modalCloseReasonRef.current === 'start') {
      modalCloseReasonRef.current = null;
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentIndex, shuffledVerbs, isGenderMan, isVerbListVisible, exerciseCompleted]);


  const generateOptions = (verbData) => {
    if (!verbData || !verbData.translationOptionsEn || !Number.isInteger(verbData.correctTranslationIndex)) {
      console.error('Invalid verbData:', verbData);
      return [];
    }

    const correctAnswerIndex = verbData.correctTranslationIndex;
    const correctTranslation = verbData.translationOptionsEn[correctAnswerIndex];
    const incorrectOptions = verbData.translationOptionsEn.filter((_, index) => index !== correctAnswerIndex);

    const shuffledOptions = shuffleArray(
      incorrectOptions.map((option, index) => ({ text: option, isCorrect: false, isSelected: false, index }))
    );

    shuffledOptions.splice(Math.floor(Math.random() * (shuffledOptions.length + 1)), 0, {
      text: correctTranslation,
      isCorrect: true,
      isSelected: false,
      index: shuffledOptions.length,
    });

    return shuffledOptions;
  };

  useEffect(() => {
    async function loadSounds() {
      const correctSoundObject = new Audio.Sound();
      const incorrectSoundObject = new Audio.Sound();
      try {
        await correctSoundObject.loadAsync(sounds.success);
        await incorrectSoundObject.loadAsync(sounds.failure, { volume: 0.8 });
        setCorrectSound(correctSoundObject);
        setIncorrectSound(incorrectSoundObject);
      } catch (error) {
        console.log('Error loading sounds', error);
      }
    }
    loadSounds();
    return () => {
      correctSound?.unloadAsync();
      incorrectSound?.unloadAsync();
    };
  }, []);

  const playSound = async (isCorrect) => {
    try {
      const sound = isCorrect ? correctSound : incorrectSound;
      await sound.replayAsync();
    } catch (error) {
      console.log('Error playing sound', error);
    }
  };

  const [verbDetails, setVerbDetails] = useState({ hebrewtext: '', translit: '', entext: '' });

  const playAudio = async (audioFile) => {
    if (!autoPlaySounds) return;

    const soundFile1 = sounds[audioFile.replace('.mp3', '')];
    const soundFile2 = soundsConj[audioFile.replace('.mp3', '')];

    if (!soundFile1 && !soundFile2) {
      console.error(`Audio file ${audioFile} not found in sounds or soundsConj.`);
      return;
    }

    const soundObject1 = new Audio.Sound();
    const soundObject2 = new Audio.Sound();

    try {
      if (soundFile1) {
        await soundObject1.loadAsync(soundFile1);
        await soundObject1.playAsync();
        soundObject1.setOnPlaybackStatusUpdate(async (status) => {
          if (status.didJustFinish && soundFile2 && autoPlaySounds) {
            await soundObject1.unloadAsync();
            await soundObject2.loadAsync(soundFile2);
            setTimeout(async () => {
              await soundObject2.playAsync();
              soundObject2.setOnPlaybackStatusUpdate((status2) => {
                if (status2.didJustFinish) {
                  soundObject2.unloadAsync();
                }
              });
            }, 1000);
          } else {
            soundObject1.unloadAsync();
          }
        });
      } else if (soundFile2 && autoPlaySounds) {
        await soundObject2.loadAsync(soundFile2);
        setTimeout(async () => {
          await soundObject2.playAsync();
          soundObject2.setOnPlaybackStatusUpdate((status2) => {
            if (status2.didJustFinish) {
              soundObject2.unloadAsync();
            }
          });
        }, 1000);
      }
    } catch (error) {
      console.log('Error playing sound:', error);
      soundObject1.unloadAsync();
      soundObject2.unloadAsync();
    }
  };

const stripMp3 = (s = '') => String(s).replace(/\.mp3$/i, '').trim();

const updateVerbDetails = (currentVerb, isGenderMan, showRussianText = false) => {
  if (!currentVerb) return;

  // 1) Базовый фильтр: только нужный инфинитив
  let matchedVerbs = verbs1RU.filter((v) => v.infinitive === currentVerb.hebrewVerb);

  // 2) ✅ УСИЛЕНИЕ: если есть audioFile у задания — фильтруем и по нему
  // Это гарантирует, что "להקשיב" не сможет дать "אני מאזין"
  const targetInfMp3 = stripMp3(currentVerb.audioFile || '');
  if (targetInfMp3) {
    const byAudio = matchedVerbs.filter((v) => stripMp3(v.audioFile || '') === targetInfMp3);
    if (byAudio.length > 0) matchedVerbs = byAudio;
  }

  // 3) Фильтр по смыслу (RU вариант правильного ответа)
  const ruOptions = currentVerb.translationOptions || [];
  const correctIndex = currentVerb.correctTranslationIndex ?? 0;
  const ruCorrect = ruOptions[correctIndex] || '';

  if (ruCorrect) {
    const normTarget = normalize(ruCorrect);
    const byMeaning = matchedVerbs.filter((v) => normalize(v.russian) === normTarget);
    if (byMeaning.length > 0) matchedVerbs = byMeaning;
  }

  if (matchedVerbs.length === 0) {
    setVerbDetails({ hebrewtext: 'Verb not found', translit: '', entext: '', mp3: '' });
    return;
  }

  // 4) Выбор гендера
  const selectedVerb =
    matchedVerbs.find((v) => v.gender === (isGenderMan ? 'man' : 'woman')) || matchedVerbs[0];

  // 5) Текст перевода (EN правильный вариант)
  const enCorrect =
    (currentVerb.translationOptionsEn || [])[currentVerb.correctTranslationIndex ?? 0] || '';

setVerbDetails({
  hebrewtext: selectedVerb.hebrewtext,
  translit: selectedVerb.translit,
  entext: showRussianText ? (selectedVerb.entext || '') : '',
  mp3: selectedVerb.mp3,
});


  if (!showRussianText) playAudio(selectedVerb.mp3);
};


  const [isGenderMan, setIsGenderMan] = useState(true);

  const handleGenderToggle = () => {
    setIsGenderMan((prev) => {
      const newIsGenderMan = !prev;
      updateVerbDetails(shuffledVerbs[currentIndex], newIsGenderMan, verbDetails.entext !== '');
      return newIsGenderMan;
    });
  };

  // NEW: exclude/pin из карточки (как в RU)
  const handleExcludeVerb = async (hebrewVerb) => {
    if (!hebrewVerb) return;

    const excludedSet = new Set(excludedRef.current || []);
    const pinnedSet = new Set(pinnedRef.current || []);

    // toggle: если уже исключён — восстановить
    if (excludedSet.has(hebrewVerb)) {
      excludedSet.delete(hebrewVerb);
      await saveExcluded(Array.from(excludedSet));
      return;
    }

    // если исключаем — снимаем закрепление
    if (pinnedSet.has(hebrewVerb)) {
      pinnedSet.delete(hebrewVerb);
      await savePinned(Array.from(pinnedSet));
    }

    excludedSet.add(hebrewVerb);
    await saveExcluded(Array.from(excludedSet));
  };

  const handleTogglePinnedVerb = async (hebrewVerb) => {
    if (!hebrewVerb) return;

    const pinnedSet = new Set(pinnedRef.current || []);
    const excludedSet = new Set(excludedRef.current || []);

    // если закрепляем — убираем из исключённых
    if (excludedSet.has(hebrewVerb)) {
      excludedSet.delete(hebrewVerb);
      await saveExcluded(Array.from(excludedSet));
    }

    if (pinnedSet.has(hebrewVerb)) pinnedSet.delete(hebrewVerb);
    else pinnedSet.add(hebrewVerb);

    await savePinned(Array.from(pinnedSet));
  };

const handleAnswer = (selectedOptionIndex) => {
  if (exerciseCompleted) return;

  const selectedOption = optionsOrder[selectedOptionIndex];
  if (!selectedOption) return;

  const isCorrect = selectedOption.isCorrect;

  setOptionsOrder((prevOptions) =>
    prevOptions.map((option, index) => ({
      ...option,
      isSelected: index === selectedOptionIndex || option.isCorrect,
      disabled: true,
    }))
  );

  changeBackgroundColor(isCorrect);
  playSound(isCorrect);

  if (isCorrect) setCorrectAnswers((prev) => prev + 1);
  else setIncorrectAnswers((prev) => prev + 1);

  updateVerbDetails(shuffledVerbs[currentIndex], isGenderMan, true);
  setTimeout(() => {
  setShowNextButton(true);
}, 1000);


  const totalAnswered = correctAnswers + incorrectAnswers + 1;
  setProgress(totalAnswered);

  // ✅ ВАЖНО: НЕ показываем Completion сразу.
  // Пользователь должен успеть увидеть правильный ответ.
  // Completion покажем только после нажатия "Следующий глагол".
};


 const handleNextCard = () => {
  if (!showNextButton) return;

  setShowNextButton(false);

  const nextIndex = currentIndex + 1;

  if (nextIndex < shuffledVerbs.length) {
    setCurrentIndex(nextIndex);
  } else {
    // ✅ Exercise finished: show Completion + persist stats immediately
    setExerciseCompleted(true);
    handleExerciseCompletion();
  }
};

 const resetExercise = async () => {
  // 1) сначала возвращаем показ модалки
  modalCloseReasonRef.current = null;
  setIsVerbListVisible(true);

  // 2) сбрасываем важные флаги UI, чтобы не было зависаний/старых кнопок
  setExerciseCompleted(false);
  setShowNextButton(false);
  setOptionsOrder([]);
  setVerbDetails({ hebrewtext: '', translit: '', entext: '' });

  // ✅ сброс статистики и прогресса (иначе statisticsUpdated может залипнуть)
  setStatisticsUpdated(false);
  setCorrectAnswers(0);
  setIncorrectAnswers(0);
  setProgress(0);
  setCurrentIndex(0);

  // 3) пересобираем данные (список глаголов тоже пересчитается)
  await initializeExercise(language);
};

  const handleCancelExit = () => setExitConfirmationVisible(false);

  const handleConfirmExit = () => {
    setExitConfirmationVisible(false);
    navigation.reset({ index: 0, routes: [{ name: 'MenuEn' }] });
  };

  const calculateScore = () => {
    const totalAttempts = correctAnswers + incorrectAnswers;
    if (totalAttempts === 0) return 0;
    return ((correctAnswers / totalAttempts) * 100).toFixed(2);
  };

  const [statistics, setStatistics] = useState(null);
  const [isStatModalVisible, setIsStatModalVisible] = useState(false);
  const [statisticsUpdated, setStatisticsUpdated] = useState(false);

  const handleExerciseCompletion = async () => {
    if (!statisticsUpdated) {
      setStatisticsUpdated(true);
      const currentScore = calculateScore();

      setTimeout(async () => {
        try {
          await updateStatistics('exercise1En', currentScore);
        } catch (error) {
          console.error('Failed to update statistics:', error);
        }
      }, 500);
    }
  };

const handleButton3Press = async () => {
  const exerciseId = 'exercise1En';
  try {
    const stats = await getStatistics(exerciseId);

    setStatistics(stats ? { currentScore: stats.averageScore } : null);
    setIsStatModalVisible(true);
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    setStatistics(null);
    setIsStatModalVisible(false);
  }
};
  return (
    <>
      {isVerbListVisible && (
        <VerbListModal
          visible={isVerbListVisible}
          language={language}
          verbs={verbListForModal}
          pinnedIds={pinnedIds}
          onStartExercise={() => {
            modalCloseReasonRef.current = 'start';
            setIsVerbListVisible(false);
          }}
          onClose={() => {
  modalCloseReasonRef.current = 'menu';

  // ❗️НЕ делаем setIsVerbListVisible(false),
  // иначе на мгновение смонтируется экран упражнения и может стартануть звук.
  if (navigation.canGoBack()) navigation.goBack();
  else navigation.navigate('MenuEn');
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

                <TouchableOpacity onPress={handleButton3Press}>
                  <Animated.Image source={require('./stat.png')} style={[styles.buttonImage, { opacity: fadeAnim }]} />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleDescriptionModal}>
                  <Animated.Image
                    source={require('./question.png')}
                    style={[styles.buttonImage, { opacity: fadeAnim }]}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleGenderToggle}>
                  <Animated.Image
                    source={isGenderMan ? require('./GenderMan.png') : require('./GenderWoman.png')}
                    style={[styles.buttonImage, { opacity: fadeAnim }]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
              <View style={styles.textContainer}>
                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>
                  CORRECT: {correctAnswers}
                </Text>
                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>
                  WRONG: {incorrectAnswers}
                </Text>
              </View>

              <View style={styles.remainingTasksContainer}>
                <Text style={styles.remainingTasksText} maxFontSizeMultiplier={1.2}>
                  {shuffledVerbs.length - currentIndex}
                </Text>
              </View>

              <Animated.View style={[styles.percentContainer, { backgroundColor, borderRadius: 10 }]}>
                <Text style={styles.percentText} maxFontSizeMultiplier={1.2}>
                  {progress > 0 ? ((correctAnswers / (correctAnswers + incorrectAnswers)) * 100).toFixed(2) : 0}%
                </Text>
              </Animated.View>
            </Animated.View>

            <Animated.View style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}>
              <ProgressBar progress={progress} totalExercises={shuffledVerbs.length} />
            </Animated.View>

            <Animated.Text style={[styles.title, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>
              SELECT TRANSLATION
            </Animated.Text>

            {currentIndex < shuffledVerbs.length && !exerciseCompleted && (
              <VerbCard1
                verbData={shuffledVerbs[currentIndex]}
                options={optionsOrder}
                onAnswer={handleAnswer}
                soundEnabled={soundEnabled}

                // ✅ состояния для иконок
                isExcluded={excludedIds.includes(shuffledVerbs[currentIndex]?.hebrewVerb)}
                isPinned={pinnedIds.includes(shuffledVerbs[currentIndex]?.hebrewVerb)}

                // ✅ обработчики кликов
                onExcludePress={() => handleExcludeVerb(shuffledVerbs[currentIndex]?.hebrewVerb)}
                onPinTogglePress={() => handleTogglePinnedVerb(shuffledVerbs[currentIndex]?.hebrewVerb)}
                onOpenManageModal={() => setIsExcludedModalVisible(true)}
              />
            )}

            <VerbDetailsContainer
              verbDetails={verbDetails}
              showRussianText={verbDetails.entext !== ''}
              handleSpeakerPress={handleSpeakerPress}
            />

            <Animated.View style={[styles.optionsContainer, { transform: [{ translateX: optionsContainerAnim }] }]}>
              {optionsOrder.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    option.isCorrect && option.isSelected ? styles.correctOption : null,
                    !option.isCorrect && option.isSelected ? styles.incorrectOption : null,
                  ]}
                  onPress={() => handleAnswer(index)}
                  disabled={option.disabled}
                >
                  <Text style={styles.optionText} maxFontSizeMultiplier={1.2}>
                    {option.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>

            <TouchableOpacity
              style={[styles.nextButton, showNextButton ? styles.activeButton : styles.inactiveButton]}
              onPress={handleNextCard}
              disabled={!showNextButton}
            >
              <Text style={styles.nextButtonText} maxFontSizeMultiplier={1.1}>
                NEXT VERB
              </Text>
            </TouchableOpacity>

            {exerciseCompleted && (
              <CompletionMessageEn
                correctAnswers={correctAnswers}
                incorrectAnswers={incorrectAnswers}
                handleOK={handleExerciseCompletion}
                navigateToMenu={() => {
                  skipExitConfirmRef.current = true;
                  setExitConfirmationVisible(false);
                  setIsVerbListVisible(false);
                  navigation.reset({ index: 0, routes: [{ name: 'MenuEn' }] });
                  setTimeout(() => {
                    skipExitConfirmRef.current = false;
                  }, 300);
                }}
                correctAnswersPercentage={
                  progress > 0 ? ((correctAnswers / (correctAnswers + incorrectAnswers)) * 100).toFixed(2) : 0
                }
                grade={grade}
                restartTask={resetExercise}
              />
            )}
          </View>
        </ScrollView>
      )}

      <ExcludedVerbsModal1
        visible={isExcludedModalVisible}
        onClose={() => setIsExcludedModalVisible(false)}
        excludedIds={excludedIds}
        pinnedIds={pinnedIds}
        verbsData={verbsData}
        onRestoreVerb={async (id) => {
          const next = (excludedRef.current || []).filter((x) => x !== id);
          await saveExcluded(next);
        }}
        onTogglePinnedVerb={handleTogglePinnedVerb}
        lang={'en'} // 'ru'|'en'|'fr'|'es'|'pt'|'ar'|'am'
      />

     <StatModal1En
  visible={isStatModalVisible}
  onToggle={() => setIsStatModalVisible(false)}
  statistics={statistics}
/>



      <TaskDescriptionModal6
        visible={isDescriptionModalVisible}
        onToggle={toggleDescriptionModal}
        language={language}
        dontShowAgain1={dontShowAgain1}
        onToggleDontShowAgain={handleToggleDontShowAgain1}
      />

      <ExitConfirmationModal visible={exitConfirmationVisible} onCancel={handleCancelExit} onConfirm={handleConfirmExit} />
    </>
  );
};

const styles = StyleSheet.create({
     scrollViewContent: {
  flexGrow: 1,
  justifyContent: 'flex-start',   // ← вместо center
  alignItems: 'center',
  paddingTop: 0,                // можно 5–15 по вкусу
},

container: {
  flex: 1,
  justifyContent: 'flex-start',  // ← вместо center
  alignItems: 'center',
  padding: 10,
  paddingTop: 0,                // можно уменьшить ещё
  backgroundColor: '#AFC1D0',
  width: '100%',
},

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 0,
  },
  logoImage: {
    width: 90,
    height: 90,
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginRight: wp('2.5%'),
  },
  buttonImage: {
    width: 44,
    height: 44,
    marginLeft: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    color: '#2F4766',
  },
  optionsContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: hp('1.5%'),
  },
optionButton: {
  width: '49%',
  minHeight: hp('7.5%'),     // было height
  paddingVertical: hp('1.4%'),// вместо/добавь к padding
  paddingHorizontal: wp('3%'),
  backgroundColor: '#D1E3F1',
  marginBottom: hp('1%'),
  borderRadius: wp('2.5%'),
  justifyContent: 'center',
  alignItems: 'center',      // чтобы текст был по центру
  shadowColor: '#000',
  shadowOffset: { width: 0, height: hp('0.25%') },
  shadowOpacity: 0.25,
  shadowRadius: hp('0.5%'),
  elevation: 5,
},
optionText: {
  width: '100%',              // ✅ важно
  flexWrap: 'wrap',           // ✅ важно
  fontSize: 16,
  textAlign: 'center',
  color: '#152039',
  fontWeight: 'bold',
  lineHeight: 20,
},
  nextButton: {
    width: '80%',
    padding: hp('1.5%'),
    backgroundColor: '#2B3270',
    borderRadius: wp('2.5%'),
    textAlign: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: hp('0.25%'),
    },
    shadowOpacity: 0.25,
    shadowRadius: hp('0.5%'),
    elevation: 5,
  },
  nextButtonText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
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
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: hp('6,5%'),
    backgroundColor: '#6C8EBB',
    borderRadius: wp('2.5%'),
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: hp('0.25%'),
    },
    shadowOpacity: 0.25,
    shadowRadius: hp('0.5%'),
    elevation: 5,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '50%',
  },
  prtext: {
    fontSize: wp('3%'),
    color: 'white',
    textAlign: 'left',
    marginLeft: wp('3.5%'),
  },
  percentContainer: {
    alignItems: 'center',
    marginRight: wp('2.5%'),
  },
  percentText: {
    fontSize: wp('5%'),
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    borderRadius: wp('2.5%'),
    alignItems: 'center',
    paddingLeft: wp('2.5%'),
    paddingRight: wp('2.5%'),
  },
  remainingTasksContainer: {
    alignItems: 'center',
    marginRight: wp('2.5%'),
  },
  remainingTasksText: {
    fontSize: wp('5%'),
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#83A3CD',
    borderRadius: wp('2.5%'),
    alignItems: 'center',
    paddingLeft: wp('2.5%'),
    paddingRight: wp('2.5%'),
  },
  completedMessage: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#2F4766',
    marginBottom: hp('1.5%'),
  },
  completeButton: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#2B3270',
    borderRadius: wp('2.5%'),
    textAlign: 'center',
    padding: hp('2%'),
  },
  verbDetailsContainer: {
    height: hp('8%'),
    backgroundColor: '#83A3CD',
    marginBottom: hp('1.5%'),
    width: '100%',
    position: 'relative',
    borderRadius: wp('2.5%'),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: hp('0.25%'),
    },
    shadowOpacity: 0.25,
    shadowRadius: hp('0.5%'),
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
    borderTopLeftRadius: wp('2.5%'),
    borderBottomLeftRadius: wp('2.5%'),
  },
  verbDetailsRight: {
    left: '49%',
    borderTopRightRadius: wp('2.5%'),
    borderBottomRightRadius: wp('2.5%'),
  },
  verbDetailsContent: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    position: 'absolute',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('2.5%'),
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
    marginVertical: hp('0.5%'),
  },
  verbDetailsHebrew: {
    fontSize: 18,
    color: '#FFFDEF',
    fontWeight: 'bold',
    marginBottom: hp('-0.5%'),
  },
  verbDetailsTranslit: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#CE6857',
    backgroundColor: '#FFFDEF',
    borderRadius: wp('2.5%'),
    padding: 1,
    paddingLeft: 5,
    paddingRight: 5,
    marginTop: hp('0.5%'),
    marginBottom: hp('0.5%'),
  },
  verbDetailsRussian: {
    fontSize: 14,
    color: '#333652',
    fontWeight: 'bold',
    backgroundColor: '#FFFDEF',
    borderRadius: wp('2.5%'),
    padding: wp('0.5%'),
    paddingLeft: wp('2.5%'),
    paddingRight: wp('2.5%'),
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
    bottom: hp('-0.25%'),
    right: wp('-0.75%'),
    width: wp('7.5%'),
    height: hp('3.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerIcon: {
    width: '250%',
    height: '250%',
    resizeMode: 'contain',
  },
});

export default Exercise1En;
