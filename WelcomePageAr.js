import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import AppDescriptionModal from './AppDescriptionModalAr';
import AppInfoModal from './AppInfoModalAr';
import { useIap } from './src/iap/IapProvider';

export default function WelcomePage({ navigation, route }) {
  const [name, setName] = useState('');
  const language = route.params?.language || 'العربية';
  const [animationFinished, setAnimationFinished] = useState(false);
  const [shadowVisible, setShadowVisible] = useState(false);

  const { accessState = 'checking', hasPro } = useIap();

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

  const animationsStartedRef = useRef(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);

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
  ]);

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
          console.error('Ошибка при загрузке имени:', error);
        }
      };

      fetchName();

      const onBackPress = () => {
        navigation.replace('LanguageSelectionPage');
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => {
        isActive = false;
        backHandler.remove();
      };
    }, [navigation, resetAnimations])
  );

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
    });
  }, [navigation]);

  useEffect(() => {
    if (animationFinished && !animationsStartedRef.current) {
      animationsStartedRef.current = true;
      startAnimations();
    }
  }, [animationFinished]);

  const handleNameChange = async (text) => {
    setName(text);
    await AsyncStorage.setItem('name', text);
  };

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
      ]),
    ]).start(() => {
      setShadowVisible(true);
    });
  };

  const handleNextPress = async () => {
    if (!name.trim()) return;

    try {
      await AsyncStorage.setItem('name', name.trim());
      await AsyncStorage.setItem('language', language);

      if (accessState === 'checking') return;

      if (hasPro) {
        navigation.replace('MenuAr', { name: name.trim() });
        return;
      }

      navigation.replace(Platform.OS === 'ios' ? 'PaywallIOS' : 'Paywall', {
        from: 'WelcomePageAr',
      });
    } catch (e) {
      console.error('Ошибка при переходе:', e);
    }
  };

  if (!animationFinished) {
    return (
      <View style={styles.animationContainer}>
        <LottieView
          source={require('./assets/Animation - 1718360283264.json')}
          autoPlay
          loop={false}
          onAnimationFinish={() => setAnimationFinished(true)}
          style={styles.lottie}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Animated.View
            style={[
              styles.imageContainer,
              { opacity: imageOpacity, transform: [{ translateX: imageTranslateX }] },
            ]}
          >
            <Image source={require('./VERBIFY.png')} style={styles.image} />
          </Animated.View>

          <Animated.Text
            style={[
              styles.title,
              { opacity: titleOpacity, transform: [{ translateX: titleTranslateX }] },
            ]}
            maxFontSizeMultiplier={1.2}
          >
            أدخل اسمك
          </Animated.Text>

          <Animated.View
            style={[
              styles.inputContainer,
              { opacity: inputOpacity, transform: [{ translateX: inputTranslateX }] },
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="اسمك"
              value={name}
              onChangeText={handleNameChange}
              maxLength={20}
              maxFontSizeMultiplier={1.2}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.buttonContainer,
              { opacity: buttonOpacity, transform: [{ translateX: buttonTranslateX }] },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonEnabled,
                shadowVisible && styles.shadow,
                (name.trim().length === 0 || accessState === 'checking') && styles.buttonDisabled,
              ]}
              onPress={handleNextPress}
              disabled={name.trim().length === 0 || accessState === 'checking'}
            >
              <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>
                {accessState === 'checking' ? 'جارٍ التحميل...' : 'التالي'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.picContainer,
              { opacity: picOpacity, transform: [{ translateX: picTranslateX }] },
            ]}
          >
            <Image source={require('./PICAR.png')} style={styles.picImage} />
          </Animated.View>
        </View>
      </ScrollView>

      <Animated.View
        style={[
          styles.topIconsContainer,
          { opacity: picOpacity, transform: [{ translateX: picTranslateX }] },
        ]}
      >
        <TouchableOpacity onPress={() => setIsModalVisible(true)}>
          <Image source={require('./question1.png')} style={styles.topIcon} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsInfoModalVisible(true)}>
          <Image source={require('./about3.png')} style={styles.topIcon} />
        </TouchableOpacity>
      </Animated.View>

      <AppDescriptionModal
        visible={isModalVisible}
        onToggle={() => setIsModalVisible(false)}
      />

      <AppInfoModal
        visible={isInfoModalVisible}
        onToggle={() => setIsInfoModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 50,
    backgroundColor: '#AFC1D0',
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#AFC1D0',
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
    borderColor: '#2D4769',
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 10,
    fontWeight: 'bold',
    fontSize: 20,
    color: '#2D4769',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: undefined,
    paddingVertical: Platform.OS === 'ios' ? 0 : 8,
  },
  buttonContainer: {
    width: '80%',
    marginBottom: 30,
  },
  button: {
    borderRadius: 10,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  buttonEnabled: {
    backgroundColor: '#4A6491',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    top: Platform.OS === 'ios' ? 50 : 20,
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