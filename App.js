// App.js
import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, AppState, View, Image, Text, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';



// === Серверные пуши ===
import { setServerSchedule, clearServerSchedule, registerDeviceOnServer, setAltServerSchedule } from './serverPush';

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

const CHAT_HISTORY_KEY = 'chatHistory';
const SESSION_KEY = 'chatSessionId';
const Stack = createStackNavigator();

export default function App() {
  const appState = useRef(AppState.currentState);
  const blockModalCloseRef = useRef(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsReady, setNotificationsReady] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [modalKey, setModalKey] = useState(0);


  // Показывать баннер даже когда приложение открыто
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});





useEffect(() => {
  (async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH, // было DEFAULT
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        sound: 'default',
      });
    }
  })();
}, []);


  // стартовая логика сессии
  useEffect(() => {
    (async () => {
      const sessionId = await AsyncStorage.getItem(SESSION_KEY);
      if (!sessionId) {
        await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
        console.log('🧹 История чата очищена (новый запуск)');
      }
      await AsyncStorage.setItem(SESSION_KEY, String(Date.now()));
    })();
  }, []);

  // загрузка шрифтов
  useEffect(() => {
    (async () => {
      await Font.loadAsync({
        'mt-bold': require('./assets/fonts/Montserrat-VariableFont_wght.ttf'),
        'mt-light': require('./assets/fonts/Montserrat-Italic-VariableFont_wght.ttf'),
      });
    })();
  }, []);

  // закрыть чат при сворачивании
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') {
        handleCloseChat();
      }
    });
    return () => subscription.remove();
  }, []);

  // первичная инициализация серверных пушей
