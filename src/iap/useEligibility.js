// src/iap/useEligibility.js
import { useCallback, useEffect, useState } from 'react';
import { useIap } from './IapProvider';
import { isTrialActive } from '../paywall/trial';

export function useEligibility() {
  const { ready, hasPro } = useIap();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const check = useCallback(async () => {
    if (!ready) { setChecking(true); return; }
    const trial = await isTrialActive();
    setAllowed(hasPro || trial);
    setChecking(false);
  }, [ready, hasPro]);

  useEffect(() => { check(); }, [check]);

  return { ready, checking, allowed, recheck: check };
}
