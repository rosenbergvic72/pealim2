import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, BackHandler, Image, Animated } from 'react-native';
import VerbCard1 from './VerbCard1Es';
import verbsData from './verbs1.json';
import verbs1RU from './verbs11RU.json'; // Подключаем данные
import ProgressBar from './ProgressBar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import CompletionMessageEs from './CompletionMessageEs';
import ExitConfirmationModal from './ExitConfirmationModalEs';
import { Audio } from 'expo-av';
import TaskDescriptionModal6 from './TaskDescriptionModal1';
import StatModal1Es from './StatModal1Es';
import { updateStatistics, getStatistics } from './stat';
import sounds from './Soundss';
import soundsConj from './soundconj'; // Импорт дополнительных звуков
import LottieView from 'lottie-react-native';
import animation from './assets/Animation - 1723020554284.json';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VerbListModal from './VerbListModal'; // импорт модалки



const shuffleArray = (array) => {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 24);
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
  


// Компонент для отображения деталей глагола
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
        <Text style={styles.verbDetailsHebrew}maxFontSizeMultiplier={1.2}>{verbDetails.hebrewtext}</Text>
        <Text style={styles.verbDetailsTranslit}maxFontSizeMultiplier={1.2}>{verbDetails.translit}</Text>
      </View>
      <View style={styles.verbDetailsRightContent}>
        {showRussianText ? (
          <Text style={styles.verbDetailsRussian}maxFontSizeMultiplier={1.2}>{verbDetails.estext}</Text>
        ) : (
          <LottieView
            source={animation}
            autoPlay
            loop
            onAnimationFinish={() => {
              // Сброс состояния после завершения
              animationRef.current?.reset();
            }}
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






const cachedSounds = {};

const handleSpeakerPress = async (audioFile) => {
  if (!audioFile) {
    console.error("Audio file is undefined.");
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
    cachedSounds[audioFile] = soundObject; // Кэшируем звук
  }

  try {
    await soundObject.playAsync();
    soundObject.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        soundObject.unloadAsync(); // Освобождаем память после завершения воспроизведения
        delete cachedSounds[audioFile]; // Удаляем из кэша, если нужно
      }
    });
  } catch (error) {
    console.log('Error playing sound:', error);
    soundObject.unloadAsync(); // Попытка освободить ресурсы даже при ошибке
    delete cachedSounds[audioFile]; // Удаляем из кэша в случае ошибки
  }
};

const Exercise1Es = ({ navigation }) => {
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
  const rightFillAnim = useRef(new Animated.Value(0)).current;
  const [autoPlaySounds, setAutoPlaySounds] = useState(true); // Новый state для управления автовоспроизведением
  const [isVerbListVisible, setIsVerbListVisible] = useState(true); // видимость модалки списка
const [verbListForModal, setVerbListForModal] = useState([]);


  const toggleDescriptionModal = () => {
    setDescriptionModalVisible((prev) => !prev);
  };

  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);

  const [dontShowAgain1, setDontShowAgain1] = useState(false);

  const [language, setLanguage] = useState('en'); // ← по умолчанию ru

  const [languageLoaded, setLanguageLoaded] = useState(false);

  useEffect(() => {
  const checkFlagAndLang = async () => {
    const hidden = await AsyncStorage.getItem('exercise1_description_hidden');
    const lang = await AsyncStorage.getItem('language');

    console.log('🌍 Language:', lang);
    console.log('🧪 Hide flag:', hidden);

    if (lang) {
      setLanguage(lang);

      setDontShowAgain1(hidden === 'true');
    setLanguageLoaded(true);

      if (hidden !== 'true') {
        setTimeout(() => {
          console.log('📢 Показываем модалку после загрузки языка');
          setDescriptionModalVisible(true);
        }, 100); // чуть больше времени
      }
    }

    setDontShowAgain1(hidden === 'true');
  };

  checkFlagAndLang();
}, []);




