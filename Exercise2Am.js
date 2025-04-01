import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Image, BackHandler } from 'react-native';
import VerbCard2 from './VerbCard2Am';
import verbsData from './verbs2.json';
import verbs1RU from './verbs11RU.json'; // Подключаем данные
import ProgressBar from './ProgressBar';
import CompletionMessageAm from './CompletionMessageAm';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ExitConfirmationModal from './ExitConfirmationModalAm';
import { Audio } from 'expo-av';
import sounds from './Soundss';
import soundsConj from './soundconj'; // Импорт дополнительных звуков
import { Animated } from 'react-native';
import TaskDescriptionModal2 from './TaskDescriptionModal2Am';
import StatModal2Am from './StatModal2Am';
import { updateStatistics, getStatistics } from './stat';
import LottieView from 'lottie-react-native';
import animation from './assets/Animation - 1723020554284.json';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const shuffleArray = (array) => {
  const shuffledArray = array.slice();
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray.slice(0, 18);
};

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

const VerbDetailsContainer2 = ({ verbDetails, handleSpeakerPress, currentIndex, animateRight, isAnswered, canShowSpeaker }) => {
  const leftFillAnim = useRef(new Animated.Value(0)).current;
  const rightFillAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);
  const [isTextVisible, setIsTextVisible] = useState(false);

  // Анимация левой половины при смене опций (каждый раз при смене currentIndex)
  useEffect(() => {
      leftFillAnim.setValue(0);
      setIsTextVisible(false); // Скрываем текст перед началом анимации

      Animated.timing(leftFillAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
      }).start(() => {
          setIsTextVisible(true); // Показываем текст после завершения анимации
      });

      // Запускаем Lottie анимацию при каждом обновлении currentIndex
      if (animationRef.current) {
          animationRef.current.reset();
          animationRef.current.play();
      }
  }, [currentIndex]);

  // Сбрасываем цвет правой половины при генерации новых опций
  useEffect(() => {
      rightFillAnim.setValue(0);
  }, [currentIndex]);

  // Остановка Lottie анимации после того, как пользователь дал ответ
  useEffect(() => {
      if (isAnswered && animationRef.current) {
          animationRef.current.reset(); // Сбрасываем анимацию
      }

      return () => {
        if (animationRef.current) {
          animationRef.current.reset(); // сбрасываем анимацию
        }
      };
  }, [isAnswered]);

  // Анимация правой половины после ответаs
  useEffect(() => {
      if (animateRight) {
          setTimeout(() => {
              Animated.timing(rightFillAnim, {
                  toValue: 1,
                  duration: 1000, // Увеличиваем продолжительность
                  useNativeDriver: false,
              }).start();
          }, 500); // Задержка перед анимацией в миллисекундах (500 мс)
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
                  <Text style={styles.verbDetailsRussian} maxFontSizeMultiplier={1.2}>{verbDetails.amtext}</Text>
              </View>
              <View style={styles.verbDetailsRightContent}>
                  {isAnswered ? (
                      <>
                          <Text style={styles.verbDetailsHebrew} maxFontSizeMultiplier={1.2}>{verbDetails.hebrewtext}</Text>
                          {verbDetails.translit && (
                              <Text style={styles.verbDetailsTranslit} maxFontSizeMultiplier={1.2}>
                                  {verbDetails.translit}
                              </Text>
                          )}
                          {isTextVisible && canShowSpeaker && verbDetails.mp3 && (
                              <TouchableOpacity style={styles.speakerButton} onPress={() => handleSpeakerPress(verbDetails.mp3)}>
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
  const grade = getGrade((correctAnswers / progress) * 100);
  const [correctSound, setCorrectSound] = useState();
  const [incorrectSound, setIncorrectSound] = useState();
  const backgroundColorAnim = useRef(new Animated.Value(0)).current;
  const optionsAnim = useRef(new Animated.Value(-500)).current;
  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const animationRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [verbDetails, setVerbDetails] = useState({ hebrewtext: '', translit: '', amtext: '' });
  const [triggerRightAnimation, setTriggerRightAnimation] = useState(false);
  const [isSecondSoundFinished, setIsSecondSoundFinished] = useState(false);
  const [canShowSpeaker, setCanShowSpeaker] = useState(false);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  const [showLottie, setShowLottie] = useState(false);
  const [isPlayingLottieOnSpeaker, setIsPlayingLottieOnSpeaker] = useState(false);

  
  

  const toggleDescriptionModal = () => {
    setDescriptionModalVisible(prev => !prev);
  };

  const handleButton2Press = () => {
    toggleDescriptionModal();
  };

  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
    setAutoPlayEnabled(!autoPlayEnabled);
  
    if (correctSound && incorrectSound) {
      const newVolume = !soundEnabled ? 1 : 0;
      correctSound.setVolumeAsync(newVolume);
      incorrectSound.setVolumeAsync(newVolume);
    }

    // Если второй звук создан с помощью другого объекта:
    if (soundObject2) {
      soundObject2.setVolumeAsync(newVolume);
    }
};

  const [isGenderMan, setIsGenderMan] = useState(true);

  const handleGenderToggle = () => {
    setIsGenderMan(!isGenderMan);
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

  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const animateOptions = () => {
    Animated.timing(optionsAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

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

  const navigation = useNavigation();
  
    const navigateToMenu = () => {
      console.log('Navigating to MenuEn, current state:', navigation.getState());
      navigation.reset({
        index: 0,
        routes: [{ name: 'MenuAm' }],
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

    if (correctSound && incorrectSound) {
      updateVolume();
    }
  }, [soundEnabled, correctSound, incorrectSound]);

  const updateVerbDetails2 = (currentVerb, showHebrewText = false) => {
    if (!currentVerb) return;

    const matchedVerbs = verbs1RU.filter((verb) => verb.russian === currentVerb.verbRussian);
    if (matchedVerbs.length > 0) {
      const selectedVerb = isGenderMan ? matchedVerbs[0] : matchedVerbs[1];
      setVerbDetails({
        hebrewtext: showHebrewText ? selectedVerb.hebrewtext : '',
        translit: showHebrewText ? selectedVerb.translit : '',
        amtext: selectedVerb.amtext,
        mp3: selectedVerb.mp3,
      });
    } else {
      setVerbDetails({ hebrewtext: '', translit: '', amtext: 'ግሱ አልተገኘም', mp3: '' });
    }
  };

  useEffect(() => {
    if (shuffledVerbs.length > 0) {
      updateVerbDetails2(shuffledVerbs[currentIndex], showNextButton);
    }
  }, [isGenderMan, currentIndex, shuffledVerbs]);

  // useEffect(() => {
  //   const soundObjects = [];

  //   const loadSounds = async () => {
  //     try {
  //       const correctSoundObject = new Audio.Sound();
  //       const incorrectSoundObject = new Audio.Sound();

  //       await correctSoundObject.loadAsync(require('./assets/sounds/success.mp3'));
  //       await incorrectSoundObject.loadAsync(require('./assets/sounds/failure.mp3'));

  //       soundObjects.push(correctSoundObject, incorrectSoundObject);

  //       setCorrectSound(correctSoundObject);
  //       setIncorrectSound(incorrectSoundObject);
  //     } catch (error) {
  //       console.error('Failed to load sounds', error);
  //     }
  //   };

  //   loadSounds();

  //   return () => {
  //     soundObjects.forEach(async (soundObject) => {
  //       try {
  //         await soundObject.unloadAsync();
  //       } catch (error) {
  //         console.error('Failed to unload sound', error);
  //       }
  //     });
  //   };
  // }, []);

  useEffect(() => {
    const loadSounds = async () => {
      try {
        const correctSoundObject = new Audio.Sound();
        const incorrectSoundObject = new Audio.Sound();
  
        await correctSoundObject.loadAsync(require('./assets/sounds/success.mp3'));
        await incorrectSoundObject.loadAsync(require('./assets/sounds/failure.mp3'));
  
        setCorrectSound(correctSoundObject);
        setIncorrectSound(incorrectSoundObject);
  
        if (soundEnabled) {
          await correctSoundObject.setVolumeAsync(1);
          await incorrectSoundObject.setVolumeAsync(1);
        } else {
          await correctSoundObject.setVolumeAsync(0);
          await incorrectSoundObject.setVolumeAsync(0);
        }
      } catch (error) {
        console.error('Ошибка загрузки звуков:', error);
      }
    };
  
    loadSounds();
  
    return () => {
      correctSound?.unloadAsync();
      incorrectSound?.unloadAsync();
    };
  }, [soundEnabled]);

  const handleSpeakerPress = async (audioFile) => {
    if (!audioFile) {
        console.error("Audio file is undefined.");
        return;
    }

    const soundFile = soundsConj[audioFile.replace('.mp3', '')];
    if (!soundFile) {
        console.error(`Audio file ${audioFile} not found in soundsConj.`);
        return;
    }

    const soundObject = new Audio.Sound();
    try {
        setIsSoundPlaying(true); // Включаем анимацию перед началом воспроизведения
        if (animationRef.current) {
            animationRef.current.reset();
            animationRef.current.play();
        }

        await soundObject.loadAsync(soundFile);
        await soundObject.playAsync();
        soundObject.setOnPlaybackStatusUpdate(async (status) => {
            if (status.didJustFinish) {
                await soundObject.unloadAsync(); // Освобождаем память после завершения воспроизведения
                setIsSoundPlaying(false); // Останавливаем анимацию после завершения звука
            }
        });
    } catch (error) {
        console.log('Error playing sound:', error);
        await soundObject.unloadAsync(); // Освобождаем память даже при ошибке
        setIsSoundPlaying(false); // Останавливаем анимацию при ошибке
    }
};

const playSound = async (audioFileName, forcePlay = false) => {
  if (!soundEnabled && !forcePlay) return;

  const audioFile = sounds[audioFileName.replace('.mp3', '')];
  if (audioFile) {
    const soundObject = new Audio.Sound();
    try {
      setIsPlayingLottieOnSpeaker(true); // Включаем анимацию

      await soundObject.loadAsync(audioFile);
      await soundObject.playAsync();

      setTimeout(() => {
        setIsPlayingLottieOnSpeaker(false); // Останавливаем анимацию через 1 секунду
      }, 800); // Время анимации 1 секунда

      soundObject.setOnPlaybackStatusUpdate(async (playbackStatus) => {
        if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
          await soundObject.unloadAsync(); // Освобождаем ресурсы после воспроизведения
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("Ошибка при воспроизведении звука:", error);
      await soundObject.unloadAsync(); // Освобождаем ресурсы при ошибке
      setIsPlaying(false);
    }
  } else {
    console.error(`Аудиофайл ${audioFileName} не найден в объекте sounds.`);
    setIsPlaying(false);
  }
};


  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);

  const [animateRight, setAnimateRight] = useState(false);

  const [isAnswered, setIsAnswered] = useState(false);

  const [isTextVisible , setisTextVisible] = useState(false);


//   const handleAnswer = async (selectedOptionIndex) => {
//     setSelectedOptionIndex(selectedOptionIndex);
//     setAnimateRight(false); // Сброс анимации перед новым ответом
//     setIsSecondSoundFinished(false); // Сбрасываем состояние перед началом ответа
//     setIsAnswered(true);
//     setCanShowSpeaker(false); // Скрываем спикер перед началом выполнения действий
//     setShowLottie(true); // Показываем анимацию сразу после ответа

//     const isCorrect = optionsOrder[selectedOptionIndex].isCorrect;

//     const updatedOptions = optionsOrder.map((option, index) => ({
//         ...option,
//         isSelected: index === selectedOptionIndex,
//         disabled: true,
//     }));

//     setOptionsOrder(updatedOptions);

//     changeBackgroundColor(isCorrect);

//     if (isCorrect) {
//         setCorrectAnswers(prevCorrectAnswers => prevCorrectAnswers + 1);
//     } else {
//         setIncorrectAnswers(prevIncorrectAnswers => prevIncorrectAnswers + 1);
//     }

//     setProgress(prevProgress => prevProgress + 1);

//     try {
//         const firstSoundFile = shuffledVerbs[currentIndex].audioFile.replace('.mp3', '');
//         await playSound(firstSoundFile);

//         // Запускаем анимацию правой половины после завершения первого звука
//         setAnimateRight(true);

//         // Отключаем анимацию через 1 секунду после начала
//         setTimeout(() => {
//           setShowLottie(false);
//       }, 800);

//         await new Promise(resolve => setTimeout(resolve, 700));
//         await playSecondSound();
//         setIsSecondSoundFinished(true); // Устанавливаем флаг завершения второго звука

//         // Устанавливаем флаг для отображения спикера только после завершения всех действий
//         setCanShowSpeaker(true);
//     } catch (error) {
//         console.error("Error during sound playback:", error);
//     }

//     updateVerbDetails2(shuffledVerbs[currentIndex], true);
//     setShowNextButton(true);
// };

const handleAnswer = async (selectedOptionIndex) => {
  setSelectedOptionIndex(selectedOptionIndex);
  setAnimateRight(false);
  setIsAnswered(true);
  setCanShowSpeaker(false);
  setShowLottie(true);

  const isCorrect = optionsOrder[selectedOptionIndex].isCorrect;

  const updatedOptions = optionsOrder.map((option, index) => ({
    ...option,
    isSelected: index === selectedOptionIndex,
    disabled: true,
  }));

  setOptionsOrder(updatedOptions);
  changeBackgroundColor(isCorrect);

  if (isCorrect) {
    setCorrectAnswers(prevCorrectAnswers => prevCorrectAnswers + 1);
    // Воспроизведение звука правильного ответа
    try {
      await correctSound?.replayAsync();
    } catch (error) {
      console.error('Ошибка воспроизведения звука правильного ответа:', error);
    }
  } else {
    setIncorrectAnswers(prevIncorrectAnswers => prevIncorrectAnswers + 1);
    // Воспроизведение звука неправильного ответа
    try {
      await incorrectSound?.replayAsync();
    } catch (error) {
      console.error('Ошибка воспроизведения звука неправильного ответа:', error);
    }
  }

  setProgress(prevProgress => prevProgress + 1);

  try {
    const firstSoundFile = shuffledVerbs[currentIndex].audioFile.replace('.mp3', '');
    await playSound(firstSoundFile);

    setAnimateRight(true);

    setTimeout(() => {
      setShowLottie(false);
    }, 800);

    await new Promise(resolve => setTimeout(resolve, 700));
    await playSecondSound();
    setIsSecondSoundFinished(true);
    setCanShowSpeaker(true);
  } catch (error) {
    console.error('Ошибка при воспроизведении звуков:', error);
  }

  updateVerbDetails2(shuffledVerbs[currentIndex], true);
  setShowNextButton(true);
};

  


  const handleNextCard = () => {
    resetState();
    setAnimateRight(false); // Сброс анимации правой половины перед генерацией новых опций
    setSelectedOptionIndex(null);
    const nextIndex = (currentIndex + 1) % shuffledVerbs.length;

    if (nextIndex === 0) {
      if (exerciseCompleted) {
        setCorrectAnswers(0);
        setIncorrectAnswers(0);
        setProgress(0);
      }
      setExerciseCompleted(true);
      handleExerciseCompletion();
    } else {
      setExerciseCompleted(false);
    }

    setOptionsOrder(generateOptions(shuffledVerbs[nextIndex]).map(option => ({
      ...option,
      disabled: false,
      isSelected: false,
    })));

    setCurrentIndex(nextIndex);
  };

  const [soundObject2, setSoundObject2] = useState(null);

  const playSecondSound = async () => {
  const audioFile = verbDetails.mp3;
  if (!audioFile) {
    console.error("Audio file is undefined.");
    return;
  }

  try {
    const secondSoundFile = soundsConj[audioFile.replace('.mp3', '')];
    if (!secondSoundFile) {
      console.error(`Second sound file not found for: ${audioFile}`);
      return;
    }

    const soundObject2 = new Audio.Sound(); // Создаем новый объект для второго звука
    console.log("Loading second sound...");
    await soundObject2.loadAsync(secondSoundFile);
    console.log("Playing second sound...");
    
    // Проверяем, включен ли звук
    if (!soundEnabled) {
      console.log("Sound is muted, stopping second sound.");
      await soundObject2.stopAsync();
      await soundObject2.unloadAsync(); // Убираем второй звук
      return;
    }

    await soundObject2.playAsync(); // Воспроизводим второй звук

    soundObject2.setOnPlaybackStatusUpdate(async (status) => {
      if (status.didJustFinish) {
        console.log("Second sound finished, unloading...");
        await soundObject2.unloadAsync(); // Освобождаем ресурсы после второго звука
      }
    });
  } catch (error) {
    console.error("Error during second sound playback:", error);
  }
};

  const resetState = () => {
    setShowNextButton(false);
    setOptionsOrder([]);
    setSelectedOptionIndex(null); // Сброс состояния выбранной опции
    setIsSecondSoundFinished(false);
    setIsAnswered(false); // Сброс состояния флага ответа
    setisTextVisible (false); // Сброс состояния флага ответа
    // Сброс других состояний, если необходимо
  };

  useEffect(() => {
    setShuffledVerbs(shuffleArray(verbsData));
  }, []);

  useEffect(() => {
    if (shuffledVerbs.length > 0) {
      setOptionsOrder(generateOptions(shuffledVerbs[currentIndex]).map(option => ({
        ...option,
        isSelected: false, // Сбрасываем состояние выбора
      })));
    }
  }, [currentIndex, shuffledVerbs]);

  useEffect(() => {
    if (exerciseCompleted) {
      const percentage = (correctAnswers / (correctAnswers + incorrectAnswers)) * 100;
      const newGrade = getGrade(percentage);
      setCurrentGrade(newGrade);
      handleExerciseCompletion();
    }
  }, [exerciseCompleted, correctAnswers, incorrectAnswers]);

  const generateOptions = (verbData) => {
    const correctAnswerIndex = verbData.verbHebrewOptions.findIndex((option) => option.isCorrect);
    const correctTranslation = verbData.verbHebrewOptions[correctAnswerIndex]?.text;
    const transliteration = verbData.verbHebrewOptions[correctAnswerIndex]?.transliteration;

    if (!correctTranslation) {
      console.log(`Ошибка: У глагола "${verbData.verbRussian}" отсутствует правильный перевод.`);
    }

    const incorrectOptions = verbData.verbHebrewOptions.filter(
      (_, index) => index !== correctAnswerIndex
    );

    const shuffledOptions = shuffleArray(
      incorrectOptions.map((option, index) => {
        if (!option.text) {
          console.log(`Ошибка: У глагола "${verbData.verbRussian}" отсутствует текст у одного из вариантов.`);
        }
        return {
          text: option.text,
          transliteration: option.transliteration,
          isCorrect: false,
          isSelected: false,
          isHighlighted: false,
          index,
        };
      })
    );

    shuffledOptions.splice(
      Math.floor(Math.random() * (shuffledOptions.length + 1)),
      0,
      {
        text: correctTranslation,
        transliteration: transliteration,
        isCorrect: true,
        isSelected: false,
        isHighlighted: false,
        index: shuffledOptions.length,
      }
    );

    return shuffledOptions;
  };

  const handleConfirmExit = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MenuAm' }],
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

    const newShuffledVerbs = shuffleArray(verbsData);
    setShuffledVerbs(newShuffledVerbs);
    setCurrentIndex(0);

    console.log("Exercise has been reset and restarted.");
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
          await updateStatistics('exercise2Am', currentScore);
        } catch (error) {
          console.error('Failed to update statistics:', error);
        }
      }, 500);
    }
  };

  const SpeakerButton = ({ onPress }) => (
    <TouchableOpacity
      style={styles.speakerIconContainer}
      onPress={onPress}
    >
      <Image
        source={require('./speaker1.png')}
        style={styles.speakerIcon}
      />
    </TouchableOpacity>
  );

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

  return (
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
              <StatModal2Am
                visible={isStatModalVisible}
                onToggle={() => setIsStatModalVisible(false)}
                statistics={statistics}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleButton2Press}>
              <Animated.Image
                source={require('./question.png')}
                style={[styles.buttonImage, { opacity: fadeAnim }]}
              />
              <TaskDescriptionModal2
                visible={isDescriptionModalVisible}
                onToggle={toggleDescriptionModal}
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

        <Animated.View style={[styles.progressContainer, { resizeMode }, { opacity: fadeAnim }]}>
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

          <Animated.View style={[styles.percentContainer, { backgroundColor, borderRadius: 10 }]}>
            <Text style={styles.percentText} maxFontSizeMultiplier={1.2}>
              {progress > 0 ? (((correctAnswers / (correctAnswers + incorrectAnswers))) * 100).toFixed(2) : 0}%
            </Text>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}>
          <ProgressBar progress={progress} totalExercises={shuffledVerbs.length} />
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>ይምረጡ ትርጉም</Animated.Text>

        {currentIndex < shuffledVerbs.length && (
          <VerbCard2 verbData={shuffledVerbs[currentIndex]} options={optionsOrder} onAnswer={handleAnswer} />
        )}

        <VerbDetailsContainer2
          verbDetails={verbDetails}
          handleSpeakerPress={handleSpeakerPress}
          currentIndex={currentIndex} // Убедитесь, что currentIndex передается правильно
          animateRight={animateRight}
          isSecondSoundFinished={isSecondSoundFinished}
          isAnswered={isAnswered}
          isTextVisible={isTextVisible}
          canShowSpeaker={canShowSpeaker} 
        />

<Animated.View
    style={[
        styles.optionsContainer,
        {
            transform: [{ translateX: optionsAnim }]
        }
    ]}
>
    {optionsOrder.map((option, index) => (
        <TouchableOpacity
            key={index}
            style={[
                styles.optionButton,
                option.isSelected
                    ? (option.isCorrect ? styles.correctOption : styles.incorrectOption)
                    : (selectedOptionIndex !== null && option.isCorrect ? styles.correctOption : null)
            ]}
            onPress={() => handleAnswer(index)}
            disabled={showNextButton || option.disabled}
        >
            <View style={styles.optionContent}>
                <Text style={styles.optionText} maxFontSizeMultiplier={1.2}>{option.text}</Text>
                <Text style={styles.transliterationText} maxFontSizeMultiplier={1.2}>{option.transliteration}</Text>

                {/* Анимация при нажатии на спикер */}
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

                {/* Отображение спикера */}
                {showNextButton && option.isCorrect && (
                    <TouchableOpacity
                        style={styles.speakerIconContainer}
                        onPress={() => playSound(shuffledVerbs[currentIndex].audioFile, true)}
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
          style={[styles.nextButton, showNextButton ? styles.activeButton : styles.inactiveButton]}
          onPress={handleNextCard}
          disabled={!showNextButton}
        >
          <Text style={styles.nextButtonText} maxFontSizeMultiplier={1.2}>ቀጣዩ ግስ</Text>
        </TouchableOpacity>

        {exerciseCompleted && (
          <CompletionMessageAm
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

        <ExitConfirmationModal
          visible={exitConfirmationVisible}
          onCancel={handleCancelExit}
          onConfirm={handleConfirmExit}
        />
      </View>
    </ScrollView>
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative', // add this line
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
    shadowColor: "#000",
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
    width: "100%",
    marginBottom: 10
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
    bottom: -8, // позиция в нижнем углу
    right: -8, // позиция в правом углу
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
    shadowColor: "#000",
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
