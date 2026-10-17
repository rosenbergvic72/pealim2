// Exercise5Screen.js — visible Exercise 5, legacy route Exercise6

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';

import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, BackHandler, Platform } from 'react-native';

import verbsData from './verbs6RU.json';

import ProgressBar from './ProgressBar';

import { Animated } from 'react-native';

import { Audio } from 'expo-av';

import soundsconj from './soundconj';

import sounds from './Soundss';

import CompletionMessage from './CompletionMessage';

import CompletionMessageEn from './CompletionMessageEn';

import CompletionMessageFr from './CompletionMessageFr';

import CompletionMessageEs from './CompletionMessageEs';

import CompletionMessagePt from './CompletionMessagePt';

import CompletionMessageAr from './CompletionMessageAr';

import CompletionMessageAm from './CompletionMessageAm';

import ExitConfirmationModal from './ExitConfirmationModal';

import ExitConfirmationModalEn from './ExitConfirmationModalEn';

import ExitConfirmationModalFr from './ExitConfirmationModalFr';

import ExitConfirmationModalEs from './ExitConfirmationModalEs';

import ExitConfirmationModalPt from './ExitConfirmationModalPt';

import ExitConfirmationModalAr from './ExitConfirmationModalAr';

import ExitConfirmationModalAm from './ExitConfirmationModalAm';

import { useNavigation, useFocusEffect } from '@react-navigation/native';

import TaskDescriptionModal6 from './TaskDescriptionModal6';

import StatModal6 from './StatModal6';

import StatModal6En from './StatModal6En';

import StatModal6Fr from './StatModal6Fr';

import StatModal6Es from './StatModal6Es';

import StatModal6Pt from './StatModal6Pt';

import StatModal6Ar from './StatModal6Ar';

import StatModal6Am from './StatModal6Am';

import { updateStatistics, getStatistics } from './stat';

import SearchModal from './SearchModal';

import SearchModalEn from './SearchModalEn';

import SearchModalFr from './SearchModalFr';

import SearchModalEs from './SearchModalEs';

import SearchModalPt from './SearchModalPt';

import SearchModalAr from './SearchModalAr';

import SearchModalAm from './SearchModalAm';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import { Dimensions } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import VerbFormsStartScreen from './VerbFormsStartScreen';

import shuffleArray from './utils/shuffleArray';

import verbs1Data from './verbs1.json';

import * as FirebaseAnalytics from './src/analytics/FirebaseAnalytics';

const FONT_REG = 'mt-regular';

const FONT_MED = 'mt-medium';

const FONT_BOLD = 'mt-bold';

const FONT_SEMIBOLD = 'mt-semibold';

const HEBREW_FONT = Platform.OS === 'android' ? 'mt-semibold' : 'mt-bold';

const HEBREW_FS = Platform.OS === 'android' ? 18 : 22;

const LANGUAGE_ALIASES = {

  ru:'ru', russian:'ru', русский:'ru', rus:'ru', 'ru-ru':'ru',

  en:'en', english:'en', eng:'en', 'en-us':'en', 'en-gb':'en',

  fr:'fr', french:'fr', français:'fr', francais:'fr', fra:'fr', 'fr-fr':'fr',

  es:'es', spanish:'es', español:'es', espanol:'es', spa:'es', 'es-es':'es',

  pt:'pt', portuguese:'pt', português:'pt', portugues:'pt', por:'pt', 'pt-pt':'pt',

  ar:'ar', arabic:'ar', العربية:'ar', ara:'ar', 'ar-il':'ar',

  am:'am', amharic:'am', አማርኛ:'am', amh:'am', 'am-et':'am',

};

const normalizeLanguage = value => LANGUAGE_ALIASES[String(value || 'ru').trim().toLowerCase()] || 'ru';

