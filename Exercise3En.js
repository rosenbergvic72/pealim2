import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, BackHandler, Image } from 'react-native';
import VerbCard3 from './VerbCard3En';
// import verbsData from './verbs3.json';
import verbsData from './verbs3copy.json';
import ProgressBar from './ProgressBar';
import { useFocusEffect } from '@react-navigation/native';
import CompletionMessageEn from './CompletionMessageEn';
import ExitConfirmationModal from './ExitConfirmationModalEn';
import { Audio } from 'expo-av';
import { Animated } from 'react-native';
import TaskDescriptionModal6 from './TaskDescriptionModal3';
import StatModal3En from './StatModal3En';
import { updateStatistics, getStatistics } from './stat';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
// import verbs11RU from './verbs11RU.json';
import verbs11RU from './verbs11RUcopy.json';
import soundsConj from './soundconj';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ================= helpers ================= */

const findFirstMatchingVerb = (infinitive) => {
  console.log('Filtering verbs by infinitive:', infinitive);
  const matchingVerbs = verbs11RU.filter((verb) => verb.infinitive === infinitive);
  return matchingVerbs.length > 0 ? matchingVerbs[0] : null;
};

const shuffleArray = (array) => {
  const shuffledArray = array.slice();
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray.slice(0, 18);
};

const getGrade = (percentage) => {
  if (percentage === 100) return 'Exceptional! Flawless! You didn’t make a single mistake!';
  if (percentage >= 90) return 'Excellent! Almost perfect, keep up the great work!';
  if (percentage >= 80) return 'Great! You are doing very well!';
  if (percentage >= 70) return 'Good! You’ve learned the material pretty well!';
  if (percentage >= 60) return 'Fairly good! There is steady progress!';
  if (percentage >= 50) return 'Not bad! But there’s room for improvement.';
  if (percentage >= 40) return 'Satisfactory! Keep working and you’ll succeed!';
  if (percentage >= 30) return 'You’re starting to get the hang of it, keep it up!';
  if (percentage >= 20) return 'Try changing your learning strategy, it might help!';
  if (percentage >= 10) return 'It’s tough, but don’t give up! Keep practicing.';
  return 'Serious work is needed! It’s important not to give up and keep learning.';
};

const normalizeBinyan = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z]/g, '');

/* ================= component ================= */

