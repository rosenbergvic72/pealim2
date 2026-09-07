import React, {
  memo,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const UI_TEXT = {
  ru: {
    title: 'Предлоги после глаголов и предлоги-приставки',
    level: 'Выберите уровень',
    count: 'Количество заданий',
    typeTitle: 'Выберите тип предлогов',
    separateType: 'Предлоги',
    separateDescription: 'עם, אל, על',
    prefixType: 'Предлоги-приставки',
    prefixDescription: 'מ, ל, ב',
    allType: 'Все предлоги',
    start: 'НАЧАТЬ',
    noItems: 'Для выбранных параметров нет предложений',

    levels: {
      base: 'Базовый',
      middle: 'Средний',
      advanced: 'Продвинутый',
      all: 'Все уровни',
    },
  },

  en: {
    title: 'Prepositions after verbs and prefix prepositions',
    level: 'Choose a level',
    count: 'Number of tasks',
    typeTitle: 'Choose a preposition type',
    separateType: 'Prepositions',
    separateDescription: 'עם, אל, על',
    prefixType: 'Prefix prepositions',
    prefixDescription: 'מ, ל, ב',
    allType: 'All prepositions',
    start: 'START',
    noItems: 'There are no sentences for the selected settings',

    levels: {
      base: 'Basic',
      middle: 'Intermediate',
      advanced: 'Advanced',
      all: 'All levels',
    },
  },

  fr: {
    title: 'Prépositions après les verbes et prépositions préfixées',
    level: 'Choisissez le niveau',
    count: 'Nombre d’exercices',
    typeTitle: 'Choisissez le type de prépositions',
    separateType: 'Prépositions',
    separateDescription: 'עם, אל, על',
    prefixType: 'Prépositions préfixées',
    prefixDescription: 'מ, ל, ב',
    allType: 'Toutes les prépositions',
    start: 'COMMENCER',
    noItems: 'Aucune phrase pour les paramètres sélectionnés',

    levels: {
      base: 'Débutant',
      middle: 'Intermédiaire',
      advanced: 'Avancé',
      all: 'Tous les niveaux',
    },
  },

  es: {
    title: 'Preposiciones después de verbos y preposiciones prefijadas',
    level: 'Elige el nivel',
    count: 'Número de ejercicios',
    typeTitle: 'Elige el tipo de preposición',
    separateType: 'Preposiciones',
    separateDescription: 'עם, אל, על',
    prefixType: 'Preposiciones prefijadas',
    prefixDescription: 'מ, ל, ב',
    allType: 'Todas las preposiciones',
    start: 'EMPEZAR',
    noItems: 'No hay frases para los parámetros seleccionados',

    levels: {
      base: 'Básico',
      middle: 'Intermedio',
      advanced: 'Avanzado',
      all: 'Todos los niveles',
    },
  },

  pt: {
    title: 'Preposições depois dos verbos e preposições prefixadas',
    level: 'Escolha o nível',
    count: 'Número de exercícios',
    typeTitle: 'Escolha o tipo de preposição',
    separateType: 'Preposições',
    separateDescription: 'עם, אל, על',
    prefixType: 'Preposições prefixadas',
    prefixDescription: 'מ, ל, ב',
    allType: 'Todas as preposições',
    start: 'COMEÇAR',
    noItems: 'Não há frases para os parâmetros selecionados',

    levels: {
      base: 'Básico',
      middle: 'Intermédio',
      advanced: 'Avançado',
      all: 'Todos os níveis',
    },
  },

  ar: {
    title: 'حروف الجر بعد الأفعال وحروف الجر المتصلة',
    level: 'اختر المستوى',
    count: 'عدد التمارين',
    typeTitle: 'اختر نوع حروف الجر',
    separateType: 'حروف الجر',
    separateDescription: 'עם, אל, על',
    prefixType: 'حروف الجر المتصلة',
    prefixDescription: 'מ, ל, ב',
    allType: 'جميع حروف الجر',
    start: 'ابدأ',
    noItems: 'لا توجد جمل للإعدادات المحددة',

    levels: {
      base: 'أساسي',
      middle: 'متوسط',
      advanced: 'متقدم',
      all: 'كل المستويات',
    },
  },

  am: {
    title: 'ከግሶች በኋላ የሚመጡ እና ተያያዥ መስተዋድዶች',
    level: 'ደረጃ ይምረጡ',
    count: 'የልምምድ ብዛት',
    typeTitle: 'የመስተዋድድ ዓይነት ይምረጡ',
    separateType: 'መስተዋድዶች',
    separateDescription: 'עם, אל, על',
    prefixType: 'ተያያዥ መስተዋድዶች',
    prefixDescription: 'מ, ל, ב',
    allType: 'ሁሉም መስተዋድዶች',
    start: 'ጀምር',
    noItems: 'ለተመረጡት ቅንብሮች ዓረፍተ ነገሮች የሉም',

    levels: {
      base: 'መሠረታዊ',
      middle: 'መካከለኛ',
      advanced: 'ከፍተኛ',
      all: 'ሁሉም ደረጃዎች',
    },
  },

  he: {
    title: 'מילות יחס אחרי פעלים ומילות יחס צמודות',
    level: 'בחרו רמה',
    count: 'מספר משימות',
    typeTitle: 'בחרו סוג מילת יחס',
    separateType: 'מילות יחס',
    separateDescription: 'עם, אל, על',
    prefixType: 'מילות יחס צמודות',
    prefixDescription: 'מ, ל, ב',
    allType: 'כל מילות היחס',
    start: 'התחלה',
    noItems: 'אין משפטים עבור ההגדרות שנבחרו',

    levels: {
      base: 'בסיסי',
      middle: 'בינוני',
      advanced: 'מתקדם',
      all: 'כל הרמות',
    },
  },
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

const normalizeLanguage = language => {
  const key = String(language || '')
    .trim()
    .toLowerCase();

  return LANGUAGE_ALIASES[key] || 'en';
};

const normalizePrepositionType = value => {
  if (
    value === 'separate' ||
    value === 'prefix' ||
    value === 'all'
  ) {
    return value;
  }

  return 'all';
};

const LevelButton = memo(
  ({
    level,
    label,
    selected,
    onPress,
  }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        selected,
      }}
      onPress={() =>
        onPress?.(level)
      }
      style={({ pressed }) => [
        styles.levelButton,

        selected &&
          styles.levelButtonSelected,

        pressed &&
          styles.buttonPressed,
      ]}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
        maxFontSizeMultiplier={1}
        style={[
          styles.levelButtonText,

          selected &&
            styles.levelButtonTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
);

LevelButton.displayName =
  'LevelButton';

const CountButton = memo(
  ({
    count,
    selected,
    onPress,
  }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        selected,
      }}
      onPress={() =>
        onPress?.(count)
      }
      style={({ pressed }) => [
        styles.countButton,

        selected &&
          styles.countButtonSelected,

        pressed &&
          styles.buttonPressed,
      ]}
    >
      <Text
        maxFontSizeMultiplier={1}
        style={[
          styles.countButtonText,

          selected &&
            styles.countButtonTextSelected,
        ]}
      >
        {count}
      </Text>
    </Pressable>
  )
);

CountButton.displayName =
  'CountButton';

const PrepositionTypeButton = memo(
  ({
    type,
    label,
    description,
    count,
    selected,
    onPress,
    isRtl,
  }) => {
    const isAll =
      type === 'all';

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          selected,
        }}
        onPress={() =>
          onPress?.(type)
        }
        style={({ pressed }) => [
          styles.typeButton,

          selected &&
            styles.typeButtonSelected,

          pressed &&
            styles.buttonPressed,
        ]}
      >
        {isAll ? (
          <View
            style={
              styles.allTypeContent
            }
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              maxFontSizeMultiplier={1}
              style={[
                styles.allTypeLabel,

                selected &&
                  styles.typeButtonLabelSelected,

                isRtl &&
                  styles.rtlText,
              ]}
            >
              {label}
            </Text>

            <View
              style={[
                styles.allTypeCountBadge,

                isRtl &&
                  styles.allTypeCountBadgeRtl,

                selected &&
                  styles.typeCountBadgeSelected,
              ]}
            >
              <Text
                maxFontSizeMultiplier={1}
                style={[
                  styles.typeCountText,

                  selected &&
                    styles.typeCountTextSelected,
                ]}
              >
                {count}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.typeButtonContent,

              isRtl &&
                styles.typeButtonContentRtl,
            ]}
          >
            <View
              style={
                styles.typeTextContainer
              }
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                maxFontSizeMultiplier={1}
                style={[
                  styles.typeButtonLabel,

                  selected &&
                    styles.typeButtonLabelSelected,

                  isRtl &&
                    styles.rtlText,
                ]}
              >
                {label}
              </Text>

              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1}
                style={[
                  styles.typeButtonDescription,

                  selected &&
                    styles.typeButtonDescriptionSelected,

                  styles.hebrewText,

                  isRtl &&
                    styles.rtlText,
                ]}
              >
                {description}
              </Text>
            </View>

            <View
              style={[
                styles.typeCountBadge,

                selected &&
                  styles.typeCountBadgeSelected,
              ]}
            >
              <Text
                maxFontSizeMultiplier={1}
                style={[
                  styles.typeCountText,

                  selected &&
                    styles.typeCountTextSelected,
                ]}
              >
                {count}
              </Text>
            </View>
          </View>
        )}
      </Pressable>
    );
  }
);

