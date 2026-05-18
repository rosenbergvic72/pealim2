import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIap } from './IapProvider';

const FREE_FLAG_KEY = 'freePreview';
const INTERNAL_TRIAL_KEY = 'verbify_internal_trial_v1';

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
    console.log('[withMenuGate][INTERNAL_TRIAL] error:', e);

    return {
      active: false,
      endsAt: null,
    };
  }
}

export function withMenuGate(ScreenComponent, _featureKey) {
  function WithGate(props) {
    const { ready, hasPro, accessState = 'checking' } = useIap();

    const [freePreview, setFreePreview] = useState(null);
    const [trialChecking, setTrialChecking] = useState(true);
    const [internalTrialActive, setInternalTrialActive] = useState(false);
    const [internalTrialEndsAt, setInternalTrialEndsAt] = useState(null);

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

    useEffect(() => {
      let mounted = true;

      const loadTrial = async () => {
        const trial = await getInternalTrialState();

        if (!mounted) return;

        setInternalTrialActive(trial.active);
        setInternalTrialEndsAt(trial.endsAt);
        setTrialChecking(false);

        console.log('[withMenuGate] internalTrial =', trial);
      };

      loadTrial();

      return () => {
        mounted = false;
      };
    }, []);

    if (!ready || accessState === 'checking' || trialChecking) {
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

    const hasFullAccess = hasPro || internalTrialActive;

    return (
      <ScreenComponent
        {...props}
        hasPro={hasPro}
        hasFullAccess={hasFullAccess}
        freePreview={!!freePreview && !hasFullAccess}
        internalTrialActive={!hasPro && internalTrialActive}
        internalTrialEndsAt={internalTrialEndsAt}
      />
    );
  }

  WithGate.displayName = `withMenuGate(${
    ScreenComponent.displayName || ScreenComponent.name || 'Screen'
  })`;

  return WithGate;
}