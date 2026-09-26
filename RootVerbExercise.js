import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  AppState,
  Image,
  useWindowDimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

import RootVerbCard from './RootVerbCard';
import RootVerbListModal, {
  buildRootFamilies,
} from './RootVerbListModal';
import RootVerbRotationModal, {
  normalizeRootLanguage,
} from './RootVerbRotationModal';
import RootVerbDescriptionModal from './RootVerbDescriptionModal';

import ProgressBar from './ProgressBar';
import PrepositionStatModal from './PrepositionStatModal';
import PrepositionExitConfirmationModal from './PrepositionExitConfirmationModal';

import { updateStatistics } from './stat';
import * as FirebaseAnalytics from './src/analytics/FirebaseAnalytics';

import rootData from './rootprep.json';
import sounds from './Soundss';

const EXERCISE_ID = 'rootFamilies';
const SETTINGS_KEY = 'root_families_settings_v1';
const COUNTS = [8, 12, 18, 24];
const SIZES = [2, 3, 4];
const NEXT_DELAY = 1800;

const DEFAULT_SETTINGS = {
  count: 12,
  sizes: [2, 3, 4],
  direction: 'heToTranslation',
  sound: true,
  excluded: [],
  pinned: [],
};

const EMPTY_RUN = {
  deck: [],
  index: 0,
  selected: null,
  correct: 0,
  wrong: 0,
  done: false,
};

const MENU_ROUTES = {
  ru: 'Menu',
  en: 'MenuEn',
  fr: 'MenuFr',
  es: 'MenuEs',
  pt: 'MenuPt',
  ar: 'MenuAr',
  am: 'MenuAm',
};

