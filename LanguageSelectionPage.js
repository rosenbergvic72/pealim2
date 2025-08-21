import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Vibration, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from '@react-navigation/native';

let didAutoNavigate = false;

const LanguageSelectionPage = ({ navigation }) => {
  const [firstLoad, setFirstLoad] = useState(true);
  const [shadowVisible, setShadowVisible] = useState(false);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const lottieOpacity = useRef(new Animated.Value(0)).current;
  const lottieTranslateY = useRef(new Animated.Value(300)).current;

  const buttonOpacities = [...Array(7)].map(() => useRef(new Animated.Value(0)).current);
  const buttonTranslations = [...Array(7)].map(() => useRef(new Animated.Value(300)).current);
  const buttonBackgroundColors = [...Array(7)].map(() => useRef(new Animated.Value(0)).current);

  const startAnimations = (callback) => {
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

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
          if (callback) callback();
        }
      });
    });

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
    }).start();
  };

  useEffect(() => {
    const checkLanguage = async () => {
      const storedLanguage = await AsyncStorage.getItem('language');
      const storedName = await AsyncStorage.getItem('name');

      if (storedLanguage && storedName && firstLoad && !didAutoNavigate) {
        didAutoNavigate = true; // предотвратить дальнейшие переходы
        setFirstLoad(false);
        startAnimations(() => {
          navigateToLanguageScreen(storedLanguage, storedName);
        });
      } else {
        startAnimations(); // просто запустить анимации
      }
    };

    checkLanguage();
  }, [firstLoad]);

  useFocusEffect(
    useCallback(() => {
      setFirstLoad(false); // при возврате отключаем автопереход
    }, [])
  );

  const handleSelectLanguage = async (language) => {
    Vibration.vibrate(50);
    await AsyncStorage.setItem('language', language);
    navigateToLanguageScreen(language);
  };

  const navigateToLanguageScreen = (language, name = '') => {
    switch (language) {
      case 'english':
        navigation.navigate('WelcomeEn', { name, language });
        break;
      case 'русский':
        navigation.navigate('Welcome', { name, language });
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
        navigation.navigate('Welcome', { name, language });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Animated.View style={{ opacity: logoOpacity }}>
            <LottieView
              source={require('./assets/Animation - 1718510308187.json')}
              autoPlay
              loop
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
                  <Text style={styles.text} maxFontSizeMultiplier={1.2}>{language}</Text>
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
              source={require('./assets/Animation - 1740723572105.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#AFC1D0',
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
    shadowOffset: { width: 0, height: 2 },
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
