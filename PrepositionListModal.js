import React, {
  memo,
  useMemo,
} from 'react';

import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const COLORS = {
  background: '#83A3CD',
  card: '#FFFDEF',
  text: '#333652',
  muted: '#73788F',

  selected: '#CE6857',
  selectedText: '#FFFDEF',

  option: '#FFFFFF',
  optionBorder: '#D7DCE6',

  row: '#FFFFFF',
  divider: 'rgba(51,54,82,0.1)',

  start: '#CE6857',
  shadow: '#000000',
};

const UI_TEXT = {
  ru: {
    title: 'Предлоги с местоименными суффиксами',
    // subtitle: 'Выберите уровень и количество заданий',
    level: 'Выберите уровень',
    count: 'Выберите количество заданий',
    forms: 'Формы в упражнении',
    start: 'НАЧАТЬ',
    close: 'НАЗАД',

    levels: {
      base: 'Базовый',
      middle: 'Средний',
      advanced: 'Продвинутый',
      all: 'Все уровни',
    },

    itemsCount: 'форм',
    noItems: 'Нет доступных форм',
    direction: 'Направление перевода',

directions: {
  toHebrew: 'РУССКИЙ → ИВРИТ',
  fromHebrew: 'ИВРИТ → РУССКИЙ',
},
  },

  en: {
    title: 'Prepositions with pronominal suffixes',
    // subtitle: 'Choose a level and number of tasks',
    level: 'Choose a level',
    count: 'Choose the number of tasks',
    forms: 'Forms in the exercise',
    start: 'START',
    close: 'BACK',

    levels: {
      base: 'Basic',
      middle: 'Intermediate',
      advanced: 'Advanced',
      all: 'All levels',
    },

    itemsCount: 'forms',
    noItems: 'No forms available',
    direction: 'Translation direction',

directions: {
  toHebrew: 'TRANSLATION → HEBREW',
  fromHebrew: 'HEBREW → TRANSLATION',
},
  },

  fr: {
    title: 'Prépositions avec suffixes pronominaux',
    // subtitle: 'Choisissez un niveau et le nombre de tâches',
    level: 'Niveau',
    count: 'Nombre de tâches',
    forms: 'Formes dans l’exercice',
    start: 'COMMENCER',
    close: 'RETOUR',

    levels: {
      base: 'Débutant',
      middle: 'Intermédiaire',
      advanced: 'Avancé',
      all: 'Tous les niveaux',
    },

    itemsCount: 'formes',
    noItems: 'Aucune forme disponible',
    direction: 'Sens de traduction',

directions: {
  toHebrew: 'TRADUCTION → HÉBREU',
  fromHebrew: 'HÉBREU → TRADUCTION',
},
  },

  es: {
    title: 'Preposiciones con sufijos pronominales',
    // subtitle: 'Elige un nivel y el número de tareas',
    level: 'Nivel',
    count: 'Número de tareas',
    forms: 'Formas del ejercicio',
    start: 'EMPEZAR',
    close: 'VOLVER',

    levels: {
      base: 'Básico',
      middle: 'Intermedio',
      advanced: 'Avanzado',
      all: 'Todos los niveles',
    },

    itemsCount: 'formas',
    noItems: 'No hay formas disponibles',
    direction: 'Dirección de traducción',

directions: {
  toHebrew: 'TRADUCCIÓN → HEBREO',
  fromHebrew: 'HEBREO → TRADUCCIÓN',
},
  },

  pt: {
    title: 'Preposições com sufixos pronominais',
    // subtitle: 'Escolha o nível e o número de tarefas',
    level: 'Nível',
    count: 'Número de tarefas',
    forms: 'Formas no exercício',
    start: 'COMEÇAR',
    close: 'VOLTAR',

    levels: {
      base: 'Básico',
      middle: 'Intermédio',
      advanced: 'Avançado',
      all: 'Todos os níveis',
    },

    itemsCount: 'formas',
    noItems: 'Não há formas disponíveis',
    direction: 'Direção da tradução',

directions: {
  toHebrew: 'TRADUÇÃO → HEBRAICO',
  fromHebrew: 'HEBRAICO → TRADUÇÃO',
},
  },

  ar: {
    title: 'حروف الجر مع اللواحق الضميرية',
    // subtitle: 'اختر المستوى وعدد التمارين',
    level: 'المستوى',
    count: 'عدد التمارين',
    forms: 'الصيغ في التمرين',
    start: 'ابدأ',
    close: 'رجوع',

    levels: {
      base: 'أساسي',
      middle: 'متوسط',
      advanced: 'متقدم',
      all: 'كل المستويات',
    },

    itemsCount: 'صيغة',
    noItems: 'لا توجد صيغ متاحة',
    direction: 'اتجاه الترجمة',

directions: {
  toHebrew: 'الترجمة ← العبرية',
  fromHebrew: 'العبرية ← الترجمة',
},
  },

  am: {
    title: 'ከተውላጠ ስም ቅጥያዎች ጋር ያሉ መስተዋድዶች',
    // subtitle: 'ደረጃ እና የልምምድ ብዛት ይምረጡ',
    level: 'ደረጃ',
    count: 'የልምምድ ብዛት',
    forms: 'በልምምዱ ውስጥ ያሉ ቅርጾች',
    start: 'ጀምር',
    close: 'ተመለስ',

    levels: {
      base: 'መሠረታዊ',
      middle: 'መካከለኛ',
      advanced: 'ከፍተኛ',
      all: 'ሁሉም ደረጃዎች',
    },

    itemsCount: 'ቅርጾች',
    noItems: 'ምንም ቅርጽ የለም',
    direction: 'የትርጉም አቅጣጫ',

directions: {
  toHebrew: 'ትርጉም → ዕብራይስጥ',
  fromHebrew: 'ዕብራይስጥ → ትርጉም',
},
  },

  he: {
    title: 'מילות יחס עם כינויי גוף חבורים',
    // subtitle: 'בחרו רמה ומספר משימות',
    level: 'רמה',
    count: 'מספר משימות',
    forms: 'הצורות בתרגיל',
    start: 'התחלה',
    close: 'חזרה',

    levels: {
      base: 'בסיסי',
      middle: 'בינוני',
      advanced: 'מתקדם',
      all: 'כל הרמות',
    },

    itemsCount: 'צורות',
    noItems: 'אין צורות זמינות',
    direction: 'כיוון התרגום',

directions: {
  toHebrew: 'תרגום ← עברית',
  fromHebrew: 'עברית ← תרגום',
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
  if (!language) {
    return null;
  }

  const normalized = String(language)
    .trim()
    .toLowerCase();

  return LANGUAGE_ALIASES[normalized] || null;
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
      onPress={() => onPress(level)}
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
        minimumFontScale={0.7}
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

LevelButton.displayName = 'LevelButton';

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
      onPress={() => onPress(count)}
      style={({ pressed }) => [
        styles.countButton,

        selected &&
          styles.countButtonSelected,

        pressed &&
          styles.buttonPressed,
      ]}
    >
      <Text
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

CountButton.displayName = 'CountButton';

const DirectionButton = memo(
  ({
    direction,
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
        onPress(direction)
      }
      style={({ pressed }) => [
        styles.directionButton,

        selected &&
          styles.directionButtonSelected,

        pressed &&
          styles.buttonPressed,
      ]}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
        style={[
          styles.directionButtonText,

          selected &&
            styles.directionButtonTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
);

DirectionButton.displayName =
  'DirectionButton';

const FormRow = memo(
  ({
    item,
    genderIcon,
    isLast,
  }) => {
    return (
      <View
        style={[
          styles.formRow,
          !isLast && styles.formRowBorder,
        ]}
      >
        {genderIcon && (
          <Image
            source={genderIcon}
            style={styles.formGenderIcon}
            resizeMode="contain"
          />
        )}

       <Text
  numberOfLines={2}
  style={styles.formTranslation}
>
  {item.translation}
</Text>

        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={styles.formTranslit}
        >
          {item.translit}
        </Text>

        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={styles.formHebrew}
        >
          {item.hebrew}
        </Text>
      </View>
    );
  }
);

FormRow.displayName = 'FormRow';

const PrepositionListModal = ({
  visible,
  language,
  items = [],
  selectedCount,
  selectedLevels = [],
  selectedDirection = 'toHebrew',
  allowedCounts = [],
  allowedLevels = [],
  allowedDirections = [],
  genderIcons = {},
  onSelectCount,
  onSelectLevel,
  onSelectDirection,
  onStart,
  onClose,
}) => {
const lang = normalizeLanguage(language);
const text = lang ? UI_TEXT[lang] : null;

  const safeItems =
    useMemo(
      () =>
        Array.isArray(items)
          ? items.filter(
              item =>
                item &&
                item.id &&
                item.hebrew
            )
          : [],
      [items]
    );

  const groupedItems =
    useMemo(() => {
      const groups =
        new Map();

      safeItems.forEach(item => {
        const key =
          item.preposition ||
          'other';

        if (!groups.has(key)) {
          groups.set(key, []);
        }

        groups
          .get(key)
          .push(item);
      });

      return Array.from(
        groups.entries()
      ).map(
        ([
          preposition,
          groupItems,
        ]) => ({
          preposition,
          items: groupItems,
        })
      );
    }, [safeItems]);

      if (!lang || !text) {
    return null;
  }

  const startDisabled =
    safeItems.length === 0;

  const isRTL =
    lang === 'he' ||
    lang === 'ar';

    const safeSelectedLevels =
  Array.isArray(selectedLevels)
    ? selectedLevels
    : [];

const regularLevels =
  allowedLevels.filter(
    level => level !== 'all'
  );

const allLevelsSelected =
  regularLevels.length > 0 &&
  regularLevels.every(level =>
    safeSelectedLevels.includes(
      level
    )
  );

  if (!visible) {
  return null;
}

return (
  <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,

              pressed &&
                styles.buttonPressed,
            ]}
          >
            <Text
              style={
                styles.closeButtonIcon
              }
            >
              ‹
            </Text>
          </Pressable>

   <View
  style={styles.headerTextWrap}
>
  <Text
    numberOfLines={2}
    adjustsFontSizeToFit
    minimumFontScale={0.75}
    style={[
      styles.title,
      isRTL &&
        styles.rtlText,
    ]}
  >
    {text.title}
  </Text>
</View>

          {/* <View
            style={
              styles.headerSpacer
            }
          /> */}
        </View>

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
            <Text
              style={[
                styles.sectionTitle,

                isRTL &&
                  styles.rtlText,
              ]}
            >
              {text.level}
            </Text>

         <View style={styles.levelsWrap}>
  {allowedLevels.map(level => {
    const isSelected =
      level === 'all'
        ? allLevelsSelected
        : safeSelectedLevels.includes(
            level
          );

    return (
      <LevelButton
        key={level}
        level={level}
        label={
          text.levels[level] ||
          level
        }
        selected={isSelected}
        onPress={onSelectLevel}
      />
    );
  })}
</View>

            <View
  style={
    styles.settingsDivider
  }
/>

<Text
  style={[
    styles.sectionTitle,

    isRTL &&
      styles.rtlText,
  ]}
>
  {text.direction}
</Text>

<View
  style={
    styles.directionsWrap
  }
>
  {allowedDirections.map(
    direction => (
      <DirectionButton
        key={direction}
        direction={direction}
        label={
          text.directions?.[
            direction
          ] || direction
        }
        selected={
          selectedDirection ===
          direction
        }
        onPress={
          onSelectDirection
        }
      />
    )
  )}
</View>

            <View
              style={
                styles.settingsDivider
              }
            />

            <Text
              style={[
                styles.sectionTitle,

                isRTL &&
                  styles.rtlText,
              ]}
            >
              {text.count}
            </Text>

            <View
              style={
                styles.countsWrap
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
          </View>

          <View
            style={
              styles.formsHeader
            }
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={[
                styles.formsTitle,

                isRTL &&
                  styles.rtlText,
              ]}
            >
              {text.forms}
            </Text>

            <View
              style={
                styles.itemsCountBadge
              }
            >
              <Text
                style={
                  styles.itemsCountText
                }
              >
                {safeItems.length}{' '}
                {text.itemsCount}
              </Text>
            </View>
          </View>

          {groupedItems.length ? (
            groupedItems.map(
              ({
                preposition,
                items:
                  groupItems,
              }) => (
                <View
                  key={preposition}
                  style={
                    styles.groupCard
                  }
                >
                  <View
                    style={
                      styles.groupHeader
                    }
                  >
                    <Text
                      style={
                        styles.groupPreposition
                      }
                    >
                      {preposition}
                    </Text>

                    <Text
                      style={
                        styles.groupCount
                      }
                    >
                      {
                        groupItems.length
                      }
                    </Text>
                  </View>

                  {groupItems.map(
                    (
                      item,
                      index
                    ) => (
                      <FormRow
                        key={item.id}
                        item={item}
                        genderIcon={
                          genderIcons[
                            item.gender
                          ]
                        }
                        isLast={
                          index ===
                          groupItems.length -
                            1
                        }
                      />
                    )
                  )}
                </View>
              )
            )
          ) : (
            <View
              style={
                styles.emptyCard
              }
            >
              <Text
                style={[
                  styles.emptyText,

                  isRTL &&
                    styles.rtlText,
                ]}
              >
                {text.noItems}
              </Text>
            </View>
          )}
        </ScrollView>

        <View
          style={
            styles.bottomBar
          }
        >
          <Pressable
            accessibilityRole="button"
            disabled={
              startDisabled
            }
            onPress={onStart}
            style={({ pressed }) => [
              styles.startButton,

              startDisabled &&
                styles.startButtonDisabled,

              pressed &&
                !startDisabled &&
                styles.startButtonPressed,
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
    safeArea: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

header: {
  minHeight: 64,

  justifyContent: 'center',
  alignItems: 'center',

  paddingHorizontal: 16,
  paddingVertical: 2,

  position: 'relative',
},

  closeButton: {
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

    closeButtonIcon: {
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

    // headerSpacer: {
    //   width: 44,
    //   height: 34,
    // },

    title: {
      marginTop: 10,  
      color: '#FFFDEF',
      fontSize: 20,
      lineHeight: 23,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: 10    },

    // subtitle: {
    //   marginTop: 2,

    //   color:
    //     'rgba(255,253,239,0.82)',

    //   fontSize: 13,
    //   lineHeight: 16,
    //   fontWeight: '600',
    //   textAlign: 'center',
    // },

    rtlText: {
      writingDirection: 'rtl',
      textAlign: 'right',
    },

    scroll: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 18,
    },

    settingsCard: {
      backgroundColor:
        COLORS.card,

      borderRadius: 18,

      paddingHorizontal: 14,
      paddingVertical: 14,

      shadowColor:
        COLORS.shadow,

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.14,
      shadowRadius: 5,

      elevation: 4,
    },

    sectionTitle: {
      color: COLORS.text,
      fontSize: 15,
      lineHeight: 18,
      fontWeight: '900',
      marginBottom: 10,
    },

    levelsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    levelButton: {
      minHeight: 38,

      flexGrow: 1,
      flexBasis: '45%',

      paddingHorizontal: 10,

      borderWidth: 2,
      borderColor:
        COLORS.optionBorder,

      borderRadius: 14,

      backgroundColor:
        COLORS.option,

      alignItems: 'center',
      justifyContent: 'center',
    },

    levelButtonSelected: {
      borderColor:
        COLORS.selected,

      backgroundColor:
        COLORS.selected,
    },

    levelButtonText: {
      color: COLORS.text,
      fontSize: 13,
      fontWeight: '800',
      textAlign: 'center',
    },

    levelButtonTextSelected: {
      color:
        COLORS.selectedText,
    },

    settingsDivider: {
      height: 1,

      marginVertical: 14,

      backgroundColor:
        COLORS.divider,
    },

    countsWrap: {
      flexDirection: 'row',
      gap: 8,
    },

    countButton: {
      flex: 1,
      height: 40,

      borderWidth: 2,
      borderColor:
        COLORS.optionBorder,

      borderRadius: 14,

      backgroundColor:
        COLORS.option,

      alignItems: 'center',
      justifyContent: 'center',
    },

    countButtonSelected: {
      borderColor:
        COLORS.selected,

      backgroundColor:
        COLORS.selected,
    },

    countButtonText: {
      color: COLORS.text,
      fontSize: 16,
      fontWeight: '900',
    },

    countButtonTextSelected: {
      color:
        COLORS.selectedText,
    },

    buttonPressed: {
      transform: [
        {
          scale: 0.975,
        },
      ],

      opacity: 0.88,
    },

    formsHeader: {
      marginTop: 8,
      marginBottom: 8,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    formsTitle: {
      flex: 1,

      color: '#FFFDEF',
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '900',
    },

    itemsCountBadge: {
      marginLeft: 8,

      paddingHorizontal: 10,
      paddingVertical: 5,

      borderRadius: 14,

      backgroundColor:
        'rgba(255,255,255,0.22)',
    },

    itemsCountText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '800',
    },

    groupCard: {
      overflow: 'hidden',

      marginBottom: 10,

      borderRadius: 16,

      backgroundColor:
        COLORS.card,

      shadowColor:
        COLORS.shadow,

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.1,
      shadowRadius: 4,

      elevation: 3,
    },

    groupHeader: {
      minHeight: 42,

      paddingHorizontal: 14,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',

      backgroundColor:
        'rgba(131,163,205,0.18)',
    },

    groupPreposition: {
      color: COLORS.text,
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '900',
      writingDirection: 'rtl',
    },

    groupCount: {
      minWidth: 30,
      height: 30,

      paddingHorizontal: 6,

      borderRadius: 15,

      backgroundColor:
        COLORS.background,

      color: '#FFFDEF',
      fontSize: 13,
      lineHeight: 30,
      fontWeight: '900',
      textAlign: 'center',
    },

   formRow: {
  minHeight: 42,
  paddingHorizontal: 14,
  paddingVertical: 6,

  flexDirection: 'row',
  alignItems: 'center',

  backgroundColor: COLORS.row,
},

formGenderIcon: {
  width: 26,
  height: 26,
  marginRight: 10,
},

formTranslation: {
  flex: 1.4,
  color: COLORS.text,
  fontSize: 14,
  fontWeight: '800',
},

formTranslit: {
  flex: 1,

  textAlign: 'center',

  color: COLORS.muted,
  fontSize: 15,
  fontWeight: '700',
},

formHebrew: {
  flex: 0.8,

  textAlign: 'right',
  writingDirection: 'rtl',

  color: COLORS.text,
  fontSize: 18,
  fontWeight: '900',
},

    emptyCard: {
      minHeight: 110,

      borderRadius: 16,

      backgroundColor:
        COLORS.card,

      alignItems: 'center',
      justifyContent: 'center',

      padding: 18,
    },

    emptyText: {
      color: COLORS.muted,
      fontSize: 15,
      fontWeight: '700',
      textAlign: 'center',
    },

    bottomBar: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 10,

      backgroundColor:
        COLORS.background,

      shadowColor:
        COLORS.shadow,

      shadowOffset: {
        width: 0,
        height: -2,
      },

      shadowOpacity: 0.1,
      shadowRadius: 4,

      elevation: 8,
    },

    startButton: {
      minHeight: 52,

      borderRadius: 26,

      backgroundColor:
        COLORS.start,

      alignItems: 'center',
      justifyContent: 'center',
    },

    startButtonPressed: {
      transform: [
        {
          scale: 0.985,
        },
      ],

      opacity: 0.9,
    },

    startButtonDisabled: {
      opacity: 0.4,
    },

    startButtonText: {
      color: '#FFFDEF',
      fontSize: 17,
      fontWeight: '900',
    },

    directionsWrap: {
  flexDirection: 'row',
  gap: 8,
},

directionButton: {
  flex: 1,
  minHeight: 44,

  paddingHorizontal: 8,

  borderWidth: 2,
  borderColor:
    COLORS.optionBorder,

  borderRadius: 14,

  backgroundColor:
    COLORS.option,

  alignItems: 'center',
  justifyContent: 'center',
},

directionButtonSelected: {
  borderColor:
    COLORS.selected,

  backgroundColor:
    COLORS.selected,
},

directionButtonText: {
  color: COLORS.text,
  fontSize: 12,
  lineHeight: 16,
  fontWeight: '800',
  textAlign: 'center',
},

directionButtonTextSelected: {
  color:
    COLORS.selectedText,
},
  });

export default memo(
  PrepositionListModal
);