// Exercise2Am.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import VerbCard2 from './VerbCard2Am';
import verbsData from './verbs2.json';
import verbs1RU from './verbs11RU.json';
import ProgressBar from './ProgressBar';
import CompletionMessageAm from './CompletionMessageAm';
import ExitConfirmationModal from './ExitConfirmationModalAm';
import sounds from './Soundss';
import soundsConj from './soundconj';
import TaskDescriptionModal6 from './TaskDescriptionModal2';
import StatModal2Am from './StatModal2Am';
import { updateStatistics, getStatistics } from './stat';
import animation from './assets/Animation - 1723020554284.json';
import VerbListModal from './VerbListModal';

const shuffleArray = (array) => {
  const shuffledArray = array.slice();
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray.slice(0, 18);
};

// Амхарская шкала оценок
const getGrade = (percentage) => {
  if (percentage === 100) {
    return 'ድሩላችሁ! ፍጹም በፍጹም! አንድም ስህተት አላደረጋችሁም!';
  } else if (percentage >= 90) {
    return 'በጣም ጥሩ! እንደሚታወቀው ማታለል እንግዲህ እንደቀጣችሁ ሂዱ!';
  } else if (percentage >= 80) {
    return 'በጣም ጥሩ! በጣም ጥሩ እየሠራችሁ እንታውቃለን!';
  } else if (percentage >= 70) {
    return 'ጥሩ! እንደምታውቁት ትምህርቱን ጥሩ በተለምዶ!';
  } else if (percentage >= 60) {
    return 'እንኳን ለምግባሩ እንደሚታወቀው አሻሻለሁ!';
  } else if (percentage >= 50) {
    return 'መልካም ነው! ለማሻሻል ቦታ አለ!';
  } else if (percentage >= 40) {
    return 'እንኳን ለምግባሩ ተከትለሃል! በጣም አስናቀኛል!';
  } else if (percentage >= 30) {
    return 'እየማደስህ ነው, እንደምታውቁት ሂድ!';
  } else if (percentage >= 20) {
    return 'የምትማሩበትን መልእክት ለማቋቋም ይሞክሩ!';
  } else if (percentage >= 10) {
    return 'እጅግ አስቸጋሪ ነው, እልኩን ሳይተዉ ተከትሉ!';
  } else {
    return 'በተለይ ጉዳይ እንዳለው ይሠራል! ማቆም አይቻልም, ቀጣይ ለተማሩ!';
  }
};

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
    if (isAnswered && animationRef.current) {
      animationRef.current.reset();
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.reset();
      }
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
      <Animated.View style={[styles.verbDetailsHalf, styles.verbDetailsLeft, { width: leftWidth }]} />
      <Animated.View style={[styles.verbDetailsHalf, styles.verbDetailsRight, { width: rightWidth }]} />
      <View style={styles.verbDetailsContent}>
        <View style={styles.verbDetailsLeftContent}>
          {/* ВАЖНО: используем entext, как в EN, а не amtext — VerbListModal тоже его ждёт */}
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
              {verbDetails.translit ? (
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
            <LottieView ref={animationRef} source={animation} loop autoPlay style={styles.lottieAnimation} />
          )}
        </View>
      </View>
    </View>
  );
};

