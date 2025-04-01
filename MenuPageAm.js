import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ScrollView, TouchableOpacity, Image, View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStatistics } from './stat';
import LottieView from 'lottie-react-native';

const localstyle = StyleSheet.create({
  button: {
    marginVertical: 10,
    marginHorizontal: 20,
    backgroundColor: "#0038b8",
    paddingBottom: 10,
    paddingLeft: 10,
    width: '90%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingRight: 10
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 38,
    color: 'white'
  }
});

export default function MenuPage({ route }) {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [stats, setStats] = useState({});
  const [animationFinished, setAnimationFinished] = useState(false);
  const [animationTriggered, setAnimationTriggered] = useState(false);
  const [navigateTo, setNavigateTo] = useState(null);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  const button1Opacity = useRef(new Animated.Value(0)).current;
  const button1TranslateY = useRef(new Animated.Value(250)).current;

  const button2Opacity = useRef(new Animated.Value(0)).current;
  const button2TranslateY = useRef(new Animated.Value(250)).current;

  const button3Opacity = useRef(new Animated.Value(0)).current;
  const button3TranslateY = useRef(new Animated.Value(250)).current;

  const button4Opacity = useRef(new Animated.Value(0)).current;
  const button4TranslateY = useRef(new Animated.Value(250)).current;

  const button5Opacity = useRef(new Animated.Value(0)).current;
  const button5TranslateY = useRef(new Animated.Value(250)).current;

  const button6Opacity = useRef(new Animated.Value(0)).current;
  const button6TranslateY = useRef(new Animated.Value(250)).current;

  const button7Opacity = useRef(new Animated.Value(0)).current;
  const button7TranslateY = useRef(new Animated.Value(250)).current;

  const button8Opacity = useRef(new Animated.Value(0)).current;
  const button8TranslateY = useRef(new Animated.Value(250)).current;

  const fetchStatistics = async () => {
    const exerciseIds = ['exercise1Am', 'exercise2Am', 'exercise3Am', 'exercise5Am', 'exercise6', 'exercise8', 'exercise4', 'exercise7'];
    const stats = {};
    for (let id of exerciseIds) {
      const stat = await getStatistics(id);
      stats[id] = stat ? { timesCompleted: stat.timesCompleted, averageCompletionRate: stat.averageCompletionRate ?? 0 } : { timesCompleted: 0, averageCompletionRate: 0 };
    }
    setStats(stats);
  };

  useFocusEffect(
    useCallback(() => {
      fetchStatistics();
      setAnimationFinished(false);
      setAnimationTriggered(false);
      setNavigateTo(null);
    }, [])
  );

  useEffect(() => {
    const getName = async () => {
      const storedName = await AsyncStorage.getItem('name');
      if (storedName) {
        setName(storedName);
      }
    };
    getName();
  }, []);

  const startAnimations = () => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  
    Animated.stagger(300, [
      // Меняем порядок анимаций так, чтобы они соответствовали новому порядку кнопок
      Animated.parallel([
        Animated.timing(button1Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(button1TranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(button2Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(button2TranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(button3Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(button3TranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(button6Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(button6TranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(button5Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(button5TranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(button8Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(button8TranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(button4Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(button4TranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(button7Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(button7TranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };
  

  const handlePress = (exercise) => {
    setNavigateTo(exercise);
    setAnimationTriggered(true);
  };

  useEffect(() => {
    if (animationTriggered) {
      Animated.stagger(100, [
        Animated.timing(headerOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(button1Opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(button2Opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(button3Opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(button4Opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(button5Opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(button6Opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(button7Opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(button8Opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          if (navigateTo) {
            navigation.navigate(navigateTo);
            setAnimationTriggered(false);
          }
        }, 100);
      });
    }
  }, [animationTriggered, navigateTo, navigation]);

  if (!animationFinished || animationTriggered) {
    return (
      <View style={styles.animationContainer}>
        <LottieView
          source={require('./assets/Animation - 1718360283264.json')}
          autoPlay
          loop={false}
          onAnimationFinish={() => {
            setAnimationFinished(true);
            if (!navigateTo) {
              startAnimations();
            }
          }}
          style={styles.lottie}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
        <Image
          source={require('./VERBIFY.png')}
          style={styles.image}
        />
        <Text style={styles.greeting} maxFontSizeMultiplier={1.2}>
        ሰላም, {name}! 
        </Text>
      </Animated.View>

      <View style={styles.content}>
        <Animated.Text style={[styles.titleText, { opacity: titleOpacity }]} maxFontSizeMultiplier={1.2}>
        ልምምድ ምረጥ
        </Animated.Text>

        <Animated.View style={[styles.buttonContainer, { opacity: button1Opacity, transform: [{ translateY: button1TranslateY }] }]}>
  <TouchableOpacity onPress={() => handlePress('Exercise1Am')}>
    <View style={styles.upperPart1}>
      <Text style={styles.upperText1} maxFontSizeMultiplier={1.2}>ልምምድ አንድ</Text>
      <Image source={require('./star1.png')} style={[styles.image1]} />
    </View>
    <View style={styles.upperPart2}>
      <Text style={styles.upperText} maxFontSizeMultiplier={1.2}>ከዕብራይስጥ ወደ አማርኛ የግል ስሞች ካርዶች</Text>
    </View>
    <View style={styles.lowerRight}>
      <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>የተጠናቀቀ ጊዜ   <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>{stats['exercise1Am'] ? stats['exercise1Am'].timesCompleted : 0}</Text> </Text>
      <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>አማካይ ውጤት  <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>{stats['exercise1Am'] ? stats['exercise1Am'].averageCompletionRate.toFixed(2) : 0}%</Text></Text>
    </View>
  </TouchableOpacity>
</Animated.View>

<Animated.View style={[styles.buttonContainer, { opacity: button2Opacity, transform: [{ translateY: button2TranslateY }] }]}>
  <TouchableOpacity onPress={() => handlePress('Exercise2Am')}>
    <View style={styles.upperPart1}>
      <Text style={styles.upperText1} maxFontSizeMultiplier={1.2}>ልምምድ ሁለት</Text>
      <Image source={require('./star2.png')} style={[styles.image1]} />
    </View>
    <View style={styles.upperPart2}>
      <Text style={styles.upperText} maxFontSizeMultiplier={1.2}>ከአማርኛ ወደ ዕብራይስጥ የግል ስሞች ካርዶች</Text>
    </View>
    <View style={styles.lowerRight}>
      <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>የተጠናቀቀ ጊዜ  <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>{stats['exercise2Am'] ? stats['exercise2Am'].timesCompleted : 0}</Text> </Text>
      <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>አማካይ ውጤት  <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>{stats['exercise2Am'] ? stats['exercise2Am'].averageCompletionRate.toFixed(2) : 0}%</Text></Text>
    </View>
  </TouchableOpacity>
</Animated.View>

<Animated.View style={[styles.buttonContainer, { opacity: button3Opacity, transform: [{ translateY: button3TranslateY }] }]}>
  <TouchableOpacity onPress={() => handlePress('Exercise3Am')}>
    <View style={styles.upperPart1}>
      <Text style={styles.upperText1} maxFontSizeMultiplier={1.2}>ልምምድ ሶስት</Text>
      <Image source={require('./star3.png')} style={[styles.image1]} />
    </View>
    <View style={styles.upperPart2}>
      <Text style={styles.upperText} maxFontSizeMultiplier={1.2}>በቢንያንን መለየት</Text>
    </View>
    <View style={styles.lowerRight}>
      <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>የተጠናቀቀ ጊዜ  <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>{stats['exercise3Am'] ? stats['exercise3Am'].timesCompleted : 0}</Text> </Text>
      <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>አማካይ ውጤት  <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>{stats['exercise3Am'] ? stats['exercise3Am'].averageCompletionRate.toFixed(2) : 0}%</Text></Text>
    </View>
  </TouchableOpacity>
</Animated.View>

<Animated.View style={[styles.buttonContainer, { opacity: button6Opacity, transform: [{ translateY: button6TranslateY }] }]}>
  <TouchableOpacity onPress={() => handlePress('Exercise5Am')}>
    <View style={styles.upperPart1}>
      <Text style={styles.upperText1} maxFontSizeMultiplier={1.2}>ልምምድ አራት</Text>
      <Image source={require('./star3.png')} style={[styles.image1]} />
    </View>
    <View style={styles.upperPart2}>
      <Text style={styles.upperText} maxFontSizeMultiplier={1.2}>የትእዛዝ ቅርጽ</Text>
    </View>
    <View style={styles.lowerRight}>
      <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>የተጠናቀቀ ጊዜ  <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>{stats['exercise5Am'] ? stats['exercise5Am'].timesCompleted : 0}</Text> </Text>
      <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>አማካይ ውጤት  <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>{stats['exercise5Am'] ? stats['exercise5Am'].averageCompletionRate.toFixed(2) : 0}%</Text></Text>
    </View>
  </TouchableOpacity>
</Animated.View>

<Animated.View style={[styles.buttonContainer, { opacity: button5Opacity, transform: [{ translateY: button5TranslateY }] }]}>
  <TouchableOpacity onPress={() => handlePress('Exercise6')}>
    <View style={styles.upperPart1}>
      <Text style={styles.upperText1} maxFontSizeMultiplier={1.2}>ልምምድ አምስት</Text>
      <Image source={require('./star4.png')} style={[styles.image1]} />
    </View>
    <View style={styles.upperPart2}>
      <Text style={styles.upperText} maxFontSizeMultiplier={1.2}>የአማርኛ ግስ ወደ ዕብራይስጥ መቀየር</Text>
    </View>
    <View style={styles.lowerRight}>
      <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>የተጠናቀቀ ጊዜ  <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>{stats['exercise6'] ? stats['exercise6'].timesCompleted : 0}</Text> </Text>
      <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>አማካይ ውጤት  <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>{stats['exercise6'] ? stats['exercise6'].averageCompletionRate.toFixed(2) : 0}%</Text></Text>
    </View>
  </TouchableOpacity>
</Animated.View>

<Animated.View style={[styles.buttonContainer, { opacity: button8Opacity, transform: [{ translateY: button8TranslateY }] }]}>
  <TouchableOpacity onPress={() => handlePress('Exercise8')}>
    <View style={styles.upperPart1}>
      <Text style={styles.upperText1} maxFontSizeMultiplier={1.2}>ልምምድ ስድስት</Text>
      <Image source={require('./star4.png')} style={[styles.image1]} />
    </View>
    <View style={styles.upperPart2}>
      <Text style={styles.upperText} maxFontSizeMultiplier={1.2}>የዕብራይስጥ ግስ ወደ አማርኛ መቀየር</Text>
    </View>
    <View style={styles.lowerRight}>
      <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>የተጠናቀቀ ጊዜ  <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>{stats['exercise8'] ? stats['exercise8'].timesCompleted : 0}</Text> </Text>
      <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>አማካይ ውጤት  <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>{stats['exercise8'] ? stats['exercise8'].averageCompletionRate.toFixed(2) : 0}%</Text></Text>
    </View>
  </TouchableOpacity>
</Animated.View>

<Animated.View style={[styles.buttonContainer, { opacity: button4Opacity, transform: [{ translateY: button4TranslateY }] }]}>
  <TouchableOpacity onPress={() => handlePress('Exercise4')}>
    <View style={styles.upperPart1}>
      <Text style={styles.upperText1} maxFontSizeMultiplier={1.2}>ልምምድ ሰባት</Text>
      <Image source={require('./star5.png')} style={[styles.image1]} />
    </View>
    <View style={styles.upperPart2}>
      <Text style={styles.upperText} maxFontSizeMultiplier={1.2}>የአማርኛ ግስ ወደ ዕብራይስጥ መቀየር</Text>
    </View>
    <View style={styles.lowerRight}>
      <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>የተጠናቀቀ ጊዜ  <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>{stats['exercise4'] ? stats['exercise4'].timesCompleted : 0}</Text> </Text>
      <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>አማካይ ውጤት  <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>{stats['exercise4'] ? stats['exercise4'].averageCompletionRate.toFixed(2) : 0}%</Text></Text>
    </View>
  </TouchableOpacity>
</Animated.View>

<Animated.View style={[styles.buttonContainer, { opacity: button7Opacity, transform: [{ translateY: button7TranslateY }] }]}>
  <TouchableOpacity onPress={() => handlePress('Exercise7')}>
    <View style={styles.upperPart1}>
      <Text style={styles.upperText1} maxFontSizeMultiplier={1.2}>ልምምድ ስምንት</Text>
      <Image source={require('./star5.png')} style={[styles.image1]} />
    </View>
    <View style={styles.upperPart2}>
      <Text style={styles.upperText} maxFontSizeMultiplier={1.2}>የዕብራይስጥ ግስ ወደ አማርኛ መቀየር</Text>
    </View>
    <View style={styles.lowerRight}>
      <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>የተጠናቀቀ ጊዜ  <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>{stats['exercise7'] ? stats['exercise7'].timesCompleted : 0}</Text> </Text>
      <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>አማካይ ውጤት  <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>{stats['exercise7'] ? stats['exercise7'].averageCompletionRate.toFixed(2) : 0}%</Text></Text>
    </View>
  </TouchableOpacity>
</Animated.View>


        

        <Animated.View style={{ opacity: titleOpacity }}>
          <Text style={styles.titleText}>
            СПРАВКА
          </Text>
        </Animated.View>

        <TouchableOpacity style={localstyle.button} onPress={() => handlePress('Exercise1')}>
          <View>
            <Text style={localstyle.text}>ОГЛАСОВКИ ИВРИТА</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={localstyle.button} onPress={() => handlePress('Exercise1')}>
          <View>
            <Text style={localstyle.text}>БИНЬЯНЫ ИВРИТА</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 0,
    backgroundColor: '#f0f0f0',
  },
  title: {
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  image: {
    width: 90,
    height: 90,
    marginRight: 20, // Отступ справа от изображения
    marginLeft: 5,
  },
  greeting: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D4769',
    marginLeft: 10,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#2D4769',
    marginTop: -10,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D4769',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  upperPart1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '96%',
  },
  upperPart2: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  upperText1: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2D4769',
    backgroundColor: 'white',
    padding: 3,
    borderRadius: 5,
    marginBottom: 10,
    marginLeft: 10,
  },
  upperText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  lowerRight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  lowerText: {
    fontSize: 10,
    textAlign: 'center',
    backgroundColor: 'white',
    padding: 3,
    borderRadius: 5,
    color: '#2D4769',
    fontWeight: 'bold',
    marginLeft: 1,
  },
  image1: {
    width: 100,
    height: 25,
    marginLeft: 10,
    marginRight: 10,
    marginTop: -5,
  },
  statValue: {
    color: 'red',
    fontWeight: 'bold',
    textAlignVertical: 'center',
    fontSize: 12,
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  lottie: {
    width: 300,
    height: 300,
  },
});
