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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';

import PrepositionCard from './PrepositionCard';
import PrepositionListModal from './PrepositionListModal';
import ProgressBar from './ProgressBar';

import PrepositionStatModal from './PrepositionStatModal';
import PrepositionDescriptionModal from './PrepositionDescriptionModal';

import { updateStatistics } from './stat';

import prepositionsData from './prepositions.json';
import prepositionSounds from './prepositionSounds';
import sounds from './Soundss';
import PrepositionExitConfirmationModal from './PrepositionExitConfirmationModal';
import * as FirebaseAnalytics from './src/analytics/FirebaseAnalytics';


const EXERCISE_ID = 'prepositionPronouns';

const COUNT_KEY = 'preposition_pronouns_selected_count';
const LEVEL_KEY = 'preposition_pronouns_selected_level';
const SOUND_KEY = 'preposition_pronouns_sound_enabled';

const DIRECTION_KEY =
  'preposition_pronouns_translation_direction';

const DIRECTION_TO_HEBREW =
  'toHebrew';

const DIRECTION_FROM_HEBREW =
  'fromHebrew';

const DEFAULT_DIRECTION =
  DIRECTION_TO_HEBREW;

const ALLOWED_DIRECTIONS = [
  DIRECTION_TO_HEBREW,
  DIRECTION_FROM_HEBREW,
];

const DEFAULT_COUNT = 12;

const NEXT_BUTTON_DELAY = 1100;

const ALLOWED_COUNTS = [8, 12, 18, 24];

const DEFAULT_LEVELS = [
  'base',
];

const REGULAR_LEVELS = [
  'base',
  'middle',
  'advanced',
];

const ALLOWED_LEVELS = [
  ...REGULAR_LEVELS,
  'all',
];

const LANGUAGE_FIELDS = {
  ru: 'russian',
  en: 'english',
  fr: 'french',
  es: 'spanish',
  pt: 'portuguese',
  ar: 'arabic',
  am: 'amharic',
  he: 'hebrew',
};

const UI_TEXT = {
  ru: {
    correct: 'ВЕРНО',
    wrong: 'НЕВЕРНО',
    remaining: 'ОСТАЛОСЬ',
    next: 'ДАЛЕЕ',
    finish: 'ЗАВЕРШИТЬ',
    completed: 'Упражнение завершено',
    result: 'Результат',
    again: 'ЕЩЁ РАЗ',
    menu: 'В МЕНЮ',
    noItems: 'Для выбранного уровня нет заданий',
  },

  en: {
    correct: 'CORRECT',
    wrong: 'INCORRECT',
    remaining: 'LEFT',
    next: 'NEXT',
    finish: 'FINISH',
    completed: 'Exercise completed',
    result: 'Result',
    again: 'AGAIN',
    menu: 'MENU',
    noItems: 'There are no tasks for the selected level',
  },

  fr: {
    correct: 'CORRECT',
    wrong: 'INCORRECT',
    remaining: 'RESTE',
    next: 'SUIVANT',
    finish: 'TERMINER',
    completed: 'Exercice terminé',
    result: 'Résultat',
    again: 'ENCORE',
    menu: 'MENU',
    noItems: 'Il n’y a aucun exercice pour ce niveau',
  },

  es: {
    correct: 'CORRECTO',
    wrong: 'INCORRECTO',
    remaining: 'QUEDAN',
    next: 'SIGUIENTE',
    finish: 'TERMINAR',
    completed: 'Ejercicio terminado',
    result: 'Resultado',
    again: 'OTRA VEZ',
    menu: 'MENÚ',
    noItems: 'No hay ejercicios para el nivel seleccionado',
  },

  pt: {
    correct: 'CORRETO',
    wrong: 'INCORRETO',
    remaining: 'FALTAM',
    next: 'SEGUINTE',
    finish: 'TERMINAR',
    completed: 'Exercício concluído',
    result: 'Resultado',
    again: 'NOVAMENTE',
    menu: 'MENU',
    noItems: 'Não há exercícios para o nível selecionado',
  },

  ar: {
    correct: 'صحيح',
    wrong: 'غير صحيح',
    remaining: 'المتبقي',
    next: 'التالي',
    finish: 'إنهاء',
    completed: 'اكتمل التمرين',
    result: 'النتيجة',
    again: 'مرة أخرى',
    menu: 'القائمة',
    noItems: 'لا توجد تمارين للمستوى المحدد',
  },

  am: {
    correct: 'ትክክል',
    wrong: 'ትክክል አይደለም',
    remaining: 'የቀረ',
    next: 'ቀጣይ',
    finish: 'ጨርስ',
    completed: 'ልምምዱ ተጠናቋል',
    result: 'ውጤት',
    again: 'እንደገና',
    menu: 'ምናሌ',
    noItems: 'ለተመረጠው ደረጃ ልምምዶች የሉም',
  },

  he: {
    correct: 'נכון',
    wrong: 'לא נכון',
    remaining: 'נשארו',
    next: 'הבא',
    finish: 'סיום',
    completed: 'התרגיל הושלם',
    result: 'תוצאה',
    again: 'שוב',
    menu: 'תפריט',
    noItems: 'אין תרגילים ברמה שנבחרה',
  },
};