const TEXTS = {
  ru: {
    correct: 'Верно',
    wrong: 'Ошибки',
    next: 'ДАЛЕЕ',
    finish: 'ЗАВЕРШИТЬ',
    completed: 'Упражнение завершено!',
    result: 'Ваш результат',
    again: 'ЕЩЁ РАЗ',
    menu: 'МЕНЮ',
    settings: 'Настройки упражнения',
    statistics: 'Статистика',
    description: 'Об упражнении',
    sound: 'Звук',
    noItems: 'Нет доступных заданий для выбранных параметров.',
    saveError: 'Не удалось сохранить статистику.',
    settingsError: 'Не удалось сохранить настройки.',
  },
  en: {
    correct: 'Correct',
    wrong: 'Errors',
    next: 'NEXT',
    finish: 'FINISH',
    completed: 'Exercise completed!',
    result: 'Your result',
    again: 'PRACTICE AGAIN',
    menu: 'MENU',
    settings: 'Exercise settings',
    statistics: 'Statistics',
    description: 'About this exercise',
    sound: 'Sound',
    noItems: 'No tasks available for the selected settings.',
    saveError: 'Could not save statistics.',
    settingsError: 'Could not save settings.',
  },
  fr: {
    correct: 'Correct',
    wrong: 'Erreurs',
    next: 'SUIVANT',
    finish: 'TERMINER',
    completed: 'Exercice terminé !',
    result: 'Votre résultat',
    again: 'RECOMMENCER',
    menu: 'MENU',
    settings: 'Paramètres de l’exercice',
    statistics: 'Statistiques',
    description: 'À propos de l’exercice',
    sound: 'Son',
    noItems: 'Aucun exercice disponible pour ces paramètres.',
    saveError: 'Impossible d’enregistrer les statistiques.',
    settingsError: 'Impossible d’enregistrer les paramètres.',
  },
  es: {
    correct: 'Aciertos',
    wrong: 'Errores',
    next: 'SIGUIENTE',
    finish: 'TERMINAR',
    completed: '¡Ejercicio completado!',
    result: 'Tu resultado',
    again: 'OTRA VEZ',
    menu: 'MENÚ',
    settings: 'Ajustes del ejercicio',
    statistics: 'Estadísticas',
    description: 'Acerca del ejercicio',
    sound: 'Sonido',
    noItems: 'No hay ejercicios disponibles con estos ajustes.',
    saveError: 'No se pudieron guardar las estadísticas.',
    settingsError: 'No se pudieron guardar los ajustes.',
  },
  pt: {
    correct: 'Certas',
    wrong: 'Erros',
    next: 'SEGUINTE',
    finish: 'TERMINAR',
    completed: 'Exercício concluído!',
    result: 'O seu resultado',
    again: 'PRATICAR NOVAMENTE',
    menu: 'MENU',
    settings: 'Definições do exercício',
    statistics: 'Estatísticas',
    description: 'Sobre o exercício',
    sound: 'Som',
    noItems: 'Não há exercícios disponíveis para estas definições.',
    saveError: 'Não foi possível guardar as estatísticas.',
    settingsError: 'Não foi possível guardar as definições.',
  },
  ar: {
    correct: 'صحيح',
    wrong: 'أخطاء',
    next: 'التالي',
    finish: 'إنهاء',
    completed: 'اكتمل التمرين!',
    result: 'نتيجتك',
    again: 'تدرّب مجددًا',
    menu: 'القائمة',
    settings: 'إعدادات التمرين',
    statistics: 'الإحصاءات',
    description: 'عن التمرين',
    sound: 'الصوت',
    noItems: 'لا توجد تمارين متاحة للإعدادات المحددة.',
    saveError: 'تعذّر حفظ الإحصاءات.',
    settingsError: 'تعذّر حفظ الإعدادات.',
  },
  am: {
    correct: 'ትክክል',
    wrong: 'ስህተቶች',
    next: 'ቀጣይ',
    finish: 'ጨርስ',
    completed: 'ልምምዱ ተጠናቋል!',
    result: 'ውጤትዎ',
    again: 'እንደገና ይለማመዱ',
    menu: 'ምናሌ',
    settings: 'የልምምድ ቅንብሮች',
    statistics: 'ስታቲስቲክስ',
    description: 'ስለ ልምምዱ',
    sound: 'ድምፅ',
    noItems: 'ለተመረጡት ቅንብሮች ልምምዶች የሉም።',
    saveError: 'ስታቲስቲክሱን ማስቀመጥ አልተቻለም።',
    settingsError: 'ቅንብሮቹን ማስቀመጥ አልተቻለም።',
  },
};

const normalizeDirection = value =>
  value === 'translationToHe'
    ? 'translationToHe'
    : 'heToTranslation';

