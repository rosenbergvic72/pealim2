import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import AppDescriptionModal from './AppDescriptionModal';
import AppInfoModal from './AppInfoModal';

// import { useIap } from './src/iap/IapProvider';

export default function WelcomePage({ navigation, route }) {
  const [name, setName] = useState('');
  const language = route.params?.language || 'русский';
  const [animationFinished, setAnimationFinished] = useState(false);
  const [shadowVisible, setShadowVisible] = useState(false);

  // const { accessState = 'checking', hasPro } = useIap();

  const imageOpacity = useRef(new Animated.Value(0)).current;
  const imageTranslateX = useRef(new Animated.Value(-100)).current;

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateX = useRef(new Animated.Value(-100)).current;

  const inputOpacity = useRef(new Animated.Value(0)).current;
  const inputTranslateX = useRef(new Animated.Value(-100)).current;

  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateX = useRef(new Animated.Value(-100)).current;

  const picOpacity = useRef(new Animated.Value(0)).current;
  const picTranslateX = useRef(new Animated.Value(-100)).current;

  const buttX = useRef(new Animated.Value(-100)).current;

  const animationsStartedRef = useRef(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);

  /* =====================================================
     МЯГКИЙ ЖИВОЙ ФОН
     ===================================================== */

  const bgScale = useRef(new Animated.Value(1)).current;
  const bgX = useRef(new Animated.Value(0)).current;
  const bgY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
  const backgroundAnimation = Animated.loop(
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

  backgroundAnimation.start();

  return () => {
    backgroundAnimation.stop();
  };
}, [bgScale, bgX, bgY]);

  /* =====================================================
     СБРОС АНИМАЦИЙ
     ===================================================== */

  const resetAnimations = useCallback(() => {
    imageOpacity.setValue(0);
    imageTranslateX.setValue(-100);

    titleOpacity.setValue(0);
    titleTranslateX.setValue(-100);

    inputOpacity.setValue(0);
    inputTranslateX.setValue(-100);

    buttonOpacity.setValue(0);
    buttonTranslateX.setValue(-100);

    picOpacity.setValue(0);
    picTranslateX.setValue(-100);

    buttX.setValue(-100);

    setShadowVisible(false);

    animationsStartedRef.current = false;
  }, [
    imageOpacity,
    imageTranslateX,
    titleOpacity,
    titleTranslateX,
    inputOpacity,
    inputTranslateX,
    buttonOpacity,
    buttonTranslateX,
    picOpacity,
    picTranslateX,
    buttX,
  ]);

  /* =====================================================
     FOCUS
     ===================================================== */

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchName = async () => {
        try {
          const storedName = await AsyncStorage.getItem('name');

          if (isActive && storedName) {
            setName(storedName);
          }

          if (isActive) {
            resetAnimations();
            setAnimationFinished(false);
          }
        } catch (error) {
          console.error(
            'Ошибка при загрузке имени:',
            error
          );
        }
      };

      fetchName();

      const onBackPress = () => {
        navigation.replace('LanguageSelectionPage');
        return true;
      };

      const backHandler =
        BackHandler.addEventListener(
          'hardwareBackPress',
          onBackPress
        );

      return () => {
        isActive = false;
        backHandler.remove();
      };
    }, [navigation, resetAnimations])
  );

  /* =====================================================
     HEADER
     ===================================================== */

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
    });
  }, [navigation]);

  /* =====================================================
     ЗАПУСК АНИМАЦИЙ
     ===================================================== */

  useEffect(() => {
    if (
      animationFinished &&
      !animationsStartedRef.current
    ) {
      animationsStartedRef.current = true;
      startAnimations();
    }
  }, [animationFinished]);

  const handleNameChange = async text => {
    setName(text);

    await AsyncStorage.setItem(
      'name',
      text
    );
  };

  /* =====================================================
     АНИМАЦИИ КОНТЕНТА
     ===================================================== */

  const startAnimations = () => {
    Animated.stagger(300, [
      Animated.parallel([
        Animated.timing(imageOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),

        Animated.timing(imageTranslateX, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),

        Animated.timing(titleTranslateX, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(inputOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),

        Animated.timing(inputTranslateX, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),

        Animated.timing(buttonTranslateX, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(picOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),

        Animated.timing(picTranslateX, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),

        Animated.timing(buttX, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setShadowVisible(true);
    });
  };

  /* =====================================================
     ДАЛЕЕ
     ===================================================== */

  const handleNextPress = async () => {
    if (!name.trim()) return;

    try {
      await AsyncStorage.setItem(
        'name',
        name.trim()
      );

      await AsyncStorage.setItem(
        'language',
        language
      );

      await AsyncStorage.setItem(
        'verbify_first_launch_completed',
        '1'
      );

      navigation.replace('Menu', {
        name: name.trim(),

        internalTrialActive:
          !!route?.params?.internalTrialActive,

        internalTrialEndsAt:
          route?.params?.internalTrialEndsAt ||
          null,
      });
    } catch (e) {
      console.error(
        'Ошибка при переходе:',
        e
      );
    }
  };

  /* =====================================================
     СТАРТОВАЯ LOTTIE
     ===================================================== */

  if (!animationFinished) {
    return (
      <View style={styles.animationContainer}>
        <LottieView
          source={require('./assets/Animation - 1718360283264.json')}
          autoPlay
          loop={false}
          onAnimationFinish={() =>
            setAnimationFinished(true)
          }
          style={styles.lottie}
        />
      </View>
    );
  }

  /* =====================================================
     ОСНОВНОЙ ЭКРАН
     ===================================================== */

  return (
    <View style={styles.page}>
      {/* ФОН */}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.background,
          {
            transform: [
              {
                translateX: bgX,
              },
              {
                translateY: bgY,
              },
              {
                scale: bgScale,
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
  style={StyleSheet.absoluteFillObject}
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
          <View style={styles.container}>
            {/* LOGO */}

            <Animated.View
              style={[
                styles.imageContainer,
                {
                  opacity:
                    imageOpacity,

                  transform: [
                    {
                      translateX:
                        imageTranslateX,
                    },
                  ],
                },
              ]}
            >
              <Image
                source={require('./VERBIFY.png')}
                style={styles.image}
              />
            </Animated.View>

            {/* TITLE */}

            <Animated.Text
              style={[
                styles.title,
                {
                  opacity:
                    titleOpacity,

                  transform: [
                    {
                      translateX:
                        titleTranslateX,
                    },
                  ],
                },
              ]}
              maxFontSizeMultiplier={1.2}
            >
              Введите своё имя
            </Animated.Text>

            {/* INPUT */}

            <Animated.View
              style={[
                styles.inputContainer,
                {
                  opacity:
                    inputOpacity,

                  transform: [
                    {
                      translateX:
                        inputTranslateX,
                    },
                  ],
                },
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="ваше имя"
                placeholderTextColor="rgba(45,71,105,0.55)"
                value={name}
                onChangeText={
                  handleNameChange
                }
                maxLength={20}
                maxFontSizeMultiplier={1.2}
              />
            </Animated.View>

            {/* BUTTON */}

           <Animated.View
  style={[
    styles.buttonContainer,
    shadowVisible && styles.shadow,
    {
      opacity: buttonOpacity,
      transform: [
        {
          translateX: buttonTranslateX,
        },
      ],
    },
  ]}
>
  <TouchableOpacity
    activeOpacity={0.8}
    style={[
      styles.button,
      styles.buttonEnabled,
      name.trim().length === 0 &&
        styles.buttonDisabled,
    ]}
    onPress={handleNextPress}
    disabled={name.trim().length === 0}
  >
    <Text
      style={styles.buttonText}
      maxFontSizeMultiplier={1.2}
    >
      ДАЛЕЕ
    </Text>
  </TouchableOpacity>
</Animated.View>

            {/* PICTURE */}

            <Animated.View
              style={[
                styles.picContainer,
                {
                  opacity:
                    picOpacity,

                  transform: [
                    {
                      translateX:
                        picTranslateX,
                    },
                  ],
                },
              ]}
            >
              <Image
                source={require('./PICRU.png')}
                style={
                  styles.picImage
                }
              />
            </Animated.View>

            {/* TOP ICONS */}

            <Animated.View
              style={[
                styles.topIconsContainer,
                {
                  opacity:
                    picOpacity,

                  transform: [
                    {
                      translateX:
                        buttX,
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                onPress={() =>
                  setIsModalVisible(
                    true
                  )
                }
              >
                <Image
                  source={require('./question1.png')}
                  style={
                    styles.topIcon
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setIsInfoModalVisible(
                    true
                  )
                }
              >
                <Image
                  source={require('./about3.png')}
                  style={
                    styles.topIcon
                  }
                />
              </TouchableOpacity>
            </Animated.View>

            <AppDescriptionModal
              visible={
                isModalVisible
              }
              onToggle={() =>
                setIsModalVisible(
                  false
                )
              }
            />

            <AppInfoModal
              visible={
                isInfoModalVisible
              }
              onToggle={() =>
                setIsInfoModalVisible(
                  false
                )
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* =====================================================
   STYLES
   ===================================================== */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    bbackgroundColor: '#E3DED5',
    overflow: 'hidden',
  },

  background: {
    position: 'absolute',
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
    backgroundColor: 'transparent',
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 50,
    backgroundColor: 'transparent',
  },

  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
   backgroundColor: '#E3DED5',
  },

  imageContainer: {},

  title: {
    marginBottom: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D4769',
  },

  inputContainer: {
    width: '80%',
    marginBottom: 20,
  },

input: {
  height: 50,
  borderColor: 'rgba(45,71,105,0.55)',
  borderWidth: 1.5,
  paddingHorizontal: 8,
  borderRadius: 16,
  fontWeight: 'bold',
  fontSize: 20,
  color: '#2D4769',
  textAlign: 'center',
  textAlignVertical: 'center',
  lineHeight: undefined,

  paddingVertical:
    Platform.OS === 'ios'
      ? 0
      : 8,

  backgroundColor:
    'rgba(255,255,255,0.30)',
},

buttonContainer: {
  width: '80%',
  marginBottom: 30,

  shadowColor: '#2D4769',
  shadowOffset: {
    width: 0,
    height: 5,
  },
  shadowOpacity: 0.38,
  shadowRadius: 7,
  elevation: 8,
},

button: {
  width: '100%',
  borderRadius: 16,
  padding: 10,
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 48,

  borderWidth: 1.5,
  borderColor: 'rgba(45,71,105,0.55)',

  overflow: 'hidden',
},

buttonEnabled: {
  backgroundColor:
    'rgba(74,100,145,0.72)',
},

  shadow: {
    shadowColor: '#526B8D',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.18,

    shadowRadius: 8,

    elevation: 4,
  },

  buttonText: {
    color: 'white',

    fontSize: 18,

    fontWeight: 'bold',
  },

  image: {
    width: 140,
    height: 140,
  },

  picImage: {
    width: 230,
    height: 230,
  },

  lottie: {
    width: 300,
    height: 300,
  },

  topIconsContainer: {
    position: 'absolute',

    top:
      Platform.OS === 'ios'
        ? 50
        : 20,

    right: 20,

    flexDirection: 'row',

    zIndex: 10,
  },

  topIcon: {
    width: 36,

    height: 36,

    marginLeft: 15,
  },

  buttonDisabled: {
    opacity: 0.4,
  },
});