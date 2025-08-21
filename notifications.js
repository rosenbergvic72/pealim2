// notifications.js
import { Platform, PermissionsAndroid, NativeModules } from 'react-native';
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ===== локализация =====
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
  ru: { title: 'Это Verbify!', body: 'Не забудь потренироваться!\nСегодня практика — завтра уверенность в общении! 💪' },
  en: { title: 'This is Verbify!', body: 'Don’t forget to practice!\nPractice today — confidence in conversation tomorrow! 💪' },
  fr: { title: 'C’est Verbify !', body: 'N’oublie pas de t’entraîner !\nAujourd’hui l’entraînement — demain confiance dans la conversation ! 💪' },
  es: { title: '¡Esto es Verbify!', body: '¡No olvides practicar!\nPractica hoy — confianza en la conversación mañana 💪' },
  pt: { title: 'Este é o Verbify!', body: 'Não se esqueça de praticar!\nPratique hoje — confiança na conversa amanhã! 💪' },
  ar: { title: 'هذا هو Verbify!', body: 'لا تنسَ التدرب!\nتمرّن اليوم — وثقة في الحديث غدًا! 💪' },
  am: { title: 'ይህ Verbify ነው!', body: 'ማስተማርን አትርሳ!\nዛሬ ማስተማር — ነገ በንግግር እምነት! 💪' },
};

// ===== проверка наличия нативного модуля (в Expo Go его нет) =====
export const isPushModuleAvailable = !!NativeModules.RNPushNotification;

const CHANNEL_ID = 'verbify_reminders';

// Android 13+ runtime permission
export async function unifiedRequestNotificationPermission() {
  if (Platform.OS !== 'android') return true;
  try {
    const already = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (already) return true;

    const res = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return res === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

// Инициализация канала и обработчиков (синхронно с точки зрения вызова)
export function initNotifications() {
  if (!isPushModuleAvailable) {
    console.log('🔕 RNPN native module NOT available (Expo Go / Bridgeless). No-op.');
    return false;
  }

  PushNotification.createChannel(
    {
      channelId: CHANNEL_ID,
      channelName: 'Verbify Reminders',
      channelDescription: 'Daily practice notifications',
      soundName: 'default',
      importance: 4, // HIGH
      vibrate: true,
    },
    (created) => console.log('📡 Channel created:', created)
  );

  PushNotification.configure({
    onNotification(notification) {
      console.log('📩 Notification tapped:', notification);
    },
    requestPermissions: Platform.OS === 'ios',
  });

  return true;
}

async function getLocalizedPayload() {
  const raw = (await AsyncStorage.getItem('language')) || 'english';
  const lang = normalizeLanguageCode(raw);
  const msg = notificationMessages[lang] || notificationMessages.en;
  return { title: msg.title, message: msg.body };
}

// Разовое уведомление через N секунд
export async function scheduleInSeconds(seconds = 10) {
  if (!isPushModuleAvailable) {
    console.log('🔕 scheduleInSeconds skipped: no native module (Expo Go).');
    return;
  }
  const { title, message } = await getLocalizedPayload();
  PushNotification.localNotificationSchedule({
    channelId: CHANNEL_ID,
    title,
    message: `${message}\n\n(~${seconds} sec)`,
    date: new Date(Date.now() + seconds * 1000),
    allowWhileIdle: true,
  });
  console.log(`✅ Scheduled single notification in ${seconds} sec`);
}

// Ежедневное уведомление в фиксированное время
export async function scheduleDailyNotification(hour = 9, minute = 0) {
  if (!isPushModuleAvailable) {
    console.log('🔕 scheduleDailyNotification skipped: no native module (Expo Go).');
    return;
  }
  const { title, message } = await getLocalizedPayload();

  const now = new Date();
  const first = new Date(now);
  first.setHours(hour, minute, 0, 0);
  if (first <= now) first.setDate(first.getDate() + 1);

  PushNotification.localNotificationSchedule({
  channelId: CHANNEL_ID,
  // smallIcon: 'ic_notification', // 👈 вот это
  // largeIcon: 'ic_launcher',
  title,
  message,
  date: first,
  allowWhileIdle: true,
  repeatType: 'day',
});
  console.log(`✅ Scheduled daily notification at ${hour}:${String(minute).padStart(2, '0')}`);
}

// Отмена всех
export function cancelNotifications() {
  if (!isPushModuleAvailable) {
    console.log('🔕 cancelNotifications skipped: no native module (Expo Go).');
    return;
  }
  PushNotification.cancelAllLocalNotifications();
  console.log('🗑 All notifications cancelled');
}

// Удобный бутстрап (если хочется одним вызовом)
export async function bootstrapNotifications(hour = 9, minute = 0) {
  const ok = initNotifications(); // вернёт false в Expo Go
  if (!ok) return false;
  const granted = await unifiedRequestNotificationPermission();
  if (!granted) return false;
  await scheduleDailyNotification(hour, minute);
  return true;
}
