import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  BackHandler,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

import PrepositionVerbCard from './PrepositionVerbCard';
import PrepositionVerbListModal from './PrepositionVerbListModal';
import PrepositionVerbRotationModal from './PrepositionVerbRotationModal';
import PrepositionStatModal from './PrepositionStatModal';
import PrepositionVerbDescriptionModal from './PrepositionVerbDescriptionModal';
import PrepositionExitConfirmationModal from './PrepositionExitConfirmationModal';
import ProgressBar from './ProgressBar';

import { updateStatistics } from './stat';
import * as FirebaseAnalytics from './src/analytics/FirebaseAnalytics';

import prepositionsData from './prepo2.json';
import verbsData from './verbs1.json';
import preposition2Sounds from './preposition2Sounds';
import sounds from './Soundss';

const EXERCISE_ID = 'prepositionAfterVerbs';

const COUNT_KEY = 'preposition_verbs_selected_count';
const LEVEL_KEY = 'preposition_verbs_selected_levels';
const TYPE_KEY = 'preposition_verbs_selected_type';
const SOUND_KEY = 'preposition_verbs_sound_enabled';
const EXCLUDED_KEY = 'preposition_verbs_excluded_items';
const PINNED_KEY = 'preposition_verbs_pinned_items';

const DEFAULT_COUNT = 12;
const ALLOWED_COUNTS = [8, 12, 18, 24];

const REGULAR_LEVELS = ['base', 'middle', 'advanced'];
const ALLOWED_LEVELS = [...REGULAR_LEVELS, 'all'];
const DEFAULT_LEVELS = ['base'];

const PREPOSITION_TYPES = ['separate', 'prefix', 'all'];
const DEFAULT_PREPOSITION_TYPE = 'all';

const NEXT_BUTTON_DELAY = 1100;

const ANSWERS_BY_TYPE = {
  prefix: ['ל', 'ב', 'מ'],
  separate: ['עם', 'על', 'אל'],
};

const LANGUAGE_FIELDS = {
  ru: 'russian',
  en: 'english',
  fr: 'french',
  es: 'spanish',
  pt: 'portuguese',
  ar: 'arabic',
  am: 'amharic',
  he: 'hebrewFull',
};

const LANGUAGE_ALIASES = {
  ru: 'ru',
  russian: 'ru',
  русский: 'ru',

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

const UI_TEXT = {
  ru: {
    correct: 'ВЕРНО',
    wrong: 'НЕВЕРНО',
    next: 'ДАЛЕЕ',
    finish: 'ЗАВЕРШИТЬ',
    completed: 'Упражнение завершено',
    result: 'Результат',
    again: 'ЕЩЁ РАЗ',
    menu: 'В МЕНЮ',
    noItems: 'Для выбранных параметров нет заданий',
  },

  en: {
    correct: 'CORRECT',
    wrong: 'INCORRECT',
    next: 'NEXT',
    finish: 'FINISH',
    completed: 'Exercise completed',
    result: 'Result',
    again: 'AGAIN',
    menu: 'MENU',
    noItems: 'There are no tasks for the selected settings',
  },

  fr: {
    correct: 'CORRECT',
    wrong: 'INCORRECT',
    next: 'SUIVANT',
    finish: 'TERMINER',
    completed: 'Exercice terminé',
    result: 'Résultat',
    again: 'ENCORE',
    menu: 'MENU',
    noItems: 'Aucun exercice pour les paramètres choisis',
  },

  es: {
    correct: 'CORRECTO',
    wrong: 'INCORRECTO',
    next: 'SIGUIENTE',
    finish: 'TERMINAR',
    completed: 'Ejercicio terminado',
    result: 'Resultado',
    again: 'OTRA VEZ',
    menu: 'MENÚ',
    noItems: 'No hay ejercicios para los parámetros elegidos',
  },

  pt: {
    correct: 'CORRETO',
    wrong: 'INCORRETO',
    next: 'SEGUINTE',
    finish: 'TERMINAR',
    completed: 'Exercício concluído',
    result: 'Resultado',
    again: 'NOVAMENTE',
    menu: 'MENU',
    noItems: 'Não há exercícios para os parâmetros escolhidos',
  },

  ar: {
    correct: 'صحيح',
    wrong: 'غير صحيح',
    next: 'التالي',
    finish: 'إنهاء',
    completed: 'اكتمل التمرين',
    result: 'النتيجة',
    again: 'مرة أخرى',
    menu: 'القائمة',
    noItems: 'لا توجد تمارين للإعدادات المحددة',
  },

  am: {
    correct: 'ትክክል',
    wrong: 'ትክክል አይደለም',
    next: 'ቀጣይ',
    finish: 'ጨርስ',
    completed: 'ልምምዱ ተጠናቋል',
    result: 'ውጤት',
    again: 'እንደገና',
    menu: 'ምናሌ',
    noItems: 'ለተመረጡት ቅንብሮች ልምምዶች የሉም',
  },

  he: {
    correct: 'נכון',
    wrong: 'לא נכון',
    next: 'הבא',
    finish: 'סיום',
    completed: 'התרגיל הושלם',
    result: 'תוצאה',
    again: 'שוב',
    menu: 'תפריט',
    noItems: 'אין תרגילים עבור ההגדרות שנבחרו',
  },
};

const VERB_TRANSLATION_FIELDS = {
  ru: 'translationOptions',
  en: 'translationOptionsEn',
  fr: 'translationOptionsFr',
  es: 'translationOptionsEs',
  pt: 'translationOptionsPt',
  ar: 'translationOptionsAr',
  am: 'translationOptionsAm',
};

const normalizeLanguage = value => {
  const key = String(value || '').trim().toLowerCase();
  return LANGUAGE_ALIASES[key] || 'en';
};

const normalizePrepositionType = value =>
  PREPOSITION_TYPES.includes(value)
    ? value
    : DEFAULT_PREPOSITION_TYPE;

const stripMp3 = value =>
  String(value || '').replace(/\.mp3$/i, '').trim();

const shuffleArray = source => {
  const result = [...source];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [result[i], result[randomIndex]] = [
      result[randomIndex],
      result[i],
    ];
  }

  return result;
};

