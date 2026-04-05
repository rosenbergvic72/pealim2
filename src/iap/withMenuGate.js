import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { useIap } from './IapProvider';

const FREE_FLAG_KEY = 'freePreview';

function paywallRouteName() {
  return Platform.OS === 'ios' ? 'PaywallIOS' : 'Paywall';
}

export function withMenuGate(ScreenComponent, _featureKey) {
  function WithGate(props) {
    const { ready, hasPro, accessState = 'checking' } = useIap();
    const [freePreview, setFreePreview] = useState(null);
    const redirectedRef = useRef(false);

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

          const val = fromParams || fromStorage;
          if (mounted) setFreePreview(val);
        } catch {
          if (mounted) setFreePreview(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [props?.route?.params?.freePreview]);

    useEffect(() => {
      if (!ready) return;
      if (accessState === 'checking') return;
      if (freePreview === null) return;

      if (hasPro && redirectedRef.current) {
        redirectedRef.current = false;
        return;
      }

      if (!hasPro && !freePreview && !redirectedRef.current) {
        redirectedRef.current = true;

        props.navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: paywallRouteName() }],
          })
        );
      }
    }, [ready, accessState, hasPro, freePreview, props.navigation]);

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

    if (freePreview === null && !hasPro) {
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

    return <ScreenComponent {...props} freePreview={!!freePreview && !hasPro} />;
  }

  WithGate.displayName = `withMenuGate(${
    ScreenComponent.displayName || ScreenComponent.name || 'Screen'
  })`;

  return WithGate;
}