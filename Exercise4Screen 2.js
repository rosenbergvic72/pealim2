import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {

  Animated,

  BackHandler,

  Image,

  ScrollView,

  StyleSheet,

  Text,

  TouchableOpacity,

  View,

} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Audio } from 'expo-av';

import { useFocusEffect } from '@react-navigation/native';

import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

import LottieView from 'lottie-react-native';

import ProgressBar from './ProgressBar';

import ExerciseCountStartScreen from './ExerciseCountStartScreen';

import { updateStatistics, getStatistics } from './stat';

import * as FirebaseAnalytics from './src/analytics/FirebaseAnalytics';

const COUNTS = [6, 12, 18, 24];

const DEFAULT_COUNT = 18;

const LANGUAGE_ALIASES = {

  ru: 'ru', russian: 'ru', rus: 'ru', 'ru-ru': 'ru',

  en: 'en', english: 'en', eng: 'en', 'en-us': 'en', 'en-gb': 'en',

  fr: 'fr', french: 'fr', fra: 'fr', 'fr-fr': 'fr',

  es: 'es', spanish: 'es', spa: 'es', 'es-es': 'es',

  pt: 'pt', portuguese: 'pt', por: 'pt', 'pt-pt': 'pt', 'pt-br': 'pt',

  ar: 'ar', arabic: 'ar', arab: 'ar', ara: 'ar', 'ar-il': 'ar',

  am: 'am', amharic: 'am', amh: 'am', 'am-et': 'am',

};

const UI = {

  ru: {

    correct: 'ВЕРНО', wrong: 'НЕВЕРНО', title: 'ВЫБЕРИ ПЕРЕВОД', next: 'СЛЕДУЮЩИЙ',

    menu: 'Menu', stat: 'exercise5', analytics: 'exercise4ru',

  },

  en: {

    correct: 'CORRECT', wrong: 'INCORRECT', title: 'CHOOSE THE TRANSLATION', next: 'NEXT',

    menu: 'MenuEn', stat: 'exercise5En', analytics: 'exercise4en',

  },

  fr: {

    correct: 'CORRECT', wrong: 'INCORRECT', title: 'CHOISISSEZ LA TRADUCTION', next: 'SUIVANT',

    menu: 'MenuFr', stat: 'exercise5Fr', analytics: 'exercise4fr',

  },

  es: {

    correct: 'CORRECTO', wrong: 'INCORRECTO', title: 'ELIGE LA TRADUCCIÓN', next: 'SIGUIENTE',

    menu: 'MenuEs', stat: 'exercise5Es', analytics: 'exercise4es',

  },

  pt: {

    correct: 'CORRETO', wrong: 'INCORRETO', title: 'ESCOLHA A TRADUÇÃO', next: 'PRÓXIMO',

    menu: 'MenuPt', stat: 'exercise5Pt', analytics: 'exercise4pt',

  },

  ar: {

    correct: 'صحيح', wrong: 'غير صحيح', title: 'اختر الترجمة', next: 'التالي',

    menu: 'MenuAr', stat: 'exercise5Ar', analytics: 'exercise4ar',

  },

  am: {

    correct: 'ትክክል', wrong: 'ትክክል አይደለም', title: 'ትርጉሙን ይምረጡ', next: 'ቀጣይ',

    menu: 'MenuAm', stat: 'exercise5Am', analytics: 'exercise4am',

  },

};

