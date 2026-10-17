import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {

  Animated,

  BackHandler,

  Image,

  Platform,

  ScrollView,

  StyleSheet,

  Text,

  TouchableOpacity,

  View,

} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Audio } from 'expo-av';

import { useFocusEffect } from '@react-navigation/native';

import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import ProgressBar from './ProgressBar';

import ExerciseCountStartScreen from './ExerciseCountStartScreen';

import { updateStatistics, getStatistics } from './stat';

import * as FirebaseAnalytics from './src/analytics/FirebaseAnalytics';

const HEBREW_FONT = Platform.OS === 'android' ? 'mt-semibold' : 'mt-bold';

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

  ru: { correct: 'ВЕРНО', wrong: 'НЕВЕРНО', title: 'ВЫБЕРИ БИНЬЯН', next: 'СЛЕДУЮЩИЙ ГЛАГОЛ', menu: 'Menu', stat: 'exercise3', analytics: 'exercise3ru', field: 'russiantext' },

  en: { correct: 'CORRECT', wrong: 'INCORRECT', title: 'SELECT BINYAN', next: 'NEXT VERB', menu: 'MenuEn', stat: 'exercise3En', analytics: 'exercise3en', field: 'entext' },

  fr: { correct: 'CORRECT', wrong: 'INCORRECT', title: 'SÉLECTIONNER BINYAN', next: 'VERBE SUIVANT', menu: 'MenuFr', stat: 'exercise3Fr', analytics: 'exercise3fr', field: 'frtext' },

  es: { correct: 'CORRECTO', wrong: 'INCORRECTO', title: 'SELECCIONA EL BINYAN', next: 'SIGUIENTE VERBO', menu: 'MenuEs', stat: 'exercise3Es', analytics: 'exercise3es', field: 'estext' },

  pt: { correct: 'CORRETO', wrong: 'INCORRETO', title: 'SELECIONE O BINYAN', next: 'PRÓXIMO VERBO', menu: 'MenuPt', stat: 'exercise3Pt', analytics: 'exercise3pt', field: 'pttext' },

  ar: { correct: 'صحيح', wrong: 'غير صحيح', title: 'اختر البنيان', next: 'الفعل التالي', menu: 'MenuAr', stat: 'exercise3Ar', analytics: 'exercise3ar', field: 'artext' },

  am: { correct: 'ትክክል', wrong: 'ትክክል አይደለም', title: 'ቢንያን ይምረጡ', next: 'ቀጣይ ግስ', menu: 'MenuAm', stat: 'exercise3Am', analytics: 'exercise3am', field: 'amtext' },

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

    'ممتاز جدًا! أداء بلا أخطاء!',

    'رائع! قريب جدًا من الكمال، استمر!',

    'ممتاز! أنت تؤدي بشكل رائع!',

    'جيد! لقد أتقنت المادة بشكل جيد!',

    'جيد إلى حد كبير! هناك تقدم ثابت!',

    'ليس سيئًا! لكن ما زال هناك مجال للتحسن.',

    'مُرضٍ! واصل التدريب وستنجح!',

    'بدأت تفهم الفكرة، استمر!',

    'جرّب تغيير أسلوب التعلّم، فقد يساعدك ذلك!',

    'الأمر صعب، لكن لا تستسلم! واصل التدريب.',

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

const shuffleAll = array => {

  const result = (array || []).slice();

  for (let i = result.length - 1; i > 0; i -= 1) {

    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];

  }

  return result;

};

const normalizeBinyan = value =>

  String(value || '').toLowerCase().trim().replace(/[^a-z]/g, '');

const getGrade = (language, percentage) => {

  const thresholds = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];

  const grades = GRADES[language] || GRADES.ru;

  const index = thresholds.findIndex(value => percentage >= value);

  return grades[index < 0 ? grades.length - 1 : index];

};

const moduleDefault = mod => mod?.default || mod;

