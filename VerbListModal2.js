// VerbListModal2.js

import React, { useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Vibration,
  BackHandler,
} from 'react-native';
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
    русский: 'ru',
    english: 'en',
    français: 'fr',
    español: 'es',
    português: 'pt',
    العربية: 'ar',
    አማርኛ: 'am',
    עברית: 'he',
    ru: 'ru',
    en: 'en',
    fr: 'fr',
    es: 'es',
    pt: 'pt',
    ar: 'ar',
    am: 'am',
    he: 'he',
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
  const translationKey = translationFieldMap[langKey] || 'entext';
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

  // Вибро + клик при открытии
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

  // Аппаратная «Назад» — закрыть модалку (Android)
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose?.();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

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

  // --- ВАЖНО: нормализация данных и фиксация порядка/ключа ---
  const normalizedData = useMemo(() => {
    if (!Array.isArray(verbs)) return [];
    const withOrder = verbs.map((it, i) => ({
      ...it,
      _order: Number.isFinite(it._order)
        ? it._order
        : (Number.isFinite(it.order) ? it.order : i),
      _key:
        it.mp3 ||
        it.audioFile ||
        `${it.infinitive || 'v'}-${it.gender || 'x'}-${i}`,
    }));
    return withOrder.slice().sort((a, b) => a._order - b._order);
  }, [verbs]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <FadeInView style={styles.overlay}>
        <View style={styles.container}>
          {/* Шапка с инфой о глаголе */}
          <View style={styles.verbInfoBlock}>
            <Text style={styles.verbInfoTitle}>{title}</Text>

            <View style={styles.verbMainInfoRow}>
              {/* Перевод слева */}
              <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'center' }}>
                <Text style={styles.verbTranslation}>{mainVerb[dictionaryTranslationKey]}</Text>
              </View>
              {/* Иврит + транслит справа */}
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.verbHebrew}>{mainVerb.infinitive}</Text>
                {mainVerb.transliteration ? (
                  <Text style={styles.verbTranslit}>{mainVerb.transliteration}</Text>
                ) : null}
              </View>
            </View>
          </View>

          <FlatList
            data={normalizedData}
            keyExtractor={(item) => item._key}
            extraData={langKey}
            renderItem={({ item, index }) => {
              const genderIcon = getImageForGender(item.gender);
              const translation = item[translationKey] || '—';
              const pos = Number.isFinite(item._order) ? item._order : index;

              let backgroundColor = '#F2F4F8';
              if (pos < 12) backgroundColor = '#EAF2FF';
              else if (pos < 24) backgroundColor = '#FDF3E7';
              else backgroundColor = '#E7F7F0';

              return (
                <View style={[styles.row, { backgroundColor }]}>
                  <View style={styles.verbLeft}>
                    {genderIcon && <Image source={genderIcon} style={styles.genderIcon} />}
                    <Text style={styles.translation} maxFontSizeMultiplier={1.2}>
                      {translation}
                    </Text>
                  </View>
                  <View style={styles.verbRight}>
                    <TouchableOpacity
                      onPress={() => playMp3(item.mp3 || item.mp3Inf || item.mp3Conj || item.audioFile)}
                      style={styles.speakerButton}
                    >
                      <Image source={require('./speaker6.png')} style={styles.speakerIcon} />
                    </TouchableOpacity>
                    <Text style={styles.hebrew} maxFontSizeMultiplier={1.2}>
                      {item.hebrewtext || '—'}
                    </Text>
                    <Text style={styles.translit} maxFontSizeMultiplier={1.2}>
                      {item.translit || '—'}
                    </Text>
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
            <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>
              {buttonText}
            </Text>
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
    paddingTop: 20,
  },
  container: {
    backgroundColor: '#fff',
    width: '96%',
    // было: height: '96%' — из-за этого "липло" к камере
    maxHeight: '92%',
    marginVertical: 10,
    borderRadius: 10,
    padding: 20,
  },

  /* Шапка */
  verbInfoBlock: {
    backgroundColor: '#D1E3F1',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    marginTop: 2,
    shadowColor: '#6385a5',
    shadowOpacity: 0.32,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 9,
  },
  verbInfoTitle: {
    backgroundColor: '#F2F4F8',
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
  verbMainInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8FFF4',
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

  /* Список форм */
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

  /* Кнопка "Начать упражнение" */
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
});

export default VerbListModal2;