const GRADES = {

  ru: [

    'Исключительно! Безупречно! Ты не сделал ни единой ошибки!',

    'Великолепно! Почти идеально, продолжай в том же духе!',

    'Отлично! Ты очень хорошо справляешься!',

    'Хорошо! Ты неплохо усвоил материал!',

    'Достаточно хорошо! Есть стабильный прогресс!',

    'Неплохо! Но есть куда стремиться.',

    'Удовлетворительно! Старайся и всё получится!',

    'Ты начинаешь улавливать главное, продолжай в том же духе!',

    'Попробуй изменить стратегию обучения, это может помочь!',

    'Тяжело, но не сдавайся! Продолжай практиковаться.',

    'Требуется серьезная работа! Важно не унывать и продолжать учиться.',

  ],

  en: [

    'Exceptional! Flawless! You didn’t make a single mistake!',

    'Excellent! Almost perfect, keep up the great work!',

    'Great! You are doing very well!',

    'Good! You’ve learned the material pretty well!',

    'Fairly good! There is steady progress!',

    'Not bad! But there’s room for improvement.',

    'Satisfactory! Keep working and you’ll succeed!',

    'You’re starting to get the hang of it, keep it up!',

    'Try changing your learning strategy, it might help!',

    'It’s tough, but don’t give up! Keep practicing.',

    'Serious work is needed! It’s important not to give up and keep learning.',

  ],

  fr: [

    "Exceptionnel ! Parfait ! Vous n'avez fait aucune erreur !",

    'Excellent ! Presque parfait, continuez comme ça !',

    'Très bien ! Vous vous débrouillez très bien !',

    'Bien ! Vous avez bien appris la matière !',

    'Assez bien ! Il y a un progrès constant !',

    "Pas mal ! Mais il y a encore de la place pour l'amélioration.",

    'Satisfaisant ! Continuez à travailler et vous réussirez !',

    'Vous commencez à comprendre, continuez comme ça !',

    "Essayez de changer votre stratégie d'apprentissage, cela pourrait aider !",

    "C'est difficile, mais ne vous découragez pas ! Continuez à pratiquer.",

    'Un travail sérieux est nécessaire ! Il est important de ne pas abandonner et de continuer à apprendre.',

  ],

  es: [

    '¡Excepcional! ¡Perfecto! ¡No cometiste ni un solo error!',

    '¡Excelente! Casi perfecto, ¡sigue así!',

    '¡Genial! ¡Lo estás haciendo muy bien!',

    '¡Bien! Has aprendido el material bastante bien.',

    '¡Bastante bien! Hay un progreso constante.',

    'No está mal, pero hay margen de mejora.',

    '¡Satisfactorio! Sigue trabajando y tendrás éxito.',

    '¡Estás empezando a entenderlo, sigue así!',

    'Intenta cambiar tu estrategia de aprendizaje, ¡podría ayudar!',

    'Es difícil, pero no te rindas. ¡Sigue practicando!',

    'Hace falta más trabajo. Lo importante es no rendirse y seguir aprendiendo.',

  ],

  pt: [

    'Excepcional! Perfeito! Você não cometeu um único erro!',

    'Excelente! Quase perfeito, continue com o ótimo trabalho!',

    'Ótimo! Você está indo muito bem!',

    'Bom! Você aprendeu o material muito bem!',

    'Razoável! Há um progresso constante!',

    'Nada mal! Mas há espaço para melhorar.',

    'Satisfatório! Continue trabalhando e você terá sucesso!',

    'Você está começando a entender, continue assim!',

    'Tente mudar sua estratégia de aprendizado, isso pode ajudar!',

    'Está difícil, mas não desista! Continue praticando.',

    'É necessário um trabalho sério! É importante não desistir e continuar aprendendo.',

  ],

  ar: [

    'ممتاز جدًا! أداء بلا أخطاء!', 'رائع! قريب جدًا من الكمال، استمر!',

    'ممتاز! أنت تؤدي بشكل رائع!', 'جيد! لقد أتقنت المادة بشكل جيد!',

    'جيد إلى حد كبير! هناك تقدم ثابت!', 'ليس سيئًا! لكن ما زال هناك مجال للتحسن.',

    'مُرضٍ! واصل التدريب وستنجح!', 'بدأت تفهم الفكرة، استمر!',

    'جرّب تغيير أسلوب التعلّم، فقد يساعدك ذلك!', 'الأمر صعب، لكن لا تستسلم! واصل التدريب.',

    'تحتاج إلى مزيد من العمل. المهم أن تواصل التعلّم.',

  ],

  am: [

    'እጅግ አስደናቂ! ፍጹም ስኬት! ስህተት አላደረጉም!',

    'በጣም ጥሩ! ፍጹም ለመሆን ቀርቧል — ይቀጥሉ!',

    'እጅግ ጥሩ! በጣም ጥሩ እየሰሩ ነው!',

    'ጥሩ! ትምህርቱን በጥሩ ሁኔታ ተምረዋል!',

    'መልካም! የተረጋጋ እድገት አለ!',

    'መጥፎ አይደለም! ግን ለማሻሻል ቦታ አለ።',

    'በመጠኑ ጥሩ! ልምምድዎን ይቀጥሉ!',

    'ዋናውን ሀሳብ መረዳት ጀምረዋል — ይቀጥሉ!',

    'የመማር ዘዴዎን ትንሽ መቀየር ሊረዳ ይችላል!',

    'ከባድ ነው፣ ግን አይተዉ! ልምምድዎን ይቀጥሉ!',

    'ተጨማሪ ልምምድ ያስፈልጋል። መማርዎን ይቀጥሉ።',

  ],

};

