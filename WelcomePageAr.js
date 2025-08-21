import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Animated, BackHandler, KeyboardAvoidingView, Platform, ScrollView  } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppDescriptionModal from './AppDescriptionModalAr'; // Подключаем модальное окно
import AppInfoModal from './AppInfoModalAr'; // Подключаем модальное окно


export default function WelcomePage({ navigation, route }) {
  const [name, setName] = useState('');
  const language = route.params?.language || 'العربية'; // Фикс: если language undefined, используем 'english'
  const [animationFinished, setAnimationFinished] = useState(false);

  const imageOpacity = useRef(new Animated.Value(0)).current;
  const imageTranslateX = useRef(new Animated.Value(-100)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateX = useRef(new Animated.Value(-100)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const inputTranslateX = useRef(new Animated.Value(-100)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateX = useRef(new Animated.Value(-100)).current;
  const buttonBackgroundColor = useRef(new Animated.Value(0)).current;
  const [shadowVisible, setShadowVisible] = useState(false);
  const picOpacity = useRef(new Animated.Value(0)).current;
  const picTranslateX = useRef(new Animated.Value(-100)).current;
  const [isModalVisible, setIsModalVisible] = useState(false); // Состояние для модального окна
      const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
   

  // Загружаем имя при каждом возврате на экран и перезапускаем анимацию
  useFocusEffect(
    useCallback(() => {
      const fetchName = async () => {
        try {
          const storedName = await AsyncStorage.getItem('name');
          if (storedName) {
            setName(storedName);
          }
          setAnimationFinished(false);
          setTimeout(() => setAnimationFinished(true), 100);
        } catch (error) {
          console.error('Ошибка при загрузке имени:', error);
        }
      };
      fetchName();

      const onBackPress = () => {
        navigation.replace('LanguageSelect'); // Возвращаемся на экран выбора языка
        return true; // Перехватываем стандартное поведение
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => backHandler.remove();
    }, [navigation])
  );

  useEffect(() => {
      navigation.setOptions({
        headerLeft: () => null, // Убирает кнопку "Назад" в заголовке
      });
    }, [navigation]);

  // Загружаем сохранённое имя при запуске
  useEffect(() => {
    const getNameAndAnimate = async () => {
      const storedName = await AsyncStorage.getItem('name');
      if (storedName) {
        setName(storedName); // Если имя сохранено, оно будет автоматически подставлено
      }
      if (animationFinished) {
        startAnimations();
      }
    };
    getNameAndAnimate();
  }, [animationFinished]);

  // Сохраняем имя при каждом изменении
  const handleNameChange = async (text) => {
    setName(text);
    await AsyncStorage.setItem('name', text); // Сохраняем имя в AsyncStorage
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
        Animated.timing(buttonBackgroundColor, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
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

  // Обработка нажатия кнопки "Далее"
  const handleNextPress = async () => {
    await AsyncStorage.setItem('name', name); // Сохраняем имя при нажатии "Далее"
    await AsyncStorage.setItem('language', language); 
    navigation.navigate('MenuAr', { name });
  };

  const interpolatedBackgroundColor = buttonBackgroundColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#6C8EBB', '#4A6491'],
  });

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
      <Animated.View style={[styles.imageContainer, { opacity: imageOpacity, transform: [{ translateX: imageTranslateX }] }]}>
        <Image source={require('./VERBIFY.png')} style={styles.image} />
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateX: titleTranslateX }] }]} maxFontSizeMultiplier={1.2}>
      أدخل اسمك
      </Animated.Text>
      <Animated.View style={[styles.inputContainer, { opacity: inputOpacity, transform: [{ translateX: inputTranslateX }] }]}>
        <TextInput
          style={styles.input}
          placeholder="اسمك"
          value={name}
          onChangeText={handleNameChange} // Сохраняем имя при изменении текста
          maxLength={20}
          maxFontSizeMultiplier={1.2}
        />
      </Animated.View>
      <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity, transform: [{ translateX: buttonTranslateX }] }]}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: interpolatedBackgroundColor },
            shadowVisible && styles.shadow,
            name.trim().length === 0 && styles.buttonDisabled, 
          ]}
          onPress={handleNextPress}
          disabled={name.length === 0}
        >
          <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>التالي</Text>
        </TouchableOpacity>
      </Animated.View>

<Animated.View style={[styles.picContainer, { opacity: picOpacity, transform: [{ translateX: picTranslateX }] }]}>
        <Image source={require('./PICAR.png')} style={styles.picImage} />
      </Animated.View>

     </View>
          </ScrollView>

<Animated.View style={[styles.topIconsContainer, { opacity: picOpacity, transform: [{ translateX: picTranslateX }] }]}>
      {/* <View style={styles.topIconsContainer}> */}
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
  imageContainer: {
    // marginBottom: 20,
  },
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
    padding: 8,
    borderRadius: 10,
    fontWeight: 'bold',
    fontSize: 20,
    color: '#2D4769',
    textAlign: 'center',
    lineHeight: 36,
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
    width: 230, // адаптивный размер
    height: 230,
    // resizeMode: 'contain',
  },
  lottie: {
    width: 300,
    height: 300,
  },
  topIconsContainer: {
  position: 'absolute',
  top: Platform.OS === 'ios' ? 50 : 20, // учитываем статусбар на iOS
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
  opacity: 0.4, // затемнение
},
});