const GENDER_ICONS = {
  man: require('./man1.png'),
  woman: require('./woman1.png'),
  men: require('./men1.png'),
  women: require('./women1.png'),
};

const LANGUAGE_CODE_MAP = {
  ru: 'ru',
  russian: 'ru',

  en: 'en',
  english: 'en',

  fr: 'fr',
  french: 'fr',

  es: 'es',
  spanish: 'es',

  pt: 'pt',
  'pt-PT': 'pt',
  portuguese: 'pt',

  ar: 'ar',
  arabic: 'ar',
  arab: 'ar',

  am: 'am',
  amharic: 'am',

  he: 'he',
  iw: 'he',
  hebrew: 'he',
};

const LANGUAGE_ALIASES = {
  // Русский
  ru: 'ru',
  russian: 'ru',
  'русский': 'ru',

  // English
  en: 'en',
  english: 'en',

  // Français
  fr: 'fr',
  french: 'fr',
  'français': 'fr',
  francais: 'fr',

  // Español
  es: 'es',
  spanish: 'es',
  'español': 'es',
  espanol: 'es',

  // Português
  pt: 'pt',
  portuguese: 'pt',
  'português': 'pt',
  portugues: 'pt',
  'pt-pt': 'pt',

  // العربية
  ar: 'ar',
  arabic: 'ar',
  arab: 'ar',
  'العربية': 'ar',

  // አማርኛ
  am: 'am',
  amharic: 'am',
  'አማርኛ': 'am',

  // Hebrew на будущее
  he: 'he',
  hebrew: 'he',
  iw: 'he',
  'עברית': 'he',
};

const normalizeLanguage = language => {
  const normalized = String(language || '')
    .trim()
    .toLowerCase();

  return LANGUAGE_ALIASES[normalized] || 'en';
};



const stripMp3 = (value = '') =>
  String(value)
    .replace(/\.mp3$/i, '')
    .trim();



const getTranslation = (item, language) => {
  const normalizedLanguage = normalizeLanguage(language);

  const field =
    LANGUAGE_FIELDS[normalizedLanguage] || 'english';

  return (
    item?.[field] ||
    item?.english ||
    item?.russian ||
    ''
  );
};

const getAnswerVariantKey = item => {
  const hebrew = String(item?.hebrew || '')
    .trim()
    .replace(/\s+/g, ' ');

  const audioBase = stripMp3(item?.mp3)
    .replace(/[12]$/i, '')
    .toLowerCase();

  /*
   * Если есть mp3, варианты word1 и word2
   * будут иметь одинаковый ключ.
   *
   * Если mp3 нет, сравниваем по ивриту.
   */
  return audioBase || hebrew;
};

const getItemId = (item) =>
  [
    item?.level || 'unknown',
    item?.preposition || 'unknown',
    item?.gender || 'unknown',
    item?.hebrew || 'unknown',
    stripMp3(item?.mp3) || 'unknown',
  ].join('__');

const shuffleArray = (items = []) => {
  const result = [...items];

  for (
    let index = result.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1)
    );

    [result[index], result[randomIndex]] = [
      result[randomIndex],
      result[index],
    ];
  }

  return result;
};

const prepareItems = (
  language,
  levels = []
) => {
  const source =
    Array.isArray(prepositionsData)
      ? prepositionsData
      : [];

  const safeLevels =
    Array.isArray(levels)
      ? levels.filter(level =>
          REGULAR_LEVELS.includes(
            level
          )
        )
      : [];

  return source
    .filter(item => {
      if (!item) {
        return false;
      }

      if (!item.hebrew) {
        return false;
      }

      if (!item.gender) {
        return false;
      }

      if (!safeLevels.length) {
        return false;
      }

      return safeLevels.includes(
        item.level
      );
    })
    .map(item => ({
      ...item,

      id: getItemId(item),

      translation: getTranslation(
        item,
        language
      ),

      mp3: stripMp3(item.mp3),
    }))
    .filter(
      item => item.translation
    );
};

