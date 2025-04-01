import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, BackHandler, Image } from 'react-native';
import VerbCard5 from './VerbCard5Ar';
import verbsData from './verbimperArAm.json';
import ProgressBar from './ProgressBar';
import { useNavigation } from '@react-navigation/native';
import CompletionMessageAr from './CompletionMessageAr';
import ExitConfirmationModalAr from './ExitConfirmationModalAr';
import { Audio } from 'expo-av';
import sounds from './soundsimper';
import { Animated } from 'react-native';
import TaskDescriptionModal5 from './TaskDescriptionModal5';
import StatModal5Ar from './StatModal5Ar';
import { updateStatistics, getStatistics } from './stat';
import LottieView from 'lottie-react-native';
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
      return 'استثنائي! لا تشوبه شائبة! لم ترتكب أي خطأ!';
    } else if (percentage >= 90) {
      return 'ممتاز! تقريبا مثالي، واصل العمل الرائع!';
    } else if (percentage >= 80) {
      return 'رائع! أنت تقوم بعمل جيد جدًا!';
    } else if (percentage >= 70) {
      return 'جيد! لقد تعلمت المادة بشكل جيد!';
    } else if (percentage >= 60) {
      return 'جيد إلى حد ما! هناك تقدم مستمر!';
    } else if (percentage >= 50) {
      return 'ليس سيئًا! ولكن هناك مجال للتحسن.';
    } else if (percentage >= 40) {
      return 'مرضٍ! استمر في العمل وستنجح!';
    } else if (percentage >= 30) {
      return 'لقد بدأت تفهم الموضوع، واصل العمل!';
    } else if (percentage >= 20) {
      return 'حاول تغيير استراتيجية التعلم، قد يساعد ذلك!';
    } else if (percentage >= 10) {
      return 'إنه صعب، ولكن لا تستسلم! استمر في الممارسة.';
    } else {
      return 'هناك حاجة إلى عمل جاد! من المهم ألا تستسلم وتستمر في التعلم.';
    }
};

const Exercise5Ar = ({ navigation }) => {
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
  const animationRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnimationActive, setIsAnimationActive] = useState(false);
  const [showSpeaker, setShowSpeaker] = useState(false); // Для отображения спикера
const [correctOptionSound, setCorrectOptionSound] = useState(null); // Звук правильного ответа

  const toggleDescriptionModal = () => {
    setDescriptionModalVisible(prev => !prev);
  };

  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);

  const handleButton2Press = () => {
    toggleDescriptionModal();
  };

  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleSoundToggle = async () => {
    setSoundEnabled(prevState => !prevState);
  
    // Останавливаем и сбрасываем звуки и анимации при отключении звука
    if (feedbackSound) {
      await feedbackSound.stopAsync();
      await feedbackSound.unloadAsync();
      setFeedbackSound(null);
    }
  
    if (optionSound) {
      await optionSound.stopAsync();
      await optionSound.unloadAsync();
      setOptionSound(null);
    }
  
    // Сбрасываем анимацию при отключении звука
    setIsAnimationActive(false); 
    animationRef.current?.reset();
  };
  

