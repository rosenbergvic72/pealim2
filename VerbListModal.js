import React, { useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Audio } from 'expo-av';

import sounds from './Soundss';
import soundsconj from './soundconj';

const UI = {
  ru: {
    title: 'Глаголы в этом упражнении',
    count: 'Количество глаголов',
    start: 'НАЧАТЬ',
    back: 'НАЗАД',
    items: 'глаголов',
  },
  en: {
    title: 'Verbs in this exercise',
    count: 'Number of verbs',
    start: 'START',
    back: 'BACK',
    items: 'verbs',
  },
  fr: {
    title: 'Verbes dans cet exercice',
    count: 'Nombre de verbes',
    start: 'COMMENCER',
    back: 'RETOUR',
    items: 'verbes',
  },
  es: {
    title: 'Verbos en este ejercicio',
    count: 'Número de verbos',
    start: 'EMPEZAR',
    back: 'VOLVER',
    items: 'verbos',
  },
  pt: {
    title: 'Verbos neste exercício',
    count: 'Número de verbos',
    start: 'COMEÇAR',
    back: 'VOLTAR',
    items: 'verbos',
  },
  ar: {
    title: 'الأفعال في هذا التمرين',
    count: 'عدد الأفعال',
    start: 'ابدأ',
    back: 'رجوع',
    items: 'أفعال',
  },
  am: {
    title: 'በዚህ ልምምድ ውስጥ ያሉ ግሶች',
    count: 'የግሶች ብዛት',
    start: 'ጀምር',
    back: 'ተመለስ',
    items: 'ግሶች',
  },
  he: {
    title: 'פעלים בתרגיל הזה',
    count: 'מספר פעלים',
    start: 'התחלה',
    back: 'חזרה',
    items: 'פעלים',
  },
};

const LANGUAGE_ALIASES = {
  ru: 'ru',
  russian: 'ru',
  русский: 'ru',
  русский: 'ru',
  en: 'en',
  english: 'en',
  fr: 'fr',
  french: 'fr',
  français: 'fr',
  francais: 'fr',
  es: 'es',
  spanish: 'es',
  español: 'es',
  espanol: 'es',
  pt: 'pt',
  portuguese: 'pt',
  português: 'pt',
  portugues: 'pt',
  'pt-pt': 'pt',
  ar: 'ar',
  arabic: 'ar',
  arab: 'ar',
  العربية: 'ar',
  am: 'am',
  amharic: 'am',
  አማርኛ: 'am',
  he: 'he',
  hebrew: 'he',
  iw: 'he',
  עברית: 'he',
};

const normalizeLanguage = value => {
  const key = String(value || '').trim().toLowerCase();
  return LANGUAGE_ALIASES[key] || 'en';
};

const isRTL = lang => lang === 'ar' || lang === 'he';
const COUNT_OPTIONS = [8, 12, 18, 24];
const cachedListSounds = {};
const norm = value => String(value || '').trim().replace(/\.mp3$/i, '');

async function ensureAudioMode() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });
  } catch {}
}

async function unloadCachedListSounds() {
  const entries = Object.entries(cachedListSounds);
  for (const [key, sound] of entries) {
    try {
      const status = await sound.getStatusAsync();
      if (status?.isLoaded) {
        await sound.unloadAsync();
      }
    } catch {}
    delete cachedListSounds[key];
  }
}

