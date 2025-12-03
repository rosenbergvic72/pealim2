import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, Vibration, Image } from 'react-native';
import FadeInView from './api/FadeInView';
import { Audio } from 'expo-av';
import sounds from './Soundss';       // инфинитивы
import soundsconj from './soundconj'; // спряжения

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
  // 1) сначала пробуем инфинитив
  const keyInf = norm(item?.mp3Inf);
  const keyConj = norm(item?.mp3Conj);

  const file =
    (keyInf && sounds?.[keyInf]) ||
    (keyConj && soundsconj?.[keyConj]);

  if (!file) return;

  await ensureAudioMode();

  const cacheKey = keyInf || keyConj; // для кэша берём тот ключ, что реально проигрываем
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
        try { await sound.unloadAsync(); } catch {}
        delete cachedListSounds[cacheKey];
      }
    });
  } catch {
    // молча — чтобы не засорять лог
  }
}

const VerbListModal = ({ visible, onStartExercise, onClose, verbs = [], language }) => {
  const fallbackLang = 'en';
  const langKey = languageMap[language] || language || fallbackLang;
  const title = titles[langKey] || titles[fallbackLang];
  const buttonText = buttonTexts[langKey] || buttonTexts[fallbackLang];

  useEffect(() => {
    if (!visible) return;
    Vibration.vibrate(100);
    (async () => {
      try {
        await ensureAudioMode();
        const { sound } = await Audio.Sound.createAsync(require('./api/click.mp3'), { shouldPlay: true });
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) sound.unloadAsync();
        });
      } catch {}
    })();
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <FadeInView style={styles.overlay}>
        <View style={styles.container}>
          <Text style={[styles.title, isRTL(langKey) && { textAlign: 'right' }]} maxFontSizeMultiplier={1.2}>
            {title}
          </Text>

          <FlatList
            data={verbs}
            keyExtractor={(item, idx) => `${norm(item?.mp3Inf) || norm(item?.mp3Conj)}_${item?.hebrewtext || ''}_${idx}`}
            renderItem={({ item }) => (
              <View style={styles.bubble}>
                <View style={styles.verbLeft}>
                  <Text style={styles.entext} maxFontSizeMultiplier={1.2}>{item?.entext}</Text>
                </View>
                <View style={styles.verbRight}>
                  <TouchableOpacity onPress={() => playForItem(item)} style={styles.speakerButton}>
                    <Image source={require('./speaker6.png')} style={styles.speakerIcon} />
                  </TouchableOpacity>
                  <Text style={styles.hebrew} maxFontSizeMultiplier={1.2}>{item?.hebrewtext}</Text>
                  <Text style={styles.translit} maxFontSizeMultiplier={1.2}>{item?.translit}</Text>
                </View>
              </View>
            )}
          />

          <TouchableOpacity onPress={onStartExercise} style={styles.button}>
            <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </FadeInView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: '#fff', width: '96%', height: '92%', borderRadius: 10, padding: 20 },
  title: {
    fontWeight: 'bold', fontSize: 18, marginBottom: 15, textAlign: 'center',
    backgroundColor: '#C3D2EB', borderRadius: 8, color: '#003366', padding: 12,
  },
  button: { backgroundColor: '#4A6491', padding: 12, marginTop: 20, borderRadius: 8 },
  buttonText: { textAlign: 'center', color: '#fff', fontWeight: 'bold', fontSize: 18 },
  bubble: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F2F4F8', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 15,
    marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2,
  },
  verbLeft: { flex: 1, alignItems: 'flex-start' },
  verbRight: { flex: 1, alignItems: 'flex-end', justifyContent: 'center', position: 'relative' },
  hebrew: { fontWeight: 'bold', fontSize: 20, color: '#2F4766', marginRight: 30 },
  translit: { fontStyle: 'italic', color: '#C03A2B', fontSize: 14, fontWeight: 'bold', marginRight: 30 },
  entext: { color: '#333', fontSize: 15, textAlign: 'left', fontWeight: 'bold' },
  // кнопка — как было
  speakerButton: { position: 'absolute', right: -28, top: '50%', transform: [{ translateY: -11 }], marginRight: 24 },
  speakerIcon: { width: 22, height: 22, resizeMode: 'contain' },
});

export default VerbListModal;
