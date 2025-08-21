import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import FadeInView from './api/FadeInView';
import { Vibration } from 'react-native';
import { Audio } from 'expo-av';
import { useEffect } from 'react';
import soundsConj from './Soundss';
import { Image } from 'react-native';

const titles = {
  ru: 'Глаголы в этом упражнении',
  en: 'Verbs in this exercise',
  fr: 'Verbes dans cet exercice',
  es: 'Verbos en este ejercicio',
  pt: 'Verbos neste exercício',
  ar: 'الأفعال في هذا التمرين',
  am: 'ግሶች በዚህ ልምምድ',
  he: 'פעלים בתרגיל הזה',
};

const buttonTexts = {
  ru: 'Начать упражнение',
  en: 'Start Exercise',
  fr: 'Commencer l’exercice',
  es: 'Comenzar ejercicio',
  pt: 'Começar exercício',
  ar: 'ابدأ التمرين',
  am: 'ልምምዱን ጀምር',
  he: 'התחל תרגול',
};

const isRTL = (lang) => ['ar', 'am'].includes(lang);

const VerbListModal = ({ visible, onClose, verbs, language }) => {
  const fallbackLang = 'en';

  const languageMap = {
    'русский': 'ru',
    'english': 'en',
    'français': 'fr',
    'español': 'es',
    'português': 'pt',
    'العربية': 'ar',
    'አማርኛ': 'am',
    'עברית': 'he',
  };

  const translationFieldMap = {
    ru: 'russian',
    en: 'english',
    fr: 'french',
    es: 'spanish',
    pt: 'portu',
    ar: 'arabic',
    am: 'amharic',
    he: 'hebrew',
  };

  const langKey = languageMap[language] || language || fallbackLang;
  const title = titles[langKey] || titles[fallbackLang];
  const buttonText = buttonTexts[langKey] || buttonTexts[fallbackLang];
  const translationKey = translationFieldMap[langKey] || 'english';

  useEffect(() => {
    if (visible) {
      Vibration.vibrate(100);

      const playSound = async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require('./api/click.mp3'),
            { shouldPlay: true }
          );
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              sound.unloadAsync();
            }
          });
        } catch (error) {
          console.log('Ошибка при воспроизведении звука:', error);
        }
      };

      playSound();
    }
  }, [visible]);

  const playMp3 = async (mp3FileName) => {
    if (!mp3FileName) return;

    const soundFile = soundsConj[mp3FileName.replace('.mp3', '')];
    if (!soundFile) {
      console.warn('Файл не найден:', mp3FileName);
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(soundFile);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Ошибка воспроизведения звука:', error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <FadeInView style={styles.overlay}>
        <View style={styles.container}>
          <Text style={[styles.title, isRTL(language) && { textAlign: 'right' }]}maxFontSizeMultiplier={1.2}>{title}</Text>
          <FlatList
            data={verbs}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.bubble}>
                <View style={styles.verbLeft}>
                  <Text style={styles.entext}maxFontSizeMultiplier={1.2}>{item.entext}</Text>
                </View>
                <View style={styles.verbRight}>
                  <TouchableOpacity onPress={() => playMp3(item.mp3)} style={styles.speakerButton}>
                    <Image source={require('./speaker6.png')} style={styles.speakerIcon} />
                  </TouchableOpacity>
                  <Text style={styles.hebrew}maxFontSizeMultiplier={1.2}>{item.hebrewtext}</Text>
                  <Text style={styles.translit}maxFontSizeMultiplier={1.2}>{item.translit}</Text>
                </View>
              </View>
            )}
          />
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}maxFontSizeMultiplier={1.2}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </FadeInView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    width: '96%',
    height: '96%',
    borderRadius: 10,
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
    backgroundColor: '#C3D2EB', // ← светлый жёлтый фон
    borderRadius: 8,
    color: '#003366',           // ← тёмно-синий текст
    padding: 12,
  },
  verbRow: {
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4A6491', // тёмно-синий
    padding: 12,
    marginTop: 20,
    borderRadius: 8,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  bubble: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F4F8',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  verbLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  verbRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    position: 'relative',
  },
  hebrew: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#2F4766',
    marginRight: 30,
  },
  translit: {
    fontStyle: 'italic',
    color: '#C03A2B',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 30,
  },
  entext: {
    color: '#333',
    fontSize: 15,
    textAlign: 'left',
    fontWeight: 'bold',
  },
  hebrewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 30,
  },
  speakerButton: {
    position: 'absolute',
    right: -28,
    top: '50%',
    transform: [{ translateY: -11 }],
    marginRight: 24,
  },
  speakerIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
});

export default VerbListModal;
