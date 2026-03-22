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
/**
 * Важно: больше НЕ трогаем android/app напрямую.
 * Работаем только с файлами в КОРНЕ проекта:
 *   - google-services.json            (GP)
 *   - google-services-rustore.json    (RuStore)
 * Expo сам скопирует файл в android/app/google-services.json.
 */
function resolveGoogleServices({ isCI, isRu }) {
  const ROOT = process.cwd();

  // пути только в корне репо
  const rootGpPath = path.join(ROOT, 'google-services.json');
  const rootRuPath = path.join(ROOT, 'google-services-rustore.json');
  const targetPath = isRu ? rootRuPath : rootGpPath;

  // 1) Файл уже есть в корне — отлично.
  if (fs.existsSync(targetPath)) {
    return targetPath; // абсолютный путь
  }

  // 2) На CI материализуем из переменной окружения (сырой JSON)
  if (isCI) {
    const envValue = isRu
      ? process.env.GOOGLE_SERVICES_JSON_RU
      : process.env.GOOGLE_SERVICES_JSON;

    const materialized = writeIfJsonish(envValue, targetPath);
    if (materialized && fs.existsSync(targetPath)) {
      return targetPath;
    }
  }

  // 3) Не нашли — просто предупреждение. Сборка упадёт только если реально нужен Firebase.
  console.warn(
    `[config] google-services.json not found for STORE=${isRu ? 'rustore' : 'gp'}; ` +
      `Gradle will fail if Firebase/FCM is required.`
  );
  return undefined;
}

/* ====================== Export ====================== */
export default ({ config }) => {
  // ===== Входные env =====
  const STORE = process.env.EXPO_PUBLIC_STORE ?? process.env.STORE ?? 'gp'; // 'gp' | 'rustore' | 'ios'
  const isRu = STORE === 'rustore';
  const isCI = process.env.EAS_BUILD === 'true' || process.env.CI === 'true';

  const disableIap = process.env.EXPO_PUBLIC_DISABLE_IAP === '1';
  const proBypass = process.env.EXPO_PUBLIC_PRO_BYPASS === '1';

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

  const appVersion = '1.1.8';
  const versionCode = isRu ? 1000010 : 2000900; // инкрементируйте при каждом релизе
  const runtimeVersion = `${appVersion}-${isRu ? 'ru' : 'gp'}`;

  // ===== Подготовим google-services.json (в корне проекта) =====
  const gsPath = resolveGoogleServices({ isCI, isRu });

  // На CI для GP — жёсткая проверка, но уже без привязки к android/app
  if (isCI && !isRu && !gsPath) {
    throw new Error(
      '[config] GOOGLE_SERVICES_JSON is missing for GP build ' +
        '(expected google-services.json in project root or GOOGLE_SERVICES_JSON env)'
    );
  }

  return {
    ...config,

    name: 'Verbify',
    slug: 'pealim2',
    version: appVersion,
    orientation: 'portrait',

    locales: {
    en: { name: 'Verbify' },
    ru: { name: 'Verbify' },
    he: { name: 'Verbify' },
    fr: { name: 'Verbify' },
    es: { name: 'Verbify' },
    'pt-BR': { name: 'Verbify' },
    ar: { name: 'Verbify' },
    am: { name: 'Verbify' },
  },

    // OTA-обновления (Expo Updates)
    updates: {
      url: 'https://u.expo.dev/1c3fbe10-9608-4dd7-a477-f0ae7c294b5e',
    },
    runtimeVersion,

    ios: {
      ...config.ios,
      bundleIdentifier: 'com.rosenbergvictor72.pealim2',
      icon: './assets/images/icon1024.png',
      infoPlist: {
        ...(config.ios?.infoPlist || {}),
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription: '...',
        NSPhotoLibraryAddUsageDescription: '...',
        NSCameraUsageDescription: '...',
        NSMicrophoneUsageDescription: '...',
        CFBundleDevelopmentRegion: 'en',
        CFBundleAllowMixedLocalizations: true,
        CFBundleLocalizations: [
          'en',
          'ru',
          'fr',
          'es',
          'pt-BR',
          'ar',
          'he',
          'am',
        ],
      },
    },

    android: {
      ...config.android,
      package: androidPackage,
      versionCode,
      // Для managed/prebuild: подсказываем, где взять google-services.json (в корне)
      ...(gsPath
        ? { googleServicesFile: path.relative(process.cwd(), gsPath) }
        : {}),
    },

    extra: {
      ...config.extra,
      store: STORE, // 'gp' | 'rustore' | 'ios'
      paymentsProvider: isRu ? 'rustore' : 'gp',
      disableIap, // отключить IAP на клиенте (UI/логика)
      proBypass, // (dev) принудительный Pro

      // IAP Verify URL и (опц.) API key для заголовка x-api-key
      IAP_VERIFY_URL:
        iapVerifyUrlFromEnv ||
        'https://iap-server.onrender.com/iap/google/subscription/verify',
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