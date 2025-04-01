import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';

const LanguageSelectionPage = ({ navigation }) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const lottieOpacity = useRef(new Animated.Value(0)).current;
  const lottieTranslateY = useRef(new Animated.Value(300)).current;
  const buttonOpacities = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  const buttonTranslations = [
    useRef(new Animated.Value(300)).current,
    useRef(new Animated.Value(300)).current,
    useRef(new Animated.Value(300)).current,
    useRef(new Animated.Value(300)).current,
    useRef(new Animated.Value(300)).current,
    useRef(new Animated.Value(300)).current,
    useRef(new Animated.Value(300)).current,
  ];
  const buttonBackgroundColors = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  const [shadowVisible, setShadowVisible] = useState(false);

  useEffect(() => {
    const checkLanguage = async () => {
      const storedLanguage = await AsyncStorage.getItem('language');
      const storedName = await AsyncStorage.getItem('name');

      if (storedLanguage && storedName) {
        // Вместо немедленного перехода на другой экран, сначала запускаем анимации
        startAnimations(() => {
          // После завершения анимаций, переходим на нужный экран
          navigateToLanguageScreen(storedLanguage, storedName);
        });
      } else {
        startAnimations();
      }
    };

    const startAnimations = (callback) => {
      // Запускаем анимацию лого
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      // Запускаем анимацию кнопок
      buttonOpacities.forEach((opacity, index) => {
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          delay: 1000 + index * 300,
          useNativeDriver: true,
        }).start();
        Animated.timing(buttonTranslations[index], {
          toValue: 0,
          duration: 500,
          delay: 1000 + index * 300,
          useNativeDriver: true,
        }).start();
        Animated.timing(buttonBackgroundColors[index], {
          toValue: 1,
          duration: 1000,
          delay: 1000 + index * 300,
          useNativeDriver: false,
        }).start(() => {
          if (index === buttonOpacities.length - 1) {
            setShadowVisible(true);
          }
        });
      });

      // Запускаем анимацию Lottie
      Animated.timing(lottieOpacity, {
        toValue: 1,
        duration: 500,
        delay: 1000 + buttonOpacities.length * 300,
        useNativeDriver: true,
      }).start();

      Animated.timing(lottieTranslateY, {
        toValue: 0,
        duration: 500,
        delay: 1000 + buttonOpacities.length * 300,
        useNativeDriver: true,
      }).start(() => {
        if (callback) {
          callback(); // Выполняем callback после завершения всех анимаций
        }
      });
    };

    checkLanguage();
  }, [navigation]);

  const navigateToLanguageScreen = (language, name) => {
    switch (language) {
      case 'english':
        navigation.navigate('WelcomeEn', { name, language });
        break;
      case 'français':
        navigation.navigate('WelcomeFr', { name, language });
        break;
      case 'español':
        navigation.navigate('WelcomeEs', { name, language });
        break;
      case 'português':
        navigation.navigate('WelcomePt', { name, language });
        break;
        case 'العربية':
        navigation.navigate('WelcomeAr', { name, language });
        break;
        case 'አማርኛ':
        navigation.navigate('WelcomeAm', { name, language });
        break;
      default:
        navigation.navigate('Welcome', { name, language }); // По умолчанию русский
    }
  };

  const handleSelectLanguage = async (language) => {
    Vibration.vibrate(50);
    await AsyncStorage.setItem('language', language); // Сохраняем выбранный язык

    // Переход на соответствующий экран в зависимости от языка
    navigateToLanguageScreen(language.toLowerCase());
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: logoOpacity }}>
        <LottieView
          source={require('./assets/Animation - 1718510308187.json')}
          autoPlay
          loop={true}
          style={styles.lottie}
        />
      </Animated.View>
      {['English', 'Русский', 'Français', 'Español', 'Português', 'العربية', 'አማርኛ'].map((language, index) => {
        const interpolatedBackgroundColor = buttonBackgroundColors[index].interpolate({
          inputRange: [0, 1],
          outputRange: ['#6C8EBB', '#4A6491'],
        });

        return (
          <Animated.View
            key={language}
            style={[
              styles.buttonContainer,
              {
                opacity: buttonOpacities[index],
                transform: [{ translateY: buttonTranslations[index] }],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: interpolatedBackgroundColor,
                  ...(shadowVisible ? styles.shadow : {}),
                },
              ]}
              onPress={() => handleSelectLanguage(language.toLowerCase())}
            >
              <Text style={styles.text} maxFontSizeMultiplier={1.2}>{language} </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
      <Animated.View
        style={{
          width: '100%',
          alignItems: 'center',
          opacity: lottieOpacity,
          transform: [{ translateY: lottieTranslateY }],
        }}
      >
        <LottieView
          source={require('./assets/Animation - 1718343841546.json')}
          autoPlay
          loop
          style={styles.lottie}
          onAnimationFinish={() => console.log('Animation finished')}
          onLayout={() => console.log('LottieView layout finished')}
          onError={(error) => console.log('Lottie error: ', error)}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#AFC1D0',
  },
  logo: {
    width: 200,
    height: 100,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  button: {
    padding: 5,
    borderRadius: 10,
    width: '50%',
    alignItems: 'center',
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
  text: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  lottie: {
    width: 150,
    height: 150,
  },
});

export default LanguageSelectionPage;
