// debugAnimatedTiming.js
import { Animated } from 'react-native';

if (!global.__ANIMATED_TIMING_PATCHED__) {
  const originalTiming = Animated.timing;

  Animated.timing = (value, config) => {
    const label = (config && config._debugLabel) || 'no-label';

    const valueType =
      value && value.constructor ? value.constructor.name : typeof value;

    const extensible = Object.isExtensible(value);
    console.log(
      '[Animated.timing] create',
      label,
      'extensible =',
      extensible,
      'valueType =',
      valueType
    );

    const anim = originalTiming(value, config);

    const originalStart = anim.start;

    anim.start = (...args) => {
      const startExt = Object.isExtensible(value);
      console.log(
        '[Animated.timing] start',
        label,
        'extensible =',
        startExt,
        'valueType =',
        valueType
      );

      // 🔴 Вот тут ловим “подозрительные” случаи
      if (!startExt) {
        console.log(
          '[Animated.timing] NON-EXTENSIBLE VALUE STACK for',
          label,
          '\n',
          new Error().stack
        );
      }

      try {
        return originalStart.apply(anim, args);
      } catch (e) {
        console.error(
          '[Animated.timing] ERROR in start',
          label,
          e,
          '\nSTACK:\n',
          e?.stack
        );
        throw e;
      }
    };

    return anim;
  };

  global.__ANIMATED_TIMING_PATCHED__ = true;
}

export {};