const buildRotationDeck = (
  sourceItems,
  excluded = [],
  pinned = [],
  deckSize = DEFAULT_COUNT
) => {
  const safeDeckSize = ALLOWED_COUNTS.includes(deckSize)
    ? deckSize
    : DEFAULT_COUNT;

  const excludedSet = new Set((excluded || []).map(String));
  const pinnedSet = new Set((pinned || []).map(String));

  const pool = (sourceItems || []).filter(
    item =>
      item &&
      !excludedSet.has(String(item.id))
  );

  if (pool.length <= safeDeckSize) {
    return shuffleArray(pool);
  }

  const pinnedItems = pool.filter(item =>
    pinnedSet.has(String(item.id))
  );

  const regularItems = pool.filter(
    item =>
      !pinnedSet.has(String(item.id))
  );

  const pinnedLimit = Math.min(
    Math.floor(safeDeckSize / 2),
    pinnedItems.length,
    safeDeckSize
  );

  let selectedPinned = shuffleArray(pinnedItems).slice(
    0,
    pinnedLimit
  );

  const selectedRegular = shuffleArray(regularItems).slice(
    0,
    safeDeckSize - selectedPinned.length
  );

  const stillNeed =
    safeDeckSize -
    selectedPinned.length -
    selectedRegular.length;

  if (stillNeed > 0) {
    const selectedIds = new Set(
      selectedPinned.map(item => String(item.id))
    );

    const extraPinned = shuffleArray(pinnedItems).filter(
      item =>
        !selectedIds.has(String(item.id))
    );

    selectedPinned = selectedPinned.concat(
      extraPinned.slice(0, stillNeed)
    );
  }

  return shuffleArray([
    ...selectedPinned,
    ...selectedRegular,
  ]);
};

const getTranslation = (
  item,
  language
) => {
  const field =
    LANGUAGE_FIELDS[language] ||
    'english';

  return (
    item?.[field] ||
    item?.english ||
    item?.russian ||
    ''
  );
};

const getItemId = (
  item,
  index
) =>
  [
    item?.level || 'unknown',
    item?.prepositionType || 'unknown',
    item?.verb || 'unknown',
    item?.hebrewFull || 'unknown',
    stripMp3(item?.mp3) || index,
  ].join('__');

const normalizeHebrewVerb = value =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/[״"'׳\-\s]/g, '')
    .trim();

const collectVerbEntries = source => {
  const result = [];

  const walk = value => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    if (
      !value ||
      typeof value !== 'object'
    ) {
      return;
    }

    if (value.hebrewVerb) {
      result.push(value);
    }

    Object.values(value).forEach(nested => {
      if (
        nested &&
        (
          Array.isArray(nested) ||
          typeof nested === 'object'
        )
      ) {
        walk(nested);
      }
    });
  };

  walk(source);

  return result;
};

const VERB_MAP = collectVerbEntries(
  verbsData
).reduce(
  (
    result,
    verbItem
  ) => {
    const key =
      normalizeHebrewVerb(
        verbItem.hebrewVerb
      );

    if (
      key &&
      !result[key]
    ) {
      result[key] = verbItem;
    }

    return result;
  },
  {}
);

const getVerbInformation = (
  verb,
  language
) => {
  const verbItem =
    VERB_MAP[
      normalizeHebrewVerb(verb)
    ];

  if (!verbItem) {
    return {
      verbInfinitive: '—',
      verbTranslation: '—',
      verbFound: false,
    };
  }

  const translationField =
    VERB_TRANSLATION_FIELDS[
      language
    ] ||
    'translationOptionsEn';

  const translations =
    Array.isArray(
      verbItem[translationField]
    )
      ? verbItem[translationField]
      : [];

  const fallbackTranslations =
    Array.isArray(
      verbItem.translationOptions
    )
      ? verbItem.translationOptions
      : [];

  const correctIndex =
    Number.isInteger(
      verbItem.correctTranslationIndex
    )
      ? verbItem.correctTranslationIndex
      : 0;

  return {
    verbInfinitive:
      verbItem.hebrewVerb ||
      verb ||
      '—',

    verbTranslation:
      translations[correctIndex] ||
      fallbackTranslations[
        correctIndex
      ] ||
      '—',

    verbFound: true,
    verbRoot: verbItem.root || '',
    verbBinyan: verbItem.binyan || '',

    verbTransliteration:
      verbItem.transliteration ||
      '',
  };
};

