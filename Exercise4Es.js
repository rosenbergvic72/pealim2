import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity,  StyleSheet, Image, BackHandler } from 'react-native';
import verbsData from './verbs6RU.json';
import ProgressBar from './ProgressBar';
import { Animated } from 'react-native';
import { Audio } from 'expo-av';
import soundsconj from './soundconj';
import sounds from './Soundss';
import CompletionMessageEs from './CompletionMessageEs';
import ExitConfirmationModal from './ExitConfirmationModalEs';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import TaskDescriptionModal4Es from './TaskDescriptionModal4Es';
import StatModal4Es from './StatModal4Es';
import { updateStatistics, getStatistics } from './stat';
import LottieView from 'lottie-react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const Exercise4Es = () => {
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

  const [exitConfirmationVisible, setExitConfirmationVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDescriptionModalVisible, setIsDescriptionModalVisible] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [isStatModalVisible, setIsStatModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [resizeMode, setResizeMode] = useState('contain');
  const [failureSound, setFailureSound] = useState(null);
  const [sound, setSound] = useState(null);
  const [correctSound, setCorrectSound] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [completionMessageVisible, setCompletionMessageVisible] = useState(false);
  const blockAnimation = useRef(new Animated.Value(-100)).current;
  const backgroundColorAnim = useRef(new Animated.Value(0)).current;
  const [showVerb, setShowVerb] = useState(false);
  const [isButtonActive, setIsButtonActive] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [completionMessageOpacity] = useState(new Animated.Value(0));
  const animationRef = useRef(null);
  const [isAnimationVisible, setIsAnimationVisible] = useState(false);

  const showCompletionMessageWithAnimation = () => {
    setShowCompletionMessage(true);
    Animated.timing(completionMessageOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
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

  const [currentVerb, setCurrentVerb] = useState({
    infinitive: '',
    spanish: '',
    transliteration: ''
  });

  const shuffleArray = (array) => {
    let newArray = array.slice();
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  useEffect(() => {
    if (verbsData && verbsData.length > 0) {
      const shuffledData = shuffleArray(verbsData).slice(0, 18);
      setPairs(shuffledData);
      setTotalExercises(18);
      setRemainingPairs(18);
      setCurrentVerb(shuffledData[0]);
    }
  }, [verbsData]);

  useEffect(() => {
    const start = page * 6;
    const end = start + 6;
    const currentPairs = pairs.slice(start, end);
    const hebrewTexts = shuffleArray(currentPairs.map(pair => ({ text: pair.hebrewtext, translit: pair.translit })));
    const mixedPairs = currentPairs.map((pair, index) => ({
      ...pair,
      estext: pair.estext,
      hebrewtext: hebrewTexts[index].text,
      translit: hebrewTexts[index].translit,
      correct: pair.hebrewtext
    }));
    setDisplayPairs(mixedPairs);
    setHebrewActive(false);
    setSelectedRussian(null);
    setSelectedHebrew(null);
  }, [page, pairs]);

  useEffect(() => {
    if (resolvedPairsCount === 6 && !isUpdating && !exerciseCompleted) {
      setIsUpdating(true);
      setTimeout(() => {
        if ((page + 1) * 6 < pairs.length) {
          setPage(prev => prev + 1);
        } else {
          setPage(0);
        }
        setCorrectAnswers(new Set());
        setSelectedRussian(null);
        setSelectedHebrew(null);
        setHebrewActive(false);
        setResolvedPairsCount(0);
        setIsUpdating(false);
        setIsButtonActive(false);
        setSelectedPair(null);
        setShowVerb(false);
      }, 1200);
    }
  }, [resolvedPairsCount, page, pairs.length, isUpdating, exerciseCompleted]);

  useEffect(() => {
    if (page === 0) {
      setResolvedPairsCount(0);
    }
  }, [page]);

  const [prevCorrectCount, setPrevCorrectCount] = useState(0);
  useEffect(() => {
    if (correctCount !== prevCorrectCount) {
        const progressPercentage = correctCount > 0 ? (correctCount / totalExercises) * 100 : 0;
        console.log('Progress Percent:', progressPercentage);
        setProgress(progressPercentage);
        setPrevCorrectCount(correctCount);
    }
  }, [correctCount, prevCorrectCount, totalExercises]);

  useEffect(() => {
    if (currentIndex >= totalExercises && totalExercises > 0 && !exerciseCompleted) {
      console.log("Setting exerciseCompleted to true");
      setExerciseCompleted(true);
      handleExerciseCompletion();
    }
  }, [currentIndex, totalExercises, exerciseCompleted]);

  const handleProgressUpdate = () => {
    setProgress((correctCount / totalExercises) * 100);
  };

  const handleAnswer = (isCorrect) => {
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
    }

    setCurrentIndex(prevIndex => prevIndex + 1);
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

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (currentVerb.infinitive) {
      fadeIn();
    }
  }, [currentVerb]);

  useEffect(() => {
    if (!exerciseCompleted && displayPairs.length > 0) {
      blockAnimation.setValue(500);
      Animated.timing(blockAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [displayPairs, exerciseCompleted]);

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
      if (!audioFile) {
        console.error(`Audio file for key ${audioKey} not found.`);
        return;
      }
      if (correctSound) {
        await correctSound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
      setCorrectSound(newSound);
      await newSound.playAsync();
      setIsAnimationVisible(true); // Показываем анимацию
      animationRef.current?.play();
      setTimeout(() => {
        setIsAnimationVisible(false); // Скрываем анимацию после 1 секунды
        animationRef.current?.reset();
      }, 1000);
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
      if (!audioFile) {
        console.error(`Audio file ${audioFileName} not found.`);
        return;
      }
      if (sound && typeof sound.unloadAsync === 'function') {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error('Error loading sound:', error);
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

  const [selectedPair, setSelectedPair] = useState(null);

  const handleSelectRussian = (index) => {
    setSelectedRussian(index);
    setSelectedHebrew(null);
    setHebrewActive(true);
    setSelectedPair(displayPairs[index]);
    setShowVerb(false);
    setIsButtonActive(true);
  };

  const handleShowVerb = () => {
    setShowVerb(true);
    setIsButtonActive(true);
  };

  const handleSelectHebrew = (index) => {
    setSelectedHebrew(index);
    const selectedPair = displayPairs[index];
    const isCorrect = selectedRussian !== null && selectedPair.hebrewtext === displayPairs[selectedRussian].correct;
    if (isCorrect) {
      handleAnswer(isCorrect);
      setCorrectAnswers(prev => new Set(prev).add(selectedRussian));
      setResolvedPairsCount(prev => prev + 1);
      setRemainingPairs(prev => prev - 1);
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
    if (correctAnswers.has(index) && type === 'spanish') {
      style.push(styles.deactivatedButton);
    }
    if (type === 'spanish' && index === selectedRussian) {
      style.push(styles.selectedButton);
    }
    if (type === 'hebrew' && index === selectedHebrew) {
      style.push(displayPairs[selectedRussian]?.correct === displayPairs[index].hebrewtext ? styles.correctButton : styles.wrongButton);
    }
    return style;
  };

  const getImageForGender = (gender) => {
    switch (gender) {
      case 'man':
        return require('./man1.png');
      case 'woman':
        return require('./woman1.png');
      case 'men':
        return require('./men1.png');
      case 'women':
        return require('./women1.png');
      default:
        return null;
    }
  };

  const toggleDescriptionModal = () => {
    setIsDescriptionModalVisible(prev => !prev);
  };

  const handleButton3Press = async () => {
    const exerciseId = "exercise4Es";
    try {
      const stats = await getStatistics(exerciseId);
      setStatistics(stats);
      console.log('Statistics passed to StatModal4:', stats);  // Добавьте лог здесь
      setIsStatModalVisible(true);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
      setStatistics(null);
      setIsStatModalVisible(false);
    }
  };

  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
    if (soundEnabled && sound) {
      sound.setVolumeAsync(0);
    } else if (!soundEnabled && sound) {
        sound.setVolumeAsync(1);
    }
  };

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
  
    const handleCancelExit = () => {
      setExitConfirmationVisible(false);
    };
  
    const handleConfirmExit = () => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MenuEs' }],
      });
    };

  const handleExerciseCompletion = async () => {
    const exerciseId = 'exercise4Es';
    // const correctAnswersPercent = (correctCount / totalExercises) * 100;
    // const currentScore = parseFloat(correctAnswersPercent.toFixed(2));
    const currentScore = parseFloat(progressPercent.toFixed(2));

    console.log(`Exercise completed. Saving stats for ID ${exerciseId} with score ${currentScore}`);

    await updateStatistics(exerciseId, currentScore);

    setTimeout(() => {
        setShowCompletionMessage(true);
        Animated.timing(completionMessageOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, 1500);
};

const resetExercise = () => {
  setCorrectCount(0);
  setIncorrectCount(0);
  setProgress(0);
  setExerciseCompleted(false);
  setCurrentIndex(0);
  setResolvedPairsCount(0);
  setCorrectAnswers(new Set());

  const shuffledData = shuffleArray(verbsData).slice(0, 18);
  setPairs(shuffledData);
  setTotalExercises(shuffledData.length);
  setRemainingPairs(shuffledData.length);
  setCurrentVerb(shuffledData[0]);
};

const progressPercent = (correctCount / (correctCount + incorrectCount)) * 100 || 0;

console.log('Progress Percent:', progressPercent);

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.container}>

      <View style={styles.topBar}>
     
        <Animated.Image
          source={require('./VERBIFY.png')}
          style={[styles.logoImage, { opacity: fadeAnim }]}
        />

        <View style={styles.buttonContainer}>

        {isAnimationVisible && (
          <LottieView
            ref={animationRef}
            source={require('./assets/Animation - 1718430107767.json')}
            loop={false}
            style={styles.lottie}
          />
        )}

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
            <StatModal4Es
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
            <TaskDescriptionModal4Es
              visible={isDescriptionModalVisible}
              onToggle={toggleDescriptionModal}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
        <View style={styles.textContainer}>
          <Text style={styles.prtext}maxFontSizeMultiplier={1.2}>CORRECTO: {correctCount}</Text>
          <Text style={styles.prtext}maxFontSizeMultiplier={1.2}>INCORRECTO: {incorrectCount}</Text>
        </View>
        <View style={styles.remainingTasksContainer}>
          <Text style={styles.remainingTasksText}maxFontSizeMultiplier={1.2}>
            {remainingPairs}
          </Text>
        </View>
        <Animated.View style={[styles.percentContainer, { backgroundColor, borderRadius: 10 }]}>
          <Text style={styles.percentText}maxFontSizeMultiplier={1.2}>
            {progressPercent.toFixed(2)}%
          </Text>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.ProgressBarcontainer, { opacity: fadeAnim }]}>
        <ProgressBar progress={progress} totalExercises={100} />
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}maxFontSizeMultiplier={1.2}>VERBOS CONJUGADOS</Animated.Text>

      <View style={styles.verbContainerWrapper}>
        {!isButtonActive ? (
          <View style={[styles.verbContainer, styles.inactiveButton]}>
            <Text style={styles.verbTextInactive}maxFontSizeMultiplier={1.2}>MOSTRAR INFINITIVO</Text>
          </View>
        ) : (
          !showVerb ? (
            <TouchableOpacity style={[styles.verbContainer, styles.activeButton]} onPress={handleShowVerb} disabled={!isButtonActive}>
              <Text style={styles.verbTextActive}maxFontSizeMultiplier={1.2}>MOSTRAR INFINITIVO</Text>
            </TouchableOpacity>
          ) : (
            <Animated.View style={[styles.verbContainer, { opacity: fadeAnim }]}>
              <Text style={styles.verbText}maxFontSizeMultiplier={1.2}> {selectedPair.infinitive}</Text>
              <Text style={styles.verbTextTr}maxFontSizeMultiplier={1.2}> {selectedPair.transliteration}</Text>
              <Text style={styles.verbTextRu}maxFontSizeMultiplier={1.2}> {selectedPair.spanish}</Text>
              <TouchableOpacity onPress={() => playAudio(selectedPair.audioFile)} style={styles.audioButton}>
                <Image source={require('./speaker3.png')} style={styles.audioIcon} />
              </TouchableOpacity>
            </Animated.View>
          )
        )}
      </View>

      <Animated.View style={{ transform: [{ translateY: blockAnimation }] }}>
        {displayPairs.map((pair, index) => (
          <View key={index} style={styles.row}>
            <TouchableOpacity
              style={getButtonStyle(index, 'spanish')}
              onPress={() => handleSelectRussian(index)}
              disabled={correctAnswers.has(index)}
            >
              <Text style={[
                styles.text,
                styles.russianText,
                correctAnswers.has(index) ? styles.deactivatedButtonText : {}
              ]}maxFontSizeMultiplier={1.2}>
                {pair.estext}
              </Text>
              {pair.gender && (
                <Image
                  source={getImageForGender(pair.gender)}
                  style={styles.iconStyle}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={getButtonStyle(index, 'hebrew')}
              onPress={() => handleSelectHebrew(index)}
              disabled={!hebrewActive || correctAnswers.has(selectedRussian)}
            >
              <Text style={[styles.text, styles.hebrewText]}maxFontSizeMultiplier={1.2}>{pair.hebrewtext}</Text>
              <Text style={styles.translitText}maxFontSizeMultiplier={1.2}>{pair.translit}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Animated.View>

      {exerciseCompleted && showCompletionMessage && (
        <Animated.View style={[styles.completionMessageContainer, { opacity: completionMessageOpacity }]}>
          <CompletionMessageEs
            handleOK={handleExerciseCompletion}
            navigateToMenu={() => navigation.navigate('MenuEs')}
            correctAnswers={correctCount}
            incorrectAnswers={incorrectCount}
            correctAnswersPercentage={progressPercent.toFixed(2)}
            grade={getGrade(progressPercent)}
            restartTask={resetExercise}
          />
        </Animated.View>
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

  completionMessageContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop:  wp('1%'),
  },
  logoImage: {
    width: 90,
    height: 90,
    marginLeft: 10,
  },
  lottie: {
    width: 36,
    height: 36,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginRight: 10,
    justifyContent: 'center', // Выровнять по центру по горизонтали
  },
  buttonImage: {
    width: 44,
    height: 44,
    marginLeft: 10,
    marginTop: -5,
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
  ProgressBarcontainer: {
    width: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: wp('1%'),
    color: '#2F4766',
    textAlign: 'center',
  },
  verbContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 5,
    marginBottom: 10,
    backgroundColor: '#FFFDEF',
    borderRadius: 10,
    marginLeft: 5,
    marginRight: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: 40,
    width: '100%',
  },
  verbText: {
    fontSize: 15,
    color: '#FF5757',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  verbTextTr: {
    fontSize: 15,
    color: '#333',
    fontWeight: 'bold',
  },
  verbTextRu: {
    fontSize: 15,
    color: '#003882',
    fontWeight: 'bold',
  },
  audioIcon: {
    width: 22,
    height: 22,
    marginRight: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
    width: "100%",
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    padding: 5,
    backgroundColor: '#D1E3F1',
    borderRadius: 10,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  russianButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hebrewButton: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  russianText: {
    textAlign: 'left',
    flex: 1,
    marginLeft: 3,
    color: '#152039',
  },
  hebrewText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#152039',
  },
  translitText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 2,
    color: '#FF5757',
    fontWeight: 'bold',
  },
  iconStyle: {
    width: 45,
    height: 45,
  },
  selectedButton: {
    backgroundColor: '#AFFFCA',
  },
  correctButton: {
    backgroundColor: '#AFFFCA',
  },
  wrongButton: {
    backgroundColor: '#FFBCBC',
  },
  deactivatedButton: {
    backgroundColor: '#E0E0E0',
  },
  deactivatedButtonText: {
    color: '#A0A0A0',
  },
  verbContainerWrapper: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 5,
    height: 40,
  },
  inactiveButton: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    height: '100%',
    alignItems: 'center',
    width: '100%',
    marginLeft: 5,
    marginRight: 5,
  },
  activeButton: {
    backgroundColor: '#6C8EBB',
    justifyContent: 'center',
    height: '100%',
    alignItems: 'center',
    width: '100%',
    marginLeft: 5,
    marginRight: 5,
  },
  verbTextInactive: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  verbTextActive: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default Exercise4Es;
