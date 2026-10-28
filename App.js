// App.js
import './src/ui/iosFontWeightPatch';
// import { Settings, AppEventsLogger } from 'react-native-fbsdk-next';
import { Settings } from 'react-native-fbsdk-next';
import './polyfills';
import 'react-native-gesture-handler';
import './animatedTimingPatch';
import './debugAnimatedTiming';
import './debugAnimated';
import { Audio } from 'expo-av';
import StartupGate from './StartupGate';
import React, { useEffect, useRef, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { StatusBar, AppState, View, Image, Text, TouchableOpacity, Platform, Alert, Linking, } from 'react-native';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef, } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets, initialWindowMetrics, } from 'react-native-safe-area-context';
import { withAccessGate } from './src/iap/withAccessGate';
// === серверные пуши ===
import { setServerSchedule, clearServerSchedule, registerDeviceOnServer, setAltServerSchedule, getExpoPushTokenAsync, forceReRegisterAndReschedule, } from './serverPush';
// экраны
import LanguageSelectionPage from './LanguageSelectionPage';
import WelcomePage from './WelcomePage';
import WelcomePageEn from './WelcomePageEn';
import WelcomePageFr from './WelcomePageFr';
import WelcomePageEs from './WelcomePageEs';
import WelcomePagePt from './WelcomePagePt';
import WelcomePageAr from './WelcomePageAr';
import WelcomePageAm from './WelcomePageAm';
import MenuPage from './MenuPage';
import MenuPageEn from './MenuPageEn';
import MenuPageFr from './MenuPageFr';
import MenuPageEs from './MenuPageEs';
import MenuPagePt from './MenuPagePt';
import MenuPageAr from './MenuPageAr';
import MenuPageAm from './MenuPageAm';
import Exercise1 from './Exercise1';
import Exercise2 from './Exercise2';
import PrepositionExercise from './PrepositionExercise';
import PrepositionVerbExercise from './PrepositionVerbExercise';
import VerbLibraryScreen from './VerbLibraryScreen';
import VerbDetailsScreen from './VerbDetailsScreen';
import Exercise3Screen from './Exercise3Screen';
import Exercise4Screen from './Exercise4Screen';
import Exercise5Screen from './Exercise5Screen';
import Exercise6Screen from './Exercise6Screen';
import Exercise7Screen from './Exercise7Screen';
import Exercise8Screen from './Exercise8Screen';
import RootVerbExercise from './RootVerbExercise';
import Exercise9 from './Exercise9';
import Exercise10 from './Exercise10';
import Exercise11 from './Exercise11';
import Exercise12 from './Exercise12';
import ChatBotModal from './api/ChatBotModal';
import { ExerciseAIProvider, useExerciseAI } from './ExerciseAIContext';
// IAP и Paywall
import Constants from 'expo-constants';
import { IapProvider, NoIapProvider } from './src/iap/IapProvider';
import Paywall from './screens/Paywall';
import PaywallIOS from './screens/PaywallIOS';
import { withMenuGate } from './src/iap/withMenuGate';
Sentry.init({
  dsn: 'https\://1cfe11543c2a7b5d12b7bb5b764b37c1\@o4511602556796928.ingest.de.sentry.io/4511602578227280',
  enableAutoSessionTracking: true,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    return event;
  },
});
const gate = withAccessGate;
SplashScreen.preventAutoHideAsync().catch(() => {});
const CHAT_HISTORY_KEY = 'chatHistory';
const SESSION_KEY = 'chatSessionId';
const Stack = createStackNavigator();
// ✅ ref навигации (для получения текущего route без хуков)
const navigationRef = createNavigationContainerRef();
// Тема: белый фон
const AppTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#FFFFFF' },
};
// Уведомления
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
/* =========================
   ВАЖНО: СТАБИЛЬНЫЕ ОБЁРТКИ
   \\\\========================= */
