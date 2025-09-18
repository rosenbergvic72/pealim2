// app.config.js
import fs from 'fs';
import path from 'path';

/** Если в ENV лежит JSON — материализуем его в файл (нужно для EAS) */
function writeIfJsonish(value, outName) {
  if (!value) return null;
  const s = String(value).trim();

  // Приходит JSON строкой -> пишем во временный файл в корне проекта
  if (s.startsWith('{')) {
    const outPath = path.join(process.cwd(), outName);
    try {
      fs.writeFileSync(outPath, s, 'utf8');
    } catch {}
    return outPath;
  }

  // Плейсхолдер вида @project:... — пусть Expo сам подставит
  if (s.startsWith('@project:')) return null;

  // Иначе считаем, что это путь к уже существующему файлу
  return s;
}

/** Разруливаем путь к google-services.json для GP/RuStore и локально/EAS */
function resolveGoogleServices({ isCI, isRu }) {
  const localRu = './google-services-rustore.json';
  const localGp = './google-services.json';

  const source = isRu
    ? (isCI ? process.env.GOOGLE_SERVICES_JSON_RU : localRu)
    : (isCI ? process.env.GOOGLE_SERVICES_JSON    : localGp);

  const outName = isRu ? 'google-services-rustore.json' : 'google-services.json';
  const materialized = writeIfJsonish(source, outName);

  if (materialized && fs.existsSync(materialized)) return materialized;

  const fallback = isRu ? localRu : localGp;
  if (fs.existsSync(fallback)) return fallback;

  console.warn(
    `[config] google-services.json not provided for STORE=${isRu ? 'rustore' : 'gp'} (ok locally; EAS may inject).`
  );
  return undefined;
}

export default ({ config }) => {
  // ====== ФЛАГИ ОКРУЖЕНИЯ ======
  const STORE = process.env.EXPO_PUBLIC_STORE ?? process.env.STORE ?? 'gp'; // 'gp' | 'rustore'
  const isRu = STORE === 'rustore';
  const isCI = process.env.EAS_BUILD === 'true' || process.env.CI === 'true';

  // Переключатели IAP/PRO
  const disableIap = process.env.EXPO_PUBLIC_DISABLE_IAP === '1';
  const proBypass = process.env.EXPO_PUBLIC_PRO_BYPASS === '1';

  // Пакет (в bare он будет проигнорирован, если уже есть android/, но оставим для единообразия)
  const androidPackage = isRu
    ? 'com.rosenbergvictor72.verbify.ru'
    : 'com.rosenbergvictor72.pealim2';

  // google-services.json
  const googleServicesFile = resolveGoogleServices({ isCI, isRu });

  // versionCode: EAS (remote) может игнорировать, но значение попадёт в manifest через expo-constants
  const versionCode = isRu ? 1000010 : 2000010; // увеличивай при каждом загрузке в консоль GP/RuStore

  // В CI для GP требуем наличие google-services.json
  if (isCI && !isRu && !googleServicesFile) {
    throw new Error(
      '[config] GOOGLE_SERVICES_JSON is missing for GP build (com.rosenbergvictor72.pealim2)'
    );
  }

  return {
    ...config,

    // ====== БАЗОВОЕ ======
    name: 'Verbify',
    slug: 'pealim2',
    version: '1.1.1',
    orientation: 'portrait',

    // ====== EXPO UPDATES / RUNTIME VERSION ======
    // В bare workflow нельзя policy — только строка.
    // OTA отключены, но runtimeVersion обязателен, т.к. в AndroidManifest уже есть meta-data.
    updates: { enabled: false },
    runtimeVersion: '1.1.1',

    // ====== ANDROID ======
    android: {
      ...config.android,
      package: androidPackage,                 // будет проигнорировано, если уже есть android/
      ...(googleServicesFile ? { googleServicesFile } : {}),
      versionCode,
    },

    // ====== EXTRA (доступно в JS через expo-constants) ======
    extra: {
      ...config.extra,
      store: STORE,                             // 'gp' | 'rustore'
      paymentsProvider: isRu ? 'rustore' : 'gp',
      disableIap,                               // чтобы IapProvider мог скрывать IAP
      proBypass,                                // чтобы QA мог включать PRO без покупки
    },

    // ====== ПЛАГИНЫ ======
    plugins: [
      'expo-localization',
      'expo-notifications',
      // Подключаем IAP только если это не RuStore и не выключено флагом
      ...(isRu || disableIap ? [] : ['react-native-iap']),
    ],
  };
};
