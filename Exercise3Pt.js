import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, BackHandler, Image  } from 'react-native';
import VerbCard3 from './VerbCard3Pt';
import verbsData from './verbs3.json';
import ProgressBar from './ProgressBar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import CompletionMessagePt from './CompletionMessagePt';
import ExitConfirmationModal from './ExitConfirmationModalPt';
import { Audio } from 'expo-av';
import { Animated } from 'react-native';
import TaskDescriptionModal6 from './TaskDescriptionModal3';
import StatModal3Pt from './StatModal3Pt';
import { updateStatistics, getStatistics } from './stat';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import verbs1RU from './verbs11RU.json'; // Assuming this file contains the data for verbs
import soundsConj from './soundconj'; // Импорт дополнительных звуков
import AsyncStorage from '@react-native-async-storage/async-storage';




const findFirstMatchingVerb = (infinitive) => {
  console.log('Filtering verbs by infinitive:', infinitive); // Логируем инфинитив для поиска
  const matchingVerbs = verbs1RU.filter(verb => {
    // console.log('Comparing verb.infinitive:', verb.infinitive);
    return verb.infinitive === infinitive;
  });
  return matchingVerbs.length > 0 ? matchingVerbs[0] : null;
};

const shuffleArray = (array) => {
  const shuffledArray = array.slice();
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray.slice(0, 15); // Возвращаем только первые 30 элементов
};

const getGrade = (percentage) => {
    if (percentage === 100) {
      return 'Exceptional! Flawless! You didn’t make a single mistake!';
    } else if (percentage >= 90) {
      return 'Excellent! Almost perfect, keep up the great work!';
    } else if (percentage >= 80) {
      return 'Great! You are doing very well!';
    } else if (percentage >= 70) {
      return 'Good! You’ve learned the material pretty well!';
    } else if (percentage >= 60) {
      return 'Fairly good! There is steady progress!';
    } else if (percentage >= 50) {
      return 'Not bad! But there’s room for improvement.';
    } else if (percentage >= 40) {
      return 'Satisfactory! Keep working and you’ll succeed!';
    } else if (percentage >= 30) {
      return 'You’re starting to get the hang of it, keep it up!';
    } else if (percentage >= 20) {
      return 'Try changing your learning strategy, it might help!';
    } else if (percentage >= 10) {
      return 'It’s tough, but don’t give up! Keep practicing.';
    } else {
      return 'Serious work is needed! It’s important not to give up and keep learning.';
    }
  };







