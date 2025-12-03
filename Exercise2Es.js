import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Image, BackHandler } from 'react-native';
import VerbCard2 from './VerbCard2Es';
import verbsData from './verbs2.json';
import verbs1RU from './verbs11RU.json';
import ProgressBar from './ProgressBar';
import CompletionMessageEs from './CompletionMessageEs';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ExitConfirmationModal from './ExitConfirmationModalEs';
import { Audio } from 'expo-av';
import sounds from './Soundss';
import soundsConj from './soundconj';
import { Animated } from 'react-native';
import TaskDescriptionModal6 from './TaskDescriptionModal2';
import StatModal2Es from './StatModal2Es';
import { updateStatistics, getStatistics } from './stat';
import LottieView from 'lottie-react-native';
import animation from './assets/Animation - 1723020554284.json';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VerbListModal from './VerbListModal';

/* helpers */
const shuffleArray = (array) => {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, 18);
};

const getGrade = (p) => {
  if (p === 100) return '¡Excepcional! ¡Impecable! ¡No cometiste ni un solo error!';
  if (p >= 90)   return '¡Excelente! Casi perfecto, sigue así.';
  if (p >= 80)   return '¡Genial! ¡Lo estás haciendo muy bien!';
  if (p >= 70)   return '¡Bien! Has aprendido el material bastante bien.';
  if (p >= 60)   return '¡Bastante bien! Hay un progreso constante.';
  if (p >= 50)   return 'No está mal, pero hay margen de mejora.';
  if (p >= 40)   return '¡Satisfactorio! Sigue trabajando y tendrás éxito.';
  if (p >= 30)   return '¡Estás empezando a entenderlo, sigue así!';
  if (p >= 20)   return 'Intenta cambiar tu estrategia de aprendizaje, ¡podría ayudar!';
  if (p >= 10)   return 'Es difícil, pero no te rindas. ¡Sigue practicando!';
  return '¡Se necesita trabajo serio! Es importante no rendirse y seguir aprendiendo.';
};

