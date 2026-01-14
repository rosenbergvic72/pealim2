// Exercise1Ar.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, BackHandler, Image, Animated } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import VerbCard1 from './VerbCard1Ar';
import verbsData from './verbs1.json';
import verbs1RU from './verbs11RU.json';

import ProgressBar from './ProgressBar';
import CompletionMessageAr from './CompletionMessageAr';
import ExitConfirmationModal from './ExitConfirmationModalAr';
import TaskDescriptionModal1 from './TaskDescriptionModal1';
import StatModal1Ar from './StatModal1Ar';
import { updateStatistics, getStatistics } from './stat';
import sounds from './Soundss';
import soundsConj from './soundconj';
import VerbListModal from './VerbListModal';
import ExcludedVerbsModal1 from './ExcludedVerbsModal1';

import animation from './assets/Animation - 1723020554284.json';
import { AR_TEXT, AR_TEXT_BOLD } from './arText';

/* ---------- helpers ---------- */

const shuffleArray = (array) => {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 24);
};
const shuffleAll = (array) => {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const normalize = (s = '') =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');

// Убираем дубли по hebrewVerb, чтобы не было duplicate keys (например: לקרוא)
const uniqueVerbsData = (() => {
  const map = new Map();
  (verbsData || []).forEach((v) => {
    if (v?.hebrewVerb && !map.has(v.hebrewVerb)) map.set(v.hebrewVerb, v);
  });
  return Array.from(map.values());
})();

// Собираем колоду на 24 карточки с учетом скрытых (excluded) и закрепленных (pinned)
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
  if (percentage === 100) return 'استثنائي! لا تشوبه شائبة! لم ترتكب أي خطأ!';
  if (percentage >= 90) return 'ممتاز! تقريبا مثالي، واصل العمل الرائع!';
  if (percentage >= 80) return 'رائع! أنت تقوم بعمل جيد جدًا!';
  if (percentage >= 70) return 'جيد! لقد تعلمت المادة بشكل جيد!';
  if (percentage >= 60) return 'جيد إلى حد ما! هناك تقدم مستمر!';
  if (percentage >= 50) return 'ليس سيئًا! ولكن هناك مجال للتحسن.';
  if (percentage >= 40) return 'مرضٍ! استمر في العمل وستنجح!';
  if (percentage >= 30) return 'لقد بدأت تفهم الموضوع، واصل العمل!';
  if (percentage >= 20) return 'حاول تغيير استراتيجية التعلم، قد يساعد ذلك!';
  if (percentage >= 10) return 'إنه صعب، ولكن لا تستسلم! استمر في الممارسة.';
  return 'هناك حاجة إلى عمل جاد! من المهم ألا تستسلم وتستمر في التعلم.';
};

/* ---------- VerbDetails ---------- */