const handleToggleDontShowAgain1 = async () => {
  const newValue = !dontShowAgain1;
  setDontShowAgain1(newValue);
  await AsyncStorage.setItem('exercise1_description_hidden', newValue ? 'true' : '');
  console.log('📌 Клик по чекбоксу. Было:', dontShowAgain1, 'Станет:', !dontShowAgain1);
};


  const handleButton2Press = () => {
    toggleDescriptionModal();
  };

  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
    setAutoPlaySounds(!autoPlaySounds); // Переключаем состояние автовоспроизведения
  };


  // const [language, setLanguage] = useState('en'); // по умолчанию
  
  useEffect(() => {
    const fetchLanguage = async () => {
      const storedLang = await AsyncStorage.getItem('language');
      if (storedLang) {
        setLanguage(storedLang);
      }
    };
    fetchLanguage();
  }, []);
  

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
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    fadeIn();
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

  const navigateToMenu = () => {
    console.log('Navigating to MenuEn, current state:', navigation.getState());
    navigation.reset({
      index: 0,
      routes: [{ name: 'MenuEs' }],
    });
  };

  const handleBackButtonPress = () => {
    setExitConfirmationVisible(true);
    return true;
  };

  useFocusEffect(
              useCallback(() => {
                const onBackPress = () => {
                  if (exitConfirmationVisible) {
                    return false;
                  }
                  setExitConfirmationVisible(true);
                  return true;
                };
            
                const backHandler = BackHandler.addEventListener(
                  'hardwareBackPress',
                  onBackPress
                );
            
                const unsubscribe = navigation.addListener('beforeRemove', (e) => {
                  if (!exitConfirmationVisible) {
                    e.preventDefault(); // Блокируем навигацию назад
                    setExitConfirmationVisible(true); // Показываем модалку
                  }
                });
            
                return () => {
                  backHandler.remove();
                  unsubscribe();
                };
              }, [exitConfirmationVisible, navigation])
            );

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null, // Убирает кнопку "Назад" в заголовке
    });
  }, [navigation]);


  const initializeExercise = (lang) => {
  const newShuffled = shuffleArray(verbsData);
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
    return {
      hebrewtext: verb.hebrewVerb,
      translit: verb.transliteration || '',
      entext: translations[correctIndex] || '—',
      mp3: verb.audioFile?.replace('.mp3', '') || '',
    };
  });

  setVerbListForModal(verbList);
};

useEffect(() => {
  if (language) {
    initializeExercise(language);
  }
}, [language]);

 

