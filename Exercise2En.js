// Exercise2En.js
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
import VerbCard2 from './VerbCard2En';
import verbsData from './verbs2.json';
import verbs1RU from './verbs11RU.json';
import ProgressBar from './ProgressBar';
import CompletionMessageEn from './CompletionMessageEn';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import ExitConfirmationModal from './ExitConfirmationModalEn';
import { Audio } from 'expo-av';
import TaskDescriptionModal6 from './TaskDescriptionModal2';
import StatModal2En from './StatModal2En';
import { updateStatistics, getStatistics } from './stat';
import sounds from './Soundss';
import soundsConj from './soundconj';
import LottieView from 'lottie-react-native';
import animation from './assets/Animation - 1723020554284.json';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VerbListModal from './VerbListModal';
import ExcludedVerbsModal2 from './ExcludedVerbsModal2';

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

const getGrade = (percentage) => {
  if (percentage === 100) return 'Exceptional! Flawless! You didn’t make a single mistake!';
  if (percentage >= 90) return 'Excellent! Almost perfect, keep up the great work!';
  if (percentage >= 80) return 'Great! You are doing very well!';
  if (percentage >= 70) return 'Good! You’ve learned the material pretty well!';
  if (percentage >= 60) return 'Fairly good! There is steady progress!';
  if (percentage >= 50) return 'Not bad! But there’s room for improvement.';
  if (percentage >= 40) return 'Satisfactory! Keep working and you’ll succeed!';
  if (percentage >= 30) return 'You’re starting to get the hang of it, keep it up!';
  if (percentage >= 20) return 'Try changing your learning strategy, it might help!';
  if (percentage >= 10) return 'It’s tough, but don’t give up! Keep practicing.';
  return 'Serious work is needed! It’s important not to give up and keep learning.';
};

const getHebrewIdEx2 = (verb) => {
  const correctOption = (verb?.verbHebrewOptions || []).find((opt) => opt?.isCorrect);
  return String(correctOption?.text || '').trim();
};

const getTranslitEx2 = (verb) => {
  const correctOption = (verb?.verbHebrewOptions || []).find((opt) => opt?.isCorrect);
  return String(correctOption?.transliteration || '').trim();
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

  if (pool.length <= safeDeckSize) {
    return shuffleAll(pool);
  }

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
    return shuffleAll([...pinnedChosen, ...restChosen, ...extraPinned.slice(0, stillNeed)]);
  }

  return shuffleAll([...pinnedChosen, ...restChosen]);
};

