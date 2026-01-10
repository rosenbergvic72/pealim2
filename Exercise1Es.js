// Exercise1Es.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, BackHandler, Image, Animated } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import VerbCard1 from './VerbCard1Es';
import verbsData from './verbs1.json';
import verbs1RU from './verbs11RU.json';

import ProgressBar from './ProgressBar';
import CompletionMessageEs from './CompletionMessageEs';
import ExitConfirmationModal from './ExitConfirmationModalEs';
import TaskDescriptionModal1 from './TaskDescriptionModal1';
import StatModal1Es from './StatModal1Es';
import { updateStatistics, getStatistics } from './stat';
import sounds from './Soundss';
import soundsConj from './soundconj';
import VerbListModal from './VerbListModal';
import ExcludedVerbsModal1 from './ExcludedVerbsModal1';

import animation from './assets/Animation - 1723020554284.json';

/* ---------- helpers ---------- */

const shuffleArray = (array) => {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 24);
};

const normalize = (s = '') =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');

// shuffle without slicing (for deck building)
const shuffleAll = (array) => {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// build 24-card deck with excluded + pinned (soft cap pinned)
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
  if (percentage === 100) {
    return '¡Excepcional! ¡Impecable! ¡No cometiste ni un solo error!';
  } else if (percentage >= 90) {
    return '¡Excelente! Casi perfecto, sigue así.';
  } else if (percentage >= 80) {
    return '¡Genial! ¡Lo estás haciendo muy bien!';
  } else if (percentage >= 70) {
    return '¡Bien! Has aprendido el material bastante bien.';
  } else if (percentage >= 60) {
    return '¡Bastante bien! Hay un progreso constante.';
  } else if (percentage >= 50) {
    return 'No está mal, pero hay margen de mejora.';
  } else if (percentage >= 40) {
    return '¡Satisfactorio! Sigue trabajando y tendrás éxito.';
  } else if (percentage >= 30) {
    return '¡Estás empezando a entenderlo, sigue así!';
  } else if (percentage >= 20) {
    return 'Intenta cambiar tu estrategia de aprendizaje, ¡podría ayudar!';
  } else if (percentage >= 10) {
    return 'Es difícil, pero no te rindas. ¡Sigue practicando!';
  } else {
    return '¡Se necesita trabajo serio! Es importante no rendirse y seguir aprendiendo.';
  }
};

/* ---------- VerbDetails ---------- */