useEffect(() => {
  if (!isVerbListVisible && shuffledVerbs.length > 0) {
    const currentVerb = shuffledVerbs[currentIndex];
    setOptionsOrder(generateOptions(currentVerb));
    updateVerbDetails(currentVerb, isGenderMan, false); // вызов только после закрытия модалки
  }
}, [currentIndex, shuffledVerbs, isGenderMan, isVerbListVisible]);


  const generateOptions = (verbData) => {
    if (!verbData || !verbData.translationOptionsEs || !Number.isInteger(verbData.correctTranslationIndex)) {
      console.error("Invalid verbData:", verbData);
      return [];
    }

    const correctAnswerIndex = verbData.correctTranslationIndex;
    const correctTranslation = verbData.translationOptionsEs[correctAnswerIndex];
    const incorrectOptions = verbData.translationOptionsEs.filter(
      (_, index) => index !== correctAnswerIndex
    );

    const shuffledOptions = shuffleArray(
      incorrectOptions.map((option, index) => ({ text: option, isCorrect: false, isSelected: false, index }))
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
        await incorrectSoundObject.loadAsync(sounds.failure, {
          volume: 0.8,
        });
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

  useEffect(() => {
    const updateVolume = async () => {
      const volume = soundEnabled ? 1 : 0;
      await correctSound?.setVolumeAsync(volume);
      await incorrectSound?.setVolumeAsync(volume);
    };

    updateVolume();
  }, [soundEnabled, correctSound, incorrectSound]);

  const playSound = async (isCorrect) => {
    try {
      const sound = isCorrect ? correctSound : incorrectSound;
      await sound.replayAsync();
    } catch (error) {
      console.log('Error playing sound', error);
    }
  };

  const handleAnswer = (selectedOptionIndex) => {
    if (exerciseCompleted) return;

    const selectedOption = optionsOrder[selectedOptionIndex];
    if (!selectedOption) {
        console.error("Invalid selectedOptionIndex:", selectedOptionIndex);
        return;
    }

    const isCorrect = selectedOption.isCorrect;

    // Немедленная подсветка и деактивация кнопок
    setOptionsOrder(prevOptions => 
        prevOptions.map((option, index) => ({
            ...option,
            isSelected: index === selectedOptionIndex || option.isCorrect,
            disabled: true,
        }))
    );

    changeBackgroundColor(isCorrect);
    playSound(isCorrect);

    if (isCorrect) {
        setCorrectAnswers((prevCorrectAnswers) => prevCorrectAnswers + 1);
    } else {
        setIncorrectAnswers((prevIncorrectAnswers) => prevIncorrectAnswers + 1);
    }

    setProgress((prevProgress) => prevProgress + 1);

    const matchedVerbs = verbs1RU.filter((verb) => verb.infinitive === shuffledVerbs[currentIndex].hebrewVerb);
    if (matchedVerbs.length > 0) {
      const selectedVerb = matchedVerbs.find((verb) => verb.gender === (isGenderMan ? 'man' : 'woman'));
      if (selectedVerb) {
        setVerbDetails({
          hebrewtext: selectedVerb.hebrewtext,
          translit: selectedVerb.translit,
          estext: selectedVerb.estext,
          mp3: selectedVerb.mp3, // Добавляем mp3 в состояние verbDetails
        });
      }
    }

    // Задержка активации кнопки "СЛЕДУЮЩИЙ ГЛАГОЛ"
    setTimeout(() => {
        setShowNextButton(true);
    }, 1000);
};

  
  

  const animateTranslation = () => {
    Animated.timing(optionsContainerAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => setIsFirstAnimationCompleted(true));
  };

  const animation = useRef(new Animated.Value(-500)).current;

  const [isFirstAnimationCompleted, setIsFirstAnimationCompleted] = useState(false);

  useEffect(() => {
    if (!isFirstAnimationCompleted) {
      animateTranslation();
    }
  }, [isFirstAnimationCompleted]);

  const handleNextCard = () => {
    // Проверка, если упражнение завершено, то ничего не делать
    if (exerciseCompleted) return;
  
    // Откат анимации контейнера с опциями
    optionsContainerAnim.setValue(-500);
  
    // Скрываем кнопку "СЛЕДУЮЩИЙ ГЛАГОЛ"
    setShowNextButton(false);
  
    // Переход к следующему индексу
    const nextIndex = currentIndex + 1;
  
    // Проверка, если достигли конца серии упражнений, то завершаем упражнение
    if (nextIndex >= shuffledVerbs.length) {
      setExerciseCompleted(true);
      handleExerciseCompletion();
    } else {
      setCurrentIndex(nextIndex);
      setOptionsOrder(generateOptions(shuffledVerbs[nextIndex]));
  
      // Анимация для появления новых опций
      Animated.timing(optionsContainerAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };
  

  useEffect(() => {
    if (exerciseCompleted) {
      handleExerciseCompletion();
    }
  }, [exerciseCompleted]);

  const handleConfirmExit = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MenuEs' }],
    });
  };

  const handleCancelExit = () => {
    setExitConfirmationVisible(false);
  };

  const [resizeMode, setResizeMode] = useState('contain');

  const handleResizeModeChange = (resizeMode) => {
    setResizeMode(resizeMode);
  };

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

  initializeExercise(language); // ← теперь вызываем общую функцию

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



  


  const calculateScore = () => {
    const totalAttempts = correctAnswers + incorrectAnswers;
    if (totalAttempts === 0) return 0;
    return totalAttempts > 0 ? ((correctAnswers / totalAttempts) * 100).toFixed(2) : 0;
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
          await updateStatistics('exercise1Es', currentScore);
        } catch (error) {
          console.error('Failed to update statistics:', error);
        }
      }, 500);
    }
  };

  const handleButton3Press = async () => {
    const exerciseId = 'exercise1Es';
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

  const [verbDetails, setVerbDetails] = useState({ hebrewtext: '', translit: '', russiantext: '' });

  const updateVerbDetails = (currentVerb, isGenderMan, showRussianText = false) => {
    if (!currentVerb) return;
  
    const matchedVerbs = verbs1RU.filter((verb) => verb.infinitive === currentVerb.hebrewVerb);
    if (matchedVerbs.length > 0) {
      const selectedVerb = matchedVerbs.find((verb) => verb.gender === (isGenderMan ? 'man' : 'woman'));
      if (selectedVerb) {
        setVerbDetails((prevDetails) => ({
          hebrewtext: selectedVerb.hebrewtext,
          translit: selectedVerb.translit,
          estext: showRussianText ? selectedVerb.estext : '',
          mp3: selectedVerb.mp3, // Добавляем mp3
        }));
  
        // Play both sounds before showing the Russian text
        playAudio(selectedVerb.mp3);
      } else {
        setVerbDetails({ hebrewtext: 'Глагол не найден', translit: '', russiantext: '', mp3: '' });
      }
    } else {
      setVerbDetails({ hebrewtext: 'Глагол не найден', translit: '', russiantext: '', mp3: '' });
    }
  };
  




const playAudio = async (audioFile) => {
  if (!autoPlaySounds) return; // Проверяем состояние перед воспроизведением

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
      console.log('Playing sound from sounds:', audioFile);
      await soundObject1.playAsync();
      soundObject1.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish && soundFile2 && autoPlaySounds) {
          await soundObject1.unloadAsync(); // Освобождаем память перед загрузкой следующего звука
          console.log('Loading second sound from soundsConj:', audioFile);
          await soundObject2.loadAsync(soundFile2);
          setTimeout(async () => {
            console.log('Playing sound from soundsConj:', audioFile);
            await soundObject2.playAsync();
            soundObject2.setOnPlaybackStatusUpdate((status) => {
              if (status.didJustFinish) {
                soundObject2.unloadAsync(); // Освобождаем память после завершения второго воспроизведения
              }
            });
          }, 1000); // Задержка перед воспроизведением второго звука
        } else {
          soundObject1.unloadAsync(); // Освобождаем память после первого воспроизведения, если нет второго звука
        }
      });
    } else if (soundFile2 && autoPlaySounds) {
      await soundObject2.loadAsync(soundFile2);
      console.log('Playing sound from soundsConj:', audioFile);
      setTimeout(async () => {
        await soundObject2.playAsync();
        soundObject2.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            soundObject2.unloadAsync(); // Освобождаем память после завершения второго воспроизведения
          }
        });
      }, 1000); // Задержка перед воспроизведением второго звука
    }
  } catch (error) {
    console.log('Error playing sound:', error);
    soundObject1.unloadAsync();
    soundObject2.unloadAsync(); // Попытка освободить ресурсы даже при ошибке
  }
}; 
  
  



  const [isGenderMan, setIsGenderMan] = useState(true);

  const handleGenderToggle = () => {
    setIsGenderMan((prev) => {
        const newIsGenderMan = !prev;
        updateVerbDetails(shuffledVerbs[currentIndex], newIsGenderMan, verbDetails.estext !== '');
        return newIsGenderMan;
    });
};

 return (
  <>
    {isVerbListVisible && (
      <VerbListModal
        visible={true}
        language={language}
        verbs={verbListForModal}
        onClose={() => setIsVerbListVisible(false)}
      />
    )}

    {!isVerbListVisible && (
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          {/* Ваша панель с кнопками */}
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

          {/* Прогресс и заголовок */}
          <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
            <View style={styles.textContainer}>
              <Text style={styles.prtext}maxFontSizeMultiplier={1.2}>
                        CORRECTO: {correctAnswers}
                        </Text>
                        <Text style={styles.prtext}maxFontSizeMultiplier={1.2}>
                        INCORRECTO: {incorrectAnswers}
                        </Text>
            </View>
            <View style={styles.remainingTasksContainer}>
              <Text style={styles.remainingTasksText} maxFontSizeMultiplier={1.2}>
                {shuffledVerbs.length - currentIndex}
              </Text>
            </View>
            <Animated.View style={[styles.percentContainer, { backgroundColor }]}>
              <Text style={styles.percentText} maxFontSizeMultiplier={1.2}>
                {progress > 0
                  ? (((correctAnswers / (correctAnswers + incorrectAnswers)) * 100).toFixed(2))
                  : 0}%
              </Text>
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}>
            <ProgressBar progress={progress} totalExercises={shuffledVerbs.length} />
          </Animated.View>

          <Animated.Text style={[styles.title, { opacity: fadeAnim }]}maxFontSizeMultiplier={1.2}>SELECCIONA LA TRADUCCIÓN</Animated.Text>

          {currentIndex < shuffledVerbs.length && !exerciseCompleted && (
            <VerbCard1
              verbData={shuffledVerbs[currentIndex]}
              options={optionsOrder}
              onAnswer={handleAnswer}
              soundEnabled={soundEnabled}
            />
          )}

          <VerbDetailsContainer
            verbDetails={verbDetails}
            showRussianText={verbDetails.estext !== ''}
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
                  ? (((correctAnswers / (correctAnswers + incorrectAnswers)) * 100).toFixed(2))
                  : 0
              }
              grade={grade}
              restartTask={resetExercise}
            />
          )}
        </View>
      </ScrollView>
    )}

    {/* Всегда монтируемые модалки */}
    <StatModal1Es
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

    <ExitConfirmationModal
      visible={exitConfirmationVisible}
      onCancel={handleCancelExit}
      onConfirm={handleConfirmExit}
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
  },
  logoImage: {
    width: 90,
    height: 90,
    marginLeft: 10  // Отступ слева для лого
  },
  buttonContainer: {
    flexDirection: 'row',
    marginRight: wp('2.5%'),
  },
  buttonImage: {
    width: 44,
    height: 44,
    marginLeft: 10  // Отступ между кнопками
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
    height: hp('8.5%'),
    padding: wp('3%'),
    backgroundColor: '#D1E3F1',
    marginBottom: hp('1%'),
    borderRadius: wp('2.5%'),
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: hp('0.25%'),
    },
    shadowOpacity: 0.25,
    shadowRadius: hp('0.5%'),
    elevation: 5,
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#152039',
    fontWeight: 'bold',
  },
  nextButton: {
    width: '80%',
    padding: hp('1.5%'),
    backgroundColor: '#2B3270',
    borderRadius: wp('2.5%'),
    textAlign: 'center',
    marginBottom: 20,
    shadowColor: "#000",
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
    width: "100%",
    
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
    shadowColor: "#000",
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
    // fontSize: wp('4,5%'),
    color: '#FFFDEF',
    fontWeight: 'bold',
    marginBottom: hp('-0.5%'),
  },
  verbDetailsTranslit: {
    fontSize: 15,
    // fontSize: wp('3,5%'),
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
    fontSize: 16,
    // fontSize: wp('3,5%'),
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

export default Exercise1Es;