PrepositionTypeButton.displayName =
  'PrepositionTypeButton';

const PrepositionVerbListModal = ({
  language,
  items = [],

  selectedCount,

  selectedLevels = [],
  allowedCounts = [],
  allowedLevels = [],

  selectedPrepositionType = 'all',

  onSelectPrepositionType,
  onSelectCount,
  onSelectLevel,
  onStart,
}) => {
  const lang =
    normalizeLanguage(language);

  const text =
    UI_TEXT[lang] ||
    UI_TEXT.en;

  const isRtl =
    lang === 'ar' ||
    lang === 'he';

  const [
    activePrepositionType,
    setActivePrepositionType,
  ] = useState(
    normalizePrepositionType(
      selectedPrepositionType
    )
  );

  useEffect(() => {
    setActivePrepositionType(
      normalizePrepositionType(
        selectedPrepositionType
      )
    );
  }, [
    selectedPrepositionType,
  ]);

  const safeItems =
    useMemo(
      () =>
        Array.isArray(items)
          ? items.filter(
              item =>
                item &&
                item.id &&
                item.before &&
                item.after
            )
          : [],
      [items]
    );

  const selectedLevelSet =
    useMemo(
      () =>
        new Set(
          Array.isArray(
            selectedLevels
          )
            ? selectedLevels
            : []
        ),
      [selectedLevels]
    );

  const allLevelsSelected =
    useMemo(
      () =>
        [
          'base',
          'middle',
          'advanced',
        ].every(level =>
          selectedLevelSet.has(
            level
          )
        ),
      [selectedLevelSet]
    );

  const separateItems =
    useMemo(
      () =>
        safeItems.filter(
          item =>
            item.prepositionType ===
            'separate'
        ),
      [safeItems]
    );

  const prefixItems =
    useMemo(
      () =>
        safeItems.filter(
          item =>
            item.prepositionType ===
            'prefix'
        ),
      [safeItems]
    );

  const filteredItems =
    useMemo(() => {
      if (
        activePrepositionType ===
        'separate'
      ) {
        return separateItems;
      }

      if (
        activePrepositionType ===
        'prefix'
      ) {
        return prefixItems;
      }

      return safeItems;
    }, [
      activePrepositionType,
      separateItems,
      prefixItems,
      safeItems,
    ]);

  const prepositionTypes =
    useMemo(
      () => [
        {
          type: 'separate',
          label:
            text.separateType,
          description:
            text.separateDescription,
          count:
            separateItems.length,
        },

        {
          type: 'prefix',
          label:
            text.prefixType,
          description:
            text.prefixDescription,
          count:
            prefixItems.length,
        },

        {
          type: 'all',
          label:
            text.allType,
          description: '',
          count:
            safeItems.length,
        },
      ],
      [
        text,
        separateItems.length,
        prefixItems.length,
        safeItems.length,
      ]
    );

  const canStart =
    filteredItems.length > 0;

  const handleSelectPrepositionType =
    type => {
      const normalizedType =
        normalizePrepositionType(
          type
        );

      setActivePrepositionType(
        normalizedType
      );

      onSelectPrepositionType?.(
        normalizedType
      );
    };

  const handleStart = () => {
    if (!canStart) {
      return;
    }

    onStart?.(
      activePrepositionType,
      filteredItems
    );
  };

  return (
    <SafeAreaView
      style={styles.screen}
    >
      {/* Header */}

      <View
        style={styles.header}
      >
        <Text
          numberOfLines={3}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          maxFontSizeMultiplier={1}
          style={[
            styles.title,

            isRtl &&
              styles.rtlText,
          ]}
        >
          {text.title}
        </Text>
      </View>

      {/* Content */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.settingsCard
          }
        >
          {/* Level */}

          <Text
            style={[
              styles.sectionTitle,

              isRtl &&
                styles.rtlText,
            ]}
          >
            {text.level}
          </Text>

          <View
            style={
              styles.levelButtons
            }
          >
            {allowedLevels.map(
              level => {
                const selected =
                  level === 'all'
                    ? allLevelsSelected
                    : selectedLevelSet.has(
                        level
                      );

                return (
                  <LevelButton
                    key={level}
                    level={level}
                    label={
                      text.levels[
                        level
                      ] ||
                      level
                    }
                    selected={
                      selected
                    }
                    onPress={
                      onSelectLevel
                    }
                  />
                );
              }
            )}
          </View>

          <View
            style={styles.divider}
          />

          {/* Count */}

          <Text
            style={[
              styles.sectionTitle,

              isRtl &&
                styles.rtlText,
            ]}
          >
            {text.count}
          </Text>

          <View
            style={
              styles.countButtons
            }
          >
            {allowedCounts.map(
              count => (
                <CountButton
                  key={count}
                  count={count}
                  selected={
                    selectedCount ===
                    count
                  }
                  onPress={
                    onSelectCount
                  }
                />
              )
            )}
          </View>

          <View
            style={styles.divider}
          />

          {/* Preposition types */}

          <Text
            style={[
              styles.sectionTitle,

              isRtl &&
                styles.rtlText,
            ]}
          >
            {text.typeTitle}
          </Text>

          <View
            style={
              styles.typeButtons
            }
          >
            {prepositionTypes.map(
              option => {
                /*
                 * Если выбрано "all",
                 * подсвечиваем:
                 *
                 * separate
                 * prefix
                 * all
                 */
                const selected =
                  activePrepositionType ===
                    option.type ||
                  activePrepositionType ===
                    'all';

                return (
                  <PrepositionTypeButton
                    key={
                      option.type
                    }
                    type={
                      option.type
                    }
                    label={
                      option.label
                    }
                    description={
                      option.description
                    }
                    count={
                      option.count
                    }
                    selected={
                      selected
                    }
                    onPress={
                      handleSelectPrepositionType
                    }
                    isRtl={
                      isRtl
                    }
                  />
                );
              }
            )}
          </View>

          {/* Ошибка, если нет данных */}

          {!canStart && (
            <View
              style={
                styles.emptyContainer
              }
            >
              <Text
                style={[
                  styles.emptyText,

                  isRtl &&
                    styles.rtlText,
                ]}
              >
                {text.noItems}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Start */}

      <View
        style={
          styles.bottomButtons
        }
      >
        <Pressable
          accessibilityRole="button"
          disabled={!canStart}
          onPress={handleStart}
          style={({ pressed }) => [
            styles.startButton,

            !canStart &&
              styles.startButtonDisabled,

            pressed &&
              canStart &&
              styles.buttonPressed,
          ]}
        >
          <Text
            style={
              styles.startButtonText
            }
          >
            {text.start}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      backgroundColor:
        '#83A3CD',
    },

    header: {
      paddingHorizontal:
        18,

      paddingTop:
        8,

      paddingBottom:
        8,
    },

    title: {
      color:
        '#FFFDEF',

      fontSize:
        22,

      lineHeight:
        29,

      fontWeight:
        '900',

      textAlign:
        'center',
    },

    rtlText: {
      writingDirection:
        'rtl',
    },

    hebrewText: {
      writingDirection:
        'rtl',
    },

    scroll: {
      flex:
        1,
    },

    scrollContent: {
      paddingHorizontal:
        16,

      paddingBottom:
        8,
    },

    settingsCard: {
      backgroundColor:
        '#FFFDEF',

      borderRadius:
        22,

      paddingHorizontal:
        14,

      paddingTop:
        13,

      paddingBottom:
        13,

      shadowColor:
        '#000',

      shadowOpacity:
        0.15,

      shadowRadius:
        10,

      shadowOffset: {
        width:
          0,

        height:
          4,
      },

      elevation:
        5,
    },

    sectionTitle: {
      color:
        '#333652',

      fontSize:
        16,

      lineHeight:
        21,

      fontWeight:
        '900',

      textAlign:
        'center',
    },

    /* ---------- LEVEL ---------- */

    levelButtons: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      justifyContent:
        'space-between',

      marginTop:
        8,

      rowGap:
        7,
    },

    levelButton: {
      width:
        '48%',

      minHeight:
        43,

      borderRadius:
        14,

      borderWidth:
        2,

      borderColor:
        '#D7DCE6',

      backgroundColor:
        '#FFFFFF',

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        7,
    },

    levelButtonSelected: {
      borderColor:
        '#CE6857',

      backgroundColor:
        '#CE6857',
    },

    levelButtonText: {
      color:
        '#333652',

      fontSize:
        15,

      fontWeight:
        '900',

      textAlign:
        'center',
    },

    levelButtonTextSelected: {
      color:
        '#FFFDEF',
    },

    divider: {
      height:
        1,

      marginVertical:
        11,

      backgroundColor:
        'rgba(51,54,82,0.12)',
    },

    /* ---------- COUNT ---------- */

    countButtons: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      justifyContent:
        'space-between',

      marginTop:
        8,

      rowGap:
        7,
    },

    countButton: {
      width:
        '22%',

      minHeight:
        42,

      borderRadius:
        14,

      borderWidth:
        2,

      borderColor:
        '#D7DCE6',

      backgroundColor:
        '#FFFFFF',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    countButtonSelected: {
      borderColor:
        '#CE6857',

      backgroundColor:
        '#CE6857',
    },

    countButtonText: {
      color:
        '#333652',

      fontSize:
        16,

      fontWeight:
        '900',
    },

    countButtonTextSelected: {
      color:
        '#FFFDEF',
    },

    /* ---------- TYPE ---------- */

    typeButtons: {
      marginTop:
        8,

      rowGap:
        7,
    },

    typeButton: {
      height:
        64,

      minHeight:
        64,

      maxHeight:
        64,

      borderRadius:
        17,

      borderWidth:
        2,

      borderColor:
        '#D7DCE6',

      backgroundColor:
        '#FFFFFF',

      justifyContent:
        'center',

      paddingHorizontal:
        13,

      paddingVertical:
        7,
    },

    typeButtonSelected: {
      borderColor:
        '#CE6857',

      backgroundColor:
        '#F8E7ED',
    },

    typeButtonContent: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      columnGap:
        10,
    },

    typeButtonContentRtl: {
      flexDirection:
        'row-reverse',
    },

    typeTextContainer: {
      flex:
        1,

      justifyContent:
        'center',
    },

    typeButtonLabel: {
      color:
        '#333652',

      fontSize:
        16,

      lineHeight:
        20,

      fontWeight:
        '900',

      textAlign:
        'left',
    },

    typeButtonLabelSelected: {
      color:
        '#9F3F64',
    },

    typeButtonDescription: {
      marginTop:
        2,

      color:
        '#73788F',

      fontSize:
        14,

      lineHeight:
        17,

      fontWeight:
        '800',

      textAlign:
        'left',
    },

    typeButtonDescriptionSelected: {
      color:
        '#A84F70',
    },

    typeCountBadge: {
      minWidth:
        48,

      height:
        34,

      borderRadius:
        13,

      backgroundColor:
        '#E8EEF7',

      borderWidth:
        1,

      borderColor:
        '#C4D0E2',

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        8,
    },

    typeCountBadgeSelected: {
      backgroundColor:
        '#CE6857',

      borderColor:
        '#CE6857',
    },

    typeCountText: {
      color:
        '#333652',

      fontSize:
        15,

      fontWeight:
        '900',
    },

    typeCountTextSelected: {
      color:
        '#FFFDEF',
    },

    /* ---------- ALL TYPE ---------- */

    allTypeContent: {
      position:
        'relative',

      width:
        '100%',

      height:
        '100%',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    allTypeLabel: {
      width:
        '68%',

      color:
        '#333652',

      fontSize:
        16,

      lineHeight:
        21,

      fontWeight:
        '900',

      textAlign:
        'center',
    },

    allTypeCountBadge: {
      position:
        'absolute',

      right:
        0,

      top:
        '50%',

      minWidth:
        48,

      height:
        34,

      marginTop:
        -17,

      borderRadius:
        13,

      backgroundColor:
        '#E8EEF7',

      borderWidth:
        1,

      borderColor:
        '#C4D0E2',

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        8,
    },

    allTypeCountBadgeRtl: {
      right:
        undefined,

      left:
        0,
    },

    /* ---------- EMPTY ---------- */

    emptyContainer: {
      minHeight:
        56,

      marginTop:
        10,

      borderRadius:
        13,

      backgroundColor:
        '#F8E7ED',

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        14,

      paddingVertical:
        8,
    },

    emptyText: {
      color:
        '#9F3F64',

      fontSize:
        13,

      lineHeight:
        18,

      fontWeight:
        '800',

      textAlign:
        'center',
    },

    /* ---------- BOTTOM ---------- */

    bottomButtons: {
      paddingHorizontal:
        16,

      paddingTop:
        7,

      paddingBottom:
        9,

      backgroundColor:
        '#83A3CD',
    },

    startButton: {
      minHeight:
        56,

      borderRadius:
        19,

      backgroundColor:
        '#CE6857',

      alignItems:
        'center',

      justifyContent:
        'center',

      shadowColor:
        '#000',

      shadowOpacity:
        0.16,

      shadowRadius:
        6,

      shadowOffset: {
        width:
          0,

        height:
          3,
      },

      elevation:
        5,
    },

    startButtonDisabled: {
      opacity:
        0.42,
    },

    startButtonText: {
      color:
        '#FFFDEF',

      fontSize:
        19,

      fontWeight:
        '900',
    },

    buttonPressed: {
      opacity:
        0.78,

      transform: [
        {
          scale:
            0.985,
        },
      ],
    },
  });

export default PrepositionVerbListModal;