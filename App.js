// App.js
import './src/ui/iosFontWeightPatch';

// import { Settings, AppEventsLogger } from 'react-native-fbsdk-next';

import './polyfills';
import 'react-native-gesture-handler';
import './animatedTimingPatch';
import './debugAnimatedTiming';
import './debugAnimated';
import { Audio } from 'expo-av';
import StartupGate from './StartupGate';

import React, { useEffect, useRef, useState } from 'react';

import {
  StatusBar,
  AppState,
  View,
  Image,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { withAccessGate } from './src/iap/withAccessGate';

// === серверные пуши ===
import {
  setServerSchedule,
  clearServerSchedule,
  registerDeviceOnServer,
  setAltServerSchedule,
  getExpoPushTokenAsync,
  forceReRegisterAndReschedule,
} from './serverPush';

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
import Exercise1En from './Exercise1En';
import Exercise1Fr from './Exercise1Fr';
import Exercise1Es from './Exercise1Es';
import Exercise1Pt from './Exercise1Pt';
import Exercise1Ar from './Exercise1Ar';
import Exercise1Am from './Exercise1Am';

import Exercise2 from './Exercise2';
import Exercise2En from './Exercise2En';
import Exercise2Fr from './Exercise2Fr';
import Exercise2Es from './Exercise2Es';
import Exercise2Pt from './Exercise2Pt';
import Exercise2Ar from './Exercise2Ar';
import Exercise2Am from './Exercise2Am';

import Exercise3 from './Exercise3';
import Exercise3En from './Exercise3En';
import Exercise3Fr from './Exercise3Fr';
import Exercise3Es from './Exercise3Es';
import Exercise3Pt from './Exercise3Pt';
import Exercise3Ar from './Exercise3Ar';
import Exercise3Am from './Exercise3Am';

import Exercise4 from './Exercise4';
import Exercise4En from './Exercise4En';
import Exercise4Fr from './Exercise4Fr';
import Exercise4Es from './Exercise4Es';
import Exercise4Pt from './Exercise4Pt';
import Exercise4Ar from './Exercise4Ar';
import Exercise4Am from './Exercise4Am';

import Exercise5 from './Exercise5';
import Exercise5En from './Exercise5En';
import Exercise5Fr from './Exercise5Fr';
import Exercise5Es from './Exercise5Es';
import Exercise5Pt from './Exercise5Pt';
import Exercise5Ar from './Exercise5Ar';
import Exercise5Am from './Exercise5Am';

import Exercise6 from './Exercise6';
import Exercise6En from './Exercise6En';
import Exercise6Fr from './Exercise6Fr';
import Exercise6Es from './Exercise6Es';
import Exercise6Pt from './Exercise6Pt';
import Exercise6Ar from './Exercise6Ar';
import Exercise6Am from './Exercise6Am';

import Exercise7 from './Exercise7';
import Exercise7En from './Exercise7En';
import Exercise7Fr from './Exercise7Fr';
import Exercise7Es from './Exercise7Es';
import Exercise7Pt from './Exercise7Pt';
import Exercise7Ar from './Exercise7Ar';
import Exercise7Am from './Exercise7Am';

import Exercise8 from './Exercise8';
import Exercise8En from './Exercise8En';
import Exercise8Fr from './Exercise8Fr';
import Exercise8Es from './Exercise8Es';
import Exercise8Pt from './Exercise8Pt';
import Exercise8Ar from './Exercise8Ar';
import Exercise8Am from './Exercise8Am';

import ChatBotModal from './api/ChatBotModal';

// IAP и Paywall
import Constants from 'expo-constants';
import { IapProvider, NoIapProvider } from './src/iap/IapProvider';
import Paywall from './screens/Paywall';
import PaywallIOS from './screens/PaywallIOS'; 
import { withMenuGate } from './src/iap/withMenuGate';



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
   ========================= */

// Меню (ulpan)
const MenuPageUlpan = withMenuGate(MenuPage, 'ulpan');
const MenuPageEnUlpan = withMenuGate(MenuPageEn, 'ulpan');
const MenuPageFrUlpan = withMenuGate(MenuPageFr, 'ulpan');
const MenuPageEsUlpan = withMenuGate(MenuPageEs, 'ulpan');
const MenuPagePtUlpan = withMenuGate(MenuPagePt, 'ulpan');
const MenuPageArUlpan = withMenuGate(MenuPageAr, 'ulpan');
const MenuPageAmUlpan = withMenuGate(MenuPageAm, 'ulpan');

// Упражнения (gate)
const Exercise1G = gate(Exercise1);
const Exercise1EnG = gate(Exercise1En);
const Exercise1FrG = gate(Exercise1Fr);
const Exercise1EsG = gate(Exercise1Es);
const Exercise1PtG = gate(Exercise1Pt);
const Exercise1ArG = gate(Exercise1Ar);
const Exercise1AmG = gate(Exercise1Am);

const Exercise2G = gate(Exercise2);
const Exercise2EnG = gate(Exercise2En);
const Exercise2FrG = gate(Exercise2Fr);
const Exercise2EsG = gate(Exercise2Es);
const Exercise2PtG = gate(Exercise2Pt);
const Exercise2ArG = gate(Exercise2Ar);
const Exercise2AmG = gate(Exercise2Am);

const Exercise3G = gate(Exercise3);
const Exercise3EnG = gate(Exercise3En);
const Exercise3FrG = gate(Exercise3Fr);
const Exercise3EsG = gate(Exercise3Es);
const Exercise3PtG = gate(Exercise3Pt);
const Exercise3ArG = gate(Exercise3Ar);
const Exercise3AmG = gate(Exercise3Am);

const Exercise4G = gate(Exercise4);
const Exercise4EnG = gate(Exercise4En);
const Exercise4FrG = gate(Exercise4Fr);
const Exercise4EsG = gate(Exercise4Es);
const Exercise4PtG = gate(Exercise4Pt);
const Exercise4ArG = gate(Exercise4Ar);
const Exercise4AmG = gate(Exercise4Am);

const Exercise5G = gate(Exercise5);
const Exercise5EnG = gate(Exercise5En);
const Exercise5FrG = gate(Exercise5Fr);
const Exercise5EsG = gate(Exercise5Es);
const Exercise5PtG = gate(Exercise5Pt);
const Exercise5ArG = gate(Exercise5Ar);
const Exercise5AmG = gate(Exercise5Am);

const Exercise6G = gate(Exercise6);
const Exercise6EnG = gate(Exercise6En);
const Exercise6FrG = gate(Exercise6Fr);
const Exercise6EsG = gate(Exercise6Es);
const Exercise6PtG = gate(Exercise6Pt);
const Exercise6ArG = gate(Exercise6Ar);
const Exercise6AmG = gate(Exercise6Am);

const Exercise7G = gate(Exercise7);
const Exercise7EnG = gate(Exercise7En);
const Exercise7FrG = gate(Exercise7Fr);
const Exercise7EsG = gate(Exercise7Es);
const Exercise7PtG = gate(Exercise7Pt);
const Exercise7ArG = gate(Exercise7Ar);
const Exercise7AmG = gate(Exercise7Am);

const Exercise8G = gate(Exercise8);
const Exercise8EnG = gate(Exercise8En);
const Exercise8FrG = gate(Exercise8Fr);
const Exercise8EsG = gate(Exercise8Es);
const Exercise8PtG = gate(Exercise8Pt);
const Exercise8ArG = gate(Exercise8Ar);
const Exercise8AmG = gate(Exercise8Am);

/* ===== Кастомный компактный Header (44dp) ===== */
function CompactHeader({ navigation, options, back, route }) {
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

  const Right =
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



/* ===== ВНЕШНИЙ компонент — провайдеры (IAP + SafeArea) ===== */
export default function App() {
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

// useEffect(() => {
//   const timer = setTimeout(async () => {
//     try {
//       const { Settings, AppEventsLogger } = await import('react-native-fbsdk-next');

//       Settings.initializeSDK();
//       Settings.setAutoLogAppEventsEnabled(true);
//       Settings.setAdvertiserIDCollectionEnabled(true);

//       AppEventsLogger.logEvent('verbify_app_open_test');

//       console.log('[META] SDK initialized, test event sent');
//     } catch (e) {
//       console.log('[META ERROR]', e);
//     }
//   }, 2000);

//   return () => clearTimeout(timer);
// }, []);

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
      console.log('[Audio init] error', e);
    }
  })();
}, []);


  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsReady, setNotificationsReady] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);

  // ✅ текущее имя роута (для цвета футера)
  const [currentRouteName, setCurrentRouteName] = useState('LanguageSelectionPage');

  const isMenuRoute =
    currentRouteName === 'Menu' ||
    currentRouteName === 'MenuEn' ||
    currentRouteName === 'MenuFr' ||
    currentRouteName === 'MenuEs' ||
    currentRouteName === 'MenuPt' ||
    currentRouteName === 'MenuAr' ||
    currentRouteName === 'MenuAm';

  // ✅ Цвет нижнего safe-area:
  // - меню: f0f0f0
  // - остальные: AFC1D0
  const bottomBg = isMenuRoute ? '#F0F0F0' : '#AFC1D0';

  const syncRouteName = () => {
    try {
      const name = navigationRef.getCurrentRoute?.()?.name;
      if (name) setCurrentRouteName(name);
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
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('notificationsEnabled');
        let enabled = stored === 'true';

        if (stored == null) {
          let token = await AsyncStorage.getItem('expoPushToken');
          if (!token) token = await getExpoPushTokenAsync();
          enabled = !!token;
          await AsyncStorage.setItem(
            'notificationsEnabled',
            enabled ? 'true' : 'false'
          );
        }

        setNotificationsEnabled(enabled);

        const lang = (await AsyncStorage.getItem('language')) || 'english';
        if (enabled) {
          await registerDeviceOnServer(lang);

          const already = await AsyncStorage.getItem('notificationScheduled');
          if (!already) {
            const res = await setServerSchedule(19, 45, null);
            if (res.ok) {
              await AsyncStorage.setItem('notificationScheduled', 'true');
              const resAlt = await setAltServerSchedule(10, 45, [5]);
              if (resAlt.ok)
                await AsyncStorage.setItem('notificationAltScheduled', 'true');
            }
          }

          const altAlready = await AsyncStorage.getItem('notificationAltScheduled');
          if (!altAlready) {
            const resAlt = await setAltServerSchedule(10, 45, [5]);
            if (resAlt.ok)
              await AsyncStorage.setItem('notificationAltScheduled', 'true');
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

  // Кнопка AI в упражнениях — компактная
  const exerciseHeaderOptions = {
    headerRight: () => (
      <TouchableOpacity
        onPress={() => setChatVisible(true)}
        style={{ marginRight: 12 }}
      >
        <View
          style={{
            backgroundColor: '#D1E3F1',
            borderRadius: 8,
            overflow: 'hidden',
            width: 90,
            height: 26,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Image
            source={require('./AI2.png')}
            style={{ width: 86, height: 60, resizeMode: 'contain' }}
          />
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

  // Отдельный helper для всех арабских упражнений
  const arExerciseHeader = (title) => ({
    ...createHeaderTitle(title, false, '', true),
    ...exerciseHeaderOptions,
    headerRtl: true,
    headerTitleAlign: 'right',
  });

  if (!fontsReady) return null;

  return (
    <>
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

            {/* упражнения */}
            <Stack.Screen name="Exercise1" component={Exercise1G} options={{ ...createHeaderTitle('Упражнение 1'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise1En" component={Exercise1EnG} options={{ ...createHeaderTitle('Exercise 1'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise1Fr" component={Exercise1FrG} options={{ ...createHeaderTitle('Exercice 1'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise1Es" component={Exercise1EsG} options={{ ...createHeaderTitle('Ejercicio 1'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise1Pt" component={Exercise1PtG} options={{ ...createHeaderTitle('Exercício 1'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise1Ar" component={Exercise1ArG} options={arExerciseHeader('التمرين 1')} />
            <Stack.Screen name="Exercise1Am" component={Exercise1AmG} options={{ ...createHeaderTitle('ልምምድ አንድ'), ...exerciseHeaderOptions }} />

            <Stack.Screen name="Exercise2" component={Exercise2G} options={{ ...createHeaderTitle('Упражнение 2'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise2En" component={Exercise2EnG} options={{ ...createHeaderTitle('Exercise 2'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise2Fr" component={Exercise2FrG} options={{ ...createHeaderTitle('Exercice 2'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise2Es" component={Exercise2EsG} options={{ ...createHeaderTitle('Ejercicio 2'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise2Pt" component={Exercise2PtG} options={{ ...createHeaderTitle('Exercício 2'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise2Ar" component={Exercise2ArG} options={arExerciseHeader('التمرين 2')} />
            <Stack.Screen name="Exercise2Am" component={Exercise2AmG} options={{ ...createHeaderTitle('ልምምድ ሁለት'), ...exerciseHeaderOptions }} />

            <Stack.Screen name="Exercise3" component={Exercise3G} options={{ ...createHeaderTitle('Упражнение 3'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise3En" component={Exercise3EnG} options={{ ...createHeaderTitle('Exercise 3'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise3Fr" component={Exercise3FrG} options={{ ...createHeaderTitle('Exercice 3'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise3Es" component={Exercise3EsG} options={{ ...createHeaderTitle('Ejercicio 3'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise3Pt" component={Exercise3PtG} options={{ ...createHeaderTitle('Exercício 3'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise3Ar" component={Exercise3ArG} options={arExerciseHeader('التمرين 3')} />
            <Stack.Screen name="Exercise3Am" component={Exercise3AmG} options={{ ...createHeaderTitle('ልምምድ ሶስት'), ...exerciseHeaderOptions }} />

            <Stack.Screen name="Exercise4" component={Exercise4G} options={{ ...createHeaderTitle('Упражнение 7'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise4En" component={Exercise4EnG} options={{ ...createHeaderTitle('Exercise 7'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise4Fr" component={Exercise4FrG} options={{ ...createHeaderTitle('Exercice 7'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise4Es" component={Exercise4EsG} options={{ ...createHeaderTitle('Ejercicio 7'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise4Pt" component={Exercise4PtG} options={{ ...createHeaderTitle('Exercício 7'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise4Ar" component={Exercise4ArG} options={arExerciseHeader('التمرين 7')} />
            <Stack.Screen name="Exercise4Am" component={Exercise4AmG} options={{ ...createHeaderTitle('ልምምድ ሰባት'), ...exerciseHeaderOptions }} />

            <Stack.Screen name="Exercise5" component={Exercise5G} options={{ ...createHeaderTitle('Упражнение 4'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise5En" component={Exercise5EnG} options={{ ...createHeaderTitle('Exercise 4'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise5Fr" component={Exercise5FrG} options={{ ...createHeaderTitle('Exercice 4'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise5Es" component={Exercise5EsG} options={{ ...createHeaderTitle('Ejercicio 4'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise5Pt" component={Exercise5PtG} options={{ ...createHeaderTitle('Exercício 4'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise5Ar" component={Exercise5ArG} options={arExerciseHeader('التمرين 4')} />
            <Stack.Screen name="Exercise5Am" component={Exercise5AmG} options={{ ...createHeaderTitle('ልምምድ አራት'), ...exerciseHeaderOptions }} />

            <Stack.Screen name="Exercise6" component={Exercise6G} options={{ ...createHeaderTitle('Упражнение 5'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise6En" component={Exercise6EnG} options={{ ...createHeaderTitle('Exercise 5'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise6Fr" component={Exercise6FrG} options={{ ...createHeaderTitle('Exercice 5'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise6Es" component={Exercise6EsG} options={{ ...createHeaderTitle('Ejercicio 5'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise6Pt" component={Exercise6PtG} options={{ ...createHeaderTitle('Exercício 5'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise6Ar" component={Exercise6ArG} options={arExerciseHeader('التمرين 5')} />
            <Stack.Screen name="Exercise6Am" component={Exercise6AmG} options={{ ...createHeaderTitle('ልምምድ አምስት'), ...exerciseHeaderOptions }} />

            <Stack.Screen name="Exercise7" component={Exercise7G} options={{ ...createHeaderTitle('Упражнение 8'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise7En" component={Exercise7EnG} options={{ ...createHeaderTitle('Exercise 8'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise7Fr" component={Exercise7FrG} options={{ ...createHeaderTitle('Exercice 8'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise7Es" component={Exercise7EsG} options={{ ...createHeaderTitle('Ejercicio 8'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise7Pt" component={Exercise7PtG} options={{ ...createHeaderTitle('Exercício 8'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise7Ar" component={Exercise7ArG} options={arExerciseHeader('التمرين 8')} />
            <Stack.Screen name="Exercise7Am" component={Exercise7AmG} options={{ ...createHeaderTitle('ልምምድ ስድስት'), ...exerciseHeaderOptions }} />

            <Stack.Screen name="Exercise8" component={Exercise8G} options={{ ...createHeaderTitle('Упражнение 6'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise8En" component={Exercise8EnG} options={{ ...createHeaderTitle('Exercise 6'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise8Fr" component={Exercise8FrG} options={{ ...createHeaderTitle('Exercice 6'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise8Es" component={Exercise8EsG} options={{ ...createHeaderTitle('Ejercicio 6'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise8Pt" component={Exercise8PtG} options={{ ...createHeaderTitle('Exercício 6'), ...exerciseHeaderOptions }} />
            <Stack.Screen name="Exercise8Ar" component={Exercise8ArG} options={arExerciseHeader('التمرين 6')} />
            <Stack.Screen name="Exercise8Am" component={Exercise8AmG} options={{ ...createHeaderTitle('መልመጃ ስድስት'), ...exerciseHeaderOptions }} />
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>

      <ChatBotModal
        key={modalKey}
        visible={chatVisible}
        onClose={handleCloseChat}
        blockModalCloseRef={blockModalCloseRef}
      />
    </>
  );
}
