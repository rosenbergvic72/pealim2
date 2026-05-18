// src/iap/withAccessGate.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const INTERNAL_TRIAL_KEY = 'verbify_internal_trial_v1';

function isFreeRoute(routeName) {
  return FREE_ROUTES.has(routeName);
}

function paywallRouteName() {
  return Platform.OS === 'ios' ? 'PaywallIOS' : 'Paywall';
}

async function getInternalTrialState() {
  try {
    const saved = await AsyncStorage.getItem(INTERNAL_TRIAL_KEY);
    if (!saved) {
      return {
        active: false,
        endsAt: null,
      };
    }

    const data = JSON.parse(saved);
    const endsAt = Number(data.endsAt || 0);
    const active = Date.now() < endsAt;

    return {
      active,
      endsAt,
    };
  } catch (e) {
    console.log('[withAccessGate][INTERNAL_TRIAL] error:', e);
    return {
      active: false,
      endsAt: null,
    };
  }
}

export function withAccessGate(ScreenComponent) {
  function WrappedScreen(props) {
    const { hasPro, accessState = 'checking' } = useIap();
    const { navigation, route } = props;

    const routeName = route?.name || '';
    const free = useMemo(() => isFreeRoute(routeName), [routeName]);

    const redirectedRef = useRef(false);

    const [trialChecking, setTrialChecking] = useState(true);
    const [internalTrialActive, setInternalTrialActive] = useState(false);
    const [internalTrialEndsAt, setInternalTrialEndsAt] = useState(null);

    useEffect(() => {
      let cancelled = false;

      const loadTrial = async () => {
        const trial = await getInternalTrialState();

        if (cancelled) return;

        setInternalTrialActive(trial.active);
        setInternalTrialEndsAt(trial.endsAt);
        setTrialChecking(false);

        console.log('[withAccessGate] trial =', trial);
      };

      loadTrial();

      return () => {
        cancelled = true;
      };
    }, [routeName]);

    const hasFullAccess = hasPro || internalTrialActive;

    useEffect(() => {
      if (accessState === 'checking') return;
      if (trialChecking) return;

      if (!hasFullAccess && !free && !redirectedRef.current) {
        redirectedRef.current = true;

        const id = setTimeout(() => {
          navigation.replace(paywallRouteName(), {
            from: routeName,
            internalTrialExpired: true,
          });
        }, 0);

        return () => clearTimeout(id);
      }

      if (hasFullAccess && redirectedRef.current) {
        redirectedRef.current = false;
      }
    }, [
      accessState,
      trialChecking,
      hasFullAccess,
      free,
      navigation,
      routeName,
    ]);

    useEffect(() => {
      if (accessState !== 'checking' && !trialChecking && !hasFullAccess) {
        navigation.setOptions({ headerRight: () => null });
      }
    }, [accessState, trialChecking, hasFullAccess, navigation]);

    if (free) {
      return (
        <ScreenComponent
          {...props}
          isFreeUser={!hasFullAccess}
          internalTrialActive={internalTrialActive}
          internalTrialEndsAt={internalTrialEndsAt}
        />
      );
    }

    if (accessState === 'checking' || trialChecking) {
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

    if (!hasFullAccess && !free) return null;

    return (
      <ScreenComponent
        {...props}
        isFreeUser={!hasFullAccess}
        internalTrialActive={internalTrialActive}
        internalTrialEndsAt={internalTrialEndsAt}
      />
    );
  }

  WrappedScreen.displayName = `withAccessGate(${
    ScreenComponent.displayName || ScreenComponent.name || 'Screen'
  })`;

  return WrappedScreen;
}