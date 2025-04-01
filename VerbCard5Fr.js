// VerbCard5.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import sounds from './Soundss';
import TypewriterTextLTR from './TypewriterTextLTR';



const VerbCard5Fr = ({ verbData, onAnswer }) => {
  const [sound, setSound] = useState();
  const [pictureSource, setPictureSource] = useState();
  const fadeAnim = useRef(new Animated.Value(0)).current; // Начальное значение анимации прозрачности
  const [animationTrigger, setAnimationTrigger] = useState(0); // Добавляем состояние для триггера анимации

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    const getPictureSource = () => {
      if (verbData.gender === "people") {
        const randomIndex = Math.floor(Math.random() * imageSources.people.length);
        return imageSources.people[randomIndex];
      } else {
        return imageSources[verbData.gender];
      }
    };
  
    setPictureSource(getPictureSource());
    setAnimationTrigger(prev => prev + 1); // Обновляем триггер анимации
  }, [verbData]); // Эффект зависит от verbData

  useEffect(() => {
    fadeAnim.setValue(0); // Сбрасываем прозрачность до 0 перед началом новой анимации

    Animated.timing(fadeAnim, {
      toValue: 1, // Конечное значение анимации (полностью непрозрачный)
      duration: 1000, // Продолжительность анимации
      useNativeDriver: true, // Используем нативный драйвер для лучшей производительности
    }).start();
}, [animationTrigger]); // Теперь эффект зависит от animationTrigger

  const playAudio = async (audioFileName) => {
    try {
        // Обрезаем расширение .mp3, если оно присутствует в audioFileName
        const fileNameKey = audioFileName.replace('.mp3', '');
        const audioFile = sounds[fileNameKey];
        
        if (!audioFile) {
            console.error(`Audio file ${audioFileName} not found.`);
            return;
        }
        
        // Выгружаем предыдущий звук, если он есть
        await sound?.unloadAsync();
        
        const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
        setSound(newSound);
        await newSound.playAsync();
    } catch (error) {
        console.error('Error loading sound', error);
    }
};

const imageSources = {
    man: require('./man.png'),
    woman: require('./woman.png'),
    people: [
      require('./people.png'),
      require('./men.png'),
      require('./women.png'),
    ],
  };

  useEffect(() => {
    // Объект сопоставления для изображений
    const imageSources = {
      man: require('./man.png'),
      woman: require('./woman.png'),
      people: [
        require('./people.png'),
        require('./men.png'),
        require('./women.png'),
      ],
    };

    const getPictureSource = () => {
      if (verbData.gender === "people") {
        const randomIndex = Math.floor(Math.random() * imageSources.people.length);
        return imageSources.people[randomIndex];
      } else {
        return imageSources[verbData.gender];
      }
    };

    setPictureSource(getPictureSource());
  }, [verbData]); // Этот эффект зависит от verbData, и обновит изображение только если verbData изменился

  if (!pictureSource) {
    return <View><Text>Loading...</Text></View>; // Или другой загрузочный экран
  }



  const shuffleArray = (array) => {
    const shuffledArray = array.slice();
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  };

  const generateOptions = (verbData) => {
    const correctAnswerIndex = parseInt(verbData.correctTranslationIndex, 10); 
    const correctTranslation = verbData.translationOptions[correctAnswerIndex];
    const correctMp4 = verbData.mp4[correctAnswerIndex]; // Получаем правильную транслитерацию mp4
  
    const incorrectOptions = verbData.translationOptions.filter(
      (_, index) => index !== correctAnswerIndex
    );
    const incorrectMp4Options = verbData.mp4.filter(
      (_, index) => index !== correctAnswerIndex
    );
  
    const shuffledOptions = shuffleArray(
      incorrectOptions.map((option, index) => ({
        text: option,
        mp4Text: incorrectMp4Options[index], // Соответствующая транслитерация
        isCorrect: false,
        isSelected: false,
        index,
        mp3: verbData.mp3
      }))
    );
  
    shuffledOptions.splice(
      Math.floor(Math.random() * (shuffledOptions.length + 1)),
      0,
      {
        text: correctTranslation,
        mp4Text: correctMp4, // Транслитерация правильного ответа
        isCorrect: true,
        isSelected: false,
        index: shuffledOptions.length,
        mp3: verbData.mp3
      }
    );
  
    return shuffledOptions;
  };
  
  
  
  

  

  return (
    <View style={styles.screenContainer}>

<View style={styles.lowerContainer}>
      <Animated.View style={[styles.hebrewVerbContainer, { opacity: fadeAnim }]}>
        <View style={styles.textWrapper}>
          <Text style={styles.hebrewVerb}maxFontSizeMultiplier={1.2}>{verbData.hebrewVerb}</Text>
        </View>
        <View style={styles.textWrapper}>
          <Text style={styles.translit}maxFontSizeMultiplier={1.2}>{`${verbData.transliteration}`}</Text>
        </View>
        <View style={styles.textWrapper}>
          <Text style={styles.root}maxFontSizeMultiplier={1.2}>{`${verbData.root}`}</Text>
        </View>
        <TouchableOpacity onPress={() => playAudio(verbData.audioFile)} style={styles.audioButton}>
          <Image source={require('./speaker6.png')} style={styles.audioIcon} />
        </TouchableOpacity>
      </Animated.View>
    </View>

    <View style={styles.upperContainer}>
      <View style={styles.leftContainer}>
        <TypewriterTextLTR text={verbData.ImperFr} typingSpeed={40} style={styles.impertext}maxFontSizeMultiplier={1.2}/>
        {/* <Text style={styles.Imper}>{verbData.Imper}</Text> */}
      </View>
      <View style={styles.rightContainer}>
        <Animated.Image
          source={pictureSource}
          style={[
            styles.image,
            { opacity: fadeAnim } // Применяем анимированное значение прозрачности
          ]}
        />
      </View>
    </View>

    
    </View>
 
  );

};

  
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    width: '100%',
    // backgroundColor: '#FFFDEF',
  },
  upperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '66%',
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: '#FFFDEF',
    borderRadius: 10,
    marginBottom: 20,
    marginTop: 15
  },

  leftContainer: {
    flex: 1,
    justifyContent: 'center',
    // alignItems: 'center',
    
  },

  impertext: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 28,
  },

  lowerContainer: {
    width: '100%',
    height: '20%',
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: '#FFFDEF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hebrewVerbContainer: {
    flexDirection: 'row',
    // alignItems: 'center',
    // justifyContent: 'center',
    // height: '100%',
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // paddingVertical: 15, // Регулируемые вертикальные отступы
  },
  hebrewVerb: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333652',
    // marginBottom: -5
  },
  translit: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#CE6857',
  },
  root: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4C7031',
  },
  audioButton: {
    marginLeft: 10,
    marginRight: 10,
  },
  audioIcon: {
    width: 22,
    height: 22,
    borderRadius: 10,
  },
  image: {
    width: 120,
    height: 120,
  },
});

export default VerbCard5Fr;
