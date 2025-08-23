// app.config.js
export default ({ config }) => {
  const STORE = process.env.STORE ?? 'gp';
  const isRu = STORE === 'rustore';

  const isCI = process.env.EAS_BUILD === 'true'; // на EAS билдере = 'true'

  const androidPackage = isRu
    ? 'com.rosenbergvictor72.verbify.ru'
    : 'com.rosenbergvictor72.verbify';

  // На CI берём путь из file-секретов, локально — из файлов в проекте
  const googleServicesFile = isRu
    ? (isCI ? process.env.GOOGLE_SERVICES_JSON_RU : './google-services-rustore.json')
    : (isCI ? process.env.GOOGLE_SERVICES_JSON    : './google-services.json');

  const versionCode = isRu ? 1000008 : 2000008;

  return {
    ...config,
    name: 'Verbify',
    slug: 'pealim2',
    version: '1.0.8',
    orientation: 'portrait',

    updates: { url: 'https://u.expo.dev/1c3fbe10-9608-4dd7-a477-f0ae7c294b5e' },
    runtimeVersion: { policy: 'appVersion' },

    android: {
      ...config.android,
      package: androidPackage,
      googleServicesFile,
      versionCode,
    },

    extra: {
      ...config.extra,
      store: STORE,
      paymentsProvider: isRu ? 'rustore' : 'gp',
    },

    plugins: ['expo-localization', 'expo-notifications'],
  };
};