// Меню (ulpan)
const MenuPageUlpan = withMenuGate(MenuPage, 'ulpan');
const MenuPageEnUlpan = withMenuGate(MenuPageEn, 'ulpan');
const MenuPageFrUlpan = withMenuGate(MenuPageFr, 'ulpan');
const MenuPageEsUlpan = withMenuGate(MenuPageEs, 'ulpan');
const MenuPagePtUlpan = withMenuGate(MenuPagePt, 'ulpan');
const MenuPageArUlpan = withMenuGate(MenuPageAr, 'ulpan');
const MenuPageAmUlpan = withMenuGate(MenuPageAm, 'ulpan');
// Упражнения (gate)
const Exercise1G = Exercise1;
const Exercise2G = Exercise2;
const Exercise3ScreenG = gate(Exercise3Screen);
const Exercise4ScreenG = gate(Exercise4Screen);
const Exercise5ScreenG = gate(Exercise5Screen);
const Exercise6ScreenG = gate(Exercise6Screen);
const Exercise7ScreenG = gate(Exercise7Screen);
const Exercise8ScreenG = gate(Exercise8Screen);
const Exercise9G = gate(Exercise9);
const Exercise10G = gate(Exercise10);
const Exercise11G = gate(Exercise11);
const Exercise12G = gate(Exercise12);
// Legacy route names do NOT match the visible exercise numbers after Exercise 3.
// Keep the historical route names so menu/access/navigation behavior stays compatible:
// visible 3 -> Exercise3
// visible 4 -> Exercise5
// visible 5 -> Exercise6
// visible 6 -> Exercise8
// visible 7 -> Exercise4
// visible 8 -> Exercise7
const UNIVERSAL_EXERCISE_SCREENS = [
  ['Exercise1', 1, Exercise1G],
  ['Exercise2', 2, Exercise2G],
  ['Exercise3', 3, Exercise3ScreenG],
  ['Exercise5', 4, Exercise4ScreenG],
  ['Exercise6', 5, Exercise5ScreenG],
  ['Exercise8', 6, Exercise6ScreenG],
  ['Exercise4', 7, Exercise7ScreenG],
  ['Exercise7', 8, Exercise8ScreenG],
];
/* ===== Кастомный компактный Header (44dp) ===== */
function CompactHeader({ navigation, options, back, route }) {
  const { startVisible } = useExerciseAI();
  const { top } = useSafeAreaInsets();
  const rtl = options.headerRtl === true;
  const resolveMenuRoute = (routeName) => {
    if (routeName?.endsWith('En')) return 'MenuEn';
    if (routeName?.endsWith('Fr')) return 'MenuFr';
    if (routeName?.endsWith('Es')) return 'MenuEs';
    if (routeName?.endsWith('Pt')) return 'MenuPt';
    if (routeName?.endsWith('Ar')) return 'MenuAr';
    if (routeName?.endsWith('Am')) return 'MenuAm';
    return 'Menu';
  };
  const isExerciseScreen = /^Exercise\d+/.test(route?.name || '');
  const isMenuScreen =
    route?.name === 'Menu' ||
    route?.name === 'MenuEn' ||
    route?.name === 'MenuFr' ||
    route?.name === 'MenuEs' ||
    route?.name === 'MenuPt' ||
    route?.name === 'MenuAr' ||
    route?.name === 'MenuAm';
  const forceBack = options.headerForceBack === true;
  const backTarget = options.headerBackTarget;
  const shouldShowBack = forceBack || !!back || isExerciseScreen;
  const onBackPress = () => {
    if (backTarget) {
      // Для меню пересобираем стек, чтобы было ровно:
      // LanguageSelectionPage -> WelcomeXx
      // и не оставались старые Welcome / Paywall в истории.
      if (isMenuScreen) {
        navigation.reset({
          index: 1,
          routes: [
            { name: 'LanguageSelectionPage' },
            { name: backTarget },
          ],
        });
        return;
      }
      // Для остальных экранов простой replace достаточно
      navigation.replace(backTarget);
      return;
    }
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate(resolveMenuRoute(route?.name || ''));
  };
  const Right = (options.headerHideAI === true || (isExerciseScreen && route?.params?.showExerciseAI === false)) ? null :
    typeof options.headerRight === 'function'
      ? options.headerRight({ tintColor: '#fff' })
      : options.headerRight || null;
  const titleShiftY = Platform.OS === 'android' ? (rtl ? 2 : 0) : (rtl ? 1 : 0);
  const titleNode =
    typeof options.headerTitle === 'function' ? (
      options.headerTitle({ tintColor: '#fff' })
    ) : (
      <Text
        numberOfLines={1}
        style={{
          color: '#fff',
          fontFamily: rtl ? 'ar-bold' : 'mt-bold',
          fontSize: 20,
          lineHeight: rtl ? 26 : 22,
          textAlign: rtl ? 'right' : 'left',
          writingDirection: rtl ? 'rtl' : 'ltr',
          transform: [{ translateY: titleShiftY }],
        }}
      >
        {options.headerTitle ?? options.title ?? ''}
      </Text>
    );
  return (
    <View
      style={{
        height: 38 + top,
        paddingTop: top,
        backgroundColor: '#6C8EBB',
        flexDirection: rtl ? 'row-reverse' : 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
      }}
    >
      {shouldShowBack ? (
        <TouchableOpacity
          onPress={onBackPress}
          style={{
            padding: 8,
            marginRight: rtl ? 0 : 4,
            marginLeft: rtl ? 4 : 0,
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={rtl ? 'chevron-forward' : 'chevron-back'}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 28 }} />
      )}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: rtl ? 'flex-end' : 'flex-start',
        }}
      >
        {titleNode}
      </View>
      <View style={{ marginLeft: rtl ? 0 : 8, marginRight: rtl ? 8 : 0 }}>
        {Right}
      </View>
    </View>
  );
}
const SENTENCE_EXERCISE_HEADER_LABELS = {
  ru: 'Упражнение',
  en: 'Exercise',
  fr: 'Exercice',
  es: 'Ejercicio',
  pt: 'Exercício',
  ar: 'التمرين',
  am: 'ልምምድ',
};
const normalizeSentenceHeaderLanguage = value => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  const aliases = {
    ru: 'ru',
    russian: 'ru',
    rus: 'ru',
    'ru-ru': 'ru',
    en: 'en',
    english: 'en',
    eng: 'en',
    'en-us': 'en',
    'en-gb': 'en',
    fr: 'fr',
    french: 'fr',
    fra: 'fr',
    'fr-fr': 'fr',
    es: 'es',
    spanish: 'es',
    spa: 'es',
    'es-es': 'es',
    pt: 'pt',
    portuguese: 'pt',
    por: 'pt',
    'pt-pt': 'pt',
    'pt-br': 'pt',
    ar: 'ar',
    arabic: 'ar',
    arab: 'ar',
    ara: 'ar',
    'ar-il': 'ar',
    am: 'am',
    amharic: 'am',
    amh: 'am',
    'am-et': 'am',
  };
  return aliases[normalized] || null;
};
const sentenceLanguageFromPreviousRoute = navigation => {
  try {
    const state = navigation?.getState?.();
    if (!state?.routes?.length) return null;
    const currentIndex =
      typeof state.index === 'number'
        ? state.index
        : state.routes.length - 1;
    const previousRoute =
      currentIndex > 0
        ? state.routes[currentIndex - 1]
        : null;
    const routeMap = {
      Menu: 'ru',
      MenuEn: 'en',
      MenuFr: 'fr',
      MenuEs: 'es',
      MenuPt: 'pt',
      MenuAr: 'ar',
      MenuAm: 'am',
    };
    return routeMap[previousRoute?.name] || null;
  } catch (_) {
    return null;
  }
};
function SentenceExerciseHeader(props) {
  const { navigation, route, options, exerciseNumber } = props;
  const routeLanguage =
    normalizeSentenceHeaderLanguage(
      route?.params?.language
    );
  const previousRouteLanguage =
    sentenceLanguageFromPreviousRoute(
      navigation
    );
  const [language, setLanguage] = useState(
    routeLanguage ||
      previousRouteLanguage ||
      null
  );
  useEffect(() => {
    let active = true;
    if (routeLanguage) {
      setLanguage(routeLanguage);
      return () => {
        active = false;
      };
    }
    if (previousRouteLanguage) {
      setLanguage(previousRouteLanguage);
    }
    AsyncStorage.getItem('language')
      .then(storedLanguage => {
        if (!active) return;
        const normalized =
          normalizeSentenceHeaderLanguage(
            storedLanguage
          );
        if (normalized) {
          setLanguage(normalized);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [
    routeLanguage,
    previousRouteLanguage,
  ]);
  const resolvedLanguage =
    language ||
    routeLanguage ||
    previousRouteLanguage ||
    'ru';
  const rtl = resolvedLanguage === 'ar';
  const label =
    SENTENCE_EXERCISE_HEADER_LABELS[
      resolvedLanguage
    ] ||
    SENTENCE_EXERCISE_HEADER_LABELS.ru;
  const localizedTitle = `${label} ${exerciseNumber}`;
  const localizedOptions = {
    ...options,
    headerForceBack: true,
    headerRtl: rtl,
    headerTitle: () => (
      <Text
        maxFontSizeMultiplier={1.1}
        numberOfLines={1}
        style={{
          color: '#fff',
          fontSize: 16,
          lineHeight: 18,
          fontFamily: rtl ? 'ar-bold' : 'mt-bold',
          textAlign: rtl ? 'right' : 'left',
          writingDirection: rtl ? 'rtl' : 'ltr',
          ...(rtl ? { marginTop: 4 } : null),
        }}
      >
        {localizedTitle}
      </Text>
    ),
  };
  return (
    <CompactHeader
      {...props}
      options={localizedOptions}
    />
  );
}
/* ===== ВНЕШНИЙ компонент — провайдеры (IAP + SafeArea) ===== */
function App() {
  const extra = Constants.expoConfig?.extra || {};
const isExpoGo = Constants.appOwnership === 'expo';
const store = String(extra.store || '').toLowerCase();
// допустимые значения под себя: 'gp' (android), 'ios'/'as' (ios)
const isStoreBuild =
  (Platform.OS === 'android' && store === 'gp') ||
  (Platform.OS === 'ios' && (store === 'ios' || store === 'as' || store === 'appstore'));
const USE_IAP = !isExpoGo && isStoreBuild && !extra.disableIap;
const RootProvider = USE_IAP ? IapProvider : NoIapProvider;
  return (
    <RootProvider initialSegment="default">
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AppInner />
      </SafeAreaProvider>
    </RootProvider>
  );
}
/* ===== ВНУТРЕННИЙ компонент — логика и навигация ===== */
function AppInner() {
  const appState = useRef(AppState.currentState);
  const blockModalCloseRef = useRef(false);
  const insets = useSafeAreaInsets();
  const TOP_INSET = insets.top || 0;
  const TITLE_FS = 16;
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsReady, setNotificationsReady] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [startVisible, setStartVisible] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  /* =========================
     ATT + META
     \\\\========================= */
 useEffect(() => {
  if (!fontsReady) return;
  const initMetaAfterATT = async () => {
    try {
      // Android — ATT не используется
      if (Platform.OS !== 'ios') {
        Settings.initializeSDK();
        return;
      }
      const { status } =
        await TrackingTransparency.getTrackingPermissionsAsync();
      console.log(
        '[ATT] current status:',
        status
      );
      let finalStatus = status;
      if (status === 'undetermined') {
        const result =
          await TrackingTransparency.requestTrackingPermissionsAsync();
        finalStatus = result.status;
        console.log(
          '[ATT] request result:',
          finalStatus
        );
      }
      // Meta запускается только после ATT
      Settings.initializeSDK();
      const trackingAllowed =
        finalStatus === 'granted';
      await Settings.setAdvertiserTrackingEnabled(
        trackingAllowed
      );
      await Settings.setAdvertiserIDCollectionEnabled(
        trackingAllowed
      );
      console.log(
        '[Meta] initialized. Tracking:',
        trackingAllowed
      );
    } catch (e) {
      console.log(
        '[ATT/META ERROR]',
        e
      );
    }
  };
  initMetaAfterATT();
}, [fontsReady]);
  /* =========================
     AUDIO
     \\\\========================= */
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
        });
        await Audio.setIsEnabledAsync(true);
      } catch (e) {
        console.log(
          '[Audio init] error',
          e
        );
      }
    })();
  }, []);
  useEffect(() => {
    const sub =
      AppState.addEventListener(
        'change',
        async state => {
          if (state === 'active') {
            try {
              await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: false,
              });
              await Audio.setIsEnabledAsync(
                true
              );
              console.log(
                '[Audio] restored'
              );
            } catch (e) {
              console.log(
                '[Audio] restore error',
                e
              );
            }
          }
        }
      );
    return () => sub.remove();
  }, []);
  // ✅ текущее имя роута (для цвета футера)
  // ✅ текущее имя роута (для цвета футера)
  const [currentRouteName, setCurrentRouteName] = useState('LanguageSelectionPage');
  const [currentBottomSafeAreaStage, setCurrentBottomSafeAreaStage] = useState('settings');
  const isMenuRoute =
    currentRouteName === 'Menu' ||
    currentRouteName === 'MenuEn' ||
    currentRouteName === 'MenuFr' ||
    currentRouteName === 'MenuEs' ||
    currentRouteName === 'MenuPt' ||
    currentRouteName === 'MenuAr' ||
    currentRouteName === 'MenuAm';
  // Основной фон нижней Safe Area: у старых упражнений настройки и игра различаются.
  const oldExerciseRoutes = [
    'Exercise1', 'Exercise2', 'Exercise3', 'Exercise5',
    'Exercise6', 'Exercise8', 'Exercise4', 'Exercise7',
  ];
  const blueRoutes = [
    'Exercise9', 'Exercise10', 'RootVerbExercise',
    'PrepositionVerbExercise', 'PrepositionExercise', 'VerbDetails', 'VerbLibrary',
  ];
  const bottomBg = ['Exercise11', 'Exercise12'].includes(currentRouteName)
    ? '#AFC1D0' // Same as Exercise11 screen and transparent keyboard footer.
    : isMenuRoute
    ? '#F0F0F0'
    : blueRoutes.includes(currentRouteName) ||
      (oldExerciseRoutes.includes(currentRouteName) && currentBottomSafeAreaStage === 'settings')
        ? '#83A3CD'
        : '#AFC1D0';
  const syncRouteName = () => {
    try {
      const activeRoute = navigationRef.getCurrentRoute?.();
      const name = activeRoute?.name;
      if (name) {
        if (name !== currentRouteName) setStartVisible(false);
        setCurrentRouteName(name);
        setCurrentBottomSafeAreaStage(activeRoute?.params?.bottomSafeAreaStage || 'settings');
      }
    } catch (_) {}
  };
  // Android канал уведомлений
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
          sound: 'default',
        });
      }
    })();
  }, []);
  // Сессия
  useEffect(() => {
    (async () => {
      const sessionId = await AsyncStorage.getItem(SESSION_KEY);
      if (!sessionId) await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
      await AsyncStorage.setItem(SESSION_KEY, String(Date.now()));
    })();
  }, []);
  // Шрифты
  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
  ...Ionicons.font,
  'mt-regular': require('./assets/fonts/Montserrat-Regular.ttf'),
  'mt-bold': require('./assets/fonts/Montserrat-Bold.ttf'),
  'mt-semibold': require('./assets/fonts/Montserrat-SemiBold.ttf'),
  'mt-medium': require('./assets/fonts/Montserrat-Medium.ttf'),
  'ar-regular': require('./assets/fonts/Tajawal-Regular.ttf'),
  'ar-bold': require('./assets/fonts/Tajawal-Bold.ttf'),
});
        setFontsReady(true);
      } catch (e) {
        console.log('Font load error:', e);
      } finally {
        SplashScreen.hideAsync().catch(() => {});
      }
    })();
  }, []);
  // ровный baseline для Android-текста
  useEffect(() => {
    if (Platform.OS === 'android') {
      Text.defaultProps = Text.defaultProps || {};
      const prev = Text.defaultProps.style || {};
      Text.defaultProps.style = [
        prev,
        { includeFontPadding: false, textAlignVertical: 'center' },
      ];
    }
  }, []);
  // доп. правка только если язык арабский
  useEffect(() => {
    (async () => {
      const lang = (await AsyncStorage.getItem('language')) || 'english';
      if (
        Platform.OS === 'android' &&
        (lang === 'arabic' || lang === 'ar' || lang === 'arab')
      ) {
        if (Text.defaultProps == null) Text.defaultProps = {};
        const base = Array.isArray(Text.defaultProps.style)
          ? Text.defaultProps.style
          : [Text.defaultProps.style].filter(Boolean);
        Text.defaultProps.style = [
          ...base,
          { includeFontPadding: false, textAlignVertical: 'center' },
        ];
      }
    })();
  }, []);
  // Закрытие чата при сворачивании
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') handleCloseChat();
    });
    return () => sub.remove();
  }, []);
  // Пуши — инициализация и авто-синхронизация тумблера
