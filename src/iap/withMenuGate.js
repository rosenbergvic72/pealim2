// src/iap/withMenuGate.js
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { useIap } from './IapProvider';

const FREE_FLAG_KEY = 'freePreview'; // ставится Paywall'ом при нажатии на «Продолжить бесплатно»

export function withMenuGate(ScreenComponent, _featureKey) {
  return function WithGate(props) {
    const { hasPro } = useIap();
    const [freePreview, setFreePreview] = useState(null); // null = ещё читаем

    // читаем из params и из AsyncStorage ДО решения о редиректе
    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const fromParams = !!props?.route?.params?.freePreview;
          const stored = await AsyncStorage.getItem(FREE_FLAG_KEY);
          const fromStorage = stored === '1';
          const val = fromParams || fromStorage;
          if (mounted) setFreePreview(val);
        } catch {
          if (mounted) setFreePreview(false);
        }
      })();
      return () => { mounted = false; };
    }, [props?.route?.params?.freePreview]);

    // Если нет PRO и нет freePreview — отправляем на Paywall
    useEffect(() => {
      if (freePreview === null) return;
      if (!hasPro && !freePreview) {
        props.navigation.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'Paywall' }] })
        );
      }
    }, [hasPro, freePreview, props.navigation]);

    // Пока не знаем — не рендерим
    if (freePreview === null && !hasPro) return null;

    // Пробросим флаг в сам экран (меню может подсветить/заблокировать кнопки 3+)
    return <ScreenComponent {...props} freePreview={freePreview && !hasPro} />;
  };
}