const prepareItems = (
  language,
  levels
) => {
  const source =
    Array.isArray(prepositionsData)
      ? prepositionsData
      : [];

  const safeLevels =
    Array.isArray(levels)
      ? levels.filter(level =>
          REGULAR_LEVELS.includes(level)
        )
      : [];

  return source
    .filter(item => {
      if (
        !item ||
        !safeLevels.includes(item.level)
      ) {
        return false;
      }

      const answers =
        ANSWERS_BY_TYPE[
          item.prepositionType
        ];

      return (
        !!answers &&
        answers.includes(item.correct) &&
        !!item.before &&
        !!item.after &&
        !!item.hebrewFull
      );
    })
    .map((item, index) => ({
      ...item,

      id: getItemId(
        item,
        index
      ),

      translation:
        getTranslation(
          item,
          language
        ),

      mp3: stripMp3(item.mp3),

      ...getVerbInformation(
        item.verb,
        language
      ),
    }))
    .filter(
      item =>
        !!item.translation
    );
};

const buildOptions = item => {
  const values =
    ANSWERS_BY_TYPE[
      item?.prepositionType
    ] || [];

  return shuffleArray(
    values.map(value => ({
      id:
        `${item?.id || 'item'}__${value}`,

      value,

      isCorrect:
        value === item?.correct,
    }))
  );
};

const safeUnloadSound =
  async soundObject => {
    if (!soundObject) {
      return;
    }

    try {
      const status =
        await soundObject.getStatusAsync();

      if (status?.isLoaded) {
        await soundObject.unloadAsync();
      }
    } catch (error) {
      console.log(
        'Unable to unload sound:',
        error
      );
    }
  };

