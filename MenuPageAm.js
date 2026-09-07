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
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStatistics } from './stat';
import LottieView from 'lottie-react-native';
import AppDescriptionModal from './AppDescriptionModalAm';
import AppInfoModal from './AppInfoModalAm';
import FadeInView from './api/FadeInView';
import { ensureMarkedToday } from './serverPush';
import { useIap } from './src/iap/IapProvider';
import StatsReportModalMulti from './StatsReportModalMulti';
import Constants from 'expo-constants';
import UpgradeBanner from './UpgradeBanner';

const FREE_ROUTES_AM = new Set([
  'Exercise1Am',
  'Exercise2Am',
  'PrepositionExercise',
]);

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
    internalTrialEndsAt ||
    route?.params?.internalTrialEndsAt ||
    null;

  const lockStyle = {
    opacity: 0.45,
    backgroundColor: '#6f7f90',
  };

  const isLocked = routeName =>
    !fullAccess && !FREE_ROUTES_AM.has(routeName);

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

  useEffect(() => {
    navigation.setOptions({ headerLeft: () => null });
  }, [navigation]);

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
      navigation.reset({
        index: 0,
        routes: [{ name: 'LanguageSelectionPage' }],
      });
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandler.remove();
  }, [navigation]);

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

  const PREVIOUS_TOTAL_KEY = 'previousTotalExercises';

  const fetchStatistics = async () => {
    const exerciseIds = [
      'exercise1Am',
      'exercise2Am',
      'prepositionPronouns',
      'prepositionAfterVerbs',
      'exercise3Am',
      'exercise5Am',
      'exercise6Am',
      'exercise8Am',
      'exercise4Am',
      'exercise7Am',
    ];

    const statsData = {};

    for (let id of exerciseIds) {
      const stat = await getStatistics(id);

      statsData[id] = stat
        ? {
            timesCompleted: stat.timesCompleted ?? 0,
            averageCompletionRate: stat.averageCompletionRate ?? 0,
          }
        : {
            timesCompleted: 0,
            averageCompletionRate: 0,
          };
    }

    setStats(statsData);

    const totalCompletedNow = Object.values(statsData).reduce(
      (sum, stat) => sum + (stat?.timesCompleted || 0),
      0
    );

    try {
      const storedPrev = await AsyncStorage.getItem(PREVIOUS_TOTAL_KEY);
      const previousTotal = storedPrev
        ? parseInt(storedPrev, 10)
        : 0;

      if (totalCompletedNow > previousTotal) {
        await saveExerciseDate();

        try {
          await ensureMarkedToday().catch(e =>
            console.log('mark today failed', e)
          );
        } catch (e) {
          console.log(
            '⚠️ Не удалось пометить активность на сервере:',
            e
          );
        }
      } else {
        const today = new Date().toISOString().slice(0, 10);
        const storedDates = await AsyncStorage.getItem('activeDays');
        const activeDates = storedDates
          ? JSON.parse(storedDates)
          : [];

        if (activeDates.includes(today)) {
          try {
            await ensureMarkedToday();
          } catch (e) {
            console.log(
              '⚠️ Не удалось синхронизировать активность:',
              e
            );
          }
        }
      }

      await AsyncStorage.setItem(
        PREVIOUS_TOTAL_KEY,
        totalCompletedNow.toString()
      );
    } catch (error) {
      console.error(
        '❌ Ошибка при работе с previousTotalExercises:',
        error
      );
    }

    await calculateTotalStats(statsData);
  };

  const calculateTotalStats = async statsData => {
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

      let activeDates = storedDates
        ? JSON.parse(storedDates)
        : [];

      activeDates.forEach(date => uniqueDays.add(date));

      setTotalExercisesCompleted(totalCompleted);

      setAverageCompletionRate(
        count > 0
          ? (totalRate / count).toFixed(2)
          : 0
      );

      setActiveDays(uniqueDays.size);
    } catch (error) {
      console.error(
        '❌ Ошибка при вычислении статистики:',
        error
      );
    }
  };

  const saveExerciseDate = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const storedDates = await AsyncStorage.getItem('activeDays');

      let activeDates = storedDates
        ? JSON.parse(storedDates)
        : [];

      if (!activeDates.includes(today)) {
        activeDates.push(today);

        await AsyncStorage.setItem(
          'activeDays',
          JSON.stringify(activeDates)
        );

        console.log('✅ День добавлен:', today);
      } else {
        console.log('ℹ️ День уже есть, не добавляем.');
      }

      const updatedDates =
        await AsyncStorage.getItem('activeDays');

      let parsed = updatedDates
        ? JSON.parse(updatedDates)
        : [];

      setActiveDays(new Set(parsed).size);
    } catch (error) {
      console.error(
        '❌ Ошибка при сохранении даты активности:',
        error
      );
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

  const handleReportBug = useCallback(async () => {
    const to = 'verbify2025@gmail.com';
    const subject = encodeURIComponent(
      'የVERBIFY መረጃ ጎታ ስህተት ሪፖርት (AM)'
    );

    const body = encodeURIComponent(
      [
        'VERBIFY መተግበሪያውን በመጠቀም እና ስህተቶችን ለመከላከል የምትረዱልን በጣም እናመሰግናለን!',
        '',
        'መልዕክትዎ ትርጉሞችን፣ ምሳሌዎችን እና ሰዋሰውን (እንዲሁም ድምጽ) ስህተቶችን እንድንፈርስ ይረዳናል።',
        '',
        'እባክዎ የሚችሉትን መረጃ በተቻለ መጠን ይሙሉ:',
        '',
        '1) ስህተቱን ያገኙት የት ነው?',
        '',
        '   • የበይነመረብ / መተግበሪያ ቋንቋ (am/en/ru/...):',
        '',
        '     ______________________________',
        '',
        '   • ልምምድ / ስክሪን (ምሳሌ፡ ልምምድ 1, የግስ ዝርዝር ወዘተ):',
        '',
        '     ______________________________',
        '',
        '   • ግስ / ቃል (የዕብራይስጥ ኢንፊኒቲቭ + ትርጉም):',
        '',
        '     ______________________________',
        '',
        '',
        '2) ትክክለኛው ምንድን ነው የተሳሳተው? (የሚመረጡትን ይቀርቡ):',
        '',
        '   • የትርጉም ስህተት',
        '   • የትራንስሊተሬሽን ስህተት',
        '   • የሰዋሰው ስህተት (ጾታ / ብዛት / ጊዜ / ሰው ወዘተ)',
        '   • በምሳሌ ነገር ውስጥ ስህተት (የቃላት ቅደም ተከተል፣ የቅጽ ስህተት ወዘተ)',
        '   • የድምጽ ስህተት (ሌላ ቅጽ / ሌላ ግስ / ድምጽ ጥራት)',
        '   • ሌላ፡',
        '',
        '     ______________________________',
        '',
        '',
        '3) ዝርዝር መግለጫ:',
        '',
        '   • አሁን እንዴት ነው (የተሳሳተው ቅጽ):',
        '',
        '     ______________________________',
        '',
        '   • እንዴት መሆን አለበት (ትክክለኛው ቅጽ):',
        '',
        '     ______________________________',
        '',
        '',
        '4) ከፈለጉ እንዲሁም የስክሪንሹት መጠቆሚያ ምስል መያዝ ትችላላችሁ።',
        '',
        '',
        '5) መተግበሪያውን እንዴት እንደሚሻሻል የምትመኑት ተጨማሪ ሃሳቦች ካሉዎት እባክዎ ይጨምሩ:',
        '',
        '     ______________________________',
        '',
        '---',
        '',
        'ቴክኒክ መረጃ:',
        `App version: ${Constants?.expoConfig?.version || 'unknown'}`,
        `Platform: ${Platform.OS} (${Platform.Version})`,
      ].join('\n')
    );

    const url =
      `mailto:${to}?subject=${subject}&body=${body}`;

    try {
      const canOpen =
        await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.warn(
          'Cannot open mail client for bug report (am)'
        );
      }
    } catch (e) {
      console.warn(
        'Error opening mail client for bug report (am):',
        e
      );
    }
  }, []);

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
      const storedName =
        await AsyncStorage.getItem('name');

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

  const handlePress = exercise => {
    if (isLocked(exercise)) {
      return;
    }

    if (
      exercise === 'PrepositionExercise' ||
      exercise === 'PrepositionVerbExercise'
    ) {
      navigation.navigate(exercise, {
        language: 'am',
      });

      return;
    }

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
        Animated.timing(button9Opacity, {
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
  }, [
    animationTriggered,
    navigateTo,
    navigation,
  ]);

  useEffect(() => {
    if (!statsAnimationFinished) {
      const timer = setTimeout(
        () => setStatsAnimationFinished(true),
        3500
      );

      return () => clearTimeout(timer);
    }
  }, [statsAnimationFinished]);

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
            ሰላም, {name}!
          </Text>
        </Animated.View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            setIsStatModalVisible(true)
          }
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

                <FadeInView
                  style={styles.statsTextContainer}
                >
                  <View style={styles.statsRow}>
                    <Text
                      style={styles.statsText}
                      maxFontSizeMultiplier={1.2}
                    >
                      የተጠናቀቁ እቃዎች
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
                      የመካከለኛ ውጤት
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
                      የስልጠና ቀናት
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

      <View style={styles.content}>

  {/* የግስ ማውጫ */}
  <Animated.View
    style={[
      styles.verbLibraryContainer,
      { opacity: verbLibraryOpacity },
    ]}
  >
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.verbLibraryButton}
      onPress={() => navigation.navigate('VerbLibrary', { language: 'am' })}
    >
      <View style={styles.verbLibraryTextContainer}>
        <Text
          style={styles.verbLibraryTitle}
          maxFontSizeMultiplier={1.2}
        >
          የግስ ካርዶች
        </Text>

        <Text
          style={styles.verbLibrarySubtitle}
          maxFontSizeMultiplier={1.2}
        >
          የVERBIFY ሙሉ የግስ ማውጫ
        </Text>
      </View>
    </TouchableOpacity>
  </Animated.View>

  <Animated.Text
    style={[styles.titleText, { opacity: titleOpacity }]}
    maxFontSizeMultiplier={1.2}
  >
    ልምምድ ይምረጡ
  </Animated.Text>

          {/* 1 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: button1Opacity,
                transform: [
                  {
                    translateY:
                      button1TranslateY,
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                handlePress('Exercise1Am')
              }
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  ልምምድ 1
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
                  የዕብራይስጥ–አማርኛ ግስ ካርታዎች
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  ተጠናቀቀ{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise1Am']
                      ? stats['exercise1Am']
                          .timesCompleted
                      : 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  የመካከለኛ ውጤት{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise1Am']
                      ? stats[
                          'exercise1Am'
                        ].averageCompletionRate.toFixed(
                          2
                        )
                      : 0}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* 2 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: button2Opacity,
                transform: [
                  {
                    translateY:
                      button2TranslateY,
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                handlePress('Exercise2Am')
              }
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  ልምምድ 2
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
                  የአማርኛ–ዕብራይስጥ ግስ ካርታዎች
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  ተጠናቀቀ{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise2Am']
                      ? stats['exercise2Am']
                          .timesCompleted
                      : 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  የመካከለኛ ውጤት{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise2Am']
                      ? stats[
                          'exercise2Am'
                        ].averageCompletionRate.toFixed(
                          2
                        )
                      : 0}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* መስተዋድዶች 1 — FREE */}
          <Animated.View
            style={[
              styles.buttonContainer,
              styles.prepositionButtonContainer,
              {
                opacity: button3Opacity,
                transform: [
                  {
                    translateY:
                      button3TranslateY,
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                handlePress(
                  'PrepositionExercise'
                )
              }
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  መስተዋድዶች 1
                </Text>

                <Text
                  style={[
                    styles.upperText1,
                    styles.newExerciseBadge,
                  ]}
                  maxFontSizeMultiplier={1.2}
                >
                  አዲስ
                </Text>
              </View>

              <View style={styles.upperPart2}>
                <Text
                  style={styles.upperText}
                  maxFontSizeMultiplier={1.2}
                >
                  ከተውላጠ ስም ቅጥያዎች ጋር የሚጣመሩ መስተዋድዶች
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  የተጠናቀቀ{' '}
                  <Text style={styles.statValue}>
                    {stats.prepositionPronouns
                      ? stats
                          .prepositionPronouns
                          .timesCompleted
                      : 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  አማካይ ውጤት{' '}
                  <Text style={styles.statValue}>
                    {stats.prepositionPronouns
                      ? stats.prepositionPronouns.averageCompletionRate.toFixed(
                          2
                        )
                      : 0}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <UpgradeBanner
            hasPro={hasPro}
            navigation={navigation}
            language="am"
            internalTrialActive={trialActive}
            internalTrialEndsAt={trialEndsAt}
            animatedStyle={{
              opacity: button3Opacity,
              transform: [
                {
                  translateY:
                    button3TranslateY,
                },
              ],
            }}
          />

          {/* 3 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: button3Opacity,
                transform: [
                  {
                    translateY:
                      button3TranslateY,
                  },
                ],
              },
              isLocked('Exercise3Am') &&
                lockStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                handlePress('Exercise3Am')
              }
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  ልምምድ 3
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
                  ቢንያን ይለዩ
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  ተጠናቀቀ{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise3Am']
                      ? stats['exercise3Am']
                          .timesCompleted
                      : 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  የመካከለኛ ውጤት{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise3Am']
                      ? stats[
                          'exercise3Am'
                        ].averageCompletionRate.toFixed(
                          2
                        )
                      : 0}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* 4 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: button6Opacity,
                transform: [
                  {
                    translateY:
                      button6TranslateY,
                  },
                ],
              },
              isLocked('Exercise5Am') &&
                lockStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                handlePress('Exercise5Am')
              }
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  ልምምድ 4
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
                  ትዕዛዝ ቅጽ (Imperative)
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  ተጠናቀቀ{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise5Am']
                      ? stats['exercise5Am']
                          .timesCompleted
                      : 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  የመካከለኛ ውጤት{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise5Am']
                      ? stats[
                          'exercise5Am'
                        ].averageCompletionRate.toFixed(
                          2
                        )
                      : 0}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* 5 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              highlightedButtonStyle,
              {
                opacity: button5Opacity,
                transform: [
                  {
                    translateY:
                      button5TranslateY,
                  },
                ],
              },
              isLocked('Exercise6Am') &&
                lockStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                handlePress('Exercise6Am')
              }
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  ልምምድ 5
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
                  የአማርኛ–ዕብራይስጥ ግስ ማጣመር
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  ተጠናቀቀ{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise6Am']
                      ? stats['exercise6Am']
                          .timesCompleted
                      : 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  የመካከለኛ ውጤት{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise6Am']
                      ? stats[
                          'exercise6Am'
                        ].averageCompletionRate.toFixed(
                          2
                        )
                      : 0}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* 6 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              highlightedButtonStyle,
              {
                opacity: button8Opacity,
                transform: [
                  {
                    translateY:
                      button8TranslateY,
                  },
                ],
              },
              isLocked('Exercise8Am') &&
                lockStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                handlePress('Exercise8Am')
              }
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  ልምምድ 6
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
                  የዕብራይስጥ–አማርኛ ግስ ማጣመር
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  ተጠናቀቀ{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise8Am']
                      ? stats['exercise8Am']
                          .timesCompleted
                      : 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  የመካከለኛ ውጤት{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise8Am']
                      ? stats[
                          'exercise8Am'
                        ].averageCompletionRate.toFixed(
                          2
                        )
                      : 0}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* መስተዋድዶች 2 — PAID */}
          <Animated.View
            style={[
              styles.buttonContainer,
              styles.prepositionButtonContainer,
              {
                opacity: button4Opacity,
                transform: [
                  {
                    translateY:
                      button4TranslateY,
                  },
                ],
              },
              isLocked(
                'PrepositionVerbExercise'
              ) && lockStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                handlePress(
                  'PrepositionVerbExercise'
                )
              }
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  መስተዋድዶች 2
                </Text>

                <Text
                  style={[
                    styles.upperText1,
                    {
                      backgroundColor:
                        '#E85D4A',
                      color: '#FFF',
                      marginRight: 10,
                    },
                  ]}
                  maxFontSizeMultiplier={1.2}
                >
                  አዲስ
                </Text>
              </View>

              <View style={styles.upperPart2}>
                <Text
                  style={styles.upperText}
                  numberOfLines={2}
                  maxFontSizeMultiplier={1.2}
                >
                  ከግሶች በኋላ የሚመጡ እና ተያያዥ መስተዋድዶች
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  ተጠናቋል{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {stats.prepositionAfterVerbs
                      ? stats
                          .prepositionAfterVerbs
                          .timesCompleted
                      : 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  አማካይ ውጤት{' '}
                  <Text
                    style={styles.statValue}
                    maxFontSizeMultiplier={1.2}
                  >
                    {stats.prepositionAfterVerbs
                      ? Number(
                          stats
                            .prepositionAfterVerbs
                            .averageCompletionRate ??
                            0
                        ).toFixed(2)
                      : '0.00'}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* 7 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              hardlightedButtonStyle,
              {
                opacity: button4Opacity,
                transform: [
                  {
                    translateY:
                      button4TranslateY,
                  },
                ],
              },
              isLocked('Exercise4Am') &&
                lockStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                handlePress('Exercise4Am')
              }
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  ልምምድ 7
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
                  የአማርኛ–ዕብራይስጥ መለዋወጫ ግሶች
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  ተጠናቀቀ{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise4Am']
                      ? stats['exercise4Am']
                          .timesCompleted
                      : 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  የመካከለኛ ውጤት{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise4Am']
                      ? stats[
                          'exercise4Am'
                        ].averageCompletionRate.toFixed(
                          2
                        )
                      : 0}
                    %
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* 8 */}
          <Animated.View
            style={[
              styles.buttonContainer,
              hardlightedButtonStyle,
              {
                opacity: button7Opacity,
                transform: [
                  {
                    translateY:
                      button7TranslateY,
                  },
                ],
              },
              isLocked('Exercise7Am') &&
                lockStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                handlePress('Exercise7Am')
              }
            >
              <View style={styles.upperPart1}>
                <Text
                  style={styles.upperText1}
                  maxFontSizeMultiplier={1.2}
                >
                  ልምምድ 8
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
                  የዕብራይስጥ–አማርኛ መለዋወጫ ግሶች
                </Text>
              </View>

              <View style={styles.lowerRight}>
                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  ተጠናቀቀ{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise7Am']
                      ? stats['exercise7Am']
                          .timesCompleted
                      : 0}
                  </Text>
                </Text>

                <Text
                  style={styles.lowerText}
                  maxFontSizeMultiplier={1.2}
                >
                  የመካከለኛ ውጤት{' '}
                  <Text style={styles.statValue}>
                    {stats['exercise7Am']
                      ? stats[
                          'exercise7Am'
                        ].averageCompletionRate.toFixed(
                          2
                        )
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
              {
                opacity: button9Opacity,
                transform: [
                  {
                    translateY:
                      button7TranslateY,
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() =>
                setIsModalVisible(true)
              }
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
                የመተግበሪያው መግለጫ
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <AppDescriptionModal
            visible={isModalVisible}
            onToggle={() =>
              setIsModalVisible(false)
            }
          />

          {/* ABOUT */}
          <Animated.View
            style={[
              styles.infoWrap,
              {
                opacity: button9Opacity,
                transform: [
                  {
                    translateY:
                      button7TranslateY,
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() =>
                setIsInfoModalVisible(true)
              }
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
                ስለ መተግበሪያው
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <AppInfoModal
            visible={isInfoModalVisible}
            onToggle={() =>
              setIsInfoModalVisible(false)
            }
          />

          {/* REPORT BUG */}
          <Animated.View
            style={[
              styles.infoWrap,
              {
                opacity: button9Opacity,
                transform: [
                  {
                    translateY:
                      button7TranslateY,
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.infoButton,
                {
                  backgroundColor:
                    '#bd462a',
                  borderColor: '#2D4769',
                },
              ]}
              onPress={handleReportBug}
            >
              <Text
                style={styles.infoText}
                numberOfLines={2}
                ellipsizeMode="tail"
                maxFontSizeMultiplier={1.2}
              >
                ስህተት ያመልክቱ
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>

      <StatsReportModalMulti
        visible={isStatModalVisible}
        onClose={() =>
          setIsStatModalVisible(false)
        }
        language="am"
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#2D4769',
    marginTop: 10,
  },

  verbLibraryContainer:{
  width:'100%',
  marginTop:12,
  marginBottom:2,
},

verbLibraryButton:{
  width:'100%',
  minHeight:82,
  alignItems:'center',
  justifyContent:'center',

  backgroundColor:'#83A3CD',

  borderRadius:12,
  borderWidth:3,
  borderColor:'#2D4769',

  paddingHorizontal:14,
  paddingVertical:7,

  shadowColor:'#000',
  shadowOpacity:0.15,
  shadowRadius:6,
  shadowOffset:{
    width:0,
    height:3,
  },
  elevation:5,
},

verbLibraryTextContainer:{
  width:'100%',
  alignItems:'center',
  justifyContent:'center',
},

verbLibraryTitle:{
  color:'#FFFDEF',
  fontSize:17,
  lineHeight:21,
  fontWeight:'900',
  textAlign:'center',
},

verbLibrarySubtitle:{
  marginTop:2,
  color:'#E8EEF7',
  fontSize:12,
  lineHeight:16,
  fontWeight:'800',
  textAlign:'center',
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
    fontSize: 13,
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

  prepositionButtonContainer: {
    backgroundColor: '#3F7C78',
    borderWidth: 3,
    borderColor: '#E85D4A',
    shadowColor: '#E85D4A',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 8,
  },

  newExerciseBadge: {
    backgroundColor: '#E85D4A',
    color: '#FFFFFF',
    marginLeft: 0,
    marginRight: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});