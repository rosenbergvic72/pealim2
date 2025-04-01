import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';
import sounds from './Soundss';
import TypewriterTextRTL from './TypewriterTextRTL';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const VerbCard1Es = ({ verbData, onAnswer, soundEnabled }) => {
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

  const playAudio = async (audioFileName) => {
    try {
      const fileNameKey = audioFileName.replace('.mp3', '');
      const audioFile = sounds[fileNameKey];
      
      if (!audioFile) {
        console.error(`Audio file ${audioFileName} not found.`);
        return;
      }

      await sound?.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
      setSound(newSound);
      setIsPlaying(true);
      await newSound.playAsync();
      setTimeout(() => {
        setIsPlaying(false);
      }, 1000); // Show animation for 1 second
    } catch (error) {
      console.error('Error loading sound', error);
    }
  };

  useEffect(() => {
    if (verbData && verbData.audioFile && soundEnabled) {
      playAudio(verbData.audioFile);
    }
  }, [verbData, soundEnabled]);

  const [opacity1] = useState(new Animated.Value(0));
  const [opacity2] = useState(new Animated.Value(0));
  const [opacity3] = useState(new Animated.Value(0));
  const [opacity4] = useState(new Animated.Value(0));
  const [shadowEnabled, setShadowEnabled] = useState(false);

  useEffect(() => {
    opacity1.setValue(0);
    opacity2.setValue(0);
    opacity3.setValue(0);
    opacity4.setValue(0);
    setShadowEnabled(false);

    Animated.timing(opacity1, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    setTimeout(() => Animated.timing(opacity2, { toValue: 1, duration: 500, useNativeDriver: true }).start(), 100);
    setTimeout(() => Animated.timing(opacity3, { toValue: 1, duration: 500, useNativeDriver: true }).start(), 200);
    setTimeout(() => {
      Animated.timing(opacity4, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      setTimeout(() => {
        setShadowEnabled(true);
      }, 500);
    }, 300);
  }, [verbData]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current?.play();
    } else {
      animationRef.current?.reset();
    }
  }, [isPlaying]);

  return (
    <Animated.View style={[styles.cardContainer, shadowEnabled && styles.cardShadow]}>
      <View style={styles.hebrewVerbContainer}>
        {isPlaying && (
          <LottieView
            ref={animationRef}
            source={require('./assets/Animation - 1718430107767.json')}
            autoPlay
            loop={false} // Only play once
            style={styles.lottieAnimation}
          />
        )}
        <TypewriterTextRTL text={verbData.hebrewVerb} maxFontSizeMultiplier={1.2} typingSpeed={100} style={styles.hebrewVerb} />
        <Animated.Text style={[styles.translit, { opacity: opacity2 }]} maxFontSizeMultiplier={1.2}>{verbData.transliteration}</Animated.Text>
        <Animated.Text style={[styles.root, { opacity: opacity3 }]} maxFontSizeMultiplier={1.2}>{`Raíz: ${verbData.root}`}</Animated.Text>
        <Animated.Text style={[styles.bin, { opacity: opacity4 }]} maxFontSizeMultiplier={1.2}>{`Binyan: ${verbData.binyan}`}</Animated.Text>
        <TouchableOpacity onPress={() => playAudio(verbData.audioFile)} style={styles.audioButton}>
          <Image source={require('./speaker3.png')} style={styles.audioIcon} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    borderRadius: wp('2.5%'), // адаптируем радиус
    marginBottom: hp('2%'), // адаптируем отступы
    padding: wp('2%'), // адаптируем внутренние отступы
    backgroundColor: '#FFFDEF',
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: hp('0.25%'), // адаптируем тень по высоте
    },
    shadowOpacity: 0.25,
    shadowRadius: wp('2%'), // адаптируем радиус тени
    elevation: 5,
  },
  hebrewVerbContainer: {
    alignItems: 'center',
    position: 'relative', // для размещения анимации Lottie
  },
  lottieAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 32, // адаптируем размер
    height: 32, // адаптируем размер
  },
  hebrewVerb: {
    fontSize: 30, // адаптируем размер шрифта
    fontWeight: 'bold',
    color: '#333652',
    borderRadius: wp('5%'), // адаптируем радиус
    paddingLeft: wp('2.5%'), // адаптируем внутренние отступы
    paddingRight: wp('2.5%'), // адаптируем внутренние отступы
    textAlign: 'center',
  },
  translit: {
    fontSize: 18, // адаптируем размер шрифта
    fontWeight: 'bold',
    color: '#CE6857',
    borderRadius: wp('5%'), // адаптируем радиус
    paddingLeft: wp('2.5%'), // адаптируем внутренние отступы
    paddingRight: wp('2.5%'), // адаптируем внутренние отступы
    marginBottom: hp('1.5%'), // адаптируем отступ снизу
  },
  root: {
    fontSize: 14, // адаптируем размер шрифта
    fontWeight: 'bold',
    color: '#4C7031',
    borderRadius: wp('5%'), // адаптируем радиус
    paddingLeft: wp('2.5%'), // адаптируем внутренние отступы
    paddingRight: wp('2.5%'), // адаптируем внутренние отступы
  },
  bin: {
    fontSize: 14, // адаптируем размер шрифта
    fontWeight: 'bold',
    color: '#003882',
    borderRadius: wp('5%'), // адаптируем радиус
    paddingLeft: wp('2.5%'), // адаптируем внутренние отступы
    paddingRight: wp('2.5%'), // адаптируем внутренние отступы
    marginBottom: hp('2%'), // адаптируем отступ снизу
  },
  audioButton: {
    marginTop: hp('2%'), // адаптируем отступ сверху
    position: 'absolute',
    right: wp('1.25%'), // адаптируем позиционирование
    bottom: wp('1.25%'), // адаптируем позиционирование
  },
  audioIcon: {
    width: wp('8%'), // адаптируем размер
    height: wp('8%'), // адаптируем размер
    borderRadius: wp('2.5%'), // адаптируем радиус
  },
});

export default VerbCard1Es;
