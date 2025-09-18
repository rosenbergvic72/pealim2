// app.config.js
import fs from 'fs';
import path from 'path';

function writeIfJsonish(value, outName) {
  if (!value) return null;
  const s = String(value).trim();
  if (s.startsWith('{')) {
    const outPath = path.join(process.cwd(), outName);
    try { fs.writeFileSync(outPath, s, 'utf8'); } catch {}
    return outPath;
  }
  if (s.startsWith('@project:')) return null;
  return s;
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

  console.warn(`[config] google-services.json not provided for STORE=${isRu ? 'rustore' : 'gp'} (ok locally; EAS may inject).`);
  return undefined;
}

export default ({ config }) => {
  const STORE = process.env.EXPO_PUBLIC_STORE ?? process.env.STORE ?? 'gp'; // 'gp' | 'rustore'
  const isRu = STORE === 'rustore';
  const isCI = process.env.EAS_BUILD === 'true' || process.env.CI === 'true';

  const disableIap = process.env.EXPO_PUBLIC_DISABLE_IAP === '1';
  const proBypass  = process.env.EXPO_PUBLIC_PRO_BYPASS === '1';

  const androidPackage = isRu
    ? 'com.rosenbergvictor72.verbify.ru'
    : 'com.rosenbergvictor72.pealim2';

  const googleServicesFile = resolveGoogleServices({ isCI, isRu });

  // версии (меняй по необходимости)
  const appVersion  = '1.1.0';
  const versionCode = isRu ? 1000010 : 2000010; // увеличивай при каждом загрузе в маркет

  // ВАЖНО: для bare нужна строка, а не { policy: ... }.
  // Разделим рантаймы по сторам, чтобы OTA не пересекались:
  const runtimeVersion = `${appVersion}-${isRu ? 'ru' : 'gp'}`;

  if (isCI && !isRu && !googleServicesFile) {
    throw new Error('[config] GOOGLE_SERVICES_JSON is missing for GP build (com.rosenbergvictor72.pealim2)');
  }

  return {
    ...config,
    name: 'Verbify',
    slug: 'pealim2',
    version: appVersion,
    orientation: 'portrait',

    // expo-updates
    updates: {
      url: 'https://u.expo.dev/1c3fbe10-9608-4dd7-a477-f0ae7c294b5e',
    },
    runtimeVersion, // 👈 теперь строка (например "1.1.0-gp")

    android: {
      ...config.android,
      package: androidPackage, // игнорируется при наличии android/, но оставим для консистентности
      ...(googleServicesFile ? { googleServicesFile } : {}),
      versionCode,
    },

    extra: {
      ...config.extra,
      store: STORE,
      paymentsProvider: isRu ? 'rustore' : 'gp',
      disableIap,
      proBypass,
    },

    plugins: [
      'expo-localization',
      'expo-notifications',
      // IAP только для GP и когда не отключено
      ...(isRu || disableIap ? [] : ['react-native-iap']),
    ],
  };
};