const buildDeck = (
  items,
  selectedCount
) => {
  const safeCount = ALLOWED_COUNTS.includes(
    selectedCount
  )
    ? selectedCount
    : DEFAULT_COUNT;

  const shuffled = shuffleArray(items);

  if (shuffled.length <= safeCount) {
    return shuffled;
  }

  return shuffled.slice(0, safeCount);
};

const createAnswerOptions = (
  currentItem,
  allItems,
  translationDirection,
  optionsCount = 6
) => {
  if (!currentItem) {
    return [];
  }

  const isFromHebrew =
    translationDirection ===
    DIRECTION_FROM_HEBREW;

  const getOptionText = item =>
    String(
      isFromHebrew
        ? item?.translation
        : item?.hebrew
    ).trim();

  const getOptionKey = item => {
    if (isFromHebrew) {
      return getOptionText(item)
        .replace(/\s+/g, ' ')
        .toLowerCase();
    }

    return getAnswerVariantKey(item);
  };

  const correctText =
    getOptionText(currentItem);

  const currentVariantKey =
    getOptionKey(currentItem);

  /*
   * В первую очередь берём формы
   * того же предлога.
   */
  const samePrepositionItems =
    allItems.filter(
      item =>
        item?.id !== currentItem.id &&
        item?.preposition ===
          currentItem.preposition
    );

  /*
   * Затем дополняем формами
   * других предлогов.
   */
  const fallbackItems =
    allItems.filter(
      item =>
        item?.id !== currentItem.id &&
        item?.preposition !==
          currentItem.preposition
    );

  const candidates = shuffleArray([
    ...shuffleArray(
      samePrepositionItems
    ),
    ...shuffleArray(
      fallbackItems
    ),
  ]);

  const wrongOptions = [];

  const usedTexts = new Set([
    correctText,
  ]);

  const usedVariantKeys = new Set([
    currentVariantKey,
  ]);

  for (
    let index = 0;
    index < candidates.length;
    index += 1
  ) {
    const candidate =
      candidates[index];

    const candidateText =
      getOptionText(candidate);

    if (!candidateText) {
      continue;
    }

    const candidateVariantKey =
      getOptionKey(candidate);

    /*
     * Не допускаем одинаковые
     * надписи в вариантах.
     */
    if (
      usedTexts.has(candidateText)
    ) {
      continue;
    }

    /*
     * В направлении на иврит
     * дополнительно исключаем
     * варианты li1/li2,
     * kamoni1/kamoni2 и т. п.
     */
    if (
      usedVariantKeys.has(
        candidateVariantKey
      )
    ) {
      continue;
    }

    usedTexts.add(candidateText);

    usedVariantKeys.add(
      candidateVariantKey
    );

    wrongOptions.push({
      id:
        `${currentItem.id}` +
        `__wrong__${wrongOptions.length}` +
        `__${candidateVariantKey}`,

      text: candidateText,

      /*
       * Транслитерация нужна только
       * для ивритских ответов.
       */
      translit: isFromHebrew
        ? ''
        : candidate.translit || '',

      mp3: candidate.mp3 || '',

      isCorrect: false,
    });

    if (
      wrongOptions.length >=
      optionsCount - 1
    ) {
      break;
    }
  }

  const correctOption = {
    id:
      `${currentItem.id}` +
      '__correct',

    text: correctText,

    translit: isFromHebrew
      ? ''
      : currentItem.translit || '',

    mp3: currentItem.mp3 || '',

    isCorrect: true,
  };

  return shuffleArray([
    correctOption,
    ...wrongOptions,
  ]);
};

