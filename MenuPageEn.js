import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Image,
  View,
  Text,
  StyleSheet,
  Animated,
  BackHandler,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStatistics } from './stat';
import LottieView from 'lottie-react-native';
import AppDescriptionModal from './AppDescriptionModalEn';
import AppInfoModal from './AppInfoModalEn';
import FadeInView from './api/FadeInView';
import { ensureMarkedToday } from './serverPush';
import { useIap } from './src/iap/IapProvider';
import StatsReportModalMulti from './StatsReportModalMulti';
import Constants from 'expo-constants';

// первые 2 упражнения — всегда бесплатны
const FREE_ROUTES_EN = new Set(['Exercise1En', 'Exercise2En']);

const localstyle = StyleSheet.create({
  button: {
    marginVertical: 10,
    marginHorizontal: 20,
    backgroundColor: '#0038b8',
    paddingBottom: 10,
    paddingLeft: 10,
    width: '90%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingRight: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 38,
    color: 'white',
  },
});

export default function MenuPage({ route }) {
  const navigation = useNavigation();
  const { hasPro } = useIap();

  // приглушённый вид заблокированных карточек (без бейджа/иконок)
  const lockStyle = { opacity: 0.45, backgroundColor: '#6f7f90' };
  const isLocked = (routeName) => !hasPro && !FREE_ROUTES_EN.has(routeName);

  const [name, setName] = useState('');
  const [stats, setStats] = useState({});
  const [animationFinished, setAnimationFinished] = useState(false);
  const [animationTriggered, setAnimationTriggered] = useState(false);
  const [navigateTo, setNavigateTo] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [totalExercisesCompleted, setTotalExercisesCompleted] = useState(0);
  const [averageCompletionRate, setAverageCompletionRate] = useState(0);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [activeDays, setActiveDays] = useState(0);
  const [statsAnimationFinished, setStatsAnimationFinished] = useState(false);
  const [exitConfirmationVisible, setExitConfirmationVisible] = useState(false);
  const [isStatModalVisible, setIsStatModalVisible] = useState(false);
  const [isDescriptionModalVisible, setIsDescriptionModalVisible] = useState(false);

  // useEffect(() => {
  //   navigation.setOptions({ headerLeft: () => null });
  // }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      setExitConfirmationVisible(false);
      setIsStatModalVisible(false);
      setIsDescriptionModalVisible(false);
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      console.log('Current Stack:', navigation.getState());
    }, [navigation])
  );

  useEffect(() => {
    const onBackPress = () => {
      navigation.reset({ index: 0, routes: [{ name: 'WelcomeEn' }] });
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [navigation]);

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

  const button9Opacity = useRef(new Animated.Value(0)).current;
  const button9TranslateY = useRef(new Animated.Value(250)).current;

  const PREVIOUS_TOTAL_KEY = 'previousTotalExercises';

  const fetchStatistics = async () => {
    const exerciseIds = [
      'exercise1En',
      'exercise2En',
      'exercise3En',
      'exercise5En',
      'exercise6En',
      'exercise8En',
      'exercise4En',
      'exercise7En',
    ];
    const statsData = {};

    for (let id of exerciseIds) {
      const stat = await getStatistics(id);
      statsData[id] = stat
        ? {
            timesCompleted: stat.timesCompleted ?? 0,
            averageCompletionRate: stat.averageCompletionRate ?? 0,
          }
        : { timesCompleted: 0, averageCompletionRate: 0 };
    }

    console.log('📊 Загруженная статистика:', statsData);

    setStats(statsData);

    const totalCompletedNow = Object.values(statsData).reduce(
      (sum, stat) => sum + (stat?.timesCompleted || 0),
      0
    );

    console.log('🧮 totalCompletedNow:', totalCompletedNow);

    try {
      const storedPrev = await AsyncStorage.getItem(PREVIOUS_TOTAL_KEY);
      const previousTotal = storedPrev ? parseInt(storedPrev, 10) : 0;

      console.log('📥 previousTotal (из AsyncStorage):', previousTotal);

      if (totalCompletedNow > previousTotal) {
        console.log('🟢 Прогресс есть! Засчитываем день.');
        await saveExerciseDate();
        try {
          await ensureMarkedToday().catch((e) => console.log('mark today failed', e));
          console.log('✅ Сервер пометил активность на сегодня');
        } catch (e) {
          console.log('⚠️ Не удалось пометить активность на сервере:', e);
        }
      } else {
        console.log('🟡 Прогресса нет. День не засчитан.');
        const today = new Date().toISOString().slice(0, 10);
        const storedDates = await AsyncStorage.getItem('activeDays');
        const activeDates = storedDates ? JSON.parse(storedDates) : [];
        if (activeDates.includes(today)) {
          try {
            await ensureMarkedToday();
            console.log('↔️ Синхронизировали активный день с сервером.');
          } catch (e) {
            console.log('⚠️ Не удалось синхронизировать активность:', e);
          }
        }
      }

      await AsyncStorage.setItem(PREVIOUS_TOTAL_KEY, totalCompletedNow.toString());
      console.log('💾 Сохранили новое значение:', totalCompletedNow);
    } catch (error) {
      console.error('❌ Ошибка при работе с previousTotalExercises:', error);
    }

    await calculateTotalStats(statsData);
  };

  const calculateTotalStats = async (statsData) => {
    try {
      let totalCompleted = 0;
      let totalRate = 0;
      let count = 0;
      let uniqueDays = new Set();

      for (let key in statsData) {
        totalCompleted += statsData[key].timesCompleted;
        if (statsData[key].timesCompleted > 0) {
          totalRate += statsData[key].averageCompletionRate;
          count++;
        }
      }

      const storedDates = await AsyncStorage.getItem('activeDays');
      let activeDates = storedDates ? JSON.parse(storedDates) : [];
      activeDates.forEach((date) => uniqueDays.add(date));

      setTotalExercisesCompleted(totalCompleted);
      setAverageCompletionRate(count > 0 ? (totalRate / count).toFixed(2) : 0);
      setActiveDays(uniqueDays.size);

      console.log('✅ Итоговая статистика:');
      console.log('📌 Всего выполнено:', totalCompleted);
      console.log('📊 Средний результат:', count > 0 ? (totalRate / count).toFixed(2) : 0);
      console.log('📅 Активных дней:', uniqueDays.size);
    } catch (error) {
      console.error('❌ Ошибка при вычислении статистики:', error);
    }
  };

  // 🔹 Сохраняем дату выполнения упражнения
  const saveExerciseDate = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const storedDates = await AsyncStorage.getItem('activeDays');
      let activeDates = storedDates ? JSON.parse(storedDates) : [];

      if (!activeDates.includes(today)) {
        activeDates.push(today);
        await AsyncStorage.setItem('activeDays', JSON.stringify(activeDates));
        console.log('✅ День добавлен:', today);
      } else {
        console.log('ℹ️ День уже есть, не добавляем.');
      }

      const updatedDates = await AsyncStorage.getItem('activeDays');
      let parsed = updatedDates ? JSON.parse(updatedDates) : [];
      console.log('📂 Список сохранённых дней после:', parsed);
      setActiveDays(new Set(parsed).size);
    } catch (error) {
      console.error('❌ Ошибка при сохранении даты активности:', error);
    }
  };

  const highlightedButtonStyle = {
    backgroundColor: '#367088',
    borderWidth: 4,
    borderColor: '#bd462a',
  };

  const hardlightedButtonStyle = {
    backgroundColor: '#2D4769',
    borderWidth: 4,
    borderColor: '#bd462a',
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
    Animated.timing(headerOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    Animated.timing(titleOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }).start();

    Animated.stagger(300, [
      Animated.parallel([
        Animated.timing(button1Opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(button1TranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(button2Opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(button2TranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(button3Opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(button3TranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(button6Opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(button6TranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(button5Opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(button5TranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(button8Opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(button8TranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(button4Opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(button4TranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(button7Opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(button7TranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(button9Opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(button9TranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const handlePress = (routeName) => {
    if (isLocked(routeName)) {
      navigation.navigate('Paywall');
      return;
    }
    setNavigateTo(routeName);
    setAnimationTriggered(true);
  };

  useEffect(() => {
    if (animationTriggered) {
      Animated.stagger(100, [
        Animated.timing(headerOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(button1Opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(button2Opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(button3Opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(button4Opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(button5Opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(button6Opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(button7Opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(button8Opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(button9Opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
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

  useEffect(() => {
    if (!statsAnimationFinished) {
      const timer = setTimeout(() => setStatsAnimationFinished(true), 3500);
      return () => clearTimeout(timer);
    }
  }, [statsAnimationFinished]);

  // === REPORT BUG BUTTON (EN) ===
  const handleReportBug = useCallback(async () => {
    const to = 'verbify2025@gmail.com';
    const subject = encodeURIComponent('Error report in Verbify database (EN)');

    const body = encodeURIComponent(
      [
        'Thank you for using the VERBIFY app and helping us make it better!',
        '',
        'Your message helps us fix mistakes in translations, examples and grammar.',
        '',
        'PLEASE FILL IN AS MUCH AS YOU CAN (IN ANY LANGUAGE):',
        '',
        '1) WHERE DID YOU FIND THE ERROR:',
        '',
        '   • Interface language (en/ru/...):',
        '',
        '     ______________________________',
        '',
        '   • Exercise / screen (for example, Exercise 1, verb list, etc.):',
        '',
        '     ______________________________',
        '',
        '   • Verb / word (infinitive in Hebrew + translation):',
        '',
        '     ______________________________',
        '',
        '',
        '2) WHAT EXACTLY IS WRONG (KEEP WHAT APPLIES):',
        '',
        '   • Translation error',
        '   • Transliteration error',
        '   • Grammar error (gender / number / tense / person, etc.)',
        '   • Example sentence error (word order, wrong form, etc.)',
        '   • Audio error (different form / different verb / poor quality)',
        '   • Other:',
        '',
        '     ______________________________',
        '',
        '',
        '3) DETAILS:',
        '',
        '   • How it is now (incorrect version):',
        '',
        '     ______________________________',
        '',
        '   • How it should be (correct version):',
        '',
        '     ______________________________',
        '',
        '',
        '4) IF YOU WISH, YOU CAN ALSO ATTACH A SCREENSHOT',
        '',
        '',
        '5) WHAT, IN YOUR OPINION, COULD BE ADDED OR CHANGED IN THE APP TO MAKE IT BETTER:',
        '',
        '     ______________________________',
        '',
        '---',
        '',
        'TECHNICAL INFORMATION:',
        `App version: ${Constants?.expoConfig?.version || 'unknown'}`,
        `Platform: ${Platform.OS} (${Platform.Version})`,
      ].join('\n')
    );

    const url = `mailto:${to}?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.warn('Cannot open mail client for bug report');
      }
    } catch (e) {
      console.warn('Error opening mail client for bug report:', e);
    }
  }, []);

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
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
          <Image source={require('./VERBIFY.png')} style={styles.image} />
          <Text style={styles.greeting} maxFontSizeMultiplier={1.2}>
            Hello, {name}!
          </Text>
        </Animated.View>

        {/* Статистика (теперь кнопка-обёртка) */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => setIsStatModalVisible(true)}>
          <Animated.View style={[styles.statsContainer, { opacity: titleOpacity }]}>
            {!statsAnimationFinished ? (
              <LottieView
                source={require('./Animation - 1741202326129.json')}
                autoPlay
                loop={false}
                onAnimationFinish={() => setStatsAnimationFinished(true)}
                style={styles.statsAnimation}
              />
            ) : (
              <>
                <Image source={require('./STAT2.png')} style={styles.statsImage} />
                <FadeInView style={styles.statsTextContainer}>
                  <View className="row" style={styles.statsRow}>
                    <Text style={styles.statsText} maxFontSizeMultiplier={1.2}>
                      EXERCISES COMPLETED
                    </Text>
                    <View style={styles.statsBox}>
                      <Text style={styles.statsValue} maxFontSizeMultiplier={1.2}>
                        {totalExercisesCompleted}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statsRow}>
                    <Text style={styles.statsText} maxFontSizeMultiplier={1.2}>
                      AVERAGE SCORE
                    </Text>
                    <View style={styles.statsBox}>
                      <Text style={styles.statsValue} maxFontSizeMultiplier={1.2}>
                        {averageCompletionRate}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statsRow}>
                    <Text style={styles.statsText} maxFontSizeMultiplier={1.2}>
                      DAYS OF PRACTICE
                    </Text>
                    <View style={styles.statsBox}>
                      <Text style={styles.statsValue} maxFontSizeMultiplier={1.2}>
                        {activeDays}
                      </Text>
                    </View>
                  </View>
                </FadeInView>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.content}>
          <Animated.Text
            style={[styles.titleText, { opacity: titleOpacity }]}
            maxFontSizeMultiplier={1.2}
          >
            CHOOSE AN EXERCISE
          </Animated.Text>

          {/* Exercise 1 — FREE */}
          <Animated.View
            style={[
              styles.buttonContainer,
              { opacity: button1Opacity, transform: [{ translateY: button1TranslateY }] },
            ]}
          >
            <TouchableOpacity onPress={() => handlePress('Exercise1En')}>
              <View style={styles.upperPart1}>
                <Text style={styles.upperText1} maxFontSizeMultiplier={1.2}>
                  EXERCISE 1
                </Text>
                <Image source={require('./star1.png')} style={[styles.image1]} />
              </View>
              <View style={styles.upperPart2}>
                <Text style={styles.upperText} maxFontSizeMultiplier={1.2}>
                  VERB CARDS HEBREW - ENGLISH
                </Text>
              </View>
              <View style={styles.lowerRight}>
                <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>
                  COMPLETED{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise1En'] ? stats['exercise1En'].timesCompleted : 0}
                  </Text>
                </Text>
                <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>
                  AVERAGE SCORE{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise1En']
                      ? stats['exercise1En'].averageCompletionRate.toFixed(2)
                      : 0}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Exercise 2 — FREE */}
          <Animated.View
            style={[
              styles.buttonContainer,
              { opacity: button2Opacity, transform: [{ translateY: button2TranslateY }] },
            ]}
          >
            <TouchableOpacity onPress={() => handlePress('Exercise2En')}>
              <View style={styles.upperPart1}>
                <Text style={styles.upperText1} maxFontSizeMultiplier={1.2}>
                  EXERCISE 2
                </Text>
                <Image source={require('./star2.png')} style={[styles.image1]} />
              </View>
              <View style={styles.upperPart2}>
                <Text style={styles.upperText} maxFontSizeMultiplier={1.2}>
                  VERB CARDS ENGLISH - HEBREW
                </Text>
              </View>
              <View style={styles.lowerRight}>
                <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>
                  COMPLETED{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise2En'] ? stats['exercise2En'].timesCompleted : 0}
                  </Text>
                </Text>
                <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>
                  AVERAGE SCORE{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise2En']
                      ? stats['exercise2En'].averageCompletionRate.toFixed(2)
                      : 0}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Exercise 3 — LOCKED if !PRO */}
          <Animated.View
            style={[
              styles.buttonContainer,
              { opacity: button3Opacity, transform: [{ translateY: button3TranslateY }] },
              isLocked('Exercise3En') && lockStyle,
            ]}
          >
            <TouchableOpacity onPress={() => handlePress('Exercise3En')}>
              <View style={styles.upperPart1}>
                <Text style={styles.upperText1} maxFontSizeMultiplier={1.2}>
                  EXERCISE 3
                </Text>
                <Image source={require('./star3.png')} style={[styles.image1]} />
              </View>
              <View style={styles.upperPart2}>
                <Text style={styles.upperText} maxFontSizeMultiplier={1.2}>
                  DETERMINE THE VERB BINYAN
                </Text>
              </View>
              <View style={styles.lowerRight}>
                <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>
                  COMPLETED{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise3En'] ? stats['exercise3En'].timesCompleted : 0}
                  </Text>
                </Text>
                <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>
                  AVERAGE SCORE{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise3En']
                      ? stats['exercise3En'].averageCompletionRate.toFixed(2)
                      : 0}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Exercise 4 (route 5) — LOCKED if !PRO */}
          <Animated.View
            style={[
              styles.buttonContainer,
              { opacity: button6Opacity, transform: [{ translateY: button6TranslateY }] },
              isLocked('Exercise5En') && lockStyle,
            ]}
          >
            <TouchableOpacity onPress={() => handlePress('Exercise5En')}>
              <View style={styles.upperPart1}>
                <Text style={styles.upperText1} maxFontSizeMultiplier={1.2}>
                  EXERCISE 4
                </Text>
                <Image source={require('./star3.png')} style={[styles.image1]} />
              </View>
              <View style={styles.upperPart2}>
                <Text style={styles.upperText} maxFontSizeMultiplier={1.2}>
                  IMPERATIVE MOOD
                </Text>
              </View>
              <View style={styles.lowerRight}>
                <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>
                  COMPLETED{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise5En'] ? stats['exercise5En'].timesCompleted : 0}
                  </Text>
                </Text>
                <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>
                  AVERAGE SCORE{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise5En']
                      ? stats['exercise5En'].averageCompletionRate.toFixed(2)
                      : 0}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Exercise 5 — LOCKED if !PRO */}
          <Animated.View
            style={[
              styles.buttonContainer,
              highlightedButtonStyle,
              { opacity: button6Opacity, transform: [{ translateY: button6TranslateY }] },
              isLocked('Exercise6En') && lockStyle,
            ]}
          >
            <TouchableOpacity onPress={() => handlePress('Exercise6En')}>
              <View style={styles.upperPart1}>
                <Text style={styles.upperText1} maxFontSizeMultiplier={1.2}>
                  EXERCISE 5
                </Text>
                <Image source={require('./star4.png')} style={[styles.image1]} />
              </View>
              <View style={styles.upperPart2}>
                <Text style={styles.upperText} maxFontSizeMultiplier={1.2}>
                  CONJUGATION ENGLISH - HEBREW
                </Text>
              </View>
              <View style={styles.lowerRight}>
                <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>
                  COMPLETED{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise6En'] ? stats['exercise6En'].timesCompleted : 0}
                  </Text>
                </Text>
                <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>
                  AVERAGE SCORE{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise6En']
                      ? stats['exercise6En'].averageCompletionRate.toFixed(2)
                      : 0}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Exercise 6 — LOCKED if !PRO */}
          <Animated.View
            style={[
              styles.buttonContainer,
              highlightedButtonStyle,
              { opacity: button6Opacity, transform: [{ translateY: button6TranslateY }] },
              isLocked('Exercise8En') && lockStyle,
            ]}
          >
            <TouchableOpacity onPress={() => handlePress('Exercise8En')}>
              <View style={styles.upperPart1}>
                <Text style={styles.upperText1} maxFontSizeMultiplier={1.2}>
                  EXERCISE 6
                </Text>
                <Image source={require('./star4.png')} style={[styles.image1]} />
              </View>
              <View style={styles.upperPart2}>
                <Text style={styles.upperText} maxFontSizeMultiplier={1.2}>
                  CONJUGATION HEBREW - ENGLISH
                </Text>
              </View>
              <View style={styles.lowerRight}>
                <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>
                  COMPLETED{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise8En'] ? stats['exercise8En'].timesCompleted : 0}
                  </Text>
                </Text>
                <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>
                  AVERAGE SCORE{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise8En']
                      ? stats['exercise8En'].averageCompletionRate.toFixed(2)
                      : 0}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Exercise 7 — LOCKED if !PRO */}
          <Animated.View
            style={[
              styles.buttonContainer,
              hardlightedButtonStyle,
              { opacity: button4Opacity, transform: [{ translateY: button4TranslateY }] },
              isLocked('Exercise4En') && lockStyle,
            ]}
          >
            <TouchableOpacity onPress={() => handlePress('Exercise4En')}>
              <View style={styles.upperPart1}>
                <Text style={styles.upperText1} maxFontSizeMultiplier={1.2}>
                  EXERCISE 7
                </Text>
                <Image source={require('./star5.png')} style={[styles.image1]} />
              </View>
              <View style={styles.upperPart2}>
                <Text style={styles.upperText} maxFontSizeMultiplier={1.2}>
                  CONJUGATION ENGLISH - HEBREW
                </Text>
              </View>
              <View style={styles.lowerRight}>
                <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>
                  COMPLETED{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise4En'] ? stats['exercise4En'].timesCompleted : 0}
                  </Text>
                </Text>
                <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>
                  AVERAGE SCORE{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise4En']
                      ? stats['exercise4En'].averageCompletionRate.toFixed(2)
                      : 0}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Exercise 8 — LOCKED if !PRO */}
          <Animated.View
            style={[
              styles.buttonContainer,
              hardlightedButtonStyle,
              { opacity: button7Opacity, transform: [{ translateY: button7TranslateY }] },
              isLocked('Exercise7En') && lockStyle,
            ]}
          >
            <TouchableOpacity onPress={() => handlePress('Exercise7En')}>
              <View style={styles.upperPart1}>
                <Text style={styles.upperText1} maxFontSizeMultiplier={1.2}>
                  EXERCISE 8
                </Text>
                <Image source={require('./star5.png')} style={[styles.image1]} />
              </View>
              <View style={styles.upperPart2}>
                <Text style={styles.upperText} maxFontSizeMultiplier={1.2}>
                  CONJUGATION HEBREW - ENGLISH
                </Text>
              </View>
              <View style={styles.lowerRight}>
                <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>
                  COMPLETED{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise7En'] ? stats['exercise7En'].timesCompleted : 0}
                  </Text>
                </Text>
                <Text style={styles.lowerText} maxFontSizeMultiplier={1.2}>
                  AVERAGE SCORE{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise7En']
                      ? stats['exercise7En'].averageCompletionRate.toFixed(2)
                      : 0}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* DESCRIPTION */}
          <Animated.View
            style={[
              styles.infoWrap,
              { opacity: button9Opacity, transform: [{ translateY: button7TranslateY }] },
            ]}
          >
            <TouchableOpacity style={styles.infoButton} onPress={() => setIsModalVisible(true)}>
              <Image source={require('./quest.png')} style={styles.infoIcon} />
              <Text
                style={styles.infoText}
                numberOfLines={2}
                ellipsizeMode="tail"
                maxFontSizeMultiplier={1.2}
              >
                APPLICATION DESCRIPTION
              </Text>
            </TouchableOpacity>
          </Animated.View>
          <AppDescriptionModal
            visible={isModalVisible}
            onToggle={() => setIsModalVisible(false)}
          />

          {/* ABOUT */}
          <Animated.View
            style={[
              styles.infoWrap,
              { opacity: button9Opacity, transform: [{ translateY: button7TranslateY }] },
            ]}
          >
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setIsInfoModalVisible(true)}
            >
              <Image source={require('./about4.png')} style={styles.infoIcon} />
              <Text
                style={styles.infoText}
                numberOfLines={2}
                ellipsizeMode="tail"
                maxFontSizeMultiplier={1.2}
              >
                ABOUT THE APPLICATION
              </Text>
            </TouchableOpacity>
          </Animated.View>
          <AppInfoModal
            visible={isInfoModalVisible}
            onToggle={() => setIsInfoModalVisible(false)}
          />

          {/* REPORT BUG (NO ICON) */}
          <Animated.View
            style={[
              styles.infoWrap,
              { opacity: button9Opacity, transform: [{ translateY: button7TranslateY }] },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.infoButton,
                { backgroundColor: '#bd462a', borderColor: '#2D4769' },
              ]}
              onPress={handleReportBug}
            >
              <Text
                style={styles.infoText}
                numberOfLines={2}
                ellipsizeMode="tail"
                maxFontSizeMultiplier={1.2}
              >
                REPORT AN ERROR
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>

      <StatsReportModalMulti
        visible={isStatModalVisible}
        onClose={() => setIsStatModalVisible(false)}
        language="en"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonIcon: {
    width: 30,
    height: 30,
    position: 'absolute',
    left: 30,
  },

  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#bd462a',
    padding: 8,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#2D4769',
    height: 90,
  },

  statsImage: {
    width: 80,
    height: 80,
    marginRight: 12,
    marginLeft: 10,
  },

  statsTextContainer: {
    flex: 1,
    marginTop: 5,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },

  statsText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'right',
    marginRight: 8,
    flex: 1,
  },

  statsBox: {
    minWidth: 50,
    height: 20,
    paddingHorizontal: 4,
    backgroundColor: 'white',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statsValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#367088',
    textAlign: 'center',
    lineHeight: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginTop: -1,
  },

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
    marginBottom: -5,
  },
  image: {
    width: 90,
    height: 90,
    marginRight: 20,
    marginLeft: 5,
  },
  greeting: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D4769',
    marginLeft: 10,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#2D4769',
    marginTop: 10,
  },
  titleText1: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: 'white',
    marginTop: 10,
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
  buttonContainer1: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D4769',
    paddingVertical: 3,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    position: 'relative',
    borderWidth: 3,
    borderColor: '#bd462a',
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
  statsAnimation: {
    width: '100%',
    height: '150%',
  },

  // Новый обёртчик: просто центрирует кнопку по ширине
  infoWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },

   infoIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },

  // Сама кнопка: стабильная высота и корректное центрирование
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D4769',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#367088',
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 52, // фикс от «скачков» высоты
    width: '100%',
  },

  // Текст без внешних margin, чтобы не раздувал высоту
  infoText: {
    flexShrink: 1,
    textAlign: 'center',
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    includeFontPadding: false, // ровнее на Android
    textAlignVertical: 'center',
    lineHeight: 18, // предсказуемая высота строки
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
  },
});
