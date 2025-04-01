// notifications.js
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const normalizeLanguageCode = (lang) => {
  switch (lang) {
    case 'русский': return 'ru';
    case 'english': return 'en';
    case 'français': return 'fr';
    case 'español': return 'es';
    case 'português': return 'pt';
    case 'العربية': return 'ar';
    case 'አማርኛ': return 'am';
    default: return 'en';
  }
};

const notificationMessages = {
  ru: {
    title: 'Не забудь потренироваться!',
    body: '5 минут иврита сегодня — это прогресс! 💪',
  },
  en: {
    title: 'Don’t forget to practice!',
    body: '5 minutes of Hebrew today = progress! 🚀',
  },
  fr: {
    title: 'N’oublie pas de t’entraîner !',
    body: '5 minutes d’hébreu aujourd’hui = du progrès ! 📈',
  },
  es: {
    title: '¡No olvides practicar!',
    body: '5 minutos de hebreo hoy = progreso 📚',
  },
  pt: {
    title: 'Não se esqueça de praticar!',
    body: '5 minutos de hebraico hoje = progresso 🎯',
  },
  ar: {
    title: 'لا تنسَ التدرب!',
    body: '٥ دقائق من العبرية اليوم = تقدّم! ✨',
  },
  am: {
    title: 'ማስተማር አትርሳ!',
    body: 'ዛ፤ዮ 5 ደጢኪ ዮብርዕስት ማማሬር = እድገት! 🌟',
  },
};

export const initializeNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Основной канал',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
    console.log('📢 Канал уведомлений создан');
  }
};

export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Уведомления отключены. Вы можете включить их в настройках устройства.');
    return false;
  }

  return true;
};

export const scheduleDailyNotification = async () => {
  const alreadyScheduled = await AsyncStorage.getItem('notificationScheduled');
  if (alreadyScheduled === 'true') {
    console.log('🔁 Уведомления уже запланированы, повторное планирование не требуется');
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  const rawLang = await AsyncStorage.getItem('language');
  const lang = normalizeLanguageCode(rawLang);
  const message = notificationMessages[lang] || notificationMessages.en;

  const times = [
    { hour: 11, minute: 30 },
    // { hour: 10, minute: 21 },
    // { hour: 10, minute: 22 },
  ];

  for (const time of times) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: 'default',
        channelId: 'default',
      },
      trigger: {
        ...time,
        repeats: true,
      },
    });
  }

  await AsyncStorage.setItem('notificationScheduled', 'true');
  console.log(`✅ Уведомления запланированы на языке "${lang}"`);
};

export const cancelNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem('notificationScheduled');
  console.log('🚫 Все уведомления отменены');
};

export const devTestNotification = async () => {
  console.log('🔧 Нажата кнопка теста уведомлений');

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Тестовое уведомление',
      body: 'Если ты это видишь — всё работает! 🎉',
      sound: 'default',
      channelId: 'default',
    },
    trigger: {
      seconds: 10,
      repeats: false,
    },
  });

  console.log('✅ Уведомление ЗАПЛАНИРОВАНО через 10 секунд');
};
