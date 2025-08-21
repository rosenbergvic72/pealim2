// VerbListModal2.js

import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Vibration } from 'react-native';
import FadeInView from './api/FadeInView';
import { Audio } from 'expo-av';
import soundsConj from './soundconj';

const titles = {
  ru: 'Глагол упражнения и спряжения',
  en: 'Exercise verb & conjugations',
  fr: 'Verbe et conjugaisons',
es: 'Verbo y conjugaciones',
pt: 'Verbo e conjugações',

  ar: 'فعل التمرين وتصريفاته',
  am: 'የልምምዱ ግስ እና ቅጾቹ',
  he: 'הפועל בתרגיל והטיותיו',
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

const titleBackgrounds = {
  ru: '#EAF2FF',   // светло-голубой
  en: '#EAF2FF',
  fr: '#EAF2FF',
  es: '#FFF6E2',   // светло-жёлтый/кремовый
  pt: '#E5FFF5',   // светло-зелёный
  ar: '#FFE5EC',   // розовый
  am: '#F2E9FF',   // светло-фиолетовый
  he: '#E7FBFF',   // голубой
  default: '#EAF2FF',
};

const isRTL = (lang) => ['ar', 'am'].includes(lang);

const translationFieldMap = {
  ru: 'russiantext',
  en: 'entext',     
  fr: 'frtext',
  es: 'estext',
  pt: 'pttext',
  ar: 'artext',
  am: 'amtext',
  he: 'hebrewtext',
};

const VerbListModal2 = ({ visible, onClose, onStartExercise, verbs, language }) => {
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
  'ru': 'ru',
  'en': 'en',
  'fr': 'fr',
  'es': 'es',
  'pt': 'pt',
  'ar': 'ar',
  'am': 'am',
  'he': 'he'
};


  const dictionaryTranslationFieldMap = {
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
  const dictionaryTranslationKey = dictionaryTranslationFieldMap[langKey] || 'english';
  const title = titles[langKey] || titles[fallbackLang];
  const buttonText = buttonTexts[langKey] || buttonTexts[fallbackLang];
  const textKey = langKey === 'pt' ? 'pttext' : langKey + 'text';
  const titleBgColor = titleBackgrounds[langKey] || titleBackgrounds.default;
  const translationKey = translationFieldMap[langKey] || 'english';
  const mainVerb = verbs?.[0] || {};
  

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
            if (status.didJustFinish) sound.unloadAsync();
          });
        } catch (e) {
          console.log('Ошибка звука:', e);
        }
      };
      playSound();
    }
  }, [visible]);

  const playMp3 = async (fileName) => {
    if (!fileName) {
      console.warn('⛔ Нет имени файла mp3');
      return;
    }
    const key = fileName.replace('.mp3', '');
    const soundFile = soundsConj[key];
    if (!soundFile) {
      console.warn(`⚠️ Файл для ключа "${key}" не найден в soundsConj`);
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
    } catch (e) {
      console.warn('❌ Ошибка при проигрывании файла:', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <FadeInView style={styles.overlay}>
        <View style={styles.container}>
        {/* Информация о глаголе */}
{/* Единая цветная шапка с заголовком, инфинитивом, транслитом и переводом */}
{/* Блок с инфой о глаголе */}
<View style={styles.verbInfoBlock}>
  {/* Цветной фон для заголовка */}
  <Text style={styles.verbInfoTitle}>{title}</Text>

  {/* Цветной фон для данных о глаголе */}
  <View style={styles.verbMainInfoRow}>
    {/* Перевод слева */}
   <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'center' }}>
  <Text style={styles.verbTranslation}>
    {mainVerb[dictionaryTranslationKey]}
  </Text>
</View>
    {/* Иврит и транслит справа */}
    <View style={{ flex: 1, alignItems: 'flex-end' }}>
      <Text style={styles.verbHebrew}>{mainVerb.infinitive}</Text>
      {mainVerb.transliteration ? (
        <Text style={styles.verbTranslit}>{mainVerb.transliteration}</Text>
      ) : null}
    </View>
  </View>
</View>





          <FlatList
            data={verbs}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => {
              const genderIcon = getImageForGender(item.gender);
              const translation = item[translationKey] || '—';
              let backgroundColor = '#F2F4F8'; // по умолчанию
              if (index < 12) backgroundColor = '#EAF2FF';
              else if (index < 24) backgroundColor = '#FDF3E7';
              else backgroundColor = '#E7F7F0';

              return (
                <View style={[styles.row, { backgroundColor }]}>
                  <View style={styles.verbLeft}>
                    {genderIcon && (
                      <Image source={genderIcon} style={styles.genderIcon} />
                    )}
                    <Text style={styles.translation}maxFontSizeMultiplier={1.2}>{translation}</Text>
                  </View>
                  <View style={styles.verbRight}>
                    <TouchableOpacity onPress={() => playMp3(item.mp3)} style={styles.speakerButton}>
                      <Image source={require('./speaker6.png')} style={styles.speakerIcon} />
                    </TouchableOpacity>
                    <Text style={styles.hebrew}maxFontSizeMultiplier={1.2}>{item.hebrewtext || '—'}</Text>
                    <Text style={styles.translit}maxFontSizeMultiplier={1.2}>{item.translit || '—'}</Text>
                  </View>
                </View>
              );
            }}
          />
          <TouchableOpacity
            onPress={() => {
              if (onStartExercise) onStartExercise();
              else if (onClose) onClose();
            }}
            style={styles.button}
          >
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
    marginBottom: 6,
    textAlign: 'center',
    borderRadius: 8,
    padding: 12,
    letterSpacing: 0.2,
  },
