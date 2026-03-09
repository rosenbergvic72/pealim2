// src/iap/withMenuGate.js
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { useIap } from './IapProvider';

const FREE_FLAG_KEY = 'freePreview'; // ставится Paywall'ом при нажатии на «Продолжить бесплатно»

function paywallRouteName() {
  return Platform.OS === 'ios' ? 'PaywallIOS' : 'Paywall';
}

export function withMenuGate(ScreenComponent, _featureKey) {
  function WithGate(props) {
    const { hasPro, accessState = 'checking' } = useIap();
    const [freePreview, setFreePreview] = useState(null); // null = ещё читаем
    const redirectedRef = useRef(false);

    // читаем из params и из AsyncStorage ДО решения о редиректе
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

    // Если нет PRO и нет freePreview — отправляем на Paywall,
    // но только когда проверка доступа уже закончена
    useEffect(() => {
      if (accessState === 'checking') return;
      if (freePreview === null) return;

      // если PRO появился — сбрасываем флаг редиректа
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
    }, [accessState, hasPro, freePreview, props.navigation]);

    // Пока идёт проверка доступа — ничего не редиректим и не показываем paywall
    // Можно оставить null, но лучше нейтральную заглушку
    if (accessState === 'checking') {
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

    // Пока freePreview ещё читается, меню не рисуем, чтобы не было лишнего мигания
    if (freePreview === null && !hasPro) return null;

    // Пробросим флаг в сам экран
    return <ScreenComponent {...props} freePreview={!!freePreview && !hasPro} />;
  }

  WithGate.displayName = `withMenuGate(${
    ScreenComponent.displayName || ScreenComponent.name || 'Screen'
  })`;

  return WithGate;
}