const safeUnloadSound = async (
  soundObject
) => {
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

const PrepositionExercise = ({
  navigation,
}) => {
  const [
    language,
    setLanguage,
  ] = useState('en');

  const [
    selectedCount,
    setSelectedCount,
  ] = useState(DEFAULT_COUNT);

const [
  selectedLevels,
  setSelectedLevels,
] = useState(
  DEFAULT_LEVELS
);

  const [
  translationDirection,
  setTranslationDirection,
] = useState(DEFAULT_DIRECTION);

  const [
    soundEnabled,
    setSoundEnabled,
  ] = useState(true);

  // 0: окончания окрашены, транслитерация показана
// 1: окончания окрашены, транслитерация скрыта
// 2: окраска отключена, транслитерация скрыта
const [
  translitMode,
  setTranslitMode,
] = useState(0);

const handleTranslitToggle =
  useCallback(() => {
    setTranslitMode(prev => {
      if (prev === 0) {
        return 1;
      }

      if (prev === 1) {
        return 2;
      }

      return 0;
    });
  }, []);

  const [
    listVisible,
    setListVisible,
  ] = useState(true);

  const [
  settingsLoaded,
  setSettingsLoaded,
] = useState(false);

  const [
    allPreparedItems,
    setAllPreparedItems,
  ] = useState([]);

  const [
    deck,
    setDeck,
  ] = useState([]);

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [
    options,
    setOptions,
  ] = useState([]);

  const [
    selectedOptionId,
    setSelectedOptionId,
  ] = useState(null);

  const [
    answered,
    setAnswered,
  ] = useState(false);

  const [
  canGoNext,
  setCanGoNext,
] = useState(false);

  const [
    correctAnswers,
    setCorrectAnswers,
  ] = useState(0);

  const [
    incorrectAnswers,
    setIncorrectAnswers,
  ] = useState(0);

  const [
    exerciseCompleted,
    setExerciseCompleted,
  ] = useState(false);


const [
  isStatModalVisible,
  setIsStatModalVisible,
] = useState(false);

const [
  isDescriptionModalVisible,
  setIsDescriptionModalVisible,
] = useState(false);

const [
  isExitModalVisible,
  setIsExitModalVisible,
] = useState(false);

const pendingExitActionRef =
  useRef(null);

const allowNavigationExitRef =
  useRef(false);

  const nextButtonTimerRef =
  useRef(null);

  const feedbackSoundRef = useRef(null);

  const pronunciationSoundRef =
    useRef(null);

  const normalizedLanguage =
    normalizeLanguage(language);

    const exerciseLoggedRef=useRef(false);

useFocusEffect(
  useCallback(()=>{
    if(exerciseLoggedRef.current)return;
    if(!settingsLoaded)return;

    exerciseLoggedRef.current=true;

    const eventName=`prepositionpronouns${normalizedLanguage}`;

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

  const currentItem =
    deck[currentIndex] || null;

  const score = useMemo(() => {
    const attempts =
      correctAnswers +
      incorrectAnswers;

    if (attempts === 0) {
      return 0;
    }

    return Math.round(
      (correctAnswers / attempts) *
        100
    );
  }, [
    correctAnswers,
    incorrectAnswers,
  ]);

const progress = useMemo(() => {
  if (!deck.length) {
    return 0;
  }

  return Math.min(
    currentIndex + (answered ? 1 : 0),
    deck.length
  );
}, [
  answered,
  currentIndex,
  deck.length,
]);

  const remaining = Math.max(
    deck.length -
      currentIndex -
      (answered ? 1 : 0),
    0
  );

  const clearNextButtonTimer =
  useCallback(() => {
    if (nextButtonTimerRef.current) {
      clearTimeout(
        nextButtonTimerRef.current
      );

      nextButtonTimerRef.current = null;
    }
  }, []);

  const startNextButtonDelay =
  useCallback(() => {
    clearNextButtonTimer();

    setCanGoNext(false);

    nextButtonTimerRef.current =
      setTimeout(() => {
        setCanGoNext(true);

        nextButtonTimerRef.current =
          null;
      }, NEXT_BUTTON_DELAY);
  }, [clearNextButtonTimer]);

 const loadSettings =
  useCallback(async () => {
    // setSettingsLoaded(false);

    try {
      const [
        storedLanguage,
        storedCount,
        storedLevel,
        storedSound,
        storedDirection,
      ] = await Promise.all([
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
          SOUND_KEY
        ),
        AsyncStorage.getItem(
          DIRECTION_KEY
        ),
      ]);

      const parsedCount =
        Number(storedCount);

      setLanguage(
        normalizeLanguage(
          storedLanguage || 'en'
        )
      );

      setSelectedCount(
        ALLOWED_COUNTS.includes(
          parsedCount
        )
          ? parsedCount
          : DEFAULT_COUNT
      );

      let parsedLevels = [];

      try {
        const parsedValue =
          storedLevel
            ? JSON.parse(
                storedLevel
              )
            : null;

        if (
          Array.isArray(
            parsedValue
          )
        ) {
          parsedLevels =
            parsedValue.filter(
              level =>
                REGULAR_LEVELS.includes(
                  level
                )
            );
        }
      } catch (error) {
        /*
         * Поддержка старого формата:
         * base, middle, advanced, all.
         */
        if (
          REGULAR_LEVELS.includes(
            storedLevel
          )
        ) {
          parsedLevels = [
            storedLevel,
          ];
        } else if (
          storedLevel === 'all'
        ) {
          parsedLevels = [
            ...REGULAR_LEVELS,
          ];
        }
      }

      setSelectedLevels(
        parsedLevels.length
          ? parsedLevels
          : [...DEFAULT_LEVELS]
      );

      setSoundEnabled(
        storedSound !== 'false'
      );

      setTranslationDirection(
        ALLOWED_DIRECTIONS.includes(
          storedDirection
        )
          ? storedDirection
          : DEFAULT_DIRECTION
      );
    } catch (error) {
      console.log(
        'Failed to load settings:',
        error
      );
    } finally {
      /*
       * Модалка появится только после
       * установки всех значений.
       */
      setSettingsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

useEffect(() => {
  const preparedItems =
    prepareItems(
      language,
      selectedLevels
    );

  setAllPreparedItems(
    preparedItems
  );
}, [
  language,
  selectedLevels,
]);

useEffect(() => {
  if (
    !currentItem ||
    exerciseCompleted ||
    listVisible
  ) {
    setOptions([]);
    return;
  }

  const nextOptions =
    createAnswerOptions(
      currentItem,
      allPreparedItems,
      translationDirection
    );

  setOptions(nextOptions);
  setSelectedOptionId(null);
  setAnswered(false);
  setCanGoNext(false);

  clearNextButtonTimer();
}, [
  currentItem?.id,
  exerciseCompleted,
  listVisible,
  allPreparedItems,
  translationDirection,
  clearNextButtonTimer,
]);

useEffect(() => {
  return () => {
    clearNextButtonTimer();

    safeUnloadSound(
      feedbackSoundRef.current
    );

    safeUnloadSound(
      pronunciationSoundRef.current
    );
  };
}, [clearNextButtonTimer]);

const requestExit = useCallback((exitAction) => {
  pendingExitActionRef.current =
    typeof exitAction === 'function'
      ? exitAction
      : null;

  setIsExitModalVisible(true);
}, []);

const handleCancelExit = useCallback(() => {
  pendingExitActionRef.current = null;
  setIsExitModalVisible(false);
}, []);

const handleConfirmExit = useCallback(() => {
  const exitAction =
    pendingExitActionRef.current;

  pendingExitActionRef.current = null;

  /*
   * Разрешаем ближайший переход навигации,
   * чтобы beforeRemove не открыл модалку
   * подтверждения ещё раз.
   */
  allowNavigationExitRef.current = true;

  setIsExitModalVisible(false);
  clearNextButtonTimer();

  safeUnloadSound(
    feedbackSoundRef.current
  );

  safeUnloadSound(
    pronunciationSoundRef.current
  );

  feedbackSoundRef.current = null;
  pronunciationSoundRef.current = null;

  if (exitAction) {
    exitAction();
  }

  /*
   * Если подтверждение использовалось
   * для открытия настроек, а не выхода
   * со страницы, возвращаем защиту.
   */
  setTimeout(() => {
    allowNavigationExitRef.current = false;
  }, 300);
}, [clearNextButtonTimer]);

const requestOpenExerciseSettings =
  useCallback(() => {
    requestExit(() => {
      setListVisible(true);
    });
  }, [requestExit]);

useFocusEffect(
  useCallback(() => {
    const handleBackPress = () => {
      /*
       * Экран выбора параметров:
       * Android Back делает то же,
       * что кнопка назад внутри модалки.
       */
      if (listVisible) {
        handleOpenMenu();
        return true;
      }

      /*
       * Экран результата.
       */
      if (exerciseCompleted) {
        handleOpenMenu();
        return true;
      }

      /*
       * Само упражнение:
       * показываем подтверждение выхода.
       */
      requestExit(() => {
        handleOpenMenu();
      });

      return true;
    };

    const subscription =
      BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress
      );

    return () => {
      subscription.remove();
    };
  }, [
    listVisible,
    exerciseCompleted,
    handleOpenMenu,
    requestExit,
  ])
);

useEffect(() => {
  if (!navigation?.addListener) {
    return undefined;
  }

  const unsubscribe =
    navigation.addListener(
      'beforeRemove',
      (event) => {
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

          soundObject
            .setOnPlaybackStatusUpdate(
              (status) => {
                if (
                  status?.didJustFinish
                ) {
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
      async (isCorrect) => {
        const source = isCorrect
          ? sounds?.success
          : sounds?.failure;

        await playSoundSource(
          source,
          feedbackSoundRef,
          isCorrect ? 1 : 0.8
        );
      },
      [playSoundSource]
    );

  const playPronunciation =
    useCallback(
      async (mp3Key) => {
        const cleanKey =
          stripMp3(mp3Key);

        if (!cleanKey) {
          return;
        }

        const source =
          prepositionSounds?.[
            cleanKey
          ];

        if (!source) {
          console.warn(
            `Preposition sound not found: ${cleanKey}`
          );

          return;
        }

        await playSoundSource(
          source,
          pronunciationSoundRef,
          1
        );
      },
      [playSoundSource]
    );

    useEffect(() => {
  if (
    translationDirection !==
      DIRECTION_FROM_HEBREW ||
    !currentItem ||
    !currentItem.mp3 ||
    listVisible ||
    exerciseCompleted ||
    !soundEnabled
  ) {
    return undefined;
  }

  const timer = setTimeout(() => {
    playPronunciation(
      currentItem.mp3
    );
  }, 400);

  return () => {
    clearTimeout(timer);
  };
}, [
  currentItem?.id,
  translationDirection,
  listVisible,
  exerciseCompleted,
  soundEnabled,
  playPronunciation,
]);

const handleSelectCount =
  useCallback(async count => {
    if (
      !ALLOWED_COUNTS.includes(
        count
      )
    ) {
      return;
    }

    setSelectedCount(count);

    try {
      await AsyncStorage.setItem(
        COUNT_KEY,
        String(count)
      );
    } catch (error) {
      console.log(
        'Failed to save selected count:',
        error
      );
    }
  }, []);

const handleSelectLevel =
  useCallback(level => {
    if (
      level !== 'all' &&
      !REGULAR_LEVELS.includes(
        level
      )
    ) {
      return;
    }

    setSelectedLevels(
      previousLevels => {
        const currentLevels =
          Array.isArray(
            previousLevels
          )
            ? previousLevels.filter(
                currentLevel =>
                  REGULAR_LEVELS.includes(
                    currentLevel
                  )
              )
            : [];

        let nextLevels;

        /*
         * Кнопка «Все уровни»
         * выбирает сразу все три.
         */
        if (level === 'all') {
          nextLevels = [
            ...REGULAR_LEVELS,
          ];
        } else {
          const alreadySelected =
            currentLevels.includes(
              level
            );

          if (alreadySelected) {
            nextLevels =
              currentLevels.filter(
                currentLevel =>
                  currentLevel !==
                  level
              );

            /*
             * Не позволяем снять
             * последний уровень.
             */
            if (
              nextLevels.length === 0
            ) {
              return currentLevels;
            }
          } else {
            nextLevels = [
              ...currentLevels,
              level,
            ];
          }
        }

        AsyncStorage.setItem(
          LEVEL_KEY,
          JSON.stringify(nextLevels)
        ).catch(error => {
          console.log(
            'Failed to save selected levels:',
            error
          );
        });

        return nextLevels;
      }
    );
  }, []);


    const handleSelectDirection =
  useCallback(async direction => {
    if (
      !ALLOWED_DIRECTIONS.includes(
        direction
      )
    ) {
      return;
    }

    setTranslationDirection(
      direction
    );

    try {
      await AsyncStorage.setItem(
        DIRECTION_KEY,
        direction
      );
    } catch (error) {
      console.log(
        'Failed to save translation direction:',
        error
      );
    }
  }, []);

  const handleSoundToggle =
    useCallback(async () => {
      const nextValue =
        !soundEnabled;

      setSoundEnabled(nextValue);

      await AsyncStorage.setItem(
        SOUND_KEY,
        String(nextValue)
      );

      if (!nextValue) {
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
    }, [soundEnabled]);

const startExercise =
  useCallback(() => {
    const newDeck =
      buildDeck(
        allPreparedItems,
        selectedCount
      );

    clearNextButtonTimer();

    setDeck(newDeck);
    setCurrentIndex(0);
    setOptions([]);
    setSelectedOptionId(null);
    setAnswered(false);
    setCanGoNext(false);

    setCorrectAnswers(0);
    setIncorrectAnswers(0);

    setExerciseCompleted(false);
    setListVisible(false);
  }, [
    allPreparedItems,
    selectedCount,
    clearNextButtonTimer,
  ]);

const handleAnswer =
  useCallback(
    async (option) => {
      if (
        !option ||
        answered ||
        !currentItem
      ) {
        return;
      }

      setSelectedOptionId(
        option.id
      );

      setAnswered(true);
      setCanGoNext(false);

      startNextButtonDelay();

      if (option.isCorrect) {
        setCorrectAnswers(
          (value) => value + 1
        );
      } else {
        setIncorrectAnswers(
          (value) => value + 1
        );
      }

      await playFeedback(
        option.isCorrect
      );

     if (
  translationDirection ===
  DIRECTION_TO_HEBREW
) {
  setTimeout(() => {
    playPronunciation(
      currentItem.mp3
    );
  }, 250);
}
    },
    [
      answered,
      currentItem,
        translationDirection,
      playFeedback,
      playPronunciation,
      startNextButtonDelay,
    ]
  );

  const completeExercise =
    useCallback(async () => {
      setExerciseCompleted(true);

      try {
        const attempts =
          correctAnswers +
          incorrectAnswers;

        const finalScore =
          attempts > 0
            ? (
                (correctAnswers /
                  attempts) *
                100
              ).toFixed(2)
            : '0.00';

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

const handleNext = useCallback(() => {
  if (!answered || !canGoNext) {
    return;
  }

  clearNextButtonTimer();
  setCanGoNext(false);

  const nextIndex = currentIndex + 1;

  if (nextIndex >= deck.length) {
    completeExercise();
    return;
  }

  /*
   * Сбрасываем состояние ответа одновременно
   * с переключением карточки.
   *
   * Благодаря batching React отрисует сразу:
   * новый currentIndex + answered === false.
   * Промежуточного неправильного значения
   * remaining больше не будет.
   */
  setAnswered(false);
  setSelectedOptionId(null);
  setOptions([]);
  setCurrentIndex(nextIndex);
}, [
  answered,
  canGoNext,
  clearNextButtonTimer,
  completeExercise,
  currentIndex,
  deck.length,
]);

const handleOpenStatistics =
  useCallback(() => {
    setIsStatModalVisible(true);
  }, []);

  const handleOpenDescription =
  useCallback(() => {
    setIsDescriptionModalVisible(true);
  }, []);

const handleCloseDescription =
  useCallback(() => {
    setIsDescriptionModalVisible(false);
  }, []);

    const handleOpenMenu =
    useCallback(() => {
      if (
        navigation?.canGoBack?.()
      ) {
        navigation.goBack();
        return;
      }

      navigation?.navigate?.(
        'Menu'
      );
    }, [navigation]);


if (listVisible) {
  if (!settingsLoaded) {
    return (
      <SafeAreaView
        style={styles.settingsLoadingScreen}
      />
    );
  }

  return (
    <PrepositionListModal
      visible
      language={normalizedLanguage}
      items={allPreparedItems}
      selectedCount={selectedCount}
      selectedLevels={selectedLevels}
      selectedDirection={
        translationDirection
      }
      allowedCounts={ALLOWED_COUNTS}
      allowedLevels={ALLOWED_LEVELS}
      allowedDirections={
        ALLOWED_DIRECTIONS
      }
      genderIcons={GENDER_ICONS}
      onSelectCount={handleSelectCount}
      onSelectLevel={handleSelectLevel}
      onSelectDirection={
        handleSelectDirection
      }
      onStart={startExercise}
      onClose={handleOpenMenu}
    />
  );
}

  if (!deck.length) {
    return (
      <SafeAreaView
        style={styles.screen}
      >
        <View
          style={
            styles.emptyContainer
          }
        >
          <Text
            style={styles.emptyText}
          >
            {uiText.noItems}
          </Text>

          <TouchableOpacity
            style={
              styles.primaryButton
            }
            onPress={() =>
              setListVisible(true)
            }
          >
            <Text
              style={
                styles.primaryButtonText
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
      <SafeAreaView
        style={styles.screen}
      >
        <View
          style={
            styles.completionCard
          }
        >
          <Text
            style={
              styles.completionTitle
            }
          >
            {uiText.completed}
          </Text>

          <Text
            style={
              styles.resultLabel
            }
          >
            {uiText.result}
          </Text>

          <Text
            style={styles.score}
          >
            {score}%
          </Text>

          <View
            style={
              styles.completionStats
            }
          >
            <Text
              style={
                styles.completionStat
              }
            >
              {uiText.correct}:{' '}
              {correctAnswers}
            </Text>

            <Text
              style={
                styles.completionStat
              }
            >
              {uiText.wrong}:{' '}
              {incorrectAnswers}
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.primaryButton
            }
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
            style={
              styles.secondaryButton
            }
            onPress={
              handleOpenMenu
            }
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
    <SafeAreaView
      style={styles.screen}
    >
      <View style={styles.topBar}>
        <Image
          source={require('./VERBIFY.png')}
          style={styles.logo}
        />

      <View style={styles.topButtons}>
  <TouchableOpacity
    onPress={handleSoundToggle}
    activeOpacity={0.7}
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
  onPress={handleTranslitToggle}
  activeOpacity={0.7}
>
  <Image
    source={
      translitMode === 0
        ? require('./translit1.png')
        : translitMode === 1
          ? require('./translit2.png')
          : require('./translit3.png')
    }
    style={styles.topButtonIcon}
  />
</TouchableOpacity>

 <TouchableOpacity
  onPress={
    requestOpenExerciseSettings
  }
  activeOpacity={0.7}
>
    <Image
      source={require('./spisok2.png')}
      style={styles.topButtonIcon}
    />
  </TouchableOpacity>

  <TouchableOpacity
    onPress={handleOpenStatistics}
    activeOpacity={0.7}
  >
    <Image
      source={require('./stat.png')}
      style={styles.topButtonIcon}
    />
  </TouchableOpacity>

  <TouchableOpacity
    onPress={handleOpenDescription}
    activeOpacity={0.7}
  >
    <Image
      source={require('./question.png')}
      style={styles.topButtonIcon}
    />
  </TouchableOpacity>
</View>
      </View>

   <View style={styles.progressContainer}>
  <View style={styles.progressTextContainer}>
    <Text
      style={styles.progressStatText}
      maxFontSizeMultiplier={1.2}
    >
      {uiText.correct}: {correctAnswers}
    </Text>

    <Text
      style={styles.progressStatText}
      maxFontSizeMultiplier={1.2}
    >
      {uiText.wrong}: {incorrectAnswers}
    </Text>
  </View>

  <View style={styles.remainingTasksContainer}>
    <Text
      style={styles.remainingTasksText}
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

<View style={styles.progressBarContainer}>
  <ProgressBar
    progress={progress}
    totalExercises={deck.length}
  />
</View>

<View
  style={styles.cardWrapper}
>
<PrepositionCard
  item={currentItem}
  options={options}
  translitMode={translitMode}
  translationDirection={
    translationDirection
  }
  selectedOptionId={
    selectedOptionId
  }
  answered={answered}
  genderIcon={
    GENDER_ICONS[
      currentItem?.gender
    ]
  }
  soundEnabled={
    soundEnabled
  }
  onSelectAnswer={
    handleAnswer
  }
  onPlayAudio={
    playPronunciation
  }
/>
</View>

   <TouchableOpacity
  style={[
    styles.nextButton,

    (!answered || !canGoNext) &&
      styles.nextButtonDisabled,
  ]}
  disabled={
    !answered || !canGoNext
  }
  onPress={handleNext}
>
  <Text
    style={
      styles.nextButtonText
    }
  >
    {currentIndex ===
    deck.length - 1
      ? uiText.finish
      : uiText.next}
  </Text>
</TouchableOpacity>
     </SafeAreaView>

{isStatModalVisible && (
  <PrepositionStatModal
    visible
    language={normalizedLanguage}
    onToggle={() =>
      setIsStatModalVisible(false)
    }
  />
)}

{isDescriptionModalVisible && (
  <PrepositionDescriptionModal
    visible
    language={normalizedLanguage}
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
  minHeight: 58,

  flexDirection: 'row',
  alignItems: 'center',

  backgroundColor: '#6C8EBB',
  borderRadius: 10,

  marginTop: 4,
  marginBottom: 10,

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
  },

  nextButton: {
    minHeight: 58,
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
    fontSize: 52,
    fontWeight: '900',
  },

  completionStats: {
    width: '100%',
    flexDirection: 'row',
    justifyContent:
      'space-around',
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

export default PrepositionExercise;