const Exercise2Am = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [optionsOrder, setOptionsOrder] = useState([]);
  const [exitConfirmationVisible, setExitConfirmationVisible] = useState(false);
  const [shuffledVerbs, setShuffledVerbs] = useState([]);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showNextButton, setShowNextButton] = useState(false);
  const [currentGrade, setCurrentGrade] = useState('');

  const [correctSound, setCorrectSound] = useState();
  const [incorrectSound, setIncorrectSound] = useState();

  const backgroundColorAnim = useRef(new Animated.Value(0)).current;
  const optionsAnim = useRef(new Animated.Value(-500)).current;

  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  const [verbDetails, setVerbDetails] = useState({
    hebrewtext: '',
    translit: '',
    amtext: '',
    entext: '',
    mp3: '',
  });

  const [isSecondSoundFinished, setIsSecondSoundFinished] = useState(false);
  const [canShowSpeaker, setCanShowSpeaker] = useState(false);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  const [isPlayingLottieOnSpeaker, setIsPlayingLottieOnSpeaker] = useState(false);

  const [isVerbListVisible, setIsVerbListVisible] = useState(true);
  const [verbListForModal, setVerbListForModal] = useState([]);
  const modalCloseReasonRef = useRef(null);

  const allowLeaveRef = useRef(false);

  const [language, setLanguage] = useState('am');
  const [dontShowAgain2, setDontShowAgain2] = useState(false);
  const [languageLoaded, setLanguageLoaded] = useState(false);

  const [isGenderMan, setIsGenderMan] = useState(true);

  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [animateRight, setAnimateRight] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [soundObject2, setSoundObject2] = useState(null);

  const [resizeMode, setResizeMode] = useState('contain');

  const [statistics, setStatistics] = useState(null);
  const [isStatModalVisible, setIsStatModalVisible] = useState(false);
  const [statisticsUpdated, setStatisticsUpdated] = useState(false);

  const navigation = useNavigation();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  };

  const animateOptions = () => {
    Animated.timing(optionsAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
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

  const goToMenu = () => {
    allowLeaveRef.current = true;
    setExitConfirmationVisible(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'MenuAm' }],
      }),
    );
  };

  const handleConfirmExit = () => {
    goToMenu();
  };

  const handleCancelExit = () => {
    setExitConfirmationVisible(false);
  };

  const handleResizeModeChange = (mode) => {
    setResizeMode(mode);
  };

  const calculateScore = () => {
    const totalAttempts = correctAnswers + incorrectAnswers;
    if (totalAttempts === 0) return 0;
    return Number(((correctAnswers / totalAttempts) * 100).toFixed(2));
  };

  const percent = calculateScore();
  const grade = getGrade(percent);

  const initializeVerbList = (lang, setShuffledVerbsFn, setVerbListForModalFn) => {
    const selected = shuffleArray([...verbsData]);
    setShuffledVerbsFn(selected);

    const sorted = selected
      .slice()
      .sort((a, b) => String(a.verbRussian || '').localeCompare(String(b.verbRussian || ''), 'ru'));

    const verbList = sorted.map((verb) => {
      const correctOption = (verb.verbHebrewOptions || []).find((opt) => opt?.isCorrect);

      const ruMatch = (verbs1RU || []).find(
        (v) =>
          String(v.russiantext || '').trim().toLowerCase() ===
          String(verb.verbRussian || '').trim().toLowerCase(),
      );

      const mp3Inf = String(verb.audioFile || '').replace(/\.mp3$/i, '').trim();
      const mp3Conj = String(ruMatch?.mp3 || '').replace(/\.mp3$/i, '').trim();

      return {
        hebrewtext: correctOption?.text || '—',
        translit: correctOption?.transliteration || '',
        // КЛЮЧЕВОЕ: entext — текст на амхарском для VerbListModal и верхней панели
        entext: verb.verbAmharic || '—',
        // Дополнительно амхарский текст можно отдельно держать, если нужно
        amtext: verb.verbAmharic || '—',

        mp3: mp3Inf,
        mp3Inf,
        mp3Conj,
        gender: ruMatch?.gender || undefined,
      };
    });

    console.log('[initializeVerbList AM] selected:', selected.length);
    console.log('[initializeVerbList AM] verbListForModal:', verbList.length);
    if (verbList.length) {
      console.log('[initializeVerbList AM] sample item:', verbList[0]);
    }

    setVerbListForModalFn(verbList);
  };

  const toggleDescriptionModal = () => {
    setDescriptionModalVisible((prev) => !prev);
  };

  const handleButton2Press = () => {
    toggleDescriptionModal();
  };

  const handleToggleDontShowAgain2 = async () => {
    const newValue = !dontShowAgain2;
    setDontShowAgain2(newValue);
    await AsyncStorage.setItem('exercise2_description_hidden', newValue ? 'true' : '');
    console.log('📌 Checkbox click. Was:', dontShowAgain2, 'Will be:', !dontShowAgain2);
  };

  const handleGenderToggle = () => {
    setIsGenderMan((prev) => !prev);
  };

  /* ================== эффекты ================== */

  useEffect(() => {
    fadeIn();
  }, []);

  useEffect(() => {
    animateOptions();
  }, []);

  useEffect(() => {
    optionsAnim.setValue(-500);
    animateOptions();
  }, [currentIndex]);

  useEffect(() => {
    const initialize = async () => {
      const lang = await AsyncStorage.getItem('language');
      const hidden = await AsyncStorage.getItem('exercise2_description_hidden');

      const usedLang = lang || 'am';
      setLanguage(usedLang);

      initializeVerbList(usedLang, setShuffledVerbs, setVerbListForModal);

      if (hidden !== 'true') {
        setTimeout(() => {
          setDescriptionModalVisible(true);
        }, 300);
      }

      setDontShowAgain2(hidden === 'true');
      setLanguageLoaded(true);
    };

    initialize();
  }, []);

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
      if (soundObject2) {
        await soundObject2.setVolumeAsync(volume);
      }
    };

    if (correctSound && incorrectSound) {
      updateVolume();
    }
  }, [soundEnabled, correctSound, incorrectSound, soundObject2]);

  const handleSoundToggle = () => {
    const newVolume = !soundEnabled ? 1 : 0;
    setSoundEnabled((prev) => !prev);
    setAutoPlayEnabled((prev) => !prev);

    if (correctSound && incorrectSound) {
      correctSound.setVolumeAsync(newVolume);
      incorrectSound.setVolumeAsync(newVolume);
    }
    if (soundObject2) {
      soundObject2.setVolumeAsync(newVolume);
    }
  };

  const updateVerbDetails2 = (currentVerb, showHebrewText = false) => {
    if (!currentVerb || !currentVerb.verbRussian) {
      return;
    }

    const matchedVerbs = verbs1RU.filter(
      (verb) =>
        String(verb.russian || '').toLowerCase() ===
        String(currentVerb.verbRussian || '').toLowerCase(),
    );

    if (matchedVerbs.length > 0) {
      const selectedVerb = isGenderMan ? matchedVerbs[0] : matchedVerbs[1] || matchedVerbs[0];
      setVerbDetails({
        hebrewtext: showHebrewText ? selectedVerb.hebrewtext : '',
        translit: showHebrewText ? selectedVerb.translit : '',
        amtext: selectedVerb.amtext,
        entext: selectedVerb.amtext, // структура как в EN (entext), но текст на амхарском
        mp3: selectedVerb.mp3,
      });
    } else {
      setVerbDetails({
        hebrewtext: '',
        translit: '',
        amtext: 'ግስ አልተገኘም',
        entext: 'ግስ አልተገኘም',
        mp3: '',
      });
    }
  };

  useEffect(() => {
    if (shuffledVerbs.length > 0) {
      updateVerbDetails2(shuffledVerbs[currentIndex], showNextButton);
    }
  }, [isGenderMan, currentIndex, shuffledVerbs]);

  useEffect(() => {
    if (shuffledVerbs.length > 0) {
      setOptionsOrder(
        generateOptions(shuffledVerbs[currentIndex]).map((option) => ({
          ...option,
          isSelected: false,
          disabled: false,
        })),
      );
    }
  }, [currentIndex, shuffledVerbs]);

  useEffect(() => {
    if (exerciseCompleted) {
      const newGrade = getGrade(percent);
      setCurrentGrade(newGrade);
      handleExerciseCompletion();
    }
  }, [exerciseCompleted, correctAnswers, incorrectAnswers]);

  // пока открыт список — «Назад» уходит в меню без подтверждения
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
    }, [isVerbListVisible, navigation]),
  );

  // когда упражнение активно — показываем подтверждение выхода
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
    }, [isVerbListVisible, exitConfirmationVisible, navigation]),
  );

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
    });
  }, [navigation]);

  /* ================== звук ================== */

  const handleSpeakerPress = async (audioFile) => {
    if (!audioFile) {
      console.error('Audio file is undefined.');
      return;
    }

    const soundFile = soundsConj[audioFile.replace('.mp3', '')];
    if (!soundFile) {
      console.error(`Audio file ${audioFile} not found in soundsConj.`);
      return;
    }

    const soundObject = new Audio.Sound();
    try {
      setIsSoundPlaying(true);

      await soundObject.loadAsync(soundFile);
      await soundObject.playAsync();
      soundObject.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await soundObject.unloadAsync();
          setIsSoundPlaying(false);
        }
      });
    } catch (error) {
      console.log('Error playing sound:', error);
      await soundObject.unloadAsync();
      setIsSoundPlaying(false);
    }
  };

  const playSound = async (audioFileName, forcePlay = false) => {
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
        console.error('Error playing sound:', error);
        await soundObject.unloadAsync();
      }
    } else {
      console.error(`Audio file ${audioFileName} not found in sounds.`);
    }
  };

  const playSecondSound = async () => {
    const audioFile = verbDetails.mp3;
    if (!audioFile) {
      console.error('Audio file is undefined.');
      return;
    }

    try {
      const secondSoundFile = soundsConj[audioFile.replace('.mp3', '')];
      if (!secondSoundFile) {
        console.error(`Second sound file not found for: ${audioFile}`);
        return;
      }

      const snd2 = new Audio.Sound();
      setSoundObject2(snd2);
      console.log('Loading second sound...');
      await snd2.loadAsync(secondSoundFile);
      console.log('Playing second sound...');

      if (!soundEnabled) {
        console.log('Sound is muted, stopping second sound.');
        await snd2.stopAsync();
        await snd2.unloadAsync();
        setSoundObject2(null);
        return;
      }

      await snd2.playAsync();

      snd2.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          console.log('Second sound finished, unloading...');
          await snd2.unloadAsync();
          setSoundObject2(null);
        }
      });
    } catch (error) {
      console.error('Error during second sound playback:', error);
    }
  };

  /* ================== логика ответов ================== */

  const generateOptions = (verbData) => {
    const correctAnswerIndex = verbData.verbHebrewOptions.findIndex((option) => option.isCorrect);
    const correctTranslation = verbData.verbHebrewOptions[correctAnswerIndex]?.text;
    const transliteration = verbData.verbHebrewOptions[correctAnswerIndex]?.transliteration;

    if (!correctTranslation) {
      console.log(`Error: verb "${verbData.verbRussian}" has no correct translation.`);
    }

    const incorrectOptions = verbData.verbHebrewOptions.filter((_, index) => index !== correctAnswerIndex);

    const shuffledOptions = shuffleArray(
      incorrectOptions.map((option, index) => {
        if (!option.text) {
          console.log(
            `Error: verb "${verbData.verbRussian}" has option without text.`,
          );
        }
        return {
          text: option.text,
          transliteration: option.transliteration,
          isCorrect: false,
          isSelected: false,
          isHighlighted: false,
          index,
        };
      }),
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
    setIsSecondSoundFinished(false);
    setCanShowSpeaker(false);
  };

  const handleAnswer = async (selectedOptionIdx) => {
    setSelectedOptionIndex(selectedOptionIdx);
    setAnimateRight(false);
    setIsAnswered(true);
    setCanShowSpeaker(false);

    const isCorrect = optionsOrder[selectedOptionIdx].isCorrect;

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
    } catch (error) {
      console.error('Error playing answer sound:', error);
    }

    setProgress((prev) => prev + 1);

    try {
      const firstSoundFile = shuffledVerbs[currentIndex].audioFile.replace('.mp3', '');
      await playSound(firstSoundFile);

      setAnimateRight(true);

      await new Promise((resolve) => setTimeout(resolve, 700));
      await playSecondSound();
      setIsSecondSoundFinished(true);
      setCanShowSpeaker(true);
    } catch (error) {
      console.error('Error during sounds playback:', error);
    }

    updateVerbDetails2(shuffledVerbs[currentIndex], true);
    setShowNextButton(true);
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
    setIsSecondSoundFinished(false);
    setCanShowSpeaker(false);

    const nextOptions = generateOptions(shuffledVerbs[next]).map((o) => ({
      ...o,
      isSelected: false,
      disabled: false,
    }));
    setOptionsOrder(nextOptions);
    updateVerbDetails2(shuffledVerbs[next], false);
  };

  /* ================== статистика / рестарт ================== */

  const handleExerciseCompletion = async () => {
    if (!statisticsUpdated) {
      setStatisticsUpdated(true);
      const currentScore = calculateScore();

      setTimeout(async () => {
        try {
          await updateStatistics('exercise2Am', currentScore);
        } catch (error) {
          console.error('Failed to update statistics:', error);
        }
      }, 500);
    }
  };

  const resetExercise = () => {
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
      amtext: '',
      entext: '',
      mp3: '',
    });

    setIsVerbListVisible(true);

    initializeVerbList(language, setShuffledVerbs, setVerbListForModal);

    setCurrentIndex(0);
    console.log('Exercise AM has been reset and restarted.');
  };

  const handleButton3Press = async () => {
    const exerciseId = 'exercise2Am';
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

  /* ================== рендер ================== */

  return (
    <>
      {isVerbListVisible && (
        <VerbListModal
          visible={isVerbListVisible}
          language={language}
          verbs={verbListForModal}
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
                })),
              );
              updateVerbDetails2(shuffledVerbs[0], false);
            }
          }}
          onClose={() => {
            modalCloseReasonRef.current = 'menu';
            setIsVerbListVisible(false);
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

                <TouchableOpacity onPress={handleButton2Press}>
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

            <Animated.View
              style={[styles.progressContainer, { resizeMode }, { opacity: fadeAnim }]}
            >
              <View style={styles.textContainer}>
                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>
                  ትክክል: {correctAnswers}
                </Text>
                <Text style={styles.prtext} maxFontSizeMultiplier={1.2}>
                  ስህተት: {incorrectAnswers}
                </Text>
              </View>

              <View style={styles.remainingTasksContainer}>
                <Text style={styles.remainingTasksText} maxFontSizeMultiplier={1.2}>
                  {shuffledVerbs.length - currentIndex}
                </Text>
              </View>

              <Animated.View
                style={[styles.percentContainer, { backgroundColor, borderRadius: 10 }]}
              >
                <Text style={styles.percentText} maxFontSizeMultiplier={1.2}>
                  {percent}%
                </Text>
              </Animated.View>
            </Animated.View>

            <Animated.View style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}>
              <ProgressBar progress={progress} totalExercises={shuffledVerbs.length} />
            </Animated.View>

            <Animated.Text style={[styles.title, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>
              ይምረጡ ትርጉም
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
                    <Text style={styles.transliterationText} maxFontSizeMultiplier={1.2}>
                      {option.transliteration}
                    </Text>

                    {option.isCorrect && isPlayingLottieOnSpeaker && (
                      <View style={styles.lottieContainer}>
                        <LottieView
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
                        <Image source={require('./speaker6.png')} style={styles.speakerIcon} />
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
                ቀጣዩ ግስ
              </Text>
            </TouchableOpacity>

            {exerciseCompleted && (
              <CompletionMessageAm
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

      <StatModal2Am
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
    height: 110,
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
    fontSize: 20,
    color: '#FFFDEF',
    fontWeight: 'bold',
    marginBottom: -3,
  },
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
  verbDetailsRussian: {
    fontSize: 16,
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

export default Exercise2Am;