const VerbDetailsContainer = ({ verbDetails, showSpanishText, handleSpeakerPress }) => {
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

    if (showSpanishText) {
      Animated.timing(rightFillAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, [verbDetails, showSpanishText, leftFillAnim, rightFillAnim, prevVerbDetails]);

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
          {showSpanishText ? (
            <Text style={styles.verbDetailsRussian} maxFontSizeMultiplier={1.2}>
              {verbDetails.estext}
            </Text>
          ) : (
            <LottieView
              source={animation} 
              autoPlay
              loop
              onAnimationFinish={() => animationRef.current?.reset()}
              style={styles.lottieAnimation}
            />
          )}
        </View>
        <TouchableOpacity style={styles.speakerButton} onPress={() => handleSpeakerPress(verbDetails.mp3)}>
          <Image source={require('./speaker1.png')} style={styles.speakerIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* ---------- shared player (speaker) ---------- */

const cachedSounds = {};

const handleSpeakerPress = async (audioFile) => {
  if (!audioFile) return;

  let soundObject;
  if (cachedSounds[audioFile]) {
    soundObject = cachedSounds[audioFile];
  } else {
    const soundFile = soundsConj[audioFile.replace('.mp3', '')];
    if (!soundFile) return;

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
  } catch {
    soundObject.unloadAsync();
    delete cachedSounds[audioFile];
  }
};

/* ---------- main component ---------- */

const Exercise1Es = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // same keys as RU/EN (shared lists)
  const EXCLUDED_KEY = 'exercise1_excluded_verbs';
  const PINNED_KEY = 'exercise1_pinned_verbs';

  const [excludedIds, setExcludedIds] = useState([]);
  const [pinnedIds, setPinnedIds] = useState([]);
  const excludedRef = useRef([]);
  const pinnedRef = useRef([]);
  const [isExcludedModalVisible, setIsExcludedModalVisible] = useState(false);

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

  const backgroundColorAnim = useRef(new Animated.Value(0)).current;
  const optionsContainerAnim = useRef(new Animated.Value(-500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [autoPlaySounds, setAutoPlaySounds] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [isVerbListVisible, setIsVerbListVisible] = useState(true);
  const [verbListForModal, setVerbListForModal] = useState([]);
  const modalCloseReasonRef = useRef(null);

  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [dontShowAgain1, setDontShowAgain1] = useState(false);

  const [language, setLanguage] = useState('es');

  const [statistics, setStatistics] = useState(null);
  const [isStatModalVisible, setIsStatModalVisible] = useState(false);
  const [statisticsUpdated, setStatisticsUpdated] = useState(false);

  const [verbDetails, setVerbDetails] = useState({ hebrewtext: '', translit: '', estext: '', mp3: '' });
  const [isGenderMan, setIsGenderMan] = useState(true);

  /* header back handling */
  useEffect(() => {
    navigation.setOptions({ headerLeft: () => null });
  }, [navigation]);

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

  const handleExcludeVerb = async (hebrewVerb) => {
    if (!hebrewVerb) return;

    const excludedSet = new Set(excludedRef.current || []);
    const pinnedSet = new Set(pinnedRef.current || []);

    if (excludedSet.has(hebrewVerb)) {
      excludedSet.delete(hebrewVerb);
      await saveExcluded(Array.from(excludedSet));
      return;
    }

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

    if (excludedSet.has(hebrewVerb)) {
      excludedSet.delete(hebrewVerb);
      await saveExcluded(Array.from(excludedSet));
    }

    if (pinnedSet.has(hebrewVerb)) pinnedSet.delete(hebrewVerb);
    else pinnedSet.add(hebrewVerb);

    await savePinned(Array.from(pinnedSet));
  };

  // Пока открыт список — «Назад» уводит в меню (или goBack)
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

  // Во время упражнения — подтверждение выхода
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

  /* UI anim */
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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

  /* language + first open modal */
  useEffect(() => {
    const checkFlagAndLang = async () => {
      const hidden = await AsyncStorage.getItem('exercise1_description_hidden');
      const lang = await AsyncStorage.getItem('language');

      if (lang) setLanguage(lang);
      setDontShowAgain1(hidden === 'true');
      if (hidden !== 'true') setTimeout(() => setDescriptionModalVisible(true), 120);
    };
    checkFlagAndLang();
  }, []);

  /* sounds (correct/incorrect) */
  useEffect(() => {
    async function load() {
      const ok = new Audio.Sound();
      const bad = new Audio.Sound();
      try {
        await ok.loadAsync(sounds.success);
        await bad.loadAsync(sounds.failure, { volume: 0.8 });
        setCorrectSound(ok);
        setIncorrectSound(bad);
      } catch (e) {
        console.log('Error loading sounds', e);
      }
    }
    load();
    return () => {
      correctSound?.unloadAsync();
      incorrectSound?.unloadAsync();
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    const volume = soundEnabled ? 1 : 0;
    correctSound?.setVolumeAsync(volume);
    incorrectSound?.setVolumeAsync(volume);
  }, [soundEnabled, correctSound, incorrectSound]);

  const playSound = async (isCorrect) => {
    try {
      const s = isCorrect ? correctSound : incorrectSound;
      await s?.replayAsync();
    } catch {}
  };

  const handleSoundToggle = () => {
    setSoundEnabled((v) => !v);
    setAutoPlaySounds((v) => !v);
  };

  /* exercise init */
  const initializeExercise = async (lang) => {
    // ensure lists are loaded
    if (!Array.isArray(excludedRef.current) || !Array.isArray(pinnedRef.current)) {
      await loadLists();
    }

    const newShuffled = buildDeck(verbsData, excludedRef.current || [], pinnedRef.current || []);
    setShuffledVerbs(newShuffled);

    const langMap = {
      ru: 'translationOptions',
      en: 'translationOptionsEn',
      fr: 'translationOptionsFr',
      es: 'translationOptionsEs',
      pt: 'translationOptionsPt',
      ar: 'translationOptionsAr',
      am: 'translationOptionsAm',
    };
    const langKey = langMap[lang] || 'translationOptionsEs';

    const sorted = [...newShuffled].sort((a, b) =>
      a.hebrewVerb.localeCompare(b.hebrewVerb, 'he')
    );

    const verbList = sorted.map((verb) => {
      const translations = verb[langKey] || [];
      const correctIndex = verb.correctTranslationIndex ?? 0;

      // Use RU meaning to disambiguate homonyms like לקרוא
      const ruOptions = verb.translationOptions || [];
      const ruCorrect = ruOptions[correctIndex] || '';

      let ruMatch =
        verbs1RU.find(
          (v) => v.infinitive === verb.hebrewVerb && normalize(v.russian) === normalize(ruCorrect) && v.gender === 'man'
        ) ||
        verbs1RU.find((v) => v.infinitive === verb.hebrewVerb && normalize(v.russian) === normalize(ruCorrect)) ||
        verbs1RU.find((v) => v.infinitive === verb.hebrewVerb && v.gender === 'man') ||
        verbs1RU.find((v) => v.infinitive === verb.hebrewVerb);

      const ruMeaningKey = normalize(ruCorrect || '');
      const mp3Inf = String(verb.audioFile || '').replace(/\.mp3$/i, '').trim();
      const mp3Conj = String(ruMatch?.mp3 || '').replace(/\.mp3$/i, '').trim();
      const mp3Key = mp3Conj || mp3Inf;

      return {
        // ✅ unique key for list (fixes duplicate key warnings)
        key: `${verb.hebrewVerb}__${ruMeaningKey || 'nom'}__${mp3Key || 'nom'}__${correctIndex}`,

        hebrewtext: verb.hebrewVerb,
        translit: verb.transliteration || '',
        entext: translations[correctIndex] || '—',
        // поддержка старой и новой логики VerbListModal
        mp3: mp3Inf,
        mp3Inf,
        mp3Conj,
      };
    });

    setVerbListForModal(verbList);
  };

  useEffect(() => {
    if (language) initializeExercise(language);
  }, [language]);

  useEffect(() => {
    if (!isVerbListVisible && shuffledVerbs.length > 0) {
      if (modalCloseReasonRef.current === 'menu') return;

      const currentVerb = shuffledVerbs[currentIndex];
      setOptionsOrder(generateOptions(currentVerb));
      updateVerbDetails(currentVerb, isGenderMan, false);

      if (modalCloseReasonRef.current === 'start') {
        modalCloseReasonRef.current = null;
      }
    }
  }, [currentIndex, shuffledVerbs, isGenderMan, isVerbListVisible]);

  const generateOptions = (verbData) => {
    if (!verbData || !verbData.translationOptionsEs || !Number.isInteger(verbData.correctTranslationIndex)) {
      return [];
    }

    const correctIndex = verbData.correctTranslationIndex;
    const correctTranslation = verbData.translationOptionsEs[correctIndex];
    const incorrectOptions = verbData.translationOptionsEs.filter((_, index) => index !== correctIndex);

    const shuffledOptions = shuffleArray(
      incorrectOptions.map((option, index) => ({
        text: option,
        isCorrect: false,
        isSelected: false,
        index,
      }))
    );

    shuffledOptions.splice(
      Math.floor(Math.random() * (shuffledOptions.length + 1)),
      0,
      { text: correctTranslation, isCorrect: true, isSelected: false, index: shuffledOptions.length }
    );

    return shuffledOptions;
  };

  /* details + audio chain */
  const playAudio = async (audioFile) => {
    if (!autoPlaySounds) return;

    const base = audioFile.replace('.mp3', '');
    const s1 = sounds[base];
    const s2 = soundsConj[base];

    if (!s1 && !s2) return;

    const a = new Audio.Sound();
    const b = new Audio.Sound();

    try {
      if (s1) {
        await a.loadAsync(s1);
        await a.playAsync();
        a.setOnPlaybackStatusUpdate(async (st) => {
          if (st.didJustFinish && s2 && autoPlaySounds) {
            await a.unloadAsync();
            await b.loadAsync(s2);
            setTimeout(async () => {
              await b.playAsync();
              b.setOnPlaybackStatusUpdate((s) => s.didJustFinish && b.unloadAsync());
            }, 1000);
          } else {
            a.unloadAsync();
          }
        });
      } else if (s2 && autoPlaySounds) {
        await b.loadAsync(s2);
        setTimeout(async () => {
          await b.playAsync();
          b.setOnPlaybackStatusUpdate((s) => s.didJustFinish && b.unloadAsync());
        }, 1000);
      }
    } catch {
      a.unloadAsync();
      b.unloadAsync();
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
      setVerbDetails({ hebrewtext: 'Verbo no encontrado', translit: '', estext: '', mp3: '' });
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
      // estext: showRussianText ? enCorrect : '',
       estext: showRussianText ? (selectedVerb.estext || '') : '',
      mp3: selectedVerb.mp3,
    });
  
    if (!showRussianText) playAudio(selectedVerb.mp3);
  };

  const handleAnswer = (selectedIndex) => {
    if (exerciseCompleted) return;
    const selected = optionsOrder[selectedIndex];
    if (!selected) return;

    const isCorrect = selected.isCorrect;

    setOptionsOrder((prev) =>
      prev.map((opt, i) => ({
        ...opt,
        isSelected: i === selectedIndex || opt.isCorrect,
        disabled: true,
      }))
    );

    changeBackgroundColor(isCorrect);
    playSound(isCorrect);

    setCorrectAnswers((v) => v + (isCorrect ? 1 : 0));
    setIncorrectAnswers((v) => v + (!isCorrect ? 1 : 0));
    setProgress((v) => v + 1);

    const matched = verbs1RU.filter((v) => v.infinitive === shuffledVerbs[currentIndex].hebrewVerb);
    if (matched.length > 0) {
      const selectedVerb = matched.find((v) => v.gender === (isGenderMan ? 'man' : 'woman')) || matched[0];
      setVerbDetails({
        hebrewtext: selectedVerb.hebrewtext,
        translit: selectedVerb.translit,
        estext: selectedVerb.estext,
        mp3: selectedVerb.mp3,
      });
    }

    setTimeout(() => setShowNextButton(true), 1000);
  };

  const animateTranslation = () => {
    Animated.timing(optionsContainerAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const [isFirstAnimationCompleted, setIsFirstAnimationCompleted] = useState(false);

  useEffect(() => {
    if (!isFirstAnimationCompleted) {
      animateTranslation();
      setIsFirstAnimationCompleted(true);
    }
  }, [isFirstAnimationCompleted]);

  const handleNextCard = () => {
    if (exerciseCompleted) return;
    optionsContainerAnim.setValue(-500);
    setShowNextButton(false);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= shuffledVerbs.length) {
      setExerciseCompleted(true);
      handleExerciseCompletion();
    } else {
      setCurrentIndex(nextIndex);
      setOptionsOrder(generateOptions(shuffledVerbs[nextIndex]));
      Animated.timing(optionsContainerAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  /* stats */
  const calculateScore = () => {
    const total = correctAnswers + incorrectAnswers;
    return total > 0 ? ((correctAnswers / total) * 100).toFixed(2) : 0;
  };

  const handleExerciseCompletion = async () => {
    if (statisticsUpdated) return;
    setStatisticsUpdated(true);
    const currentScore = calculateScore();
    setTimeout(async () => {
      try {
        await updateStatistics('exercise1Es', currentScore);
      } catch (e) {
        console.error('Failed to update statistics:', e);
      }
    }, 500);
  };

  const handleButton3Press = async () => {
    try {
      const stats = await getStatistics('exercise1Es');
      setStatistics(stats ? { currentScore: stats.averageScore } : null);
      setIsStatModalVisible(true);
    } catch (e) {
      console.error('Failed to fetch statistics:', e);
      setStatistics(null);
      setIsStatModalVisible(false);
    }
  };

  /* gender toggle */
  const handleGenderToggle = () => {
    setIsGenderMan((prev) => {
      const next = !prev;
      updateVerbDetails(shuffledVerbs[currentIndex], next, verbDetails.estext !== '');
      return next;
    });
  };

  /* reset */
  const resetExercise = () => {
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setProgress(0);
    setShowNextButton(false);
    setExerciseCompleted(false);
    setStatisticsUpdated(false);
    setCurrentIndex(0);

    setVerbDetails({ hebrewtext: '', translit: '', estext: '', mp3: '' });

    setIsVerbListVisible(true);
    setAutoPlaySounds(false);

    initializeExercise(language);
    optionsContainerAnim.setValue(-500);

    setTimeout(() => {
      setAutoPlaySounds(true);
      Animated.timing(optionsContainerAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 500);
  };

  /* exit confirm */
  const handleConfirmExit = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MenuEs' }],
    });
  };
  const handleCancelExit = () => setExitConfirmationVisible(false);

  const navigateToMenu = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MenuEs' }],
    });
  };

  /* render */
  const grade = getGrade((correctAnswers / (correctAnswers + incorrectAnswers || 1)) * 100);

  return (
    <>
      {isVerbListVisible && (
        <VerbListModal
          visible={isVerbListVisible}
          language={language}
          verbs={verbListForModal}
          onStartExercise={() => {
            modalCloseReasonRef.current = 'start';
            setIsVerbListVisible(false);
          }}
          onClose={() => {
            modalCloseReasonRef.current = 'menu';
            setIsVerbListVisible(false);
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('MenuEs');
          }}
        />
      )}

      {!isVerbListVisible && (
        <ScrollView
          style={{ backgroundColor: '#AFC1D0' }}
          contentContainerStyle={[styles.scrollViewContent, { paddingBottom: Math.max(insets.bottom, 8) }]}
        >
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

                <TouchableOpacity onPress={handleButton3Press}>
                  <Animated.Image
                    source={require('./stat.png')}
                    style={[styles.buttonImage, { opacity: fadeAnim }]}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setDescriptionModalVisible((v) => !v)}>
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
                  CORRECTO: {correctAnswers}
                </Text>
                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>
                  INCORRECTO: {incorrectAnswers}
                </Text>
              </View>
              <View style={styles.remainingTasksContainer}>
                <Text style={styles.remainingTasksText} maxFontSizeMultiplier={1.2}>
                  {Math.max(shuffledVerbs.length - currentIndex, 0)}
                </Text>
              </View>
              <Animated.View style={[styles.percentContainer, { backgroundColor, borderRadius: 10 }]}>
                <Text style={styles.percentText} maxFontSizeMultiplier={1.2}>
                  {progress > 0
                    ? ((correctAnswers / (correctAnswers + incorrectAnswers)) * 100).toFixed(2)
                    : 0}
                  %
                </Text>
              </Animated.View>
            </Animated.View>

            <Animated.View style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}>
              <ProgressBar progress={progress} totalExercises={shuffledVerbs.length} />
            </Animated.View>

            <Animated.Text style={[styles.title, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>
              SELECCIONA LA TRADUCCIÓN
            </Animated.Text>

            {currentIndex < shuffledVerbs.length && !exerciseCompleted && (
              <VerbCard1
                verbData={shuffledVerbs[currentIndex]}
                options={optionsOrder}
                onAnswer={handleAnswer}
                soundEnabled={soundEnabled}
                isExcluded={excludedIds.includes(shuffledVerbs[currentIndex]?.hebrewVerb)}
                isPinned={pinnedIds.includes(shuffledVerbs[currentIndex]?.hebrewVerb)}
                onExcludePress={() => handleExcludeVerb(shuffledVerbs[currentIndex]?.hebrewVerb)}
                onPinTogglePress={() => handleTogglePinnedVerb(shuffledVerbs[currentIndex]?.hebrewVerb)}
                onOpenManageModal={() => setIsExcludedModalVisible(true)}
              />
            )}

            <VerbDetailsContainer
              verbDetails={verbDetails}
              showSpanishText={verbDetails.estext !== ''}
              handleSpeakerPress={handleSpeakerPress}
            />

            <Animated.View
              style={[
                styles.optionsContainer,
                { transform: [{ translateX: optionsContainerAnim }] },
              ]}
            >
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
              style={[
                styles.nextButton,
                showNextButton ? styles.activeButton : styles.inactiveButton,
              ]}
              onPress={handleNextCard}
              disabled={!showNextButton}
            >
              <Text style={styles.nextButtonText} maxFontSizeMultiplier={1.1}>
                PRÓXIMO VERBO
              </Text>
            </TouchableOpacity>

            {exerciseCompleted && (
              <CompletionMessageEs
                correctAnswers={correctAnswers}
                incorrectAnswers={incorrectAnswers}
                handleOK={handleExerciseCompletion}
                navigateToMenu={navigateToMenu}
                correctAnswersPercentage={
                  progress > 0
                    ? ((correctAnswers / (correctAnswers + incorrectAnswers)) * 100).toFixed(2)
                    : 0
                }
                grade={grade}
                restartTask={resetExercise}
              />
            )}
          </View>
        </ScrollView>
      )}

      {/* ✅ manage excluded/pinned */}
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
        lang={'es'}
      />

      {/* модалки */}
      <StatModal1Es
        visible={isStatModalVisible}
        onToggle={() => setIsStatModalVisible(false)}
        statistics={statistics}
      />

      <TaskDescriptionModal1
        visible={isDescriptionModalVisible}
        onToggle={() => setDescriptionModalVisible((v) => !v)}
        language={language}
        dontShowAgain1={dontShowAgain1}
        onToggleDontShowAgain={async () => {
          const next = !dontShowAgain1;
          setDontShowAgain1(next);
          await AsyncStorage.setItem('exercise1_description_hidden', next ? 'true' : '');
        }}
      />

      <ExitConfirmationModal
        visible={exitConfirmationVisible}
        onCancel={handleCancelExit}
        onConfirm={handleConfirmExit}
      />
    </>
  );
};

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    alignItems: 'center',
  },

  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#AFC1D0',
    height: '100%',
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
  fontSize: 16,
  textAlign: 'center',
  color: '#152039',
  fontWeight: 'bold',
  flexShrink: 1,             // важно: позволяет перенос
  lineHeight: 19,            // чуть плотнее и предсказуемее
},

  nextButton: {
    width: '80%',
    padding: hp('1.5%'),
    borderRadius: wp('2.5%'),
    textAlign: 'center',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  inactiveButton: {
    backgroundColor: '#D9D9D9',
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
    height: hp('6.2%'),
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

  /* details strip */
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
    fontSize: 17,
    color: '#FFFDEF',
    fontWeight: 'bold',
    marginBottom: hp('-0.5%'),
  },
  verbDetailsTranslit: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#CE6857',
    backgroundColor: '#FFFDEF',
    borderRadius: wp('2%'),
    padding: 1,
    paddingLeft: 5,
    paddingRight: 5,
    marginTop: hp('0.7%'),
    marginBottom: hp('0.5%'),
  },
  verbDetailsRussian: {
    fontSize: 14,
    color: '#333652',
    fontWeight: 'bold',
    backgroundColor: '#FFFDEF',
    borderRadius: wp('2.2%'),
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

export default Exercise1Es;