const normalizeLanguage = value => {

  const key = String(value || 'ru').trim().toLowerCase();

  return LANGUAGE_ALIASES[key] || 'ru';

};

const moduleDefault = mod => mod?.default || mod;

const shuffleAll = array => {

  const result = Array.isArray(array) ? array.slice() : [];

  for (let i = result.length - 1; i > 0; i -= 1) {

    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];

  }

  return result;

};

const getGrade = (language, percentage) => {

  const thresholds = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];

  const grades = GRADES[language] || GRADES.ru;

  const index = thresholds.findIndex(value => percentage >= value);

  return grades[index < 0 ? grades.length - 1 : index];

};

const getLanguageComponents = language => {

  switch (language) {

    case 'en':

      return {

        VerbCard: moduleDefault(require('./VerbCard5En')),

        Completion: moduleDefault(require('./CompletionMessageEn')),

        Exit: moduleDefault(require('./ExitConfirmationModalEn')),

        Stat: moduleDefault(require('./StatModal5En')),

      };

    case 'fr':

      return {

        VerbCard: moduleDefault(require('./VerbCard5Fr')),

        Completion: moduleDefault(require('./CompletionMessageFr')),

        Exit: moduleDefault(require('./ExitConfirmationModalFr')),

        Stat: moduleDefault(require('./StatModal5Fr')),

      };

    case 'es':

      return {

        VerbCard: moduleDefault(require('./VerbCard5Es')),

        Completion: moduleDefault(require('./CompletionMessageEs')),

        Exit: moduleDefault(require('./ExitConfirmationModalEs')),

        Stat: moduleDefault(require('./StatModal5Es')),

      };

    case 'pt':

      return {

        VerbCard: moduleDefault(require('./VerbCard5Pt')),

        Completion: moduleDefault(require('./CompletionMessagePt')),

        Exit: moduleDefault(require('./ExitConfirmationModalPt')),

        Stat: moduleDefault(require('./StatModal5Pt')),

      };

    case 'ar':

      return {

        VerbCard: moduleDefault(require('./VerbCard5Ar')),

        Completion: moduleDefault(require('./CompletionMessageAr')),

        Exit: moduleDefault(require('./ExitConfirmationModalAr')),

        Stat: moduleDefault(require('./StatModal5Ar')),

      };

    case 'am':

      return {

        VerbCard: moduleDefault(require('./VerbCard5Am')),

        Completion: moduleDefault(require('./CompletionMessageAm')),

        Exit: moduleDefault(require('./ExitConfirmationModalAm')),

        Stat: moduleDefault(require('./StatModal5Am')),

      };

    default:

      return {

        VerbCard: moduleDefault(require('./VerbCard5')),

        Completion: moduleDefault(require('./CompletionMessage')),

        Exit: moduleDefault(require('./ExitConfirmationModal')),

        Stat: moduleDefault(require('./StatModal5')),

      };

  }

};

