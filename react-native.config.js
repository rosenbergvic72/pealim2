// module.exports = {
//   dependencies: {
//     'some-package': {
//       platforms: {
//         android: {
//           packageName: 'com.rosenbergvictor72.Pealim2'
//           // android: null, // Если вы хотите отключить автолинкинг для Android
//         }
//       }
//     }
//   }
// };

// Отключаем автолинк IAP в профилях без IAP, чтобы зависимость не попадала в Gradle
const disableIAP = process.env.EXPO_PUBLIC_DISABLE_IAP === '1';

module.exports = {
  dependencies: disableIAP
    ? {
        'react-native-iap': {
          platforms: { android: null },
        },
      }
    : {},
};