const LANG_CONFIG = {

  ru:{menu:'Menu',statId:'exercise6',event:'exercise5ru',translation:'russiantext',dictionary:'russian',correct:'ВЕРНО',wrong:'НЕВЕРНО',title:'СПРЯГАЕМ ГЛАГОЛ'},

  en:{menu:'MenuEn',statId:'exercise6En',event:'exercise5en',translation:'entext',dictionary:'english',correct:'CORRECT',wrong:'INCORRECT',title:'CONJUGATE THE VERB'},

  fr:{menu:'MenuFr',statId:'exercise6Fr',event:'exercise5fr',translation:'frtext',dictionary:'french',correct:'CORRECT',wrong:'INCORRECT',title:'CONJUGUEZ LE VERBE'},

  es:{menu:'MenuEs',statId:'exercise6Es',event:'exercise5es',translation:'estext',dictionary:'spanish',correct:'CORRECTO',wrong:'INCORRECTO',title:'CONJUGA EL VERBO'},

  pt:{menu:'MenuPt',statId:'exercise6Pt',event:'exercise5pt',translation:'pttext',dictionary:'portu',correct:'CORRETO',wrong:'INCORRETO',title:'CONJUGUE O VERBO'},

  ar:{menu:'MenuAr',statId:'exercise6Ar',event:'exercise5ar',translation:'artext',dictionary:'arabic',correct:'صحيح',wrong:'غير صحيح',title:'تصريف الفعل'},

  am:{menu:'MenuAm',statId:'exercise6Am',event:'exercise5am',translation:'amtext',dictionary:'amharic',correct:'ትክክል',wrong:'ትክክል አይደለም',title:'ግሱን ያዛምዱ'},

};

const COMPLETION_COMPONENTS={ru:CompletionMessage,en:CompletionMessageEn,fr:CompletionMessageFr,es:CompletionMessageEs,pt:CompletionMessagePt,ar:CompletionMessageAr,am:CompletionMessageAm};

const EXIT_COMPONENTS={ru:ExitConfirmationModal,en:ExitConfirmationModalEn,fr:ExitConfirmationModalFr,es:ExitConfirmationModalEs,pt:ExitConfirmationModalPt,ar:ExitConfirmationModalAr,am:ExitConfirmationModalAm};

const STAT_COMPONENTS={ru:StatModal6,en:StatModal6En,fr:StatModal6Fr,es:StatModal6Es,pt:StatModal6Pt,ar:StatModal6Ar,am:StatModal6Am};

const SEARCH_COMPONENTS={ru:SearchModal,en:SearchModalEn,fr:SearchModalFr,es:SearchModalEs,pt:SearchModalPt,ar:SearchModalAr,am:SearchModalAm};

