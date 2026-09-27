   import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  useWindowDimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  getRootVerbKey,
  normalizeRootLanguage,
} from './RootVerbRotationModal';

const TEXTS = {
  ru: {
    forward: 'Выберите перевод глагола',
    reverse: 'Выберите глагол на иврите',
    play: 'Прослушать произношение',
    exclude: 'Исключить из ротации',
    restore: 'Вернуть в ротацию',
    pin: 'Показывать чаще',
    unpin: 'Снять закрепление',
    manage: 'Управление ротацией',
  },
  en: {
    forward: 'Choose the verb’s translation',
    reverse: 'Choose the Hebrew verb',
    play: 'Play pronunciation',
    exclude: 'Exclude from rotation',
    restore: 'Restore to rotation',
    pin: 'Show more often',
    unpin: 'Unpin',
    manage: 'Manage rotation',
  },
  fr: {
    forward: 'Choisissez la traduction du verbe',
    reverse: 'Choisissez le verbe en hébreu',
    play: 'Écouter la prononciation',
    exclude: 'Exclure de la rotation',
    restore: 'Rétablir dans la rotation',
    pin: 'Afficher plus souvent',
    unpin: 'Retirer des favoris',
    manage: 'Gérer la rotation',
  },
  es: {
    forward: 'Elige la traducción del verbo',
    reverse: 'Elige el verbo en hebreo',
    play: 'Escuchar la pronunciación',
    exclude: 'Excluir de la rotación',
    restore: 'Restaurar en la rotación',
    pin: 'Mostrar más a menudo',
    unpin: 'Quitar de fijados',
    manage: 'Gestionar la rotación',
  },
  pt: {
    forward: 'Escolha a tradução do verbo',
    reverse: 'Escolha o verbo em hebraico',
    play: 'Ouvir a pronúncia',
    exclude: 'Excluir da rotação',
    restore: 'Repor na rotação',
    pin: 'Mostrar com mais frequência',
    unpin: 'Desafixar',
    manage: 'Gerir a rotação',
  },
  ar: {
    forward: 'اختر ترجمة الفعل',
    reverse: 'اختر الفعل بالعبرية',
    play: 'استمع إلى النطق',
    exclude: 'استبعاد من التكرار',
    restore: 'إعادة إلى التكرار',
    pin: 'إظهار بشكل أكثر تكرارًا',
    unpin: 'إلغاء التثبيت',
    manage: 'إدارة التكرار',
  },
  am: {
    forward: 'የግሱን ትርጉም ይምረጡ',
    reverse: 'የዕብራይስጡን ግስ ይምረጡ',
    play: 'አጠራሩን ያዳምጡ',
    exclude: 'ከማዞሪያው አስወግድ',
    restore: 'ወደ ማዞሪያው መልስ',
    pin: 'ብዙ ጊዜ አሳይ',
    unpin: 'መሰካቱን አስወግድ',
    manage: 'የማዞሪያ አስተዳደር',
  },
};

const BIN_COLORS = {
  "PA'AL": '#DDECF9',
  "NIF'AL": '#E4E0F5',
  "PI'EL": '#F8E0EA',
  "HIF'IL": '#F9EBCF',
  "HITPA'EL": '#DDEFE5',
};

const EMPTY = [];

const FitText = ({
  children,
  style,
  lines = 1,
  minimumFontScale = 0.7,
}) => (
  <Text
    style={style}
    numberOfLines={lines}
    adjustsFontSizeToFit
    minimumFontScale={minimumFontScale}
    maxFontSizeMultiplier={1.2}
  >
    {children}
  </Text>
);

const AURORA_FIELDS = [
  {
    color: '239,198,218',
    alpha: 0.22,
    duration: 8500,
    x: [-18, 22],
    y: [-4, 5],
    scale: 1.05,
    position: {
      width: 520,
      height: 230,
      left: -210,
      top: -65,
    },
  },
  {
    color: '174,205,235',
    alpha: 0.21,
    duration: 10000,
    x: [18, -24],
    y: [4, -5],
    scale: 1.045,
    position: {
      width: 550,
      height: 245,
      right: -230,
      bottom: -75,
    },
  },
  {
    color: '187,224,205',
    alpha: 0.19,
    duration: 11500,
    x: [-14, 16],
    y: [6, -7],
    scale: 1.04,
    position: {
      width: 500,
      height: 220,
      left: -30,
      top: -55,
    },
  },
];

