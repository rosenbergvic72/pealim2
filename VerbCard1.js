import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
// ❌ Lottie убран
// import LottieView from 'lottie-react-native';
import sounds from './Soundss';
import TypewriterTextRTL from './TypewriterTextRTL';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const VerbCard1 = ({ verbData, onAnswer, soundEnabled }) => {
  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playAudio = async (audioFileName) => {
    try {
      const fileNameKey = audioFileName.replace('.mp3', '');
      const audioFile = sounds[fileNameKey];

      if (!audioFile) {
        console.error(`Audio file ${audioFileName} not found.`);
        return;
      }

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(audioFile);
      soundRef.current = sound;
      setIsPlaying(true);
      await sound.playAsync();
      setTimeout(() => {
        setIsPlaying(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading sound', error);
    }
  };

  useEffect(() => {
    if (verbData && verbData.audioFile && soundEnabled) {
      playAudio(verbData.audioFile);
    }
  }, [verbData, soundEnabled]);

  const opacity1 = useRef(new Animated.Value(0)).current;
  const opacity2 = useRef(new Animated.Value(0)).current;
  const opacity3 = useRef(new Animated.Value(0)).current;
  const opacity4 = useRef(new Animated.Value(0)).current;
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

  return (
    <Animated.View style={[styles.cardContainer, shadowEnabled && styles.cardShadow]}>
      <View style={styles.hebrewVerbContainer}>
        {/* Вместо Lottie — простая иконка при воспроизведении */}
        {isPlaying && (
          <Image
            source={require('./speaker3.png')}
            style={styles.playingIcon}
          />
        )}
        <TypewriterTextRTL
          text={verbData.hebrewVerb}
          maxFontSizeMultiplier={1.2}
          typingSpeed={100}
          style={styles.hebrewVerb}
        />
        <Animated.Text style={[styles.translit, { opacity: opacity2 }]} maxFontSizeMultiplier={1.2}>
          {verbData.transliteration}
        </Animated.Text>
        <Animated.Text style={[styles.root, { opacity: opacity3 }]} maxFontSizeMultiplier={1.2}>
          {`Корень: ${verbData.root}`}
        </Animated.Text>
        <Animated.Text style={[styles.bin, { opacity: opacity4 }]} maxFontSizeMultiplier={1.2}>
          {`Биньян: ${verbData.binyan}`}
        </Animated.Text>
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
    borderRadius: wp('2.5%'),
    marginBottom: hp('2%'),
    padding: wp('2%'),
    backgroundColor: '#FFFDEF',
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: hp('0.25%'),
    },
    shadowOpacity: 0.25,
    shadowRadius: wp('2%'),
    elevation: 5,
  },
  hebrewVerbContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  playingIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 32,
    height: 32,
  },
  hebrewVerb: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333652',
    borderRadius: wp('5%'),
    paddingLeft: wp('2.5%'),
    paddingRight: wp('2.5%'),
    textAlign: 'center',
  },
  translit: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CE6857',
    borderRadius: wp('5%'),
    paddingLeft: wp('2.5%'),
    paddingRight: wp('2.5%'),
    marginBottom: hp('1.5%'),
  },
  root: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4C7031',
    borderRadius: wp('5%'),
    paddingLeft: wp('2.5%'),
    paddingRight: wp('2.5%'),
  },
  bin: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003882',
    borderRadius: wp('5%'),
    paddingLeft: wp('2.5%'),
    paddingRight: wp('2.5%'),
    marginBottom: hp('2%'),
  },
  audioButton: {
    marginTop: hp('2%'),
    position: 'absolute',
    right: wp('1.25%'),
    bottom: wp('1.25%'),
  },
  audioIcon: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2.5%'),
  },
});

export default VerbCard1;
