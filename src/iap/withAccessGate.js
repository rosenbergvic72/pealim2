// src/iap/withAccessGate.js
import React, { useEffect, useMemo, useRef } from 'react';
import { useIap } from './IapProvider';

// Экраны, которые всегда бесплатны (1 и 2 упражнение, все локали)
export const FREE_ROUTES = new Set([
  'Exercise1', 'Exercise1En', 'Exercise1Fr', 'Exercise1Es', 'Exercise1Pt', 'Exercise1Ar', 'Exercise1Am',
  'Exercise2', 'Exercise2En', 'Exercise2Fr', 'Exercise2Es', 'Exercise2Pt', 'Exercise2Ar', 'Exercise2Am',
 
]);

function isFreeRoute(routeName) {
  return FREE_ROUTES.has(routeName);
}

/**
 * HOC: даёт доступ к экрану только если hasPro ИЛИ это бесплатный экран.
 * Также скрывает headerRight (кнопку чат-бота) для бесплатных пользователей.
 */
export function withAccessGate(ScreenComponent) {
  function WrappedScreen(props) {
    const { hasPro } = useIap();
    const { navigation, route } = props;

    const routeName = route?.name || '';
    const free = useMemo(() => isFreeRoute(routeName), [routeName]);

    // Флаг, что мы уже инициировали редирект (чтобы не вызвать дважды)
    const redirectedRef = useRef(false);

    // Если экран не бесплатный и нет PRO — уводим на Paywall
    useEffect(() => {
      if (!hasPro && !free && !redirectedRef.current) {
        redirectedRef.current = true;
        // переносим в следующий тик, чтобы избежать гонки с рендером
        const id = setTimeout(() => {
          // replace — чтобы нельзя было вернуться «назад» в защищённый экран
          navigation.replace('Paywall', { from: routeName });
        }, 0);
        return () => clearTimeout(id);
      }
    }, [hasPro, free, navigation, routeName]);

    // Скрываем кнопку ChatBot (headerRight) на free-пользователях
    useEffect(() => {
      if (!hasPro) {
        navigation.setOptions({ headerRight: () => null });
      }
    }, [hasPro, navigation]);

    // Если доступ запрещён — ничего не рисуем (редиректит эффект выше)
    if (!hasPro && !free) return null;

    // Можно передать в экран «isFreeUser» на всякий случай
    const isFreeUser = !hasPro;

    return <ScreenComponent {...props} isFreeUser={isFreeUser} />;
  }

  // Немного лучшее имя компонента в React DevTools
  WrappedScreen.displayName = `withAccessGate(${ScreenComponent.displayName || ScreenComponent.name || 'Screen'})`;

  return WrappedScreen;
}


