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
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStatistics } from './stat';
import LottieView from 'lottie-react-native';
import AppDescriptionModal from './AppDescriptionModal';
import AppInfoModal from './AppInfoModal';
import FadeInView from './api/FadeInView';
import { ensureMarkedToday } from './serverPush';
import { useIap } from './src/iap/IapProvider';
import StatsReportModalMulti from './StatsReportModalMulti';
import Constants from 'expo-constants';
import UpgradeBanner from './UpgradeBanner';

const FONT_BOLD = 'mt-bold';
const FONT_SEMIBOLD = 'mt-semibold';

export default function MenuPage({
  route,
  hasPro: hasProFromGate,
  hasFullAccess,
  internalTrialActive,
  internalTrialEndsAt,
}) {
  const navigation = useNavigation();
  const { hasPro: hasProFromIap } = useIap();

  const hasPro =
    typeof hasProFromGate === 'boolean'
      ? hasProFromGate
      : hasProFromIap;

  const fullAccess =
    typeof hasFullAccess === 'boolean'
      ? hasFullAccess
      : hasPro;

  const trialActive =
    typeof internalTrialActive === 'boolean'
      ? internalTrialActive
      : !!route?.params?.internalTrialActive;

  const trialEndsAt =
    internalTrialEndsAt || route?.params?.internalTrialEndsAt || null;

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
  const [isStatModalVisible, setIsStatModalVisible] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const verbLibraryOpacity = useRef(new Animated.Value(0)).current;

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
  const button10Opacity = useRef(new Animated.Value(0)).current;
const button10TranslateY = useRef(new Animated.Value(250)).current;

  const PREVIOUS_TOTAL_KEY = 'previousTotalExercises';

  useEffect(() => {
    navigation.setOptions({ headerLeft: () => null });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      setIsStatModalVisible(false);

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'LanguageSelectionPage' }],
          });
          return true;
        }
      );

      return () => backHandler.remove();
    }, [navigation])
  );

  const saveExerciseDate = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storedDates = await AsyncStorage.getItem('activeDays');
      const activeDates = storedDates ? JSON.parse(storedDates) : [];

      if (!activeDates.includes(today)) {
        activeDates.push(today);
        await AsyncStorage.setItem(
          'activeDays',
          JSON.stringify(activeDates)
        );
      }

      const updatedDates = await AsyncStorage.getItem('activeDays');
      const parsed = updatedDates ? JSON.parse(updatedDates) : [];
      setActiveDays(new Set(parsed).size);
    } catch (error) {
      console.error('Ошибка при сохранении даты активности:', error);
    }
  };

  const calculateTotalStats = async statsData => {
    try {
      let totalCompleted = 0;
      let totalRate = 0;
      let count = 0;
      const uniqueDays = new Set();

      for (const key in statsData) {
        totalCompleted += statsData[key].timesCompleted;

        if (statsData[key].timesCompleted > 0) {
          totalRate += statsData[key].averageCompletionRate;
          count++;
        }
      }

      const storedDates = await AsyncStorage.getItem('activeDays');
      const activeDates = storedDates ? JSON.parse(storedDates) : [];
      activeDates.forEach(date => uniqueDays.add(date));

      setTotalExercisesCompleted(totalCompleted);
      setAverageCompletionRate(
        count > 0 ? (totalRate / count).toFixed(2) : 0
      );
      setActiveDays(uniqueDays.size);
    } catch (error) {
      console.error('Ошибка при вычислении статистики:', error);
    }
  };

  const fetchStatistics = async () => {
    const exerciseIds = [
      'exercise1',
      'exercise2',
      'prepositionPronouns',
      'prepositionAfterVerbs',
      'exercise3',
      'exercise5',
      'rootFamilies',
      'exercise6',
      'exercise8',
      'exercise4',
      'exercise7',
       'exercise9',
      'exercise10',
    ];

    const statsData = {};

    for (const id of exerciseIds) {
      const stat = await getStatistics(id);

      statsData[id] = {
        timesCompleted: Number(stat?.timesCompleted ?? 0),
        averageCompletionRate: Number(
          stat?.averageCompletionRate ?? 0
        ),
      };
    }

    setStats(statsData);

    const totalCompletedNow = Object.values(statsData).reduce(
      (sum, stat) => sum + (stat?.timesCompleted || 0),
      0
    );

    try {
      const storedPrev = await AsyncStorage.getItem(PREVIOUS_TOTAL_KEY);
      const previousTotal = storedPrev ? parseInt(storedPrev, 10) : 0;

      if (totalCompletedNow > previousTotal) {
        await saveExerciseDate();

        try {
          await ensureMarkedToday();
        } catch (error) {
          console.log('mark today failed', error);
        }
      } else {
        const today = new Date().toISOString().slice(0, 10);
        const storedDates = await AsyncStorage.getItem('activeDays');
        const activeDates = storedDates ? JSON.parse(storedDates) : [];

        if (activeDates.includes(today)) {
          try {
            await ensureMarkedToday();
          } catch {}
        }
      }

      await AsyncStorage.setItem(
        PREVIOUS_TOTAL_KEY,
        totalCompletedNow.toString()
      );
    } catch (error) {
      console.error('Ошибка previousTotalExercises:', error);
    }

    await calculateTotalStats(statsData);
  };

  useFocusEffect(
    useCallback(() => {
      fetchStatistics().catch(error =>
        console.error('Ошибка загрузки статистики:', error)
      );

      setAnimationFinished(false);
      setAnimationTriggered(false);
      setNavigateTo(null);
    }, [])
  );

  useEffect(() => {
    const loadActiveDays = async () => {
      try {
        const storedDates = await AsyncStorage.getItem('activeDays');
        const activeDates = storedDates ? JSON.parse(storedDates) : [];
        setActiveDays(new Set(activeDates).size);
      } catch (error) {
        console.error('Ошибка при загрузке активных дней:', error);
      }
    };

    loadActiveDays();
  }, []);

  useEffect(() => {
    const getName = async () => {
      try {
        const storedName = await AsyncStorage.getItem('name');
        if (storedName) setName(storedName);
      } catch (error) {
        console.log('Ошибка загрузки имени:', error);
      }
    };

    getName();
  }, []);

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

  const startAnimations = () => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Animated.timing(verbLibraryOpacity, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();

    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Animated.stagger(300, [
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
  Animated.timing(button10Opacity, {
    toValue: 1,
    duration: 500,
    useNativeDriver: true,
  }),
  Animated.timing(button10TranslateY, {
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
      Animated.parallel([
        Animated.timing(button9Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(button9TranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const isFreeName = screenName =>
    screenName === 'Exercise1' ||
    screenName === 'Exercise2' ||
    screenName === 'PrepositionExercise';

  const isLocked = screenName =>
    !__DEV__ && !fullAccess && !isFreeName(screenName);

  const handlePress = exercise => {
    if (isLocked(exercise)) return;

    if (
      exercise === 'PrepositionExercise' ||
      exercise === 'PrepositionVerbExercise' ||
      exercise === 'RootVerbExercise' ||
      exercise === 'Exercise9' ||
      exercise === 'Exercise10'
    ) {
      navigation.navigate(exercise, { language: 'ru' });
      return;
    }

    setNavigateTo(exercise);
    setAnimationTriggered(true);
  };

  useEffect(() => {
    if (!animationTriggered) return;

    let timer;

    const animation = Animated.stagger(100, [
      Animated.timing(headerOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(verbLibraryOpacity, {
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
      Animated.timing(button10Opacity, {
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
      Animated.timing(button9Opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (!finished) return;

      timer = setTimeout(() => {
        if (navigateTo) {
          navigation.navigate(navigateTo);
          setAnimationTriggered(false);
        }
      }, 100);
    });

    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [animationTriggered, navigateTo, navigation]);

  useEffect(() => {
    if (!statsAnimationFinished) {
      const timer = setTimeout(
        () => setStatsAnimationFinished(true),
        3500
      );

      return () => clearTimeout(timer);
    }
  }, [statsAnimationFinished]);

  const handleReportBug = useCallback(async () => {
    const to = 'verbify2025@gmail.com';

    const subject = encodeURIComponent(
      'Сообщение об ошибке в базе Verbify'
    );

    const body = encodeURIComponent([
      'Спасибо, что пользуетесь приложением VERBIFY и помогаете делать его лучше!',
      '',
      'Ваше сообщение помогает нам исправлять ошибки в переводах, примерах и грамматике.',
      '',
      'ПОЖАЛУЙСТА, ЗАПОЛНИТЕ ПО ВОЗМОЖНОСТИ (МОЖНО НА ЛЮБОМ ЯЗЫКЕ):',
      '',
      '1) ГДЕ НАШЛИ ОШИБКУ:',
      '',
      '   • Язык интерфейса (ru/en/...):',
      '',
      '     ______________________________',
      '',
      '   • Упражнение / экран (например, Упражнение 1, список глаголов и т.п.):',
      '',
      '     ______________________________',
      '',
      '   • Глагол / слово (инфинитив на иврите + перевод):',
      '',
      '     ______________________________',
      '',
      '',
      '2) ЧТО ИМЕННО НЕВЕРНО (ОСТАВЬТЕ НУЖНОЕ):',
      '',
      '   • Ошибка перевода',
      '   • Ошибка транслитерации',
      '   • Грамматическая ошибка (род / число / время / лицо и т.д.)',
      '   • Ошибка в примере (предложение, порядок слов и т.п.)',
      '   • Неверное аудио (другая форма / другой глагол / плохое качество)',
      '   • Другое:',
      '',
      '     ______________________________',
      '',
      '',
      '3) ПОДРОБНОСТИ:',
      '',
      '   • Как сейчас (неверный вариант):',
      '',
      '     ______________________________',
      '',
      '   • Как должно быть (правильный вариант):',
      '',
      '     ______________________________',
      '',
      '',
      '4) ПРИ ЖЕЛАНИИ МОЖЕТЕ ДОБАВИТЬ СКРИНШОТ',
      '',
      '',
      '5) ЧТО, ПО ВАШЕМУ МНЕНИЮ, МОЖНО ДОБАВИТЬ ИЛИ ИЗМЕНИТЬ В ПРИЛОЖЕНИИ, ЧТОБЫ СДЕЛАТЬ ЕГО ЛУЧШЕ:',
      '',
      '     ______________________________',
      '',
      '---',
      '',
      'ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ:',
      `Версия приложения: ${Constants?.expoConfig?.version || 'unknown'}`,
      `Платформа: ${Platform.OS} (${Platform.Version})`,
    ].join('\n'));

    const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}`;

    try {
      if (await Linking.canOpenURL(mailtoUrl)) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          'Не удалось открыть почтовый клиент',
          'Пожалуйста, отправьте письмо на адрес: verbify2025@gmail.com'
        );
      }
    } catch (error) {
      console.warn('Error opening mail app', error);

      Alert.alert(
        'Ошибка',
        'Не удалось открыть почтовый клиент. Пожалуйста, отправьте письмо вручную на адрес: verbify2025@gmail.com'
      );
    }
  }, []);

 if (!animationFinished) {
    return (
      <View style={styles.animationContainer}>
        <LottieView
          source={require('./assets/Animation - 1718360283264.json')}
          autoPlay
          loop={false}
          onAnimationFinish={() => {
            setAnimationFinished(true);
            if (!navigateTo) startAnimations();
          }}
          style={styles.lottie}
        />
      </View>
    );
  }

  const lockStyle = {
    opacity: 0.45,
    backgroundColor: '#6f7f90',
    borderColor: '#9aa6b2',
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Animated.View
          style={[
            styles.headerContainer,
            { opacity: headerOpacity },
          ]}
        >
          <Image
            source={require('./VERBIFY.png')}
            style={styles.image}
          />

          <Text
            style={styles.greeting}
            maxFontSizeMultiplier={1.2}
          >
            Привет, {name}!
          </Text>
        </Animated.View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setIsStatModalVisible(true)}
        >
          <Animated.View
            style={[
              styles.statsContainer,
              { opacity: titleOpacity },
            ]}
          >
            {!statsAnimationFinished ? (
              <LottieView
                source={require('./Animation - 1741202326129.json')}
                autoPlay
                loop={false}
                onAnimationFinish={() =>
                  setStatsAnimationFinished(true)
                }
                style={styles.statsAnimation}
              />
            ) : (
              <>
                <Image
                  source={require('./STAT2.png')}
                  style={styles.statsImage}
                />

                <FadeInView style={styles.statsTextContainer}>
                  <View style={styles.statsRow}>
                    <Text
                      style={styles.statsText}
                      maxFontSizeMultiplier={1.2}
                    >
                      ВЫПОЛНЕНО УПРАЖНЕНИЙ
                    </Text>

                    <View style={styles.statsBox}>
                   <Text
  style={styles.statsValue}
  maxFontSizeMultiplier={1.2}
>
                        {totalExercisesCompleted}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <Text
                      style={styles.statsText}
                      maxFontSizeMultiplier={1.2}
                    >
                      СРЕДНИЙ РЕЗУЛЬТАТ
                    </Text>

                    <View style={styles.statsBox}>
                    <Text
  style={styles.statsValue}
  maxFontSizeMultiplier={1.2}
>
                        {averageCompletionRate}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <Text
                      style={styles.statsText}
                      maxFontSizeMultiplier={1.2}
                    >
                      ДНЕЙ ЗАНЯТИЙ
                    </Text>

                    <View style={styles.statsBox}>
                    <Text
  style={styles.statsValue}
  maxFontSizeMultiplier={1.2}
>
                        {activeDays}
                      </Text>
                    </View>
                  </View>
                </FadeInView>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>

        <View>
          <Animated.View
            style={[
              styles.verbLibraryContainer,
              { opacity: verbLibraryOpacity },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.verbLibraryButton}
              onPress={() => navigation.navigate('VerbLibrary')}
            >
              <View style={styles.verbLibraryTextContainer}>
                <Text
                  style={styles.verbLibraryTitle}
                  maxFontSizeMultiplier={1.2}
                >
                  КАРТОЧКИ ГЛАГОЛОВ
                </Text>

                <Text
                  style={styles.verbLibrarySubtitle}
                  maxFontSizeMultiplier={1.2}
                >
                  СПРАВОЧНИК ПО ВСЕЙ БАЗЕ VERBIFY
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.Text
            style={[styles.titleText, { opacity: titleOpacity }]}
            maxFontSizeMultiplier={1.2}
          >
            ВЫБЕРИ УПРАЖНЕНИЕ
          </Animated.Text>

          {/* УПРАЖНЕНИЕ 1 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: button1Opacity,
                transform: [{ translateY: button1TranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => handlePress('Exercise1')}
              style={styles.exerciseTouchable}
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  УПРАЖНЕНИЕ  1
                </Text>

                <Image
                  source={require('./star1.png')}
                  style={styles.image1}
                />
              </View>

              <View style={styles.upperPart2}>
                <Text
                  style={styles.upperText}
                  maxFontSizeMultiplier={1.2}
                >
                  КАРТОЧКИ ГЛАГОЛОВ ИВРИТ-РУССКИЙ
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СДЕЛАНО{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {stats.exercise1?.timesCompleted ?? 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СРЕДНИЙ РЕЗУЛЬТАТ{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {Number(
                      stats.exercise1?.averageCompletionRate ?? 0
                    ).toFixed(2)}%
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* УПРАЖНЕНИЕ 2 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: button2Opacity,
                transform: [{ translateY: button2TranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => handlePress('Exercise2')}
              style={styles.exerciseTouchable}
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  УПРАЖНЕНИЕ  2
                </Text>

                <Image
                  source={require('./star2.png')}
                  style={styles.image1}
                />
              </View>

              <View style={styles.upperPart2}>
                <Text
                  style={styles.upperText}
                  maxFontSizeMultiplier={1.2}
                >
                  КАРТОЧКИ ГЛАГОЛОВ РУССКИЙ-ИВРИТ
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СДЕЛАНО{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {stats.exercise2?.timesCompleted ?? 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СРЕДНИЙ РЕЗУЛЬТАТ{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {Number(
                      stats.exercise2?.averageCompletionRate ?? 0
                    ).toFixed(2)}%
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* ПРЕДЛОГИ 1 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              styles.prepositionButtonContainer,
              {
                opacity: button3Opacity,
                transform: [{ translateY: button3TranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => handlePress('PrepositionExercise')}
              style={styles.exerciseTouchable}
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  ПРЕДЛОГИ 1
                </Text>

                <View style={styles.newExerciseBadge}>
                  <Text
                    style={styles.newExerciseText}
                    maxFontSizeMultiplier={1.2}
                  >
                    НОВОЕ УПРАЖНЕНИЕ
                  </Text>
                </View>
              </View>

              <View style={styles.upperPart2}>
                <Text
                  style={styles.upperText}
                  maxFontSizeMultiplier={1.2}
                >
                  МЕСТОИМЕННЫЕ ПРЕДЛОГИ
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СДЕЛАНО{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {stats.prepositionPronouns?.timesCompleted ?? 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СРЕДНИЙ РЕЗУЛЬТАТ{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {Number(
                      stats.prepositionPronouns?.averageCompletionRate ?? 0
                    ).toFixed(2)}%
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <UpgradeBanner
            hasPro={hasPro}
            navigation={navigation}
            language="ru"
            internalTrialActive={trialActive}
            internalTrialEndsAt={trialEndsAt}
            animatedStyle={{
              opacity: button3Opacity,
              transform: [{ translateY: button3TranslateY }],
            }}
          />

          {/* УПРАЖНЕНИЕ 3 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: button3Opacity,
                transform: [{ translateY: button3TranslateY }],
              },
              isLocked('Exercise3') && lockStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() => handlePress('Exercise3')}
              style={styles.exerciseTouchable}
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  УПРАЖНЕНИЕ  3
                </Text>

                <Image
                  source={require('./star3.png')}
                  style={styles.image1}
                />
              </View>

              <View style={styles.upperPart2}>
                <Text
                  style={styles.upperText}
                  maxFontSizeMultiplier={1.2}
                >
                  ОПРЕДЕЛИ БИНЬЯН ГЛАГОЛА
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СДЕЛАНО{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {stats.exercise3?.timesCompleted ?? 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СРЕДНИЙ РЕЗУЛЬТАТ{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {Number(
                      stats.exercise3?.averageCompletionRate ?? 0
                    ).toFixed(2)}%
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* УПРАЖНЕНИЕ 4 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: button6Opacity,
                transform: [{ translateY: button6TranslateY }],
              },
              isLocked('Exercise5') && lockStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() => handlePress('Exercise5')}
              style={styles.exerciseTouchable}
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  УПРАЖНЕНИЕ  4
                </Text>

                <Image
                  source={require('./star3.png')}
                  style={styles.image1}
                />
              </View>

              <View style={styles.upperPart2}>
                <Text
                  style={styles.upperText}
                  maxFontSizeMultiplier={1.2}
                >
                  ПОВЕЛИТЕЛЬНОЕ НАКЛОНЕНИЕ
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СДЕЛАНО{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {stats.exercise5?.timesCompleted ?? 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СРЕДНИЙ РЕЗУЛЬТАТ{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {Number(
                      stats.exercise5?.averageCompletionRate ?? 0
                    ).toFixed(2)}%
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* КОРНИ И БИНЬЯНЫ */}
          <Animated.View
            style={[
              styles.buttonContainer,
              styles.rootButtonContainer,
             {
  opacity: button10Opacity,
  transform: [{ translateY: button10TranslateY }],
},
              isLocked('RootVerbExercise') && lockStyle,
            ]}
          >
            <TouchableOpacity
              style={styles.rootTouchable}
              accessibilityRole="button"
              accessibilityLabel="Корни и биньяны. Новое упражнение"
              accessibilityState={{
                disabled: isLocked('RootVerbExercise'),
              }}
              disabled={isLocked('RootVerbExercise')}
              activeOpacity={0.8}
              onPress={() => handlePress('RootVerbExercise')}
            >
              <View style={styles.rootHeading}>
                <Text
                  style={styles.rootTitle}
                  maxFontSizeMultiplier={1.2}
                >
                  КОРНИ И БИНЬЯНЫ
                </Text>

                <View style={styles.rootNewBadge}>
                  <Text
                    style={styles.rootNewText}
                    maxFontSizeMultiplier={1.2}
                  >
                    НОВОЕ УПРАЖНЕНИЕ
                  </Text>
                </View>
              </View>

              <View style={styles.upperPart2}>
                <Text
                  style={styles.upperText}
                  maxFontSizeMultiplier={1.2}
                >
                  ОДНОКОРЕННЫЕ ГЛАГОЛЫ
                </Text>
              </View>

              <View style={[styles.lowerRight, styles.rootStats]}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СДЕЛАНО{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {stats.rootFamilies?.timesCompleted ?? 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СРЕДНИЙ РЕЗУЛЬТАТ{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {Number(
                      stats.rootFamilies?.averageCompletionRate ?? 0
                    ).toFixed(2)}%
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* УПРАЖНЕНИЕ 5 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              highlightedButtonStyle,
              {
                opacity: button6Opacity,
                transform: [{ translateY: button6TranslateY }],
              },
              isLocked('Exercise6') && lockStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() => handlePress('Exercise6')}
              style={styles.exerciseTouchable}
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  УПРАЖНЕНИЕ  5
                </Text>

                <Image
                  source={require('./star4.png')}
                  style={styles.image1}
                />
              </View>

              <View style={styles.upperPart2}>
                <Text
                  style={styles.upperText}
                  maxFontSizeMultiplier={1.2}
                >
                  СПРЯЖЕНИЕ ГЛАГОЛА РУССКИЙ-ИВРИТ
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СДЕЛАНО{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {stats.exercise6?.timesCompleted ?? 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СРЕДНИЙ РЕЗУЛЬТАТ{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {Number(
                      stats.exercise6?.averageCompletionRate ?? 0
                    ).toFixed(2)}%
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* УПРАЖНЕНИЕ 6 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              highlightedButtonStyle,
              {
                opacity: button6Opacity,
                transform: [{ translateY: button6TranslateY }],
              },
              isLocked('Exercise8') && lockStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() => handlePress('Exercise8')}
              style={styles.exerciseTouchable}
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  УПРАЖНЕНИЕ  6
                </Text>

                <Image
                  source={require('./star4.png')}
                  style={styles.image1}
                />
              </View>

              <View style={styles.upperPart2}>
                <Text
                  style={styles.upperText}
                  maxFontSizeMultiplier={1.2}
                >
                  СПРЯЖЕНИЕ ГЛАГОЛА ИВРИТ-РУССКИЙ
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СДЕЛАНО{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {stats.exercise8?.timesCompleted ?? 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СРЕДНИЙ РЕЗУЛЬТАТ{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {Number(
                      stats.exercise8?.averageCompletionRate ?? 0
                    ).toFixed(2)}%
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* ПРЕДЛОГИ 2 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              styles.prepositionButtonContainer,
              {
                opacity: button4Opacity,
                transform: [{ translateY: button4TranslateY }],
              },
              isLocked('PrepositionVerbExercise') && lockStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() => handlePress('PrepositionVerbExercise')}
              style={styles.exerciseTouchable}
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  ПРЕДЛОГИ 2
                </Text>

                <View style={styles.newExerciseBadge}>
                  <Text
                    style={styles.newExerciseText}
                    maxFontSizeMultiplier={1.2}
                  >
                    НОВОЕ УПРАЖНЕНИЕ
                  </Text>
                </View>
              </View>

              <View style={styles.upperPart2}>
                <Text
                  style={styles.upperText}
                  maxFontSizeMultiplier={1.2}
                >
                  ПРЕДЛОГИ И ПРЕДЛОГИ-ПРИСТАВКИ
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СДЕЛАНО{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {stats.prepositionAfterVerbs?.timesCompleted ?? 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СРЕДНИЙ РЕЗУЛЬТАТ{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {Number(
                      stats.prepositionAfterVerbs?.averageCompletionRate ?? 0
                    ).toFixed(2)}%
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* УПРАЖНЕНИЕ 7 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              hardlightedButtonStyle,
              {
                opacity: button4Opacity,
                transform: [{ translateY: button4TranslateY }],
              },
              isLocked('Exercise4') && lockStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() => handlePress('Exercise4')}
              style={styles.exerciseTouchable}
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  УПРАЖНЕНИЕ  7
                </Text>

                <Image
                  source={require('./star5.png')}
                  style={styles.image1}
                />
              </View>

              <View style={styles.upperPart2}>
                <Text
                  style={styles.upperText}
                  maxFontSizeMultiplier={1.2}
                >
                  СПРЯЖЕНИЕ ГЛАГОЛОВ РУССКИЙ-ИВРИТ
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СДЕЛАНО{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {stats.exercise4?.timesCompleted ?? 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СРЕДНИЙ РЕЗУЛЬТАТ{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {Number(
                      stats.exercise4?.averageCompletionRate ?? 0
                    ).toFixed(2)}%
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* УПРАЖНЕНИЕ 8 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              hardlightedButtonStyle,
              {
                opacity: button7Opacity,
                transform: [{ translateY: button7TranslateY }],
              },
              isLocked('Exercise7') && lockStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() => handlePress('Exercise7')}
              style={styles.exerciseTouchable}
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  УПРАЖНЕНИЕ  8
                </Text>

                <Image
                  source={require('./star5.png')}
                  style={styles.image1}
                />
              </View>

              <View style={styles.upperPart2}>
                <Text
                  style={styles.upperText}
                  maxFontSizeMultiplier={1.2}
                >
                  СПРЯЖЕНИЕ ГЛАГОЛОВ ИВРИТ-РУССКИЙ
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СДЕЛАНО{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {stats.exercise7?.timesCompleted ?? 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  СРЕДНИЙ РЕЗУЛЬТАТ{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {Number(
                      stats.exercise7?.averageCompletionRate ?? 0
                    ).toFixed(2)}%
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* УПРАЖНЕНИЯ 9 И 10 */}
{[
  {
    screen: 'Exercise9',
    statsKey: 'exercise9',
    number: 9,
    title: 'ГЛАГОЛ В ПРЕДЛОЖЕНИИ',
  },
  {
    screen: 'Exercise10',
    statsKey: 'exercise10',
    number: 10,
    title: 'УСЛЫШЬ И ПОЙМИ',
  },
].map(item => (
  <Animated.View
    key={item.screen}
    style={[
      styles.buttonContainer,
      {
        opacity: button7Opacity,
        transform: [{ translateY: button7TranslateY }],
      },
      isLocked(item.screen) && lockStyle,
    ]}
  >
    <TouchableOpacity
      onPress={() => handlePress(item.screen)}
      disabled={isLocked(item.screen)}
      accessibilityRole="button"
      accessibilityLabel={`Упражнение ${item.number}. ${item.title}`}
      accessibilityState={{
        disabled: isLocked(item.screen),
      }}
      style={styles.exerciseTouchable}
    >
      <View style={styles.upperPart1}>
        <Text
          style={styles.upperText1}
          maxFontSizeMultiplier={1.2}
        >
          УПРАЖНЕНИЕ {item.number}
        </Text>

        <Image
          source={require('./star5.png')}
          style={styles.image1}
        />
      </View>

      <View style={styles.upperPart2}>
        <Text
          style={styles.upperText}
          maxFontSizeMultiplier={1.2}
        >
          {item.title}
        </Text>
      </View>

      <View style={styles.lowerRight}>
        <Text
          style={styles.lowerText}
          maxFontSizeMultiplier={1.2}
        >
          СДЕЛАНО{' '}
          <Text
            style={styles.statValue}
            maxFontSizeMultiplier={1.2}
          >
            {stats[item.statsKey]?.timesCompleted ?? 0}
          </Text>
        </Text>

        <Text
          style={styles.lowerText}
          maxFontSizeMultiplier={1.2}
        >
          СРЕДНИЙ РЕЗУЛЬТАТ{' '}
          <Text
            style={styles.statValue}
            maxFontSizeMultiplier={1.2}
          >
            {Number(
              stats[item.statsKey]?.averageCompletionRate ?? 0
            ).toFixed(2)}%
          </Text>
        </Text>
      </View>
    </TouchableOpacity>
  </Animated.View>
))}

          <Animated.View
            style={[
              styles.infoWrap,
              {
                opacity: button9Opacity,
                transform: [{ translateY: button7TranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Image
                source={require('./quest.png')}
                style={styles.infoIcon}
              />

              <Text
                style={styles.infoText}
                numberOfLines={2}
                ellipsizeMode="tail"
                maxFontSizeMultiplier={1.2}
              >
                ОПИСАНИЕ ПРИЛОЖЕНИЯ
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <AppDescriptionModal
            visible={isModalVisible}
            onToggle={() => setIsModalVisible(false)}
          />

          <Animated.View
            style={[
              styles.infoWrap,
              {
                opacity: button9Opacity,
                transform: [{ translateY: button7TranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setIsInfoModalVisible(true)}
            >
              <Image
                source={require('./about4.png')}
                style={styles.infoIcon}
              />

              <Text
                style={styles.infoText}
                numberOfLines={2}
                ellipsizeMode="tail"
                maxFontSizeMultiplier={1.2}
              >
                О ПРИЛОЖЕНИИ
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <AppInfoModal
            visible={isInfoModalVisible}
            onToggle={() => setIsInfoModalVisible(false)}
          />

          <Animated.View
            style={[
              styles.infoWrap,
              {
                opacity: button9Opacity,
                transform: [{ translateY: button7TranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.infoButton, styles.bugReportButton]}
              onPress={handleReportBug}
            >
              <Text
                style={[styles.infoText, styles.bugReportText]}
                numberOfLines={2}
                ellipsizeMode="tail"
                maxFontSizeMultiplier={1.2}
              >
                СООБЩИТЬ ОБ ОШИБКЕ
              </Text>
            </TouchableOpacity>
          </Animated.View>





        </View>
      </ScrollView>

      <StatsReportModalMulti
        visible={isStatModalVisible}
        onClose={() => setIsStatModalVisible(false)}
        language="ru"
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },

  verbLibraryContainer: {
    width: '100%',
    marginTop: 12,
    marginBottom: 2,
  },

  verbLibraryButton: {
    width: '100%',
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#83A3CD',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#2D4769',
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },

  verbLibraryTextContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  verbLibraryTitle: {
    color: '#FFFDEF',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
    textAlign: 'center',
  },

  verbLibrarySubtitle: {
    marginTop: 2,
    color: '#E8EEF7',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#2D4769',
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
    position: 'relative',
  },

  exerciseTouchable: {
    width: '100%',
  },

  upperPart1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    flexWrap: 'wrap',
    columnGap: 8,
  },

  upperPart2: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },

  upperText1: {
    fontSize: 10,
    fontFamily: FONT_BOLD,
    color: '#2D4769',
    backgroundColor: 'white',
    padding: 3,
    borderRadius: 5,
    marginBottom: 10,
    marginLeft: 0,
    lineHeight: 14,
    flexShrink: 1,
    maxWidth: '100%',
  },

  upperText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
    width: '100%',
    lineHeight: 18,
  },

  lowerRight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    alignItems: 'stretch',
    flexWrap: 'wrap',
    gap: 6,
  },

  lowerText: {
    fontSize: 10,
    textAlign: 'center',
    backgroundColor: 'white',
    padding: 3,
    borderRadius: 5,
    color: '#2D4769',
    fontWeight: 'bold',
    marginLeft: 0,
    maxWidth: '100%',
    flexShrink: 1,
    lineHeight: 17,
  },

  image1: {
    width: 100,
    height: 25,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 10,
    flexShrink: 0,
    resizeMode: 'contain',
  },

  statValue: {
    color: 'red',
    fontWeight: 'bold',
    textAlignVertical: 'center',
    fontSize: 12,
    lineHeight: 17,
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
    height: 90,
  },

  infoWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },

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
    minHeight: 52,
    width: '100%',
  },

  infoIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },

  infoText: {
    flexShrink: 1,
    textAlign: 'center',
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 18,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
  },

  bugReportButton: {
    backgroundColor: '#bd462a',
    borderColor: '#2D4769',
  },

  bugReportText: {
    color: 'white',
  },

  prepositionButtonContainer: {
    borderWidth: 3,
    borderColor: '#ccff3e',
    backgroundColor: '#3F7C78',
    shadowColor: '#E85D4A',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },

  newExerciseBadge: {
    backgroundColor: '#E85D4A',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 0,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '100%',
    flexShrink: 1,
  },

  newExerciseText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 17,
    fontWeight: '900',
    textAlign: 'center',
  },

  rootButtonContainer: {
    backgroundColor: '#70558F',
    borderWidth: 3,
    borderColor: '#EBCB83',
    shadowColor: '#49345F',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },

  rootTouchable: {
    width: '100%',
  },

  rootHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 10,
  },

  rootTitle: {
    flexShrink: 1,
    color: '#2D4769',
    fontSize: 10,
    lineHeight: 14,
    fontFamily: FONT_BOLD,
    backgroundColor: 'white',
    padding: 3,
    borderRadius: 5,
    maxWidth: '100%',
  },

  rootNewBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: '#F5D991',
    maxWidth: '100%',
    flexShrink: 1,
  },

  rootNewText: {
    color: '#49345F',
    fontSize: 10,
    lineHeight: 17,
    fontWeight: '900',
    textAlign: 'center',
  },

  rootStats: {
    flexWrap: 'wrap',
    gap: 6,
  },
});           