const PrepositionVerbExercise = ({
  navigation,
  route,
}) => {
  const routeLanguage =
    route?.params?.language;

  const [language, setLanguage] =
    useState(
      normalizeLanguage(
        routeLanguage || 'en'
      )
    );

  const [selectedCount, setSelectedCount] =
    useState(DEFAULT_COUNT);

  const [selectedLevels, setSelectedLevels] =
    useState(DEFAULT_LEVELS);

  const [
    selectedPrepositionType,
    setSelectedPrepositionType,
  ] =
    useState(
      DEFAULT_PREPOSITION_TYPE
    );

  const [soundEnabled, setSoundEnabled] =
    useState(true);

  const [settingsLoaded, setSettingsLoaded] =
    useState(false);

  const [listVisible, setListVisible] =
    useState(true);

  const [excludedIds, setExcludedIds] =
    useState([]);

  const [pinnedIds, setPinnedIds] =
    useState([]);

  const excludedRef =
    useRef([]);

  const pinnedRef =
    useRef([]);

  const [
    isRotationModalVisible,
    setIsRotationModalVisible,
  ] =
    useState(false);

  const [deck, setDeck] =
    useState([]);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [
    selectedOption,
    setSelectedOption,
  ] =
    useState(null);

  const [answered, setAnswered] =
    useState(false);

  const [canGoNext, setCanGoNext] =
    useState(false);

  const [
    correctAnswers,
    setCorrectAnswers,
  ] =
    useState(0);

  const [
    incorrectAnswers,
    setIncorrectAnswers,
  ] =
    useState(0);

  const [
    exerciseCompleted,
    setExerciseCompleted,
  ] =
    useState(false);

  const [
    isStatModalVisible,
    setIsStatModalVisible,
  ] =
    useState(false);

  const [
    isDescriptionModalVisible,
    setIsDescriptionModalVisible,
  ] =
    useState(false);

  const [
    isExitModalVisible,
    setIsExitModalVisible,
  ] =
    useState(false);

  const feedbackSoundRef =
    useRef(null);

  const pronunciationSoundRef =
    useRef(null);

  const nextTimerRef =
    useRef(null);

  const pronunciationTimerRef =
    useRef(null);

  const pendingExitActionRef =
    useRef(null);

  const allowNavigationExitRef =
    useRef(false);

  const normalizedLanguage =
    normalizeLanguage(language);

    const exerciseLoggedRef=useRef(false);

useFocusEffect(
  useCallback(()=>{
    if(exerciseLoggedRef.current)return;
    if(!settingsLoaded)return;

    exerciseLoggedRef.current=true;

    const eventName=`prepositionverbs${normalizedLanguage}`;

    FirebaseAnalytics.logFirebaseEvent(eventName,{
      screen:eventName
    });

    return()=>{
      exerciseLoggedRef.current=false;
    };
  },[settingsLoaded,normalizedLanguage])
);

  const uiText =
    UI_TEXT[normalizedLanguage] ||
    UI_TEXT.en;

  const preparedItems =
    useMemo(
      () =>
        prepareItems(
          normalizedLanguage,
          selectedLevels
        ),
      [
        normalizedLanguage,
        selectedLevels,
      ]
    );

  const allPreparedItems =
    useMemo(
      () =>
        prepareItems(
          normalizedLanguage,
          REGULAR_LEVELS
        ),
      [normalizedLanguage]
    );

  const currentItem =
    deck[currentIndex] ||
    null;

  const options =
    useMemo(
      () =>
        buildOptions(currentItem),
      [currentItem?.id]
    );

  const attempts =
    correctAnswers +
    incorrectAnswers;

  const score =
    attempts
      ? Math.round(
          (
            correctAnswers /
            attempts
          ) *
            100
        )
      : 0;

  const progress =
    useMemo(() => {
      if (!deck.length) {
        return 0;
      }

      return Math.min(
        currentIndex +
          (answered ? 1 : 0),
        deck.length
      );
    }, [
      answered,
      currentIndex,
      deck.length,
    ]);

  const remaining =
    Math.max(
      deck.length -
        currentIndex -
        (answered ? 1 : 0),
      0
    );

  const clearNextTimer =
    useCallback(() => {
      if (
        nextTimerRef.current
      ) {
        clearTimeout(
          nextTimerRef.current
        );

        nextTimerRef.current =
          null;
      }
    }, []);

  const clearPronunciationTimer =
    useCallback(() => {
      if (
        pronunciationTimerRef.current
      ) {
        clearTimeout(
          pronunciationTimerRef.current
        );

        pronunciationTimerRef.current =
          null;
      }
    }, []);

  const handleOpenMenu =
    useCallback(() => {
      clearNextTimer();
      clearPronunciationTimer();

      safeUnloadSound(
        feedbackSoundRef.current
      );

      safeUnloadSound(
        pronunciationSoundRef.current
      );

      feedbackSoundRef.current =
        null;

      pronunciationSoundRef.current =
        null;

      if (
        navigation?.canGoBack?.()
      ) {
        navigation.goBack();
        return;
      }

      navigation?.navigate?.(
        'Menu'
      );
    }, [
      clearNextTimer,
      clearPronunciationTimer,
      navigation,
    ]);

  const requestExit =
    useCallback(
      exitAction => {
        pendingExitActionRef.current =
          typeof exitAction === 'function'
            ? exitAction
            : null;

        setIsExitModalVisible(true);
      },
      []
    );

  const handleCancelExit =
    useCallback(() => {
      pendingExitActionRef.current =
        null;

      setIsExitModalVisible(false);
    }, []);

  const handleConfirmExit =
    useCallback(() => {
      const exitAction =
        pendingExitActionRef.current;

      pendingExitActionRef.current =
        null;

      allowNavigationExitRef.current =
        true;

      setIsExitModalVisible(false);

      clearNextTimer();
      clearPronunciationTimer();

      safeUnloadSound(
        feedbackSoundRef.current
      );

      safeUnloadSound(
        pronunciationSoundRef.current
      );

      feedbackSoundRef.current =
        null;

      pronunciationSoundRef.current =
        null;

      if (exitAction) {
        exitAction();
      }

      setTimeout(() => {
        allowNavigationExitRef.current =
          false;
      }, 300);
    }, [
      clearNextTimer,
      clearPronunciationTimer,
    ]);

  const requestOpenExerciseSettings =
    useCallback(() => {
      requestExit(() => {
        setListVisible(true);
      });
    }, [requestExit]);

  useFocusEffect(
    useCallback(() => {
      const handleBackPress = () => {
        if (
          listVisible ||
          exerciseCompleted
        ) {
          handleOpenMenu();
          return true;
        }

        requestExit(
          handleOpenMenu
        );

        return true;
      };

      const subscription =
        BackHandler.addEventListener(
          'hardwareBackPress',
          handleBackPress
        );

      return () =>
        subscription.remove();
    }, [
      listVisible,
      exerciseCompleted,
      handleOpenMenu,
      requestExit,
    ])
  );

  useEffect(() => {
    if (
      !navigation?.addListener
    ) {
      return undefined;
    }

    const unsubscribe =
      navigation.addListener(
        'beforeRemove',
        event => {
          if (
            listVisible ||
            exerciseCompleted ||
            allowNavigationExitRef.current
          ) {
            return;
          }

          event.preventDefault();

          requestExit(() => {
            allowNavigationExitRef.current =
              true;

            navigation.dispatch(
              event.data.action
            );

            setTimeout(() => {
              allowNavigationExitRef.current =
                false;
            }, 0);
          });
        }
      );

    return unsubscribe;
  }, [
    navigation,
    listVisible,
    exerciseCompleted,
    requestExit,
  ]);

  useEffect(() => {
    let active = true;

    const loadSettings =
      async () => {
        try {
          const [
            storedLanguage,
            storedCount,
            storedLevels,
            storedType,
            storedSound,
            storedExcluded,
            storedPinned,
          ] =
            await Promise.all([
              AsyncStorage.getItem(
                'language'
              ),
              AsyncStorage.getItem(
                COUNT_KEY
              ),
              AsyncStorage.getItem(
                LEVEL_KEY
              ),
              AsyncStorage.getItem(
                TYPE_KEY
              ),
              AsyncStorage.getItem(
                SOUND_KEY
              ),
              AsyncStorage.getItem(
                EXCLUDED_KEY
              ),
              AsyncStorage.getItem(
                PINNED_KEY
              ),
            ]);

          if (!active) {
            return;
          }

          /*
           * Язык, переданный из меню,
           * имеет приоритет над AsyncStorage.
           */
          if (routeLanguage) {
            setLanguage(
              normalizeLanguage(
                routeLanguage
              )
            );
          } else if (
            storedLanguage
          ) {
            setLanguage(
              storedLanguage
            );
          }

          const count =
            Number(storedCount);

          if (
            ALLOWED_COUNTS.includes(
              count
            )
          ) {
            setSelectedCount(count);
          }

          if (storedLevels) {
            try {
              const parsed =
                JSON.parse(
                  storedLevels
                );

              const valid =
                Array.isArray(parsed)
                  ? parsed.filter(level =>
                      REGULAR_LEVELS.includes(
                        level
                      )
                    )
                  : [];

              if (valid.length) {
                setSelectedLevels(
                  valid
                );
              }
            } catch {
              if (
                REGULAR_LEVELS.includes(
                  storedLevels
                )
              ) {
                setSelectedLevels([
                  storedLevels,
                ]);
              } else if (
                storedLevels === 'all'
              ) {
                setSelectedLevels([
                  ...REGULAR_LEVELS,
                ]);
              }
            }
          }

          if (storedType) {
            setSelectedPrepositionType(
              normalizePrepositionType(
                storedType
              )
            );
          }

          setSoundEnabled(
            storedSound !== 'false'
          );

          let parsedExcluded = [];
          let parsedPinned = [];

          try {
            parsedExcluded =
              storedExcluded
                ? JSON.parse(
                    storedExcluded
                  )
                : [];
          } catch {
            parsedExcluded = [];
          }

          try {
            parsedPinned =
              storedPinned
                ? JSON.parse(
                    storedPinned
                  )
                : [];
          } catch {
            parsedPinned = [];
          }

          const safeExcluded =
            Array.isArray(
              parsedExcluded
            )
              ? parsedExcluded.map(
                  String
                )
              : [];

          const safePinned =
            Array.isArray(
              parsedPinned
            )
              ? parsedPinned.map(
                  String
                )
              : [];

          setExcludedIds(
            safeExcluded
          );

          setPinnedIds(
            safePinned
          );

          excludedRef.current =
            safeExcluded;

          pinnedRef.current =
            safePinned;
        } catch (error) {
          console.log(
            'Failed to load preposition exercise settings:',
            error
          );
        } finally {
          if (active) {
            setSettingsLoaded(true);
          }
        }
      };

    loadSettings();

    return () => {
      active = false;
    };
  }, [routeLanguage]);

  useEffect(
    () => () => {
      clearNextTimer();
      clearPronunciationTimer();

      safeUnloadSound(
        feedbackSoundRef.current
      );

      safeUnloadSound(
        pronunciationSoundRef.current
      );
    },
    [
      clearNextTimer,
      clearPronunciationTimer,
    ]
  );

  const playSoundSource =
    useCallback(
      async (
        source,
        soundRef,
        volume = 1
      ) => {
        if (
          !soundEnabled ||
          !source
        ) {
          return;
        }

        await safeUnloadSound(
          soundRef.current
        );

        soundRef.current = null;

        const soundObject =
          new Audio.Sound();

        soundRef.current =
          soundObject;

        try {
          await soundObject.loadAsync(
            source,
            { volume }
          );

          await soundObject.playAsync();

          soundObject.setOnPlaybackStatusUpdate(
            status => {
              if (
                !status?.didJustFinish
              ) {
                return;
              }

              safeUnloadSound(
                soundObject
              );

              if (
                soundRef.current ===
                soundObject
              ) {
                soundRef.current =
                  null;
              }
            }
          );
        } catch (error) {
          console.log(
            'Sound playback error:',
            error
          );

          await safeUnloadSound(
            soundObject
          );

          if (
            soundRef.current ===
            soundObject
          ) {
            soundRef.current =
              null;
          }
        }
      },
      [soundEnabled]
    );

  const playFeedback =
    useCallback(
      isCorrect =>
        playSoundSource(
          isCorrect
            ? sounds?.success
            : sounds?.failure,

          feedbackSoundRef,

          isCorrect
            ? 1
            : 0.8
        ),
      [playSoundSource]
    );

  const playPronunciation =
    useCallback(
      mp3Key => {
        const key =
          stripMp3(mp3Key);

        if (!key) {
          return;
        }

        const source =
          preposition2Sounds[key];

        if (!source) {
          console.warn(
            `Preposition 2 sound not found: ${key}`
          );

          return;
        }

        playSoundSource(
          source,
          pronunciationSoundRef,
          1
        );
      },
      [playSoundSource]
    );

  const handleSelectCount =
    useCallback(count => {
      if (
        !ALLOWED_COUNTS.includes(
          count
        )
      ) {
        return;
      }

      setSelectedCount(count);

      AsyncStorage.setItem(
        COUNT_KEY,
        String(count)
      ).catch(console.log);
    }, []);

  const handleSelectLevel =
    useCallback(level => {
      setSelectedLevels(previous => {
        const current =
          previous.filter(value =>
            REGULAR_LEVELS.includes(
              value
            )
          );

        let next;

        if (level === 'all') {
          next = [
            ...REGULAR_LEVELS,
          ];
        } else if (
          !REGULAR_LEVELS.includes(
            level
          )
        ) {
          return current;
        } else if (
          current.includes(level)
        ) {
          next =
            current.filter(
              value =>
                value !== level
            );

          if (!next.length) {
            return current;
          }
        } else {
          next = [
            ...current,
            level,
          ];
        }

        AsyncStorage.setItem(
          LEVEL_KEY,
          JSON.stringify(next)
        ).catch(console.log);

        return next;
      });
    }, []);

  const handleSelectPrepositionType =
    useCallback(type => {
      const normalizedType =
        normalizePrepositionType(
          type
        );

      setSelectedPrepositionType(
        normalizedType
      );

      AsyncStorage.setItem(
        TYPE_KEY,
        normalizedType
      ).catch(console.log);
    }, []);

  const saveExcluded =
    useCallback(async next => {
      const safe =
        Array.from(
          new Set(
            (next || []).map(
              String
            )
          )
        );

      setExcludedIds(safe);
      excludedRef.current = safe;

      await AsyncStorage.setItem(
        EXCLUDED_KEY,
        JSON.stringify(safe)
      );
    }, []);

  const savePinned =
    useCallback(async next => {
      const safe =
        Array.from(
          new Set(
            (next || []).map(
              String
            )
          )
        );

      setPinnedIds(safe);
      pinnedRef.current = safe;

      await AsyncStorage.setItem(
        PINNED_KEY,
        JSON.stringify(safe)
      );
    }, []);

  const handleExcludeItem =
    useCallback(
      async itemId => {
        if (!itemId) {
          return;
        }

        const id =
          String(itemId);

        const excludedSet =
          new Set(
            excludedRef.current ||
              []
          );

        const pinnedSet =
          new Set(
            pinnedRef.current ||
              []
          );

        if (
          excludedSet.has(id)
        ) {
          excludedSet.delete(id);

          await saveExcluded(
            Array.from(
              excludedSet
            )
          );

          return;
        }

        if (
          pinnedSet.has(id)
        ) {
          pinnedSet.delete(id);

          await savePinned(
            Array.from(
              pinnedSet
            )
          );
        }

        excludedSet.add(id);

        await saveExcluded(
          Array.from(
            excludedSet
          )
        );
      },
      [
        saveExcluded,
        savePinned,
      ]
    );

  const handleTogglePinnedItem =
    useCallback(
      async itemId => {
        if (!itemId) {
          return;
        }

        const id =
          String(itemId);

        const pinnedSet =
          new Set(
            pinnedRef.current ||
              []
          );

        const excludedSet =
          new Set(
            excludedRef.current ||
              []
          );

        if (
          excludedSet.has(id)
        ) {
          excludedSet.delete(id);

          await saveExcluded(
            Array.from(
              excludedSet
            )
          );
        }

        if (
          pinnedSet.has(id)
        ) {
          pinnedSet.delete(id);
        } else {
          pinnedSet.add(id);
        }

        await savePinned(
          Array.from(
            pinnedSet
          )
        );
      },
      [
        saveExcluded,
        savePinned,
      ]
    );

  const handleRestoreItem =
    useCallback(
      async itemId => {
        if (!itemId) {
          return;
        }

        const id =
          String(itemId);

        const next =
          (
            excludedRef.current ||
            []
          ).filter(
            value =>
              String(value) !== id
          );

        await saveExcluded(next);
      },
      [saveExcluded]
    );

  const handleUnpinItem =
    useCallback(
      async itemId => {
        if (!itemId) {
          return;
        }

        const id =
          String(itemId);

        const next =
          (
            pinnedRef.current ||
            []
          ).filter(
            value =>
              String(value) !== id
          );

        await savePinned(next);
      },
      [savePinned]
    );

  const handleSoundToggle =
    useCallback(async () => {
      const nextValue =
        !soundEnabled;

      setSoundEnabled(nextValue);

      try {
        await AsyncStorage.setItem(
          SOUND_KEY,
          String(nextValue)
        );
      } catch (error) {
        console.log(
          'Failed to save sound setting:',
          error
        );
      }

      if (!nextValue) {
        clearPronunciationTimer();

        await safeUnloadSound(
          feedbackSoundRef.current
        );

        await safeUnloadSound(
          pronunciationSoundRef.current
        );

        feedbackSoundRef.current =
          null;

        pronunciationSoundRef.current =
          null;
      }
    }, [
      soundEnabled,
      clearPronunciationTimer,
    ]);

  const startExercise =
    useCallback(
      (
        selectedType,
        filteredItems
      ) => {
        clearNextTimer();
        clearPronunciationTimer();

        const normalizedType =
          normalizePrepositionType(
            selectedType ||
              selectedPrepositionType
          );

        const sourceItems =
          Array.isArray(
            filteredItems
          )
            ? filteredItems
            : preparedItems.filter(
                item => {
                  if (
                    normalizedType ===
                    'separate'
                  ) {
                    return (
                      item.prepositionType ===
                      'separate'
                    );
                  }

                  if (
                    normalizedType ===
                    'prefix'
                  ) {
                    return (
                      item.prepositionType ===
                      'prefix'
                    );
                  }

                  return true;
                }
              );

        setSelectedPrepositionType(
          normalizedType
        );

        AsyncStorage.setItem(
          TYPE_KEY,
          normalizedType
        ).catch(console.log);

        const safeCount =
          ALLOWED_COUNTS.includes(
            selectedCount
          )
            ? selectedCount
            : DEFAULT_COUNT;

        const nextDeck =
          buildRotationDeck(
            sourceItems,
            excludedRef.current,
            pinnedRef.current,
            safeCount
          );

        setDeck(nextDeck);
        setCurrentIndex(0);
        setSelectedOption(null);
        setAnswered(false);
        setCanGoNext(false);
        setCorrectAnswers(0);
        setIncorrectAnswers(0);
        setExerciseCompleted(false);
        setListVisible(false);
      },
      [
        clearNextTimer,
        clearPronunciationTimer,
        preparedItems,
        selectedCount,
        selectedPrepositionType,
      ]
    );

  const handleAnswer =
    useCallback(
      option => {
        if (
          !option ||
          answered ||
          !currentItem
        ) {
          return;
        }

        setSelectedOption(
          option.value
        );

        setAnswered(true);
        setCanGoNext(false);

        if (option.isCorrect) {
          setCorrectAnswers(
            value =>
              value + 1
          );
        } else {
          setIncorrectAnswers(
            value =>
              value + 1
          );
        }

        playFeedback(
          option.isCorrect
        );

        clearPronunciationTimer();

        pronunciationTimerRef.current =
          setTimeout(() => {
            playPronunciation(
              currentItem.mp3
            );

            pronunciationTimerRef.current =
              null;
          }, 220);

        clearNextTimer();

        nextTimerRef.current =
          setTimeout(() => {
            setCanGoNext(true);

            nextTimerRef.current =
              null;
          }, NEXT_BUTTON_DELAY);
      },
      [
        answered,
        currentItem,
        playFeedback,
        playPronunciation,
        clearNextTimer,
        clearPronunciationTimer,
      ]
    );

  const completeExercise =
    useCallback(async () => {
      setExerciseCompleted(true);

      const total =
        correctAnswers +
        incorrectAnswers;

      const finalScore =
        total
          ? (
              (
                correctAnswers /
                total
              ) *
              100
            ).toFixed(2)
          : '0.00';

      try {
        await updateStatistics(
          EXERCISE_ID,
          finalScore
        );
      } catch (error) {
        console.log(
          'Failed to save statistics:',
          error
        );
      }
    }, [
      correctAnswers,
      incorrectAnswers,
    ]);

  const handleNext =
    useCallback(() => {
      if (
        !answered ||
        !canGoNext
      ) {
        return;
      }

      clearNextTimer();
      clearPronunciationTimer();

      setCanGoNext(false);

      const nextIndex =
        currentIndex + 1;

      if (
        nextIndex >=
        deck.length
      ) {
        completeExercise();
        return;
      }

      setAnswered(false);
      setSelectedOption(null);
      setCurrentIndex(nextIndex);
    }, [
      answered,
      canGoNext,
      currentIndex,
      deck.length,
      completeExercise,
      clearNextTimer,
      clearPronunciationTimer,
    ]);

  const handleOpenStatistics =
    useCallback(() => {
      setIsStatModalVisible(true);
    }, []);

  const handleOpenDescription =
    useCallback(() => {
      setIsDescriptionModalVisible(
        true
      );
    }, []);

  const handleCloseDescription =
    useCallback(() => {
      setIsDescriptionModalVisible(
        false
      );
    }, []);

  if (listVisible) {
    if (!settingsLoaded) {
      return (
        <SafeAreaView
          style={
            styles.settingsLoadingScreen
          }
        />
      );
    }

    return (
      <PrepositionVerbListModal
        language={normalizedLanguage}
        items={preparedItems}
        selectedCount={selectedCount}
        selectedLevels={selectedLevels}
        allowedCounts={ALLOWED_COUNTS}
        allowedLevels={ALLOWED_LEVELS}
        selectedPrepositionType={
          selectedPrepositionType
        }
        onSelectPrepositionType={
          handleSelectPrepositionType
        }
        onSelectCount={
          handleSelectCount
        }
        onSelectLevel={
          handleSelectLevel
        }
        onStart={startExercise}
      />
    );
  }

  if (!deck.length) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {uiText.noItems}
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              setListVisible(true)
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {uiText.again}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleOpenMenu}
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              {uiText.menu}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (exerciseCompleted) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.completionCard}>
          <Text style={styles.completionTitle}>
            {uiText.completed}
          </Text>

          <Text style={styles.resultLabel}>
            {uiText.result}
          </Text>

          <Text style={styles.score}>
            {score}%
          </Text>

          <View style={styles.completionStats}>
            <Text style={styles.completionStat}>
              {uiText.correct}:{' '}
              {correctAnswers}
            </Text>

            <Text style={styles.completionStat}>
              {uiText.wrong}:{' '}
              {incorrectAnswers}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              setListVisible(true)
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {uiText.again}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleOpenMenu}
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              {uiText.menu}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.screen}>
         <View style={styles.content}>
        <View style={styles.topBar}>
          <Image
            source={require('./VERBIFY.png')}
            style={styles.logo}
          />

          <View style={styles.topButtons}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSoundToggle}
            >
              <Image
                source={
                  soundEnabled
                    ? require('./SoundOn.png')
                    : require('./SoundOff.png')
                }
                style={styles.topButtonIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={
                requestOpenExerciseSettings
              }
            >
              <Image
                source={require('./spisok2.png')}
                style={styles.topButtonIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenStatistics}
            >
              <Image
                source={require('./stat.png')}
                style={styles.topButtonIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenDescription}
            >
              <Image
                source={require('./question.png')}
                style={styles.topButtonIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View
            style={
              styles.progressTextContainer
            }
          >
            <Text
              style={styles.progressStatText}
              maxFontSizeMultiplier={1.2}
            >
              {uiText.correct}:{' '}
              {correctAnswers}
            </Text>

            <Text
              style={styles.progressStatText}
              maxFontSizeMultiplier={1.2}
            >
              {uiText.wrong}:{' '}
              {incorrectAnswers}
            </Text>
          </View>

          <View
            style={
              styles.remainingTasksContainer
            }
          >
            <Text
              style={
                styles.remainingTasksText
              }
              maxFontSizeMultiplier={1.2}
            >
              {remaining}
            </Text>
          </View>

          <View style={styles.percentContainer}>
            <Text
              style={styles.percentText}
              maxFontSizeMultiplier={1.2}
            >
              {score}%
            </Text>
          </View>
        </View>

        <View
          style={
            styles.progressBarContainer
          }
        >
          <ProgressBar
            progress={progress}
            totalExercises={deck.length}
          />
        </View>

        <View style={styles.cardWrapper}>
          <PrepositionVerbCard
            item={currentItem}
            options={options}
            selectedOption={selectedOption}
            answered={answered}
            soundEnabled={soundEnabled}
            onSelectAnswer={handleAnswer}
            onPlayAudio={playPronunciation}

            isExcluded={
              currentItem
                ? excludedIds.includes(
                    String(currentItem.id)
                  )
                : false
            }

            isPinned={
              currentItem
                ? pinnedIds.includes(
                    String(currentItem.id)
                  )
                : false
            }

            onExcludePress={() =>
              currentItem &&
              handleExcludeItem(
                currentItem.id
              )
            }

            onPinTogglePress={() =>
              currentItem &&
              handleTogglePinnedItem(
                currentItem.id
              )
            }

            onOpenManageModal={() =>
              setIsRotationModalVisible(true)
            }
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.nextButton,
            (
              !answered ||
              !canGoNext
            ) &&
              styles.nextButtonDisabled,
          ]}
          disabled={
            !answered ||
            !canGoNext
          }
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex ===
            deck.length - 1
              ? uiText.finish
              : uiText.next}
          </Text>
        </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isRotationModalVisible && (
        <PrepositionVerbRotationModal
          visible
          language={normalizedLanguage}
          items={allPreparedItems}
          excludedIds={excludedIds}
          pinnedIds={pinnedIds}
          onRestore={handleRestoreItem}
          onUnpin={handleUnpinItem}
          onClose={() =>
            setIsRotationModalVisible(false)
          }
        />
      )}

      {isStatModalVisible && (
        <PrepositionStatModal
          visible
          language={normalizedLanguage}
          exerciseId={EXERCISE_ID}
          onToggle={() =>
            setIsStatModalVisible(false)
          }
        />
      )}

      {isDescriptionModalVisible && (
        <PrepositionVerbDescriptionModal
          visible
          language={normalizedLanguage}
          exerciseId={EXERCISE_ID}
          onToggle={handleCloseDescription}
        />
      )}

      <PrepositionExitConfirmationModal
        visible={isExitModalVisible}
        language={normalizedLanguage}
        onCancel={handleCancelExit}
        onConfirm={handleConfirmExit}
      />
    </>
  );
};