const Exercise3Pt = ({ navigation }) => {
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
  const AnimatedView = Animated.createAnimatedComponent(View);
  const [currentInfinitive, setCurrentInfinitive] = useState(null);
  const [verbInfo, setVerbInfo] = useState(null);
  const [isGenderMan, setIsGenderMan] = useState(true);  // По умолчанию мужской
  const [isSoundBlocked, setIsSoundBlocked] = useState(false);

  const handleGenderToggle = () => {
    setIsGenderMan(prev => !prev);  // Переключаем состояние
  };

  const [language, setLanguage] = useState('pt'); // по умолчанию
  
 const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);

  const [dontShowAgain3, setDontShowAgain3] = useState(false);

  
  const [languageLoaded, setLanguageLoaded] = useState(false);

  useEffect(() => {
  const checkFlagAndLang = async () => {
    const hidden = await AsyncStorage.getItem('exercise3_description_hidden');
    const lang = await AsyncStorage.getItem('language');

    console.log('🌍 Language:', lang);
    console.log('🧪 Hide flag:', hidden);

    if (lang) {
      setLanguage(lang);

      setDontShowAgain3(hidden === 'true');
    setLanguageLoaded(true);

      if (hidden !== 'true') {
        setTimeout(() => {
          console.log('📢 Показываем модалку после загрузки языка');
          setDescriptionModalVisible(true);
        }, 100); // чуть больше времени
      }
    }

    setDontShowAgain3(hidden === 'true');
  };

  checkFlagAndLang();
}, []);

  const toggleDescriptionModal = () => {
    setDescriptionModalVisible(prev => {
      console.log("Toggling description modal from", prev, "to", !prev);
      return !prev;
    });
  };

  const handleToggleDontShowAgain3 = async () => {
    const newValue = !dontShowAgain3;
    setDontShowAgain3(newValue);
    await AsyncStorage.setItem('exercise3_description_hidden', newValue ? 'true' : '');
    console.log('📌 Клик по чекбоксу. Было:', dontShowAgain3, 'Станет:', !dontShowAgain3);
  }; 
  

  const handleButton2Press = () => {
    toggleDescriptionModal();
  };

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sound, setSound] = useState(null);
  
  const handleSoundToggle = () => {
    console.log("Current sound state before toggle:", soundEnabled);
    setSoundEnabled(!soundEnabled);
  };
  
  useEffect(() => {
    console.log("Sound enabled state has changed:", soundEnabled);
    if (soundEnabled && sound) {
      console.log("Enabling sound");
      sound.setVolumeAsync(1); // Устанавливаем громкость звука на максимум
    } else if (!soundEnabled && sound) {
      console.log("Muting sound");
      sound.setVolumeAsync(0); // Отключаем звук
    }
  }, [soundEnabled, sound]);

  useEffect(() => {
    if (currentInfinitive) {
      const foundVerb = findFirstMatchingVerb(currentInfinitive);
      if (foundVerb) {
        // console.log('Found verb:', foundVerb); // Логируем найденный глагол
        setVerbInfo((prevInfo) => ({ ...prevInfo })); // Принудительно обновляем состояние
      } else {
        console.log('No matching verb found for:', currentInfinitive);
      }
    }
  }, [currentInfinitive]);

  const handleVerbSelection = (infinitive) => {
    setCurrentInfinitive(infinitive);
  };
  

  const fadeAnim = useRef(new Animated.Value(0)).current; // Начальное значение - 0 (полностью прозрачный)

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,  // Конечное значение - 1 (полностью непрозрачный)
      duration: 1200,
      useNativeDriver: true
    }).start();
  };
  
  useEffect(() => {
    fadeIn();
  }, []); // Пустой массив зависимостей, эффект выполнится только при монтировании

  const changeBackgroundColor = (isCorrect) => {

    backgroundColorAnim.setValue(isCorrect ? 1 : 2); 

    Animated.timing(backgroundColorAnim, {
      toValue: isCorrect ? 1 : 2, // 1 для правильного ответа, 2 для неправильного
      duration: 300, // Продолжительность анимации
      useNativeDriver: false, // Необходимо для анимации свойств стилей, не связанных с трансформацией
    }).start(() => {
      // Возвращаем обратно к исходному цвету после кратковременной паузы
      setTimeout(() => {
        Animated.timing(backgroundColorAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }).start();
      }, 100); // Пауза перед возвращением к исходному цвету
    });
  };

  const backgroundColor = backgroundColorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['#83A3CD', '#AFFFCA', '#FFBCBC'], // Исходный цвет, зеленый для правильного, красный для неправильного
  });
  
  const navigateToMenu = () => {
        console.log('Navigating to MenuEn, current state:', navigation.getState());
        navigation.reset({
          index: 0,
          routes: [{ name: 'MenuPt' }],
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

    
    setShuffledVerbs(shuffleArray(verbsData));
  }, []);

  // useEffect(() => {
  //   if (shuffledVerbs.length > 0) {
  //     setOptionsOrder(generateOptions(shuffledVerbs[currentIndex]));
  //   }
  // }, [currentIndex, shuffledVerbs]);


  // Обновление глагола при изменении currentIndex
useEffect(() => {
  if (shuffledVerbs.length > 0 && currentIndex < shuffledVerbs.length) {
    const currentVerb = shuffledVerbs[currentIndex];
    const currentInfinitive = currentVerb.hebrewVerb;  // Используем правильный ключ "hebrewVerb"
    
    setCurrentInfinitive(currentInfinitive);  // Устанавливаем инфинитив
    
    // Найти глагол по инфинитиву и полу
    const foundVerbs = verbs1RU.filter(verb => verb.infinitive === currentInfinitive);
    const foundVerbByGender = foundVerbs.find(verb => verb.gender === (isGenderMan ? 'man' : 'woman'));

    if (foundVerbByGender) {
      setVerbInfo(foundVerbByGender);  // Обновляем информацию о глаголе
    } else {
      setVerbInfo(null);  // Если не найдено, сбрасываем данные
    }

    // Обновление опций должно происходить только при изменении currentIndex
    setOptionsOrder(generateOptions(currentVerb));
  }
}, [currentIndex, shuffledVerbs]);

// Обновление пола (без перемешивания опций)
useEffect(() => {
  if (currentInfinitive) {
    const foundVerbs = verbs1RU.filter(verb => verb.infinitive === currentInfinitive);
    const foundVerbByGender = foundVerbs.find(verb => verb.gender === (isGenderMan ? 'man' : 'woman'));

    if (foundVerbByGender) {
      setVerbInfo(foundVerbByGender);  // Обновляем информацию о глаголе
    } else {
      setVerbInfo(null);  // Если не найдено, сбрасываем данные
    }
  }
}, [isGenderMan]);  // Этот хук зависит только от пола

  
  

  // useEffect(() => {
  //   console.log('Infinitives in verbs3:', shuffledVerbs.map(verb => verb.infinitive));
  //   console.log('Infinitives in verbs1RU:', verbs1RU.map(verb => verb.infinitive));
  // }, []);
  

  const generateOptions = (verbData) => {
    const correctAnswerIndex = verbData.correctTranslationIndex;
    const correctTranslation = verbData.binyanOptions[correctAnswerIndex];
    const incorrectOptions = verbData.binyanOptions.filter(
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
        await correctSoundObject.loadAsync(require('./assets/sounds/success.mp3'));
        await incorrectSoundObject.loadAsync(require('./assets/sounds/failure.mp3'),
               {
          volume: 0.8,  // Максимальная громкость, попробуйте значения больше 1, если это разрешено
        }
        );
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
    // Обновление громкости в зависимости от состояния soundEnabled
    const updateVolume = async () => {
      const volume = soundEnabled ? 1 : 0;
      await correctSound?.setVolumeAsync(volume);
      await incorrectSound?.setVolumeAsync(volume);
    };
  
    updateVolume();
  }, [soundEnabled, correctSound, incorrectSound]);

  

  const [infinitiveSound, setInfinitiveSound] = useState(null); // Хранение звука инфинитива

// Обновленная функция для воспроизведения звука инфинитива
const playSound = async (soundFileName) => {
  try {
    const soundObject = new Audio.Sound();
    const soundFile = soundsConj[soundFileName]; // Получаем путь к звуку из объекта soundsConj

    if (soundFile) {
      await soundObject.loadAsync(soundFile);
      await soundObject.playAsync(); // Воспроизводим звук
    } else {
      console.log(`Sound file ${soundFileName} not found.`);
    }
  } catch (error) {
    console.log('Error playing sound:', error);
  }
};


// Хук для обновления громкости, когда переключается состояние soundEnabled
useEffect(() => {
  if (infinitiveSound) {
    const volume = soundEnabled ? 1 : 0;
    console.log(`Setting volume to ${volume}`);
    infinitiveSound.setVolumeAsync(volume);
  }
}, [soundEnabled, infinitiveSound]);
  
  // Обновление громкости при переключении состояния soundEnabled
  useEffect(() => {
    if (sound) {
      sound.setVolumeAsync(soundEnabled ? 1 : 0);
    }
  }, [soundEnabled, sound]);
  
  
  
  
  
  
  const playFeedbackSound = async (isCorrect) => {
    try {
      const sound = isCorrect ? correctSound : incorrectSound;
      await sound.replayAsync(); // Используйте replayAsync для воспроизведения
    } catch (error) {
      console.log('Error playing feedback sound:', error);
    }
  };
  
  

  const handleAnswer = (selectedOptionIndex) => {
    const isCorrect = optionsOrder[selectedOptionIndex].isCorrect;
  
    // Воспроизводим звук только если звук включен
    if (soundEnabled) {
      playFeedbackSound(isCorrect); // Воспроизводим звук правильного или неправильного ответа
    }
  
    changeBackgroundColor(isCorrect); // Здесь изменяем цвет фона
  
    const updatedOptions = optionsOrder.map((option, index) => {
      return {
        ...option,
        isSelected: index === selectedOptionIndex,
      };
    });
  
    setOptionsOrder(updatedOptions);
  
    if (isCorrect) {
      setCorrectAnswers((prevCorrectAnswers) => prevCorrectAnswers + 1);
    } else {
      setIncorrectAnswers((prevIncorrectAnswers) => prevIncorrectAnswers + 1);
    }
  
    setProgress((prevProgress) => prevProgress + 1);
    setShowNextButton(true);
  };
  
  


  // Создаем анимационный объект для управления перемещением контейнера
  const translateXAnim = useRef(new Animated.Value(-500)).current; // Начальное положение вне экрана слева

  

  const [isFirstAnimationCompleted, setIsFirstAnimationCompleted] = useState(false);
  // Остальной код компонента

  // Функция для анимации перемещения контейнера
  const animateTranslation = () => {
    Animated.timing(optionsContainerAnim, {
      toValue: 0, // Конечное положение (исходное положение контейнера)
      duration: 500, // Продолжительность анимации
      useNativeDriver: true, // Использование нативного драйвера
    }).start(() => setIsFirstAnimationCompleted(true)); // После анимации устанавливаем флаг в true
  };

  const animation = useRef(new Animated.Value(-500)).current; // начинаем слева от экрана
  const optionsContainerAnim = useRef(new Animated.Value(-500)).current; // Начинаем слева за пределами экрана

  

  useEffect(() => {
    // Запускаем анимацию при первом рендере, если она еще не была выполнена
    if (!isFirstAnimationCompleted) {
      animateTranslation();
    }
  }, [isFirstAnimationCompleted]); // Зависимость от isFirstAnimationCompleted

  const handleNextCard = () => {
    // Сбрасываем позицию контейнера перед началом новой анимации
    optionsContainerAnim.setValue(-500); 
  
    setShowNextButton(false); // Отключаем кнопку "СЛЕДУЮЩИЙ ГЛАГОЛ"
  
    // Определяем следующий индекс в массиве shuffledVerbs
    const nextIndex = currentIndex + 1;
  
    // Если достигли конца упражнений
    if (nextIndex >= shuffledVerbs.length) {
      setExerciseCompleted(true); // Завершаем упражнение
      handleExerciseCompletion(); // Вызов функции завершения упражнения
      return; // Останавливаем выполнение функции, так как задания закончились
    }
  
    // Переход к следующему индексу
    setCurrentIndex(nextIndex);
    
    // Генерация новых опций для следующего глагола
    setOptionsOrder(generateOptions(shuffledVerbs[nextIndex]));
  
    // Запускаем анимацию после обновления состояния
    Animated.timing(optionsContainerAnim, {
      toValue: 0, // Конечное положение анимации (видимая часть экрана)
      duration: 500,
      useNativeDriver: true,
    }).start();
  };
  
  
  

  // const handleExerciseCompletion = () => {
  //   setExerciseCompleted(true);
  //   // const navigation = useNavigation();
  //   navigation.navigate('Menu');
  // };

  
  const handleConfirmExit = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MenuPt' }],
    });
  };

  const handleCancelExit = () => {
    // Ваши действия при отмене выхода
    setExitConfirmationVisible(false); // Закрытие модального окна
  };

  const [resizeMode, setResizeMode] = useState('contain');

  const handleResizeModeChange = (resizeMode) => {
    setResizeMode(resizeMode);
  };


  const resetExercise = () => {
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setProgress(0);
    setShowNextButton(false); // Скрываем кнопку "СЛЕДУЮЩИЙ ГЛАГОЛ"
    setExerciseCompleted(false);
    setStatisticsUpdated(false);
  
    // Сбрасываем анимацию
    optionsContainerAnim.setValue(-500); 
  
    // Перемешиваем вопросы и сбрасываем текущий индекс
    const newShuffledVerbs = shuffleArray(verbsData);
    setShuffledVerbs(newShuffledVerbs);
    setCurrentIndex(0);
  
    // Генерация новых опций для первого глагола
    const firstVerb = newShuffledVerbs[0];
    setOptionsOrder(generateOptions(firstVerb));
  
    // Запуск анимации для появления опций
    Animated.timing(optionsContainerAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
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
          await updateStatistics('exercise3Pt', currentScore);
          console.log("Statistics successfully updated.");
        } catch (error) {
          console.error("Failed to update statistics:", error);
        }
      }, 500);
  
      setIsSoundBlocked(true); // Блокируем звуки после завершения упражнения
      setExerciseCompleted(true); // Устанавливаем, что упражнение завершено
    }
  };
  
  


  
  const handleButton3Press = async () => {
    const exerciseId = 'exercise3Pt';
    console.log('Attempting to fetch statistics for ${exerciseId}');
    try {
      const stats = await getStatistics(exerciseId);
      console.log('Statistics for ${exerciseId}:, stats');
      setStatistics(stats ? { currentScore: stats.averageScore } : null);
      setIsStatModalVisible(true);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      setStatistics(null);
      setIsStatModalVisible(false);
    }
  };

 
  const handleSpeakerPress = (mp3FileName) => {
    playSound(mp3FileName); // Передаем название файла в функцию воспроизведения
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
        source={require('./stat.png')}  // Замените на ваше изображение кнопки
        style={[styles.buttonImage, { opacity: fadeAnim }]}
      />
      <StatModal3Pt
    visible={isStatModalVisible}
    onToggle={() => setIsStatModalVisible(false)}
    statistics={statistics}
/>
    </TouchableOpacity>

    <TouchableOpacity onPress={handleButton2Press}>
      <Animated.Image
        source={require('./question.png')}  // Замените на ваше изображение кнопки
        style={[styles.buttonImage, { opacity: fadeAnim }]}
      />
      <TaskDescriptionModal6
                visible={isDescriptionModalVisible}
  onToggle={toggleDescriptionModal}
  language={language}
  dontShowAgain3={dontShowAgain3}
  onToggleDontShowAgain={handleToggleDontShowAgain3}
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
          <Text style={styles.text} maxFontSizeMultiplier={1.2}>
          CORRETO: {correctAnswers} 
          </Text>
          <Text style={styles.text} maxFontSizeMultiplier={1.2}>
          INCORRETO: {incorrectAnswers}
          </Text>
        </View>

        <View style={styles.remainingTasksContainer}>
    <Text style={styles.remainingTasksText} maxFontSizeMultiplier={1.2}>
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

      <Animated.Text style={[styles.title, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>SELECIONE A BINYAN</Animated.Text>

      {currentIndex < shuffledVerbs.length && (
        <VerbCard3
          verbData={shuffledVerbs[currentIndex]}
          options={optionsOrder}
          onAnswer={handleAnswer}
          soundEnabled={soundEnabled} // Добавляем soundEnabled
        />
      )}


{verbInfo && (
  console.log('Rendering verb info:', verbInfo),
  <View style={styles.infoContainer}>
    <View style={styles.verbDetailsLeftContent}>
        <Text style={styles.verbDetailsHebrew}maxFontSizeMultiplier={1.2}>{verbInfo.hebrewtext}</Text>
        <Text style={styles.verbDetailsTranslit}maxFontSizeMultiplier={1.2}>{verbInfo.translit}</Text>
      </View>
      <View style={styles.verbDetailsRightContent}>
       
          <Text style={styles.verbDetailsRussian}maxFontSizeMultiplier={1.2}>{verbInfo.pttext}</Text>
             
      </View>

      <TouchableOpacity
  style={styles.speakerButton}
  onPress={() => playSound(verbInfo.mp3)} // Передаем название аудиофайла из verbInfo.mp3
>
  <Image source={require('./speaker1.png')} style={styles.speakerIcon} />
</TouchableOpacity>

  
    
  </View>
)}



<Animated.View
  style={[
    styles.optionsContainer,
    {
      transform: [{ translateX: optionsContainerAnim }] // Применяем анимированное перемещение
    }
  ]}
>
  {optionsOrder.map((option, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.optionButton,
        showNextButton && option.isCorrect ? styles.correctOption : null,
        showNextButton && !option.isCorrect && option.isSelected ? styles.incorrectOption : null,
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
        <Text style={styles.nextButtonText} maxFontSizeMultiplier={1.2}>PRÓXIMO VERBO</Text>
      </TouchableOpacity>

      {exerciseCompleted && (
  <CompletionMessagePt
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
    restartTask={resetExercise}  // Передаём функцию перезапуска
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
    justifyContent: 'space-between', // Распределяет дочерние элементы на обоих концах контейнера
    alignItems: 'center',
    width: '100%', // Занимает всю ширину родителя
    paddingTop: 1,  // Отступ сверху для всего контейнера
  },
  logoImage: {
    width: 90,
    height: 90,
    marginLeft: 10  // Отступ слева для лого
  },
  buttonContainer: {
    flexDirection: 'row', // Выравнивание кнопок в строку
    marginRight: 10  // Отступ справа для кнопок
  },
  buttonImage: {
    width: 44,
    height: 44,
    marginLeft: 10  // Отступ между кнопками
  },

  // container: {
  //   width: "100%",
  //   flex: 1,
  //   flexDirection: 'column',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   padding: 10,
  //   // height: "70%",
  //   backgroundColor: "#AFC1D0",
  // },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 10,
    color: '#2F4766',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  optionButton: {
    width: '49%',
    height: 60,
    padding: 15,
    backgroundColor: '#D1E3F1',
    marginBottom: 10,
    borderRadius: 10,
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  optionText: {
    fontSize: 17,
    textAlign: 'center',
    color: '#152039',
    fontWeight: 'bold',
    // lineHeight: 20,
    // justifyContent: 'center',
  },
  nextButton: {
    width: '80%',
    // padding: 14,
    padding: hp('1.5%'),
    backgroundColor: '#2B3270',
    borderRadius: 10,
    textAlign: 'center',
    shadowColor: "#000",
    marginBottom: 20,
    marginTop: 0,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
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
    // flex: 1,
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
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '50%',
    // backgroundColor: 'gray',
  },
  text: {
    fontSize: 12,
    color: 'white',
    // fontWeight: 'bold',
    textAlign: 'left',
    marginLeft: 15,
    // padding: 5,
  },
  percentContainer: {
    alignItems: 'center',
    marginRight: 10,
    // width: 50,
  },
  percentText: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    // backgroundColor: '#83A3CD',
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
  verbContainer: {
    marginBottom: 10,
  },
  infoContainer: {
    height: hp('8%'),
    backgroundColor: '#83A3CD',
    marginBottom: hp('2%'),
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
    flexDirection: 'row', // Добавляем для горизонтального размещения элементов
    justifyContent: 'space-between', // Разделяем левую и правую части
    alignItems: 'center', // Выравниваем элементы по вертикали
    paddingHorizontal: wp('2.5%'), // Отступы по бокам
  },
  
  verbDetailsLeftContent: {
    flex: 1, // Занимает половину контейнера
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  verbDetailsRightContent: {
    flex: 1, // Занимает вторую половину контейнера
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  verbDetailsHebrew: {
    fontSize: 18,
    color: '#FFFDEF',
    fontWeight: 'bold',
    marginTop: hp('1%'),
    marginBottom: hp('0.1%'),
  },
  
  verbDetailsTranslit: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#CE6857',
    backgroundColor: '#FFFDEF',
    borderRadius: wp('2.5%'),
    padding: 1,
    paddingHorizontal: 5,
    
    marginTop: hp('0.25%'),
    marginBottom: hp('1%'),
  },
  
  verbDetailsRussian: {
    fontSize: 15,
    color: '#333652',
    fontWeight: 'bold',
    backgroundColor: '#FFFDEF',
    borderRadius: wp('2.5%'),
    padding: wp('0.5%'),
    paddingHorizontal: wp('2.5%'),
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
    width: '250%', // Уменьшаем, чтобы иконка не растягивалась слишком сильно
    height: '250%',
    resizeMode: 'contain',
  },
  

});

export default Exercise3Pt;