const VerbDetailsContainer = ({ verbDetails, showRussianText, handleSpeakerPress }) => {
  const leftFillAnim = useRef(new Animated.Value(0)).current;
  const rightFillAnim = useRef(new Animated.Value(0)).current;
  const [prevVerbDetails, setPrevVerbDetails] = useState(verbDetails);
  const animationRef = useRef(null);

  useEffect(() => {
    if (prevVerbDetails.hebrewtext !== verbDetails.hebrewtext) {
      leftFillAnim.setValue(0);
      Animated.timing(leftFillAnim, { toValue: 1, duration: 800, useNativeDriver: false }).start(() => {
        setPrevVerbDetails(verbDetails);
      });
      rightFillAnim.setValue(0);
    }
    if (showRussianText) {
      Animated.timing(rightFillAnim, { toValue: 1, duration: 800, useNativeDriver: false }).start();
    }
  }, [verbDetails, showRussianText, leftFillAnim, rightFillAnim, prevVerbDetails]);

  const leftWidth = leftFillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] });
  const rightWidth = rightFillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '51%'] });

  return (
    <View style={styles.verbDetailsContainer}>
      <Animated.View style={[styles.verbDetailsHalf, styles.verbDetailsLeft, { width: leftWidth }]} />
      <Animated.View style={[styles.verbDetailsHalf, styles.verbDetailsRight, { width: rightWidth }]} />
      <View style={styles.verbDetailsContent}>
        <View style={styles.verbDetailsLeftContent}>
          <Text style={styles.verbDetailsHebrew} maxFontSizeMultiplier={1.2}>{verbDetails.hebrewtext}</Text>
          <Text style={styles.verbDetailsTranslit} maxFontSizeMultiplier={1.2}>{verbDetails.translit}</Text>
        </View>
        <View style={styles.verbDetailsRightContent}>
          {showRussianText ? (
            <View style={styles.arabicPill}>
              <Text style={styles.verbDetailsArabic} maxFontSizeMultiplier={1.2}>
                {verbDetails.artext}
              </Text>
            </View>
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

const Exercise1Ar = ({ navigation }) => {
  const insets = useSafeAreaInsets();

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

// ===== Excluded / Pinned verbs (как в русской версии) =====
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

// Если во время упражнения глагол стал "исключённым", убираем его из колоды,
// чтобы не было ситуации: флаг исключения включен визуально, но глагол всё равно попадается.
useEffect(() => {
  if (isVerbListVisible) return;
  if (!shuffledVerbs || shuffledVerbs.length === 0) return;
  if (!excludedIds || excludedIds.length === 0) return;

  const exSet = new Set(excludedIds);
  const filtered = shuffledVerbs.filter((v) => v && !exSet.has(v.hebrewVerb));

  if (filtered.length !== shuffledVerbs.length) {
    setShuffledVerbs(filtered);

    const cur = shuffledVerbs[currentIndex];
    if (cur && exSet.has(cur.hebrewVerb)) {
      const nextIdx = Math.min(currentIndex, Math.max(filtered.length - 1, 0));
      setCurrentIndex(nextIdx);
    } else if (currentIndex >= filtered.length) {
      setCurrentIndex(Math.max(filtered.length - 1, 0));
    }
  }
}, [excludedIds, isVerbListVisible, shuffledVerbs, currentIndex]);


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

  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [dontShowAgain1, setDontShowAgain1] = useState(false);

  const [language, setLanguage] = useState('ar');
  const [statistics, setStatistics] = useState(null);
  const [isStatModalVisible, setIsStatModalVisible] = useState(false);
  const [statisticsUpdated, setStatisticsUpdated] = useState(false);

  const [verbDetails, setVerbDetails] = useState({ hebrewtext: '', translit: '', artext: '', mp3: '' });
  const [isGenderMan, setIsGenderMan] = useState(true);

  /* header back handling */
  useEffect(() => {
    navigation.setOptions({ headerLeft: () => null });
  }, [navigation]);

  // Когда открыт список — «Назад» уводит в меню
  useFocusEffect(
    useCallback(() => {
      if (!isVerbListVisible) return;
      const onBackPress = () => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('MenuAr');
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
    Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const changeBackgroundColor = (isCorrect) => {
    backgroundColorAnim.setValue(isCorrect ? 1 : 2);
    Animated.timing(backgroundColorAnim, { toValue: isCorrect ? 1 : 2, duration: 300, useNativeDriver: false }).start(() => {
      setTimeout(() => {
        Animated.timing(backgroundColorAnim, { toValue: 0, duration: 100, useNativeDriver: false }).start();
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
        if (lang) {
  setLanguage(lang);
  setDontShowAgain1(hidden === 'true');
} else {
  setDontShowAgain1(hidden === 'true');
}

    };
    checkFlagAndLang();
  }, []);

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
    /* exercise init */
  const initializeExercise = useCallback(async (lang) => {
    // важно: сначала подтягиваем excluded/pinned, чтобы колода строилась правильно
    await loadLists();

    // строим колоду строго из уникальных глаголов и БЕЗ исключённых
    const deck = buildDeck(
      uniqueVerbsData,
      excludedRef.current || [],
      pinnedRef.current || [],
      24,
      8 // минимум pinned
    );

    setShuffledVerbs(deck);

    const langMap = {
      ru: 'translationOptions',
      en: 'translationOptionsEn',
      fr: 'translationOptionsFr',
      es: 'translationOptionsEs',
      pt: 'translationOptionsPt',
      ar: 'translationOptionsAr',
      am: 'translationOptionsAm',
    };
    const langKey = langMap[lang] || 'translationOptionsAr';

    const sorted = [...deck].sort((a, b) => a.hebrewVerb.localeCompare(b.hebrewVerb, 'he'));

    const verbList = sorted.map((verb) => {
      const translations = verb[langKey] || [];
      const correctIndex = verb.correctTranslationIndex ?? 0;

      const ruMatch =
        verbs1RU.find((v) => v.infinitive === verb.hebrewVerb && v.gender === 'man') ||
        verbs1RU.find((v) => v.infinitive === verb.hebrewVerb);

      const mp3Inf = String(verb.audioFile || '').replace(/\.mp3$/i, '').trim();
      const mp3Conj = String(ruMatch?.mp3 || '').replace(/\.mp3$/i, '').trim();

      return {
        hebrewtext: verb.hebrewVerb,
        translit: verb.transliteration || '',
        entext: translations[correctIndex] || '—',
        // чтобы и старый VerbListModal, и новая логика могли использовать звук
        mp3: mp3Inf,
        mp3Inf,
        mp3Conj,
      };
    });

    setVerbListForModal(verbList);
  }, [loadLists]);

  useEffect(() => {
    if (!language) return;
    (async () => {
      await initializeExercise(language);
    })();
  }, [language, initializeExercise]);


  useEffect(() => {
    if (!isVerbListVisible && shuffledVerbs.length > 0) {
      if (modalCloseReasonRef.current === 'menu') return;
      const currentVerb = shuffledVerbs[currentIndex];
      setOptionsOrder(generateOptions(currentVerb));
      updateVerbDetails(currentVerb, isGenderMan, false);
      if (modalCloseReasonRef.current === 'start') modalCloseReasonRef.current = null;
    }
  }, [currentIndex, shuffledVerbs, isGenderMan, isVerbListVisible]);

  const generateOptions = (verbData) => {
    if (!verbData || !verbData.translationOptionsAr || !Number.isInteger(verbData.correctTranslationIndex)) return [];
    const correctIndex = verbData.correctTranslationIndex;
    const correctTranslation = verbData.translationOptionsAr[correctIndex];
    const incorrectOptions = verbData.translationOptionsAr.filter((_, i) => i !== correctIndex);
    const shuffledOptions = shuffleArray(
      incorrectOptions.map((opt, i) => ({ text: opt, isCorrect: false, isSelected: false, index: i }))
    );
    shuffledOptions.splice(
      Math.floor(Math.random() * (shuffledOptions.length + 1)),
      0,
      { text: correctTranslation, isCorrect: true, isSelected: false, index: shuffledOptions.length }
    );
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
    // разгружаем при выходе
    correctSound?.unloadAsync();
    incorrectSound?.unloadAsync();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


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
    setVerbDetails({ hebrewtext: 'لم يتم العثور على الفعل', translit: '', artext: '', mp3: '' });
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
    artext: showRussianText ? enCorrect : '',
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
      prev.map((opt, i) => ({ ...opt, isSelected: i === selectedIndex || opt.isCorrect, disabled: true }))
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
        artext: selectedVerb.artext,
        mp3: selectedVerb.mp3,
      });
    }

    setTimeout(() => setShowNextButton(true), 1000);
  };

  const animateTranslation = () => {
    Animated.timing(optionsContainerAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
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

    const next = currentIndex + 1;
    if (next >= shuffledVerbs.length) {
      setExerciseCompleted(true);
      handleExerciseCompletion();
    } else {
      setCurrentIndex(next);
      setOptionsOrder(generateOptions(shuffledVerbs[next]));
      Animated.timing(optionsContainerAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
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
        await updateStatistics('exercise1Ar', currentScore);
      } catch (e) {
        console.error('Failed to update statistics:', e);
      }
    }, 500);
  };

  const handleButton3Press = async () => {
    try {
      const stats = await getStatistics('exercise1Ar');
      setStatistics(stats ? { currentScore: stats.averageScore } : null);
      setIsStatModalVisible(true);
    } catch (e) {
      setStatistics(null);
      setIsStatModalVisible(false);
    }
  };

  /* gender toggle */
  const handleGenderToggle = () => {
    setIsGenderMan((prev) => {
      const next = !prev;
      updateVerbDetails(shuffledVerbs[currentIndex], next, verbDetails.artext !== '');
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
    setVerbDetails({ hebrewtext: '', translit: '', artext: '', mp3: '' });

    setIsVerbListVisible(true);
    setAutoPlaySounds(false);

    initializeExercise(language);
    optionsContainerAnim.setValue(-500);

    setTimeout(() => {
      setAutoPlaySounds(true);
      Animated.timing(optionsContainerAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    }, 500);
  };

  /* exit confirm */
  const handleConfirmExit = () => {
    navigation.reset({ index: 0, routes: [{ name: 'MenuAr' }] });
  };
  const handleCancelExit = () => setExitConfirmationVisible(false);

  /* render */
  return (
    <>
      {isVerbListVisible && (
        <VerbListModal
          visible={isVerbListVisible}
          language={language}
          verbs={verbListForModal}
          onStartExercise={async () => {
            // перестраиваем колоду с учетом актуальных pinned/excluded прямо перед стартом
            await initializeExercise(language);
            modalCloseReasonRef.current = 'start';
            setIsVerbListVisible(false);
          }}
          onClose={() => {
            modalCloseReasonRef.current = 'menu';
            setIsVerbListVisible(false);
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('MenuAr');
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

                <TouchableOpacity onPress={() => setDescriptionModalVisible((v) => !v)}>
                  <Animated.Image source={require('./question.png')} style={[styles.buttonImage, { opacity: fadeAnim }]} />
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
                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>صحيح: {correctAnswers}</Text>
                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>خطأ: {incorrectAnswers}</Text>
              </View>
              <View style={styles.remainingTasksContainer}>
                <Text style={styles.remainingTasksText} maxFontSizeMultiplier={1.2}>
                  {Math.max(shuffledVerbs.length - currentIndex, 0)}
                </Text>
              </View>
              <Animated.View style={[styles.percentContainer, { backgroundColor }]}>
                <Text style={styles.percentText} maxFontSizeMultiplier={1.2}>
                  {progress > 0 ? ((correctAnswers / (correctAnswers + incorrectAnswers)) * 100).toFixed(2) : 0}%
                </Text>
              </Animated.View>
            </Animated.View>

            <Animated.View style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}>
              <ProgressBar progress={progress} totalExercises={shuffledVerbs.length} />
            </Animated.View>

            <Animated.Text style={[styles.title, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>
              اختر الترجمة
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
              showRussianText={verbDetails.artext !== ''}
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
                  <Text style={styles.optionText} maxFontSizeMultiplier={1.2}>{option.text}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>

            <TouchableOpacity
              style={[styles.nextButton, showNextButton ? styles.activeButton : styles.inactiveButton]}
              onPress={handleNextCard}
              disabled={!showNextButton}
            >
              <Text style={styles.nextButtonText} maxFontSizeMultiplier={1.1}>الفعل التالي</Text>
            </TouchableOpacity>

            {exerciseCompleted && (
              <CompletionMessageAr
                correctAnswers={correctAnswers}
                incorrectAnswers={incorrectAnswers}
                handleOK={handleExerciseCompletion}
                navigateToMenu={() => navigation.reset({ index: 0, routes: [{ name: 'MenuAr' }] })}
                correctAnswersPercentage={
                  progress > 0 ? ((correctAnswers / (correctAnswers + incorrectAnswers)) * 100).toFixed(2) : 0
                }
                grade={getGrade((correctAnswers / (correctAnswers + incorrectAnswers)) * 100 || 0)}
                restartTask={resetExercise}
              />
            )}
          </View>
        </ScrollView>
      )}

      {/* ✅ Управление скрытыми/закрепленными глаголами */}
      <ExcludedVerbsModal1
        visible={isExcludedModalVisible}
        onClose={() => setIsExcludedModalVisible(false)}
        excludedIds={excludedIds}
        pinnedIds={pinnedIds}
        verbsData={uniqueVerbsData}
        onRestoreVerb={async (id) => {
          const next = (excludedRef.current || []).filter((x) => x !== id);
          await saveExcluded(next);
        }}
        onTogglePinnedVerb={handleTogglePinnedVerb}
        lang={'ar'}
      />

      {/* модалки */}
      <StatModal1Ar
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
  scrollViewContent: { flexGrow: 1, alignItems: 'center' },

  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#AFC1D0',
    height: '100%',
    width: '100%',
  },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: 0 },
  logoImage: { width: 90, height: 90, marginLeft: 10 },
  buttonContainer: { flexDirection: 'row', marginRight: wp('2.5%') },
  buttonImage: { width: 44, height: 44, marginLeft: 10 },

  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: hp('1.5%') },
  optionButton: {
    width: '49%',
    height: hp('7%'),
    padding: wp('3%'),
    backgroundColor: '#D1E3F1',
    marginBottom: hp('1%'),
    borderRadius: wp('2.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.25%') },
    shadowOpacity: 0.25,
    shadowRadius: hp('0.5%'),
    elevation: 5,
  },
  optionText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#152039',
    fontWeight: 'bold',
    marginTop: 8,
    lineHeight: 22,
    includeFontPadding: false,
    textAlignVertical: 'center',
    ...AR_TEXT_BOLD,
  },

  nextButton: {
    width: '80%',
    padding: hp('1.2%'),
    borderRadius: wp('2.5%'),
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.25%') },
    shadowOpacity: 0.25,
    shadowRadius: hp('0.5%'),
    elevation: 5,
  },
  nextButtonText: {
    fontSize: 20,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    marginTop: 10,
    lineHeight: 22,
    includeFontPadding: false,
    textAlignVertical: 'center',
    ...AR_TEXT_BOLD,
  },
  activeButton: { backgroundColor: '#1C3F60' },
  inactiveButton: { backgroundColor: '#D9D9D9' },

  correctOption: { backgroundColor: '#AFFFCA' },
  incorrectOption: { backgroundColor: '#FFBCBC' },

  ProgressBarcontainer: { width: '100%' },

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
    shadowOffset: { width: 0, height: hp('0.25%') },
    shadowOpacity: 0.25,
    shadowRadius: hp('0.5%'),
    elevation: 5,
  },
  textContainer: { flex: 1, justifyContent: 'center', marginTop: 8, width: '50%' },
  prtext: {
    fontSize: 14,
    color: 'white',
    textAlign: 'left',
    marginTop: 2,
    marginLeft: 14,
    lineHeight: 22,
    fontWeight: 'bold',
    includeFontPadding: false,
    textAlignVertical: 'center',
    ...AR_TEXT_BOLD,
  },

  percentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('2.5%'),
    borderRadius: 12,
    minHeight: 28,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  percentText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    borderRadius: 12,
    paddingLeft: 10,
    paddingRight: 10,
    lineHeight: 22,
    includeFontPadding: false,
    textAlignVertical: 'center',
    ...AR_TEXT_BOLD,
  },
  remainingTasksContainer: { alignItems: 'center', justifyContent: 'center', marginRight: wp('2.5%') },
  remainingTasksText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#83A3CD',
    borderRadius: 12,
    paddingLeft: 10,
    paddingRight: 10,
    lineHeight: 22,
    includeFontPadding: false,
    textAlignVertical: 'center',
    minHeight: 28,
    ...AR_TEXT_BOLD,
  },

  completedMessage: { fontSize: wp('5%'), fontWeight: 'bold', color: '#2F4766', marginBottom: hp('1.5%') },
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
    shadowOffset: { width: 0, height: hp('0.25%') },
    shadowOpacity: 0.25,
    shadowRadius: hp('0.5%'),
    elevation: 5,
  },
  verbDetailsHalf: { position: 'absolute', top: 0, bottom: 0, backgroundColor: '#6C8EBB', height: '100%' },
  verbDetailsLeft: { left: 0, borderTopLeftRadius: wp('2.5%'), borderBottomLeftRadius: wp('2.5%') },
  verbDetailsRight: { left: '49%', borderTopRightRadius: wp('2.5%'), borderBottomRightRadius: wp('2.5%') },
  verbDetailsContent: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    position: 'absolute',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('2.5%'),
  },
  verbDetailsLeftContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  verbDetailsRightContent: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative', marginVertical: hp('0.5%') },

  verbDetailsHebrew: { fontSize: 17, color: '#FFFDEF', fontWeight: 'bold', marginBottom: hp('-0.5%') },
  verbDetailsTranslit: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#CE6857',
    backgroundColor: '#FFFDEF',
    borderRadius: wp('2%'),
    paddingVertical: 1,
    paddingHorizontal: 5,
    marginTop: hp('0.7%'),
    marginBottom: hp('0.5%'),
  },

  arabicPill: {
    backgroundColor: '#FFFDEF',
    borderRadius: wp('2.5%'),
    paddingHorizontal: 10,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verbDetailsArabic: {
    fontSize: 18,
    color: '#333652',
    fontWeight: 'bold',
    includeFontPadding: false,
    textAlignVertical: 'center',
    paddingBottom: 6,
    ...AR_TEXT_BOLD,
  },

  lottieAnimation: { position: 'absolute', width: wp('90%'), height: hp('18%'), justifyContent: 'center', alignItems: 'center' },
  speakerButton: { position: 'absolute', bottom: hp('-0.25%'), right: wp('-0.75%'), width: wp('7.5%'), height: hp('3.5%'), justifyContent: 'center', alignItems: 'center' },
  speakerIcon: { width: '250%', height: '250%', resizeMode: 'contain' },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 6,
    color: '#2F4766',
    lineHeight: 34,
    includeFontPadding: false,
    textAlignVertical: 'center',
    ...AR_TEXT_BOLD,
  },
});

export default Exercise1Ar;