const styles = StyleSheet.create({
screen: {
  flex: 1,
  backgroundColor: '#83A3CD',
},

content: {
  flex: 1,
  paddingHorizontal: 16,
},

  settingsLoadingScreen: {
    flex: 1,
    backgroundColor: '#83A3CD',
  },

  topBar: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logo: {
    width: 130,
    height: 84,
    resizeMode: 'contain',
  },

  topButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  topButtonIcon: {
    width: 38,
    height: 38,
    resizeMode: 'contain',
  },

  progressContainer: {
    width: '100%',
    minHeight: 54,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#6C8EBB',

    borderRadius: 10,

    marginTop: 0,
    marginBottom: 8,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,

    elevation: 5,
  },

  progressTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  progressStatText: {
    color: '#FFFFFF',

    fontSize: 12,
    lineHeight: 17,

    textAlign: 'left',

    marginLeft: 14,
  },

  remainingTasksContainer: {
    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,
  },

  remainingTasksText: {
    minWidth: 44,

    paddingHorizontal: 10,
    paddingVertical: 3,

    color: '#FFFFFF',

    fontSize: 20,
    lineHeight: 27,

    fontWeight: 'bold',

    textAlign: 'center',

    backgroundColor: '#83A3CD',

    borderRadius: 10,
  },

  percentContainer: {
    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,
  },

  percentText: {
    minWidth: 68,

    paddingHorizontal: 8,

    color: '#FFFFFF',

    fontSize: 20,
    fontWeight: 'bold',

    textAlign: 'center',

    backgroundColor: '#83A3CD',

    borderRadius: 10,
  },

  progressBarContainer: {
    width: '100%',
    marginBottom: 14,
  },

  cardWrapper: {
    flex: 1,
    minHeight: 0,
  },

  nextButton: {
    minHeight: 52,

    borderRadius: 29,

    backgroundColor: '#CE6857',

    alignItems: 'center',
    justifyContent: 'center',

    marginVertical: 14,
  },

  nextButtonDisabled: {
    opacity: 0.4,
  },

  nextButtonText: {
    color: '#FFFDEF',

    fontSize: 18,
    fontWeight: '900',
  },

  emptyContainer: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    padding: 24,
  },

  emptyText: {
    color: '#FFFDEF',

    fontSize: 20,
    fontWeight: '700',

    textAlign: 'center',

    marginBottom: 24,
  },

  completionCard: {
    marginTop: '30%',

    backgroundColor: '#FFFDEF',

    borderRadius: 24,

    padding: 26,

    alignItems: 'center',
  },

  completionTitle: {
    color: '#333652',

    fontSize: 25,
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

  completionStats: {
    width: '100%',

    flexDirection: 'row',

    justifyContent: 'space-around',

    marginVertical: 20,
  },

  completionStat: {
    color: '#333652',

    fontSize: 15,
    fontWeight: '800',
  },

  primaryButton: {
    width: '100%',
    minHeight: 56,

    borderRadius: 28,

    backgroundColor: '#CE6857',

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 10,
  },

  primaryButtonText: {
    color: '#FFFDEF',

    fontSize: 17,
    fontWeight: '900',
  },

  secondaryButton: {
    width: '100%',
    minHeight: 52,

    borderRadius: 26,

    borderWidth: 2,
    borderColor: '#83A3CD',

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 10,
  },

  secondaryButtonText: {
    color: '#333652',

    fontSize: 16,
    fontWeight: '900',
  },
});

export default PrepositionVerbExercise;