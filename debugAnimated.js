// debugAnimated.js
import { Animated } from 'react-native';

// Чтобы не патчить дважды при hot reload
if (!global.__ANIMATED_TIMING_PATCHED__) {
  global.__ANIMATED_TIMING_PATCHED__ = true;

  const originalTiming = Animated.timing;

  Animated.timing = (value, config = {}) => {
    // специальное поле, которое мы будем передавать из кода
    const label = config.__debugLabel || 'no-label';

    console.log(
      '[Animated.timing] create',
      label,
      'extensible =',
      Object.isExtensible(value)
    );

    const anim = originalTiming(value, config);
    const originalStart = anim.start;

    anim.start = (...args) => {
      console.log(
        '[Animated.timing] start',
        label,
        'extensible =',
        Object.isExtensible(value)
      );
      try {
        return originalStart.apply(anim, args);
      } catch (e) {
        console.error('[Animated.timing] ERROR in start', label, e);
        throw e;
      }
    };

    return anim;
  };
}
