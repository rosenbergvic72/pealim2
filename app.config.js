// app.config.js
import fs from 'fs';
import path from 'path';

// ---------- helpers ----------
function writeIfJsonish(value, outName) {
  if (!value) return null;
  const s = String(value).trim();
  if (s.startsWith('{')) {
    const outPath = path.join(process.cwd(), outName);
    try { fs.writeFileSync(outPath, s, 'utf8'); } catch {}
    return outPath;
  }
  if (s.startsWith('@project:')) return null; // EAS заменит сам
  return s; // путь к файлу
}

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

  console.warn(`[config] google-services.json not provided for ${isRu ? 'RuStore' : 'GP'} (ok locally; EAS may inject).`);
  return undefined;
}

// ---------- inline config plugin: добавить flavors и missingDimensionStrategy ----------
const withIapPlayFlavor = (config) => {
  const { withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

  // В app/build.gradle добавляем flavorDimensions/productFlavors(play) и missingDimensionStrategy('store','play')
  config = withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;

    // missingDimensionStrategy 'store','play' в defaultConfig
    src = src.replace(
      /defaultConfig\s*{([\s\S]*?)}/m,
      (m) => m.includes("missingDimensionStrategy 'store', 'play'")
        ? m
        : m.replace(/}$/, `    missingDimensionStrategy 'store', 'play'\n}`)
    );

    // flavorDimensions "store" + productFlavors { play { dimension "store" } }
    if (!/flavorDimensions\s+"store"/.test(src)) {
      src = src.replace(
        /android\s*{([\s\S]*?)}/m,
        (m) => m.replace(/}$/, `  flavorDimensions "store"\n  productFlavors { play { dimension "store" } }\n}`)
      );
    } else if (!/productFlavors\s*{[\s\S]*?play\s*{[\s\S]*?dimension\s+"store"/.test(src)) {
      src = src.replace(
        /flavorDimensions\s+"store"[^\n]*\n/m,
        (m) => `${m}  productFlavors { play { dimension "store" } }\n`
      );
    }

    cfg.modResults.contents = src;
    return cfg;
  });

  // На всякий случай не трогаем project build.gradle — нам это не нужно.
  config = withProjectBuildGradle(config, (cfg) => cfg);

  return config;
};

export default ({ config }) => {
  // окружение
  const STORE = process.env.EXPO_PUBLIC_STORE ?? process.env.STORE ?? 'gp'; // 'gp' | 'rustore'
  const isRu = STORE === 'rustore';
  const isCI = process.env.EAS_BUILD === 'true' || process.env.CI === 'true';

  // включение IAP: для RuStore выключаем, для GP — смотрим флаг
  const disableIap = isRu ? true : process.env.EXPO_PUBLIC_DISABLE_IAP === '1';
  const proBypass = process.env.EXPO_PUBLIC_PRO_BYPASS === '1';

  // пакеты (android.package в managed игнорируется, но оставим для консистентности)
  const androidPackage = isRu
    ? 'com.rosenbergvictor72.verbify.ru'
    : 'com.rosenbergvictor72.pealim2';

  const googleServicesFile = resolveGoogleServices({ isCI, isRu });

  // версии
  const versionName = '1.1.0';
  // Подними code, чтобы Play принял новый билд
  const versionCode = isRu ? 1000010 : 2000010;

  // строгая проверка наличия google-services для GP в CI
  if (isCI && !isRu && !googleServicesFile) {
    throw new Error('[config] GOOGLE_SERVICES_JSON is missing for GP build (com.rosenbergvictor72.pealim2)');
  }

  const base = {
    name: 'Verbify',
    slug: 'pealim2',
    version: versionName,
    orientation: 'portrait',
    // Managed workflow: можно policy
    updates: { url: 'https://u.expo.dev/1c3fbe10-9608-4dd7-a477-f0ae7c294b5e' },
    runtimeVersion: { policy: 'appVersion' },
    android: {
      package: androidPackage,
      ...(googleServicesFile ? { googleServicesFile } : {}),
      versionCode
    },
    extra: {
      store: STORE,
      paymentsProvider: isRu ? 'rustore' : 'gp',
      disableIap,
      proBypass,
    },
    plugins: [
      'expo-localization',
      'expo-notifications',
      // Подключаем IAP только если это GP и не отключено флагом
      ...(disableIap ? [] : ['react-native-iap']),
      // Вставляем flavors/play, когда IAP включён
      ...(disableIap ? [] : [withIapPlayFlavor]),
    ],
  };

  // смешиваем с исходным config на всякий случай
  return { ...(config ?? {}), ...base, android: { ...(config?.android ?? {}), ...base.android }, extra: { ...(config?.extra ?? {}), ...base.extra } };
};
