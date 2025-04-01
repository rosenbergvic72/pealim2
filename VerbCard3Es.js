// VerbCard3.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import sounds from './Soundss';
import TypewriterTextRTL from './TypewriterTextRTL';
import LottieView from 'lottie-react-native';

const VerbCard3Es = ({ verbData, onAnswer, soundEnabled }) => {
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playAudio = async (audioFileName, isAutoPlay = false) => {
    try {
      // Если это автоматическое воспроизведение и звук отключен — не воспроизводим
      if (isAutoPlay && !soundEnabled) {
        console.log('Sound is disabled, skipping automatic playback.');
        return;
      }

      const fileNameKey = audioFileName.replace('.mp3', '');
      const audioFile = sounds[fileNameKey];

      if (!audioFile) {
        console.error(`Audio file ${audioFileName} not found.`);
        return;
      }

      await sound?.unloadAsync(); // Останавливаем предыдущий звук
      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
      setSound(newSound);
      setIsPlaying(true);
      await newSound.playAsync(); // Воспроизводим новый звук
      setTimeout(() => {
        setIsPlaying(false);
      }, 1000); // Анимация на 1 секунду
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  // Автоматическое воспроизведение звука инфинитива
  useEffect(() => {
    if (verbData && verbData.audioFile) {
      playAudio(verbData.audioFile, true); // Передаем флаг isAutoPlay = true
    }
  }, [verbData, soundEnabled]);

  const shuffleArray = (array) => {
    const shuffledArray = array.slice();
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  };

  const generateOptions = () => {
    const correctAnswerIndex = verbData.correctTranslationIndex;
    const correctTranslation = verbData.binyanOptions[correctAnswerIndex];
    const incorrectOptions = verbData.binyanOptions.filter(
      (_, index) => index !== correctAnswerIndex
    );

    const shuffledOptions = shuffleArray(
      incorrectOptions.map((option) => ({ text: option, isCorrect: false }))
    );

    // Вставляем правильный ответ в случайное место
    shuffledOptions.splice(
      Math.floor(Math.random() * (shuffledOptions.length + 1)),
      0,
      { text: correctTranslation, isCorrect: true }
    );

    return shuffledOptions;
  };

  const shuffledOptions = generateOptions();

  const handlePress = (selectedOptionIndex) => {
    const isCorrect = shuffledOptions[selectedOptionIndex].isCorrect;
    onAnswer(isCorrect);
  };

  const [opacity1] = useState(new Animated.Value(0));
  const [opacity2] = useState(new Animated.Value(0));
  const [opacity3] = useState(new Animated.Value(0));
  const [opacity4] = useState(new Animated.Value(0));

  useEffect(() => {
    // Сброс значений прозрачности перед началом новой анимации
    opacity1.setValue(0);
    opacity2.setValue(0);
    opacity3.setValue(0);
    opacity4.setValue(0);

    // Последовательный запуск анимации для каждого текстового элемента
    Animated.timing(opacity1, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    setTimeout(() => Animated.timing(opacity2, { toValue: 1, duration: 500, useNativeDriver: true }).start(), 100);
    setTimeout(() => Animated.timing(opacity3, { toValue: 1, duration: 500, useNativeDriver: true }).start(), 200);
    setTimeout(() => Animated.timing(opacity4, { toValue: 1, duration: 500, useNativeDriver: true }).start(), 300);
  }, [verbData]); // Эффект запускается при каждом изменении verbData

  useEffect(() => {
    if (isPlaying) {
      animationRef.current?.play();
    } else {
      animationRef.current?.reset();
    }
  }, [isPlaying]);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.hebrewVerbContainer}>
        {isPlaying && (
          <LottieView
            ref={animationRef}
            source={require('./assets/Animation - 1718430107767.json')}
            autoPlay
            loop={false}
            style={styles.lottieAnimation}
          />
        )}
        <TypewriterTextRTL text={verbData.hebrewVerb} maxFontSizeMultiplier={1.2} typingSpeed={100} style={styles.hebrewVerb} />
        <Animated.Text style={[styles.translit, { opacity: opacity2 }]} maxFontSizeMultiplier={1.2}>{verbData.transliteration}</Animated.Text>
        <Animated.Text style={[styles.root, { opacity: opacity3 }]} maxFontSizeMultiplier={1.2}>{`Root: ${verbData.root}`}</Animated.Text>
        <Animated.Text style={[styles.bin, { opacity: opacity4 }]} maxFontSizeMultiplier={1.2}>{verbData.verbSpanish}</Animated.Text>
        <TouchableOpacity onPress={() => playAudio(verbData.audioFile)} style={styles.audioButton}>
          <Image source={require('./speaker3.png')} style={styles.audioIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    borderRadius: 10,
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#FFFDEF',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  hebrewVerbContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  hebrewVerb: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#333652',
    borderRadius: 20,
    // padding: 1,
    paddingLeft: 10,
    paddingRight: 10,
    textAlign: 'center',
  },
  translit: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CE6857',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 5,
    marginTop: 10,
  },
  root: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4C7031',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 10,
  },
  bin: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003882',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 10,
    marginTop: 5,
    marginBottom: 10,
  },
  audioButton: {
    marginTop: 10,
    position: 'absolute',
    right: 5,
    bottom: 5,
  },
  audioIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  lottieAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
  },
});

export default VerbCard3Es;
