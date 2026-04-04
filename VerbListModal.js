import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Vibration,
  Image,
  Platform,
} from 'react-native';
import FadeInView from './api/FadeInView';
import { Audio } from 'expo-av';
import sounds from './Soundss';
import soundsconj from './soundconj';

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

const closeTexts = {
  ru: 'Закрыть',
  en: 'Close',
  fr: 'Fermer',
  es: 'Cerrar',
  pt: 'Fechar',
  ar: 'إغلاق',
  am: 'ዝጋ',
  he: 'סגור',
};

const countLabelTexts = {
  ru: 'Количество глаголов',
  en: 'Number of verbs',
  fr: 'Nombre de verbes',
  es: 'Número de verbos',
  pt: 'Número de verbos',
  ar: 'عدد الأفعال',
  am: 'የግሶች ብዛት',
  he: 'מספר פעלים',
};

const isRTL = (lang) => ['ar', 'am', 'he'].includes(lang);

const languageMap = {
  русский: 'ru',
  русский: 'ru',
  english: 'en',
  français: 'fr',
  español: 'es',
  português: 'pt',
  العربية: 'ar',
  አማርኛ: 'am',
  עברית: 'he',
};

const cachedListSounds = {};
const norm = (s) => String(s || '').trim().replace(/\.mp3$/i, '');

async function ensureAudioMode() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });
  } catch {}
}

async function playForItem(item) {
  const keyInf = norm(item?.mp3Inf);
  const keyConj = norm(item?.mp3Conj);
  const file = (keyInf && sounds?.[keyInf]) || (keyConj && soundsconj?.[keyConj]);
  if (!file) return;

  await ensureAudioMode();
  const cacheKey = keyInf || keyConj;

  try {
    if (!cachedListSounds[cacheKey]) {
      const s = new Audio.Sound();
      await s.loadAsync(file);
      cachedListSounds[cacheKey] = s;
    }

    const sound = cachedListSounds[cacheKey];
    await sound.replayAsync();

    sound.setOnPlaybackStatusUpdate(async (st) => {
      if (st.didJustFinish) {
        try {
          await sound.unloadAsync();
        } catch {}
        delete cachedListSounds[cacheKey];
      }
    });
  } catch {}
}

const COUNT_OPTIONS = [8, 12, 18, 24];

const VerbListModal = ({
  visible,
  onStartExercise,
  onClose,
  verbs = [],
  language,
  pinnedIds = [],
  selectedCount = 12,
  onSelectCount,
}) => {
  if (!visible) return null;

  const fallbackLang = 'en';
  const normalizedInput = String(language || '').toLowerCase().trim();
  const langKey = languageMap[normalizedInput] || normalizedInput || fallbackLang;

  const title = titles[langKey] || titles[fallbackLang];
  const buttonText = buttonTexts[langKey] || buttonTexts[fallbackLang];
  const closeText = closeTexts[langKey] || closeTexts[fallbackLang];
  const countLabel = countLabelTexts[langKey] || countLabelTexts[fallbackLang];

  useEffect(() => {
    Vibration.vibrate(100);
  }, []);

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <FadeInView style={styles.overlay}>
        <View style={[styles.container, Platform.OS === 'ios' && styles.containerIOS]}>
          <Text style={[styles.title, isRTL(langKey) && { textAlign: 'right' }]} maxFontSizeMultiplier={1.2}>
            {title}
          </Text>

          <View style={styles.countBlock}>
            <Text
              style={[styles.countLabel, isRTL(langKey) && { textAlign: 'right' }]}
              maxFontSizeMultiplier={1.2}
            >
              {countLabel}
            </Text>

            <View style={styles.countButtonsRow}>
              {COUNT_OPTIONS.map((count) => {
                const active = selectedCount === count;
                return (
                  <TouchableOpacity
                    key={count}
                    style={[styles.countButton, active && styles.countButtonActive]}
                    onPress={() => onSelectCount?.(count)}
                  >
                    <Text style={[styles.countButtonText, active && styles.countButtonTextActive]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <FlatList
            data={verbs}
            keyExtractor={(item, idx) =>
              `${norm(item?.mp3Inf) || norm(item?.mp3Conj)}_${item?.hebrewtext || ''}_${idx}`
            }
            renderItem={({ item }) => {
              const isPinned = pinnedIds.includes(item?.hebrewtext);

              return (
                <View style={styles.bubble}>
                  <View style={styles.verbLeft}>
                    <Text style={styles.entext} maxFontSizeMultiplier={1.2}>
                      {item?.entext}
                    </Text>

                    {isPinned && (
                      <Image
                        source={require('./gant2.png')}
                        style={styles.pinnedIcon}
                      />
                    )}
                  </View>

                  <View style={styles.verbRight}>
                    <TouchableOpacity onPress={() => playForItem(item)} style={styles.speakerButton}>
                      <Image source={require('./speaker6.png')} style={styles.speakerIcon} />
                    </TouchableOpacity>

                    <Text style={styles.hebrew} maxFontSizeMultiplier={1.2}>
                      {item?.hebrewtext}
                    </Text>
                    <Text style={styles.translit} maxFontSizeMultiplier={1.2}>
                      {item?.translit}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          <TouchableOpacity onPress={onStartExercise} style={styles.button}>
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.closeLink}>
            <Text style={styles.closeText}>{closeText}</Text>
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
    height: '92%',
    borderRadius: 10,
    padding: 20,
  },
  containerIOS: {
    height: '84%',
  },

  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: '#C3D2EB',
    borderRadius: 8,
    color: '#003366',
    padding: 12,
  },

  countBlock: {
    marginBottom: 14,
  },

  countLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2F4766',
    textAlign: 'center',
    marginBottom: 8,
  },

  countButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },

  countButton: {
    flex: 1,
    backgroundColor: '#E7EDF5',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D3E0',
  },

  countButtonActive: {
    backgroundColor: '#4A6491',
    borderColor: '#4A6491',
  },

  countButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#35506F',
  },

  countButtonTextActive: {
    color: '#fff',
  },

  bubble: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F2F4F8',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 15,
    marginBottom: 10,
  },

  verbLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  verbRight: {
    flex: 1,
    alignItems: 'flex-end',
    position: 'relative',
  },

  entext: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },

  pinnedIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    opacity: 0.9,
  },

  hebrew: {
    fontWeight: 'bold',
    fontSize: 18,
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

  speakerButton: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -11 }],
  },
  speakerIcon: {
    width: 22,
    height: 22,
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

  closeLink: {
    marginTop: 10,
    alignSelf: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A6491',
  },
});

export default VerbListModal;