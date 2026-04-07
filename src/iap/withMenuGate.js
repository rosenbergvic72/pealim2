import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIap } from './IapProvider';

const FREE_FLAG_KEY = 'freePreview';

export function withMenuGate(ScreenComponent, _featureKey) {
  function WithGate(props) {
    const { ready, hasPro, accessState = 'checking' } = useIap();
    const [freePreview, setFreePreview] = useState(null);

    useEffect(() => {
      let mounted = true;

      (async () => {
        try {
          const fromParams = !!props?.route?.params?.freePreview;

          let fromStorage = false;
          try {
            const stored = await AsyncStorage.getItem(FREE_FLAG_KEY);
            fromStorage = stored === '1';
          } catch {
            fromStorage = false;
          }

          if (mounted) {
            setFreePreview(fromParams || fromStorage);
          }
        } catch {
          if (mounted) setFreePreview(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [props?.route?.params?.freePreview]);

    // Ждём, пока IAP полностью определит доступ
    if (!ready || accessState === 'checking') {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#F0F0F0',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color="#2D4769" />
        </View>
      );
    }

    // Ждём, пока дочитается freePreview
    if (freePreview === null) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#F0F0F0',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color="#2D4769" />
        </View>
      );
    }

    // НИКАКИХ редиректов на Paywall здесь больше нет
    return (
      <ScreenComponent
        {...props}
        hasPro={hasPro}
        freePreview={!!freePreview && !hasPro}
      />
    );
  }

  WithGate.displayName = `withMenuGate(${
    ScreenComponent.displayName || ScreenComponent.name || 'Screen'
  })`;

  return WithGate;
}