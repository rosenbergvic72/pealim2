import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Настройки облаков предложения на иврите.
const HEBREW_FONT_SIZE = 20;
const HEBREW_LINE_HEIGHT = 25;
const HEBREW_CLOUD_HEIGHT = 38;
const HEBREW_CLOUD_PADDING = 5;
const HEBREW_CLOUD_BORDER = 2;
const HEBREW_ROW_GAP = 8;
const HEBREW_COLUMN_GAP = 8;

const SEPARATE_MARKER_WIDTH = 60;
const PREFIX_SLOT_WIDTH = 30;

const HEBREW_COLORS = {
  firstBackground: '#E8F2EE',
  firstBorder: '#8FC9B4',
  secondBackground: '#E8F2EE',
  secondBorder: '#8FC9B4',
  markerBackground: '#F8E7ED',
  markerBorder: '#D98AA5',
};

const normalizeSpaces = value =>
  String(value || '').trim().replace(/\s+/g, ' ');

const getTrailingText = item => {
  const full = normalizeSpaces(item?.hebrewFull);
  const before = normalizeSpaces(item?.before);

  if (!full || !before) return '';

  const middle =
    item?.prepositionType === 'prefix'
      ? normalizeSpaces(
          item?.answer || `${item?.correct || ''}${item?.after || ''}`
        )
      : normalizeSpaces(`${item?.correct || ''} ${item?.after || ''}`);

  if (!middle) return '';

  const start = normalizeSpaces(`${before} ${middle}`);

  if (full === start) return '';

  if (full.startsWith(`${start} `)) {
    return full.slice(start.length).trim();
  }

  if (full.startsWith(before)) {
    const rest = full.slice(before.length).trim();

    if (rest === middle) return '';

    if (rest.startsWith(`${middle} `)) {
      return rest.slice(middle.length).trim();
    }
  }

  return '';
};

const getOptionStyle = (option, selected, answered) => {
  if (!answered) return styles.optionDefault;
  if (option.isCorrect) return styles.optionCorrect;
  if (option.value === selected) return styles.optionWrong;
  return styles.optionInactive;
};

const getOptionTextStyle = (option, selected, answered) => {
  if (!answered) return styles.optionTextDefault;

  if (option.isCorrect || option.value === selected) {
    return styles.optionTextAnswered;
  }

  return styles.optionTextInactive;
};

const HebrewCloud = ({
  value,
  variant = 'first',
  cloudHeight,
}) => (
  <View
    style={[
      styles.hebrewCloud,
      { minHeight: cloudHeight },
      variant === 'second'
        ? styles.hebrewCloudSecond
        : styles.hebrewCloudFirst,
    ]}
  >
    <Text
      style={styles.hebrewCloudText}
      maxFontSizeMultiplier={1.2}
    >
      {normalizeSpaces(value)}
    </Text>
  </View>
);

