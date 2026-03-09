// src/iap/withAccessGate.js
import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useIap } from './IapProvider';

// Экраны, которые всегда бесплатны (1 и 2 упражнение, все локали)
export const FREE_ROUTES = new Set([
  'Exercise1',
  'Exercise1En',
  'Exercise1Fr',
  'Exercise1Es',
  'Exercise1Pt',
  'Exercise1Ar',
  'Exercise1Am',
  'Exercise2',
  'Exercise2En',
  'Exercise2Fr',
  'Exercise2Es',
  'Exercise2Pt',
  'Exercise2Ar',
  'Exercise2Am',
]);

function isFreeRoute(routeName) {
  return FREE_ROUTES.has(routeName);
}

function paywallRouteName() {
  return Platform.OS === 'ios' ? 'PaywallIOS' : 'Paywall';
}

export function withAccessGate(ScreenComponent) {
  function WrappedScreen(props) {
    const { hasPro, accessState = 'checking' } = useIap();
    const { navigation, route } = props;

    const routeName = route?.name || '';
    const free = useMemo(() => isFreeRoute(routeName), [routeName]);

    const redirectedRef = useRef(false);

    useEffect(() => {
      if (accessState === 'checking') return;

      if (!hasPro && !free && !redirectedRef.current) {
        redirectedRef.current = true;

        const id = setTimeout(() => {
          navigation.replace(paywallRouteName(), { from: routeName });
        }, 0);

        return () => clearTimeout(id);
      }

      if (hasPro && redirectedRef.current) {
        redirectedRef.current = false;
      }
    }, [accessState, hasPro, free, navigation, routeName]);

    useEffect(() => {
      if (accessState !== 'checking' && !hasPro) {
        navigation.setOptions({ headerRight: () => null });
      }
    }, [accessState, hasPro, navigation]);

    if (free) {
      return <ScreenComponent {...props} isFreeUser={!hasPro} />;
    }

    if (accessState === 'checking') {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#AFC1D0',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color="#2D4769" />
        </View>
      );
    }

    if (!hasPro && !free) return null;

    const isFreeUser = !hasPro;

    return <ScreenComponent {...props} isFreeUser={isFreeUser} />;
  }

  WrappedScreen.displayName = `withAccessGate(${
    ScreenComponent.displayName || ScreenComponent.name || 'Screen'
  })`;

  return WrappedScreen;
}