function RootAuroraBackground() {
  const [motion] = useState(() =>
    AURORA_FIELDS.map(() => new Animated.Value(0))
  );

  useEffect(() => {
    const loops = motion.map((value, index) => {
      value.setValue(0);

      const config = {
        duration: AURORA_FIELDS[index].duration,
        useNativeDriver: true,
        isInteraction: false,
      };

      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            ...config,
            toValue: 1,
          }),
          Animated.timing(value, {
            ...config,
            toValue: 0,
          }),
        ])
      );
    });

    loops.forEach(loop => loop.start());

    return () => {
      loops.forEach(loop => loop.stop());
    };
  }, [motion]);

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <LinearGradient
        colors={[
          '#EAF0F8',
          '#EEF3F9',
          '#EDF2F7',
          '#EAF1F7',
        ]}
        locations={[0, 0.34, 0.68, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {AURORA_FIELDS.map((field, index) => (
        <Animated.View
          key={index}
          style={[
            { position: 'absolute' },
            field.position,
            {
              transform: [
                {
                  translateX: motion[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: field.x,
                  }),
                },
                {
                  translateY: motion[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: field.y,
                  }),
                },
                {
                  scale: motion[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, field.scale],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[
              0,
              0.05,
              field.alpha * 0.64,
              field.alpha,
              field.alpha * 0.64,
              0.05,
              0,
            ].map(alpha => `rgba(${field.color},${alpha})`)}
            locations={[0, 0.12, 0.3, 0.5, 0.7, 0.88, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ))}
    </View>
  );
}

// Основной текст всегда находится в области одинакового размера.
// После ответа меняется только положение этой области.
function AnswerOption({
  option,
  reverse,
  isRtl,
  answered,
  chosen,
  height,
  compact,
  textScale,
  onSelect,
}) {
  const progress = useRef(new Animated.Value(0)).current;

  // Размеры шрифтов.
  const hebrewFont = compact ? 18 : 20;
  const hebrewLineHeight = compact ? 22 : 24;
  const binyanLineHeight = compact ? 16 : 17;
  const binyanFont = compact ? 12 : 13;
  const translationFont = compact ? 13 : 14;
  const translationLineHeight = compact ? 15 : 16;
  const transliterationFont = compact ? 12 : 14;
  const transliterationLineHeight = compact ? 15 : 17;

  useEffect(() => {
    progress.stopAnimation();

    if (!answered) {
      progress.setValue(0);
      return undefined;
    }

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 360,
      useNativeDriver: true,
      isInteraction: false,
    });

    animation.start();

    return () => animation.stop();
  }, [answered, progress]);

  const innerHeight = Math.max(0, height - 16);

  // Сохраняем переводу пространство для двух строк.
// Остальную высоту отдаём ивриту, биньяну и транслитерации.
const translationHeight = Math.min(
  innerHeight * 0.42,
  (compact ? 34 : 36) * textScale
);

const hebrewHeight = innerHeight - translationHeight;

  const mainHeight = reverse
    ? hebrewHeight
    : translationHeight;

  const detailsHeight = innerHeight - mainHeight;

  const correct = answered && option.isCorrect;
  const wrong = answered && chosen && !option.isCorrect;

  const hebrew =
    option.verb || (reverse ? option.label : '');

  const translation = reverse
    ? option.translation || ''
    : option.label;

  const hebrewContent = (
    <View
      style={{
        flex: 1,
        width: '100%',
        minHeight: 0,
        paddingBottom: 2,
      }}
    >
      <View
        style={{
          height: hebrewLineHeight * textScale,
          flexShrink: 0,
          width: '100%',
          justifyContent: 'center',
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          maxFontSizeMultiplier={1.2}
          style={[
            styles.optionHebrew,
            {
              fontSize: hebrewFont,
              lineHeight: hebrewLineHeight,
              includeFontPadding: false,
            },
          ]}
        >
          {hebrew}
        </Text>
      </View>

      {/* Биньян — строка фиксированной высоты. */}
  <View
  style={{
    height: (binyanLineHeight + 2) * textScale, // было + 5
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  <View
    style={[
      styles.optionBinBadge,
      {
        marginTop: 0,
        paddingVertical: 1, // было 2
        backgroundColor:
          BIN_COLORS[option.bin] || '#E8EDF5',
      },
    ]}
  >
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
            style={[
              styles.optionBinyan,
              {
                fontSize: binyanFont,
                lineHeight: binyanLineHeight,
                includeFontPadding: false,
              },
            ]}
          >
            {option.bin}
          </Text>
        </View>
      </View>

      {/* Транслитерация не уменьшается автоматически. */}
      <View
        style={{
          height: (transliterationLineHeight + 1) * textScale,
          flexShrink: 0,
          width: '100%',
          justifyContent: 'center',
        }}
      >
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          maxFontSizeMultiplier={1.2}
          style={[
            styles.optionTransliteration,
            {
              fontSize: transliterationFont,
              lineHeight: transliterationLineHeight,
              includeFontPadding: false,
            },
          ]}
        >
          {option.transliteration}
        </Text>
      </View>
    </View>
  );

const translationContent = (
  <View
    style={{
      flex: 1,
      width: '100%',
      minHeight: 0,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 2,
      paddingVertical: 0,
    }}
  >
    <Text
      numberOfLines={2}
      ellipsizeMode="tail"
      maxFontSizeMultiplier={1.2}
      style={[
        styles.optionText,
        {
          width: '100%',
          fontSize: translationFont,
          lineHeight: translationLineHeight,
          includeFontPadding: false,
          textAlign: 'center',
        },
        isRtl && styles.optionRtl,
      ]}
    >
      {translation}
    </Text>
  </View>
);

  const accessibleParts = reverse
    ? [
        hebrew,
        option.bin,
        option.transliteration,
        answered && translation,
      ]
    : [
        translation,
        answered && hebrew,
        answered && option.bin,
        answered && option.transliteration,
      ];

  // Цвет верхней движущейся панели.
  const panelColor = !answered
    ? '#FFFDEF'
    : correct
      ? '#AFFFCA'
      : wrong
        ? '#FFBCBC'
        : '#CCD5E2';

  const borderColor = !answered
    ? '#456A98'
    : correct
      ? '#39865A'
      : wrong
        ? '#B75F65'
        : '#7792B5';

  // Контрастный фон дополнительной информации.
  const detailsColor = '#FAF8FF';

  // Размеры внутри внешней рамки толщиной 2 px.
  const panelHeight = Math.max(0, height - 4);
  const mainPanelHeight = mainHeight + 6;

  // Реальная видимая высота нижней части после подъёма панели.
  // Важно считать её от panelHeight, иначе верхний/нижний ряд могут
  // по-разному клиповать транслитерацию на маленьких экранах.
  const visibleDetailsHeight = Math.max(
    0,
    panelHeight - mainPanelHeight
  );

  const slideDistance = visibleDetailsHeight;

  const contentStart = Math.max(
    0,
    (panelHeight - mainHeight) / 2
  );

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibleParts
        .filter(Boolean)
        .join(', ')}
      accessibilityState={{
        disabled: answered || !onSelect,
        selected: chosen,
      }}
      activeOpacity={0.8}
      disabled={answered || !onSelect}
      onPress={() => onSelect?.(option)}
      style={[
        styles.option,
        {
          paddingHorizontal: 0,
          paddingVertical: 0,
          backgroundColor: detailsColor,
          borderColor,
        },
      ]}
    >
      <View style={styles.optionInner}>
        {/* Нижняя панель с дополнительной информацией. */}
        <View
          pointerEvents="none"
          accessibilityElementsHidden={!answered}
          importantForAccessibility={
            answered ? 'auto' : 'no-hide-descendants'
          }
          style={{
            position: 'absolute',
            top: mainPanelHeight,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: detailsColor,
            paddingHorizontal: 8,
            paddingBottom: 0,
          }}
        >
          <Animated.View
            style={{
              height: visibleDetailsHeight,
              opacity: progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0, 1],
              }),
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [6, 0],
                  }),
                },
              ],
            }}
          >
            {reverse
              ? translationContent
              : hebrewContent}
          </Animated.View>
        </View>

        {/* Верхняя цветная панель поднимается после ответа. */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: panelHeight,
            backgroundColor: panelColor,
            borderBottomLeftRadius: 14,
            borderBottomRightRadius: 14,
            borderWidth: answered ? 1 : 0,
borderColor,
            overflow: 'hidden',
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -slideDistance],
                }),
              },
            ],
          }}
        >
          <Animated.View
            style={{
              position: 'absolute',
              top: contentStart,
              left: 8,
              right: 8,
              height: mainHeight,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      0,
                      slideDistance + (reverse ? 4 : 0   ) - contentStart,
                    ],
                  }),
                },
              ],
            }}
          >
            {reverse
              ? hebrewContent
              : translationContent}
          </Animated.View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