//   verbInfoBlock: {
//     alignItems: 'center',
//     marginBottom: 13,
//     marginTop: -4,
//     padding: 10,
//     backgroundColor: '#E7F7F0',
//     borderRadius: 7,
//     borderWidth: 1,
//     borderColor: '#D2D7E8',
//     elevation: 1,
//   },
  verbHebrew: {
    fontSize: 20,
    color: '#2F4766',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  verbTranslit: {
    fontSize: 15,
    color: '#C03A2B',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  verbTranslation: {
    fontSize: 16,
    color: '#0A2441',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F4F8',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 5,
    marginBottom: 12,
    elevation: 2,
    minHeight: 50,
  },
  verbLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.1,
  },
  translation: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: 'bold',
    color: '#333',
    flexWrap: 'wrap',
    flexShrink: 1,
    flex: 1,
  },
  verbRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    position: 'relative',
  },
  hebrew: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#2F4766',
    marginRight: 32,
    flexShrink: 0,
    flexWrap: 'nowrap',
    textAlign: 'right',
  },
  translit: {
    fontStyle: 'italic',
    color: '#C03A2B',
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 32,
    flexShrink: 0,
    flexWrap: 'nowrap',
    textAlign: 'right',
  },
  speakerButton: {
    position: 'absolute',
    right: -28,
    top: '50%',
    transform: [{ translateY: -11 }],
    marginRight: 30,
  },
  speakerIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  genderIcon: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
    marginLeft: -3,
  },
  button: {
    backgroundColor: '#4A6491',
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
verbInfoBlock: {
  backgroundColor: '#D1E3F1', // светло-голубой
  borderRadius: 12,
  padding: 14,
  marginBottom: 18,
  marginTop: 2,
  // Тень для iOS
  shadowColor: '#6385a5',        // более насыщенный оттенок
  shadowOpacity: 0.32,           // выше прозрачность
  shadowOffset: { width: 0, height: 6 }, // больше смещение по Y
  shadowRadius: 12,              // сильнее размытость
  // Тень для Android
  elevation: 9,                  // выше elevation (от 6 до 12 — уже хорошо)
},

  // Заголовок
  verbInfoTitle: {
    backgroundColor: '#F2F4F8', // другой оттенок голубого
    color: '#2F4766',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    letterSpacing: 0.2,
    elevation: 1,
  },
  // Блок с перевод/иврит/транслит
  verbMainInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8FFF4', // светло-зеленый (отличается от заголовка)
    borderRadius: 9,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginBottom: 1,
    elevation: 1,
  },
  verbTranslation: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A3455',
    textAlign: 'left',
  },
  verbHebrew: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#275BA0',
    textAlign: 'right',
  },
  verbTranslit: {
    fontSize: 14,
    color: '#E03E38',
    fontStyle: 'italic',
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 2,
  },

});

export default VerbListModal2;
