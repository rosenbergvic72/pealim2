import React, { useEffect, useMemo } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const PRONOMINAL_SUFFIXES = [
  'תם', 'תן', 'הם', 'הן', 'כם', 'כן', 'נו', 'ני',
  'יי', 'ם', 'ן', 'ך', 'י', 'ו', 'ה',
];

const splitHebrewSuffix = value => {
  const word = String(value || '').trim();
  if (!word) return { base: '', suffix: '' };

  const suffix =
    PRONOMINAL_SUFFIXES.find(
      candidate =>
        word.length > candidate.length &&
        word.endsWith(candidate)
    ) || '';

  return suffix
    ? {
        base: word.slice(0, word.length - suffix.length),
        suffix,
      }
    : {
        base: word,
        suffix: '',
      };
};

const getOptionStyle = (option, selectedId, answered) => {
  if (!answered) return styles.optionDefault;
  if (option.isCorrect) return styles.optionCorrect;
  if (option.id === selectedId) return styles.optionWrong;
  return styles.optionInactive;
};

const getOptionTextStyle = (option, selectedId, answered) => {
  if (!answered) return styles.optionTextDefault;

  if (option.isCorrect || option.id === selectedId) {
    return styles.optionTextAnswered;
  }

  return styles.optionTextInactive;
};

const HebrewWithSuffix = ({
  value,
  colorEnabled,
  textStyle,
  suffixInactive,
}) => {
  if (!colorEnabled) {
    return (
      <Text
        style={textStyle}
        maxFontSizeMultiplier={1.2}
      >
        {value}
      </Text>
    );
  }

  const { base, suffix } =
    splitHebrewSuffix(value);

  return (
    <Text
      style={textStyle}
      maxFontSizeMultiplier={1.2}
    >
      {base}

      {!!suffix && (
        <Text
          style={[
            styles.pronominalSuffix,
            suffixInactive &&
              styles.pronominalSuffixInactive,
          ]}
        >
          {suffix}
        </Text>
      )}
    </Text>
  );
};