const findVerbMatchForExercise2 = (currentVerb) => {
  if (!currentVerb) return null;

  const baseAudio = normAudio(currentVerb.audioFile);
  const ruCurrent = normalize(currentVerb.verbRussian);

  let candidates = (verbs1RU || []).filter(
    (v) => normAudio(v.audioFile) === baseAudio
  );

  if (candidates.length > 1 && ruCurrent) {
    const byRu = candidates.filter((v) => normalize(v.russian) === ruCurrent);
    if (byRu.length) candidates = byRu;
  }

  if (!candidates.length && ruCurrent) {
    candidates = (verbs1RU || []).filter(
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
  showTranslit,
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
    }).start(() => setIsTextVisible(true));

    if (animationRef.current) {
      animationRef.current.reset();
      animationRef.current.play();
    }
  }, [currentIndex, leftFillAnim]);

  useEffect(() => {
    rightFillAnim.setValue(0);
  }, [currentIndex, rightFillAnim]);

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
      <Animated.View style={[styles.verbDetailsHalf, styles.verbDetailsLeft, { width: leftWidth }]} />
      <Animated.View style={[styles.verbDetailsHalf, styles.verbDetailsRight, { width: rightWidth }]} />

      <View style={styles.verbDetailsContent}>
        <View style={styles.verbDetailsLeftContent}>
          <Text style={styles.verbDetailsRussian} maxFontSizeMultiplier={1.2}>
            {verbDetails.entext}
          </Text>
        </View>

        <View style={styles.verbDetailsRightContent}>
          {isAnswered ? (
            <>
              <Text style={styles.verbDetailsHebrew} maxFontSizeMultiplier={1.2}>
                {verbDetails.hebrewtext}
              </Text>

              {showTranslit && verbDetails.translit ? (
                <Text style={styles.verbDetailsTranslit} maxFontSizeMultiplier={1.2}>
                  {verbDetails.translit}
                </Text>
              ) : null}

              {isTextVisible && canShowSpeaker && verbDetails.mp3 ? (
                <TouchableOpacity
                  style={styles.speakerButton}
                  onPress={() => handleSpeakerPress(verbDetails.mp3)}
                >
                  <Image source={require('./speaker1.png')} style={styles.speakerIcon1} />
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

const Exercise2En = () => {
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

  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  const [showTranslit, setShowTranslit] = useState(true);
  const handleTranslitToggle = () => {
  setShowTranslit((prev) => !prev);
};
  const [isPlayingLottieOnSpeaker, setIsPlayingLottieOnSpeaker] = useState(false);

  const [verbDetails, setVerbDetails] = useState({
    hebrewtext: '',
    translit: '',
    entext: '',
    mp3: '',
  });

  const [canShowSpeaker, setCanShowSpeaker] = useState(false);

  const [isVerbListVisible, setIsVerbListVisible] = useState(true);
  const [verbListForModal, setVerbListForModal] = useState([]);
  const modalCloseReasonRef = useRef(null);

  const allowLeaveRef = useRef(false);

  const [language, setLanguage] = useState('en');
  const [dontShowAgain2, setDontShowAgain2] = useState(false);

  const [isExcludedVerbsModalVisible, setExcludedVerbsModalVisible] = useState(false);
  const [excludedVerbs, setExcludedVerbs] = useState([]);
  const [pinnedVerbs, setPinnedVerbs] = useState([]);
  const excludedRef = useRef([]);
  const pinnedRef = useRef([]);

  const [isGenderMan, setIsGenderMan] = useState(true);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [animateRight, setAnimateRight] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  const [statistics, setStatistics] = useState(null);
  const [isStatModalVisible, setIsStatModalVisible] = useState(false);
  const [statisticsUpdated, setStatisticsUpdated] = useState(false);

  const [selectedExerciseCount, setSelectedExerciseCount] = useState(DEFAULT_EXERCISE_COUNT);

  const animationRef = useRef(null);

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
      translation: v.verbEnglish || '',
      audioFile: v.audioFile || '',
    }));
  }, [uniqueVerbsData]);

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

      const exArr = Array.isArray(ex) ? ex.filter(Boolean).map(String) : [];
      const pinArr = Array.isArray(pin) ? pin.filter(Boolean).map(String) : [];

      setExcludedVerbs(exArr);
      setPinnedVerbs(pinArr);
      excludedRef.current = exArr;
      pinnedRef.current = pinArr;
    } catch (e) {
      console.log('[Exercise2En] loadExcludedAndPinned error:', e);
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
      console.log('[Exercise2En] loadExerciseCount error:', e);
      setSelectedExerciseCount(DEFAULT_EXERCISE_COUNT);
      return DEFAULT_EXERCISE_COUNT;
    }
  }, []);

  const persistExcludedAndPinned = useCallback(async (nextExcluded, nextPinned) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(EXCLUDED_KEY, JSON.stringify(nextExcluded)),
        AsyncStorage.setItem(PINNED_KEY, JSON.stringify(nextPinned)),
      ]);
    } catch (e) {
      console.log('[Exercise2En] persistExcludedAndPinned error:', e);
    }
  }, []);

  const saveExerciseCount = useCallback(async (count) => {
    const safeCount = ALLOWED_EXERCISE_COUNTS.includes(count)
      ? count
      : DEFAULT_EXERCISE_COUNT;

    setSelectedExerciseCount(safeCount);
    await AsyncStorage.setItem(EXERCISE2_COUNT_KEY, String(safeCount));
  }, []);

  const handleToggleExcludedVerb = useCallback(
    async (hebrewVerb) => {
      const id = String(hebrewVerb || '').trim();
      if (!id) return;

      const prevExcluded = excludedRef.current || [];
      const prevPinned = pinnedRef.current || [];

      const isExcluded = prevExcluded.includes(id);
      const nextExcluded = isExcluded ? prevExcluded.filter((v) => v !== id) : [...prevExcluded, id];
      const nextPinned = isExcluded ? prevPinned : prevPinned.filter((v) => v !== id);

      setExcludedVerbs(nextExcluded);
      setPinnedVerbs(nextPinned);
      excludedRef.current = nextExcluded;
      pinnedRef.current = nextPinned;

      await persistExcludedAndPinned(nextExcluded, nextPinned);
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
      const nextPinned = isPinned ? prevPinned.filter((v) => v !== id) : [...prevPinned, id];
      const nextExcluded = isPinned ? prevExcluded : prevExcluded.filter((v) => v !== id);

      setPinnedVerbs(nextPinned);
      setExcludedVerbs(nextExcluded);
      pinnedRef.current = nextPinned;
      excludedRef.current = nextExcluded;

      await persistExcludedAndPinned(nextExcluded, nextPinned);
    },
    [persistExcludedAndPinned]
  );

  const initializeVerbList = useCallback(
    (lang, setShuffledVerbsFn, setVerbListForModalFn, deckSize = selectedExerciseCount) => {
      const safeDeckSize = ALLOWED_EXERCISE_COUNTS.includes(deckSize)
        ? deckSize
        : selectedExerciseCount || DEFAULT_EXERCISE_COUNT;

      const selected = buildDeck(
        uniqueVerbsData,
        excludedRef.current,
        pinnedRef.current,
        safeDeckSize
      );

      setShuffledVerbsFn(selected);

      const sorted = selected
        .slice()
        .sort((a, b) => String(a.verbRussian || '').localeCompare(String(b.verbRussian || ''), 'ru'));

      const verbList = sorted.map((verb) => {
        const correctOption = (verb.verbHebrewOptions || []).find((opt) => opt?.isCorrect);
        const match = findVerbMatchForExercise2(verb);

        const mp3Inf = String(verb.audioFile || '').replace(/\.mp3$/i, '').trim();
        const mp3Conj = match ? String(match.mp3 || '').replace(/\.mp3$/i, '').trim() : '';

        return {
          hebrewtext: correctOption?.text || '—',
          translit: correctOption?.transliteration || '',
          entext: verb.verbEnglish || '—',
          mp3: mp3Inf,
          mp3Inf,
          mp3Conj,
          gender: match?.gender || undefined,
        };
      });

      setVerbListForModalFn(verbList);
    },
    [selectedExerciseCount, uniqueVerbsData]
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        await loadExcludedAndPinned();

        const savedCount = await loadExerciseCount();
        const lang = (await AsyncStorage.getItem('language')) || 'en';
        const hidden = await AsyncStorage.getItem('exercise2_description_hidden');

        setLanguage(lang);
        setDontShowAgain2(hidden === 'true');

        initializeVerbList(lang, setShuffledVerbs, setVerbListForModal, savedCount);
      } catch (e) {
        console.log('[Exercise2En] initialize error:', e);
      }
    };

    initialize();
  }, [initializeVerbList, loadExcludedAndPinned, loadExerciseCount]);

  useEffect(() => {
    if (!language) return;
    initializeVerbList(language, setShuffledVerbs, setVerbListForModal, selectedExerciseCount);
  }, [language, selectedExerciseCount, initializeVerbList]);

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

  useEffect(() => {
    async function loadSounds() {
      const correctSoundObject = new Audio.Sound();
      const incorrectSoundObject = new Audio.Sound();
      try {
        await correctSoundObject.loadAsync(require('./assets/sounds/success.mp3'));
        await incorrectSoundObject.loadAsync(require('./assets/sounds/failure.mp3'));
        setCorrectSound(correctSoundObject);
        setIncorrectSound(incorrectSoundObject);
      } catch (error) {
        console.error('Failed to load sounds', error);
      }
    }
    loadSounds();

    return () => {
      correctSound?.unloadAsync();
      incorrectSound?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    const updateVolume = async () => {
      const volume = soundEnabled ? 1 : 0;
      await correctSound?.setVolumeAsync(volume);
      await incorrectSound?.setVolumeAsync(volume);
    };

    if (correctSound && incorrectSound) updateVolume();
  }, [soundEnabled, correctSound, incorrectSound]);

  const handleSoundToggleLocal = () => {
    const newVolume = !soundEnabled ? 1 : 0;
    setSoundEnabled((prev) => !prev);
    setAutoPlayEnabled((prev) => !prev);

    if (correctSound && incorrectSound) {
      correctSound.setVolumeAsync(newVolume);
      incorrectSound.setVolumeAsync(newVolume);
    }
  };

  const updateVerbDetails2 = (currentVerb, showHebrewText = false) => {
    if (!currentVerb) return;

    const baseMatch = findVerbMatchForExercise2(currentVerb);

    if (!baseMatch) {
      setVerbDetails({
        hebrewtext: '',
        translit: '',
        entext: 'Verb not found',
        mp3: '',
      });
      return;
    }

    const baseAudio = normAudio(baseMatch.audioFile);
    const sameInfinitive = (verbs1RU || []).filter(v => normAudio(v.audioFile) === baseAudio);

    const genderWanted = isGenderMan ? 'man' : 'woman';
    const selectedVerb =
      sameInfinitive.find(v => v.gender === genderWanted) ||
      baseMatch;

    setVerbDetails({
      hebrewtext: showHebrewText ? selectedVerb.hebrewtext : '',
      translit: showHebrewText ? selectedVerb.translit : '',
      entext: selectedVerb.entext,
      mp3: selectedVerb.mp3,
    });
  };

  useEffect(() => {
    if (shuffledVerbs.length > 0) {
      updateVerbDetails2(shuffledVerbs[currentIndex], showNextButton);
    }
  }, [isGenderMan, currentIndex, shuffledVerbs, showNextButton]);

  useEffect(() => {
    if (shuffledVerbs.length > 0) {
      setOptionsOrder(
        generateOptions(shuffledVerbs[currentIndex]).map((option) => ({
          ...option,
          isSelected: false,
          disabled: false,
        }))
      );
    }
  }, [currentIndex, shuffledVerbs]);

  useEffect(() => {
    if (exerciseCompleted) {
      handleExerciseCompletion();
    }
  }, [exerciseCompleted]);

  useFocusEffect(
    useCallback(() => {
      if (!isVerbListVisible) return;

      const onBackPress = () => {
        if (navigation.canGoBack()) navigation.goBack();
        else goToMenu();
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
        setExitConfirmationVisible(true);
        return true;
      };

      const bh = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (exitConfirmationVisible) return;

        if (allowLeaveRef.current) {
          allowLeaveRef.current = false;
          return;
        }

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
      headerLeft: () => null,
    });
  }, [navigation]);

  const playOptionSpeakerSound = async (audioFileName, forcePlay = false) => {
    if (!soundEnabled && !forcePlay) return;

    const audioFile = sounds[audioFileName.replace('.mp3', '')];
    if (audioFile) {
      const soundObject = new Audio.Sound();
      try {
        setIsPlayingLottieOnSpeaker(true);

        await soundObject.loadAsync(audioFile);
        await soundObject.playAsync();

        setTimeout(() => {
          setIsPlayingLottieOnSpeaker(false);
        }, 800);

        soundObject.setOnPlaybackStatusUpdate(async (playbackStatus) => {
          if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
            await soundObject.unloadAsync();
          }
        });
      } catch (error) {
        await soundObject.unloadAsync();
      }
    }
  };

  const handleSpeakerPressInline = async (audioFile) => {
    if (!audioFile) return;

    const soundFile = soundsConj[audioFile.replace('.mp3', '')];
    if (!soundFile) return;

    const soundObject = new Audio.Sound();
    try {
      if (animationRef.current) {
        animationRef.current.reset();
        animationRef.current.play();
      }

      await soundObject.loadAsync(soundFile);
      await soundObject.playAsync();
      soundObject.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await soundObject.unloadAsync();
        }
      });
    } catch (error) {
      await soundObject.unloadAsync();
    }
  };

  const playSecondSound = async () => {
    const audioFile = verbDetails.mp3;
    if (!audioFile) return;

    try {
      const secondSoundFile = soundsConj[audioFile.replace('.mp3', '')];
      if (!secondSoundFile) return;

      const snd2 = new Audio.Sound();
      await snd2.loadAsync(secondSoundFile);

      if (!soundEnabled) {
        await snd2.stopAsync();
        await snd2.unloadAsync();
        return;
      }

      await snd2.playAsync();

      snd2.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await snd2.unloadAsync();
        }
      });
    } catch (error) {}
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

  const handleAnswer = async (selectedOptionIdx) => {
    setSelectedOptionIndex(selectedOptionIdx);
    setAnimateRight(false);
    setIsAnswered(true);
    setCanShowSpeaker(false);

    const selectedOption = optionsOrder[selectedOptionIdx];
    if (!selectedOption) return;

    const isCorrect = selectedOption.isCorrect;

    const updatedOptions = optionsOrder.map((option, index) => ({
      ...option,
      isSelected: index === selectedOptionIdx,
      disabled: true,
    }));

    setOptionsOrder(updatedOptions);
    changeBackgroundColor(isCorrect);

    try {
      if (isCorrect) {
        setCorrectAnswers((prev) => prev + 1);
        await correctSound?.replayAsync();
      } else {
        setIncorrectAnswers((prev) => prev + 1);
        await incorrectSound?.replayAsync();
      }
    } catch (error) {}

    setProgress((prev) => prev + 1);

    try {
      const firstSoundFile = shuffledVerbs[currentIndex].audioFile.replace('.mp3', '');
      await playOptionSpeakerSound(firstSoundFile);

      setAnimateRight(true);

      await new Promise((resolve) => setTimeout(resolve, 700));
      await playSecondSound();
      setCanShowSpeaker(true);
    } catch (error) {}

    updateVerbDetails2(shuffledVerbs[currentIndex], true);
    setShowNextButton(true);
  };

  const generateOptions = (verbData) => {
    const correctAnswerIndex = verbData.verbHebrewOptions.findIndex((option) => option.isCorrect);
    const correctTranslation = verbData.verbHebrewOptions[correctAnswerIndex]?.text;
    const transliteration = verbData.verbHebrewOptions[correctAnswerIndex]?.transliteration;

    const incorrectOptions = verbData.verbHebrewOptions.filter((_, index) => index !== correctAnswerIndex);

    const shuffledOptions = shuffleArray(
      incorrectOptions.map((option, index) => ({
        text: option.text,
        transliteration: option.transliteration,
        isCorrect: false,
        isSelected: false,
        isHighlighted: false,
        index,
      }))
    );

    shuffledOptions.splice(Math.floor(Math.random() * (shuffledOptions.length + 1)), 0, {
      text: correctTranslation,
      transliteration,
      isCorrect: true,
      isSelected: false,
      isHighlighted: false,
      index: shuffledOptions.length,
    });

    return shuffledOptions;
  };

  const resetLocalQuestionState = () => {
    setOptionsOrder([]);
    setSelectedOptionIndex(null);
    setIsAnswered(false);
    setAnimateRight(false);
    setCanShowSpeaker(false);
  };

  const handleNextCard = () => {
    if (currentIndex + 1 >= shuffledVerbs.length) {
      setExerciseCompleted(true);
      setShowNextButton(false);
      setOptionsOrder([]);
      return;
    }

    const next = currentIndex + 1;

    setCurrentIndex(next);
    setShowNextButton(false);
    setAnimateRight(false);
    setIsAnswered(false);
    setSelectedOptionIndex(null);
    setCanShowSpeaker(false);

    const nextOptions = generateOptions(shuffledVerbs[next]).map((o) => ({
      ...o,
      isSelected: false,
      disabled: false,
    }));
    setOptionsOrder(nextOptions);
    updateVerbDetails2(shuffledVerbs[next], false);
  };

  const handleExerciseCompletion = async () => {
    if (!statisticsUpdated) {
      setStatisticsUpdated(true);
      const currentScore = calculateScore();

      setTimeout(async () => {
        try {
          await updateStatistics('exercise2En', currentScore);
        } catch (error) {}
      }, 500);
    }
  };

  const resetExercise = async () => {
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setProgress(0);
    setShowNextButton(false);
    setExerciseCompleted(false);
    setStatisticsUpdated(false);

    resetLocalQuestionState();

    setVerbDetails({
      hebrewtext: '',
      translit: '',
      entext: '',
      mp3: '',
    });

    setIsVerbListVisible(true);

    await loadExcludedAndPinned();
    initializeVerbList(language, setShuffledVerbs, setVerbListForModal, selectedExerciseCount);

    setCurrentIndex(0);
  };

  const handleButton3Press = async () => {
    const exerciseId = 'exercise2En';
    try {
      const stats = await getStatistics(exerciseId);
      setStatistics(stats ? { currentScore: stats.averageScore } : null);
      setIsStatModalVisible(true);
    } catch (error) {
      setStatistics(null);
      setIsStatModalVisible(false);
    }
  };

  const handleSelectExerciseCount = async (count) => {
    if (!ALLOWED_EXERCISE_COUNTS.includes(count)) return;
    if (count === selectedExerciseCount) return;

    await saveExerciseCount(count);

    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setProgress(0);
    setShowNextButton(false);
    setExerciseCompleted(false);
    setStatisticsUpdated(false);
    resetLocalQuestionState();
    setCurrentIndex(0);

    initializeVerbList(language, setShuffledVerbs, setVerbListForModal, count);
  };

  const goToMenu = () => {
    allowLeaveRef.current = true;
    setExitConfirmationVisible(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'MenuEn' }],
      })
    );
  };

  const handleConfirmExit = () => goToMenu();
  const handleCancelExit = () => setExitConfirmationVisible(false);

  const handleGenderToggle = () => setIsGenderMan((prev) => !prev);

  const toggleDescriptionModal = () => setDescriptionModalVisible((prev) => !prev);

  const handleToggleDontShowAgain2 = async () => {
    const newValue = !dontShowAgain2;
    setDontShowAgain2(newValue);
    await AsyncStorage.setItem('exercise2_description_hidden', newValue ? 'true' : '');
  };

  const calculateScore = () => {
    const totalAttempts = correctAnswers + incorrectAnswers;
    if (totalAttempts === 0) return 0;
    return Number(((correctAnswers / totalAttempts) * 100).toFixed(2));
  };

  const percent = calculateScore();
  const grade = getGrade(percent);

  return (
    <>
      <ExcludedVerbsModal2
        visible={isExcludedVerbsModalVisible}
        onClose={toggleExcludedVerbsModal}
        excludedIds={excludedVerbs}
        pinnedIds={pinnedVerbs}
        verbsData={manageVerbsData}
        lang={'en'}
        onRestoreVerb={handleToggleExcludedVerb}
        onTogglePinnedVerb={handleTogglePinnedVerb}
      />

      {isVerbListVisible && (
        <VerbListModal
          visible={isVerbListVisible}
          language={language}
          verbs={verbListForModal}
          pinnedIds={pinnedVerbs}
          selectedCount={selectedExerciseCount}
          onSelectCount={handleSelectExerciseCount}
          onStartExercise={() => {
            modalCloseReasonRef.current = 'start';

            resetLocalQuestionState();
            setIsVerbListVisible(false);

            if (shuffledVerbs.length) {
              setCurrentIndex(0);
              setOptionsOrder(
                generateOptions(shuffledVerbs[0]).map((o) => ({
                  ...o,
                  isSelected: false,
                  disabled: false,
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
                <TouchableOpacity onPress={handleSoundToggleLocal}>
                  <Animated.Image
                    source={soundEnabled ? require('./SoundOn.png') : require('./SoundOff.png')}
                    style={[styles.buttonImage, { opacity: fadeAnim }]}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleTranslitToggle}>
                  <Animated.Image
                    source={showTranslit ? require('./translit1.png') : require('./translit2.png')}
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
                  INCORRECT: {incorrectAnswers}
                </Text>
              </View>

              <View style={styles.remainingTasksContainer}>
                <Text style={styles.remainingTasksText} maxFontSizeMultiplier={1.2}>
                  {shuffledVerbs.length - currentIndex}
                </Text>
              </View>

              <Animated.View style={[styles.percentContainer, { backgroundColor, borderRadius: 10 }]}>
                <Text style={styles.percentText} maxFontSizeMultiplier={1.2}>
                  {percent}%
                </Text>
              </Animated.View>
            </Animated.View>

            <Animated.View style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}>
              <ProgressBar progress={progress} totalExercises={shuffledVerbs.length} />
            </Animated.View>

            {!exerciseCompleted && (
              <>
                <Animated.Text style={[styles.title, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>
                  SELECT TRANSLATION
                </Animated.Text>

                {currentIndex < shuffledVerbs.length && (
                  <VerbCard2
                    verbData={shuffledVerbs[currentIndex]}
                    options={optionsOrder}
                    onAnswer={handleAnswer}
                    isExcluded={excludedVerbs.includes(getHebrewIdEx2(shuffledVerbs[currentIndex]))}
                    isPinned={pinnedVerbs.includes(getHebrewIdEx2(shuffledVerbs[currentIndex]))}
                    onExcludePress={() => handleToggleExcludedVerb(getHebrewIdEx2(shuffledVerbs[currentIndex]))}
                    onPinTogglePress={() => handleTogglePinnedVerb(getHebrewIdEx2(shuffledVerbs[currentIndex]))}
                    onOpenManageModal={() => setExcludedVerbsModalVisible(true)}
                  />
                )}

                <VerbDetailsContainer2
                  verbDetails={verbDetails}
                  handleSpeakerPress={handleSpeakerPressInline}
                  currentIndex={currentIndex}
                  animateRight={animateRight}
                  isAnswered={isAnswered}
                  canShowSpeaker={canShowSpeaker}
                  showTranslit={showTranslit}
                />

                <Animated.View
                  style={[
                    styles.optionsContainer,
                    {
                      transform: [{ translateX: optionsAnim }],
                    },
                  ]}
                >
                  {optionsOrder.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        option.isSelected
                          ? option.isCorrect
                            ? styles.correctOption
                            : styles.incorrectOption
                          : selectedOptionIndex !== null && option.isCorrect
                          ? styles.correctOption
                          : null,
                      ]}
                      onPress={() => handleAnswer(index)}
                      disabled={showNextButton || option.disabled}
                    >
                      <View style={styles.optionContent}>
                        <Text style={styles.optionText} maxFontSizeMultiplier={1.2}>
                          {option.text}
                        </Text>

                        {showTranslit && (
                          <Text style={styles.transliterationText} maxFontSizeMultiplier={1.2}>
                            {option.transliteration}
                          </Text>
                        )}

                        {option.isCorrect && isPlayingLottieOnSpeaker && (
                          <View style={styles.lottieContainer}>
                            <LottieView
                              ref={animationRef}
                              source={require('./assets/Animation - 1718430107767.json')}
                              autoPlay
                              loop={false}
                              style={styles.lottie}
                            />
                          </View>
                        )}

                        {showNextButton && option.isCorrect && (
                          <TouchableOpacity
                            style={styles.speakerIconContainer}
                            onPress={() => playOptionSpeakerSound(shuffledVerbs[currentIndex].audioFile, true)}
                          >
                            <Image source={require('./speaker6.png')} style={styles.speakerIcon} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </Animated.View>

                <TouchableOpacity
                  style={[styles.nextButton, showNextButton ? styles.activeButton : styles.inactiveButton]}
                  onPress={handleNextCard}
                  disabled={!showNextButton}
                >
                  <Text style={styles.nextButtonText} maxFontSizeMultiplier={1.2}>
                    NEXT VERB
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {exerciseCompleted && (
              <CompletionMessageEn
                correctAnswers={correctAnswers}
                incorrectAnswers={incorrectAnswers}
                handleOK={handleExerciseCompletion}
                navigateToMenu={goToMenu}
                correctAnswersPercentage={percent}
                grade={grade}
                restartTask={resetExercise}
              />
            )}

            {!exerciseCompleted && (
              <ExitConfirmationModal
                visible={exitConfirmationVisible}
                onCancel={handleCancelExit}
                onConfirm={handleConfirmExit}
              />
            )}
          </View>
        </ScrollView>
      )}

      <StatModal2En
        visible={isStatModalVisible}
        onToggle={() => setIsStatModalVisible(false)}
        statistics={statistics}
      />

      {isDescriptionModalVisible && (
        <TaskDescriptionModal6
          visible={true}
          onToggle={toggleDescriptionModal}
          language={language}
          dontShowAgain2={dontShowAgain2}
          onToggleDontShowAgain={handleToggleDontShowAgain2}
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
    shadowOffset: { width: 0, height: 2 },
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

export default Exercise2En;