export default function Exercise4Screen({ navigation, route }) {

  // Используем язык маршрута, а если он не передан — язык приложения.
  const [storedLanguage, setStoredLanguage] = useState(null);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem('language')
      .then(value => { if (active) setStoredLanguage(value); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  const language = normalizeLanguage(route?.params?.language || storedLanguage);

  const copy = UI[language];

  const rtl = language === 'ar';

  const [startVisible, setStartVisible] = useState(true);
  // Согласуем цвет нижней Safe Area с экраном настроек/задания.
  useEffect(() => {
    navigation.setParams({ bottomSafeAreaStage: startVisible ? 'settings' : 'task' });
  }, [navigation, startVisible]);

  // Скрываем ИИ только на стартовом экране; в самом упражнении показываем.
  useEffect(() => {
    navigation.setOptions({ headerHideAI: startVisible });
  }, [navigation, startVisible]);


  const [exerciseCount, setExerciseCount] = useState(DEFAULT_COUNT);

  const [deck, setDeck] = useState([]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [optionsOrder, setOptionsOrder] = useState([]);

  const [correctAnswers, setCorrectAnswers] = useState(0);

  const [incorrectAnswers, setIncorrectAnswers] = useState(0);

  const [progress, setProgress] = useState(0);

  const [showNextButton, setShowNextButton] = useState(false);

  const [exerciseCompleted, setExerciseCompleted] = useState(false);

  const [statisticsUpdated, setStatisticsUpdated] = useState(false);

  const [statistics, setStatistics] = useState(null);

  const [isStatModalVisible, setIsStatModalVisible] = useState(false);

  const [exitConfirmationVisible, setExitConfirmationVisible] = useState(false);

  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);

  const [dontShowAgain5, setDontShowAgain5] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);

  const [isDisabled, setIsDisabled] = useState(false);

  const [showSpeaker, setShowSpeaker] = useState(false);

  const [isAnimationActive, setIsAnimationActive] = useState(false);

  const dataRef = useRef(null);

  const soundsRef = useRef(null);

  const correctSoundRef = useRef(null);

  const incorrectSoundRef = useRef(null);

  const currentSoundRef = useRef(null);

  const allowLeaveRef = useRef(false);

  const analyticsLoggedRef = useRef(false);

  const nextTimerRef = useRef(null);

  const animationRef = useRef(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const optionsAnim = useRef(new Animated.Value(-500)).current;

  const backgroundColorAnim = useRef(new Animated.Value(0)).current;

  const percent = useMemo(() => {

    const total = correctAnswers + incorrectAnswers;

    return total ? (correctAnswers / total) * 100 : 0;

  }, [correctAnswers, incorrectAnswers]);

  const grade = getGrade(language, percent);

  const ensureData = useCallback(() => {

    // В арабской и амхарской версиях используется отдельная база императивов.
    const rows = language === 'ar' || language === 'am'
      ? moduleDefault(require('./verbimperArAm.json'))
      : moduleDefault(require('./verbimperRus.json'));

    dataRef.current = Array.isArray(rows) ? rows : [];
    return dataRef.current;

  }, [language]);

  const generateOptions = useCallback(verbData => {

    if (!verbData) return [];

    const translations = Array.isArray(verbData.translationOptions) ? verbData.translationOptions : [];

    const translits = Array.isArray(verbData.mp4) ? verbData.mp4 : [];

    const correctIndex = Number(verbData.correctTranslationIndex) || 0;

    if (!translations.length || translations[correctIndex] == null) return [];

    const all = translations.map((text, index) => ({

      text,

      mp4Text: translits[index] || '',

      isCorrect: index === correctIndex,

      isSelected: false,

      showCorrect: false,

      mp3: verbData.mp3 || '',

      sourceIndex: index,

    }));

    const correct = all.find(item => item.isCorrect);

    const wrong = shuffleAll(all.filter(item => !item.isCorrect)).slice(0, 3);

    return shuffleAll([correct, ...wrong].filter(Boolean));

  }, []);

  const buildDeck = useCallback(count => {

    const data = ensureData();

    const safeCount = COUNTS.includes(Number(count)) ? Number(count) : DEFAULT_COUNT;

    return shuffleAll(data).slice(0, Math.min(safeCount, data.length));

  }, [ensureData]);

  const stopCurrentAudio = useCallback(async () => {

    const sound = currentSoundRef.current;

    currentSoundRef.current = null;

    if (!sound) return;

    try { await sound.stopAsync(); } catch {}

    try { await sound.unloadAsync(); } catch {}

    setIsAnimationActive(false);

    animationRef.current?.reset?.();

  }, []);

  const startExercise = useCallback(count => {

    const safeCount = COUNTS.includes(Number(count)) ? Number(count) : DEFAULT_COUNT;

    const nextDeck = buildDeck(safeCount);

    setExerciseCount(safeCount);

    setDeck(nextDeck);

    setCurrentIndex(0);

    setOptionsOrder(generateOptions(nextDeck[0]));

    setCorrectAnswers(0);

    setIncorrectAnswers(0);

    setProgress(0);

    setShowNextButton(false);

    setExerciseCompleted(false);

    setStatisticsUpdated(false);

    setExitConfirmationVisible(false);

    setIsDisabled(false);

    setShowSpeaker(false);

    setIsAnimationActive(false);

    fadeAnim.setValue(0);

    optionsAnim.setValue(-500);

    setStartVisible(false);

    requestAnimationFrame(() => {

      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

      Animated.timing(optionsAnim, { toValue: 0, duration: 450, useNativeDriver: true }).start();

    });

  }, [buildDeck, fadeAnim, generateOptions, optionsAnim]);

  const goToMenu = useCallback(() => {

    allowLeaveRef.current = true;

    setExitConfirmationVisible(false);

    stopCurrentAudio();

    navigation.reset({ index: 0, routes: [{ name: copy.menu }] });

  }, [copy.menu, navigation, stopCurrentAudio]);

  useFocusEffect(

    useCallback(() => {

      allowLeaveRef.current = false;

      if (!analyticsLoggedRef.current) {

        analyticsLoggedRef.current = true;

        FirebaseAnalytics.logFirebaseEvent(copy.analytics, { screen: copy.analytics });

      }

      return () => { analyticsLoggedRef.current = false; };

    }, [copy.analytics])

  );

  useFocusEffect(

    useCallback(() => {

      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {

        if (startVisible) return false;

        if (!exerciseCompleted && !exitConfirmationVisible) {

          setExitConfirmationVisible(true);

          return true;

        }

        return false;

      });

      const unsubscribe = navigation.addListener('beforeRemove', event => {

        if (allowLeaveRef.current || startVisible || exerciseCompleted) return;

        event.preventDefault();

        if (!exitConfirmationVisible) setExitConfirmationVisible(true);

      });

      return () => {

        backHandler.remove();

        unsubscribe();

      };

    }, [exerciseCompleted, exitConfirmationVisible, navigation, startVisible])

  );

  useEffect(() => {

    AsyncStorage.getItem('exercise5_description_hidden')

      .then(value => setDontShowAgain5(value === 'true'))

      .catch(() => {});

  }, []);

  useEffect(() => {

    if (startVisible) return undefined;

    let active = true;

    const loadFeedback = async () => {

      const good = new Audio.Sound();

      const bad = new Audio.Sound();

      try {

        await good.loadAsync(require('./assets/sounds/success.mp3'));

        await bad.loadAsync(require('./assets/sounds/failure.mp3'), { volume: 0.8 });

        if (!active) {

          good.unloadAsync().catch(() => {});

          bad.unloadAsync().catch(() => {});

          return;

        }

        correctSoundRef.current = good;

        incorrectSoundRef.current = bad;

      } catch (error) {

        console.log('Exercise4 feedback audio load error:', error);

      }

    };

    loadFeedback();

    return () => {

      active = false;

      clearTimeout(nextTimerRef.current);

      stopCurrentAudio();

      correctSoundRef.current?.unloadAsync().catch(() => {});

      incorrectSoundRef.current?.unloadAsync().catch(() => {});

      correctSoundRef.current = null;

      incorrectSoundRef.current = null;

    };

  }, [startVisible, stopCurrentAudio]);

  useEffect(() => {

    if (startVisible || !deck.length || currentIndex >= deck.length) return;

    setOptionsOrder(generateOptions(deck[currentIndex]));

    setIsDisabled(false);

    setShowNextButton(false);

    setShowSpeaker(false);

    setIsAnimationActive(false);

    optionsAnim.setValue(-500);

    Animated.timing(optionsAnim, { toValue: 0, duration: 450, useNativeDriver: true }).start();

  }, [currentIndex, deck, generateOptions, optionsAnim, startVisible]);

  const changeBackgroundColor = isCorrect => {

    backgroundColorAnim.setValue(isCorrect ? 1 : 2);

    setTimeout(() => {

      Animated.timing(backgroundColorAnim, {

        toValue: 0,

        duration: 120,

        useNativeDriver: false,

      }).start();

    }, 250);

  };

  const playFeedback = async isCorrect => {

    if (!soundEnabled) return;

    try {

      await (isCorrect ? correctSoundRef.current : incorrectSoundRef.current)?.replayAsync();

    } catch {}

  };

  const playImperativeAudio = async (audioKey, respectSoundToggle = true) => {

    if (!audioKey || (respectSoundToggle && !soundEnabled)) return null;

    try {

      if (!soundsRef.current) soundsRef.current = moduleDefault(require('./soundsimper')) || {};

      const source = soundsRef.current[audioKey];

      if (!source) {

        console.warn(`[Exercise4] imperative audio not found: ${audioKey}`);

        return null;

      }

      await stopCurrentAudio();

      const { sound } = await Audio.Sound.createAsync(source);

      currentSoundRef.current = sound;

      setIsAnimationActive(true);

      sound.setOnPlaybackStatusUpdate(status => {

        if (status?.didJustFinish) {

          if (currentSoundRef.current === sound) currentSoundRef.current = null;

          setIsAnimationActive(false);

          animationRef.current?.reset?.();

          sound.unloadAsync().catch(() => {});

        }

      });

      await sound.playAsync();

      return sound;

    } catch (error) {

      console.log('Exercise4 imperative audio error:', error);

      setIsAnimationActive(false);

      return null;

    }

  };

  const handleSoundToggle = async () => {

    if (soundEnabled) await stopCurrentAudio();

    setSoundEnabled(value => !value);

  };

  const handleAnswer = selectedIndex => {

    if (isDisabled || !optionsOrder[selectedIndex]) return;

    setIsDisabled(true);

    const selected = optionsOrder[selectedIndex];

    const isCorrect = !!selected.isCorrect;

    const correctOption = optionsOrder.find(option => option.isCorrect);

    setOptionsOrder(optionsOrder.map((option, index) => ({

      ...option,

      isSelected: index === selectedIndex,

      showCorrect: option.isCorrect,

    })));

    setShowSpeaker(true);

    changeBackgroundColor(isCorrect);

    playFeedback(isCorrect);

    if (isCorrect) setCorrectAnswers(value => value + 1);

    else setIncorrectAnswers(value => value + 1);

    setProgress(value => value + 1);

    clearTimeout(nextTimerRef.current);

    if (soundEnabled && correctOption?.mp3) {

      playImperativeAudio(correctOption.mp3, true);

      nextTimerRef.current = setTimeout(() => setShowNextButton(true), 1500);

    } else {

      nextTimerRef.current = setTimeout(() => setShowNextButton(true), 300);

    }

  };

  const finishExercise = useCallback(async () => {

    if (!statisticsUpdated) {

      setStatisticsUpdated(true);

      const total = correctAnswers + incorrectAnswers;

      const score = total ? ((correctAnswers / total) * 100).toFixed(2) : 0;

      try {

        await updateStatistics(copy.stat, score);

      } catch (error) {

        console.error('Exercise4 statistics update error:', error);

      }

    }

    setExerciseCompleted(true);

  }, [copy.stat, correctAnswers, incorrectAnswers, statisticsUpdated]);

  const handleNextCard = () => {

    if (!showNextButton) return;

    clearTimeout(nextTimerRef.current);

    stopCurrentAudio();

    const next = currentIndex + 1;

    if (next >= deck.length) {

      finishExercise();

      return;

    }

    setCurrentIndex(next);

  };

  const resetExercise = () => startExercise(exerciseCount);

  const openStatistics = async () => {

    try {

      const stats = await getStatistics(copy.stat);

      setStatistics(stats ? { currentScore: stats.averageScore } : null);

      setIsStatModalVisible(true);

    } catch (error) {

      console.error('Exercise4 statistics read error:', error);

      setStatistics(null);

      setIsStatModalVisible(false);

    }

  };

  const toggleDontShowAgain = async () => {

    const next = !dontShowAgain5;

    setDontShowAgain5(next);

    try {

      await AsyncStorage.setItem('exercise5_description_hidden', next ? 'true' : '');

    } catch {}

  };

  if (startVisible) {

    return (

      <ExerciseCountStartScreen

        visible

        exerciseNumber={4}

        language={language}

        defaultCount={DEFAULT_COUNT}

        allowedCounts={COUNTS}

        storageKey="exercise4_selected_count"

        onCountChange={setExerciseCount}

        onStart={startExercise}

        onClose={() => {

          allowLeaveRef.current = true;

          if (navigation.canGoBack?.()) navigation.goBack();

          else navigation.navigate(copy.menu);

        }}

      />

    );

  }

  const { VerbCard, Completion, Exit, Stat } = getLanguageComponents(language);

  const TaskDescription = moduleDefault(require('./TaskDescriptionModal5'));

  const backgroundColor = backgroundColorAnim.interpolate({

    inputRange: [0, 1, 2],

    outputRange: ['#83A3CD', '#AFFFCA', '#FFBCBC'],

  });

  const completionPercent = Number(percent.toFixed(2));

  const remaining = Math.max(deck.length - currentIndex, 0);

  return (

    <>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>

        <View style={styles.container}>

          <View style={styles.topBar}>

            <Animated.Image source={require('./VERBIFY.png')} style={[styles.logoImage, { opacity: fadeAnim }]} />

            <View style={[styles.buttonContainer, rtl && styles.rowReverse]}>

              <TouchableOpacity onPress={handleSoundToggle}>

                <Animated.Image

                  source={soundEnabled ? require('./SoundOn.png') : require('./SoundOff.png')}

                  style={[styles.buttonImage, { opacity: fadeAnim }]}

                />

              </TouchableOpacity>

              <TouchableOpacity onPress={openStatistics}>

                <Animated.Image source={require('./stat.png')} style={[styles.buttonImage, { opacity: fadeAnim }]} />

              </TouchableOpacity>

              <TouchableOpacity onPress={() => setDescriptionModalVisible(value => !value)}>

                <Animated.Image source={require('./question.png')} style={[styles.buttonImage, { opacity: fadeAnim }]} />

              </TouchableOpacity>

            </View>

          </View>

          <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>

            <View style={styles.textContainer}>

              <Text style={[styles.progressText, rtl && styles.rtlText]} maxFontSizeMultiplier={1.2}>

                {copy.correct}: {correctAnswers}

              </Text>

              <Text style={[styles.progressText, rtl && styles.rtlText]} maxFontSizeMultiplier={1.2}>

                {copy.wrong}: {incorrectAnswers}

              </Text>

            </View>

            <View style={styles.remainingTasksContainer}>

              <Text style={styles.remainingTasksText} maxFontSizeMultiplier={1.2}>{remaining}</Text>

            </View>

            <Animated.View style={[styles.percentContainer, { backgroundColor }]}>

              <Text style={styles.percentText} maxFontSizeMultiplier={1.2}>{completionPercent}%</Text>

            </Animated.View>

          </Animated.View>

          <Animated.View style={[styles.progressBarContainer, { opacity: fadeAnim }]}>

            <ProgressBar progress={progress} totalExercises={Math.max(deck.length, 1)} />

          </Animated.View>

          <Animated.Text style={[styles.title, rtl && styles.rtlText, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>

            {copy.title}

          </Animated.Text>

          {currentIndex < deck.length && (

            <VerbCard verbData={deck[currentIndex]} options={optionsOrder} onAnswer={handleAnswer} />

          )}

          <Animated.View style={[styles.optionsContainer, { transform: [{ translateX: optionsAnim }] }]}>

            {optionsOrder.map((option, index) => (

              <TouchableOpacity

                key={`${option.sourceIndex}-${index}`}

                style={[

                  styles.optionButton,

                  option.isSelected && (option.isCorrect ? styles.correctOption : styles.incorrectOption),

                  option.showCorrect && option.isCorrect && styles.correctOption,

                ]}

                onPress={() => handleAnswer(index)}

                disabled={isDisabled}

              >

                <Text style={styles.optionText} maxFontSizeMultiplier={1.2}>{option.text}</Text>

                {option.isCorrect && option.showCorrect && (

                  <>

                    {isAnimationActive && (

                      <LottieView

                        ref={animationRef}

                        source={require('./assets/Animation - 1718430107767.json')}

                        autoPlay

                        loop={false}

                        style={styles.lottie}

                        onAnimationFinish={() => setIsAnimationActive(false)}

                      />

                    )}

                    {showSpeaker && !isAnimationActive && (

                      <TouchableOpacity

                        style={styles.speakerButton}

                        onPress={() => playImperativeAudio(option.mp3, false)}

                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}

                      >

                        <Image source={require('./speaker6.png')} style={styles.speakerIcon} />

                      </TouchableOpacity>

                    )}

                  </>

                )}

                {!!option.mp4Text && (

                  <Text style={styles.mp4Text} maxFontSizeMultiplier={1.2}>{option.mp4Text}</Text>

                )}

              </TouchableOpacity>

            ))}

          </Animated.View>

          <TouchableOpacity

            style={[styles.nextButton, showNextButton ? styles.activeButton : styles.inactiveButton]}

            onPress={handleNextCard}

            disabled={!showNextButton}

          >

            <Text style={[styles.nextButtonText, rtl && styles.rtlText]} maxFontSizeMultiplier={1.2}>{copy.next}</Text>

          </TouchableOpacity>

        </View>

      </ScrollView>

      <Stat

        visible={isStatModalVisible}

        onToggle={() => setIsStatModalVisible(false)}

        statistics={statistics}

      />

      <TaskDescription

        visible={isDescriptionModalVisible}

        onToggle={() => setDescriptionModalVisible(value => !value)}

        language={{ ru: 'русский', en: 'english', fr: 'français', es: 'español', pt: 'português', ar: 'العربية', am: 'አማርኛ' }[language] || 'русский'}

        dontShowAgain5={dontShowAgain5}

        onToggleDontShowAgain={toggleDontShowAgain}

      />

      {exerciseCompleted && (

        <Completion

          correctAnswers={correctAnswers}

          incorrectAnswers={incorrectAnswers}

          handleOK={finishExercise}

          navigateToMenu={goToMenu}

          correctAnswersPercentage={completionPercent}

          grade={grade}

          restartTask={resetExercise}

        />

      )}

      {!exerciseCompleted && (

        <Exit

          visible={exitConfirmationVisible}

          onCancel={() => setExitConfirmationVisible(false)}

          onConfirm={goToMenu}

        />

      )}

    </>

  );

}

const styles = StyleSheet.create({

  scrollViewContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },

  container: {

    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10,

    backgroundColor: '#AFC1D0', minHeight: '100%', width: '100%',

  },

  topBar: {

    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',

    width: '100%', paddingTop: 0, paddingBottom: 0,

  },

  logoImage: { width: 74, height: 74, marginLeft: 8 },

  buttonContainer: { flexDirection: 'row', marginRight: 10 },

  rowReverse: { flexDirection: 'row-reverse' },

  buttonImage: { width: 38, height: 38, marginLeft: 8 },

  title: {

    fontSize: 18, fontWeight: 'bold', marginTop: 5, marginBottom: 10,

    color: '#2F4766', textAlign: 'center',

  },

  nextButton: {

    width: '80%', padding: hp('1.5%'), borderRadius: 10, marginBottom: 15,

    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,

  },

  nextButtonText: { textAlign: 'center', color: 'white', fontWeight: 'bold', fontSize: 16 },

  activeButton: { backgroundColor: '#1C3F60' },

  inactiveButton: { backgroundColor: '#D9D9D9' },

  correctOption: { backgroundColor: '#AFFFCA' },

  incorrectOption: { backgroundColor: '#FFBCBC' },

  progressBarContainer: { width: '100%', marginBottom: 5 },

  progressContainer: {

    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', height: 50,

    backgroundColor: '#6C8EBB', borderRadius: 10, marginTop: 1, marginBottom: 10,

    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25,

    shadowRadius: 3.84, elevation: 5,

  },

  textContainer: { flex: 1, justifyContent: 'center', width: '50%' },

  progressText: { fontSize: 12, color: 'white', textAlign: 'left', marginLeft: 15 },

  percentContainer: { alignItems: 'center', marginRight: 10, borderRadius: 10 },

  percentText: {

    fontSize: 22, color: 'white', fontWeight: 'bold', textAlign: 'center',

    paddingLeft: 10, paddingRight: 10,

  },

  remainingTasksContainer: { alignItems: 'center', marginRight: 10 },

  remainingTasksText: {

    fontSize: 22, color: 'white', fontWeight: 'bold', textAlign: 'center',

    backgroundColor: '#83A3CD', borderRadius: 10, paddingLeft: 10, paddingRight: 10,

  },

  optionsContainer: {

    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', alignItems: 'flex-start',

    width: '100%', marginBottom: 15, marginTop: 1,

  },

  optionButton: {

    width: '47%', height: 70, backgroundColor: '#D1E3F1', margin: 5, borderRadius: 10,

    justifyContent: 'center', alignItems: 'center', padding: 10, position: 'relative',

    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25,

    shadowRadius: 3.84, elevation: 5,

  },

  optionText: { fontSize: 22, color: '#152039', fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },

  mp4Text: {

    position: 'absolute', bottom: 5, width: '100%', textAlign: 'center',

    color: '#CE6857', fontWeight: 'bold', fontSize: 15,

  },

  speakerButton: { position: 'absolute', right: 10, bottom: 10, width: 20, height: 20 },

  speakerIcon: { width: '100%', height: '100%' },

  lottie: { width: 26, height: 26, position: 'absolute', top: 3, left: 3 },

  rtlText: { textAlign: 'right', writingDirection: 'rtl' },

});