export default function RootVerbCard({
  item,
  compactLayout = false,
  language = 'en',
  direction = 'heToTranslation',
  questionKey,
  options = EMPTY,
  selectedOption = null,
  answered = false,
  soundEnabled = true,
  audioAvailable = false,
  isAudioPlaying = false,
  onSelectAnswer,
  onPlayAudio,
  isExcluded = false,
  isPinned = false,
  onExcludePress,
  onPinTogglePress,
  onOpenManageModal,
}) {
  const [availableHeight, setAvailableHeight] = useState(0);
  const { fontScale } = useWindowDimensions();
  const textScale = Math.max(1, Math.min(fontScale, 1.2));

  const lang = normalizeRootLanguage(language);
  const text = TEXTS[lang];
  const isRtl = lang === 'ar';
  const reverse = direction === 'translationToHe';
  const taskKey = questionKey ?? getRootVerbKey(item);

  const answerLock = useRef({
    key: taskKey,
    locked: false,
  });
  const audioLock = useRef(false);

  if (!item) return null;

  const safeOptions = Array.isArray(options) ? options : [];

  const rows = safeOptions.length > 2
    ? [safeOptions.slice(0, 2), safeOptions.slice(2)]
    : [safeOptions];

  // Размеры зависят от окна и системного шрифта, но не от ответа.
 const compact = compactLayout;

const instructionHeight = Math.ceil(30 * textScale);
const sectionGap = compact ? 6 : 10;
const rowGap = 8;

// Карточка глагола: раньше было 180.
const questionHeight = Math.ceil(
  (compact ? 110 : 120) * textScale
);

// Минимальная высота опций с местом для информации после ответа.
const minimumOptionHeight = Math.ceil(
  (compact ? 100 : 110) * textScale
);

// Ограничиваем растягивание опций на высоких экранах.
const maximumOptionHeight = Math.ceil(
  (compact ? 118 : 128) * textScale
);

const minimumAnswersHeight =
  rows.length * minimumOptionHeight +
  Math.max(0, rows.length - 1) * rowGap;

const minimumLayoutHeight =
  instructionHeight +
  questionHeight +
  sectionGap * 2 +
  minimumAnswersHeight;

const layoutHeight = Math.max(
  availableHeight,
  minimumLayoutHeight
);

const answersHeight =
  layoutHeight -
  instructionHeight -
  questionHeight -
  sectionGap * 2;

const optionHeight = Math.min(
  maximumOptionHeight,
  Math.max(
    minimumOptionHeight,
    (answersHeight - rowGap) / 2
  )
);

const canScroll =
  availableHeight > 0 &&
  minimumLayoutHeight > availableHeight + 1;

const controlSize = Math.min(40, Math.floor((questionHeight - 18) / 3));

  const canPlay =
    (!reverse || answered) &&
    soundEnabled &&
    audioAvailable &&
    !isAudioPlaying &&
    !!item.transliteration &&
    typeof onPlayAudio === 'function';

  const selectAnswer = option => {
    if (answerLock.current.key !== taskKey) {
      answerLock.current = {
        key: taskKey,
        locked: false,
      };
    }

    if (
      answered ||
      answerLock.current.locked ||
      typeof onSelectAnswer !== 'function'
    ) {
      return;
    }

    answerLock.current.locked = true;
    onSelectAnswer(option);
  };

  const playAudio = async () => {
    if (!canPlay || audioLock.current) return;

    audioLock.current = true;

    try {
      await onPlayAudio(item.transliteration);
    } catch (error) {
      console.log(
        '[RootVerbCard] Audio:',
        error?.message || error
      );
    } finally {
      audioLock.current = false;
    }
  };

  const renderControl = (
    source,
    label,
    onPress,
    active = false
  ) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.control,
        { height: controlSize },
        active && styles.controlActive,
        !onPress && styles.disabled,
      ]}
    >
      <Image
        source={source}
        style={[
          styles.controlIcon,
          {
            width: Math.min(32, controlSize),
            height: Math.min(32, controlSize),
          },
        ]}
      />
    </TouchableOpacity>
  );

  const renderOption = option => (
    <AnswerOption
      key={JSON.stringify([taskKey, direction, option.value])}
      option={option}
      reverse={reverse}
      isRtl={isRtl}
      answered={answered}
      chosen={option.value === selectedOption}
      height={optionHeight}
      compact={compact}
      textScale={textScale}
      onSelect={
        typeof onSelectAnswer === 'function'
          ? selectAnswer
          : undefined
      }
    />
  );

  return (
    <View
      style={styles.layout}
      onLayout={event => {
        const height = Math.floor(
          event.nativeEvent.layout.height
        );

        setAvailableHeight(previous =>
          previous === height ? previous : height
        );
      }}
    >
      {availableHeight > 0 && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ height: layoutHeight }}
          scrollEnabled={canScroll}
          showsVerticalScrollIndicator={canScroll}
          bounces={false}
          overScrollMode="never"
          removeClippedSubviews={false}
          contentInsetAdjustmentBehavior="never"
        >
          <View
            style={[
              styles.instructionSlot,
              { height: instructionHeight },
            ]}
          >
            <FitText
              lines={2}
              style={[
                styles.instruction,
                isRtl && styles.rtl,
              ]}
            >
              {reverse ? text.reverse : text.forward}
            </FitText>
          </View>

          <View
            style={[
              styles.questionArea,
              { height: questionHeight },
            ]}
          >
            <RootAuroraBackground />

            <View style={styles.card}>
              <View style={[styles.metaRow, { height: 28 * textScale }]}>
                {!reverse && (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          BIN_COLORS[item.bin] || '#E8EDF5',
                      },
                    ]}
                  >
                    <FitText style={styles.binyan}>
                      {item.bin}
                    </FitText>
                  </View>
                )}

                <View style={[styles.badge, styles.rootBadge]}>
                  <FitText style={styles.root}>
                    {item.root}
                  </FitText>
                </View>
              </View>

              <View
                style={[
                  styles.promptCloud,
                  reverse
                    ? styles.translationCloud
                    : styles.verbCloud,
                ]}
              >
                <FitText
                  lines={reverse ? 2 : 1}
                  style={[
                    reverse
                      ? styles.promptTranslation
                      : styles.verb,
                    reverse && isRtl && styles.rtl,
                  ]}
                >
                  {reverse
                    ? item.translation || item[lang]
                    : item.verb}
                </FitText>
              </View>

              <View style={[styles.pronunciationRow, { height: reverse ? 0 : 30 * textScale }]}>
                <View style={styles.audioSlot} />

                <View style={styles.promptTranslitSlot}>
                  {!reverse && (
                    <View style={styles.transliterationCloud}>
                      <FitText style={styles.transliteration}>
                        {item.transliteration}
                      </FitText>
                    </View>
                  )}
                </View>

                <View style={styles.audioSlot} />
              </View>
            </View>

            {audioAvailable && (!reverse || answered) && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={text.play}
                accessibilityState={{ disabled: !canPlay }}
                activeOpacity={0.75}
                disabled={!canPlay}
                onPress={playAudio}
                style={[
                  styles.speakerCorner,
                  !canPlay && styles.disabled,
                ]}
              >
                <Image
                  source={require('./speaker3.png')}
                  style={styles.speakerIcon}
                />
              </TouchableOpacity>
            )}

            <View style={styles.controlsRail}>
              {renderControl(
                isExcluded
                  ? require('./glaz2.png')
                  : require('./glaz1.png'),
                isExcluded ? text.restore : text.exclude,
                onExcludePress,
                isExcluded
              )}

              {renderControl(
                isPinned
                  ? require('./gant2.png')
                  : require('./gant1.png'),
                isPinned ? text.unpin : text.pin,
                onPinTogglePress,
                isPinned
              )}

              {renderControl(
                require('./spisok.png'),
                text.manage,
                onOpenManageModal
              )}
            </View>
          </View>

          <View style={{ height: sectionGap }} />

          <View style={{ height: answersHeight }}>
            {rows.map((row, index) => (
              <View
                key={index}
                style={[
                  styles.optionsRow,
                  {
                    height: optionHeight,
                    marginTop: index ? rowGap : 0,
                  },
                  row.length === 1 && {
                    gap: 0,
                    paddingHorizontal: 4,
                  },
                ]}
              >
                {row.length === 1 && (
                  <View style={styles.halfOptionSpacer} />
                )}

                {row.map(renderOption)}

                {row.length === 1 && (
                  <View style={styles.halfOptionSpacer} />
                )}
              </View>
            ))}
          </View>

          <View style={{ height: sectionGap }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
  },
  instructionSlot: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingBottom: 10,
  },
  instruction: {
    color: '#FFFDEF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  questionArea: {
    position: 'relative',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D5DDEA',
    backgroundColor: '#EAF0F8',
    overflow: 'hidden',
  },
  card: {
    height: '100%',
    paddingHorizontal: 50,
    paddingVertical: 6,
  },
  controlsRail: {
    position: 'absolute',
    right: 4,
    top: 6,
    bottom: 6,
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  metaRow: {
    height: 33,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },
  badge: {
    maxWidth: '55%',
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#D5DDEA',
  },
  binyan: {
    color: '#2D4769',
    fontSize: 16,
    fontWeight: '700',
    writingDirection: 'ltr',
    textAlign: 'center',
  },
  root: {
    color: '#8b5252',
    fontSize: 18,
    fontWeight: '700',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
 rootBadge: {
  backgroundColor: '#eff3f8',
  borderColor: '#A6BEDA',
  paddingVertical: 2,
  paddingHorizontal: 10,
  minHeight: 29,
  justifyContent: 'center',
  alignItems: 'center',
},
  promptCloud: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    marginTop: 3,
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verbCloud: {
    backgroundColor: 'transparent',
  },
translationCloud: {
  backgroundColor: 'transparent',
},
  promptTranslation: {
    width: '100%',
    color: '#333652',
    fontSize: 22,
    lineHeight: 28,
    includeFontPadding: false,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    transform: [{ translateY: -12 }],
  },
  verb: {
    color: '#333652',
    fontSize: 30,
    lineHeight: 34,
    includeFontPadding: false,
    fontWeight: '700',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  pronunciationRow: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
  },
  promptTranslitSlot: {
    flex: 1,
    minWidth: 0,
  },
transliterationCloud: {
  maxWidth: '100%',
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#CF7770',
  backgroundColor: '#FBE5E1',
},

transliteration: {
  color: '#9F3F3A',
  fontSize: 16,
  lineHeight: 20,
  includeFontPadding: false,
  fontWeight: '600',
  textAlign: 'center',
  writingDirection: 'ltr',
},
  audioSlot: {
    width: 30,
    height: 30,
  },
  speakerCorner: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  control: {
    width: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlActive: {
    backgroundColor: '#E0E9F4',
  },
  controlIcon: {
    resizeMode: 'contain',
  },
  disabled: {
    opacity: 0.35,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  halfOptionSpacer: {
    flex: 0.5,
  },
  option: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#456A98',
    backgroundColor: '#FFFDEF',
    overflow: 'hidden',
  },
  optionCorrect: {
    backgroundColor: '#AFFFCA',
    borderColor: '#39865A',
  },
  optionWrong: {
    backgroundColor: '#FFBCBC',
    borderColor: '#B75F65',
  },
  optionInactive: {
    backgroundColor: '#E8EDF4',
    borderColor: '#7792B5',
  },
  optionInner: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  optionMain: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mainLabelSlot: {
    flexShrink: 1,
    minHeight: 0,
    width: '100%',
    justifyContent: 'center',
  },
  optionDetails: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingTop: 3,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(45,71,105,0.18)',
    overflow: 'hidden',
  },
  detailSlot: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'center',
  },
  optionText: {
    width: '100%',
    color: '#333652',
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  optionHebrew: {
    color: '#333652',
    fontWeight: '700',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  optionBinBadge: {
    maxWidth: '100%',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 7,
    marginTop: 2,
  },
  optionBinyan: {
    color: '#2D4769',
    fontSize: 14,
    fontWeight: '700',
    writingDirection: 'ltr',
    textAlign: 'center',
  },
  optionTransliteration: {
    color: '#B34F49',
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'ltr',
  },
  optionRtl: {
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  rtl: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  optionMainTranslit: {
  width: '100%',
  marginTop: 2,
  flexShrink: 1,
  minHeight: 0,
  justifyContent: 'center',
},
});