const getLanguageComponents = language => {

  switch (language) {

    case 'en':

      return {

        VerbCard: moduleDefault(require('./VerbCard3En')),

        Completion: moduleDefault(require('./CompletionMessageEn')),

        Exit: moduleDefault(require('./ExitConfirmationModalEn')),

        Stat: moduleDefault(require('./StatModal3En')),

      };

    case 'fr':

      return {

        VerbCard: moduleDefault(require('./VerbCard3Fr')),

        Completion: moduleDefault(require('./CompletionMessageFr')),

        Exit: moduleDefault(require('./ExitConfirmationModalFr')),

        Stat: moduleDefault(require('./StatModal3Fr')),

      };

    case 'es':

      return {

        VerbCard: moduleDefault(require('./VerbCard3Es')),

        Completion: moduleDefault(require('./CompletionMessageEs')),

        Exit: moduleDefault(require('./ExitConfirmationModalEs')),

        Stat: moduleDefault(require('./StatModal3Es')),

      };

    case 'pt':

      return {

        VerbCard: moduleDefault(require('./VerbCard3Pt')),

        Completion: moduleDefault(require('./CompletionMessagePt')),

        Exit: moduleDefault(require('./ExitConfirmationModalPt')),

        Stat: moduleDefault(require('./StatModal3Pt')),

      };

    case 'ar':

      return {

        VerbCard: moduleDefault(require('./VerbCard3Ar')),

        Completion: moduleDefault(require('./CompletionMessageAr')),

        Exit: moduleDefault(require('./ExitConfirmationModalAr')),

        Stat: moduleDefault(require('./StatModal3Ar')),

      };

    case 'am':

      return {

        VerbCard: moduleDefault(require('./VerbCard3Am')),

        Completion: moduleDefault(require('./CompletionMessageAm')),

        Exit: moduleDefault(require('./ExitConfirmationModalAm')),

        Stat: moduleDefault(require('./StatModal3Am')),

      };

    default:

      return {

        VerbCard: moduleDefault(require('./VerbCard3')),

        Completion: moduleDefault(require('./CompletionMessage')),

        Exit: moduleDefault(require('./ExitConfirmationModal')),

        Stat: moduleDefault(require('./StatModal3')),

      };

  }

};