const playFeedbackSound = async (isCorrect) => {
  if (!soundEnabled) return; // Если звук выключен, не воспроизводим

  try {
    const sound = isCorrect ? correctSound : incorrectSound;
    setFeedbackSound(sound); // Сохраняем звук
    await sound.replayAsync();
  } catch (error) {
    console.error('Error playing feedback sound', error);
  }
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
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };
  
  useEffect(() => {
    fadeIn();
  }, []);

  const optionsAnim = useRef(new Animated.Value(-500)).current;

  useEffect(() => {
    Animated.timing(optionsAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);

  const handleNextCard = () => {
    optionsAnim.setValue(-500);

    // Сбрасываем блокировку кнопок
  setIsDisabled(false);

  // if (correctSound) correctSound.unloadAsync();
  // if (incorrectSound) incorrectSound.unloadAsync();

    setShowNextButton(false);
    setCurrentIndex((prevIndex) => (prevIndex < shuffledVerbs.length - 1 ? prevIndex + 1 : 0));
    
    if (currentIndex === shuffledVerbs.length - 1) {
      setExerciseCompleted(true);
      handleExerciseCompletion();
    } else {
      setOptionsOrder(generateOptions(shuffledVerbs[currentIndex + 1]));
    }
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

  const navigateToMenu = () => {
    navigation.navigate('MenuAr');
  };
  const handleBackButtonPress = () => {
    setExitConfirmationVisible(true);
    return true;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackButtonPress
    );
  
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    setShuffledVerbs(shuffleArray(verbsData));
  }, []);

  useEffect(() => {
    if (shuffledVerbs.length > 0) {
      setOptionsOrder(generateOptions(shuffledVerbs[currentIndex]));
    }
  }, [currentIndex, shuffledVerbs]);



  const generateOptions = (verbData) => {
    console.log('verbData:', verbData);
  
    if (!verbData || !verbData.translationOptions || !verbData.mp4 || !verbData.mp3) {
      console.error('Missing data in verbData:', verbData);
      return [];
    }
  
    const correctAnswerIndex = parseInt(verbData.correctTranslationIndex, 10);
    const correctTranslation = verbData.translationOptions[correctAnswerIndex];
    const correctMp4 = verbData.mp4[correctAnswerIndex] || '';
  
    // Фильтрация неправильных опций
    let incorrectOptions = verbData.translationOptions.filter(
      (_, index) => index !== correctAnswerIndex
    );
    let incorrectMp4Options = verbData.mp4.filter(
      (_, index) => index !== correctAnswerIndex
    );
  
    console.log('incorrectOptions:', incorrectOptions);
    console.log('incorrectMp4Options:', incorrectMp4Options);
  
    // Генерация неправильных опций с проверками на наличие данных
    let shuffledIncorrectOptions = shuffleArray(
      incorrectOptions.map((option, index) => ({
        text: option,
        mp4Text: incorrectMp4Options[index] || 'Нет данных',
        isCorrect: false,
        isSelected: false,
        mp3: verbData.mp3 || '',
        index: index // Обеспечиваем уникальные индексы
      }))
    ).slice(0, 3); // Ограничение до 3 неправильных вариантов
  
    console.log('shuffledIncorrectOptions:', shuffledIncorrectOptions);
  
    // Добавляем правильный вариант с уникальным индексом
    let options = [
      ...shuffledIncorrectOptions,
      {
        text: correctTranslation,
        mp4Text: correctMp4,
        isCorrect: true,
        isSelected: false,
        mp3: verbData.mp3 || '',
        index: shuffledIncorrectOptions.length // Уникальный индекс для правильного варианта
      }
    ];
  
    console.log('options before deduplication:', options);
  
    // Удаление дубликатов на основе текста
    options = options.filter(
      (option, index, self) =>
        index === self.findIndex((o) => o.text === option.text)
    );
  
    console.log('options after removing duplicates:', options);
  
    // Если опций меньше 4, добавляем недостающие опции
    while (options.length < 4) {
      const remainingIncorrect = incorrectOptions.filter(
        option => !options.some(opt => opt.text === option)
      );
  
      if (remainingIncorrect.length > 0) {
        const nextOption = remainingIncorrect[0];
        options.push({
          text: nextOption,
          mp4Text: verbData.mp4[incorrectOptions.indexOf(nextOption)] || 'Нет данных',
          isCorrect: false,
          isSelected: false,
          mp3: verbData.mp3 || '',
          index: options.length // Обеспечиваем уникальный индекс
        });
      } else {
        break; // Если не осталось неправильных вариантов, выходим из цикла
      }
    }
  
    console.log('Final options before shuffle:', options);
  
    // Перемешиваем финальные 4 опции
    return shuffleArray(options);
  };
  
  

  
  

  useEffect(() => {
    async function loadSounds() {
      const correctSoundObject = new Audio.Sound();
      const incorrectSoundObject = new Audio.Sound();
      try {
        await correctSoundObject.loadAsync(require('./assets/sounds/success.mp3'));
        await incorrectSoundObject.loadAsync(require('./assets/sounds/failure.mp3'), {
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
      animationRef.current?.reset(); // Сбрасываем анимацию
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
      const soundToPlay = isCorrect ? correctSound : incorrectSound;
      await soundToPlay.replayAsync();
    } catch (error) {
      console.log('Error playing sound', error);
    }
  };


  // useEffect(() => {
  //   // Сбрасываем предыдущие звуки при изменении выбранного варианта
  //   return () => {
  //     correctSound?.unloadAsync();
  //     incorrectSound?.unloadAsync();
  //   };
  // }, [optionsOrder]);


  const [currentPlayingSound, setCurrentPlayingSound] = useState(null); // Для отслеживания воспроизводимого звука

  const [feedbackSound, setFeedbackSound] = useState(null); // Звук правильности ответа
const [optionSound, setOptionSound] = useState(null); // Звук правильной опции
// const [soundEnabled, setSoundEnabled] = useState(true); // Флаг для включения/выключения звука

// const playAudio = async (audioFileName, shouldRespectSoundToggle = true) => {
//   try {
//     // Проверяем, нужно ли учитывать состояние soundEnabled
//     if (shouldRespectSoundToggle && !soundEnabled) {
//       setIsAnimationActive(false); // Останавливаем анимацию, если звук отключен
//       return;
//     }

//     const fileNameKey = audioFileName;
//     const audioFile = sounds[fileNameKey];

//     if (!audioFile) {
//       console.error(`Audio file ${fileNameKey} not found.`);
//       return null;
//     }

//     const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
//     setIsAnimationActive(true); // Включаем анимацию при воспроизведении звука

//     await newSound.playAsync();
    
//     // Когда звук заканчивается, выключаем анимацию и сбрасываем её
//     newSound.setOnPlaybackStatusUpdate((status) => {
//       if (status.didJustFinish) {
//         setIsAnimationActive(false); // Останавливаем анимацию после окончания звука
//         animationRef.current?.reset(); // Сбрасываем анимацию
//         await newSound.unloadAsync(); // Выгружаем аудио из памяти после завершения
//       }
//     });

//     return newSound;
//   } catch (error) {
//     console.error('Error loading sound', error);
//     setIsAnimationActive(false); // В случае ошибки анимацию также отключаем
//     animationRef.current?.reset(); // Сбрасываем анимацию при ошибке
//     return null;
//   }
// };

const playAudio = async (audioFileName, shouldRespectSoundToggle = true) => {
  try {
    // Проверяем, нужно ли учитывать состояние soundEnabled
    if (shouldRespectSoundToggle && !soundEnabled) {
      setIsAnimationActive(false); // Останавливаем анимацию, если звук отключен
      return;
    }

    const fileNameKey = audioFileName;
    const audioFile = sounds[fileNameKey];

    if (!audioFile) {
      console.error(`Audio file ${fileNameKey} not found.`);
      return null;
    }

    const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
    setIsAnimationActive(true); // Включаем анимацию при воспроизведении звука

    await newSound.playAsync();
    
    // Когда звук заканчивается, выключаем анимацию и выгружаем звук
    newSound.setOnPlaybackStatusUpdate(async (status) => {
      if (status.didJustFinish) {
        setIsAnimationActive(false); // Останавливаем анимацию после окончания звука
        animationRef.current?.reset(); // Сбрасываем анимацию
        await newSound.unloadAsync(); // Правильно выгружаем звук
      }
    });

    return newSound;
  } catch (error) {
    console.error('Error loading sound', error);
    setIsAnimationActive(false); // В случае ошибки анимацию также отключаем
    animationRef.current?.reset(); // Сбрасываем анимацию при ошибке
    return null;
  }
};



const [isDisabled, setIsDisabled] = useState(false); // Новое состояние для блокировки кнопок




const handleAnswer = (selectedOptionIndex) => {

  // Блокируем все кнопки
  setIsDisabled(true);

  const isCorrect = optionsOrder[selectedOptionIndex].isCorrect;

  // Обновляем правильный ответ
  const correctOption = optionsOrder.find(option => option.isCorrect);
  
  // Сохраняем звук правильного ответа
  setCorrectOptionSound(correctOption.mp3);

  // Отображаем кнопку спикера только после выбора правильного ответа
  setShowSpeaker(true);

  setOptionsOrder(prevOptions =>
    prevOptions.map((option, index) => ({
      ...option,
      isSelected: index === selectedOptionIndex,
      showCorrect: option.isCorrect,
    }))
  );

   
  // setShowNextButton(false);

  changeBackgroundColor(isCorrect);
  playFeedbackSound(isCorrect); // Воспроизводим звук правильности ответа

  if (isCorrect) {
    setCorrectAnswers(prevCorrectAnswers => prevCorrectAnswers + 1);
  } else {
    setIncorrectAnswers(prevIncorrectAnswers => prevIncorrectAnswers + 1);
  }

  setProgress(prevProgress => prevProgress + 1);

  // Воспроизведение звука правильного ответа
  if (soundEnabled) { 
    playAudio(correctOption.mp3, true) // true означает, что учитываем soundEnabled
      .then((soundObject) => {
        setIsAnimationActive(true); // Запускаем анимацию
        setTimeout(() => {
          setShowNextButton(true); // Активируем кнопку "Следующий"
        }, 1500); // Ждем окончания звука перед активацией
      })
      .catch((error) => {
        console.error('Error during sound playback:', error);
        setTimeout(() => {
          setShowNextButton(true);
        }, 300);
      });
  } else {
    setTimeout(() => {
      setShowNextButton(true);
    }, 300);
  }
};

// const handleSpeakerPress = () => {
//   // Воспроизведение звука при нажатии на спикер и запуск анимации
//   const correctOption = optionsOrder.find(option => option.isCorrect);

//   // Всегда запускаем анимацию, независимо от состояния звука
//   setIsAnimationActive(true); 

//   // Воспроизведение звука, игнорируя состояние soundEnabled
//   playAudio(correctOption.mp3, false) // Здесь false, чтобы всегда воспроизводить звук при нажатии на спикер
//     .then((soundObject) => {
//       // Обработка завершения звука, если необходимо
//     })
//     .catch((error) => {
//       console.error('Error during sound playback:', error);
//     });
// };

const handleSpeakerPress = (mp3) => {
  if (!mp3) {
    console.error('No audio file for this option');
    return;
  }

  playAudio(mp3, false) // Воспроизводим звук кнопки, игнорируя состояние soundEnabled
    .then((soundObject) => {
      // Дополнительные действия после воспроизведения, если нужно
    })
    .catch((error) => {
      console.error('Error during sound playback:', error);
    });
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
      console.log(`Current score before update: ${currentScore}`);
      
      setTimeout(async () => {
        try {
          await updateStatistics('exercise5Ar', currentScore);
          console.log("Statistics successfully updated.");
        } catch (error) {
          console.error("Failed to update statistics:", error);
        }
      }, 500);
    }
  };

  const handleButton3Press = async () => {
    const exerciseId = 'exercise5Ar';
    console.log(`Attempting to fetch statistics for ${exerciseId}`);
    try {
      const stats = await getStatistics(exerciseId);
      console.log(`Statistics for ${exerciseId}:`, stats);
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
            <StatModal5Ar
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
            <TaskDescriptionModal5
              visible={isDescriptionModalVisible}
              onToggle={toggleDescriptionModal}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
        <View style={styles.textContainer}>
          <Text style={styles.text}maxFontSizeMultiplier={1.2}>
          صحيح: {correctAnswers} 
          </Text>
          <Text style={styles.text}maxFontSizeMultiplier={1.2}>
          خطأ: {incorrectAnswers}
          </Text>
        </View>

        <View style={styles.remainingTasksContainer}>
          <Text style={styles.remainingTasksText}maxFontSizeMultiplier={1.2}>
            {shuffledVerbs.length - currentIndex}
          </Text>
        </View>

        <Animated.View style={[styles.percentContainer, { backgroundColor, borderRadius: 10 }]}>
          <Text style={styles.percentText}maxFontSizeMultiplier={1.2}>
            {progress > 0 ? (((correctAnswers / (correctAnswers + incorrectAnswers))) * 100).toFixed(2) : 0}%
          </Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}>
        <ProgressBar progress={progress} totalExercises={shuffledVerbs.length} />
      </Animated.View>

      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}maxFontSizeMultiplier={1.2}>اختر الترجمة</Animated.Text>

      {currentIndex < shuffledVerbs.length && (
        <VerbCard5
          verbData={shuffledVerbs[currentIndex]}
          options={optionsOrder}
          onAnswer={handleAnswer}
        />
      )}

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
          option.isSelected ? (option.isCorrect ? styles.correctOption : styles.incorrectOption) : null,
          option.showCorrect && option.isCorrect ? styles.correctOption : null,
        ]}
        onPress={() => handleAnswer(index)}
        // disabled={showNextButton} // Блокируем кнопки после выбора
        disabled={isDisabled} // Блокируем кнопки после выбора


      >
        <Text style={styles.optionText} maxFontSizeMultiplier={1.2}>{option.text}</Text>

        {option.isCorrect && option.showCorrect && (
          <>
            {/* Lottie Animation */}
            {isAnimationActive && (
              <LottieView
                ref={animationRef}
                source={require('./assets/Animation - 1718430107767.json')}
                autoPlay
                loop={false}
                style={styles.lottie}
                onAnimationFinish={() => setIsAnimationActive(false)} // Останавливаем анимацию после завершения
              />
            )}

            {/* Speaker Button */}
            {showSpeaker && (
              <TouchableOpacity
                style={styles.speakerButton} 
                // onPress={handleSpeakerPress}
                onPress={() => handleSpeakerPress(option.mp3)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}  // Увеличиваем область нажатия
              >
                <Image source={require('./speaker6.png')} style={styles.speakerIcon} />
              </TouchableOpacity>
            )}
          </>
        )}
        {/* Проверяем и отображаем транслитерацию (mp4Text) */}
      {option.mp4Text ? (
        <Text style={styles.mp4Text} maxFontSizeMultiplier={1.2}>
          {option.mp4Text}
        </Text>
      ) : (
        <Text style={styles.mp4Text} maxFontSizeMultiplier={1.2}>
          Нет данных mp4
        </Text>
      )}
      </TouchableOpacity>
    ))}
  </Animated.View>



