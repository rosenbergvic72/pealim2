import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useIap } from './src/iap/IapProvider';

const FIRST_LAUNCH_KEY = 'verbify_first_launch_completed';
const LANGUAGE_KEY = 'language';

function normalizeLanguage(value) {
  return String(value || '').trim().toLowerCase();
}

function getRoutesForLanguage(languageValue) {
  const normalized = normalizeLanguage(languageValue);

  switch (normalized) {
    case 'english':
    case 'en':
      return { welcome: 'WelcomeEn', menu: 'MenuEn' };

    case 'русский':
    case 'russian':
    case 'ru':
      return { welcome: 'Welcome', menu: 'Menu' };

    case 'français':
    case 'french':
    case 'fr':
      return { welcome: 'WelcomeFr', menu: 'MenuFr' };

    case 'español':
    case 'spanish':
    case 'es':
      return { welcome: 'WelcomeEs', menu: 'MenuEs' };

    case 'português':
    case 'portuguese':
    case 'pt':
      return { welcome: 'WelcomePt', menu: 'MenuPt' };

    case 'العربية':
    case 'arabic':
    case 'ar':
    case 'arab':
      return { welcome: 'WelcomeAr', menu: 'MenuAr' };

    case 'አማርኛ':
    case 'amharic':
    case 'am':
      return { welcome: 'WelcomeAm', menu: 'MenuAm' };

    default:
      console.log('[StartupGate] Unknown language:', languageValue);
      return { welcome: 'WelcomeEn', menu: 'MenuEn' };
  }
}

export default function StartupGate() {
  const navigation = useNavigation();
  const hasNavigatedRef = useRef(false);

  const { ready, accessState, hasPro } = useIap();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!ready) return;
      if (accessState === 'checking') return;
      if (hasNavigatedRef.current) return;

      try {
        const [savedLanguage, firstLaunchCompleted] = await Promise.all([
          AsyncStorage.getItem(LANGUAGE_KEY),
          AsyncStorage.getItem(FIRST_LAUNCH_KEY),
        ]);

        console.log('[StartupGate] savedLanguage =', savedLanguage);
        console.log('[StartupGate] firstLaunchCompleted =', firstLaunchCompleted);
        console.log('[StartupGate] ready =', ready, 'accessState =', accessState, 'hasPro =', hasPro);

        if (cancelled || hasNavigatedRef.current) return;
        hasNavigatedRef.current = true;

        if (!savedLanguage) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'LanguageSelectionPage' }],
            })
          );
          return;
        }

        const routes = getRoutesForLanguage(savedLanguage);

        if (!firstLaunchCompleted) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: routes.welcome, params: { language: savedLanguage } }],
            })
          );
          return;
        }

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: routes.menu }],
          })
        );
      } catch (error) {
        console.log('[StartupGate] error:', error);

        if (cancelled || hasNavigatedRef.current) return;
        hasNavigatedRef.current = true;

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'LanguageSelectionPage' }],
          })
        );
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [navigation, ready, accessState, hasPro]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2D4769" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});