export default function Exercise3Screen({ navigation, route }) {

  const language = normalizeLanguage(route?.params?.language);

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

  const [shuffledVerbs, setShuffledVerbs] = useState([]);

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

  const [dontShowAgain3, setDontShowAgain3] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);

  const [highlightEnabled, setHighlightEnabled] = useState(true);

  const [isGenderMan, setIsGenderMan] = useState(true);

  const [currentInfinitive, setCurrentInfinitive] = useState(null);

  const [verbInfo, setVerbInfo] = useState(null);

  const exerciseDataRef = useRef(null);

  const conjugationsRef = useRef(null);

  const soundsConjRef = useRef(null);

  const correctSoundRef = useRef(null);

  const incorrectSoundRef = useRef(null);

  const allowLeaveRef = useRef(false);

  const analyticsLoggedRef = useRef(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const backgroundColorAnim = useRef(new Animated.Value(0)).current;

  const optionsContainerAnim = useRef(new Animated.Value(-500)).current;

  const percent = useMemo(() => {

    const total = correctAnswers + incorrectAnswers;

    return total > 0 ? (correctAnswers / total) * 100 : 0;

  }, [correctAnswers, incorrectAnswers]);

  const grade = getGrade(language, percent);

  const ensureExerciseData = useCallback(() => {

    if (!exerciseDataRef.current) {

      exerciseDataRef.current = moduleDefault(require('./verbs3.json')) || [];

    }

    if (!conjugationsRef.current) {

      conjugationsRef.current = moduleDefault(require('./verbs11RU.json')) || [];

    }

    return {

      verbs: exerciseDataRef.current,

      conjugations: conjugationsRef.current,

    };

  }, []);

  const generateOptions = useCallback(verbData => {

    if (!verbData) return [];

    const correctIndex = Number(verbData.correctTranslationIndex) || 0;

    const all = Array.isArray(verbData.binyanOptions) ? verbData.binyanOptions : [];

    const correct = all[correctIndex];

    const incorrect = all

      .filter((_, index) => index !== correctIndex)

      .map(text => ({ text, isCorrect: false, isSelected: false }));

    const options = shuffleAll(incorrect);

    const insertAt = Math.floor(Math.random() * (options.length + 1));

    options.splice(insertAt, 0, { text: correct, isCorrect: true, isSelected: false });

    return options;

  }, []);

  const buildDeck = useCallback(count => {

    const { verbs } = ensureExerciseData();

    const safeCount = COUNTS.includes(Number(count)) ? Number(count) : DEFAULT_COUNT;

    return shuffleAll(verbs).slice(0, Math.min(safeCount, verbs.length));

  }, [ensureExerciseData]);

  const startExercise = useCallback(count => {

    const safeCount = COUNTS.includes(Number(count)) ? Number(count) : DEFAULT_COUNT;

    const deck = buildDeck(safeCount);

    setExerciseCount(safeCount);

    setCurrentIndex(0);

    setCorrectAnswers(0);

    setIncorrectAnswers(0);

    setProgress(0);

    setShowNextButton(false);

    setExerciseCompleted(false);

    setStatisticsUpdated(false);

    setExitConfirmationVisible(false);

    setShuffledVerbs(deck);

    setOptionsOrder(generateOptions(deck[0]));

    fadeAnim.setValue(0);

    optionsContainerAnim.setValue(-500);

    setStartVisible(false);

    requestAnimationFrame(() => {

      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

      Animated.timing(optionsContainerAnim, { toValue: 0, duration: 450, useNativeDriver: true }).start();

    });

  }, [buildDeck, fadeAnim, generateOptions, optionsContainerAnim]);

  const goToMenu = useCallback(() => {

    allowLeaveRef.current = true;

    setExitConfirmationVisible(false);

    navigation.reset({ index: 0, routes: [{ name: copy.menu }] });

  }, [copy.menu, navigation]);

  useFocusEffect(

    useCallback(() => {

      allowLeaveRef.current = false;

      if (!analyticsLoggedRef.current) {

        analyticsLoggedRef.current = true;

        FirebaseAnalytics.logFirebaseEvent(copy.analytics, { screen: copy.analytics });

      }

      return () => {

        analyticsLoggedRef.current = false;

      };

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

    AsyncStorage.getItem('exercise3_description_hidden')

      .then(value => setDontShowAgain3(value === 'true'))

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

        console.log('Exercise3 feedback audio load error:', error);

      }

    };

    loadFeedback();

    return () => {

      active = false;

      correctSoundRef.current?.unloadAsync().catch(() => {});

      incorrectSoundRef.current?.unloadAsync().catch(() => {});

      correctSoundRef.current = null;

      incorrectSoundRef.current = null;

    };

  }, [startVisible]);

  useEffect(() => {

    if (startVisible || !shuffledVerbs.length || currentIndex >= shuffledVerbs.length) return;

    const current = shuffledVerbs[currentIndex];

    setCurrentInfinitive(current.hebrewVerb);

    setOptionsOrder(generateOptions(current));

  }, [currentIndex, generateOptions, shuffledVerbs, startVisible]);

  useEffect(() => {

    if (!currentInfinitive || !conjugationsRef.current) {

      setVerbInfo(null);

      return;

    }

    const wantedGender = isGenderMan ? 'man' : 'woman';

    const rows = conjugationsRef.current.filter(row => row.infinitive === currentInfinitive);

    setVerbInfo(rows.find(row => row.gender === wantedGender) || rows[0] || null);

  }, [currentInfinitive, isGenderMan]);

  useEffect(() => {

    if (startVisible) return;

    optionsContainerAnim.setValue(-500);

    Animated.timing(optionsContainerAnim, {

      toValue: 0,

      duration: 450,

      useNativeDriver: true,

    }).start();

  }, [currentIndex, optionsContainerAnim, startVisible]);

  const toggleDescriptionModal = () => setDescriptionModalVisible(value => !value);

  const toggleDontShowAgain = async () => {

    const next = !dontShowAgain3;

    setDontShowAgain3(next);

    try {

      await AsyncStorage.setItem('exercise3_description_hidden', next ? 'true' : '');

    } catch {}

  };

  const changeBackgroundColor = isCorrect => {

    backgroundColorAnim.setValue(isCorrect ? 1 : 2);

    setTimeout(() => {

      Animated.timing(backgroundColorAnim, {

        toValue: 0,

        duration: 150,

        useNativeDriver: false,

      }).start();

    }, 250);

  };

  const playFeedback = async isCorrect => {

    if (!soundEnabled) return;

    const sound = isCorrect ? correctSoundRef.current : incorrectSoundRef.current;

    try {

      await sound?.replayAsync();

    } catch {}

  };

  const playConjugationSound = async fileName => {

    if (!soundEnabled || !fileName) return;

    try {

      if (!soundsConjRef.current) {

        soundsConjRef.current = moduleDefault(require('./soundconj')) || {};

      }

      const source = soundsConjRef.current[fileName];

      if (!source) return;

      const sound = new Audio.Sound();

      await sound.loadAsync(source);

      sound.setOnPlaybackStatusUpdate(status => {

        if (status?.didJustFinish) sound.unloadAsync().catch(() => {});

      });

      await sound.playAsync();

    } catch (error) {

      console.log('Exercise3 conjugation audio error:', error);

    }

  };

  const handleAnswer = index => {

    if (showNextButton || !optionsOrder[index]) return;

    const isCorrect = !!optionsOrder[index].isCorrect;

    setOptionsOrder(optionsOrder.map((option, optionIndex) => ({

      ...option,

      isSelected: optionIndex === index,

    })));

    if (isCorrect) setCorrectAnswers(value => value + 1);

    else setIncorrectAnswers(value => value + 1);

    setProgress(value => value + 1);

    setShowNextButton(true);

    changeBackgroundColor(isCorrect);

    playFeedback(isCorrect);

  };

  const finishExercise = useCallback(async () => {

    if (statisticsUpdated) {

      setExerciseCompleted(true);

      return;

    }

    setStatisticsUpdated(true);

    const total = correctAnswers + incorrectAnswers;

    const score = total ? ((correctAnswers / total) * 100).toFixed(2) : 0;

    try {

      await updateStatistics(copy.stat, score);

    } catch (error) {

      console.error('Exercise3 statistics update error:', error);

    }

    setExerciseCompleted(true);

  }, [copy.stat, correctAnswers, incorrectAnswers, statisticsUpdated]);

  const handleNextCard = () => {

    if (!showNextButton) return;

    const next = currentIndex + 1;

    setShowNextButton(false);

    if (next >= shuffledVerbs.length) {

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

      console.error('Exercise3 statistics read error:', error);

      setStatistics(null);

      setIsStatModalVisible(false);

    }

  };

  const currentBinyan = normalizeBinyan(shuffledVerbs[currentIndex]?.binyan);

  const renderHebrewDetails = hebrewText => {

    const raw = String(hebrewText || '').trim();

    if (!raw) return '';

    const words = raw.split(/\s+/).filter(Boolean);

    if (words.length < 2 || !highlightEnabled || currentBinyan === 'paal') {

      return <Text>{raw}</Text>;

    }

    const [first, second, ...rest] = words;

    const index = second.search(/[א-ת]/);

    if (index < 0) return <Text>{raw}</Text>;

    return (

      <Text>

        {first}{' '}{second.slice(0, index)}

        <Text style={styles.detailsHighlight}>{second[index]}</Text>

        {second.slice(index + 1)}{rest.length ? ` ${rest.join(' ')}` : ''}

      </Text>

    );

  };

  if (startVisible) {

    return (

      <ExerciseCountStartScreen

        visible

        exerciseNumber={3}

        language={language}

        defaultCount={DEFAULT_COUNT}

        allowedCounts={COUNTS}

        storageKey="exercise3_selected_count"

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

  const TaskDescription = moduleDefault(require('./TaskDescriptionModal3'));

  const backgroundColor = backgroundColorAnim.interpolate({

    inputRange: [0, 1, 2],

    outputRange: ['#83A3CD', '#AFFFCA', '#FFBCBC'],

  });

  const detailText = verbInfo?.[copy.field] || '';

  const completionPercent = Number(percent.toFixed(2));

  return (

    <>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>

        <View style={styles.container}>

          <View style={styles.topBar}>

            <Animated.Image source={require('./VERBIFY.png')} style={[styles.logoImage, { opacity: fadeAnim }]} />

            <View style={[styles.buttonContainer, rtl && styles.rowReverse]}>

              <TouchableOpacity onPress={() => setSoundEnabled(value => !value)}>

                <Animated.Image

                  source={soundEnabled ? require('./SoundOn.png') : require('./SoundOff.png')}

                  style={[styles.buttonImage, { opacity: fadeAnim }]}

                />

              </TouchableOpacity>

              <TouchableOpacity onPress={() => setHighlightEnabled(value => !value)}>

                <Animated.Image

                  source={highlightEnabled ? require('./translit1.png') : require('./translit2.png')}

                  style={[styles.buttonImage, { opacity: fadeAnim }]}

                />

              </TouchableOpacity>

              <TouchableOpacity onPress={openStatistics}>

                <Animated.Image source={require('./stat.png')} style={[styles.buttonImage, { opacity: fadeAnim }]} />

              </TouchableOpacity>

              <TouchableOpacity onPress={toggleDescriptionModal}>

                <Animated.Image source={require('./question.png')} style={[styles.buttonImage, { opacity: fadeAnim }]} />

              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsGenderMan(value => !value)}>

                <Animated.Image

                  source={isGenderMan ? require('./GenderMan.png') : require('./GenderWoman.png')}

                  style={[styles.buttonImage, { opacity: fadeAnim }]}

                />

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

              <Text style={styles.remainingTasksText} maxFontSizeMultiplier={1.2}>

                {Math.max(shuffledVerbs.length - currentIndex, 0)}

              </Text>

            </View>

            <Animated.View style={[styles.percentContainer, { backgroundColor }]}>

              <Text style={styles.percentText} maxFontSizeMultiplier={1.2}>

                {percent.toFixed(2)}%

              </Text>

            </Animated.View>

          </Animated.View>

          <Animated.View style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}>

            <ProgressBar progress={progress} totalExercises={Math.max(shuffledVerbs.length, 1)} />

          </Animated.View>

          <Animated.Text style={[styles.title, rtl && styles.rtlText, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>

            {copy.title}

          </Animated.Text>

          {currentIndex < shuffledVerbs.length ? (

            <VerbCard

              verbData={shuffledVerbs[currentIndex]}

              options={optionsOrder}

              onAnswer={handleAnswer}

              soundEnabled={soundEnabled}

              highlightEnabled={highlightEnabled}

            />

          ) : null}

          {verbInfo ? (

            <View style={styles.infoContainer}>

              <View style={styles.verbDetailsLeftContent}>

                <Text style={styles.verbDetailsHebrew} maxFontSizeMultiplier={1.2}>

                  {renderHebrewDetails(verbInfo.hebrewtext)}

                </Text>

                <Text style={styles.verbDetailsTranslit} maxFontSizeMultiplier={1.2}>

                  {verbInfo.translit}

                </Text>

              </View>

              <View style={styles.verbDetailsRightContent}>

                <Text

                  style={[styles.verbDetailsTranslation, rtl && styles.arabicText]}

                  maxFontSizeMultiplier={1.2}

                >

                  {detailText}

                </Text>

              </View>

              <TouchableOpacity style={styles.speakerButton} onPress={() => playConjugationSound(verbInfo.mp3)}>

                <Image source={require('./speaker1.png')} style={styles.speakerIcon} />

              </TouchableOpacity>

            </View>

          ) : null}

          <Animated.View style={[styles.optionsContainer, { transform: [{ translateX: optionsContainerAnim }] }]}>

            {optionsOrder.map((option, index) => (

              <TouchableOpacity

                key={`${option.text}-${index}`}

                style={[

                  styles.optionButton,

                  showNextButton && option.isCorrect && styles.correctOption,

                  showNextButton && option.isSelected && !option.isCorrect && styles.incorrectOption,

                ]}

                onPress={() => handleAnswer(index)}

                disabled={showNextButton}

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

            <Text style={[styles.nextButtonText, rtl && styles.rtlText]} maxFontSizeMultiplier={1.2}>{copy.next}</Text>

          </TouchableOpacity>

          {exerciseCompleted ? (

            <Completion

              correctAnswers={correctAnswers}

              incorrectAnswers={incorrectAnswers}

              handleOK={finishExercise}

              navigateToMenu={goToMenu}

              correctAnswersPercentage={completionPercent}

              grade={grade}

              restartTask={resetExercise}

            />

          ) : null}

        </View>

      </ScrollView>

      <Stat visible={isStatModalVisible} onToggle={() => setIsStatModalVisible(false)} statistics={statistics} />

      {isDescriptionModalVisible ? (

        <TaskDescription

          visible

          onToggle={toggleDescriptionModal}

          language={language}

          dontShowAgain3={dontShowAgain3}

          onToggleDontShowAgain={toggleDontShowAgain}

        />

      ) : null}

      {!exerciseCompleted ? (

        <Exit

          visible={exitConfirmationVisible}

          onCancel={() => setExitConfirmationVisible(false)}

          onConfirm={goToMenu}

        />

      ) : null}

    </>

  );

}

const styles = StyleSheet.create({

  scrollViewContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },

  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10, backgroundColor: '#AFC1D0', minHeight: '100%', width: '100%' },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },

  logoImage: { width: 74, height: 74, marginLeft: 8 },

  buttonContainer: { flexDirection: 'row', marginRight: 10 },

  rowReverse: { flexDirection: 'row-reverse' },

  buttonImage: { width: 38, height: 38, marginLeft: 8 },

  title: { fontSize: 18, fontWeight: 'bold', marginTop: 5, marginBottom: 10, color: '#2F4766', textAlign: 'center' },

  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10, width: '100%' },

  optionButton: { width: '49%', height: 60, padding: 15, backgroundColor: '#D1E3F1', marginBottom: 10, borderRadius: 10, justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },

  optionText: { fontSize: 17, textAlign: 'center', color: '#152039', fontWeight: 'bold' },

  nextButton: { width: '80%', padding: hp('1.5%'), borderRadius: 10, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },

  nextButtonText: { textAlign: 'center', color: 'white', fontWeight: 'bold', fontSize: 16 },

  activeButton: { backgroundColor: '#1C3F60' },

  inactiveButton: { backgroundColor: '#D9D9D9' },

  correctOption: { backgroundColor: '#AFFFCA' },

  incorrectOption: { backgroundColor: '#FFBCBC' },

  ProgressBarcontainer: { width: '100%', marginBottom: 5 },

  progressContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', height: 50, backgroundColor: '#6C8EBB', borderRadius: 10, marginTop: 1, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },

  textContainer: { flex: 1, justifyContent: 'center', width: '50%' },

  progressText: { fontSize: 12, color: 'white', textAlign: 'left', marginLeft: 15 },

  remainingTasksContainer: { alignItems: 'center', marginRight: 10 },

  remainingTasksText: { fontSize: 22, color: 'white', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#83A3CD', borderRadius: 10, paddingHorizontal: 10 },

  percentContainer: { alignItems: 'center', marginRight: 10, borderRadius: 10 },

  percentText: { fontSize: 22, color: 'white', fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 10 },

  infoContainer: { height: hp('8%'), backgroundColor: '#83A3CD', marginBottom: hp('2%'), width: '100%', position: 'relative', borderRadius: wp('2.5%'), overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: hp('0.25%') }, shadowOpacity: 0.25, shadowRadius: hp('0.5%'), elevation: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: wp('2.5%') },

  verbDetailsLeftContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  verbDetailsRightContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  verbDetailsHebrew: { fontSize: Platform.OS === 'ios' ? 22 : 17, color: '#FFFDEF', fontFamily: HEBREW_FONT, marginTop: hp('1%'), marginBottom: hp('0.1%') },

  verbDetailsTranslit: { fontSize: 14, fontWeight: 'bold', color: '#CE6857', backgroundColor: '#FFFDEF', borderRadius: wp('2.5%'), padding: 1, paddingHorizontal: 5, marginTop: hp('0.25%'), marginBottom: hp('1%') },

  verbDetailsTranslation: { fontSize: 14, color: '#333652', fontWeight: 'bold', backgroundColor: '#FFFDEF', borderRadius: wp('2.5%'), padding: wp('0.5%'), paddingHorizontal: wp('2.5%'), textAlign: 'center' },

  speakerButton: { position: 'absolute', bottom: hp('-0.25%'), right: wp('-0.75%'), width: wp('7.5%'), height: hp('3.5%'), justifyContent: 'center', alignItems: 'center' },

  speakerIcon: { width: '250%', height: '250%', resizeMode: 'contain' },

  detailsHighlight: { color: 'rgba(255, 251, 0, 1)' },

  rtlText: { writingDirection: 'rtl', textAlign: 'center' },

  arabicText: { writingDirection: 'rtl', textAlign: 'center', fontFamily: 'ar-bold' },

});