// Пуши — при первом запуске НЕ запрашиваем разрешение автоматически.
// Пользователь включает уведомления самостоятельно через тумблер.
useEffect(() => {
  (async () => {
    try {
      const stored = await AsyncStorage.getItem('notificationsEnabled');
      let enabled = stored === 'true';
      if (stored == null) {
        enabled = false;
        await AsyncStorage.setItem('notificationsEnabled', 'false');
      }
      setNotificationsEnabled(enabled);
      if (enabled) {
        const lang = (await AsyncStorage.getItem('language')) || 'english';
        await registerDeviceOnServer(lang);
        const already = await AsyncStorage.getItem('notificationScheduled');
        if (!already) {
          const res = await setServerSchedule(19, 45, null);
          if (res.ok) {
            await AsyncStorage.setItem('notificationScheduled', 'true');
            const resAlt = await setAltServerSchedule(10, 45, [5]);
            if (resAlt.ok) {
              await AsyncStorage.setItem(
                'notificationAltScheduled',
                'true'
              );
            }
          }
        }
        const altAlready = await AsyncStorage.getItem(
          'notificationAltScheduled'
        );
        if (!altAlready) {
          const resAlt = await setAltServerSchedule(10, 45, [5]);
          if (resAlt.ok) {
            await AsyncStorage.setItem(
              'notificationAltScheduled',
              'true'
            );
          }
        }
      }
    } catch (e) {
      console.error('Push init error:', e);
    } finally {
      setNotificationsReady(true);
    }
  })();
}, []);
  // === ТУМБЛЕР УВЕДОМЛЕНИЙ ===
  const toggleNotifications = async () => {
    if (!notificationsReady) return;
    const currentlyEnabled =
      (await AsyncStorage.getItem('notificationsEnabled')) === 'true';
    if (currentlyEnabled) {
      setNotificationsEnabled(false);
      await AsyncStorage.setItem('notificationsEnabled', 'false');
      await clearServerSchedule();
      await AsyncStorage.multiRemove([
        'notificationScheduled',
        'notificationAltScheduled',
      ]);
      return;
    }
    let perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) {
      if (Platform.OS === 'ios') {
        Alert.alert(
          'Разрешите уведомления',
          'Чтобы получать напоминания, включите уведомления для Verbify в настройках системы.',
          [
            { text: 'Открыть настройки', onPress: () => Linking.openSettings() },
            { text: 'Отмена', style: 'cancel' },
          ]
        );
      }
      setNotificationsEnabled(false);
      await AsyncStorage.setItem('notificationsEnabled', 'false');
      return;
    }
    const token = await getExpoPushTokenAsync();
    if (!token) {
      setNotificationsEnabled(false);
      await AsyncStorage.setItem('notificationsEnabled', 'false');
      return;
    }
    setNotificationsEnabled(true);
    await AsyncStorage.setItem('notificationsEnabled', 'true');
    const lang = (await AsyncStorage.getItem('language')) || 'english';
    await registerDeviceOnServer(lang);
    const base = await setServerSchedule(19, 45, null);
    if (base?.ok) await AsyncStorage.setItem('notificationScheduled', 'true');
    const alt = await setAltServerSchedule(10, 45, [5]);
    if (alt?.ok) await AsyncStorage.setItem('notificationAltScheduled', 'true');
  };
  const handleCloseChat = () => {
    if (blockModalCloseRef.current) return;
    setChatVisible(false);
    setTimeout(() => setModalKey((k) => k + 1), 300);
  };
  // ИИ по умолчанию доступен в упражнении.
  // Стартовый экран может скрыть его через showExerciseAI: false.
  const exerciseHeaderOptions = {
    headerRight: () => (
      <TouchableOpacity onPress={() => setChatVisible(true)} style={{ marginRight: 12 }}>
        <View style={{ backgroundColor: '#D1E3F1', borderRadius: 8, overflow: 'hidden', width: 90, height: 26, justifyContent: 'center', alignItems: 'center' }}>
          <Image source={require('./AI2.png')} style={{ width: 86, height: 60, resizeMode: 'contain' }} />
        </View>
      </TouchableOpacity>
    ),
  };
  // Заголовок + (опционально) кнопка уведомлений — RTL-совместимо
  const createHeaderTitle = (title, withToggle = false, label = '', rtl = false) => {
    const opts = {
      headerRtl: rtl,
      headerTitle: () => (
        <Text
          maxFontSizeMultiplier={1.1}
          style={{
  color: 'white',
  fontSize: TITLE_FS,
  lineHeight: rtl ? TITLE_FS + 2 : TITLE_FS + 2,
  fontFamily: rtl ? 'ar-bold' : 'mt-bold',
  // fontWeight: '700', // ❌ убрать
  textAlign: rtl ? 'right' : 'left',
  writingDirection: rtl ? 'rtl' : 'ltr',
  ...(rtl ? { marginTop: 6 } : null),
}}
        >
          {title}
        </Text>
      ),
    };
    if (withToggle) {
      opts.headerRight = () =>
        !notificationsReady ? null : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: rtl ? 0 : 8,
              marginLeft: rtl ? 8 : 0,
            }}
          >
            <TouchableOpacity
              onPress={toggleNotifications}
              style={{
                backgroundColor: '#4A6491',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                height: 28,
                borderRadius: 8,
              }}
              activeOpacity={0.8}
            >
              <Text
                maxFontSizeMultiplier={1.1}
                style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 14,
                  lineHeight: 20,
                  fontFamily: rtl ? 'ar-bold' : 'mt-bold',
                  marginRight: rtl ? 8 : 12,
                  marginLeft: rtl ? 6 : 0,
                  marginTop: rtl ? 4 : 0,
                  writingDirection: rtl ? 'rtl' : 'ltr',
                }}
              >
                {label}
              </Text>
              <Ionicons
                name={notificationsEnabled ? 'notifications' : 'notifications-off'}
                size={16}
                color="white"
              />
            </TouchableOpacity>
          </View>
        );
    }
    return opts;
  };
  const PREPOSITION_HEADER_CONFIG = {
  ru: {
    title: 'Предлоги 1',
    rtl: false,
  },
  en: {
    title: 'Prepositions 1',
    rtl: false,
  },
  fr: {
    title: 'Prépositions 1',
    rtl: false,
  },
  es: {
    title: 'Preposiciones 1',
    rtl: false,
  },
  pt: {
    title: 'Preposições 1',
    rtl: false,
  },
  ar: {
    title: 'حروف الجر 1',
    rtl: true,
  },
  am: {
    title: 'መስተዋድዶች 1',
    rtl: false,
  },
};
const getPrepositionHeaderConfig = language => {
  const normalizedLanguage =
    String(language || 'ru')
      .trim()
      .toLowerCase();
  const aliases = {
    russian: 'ru',
    english: 'en',
    french: 'fr',
    spanish: 'es',
    portuguese: 'pt',
    arabic: 'ar',
    amharic: 'am',
    rus: 'ru',
    eng: 'en',
    fra: 'fr',
    spa: 'es',
    por: 'pt',
    ara: 'ar',
    amh: 'am',
  };
  const languageCode =
    aliases[normalizedLanguage] ||
    normalizedLanguage;
  return (
    PREPOSITION_HEADER_CONFIG[
      languageCode
    ] ||
    PREPOSITION_HEADER_CONFIG.ru
  );
};
const PREPOSITION_2_HEADER_CONFIG = {
  ru: {
    title: 'Предлоги 2',
    rtl: false,
  },
  en: {
    title: 'Prepositions 2',
    rtl: false,
  },
  fr: {
    title: 'Prépositions 2',
    rtl: false,
  },
  es: {
    title: 'Preposiciones 2',
    rtl: false,
  },
  pt: {
    title: 'Preposições 2',
    rtl: false,
  },
  ar: {
    title: 'حروف الجر 2',
    rtl: true,
  },
  am: {
    title: 'መስተዋድዶች 2',
    rtl: false,
  },
};
const getPreposition2HeaderConfig = language => {
  const normalizedLanguage =
    String(language || 'ru')
      .trim()
      .toLowerCase();
  const aliases = {
    russian: 'ru',
    english: 'en',
    french: 'fr',
    spanish: 'es',
    portuguese: 'pt',
    arabic: 'ar',
    amharic: 'am',
    rus: 'ru',
    eng: 'en',
    fra: 'fr',
    spa: 'es',
    por: 'pt',
    ara: 'ar',
    amh: 'am',
    'pt-pt': 'pt',
  };
  const languageCode =
    aliases[normalizedLanguage] ||
    normalizedLanguage;
  return (
    PREPOSITION_2_HEADER_CONFIG[
      languageCode
    ] ||
    PREPOSITION_2_HEADER_CONFIG.ru
  );
};
const VERB_LIBRARY_HEADER_CONFIG={
ru:{title:'Карточки глаголов',rtl:false},
en:{title:'Verb Cards',rtl:false},
fr:{title:'Fiches de verbes',rtl:false},
es:{title:'Fichas de verbos',rtl:false},
pt:{title:'Fichas de verbos',rtl:false},
ar:{title:'بطاقات الأفعال',rtl:true},
am:{title:'የግስ ካርዶች',rtl:false}
};
const VERB_DETAILS_HEADER_CONFIG={
ru:{title:'Карточка глагола',rtl:false},
en:{title:'Verb Card',rtl:false},
fr:{title:'Fiche du verbe',rtl:false},
es:{title:'Ficha del verbo',rtl:false},
pt:{title:'Ficha do verbo',rtl:false},
ar:{title:'بطاقة الفعل',rtl:true},
am:{title:'የግስ ካርድ',rtl:false}
};
const normalizeLanguageCode=language=>{
const normalized=String(language||'ru').trim().toLowerCase();
const aliases={
russian:'ru',
english:'en',
french:'fr',
spanish:'es',
portuguese:'pt',
arabic:'ar',
amharic:'am',
rus:'ru',
eng:'en',
fra:'fr',
spa:'es',
por:'pt',
ara:'ar',
amh:'am',
'ru-ru':'ru',
'en-us':'en',
'en-gb':'en',
'fr-fr':'fr',
'es-es':'es',
'pt-pt':'pt',
'ar-il':'ar',
'am-et':'am'
};
return aliases[normalized]||normalized;
};
const EXERCISE_HEADER_LABELS = {
  ru: 'Упражнение',
  en: 'Exercise',
  fr: 'Exercice',
  es: 'Ejercicio',
  pt: 'Exercício',
  ar: 'التمرين',
  am: 'ልምምድ',
};
const EXERCISE_MENU_ROUTES = {
  ru: 'Menu', en: 'MenuEn', fr: 'MenuFr', es: 'MenuEs',
  pt: 'MenuPt', ar: 'MenuAr', am: 'MenuAm',
};
const getExerciseHeaderConfig = (number, language) => {
  const lang = normalizeLanguageCode(language);
  const safeLang = EXERCISE_HEADER_LABELS[lang] ? lang : 'ru';
  return {
    title: `${EXERCISE_HEADER_LABELS[safeLang]} ${number}`,
    rtl: safeLang === 'ar',
    menu: EXERCISE_MENU_ROUTES[safeLang],
  };
};
const getVerbLibraryHeaderConfig=language=>
VERB_LIBRARY_HEADER_CONFIG[
normalizeLanguageCode(language)
]||
VERB_LIBRARY_HEADER_CONFIG.ru;
const getVerbDetailsHeaderConfig=language=>
VERB_DETAILS_HEADER_CONFIG[
normalizeLanguageCode(language)
]||
VERB_DETAILS_HEADER_CONFIG.ru;
  // Отдельный helper для всех арабских упражнений
  const arExerciseHeader = (title) => ({
    ...createHeaderTitle(title, false, '', true),
    ...exerciseHeaderOptions,
    headerRtl: true,
    headerTitleAlign: 'right',
  });
  if (!fontsReady) return null;
  return (
    <ExerciseAIProvider value={{ startVisible, setStartVisible }}>
      <StatusBar
        backgroundColor="#6C8EBB"
        barStyle="light-content"
        translucent={false}
      />
      <NavigationContainer
        ref={navigationRef}
        theme={AppTheme}
        onReady={() => {
          syncRouteName();
        }}
        onStateChange={() => {
          syncRouteName();
        }}
      >
        {/* ✅ Safe-area по низу: цвет зависит от текущего route */}
        <SafeAreaView style={{ flex: 1, backgroundColor: bottomBg }} edges={['bottom']}>
          <Stack.Navigator
            initialRouteName="StartupGate"
            detachInactiveScreens={false}
            screenOptions={{
              unmountOnBlur: false,
              headerStyle: { backgroundColor: '#6C8EBB', height: 38 + TOP_INSET },
              header: (props) => <CompactHeader {...props} />,
              headerTintColor: '#FFFFFF',
              headerTitleAlign: 'left',
              headerShadowVisible: false,
              headerBackTitleVisible: false,
              cardStyle: { backgroundColor: '#AFC1D0' },
            }}
          >
            {/* <Stack.Screen name="Paywall" component={Paywall} options={createHeaderTitle('Paywall')} /> */}
            <Stack.Screen
  name="Paywall"
  component={Paywall}
  options={{
    ...createHeaderTitle('Paywall', true, 'Уведомления'),
    headerRight: () => null,   // 🔥 убираем кнопку
    headerForceBack: true,
    cardStyle: { backgroundColor: '#F0F0F0' },
  }}
/>
<Stack.Screen
  name="PaywallIOS"
  component={PaywallIOS}
  options={{
    ...createHeaderTitle('Paywall', true, 'Уведомления'),
    headerRight: () => null,   // 🔥 убираем кнопку
    headerForceBack: true,
    cardStyle: { backgroundColor: '#F0F0F0' },
  }}
/>
<Stack.Screen
  name="StartupGate"
  component={StartupGate}
  options={{
    headerShown: false,
    cardStyle: { backgroundColor: '#F0F0F0' },
  }}
/>
            <Stack.Screen
              name="LanguageSelectionPage"
              component={LanguageSelectionPage}
              options={createHeaderTitle('Select Language')}
            />
            <Stack.Screen
              name="Welcome"
              component={WelcomePage}
              options={{
                ...createHeaderTitle('Добро пожаловать!'),
                headerForceBack: true,
                headerBackTarget: 'LanguageSelectionPage',
              }}
            />
            <Stack.Screen
              name="WelcomeEn"
              component={WelcomePageEn}
              options={{
                ...createHeaderTitle('Welcome!'),
                headerForceBack: true,
                headerBackTarget: 'LanguageSelectionPage',
              }}
            />
            <Stack.Screen
              name="WelcomeFr"
              component={WelcomePageFr}
              options={{
                ...createHeaderTitle('Bienvenue!'),
                headerForceBack: true,
                headerBackTarget: 'LanguageSelectionPage',
              }}
            />
            <Stack.Screen
              name="WelcomeEs"
              component={WelcomePageEs}
              options={{
                ...createHeaderTitle('¡Bienvenidos!'),
                headerForceBack: true,
                headerBackTarget: 'LanguageSelectionPage',
              }}
            />
            <Stack.Screen
              name="WelcomePt"
              component={WelcomePagePt}
              options={{
                ...createHeaderTitle('Bem-vindos!'),
                headerForceBack: true,
                headerBackTarget: 'LanguageSelectionPage',
              }}
            />
            <Stack.Screen
              name="WelcomeAr"
              component={WelcomePageAr}
              options={{
                ...createHeaderTitle('أهلًا وسهلًا', false, '', true),
                headerForceBack: true,
                headerBackTarget: 'LanguageSelectionPage',
              }}
            />
            <Stack.Screen
              name="WelcomeAm"
              component={WelcomePageAm}
              options={{
                ...createHeaderTitle('ሰላም መጡ!'),
                headerForceBack: true,
                headerBackTarget: 'LanguageSelectionPage',
              }}
            />
            {/* меню */}
            <Stack.Screen
              name="Menu"
              component={MenuPageUlpan}
              options={{
                ...createHeaderTitle('Меню', true, 'Уведомления'),
                headerForceBack: true,
                headerBackTarget: 'Welcome',
                cardStyle: { backgroundColor: '#F0F0F0' },
              }}
            />
            <Stack.Screen
              name="MenuEn"
              component={MenuPageEnUlpan}
              options={{
                ...createHeaderTitle('Menu', true, 'Notifications'),
                headerForceBack: true,
                headerBackTarget: 'WelcomeEn',
                cardStyle: { backgroundColor: '#F0F0F0' },
              }}
            />
            <Stack.Screen
              name="MenuFr"
              component={MenuPageFrUlpan}
              options={{
                ...createHeaderTitle('Menu', true, 'Notifications'),
                headerForceBack: true,
                headerBackTarget: 'WelcomeFr',
                cardStyle: { backgroundColor: '#F0F0F0' },
              }}
            />
            <Stack.Screen
              name="MenuEs"
              component={MenuPageEsUlpan}
              options={{
                ...createHeaderTitle('Menú', true, 'Notificaciones'),
                headerForceBack: true,
                headerBackTarget: 'WelcomeEs',
                cardStyle: { backgroundColor: '#F0F0F0' },
              }}
            />
            <Stack.Screen
              name="MenuPt"
              component={MenuPagePtUlpan}
              options={{
                ...createHeaderTitle('Menu', true, 'Notificações'),
                headerForceBack: true,
                headerBackTarget: 'WelcomePt',
                cardStyle: { backgroundColor: '#F0F0F0' },
              }}
            />
            <Stack.Screen
              name="MenuAr"
              component={MenuPageArUlpan}
              options={{
                ...createHeaderTitle('القائمة', true, 'الإشعارات', true),
                headerForceBack: true,
                headerBackTarget: 'WelcomeAr',
                cardStyle: { backgroundColor: '#F0F0F0' },
              }}
            />
            <Stack.Screen
              name="MenuAm"
              component={MenuPageAmUlpan}
              options={{
                ...createHeaderTitle('ምናሌ', true, 'ማሳወቂያዎች'),
                headerForceBack: true,
                headerBackTarget: 'WelcomeAm',
                cardStyle: { backgroundColor: '#F0F0F0' },
              }}
            />
<Stack.Screen
name="VerbLibrary"
component={VerbLibraryScreen}
options={({route})=>{
const{title,rtl}=getVerbLibraryHeaderConfig(route.params?.language);
return{
...createHeaderTitle(title,false,'',rtl),
headerForceBack:true
};
}}
/>
<Stack.Screen
name="VerbDetails"
component={VerbDetailsScreen}
options={({route})=>{
const{title,rtl}=getVerbDetailsHeaderConfig(route.params?.language);
return{
...createHeaderTitle(title,false,'',rtl),
headerForceBack:true,
cardStyle:{backgroundColor:'#83A3CD'}
};
}}
/>
            {/* упражнения */}
            {UNIVERSAL_EXERCISE_SCREENS.map(([routeName, visibleNumber, Component]) => (
              <Stack.Screen
                key={routeName}
                name={routeName}
                component={Component}
                options={({ route }) => {
                  const cfg = getExerciseHeaderConfig(
                    visibleNumber,
                    route.params?.language
                  );
                  return {
                    ...createHeaderTitle(cfg.title, false, '', cfg.rtl),
                    ...exerciseHeaderOptions,
                    headerForceBack: true,
                    headerBackTarget: cfg.menu,
                    headerRtl: cfg.rtl,
                    headerTitleAlign: cfg.rtl ? 'right' : 'left',
                    animationEnabled: false,
                    gestureEnabled: false,
                  };
                }}
              />
            ))}
            <Stack.Screen
  name="PrepositionExercise"
  component={PrepositionExercise}
  options={({ route }) => {
    const {
      title,
      rtl,
    } =
      getPrepositionHeaderConfig(
        route.params?.language
      );
    return {
      ...createHeaderTitle(
        title,
        false,
        '',
        rtl
      ),
      headerForceBack: true,
      /*
       * Оставляем переход без анимации,
       * чтобы не появлялось мигание меню.
       */
      animationEnabled: false,
      gestureEnabled: false,
      cardStyle: {
        backgroundColor: '#AFC1D0',
      },
    };
  }}
/>
<Stack.Screen
  name="PrepositionVerbExercise"
  component={PrepositionVerbExercise}
  options={({ route }) => {
    const {
      title,
      rtl,
    } =
      getPreposition2HeaderConfig(
        route.params?.language
      );
    return {
      ...createHeaderTitle(
        title,
        false,
        '',
        rtl
      ),
      headerForceBack: true,
      animationEnabled: false,
      gestureEnabled: false,
      cardStyle: {
        backgroundColor: '#AFC1D0',
      },
    };
  }}
/>
 <Stack.Screen
  name="RootVerbExercise"
  component={RootVerbExercise}
  options={({ route }) => {
    const titles = {
      ru: 'Корни и биньяны',
      en: 'Roots and Binyanim',
      fr: 'Racines et binyanim',
      es: 'Raíces y binyanim',
      pt: 'Raízes e binyanim',
      ar: 'الجذور والأوزان',
      am: 'ሥሮች እና ቢንያኖች',
    };
    const language = normalizeLanguageCode(
      route.params?.language || 'en'
    );
    const rtl = language === 'ar';
    const title = titles[language] || titles.en;
    return {
      ...createHeaderTitle(title, false, '', rtl),
      headerShown: true,
      headerForceBack: true,
      animationEnabled: false,
      gestureEnabled: false,
      cardStyle: {
        backgroundColor: '#83A3CD',
      },
    };
  }}
/>
            <Stack.Screen
  name="Exercise9"
  component={Exercise9G}
  options={{
    header: props => (
      <SentenceExerciseHeader
        {...props}
        exerciseNumber={9}
      />
    ),
    animationEnabled: false,
    gestureEnabled: false,
    cardStyle: { backgroundColor: '#83A3CD' },
  }}
/>
<Stack.Screen
  name="Exercise10"
  component={Exercise10G}
  options={{
    header: props => (
      <SentenceExerciseHeader
        {...props}
        exerciseNumber={10}
      />
    ),
    animationEnabled: false,
    gestureEnabled: false,
    cardStyle: { backgroundColor: '#83A3CD' },
  }}
/>
<Stack.Screen
  name="Exercise11"
  component={Exercise11G}
  options={{
    header: props => (
      <SentenceExerciseHeader {...props} exerciseNumber={11} />
    ),
    headerShown: true,
    animationEnabled: false,
    gestureEnabled: false,
    cardStyle: { backgroundColor: '#F6F8FD' },
  }}
/>
<Stack.Screen
  name="Exercise12"
  component={Exercise12G}
  options={{
    header: props => (
      <SentenceExerciseHeader {...props} exerciseNumber={12} />
    ),
    headerShown: true,
    animationEnabled: false,
    gestureEnabled: false,
    cardStyle: { backgroundColor: '#AFC1D0' },
  }}
/>
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>
      <ChatBotModal
        key={modalKey}
        visible={chatVisible}
        onClose={handleCloseChat}
        blockModalCloseRef={blockModalCloseRef}
      />
    </ExerciseAIProvider>
  );
}
export default Sentry.wrap(App);