const Exercise3En = ({ navigation }) => {
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
  const grade = getGrade((correctAnswers / (correctAnswers + incorrectAnswers)) * 100 || 0);

  const backgroundColorAnim = useRef(new Animated.Value(0)).current;

  const [currentInfinitive, setCurrentInfinitive] = useState(null);
  const [verbInfo, setVerbInfo] = useState(null);

  const [isGenderMan, setIsGenderMan] = useState(true);
  const handleGenderToggle = () => setIsGenderMan((prev) => !prev);

  const [language, setLanguage] = useState('en');
  const [isDescriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [dontShowAgain3, setDontShowAgain3] = useState(false);
  const [languageLoaded, setLanguageLoaded] = useState(false);

  const toggleDescriptionModal = () => {
    setDescriptionModalVisible((prev) => !prev);
  };

  const handleToggleDontShowAgain3 = async () => {
    const newValue = !dontShowAgain3;
    setDontShowAgain3(newValue);
    await AsyncStorage.setItem('exercise3_description_hidden', newValue ? 'true' : '');
  };

  useEffect(() => {
    const checkFlagAndLang = async () => {
      const hidden = await AsyncStorage.getItem('exercise3_description_hidden');
      const lang = await AsyncStorage.getItem('language');

      if (lang) setLanguage(lang);
      setDontShowAgain3(hidden === 'true');
      setLanguageLoaded(true);
    };

    checkFlagAndLang();
  }, []);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sound, setSound] = useState(null);

  const handleSoundToggle = () => {
    setSoundEnabled((p) => !p);
  };

  useEffect(() => {
    if (soundEnabled && sound) sound.setVolumeAsync(1);
    else if (!soundEnabled && sound) sound.setVolumeAsync(0);
  }, [soundEnabled, sound]);

  // ✅ Highlight toggle (default ON)
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const handleHighlightToggle = () => setHighlightEnabled((p) => !p);

  useEffect(() => {
    if (currentInfinitive) {
      const foundVerb = findFirstMatchingVerb(currentInfinitive);
      if (foundVerb) setVerbInfo((prevInfo) => ({ ...prevInfo }));
    }
  }, [currentInfinitive]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
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
    navigation.reset({
      index: 0,
      routes: [{ name: 'MenuEn' }],
    });
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (exitConfirmationVisible) return false;
        setExitConfirmationVisible(true);
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (!exitConfirmationVisible) {
          e.preventDefault();
          setExitConfirmationVisible(true);
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
      headerLeft: () => null,
    });
  }, [navigation]);

  const handleCancelExit = () => setExitConfirmationVisible(false);

  const handleConfirmExit = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MenuEn' }],
    });
  };

  useEffect(() => {
    setShuffledVerbs(shuffleArray(verbsData));
  }, []);

  const generateOptions = (verbData) => {
    const correctAnswerIndex = verbData.correctTranslationIndex;
    const correctTranslation = verbData.binyanOptions[correctAnswerIndex];
    const incorrectOptions = verbData.binyanOptions.filter((_, index) => index !== correctAnswerIndex);

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

  // update current verb when currentIndex changes
  useEffect(() => {
    if (shuffledVerbs.length > 0 && currentIndex < shuffledVerbs.length) {
      const currentVerb = shuffledVerbs[currentIndex];
      const currentInf = currentVerb.hebrewVerb;

      setCurrentInfinitive(currentInf);

      const foundVerbs = verbs11RU.filter((verb) => verb.infinitive === currentInf);
      const foundVerbByGender = foundVerbs.find((verb) => verb.gender === (isGenderMan ? 'man' : 'woman'));

      setVerbInfo(foundVerbByGender || null);
      setOptionsOrder(generateOptions(currentVerb));
    }
  }, [currentIndex, shuffledVerbs]); // intentionally no gender here

  // update verbInfo when gender changes (do not reshuffle options)
  useEffect(() => {
    if (currentInfinitive) {
      const foundVerbs = verbs11RU.filter((verb) => verb.infinitive === currentInfinitive);
      const foundVerbByGender = foundVerbs.find((verb) => verb.gender === (isGenderMan ? 'man' : 'woman'));
      setVerbInfo(foundVerbByGender || null);
    }
  }, [isGenderMan]); // depends only on gender

  useEffect(() => {
    async function loadSounds() {
      const correctSoundObject = new Audio.Sound();
      const incorrectSoundObject = new Audio.Sound();
      try {
        await correctSoundObject.loadAsync(require('./assets/sounds/success.mp3'));
        await incorrectSoundObject.loadAsync(require('./assets/sounds/failure.mp3'), { volume: 0.8 });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const updateVolume = async () => {
      const volume = soundEnabled ? 1 : 0;
      await correctSound?.setVolumeAsync(volume);
      await incorrectSound?.setVolumeAsync(volume);
    };
    updateVolume();
  }, [soundEnabled, correctSound, incorrectSound]);

  const playSound = async (soundFileName) => {
    try {
      const soundObject = new Audio.Sound();
      const soundFile = soundsConj[soundFileName];
      if (soundFile) {
        await soundObject.loadAsync(soundFile);
        await soundObject.playAsync();
      } else {
        console.log(`Sound file ${soundFileName} not found.`);
      }
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const playFeedbackSound = async (isCorrect) => {
    try {
      const s = isCorrect ? correctSound : incorrectSound;
      await s.replayAsync();
    } catch (error) {
      console.log('Error playing feedback sound:', error);
    }
  };

  const handleAnswer = (selectedOptionIndex) => {
    const isCorrect = optionsOrder[selectedOptionIndex].isCorrect;

    if (soundEnabled) playFeedbackSound(isCorrect);
    changeBackgroundColor(isCorrect);

    const updatedOptions = optionsOrder.map((option, index) => ({
      ...option,
      isSelected: index === selectedOptionIndex,
    }));
    setOptionsOrder(updatedOptions);

    if (isCorrect) setCorrectAnswers((p) => p + 1);
    else setIncorrectAnswers((p) => p + 1);

    setProgress((p) => p + 1);
    setShowNextButton(true);
  };

  const optionsContainerAnim = useRef(new Animated.Value(-500)).current;
  const [isFirstAnimationCompleted, setIsFirstAnimationCompleted] = useState(false);

  const animateTranslation = () => {
    Animated.timing(optionsContainerAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => setIsFirstAnimationCompleted(true));
  };

  useEffect(() => {
    if (!isFirstAnimationCompleted) animateTranslation();
  }, [isFirstAnimationCompleted]);

  const calculateScore = () => {
    const totalAttempts = correctAnswers + incorrectAnswers;
    if (totalAttempts === 0) return 0;
    return ((correctAnswers / totalAttempts) * 100).toFixed(2);
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
          await updateStatistics('exercise3En', currentScore);
        } catch (error) {
          console.error("Failed to update statistics:", error);
        }
      }, 500);

      setExerciseCompleted(true);
    }
  };

  const handleNextCard = () => {
    optionsContainerAnim.setValue(-500);
    setShowNextButton(false);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= shuffledVerbs.length) {
      setExerciseCompleted(true);
      handleExerciseCompletion();
      return;
    }

    setCurrentIndex(nextIndex);
    setOptionsOrder(generateOptions(shuffledVerbs[nextIndex]));

    Animated.timing(optionsContainerAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const resetExercise = () => {
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setProgress(0);
    setShowNextButton(false);
    setExerciseCompleted(false);
    setStatisticsUpdated(false);

    optionsContainerAnim.setValue(-500);

    const newShuffledVerbs = shuffleArray(verbsData);
    setShuffledVerbs(newShuffledVerbs);
    setCurrentIndex(0);

    const firstVerb = newShuffledVerbs[0];
    setOptionsOrder(generateOptions(firstVerb));

    Animated.timing(optionsContainerAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleButton3Press = async () => {
    const exerciseId = 'exercise3En';
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

  /* ===== Hebrew details highlight (2nd word, FIRST Hebrew letter; all binyanim except PA'AL) ===== */

  const getCurrentBinyanKey = () => {
    const v = shuffledVerbs?.[currentIndex];
    if (!v) return '';
    return normalizeBinyan(v.binyan || '');
  };

  // ✅ Always returns the same JSX structure -> no jumps on toggle
  const renderHebrewDetails = (hebrewtext) => {
    const raw = String(hebrewtext || '').trim();
    if (!raw) return '';

    // split into words (we will render with single spaces -> stable layout)
    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';

    if (words.length === 1) {
      // single word: still stable
      return <Text>{words[0]}</Text>;
    }

    const first = words[0];
    const second = words[1];
    const tail = words.slice(2).join(' ');

    const b = getCurrentBinyanKey();
    const isPaal = b === 'paal' || b === 'paal' || b === 'paal'; // safe no-op duplicates

    const shouldHighlight = highlightEnabled && !isPaal;

    if (!shouldHighlight) {
      // ✅ same structure, no nested highlight -> no jump
      return (
        <Text>
          {first}{' '}{second}{tail ? ` ${tail}` : ''}
        </Text>
      );
    }

    const i = second.search(/[א-ת]/);
    if (i === -1) {
      return (
        <Text>
          {first}{' '}{second}{tail ? ` ${tail}` : ''}
        </Text>
      );
    }

    const before = second.slice(0, i);
    const letter = second[i];
    const after = second.slice(i + 1);

    return (
      <Text>
        {first}{' '}
        {before ? before : ''}
        <Text style={styles.detailsHighlight}>{letter}</Text>
        {after ? after : ''}
        {tail ? ` ${tail}` : ''}
      </Text>
    );
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
            {/* SOUND */}
            <TouchableOpacity onPress={handleSoundToggle}>
              <Animated.Image
                source={soundEnabled ? require('./SoundOn.png') : require('./SoundOff.png')}
                style={[styles.buttonImage, { opacity: fadeAnim }]}
              />
            </TouchableOpacity>

            {/* HIGHLIGHT (between sound and stat) */}
            <TouchableOpacity onPress={handleHighlightToggle}>
              <Animated.Image
                source={highlightEnabled ? require('./translit1.png') : require('./translit2.png')}
                style={[styles.buttonImage, { opacity: fadeAnim }]}
              />
            </TouchableOpacity>

            {/* STAT */}
            <TouchableOpacity onPress={handleButton3Press}>
              <Animated.Image
                source={require('./stat.png')}
                style={[styles.buttonImage, { opacity: fadeAnim }]}
              />
              <StatModal3En
                visible={isStatModalVisible}
                onToggle={() => setIsStatModalVisible(false)}
                statistics={statistics}
              />
            </TouchableOpacity>

            {/* QUESTION */}
            <TouchableOpacity onPress={toggleDescriptionModal}>
              <Animated.Image
                source={require('./question.png')}
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

            {/* GENDER */}
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
              CORRECT: {correctAnswers}
            </Text>
            <Text style={styles.text} maxFontSizeMultiplier={1.2}>
              INCORRECT: {incorrectAnswers}
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
          <ProgressBar progress={progress} totalExercises={Math.max(shuffledVerbs.length, 1)} />
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity: fadeAnim }]} maxFontSizeMultiplier={1.2}>
          SELECT BINYAN
        </Animated.Text>

        {currentIndex < shuffledVerbs.length && (
          <VerbCard3
            verbData={shuffledVerbs[currentIndex]}
            options={optionsOrder}
            onAnswer={handleAnswer}
            soundEnabled={soundEnabled}
            highlightEnabled={highlightEnabled}
          />
        )}

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
              <Text style={styles.verbDetailsRussian} maxFontSizeMultiplier={1.2}>
                {verbInfo.entext}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.speakerButton}
              onPress={() => playSound(verbInfo.mp3)}
            >
              <Image source={require('./speaker1.png')} style={styles.speakerIcon} />
            </TouchableOpacity>
          </View>
        ) : null}

        <Animated.View
          style={[
            styles.optionsContainer,
            { transform: [{ translateX: optionsContainerAnim }] }
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
              <Text style={styles.optionText} maxFontSizeMultiplier={1.2}>
                {option.text}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        <TouchableOpacity
          style={[styles.nextButton, showNextButton ? styles.activeButton : styles.inactiveButton]}
          onPress={handleNextCard}
          disabled={!showNextButton}
        >
          <Text style={styles.nextButtonText} maxFontSizeMultiplier={1.2}>
            NEXT VERB
          </Text>
        </TouchableOpacity>

        {exerciseCompleted && (
          <CompletionMessageEn
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

/* ================= styles ================= */

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
    paddingTop: 1,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  optionText: {
    fontSize: 17,
    textAlign: 'center',
    color: '#152039',
    fontWeight: 'bold',
  },

  nextButton: {
    width: '80%',
    padding: hp('1.5%'),
    backgroundColor: '#2B3270',
    borderRadius: 10,
    textAlign: 'center',
    shadowColor: "#000",
    marginBottom: 20,
    marginTop: 0,
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
    marginBottom: 5,
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
    shadowOffset: { width: 0, height: 2 },
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

  infoContainer: {
    height: hp('8%'),
    backgroundColor: '#83A3CD',
    marginBottom: hp('2%'),
    width: '100%',
    position: 'relative',
    borderRadius: wp('2.5%'),
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: hp('0.25%') },
    shadowOpacity: 0.25,
    shadowRadius: hp('0.5%'),
    elevation: 5,
    flexDirection: 'row',
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
  },

  verbDetailsHebrew: {
    fontSize: 19,
    color: '#FFFDEF',
    fontWeight: 'bold',
    marginTop: hp('1%'),
    marginBottom: hp('0.1%'),
  },

  verbDetailsTranslit: {
    fontSize: 13,
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
    fontSize: 14,
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
    width: '250%',
    height: '250%',
    resizeMode: 'contain',
  },

  // ✅ NEW: details-only highlight style (no fontWeight -> no width jump)
  detailsHighlight: {
    color: 'rgba(255, 251, 0, 1)',
  },
});

export default Exercise3En;