const PrepositionCard = ({
  item,
  options = [],
  translitMode = 0,
  translationDirection = 'toHebrew',
  selectedOptionId,
  answered,
  genderIcon,
  soundEnabled,
  onSelectAnswer,
  onPlayAudio,
}) => {
  const optionCount = options.length;

  /* ---------- анимация текста опций ---------- */

  const optionAnimations = useMemo(
    () =>
      Array.from(
        { length: optionCount },
        () => ({
          opacity: new Animated.Value(0),
          translateY: new Animated.Value(5),
        })
      ),
    [optionCount]
  );

  /* ---------- aurora prompt ---------- */

  const promptAuroraOpacity = useMemo(
    () => new Animated.Value(0),
    []
  );

  const field1X = useMemo(
    () => new Animated.Value(-18),
    []
  );

  const field1Y = useMemo(
    () => new Animated.Value(-4),
    []
  );

  const field1Scale = useMemo(
    () => new Animated.Value(1),
    []
  );

  const field2X = useMemo(
    () => new Animated.Value(18),
    []
  );

  const field2Y = useMemo(
    () => new Animated.Value(4),
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
    () => new Animated.Value(6),
    []
  );

  const field3Scale = useMemo(
    () => new Animated.Value(1),
    []
  );

  /* ---------- текст вариантов ---------- */

  useEffect(() => {
    optionAnimations.forEach(anim => {
      anim.opacity.stopAnimation();
      anim.translateY.stopAnimation();

      anim.opacity.setValue(0);
      anim.translateY.setValue(5);
    });

    const animation = Animated.stagger(
      45,
      optionAnimations.map(anim =>
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 240,
            useNativeDriver: true,
          }),

          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: 240,
            useNativeDriver: true,
          }),
        ])
      )
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [
    item?.id,
    item?.hebrew,
    optionAnimations,
  ]);

  /* ---------- движение aurora ---------- */

  useEffect(() => {
    promptAuroraOpacity.setValue(0);

    field1X.setValue(-18);
    field1Y.setValue(-4);
    field1Scale.setValue(1);

    field2X.setValue(18);
    field2Y.setValue(4);
    field2Scale.setValue(1);

    field3X.setValue(0);
    field3Y.setValue(6);
    field3Scale.setValue(1);

    Animated.timing(promptAuroraOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(field1X, {
            toValue: 22,
            duration: 8500,
            useNativeDriver: true,
          }),

          Animated.timing(field1Y, {
            toValue: 5,
            duration: 8500,
            useNativeDriver: true,
          }),

          Animated.timing(field1Scale, {
            toValue: 1.05,
            duration: 8500,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(field1X, {
            toValue: -18,
            duration: 8500,
            useNativeDriver: true,
          }),

          Animated.timing(field1Y, {
            toValue: -4,
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

    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(field2X, {
            toValue: -24,
            duration: 10000,
            useNativeDriver: true,
          }),

          Animated.timing(field2Y, {
            toValue: -5,
            duration: 10000,
            useNativeDriver: true,
          }),

          Animated.timing(field2Scale, {
            toValue: 1.045,
            duration: 10000,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(field2X, {
            toValue: 18,
            duration: 10000,
            useNativeDriver: true,
          }),

          Animated.timing(field2Y, {
            toValue: 4,
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

    const loop3 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(field3X, {
            toValue: 16,
            duration: 11500,
            useNativeDriver: true,
          }),

          Animated.timing(field3Y, {
            toValue: -7,
            duration: 11500,
            useNativeDriver: true,
          }),

          Animated.timing(field3Scale, {
            toValue: 1.04,
            duration: 11500,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(field3X, {
            toValue: -14,
            duration: 11500,
            useNativeDriver: true,
          }),

          Animated.timing(field3Y, {
            toValue: 6,
            duration: 11500,
            useNativeDriver: true,
          }),

          Animated.timing(field3Scale, {
            toValue: 1,
            duration: 11500,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    loop1.start();
    loop2.start();
    loop3.start();

    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
    };
  }, [
    item?.id,
    item?.hebrew,
    promptAuroraOpacity,
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

  if (!item) return null;

  const isFromHebrew =
    translationDirection === 'fromHebrew';

  const showTranslit =
    translitMode === 0;

  const colorSuffix =
    translitMode !== 2;

  const canPlayPromptAudio =
    isFromHebrew &&
    soundEnabled &&
    !!item.mp3 &&
    typeof onPlayAudio === 'function';

  return (
    <View style={styles.card}>
      {/* ---------- prompt ---------- */}

      <View style={styles.promptContainer}>
        {/* Aurora background */}

        <Animated.View
          pointerEvents="none"
          style={[
            styles.promptAuroraLayer,
            {
              opacity:
                promptAuroraOpacity,
            },
          ]}
        >
          {/* базовый фон */}

          <LinearGradient
            colors={[
              '#EAF0F8',
              '#EEF3F9',
              '#EDF2F7',
              '#EAF1F7',
            ]}
            locations={[
              0,
              0.34,
              0.68,
              1,
            ]}
            start={{
              x: 0,
              y: 0,
            }}
            end={{
              x: 1,
              y: 1,
            }}
            style={
              styles.promptBaseGradient
            }
          />

          {/* розовый */}

          <Animated.View
            style={[
              styles.promptField,
              styles.promptFieldPink,

              {
                transform: [
                  {
                    translateX:
                      field1X,
                  },

                  {
                    translateY:
                      field1Y,
                  },

                  {
                    scale:
                      field1Scale,
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[
                'rgba(239,198,218,0)',
                'rgba(239,198,218,0.05)',
                'rgba(239,198,218,0.14)',
                'rgba(239,198,218,0.22)',
                'rgba(239,198,218,0.14)',
                'rgba(239,198,218,0.05)',
                'rgba(239,198,218,0)',
              ]}
              locations={[
                0,
                0.12,
                0.30,
                0.50,
                0.70,
                0.88,
                1,
              ]}
              start={{
                x: 0,
                y: 0.5,
              }}
              end={{
                x: 1,
                y: 0.5,
              }}
              style={
                styles.promptFieldFill
              }
            />
          </Animated.View>

          {/* голубой */}

          <Animated.View
            style={[
              styles.promptField,
              styles.promptFieldBlue,

              {
                transform: [
                  {
                    translateX:
                      field2X,
                  },

                  {
                    translateY:
                      field2Y,
                  },

                  {
                    scale:
                      field2Scale,
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[
                'rgba(174,205,235,0)',
                'rgba(174,205,235,0.05)',
                'rgba(174,205,235,0.13)',
                'rgba(174,205,235,0.21)',
                'rgba(174,205,235,0.13)',
                'rgba(174,205,235,0.05)',
                'rgba(174,205,235,0)',
              ]}
              locations={[
                0,
                0.12,
                0.30,
                0.50,
                0.70,
                0.88,
                1,
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={
                styles.promptFieldFill
              }
            />
          </Animated.View>

          {/* мятный */}

          <Animated.View
            style={[
              styles.promptField,
              styles.promptFieldMint,

              {
                transform: [
                  {
                    translateX:
                      field3X,
                  },

                  {
                    translateY:
                      field3Y,
                  },

                  {
                    scale:
                      field3Scale,
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[
                'rgba(187,224,205,0)',
                'rgba(187,224,205,0.05)',
                'rgba(187,224,205,0.12)',
                'rgba(187,224,205,0.19)',
                'rgba(187,224,205,0.12)',
                'rgba(187,224,205,0.05)',
                'rgba(187,224,205,0)',
              ]}
              locations={[
                0,
                0.12,
                0.30,
                0.50,
                0.70,
                0.88,
                1,
              ]}
              start={{
                x: 0,
                y: 1,
              }}
              end={{
                x: 1,
                y: 0,
              }}
              style={
                styles.promptFieldFill
              }
            />
          </Animated.View>
        </Animated.View>

        {/* Gender */}

        <View style={styles.genderIconContainer}>
          {!!genderIcon && (
            <Image
              source={genderIcon}
              style={styles.promptGenderIcon}
            />
          )}
        </View>

        {/* Content */}

        <View style={styles.promptCenter}>
          {isFromHebrew ? (
            <View style={styles.hebrewPromptWrap}>
              <HebrewWithSuffix
                value={item.hebrew}
                colorEnabled={colorSuffix}
                textStyle={styles.promptHebrew}
              />

              {showTranslit && (
                <Text
                  style={styles.promptTranslit}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  maxFontSizeMultiplier={1.2}
                >
                  {item.translit}
                </Text>
              )}
            </View>
          ) : (
            <Text
              style={styles.translation}
              adjustsFontSizeToFit
              numberOfLines={2}
              minimumFontScale={0.75}
              maxFontSizeMultiplier={1.2}
            >
              {item.translation}
            </Text>
          )}
        </View>

        {/* speaker */}

        {canPlayPromptAudio && (
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{
              top: 10,
              bottom: 10,
              left: 10,
              right: 10,
            }}
            style={styles.promptSpeaker}
            onPress={() =>
              onPlayAudio(item.mp3)
            }
          >
            <Image
              source={require('./speaker3.png')}
              style={styles.promptSpeakerIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* ---------- варианты ---------- */}

      <View style={styles.optionsGrid}>
        {options.map((option, index) => {
          const optionStyle =
            getOptionStyle(
              option,
              selectedOptionId,
              answered
            );

          const optionTextStyle =
            getOptionTextStyle(
              option,
              selectedOptionId,
              answered
            );

          const isOptionInactive =
            answered &&
            !option.isCorrect &&
            option.id !== selectedOptionId;

          const showOptionSpeaker =
            !isFromHebrew &&
            answered &&
            option.isCorrect &&
            soundEnabled &&
            !!option.mp3 &&
            typeof onPlayAudio === 'function';

          const anim =
            optionAnimations[index];

          return (
            <TouchableOpacity
              key={option.id}
              activeOpacity={0.8}
              disabled={answered}
              style={[
                styles.option,

                !showTranslit &&
                  styles.optionWithoutTranslit,

                optionStyle,
              ]}
              onPress={() =>
                onSelectAnswer?.(option)
              }
            >
              <Animated.View
                style={[
                  styles.optionContent,

                  {
                    opacity:
                      anim?.opacity ?? 1,

                    transform: [
                      {
                        translateY:
                          anim?.translateY ?? 0,
                      },
                    ],
                  },
                ]}
              >
                {isFromHebrew ? (
                  <Text
                    style={[
                      styles.optionTranslationText,
                      optionTextStyle,
                    ]}
                    numberOfLines={3}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    maxFontSizeMultiplier={1.2}
                  >
                    {option.text}
                  </Text>
                ) : (
                  <>
                    <HebrewWithSuffix
                      value={option.text}
                      colorEnabled={colorSuffix}
                      suffixInactive={
                        isOptionInactive
                      }
                      textStyle={[
                        styles.optionText,
                        optionTextStyle,
                      ]}
                    />

                    {showTranslit && (
                      <Text
                        style={[
                          styles.optionTranslit,

                          isOptionInactive &&
                            styles.optionTranslitInactive,
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                        maxFontSizeMultiplier={1.2}
                      >
                        {option.translit}
                      </Text>
                    )}
                  </>
                )}
              </Animated.View>

              {showOptionSpeaker && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{
                    top: 8,
                    bottom: 8,
                    left: 8,
                    right: 8,
                  }}
                  style={styles.optionSpeaker}
                  onPress={() =>
                    onPlayAudio(option.mp3)
                  }
                >
                  <Image
                    source={require('./speaker3.png')}
                    style={styles.optionSpeakerIcon}
                  />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  /* ---------- card ---------- */

  card: {
    flex: 1,

    backgroundColor: '#FFFDEF',

    borderRadius: 24,

    padding: 18,

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 5,
  },

  /* =====================================================
     PROMPT
     ===================================================== */

  promptContainer: {
    position: 'relative',

    minHeight: 104,

    overflow: 'hidden',

    borderRadius: 18,

    backgroundColor: '#E8EEF7',

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 66,
    paddingVertical: 10,
  },

  /* ---------- prompt aurora ---------- */

  promptAuroraLayer: {
    ...StyleSheet.absoluteFillObject,

    overflow: 'hidden',

    borderRadius: 18,

    zIndex: 0,
  },

  promptBaseGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  promptField: {
    position: 'absolute',
  },

  /*
   * Намного больше самого prompt.
   * Поэтому границы полей не видны.
   */

  promptFieldPink: {
    width: 520,
    height: 230,

    left: -210,
    top: -65,
  },

  promptFieldBlue: {
    width: 550,
    height: 245,

    right: -230,
    bottom: -75,
  },

  promptFieldMint: {
    width: 500,
    height: 220,

    left: -30,
    top: -55,
  },

  promptFieldFill: {
    width: '100%',
    height: '100%',
  },

  /* ---------- prompt content ---------- */

  promptCenter: {
    width: '100%',

    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 2,
  },

  genderIconContainer: {
    position: 'absolute',

    left: 6,
    top: 0,
    bottom: 0,

    width: 54,

    justifyContent: 'center',
    alignItems: 'center',

    zIndex: 3,
  },

  promptGenderIcon: {
    width: 54,
    height: 54,

    resizeMode: 'contain',
  },

  translation: {
    width: '100%',

    color: '#333652',

    fontSize: 30,
    fontWeight: '900',

    textAlign: 'center',
  },

  hebrewPromptWrap: {
    width: '100%',

    minHeight: 76,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 4,
    paddingVertical: 6,
  },

  promptHebrew: {
    color: '#333652',

    fontSize: 34,
    lineHeight: 42,

    fontWeight: '900',

    textAlign: 'center',

    writingDirection: 'rtl',
  },

  promptTranslit: {
    marginTop: 3,

    color: '#CE6857',

    fontSize: 16,
    lineHeight: 20,

    fontWeight: '800',

    textAlign: 'center',
  },

  promptSpeaker: {
    position: 'absolute',

    right: 7,
    bottom: 7,

    width: 32,
    height: 32,

    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 3,
  },

  promptSpeakerIcon: {
    width: 22,
    height: 22,

    resizeMode: 'contain',
  },

  /* =====================================================
     OPTIONS
     ===================================================== */

  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    justifyContent: 'space-between',

    marginTop: 38,

    rowGap: 12,
  },

  option: {
    position: 'relative',

    width: '48%',

    minHeight: 82,

    borderRadius: 18,

    borderWidth: 2,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 8,
    paddingVertical: 7,
  },

  optionWithoutTranslit: {
    minHeight: 82,
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

  optionContent: {
    width: '100%',

    alignItems: 'center',
    justifyContent: 'center',
  },

  optionText: {
    fontSize: 29,
    lineHeight: 34,

    fontWeight: '900',

    textAlign: 'center',
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

  optionTranslationText: {
    width: '100%',

    paddingHorizontal: 4,

    fontSize: 17,
    lineHeight: 22,

    fontWeight: '800',

    textAlign: 'center',
  },

  pronominalSuffix: {
    color: '#FF3AB3',

    fontWeight: '900',
  },

  pronominalSuffixInactive: {
    color: '#c796bb',
  },

  optionTranslit: {
    minHeight: 18,

    marginTop: 2,

    color: '#CE6857',

    fontSize: 16,
    lineHeight: 17,

    fontWeight: '800',

    textAlign: 'center',
  },

  optionTranslitInactive: {
    color: '#A3A6B2',
  },

  optionSpeaker: {
    position: 'absolute',

    right: 5,
    bottom: 5,

    width: 28,
    height: 28,

    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 3,
  },

  optionSpeakerIcon: {
    width: 22,
    height: 22,

    resizeMode: 'contain',
  },
});

export default PrepositionCard;