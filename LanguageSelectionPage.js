import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Vibration,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

let didAutoNavigate = false;

const LanguageSelectionPage = ({ navigation }) => {
  const [firstLoad, setFirstLoad] = useState(true);
  const [shadowVisible, setShadowVisible] = useState(false);

  const logoOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const lottieOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const lottieTranslateY = useRef(
    new Animated.Value(300)
  ).current;

  const buttonOpacities = useRef(
    Array.from(
      { length: 7 },
      () => new Animated.Value(0)
    )
  ).current;

  const buttonTranslations = useRef(
    Array.from(
      { length: 7 },
      () => new Animated.Value(300)
    )
  ).current;

  const buttonBackgroundColors = useRef(
    Array.from(
      { length: 7 },
      () => new Animated.Value(0)
    )
  ).current;

  /* =====================================================
     ЖИВОЙ ФОН
     ===================================================== */

  const bgScale = useRef(
    new Animated.Value(1)
  ).current;

  const bgX = useRef(
    new Animated.Value(0)
  ).current;

  const bgY = useRef(
    new Animated.Value(0)
  ).current;

 useEffect(() => {
  const animation = Animated.loop(
    Animated.sequence([
      Animated.parallel([
        Animated.timing(bgScale, {
          toValue: 1.11,
          duration: 5500,
          useNativeDriver: true,
        }),

        Animated.timing(bgX, {
          toValue: 32,
          duration: 5500,
          useNativeDriver: true,
        }),

        Animated.timing(bgY, {
          toValue: -22,
          duration: 5500,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(bgScale, {
          toValue: 1.04,
          duration: 4800,
          useNativeDriver: true,
        }),

        Animated.timing(bgX, {
          toValue: -26,
          duration: 4800,
          useNativeDriver: true,
        }),

        Animated.timing(bgY, {
          toValue: 18,
          duration: 4800,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(bgScale, {
          toValue: 1,
          duration: 5500,
          useNativeDriver: true,
        }),

        Animated.timing(bgX, {
          toValue: 0,
          duration: 5500,
          useNativeDriver: true,
        }),

        Animated.timing(bgY, {
          toValue: 0,
          duration: 5500,
          useNativeDriver: true,
        }),
      ]),
    ])
  );

  animation.start();

  return () => {
    animation.stop();
  };
}, [bgScale, bgX, bgY]);

  /* =====================================================
     АНИМАЦИИ КНОПОК И LOTTIE
     ===================================================== */

  const startAnimations = callback => {
    Animated.timing(
      logoOpacity,
      {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }
    ).start();

    buttonOpacities.forEach(
      (opacity, index) => {
        Animated.timing(
          opacity,
          {
            toValue: 1,
            duration: 500,
            delay:
              1000 +
              index * 300,
            useNativeDriver: true,
          }
        ).start();

        Animated.timing(
          buttonTranslations[index],
          {
            toValue: 0,
            duration: 500,
            delay:
              1000 +
              index * 300,
            useNativeDriver: true,
          }
        ).start();

        Animated.timing(
          buttonBackgroundColors[index],
          {
            toValue: 1,
            duration: 1000,
            delay:
              1000 +
              index * 300,
            useNativeDriver: false,
          }
        ).start(() => {
          if (
            index ===
            buttonOpacities.length - 1
          ) {
            setShadowVisible(true);

            if (callback) {
              callback();
            }
          }
        });
      }
    );

    Animated.timing(
      lottieOpacity,
      {
        toValue: 1,
        duration: 500,
        delay:
          1000 +
          buttonOpacities.length * 300,
        useNativeDriver: true,
      }
    ).start();

    Animated.timing(
      lottieTranslateY,
      {
        toValue: 0,
        duration: 500,
        delay:
          1000 +
          buttonOpacities.length * 300,
        useNativeDriver: true,
      }
    ).start();
  };

  /* =====================================================
     АВТОПЕРЕХОД
     ===================================================== */

  useEffect(() => {
    const checkLanguage = async () => {
      const storedLanguage =
        await AsyncStorage.getItem(
          'language'
        );

      const storedName =
        await AsyncStorage.getItem(
          'name'
        );

      if (
        storedLanguage &&
        storedName &&
        firstLoad &&
        !didAutoNavigate
      ) {
        didAutoNavigate = true;

        setFirstLoad(false);

        startAnimations(() => {
          navigateToLanguageScreen(
            storedLanguage,
            storedName
          );
        });
      } else {
        startAnimations();
      }
    };

    checkLanguage();
  }, [firstLoad]);

  useFocusEffect(
    useCallback(() => {
      setFirstLoad(false);
    }, [])
  );

  /* =====================================================
     ВЫБОР ЯЗЫКА
     ===================================================== */

  const handleSelectLanguage =
    async language => {
      Vibration.vibrate(50);

      await AsyncStorage.setItem(
        'language',
        language
      );

      navigateToLanguageScreen(
        language
      );
    };

  const navigateToLanguageScreen = (
    language,
    name = ''
  ) => {
    switch (language) {
      case 'english':
        navigation.navigate(
          'WelcomeEn',
          {
            name,
            language,
          }
        );
        break;

      case 'русский':
        navigation.navigate(
          'Welcome',
          {
            name,
            language,
          }
        );
        break;

      case 'français':
        navigation.navigate(
          'WelcomeFr',
          {
            name,
            language,
          }
        );
        break;

      case 'español':
        navigation.navigate(
          'WelcomeEs',
          {
            name,
            language,
          }
        );
        break;

      case 'português':
        navigation.navigate(
          'WelcomePt',
          {
            name,
            language,
          }
        );
        break;

      case 'العربية':
        navigation.navigate(
          'WelcomeAr',
          {
            name,
            language,
          }
        );
        break;

      case 'አማርኛ':
        navigation.navigate(
          'WelcomeAm',
          {
            name,
            language,
          }
        );
        break;

      default:
        navigation.navigate(
          'Welcome',
          {
            name,
            language,
          }
        );
    }
  };

  /* =====================================================
     UI
     ===================================================== */

  return (
    <View style={styles.page}>

      {/* ЖИВОЙ БЕСШОВНЫЙ ФОН */}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.background,
          {
            transform: [
              {
                translateX:
                  bgX,
              },
              {
                translateY:
                  bgY,
              },
              {
                scale:
                  bgScale,
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[
            '#EFCFD1',
            '#EED9D0',
            '#E9DFD1',
            '#DDE4DA',
            '#D4E2E4',
            '#CFDEE9',
            '#D2E5DC',
          ]}
          locations={[
            0,
            0.17,
            0.34,
            0.51,
            0.67,
            0.84,
            1,
          ]}
          start={{
            x: 0,
            y: 0.05,
          }}
          end={{
            x: 1,
            y: 0.95,
          }}
          style={
            StyleSheet.absoluteFillObject
          }
        />
      </Animated.View>

      {/* КОНТЕНТ */}

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={
              styles.container
            }
          >

            {/* ВЕРХНЯЯ LOTTIE */}

            <Animated.View
              style={{
                opacity:
                  logoOpacity,
              }}
            >
              <LottieView
                source={require('./assets/Animation - 1718510308187.json')}
                autoPlay
                loop
                style={
                  styles.lottie
                }
              />
            </Animated.View>

            {/* КНОПКИ ЯЗЫКОВ */}

            {[
              'English',
              'Русский',
              'Français',
              'Español',
              'Português',
              'العربية',
              'አማርኛ',
            ].map(
              (
                language,
                index
              ) => {

                const interpolatedBackgroundColor =
                  buttonBackgroundColors[
                    index
                  ].interpolate({
                    inputRange: [
                      0,
                      1,
                    ],
                    outputRange: [
                      'rgba(108,142,187,0.58)',
                      'rgba(74,100,145,0.72)',
                    ],
                  });

                return (
                  <Animated.View
                    key={
                      language
                    }
                    style={[
                      styles.buttonContainer,

                      shadowVisible &&
                        styles.shadow,

                      {
                        opacity:
                          buttonOpacities[
                            index
                          ],

                        transform: [
                          {
                            translateY:
                              buttonTranslations[
                                index
                              ],
                          },
                        ],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={
                        0.8
                      }
                      style={[
                        styles.button,
                        {
                          backgroundColor:
                            interpolatedBackgroundColor,
                        },
                      ]}
                      onPress={() =>
                        handleSelectLanguage(
                          language.toLowerCase()
                        )
                      }
                    >
                      <Text
                        style={
                          styles.text
                        }
                        maxFontSizeMultiplier={
                          1.2
                        }
                      >
                        {
                          language
                        }
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              }
            )}

            {/* НИЖНЯЯ LOTTIE */}

            <Animated.View
              style={{
                width:
                  '100%',

                alignItems:
                  'center',

                opacity:
                  lottieOpacity,

                transform: [
                  {
                    translateY:
                      lottieTranslateY,
                  },
                ],
              }}
            >
              <LottieView
                source={require('./assets/Animation - 1740723572105.json')}
                autoPlay
                loop
                style={
                  styles.lottie
                }
              />
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

/* =====================================================
   STYLES
   ===================================================== */

const styles = StyleSheet.create({

  page: {
    flex: 1,

    backgroundColor:
      '#E3DED5',

    overflow:
      'hidden',
  },

  background: {
    position:
      'absolute',

    top: -60,
    bottom: -60,
    left: -60,
    right: -60,
  },

  keyboard: {
    flex: 1,
  },

  scroll: {
    flex: 1,

    backgroundColor:
      'transparent',
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flexGrow: 1,

    alignItems:
      'center',

    justifyContent:
      'center',

    backgroundColor:
      'transparent',
  },

  /*
   * Тень теперь находится на внешнем контейнере.
   * Его ширина 50%, а сама кнопка внутри занимает 100%.
   */

  buttonContainer: {
    width:
      '50%',

    alignItems:
      'center',

    marginBottom:
      15,
  },

  button: {
    width:
      '100%',

    padding:
      7,

    borderRadius:
      16,

    alignItems:
      'center',

    borderWidth:
      1.5,

    borderColor:
      'rgba(45,71,105,0.55)',

    overflow:
      'hidden',
  },

  shadow: {
    shadowColor:
      '#2D4769',

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity:
      0.38,

    shadowRadius:
      7,

    elevation:
      8,
  },

  text: {
    color:
      '#FFFFFF',

    fontSize:
      22,

    fontWeight:
      'bold',
  },

  lottie: {
    width:
      150,

    height:
      150,
  },
});

export default LanguageSelectionPage;