<TouchableOpacity
  style={[styles.nextButton, showNextButton ? styles.activeButton : styles.inactiveButton]}
  onPress={handleNextCard}
  disabled={!showNextButton}
>
  <Text style={styles.nextButtonText} maxFontSizeMultiplier={1.2}>الفعل التالي</Text>
</TouchableOpacity>

      {exerciseCompleted && (
        <CompletionMessageAr
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

      <ExitConfirmationModalAr
        visible={exitConfirmationVisible}
        onCancel={() => setExitConfirmationVisible(false)}
        onConfirm={navigateToMenu}
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
    paddingBottom: 0,
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
    marginTop: 5,
    marginBottom: 10,
    color: '#2F4766',
  },
  nextButton: {
    width: '80%',
    // padding: 14,
    padding: hp('1.5%'),
    backgroundColor: '#2B3270',
    borderRadius: 10,
    textAlign: 'center',
    marginBottom: 15,
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
    marginBottom: 5
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#6C8EBB',
    borderRadius: 10,
    marginTop: 1,
    marginBottom: 10,
    shadowColor: "#000",
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
  text: {
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
    fontSize: 22,
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
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#83A3CD',
    borderRadius: 10,
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
  },
  completedMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2F4766',
    marginBottom: 10,
  },
  completeButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#2B3270',
    borderRadius: 10,
    textAlign: 'center',
    padding: 15,
  },
  
  
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 15,
    marginTop: 1,
  },
  optionButton: {
    width: '47%',
    height: 70,
    backgroundColor: '#D1E3F1',
    margin: 5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    position: 'relative',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionText: {
    fontSize: 22,
    color: '#152039',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  mp4Text: {
    position: 'absolute',
    bottom: 5,
    width: '100%',
    textAlign: 'center',
    color: '#CE6857',
    fontWeight: 'bold',
    fontSize: 15,
  },
  speakerIconContainer: {
    position: 'absolute',
    right: 10,
    bottom: 10,
  },
  speakerIcon: {
    width: 22,
    height: 22,
  },
  // lottieContainer: {
  //   position: 'absolute',
  //   top: 5,
  //   left: 5,
  //   width: 24,
  //   height: 24,
  // },
  // lottie: {
  //   width: 20,
  //   height: 20,
  // },
  speakerButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 20,
    height: 20,
  },
  speakerIcon: {
    width: '100%',
    height: '100%',
  },
  lottie: {
    width: 26,
    height: 26,
    position: 'absolute',
    top: 3,
    left: 3,
  },
});

export default Exercise5Ar;