/* VerbDetails (плашка снизу) */
const VerbDetailsContainer2 = ({
  verbDetails,
  handleSpeakerPress,
  currentIndex,
  animateRight,
  isAnswered,
  canShowSpeaker,
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
    }).start(() => {
      setIsTextVisible(true);
    });

    if (animationRef.current) {
      animationRef.current.reset();
      animationRef.current.play();
    }
  }, [currentIndex]);

  useEffect(() => {
    rightFillAnim.setValue(0);
  }, [currentIndex]);

  useEffect(() => {
    if (isAnswered && animationRef.current) animationRef.current.reset();
    return () => {
      if (animationRef.current) animationRef.current.reset();
    };
  }, [isAnswered]);

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
  }, [animateRight]);

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
      <Animated.View
        style={[styles.verbDetailsHalf, styles.verbDetailsLeft, { width: leftWidth }]}
      />
      <Animated.View
        style={[styles.verbDetailsHalf, styles.verbDetailsRight, { width: rightWidth }]}
      />
      <View style={styles.verbDetailsContent}>
        <View style={styles.verbDetailsLeftContent}>
          <Text style={styles.verbDetailsSpanish} maxFontSizeMultiplier={1.2}>
            {verbDetails.estext}
          </Text>
        </View>
        <View style={styles.verbDetailsRightContent}>
          {isAnswered ? (
            <>
              <Text style={styles.verbDetailsHebrew} maxFontSizeMultiplier={1.2}>
                {verbDetails.hebrewtext}
              </Text>
              {!!verbDetails.translit && (
                <Text style={styles.verbDetailsTranslit} maxFontSizeMultiplier={1.2}>
                  {verbDetails.translit}
                </Text>
              )}
              {isTextVisible && canShowSpeaker && !!verbDetails.mp3 && (
                <TouchableOpacity
                  style={styles.speakerButton}
                  onPress={() => handleSpeakerPress(verbDetails.mp3)}
                >
                  <Image source={require('./speaker1.png')} style={styles.speakerIcon1} />
                </TouchableOpacity>
              )}
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

/* ---- основной компонент ---- */
const Exercise2Es = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [optionsOrder, setOptionsOrder] = useState([]);
  const [exitConfirmationVisible, setExitConfirmationVisible] = useState(false);
  const [shuffledVerbs, setShuffledVerbs] = useState([]);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showNextButton, setShowNextButton] = useState(false);
  const grade = getGrade(
    (correctAnswers / ((correctAnswers + incorrectAnswers) || 1)) * 100
  );

  const [correctSound, setCorrectSound] = useState();
  const [incorrectSound, setIncorrectSound] = useState();
  const backgroundColorAnim = useRef(new Animated.Value(0)).current;
  const optionsAnim = useRef(new Animated.Value(-500)).current;

  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const optionLottieRef = useRef(null);
  const [isPlayingLottieOnSpeaker, setIsPlayingLottieOnSpeaker] = useState(false);

  const [verbDetails, setVerbDetails] = useState({
    hebrewtext: '',
    translit: '',
    estext: '',
  });
  const [animateRight, setAnimateRight] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [canShowSpeaker, setCanShowSpeaker] = useState(false);

  const [isVerbListVisible, setIsVerbListVisible] = useState(true);
  const [verbListForModal, setVerbListForModal] = useState([]);
  const modalCloseReasonRef = useRef(null);

  const [language, setLanguage] = useState('es');
  const [dontShowAgain2, setDontShowAgain2] = useState(false);
  const [languageLoaded, setLanguageLoaded] = useState(false);

  const [isGenderMan, setIsGenderMan] = useState(true);
  const navigation = useNavigation();

  const allowLeaveRef = useRef(false);

  /* init модалки и языка + список глаголов */
  const initializeVerbList = (lang, setShuf, setList) => {
    const selected = shuffleArray([...verbsData]);
    setShuf(selected);

    const sorted = selected.slice().sort((a, b) =>
      String(a.verbRussian || '').localeCompare(String(b.verbRussian || ''), 'ru')
    );

    const verbList = sorted.map((verb) => {
      const correctOption = (verb.verbHebrewOptions || []).find((opt) => opt?.isCorrect);
      const ruMatch = (verbs1RU || []).find(
        (v) =>
          String(v.russiantext || '').trim().toLowerCase() ===
          String(verb.verbRussian || '').trim().toLowerCase()
      );

      const mp3Inf = String(verb.audioFile || '').replace(/\.mp3$/i, '').trim();
      const mp3Conj = String(ruMatch?.mp3 || '').replace(/\.mp3$/i, '').trim();

      return {
        hebrewtext: correctOption?.text || '—',
        translit: correctOption?.transliteration || '',
        entext: verb.verbSpanish || '—',
        mp3: mp3Inf,
        mp3Inf,
        mp3Conj,
        gender: ruMatch?.gender || undefined,
      };
    });

    setList(verbList);
  };

  useEffect(() => {
    const initialize = async () => {
      const lang = await AsyncStorage.getItem('language');
      const hidden = await AsyncStorage.getItem('exercise2_description_hidden');

      if (lang) setLanguage(lang);
      initializeVerbList(lang || 'es', setShuffledVerbs, setVerbListForModal);

      if (hidden !== 'true') {
        setTimeout(() => setDescriptionModalVisible(true), 300);
      }

      setDontShowAgain2(hidden === 'true');
      setLanguageLoaded(true);
    };
    initialize();
  }, []);

  /* back-логика: пока открыт список — выходим в меню без подтверждения */
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

  /* когда идёт упражнение — Back показывает ExitConfirmationModal */
  useFocusEffect(
    useCallback(() => {
      if (isVerbListVisible) return;

      const onBackPress = () => {
        setExitConfirmationVisible(true);
        return true;
      };

      const bh = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (allowLeaveRef.current) return;
        e.preventDefault();
        setExitConfirmationVisible(true);
      });

      return () => {
        bh.remove();
        unsubscribe();
      };
    }, [isVerbListVisible, navigation])
  );

  useEffect(() => {
    navigation.setOptions({ headerLeft: () => null });
  }, [navigation]);

  /* звуки правиль/неправиль */
  useEffect(() => {
    async function loadSounds() {
      const ok = new Audio.Sound();
      const bad = new Audio.Sound();
      try {
        await ok.loadAsync(require('./assets/sounds/success.mp3'));
        await bad.loadAsync(require('./assets/sounds/failure.mp3'));
        setCorrectSound(ok);
        setIncorrectSound(bad);
        const v = soundEnabled ? 1 : 0;
        await ok.setVolumeAsync(v);
        await bad.setVolumeAsync(v);
      } catch (e) {
        console.log('Failed to load sounds', e);
      }
    }
    loadSounds();
    return () => {
      correctSound?.unloadAsync();
      incorrectSound?.unloadAsync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled]);

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setAutoPlayEnabled(next);
    const v = next ? 1 : 0;
    correctSound?.setVolumeAsync(v);
    incorrectSound?.setVolumeAsync(v);
  };

  /* анимации интерфейса */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  const animateOptions = () =>
    Animated.timing(optionsAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();

  useEffect(() => {
    animateOptions();
  }, []);

  useEffect(() => {
    optionsAnim.setValue(-500);
    animateOptions();
  }, [currentIndex]);

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

  /* детали глагола */
  const updateVerbDetails2 = (currentVerb, showHebrewText = false) => {
    if (!currentVerb) return;
    const matched = verbs1RU.filter((v) => v.russian === currentVerb.verbRussian);
    if (matched.length > 0) {
      const selected = isGenderMan ? matched[0] : matched[1] || matched[0];
      setVerbDetails({
        hebrewtext: showHebrewText ? selected.hebrewtext : '',
        translit: showHebrewText ? selected.translit : '',
        estext: selected.estext,
        mp3: selected.mp3,
      });
    } else {
      setVerbDetails({
        hebrewtext: '',
        translit: '',
        estext: 'Verbo no encontrado',
        mp3: '',
      });
    }
  };

  useEffect(() => {
    if (shuffledVerbs.length > 0) {
      updateVerbDetails2(shuffledVerbs[currentIndex], showNextButton);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenderMan, currentIndex, shuffledVerbs]);

  /* звук инфинитива */
  const playSound = async (audioFileName, forcePlay = false) => {
    if (!soundEnabled && !forcePlay) return;
    if (!audioFileName) return;
    const audioFile = sounds[audioFileName.replace('.mp3', '')];
    if (!audioFile) return;
    const s = new Audio.Sound();
    try {
      setIsPlayingLottieOnSpeaker(true);
      await s.loadAsync(audioFile);
      await s.playAsync();
      setTimeout(() => setIsPlayingLottieOnSpeaker(false), 800);
      s.setOnPlaybackStatusUpdate(async (st) => {
        if (st.didJustFinish && !st.isLooping) await s.unloadAsync();
      });
    } catch {
      await s.unloadAsync();
    }
  };

  /* звук спряжения */
  const handleSpeakerPress = async (audioFile) => {
    if (!audioFile) return;
    const src = soundsConj[audioFile.replace('.mp3', '')];
    if (!src) return;
    const s = new Audio.Sound();
    try {
      await s.loadAsync(src);
      await s.playAsync();
      s.setOnPlaybackStatusUpdate(async (st) => {
        if (st.didJustFinish) await s.unloadAsync();
      });
    } catch {
      await s.unloadAsync();
    }
  };

  /* выбор ответа */
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);

  const handleAnswer = async (idx) => {
    setSelectedOptionIndex(idx);
    setAnimateRight(false);
    setIsAnswered(true);
    setCanShowSpeaker(false);

    const isCorrect = optionsOrder[idx].isCorrect;

    setOptionsOrder((prev) =>
      prev.map((o, i) => ({ ...o, isSelected: i === idx, disabled: true }))
    );
    changeBackgroundColor(isCorrect);

    try {
      if (isCorrect) {
        await correctSound?.replayAsync();
        setCorrectAnswers((v) => v + 1);
      } else {
        await incorrectSound?.replayAsync();
        setIncorrectAnswers((v) => v + 1);
      }
    } catch {}

    setProgress((v) => v + 1);

    try {
      const base = shuffledVerbs[currentIndex].audioFile.replace('.mp3', '');
      await playSound(base);
      setAnimateRight(true);
      await new Promise((r) => setTimeout(r, 700));

      if (verbDetails.mp3) {
        await handleSpeakerPress(verbDetails.mp3);
      }
      setCanShowSpeaker(true);
    } catch {}

    updateVerbDetails2(shuffledVerbs[currentIndex], true);
    setShowNextButton(true);
  };

  const generateOptions = (verbData) => {
    const correctIdx = verbData.verbHebrewOptions.findIndex((o) => o.isCorrect);
    const correct = verbData.verbHebrewOptions[correctIdx]?.text;
    const tr = verbData.verbHebrewOptions[correctIdx]?.transliteration;

    const wrong = verbData.verbHebrewOptions.filter((_, i) => i !== correctIdx);

    const shuffled = shuffleArray(
      wrong.map((o, i) => ({
        text: o.text,
        transliteration: o.transliteration,
        isCorrect: false,
        isSelected: false,
        index: i,
      }))
    );

    shuffled.splice(Math.floor(Math.random() * (shuffled.length + 1)), 0, {
      text: correct,
      transliteration: tr,
      isCorrect: true,
      isSelected: false,
      index: shuffled.length,
    });

    return shuffled;
  };

  useEffect(() => {
    if (shuffledVerbs.length > 0) {
      setOptionsOrder(
        generateOptions(shuffledVerbs[currentIndex]).map((o) => ({
          ...o,
          isSelected: false,
        }))
      );
    }
  }, [currentIndex, shuffledVerbs]);

  /* next */
  const handleNextCard = () => {
    setShowNextButton(false);
    setOptionsOrder([]);
    setSelectedOptionIndex(null);
    setIsAnswered(false);
    setAnimateRight(false);

    const next = (currentIndex + 1) % shuffledVerbs.length;

    if (next === 0) {
      setExerciseCompleted(true);
      handleExerciseCompletion();
    } else {
      setExerciseCompleted(false);
    }

    setOptionsOrder(
      generateOptions(shuffledVerbs[next]).map((o) => ({
        ...o,
        disabled: false,
        isSelected: false,
      }))
    );
    setCurrentIndex(next);
  };

  /* статка */
  const calculateScore = () => {
    const total = correctAnswers + incorrectAnswers;
    return total > 0 ? ((correctAnswers / total) * 100).toFixed(2) : 0;
  };

  const [statistics, setStatistics] = useState(null);
  const [isStatModalVisible, setIsStatModalVisible] = useState(false);
  const [statisticsUpdated, setStatisticsUpdated] = useState(false);

  const handleExerciseCompletion = async () => {
    if (statisticsUpdated) return;
    setStatisticsUpdated(true);
    const currentScore = calculateScore();
    setTimeout(async () => {
      try {
        await updateStatistics('exercise2Es', currentScore);
      } catch (e) {
        console.error('Failed to update statistics:', e);
      }
    }, 500);
  };

  const handleButton3Press = async () => {
    try {
      const stats = await getStatistics('exercise2Es');
      setStatistics(stats ? { currentScore: stats.averageScore } : null);
      setIsStatModalVisible(true);
    } catch (e) {
      setStatistics(null);
      setIsStatModalVisible(false);
    }
  };

  /* reset */
  const resetExercise = () => {
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setProgress(0);
    setShowNextButton(false);
    setExerciseCompleted(false);
    setStatisticsUpdated(false);
    setIsVerbListVisible(true);
    initializeVerbList(language, setShuffledVerbs, setVerbListForModal);
    setCurrentIndex(0);
  };

  const handleConfirmExit = () => {
    allowLeaveRef.current = true;
    setExitConfirmationVisible(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'MenuEs' }],
    });
  };

  const handleCancelExit = () => setExitConfirmationVisible(false);

  const handleGenderToggle = () => setIsGenderMan((v) => !v);

  const toggleDescriptionModal = () =>
    setDescriptionModalVisible((v) => !v);

  const handleToggleDontShowAgain2 = async () => {
    const next = !dontShowAgain2;
    setDontShowAgain2(next);
    await AsyncStorage.setItem(
      'exercise2_description_hidden',
      next ? 'true' : ''
    );
  };

  const navigateToMenu = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MenuEs' }],
    });
  };

  /* render */
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
            if (shuffledVerbs.length) {
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
                    source={
                      soundEnabled
                        ? require('./SoundOn.png')
                        : require('./SoundOff.png')
                    }
                    style={[styles.buttonImage, { opacity: fadeAnim }]}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleButton3Press}>
                  <Animated.Image
                    source={require('./stat.png')}
                    style={[styles.buttonImage, { opacity: fadeAnim }]}
                  />
                  <StatModal2Es
                    visible={isStatModalVisible}
                    onToggle={() => setIsStatModalVisible(false)}
                    statistics={statistics}
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
                    dontShowAgain2={dontShowAgain2}
                    onToggleDontShowAgain={handleToggleDontShowAgain2}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleGenderToggle}>
                  <Animated.Image
                    source={
                      isGenderMan
                        ? require('./GenderMan.png')
                        : require('./GenderWoman.png')
                    }
                    style={[styles.buttonImage, { opacity: fadeAnim }]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Animated.View
              style={[styles.progressContainer, { opacity: fadeAnim }]}
            >
              <View style={styles.textContainer}>
                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>
                  CORRECTO: {correctAnswers}
                </Text>
                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>
                  INCORRECTO: {incorrectAnswers}
                </Text>
              </View>

              <View style={styles.remainingTasksContainer}>
                <Text
                  style={styles.remainingTasksText}
                  maxFontSizeMultiplier={1.2}
                >
                  {Math.max(shuffledVerbs.length - currentIndex, 0)}
                </Text>
              </View>

              <Animated.View
                style={[styles.percentContainer, { backgroundColor }]}
              >
                <Text style={styles.percentText} maxFontSizeMultiplier={1.2}>
                  {progress > 0
                    ? (
                        (correctAnswers /
                          (correctAnswers + incorrectAnswers)) *
                        100
                      ).toFixed(2)
                    : 0}
                  %
                </Text>
              </Animated.View>
            </Animated.View>

            <Animated.View
              style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}
            >
              <ProgressBar
                progress={progress}
                totalExercises={shuffledVerbs.length}
              />
            </Animated.View>

            <Animated.Text
              style={[styles.title, { opacity: fadeAnim }]}
              maxFontSizeMultiplier={1.2}
            >
              SELECCIONA LA TRADUCCIÓN
            </Animated.Text>

            {currentIndex < shuffledVerbs.length && (
              <VerbCard2
                verbData={shuffledVerbs[currentIndex]}
                options={optionsOrder}
                onAnswer={handleAnswer}
              />
            )}

            <VerbDetailsContainer2
              verbDetails={verbDetails}
              handleSpeakerPress={handleSpeakerPress}
              currentIndex={currentIndex}
              animateRight={animateRight}
              isAnswered={isAnswered}
              canShowSpeaker={canShowSpeaker}
            />

            <Animated.View
              style={[
                styles.optionsContainer,
                { transform: [{ translateX: optionsAnim }] },
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
                    <Text
                      style={styles.transliterationText}
                      maxFontSizeMultiplier={1.2}
                    >
                      {option.transliteration}
                    </Text>

                    {option.isCorrect && isPlayingLottieOnSpeaker && (
                      <View style={styles.lottieContainer}>
                        <LottieView
                          ref={optionLottieRef}
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
                        onPress={() =>
                          playSound(shuffledVerbs[currentIndex].audioFile, true)
                        }
                      >
                        <Image
                          source={require('./speaker6.png')}
                          style={styles.speakerIcon}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
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
              <Text style={styles.nextButtonText} maxFontSizeMultiplier={1.2}>
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
                    ? (
                        (correctAnswers /
                          (correctAnswers + incorrectAnswers)) *
                        100
                      ).toFixed(2)
                    : 0
                }
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

      {/* Модалки вне ScrollView */}
      <StatModal2Es
        visible={isStatModalVisible}
        onToggle={() => setIsStatModalVisible(false)}
        statistics={statistics}
      />

      <TaskDescriptionModal6
        visible={isDescriptionModalVisible}
        onToggle={toggleDescriptionModal}
        language={language}
        dontShowAgain2={dontShowAgain2}
        onToggleDontShowAgain={handleToggleDontShowAgain2}
      />
    </>
  );
};

/* styles */
const styles = StyleSheet.create({
  scrollViewContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },

  container: {
    flex: 1,
    justifyContent: 'center',
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
    marginTop: 0,
  },
  logoImage: { width: 90, height: 90, marginLeft: 10 },
  buttonContainer: { flexDirection: 'row', marginRight: 10 },
  buttonImage: { width: 44, height: 44, marginLeft: 10 },

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
    height: 110,
    padding: 15,
    backgroundColor: '#FFFDEF',
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  optionContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  optionText: {
    fontSize: 22,
    textAlign: 'center',
    color: '#152039',
    fontWeight: 'bold',
  },
  transliterationText: {
    fontSize: 17,
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
    shadowOffset: { width: 0, height: 2 },
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
  activeButton: { backgroundColor: '#1C3F60', textAlign: 'center' },
  inactiveButton: { backgroundColor: '#D9D9D9', textAlign: 'center' },

  correctOption: { backgroundColor: '#AFFFCA' },
  incorrectOption: { backgroundColor: '#FFBCBC' },

  ProgressBarcontainer: { width: '100%', marginBottom: 10 },

  /* Статистика */
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textContainer: { flex: 1, justifyContent: 'center', width: '50%' },
  prtext: {
    fontSize: 12,
    color: 'white',
    textAlign: 'left',
    marginLeft: 15,
  },
  percentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 10,
    minHeight: 28,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  percentText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 10,
    lineHeight: 22,
  },
  remainingTasksContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  remainingTasksText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#83A3CD',
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 10,
    lineHeight: 22,
    minHeight: 28,
  },

  /* verb details */
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

  verbDetailsHebrew: { fontSize: 20, color: '#FFFDEF', fontWeight: 'bold', marginBottom: -3 },
  verbDetailsTranslit: {
    fontSize: 15,
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
  verbDetailsSpanish: {
    fontSize: 16,
    color: '#333652',
    fontWeight: 'bold',
    backgroundColor: '#FFFDEF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  speakerIcon: { width: 20, height: 20, resizeMode: 'contain' },
  speakerIconContainer: { position: 'absolute', bottom: -8, right: -8 },
  speakerIcon1: { width: 40, height: 40 },

  lottieContainer: { position: 'absolute', top: -10, left: -7, width: 32, height: 32 },
  lottie: { width: '100%', height: '100%' },
});

export default Exercise2Es;