useEffect(() => {
  (async () => {
    try {
      // 1) восстановим флаг
      const value = await AsyncStorage.getItem('notificationsEnabled');
      const enabled = value === 'true';
      setNotificationsEnabled(enabled);

      // 2) регистрация девайса/токена на сервере (и язык)
      const lang = (await AsyncStorage.getItem('language')) || 'english';
      const reg = await registerDeviceOnServer(lang);
      console.log('registerDeviceOnServer:', reg);

      // 3) если включено и не ставили расписание — установим дефолт (19:45 ежедневно)
      if (enabled) {
        const scheduledKey = 'notificationScheduled';
        const already = await AsyncStorage.getItem(scheduledKey);

        if (!already) {
          const res = await setServerSchedule(19, 45, null); // каждый день
          if (res.ok) {
            await AsyncStorage.setItem(scheduledKey, 'true');
            console.log('✅ Серверное расписание установлено при запуске');
          } else {
            console.log('❌ Ошибка установки расписания при запуске', res);
          }
        } else {
          console.log('🔁 Расписание уже на сервере — пропускаем');
        }

        // 4) альтернативное окно для пятницы 10:45 — ставим один раз
        const altKey = 'altScheduleSet:fri-10:45';
        const altAlready = await AsyncStorage.getItem(altKey);
        if (!altAlready) {
          const altRes = await setAltServerSchedule(10, 45, [5]); // 0=вс … 5=пт, 6=сб
          if (altRes.ok) {
            await AsyncStorage.setItem(altKey, '1');
            console.log('✅ Альтернативное расписание (пт 10:45) установлено');
          } else {
            console.log('❌ Ошибка установки альтернативного расписания', altRes);
          }
        } else {
          console.log('🔁 Альтернативное расписание уже настроено — пропускаем');
        }
      } else {
        console.log('🔕 Уведомления выключены — ничего не планируем');
      }
    } catch (e) {
      console.error('❌ Ошибка инициализации серверных пушей:', e);
    } finally {
      setNotificationsReady(true);
    }
  })();
}, []);


  // тумблер в хэдере
  const toggleNotifications = async () => {
    if (!notificationsReady) {
      console.log('⛔ toggleNotifications: ещё не готовы');
      return;
    }

    const persisted = (await AsyncStorage.getItem('notificationsEnabled')) === 'true';
    const newValue = !persisted;

    setNotificationsEnabled(newValue);
    await AsyncStorage.setItem('notificationsEnabled', String(newValue));

    if (!newValue) {
      // выключаем: очищаем серверное расписание
      await clearServerSchedule();
      await AsyncStorage.removeItem('notificationScheduled');
      console.log('🚫 Уведомления отключены и расписание удалено (сервер)');
      return;
    }

    // включаем: ставим расписание (пример — 09:00 ежедневно)
    const res = await setServerSchedule(19, 45, null);
    if (res.ok) {
      await AsyncStorage.setItem('notificationScheduled', 'true');
      console.log('✅ Серверное расписание установлено (при включении)');
    } else {
      console.log('❌ Ошибка установки расписания', res);
      setNotificationsEnabled(false);
      await AsyncStorage.setItem('notificationsEnabled', 'false');
    }
  };

  // чат модалка
  const handleCloseChat = () => {
    if (blockModalCloseRef.current) {
      console.log('⛔ Закрытие ChatBotModal отменено (ref активен)');
      return;
    }
    setChatVisible(false);
    setTimeout(() => setModalKey((k) => k + 1), 300);
  };

  const exerciseHeaderOptions = {
    headerRight: () => (
      <TouchableOpacity onPress={() => setChatVisible(true)} style={{ marginRight: 14 }}>
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
            style={{ width: 90, height: 66, resizeMode: 'contain' }}
          />
        </View>
      </TouchableOpacity>
    ),
  };

  const createHeaderTitle = (title, withNotificationToggle = false, notificationLabel = '') => ({
    headerTitle: () => (
      <Text
        maxFontSizeMultiplier={1.2}
        style={{
          backgroundColor: '#4A6491',
          paddingHorizontal: 10,
          paddingVertical: 1,
          borderRadius: 8,
          color: 'white',
          fontWeight: 'bold',
          fontSize: 17,
          fontFamily: 'mt-bold',
        }}
      >
        {title}
      </Text>
    ),

    headerRight: () => {
      if (!notificationsReady) return null;
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
          {withNotificationToggle && (
            <TouchableOpacity
              onPress={toggleNotifications}
              style={{
                backgroundColor: '#4A6491',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 1,
                borderRadius: 8,
              }}
              activeOpacity={0.8}
            >
              <Text
                maxFontSizeMultiplier={1.2}
                style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 17,
                  fontFamily: 'mt-bold',
                  marginRight: 6,
                }}
              >
                {notificationLabel}
              </Text>
              <Ionicons
                name={notificationsEnabled ? 'notifications' : 'notifications-off'}
                size={20}
                color="white"
              />
            </TouchableOpacity>
          )}
        </View>
      );
    },
  });

  return (
    <>
      <StatusBar backgroundColor="#6C8EBB" barStyle="light-content" translucent={false} />

      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="LanguageSelect"
          screenOptions={{
            headerStyle: { backgroundColor: '#6C8EBB', height: 40 },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              backgroundColor: '#4A6491',
              paddingHorizontal: 10,
              paddingVertical: 1,
              borderRadius: 8,
              color: 'white',
              fontWeight: 'bold',
              fontSize: 16,
              fontFamily: 'mt-bold',
            },
            headerTitleAlign: 'left',
          }}
        >
          <Stack.Screen name="LanguageSelect" component={LanguageSelectionPage} options={createHeaderTitle('Select Language')} />
          <Stack.Screen name="Welcome" component={WelcomePage} options={createHeaderTitle('Добро пожаловать!')} />
          <Stack.Screen name="WelcomeEn" component={WelcomePageEn} options={createHeaderTitle('Welcome!')} />
          <Stack.Screen name="WelcomeFr" component={WelcomePageFr} options={createHeaderTitle('Bienvenue!')} />
          <Stack.Screen name="WelcomeEs" component={WelcomePageEs} options={createHeaderTitle('¡Bienvenidos!')} />
          <Stack.Screen name="WelcomePt" component={WelcomePagePt} options={createHeaderTitle('Bem-vindos!')} />
          <Stack.Screen name="WelcomeAr" component={WelcomePageAr} options={createHeaderTitle('أهلًا وسهلًا')} />
          <Stack.Screen name="WelcomeAm" component={WelcomePageAm} options={createHeaderTitle('ሰላም መጡ!')} />

          {/* Меню со свитчем уведомлений */}
          <Stack.Screen name="Menu" component={MenuPage} options={createHeaderTitle('Меню', true, 'Уведомления')} />
          <Stack.Screen name="MenuEn" component={MenuPageEn} options={createHeaderTitle('Menu', true, 'Notifications')} />
          <Stack.Screen name="MenuFr" component={MenuPageFr} options={createHeaderTitle('Menu', true, 'Notifications')} />
          <Stack.Screen name="MenuEs" component={MenuPageEs} options={createHeaderTitle('Menú', true, 'Notificaciones')} />
          <Stack.Screen name="MenuPt" component={MenuPagePt} options={createHeaderTitle('Menu', true, 'Notificações')} />
          <Stack.Screen name="MenuAr" component={MenuPageAr} options={createHeaderTitle('القائمة', true, 'الإشعارات')} />
          <Stack.Screen name="MenuAm" component={MenuPageAm} options={createHeaderTitle('ምናሌ', true, 'ማሳወቂያዎች')} />

          {/* Упражнения */}
          <Stack.Screen name="Exercise1" component={Exercise1} options={{ ...createHeaderTitle('Упражнение 1'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise1En" component={Exercise1En} options={{ ...createHeaderTitle('Exercise 1'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise1Fr" component={Exercise1Fr} options={{ ...createHeaderTitle('Exercice 1'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise1Es" component={Exercise1Es} options={{ ...createHeaderTitle('Ejercicio 1'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise1Pt" component={Exercise1Pt} options={{ ...createHeaderTitle('Exercício 1'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise1Ar" component={Exercise1Ar} options={{ ...createHeaderTitle('التمرين 1'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise1Am" component={Exercise1Am} options={{ ...createHeaderTitle('ልምምድ አንድ'), ...exerciseHeaderOptions }} />

          <Stack.Screen name="Exercise2" component={Exercise2} options={{ ...createHeaderTitle('Упражнение 2'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise2En" component={Exercise2En} options={{ ...createHeaderTitle('Exercise 2'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise2Fr" component={Exercise2Fr} options={{ ...createHeaderTitle('Exercice 2'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise2Es" component={Exercise2Es} options={{ ...createHeaderTitle('Ejercicio 2'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise2Pt" component={Exercise2Pt} options={{ ...createHeaderTitle('Exercício 2'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise2Ar" component={Exercise2Ar} options={{ ...createHeaderTitle('التمرين 2'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise2Am" component={Exercise2Am} options={{ ...createHeaderTitle('ልምምድ ሁለት'), ...exerciseHeaderOptions }} />

          <Stack.Screen name="Exercise3" component={Exercise3} options={{ ...createHeaderTitle('Упражнение 3'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise3En" component={Exercise3En} options={{ ...createHeaderTitle('Exercise 3'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise3Fr" component={Exercise3Fr} options={{ ...createHeaderTitle('Exercice 3'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise3Es" component={Exercise3Es} options={{ ...createHeaderTitle('Ejercicio 3'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise3Pt" component={Exercise3Pt} options={{ ...createHeaderTitle('Exercício 3'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise3Ar" component={Exercise3Ar} options={{ ...createHeaderTitle('التمرين 3'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise3Am" component={Exercise3Am} options={{ ...createHeaderTitle('ልምምድ ሶስት'), ...exerciseHeaderOptions }} />

          <Stack.Screen name="Exercise4" component={Exercise4} options={{ ...createHeaderTitle('Упражнение 7'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise4En" component={Exercise4En} options={{ ...createHeaderTitle('Exercise 7'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise4Fr" component={Exercise4Fr} options={{ ...createHeaderTitle('Exercice 7'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise4Es" component={Exercise4Es} options={{ ...createHeaderTitle('Ejercicio 7'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise4Pt" component={Exercise4Pt} options={{ ...createHeaderTitle('Exercício 7'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise4Ar" component={Exercise4Ar} options={{ ...createHeaderTitle('التمرين 7'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise4Am" component={Exercise4Am} options={{ ...createHeaderTitle('ልምምድ ሰባት'), ...exerciseHeaderOptions }} />

          <Stack.Screen name="Exercise5" component={Exercise5} options={{ ...createHeaderTitle('Упражнение 4'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise5En" component={Exercise5En} options={{ ...createHeaderTitle('Exercise 4'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise5Fr" component={Exercise5Fr} options={{ ...createHeaderTitle('Exercice 4'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise5Es" component={Exercise5Es} options={{ ...createHeaderTitle('Ejercicio 4'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise5Pt" component={Exercise5Pt} options={{ ...createHeaderTitle('Exercício 4'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise5Ar" component={Exercise5Ar} options={{ ...createHeaderTitle('التمرين 4'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise5Am" component={Exercise5Am} options={{ ...createHeaderTitle('ልምምድ አራት'), ...exerciseHeaderOptions }} />

          <Stack.Screen name="Exercise6" component={Exercise6} options={{ ...createHeaderTitle('Упражнение 5'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise6En" component={Exercise6En} options={{ ...createHeaderTitle('Exercise 5'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise6Fr" component={Exercise6Fr} options={{ ...createHeaderTitle('Exercice 5'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise6Es" component={Exercise6Es} options={{ ...createHeaderTitle('Ejercicio 5'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise6Pt" component={Exercise6Pt} options={{ ...createHeaderTitle('Exercício 5'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise6Ar" component={Exercise6Ar} options={{ ...createHeaderTitle('لتمرين 5'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise6Am" component={Exercise6Am} options={{ ...createHeaderTitle('ልምምድ አምስት'), ...exerciseHeaderOptions }} />

          <Stack.Screen name="Exercise7" component={Exercise7} options={{ ...createHeaderTitle('Упражнение 8'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise7En" component={Exercise7En} options={{ ...createHeaderTitle('Exercise 8'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise7Fr" component={Exercise7Fr} options={{ ...createHeaderTitle('Exercice 8'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise7Es" component={Exercise7Es} options={{ ...createHeaderTitle('Ejercicio 8'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise7Pt" component={Exercise7Pt} options={{ ...createHeaderTitle('Exercício 8'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise7Ar" component={Exercise7Ar} options={{ ...createHeaderTitle('لتمرين 8'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise7Am" component={Exercise7Am} options={{ ...createHeaderTitle('ልምምድ ስምንት'), ...exerciseHeaderOptions }} />

          <Stack.Screen name="Exercise8" component={Exercise8} options={{ ...createHeaderTitle('Упражнение 6'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise8En" component={Exercise8En} options={{ ...createHeaderTitle('Exercise 6'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise8Fr" component={Exercise8Fr} options={{ ...createHeaderTitle('Exercice 6'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise8Es" component={Exercise8Es} options={{ ...createHeaderTitle('Ejercicio 6'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise8Pt" component={Exercise8Pt} options={{ ...createHeaderTitle('Exercício 6'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise8Ar" component={Exercise8Ar} options={{ ...createHeaderTitle('لتمرين 6'), ...exerciseHeaderOptions }} />
          <Stack.Screen name="Exercise8Am" component={Exercise8Am} options={{ ...createHeaderTitle('መልመጃ ስድስት'), ...exerciseHeaderOptions }} />
        </Stack.Navigator>
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
