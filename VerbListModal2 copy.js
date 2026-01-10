// VerbListModal2.jsx
import React, { useCallback, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Audio } from 'expo-av';
import soundsconj from './soundconj';

// props:
// visible, language, verbs, onStartExercise, onClose
const VerbListModal2 = ({
  visible,
  language = 'ru',
  verbs = [],
  onStartExercise,
  onClose,
}) => {
  const [sound, setSound] = useState(null);

  /* === НОРМАЛИЗАЦИЯ ЯЗЫКА === */
  const languageMap = {
    // коды
    ru: 'ru',
    en: 'en',
    fr: 'fr',
    es: 'es',
    pt: 'pt',
    ar: 'ar',
    am: 'am',
    he: 'he',
    // названия
    русский: 'ru',
    english: 'en',
    français: 'fr',
    español: 'es',
    português: 'pt',
    العربية: 'ar',
    አማርኛ: 'am',
    עברית: 'he',
  };

  const langCode = languageMap[language] || language || 'ru';

  /* === ЗАГОЛОВОК МОДАЛКИ === */
  const headerTitleByLang = {
    ru: 'Глагол упражнения и спряжения',
    en: 'Exercise verb & conjugations',
    fr: "Verbe de l’exercice et conjugaisons",
    es: 'Verbo del ejercicio y conjugaciones',
    pt: 'Verbo do exercício e conjugações',
    ar: 'فعل التمرين والتصريفات',
    am: 'ግስ እና ልዩ ልዩ ቅጾች',
    he: 'הפועל בתרגיל והטיותיו',
  };

  /* === ПОЛЕ ДЛЯ ПЕРЕВОДА ОСНОВНОГО ГЛАГОЛА (в шапке) === */
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

  /* === ПОЛЕ ДЛЯ ПЕРЕВОДА ФОРМ (левая колонка) === */
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

  // 🔹 Подписи кнопок для всех языков
  const buttonLabelsByLang = {
    ru: {
      start: 'Начать упражнение',
      close: 'Закрыть',
    },
    en: {
      start: 'Start exercise',
      close: 'Close',
    },
    fr: {
      start: "Commencer l'exercice",
      close: 'Fermer',
    },
    es: {
      start: 'Empezar el ejercicio',
      close: 'Cerrar',
    },
    pt: {
      start: 'Iniciar exercício',
      close: 'Fechar',
    },
    ar: {
      start: 'بدء التمرين',
      close: 'إغلاق',
    },
    am: {
      start: 'መልምድ ጀምር',
      close: 'ዝጋ',
    },
    he: {
      start: 'התחל תרגול',
      close: 'סגור',
    },
  };

  const headerTitle = headerTitleByLang[langCode] || headerTitleByLang.ru;
  const dictionaryTranslationKey =
    dictionaryTranslationFieldMap[langCode] || 'russian';
  const translationKey = translationFieldMap[langCode] || 'russiantext';
  const buttonLabels = buttonLabelsByLang[langCode] || buttonLabelsByLang.ru;

  const mainVerb = verbs[0];

  const playConjAudio = useCallback(
    async (mp3Key) => {
      try {
        if (!mp3Key) return;

        const key = mp3Key.replace('.mp3', '');
        const audioFile = soundsconj[key];
        if (!audioFile) {
          console.warn('⚠️ Audio not found for key:', key);
          return;
        }

        if (sound) {
          await sound.unloadAsync();
        }

        const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
        setSound(newSound);
        await newSound.playAsync();
      } catch (e) {
        console.error('Error playing sound', e);
      }
    },
    [sound]
  );

  if (!mainVerb) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <View style={styles.headerBlock}>
            <Text style={styles.headerTitle} maxFontSizeMultiplier={1.2}>
              {headerTitle}
            </Text>

            <View style={styles.headerVerbRow}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerMeaning} maxFontSizeMultiplier={1.2}>
                  {mainVerb[dictionaryTranslationKey]}
                </Text>
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.headerInf} maxFontSizeMultiplier={1.2}>
                  {mainVerb.infinitive}
                </Text>
                {mainVerb.transliteration ? (
                  <Text
                    style={styles.headerTranslit}
                    maxFontSizeMultiplier={1.2}
                    numberOfLines={1}
                  >
                    {mainVerb.transliteration}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* LIST */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {verbs.map((form, idx) => {
              const translation =
                form[translationKey] ||
                form.russiantext ||
                form.entext ||
                '—';

              return (
                <View key={`${form.hebrewtext}-${idx}`} style={styles.row}>
                  {/* LEFT: ICON + TRANSLATION */}
                  <View style={styles.leftCol}>
                    {form.gender && (
                      <Image
                        source={getGenderIcon(form.gender)}
                        style={styles.genderIcon}
                      />
                    )}
                    <Text
                      style={styles.leftText}
                      maxFontSizeMultiplier={1.2}
                      numberOfLines={2}
                    >
                      {translation}
                    </Text>
                  </View>

                  {/* RIGHT: HEBREW + SPEAKER + TRANSLIT */}
                  <View style={styles.rightCol}>
                    <View style={styles.hebrewRow}>
                      <Text
                        style={styles.hebrewText}
                        maxFontSizeMultiplier={1.2}
                        numberOfLines={1}
                      >
                        {form.hebrewtext}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          playConjAudio(
                            form.mp3 || form.mp3Inf || form.mp3Conj || form.audioFile
                          )
                        }
                        style={styles.speakerButton}
                      >
                        <Image
                          source={require('./speaker3.png')}
                          style={styles.speakerIcon}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* транслитерация – одна Text, естественный перенос, с паддингом справа */}
                    <Text
                      style={styles.verbTranslit}
                      maxFontSizeMultiplier={1.2}
                      numberOfLines={2}
                    >
                      {form.translit}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* BUTTONS */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={onStartExercise}
            >
              <Text style={styles.startButtonText} maxFontSizeMultiplier={1.2}>
                {buttonLabels.start}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText} maxFontSizeMultiplier={1.2}>
                {buttonLabels.close}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getGenderIcon = (gender) => {
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '94%',
    maxHeight: '94%',
    backgroundColor: '#F4F7FB',
    borderRadius: 20,
    padding: 12,
  },

  /* HEADER */
  headerBlock: {
    backgroundColor: '#d9e5f4',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: '#2F4766',
    marginBottom: 8,
  },
  headerVerbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9f9e9',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerMeaning: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00325c',
  },
  headerInf: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00325c',
  },
  headerTranslit: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: '#E03E38',
    textAlign: 'right',
    paddingRight: 4, // важный паддинг, чтобы не съедало буквы
  },

  /* LIST */
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingVertical: 4,
  },

  row: {
    flexDirection: 'row',
    backgroundColor: '#E7F1FF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },

  leftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  genderIcon: {
    width: 28,
    height: 28,
    marginRight: 6,
  },
  leftText: {
    flex: 1,
    fontSize: 15,
    color: '#1b2436',
  },

  rightCol: {
    flex: 1.1,
    paddingLeft: 6,
    paddingRight: 4, // общий паддинг справа
  },
  hebrewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  hebrewText: {
    fontSize: 16,
    color: '#152039',
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  speakerButton: {
    marginLeft: 6,
  },
  speakerIcon: {
    width: 22,
    height: 22,
  },

  verbTranslit: {
    fontSize: 13,
    color: '#E03E38',
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'right',
    paddingTop: 1,
    paddingRight: 4,
    flexShrink: 1,
  },

  /* FOOTER */
  footer: {
    marginTop: 6,
  },
  startButton: {
    backgroundColor: '#2F4766',
    borderRadius: 14,
    paddingVertical: 10,
    marginBottom: 6,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  closeButton: {
    borderRadius: 12,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#2F4766',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default VerbListModal2;