const shuffle = values => {
  const result = [...values];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

const uniqueStrings = value =>
  Array.isArray(value)
    ? [...new Set(value.filter(item => typeof item === 'string'))]
    : [];

const sanitizeSettings = value => {
  const source = value && typeof value === 'object' ? value : {};
  const excluded = uniqueStrings(source.excluded);

  return {
    count: COUNTS.includes(Number(source.count))
      ? Number(source.count)
      : 12,
    sizes: Array.isArray(source.sizes)
      ? SIZES.filter(size => source.sizes.map(Number).includes(size))
      : [...SIZES],
    direction: normalizeDirection(source.direction),
    sound: typeof source.sound === 'boolean' ? source.sound : true,
    excluded,
    pinned: uniqueStrings(source.pinned).filter(
      key => !excluded.includes(key)
    ),
  };
};

const getAudioSource = value => {
  const key = String(value || '').trim().replace(/\.mp3$/i, '');
  if (!key) return null;

  for (const candidate of [key, `${key}.mp3`]) {
    if (
      sounds &&
      Object.prototype.hasOwnProperty.call(sounds, candidate)
    ) {
      return sounds[candidate];
    }
  }

  return null;
};

const unload = async sound => {
  if (!sound) return;

  try {
    await sound.unloadAsync();
  } catch {
    // Аудио могло быть выгружено при смене задания или выходе.
  }
};

const buildDeck = (
  families,
  settings,
  count,
  sizes,
  direction = 'heToTranslation'
) => {
  const excluded = new Set(settings.excluded);
  const pinned = new Set(settings.pinned);
  const safeDirection = normalizeDirection(direction);
  const reverse = safeDirection === 'translationToHe';

  const pool = families
    .filter(family => sizes.includes(family.size))
    .flatMap(family =>
      family.verbs
        .filter(verb => !excluded.has(verb.key))
        .map(verb => ({ verb, family }))
    );

  if (!pool.length) return [];

  const tickets = pool.flatMap(entry =>
    pinned.has(entry.verb.key) ? [entry, entry] : [entry]
  );

  const deck = [];
  let bag = [];
  let previousKey = null;

  while (deck.length < count) {
    if (!bag.length) bag = shuffle(tickets);

    let index = bag.findIndex(
      entry => entry.verb.key !== previousKey
    );

    if (index < 0) index = 0;

    const [entry] = bag.splice(index, 1);
    previousKey = entry.verb.key;

deck.push({
  item: entry.verb,
  direction: safeDirection,
  options: shuffle(
    entry.family.verbs.map(verb => ({
      value: verb.key,
      label: reverse ? verb.verb : verb.translation,
      isCorrect: verb.key === entry.verb.key,
      verb: verb.verb,
      bin: verb.bin,
      transliteration: verb.transliteration,
      translation: verb.translation,
    }))
  ),
});
  }

  return deck;
};

const RootVerbExercise = ({ navigation, route }) => {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [screenSize, setScreenSize] = useState(null);
  const screenHeight = screenSize?.windowHeight === windowHeight &&
    screenSize?.windowWidth === windowWidth ? screenSize.height : windowHeight;
  const compactLayout = screenHeight < 620;
  const styles = useMemo(() => createStyles(compactLayout), [compactLayout]);
  const [language, setLanguage] = useState(
    normalizeRootLanguage(route?.params?.language || 'en')
  );
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState('settings');
  const [run, setRun] = useState(EMPTY_RUN);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState(null);
  const [exitVisible, setExitVisible] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const [failedAudio, setFailedAudio] = useState({});
  const [saveError, setSaveError] = useState(false);
  const [settingsError, setSettingsError] = useState(false);

  const mounted = useRef(true);
  const focused = useRef(false);
  const appActive = useRef(AppState.currentState === 'active');
  const settingsRef = useRef(settings);
  const runRef = useRef(run);
  const activeRun = useRef(false);
  const session = useRef(0);
  const nextAt = useRef(0);
  const nextTimer = useRef(null);
  const pronunciationTimer = useRef(null);
  const pendingExit = useRef(null);
  const allowExit = useRef(false);
  const writeQueue = useRef(Promise.resolve());
  const audioRef = useRef(null);
  const audioObjects = useRef(new Set());
  const audioVersion = useRef(0);

  const text = TEXTS[language];

  const families = useMemo(
    () => buildRootFamilies(rootData, language),
    [language]
  );

  const rotationItems = useMemo(
    () => families.flatMap(family => family.verbs),
    [families]
  );

  const current = run.deck[run.index];
  const answered = run.selected !== null;
  const attempts = run.correct + run.wrong;
  const score = attempts
    ? Math.round((run.correct / attempts) * 100)
    : 0;

  const commitRun = next => {
    runRef.current = next;
    setRun(next);
  };

  const clearTimers = useCallback(() => {
    clearTimeout(nextTimer.current);
    clearTimeout(pronunciationTimer.current);
    nextTimer.current = null;
    pronunciationTimer.current = null;
  }, []);

  const stopAudio = useCallback(() => {
    audioVersion.current += 1;
    audioRef.current = null;
    for (const sound of audioObjects.current) {
      sound.setOnPlaybackStatusUpdate(null);
      void unload(sound);
    }
    audioObjects.current.clear();

    if (mounted.current) setAudioBusy(false);
  }, []);

  const stopMedia = useCallback(() => {
    clearTimeout(pronunciationTimer.current);
    pronunciationTimer.current = null;
    stopAudio();
  }, [stopAudio]);

  const playSource = useCallback(async (
    source,
    pronunciationKey,
    followingSource = null,
    followingKey = null
  ) => {
    if (
      source == null ||
      !settingsRef.current.sound ||
      !mounted.current ||
      !focused.current ||
      !appActive.current
    ) return;

    stopAudio();
    const version = audioVersion.current;
    const valid = () =>
      mounted.current &&
      focused.current &&
      appActive.current &&
      settingsRef.current.sound &&
      audioVersion.current === version;

    setAudioBusy(true);

    const markFailed = key => {
      if (valid() && key) {
        setFailedAudio(previousFailures => ({
          ...previousFailures,
          [key]: true,
        }));
      }
    };

    const release = sound => {
      if (!sound) return;
      sound.setOnPlaybackStatusUpdate(null);
      audioObjects.current.delete(sound);
      if (audioRef.current === sound) audioRef.current = null;
      void unload(sound);
    };

    const prepare = async (audioSource, key) => {
      if (audioSource == null) return null;
      const sound = new Audio.Sound();
      audioObjects.current.add(sound);
      try {
        await sound.loadAsync(audioSource, { shouldPlay: false });
        if (!valid()) {
          release(sound);
          return null;
        }
        return sound;
      } catch (error) {
        markFailed(key);
        release(sound);
        console.log('[RootVerbExercise] Audio load:', error?.message || error);
        return null;
      }
    };

    // Start both loads together; pronunciation is ready before feedback ends.
    const firstReady = prepare(source, pronunciationKey);
    const followingReady = prepare(followingSource, followingKey);

    const playPrepared = async (sound, key, onFinished) => {
      if (!sound || !valid()) {
        release(sound);
        return;
      }

      audioRef.current = sound;
      let completed = false;
      const finish = () => {
        if (completed) return;
        completed = true;
        release(sound);
        if (!valid()) return;
        if (onFinished) {
          void onFinished();
        } else {
          setAudioBusy(false);
        }
      };

      sound.setOnPlaybackStatusUpdate(status => {
        if (!valid() || completed) return;
        if (status.isLoaded && status.didJustFinish) {
          finish();
        } else if (!status.isLoaded && status.error) {
          markFailed(key);
          finish();
        }
      });

      try {
        await sound.playAsync();
      } catch (error) {
        markFailed(key);
        finish();
        console.log('[RootVerbExercise] Audio play:', error?.message || error);
      }
    };

    const playFollowing = async () => {
      const sound = await followingReady;
      if (!valid()) {
        release(sound);
        return;
      }
      if (sound) {
        await playPrepared(sound, followingKey);
      } else {
        setAudioBusy(false);
      }
    };

    const firstSound = await firstReady;
    if (!valid()) {
      release(firstSound);
      return;
    }
    if (firstSound) {
      await playPrepared(firstSound, pronunciationKey, playFollowing);
    } else {
      await playFollowing();
    }
  }, [stopAudio]);

  const playPronunciation = useCallback(
    key => playSource(getAudioSource(key), key),
    [playSource]
  );

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      try {
        const [storedSettings, storedLanguage] = await Promise.all([
          AsyncStorage.getItem(SETTINGS_KEY),
          AsyncStorage.getItem('language'),
        ]);

        if (cancelled) return;

        let parsed = {};

        try {
          parsed = storedSettings ? JSON.parse(storedSettings) : {};
        } catch {
          parsed = {};
        }

        const next = sanitizeSettings(parsed);
        settingsRef.current = next;
        setSettings(next);
        setLanguage(
          normalizeRootLanguage(
            route?.params?.language || storedLanguage || 'en'
          )
        );
      } catch (error) {
        console.log('[RootVerbExercise] Settings:', error);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    loadSettings();
    return () => { cancelled = true; };
  }, [route?.params?.language]);

  useEffect(() => {
    mounted.current = true;

    const subscription = AppState.addEventListener('change', state => {
      appActive.current = state === 'active';

      if (!appActive.current) {
        stopMedia();
      } else if (
        activeRun.current &&
        runRef.current.selected !== null &&
        Date.now() >= nextAt.current
      ) {
        setReady(true);
      }
    });

    return () => {
      mounted.current = false;
      focused.current = false;
      subscription.remove();
      clearTimers();
      stopMedia();
    };
  }, [clearTimers, stopMedia]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;

      return () => {
        focused.current = false;
        stopMedia();
      };
    }, [stopMedia])
  );

  useFocusEffect(
    useCallback(() => {
      if (!loaded) return;

      const eventName = `root_families_${language}`;

      try {
        Promise.resolve(
          FirebaseAnalytics.logFirebaseEvent(eventName, {
            screen: eventName,
          })
        ).catch(error =>
          console.log('[RootVerbExercise] Analytics:', error)
        );
      } catch (error) {
        console.log('[RootVerbExercise] Analytics:', error);
      }
    }, [loaded, language])
  );

  useEffect(() => {
    return navigation?.addListener?.('beforeRemove', event => {
      if (!activeRun.current || allowExit.current) return;

      event.preventDefault();
      stopMedia();
      pendingExit.current = () => navigation.dispatch(event.data.action);
      setExitVisible(true);
    });
  }, [navigation, stopMedia]);

  const saveSettings = patch => {
    const next = sanitizeSettings({
      ...settingsRef.current,
      ...patch,
    });

    settingsRef.current = next;
    setSettings(next);

    writeQueue.current = writeQueue.current
      .catch(() => {})
      .then(() =>
        AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      )
      .then(() => {
        if (mounted.current) setSettingsError(false);
      })
      .catch(error => {
        if (mounted.current) setSettingsError(true);
        console.log('[RootVerbExercise] Save settings:', error);
      });
  };

  const toggleExcluded = key => {
    const previous = settingsRef.current;
    const excluded = previous.excluded.includes(key)
      ? previous.excluded.filter(value => value !== key)
      : [...previous.excluded, key];

    saveSettings({
      excluded,
      pinned: previous.pinned.filter(value => value !== key),
    });
  };

  const togglePinned = key => {
    const previous = settingsRef.current;
    const pinned = previous.pinned.includes(key)
      ? previous.pinned.filter(value => value !== key)
      : [...previous.pinned, key];

    saveSettings({
      pinned,
      excluded: previous.excluded.filter(value => value !== key),
    });
  };

  const requestLeave = action => {
    if (!activeRun.current) {
      action();
      return;
    }

    stopMedia();
    pendingExit.current = action;
    setExitVisible(true);
  };

  const openSettings = () => {
    clearTimers();
    stopMedia();
    activeRun.current = false;
    setPage('settings');
    setReady(false);
  };

  const openMenu = () => requestLeave(() => {
    clearTimers();
    stopMedia();
    activeRun.current = false;

    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.(MENU_ROUTES[language] || 'MenuEn');
    }
  });

  const confirmExit = () => {
    const action = pendingExit.current;
    pendingExit.current = null;
    activeRun.current = false;
    allowExit.current = true;
    clearTimers();
    stopMedia();
    setExitVisible(false);
    action?.();
  };

  const openModal = name => {
    stopMedia();
    setModal(name);
  };

  const startExercise = ({ count, sizes, direction }) => {
    if (activeRun.current) return;

    const safeCount = COUNTS.includes(count) ? count : 12;
    const safeSizes = SIZES.filter(size => sizes?.includes(size));
    const safeDirection = normalizeDirection(direction);

    const deck = buildDeck(
      families,
      settingsRef.current,
      safeCount,
      safeSizes,
      safeDirection
    );

    clearTimers();
    stopMedia();

    saveSettings({
      count: safeCount,
      sizes: safeSizes,
      direction: safeDirection,
    });

    session.current += 1;
    allowExit.current = false;
    activeRun.current = deck.length > 0;
    nextAt.current = 0;

    setReady(false);
    setSaveError(false);
    setModal(null);

    commitRun({
      ...EMPTY_RUN,
      deck,
    });

    setPage(deck.length ? 'exercise' : 'empty');
  };

  const handleAnswer = option => {
    const previous = runRef.current;
    const question = previous.deck[previous.index];

    if (
      !activeRun.current ||
      previous.done ||
      previous.selected !== null ||
      !question
    ) return;

    const actual = question.options.find(
      value => value.value === option?.value
    );

    if (!actual) return;

    commitRun({
      ...previous,
      selected: actual.value,
      correct: previous.correct + (actual.isCorrect ? 1 : 0),
      wrong: previous.wrong + (actual.isCorrect ? 0 : 1),
    });

    setReady(false);
    nextAt.current = Date.now() + NEXT_DELAY;

    clearTimeout(nextTimer.current);
    nextTimer.current = setTimeout(() => {
      if (mounted.current) setReady(true);
    }, NEXT_DELAY);

    stopMedia();

    const key = question.item.transliteration;
    const feedbackSource = actual.isCorrect
      ? require('./assets/sounds/success_root.mp3')
      : require('./assets/sounds/failure_root.mp3');

    void playSource(
      feedbackSource,
      undefined,
      failedAudio[key] ? null : getAudioSource(key),
      key
    );
  };

  const handleNext = () => {
    const previous = runRef.current;

    if (
      !activeRun.current ||
      previous.done ||
      previous.selected === null ||
      Date.now() < nextAt.current
    ) return;

    clearTimers();
    stopMedia();
    setReady(false);

    if (previous.index + 1 < previous.deck.length) {
      commitRun({
        ...previous,
        index: previous.index + 1,
        selected: null,
      });
      return;
    }

    activeRun.current = false;
    commitRun({ ...previous, done: true });
    setPage('result');

    const total = previous.correct + previous.wrong;
    const finalScore = total
      ? ((previous.correct / total) * 100).toFixed(2)
      : '0.00';
    const completedSession = session.current;

    Promise.resolve()
      .then(() => updateStatistics(EXERCISE_ID, finalScore))
      .catch(error => {
        if (
          mounted.current &&
          session.current === completedSession
        ) {
          setSaveError(true);
        }
        console.log('[RootVerbExercise] Statistics:', error);
      });
  };

  const renderTopButton = (source, label, onPress) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.75}
      onPress={onPress}
      style={styles.topButton}
    >
      <Image source={source} style={styles.topIcon} />
    </TouchableOpacity>
  );

  const renderAction = (label, onPress, secondary = false) => (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.actionButton,
        secondary && styles.secondaryButton,
      ]}
    >
      <Text maxFontSizeMultiplier={1.2} style={[
        styles.actionText,
        secondary && styles.secondaryText,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      {!loaded ? (
        <SafeAreaView style={styles.loading}>
          <ActivityIndicator size="large" color="#FFFDEF" />
        </SafeAreaView>
      ) : (
        <SafeAreaView style={styles.screen}>
          <View
            style={styles.content}
            onLayout={event => {
              const height = event.nativeEvent.layout.height;
              setScreenSize(previous => previous?.height === height &&
                previous?.windowHeight === windowHeight &&
                previous?.windowWidth === windowWidth
                ? previous : { height, windowHeight, windowWidth });
            }}
          >
            <View
  style={[
    styles.topBar,
    page === 'settings' && { display: 'none' },
  ]}
>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={text.menu}
                onPress={openMenu}
                activeOpacity={0.8}
              >
                <Image
                  source={require('./VERBIFY.png')}
                  style={styles.logo}
                />
              </TouchableOpacity>

              <View style={styles.topButtons}>
                {renderTopButton(
                  settings.sound
                    ? require('./SoundOn.png')
                    : require('./SoundOff.png'),
                  text.sound,
                  () => {
                    const next = !settingsRef.current.sound;
                    saveSettings({ sound: next });
                    if (!next) stopMedia();
                  }
                )}

                {renderTopButton(
                  require('./spisok2.png'),
                  text.settings,
                  () => requestLeave(openSettings)
                )}

                {renderTopButton(
                  require('./stat.png'),
                  text.statistics,
                  () => openModal('statistics')
                )}

                {renderTopButton(
                  require('./question.png'),
                  text.description,
                  () => openModal('description')
                )}
              </View>
            </View>

            {settingsError && (
              <Text maxFontSizeMultiplier={1.2} style={styles.warning}>
                {text.settingsError}
              </Text>
            )}

            {page === 'settings' && (
              <View style={styles.body}>
                <RootVerbListModal
                  language={language}
                  items={rootData}
                  excludedIds={settings.excluded}
                  selectedCount={settings.count}
                  selectedSizes={settings.sizes}
                  selectedDirection={settings.direction}
                  allowedCounts={COUNTS}
                  onSelectCount={count => saveSettings({ count })}
                  onSelectSizes={sizes => saveSettings({ sizes })}
                  onSelectDirection={direction =>
                    saveSettings({ direction })
                  }
                  onOpenManageModal={() => openModal('rotation')}
                  onStart={startExercise}
                />
              </View>
            )}

            {page === 'exercise' && current && (
              <>
                <View style={styles.progressPanel}>
                  <View style={styles.progressLabels}>
                    <Text maxFontSizeMultiplier={1.2} style={styles.progressText}>
                      {text.correct}: {run.correct}
                    </Text>
                    <Text maxFontSizeMultiplier={1.2} style={styles.progressText}>
                      {text.wrong}: {run.wrong}
                    </Text>
                  </View>

                  <Text maxFontSizeMultiplier={1.2} style={styles.progressBadge}>
                    {Math.max(0, run.deck.length - attempts)}
                  </Text>

                  <Text maxFontSizeMultiplier={1.2} style={styles.progressBadge}>
                    {score}%
                  </Text>
                </View>

                <View style={styles.progressBarContainer}>
                  <ProgressBar
                    progress={attempts}
                    totalExercises={run.deck.length}
                  />
                </View>

                <View style={styles.body}>
                  <RootVerbCard
                    compactLayout={compactLayout}
                    key={`${session.current}:${run.index}`}
                    questionKey={`${session.current}:${run.index}`}
                    item={current.item}
                    language={language}
                    direction={current.direction}
                    options={current.options}
                    selectedOption={run.selected}
                    answered={answered}
                    soundEnabled={settings.sound}
                    audioAvailable={
                      getAudioSource(current.item.transliteration) != null &&
                      !failedAudio[current.item.transliteration]
                    }
                    isAudioPlaying={audioBusy}
                    onSelectAnswer={handleAnswer}
                    onPlayAudio={playPronunciation}
                    isExcluded={settings.excluded.includes(current.item.key)}
                    isPinned={settings.pinned.includes(current.item.key)}
                    onExcludePress={() => toggleExcluded(current.item.key)}
                    onPinTogglePress={() => togglePinned(current.item.key)}
                    onOpenManageModal={() => openModal('rotation')}
                  />
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: !answered || !ready,
                  }}
                  activeOpacity={0.8}
                  disabled={!answered || !ready}
                  onPress={handleNext}
                  style={[
                    styles.nextButton,
                    (!answered || !ready) && styles.disabled,
                  ]}
                >
                  <Text maxFontSizeMultiplier={1.2} style={styles.actionText}>
                    {run.index === run.deck.length - 1
                      ? text.finish
                      : text.next}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {(page === 'result' || page === 'empty') && (
              <ScrollView contentContainerStyle={styles.resultContent}>
                <View style={styles.resultCard}>
                  <Text maxFontSizeMultiplier={1.2} style={styles.resultTitle}>
                    {page === 'result' ? text.completed : text.noItems}
                  </Text>

                  {page === 'result' && (
                    <>
                      <Text maxFontSizeMultiplier={1.2} style={styles.resultLabel}>
                        {text.result}
                      </Text>
                      <Text maxFontSizeMultiplier={1.2} style={styles.score}>{score}%</Text>

                      <View style={styles.resultStats}>
                        <Text maxFontSizeMultiplier={1.2} style={styles.resultStat}>
                          {text.correct}: {run.correct}
                        </Text>
                        <Text maxFontSizeMultiplier={1.2} style={styles.resultStat}>
                          {text.wrong}: {run.wrong}
                        </Text>
                      </View>

                      {saveError && (
                        <Text maxFontSizeMultiplier={1.2} style={styles.error}>
                          {text.saveError}
                        </Text>
                      )}
                    </>
                  )}

                  {renderAction(text.again, openSettings)}
                  {renderAction(text.menu, openMenu, true)}
                </View>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      )}

      {modal === 'rotation' && (
        <RootVerbRotationModal
          visible
          language={language}
          items={rotationItems}
          excludedIds={settings.excluded}
          pinnedIds={settings.pinned}
          onRestore={key => saveSettings({
            excluded: settingsRef.current.excluded.filter(
              value => value !== key
            ),
          })}
          onUnpin={key => saveSettings({
            pinned: settingsRef.current.pinned.filter(
              value => value !== key
            ),
          })}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'statistics' && (
        <PrepositionStatModal
          visible
          language={language}
          exerciseId={EXERCISE_ID}
          onToggle={() => setModal(null)}
        />
      )}

      {modal === 'description' && (
        <RootVerbDescriptionModal
          visible
          language={language}
          onClose={() => setModal(null)}
        />
      )}

      <PrepositionExitConfirmationModal
        visible={exitVisible}
        language={language}
        onCancel={() => {
          pendingExit.current = null;
          setExitVisible(false);
        }}
        onConfirm={confirmExit}
      />
    </>
  );
};

const createStyles = compact => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#83A3CD',
  },
  loading: {
    flex: 1,
    backgroundColor: '#83A3CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  topBar: {
    minHeight: compact ? 44 : 76,
    flexShrink: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: compact ? 90 : 116,
    height: compact ? 44 : 76,
    resizeMode: 'contain',
  },
  topButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topButton: {
    width: 42,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topIcon: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
  progressPanel: {
    minHeight: compact ? 44 : 54,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: compact ? 3 : 6,
    borderRadius: 12,
    backgroundColor: '#6C8EBB',
  },
  progressLabels: {
    flex: 1,
  },
  progressText: {
    color: '#FFF',
    fontSize: 12,
    lineHeight: 19,
  },
  progressBadge: {
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: '#83A3CD',
    color: '#FFF',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    flexShrink: 0,
    marginTop: compact ? 4 : 9,
    marginBottom: compact ? 6 : 14,
  },
  nextButton: {
    flexShrink: 0,
    minHeight: compact ? 48 : 52,
    marginVertical: compact ? 6 : 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 27,
    backgroundColor: '#CE6857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  actionText: {
    color: '#FFFDEF',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  resultContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  resultCard: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#FFFDEF',
    alignItems: 'center',
  },
  resultTitle: {
    color: '#333652',
    fontSize: 25,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  resultLabel: {
    marginTop: 22,
    color: '#6B708A',
    fontSize: 16,
    fontWeight: '700',
  },
  score: {
    color: '#CE6857',
    fontSize: 50,
    fontWeight: '900',
  },
  resultStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 18,
    marginVertical: 18,
  },
  resultStat: {
    color: '#333652',
    fontSize: 15,
    fontWeight: '800',
  },
  actionButton: {
    width: '100%',
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 10,
    borderRadius: 26,
    backgroundColor: '#CE6857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#83A3CD',
  },
  secondaryText: {
    color: '#333652',
  },
  warning: {
    color: '#FFFDEF',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 6,
  },
  error: {
    color: '#995047',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default RootVerbExercise;     