async function playForItem(item) {
  const keyInf = norm(item?.mp3Inf);
  const keyConj = norm(item?.mp3Conj);
  const file =
    (keyInf && sounds?.[keyInf]) ||
    (keyConj && soundsconj?.[keyConj]);

  if (!file) return;

  await ensureAudioMode();
  const cacheKey = keyInf || keyConj;

  try {
    if (!cachedListSounds[cacheKey]) {
      const soundObject = new Audio.Sound();
      await soundObject.loadAsync(file);
      cachedListSounds[cacheKey] = soundObject;
    }

    const sound = cachedListSounds[cacheKey];
    await sound.replayAsync();

    sound.setOnPlaybackStatusUpdate(async status => {
      if (!status.didJustFinish) return;

      try {
        await sound.unloadAsync();
      } catch {}

      if (cachedListSounds[cacheKey] === sound) {
        delete cachedListSounds[cacheKey];
      }
    });
  } catch (error) {
    console.log('[VerbListModal] audio error:', error);
  }
}

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
  const lang = normalizeLanguage(language);
  const text = UI[lang] || UI.en;
  const rtl = isRTL(lang);

  useEffect(() => {
    return () => {
      unloadCachedListSounds();
    };
  }, []);

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={text.back}
          onPress={onClose}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={[styles.title, rtl && styles.rtlText]}
            maxFontSizeMultiplier={1.2}
          >
            {text.title}
          </Text>
        </View>
      </View> */}

      <View style={styles.countCard}>
        <Text
          style={[styles.sectionTitle, rtl && styles.rtlText]}
          maxFontSizeMultiplier={1.2}
        >
          {text.count}
        </Text>

        <View style={styles.countButtonsRow}>
          {COUNT_OPTIONS.map(count => {
            const active = selectedCount === count;

            return (
              <TouchableOpacity
                key={count}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.countButton,
                  active && styles.countButtonActive,
                ]}
                onPress={() => onSelectCount?.(count)}
                activeOpacity={0.82}
              >
                <Text
                  style={[
                    styles.countButtonText,
                    active && styles.countButtonTextActive,
                  ]}
                  maxFontSizeMultiplier={1.1}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, rtl && styles.rtlText]}>
          {text.title}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>
            {verbs.length} {text.items}
          </Text>
        </View>
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={verbs}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) =>
          `${item?.key || norm(item?.mp3Inf) || norm(item?.mp3Conj) || item?.hebrewtext || 'verb'}_${index}`
        }
        renderItem={({ item }) => {
          const pinned = pinnedIds.includes(item?.hebrewtext);

          return (
            <View style={styles.verbCard}>
              <View style={styles.translationWrap}>
                <Text
                  style={[styles.translation, rtl && styles.rtlText]}
                  maxFontSizeMultiplier={1.2}
                >
                  {item?.entext}
                </Text>

                {pinned && (
                  <Image
                    source={require('./gant2.png')}
                    style={styles.pinnedIcon}
                  />
                )}
              </View>

              <View style={styles.hebrewWrap}>
                <TouchableOpacity
                  onPress={() => playForItem(item)}
                  style={styles.speakerButton}
                  activeOpacity={0.75}
                >
                  <Image
                    source={require('./speaker6.png')}
                    style={styles.speakerIcon}
                  />
                </TouchableOpacity>

                <Text
                  style={styles.hebrew}
                  maxFontSizeMultiplier={1.2}
                >
                  {item?.hebrewtext}
                </Text>

                <Text
                  style={styles.translit}
                  maxFontSizeMultiplier={1.2}
                >
                  {item?.translit}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={onStartExercise}
          style={styles.startButton}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText} maxFontSizeMultiplier={1.1}>
            {text.start}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#83A3CD',
  },

  header: {
    minHeight: 64,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 2,
    position: 'relative',
  },

  backButton: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  backIcon: {
    color: '#FFFDEF',
    fontSize: 38,
    lineHeight: 40,
    fontWeight: '500',
    marginTop: -3,
  },

  headerTextWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60,
  },

  title: {
    color: '#FFFDEF',
    fontSize: 20,
    lineHeight: 23,
    fontWeight: '900',
    textAlign: 'center',
  },

  rtlText: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },

  countCard: {
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#FFFDEF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 4,
  },

  sectionTitle: {
    color: '#333652',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'left',
  },

  countButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  countButton: {
    flex: 1,
    height: 40,
    borderWidth: 2,
    borderColor: '#D7DCE6',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  countButtonActive: {
    borderColor: '#CE6857',
    backgroundColor: '#CE6857',
  },

  countButtonText: {
    color: '#333652',
    fontSize: 16,
    fontWeight: '900',
  },

  countButtonTextActive: {
    color: '#FFFDEF',
  },

  listHeader: {
    minHeight: 34,
    marginHorizontal: 16,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  listTitle: {
    flex: 1,
    color: '#FFFDEF',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
  },

  countBadge: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  verbCard: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDEF',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  translationWrap: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    gap: 6,
  },

  translation: {
    flexShrink: 1,
    color: '#333652',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },

  pinnedIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    opacity: 0.9,
  },

  hebrewWrap: {
    flex: 1,
    minHeight: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 31,
    position: 'relative',
  },

  hebrew: {
    color: '#2F4766',
    fontWeight: '900',
    fontSize: 19,
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  translit: {
    color: '#CE6857',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'right',
  },

  speakerButton: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  speakerIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#83A3CD',
  },

  startButton: {
    minHeight: 54,
    borderRadius: 27,
    backgroundColor: '#CE6857',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },

  startButtonText: {
    color: '#FFFDEF',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
});

export default VerbListModal;