const GRADE_TEXT = {

  ru:['Исключительно! Безупречно! Ты не сделал ни единой ошибки!','Великолепно! Почти идеально, продолжай в том же духе!','Отлично! Ты очень хорошо справляешься!','Хорошо! Ты неплохо усвоил материал!','Достаточно хорошо! Есть стабильный прогресс!','Неплохо! Но есть куда стремиться.','Удовлетворительно! Старайся и всё получится!','Ты начинаешь улавливать главное, продолжай в том же духе!','Попробуй изменить стратегию обучения, это может помочь!','Тяжело, но не сдавайся! Продолжай практиковаться.','Требуется серьезная работа! Важно не унывать и продолжать учиться.'],

  en:['Exceptional! Flawless — not a single mistake!','Excellent! Almost perfect — keep it up!','Great! You are doing very well!','Good! You have learned the material well!','Pretty good! You are making steady progress!','Not bad! There is still room to improve.','Satisfactory! Keep practicing and you will get there!','You are starting to grasp the essentials — keep going!','Try changing your learning strategy; it may help!','It is difficult, but do not give up. Keep practicing!','More practice is needed. Keep learning and improving.'],

  fr:['Exceptionnel ! Parfait, aucune erreur !','Magnifique ! Presque parfait, continuez ainsi !','Excellent ! Vous vous débrouillez très bien !','Bien ! Le contenu est bien assimilé !','Assez bien ! Les progrès sont réguliers !','Pas mal ! Il reste encore une marge de progression.','Satisfaisant ! Continuez et vous y arriverez !','Vous commencez à saisir l’essentiel, continuez !','Essayez de changer de stratégie d’apprentissage, cela peut aider !','C’est difficile, mais n’abandonnez pas. Continuez à pratiquer !','Il faut encore travailler. Continuez à apprendre !'],

  es:['¡Excepcional! ¡Perfecto, sin ningún error!','¡Magnífico! Casi perfecto, sigue así.','¡Excelente! Lo estás haciendo muy bien.','¡Bien! Has asimilado bien el material.','¡Bastante bien! Hay un progreso estable.','¡No está mal! Aún se puede mejorar.','¡Satisfactorio! Sigue practicando y lo conseguirás.','Empiezas a captar lo esencial, sigue así.','Prueba otra estrategia de aprendizaje; puede ayudar.','Es difícil, pero no te rindas. Sigue practicando.','Hace falta más práctica. Sigue aprendiendo.'],

  pt:['Excecional! Perfeito, sem nenhum erro!','Excelente! Quase perfeito, continue assim!','Ótimo! Você está indo muito bem!','Bom! Você assimilou bem o conteúdo!','Muito bom! Há progresso constante!','Nada mal! Ainda há espaço para melhorar.','Satisfatório! Continue praticando e você conseguirá!','Você está começando a captar o essencial. Continue!','Tente mudar a estratégia de aprendizagem; pode ajudar!','Está difícil, mas não desista. Continue praticando!','É preciso praticar mais. Continue aprendendo!'],

  ar:['استثنائي! أداء مثالي بلا أي خطأ!','رائع! قريب من الكمال، استمر!','ممتاز! أداؤك جيد جدًا!','جيد! لقد استوعبت المادة بشكل جيد!','جيد جدًا! هناك تقدم ثابت!','ليس سيئًا! ما زال هناك مجال للتحسن.','مقبول! واصل التدريب وستنجح!','بدأت تفهم الفكرة الأساسية، استمر!','جرّب تغيير طريقة التعلّم، فقد يساعدك ذلك!','الأمر صعب، لكن لا تستسلم. واصل التدريب!','تحتاج إلى مزيد من التدريب. واصل التعلّم!'],

  am:['እጅግ በጣም ጥሩ! ምንም ስህተት የለም!','በጣም ጥሩ! ፍጹም ለመሆን ቀርበዋል።','ጥሩ! በጣም ጥሩ እየሰሩ ነው።','ጥሩ! ትምህርቱን በደንብ ተረድተዋል።','በቂ ጥሩ! ቋሚ እድገት አለ።','መጥፎ አይደለም! አሁንም ማሻሻል ይቻላል።','አጥጋቢ! ልምምድዎን ይቀጥሉ።','ዋናውን ሀሳብ መረዳት ጀምረዋል። ይቀጥሉ!','የመማር ዘዴዎን ለመቀየር ይሞክሩ።','ከባድ ነው፣ ግን አትተዉ። ልምምድዎን ይቀጥሉ።','ተጨማሪ ልምምድ ያስፈልጋል። መማርዎን ይቀጥሉ።'],

};

const getLocalizedGrade=(lang,p)=>{const g=GRADE_TEXT[lang]||GRADE_TEXT.ru; if(p===100)return g[0]; if(p>=90)return g[1]; if(p>=80)return g[2]; if(p>=70)return g[3]; if(p>=60)return g[4]; if(p>=50)return g[5]; if(p>=40)return g[6]; if(p>=30)return g[7]; if(p>=20)return g[8]; if(p>=10)return g[9]; return g[10];};