const PrefixCloud = ({
  cloudHeight,
  after,
  correct,
  answer,
  answered,
  answerOpacity,
  answerTranslateY,
}) => {
  const safeAfter = normalizeSpaces(after);
  const safeCorrect = normalizeSpaces(correct);

  const fullAnswer = normalizeSpaces(
    answer || `${safeCorrect}${safeAfter}`
  );

  const startsWithCorrect =
    !!safeCorrect && fullAnswer.startsWith(safeCorrect);

  const regularPart = startsWithCorrect
    ? fullAnswer.slice(safeCorrect.length)
    : fullAnswer;

  return (
    <View
      style={[
        styles.prefixCloud,
        { minHeight: cloudHeight },
      ]}
    >
      <View
        style={[
          styles.prefixSlot,
          answered
            ? styles.prefixSlotAnswered
            : styles.prefixSlotQuestion,
        ]}
      >
        {!answered && (
          <Text
            style={styles.prefixSlotText}
            maxFontSizeMultiplier={1.2}
          >
            ?
          </Text>
        )}
      </View>

      <View
        accessibilityElementsHidden={answered}
        importantForAccessibility={
          answered ? 'no-hide-descendants' : 'auto'
        }
        style={[
          styles.prefixWordPart,
          answered && styles.prefixWordPartHidden,
        ]}
      >
        <Text
          style={styles.prefixWordText}
          maxFontSizeMultiplier={1.2}
        >
          {safeAfter}
        </Text>
      </View>

      {answered && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.prefixAnswerOverlay,
            {
              opacity: answerOpacity,
              transform: [{ translateY: answerTranslateY }],
            },
          ]}
        >
          <Text
            style={styles.prefixAnswerText}
            maxFontSizeMultiplier={1.2}
          >
            {startsWithCorrect && (
              <Text
                style={styles.highlightedPrefix}
                maxFontSizeMultiplier={1.2}
              >
                {safeCorrect}
              </Text>
            )}

            <Text maxFontSizeMultiplier={1.2}>
              {regularPart}
            </Text>
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const CardBody = ({
  windowHeight,
    compactLayout = false,
  fontScale = 1,
  item,
  options = [],
  selectedOption,
  answered,
  soundEnabled,
  onSelectAnswer,
  onPlayAudio,
  isExcluded = false,
  isPinned = false,
  onExcludePress,
  onPinTogglePress,
  onOpenManageModal,
}) => {
  // Минимальная высота зависит только от настроек шрифта,
  // а не от измерений предыдущих облаков.
  const cloudHeight = Math.max(
    HEBREW_CLOUD_HEIGHT,
    Math.ceil(
      HEBREW_LINE_HEIGHT * Math.min(fontScale, 1.2) +
        2 * (HEBREW_CLOUD_PADDING + HEBREW_CLOUD_BORDER)
    )
  );

  const [cardHeight, setCardHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [androidCompact, setAndroidCompact] = useState(false);

    const compact =
    Platform.OS === 'android'
      ? compactLayout
      : windowHeight < 760;

  const styles = compact ? compactStyles : regularStyles;

  useEffect(() => {
    if (
      Platform.OS === 'android' &&
      cardHeight > 0 &&
      contentHeight > cardHeight + 1 &&
      !compact
    ) {
      setAndroidCompact(true);
    }
  }, [cardHeight, contentHeight, compact]);

  const safeItem = item || {};

  const translitOpacity = useMemo(
    () => new Animated.Value(0),
    []
  );
  const translitTranslateY = useMemo(
    () => new Animated.Value(5),
    []
  );

  const answerOpacity = useMemo(
    () => new Animated.Value(0),
    []
  );
  const answerTranslateY = useMemo(
    () => new Animated.Value(5),
    []
  );

  const separateOpacity = useMemo(
    () => new Animated.Value(0),
    []
  );
  const separateTranslateY = useMemo(
    () => new Animated.Value(5),
    []
  );
  const separateBgOpacity = useMemo(
    () => new Animated.Value(0),
    []
  );

  const optionTextAnimations = useMemo(
    () =>
      Array.from(
        { length: Math.max(options.length, 3) },
        () => ({
          opacity: new Animated.Value(0),
          translateY: new Animated.Value(3),
        })
      ),
    [options.length, safeItem.id, safeItem.before]
  );

  const auroraOpacity = useMemo(
    () => new Animated.Value(1),
    []
  );

  const field1X = useMemo(
    () => new Animated.Value(-20),
    []
  );
  const field1Y = useMemo(
    () => new Animated.Value(-2),
    []
  );
  const field1Scale = useMemo(
    () => new Animated.Value(1),
    []
  );

  const field2X = useMemo(
    () => new Animated.Value(20),
    []
  );
  const field2Y = useMemo(
    () => new Animated.Value(2),
    []
  );
  const field2Scale = useMemo(
    () => new Animated.Value(1),
    []
  );

  const field3X = useMemo(
    () => new Animated.Value(0),
    []
  );
  const field3Y = useMemo(
    () => new Animated.Value(2),
    []
  );
  const field3Scale = useMemo(
    () => new Animated.Value(1),
    []
  );

  const isPrefix =
    safeItem.prepositionType === 'prefix';

  const trailingText = useMemo(
    () => getTrailingText(safeItem),
    [
      safeItem.hebrewFull,
      safeItem.before,
      safeItem.after,
      safeItem.answer,
      safeItem.correct,
      safeItem.prepositionType,
    ]
  );

  useEffect(() => {
    optionTextAnimations.forEach(anim => {
      anim.opacity.stopAnimation();
      anim.translateY.stopAnimation();
      anim.opacity.setValue(0);
      anim.translateY.setValue(3);
    });

    const animation = Animated.stagger(
      110,
      optionTextAnimations
        .slice(0, options.length)
        .map(anim =>
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 450,
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateY, {
              toValue: 0,
              duration: 450,
              useNativeDriver: true,
            }),
          ])
        )
    );

    animation.start();

    return () => animation.stop();
  }, [
    safeItem.id,
    safeItem.before,
    optionTextAnimations,
    options.length,
  ]);

  useEffect(() => {
    let loop1;
    let loop2;
    let loop3;

    if (!answered) {
      auroraOpacity.setValue(0);

      field1X.setValue(-20);
      field1Y.setValue(-2);
      field1Scale.setValue(1);

      field2X.setValue(20);
      field2Y.setValue(2);
      field2Scale.setValue(1);

      field3X.setValue(0);
      field3Y.setValue(2);
      field3Scale.setValue(1);

      Animated.timing(auroraOpacity, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }).start();

      loop1 = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(field1X, {
              toValue: 20,
              duration: 8500,
              useNativeDriver: true,
            }),
            Animated.timing(field1Y, {
              toValue: 3,
              duration: 8500,
              useNativeDriver: true,
            }),
            Animated.timing(field1Scale, {
              toValue: 1.04,
              duration: 8500,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(field1X, {
              toValue: -20,
              duration: 8500,
              useNativeDriver: true,
            }),
            Animated.timing(field1Y, {
              toValue: -2,
              duration: 8500,
              useNativeDriver: true,
            }),
            Animated.timing(field1Scale, {
              toValue: 1,
              duration: 8500,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      loop2 = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(field2X, {
              toValue: -25,
              duration: 10000,
              useNativeDriver: true,
            }),
            Animated.timing(field2Y, {
              toValue: -3,
              duration: 10000,
              useNativeDriver: true,
            }),
            Animated.timing(field2Scale, {
              toValue: 1.05,
              duration: 10000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(field2X, {
              toValue: 20,
              duration: 10000,
              useNativeDriver: true,
            }),
            Animated.timing(field2Y, {
              toValue: 2,
              duration: 10000,
              useNativeDriver: true,
            }),
            Animated.timing(field2Scale, {
              toValue: 1,
              duration: 10000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      loop3 = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(field3X, {
              toValue: 16,
              duration: 12000,
              useNativeDriver: true,
            }),
            Animated.timing(field3Y, {
              toValue: -3,
              duration: 12000,
              useNativeDriver: true,
            }),
            Animated.timing(field3Scale, {
              toValue: 1.035,
              duration: 12000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(field3X, {
              toValue: -14,
              duration: 12000,
              useNativeDriver: true,
            }),
            Animated.timing(field3Y, {
              toValue: 2,
              duration: 12000,
              useNativeDriver: true,
            }),
            Animated.timing(field3Scale, {
              toValue: 1,
              duration: 12000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      loop1.start();
      loop2.start();
      loop3.start();
    } else {
      Animated.timing(auroraOpacity, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      loop1?.stop();
      loop2?.stop();
      loop3?.stop();
    };
  }, [
    answered,
    safeItem.id,
    auroraOpacity,
    field1X,
    field1Y,
    field1Scale,
    field2X,
    field2Y,
    field2Scale,
    field3X,
    field3Y,
    field3Scale,
  ]);

  useEffect(() => {
    translitOpacity.setValue(0);
    translitTranslateY.setValue(5);

    answerOpacity.setValue(0);
    answerTranslateY.setValue(5);

    separateOpacity.setValue(0);
    separateTranslateY.setValue(5);
    separateBgOpacity.setValue(0);

    if (!answered) return;

    Animated.parallel([
      Animated.timing(answerOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(answerTranslateY, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(separateOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(separateTranslateY, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(separateBgOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translitOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(translitTranslateY, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    answered,
    translitOpacity,
    translitTranslateY,
    answerOpacity,
    answerTranslateY,
    separateOpacity,
    separateTranslateY,
    separateBgOpacity,
  ]);

  if (!item) return null;

  const canPlayAudio =
    answered &&
    soundEnabled &&
    !!safeItem.mp3 &&
    typeof onPlayAudio === 'function';

  const verbInfinitive =
    safeItem.verbInfinitive || '—';

  const verbTransliteration =
    safeItem.verbTransliteration || '';

  const canShowVerbPreposition =
    answered &&
    safeItem.verbFound &&
    verbInfinitive !== '—' &&
    !!normalizeSpaces(safeItem.correct);

  const displayedVerbPreposition =
    canShowVerbPreposition
      ? isPrefix
        ? `${normalizeSpaces(safeItem.correct)}-`
        : normalizeSpaces(safeItem.correct)
      : '';

  const renderSeparateMarker = () => (
    <View
      style={[
        styles.separateMarker,
        { minHeight: cloudHeight },
        answered && styles.separateMarkerAnswered,
      ]}
    >
      {answered && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.separateAnsweredBackground,
            { opacity: separateBgOpacity },
          ]}
        />
      )}

      {!answered && (
        <Text
          style={styles.markerText}
          maxFontSizeMultiplier={1.2}
        >
          ?
        </Text>
      )}

      {answered && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.separateAnswerOverlay,
            {
              opacity: separateOpacity,
              transform: [
                { translateY: separateTranslateY },
              ],
            },
          ]}
        >
          <Text
            style={styles.markerAnswerText}
            maxFontSizeMultiplier={1.2}
            numberOfLines={1}
          >
            {safeItem.correct}
          </Text>
        </Animated.View>
      )}
    </View>
  );

  return (
    <View
      style={styles.card}
      onLayout={event =>
        setCardHeight(event.nativeEvent.layout.height)
      }
    >
      <View
        style={styles.content}
        onLayout={event =>
          setContentHeight(event.nativeEvent.layout.height)
        }
      >
        <View style={styles.verbInfoBox}>
          <View style={styles.verbInfinitiveSlot}>
            <Text
              style={[
                styles.verbInfinitive,
                !safeItem.verbFound &&
                  styles.verbInfoMissing,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.68}
              maxFontSizeMultiplier={1.2}
            >
              <Text maxFontSizeMultiplier={1.2}>
                {verbInfinitive}
              </Text>

              {!!displayedVerbPreposition && (
                <Text
                  style={styles.verbPreposition}
                  maxFontSizeMultiplier={1.2}
                >
                  {' '}
                  {displayedVerbPreposition}
                </Text>
              )}
            </Text>

            {!!verbTransliteration && (
              <Text
                style={styles.verbTransliteration}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                maxFontSizeMultiplier={1.2}
              >
                {verbTransliteration}
              </Text>
            )}
          </View>

          <View style={styles.verbTranslationSlot}>
            <Text
              style={[
                styles.verbTranslation,
                !safeItem.verbFound &&
                  styles.verbInfoMissing,
              ]}
              maxFontSizeMultiplier={1.2}
            >
              {safeItem.verbTranslation || '—'}
            </Text>
          </View>
        </View>

        <View style={styles.translationBox}>
          <Text
            style={styles.translation}
            maxFontSizeMultiplier={1.2}
          >
            {safeItem.translation}
          </Text>
        </View>

        <View style={styles.hebrewArea}>
          <View style={styles.hebrewFlow}>
            <HebrewCloud
              cloudHeight={cloudHeight}
              value={safeItem.before}
              variant="first"
            />

            {isPrefix ? (
              <PrefixCloud
                cloudHeight={cloudHeight}
                after={safeItem.after}
                correct={safeItem.correct}
                answer={safeItem.answer}
                answered={answered}
                answerOpacity={answerOpacity}
                answerTranslateY={answerTranslateY}
              />
            ) : (
              <>
                {renderSeparateMarker()}

                <HebrewCloud
                  cloudHeight={cloudHeight}
                  value={safeItem.after}
                  variant="second"
                />
              </>
            )}

            {!!trailingText && (
              <HebrewCloud
                cloudHeight={cloudHeight}
                value={trailingText}
                variant="second"
              />
            )}
          </View>
        </View>

        <View style={styles.rotationButtonsWrapper}>
          <View style={styles.rotationButtonsCloud}>
            <TouchableOpacity
              onPress={onExcludePress}
              style={styles.rotationButton}
              activeOpacity={0.75}
            >
              <Image
                source={
                  isExcluded
                    ? require('./glaz2.png')
                    : require('./glaz1.png')
                }
                style={styles.rotationIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onPinTogglePress}
              style={styles.rotationButton}
              activeOpacity={0.75}
            >
              <Image
                source={
                  isPinned
                    ? require('./gant2.png')
                    : require('./gant1.png')
                }
                style={styles.rotationIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onOpenManageModal}
              style={styles.rotationButton}
              activeOpacity={0.75}
            >
              <Image
                source={require('./spisok.png')}
                style={styles.rotationIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.translitCloud,
            answered && styles.translitCloudAnswered,
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.auroraLayer,
              { opacity: auroraOpacity },
            ]}
          >
            <Animated.View
              style={[
                styles.auroraField,
                styles.auroraFieldPink,
                {
                  transform: [
                    { translateX: field1X },
                    { translateY: field1Y },
                    { scale: field1Scale },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[
                  'rgba(226,151,187,0)',
                  'rgba(226,151,187,0.05)',
                  'rgba(226,151,187,0.18)',
                  'rgba(226,151,187,0.36)',
                  'rgba(226,151,187,0.25)',
                  'rgba(226,151,187,0.08)',
                  'rgba(226,151,187,0)',
                ]}
                locations={[
                  0, 0.1, 0.28, 0.47, 0.63, 0.84, 1,
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.auroraFill}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.auroraField,
                styles.auroraFieldBlue,
                {
                  transform: [
                    { translateX: field2X },
                    { translateY: field2Y },
                    { scale: field2Scale },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[
                  'rgba(145,184,224,0)',
                  'rgba(145,184,224,0.08)',
                  'rgba(145,184,224,0.24)',
                  'rgba(145,184,224,0.35)',
                  'rgba(145,184,224,0.16)',
                  'rgba(145,184,224,0.04)',
                  'rgba(145,184,224,0)',
                ]}
                locations={[
                  0, 0.16, 0.34, 0.55, 0.72, 0.9, 1,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.auroraFill}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.auroraField,
                styles.auroraFieldMint,
                {
                  transform: [
                    { translateX: field3X },
                    { translateY: field3Y },
                    { scale: field3Scale },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[
                  'rgba(137,202,172,0)',
                  'rgba(137,202,172,0.06)',
                  'rgba(137,202,172,0.20)',
                  'rgba(137,202,172,0.30)',
                  'rgba(137,202,172,0.19)',
                  'rgba(137,202,172,0.06)',
                  'rgba(137,202,172,0)',
                ]}
                locations={[
                  0, 0.12, 0.31, 0.52, 0.7, 0.88, 1,
                ]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={styles.auroraFill}
              />
            </Animated.View>
          </Animated.View>

          <View style={styles.translitSideSlot}>
            {canPlayAudio && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.speakerButton}
                onPress={() => onPlayAudio(safeItem.mp3)}
              >
                <Image
                  source={require('./speaker3.png')}
                  style={styles.speakerIcon}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.translitTextSlot}>
            <Animated.Text
              style={[
                styles.translitText,
                {
                  opacity: translitOpacity,
                  transform: [
                    { translateY: translitTranslateY },
                  ],
                },
              ]}
              maxFontSizeMultiplier={1.2}
            >
              {safeItem.translit || ''}
            </Animated.Text>
          </View>

          <View style={styles.translitSideSlot} />
        </View>

        <View style={styles.optionsArea}>
          <View style={styles.optionsRow}>
            {options.map((option, index) => {
              const anim = optionTextAnimations[index];

              return (
                <TouchableOpacity
                  key={option.id || option.value}
                  activeOpacity={0.8}
                  disabled={answered}
                  style={[
                    styles.option,
                    getOptionStyle(
                      option,
                      selectedOption,
                      answered
                    ),
                  ]}
                  onPress={() =>
                    onSelectAnswer?.(option)
                  }
                >
                  <Animated.Text
                    style={[
                      styles.optionText,
                      getOptionTextStyle(
                        option,
                        selectedOption,
                        answered
                      ),
                      {
                        opacity: anim?.opacity ?? 1,
                        transform: [
                          {
                            translateY:
                              anim?.translateY ?? 0,
                          },
                        ],
                      },
                    ]}
                    maxFontSizeMultiplier={1.2}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {option.value}
                  </Animated.Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

const createStyles = IS_SHORT_SCREEN =>
  StyleSheet.create({
    card: {
      flexGrow: 1,
      flexShrink: 0,
      flexBasis: 'auto',
      minHeight: 0,
      backgroundColor: '#FFFDEF',
      borderRadius: 24,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
      elevation: 5,
    },

    content: {
      width: '100%',
      flexShrink: 0,
      paddingHorizontal: 18,
      paddingTop: IS_SHORT_SCREEN ? 8 : 14,
      paddingBottom: IS_SHORT_SCREEN ? 8 : 14,
    },

    verbInfoBox: {
      width: '100%',
      minHeight: IS_SHORT_SCREEN ? 48 : 54,
      paddingVertical: 4,
      marginBottom: IS_SHORT_SCREEN ? 5 : 8,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#C8B9DC',
      backgroundColor: '#F0ECF6',
      paddingHorizontal: 10,
    },

    verbInfinitiveSlot: {
      width: '42%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },

    verbInfinitive: {
      width: '100%',
      color: '#333652',
      fontSize: 19,
      lineHeight: 26,
      fontWeight: '800',
      textAlign: 'center',
      textAlignVertical: 'center',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },

    verbPreposition: {
      color: '#A84F70',
      fontWeight: '800',
    },

    verbTransliteration: {
      width: '100%',
      marginTop: -2,
      color: '#CE6857',
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '600',
      textAlign: 'center',
      includeFontPadding: false,
    },

    verbTranslationSlot: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },

    verbTranslation: {
      width: '100%',
      color: '#8A6575',
      fontSize: 15,
      lineHeight: 18,
      fontWeight: '800',
      textAlign: 'center',
      textAlignVertical: 'center',
      includeFontPadding: false,
    },

    verbInfoMissing: {
      color: '#A3A6B2',
    },

    translationBox: {
      height: 58,
      borderRadius: 17,
      backgroundColor: '#E6EEF8',
      borderWidth: 1,
      borderColor: '#CDD9E9',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
      paddingVertical: 5,
    },

    translation: {
      width: '100%',
      color: '#333652',
      fontSize: 16,
      lineHeight: 18,
      fontWeight: '700',
      textAlign: 'center',
      textAlignVertical: 'center',
      includeFontPadding: false,
    },

    hebrewArea: {
      width: '100%',
      // minHeight:
      //   HEBREW_CLOUD_HEIGHT * 2 + HEBREW_ROW_GAP,
      height: 92,
      marginTop: IS_SHORT_SCREEN ? 4 : 14,
      marginBottom: IS_SHORT_SCREEN ? 4 : 14,
      alignItems: 'center',
      justifyContent: 'center',
    },

    hebrewFlow: {
      width: '100%',
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: HEBREW_COLUMN_GAP,
      rowGap: HEBREW_ROW_GAP,
    },

    hebrewCloud: {
      minHeight: HEBREW_CLOUD_HEIGHT,
      maxWidth: '100%',
      flexShrink: 0,
      paddingVertical: HEBREW_CLOUD_PADDING,
      paddingHorizontal: 13,
      borderRadius: 21,
      borderWidth: HEBREW_CLOUD_BORDER,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.07,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },

    hebrewCloudFirst: {
      backgroundColor:
        HEBREW_COLORS.firstBackground,
      borderColor: HEBREW_COLORS.firstBorder,
    },

    hebrewCloudSecond: {
      backgroundColor:
        HEBREW_COLORS.secondBackground,
      borderColor: HEBREW_COLORS.secondBorder,
    },

    hebrewCloudText: {
      flexShrink: 0,
      color: '#333652',
      fontSize: HEBREW_FONT_SIZE,
      lineHeight: HEBREW_LINE_HEIGHT,
      fontWeight: '700',
      textAlign: 'center',
      textAlignVertical: 'center',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },

    separateMarker: {
      width: SEPARATE_MARKER_WIDTH,
      minHeight: HEBREW_CLOUD_HEIGHT,
      flexShrink: 0,
      position: 'relative',
      borderRadius: 20,
      backgroundColor:
        HEBREW_COLORS.markerBackground,
      borderWidth: HEBREW_CLOUD_BORDER,
      borderColor: HEBREW_COLORS.markerBorder,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },

    separateMarkerAnswered: {
      borderColor: HEBREW_COLORS.secondBorder,
    },

    markerText: {
      color: '#CE6857',
      fontSize: HEBREW_FONT_SIZE,
      lineHeight: HEBREW_LINE_HEIGHT,
      fontWeight: '700',
      textAlign: 'center',
      includeFontPadding: false,
    },

    separateAnsweredBackground: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        HEBREW_COLORS.secondBackground,
    },

    separateAnswerOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },

    markerAnswerText: {
      color: '#333652',
      fontSize: HEBREW_FONT_SIZE,
      lineHeight: HEBREW_LINE_HEIGHT,
      fontWeight: '700',
      textAlign: 'center',
      textAlignVertical: 'center',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },

    prefixCloud: {
      maxWidth: '100%',
      minHeight: HEBREW_CLOUD_HEIGHT,
      flexShrink: 0,
      flexDirection: 'row-reverse',
      alignItems: 'stretch',
      position: 'relative',
      borderRadius: 21,
      borderWidth: HEBREW_CLOUD_BORDER,
      borderColor: HEBREW_COLORS.secondBorder,
      backgroundColor:
        HEBREW_COLORS.secondBackground,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.07,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },

    prefixSlot: {
      width: PREFIX_SLOT_WIDTH,
      alignSelf: 'stretch',
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },

    prefixSlotQuestion: {
      backgroundColor:
        HEBREW_COLORS.markerBackground,
      borderLeftWidth: 1,
      borderLeftColor:
        HEBREW_COLORS.markerBorder,
    },

    prefixSlotAnswered: {
      backgroundColor: 'transparent',
      borderLeftWidth: 0,
    },

    prefixSlotText: {
      color: '#CE6857',
      fontSize: HEBREW_FONT_SIZE,
      lineHeight: HEBREW_LINE_HEIGHT,
      fontWeight: '700',
      textAlign: 'center',
      includeFontPadding: false,
    },

    prefixWordPart: {
      flexShrink: 1,
      minWidth: 0,
      paddingLeft: 13,
      paddingRight: 8,
      paddingVertical: HEBREW_CLOUD_PADDING,
      alignItems: 'center',
      justifyContent: 'center',
    },

    prefixWordPartHidden: {
      opacity: 0,
    },

    prefixWordText: {
      flexShrink: 0,
      color: '#333652',
      fontSize: HEBREW_FONT_SIZE,
      lineHeight: HEBREW_LINE_HEIGHT,
      fontWeight: '700',
      textAlign: 'center',
      textAlignVertical: 'center',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },

    prefixAnswerOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },

    prefixAnswerText: {
      flexShrink: 0,
      color: '#333652',
      fontSize: HEBREW_FONT_SIZE,
      lineHeight: HEBREW_LINE_HEIGHT,
      fontWeight: '700',
      textAlign: 'center',
      textAlignVertical: 'center',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },

    highlightedPrefix: {
      color: '#A84F70',
      fontWeight: '700',
    },

    rotationButtonsWrapper: {
      width: '100%',
      height: 40,
      marginBottom: IS_SHORT_SCREEN ? 3 : 8,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },

    rotationButtonsCloud: {
      height: 40,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: 18,
      paddingHorizontal: 6,
      borderRadius: 18,
      backgroundColor: '#EEF1F5',
      borderWidth: 1,
      borderColor: '#D4DAE3',
    },

    rotationButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
    },

    rotationIcon: {
      width: 30,
      height: 30,
      resizeMode: 'contain',
    },

    translitCloud: {
      width: '100%',
      minHeight: IS_SHORT_SCREEN ? 48 : 58,
      paddingVertical: 5,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E1D2BE',
      backgroundColor: '#F6F0E6',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
    },

    translitCloudAnswered: {
      borderColor: '#D8C09F',
      backgroundColor: '#F5EAD8',
    },

    auroraLayer: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
      zIndex: 0,
    },

    auroraField: {
      position: 'absolute',
    },

    auroraFieldPink: {
      width: 520,
      height: 220,
      left: -240,
      top: -78,
    },

    auroraFieldBlue: {
      width: 560,
      height: 240,
      right: -260,
      bottom: -88,
    },

    auroraFieldMint: {
      width: 500,
      height: 210,
      left: -60,
      top: -72,
    },

    auroraFill: {
      width: '100%',
      height: '100%',
    },

    translitSideSlot: {
      width: 34,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },

    translitTextSlot: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      zIndex: 2,
    },

    translitText: {
      width: '100%',
      color: '#CE6857',
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '700',
      textAlign: 'center',
      textAlignVertical: 'center',
      includeFontPadding: false,
    },

    speakerButton: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },

    speakerIcon: {
      width: 22,
      height: 22,
      resizeMode: 'contain',
    },

    optionsArea: {
      flex: 0,
      minHeight: IS_SHORT_SCREEN ? 52 : 68,
      justifyContent: 'flex-start',
      paddingTop: IS_SHORT_SCREEN ? 6 : 10,
    },

    optionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: IS_SHORT_SCREEN ? 7 : 10,
      marginTop: 0,
      marginBottom: 0,
    },

    option: {
      flex: 1,
      height: IS_SHORT_SCREEN ? 50 : 58,
      borderRadius: IS_SHORT_SCREEN ? 15 : 18,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      paddingVertical: 4,
    },

    optionDefault: {
      backgroundColor: '#FFFFFF',
      borderColor: '#83A3CD',
    },

    optionCorrect: {
      backgroundColor: '#AFFFCA',
      borderColor: '#62B57D',
    },

    optionWrong: {
      backgroundColor: '#FFBCBC',
      borderColor: '#D86F6F',
    },

    optionInactive: {
      backgroundColor: '#F0F1F4',
      borderColor: '#D7D9E0',
    },

    optionText: {
      width: '100%',
      fontSize: IS_SHORT_SCREEN ? 25 : 31,
      lineHeight: IS_SHORT_SCREEN ? 30 : 36,
      fontWeight: '700',
      textAlign: 'center',
      textAlignVertical: 'center',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },

    optionTextDefault: {
      color: '#333652',
    },

    optionTextAnswered: {
      color: '#333652',
    },

    optionTextInactive: {
      color: '#A3A6B2',
    },
  });

const regularStyles = createStyles(false);
const compactStyles = createStyles(true);
const styles = regularStyles;

const PrepositionVerbCard = props => {
  const { width, height, fontScale } =
    useWindowDimensions();

  return (
    <CardBody
      key={`${width}:${height}:${fontScale}:${
        props.item?.id || props.item?.before || ''
      }`}
      {...props}
      windowHeight={height}
      fontScale={fontScale}
    />
  );
};

export default PrepositionVerbCard;