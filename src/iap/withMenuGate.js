// src/iap/withMenuGate.js
import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { useIap } from './IapProvider';

const FREE_FLAG_KEY = 'freePreview'; // ставится Paywall'ом при нажатии на «Продолжить бесплатно»

function paywallRouteName() {
  return Platform.OS === 'ios' ? 'PaywallIOS' : 'Paywall';
}

export function withMenuGate(ScreenComponent, _featureKey) {
  function WithGate(props) {
    const { hasPro } = useIap();
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

    // Если нет PRO и нет freePreview — отправляем на Paywall
    useEffect(() => {
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
    }, [hasPro, freePreview, props.navigation]);

    // Пока не знаем — не рендерим (чтобы не мигало меню)
    if (freePreview === null && !hasPro) return null;

    // Пробросим флаг в сам экран (меню может подсветить/заблокировать кнопки 3+)
    return <ScreenComponent {...props} freePreview={!!freePreview && !hasPro} />;
  }

  WithGate.displayName = `withMenuGate(${ScreenComponent.displayName || ScreenComponent.name || 'Screen'})`;

  return WithGate;
}