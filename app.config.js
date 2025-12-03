// app.config.js
import fs from 'fs';
import path from 'path';

/* ====================== FS helpers ====================== */
function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeIfJsonish(value, outAbsPath) {
  if (!value) return null;
  const s = String(value).trim();
  // Если это «сырой» JSON (секрет из EAS/Render) — материализуем файл
  if (s.startsWith('{')) {
    try {
      ensureDir(outAbsPath);
      fs.writeFileSync(outAbsPath, s, 'utf8');
      return outAbsPath;
    } catch {
      // no-op
    }
  }
  // Если это ссылка вида @project:..., не трогаем — Expo сам разберётся
  if (s.startsWith('@project:')) return null;
  // Иначе вернём как строку/путь — вдруг передали готовый путь
  return s;
}

/* ====================== google-services.json resolver ====================== */
function resolveGoogleServices({ isCI, isRu }) {
  const ROOT = process.cwd();
  const ANDROID_APP = path.join(ROOT, 'android', 'app');
  const appJsonPath = path.join(ANDROID_APP, 'google-services.json'); // основной для Gradle
  const rootGpPath  = path.join(ROOT, 'google-services.json');        // локальный fallback (GP)
  const rootRuPath  = path.join(ROOT, 'google-services-rustore.json'); // локальный fallback (RuStore)

  // 1) Уже лежит в android/app — отлично.
  if (fs.existsSync(appJsonPath)) return appJsonPath;

  // 2) Есть локальный fallback в корне репо — копируем в android/app.
  const localFallback = isRu ? rootRuPath : rootGpPath;
  if (fs.existsSync(localFallback)) {
    try {
      ensureDir(appJsonPath);
      fs.copyFileSync(localFallback, appJsonPath);
      return appJsonPath;
    } catch {
      // Если копия не удалась, используем исходный путь как есть (на всякий)
      return localFallback;
    }
  }

  // 3) На CI материализуем из секрета (переменная окружения содержит «сырой» JSON).
  if (isCI) {
    const envValue = isRu ? process.env.GOOGLE_SERVICES_JSON_RU : process.env.GOOGLE_SERVICES_JSON;
    const materialized = writeIfJsonish(envValue, appJsonPath);
    if (materialized && fs.existsSync(appJsonPath)) return appJsonPath;
  }

  // 4) Не нашли — предупредим. Возможно, проект собирается без Firebase.
  console.warn(
    `[config] google-services.json not found for STORE=${isRu ? 'rustore' : 'gp'}; ` +
    `Gradle will fail if Firebase/FCM is required.`
  );
  return undefined;
}

/* ====================== Export ====================== */
export default ({ config }) => {
  // ===== Входные env =====
  const STORE = process.env.EXPO_PUBLIC_STORE ?? process.env.STORE ?? 'gp'; // 'gp' | 'rustore'
  const isRu = STORE === 'rustore';
  const isCI = process.env.EAS_BUILD === 'true' || process.env.CI === 'true';

  const disableIap = process.env.EXPO_PUBLIC_DISABLE_IAP === '1';
  const proBypass  = process.env.EXPO_PUBLIC_PRO_BYPASS === '1';

  // URL серверной верификации IAP (можно также задать в eas.json -> env)
  const iapVerifyUrlFromEnv =
    process.env.EXPO_PUBLIC_IAP_VERIFY_URL ||
    process.env.IAP_VERIFY_URL ||
    '';

  // (опц.) API-ключ для заголовка x-api-key — если включена проверка на сервере
  const iapApiKeyFromEnv =
    process.env.EXPO_PUBLIC_IAP_API_KEY ||
    process.env.IAP_API_KEY ||
    '';

  // ===== Пакеты/версии =====
  const androidPackage = isRu
    ? 'com.rosenbergvictor72.verbify.ru'
    : 'com.rosenbergvictor72.pealim2';

  const appVersion     = '1.1.2';
  const versionCode    = isRu ? 1000010 : 2000100; // инкрементируйте при каждом релизе
  const runtimeVersion = `${appVersion}-${isRu ? 'ru' : 'gp'}`;

  // ===== Подготовим google-services.json =====
  const gsPath = resolveGoogleServices({ isCI, isRu });

  // На CI для GP — жёсткая проверка: файл должен оказаться в android/app
  if (isCI && !isRu && !gsPath) {
    throw new Error(
      '[config] GOOGLE_SERVICES_JSON is missing for GP build ' +
      '(expected at android/app/google-services.json)'
    );
  }

  return {
    ...config,

    name: 'Verbify',
    slug: 'pealim2',
    version: appVersion,
    orientation: 'portrait',

    // OTA-обновления (Expo Updates)
    updates: {
      url: 'https://u.expo.dev/1c3fbe10-9608-4dd7-a477-f0ae7c294b5e',
    },
    runtimeVersion,

    android: {
      ...config.android,
      package: androidPackage,
      versionCode,
      // Для managed/prebuild: подсказываем где взять google-services.json
      ...(gsPath ? { googleServicesFile: path.relative(process.cwd(), gsPath) } : {}),
    },

    extra: {
      ...config.extra,
      store: STORE,                                 // 'gp' | 'rustore'
      paymentsProvider: isRu ? 'rustore' : 'gp',
      disableIap,                                   // отключить IAP на клиенте (UI/логика)
      proBypass,                                    // (dev) принудительный Pro

      // IAP Verify URL и (опц.) API key для заголовка x-api-key
      IAP_VERIFY_URL: iapVerifyUrlFromEnv || 'https://iap-server.onrender.com/iap/google/subscription/verify',
      IAP_API_KEY: iapApiKeyFromEnv,
    },

    plugins: [
      'expo-localization',
      'expo-notifications',
      // react-native-iap подключаем только для GP и если IAP не отключён
      ...(isRu || disableIap ? [] : ['react-native-iap']),
    ],
  };
};
