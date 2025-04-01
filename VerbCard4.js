import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import TypewriterTextLTR from './TypewriterTextLTR';
import TypewriterTextRTL from './TypewriterTextRTL';
import { Audio } from 'expo-av';

const VerbCard4 = ({ verbData, answered }) => {
  // Проверка на существование verbData перед его использованием
  if (!verbData) {
    return null; // Можно также вернуть заглушку или другой компонент загрузки
  }

  // Деструктуризация для удобства доступа к данным
  const { sentence, soundFile } = verbData;
  const { russian, hebrew } = sentence;

  // Функция для воспроизведения звука
  const playSound = async (file) => {
    const soundObject = new Audio.Sound();
    try {
      await soundObject.loadAsync(file);
      await soundObject.playAsync();
    } catch (error) {
      console.error('Ошибка при воспроизведении звука:', error);
    }
  };

  return (
    <View style={styles.sentenceContainer}>
      {/* Контейнер для русского предложения */}
      <View style={[styles.cardContainer, styles.russianContainer]}>
        <TypewriterTextLTR text={russian} typingSpeed={30} textStyle={{ fontSize: 24 }} />
      </View>

      {/* Контейнер для предложения на иврите */}
      <View style={[styles.cardContainer, styles.hebrewContainer]}>
        <TypewriterTextRTL text={answered ? hebrew[1] : hebrew[0]} typingSpeed={30} textStyle={{ fontSize: 24, color: 'white' }} />
        {/* Условное отображение кнопки с иконкой speaker */}
        {answered && (
          <TouchableOpacity style={styles.speakerButton} onPress={() => playSound(soundFile)}>
            <Image source={require('./speaker1.png')} style={styles.speakerIcon} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sentenceContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 5,
    borderRadius: 10,
    marginBottom: 5,
    marginTop: 10,
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    height: 110,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#D1E3F1',
    marginTop: 10,
  },
  russianContainer: {
    backgroundColor: '#D1E3F1',
  },
  hebrewContainer: {
    backgroundColor: '#394860',
  },
  speakerButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  speakerIcon: {
    width: 56,
    height: 56,
  },
});

export default VerbCard4;