const Exercise5Screen = ({ route, forcedLanguage }) => {

  const language = normalizeLanguage(forcedLanguage || route?.params?.language || 'ru');

  const cfg = LANG_CONFIG[language] || LANG_CONFIG.ru;

  const menuRoute = cfg.menu;

  const statisticsExerciseId = cfg.statId;

  const translationField = cfg.translation;

  const dictionaryField = cfg.dictionary;

  const ui = cfg;

  const CompletionComponent = COMPLETION_COMPONENTS[language] || CompletionMessage;

  const ExitComponent = EXIT_COMPONENTS[language] || ExitConfirmationModal;

  const StatComponent = STAT_COMPONENTS[language] || StatModal6;

  const SearchComponent = SEARCH_COMPONENTS[language] || SearchModal;

  const exercise6LoggedRef=useRef(false);

useFocusEffect(

useCallback(()=>{

if(exercise6LoggedRef.current)return;

exercise6LoggedRef.current=true;

FirebaseAnalytics.logFirebaseEvent('exercise5ru',{

screen:'exercise5ru'

});

return()=>{

exercise6LoggedRef.current=false;

};

},[cfg.event])

);

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

  const statisticsSavedRef = useRef(false);

  const [exitConfirmationVisible, setExitConfirmationVisible] = useState(false);

  const toggleDescriptionModal = () => {

    setDescriptionModalVisible(prev => !prev);

  };

  const [soundEnabled, setSoundEnabled] = useState(true);

  // 0 — translit1: подсветка ВКЛ + транслит ВКЛ

  // 1 — translit2: подсветка ВКЛ + транслит ВЫКЛ

  // 2 — translit3: подсветка ВЫКЛ + транслит ВЫКЛ

  const [translitMode, setTranslitMode] = useState(0);

  const handleTranslitToggle = () => {

    setTranslitMode(prev => {

      if (prev === 0) return 1;

      if (prev === 1) return 2;

      return 0;

    });

  };

  const showTranslit = translitMode === 0;

  const totalAnswers = correctCount + incorrectCount;

  const progressPercent = totalAnswers > 0 ? (correctCount / totalAnswers) * 100 : 0;

  const [currentVerb, setCurrentVerb] = useState({

    infinitive: '',

    russian: '',

    transliteration: ''

  });

  const [mainVerb, setMainVerb] = useState(null);

  const [verbListForModal, setVerbListForModal] = useState([]);

  const [isVerbListVisible, setIsVerbListVisible] = useState(true);
 useLayoutEffect(() => {
   navigation.setOptions({ headerHideAI: isVerbListVisible });
 }, [navigation, isVerbListVisible]);
  // Согласуем цвет нижней Safe Area с экраном настроек/задания.
  useEffect(() => {
    navigation.setParams({ bottomSafeAreaStage: isVerbListVisible ? 'settings' : 'task' });
  }, [navigation, isVerbListVisible]);



  const [selectedTenses, setSelectedTenses] = useState({

    present: true,

    past: true,

    future: true,

  });

  useEffect(() => {

    (async () => {

      const hidden = await AsyncStorage.getItem('exercise6_description_hidden');

      setDontShowAgain6(hidden === 'true');

      setLanguageLoaded(true);

    })();

  }, []);

  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);

  const [dontShowAgain6, setDontShowAgain6] = useState(false);

  const [languageLoaded, setLanguageLoaded] = useState(false);

  const handleToggleDontShowAgain6 = async () => {

    const newValue = !dontShowAgain6;

    setDontShowAgain6(newValue);

    await AsyncStorage.setItem('exercise6_description_hidden', newValue ? 'true' : '');

  };

  const getGrade = (percentage) => getLocalizedGrade(language, percentage);

  const grade = getGrade(progressPercent);

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

    if (!statisticsSavedRef.current) { statisticsSavedRef.current = true; await updateStatistics(statisticsExerciseId, Number(finalScore)); }

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

      setCurrentVerb(allForms[0] || {

        infinitive: '',

        russian: '',

        transliteration: ''

      });

      setVerbListForModal(allForms);

      setRemainingPairs(allForms.length);

      setTotalExercises(allForms.length);

      setIsVerbListVisible(true);

      setPendingVerb(null);

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

      russiantext: pair.russiantext,

      hebrewtext: hebrewItems[index]?.text,

      translit: hebrewItems[index]?.translit,

      hebrewFormIndex: hebrewItems[index]?.formIndex,

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

    if (correctAnswers.has(index) && type === 'russian') style.push(styles.deactivatedButton);

    if (type === 'russian' && index === selectedRussian) style.push(styles.selectedButton);

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

      if (!audioFile) return;

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

      if (!audioFile) return;

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

    const exerciseId = statisticsExerciseId;

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

        else navigation.navigate(menuRoute);

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

  const handleExerciseCompletion = async () => {

    const exerciseId = statisticsExerciseId;

    const currentScore = parseFloat(progressPercent.toFixed(2));

    if (!statisticsSavedRef.current) { statisticsSavedRef.current = true; await updateStatistics(exerciseId, currentScore); }

  };

  const resetExercise = () => {

    completionTriggeredRef.current = false;

    statisticsSavedRef.current = false;

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

    setCurrentVerb(verbConjugations[0] || {

      infinitive: '',

      russian: '',

      transliteration: ''

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

    setMainVerb(allForms[0] || null);

    setCurrentVerb(allForms[0] || {

      infinitive: '',

      russian: '',

      transliteration: ''

    });

    setIsVerbListVisible(true);

    setSearchModalVisible(false);

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

      statisticsSavedRef.current = false;

      setSelectedTenses(nextSelectedTenses || { present: true, past: true, future: true });

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

    if (!found && tr) {

      found = verbs1Data.find(v => normalize(v?.transliteration) === tr);

    }

    if (!found && af) {

      found = verbs1Data.find(v => normalize(v?.audioFile) === af);

    }

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

    const renderPastWithHitpaelPrefixAndSuffix = (word, suffix) => {

      const w = String(word || '');

      const prefix = w.startsWith('ה') ? 'ה' : '';

      return renderWithColorRules(w, { prefix, suffix: suffix || '' });

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

  if (isVerbListVisible) {

    return (

      <VerbFormsStartScreen

        exerciseNumber={5}

        language={language}

        verbs={verbListForModal.map(v => ({ ...v }))}

        onStartExercise={handleStartExercise}

        onClose={() => {

          allowExitRef.current = true;

          if (navigation.canGoBack()) navigation.goBack();

          else navigation.navigate(menuRoute);

        }}

      />

    );

  }

  return (

    <>

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

                  <SearchComponent

                    visible={isSearchModalVisible}

                    onToggle={() => setSearchModalVisible(false)}

                    onSelectVerb={handleSelectVerb}

                  />

                </TouchableOpacity>

              </View>

            </View>

            <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>

              <View style={styles.textContainer}>

                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>{ui.correct}: {correctCount}</Text>

                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>{ui.wrong}: {incorrectCount}</Text>

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

              <ProgressBar progress={progress} totalExercises={totalExercises} />

            </Animated.View>

            <Animated.Text style={[styles.title, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>

              {ui.title}

            </Animated.Text>

            {currentVerb && (

              <Animated.View style={[styles.verbContainer, { opacity: fadeAnim }]}>

                <Text style={styles.verbText} maxFontSizeMultiplier={1.2}> {currentVerb.infinitive}</Text>

                <Text style={styles.verbTextTr} maxFontSizeMultiplier={1.2}> {currentVerb.transliteration}</Text>

                <Text style={styles.verbTextRu} maxFontSizeMultiplier={1.2}> {currentVerb?.[dictionaryField]}</Text>

                <TouchableOpacity onPress={() => playAudio(currentVerb.audioFile)} style={styles.audioButton}>

                  <Image source={require('./speaker3.png')} style={styles.audioIcon} />

                </TouchableOpacity>

              </Animated.View>

            )}

            <Animated.View style={{ transform: [{ translateY: blockAnimation }] }}>

              {displayPairs.map((pair, index) => (

                <View key={index} style={styles.row}>

                  <TouchableOpacity

                    style={getButtonStyle(index, 'russian')}

                    onPress={() => handleSelectRussian(index)}

                    disabled={correctAnswers.has(index)}

                  >

                    <Text style={[

                      styles.text,

                      styles.russianText,

                      language === 'ar' && styles.rtlText,

                      correctAnswers.has(index) ? styles.deactivatedButtonText : {}

                    ]} maxFontSizeMultiplier={1.2}>

                      {pair?.[translationField]}

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

              <CompletionComponent

                handleOK={handleExerciseCompletion}

                navigateToMenu={() => navigation.navigate(menuRoute)}

                correctAnswers={correctCount}

                incorrectAnswers={incorrectCount}

                correctAnswersPercentage={progressPercent.toFixed(2)}

                grade={grade}

                restartTask={resetExercise}

              />

            )}

            <ExitComponent

              visible={exitConfirmationVisible}

              onCancel={() => setExitConfirmationVisible(false)}

              onConfirm={() => {

                navigation.reset({

                  index: 0,

                  routes: [{ name: menuRoute }],

                });

              }}

            />

          </View>

        </ScrollView>

      <StatComponent

        visible={isStatModalVisible}

        onToggle={() => setIsStatModalVisible(false)}

        statistics={statistics}

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

  logoImage:{

  width:74,

  height:74,

  marginLeft:8

},

  buttonContainer: { flexDirection: 'row', marginRight: 10, justifyContent: 'center' },

  buttonImage:{

  width:38,

  height:38,

  marginLeft:8

},

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

    padding: 5, marginBottom: 5, backgroundColor: '#FFFDEF', borderRadius: 10,

    marginLeft: 5, marginRight: 5,

    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,

    height: 40, width: '100%',

  },

  verbText: { fontSize: 15, color: '#FF5757', fontWeight: 'bold', marginLeft: 5 },

  verbTextTr: { fontSize: 15, color: '#333', fontWeight: 'bold' },

  verbTextRu: { fontSize: 15, color: '#003882', fontWeight: 'bold' },

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

  rtlText: { textAlign: 'right', writingDirection: 'rtl' },

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

export default Exercise5Screen;
